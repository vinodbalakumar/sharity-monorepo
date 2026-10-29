package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceCheckoutDtos;
import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.Cart;
import com.java.vinod.marketplace.service.entity.CartItem;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCheckout;
import com.java.vinod.marketplace.service.entity.OrderHeader;
import com.java.vinod.marketplace.service.repository.CartItemRepository;
import com.java.vinod.marketplace.service.repository.CartRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.ListingStatusMasterRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCheckoutRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Converts a buyer's whole physical cart into one parent checkout with one child order per cart line and
 * queues exactly one aggregate payment command. The legacy single-item (digital) purchase flow is untouched.
 *
 * <p>Concurrency: the cart row, then its item rows, then each listing row (sorted by public id) are locked
 * with {@code SELECT ... FOR UPDATE} in that fixed order, so concurrent checkouts of the same cart serialize,
 * overlapping carts cannot deadlock on listings, and stock is decremented only while its row is locked.</p>
 */
@Service
public class MarketplaceCheckoutService {
    static final String STATUS_PAYMENT_PENDING = "PAYMENT_PENDING";
    private static final BigDecimal PLATFORM_FEE_RATE = BigDecimal.valueOf(0.05);
    private static final String IDEMPOTENCY_KEY_PATTERN = "[A-Za-z0-9_-]{16,64}";
    private static final Set<String> PHYSICAL_DELIVERY_TYPES = Set.of("SHIPPING", "SHIPPING_REQUIRED", "LOCAL_PICKUP");
    private static final Logger log = LoggerFactory.getLogger(MarketplaceCheckoutService.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ListingRepository listingRepository;
    private final ListingStatusMasterRepository listingStatusMasterRepository;
    private final MarketplaceCheckoutRepository checkoutRepository;
    private final OrderHeaderRepository orderHeaderRepository;
    private final MarketplaceEventOutboxService marketplaceEventOutboxService;
    private final MarketplaceService marketplaceService;

    @Value("${app.commerce.demo-purchases-enabled:false}")
    private boolean purchasesEnabled;

    public MarketplaceCheckoutService(CartRepository cartRepository,
                                      CartItemRepository cartItemRepository,
                                      ListingRepository listingRepository,
                                      ListingStatusMasterRepository listingStatusMasterRepository,
                                      MarketplaceCheckoutRepository checkoutRepository,
                                      OrderHeaderRepository orderHeaderRepository,
                                      MarketplaceEventOutboxService marketplaceEventOutboxService,
                                      MarketplaceService marketplaceService) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.listingRepository = listingRepository;
        this.listingStatusMasterRepository = listingStatusMasterRepository;
        this.checkoutRepository = checkoutRepository;
        this.orderHeaderRepository = orderHeaderRepository;
        this.marketplaceEventOutboxService = marketplaceEventOutboxService;
        this.marketplaceService = marketplaceService;
    }

    /**
     * Price changes found while validating are persisted to the cart (repricing only, nothing else has been
     * written at that point) so the buyer can review the new prices; everything else rolls back.
     */
    @Transactional(noRollbackFor = CheckoutPriceChangedException.class)
    public MarketplaceCheckoutDtos.CheckoutResponse checkoutCart(String cartPublicId,
                                                                 MarketplaceCheckoutDtos.CheckoutRequest request,
                                                                 String idempotencyKey,
                                                                 Jwt jwt) {
        String customerPublicId = userPublicId(jwt);
        String key = requireIdempotencyKey(idempotencyKey);
        List<MarketplaceCheckoutDtos.CheckoutItemRequest> requestedItems = validateRequestShape(request);
        String fingerprint = fingerprint(cartPublicId, requestedItems);

        // Lock first so the idempotency lookup below observes any checkout committed by a concurrent request.
        Cart cart = cartRepository.findByCartIdForUpdate(cartPublicId).orElse(null);
        var existing = checkoutRepository.findByCustomerUserPublicIdAndIdempotencyKey(customerPublicId, key);
        if (existing.isPresent()) {
            MarketplaceCheckout previous = existing.get();
            if (!previous.getRequestFingerprint().equals(fingerprint)) {
                throw new CheckoutConflictException(
                        "Idempotency-Key was already used for a different checkout request");
            }
            return toResponse(previous);
        }
        if (cart == null || !customerPublicId.equals(cart.getCustomerId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found");
        }
        if (!purchasesEnabled) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Purchases are not enabled");
        }
        if (cart.getCartStatus() != null && !"ACTIVE".equalsIgnoreCase(cart.getCartStatus())) {
            throw new CheckoutConflictException("Cart is not active");
        }

        List<CartItem> cartItems = cartItemRepository.findByCartIdForUpdate(cartPublicId);
        matchSnapshot(cart, cartItems, requestedItems);

        // Lock listings in deterministic public-id order to avoid deadlocks between overlapping carts.
        Map<String, Integer> quantityByListing = new TreeMap<>();
        for (CartItem item : cartItems) {
            if (quantityByListing.putIfAbsent(item.getListingId(), item.getQuantity()) != null) {
                throw cartChanged();
            }
        }
        Map<String, Listing> listings = new HashMap<>();
        for (Map.Entry<String, Integer> entry : quantityByListing.entrySet()) {
            Listing listing = listingRepository.findForPurchase(entry.getKey())
                    .orElseThrow(() -> new CheckoutConflictException(
                            "A cart item is no longer available. Review your cart."));
            validateListing(listing, entry.getValue(), customerPublicId, cart.getCurrencyCode());
            listings.put(entry.getKey(), listing);
        }
        repriceChangedItems(cart, cartItems, listings);

        LocalDateTime now = LocalDateTime.now();
        MarketplaceCheckout checkout = new MarketplaceCheckout();
        checkout.setPublicId(UUID.randomUUID().toString());
        checkout.setCustomerUserPublicId(customerPublicId);
        checkout.setCartPublicId(cartPublicId);
        checkout.setIdempotencyKey(key);
        checkout.setRequestFingerprint(fingerprint);
        checkout.setCheckoutStatus(STATUS_PAYMENT_PENDING);
        checkout.setCurrencyCode(cart.getCurrencyCode());

        List<CartItem> orderedItems = cartItems.stream()
                .sorted(Comparator.comparing(CartItem::getListingId).thenComparing(CartItem::getCartItemId))
                .toList();
        List<OrderHeader> orders = new ArrayList<>();
        BigDecimal itemTotal = BigDecimal.ZERO;
        BigDecimal feeTotal = BigDecimal.ZERO;
        BigDecimal providerTotal = BigDecimal.ZERO;
        for (CartItem item : orderedItems) {
            Listing listing = listings.get(item.getListingId());
            BigDecimal unitPrice = listing.getPriceAmount().setScale(2, RoundingMode.HALF_UP);
            BigDecimal itemAmount = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal platformFee = itemAmount.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
            BigDecimal providerAmount = itemAmount.subtract(platformFee);
            OrderHeader order = new OrderHeader();
            order.setPublicId(UUID.randomUUID().toString());
            order.setCheckout(checkout);
            order.setCartItemPublicId(item.getCartItemId());
            order.setListing(listing);
            order.setQuantity(item.getQuantity());
            order.setUnitPriceAmount(unitPrice);
            order.setCustomerUserPublicId(customerPublicId);
            order.setProviderAccountPublicId(listing.getProviderAccountPublicId());
            order.setProviderOwnerUserPublicId(listing.getCreatedByUserPublicId());
            order.setProviderCountryCode(listing.getProviderCountryCode());
            order.setTransactionCurrencyCode(listing.getCurrencyCode());
            order.setItemAmount(itemAmount);
            order.setPlatformFeeAmount(platformFee);
            order.setCustomerTotalAmount(itemAmount);
            order.setProviderExpectedAmount(providerAmount);
            order.setOrderStatus("PAYMENT_PENDING");
            order.setPaymentStatus("PENDING");
            order.setFulfillmentStatus("PENDING_DELIVERY");
            order.setPayoutStatus("PAYMENT_PENDING");
            order.setPurchasedAt(now);
            order.setCreatedAt(now);
            order.setUpdatedAt(now);
            orders.add(order);
            itemTotal = itemTotal.add(itemAmount);
            feeTotal = feeTotal.add(platformFee);
            providerTotal = providerTotal.add(providerAmount);
        }
        checkout.setItemAmount(itemTotal);
        checkout.setPlatformFeeAmount(feeTotal);
        checkout.setCustomerTotalAmount(itemTotal);
        checkout.setProviderAmount(providerTotal);
        checkout.setCreatedAt(now);
        checkout.setUpdatedAt(now);

        MarketplaceCheckout savedCheckout;
        try {
            savedCheckout = checkoutRepository.saveAndFlush(checkout);
        } catch (DataIntegrityViolationException exception) {
            throw new CheckoutConflictException(
                    "A checkout with this Idempotency-Key is already being processed", exception);
        }
        List<OrderHeader> savedOrders = new ArrayList<>();
        for (OrderHeader order : orders) {
            order.setCheckout(savedCheckout);
            savedOrders.add(orderHeaderRepository.save(order));
        }

        // Reserve stock while the listing rows are still locked.
        for (Map.Entry<String, Integer> entry : quantityByListing.entrySet()) {
            Listing listing = listings.get(entry.getKey());
            int remaining = listing.getStockQuantity() - entry.getValue();
            listing.setStockQuantity(remaining);
            if (remaining == 0) {
                listing.setListingStatus("RESERVED");
            }
            listing.setUpdatedAt(now);
        }

        // Consume the whole cart atomically with the orders.
        cartItemRepository.deleteAll(cartItems);
        cart.setTotalItems(0);
        cart.setSubtotal(BigDecimal.ZERO);
        cart.setDiscountAmount(BigDecimal.ZERO);
        cart.setTaxAmount(BigDecimal.ZERO);
        cart.setTotal(BigDecimal.ZERO);
        cart.setLastModifiedAt(now);
        cartRepository.save(cart);

        marketplaceEventOutboxService.queueCheckoutPaymentCreate(savedCheckout, savedOrders);
        log.info("Consolidated checkout created: checkoutPublicId={}, customerPublicId={}, cartPublicId={}, orders={}, total={} {}",
                savedCheckout.getPublicId(), customerPublicId, cartPublicId, savedOrders.size(),
                savedCheckout.getCustomerTotalAmount(), savedCheckout.getCurrencyCode());
        return toResponse(savedCheckout, savedOrders);
    }

    /**
     * Locking needs a write-capable transaction, but this resolution never mutates the cart, checkout,
     * stock, orders or payment state. Read committed ensures the lookup sees the submission we waited for.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public MarketplaceCheckoutDtos.CheckoutAttemptResponse checkoutAttempt(String cartPublicId,
                                                                           String idempotencyKey,
                                                                           Jwt jwt) {
        String customerPublicId = userPublicId(jwt);
        String key = requireIdempotencyKey(idempotencyKey);
        Cart cart = cartRepository.findByCartIdForUpdate(cartPublicId)
                .filter(found -> customerPublicId.equals(found.getCustomerId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cart not found"));
        MarketplaceCheckout existing = checkoutRepository
                .findByCustomerUserPublicIdAndIdempotencyKey(customerPublicId, key).orElse(null);
        if (existing != null && !cart.getCartId().equals(existing.getCartPublicId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Idempotency-Key was already used for a different cart");
        }
        return new MarketplaceCheckoutDtos.CheckoutAttemptResponse(existing == null ? null : toResponse(existing));
    }

    @Transactional
    public MarketplaceCheckoutDtos.CheckoutResponse checkout(String checkoutPublicId, Jwt jwt) {
        MarketplaceCheckout checkout = checkoutRepository.findByPublicIdForUpdate(checkoutPublicId)
                .filter(found -> found.getCustomerUserPublicId().equals(userPublicId(jwt)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Checkout not found"));
        marketplaceService.syncCheckoutPaymentState(checkout);
        return toResponse(checkout);
    }

    /**
     * Partial refunds/cancellations of a consolidated checkout are not supported by payment-service yet, so any
     * refund or cancel request that targets a checkout or one of its child orders is rejected before any state change.
     */
    @Transactional(readOnly = true)
    public void rejectConsolidatedRefundOrCancel(String... ids) {
        for (String id : ids) {
            if (id == null || id.isBlank()) {
                continue;
            }
            if (checkoutRepository.existsByPublicId(id) || orderHeaderRepository.existsByPublicIdAndCheckoutIsNotNull(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Refunds and cancellations are not supported for multi-item cart checkout orders. Contact support.");
            }
        }
    }

    private List<MarketplaceCheckoutDtos.CheckoutItemRequest> validateRequestShape(MarketplaceCheckoutDtos.CheckoutRequest request) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Checkout requires the current cart items");
        }
        if (request.items().size() > MarketplaceCheckoutDtos.MAX_CHECKOUT_LINES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many cart lines for one checkout");
        }
        Set<String> seen = new HashSet<>();
        for (MarketplaceCheckoutDtos.CheckoutItemRequest item : request.items()) {
            if (item == null || item.cartItemId() == null || item.cartItemId().isBlank()
                    || item.quantity() == null || item.quantity() < 1 || item.quantity() > MarketplaceCheckoutDtos.MAX_LINE_QUANTITY
                    || item.unitPrice() == null || item.unitPrice().signum() <= 0
                    || item.currencyCode() == null || !item.currencyCode().trim().matches("[A-Za-z]{3}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid checkout item");
            }
            if (!seen.add(item.cartItemId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate cart item in checkout request");
            }
        }
        return request.items();
    }

    private void matchSnapshot(Cart cart, List<CartItem> cartItems,
                               List<MarketplaceCheckoutDtos.CheckoutItemRequest> requestedItems) {
        if (cartItems.isEmpty()) {
            throw new CheckoutConflictException("Cart is empty or was already checked out");
        }
        Map<String, CartItem> byId = new LinkedHashMap<>();
        for (CartItem item : cartItems) {
            byId.put(item.getCartItemId(), item);
        }
        if (byId.size() != requestedItems.size()) {
            throw cartChanged();
        }
        for (MarketplaceCheckoutDtos.CheckoutItemRequest requested : requestedItems) {
            CartItem item = byId.get(requested.cartItemId());
            if (item == null
                    || !requested.quantity().equals(item.getQuantity())
                    || item.getUnitPrice() == null
                    || requested.unitPrice().compareTo(item.getUnitPrice()) != 0
                    || !requested.currencyCode().trim().equalsIgnoreCase(cart.getCurrencyCode())) {
                throw cartChanged();
            }
        }
    }

    private void validateListing(Listing listing, int quantity, String customerPublicId, String cartCurrency) {
        String productType = listing.getProductType() == null ? "" : listing.getProductType().trim().toUpperCase(Locale.ROOT);
        String deliveryType = listing.getDeliveryType() == null ? "" : listing.getDeliveryType().trim().toUpperCase(Locale.ROOT);
        if (!"PHYSICAL".equals(productType) || !PHYSICAL_DELIVERY_TYPES.contains(deliveryType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only physical items can be checked out from the cart. Use Buy Now for digital items.");
        }
        if (!isPublicListingStatus(listing.getListingStatus())) {
            throw new CheckoutConflictException("A cart item is no longer available. Review your cart.");
        }
        if (customerPublicId.equals(listing.getCreatedByUserPublicId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot buy your own listing");
        }
        if (listing.getCurrencyCode() == null || !listing.getCurrencyCode().equalsIgnoreCase(cartCurrency)) {
            throw new CheckoutConflictException("Price changed. Review your cart.");
        }
        if (listing.getStockQuantity() == null || listing.getStockQuantity() < quantity) {
            throw new CheckoutConflictException("Not enough stock for a cart item. Review your cart.");
        }
        if (listing.getPriceAmount() == null || listing.getPriceAmount().signum() <= 0) {
            throw new CheckoutConflictException("A cart item is no longer available. Review your cart.");
        }
    }

    private void repriceChangedItems(Cart cart, List<CartItem> cartItems, Map<String, Listing> listings) {
        boolean changed = false;
        for (CartItem item : cartItems) {
            BigDecimal current = listings.get(item.getListingId()).getPriceAmount();
            if (item.getUnitPrice().compareTo(current) != 0) {
                item.setUnitPrice(current);
                item.setLineTotal(current.multiply(BigDecimal.valueOf(item.getQuantity())));
                cartItemRepository.save(item);
                changed = true;
            }
        }
        if (!changed) {
            return;
        }
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        for (CartItem item : cartItems) {
            subtotal = subtotal.add(item.getLineTotal());
            discount = discount.add(item.getLineDiscount() == null ? BigDecimal.ZERO : item.getLineDiscount());
        }
        cart.setSubtotal(subtotal);
        cart.setDiscountAmount(discount);
        cart.setTotal(subtotal.subtract(discount).add(cart.getTaxAmount() == null ? BigDecimal.ZERO : cart.getTaxAmount()));
        cart.setLastModifiedAt(LocalDateTime.now());
        cartRepository.save(cart);
        throw new CheckoutPriceChangedException();
    }

    /** A checkout rejection with a buyer-safe reason, never an underlying exception message. */
    public static class CheckoutConflictException extends ResponseStatusException {
        private CheckoutConflictException(String reason) {
            super(HttpStatus.CONFLICT, reason);
        }

        private CheckoutConflictException(String reason, Throwable cause) {
            super(HttpStatus.CONFLICT, reason, cause);
        }
    }

    /**
     * Signals that cart prices were refreshed to current listing prices and the buyer must review again.
     */
    public static class CheckoutPriceChangedException extends CheckoutConflictException {
        public CheckoutPriceChangedException() {
            super("Price changed. Your cart was updated with current prices; review and try again.");
        }
    }

    private boolean isPublicListingStatus(String listingStatus) {
        if (listingStatus == null || listingStatus.isBlank()) {
            return false;
        }
        return listingStatusMasterRepository.findByStatusCodeIgnoreCase(listingStatus.trim().toUpperCase(Locale.ROOT))
                .map(status -> status.isActive() && status.isCustomerVisible())
                .orElse(false);
    }

    private MarketplaceCheckoutDtos.CheckoutResponse toResponse(MarketplaceCheckout checkout) {
        return toResponse(checkout, orderHeaderRepository.findByCheckout_IdOrderByIdAsc(checkout.getId()));
    }

    private MarketplaceCheckoutDtos.CheckoutResponse toResponse(MarketplaceCheckout checkout, List<OrderHeader> orders) {
        return new MarketplaceCheckoutDtos.CheckoutResponse(checkout.getPublicId(), checkout.getCheckoutStatus(),
                checkout.getCurrencyCode(), checkout.getItemAmount(), checkout.getPlatformFeeAmount(),
                checkout.getCustomerTotalAmount(), checkout.getProviderAmount(),
                orders.stream().map(MarketplaceCheckoutService::toOrderResponse).toList());
    }

    static MarketplaceDtos.OrderResponse toOrderResponse(OrderHeader order) {
        return new MarketplaceDtos.OrderResponse(order.getPublicId(), order.getListing().getPublicId(), order.getOrderStatus(),
                order.getPaymentStatus(), order.getFulfillmentStatus(), order.getPayoutStatus(),
                order.getCustomerTotalAmount(), order.getTransactionCurrencyCode(), order.getCreatedAt(), order.getQuantity());
    }

    private static String requireIdempotencyKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key header is required");
        }
        String key = idempotencyKey.trim();
        if (!key.matches(IDEMPOTENCY_KEY_PATTERN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Idempotency-Key");
        }
        return key;
    }

    static String fingerprint(String cartPublicId, List<MarketplaceCheckoutDtos.CheckoutItemRequest> items) {
        StringBuilder canonical = new StringBuilder("cart=").append(cartPublicId);
        items.stream()
                .sorted(Comparator.comparing(MarketplaceCheckoutDtos.CheckoutItemRequest::cartItemId))
                .forEach(item -> canonical.append('|').append(item.cartItemId())
                        .append(':').append(item.quantity())
                        .append(':').append(item.unitPrice().stripTrailingZeros().toPlainString())
                        .append(':').append(item.currencyCode().trim().toUpperCase(Locale.ROOT)));
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(canonical.toString().getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }

    private static ResponseStatusException cartChanged() {
        return new CheckoutConflictException("Your cart changed. Review your cart and try again.");
    }

    private static String userPublicId(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String uid = jwt.getClaimAsString("uid");
        return uid == null || uid.isBlank() ? jwt.getSubject() : uid;
    }
}