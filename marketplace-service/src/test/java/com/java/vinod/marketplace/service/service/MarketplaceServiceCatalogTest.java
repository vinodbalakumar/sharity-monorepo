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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.data.domain.PageRequest;

class MarketplaceServiceCatalogTest {

    @Test
    void homeReturnsVerticalsCategoriesAndFeaturedListings() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(verticalRepository.findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc("ACTIVE"))
                .thenReturn(List.of(vertical("MARKETPLACE", "Marketplace", 10), vertical("GROCERY", "Grocery", 20),
                        vertical("MEAT_SHOP", "Meat Shop", 30), vertical("PHARMACY", "Pharmacy", 40),
                        vertical("AUTOMOTIVE", "Automotive", 50), vertical("JEWELLERY", "One Gram Gold & Imitation Jewellery", 60),
                        vertical("GIFT_CARDS", "Gift Cards", 70)));
        when(categoryRepository.findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc()).thenReturn(List.of(category("GROCERY", "Grocery")));
        when(listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(List.of("ACTIVE", "PUBLISHED", "SOLD")))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));
        when(listingRepository.findByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED", "SOLD")))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        MarketplaceDtos.HomeResponse response = service.home();

        assertThat(response.verticals()).extracting(MarketplaceDtos.VerticalResponse::moduleCode)
                .containsExactly("MARKETPLACE", "GROCERY", "MEAT_SHOP", "PHARMACY", "AUTOMOTIVE", "JEWELLERY", "GIFT_CARDS");
        assertThat(response.featuredListings()).extracting(MarketplaceDtos.ListingResponse::publicId)
                .containsExactly("GRO-1");
    }

    @Test
    void listingsCanBeFilteredByVertical() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED"), "GROCERY"))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("NEWEST", "GROCERY");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::verticalCode).containsExactly("GROCERY");
    }

    @Test
    void listingsCanBeSortedByHighestDiscount() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing smallerDiscount = listing("SMALL", "Smaller discount", "MARKETPLACE");
        smallerDiscount.setPriceAmount(BigDecimal.valueOf(80));
        smallerDiscount.setOriginalPriceAmount(BigDecimal.valueOf(100));
        Listing largerDiscount = listing("LARGE", "Larger discount", "MARKETPLACE");
        largerDiscount.setPriceAmount(BigDecimal.valueOf(50));
        largerDiscount.setOriginalPriceAmount(BigDecimal.valueOf(100));
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(smallerDiscount, largerDiscount));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("discount");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::publicId)
                .containsExactly("LARGE", "SMALL");
    }

    @Test
    void listingsCanBeFilteredByBrowserCountryCode() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.findTop24ByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(
                List.of("ACTIVE", "PUBLISHED"), "GROCERY", "USA"))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("NEWEST", "GROCERY", "us");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::providerCountryCode).containsExactly("USA");
    }

    @Test
    void searchCanBeScopedByVerticalAndCategory() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.searchActiveListings(List.of("ACTIVE", "PUBLISHED"), "basket", "GROCERY", "GROCERY", "USA", PageRequest.of(0, 24)))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.searchActiveListings("basket", "GROCERY", "NEWEST", "GROCERY", "us");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::publicId).containsExactly("GRO-1");
    }

    @Test
    void categoriesCanBeFilteredByVertical() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(categoryRepository.findByActiveTrueAndVerticalCodeOrderByDisplayOrderAscCategoryNameAsc("GROCERY"))
                .thenReturn(List.of(category("GROCERY", "Grocery")));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.CategoryResponse> response = service.activeCategories("GROCERY");

        assertThat(response).extracting(MarketplaceDtos.CategoryResponse::verticalCode).containsExactly("GROCERY");
    }

    @Test
    void publicListingResponsesExposeSyntheticSeedMetadata() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing seedListing = listing("SEED-1", "Synthetic pantry bundle", "GROCERY", "PUBLISHED");
        seedListing.setConditionLabel("NEW");
        seedListing.setStockQuantity(6);
        seedListing.setSourceType("SYNTHETIC");
        seedListing.setSourceName("Sharity Seed Studio");
        seedListing.setLicenseNote("Original synthetic catalog entry");
        seedListing.setDemoSeed(true);
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(seedListing));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("NEWEST");

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().conditionLabel()).isEqualTo("NEW");
        assertThat(response.getFirst().stockQuantity()).isEqualTo(6);
        assertThat(response.getFirst().sourceType()).isEqualTo("SYNTHETIC");
        assertThat(response.getFirst().sourceName()).isEqualTo("Sharity Seed Studio");
        assertThat(response.getFirst().licenseNote()).isEqualTo("Original synthetic catalog entry");
        assertThat(response.getFirst().demoSeed()).isTrue();
    }

    @Test
    void publicListingResponsesFallbackToSafeNamesWhenDbFieldsAreBlank() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("SEED-2", "   ", "GROCERY");
        listing.setSellerDisplayName("   ");
        listing.setSourceName("Sharity Seed Studio");
        listing.setProviderCountryCode("USA");
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        MarketplaceDtos.ListingResponse response = service.activeListings("NEWEST").getFirst();

        assertThat(response.title()).isEqualTo("Marketplace Listing");
        assertThat(response.sellerDisplayName()).isEqualTo("Sharity Seed Studio");
    }

    @Test
    void listingReviewsReturnEmptyUntilPersistedReviewsExist() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("REV-1", "Retail gift card bundle", "GIFT_CARDS");
        listing.setSellerDisplayName("RetailCard Vault");
        listing.setVerifiedSeller(true);
        when(listingRepository.findByPublicId("REV-1")).thenReturn(java.util.Optional.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingReviewResponse> reviews = service.listingReviews("REV-1");

        assertThat(reviews).isEmpty();
    }

    @Test
    void listingResponsesDoNotEmbedSyntheticPublicReviews() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        MarketplaceVerticalRepository verticalRepository = mock(MarketplaceVerticalRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("REV-1", "Retail gift card bundle", "GIFT_CARDS");
        listing.setSellerDisplayName("RetailCard Vault");
        listing.setVerifiedSeller(true);
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository, verticalRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings();

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().publicReviews()).isEmpty();
    }

    private static MarketplaceService newService(ListingRepository listingRepository,
                                                 MarketplaceCategoryRepository categoryRepository,
                                                 MarketplaceVerticalRepository verticalRepository) {
        return new MarketplaceService(
                listingRepository,
                mock(ListingStatusMasterRepository.class),
                categoryRepository,
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

    private static Listing listing(String publicId, String title, String verticalCode) {
        Listing listing = new Listing();
        listing.setPublicId(publicId);
        listing.setTitle(title);
        listing.setDescription(title + " description");
        listing.setProductType("PHYSICAL");
        listing.setDeliveryType("SHIPPING");
        listing.setCurrencyCode("USD");
        listing.setPriceAmount(BigDecimal.valueOf(24.99));
        listing.setVerticalCode(verticalCode);
        listing.setProviderCountryCode("USA");
        listing.setListingStatus("ACTIVE");
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        return listing;
    }

    private static Listing listing(String publicId, String title, String verticalCode, String status) {
        Listing listing = listing(publicId, title, verticalCode);
        listing.setListingStatus(status);
        return listing;
    }

    private static MarketplaceCategory category(String code, String name) {
        MarketplaceCategory category = new MarketplaceCategory();
        category.setId(1L);
        category.setCategoryCode(code);
        category.setCategoryName(name);
        category.setCategorySlug(name.toLowerCase());
        category.setVerticalCode(code);
        category.setIconRef("icon");
        category.setActive(true);
        return category;
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
}
