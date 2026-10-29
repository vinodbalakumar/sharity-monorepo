package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.CustomerAcceptance;
import com.java.vinod.marketplace.service.entity.AssetStorageProvider;
import com.java.vinod.marketplace.service.entity.DeliverySubmission;
import com.java.vinod.marketplace.service.entity.DisputeCase;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.ListingStatusMaster;
import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import com.java.vinod.marketplace.service.entity.MarketplaceVertical;
import com.java.vinod.marketplace.service.entity.SellerProfile;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.DeliveryTypeMasterRepository;
import com.java.vinod.marketplace.service.repository.CustomerAcceptanceRepository;
import com.java.vinod.marketplace.service.repository.DeliverySubmissionRepository;
import com.java.vinod.marketplace.service.repository.DisputeCaseRepository;
import com.java.vinod.marketplace.service.repository.AssetStorageProviderRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.ListingStatusMasterRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCategoryRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceVerticalRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import com.java.vinod.marketplace.service.repository.ProductTypeMasterRepository;
import com.java.vinod.marketplace.service.repository.SellerProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Comparator;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Coordinates marketplace listing, order, delivery, acceptance, and dispute state.
 */
@Service
public class MarketplaceService {
    @Value("${app.commerce.demo-purchases-enabled:false}")
    private boolean demoPurchasesEnabled;
    private static final Logger log = LoggerFactory.getLogger(MarketplaceService.class);
    private final ListingRepository listingRepository;
    private final ListingStatusMasterRepository listingStatusMasterRepository;
    private final MarketplaceCategoryRepository marketplaceCategoryRepository;
    private final MarketplaceVerticalRepository marketplaceVerticalRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final ProductTypeMasterRepository productTypeMasterRepository;
    private final DeliveryTypeMasterRepository deliveryTypeMasterRepository;
    private final OrderHeaderRepository orderHeaderRepository;
    private final DeliverySubmissionRepository deliverySubmissionRepository;
    private final CustomerAcceptanceRepository customerAcceptanceRepository;
    private final DisputeCaseRepository disputeCaseRepository;
    private final AssetStorageProviderRepository assetStorageProviderRepository;
    private final MarketplaceEventOutboxService marketplaceEventOutboxService;
    private final MarketplaceCurrencyService marketplaceCurrencyService;
    private final RestClient restClient;
    private final String authorizationProviderEligibilityUrl;
    private final String paymentInternalUrl;
    private final String internalServiceToken;
    private volatile String cachedAssetPublicBaseUrl;
    private volatile List<String> cachedPublicListingStatuses;
    private volatile List<String> cachedHomeListingStatuses;

    /**
     * Creates the marketplace service with repositories and internal payment configuration.
     */
    @Autowired
    public MarketplaceService(ListingRepository listingRepository,
                              ListingStatusMasterRepository listingStatusMasterRepository,
                              MarketplaceCategoryRepository marketplaceCategoryRepository,
                              MarketplaceVerticalRepository marketplaceVerticalRepository,
                              SellerProfileRepository sellerProfileRepository,
                              ProductTypeMasterRepository productTypeMasterRepository,
                              DeliveryTypeMasterRepository deliveryTypeMasterRepository,
                              OrderHeaderRepository orderHeaderRepository,
                              DeliverySubmissionRepository deliverySubmissionRepository,
                              CustomerAcceptanceRepository customerAcceptanceRepository,
                              DisputeCaseRepository disputeCaseRepository,
                              AssetStorageProviderRepository assetStorageProviderRepository,
                              MarketplaceEventOutboxService marketplaceEventOutboxService,
                              MarketplaceCurrencyService marketplaceCurrencyService,
                              @Value("${app.services.authorization-provider-eligibility-url}") String authorizationProviderEligibilityUrl,
                              @Value("${app.services.payment-internal-url}") String paymentInternalUrl,
                              @Value("${app.internal.service-token}") String internalServiceToken) {
        this.listingRepository = listingRepository;
        this.listingStatusMasterRepository = listingStatusMasterRepository;
        this.marketplaceCategoryRepository = marketplaceCategoryRepository;
        this.marketplaceVerticalRepository = marketplaceVerticalRepository;
        this.sellerProfileRepository = sellerProfileRepository;
        this.productTypeMasterRepository = productTypeMasterRepository;
        this.deliveryTypeMasterRepository = deliveryTypeMasterRepository;
        this.orderHeaderRepository = orderHeaderRepository;
        this.deliverySubmissionRepository = deliverySubmissionRepository;
        this.customerAcceptanceRepository = customerAcceptanceRepository;
        this.disputeCaseRepository = disputeCaseRepository;
        this.assetStorageProviderRepository = assetStorageProviderRepository;
        this.marketplaceEventOutboxService = marketplaceEventOutboxService;
        this.marketplaceCurrencyService = marketplaceCurrencyService;
        this.restClient = RestClient.builder().build();
        this.authorizationProviderEligibilityUrl = authorizationProviderEligibilityUrl;
        this.paymentInternalUrl = paymentInternalUrl;
        this.internalServiceToken = internalServiceToken;
    }

    public MarketplaceService(ListingRepository listingRepository,
                              ListingStatusMasterRepository listingStatusMasterRepository,
                              MarketplaceCategoryRepository marketplaceCategoryRepository,
                              MarketplaceVerticalRepository marketplaceVerticalRepository,
                              SellerProfileRepository sellerProfileRepository,
                              ProductTypeMasterRepository productTypeMasterRepository,
                              DeliveryTypeMasterRepository deliveryTypeMasterRepository,
                              OrderHeaderRepository orderHeaderRepository,
                              DeliverySubmissionRepository deliverySubmissionRepository,
                              CustomerAcceptanceRepository customerAcceptanceRepository,
                              DisputeCaseRepository disputeCaseRepository,
                              MarketplaceEventOutboxService marketplaceEventOutboxService,
                              MarketplaceCurrencyService marketplaceCurrencyService,
                              String authorizationProviderEligibilityUrl,
                              String paymentInternalUrl,
                              String internalServiceToken) {
        this(listingRepository, listingStatusMasterRepository, marketplaceCategoryRepository, marketplaceVerticalRepository,
                sellerProfileRepository, productTypeMasterRepository, deliveryTypeMasterRepository, orderHeaderRepository, deliverySubmissionRepository,
                customerAcceptanceRepository, disputeCaseRepository, null, marketplaceEventOutboxService, marketplaceCurrencyService,
                authorizationProviderEligibilityUrl, paymentInternalUrl, internalServiceToken);
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
        return toListingResponses(sortListings(listings, sort), normalizedCountry);
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
        return marketplaceVerticalRepository.findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc("ACTIVE")
                .stream()
                .map(this::toVerticalResponse)
                .toList();
    }

    /**
     * Returns the primary marketplace vertical code from the database.
     */
    @Transactional(readOnly = true)
    public String defaultVerticalCode() {
        return marketplaceVerticalRepository.findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc("ACTIVE")
                .stream()
                .findFirst()
                .map(MarketplaceVertical::getModuleCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Marketplace verticals are not configured"));
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
     * Includes verticals, categories, featured listings, category highlights, discounted subcategories, and top sellers.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.HomeResponse home(String countryCode) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<String> publicStatuses = publicListingStatuses();
        List<String> homeStatuses = homeListingStatuses(publicStatuses);
        return new MarketplaceDtos.HomeResponse(
                timedHomeSection("verticals", this::activeVerticals),
                timedHomeSection("featuredListings", () -> featuredListings(normalizedCountry, homeStatuses)),
                timedHomeSection("categoryHighlights", () -> toCategoryHighlights(normalizedCountry, publicStatuses)),
                timedHomeSection("topDiscountedSubcategories", () -> topDiscountedSubcategories(normalizedCountry, publicStatuses)),
                timedHomeSection("rollbackOffers", () -> rollbackOfferListings(normalizedCountry, homeStatuses)),
                timedHomeSection("clearanceOffers", () -> clearanceListings(normalizedCountry, homeStatuses)),
                timedHomeSection("topRatedSellers", () -> topRatedSellers(normalizedCountry, homeStatuses)),
                timedHomeSection("mostSelectedListings", () -> mostSelectedListings(normalizedCountry, homeStatuses)),
                timedHomeSection("itemsSoldCount", () -> itemsSoldCount(normalizedCountry)));
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
        return featuredListings(countryCode, homeListingStatuses());
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> featuredListings(String countryCode, List<String> statuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> listings = normalizedCountry == null
                ? listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(statuses)
                : listingRepository.findTop8ByListingStatusInAndFeaturedTrueAndProviderCountryCodeOrderByUpdatedAtDesc(statuses, normalizedCountry);
        if (listings.isEmpty() && normalizedCountry != null) {
            listings = listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(statuses);
        }
        return toListingResponses(listings, normalizedCountry);
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
        return toListingResponses(sortListings(listings, sort), normalizedCountry);
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
        List<String> publicStatuses = publicListingStatuses();
        List<Listing> results = listingRepository.searchActiveListings(
                publicStatuses,
                normalizedQuery,
                normalizedCategory,
                normalizedVertical,
                normalizedCountry,
                PageRequest.of(0, 24));
        if (results.isEmpty() && normalizedCountry != null) {
            results = listingRepository.searchActiveListings(
                    publicStatuses,
                    normalizedQuery,
                    normalizedCategory,
                    normalizedVertical,
                    null,
                    PageRequest.of(0, 24));
        }
        return toListingResponses(sortListings(results, sort), normalizedCountry);
    }

    /**
     * Loads a listing by public id.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.ListingResponse listing(String listingPublicId) {
        return toListingResponse(findPublicListing(listingPublicId), null);
    }

    /**
     * Loads a listing by public id and applies shopper-country aware display pricing.
     */
    @Transactional(readOnly = true)
    public MarketplaceDtos.ListingResponse listing(String listingPublicId, String countryCode) {
        return toListingResponse(findPublicListing(listingPublicId), normalizeCountryCode(countryCode));
    }

    /**
     * Returns public trust-oriented reviews for a listing so shoppers can inspect seller reputation
     * before purchasing without needing an authenticated session.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingReviewResponse> listingReviews(String listingPublicId) {
        findListing(listingPublicId);
        return List.of();
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
        listing.setListingStatus(normalizeStatus(request.listingStatus(), defaultListingStatusCode()));
        listing.setCreatedAt(now);
        listing.setUpdatedAt(now);
        Listing saved = listingRepository.save(listing);
        log.info("Marketplace listing created: listingPublicId={}, providerAccountPublicId={}, categoryCode={}, status={}",
                saved.getPublicId(), saved.getProviderAccountPublicId(), saved.getCategoryCode(), saved.getListingStatus());
        return toListingResponse(saved, null);
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
        return toListingResponse(listing, null);
    }

    /**
     * Lists all listings for a provider account.
     */
    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> providerListings(String providerPublicId) {
        ensureMarketplaceProviderEligible(providerPublicId);
        return toListingResponses(listingRepository.findTop24ByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId), null);
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingResponse> sellerListings(String providerPublicId, Jwt jwt) {
        ensureOwnedMarketplaceProvider(providerPublicId, jwt);
        String actorPublicId = userPublicId(jwt);
        return listingRepository.findByProviderAccountPublicIdOrderByCreatedAtDesc(providerPublicId).stream()
                .filter(listing -> actorPublicId.equals(listing.getCreatedByUserPublicId()))
                .map(listing -> toListingResponse(listing, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public MarketplaceDtos.ListingResponse sellerListing(String listingPublicId, Jwt jwt) {
        return toListingResponse(findOwnedListing(listingPublicId, jwt), null);
    }

    @Transactional
    public MarketplaceDtos.ListingResponse submitListingForModeration(String listingPublicId, Jwt jwt) {
        Listing listing = findOwnedListing(listingPublicId, jwt);
        listing.setListingStatus("PENDING_MODERATION");
        listing.setUpdatedAt(LocalDateTime.now());
        return toListingResponse(listing, null);
    }

    /**
     * Creates an order and asks payment-service to create the held payment order.
     */
    @Transactional
    public MarketplaceDtos.OrderResponse createOrder(MarketplaceDtos.OrderRequest request, Jwt jwt) {
        return createOrder(request, jwt, null);
    }

    @Transactional
    public MarketplaceDtos.OrderResponse createOrder(MarketplaceDtos.OrderRequest request, Jwt jwt, String requestKey) {
        if (requestKey != null && !requestKey.matches("[A-Za-z0-9_-]{16,64}")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid purchase reference");
        String scopedKey = requestKey == null ? null : userPublicId(jwt) + ":" + requestKey;
        Listing listing = listingRepository.findForPurchase(request.listingPublicId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (scopedKey != null) {
            var previous = orderHeaderRepository.findByPurchaseRequestKey(scopedKey);
            if (previous.isPresent()) {
                if (!previous.get().getListing().getPublicId().equals(request.listingPublicId())) throw new ResponseStatusException(HttpStatus.CONFLICT);
                return toOrderResponse(previous.get());
            }
        }
        if (!demoPurchasesEnabled) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Purchases are not enabled");
        if (request.expectedAmount() != null && (request.expectedAmount().compareTo(listing.getPriceAmount()) != 0
                || !listing.getCurrencyCode().equals(request.expectedCurrency()))) throw new ResponseStatusException(HttpStatus.CONFLICT, "Price changed");
        if (!isPublicListingStatus(listing.getListingStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing is not available for purchase");
        }
        if (listing.getStockQuantity() == null || listing.getStockQuantity() < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Listing is out of stock");
        String customerPublicId = userPublicId(jwt);
        if (listing.getCreatedByUserPublicId().equals(customerPublicId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provider cannot purchase their own listing");
        }
        BigDecimal platformFee = listing.getPriceAmount().multiply(BigDecimal.valueOf(0.05)).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime now = LocalDateTime.now();
        OrderHeader order = new OrderHeader();
        order.setPurchaseRequestKey(scopedKey);
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
        order.setOrderStatus("PAYMENT_PENDING");
        order.setPaymentStatus("PENDING");
        order.setFulfillmentStatus("PENDING_DELIVERY");
        order.setPayoutStatus("PAYMENT_PENDING");
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

    @Transactional
    public MarketplaceDtos.OrderResponse refreshPurchase(String orderPublicId, Jwt jwt) {
        OrderHeader order = findOrder(orderPublicId);
        ensureCustomer(order, jwt);
        syncPaymentState(order);
        if ("CAPTURED".equalsIgnoreCase(order.getPaymentStatus()) && "PAYMENT_PENDING".equals(order.getOrderStatus())) order.setOrderStatus("PURCHASED");
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
        listing.setProductType(normalizeProductType(request.productType()));
        String deliveryType = normalizeDeliveryType(request.deliveryType());
        if ("PHYSICAL".equals(listing.getProductType())
                && !Set.of("SHIPPING", "SHIPPING_REQUIRED", "LOCAL_PICKUP").contains(deliveryType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Physical items require shipping or local pickup delivery.");
        }
        listing.setDeliveryType(deliveryType);
        listing.setFulfillmentScope(normalizeFulfillmentScope(request.fulfillmentScope()));
        listing.setProviderCountryCode(request.providerCountryCode());
        listing.setCurrencyCode(request.currencyCode());
        listing.setPriceAmount(request.priceAmount());
        listing.setImageKey(request.imageUrl());
        listing.setStockQuantity(normalizeStockQuantity(request.stockQuantity()));
    }

    private void applyProviderDefaults(Listing listing, ProviderAccountSummary provider, MarketplaceDtos.ListingRequest request) {
        if (request.providerCountryCode() == null || request.providerCountryCode().isBlank()) {
            listing.setProviderCountryCode(provider.countryCode());
        }
        listing.setSellerDisplayName(provider.displayName());
        listing.setVerifiedSeller(isProviderVerified(provider));
    }

    private Listing findPublicListing(String listingPublicId) {
        Listing listing = findListing(listingPublicId);
        if (!Set.of("ACTIVE", "PUBLISHED", "RESERVED", "SOLD").contains(listing.getListingStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
        }
        return listing;
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
        String normalized = requested.trim().toUpperCase();
        if (!listingStatusMasterRepository.existsByStatusCodeIgnoreCaseAndActiveTrue(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported listing status");
        }
        return normalized;
    }

    private String normalizeFulfillmentScope(String requested) {
        if (requested == null || requested.isBlank()) {
            return "NATIONAL";
        }
        String normalized = requested.trim().toUpperCase();
        return switch (normalized) {
            case "GLOBAL", "NATIONAL" -> normalized;
            case "LOCAL" -> "NATIONAL";
            default -> {
                log.warn("Unsupported fulfillment scope '{}' encountered while building marketplace home; defaulting to NATIONAL", normalized);
                yield "NATIONAL";
            }
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
            return defaultVerticalCode();
        }
        String normalized = requested.trim().toUpperCase();
        if (!marketplaceVerticalRepository.existsByModuleCodeIgnoreCase(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported marketplace vertical code");
        }
        return normalized;
    }

    private String normalizeProductType(String requested) {
        if (requested == null || requested.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product type is required");
        }
        String normalized = requested.trim().toUpperCase();
        if (!productTypeMasterRepository.existsByProductTypeCodeIgnoreCaseAndActiveTrue(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported product type");
        }
        return normalized;
    }

    private String normalizeDeliveryType(String requested) {
        if (requested == null || requested.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Delivery type is required");
        }
        String normalized = requested.trim().toUpperCase();
        if (!deliveryTypeMasterRepository.existsByDeliveryTypeCodeIgnoreCaseAndActiveTrue(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported delivery type");
        }
        return normalized;
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
            return defaultListingStatusCode();
        }
        if (!listingStatusMasterRepository.existsByStatusCodeIgnoreCaseAndActiveTrue(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported listing moderation status");
        }
        return normalized;
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

    private List<MarketplaceDtos.ListingResponse> toListingResponses(List<Listing> listings, String shopperCountryCode) {
        return listings.stream()
                .map(listing -> toListingResponse(listing, shopperCountryCode))
                .toList();
    }

    private List<MarketplaceDtos.CategoryHighlightResponse> toCategoryHighlights(String countryCode, List<String> publicStatuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<MarketplaceCategory> categories = categoriesByCountry(normalizedCountry);
        if (categories.isEmpty() && normalizedCountry != null) {
            categories = categoriesByCountry(null);
        }
        List<String> categoryCodes = categories.stream()
                .map(MarketplaceCategory::getCategoryCode)
                .filter(code -> code != null && !code.isBlank())
                .map(code -> code.trim().toUpperCase())
                .distinct()
                .toList();
        if (categoryCodes.isEmpty()) {
            return List.of();
        }

        List<Listing> discountedSamples = topDiscountedListings(normalizedCountry, publicStatuses);
        Map<String, String> discountedSampleImages = new HashMap<>();
        for (Listing listing : discountedSamples) {
            if (listing.getCategoryCode() == null || listing.getCategoryCode().isBlank()) {
                continue;
            }
            String imageUrl = resolveImageUrl(listing.getImageKey(), null);
            if (imageUrl == null || imageUrl.isBlank()) {
                continue;
            }
            discountedSampleImages.putIfAbsent(listing.getCategoryCode().trim().toUpperCase(), imageUrl);
        }

        Map<String, MarketplaceCategory> categoryMap = marketplaceCategoryRepository.findByCategoryCodeIn(categoryCodes).stream()
                .collect(java.util.stream.Collectors.toMap(
                        category -> category.getCategoryCode().trim().toUpperCase(),
                        category -> category,
                        (left, right) -> left));

        List<MarketplaceDtos.CategoryHighlightResponse> highlights = new ArrayList<>();
        List<ListingRepository.HomepageCategoryAggregateView> aggregates = listingRepository.findHomepageCategoryAggregates(
                publicStatuses,
                normalizedCountry,
                PageRequest.of(0, 20));
        if (aggregates.isEmpty() && normalizedCountry != null) {
            aggregates = listingRepository.findHomepageCategoryAggregates(publicStatuses, null, PageRequest.of(0, 20));
        }

        Map<String, ListingRepository.HomepageCategoryAggregateView> aggregateByCode = new HashMap<>();
        for (ListingRepository.HomepageCategoryAggregateView aggregate : aggregates) {
            if (aggregate.getCategoryCode() == null || aggregate.getCategoryCode().isBlank()) {
                continue;
            }
            aggregateByCode.putIfAbsent(aggregate.getCategoryCode().trim().toUpperCase(), aggregate);
        }

        for (String categoryCode : categoryCodes) {
            MarketplaceCategory category = categoryMap.get(categoryCode);
            ListingRepository.HomepageCategoryAggregateView aggregate = aggregateByCode.get(categoryCode);
            if (aggregate == null) {
                continue;
            }
            String imageUrl = category == null ? null : resolveImageUrl(category.getImageKey(), null);
            if (imageUrl == null || imageUrl.isBlank()) {
                imageUrl = discountedSampleImages.get(categoryCode);
            }
            highlights.add(new MarketplaceDtos.CategoryHighlightResponse(
                    category == null ? categoryCode : category.getCategoryCode(),
                    category == null ? categoryCode : category.getCategoryName(),
                    category == null ? categoryCode.toLowerCase() : category.getCategorySlug(),
                    category == null ? null : category.getVerticalCode(),
                    category == null ? null : category.getIconRef(),
                    imageUrl,
                    aggregate.getSoldCount() == null ? 0L : aggregate.getSoldCount(),
                    aggregate.getActiveCount() == null ? 0L : aggregate.getActiveCount(),
                    aggregate.getMaxDiscountPercent() == null ? 0 : aggregate.getMaxDiscountPercent()
            ));
        }

        highlights.sort(Comparator
                .comparingLong(MarketplaceDtos.CategoryHighlightResponse::soldCount).reversed()
                .thenComparing(Comparator.comparingLong(MarketplaceDtos.CategoryHighlightResponse::activeCount).reversed())
                .thenComparing(MarketplaceDtos.CategoryHighlightResponse::categoryName, String.CASE_INSENSITIVE_ORDER));

        return highlights.stream().limit(4).toList();
    }

    private MarketplaceDtos.ListingResponse toListingResponse(Listing listing) {
        return toListingResponse(listing, null);
    }

    private MarketplaceDtos.ListingResponse toListingResponse(Listing listing, String shopperCountryCode) {
        MarketplaceCurrencyService.CurrencyView priceView = marketplaceCurrencyService.viewPrice(
                listing.getPriceAmount(),
                listing.getCurrencyCode(),
                normalizeFulfillmentScope(listing.getFulfillmentScope()),
                shopperCountryCode);
        BigDecimal displayOriginalPrice = listing.getOriginalPriceAmount() == null
                ? null
                : marketplaceCurrencyService.convert(listing.getOriginalPriceAmount(), listing.getCurrencyCode(), priceView.displayCurrencyCode());
        return new MarketplaceDtos.ListingResponse(listing.getPublicId(), safeListingTitle(listing), listing.getDescription(),
                listing.getProductType(), listing.getDeliveryType(), normalizeFulfillmentScope(listing.getFulfillmentScope()), listing.getCurrencyCode(), listing.getPriceAmount(),
                listing.getOriginalPriceAmount(), listingImageUrl(listing), safeSellerDisplayName(listing),
                listing.isVerifiedSeller(), listing.getCategoryCode(), listing.getVerticalCode(), safeCountryCode(listing), listing.getListingStatus(),
                listing.getConditionLabel(), listing.getStockQuantity(), listing.getSourceType(), listing.getSourceName(),
                listing.getSourceUrl(), listing.getLicenseNote(), listing.isDemoSeed(), List.of(),
                listing.getCreatedAt(), priceView.displayCurrencyCode(), priceView.displayPriceAmount(), displayOriginalPrice);
    }

    private String listingImageUrl(Listing listing) {
        String key = listing.getImageKey();
        if (key == null || key.isBlank()) return null;
        return resolveImageUrl(key, null);
    }

    private MarketplaceDtos.ListingStatusResponse toListingStatusResponse(ListingStatusMaster status) {
        return new MarketplaceDtos.ListingStatusResponse(status.getStatusCode(), status.getDisplayLabel(),
                status.isCustomerVisible(), status.getSortOrder(), status.isActive());
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
        List<String> publicStatuses = publicListingStatuses();
        List<Listing> listings = verticalCode == null
                ? (countryCode == null
                ? listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(publicStatuses)
                : listingRepository.findTop24ByListingStatusInAndProviderCountryCodeOrderByCreatedAtDesc(publicStatuses, countryCode))
                : (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(publicStatuses, verticalCode)
                : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(publicStatuses, verticalCode, countryCode));
        if (listings.isEmpty() && countryCode != null) {
            return verticalCode == null
                    ? listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(publicStatuses)
                    : listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(publicStatuses, verticalCode);
        }
        return listings;
    }

    private List<Listing> localizedCategoryListings(String categoryCode, String verticalCode, String countryCode) {
        List<String> publicStatuses = publicListingStatuses();
        List<Listing> listings = verticalCode == null
                ? (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(publicStatuses, categoryCode)
                : listingRepository.findTop24ByListingStatusInAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(publicStatuses, categoryCode, countryCode))
                : (countryCode == null
                ? listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(publicStatuses, verticalCode, categoryCode)
                : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeAndProviderCountryCodeOrderByCreatedAtDesc(publicStatuses, verticalCode, categoryCode, countryCode));
        if (listings.isEmpty() && countryCode != null) {
            return verticalCode == null
                    ? listingRepository.findTop24ByListingStatusInAndCategoryCodeOrderByCreatedAtDesc(publicStatuses, categoryCode)
                    : listingRepository.findTop24ByListingStatusInAndVerticalCodeAndCategoryCodeOrderByCreatedAtDesc(publicStatuses, verticalCode, categoryCode);
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
            case "DISCOUNT" -> listings.stream()
                    .sorted(Comparator.comparingInt(this::discountPercent).reversed()
                            .thenComparing(Listing::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
            case "NEWEST", "RECENT" -> listings.stream()
                    .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                    .toList();
            default -> listings;
        };
    }

    private MarketplaceDtos.CategoryResponse toCategoryResponse(MarketplaceCategory category) {
        return new MarketplaceDtos.CategoryResponse(category.getId(), category.getCategoryCode(), category.getCategoryName(),
                category.getCategorySlug(), category.getVerticalCode(), category.getCountryCode(), category.getIconRef(),
                resolveImageUrl(category.getImageKey(), null), category.isActive());
    }

    private MarketplaceDtos.VerticalResponse toVerticalResponse(MarketplaceVertical vertical) {
        List<String> resolvedImageUrls = resolveImageUrls(vertical.getImageKeys(), vertical.getImageUrl());
        String resolvedImageUrl = resolvedImageUrls.isEmpty() ? null : resolvedImageUrls.get(0);
        return new MarketplaceDtos.VerticalResponse(
                vertical.getModuleCode(),
                vertical.getModuleName(),
                vertical.getDescription(),
                vertical.getStatus(),
                vertical.getDisplayOrder(),
                vertical.getIconKey(),
                vertical.getModuleType(),
                vertical.getFrontendRoute(),
                vertical.getApiAudience(),
                resolvedImageUrl,
                resolvedImageUrls,
                vertical.getImageKeys(),
                vertical.isCustomerAccessEnabled(),
                vertical.isProviderAccessEnabled(),
                vertical.isRequiresProviderApproval(),
                vertical.isAvailableToCustomer(),
                vertical.isProviderAccessActive()
        );
    }

    private String resolveImageUrl(String imageKey, String fallback) {
        String publicBaseUrl = resolveAssetPublicBaseUrl();
        if (imageKey != null && !imageKey.isBlank()) {
            String trimmed = imageKey.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
                return trimmed;
            }
            if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
                return publicBaseUrl.stripTrailing() + "/" + trimmed.replaceFirst("^/+", "");
            }
            return trimmed;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    private String firstAssetKey(String imageKeys) {
        if (imageKeys == null || imageKeys.isBlank()) {
            return null;
        }
        return java.util.Arrays.stream(imageKeys.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .orElse(null);
    }

    private List<String> resolveImageUrls(String imageKeys, String fallback) {
        String publicBaseUrl = resolveAssetPublicBaseUrl();
        List<String> urls = new ArrayList<>();

        if (imageKeys != null && !imageKeys.isBlank()) {
            for (String key : imageKeys.split(",")) {
                String resolved = resolveImageUrl(key, null, publicBaseUrl);
                if (resolved != null && !resolved.isBlank() && !urls.contains(resolved)) {
                    urls.add(resolved);
                }
            }
        }

        if (urls.isEmpty()) {
            String resolvedFallback = resolveImageUrl(null, fallback, publicBaseUrl);
            if (resolvedFallback != null && !resolvedFallback.isBlank()) {
                urls.add(resolvedFallback);
            }
        }

        return urls;
    }

    private String resolveAssetPublicBaseUrl() {
        if (cachedAssetPublicBaseUrl != null) {
            return cachedAssetPublicBaseUrl;
        }
        synchronized (this) {
            if (cachedAssetPublicBaseUrl == null) {
                cachedAssetPublicBaseUrl = assetStorageProviderRepository.findFirstByActiveTrueOrderByUpdatedAtDesc()
                        .map(AssetStorageProvider::getPublicBaseUrl)
                        .filter(baseUrl -> baseUrl != null && !baseUrl.isBlank())
                        .orElse("");
            }
        }
        return cachedAssetPublicBaseUrl.isBlank() ? null : cachedAssetPublicBaseUrl;
    }

    private String resolveImageUrl(String imageKey, String fallback, String publicBaseUrl) {
        if (imageKey != null && !imageKey.isBlank()) {
            String trimmed = imageKey.trim();
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
                return trimmed;
            }
            if (publicBaseUrl != null && !publicBaseUrl.isBlank()) {
                return publicBaseUrl.stripTrailing() + "/" + trimmed.replaceFirst("^/+", "");
            }
            return trimmed;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<MarketplaceDtos.ListingStatusResponse> listingStatuses() {
        return listingStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc().stream()
                .map(this::toListingStatusResponse)
                .toList();
    }

    private boolean isPublicListingStatus(String listingStatus) {
        if (listingStatus == null || listingStatus.isBlank()) {
            return false;
        }
        return listingStatusMasterRepository.findByStatusCodeIgnoreCase(listingStatus.trim().toUpperCase())
                .map(status -> status.isActive() && status.isCustomerVisible())
                .orElse(false);
    }

    private List<String> homeListingStatuses() {
        if (cachedHomeListingStatuses != null) {
            return cachedHomeListingStatuses;
        }
        synchronized (this) {
            if (cachedHomeListingStatuses == null) {
                cachedHomeListingStatuses = List.copyOf(homeListingStatuses(publicListingStatuses()));
            }
        }
        return cachedHomeListingStatuses;
    }

    private List<String> homeListingStatuses(List<String> publicStatuses) {
        List<String> statuses = new ArrayList<>(publicStatuses);
        if (!statuses.contains("SOLD")) {
            statuses.add("SOLD");
        }
        return statuses;
    }

    private List<String> publicListingStatuses() {
        if (cachedPublicListingStatuses != null) {
            return cachedPublicListingStatuses;
        }
        synchronized (this) {
            if (cachedPublicListingStatuses == null) {
                List<String> statuses = listingStatusMasterRepository.findByCustomerVisibleTrueAndActiveTrueOrderBySortOrderAscDisplayLabelAsc()
                        .stream()
                        .map(ListingStatusMaster::getStatusCode)
                        .toList();
                cachedPublicListingStatuses = statuses.isEmpty()
                        ? List.of("ACTIVE", "PUBLISHED")
                        : List.copyOf(statuses);
            }
        }
        return cachedPublicListingStatuses;
    }

    private <T> T timedHomeSection(String section, Supplier<T> supplier) {
        long startedAt = System.nanoTime();
        try {
            return supplier.get();
        } finally {
            long elapsedMs = java.util.concurrent.TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
            log.info("Marketplace home section loaded: section={}, elapsedMs={}", section, elapsedMs);
        }
    }

    private int discountPercent(Listing listing) {
        if (listing.getOriginalPriceAmount() == null || listing.getOriginalPriceAmount().signum() <= 0
                || listing.getPriceAmount() == null) {
            return 0;
        }
        if (listing.getOriginalPriceAmount().compareTo(listing.getPriceAmount()) <= 0) {
            return 0;
        }
        BigDecimal discount = listing.getOriginalPriceAmount()
                .subtract(listing.getPriceAmount())
                .multiply(BigDecimal.valueOf(100))
                .divide(listing.getOriginalPriceAmount(), 0, RoundingMode.HALF_UP);
        return discount.intValue();
    }

    private String defaultListingStatusCode() {
        return listingStatusMasterRepository.findByCustomerVisibleTrueAndActiveTrueOrderBySortOrderAscDisplayLabelAsc()
                .stream()
                .findFirst()
                .map(ListingStatusMaster::getStatusCode)
                .orElse("ACTIVE");
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
            String verticalCode = defaultVerticalCode();
            response = restClient.get()
                    .uri(authorizationProviderEligibilityUrl + "/providers/" + providerPublicId + "/modules/" + verticalCode + "/eligibility")
                    .header("X-Internal-Service-Token", internalServiceToken)
                    .retrieve()
                    .body(ProviderEligibilityResponse.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify provider eligibility right now", exception);
        }
        if (response == null || !response.eligible()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Provider is not eligible for " + defaultVerticalCode());
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

    /**
     * Returns top 20 highly discounted sub-categories with their best-discounted listings for homepage.
     */
    @Transactional(readOnly = true)
    private List<MarketplaceDtos.SubcategoryHighlightResponse> topDiscountedSubcategories(String countryCode, List<String> publicStatuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> discountedListings = topDiscountedListings(normalizedCountry, publicStatuses);
        if (discountedListings.isEmpty() && normalizedCountry != null) {
            discountedListings = topDiscountedListings(null, publicStatuses);
        }
        if (discountedListings.isEmpty()) {
            return List.of();
        }

        Map<String, Listing> bestListingByCategory = new LinkedHashMap<>();
        for (Listing listing : discountedListings) {
            if (listing.getCategoryCode() == null || listing.getCategoryCode().isBlank()) {
                continue;
            }
            int discountPercent = discountPercent(listing);
            if (discountPercent <= 0) {
                continue;
            }
            String categoryCode = listing.getCategoryCode().trim().toUpperCase();
            bestListingByCategory.putIfAbsent(categoryCode, listing);
        }

        List<String> categoryCodes = bestListingByCategory.keySet().stream().toList();
        Map<String, MarketplaceCategory> categories = marketplaceCategoryRepository.findByCategoryCodeIn(categoryCodes).stream()
                .collect(java.util.stream.Collectors.toMap(
                        category -> category.getCategoryCode().trim().toUpperCase(),
                        category -> category,
                        (left, right) -> left));

        List<MarketplaceDtos.SubcategoryHighlightResponse> highlights = new ArrayList<>();
        for (Map.Entry<String, Listing> entry : bestListingByCategory.entrySet()) {
            String categoryCode = entry.getKey();
            Listing listing = entry.getValue();
            MarketplaceCategory category = categories.get(categoryCode);
            String categoryName = category == null ? listing.getCategoryCode() : category.getCategoryName();
            String subcategoryName = categoryName;
            String verticalCode = category != null && category.getVerticalCode() != null
                    ? category.getVerticalCode()
                    : listing.getVerticalCode();

            highlights.add(new MarketplaceDtos.SubcategoryHighlightResponse(
                    category == null ? listing.getCategoryCode() : category.getCategoryCode(),
                    subcategoryName,
                    categoryName,
                    verticalCode,
                    discountPercent(listing),
                    resolveImageUrl(listing.getImageKey(), null),
                    listing.getTitle(),
                    listing.getOriginalPriceAmount(),
                    listing.getPriceAmount(),
                    listing.getCurrencyCode()
            ));
        }

        return highlights.stream()
                .sorted(Comparator.comparingInt(MarketplaceDtos.SubcategoryHighlightResponse::discountPercentage).reversed()
                        .thenComparing(MarketplaceDtos.SubcategoryHighlightResponse::subcategoryName, String.CASE_INSENSITIVE_ORDER))
                .limit(20)
                .toList();
    }

    /**
     * Returns the 10 most selected listings for the public homepage.
     */
    @Transactional(readOnly = true)
    private List<MarketplaceDtos.ListingResponse> mostSelectedListings(String countryCode, List<String> publicStatuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<ListingRepository.ListingSelectionCountView> selectionCounts = listingRepository
                .findTopCompletedOrdersByListingPublicId(publicStatuses, normalizedCountry, PageRequest.of(0, 20));
        if (selectionCounts.isEmpty() && normalizedCountry != null) {
            selectionCounts = listingRepository.findTopCompletedOrdersByListingPublicId(publicStatuses, null, PageRequest.of(0, 20));
        }
        List<String> listingPublicIds = selectionCounts.stream()
                .map(ListingRepository.ListingSelectionCountView::getListingPublicId)
                .filter(publicId -> publicId != null && !publicId.isBlank())
                .limit(10)
                .toList();
        if (listingPublicIds.isEmpty()) {
            return List.of();
        }

        Map<String, Long> countsByListing = selectionCounts.stream()
                .filter(view -> view.getListingPublicId() != null && !view.getListingPublicId().isBlank())
                .collect(java.util.stream.Collectors.toMap(
                        view -> view.getListingPublicId().trim(),
                        view -> view.getCompletedCount() == null ? 0L : view.getCompletedCount(),
                        Long::max,
                        LinkedHashMap::new));

        Map<String, Listing> listingsByPublicId = listingRepository.findByPublicIdIn(listingPublicIds).stream()
                .collect(java.util.stream.Collectors.toMap(
                        Listing::getPublicId,
                        listing -> listing,
                        (left, right) -> left));

        List<Listing> orderedListings = new ArrayList<>();
        for (String publicId : listingPublicIds) {
            Listing listing = listingsByPublicId.get(publicId);
            if (listing != null) {
                orderedListings.add(listing);
            }
        }

        return orderedListings.stream()
                .sorted((left, right) -> {
                    long rightCount = countsByListing.getOrDefault(right.getPublicId(), 0L);
                    long leftCount = countsByListing.getOrDefault(left.getPublicId(), 0L);
                    if (rightCount != leftCount) {
                        return Long.compare(rightCount, leftCount);
                    }
                    LocalDateTime leftUpdated = left.getUpdatedAt();
                    LocalDateTime rightUpdated = right.getUpdatedAt();
                    if (leftUpdated == null && rightUpdated == null) {
                        return 0;
                    }
                    if (leftUpdated == null) {
                        return 1;
                    }
                    if (rightUpdated == null) {
                        return -1;
                    }
                    return rightUpdated.compareTo(leftUpdated);
                })
                .limit(10)
                .map(listing -> toListingResponse(listing, normalizedCountry))
                .toList();
    }

    /**
     * Returns top 20 active rollback offers that still have time remaining.
     */
    @Transactional(readOnly = true)
    private List<MarketplaceDtos.ListingResponse> rollbackOfferListings(String countryCode, List<String> statuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> filtered = listingRepository.findTopRollbackOfferListings(statuses, LocalDateTime.now(), normalizedCountry, PageRequest.of(0, 20));
        if (filtered.isEmpty() && normalizedCountry != null) {
            filtered = listingRepository.findTopRollbackOfferListings(statuses, LocalDateTime.now(), null, PageRequest.of(0, 20));
        }
        return toListingResponses(filtered, normalizedCountry);
    }

    /**
     * Returns top 20 clearance listings older than three months and discounted by 50% or more.
     */
    @Transactional(readOnly = true)
    private List<MarketplaceDtos.ListingResponse> clearanceListings(String countryCode, List<String> statuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        LocalDateTime clearanceCutoff = LocalDateTime.now().minusMonths(3);
        List<Listing> filtered = listingRepository.findTopClearanceListings(statuses, clearanceCutoff, normalizedCountry);
        if (filtered.isEmpty() && normalizedCountry != null) {
            filtered = listingRepository.findTopClearanceListings(statuses, clearanceCutoff, null);
        }
        return toListingResponses(filtered, normalizedCountry);
    }

    /**
     * Returns top 20 high-rated sellers with their featured listings for homepage.
     */
    @Transactional(readOnly = true)
    private List<MarketplaceDtos.SellerHighlightResponse> topRatedSellers(String countryCode, List<String> publicStatuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<SellerProfile> sellerProfiles = sellerProfileRepository.findTopVerifiedSellers(PageRequest.of(0, 20));
        if (sellerProfiles.isEmpty()) {
            return List.of();
        }
        List<String> providerPublicIds = sellerProfiles.stream()
                .map(SellerProfile::getProviderAccountPublicId)
                .filter(providerPublicId -> providerPublicId != null && !providerPublicId.isBlank())
                .toList();
        if (providerPublicIds.isEmpty()) {
            return List.of();
        }

        List<Listing> providerListings = normalizedCountry == null
                ? listingRepository.findByProviderAccountPublicIdInAndListingStatusInOrderByUpdatedAtDesc(providerPublicIds, publicStatuses)
                : listingRepository.findByProviderAccountPublicIdInAndListingStatusInAndProviderCountryCodeOrderByUpdatedAtDesc(providerPublicIds, publicStatuses, normalizedCountry);
        if (providerListings.isEmpty() && normalizedCountry != null) {
            providerListings = listingRepository.findByProviderAccountPublicIdInAndListingStatusInOrderByUpdatedAtDesc(providerPublicIds, publicStatuses);
        }

        Map<String, List<Listing>> listingsByProvider = new HashMap<>();
        for (Listing listing : providerListings) {
            if (listing.getProviderAccountPublicId() == null || listing.getProviderAccountPublicId().isBlank()) {
                continue;
            }
            listingsByProvider.computeIfAbsent(listing.getProviderAccountPublicId(), key -> new ArrayList<>())
                    .add(listing);
        }

        Map<String, SellerProfile> sellerProfileMap = sellerProfiles.stream()
                .collect(java.util.stream.Collectors.toMap(SellerProfile::getProviderAccountPublicId, profile -> profile, (left, right) -> left));

        List<MarketplaceDtos.SellerHighlightResponse> sellers = new ArrayList<>();
        for (java.util.Map.Entry<String, List<Listing>> entry : listingsByProvider.entrySet()) {
            String providerPublicId = entry.getKey();
            List<Listing> sellerListingsSource = entry.getValue();
            SellerProfile sellerProfile = sellerProfileMap.get(providerPublicId);
            if (sellerProfile == null) {
                continue;
            }

            long completedOrders = sellerProfile.getCompletedOrders() == null ? 0 : sellerProfile.getCompletedOrders();

            String sellerName = sellerProfile.getSellerName();
            if (sellerName == null || sellerName.isBlank()) {
                sellerName = sellerListingsSource.stream()
                        .map(Listing::getSellerDisplayName)
                        .filter(s -> s != null && !s.isBlank())
                        .findFirst()
                        .orElse("Unknown Seller");
            }

            List<MarketplaceDtos.ListingResponse> sellerListings = sellerListingsSource.stream()
                    .limit(3)
                    .map(listing -> toListingResponse(listing, normalizedCountry))
                    .toList();

            sellers.add(new MarketplaceDtos.SellerHighlightResponse(
                    providerPublicId,
                    sellerName,
                    sellerProfile.getSellerRating() == null ? java.math.BigDecimal.ZERO : sellerProfile.getSellerRating(),
                    (int) completedOrders,
                    sellerListings
            ));
        }

        sellers.sort(Comparator
                .comparingInt(MarketplaceDtos.SellerHighlightResponse::completedOrders).reversed()
                .thenComparing(Comparator.comparing(MarketplaceDtos.SellerHighlightResponse::sellerRating).reversed())
                .thenComparing(Comparator.comparingInt((MarketplaceDtos.SellerHighlightResponse seller) -> seller.listings().size()).reversed())
                .thenComparing(MarketplaceDtos.SellerHighlightResponse::sellerName, String.CASE_INSENSITIVE_ORDER));

        return sellers.stream().limit(20).toList();
    }

    @Transactional(readOnly = true)
    private List<Listing> topDiscountedListings(String countryCode, List<String> publicStatuses) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<Listing> listings = listingRepository.findTopDiscountedListings(publicStatuses, normalizedCountry);
        if (listings.isEmpty() && normalizedCountry != null) {
            listings = listingRepository.findTopDiscountedListings(publicStatuses, null);
        }
        return listings;
    }

    @Transactional(readOnly = true)
    private long itemsSoldCount(String countryCode) {
        String normalizedCountry = normalizeCountryCode(countryCode);
        List<String> soldStatuses = List.of("SOLD");
        long soldCount = normalizedCountry == null
                ? listingRepository.countByListingStatusIn(soldStatuses)
                : listingRepository.countByListingStatusInAndProviderCountryCode(soldStatuses, normalizedCountry);
        if (soldCount == 0 && normalizedCountry != null) {
            soldCount = listingRepository.countByListingStatusIn(soldStatuses);
        }
        return soldCount;
    }
}
