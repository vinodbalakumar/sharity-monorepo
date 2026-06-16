package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import com.java.vinod.marketplace.service.repository.CustomerAcceptanceRepository;
import com.java.vinod.marketplace.service.repository.DeliverySubmissionRepository;
import com.java.vinod.marketplace.service.repository.DeliveryTypeMasterRepository;
import com.java.vinod.marketplace.service.repository.DisputeCaseRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.ListingStatusMasterRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCategoryRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceVerticalRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import com.java.vinod.marketplace.service.repository.ProductTypeMasterRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MarketplaceServiceVerticalTest {

    @Test
    void applyListingRequestDefaultsAndNormalizesVerticalCode() throws Exception {
        MarketplaceService service = newService();
        Listing listing = new Listing();
        MarketplaceDtos.ListingRequest request = new MarketplaceDtos.ListingRequest(
                "Fresh Grocery Basket",
                "Local essentials",
                "PANTRY",
                "PHYSICAL",
                "SHIPPING",
                "NATIONAL",
                "USD",
                BigDecimal.valueOf(12.50),
                "provider-public-id",
                "USA",
                "https://example.com/image.png",
                "ACTIVE",
                " marketplace ",
                1);

        invoke(service, "applyListingRequest", new Class<?>[] { Listing.class, MarketplaceDtos.ListingRequest.class }, listing, request);

        assertThat(listing.getVerticalCode()).isEqualTo("MARKETPLACE");
    }

    @Test
    void responseMappingIncludesVerticalCode() throws Exception {
        MarketplaceService service = newService();
        Listing listing = new Listing();
        listing.setPublicId("listing-public-id");
        listing.setTitle("Marketplace Headset");
        listing.setDescription("Low-latency headset");
        listing.setProductType("PHYSICAL");
        listing.setDeliveryType("SHIPPING");
        listing.setCurrencyCode("USD");
        listing.setPriceAmount(BigDecimal.valueOf(49.99));
        listing.setOriginalPriceAmount(BigDecimal.valueOf(59.99));
        listing.setImageUrl("https://example.com/headset.png");
        listing.setSellerDisplayName("Nova Store");
        listing.setVerifiedSeller(true);
        listing.setCategoryCode("ELECTRONICS");
        listing.setVerticalCode("MARKETPLACE");
        listing.setListingStatus("ACTIVE");
        listing.setCreatedAt(LocalDateTime.now());

        MarketplaceDtos.ListingResponse response = (MarketplaceDtos.ListingResponse) invoke(service,
                "toListingResponse", new Class<?>[] { Listing.class }, listing);

        assertThat(response.verticalCode()).isEqualTo("MARKETPLACE");
    }

    @Test
    void categoryResponseIncludesVerticalCode() throws Exception {
        MarketplaceService service = newService();
        MarketplaceCategory category = new MarketplaceCategory();
        category.setId(1L);
        category.setCategoryCode("GROCERY");
        category.setCategoryName("Grocery");
        category.setCategorySlug("grocery");
        category.setVerticalCode("GROCERY");
        category.setIconRef("shopping_basket_outlined");
        category.setActive(true);

        MarketplaceDtos.CategoryResponse response = (MarketplaceDtos.CategoryResponse) invoke(service,
                "toCategoryResponse", new Class<?>[] { MarketplaceCategory.class }, category);

        assertThat(response.verticalCode()).isEqualTo("GROCERY");
    }

    @Test
    void activeVerticalsReturnsSupportedCommerceVerticalsInOrder() {
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        when(verticalRepository.findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc("ACTIVE"))
                .thenReturn(List.of(vertical("MARKETPLACE", "Marketplace", 10), vertical("GROCERY", "Grocery", 20),
                        vertical("MEAT_SHOP", "Meat Shop", 30), vertical("PHARMACY", "Pharmacy", 40),
                        vertical("AUTOMOTIVE", "Automotive", 50), vertical("JEWELLERY", "One Gram Gold & Imitation Jewellery", 60),
                        vertical("GIFT_CARDS", "Gift Cards", 70)));
        MarketplaceService service = new MarketplaceService(
                mock(ListingRepository.class),
                mock(ListingStatusMasterRepository.class),
                mock(MarketplaceCategoryRepository.class),
                verticalRepository,
                mock(ProductTypeMasterRepository.class),
                mock(DeliveryTypeMasterRepository.class),
                mock(OrderHeaderRepository.class),
                mock(DeliverySubmissionRepository.class),
                mock(CustomerAcceptanceRepository.class),
                mock(DisputeCaseRepository.class),
                mock(MarketplaceEventOutboxService.class),
                mockCurrencyService(),
                "http://authorization-server:8080/authorization-server/api/internal/providers",
                "http://payment-service:8080/payment-service",
                "test-token");

        List<MarketplaceDtos.VerticalResponse> response = service.activeVerticals();

        assertThat(response).extracting(MarketplaceDtos.VerticalResponse::moduleCode)
                .containsExactly("MARKETPLACE", "GROCERY", "MEAT_SHOP", "PHARMACY", "AUTOMOTIVE", "JEWELLERY", "GIFT_CARDS");
        assertThat(response).allSatisfy(vertical -> assertThat(vertical.status()).isEqualTo("ACTIVE"));
    }

    private static MarketplaceService newService() {
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        when(verticalRepository.existsByModuleCodeIgnoreCase("MARKETPLACE")).thenReturn(true);
        ProductTypeMasterRepository productTypeRepository = mock(ProductTypeMasterRepository.class);
        when(productTypeRepository.existsByProductTypeCodeIgnoreCaseAndActiveTrue("PHYSICAL")).thenReturn(true);
        when(productTypeRepository.existsByProductTypeCodeIgnoreCaseAndActiveTrue("DIGITAL")).thenReturn(true);
        DeliveryTypeMasterRepository deliveryTypeRepository = mock(DeliveryTypeMasterRepository.class);
        when(deliveryTypeRepository.existsByDeliveryTypeCodeIgnoreCaseAndActiveTrue("SHIPPING")).thenReturn(true);
        when(deliveryTypeRepository.existsByDeliveryTypeCodeIgnoreCaseAndActiveTrue("DIGITAL")).thenReturn(true);
        return new MarketplaceService(
                mock(ListingRepository.class),
                mock(ListingStatusMasterRepository.class),
                mock(MarketplaceCategoryRepository.class),
                verticalRepository,
                productTypeRepository,
                deliveryTypeRepository,
                mock(OrderHeaderRepository.class),
                mock(DeliverySubmissionRepository.class),
                mock(CustomerAcceptanceRepository.class),
                mock(DisputeCaseRepository.class),
                mock(MarketplaceEventOutboxService.class),
                mockCurrencyService(),
                "http://authorization-server:8080/authorization-server/api/internal/providers",
                "http://payment-service:8080/payment-service",
                "test-token");
    }

    private static MarketplaceCurrencyService mockCurrencyService() {
        MarketplaceCurrencyService currencyService = mock(MarketplaceCurrencyService.class);
        when(currencyService.viewPrice(any(), any(), any(), any()))
                .thenAnswer(invocation -> {
                    BigDecimal amount = invocation.getArgument(0);
                    String currency = invocation.getArgument(1);
                    return new MarketplaceCurrencyService.CurrencyView(
                            currency,
                            amount == null ? null : amount.setScale(2, java.math.RoundingMode.HALF_UP));
                });
        when(currencyService.convert(any(), any(), any()))
                .thenAnswer(invocation -> {
                    BigDecimal amount = invocation.getArgument(0);
                    return amount == null ? null : amount.setScale(2, java.math.RoundingMode.HALF_UP);
                });
        return currencyService;
    }

    private static com.java.vinod.marketplace.service.entity.MarketplaceVertical vertical(String code, String name, int displayOrder) {
        com.java.vinod.marketplace.service.entity.MarketplaceVertical vertical =
                new com.java.vinod.marketplace.service.entity.MarketplaceVertical();
        vertical.setModuleCode(code);
        vertical.setModuleName(name);
        vertical.setDescription(name);
        vertical.setStatus("ACTIVE");
        vertical.setDisplayOrder(displayOrder);
        vertical.setIconKey("store");
        vertical.setModuleType("COMMERCE_VERTICAL");
        vertical.setFrontendRoute("/" + code.toLowerCase());
        vertical.setApiAudience(code + "_API");
        vertical.setCustomerAccessEnabled(true);
        vertical.setProviderAccessEnabled(true);
        vertical.setRequiresProviderApproval(true);
        vertical.setAvailableToCustomer(true);
        vertical.setProviderAccessActive(true);
        return vertical;
    }

    private static Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... args) throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName, parameterTypes);
        method.setAccessible(true);
        return method.invoke(target, args);
    }
}
