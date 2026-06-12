package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.CustomerAcceptance;
import com.java.vinod.marketplace.service.entity.DeliverySubmission;
import com.java.vinod.marketplace.service.entity.DisputeCase;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.enums.MarketplaceVerticalCode;
import com.java.vinod.marketplace.service.repository.CustomerAcceptanceRepository;
import com.java.vinod.marketplace.service.repository.DeliverySubmissionRepository;
import com.java.vinod.marketplace.service.repository.DisputeCaseRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCategoryRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Coordinates marketplace listing, order, delivery, acceptance, and dispute state.
 */
@Service
public class MarketplaceService {
    private static final Logger log = LoggerFactory.getLogger(MarketplaceService.class);
    private static final String MARKETPLACE_VERTICAL = "MARKETPLACE";
    private static final List<String> PUBLIC_LISTING_STATUSES = List.of("ACTIVE", "PUBLISHED");
    private final ListingRepository listingRepository;
    private final MarketplaceCategoryRepository marketplaceCategoryRepository;
    private final OrderHeaderRepository orderHeaderRepository;
    private final DeliverySubmissionRepository deliverySubmissionRepository;
    private final CustomerAcceptanceRepository customerAcceptanceRepository;
    private final DisputeCaseRepository disputeCaseRepository;
    private final MarketplaceEventOutboxService marketplaceEventOutboxService;
    private final RestClient restClient;
    private final String authorizationProviderEligibilityUrl;
    private final String paymentInternalUrl;
    private final String internalServiceToken;

    /**
     * Creates the marketplace service with repositories and internal payment configuration.
     */
    public MarketplaceService(ListingRepository listingRepository,
                              MarketplaceCategoryRepository marketplaceCategoryRepository,
                              OrderHeaderRepository orderHeaderRepository,
                              DeliverySubmissionRepository deliverySubmissionRepository,
                              CustomerAcceptanceRepository customerAcceptanceRepository,
                              DisputeCaseRepository disputeCaseRepository,
                              MarketplaceEventOutboxService marketplaceEventOutboxService,
                              @Value("${app.services.authorization-provider-eligibility-url}") String authorizationProviderEligibilityUrl,
                              @Value("${app.services.payment-internal-url}") String paymentInternalUrl,
                              @Value("${app.internal.service-token}") String internalServiceToken) {
        this.listingRepository = listingRepository;
        this.marketplaceCategoryRepository = marketplaceCategoryRepository;
        this.orderHeaderRepository = orderHeaderRepository;
        this.deliverySubmissionRepository = deliverySubmissionRepository;
        this.customerAcceptanceRepository = customerAcceptanceRepository;
        this.disputeCaseRepository = disputeCaseRepository;
        this.marketplaceEventOutboxService = marketplaceEventOutboxService;
        this.restClient = RestClient.builder().build();
        this.authorizationProviderEligibilityUrl = authorizationProviderEligibilityUrl;
        this.paymentInternalUrl = paymentInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    /**
     * Lists all active customer-visible listings.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListings() {
        return activeListings(null);
    }

    /**
     * Lists active customer-visible listings using a supported sort mode.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListings(String sort) {
        return activeListings(sort, null);
    }

    /**
     * Lists active customer-visible listings using a supported sort mode and optional vertical filter.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListings(String sort, String verticalCode) {
        return activeListings(sort, verticalCode, null);
    }

    /**
     * Lists active customer-visible listings using a supported sort mode, optional vertical filter,
     * and optional shopper country filter.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListings(String sort, String verticalCode, String countryCode) {
        String normalizedVertical = normalizeBrowseVerticalCode(verticalCode);
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> listings = localizedListings(normalizedVertical, normalizedCountry);
        return sortListings(listings, sort).stream()
                .map(this::toListingResponse)
                .toList();
    }

    /**
     * Lists all active categories for home catalog discovery.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.CategoryResponse> activeCategories() {
        return marketplaceCategoryRepository.findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc().stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    /**
     * Lists active categories for a specific vertical when browsing vertically scoped commerce sections.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.CategoryResponse> activeCategories(String verticalCode) {
        return activeCategories(verticalCode, null);
    }

    /**
     * Lists active categories for a specific vertical and shopper country when browsing storefront sections.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.CategoryResponse> activeCategories(String verticalCode, String countryCode) {
        String normalizedVertical = normalizeBrowseVerticalCode(verticalCode);
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<MarketplaceCategory> categories = normalizedVertical == null
                ? categoriesByCountry(normalizedCountry)
                : categoriesByCountryAndVertical(normalizedVertical, normalizedCountry);
        return categories.stream()
                .map(this::toCategoryResponse)
                .toList();
    }

    /**
     * Lists the supported commerce verticals in display order for anonymous navigation.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.VerticalResponse> activeVerticals() {
        return Arrays.stream(MarketplaceVerticalCode.values())
                .sorted(Comparator.comparingInt(MarketplaceVerticalCode::ordinal))
                .map(MarketplaceVerticalCode::toResponse)
                .toList();
    }

    /**
     * Builds the home payload for the public catalog experience.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.HomeResponse home() {
        return home(null);
    }

    /**
     * Builds the home payload for the public catalog experience with an optional shopper country.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.HomeResponse home(String countryCode) {
        return new MarketplaceDtos.HomeResponse(activeVerticals(), activeCategories(null, countryCode), featuredListings(countryCode));
    }

    /**
     * Lists featured active or published listings for marketplace home page.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> featuredListings() {
        return featuredListings(null);
    }

    /**
     * Lists featured active or published listings for marketplace home page, optionally narrowed to a shopper country.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> featuredListings(String countryCode) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> listings = normalizedCountry == null
                ? listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(PUBLIC_LISTING_STATUSES)
                : listingRepository.findTop8ByListingStatusInAndFeaturedTrueAndProviderCountryCodeOrderByUpdatedAtDesc(PUBLIC_LISTING_STATUSES, normalizedCountry);
        if (listings.isEmpty() && normalizedCountry != null) {
            listings = listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(PUBLIC_LISTING_STATUSES);
        }
        return listings.stream()
                .map(this::toListingResponse)
                .toList();
    }

    /**
     * Lists active listings for a specific category code.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListingsByCategory(String categoryCode) {
        return activeListingsByCategory(categoryCode, null, null);
    }

    /**
     * Lists active listings for a specific category code with supported sorting.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListingsByCategory(String categoryCode, String sort) {
        return activeListingsByCategory(categoryCode, sort, null);
    }

    /**
     * Lists active listings for a specific category code and optional vertical filter.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListingsByCategory(String categoryCode, String sort, String verticalCode) {
        return activeListingsByCategory(categoryCode, sort, verticalCode, null);
    }

    /**
     * Lists active listings for a specific category code, optional vertical filter, and optional shopper country.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> activeListingsByCategory(String categoryCode, String sort, String verticalCode, String countryCode) {
        String normalized = categoryCode == null ? "" : categoryCode.trim().toUpperCase();
        if (normalized.isBlank()) {
            return List.of();
        }
        String normalizedVertical = normalizeBrowseVerticalCode(verticalCode);
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> listings = localizedCategoryListings(normalized, normalizedVertical, normalizedCountry);
        return sortListings(listings, sort).stream()
                .map(this::toListingResponse)
                .toList();
    }

    /**
     * Searches active listings by keyword with optional category filter.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> searchActiveListings(String query, String categoryCode) {
        return searchActiveListings(query, categoryCode, null, null);
    }

    /**
     * Searches active listings by keyword with optional category filter and supported sorting.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> searchActiveListings(String query, String categoryCode, String sort) {
        return searchActiveListings(query, categoryCode, sort, null);
    }

    /**
     * Searches active listings by keyword with optional category and vertical filters plus supported sorting.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> searchActiveListings(String query, String categoryCode, String sort, String verticalCode) {
        return searchActiveListings(query, categoryCode, sort, verticalCode, null);
    }

    /**
     * Searches active listings by keyword with optional category, vertical, and shopper country filters.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> searchActiveListings(String query, String categoryCode, String sort, String verticalCode, String countryCode) {
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isBlank()) {
            return List.of();
        }
        String normalizedCategory = categoryCode == null || categoryCode.trim().isBlank()
                ? null
                : categoryCode.trim().toUpperCase();
        String normalizedVertical = normalizeBrowseVerticalCode(verticalCode);
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> results = listingRepository.searchActiveListings(
                PUBLIC_LISTING_STATUSES,
                normalizedQuery,
                normalizedCategory,
                normalizedVertical,
                normalizedCountry,
                PageRequest.of(0, 24));
        if (results.isEmpty() && normalizedCountry != null) {
            results = listingRepository.searchActiveListings(
                    PUBLIC_LISTING_STATUSES,
                    normalizedQuery,
                    normalizedCategory,
                    normalizedVertical,
                    null,
                    PageRequest.of(0, 24));
        }
        return sortListings(results, sort).stream()
                .map(this::toListingResponse)
                .toList();
    }

    /**
     * Loads a listing by public id.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.ListingResponse listing(String listingPublicId) {
        return toListingResponse(findListing(listingPublicId));
    }

    /**
     * Returns public trust-oriented reviews for a listing so shoppers can inspect seller reputation
     * before purchasing without needing an authenticated session.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingReviewResponse> listingReviews(String listingPublicId) {
        Listing listing = findListing(listingPublicId);
        return demoReviewsFor(listing);
    }

    /**
     * Creates a provider listing owned by the authenticated user.
     */
    @Transactional
    public MarketplaceDtos.ListingResponse createListing(MarketplaceDtos.ListingRequest request, Jwt jwt) {
        ProviderAccountSummary provider = ensureOwnedMarketplaceProvider(request.providerAccountPublicId(), jwt);
        LocalDateTime now = LocalDateTime.now();
        Listing listing = new Listing();
        listing.setPublicId(UUID.randomUUID().toString());
        listing.setProviderAccountPublicId(request.providerAccountPublicId());
        listing.setCreatedByUserPublicId(userPublicId(jwt));
        applyListingRequest(listing, request);
        applyProviderDefaults(listing, provider, request);
        listing.setListingStatus(normalizeStatus(request.listingStatus(), "ACTIVE"));
        listing.setCreatedAt(now);
        listing.setUpdatedAt(now);
        Listing saved = listingRepository.save(listing);
        log.info("Marketplace listing created: listingPublicId={}, providerAccountPublicId={}, categoryCode={}, status={}",
                saved.getPublicId(), saved.getProviderAccountPublicId(), saved.getCategoryCode(), saved.getListingStatus());
        return toListingResponse(saved);
    }

    /**
     * Updates listing details when the authenticated user owns the listing.
     */
    @Transactional
    public MarketplaceDtos.ListingResponse updateListing(String listingPublicId, MarketplaceDtos.ListingRequest request, Jwt jwt) {
        Listing listing = findListing(listingPublicId);
        if (!listing.getProviderAccountPublicId().equals(request.providerAccountPublicId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider account cannot be changed for an existing listing");
        }
        ProviderAccountSummary provider = ensureOwnedMarketplaceProvider(listing.getProviderAccountPublicId(), jwt);
        if (!listing.getCreatedByUserPublicId().equals(userPublicId(jwt))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only listing owner can update listing");
        }
        applyListingRequest(listing, request);
        applyProviderDefaults(listing, provider, request);
        listing.setListingStatus(normalizeStatus(request.listingStatus(), listing.getListingStatus()));
        listing.setUpdatedAt(LocalDateTime.now());
        log.info("Marketplace listing updated: listingPublicId={}, providerAccountPublicId={}, categoryCode={}, status={}",
                listing.getPublicId(), listing.getProviderAccountPublicId(), listing.getCategoryCode(), listing.getListingStatus());
        return toListingResponse(listing);
    }

    /**
     * Lists all listings for a provider account.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> providerListings(String providerPublicId) {
        ensureMarketplaceProviderEligible(providerPublicId);
        return listingRepository.findTop24ByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId).stream()
                .map(this::toListingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> sellerListings(String providerPublicId, Jwt jwt) {
        ensureOwnedMarketplaceProvider(providerPublicId, jwt);
        String actorPublicId = userPublicId(jwt);
        return listingRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId).stream()
                .filter(listing -> actorPublicId.equals(listing.getCreatedByUserPublicId()))
                .map(this::toListingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketplaceDtos.ListingResponse sellerListing(String listingPublicId, Jwt jwt) {
        return toListingResponse(findOwnedListing(listingPublicId, jwt));
    }

    @Transactional
    public MarketplaceDtos.ListingResponse submitListingForModeration(String listingPublicId, Jwt jwt) {
        Listing listing = findOwnedListing(listingPublicId, jwt);
        listing.setListingStatus("PENDING_MODERATION");
        listing.setUpdatedAt(LocalDateTime.now());
        return toListingResponse(listing);
    }

    /**
     * Creates an order and asks payment-service to create the held payment order.
     */
    @Transactional
    public MarketplaceDtos.OrderResponse createOrder(MarketplaceDtos.OrderRequest request, Jwt jwt) {
        Listing listing = findListing(request.listingPublicId());
        if (!PUBLIC_LISTING_STATUSES.contains(listing.getListingStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing is not available for purchase");
        }
        String customerPublicId = userPublicId(jwt);
        if (listing.getCreatedByUserPublicId().equals(customerPublicId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider cannot purchase their own listing");
        }
        BigDecimal platformFee = listing.getPriceAmount().multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();
        OrderHeader order = new OrderHeader();
        order.setPublicId(UUID.randomUUID().toString());
        order.setListing(listing);
        order.setCustomerUserPublicId(customerPublicId);
        order.setProviderAccountPublicId(listing.getProviderAccountPublicId());
        order.setProviderOwnerUserPublicId(listing.getCreatedByUserPublicId());
        order.setProviderCountryCode(listing.getProviderCountryCode());
        order.setTransactionCurrencyCode(listing.getCurrencyCode());
        order.setItemAmount(listing.getPriceAmount());
        order.setPlatformFeeAmount(platformFee);
        order.setCustomerTotalAmount(listing.getPriceAmount());
        order.setProviderExpectedAmount(listing.getPriceAmount().subtract(platformFee));
        order.setOrderStatus("PURCHASED");
        order.setPaymentStatus("CAPTURED");
        order.setFulfillmentStatus("PENDING_DELIVERY");
        order.setPayoutStatus("ON_HOLD");
        order.setPurchasedAt(now);
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        listing.setListingStatus("RESERVED");
        listing.setUpdatedAt(now);
        OrderHeader saved = orderHeaderRepository.save(order);
        try {
            createPaymentOrder(saved);
        } catch (ResponseStatusException exception) {
            log.error("Marketplace order payment creation failed: orderPublicId={}, listingPublicId={}, customerPublicId={}, providerAccountPublicId={}, status={}, reason={}",
                    saved.getPublicId(), listing.getPublicId(), customerPublicId, listing.getProviderAccountPublicId(),
                    exception.getStatusCode().value(), exception.getReason());
            throw exception;
        }
        log.info("Marketplace order created: orderPublicId={}, listingPublicId={}, customerPublicId={}, providerAccountPublicId={}, payoutStatus={}",
                saved.getPublicId(), listing.getPublicId(), customerPublicId, listing.getProviderAccountPublicId(), saved.getPayoutStatus());
        return toOrderResponse(saved);
    }

    /**
     * Lists purchases for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.OrderResponse> purchases(Jwt jwt) {
        return orderHeaderRepository.findByCustomerUserPublicIdOrderByCreatedAtDesc(userPublicId(jwt)).stream()
                .map(this::toOrderResponse)
                .toList();
    }

    /**
     * Loads a purchase after confirming the authenticated user is the customer.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.OrderResponse purchase(String orderPublicId, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureCustomer(order, jwt);
        return toOrderResponse(order);
    }

    /**
     * Records provider delivery when the authenticated user owns the provider side of the order.
     */
    @Transactional
    public MarketplaceDtos.MessageResponse deliver(String orderPublicId, MarketplaceDtos.DeliveryRequest request, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureMarketplaceProviderEligible(order.getProviderAccountPublicId());
        if (!order.getProviderOwnerUserPublicId().equals(userPublicId(jwt))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only assigned provider can deliver order");
        }
        if (deliverySubmissionRepository.existsByOrder_Id(order.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Delivery already submitted");
        }
        LocalDateTime now = LocalDateTime.now();
        DeliverySubmission delivery = new DeliverySubmission();
        delivery.setOrder(order);
        delivery.setSubmittedByUserPublicId(userPublicId(jwt));
        delivery.setDeliveryMethod(request.deliveryMethod());
        delivery.setDeliveryReference(request.deliveryReference());
        delivery.setProviderNotes(request.providerNotes());
        delivery.setSubmittedAt(now);
        deliverySubmissionRepository.save(delivery);
        order.setFulfillmentStatus("DELIVERED");
        order.setProviderDeliveredAt(now);
        order.setUpdatedAt(now);
        log.info("Marketplace delivery submitted: orderPublicId={}, providerAccountPublicId={}, providerUserPublicId={}, deliveryMethod={}",
                order.getPublicId(), order.getProviderAccountPublicId(), userPublicId(jwt), request.deliveryMethod());
        return new MarketplaceDtos.MessageResponse("Delivery submitted");
    }

    /**
     * Accepts delivery and asks payment-service to release payout eligibility in mock mode.
     */
    @Transactional
    public MarketplaceDtos.MessageResponse accept(String orderPublicId, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureCustomer(order, jwt);
        if (disputeCaseRepository.existsByOrder_IdAndResolvedAtIsNull(order.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Active dispute prevents payout eligibility");
        }
        if (customerAcceptanceRepository.existsByOrder_Id(order.getId())) {
            return new MarketplaceDtos.MessageResponse("Delivery already accepted");
        }
        LocalDateTime now = LocalDateTime.now();
        CustomerAcceptance acceptance = new CustomerAcceptance();
        acceptance.setOrder(order);
        acceptance.setCustomerUserPublicId(userPublicId(jwt));
        acceptance.setAcceptanceStatus("ACCEPTED");
        acceptance.setConfirmedAt(now);
        acceptance.setCreatedAt(now);
        customerAcceptanceRepository.save(acceptance);
        order.setFulfillmentStatus("ACCEPTED");
        order.setPayoutStatus("ELIGIBLE_REQUESTED");
        order.setCustomerAcceptedAt(now);
        order.setCompletedAt(now);
        order.setUpdatedAt(now);
        order.getListing().setListingStatus("SOLD");
        order.getListing().setUpdatedAt(now);
        markPayoutEligible(order);
        log.info("Marketplace delivery accepted: orderPublicId={}, customerPublicId={}, payoutStatus={}",
                order.getPublicId(), userPublicId(jwt), order.getPayoutStatus());
        return new MarketplaceDtos.MessageResponse("Delivery accepted and payout eligibility requested");
    }

    /**
     * Opens a dispute placeholder and blocks payout eligibility for the order.
     */
    @Transactional
    public MarketplaceDtos.MessageResponse reportProblem(String orderPublicId, MarketplaceDtos.ProblemRequest request, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureCustomer(order, jwt);
        if (disputeCaseRepository.existsByOrder_IdAndResolvedAtIsNull(order.getId())) {
            return new MarketplaceDtos.MessageResponse("Problem already reported");
        }
        LocalDateTime now = LocalDateTime.now();
        DisputeCase dispute = new DisputeCase();
        dispute.setPublicId(UUID.randomUUID().toString());
        dispute.setOrder(order);
        dispute.setOpenedByUserPublicId(userPublicId(jwt));
        dispute.setDisputeReasonCode(request.disputeReasonCode());
        dispute.setDescription(request.description());
        dispute.setDisputeStatus("OPEN");
        dispute.setOpenedAt(now);
        disputeCaseRepository.save(dispute);
        order.setDisputeOpenedAt(now);
        order.setPayoutStatus("BLOCKED_BY_DISPUTE");
        order.setUpdatedAt(now);
        requestDispute(order, request);
        requestRefund(order, request);
        log.warn("Marketplace dispute opened: orderPublicId={}, customerPublicId={}, disputeReasonCode={}, payoutStatus={}",
                order.getPublicId(), userPublicId(jwt), request.disputeReasonCode(), order.getPayoutStatus());
        return new MarketplaceDtos.MessageResponse("Problem reported");
    }

    /**
     * Lists orders assigned to a provider account.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.OrderResponse> providerOrders(String providerPublicId) {
        ensureMarketplaceProviderEligible(providerPublicId);
        return orderHeaderRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId).stream()
                .map(this::toOrderResponse)
                .toList();
    }

    /**
     * Loads a provider order after confirming provider ownership.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.OrderResponse providerOrder(String orderPublicId, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureMarketplaceProviderEligible(order.getProviderAccountPublicId());
        if (!order.getProviderOwnerUserPublicId().equals(userPublicId(jwt))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only assigned provider can view order");
        }
        return toOrderResponse(order);
    }

    /**
     * Returns all orders for admin operations.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.OrderResponse> adminOrders() {
        return orderHeaderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toOrderResponse).toList();
    }

    /**
     * Returns dispute summaries for admin operations.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.AdminDisputeResponse> adminDisputes() {
        return disputeCaseRepository.findAllByOrderByOpenedAtDesc().stream()
                .map(this::toAdminDisputeResponse)
                .toList();
    }

    /**
     * Returns marketplace listings for admin review with optional filter criteria.
     *
     * <p>The admin view stays read-only here so support and moderation staff can
     * inspect listing health without changing the public browse contract.</p>
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.AdminListingResponse> adminListings(String status,
                                                                    String verticalCode,
                                                                    String sellerPublicId,
                                                                    String problemState) {
        String normalizedStatus = normalizeAdminFilter(status);
        String normalizedVertical = normalizeBrowseVerticalCode(verticalCode);
        String normalizedSeller = normalizeAdminFilter(sellerPublicId);
        String normalizedProblemState = normalizeAdminFilter(problemState);
        return listingRepository.findAll().stream()
                .filter(listing -> normalizedStatus == null || normalizedStatus.equals(listing.getListingStatus()))
                .filter(listing -> normalizedVertical == null || normalizedVertical.equals(listing.getVerticalCode()))
                .filter(listing -> normalizedSeller == null
                        || normalizedSeller.equals(listing.getCreatedByUserPublicId())
                        || normalizedSeller.equals(listing.getProviderAccountPublicId()))
                .filter(listing -> normalizedProblemState == null || matchesProblemState(listing, normalizedProblemState))
                .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
                .map(this::toAdminListingResponse)
                .toList();
    }

    /**
     * Updates a listing moderation status for admin review.
     *
     * <p>This keeps moderation separate from seller-owned edits while still
     * allowing support staff to approve, reject, or deactivate listings.</p>
     */
    @Transactional
    public MarketplaceDtos.AdminListingResponse moderateListing(String listingPublicId,
                                                                MarketplaceDtos.AdminListingDecisionRequest request,
                                                                Jwt jwt) {
        Listing listing = findListing(listingPublicId);
        listing.setListingStatus(normalizeModerationListingStatus(request.listingStatus()));
        listing.setUpdatedAt(LocalDateTime.now());
        log.info("Marketplace admin listing moderated: listingPublicId={}, status={}, actorPublicId={}, note={}",
                listing.getPublicId(), listing.getListingStatus(), userPublicId(jwt), safeModerationNote(request.moderationNote()));
        return toAdminListingResponse(listing);
    }

    /**
     * Returns a single dispute summary for admin review.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.AdminDisputeResponse adminDispute(String publicId) {
        return toAdminDisputeResponse(findDispute(publicId));
    }

    /**
     * Records an admin dispute resolution without changing payment payout rules.
     */
    @Transactional
    public MarketplaceDtos.AdminDisputeResponse moderateDispute(String publicId,
                                                                MarketplaceDtos.AdminDisputeDecisionRequest request,
                                                                Jwt jwt) {
        DisputeCase dispute = findDispute(publicId);
        dispute.setDisputeStatus(normalizeModerationDisputeStatus(request.resolution()));
        dispute.setResolution(request.resolution());
        dispute.setResolvedByUserPublicId(userPublicId(jwt));
        dispute.setResolvedAt(LocalDateTime.now());
        log.info("Marketplace admin dispute moderated: disputePublicId={}, status={}, actorPublicId={}, note={}",
                dispute.getPublicId(), dispute.getDisputeStatus(), userPublicId(jwt), safeModerationNote(request.moderationNote()));
        return toAdminDisputeResponse(dispute);
    }

    private void applyListingRequest(Listing listing, MarketplaceDtos.ListingRequest request) {
        listing.setTitle(request.title());
        listing.setDescription(request.description());
        listing.setCategoryCode(request.categoryCode());
        listing.setVerticalCode(normalizeVerticalCode(request.verticalCode()));
        listing.setProductType(request.productType());
        listing.setDeliveryType(request.deliveryType());
        listing.setFulfillmentScope(normalizeFulfillmentScope(request.fulfillmentScope()));
        listing.setProviderCountryCode(request.providerCountryCode());
        listing.setCurrencyCode(request.currencyCode());
        listing.setPriceAmount(request.priceAmount());
        listing.setImageUrl(request.imageUrl());
        listing.setStockQuantity(normalizeStockQuantity(request.stockQuantity()));
    }

    private void applyProviderDefaults(Listing listing, ProviderAccountSummary provider, MarketplaceDtos.ListingRequest request) {
        if (request.providerCountryCode() == null || request.providerCountryCode().isBlank()) {
            listing.setProviderCountryCode(provider.countryCode());
        }
        listing.setSellerDisplayName(provider.displayName());
        listing.setVerifiedSeller(isProviderVerified(provider));
    }

    private Listing findListing(String listingPublicId) {
        return listingRepository.findByPublicId(listingPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
    }

    private OrderHeader findOrder(String orderPublicId) {
        return orderHeaderRepository.findByPublicId(orderPublicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    private void ensureCustomer(OrderHeader order, Jwt jwt) {
        if (!order.getCustomerUserPublicId().equals(userPublicId(jwt))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only purchasing customer can access order");
        }
    }

    private String userPublicId(Jwt jwt) {
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }

    private String normalizeStatus(String requested, String fallback) {
        if (requested == null || requested.isBlank()) {
            return fallback;
        }
        return requested.trim().toUpperCase();
    }

    private String normalizeFulfillmentScope(String requested) {
        if (requested == null || requested.isBlank()) {
            return "NATIONAL";
        }
        String normalized = requested.trim().toUpperCase();
        return switch (normalized) {
            case "GLOBAL", "NATIONAL" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported fulfillment scope");
        };
    }

    private Integer normalizeStockQuantity(Integer requested) {
        if (requested == null || requested < 1) {
            return 1;
        }
        return requested;
    }

    private String normalizeVerticalCode(String requested) {
        if (requested == null || requested.isBlank()) {
            return MARKETPLACE_VERTICAL;
        }
        return requested.trim().toUpperCase();
    }

    private String normalizeBrowseVerticalCode(String requested) {
        if (requested == null || requested.isBlank()) {
            return null;
        }
        return requested.trim().toUpperCase();
    }

    private String normalizeCountryCode(String requested) {
        if (requested == null || requested.isBlank()) {
            return null;
        }
        String normalized = requested.trim().toUpperCase();
        return switch (normalized) {
            case "US", "USA" -> "USA";
            case "CA", "CAN" -> "CAN";
            case "GB", "UK", "GBR" -> "GBR";
            case "IN", "IND" -> "IND";
            case "AU", "AUS" -> "AUS";
            case "DE", "DEU" -> "DEU";
            case "FR", "FRA" -> "FRA";
            case "ES", "ESP" -> "ESP";
            case "MX", "MEX" -> "MEX";
            case "JP", "JPN" -> "JPN";
            case "KR", "KOR" -> "KOR";
            case "AE", "ARE" -> "ARE";
            default -> normalized;
        };
    }

    private String normalizeAdminFilter(String requested) {
        if (requested == null) {
            return null;
        }
        String normalized = requested.trim();
        return normalized.isBlank() ? null : normalized.toUpperCase();
    }

    private String normalizeModerationListingStatus(String requested) {
        String normalized = normalizeAdminFilter(requested);
        if (normalized == null) {
            return "INACTIVE";
        }
        return switch (normalized) {
            case "ACTIVE", "INACTIVE", "REJECTED", "SUSPENDED" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported listing moderation status");
        };
    }

    private String normalizeModerationDisputeStatus(String requested) {
        String normalized = normalizeAdminFilter(requested);
        if (normalized == null) {
            return "RESOLVED";
        }
        return switch (normalized) {
            case "OPEN", "IN_REVIEW", "RESOLVED", "REJECTED", "CLOSED" -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported dispute moderation status");
        };
    }

    private boolean matchesProblemState(Listing listing, String problemState) {
        boolean hasOpenDispute = orderHeaderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(order -> order.getListing().getPublicId().equals(listing.getPublicId()))
                .anyMatch(order -> disputeCaseRepository.existsByOrder_IdAndResolvedAtIsNull(order.getId()));
        return switch (problemState) {
            case "OPEN", "PROBLEM", "RISK" -> hasOpenDispute;
            case "CLEAR", "NONE", "CLEAN" -> !hasOpenDispute;
            default -> true;
        };
    }

    private DisputeCase findDispute(String publicId) {
        return disputeCaseRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
    }

    private String safeModerationNote(String note) {
        if (note == null || note.isBlank()) {
            return "n/a";
        }
        return note.length() > 120 ? note.substring(0, 120) + "..." : note;
    }

    private MarketplaceDtos.ListingResponse toListingResponse(Listing listing) {
        return new MarketplaceDtos.ListingResponse(listing.getPublicId(), safeListingTitle(listing), listing.getDescription(),
                listing.getProductType(), listing.getDeliveryType(), normalizeFulfillmentScope(listing.getFulfillmentScope()), listing.getCurrencyCode(), listing.getPriceAmount(),
                listing.getOriginalPriceAmount(), listing.getImageUrl(), safeSellerDisplayName(listing),
                listing.isVerifiedSeller(), listing.getCategoryCode(), listing.getVerticalCode(), safeCountryCode(listing), listing.getListingStatus(),
                listing.getConditionLabel(), listing.getStockQuantity(), listing.getSourceType(), listing.getSourceName(),
                listing.getSourceUrl(), listing.getLicenseNote(), listing.isDemoSeed(), demoReviewsFor(listing),
                listing.getCreatedAt());
    }

    private Listing findOwnedListing(String listingPublicId, Jwt jwt) {
        Listing listing = findListing(listingPublicId);
        ensureOwnedMarketplaceProvider(listing.getProviderAccountPublicId(), jwt);
        if (!userPublicId(jwt).equals(listing.getCreatedByUserPublicId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only listing owner can access seller listing tools");
        }
        return listing;
    }

    private ProviderAccountSummary ensureOwnedMarketplaceProvider(String providerPublicId, Jwt jwt) {
        ProviderAccountSummary provider = fetchProviderAccountSummary(providerPublicId);
        if (!userPublicId(jwt).equals(provider.ownerUserPublicId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider account does not belong to authenticated user");
        }
        ensureMarketplaceProviderEligible(providerPublicId);
        return provider;
    }

    private ProviderAccountSummary fetchProviderAccountSummary(String providerPublicId) {
        try {
            ProviderAccountSummary response = restClient.get()
                    .uri(authorizationProviderEligibilityUrl + "/providers/" + providerPublicId)
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(ProviderAccountSummary.class);
            if (response == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Provider account lookup returned no data");
            }
            return response;
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify provider ownership right now", exception);
        }
    }

    private boolean isProviderVerified(ProviderAccountSummary provider) {
        return "APPROVED".equalsIgnoreCase(provider.overallStatus())
                || "APPROVED".equalsIgnoreCase(provider.verificationStatus());
    }

    private String safeListingTitle(Listing listing) {
        if (listing.getTitle() != null && !listing.getTitle().isBlank()) {
            return listing.getTitle().trim();
        }
        return "Marketplace Listing";
    }

    private String safeSellerDisplayName(Listing listing) {
        if (listing.getSellerDisplayName() != null && !listing.getSellerDisplayName().isBlank()) {
            return listing.getSellerDisplayName().trim();
        }
        if (listing.getSourceName() != null && !listing.getSourceName().isBlank()) {
            return listing.getSourceName().trim();
        }
        if (listing.getProviderAccountPublicId() != null && !listing.getProviderAccountPublicId().isBlank()) {
            return "Seller " + listing.getProviderAccountPublicId().substring(0, Math.min(8, listing.getProviderAccountPublicId().length()));
        }
        return "Sharity Seller";
    }

    private String safeCountryCode(Listing listing) {
        return listing.getProviderCountryCode() == null ? "" : listing.getProviderCountryCode();
    }

    private List<Listing> localizedListings(String verticalCode, String countryCode) {
        List<Listing> listings = verticalCode == null
                ? (countryCode == null
                ? listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES)
                : listingRepository.findTop24ByListingStatusInAndProviderCountryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, countryCode))
                : (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode)
                : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode, countryCode));
        if (listings.isEmpty() && countryCode != null) {
            return verticalCode == null
                    ? listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES)
                    : listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode);
        }
        return listings;
    }

    private List<Listing> localizedCategoryListings(String categoryCode, String verticalCode, String countryCode) {
        List<Listing> listings = verticalCode == null
                ? (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, categoryCode)
                : listingRepository.findTop24ByListingStatusInAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, categoryCode, countryCode))
                : (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode, categoryCode)
                : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode, categoryCode, countryCode));
        if (listings.isEmpty() && countryCode != null) {
            return verticalCode == null
                    ? listingRepository.findTop24ByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, categoryCode)
                    : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(PUBLIC_LISTING_STATUSES, verticalCode, categoryCode);
        }
        return listings;
    }

    private List<Listing> sortListings(List<Listing> listings, String sort) {
        String normalizedSort = sort == null ? "" : sort.trim().toUpperCase();
        if (normalizedSort.isBlank() || "FEATURED".equals(normalizedSort)) {
            return listings;
        }
        return switch (normalizedSort) {
            case "PRICE_ASC" -> listings.stream()
                    .sorted((left, right) -> left.getPriceAmount().compareTo(right.getPriceAmount()))
                    .toList();
            case "PRICE_DESC" -> listings.stream()
                    .sorted((left, right) -> right.getPriceAmount().compareTo(left.getPriceAmount()))
                    .toList();
            case "NEWEST", "RECENT" -> listings.stream()
                    .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                    .toList();
            default -> listings;
        };
    }

    private MarketplaceDtos.CategoryResponse toCategoryResponse(MarketplaceCategory category) {
        return new MarketplaceDtos.CategoryResponse(category.getId(), category.getCategoryCode(), category.getCategoryName(),
                category.getCategorySlug(), category.getVerticalCode(), category.getCountryCode(), category.getIconRef(), category.isActive());
    }

    private List<MarketplaceCategory> categoriesByCountry(String countryCode) {
        if (countryCode == null) {
            return marketplaceCategoryRepository.findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc();
        }
        List<MarketplaceCategory> globalCategories =
                marketplaceCategoryRepository.findByActiveTrueAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc();
        List<MarketplaceCategory> countryCategories =
                marketplaceCategoryRepository.findByActiveTrueAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(countryCode);
        return mergeCategories(globalCategories, countryCategories);
    }

    private List<MarketplaceCategory> categoriesByCountryAndVertical(String verticalCode, String countryCode) {
        if (countryCode == null) {
            return marketplaceCategoryRepository.findByActiveTrueAndVerticalCodeOrderByDisplayOrderAscCategoryNameAsc(verticalCode);
        }
        List<MarketplaceCategory> globalCategories =
                marketplaceCategoryRepository.findByActiveTrueAndVerticalCodeAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc(verticalCode);
        List<MarketplaceCategory> countryCategories =
                marketplaceCategoryRepository.findByActiveTrueAndVerticalCodeAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(verticalCode, countryCode);
        return mergeCategories(globalCategories, countryCategories);
    }

    private List<MarketplaceCategory> mergeCategories(List<MarketplaceCategory> left, List<MarketplaceCategory> right) {
        List<MarketplaceCategory> merged = new java.util.ArrayList<>(left);
        for (MarketplaceCategory candidate : right) {
            boolean exists = merged.stream()
                    .anyMatch(category -> category.getCategoryCode().equalsIgnoreCase(candidate.getCategoryCode()));
            if (!exists) {
                merged.add(candidate);
            }
        }
        merged.sort(Comparator.comparingInt(MarketplaceCategory::getDisplayOrder)
                .thenComparing(MarketplaceCategory::getCategoryName, String.CASE_INSENSITIVE_ORDER));
        return merged;
    }

    private MarketplaceDtos.OrderResponse toOrderResponse(OrderHeader order) {
        return new MarketplaceDtos.OrderResponse(order.getPublicId(), order.getListing().getPublicId(), order.getOrderStatus(),
                order.getPaymentStatus(), order.getFulfillmentStatus(), order.getPayoutStatus(),
                order.getCustomerTotalAmount(), order.getTransactionCurrencyCode(), order.getCreatedAt());
    }

    private MarketplaceDtos.AdminListingResponse toAdminListingResponse(Listing listing) {
        return new MarketplaceDtos.AdminListingResponse(listing.getPublicId(), listing.getTitle(),
                listing.getProviderAccountPublicId(), listing.getCreatedByUserPublicId(), listing.getSellerDisplayName(),
                listing.getCategoryCode(), listing.getVerticalCode(), listing.getListingStatus(),
                listing.isVerifiedSeller(), listing.isFeatured(), matchesProblemState(listing, "OPEN"),
                listing.getCreatedAt(), listing.getUpdatedAt());
    }

    private MarketplaceDtos.AdminDisputeResponse toAdminDisputeResponse(DisputeCase dispute) {
        return new MarketplaceDtos.AdminDisputeResponse(dispute.getPublicId(), dispute.getOrder().getPublicId(),
                dispute.getOrder().getListing().getPublicId(), dispute.getOpenedByUserPublicId(),
                dispute.getDisputeReasonCode(), dispute.getDisputeStatus(), dispute.getResolution(),
                dispute.getResolvedByUserPublicId(), dispute.getOpenedAt(), dispute.getResolvedAt());
    }

    private List<MarketplaceDtos.ListingReviewResponse> demoReviewsFor(Listing listing) {
        String category = listing.getCategoryCode() == null ? "" : listing.getCategoryCode().toUpperCase();
        String seller = listing.getSellerDisplayName() == null || listing.getSellerDisplayName().isBlank()
                ? "Sharity Seller"
                : listing.getSellerDisplayName();
        LocalDateTime now = LocalDateTime.now();
        return switch (category) {
            case "GIFT_CARDS" -> List.of(
                    review(listing, seller + " shopper", "Fast redemption", "Redeemed quickly and the seller kept the process clear.", 5.0, true, now.minusDays(2)),
                    review(listing, seller + " customer", "Good value", "Exactly as described and delivery was instant.", 4.8, true, now.minusDays(5))
            );
            case "GROCERY" -> List.of(
                    review(listing, seller + " buyer", "Fresh and packed well", "Items arrived neatly packed and matched the listing.", 4.7, true, now.minusDays(1)),
                    review(listing, seller + " repeat buyer", "Reliable seller", "Repeat purchase and the seller keeps stock updated.", 4.6, true, now.minusDays(6))
            );
            case "MEAT_SHOP" -> List.of(
                    review(listing, seller + " customer", "Quality matched photos", "Packaging was secure and the cuts were as listed.", 4.8, true, now.minusDays(3)),
                    review(listing, seller + " pickup buyer", "Easy pickup", "Pickup instructions were simple and on time.", 4.6, true, now.minusDays(8))
            );
            case "PHARMACY" -> List.of(
                    review(listing, seller + " buyer", "Helpful wellness pack", "Delivery was discreet and the item details were clear.", 4.7, true, now.minusDays(2)),
                    review(listing, seller + " shopper", "As described", "The OTC listing matched the photos and the seller responded quickly.", 4.5, true, now.minusDays(7))
            );
            case "AUTOMOTIVE" -> List.of(
                    review(listing, seller + " driver", "Useful accessory", "The part fit well and the seller provided a clean description.", 4.8, true, now.minusDays(4)),
                    review(listing, seller + " buyer", "Fast shipping", "Arrived sooner than expected and was packaged well.", 4.7, true, now.minusDays(9))
            );
            default -> List.of(
                    review(listing, seller + " buyer", "As described", "The listing matched the photos and description.", 4.8, listing.isVerifiedSeller(), now.minusDays(2)),
                    review(listing, seller + " customer", "Trusted seller", "Communication was clear and the deal felt safe.", 4.7, listing.isVerifiedSeller(), now.minusDays(7))
            );
        };
    }

    private MarketplaceDtos.ListingReviewResponse review(Listing listing, String reviewerDisplayName, String title,
                                                          String body, double rating, boolean verifiedPurchase,
                                                          LocalDateTime createdAt) {
        String seed = listing.getPublicId() + "|" + reviewerDisplayName + "|" + title;
        String reviewId = UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8)).toString();
        return new MarketplaceDtos.ListingReviewResponse(reviewId, listing.getPublicId(), reviewerDisplayName, title,
                body, rating, verifiedPurchase, createdAt);
    }

    private void createPaymentOrder(OrderHeader order) {
        marketplaceEventOutboxService.queuePaymentOrderCreate(order);
    }

    private void markPayoutEligible(OrderHeader order) {
        marketplaceEventOutboxService.queueMarkPayoutEligible(order);
    }

    private void requestRefund(OrderHeader order, MarketplaceDtos.ProblemRequest request) {
        marketplaceEventOutboxService.queueRefundRequest(order, request.disputeReasonCode());
    }

    /**
     * Marks the payment order as disputed before the refund request completes so payment state remains aligned.
     */
    private void requestDispute(OrderHeader order, MarketplaceDtos.ProblemRequest request) {
        String reason = request.disputeReasonCode()
                + (request.description() == null || request.description().isBlank() ? "" : ": " + request.description());
        marketplaceEventOutboxService.queueDisputeRequest(order, reason);
    }

    private void syncPaymentState(OrderHeader order) {
        PaymentOrderState state;
        try {
            state = restClient.get()
                    .uri(paymentInternalUrl + "/payments/orders/" + order.getPublicId())
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(PaymentOrderState.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to refresh payment state right now", exception);
        }
        if (state == null) {
            return;
        }
        if (state.paymentStatus() != null && !state.paymentStatus().isBlank()) {
            order.setPaymentStatus(state.paymentStatus());
        }
        if (state.payoutEligibilityStatus() != null && !state.payoutEligibilityStatus().isBlank()) {
            order.setPayoutStatus(state.payoutEligibilityStatus());
        }
        order.setUpdatedAt(LocalDateTime.now());
    }

    private void ensureMarketplaceProviderEligible(String providerPublicId) {
        ProviderEligibilityResponse response;
        try {
            response = restClient.get()
                    .uri(authorizationProviderEligibilityUrl + "/providers/" + providerPublicId + "/modules/MARKETPLACE/eligibility")
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(ProviderEligibilityResponse.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify provider eligibility right now", exception);
        }
        if (response == null || !response.eligible()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider is not eligible for MARKETPLACE");
        }
    }

    private record PaymentOrderRequest(String marketplaceOrderPublicId, BigDecimal amount, String currencyCode,
                                       String providerAccountPublicId, String customerUserPublicId) {
    }

    private record RefundRequest(String reason) {
    }

    /**
     * Carries dispute context into the payment-service lifecycle endpoint.
     */
    private record PaymentLifecycleRequest(String reason) {
    }

    private record PaymentOrderState(String publicId, String marketplaceOrderPublicId, String paymentStatus,
                                     String payoutEligibilityStatus, BigDecimal customerChargeAmount,
                                     BigDecimal platformFeeAmount, BigDecimal providerPayableAmount, LocalDateTime createdAt) {
    }

    private record ProviderEligibilityResponse(boolean eligible, String providerPublicId, String moduleCode,
                                               String providerStatus, String enrollmentStatus, boolean sellingEnabled,
                                               boolean payoutEligible, boolean restricted) {
    }

    private record ProviderAccountSummary(String publicId, String ownerUserPublicId, String displayName,
                                          String sellerScope, String countryCode, String defaultCurrencyCode,
                                          String verificationStatus, String overallStatus,
                                          boolean payoutsEnabled, boolean chargesEnabled) {
    }
}
