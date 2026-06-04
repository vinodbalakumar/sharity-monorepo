package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import com.java.vinod.marketplace.service.repository.CustomerAcceptanceRepository;
import com.java.vinod.marketplace.service.repository.DeliverySubmissionRepository;
import com.java.vinod.marketplace.service.repository.DisputeCaseRepository;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCategoryRepository;
import com.java.vinod.marketplace.service.repository.OrderHeaderRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

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
                "USD",
                BigDecimal.valueOf(12.50),
                "provider-public-id",
                "USA",
                "https://example.com/image.png",
                "ACTIVE",
                " grocery ");

        invoke(service, "applyListingRequest", new Class<?>[] { Listing.class, MarketplaceDtos.ListingRequest.class }, listing, request);

        assertThat(listing.getVerticalCode()).isEqualTo("GROCERY");
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
        MarketplaceService service = newService();

        List<MarketplaceDtos.VerticalResponse> response = service.activeVerticals();

        assertThat(response).extracting(MarketplaceDtos.VerticalResponse::moduleCode)
                .containsExactly("MARKETPLACE", "GROCERY", "MEAT_SHOP", "PHARMACY", "AUTOMOTIVE", "GIFT_CARDS");
        assertThat(response).allSatisfy(vertical -> assertThat(vertical.status()).isEqualTo("ACTIVE"));
    }

    private static MarketplaceService newService() {
        return new MarketplaceService(
                mock(ListingRepository.class),
                mock(MarketplaceCategoryRepository.class),
                mock(OrderHeaderRepository.class),
                mock(DeliverySubmissionRepository.class),
                mock(CustomerAcceptanceRepository.class),
                mock(DisputeCaseRepository.class),
                mock(MarketplaceEventOutboxService.class),
                "http://authorization-server:8080/authorization-server/api/internal/providers",
                "http://payment-service:8080/payment-service",
                "test-token");
    }

    private static Object invoke(Object target, String methodName, Class<?>[] parameterTypes, Object... args) throws Exception {
        Method method = target.getClass().getDeclaredMethod(methodName, parameterTypes);
        method.setAccessible(true);
        return method.invoke(target, args);
    }
}
