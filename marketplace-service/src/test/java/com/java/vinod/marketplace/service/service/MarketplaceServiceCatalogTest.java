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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.data.domain.PageRequest;

class MarketplaceServiceCatalogTest {

    @Test
    void homeReturnsVerticalsCategoriesAndFeaturedListings() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(categoryRepository.findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc()).thenReturn(List.of(category("GROCERY", "Grocery")));
        when(listingRepository.findTop8ByListingStatusInAndFeaturedTrueOrderByUpdatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        MarketplaceDtos.HomeResponse response = service.home();

        assertThat(response.verticals()).extracting(MarketplaceDtos.VerticalResponse::moduleCode)
                .containsExactly("MARKETPLACE", "GROCERY", "MEAT_SHOP", "PHARMACY", "AUTOMOTIVE", "GIFT_CARDS");
        assertThat(response.categories()).extracting(MarketplaceDtos.CategoryResponse::code)
                .containsExactly("GROCERY");
        assertThat(response.featuredListings()).extracting(MarketplaceDtos.ListingResponse::publicId)
                .containsExactly("GRO-1");
    }

    @Test
    void listingsCanBeFilteredByVertical() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.findTop24ByListingStatusInAndVerticalCodeOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED"), "GROCERY"))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("NEWEST", "GROCERY");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::verticalCode).containsExactly("GROCERY");
    }

    @Test
    void listingsCanBeFilteredByBrowserCountryCode() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.findTop24ByListingStatusInAndVerticalCodeAndProviderCountryCodeOrderByCreatedAtDesc(
                List.of("ACTIVE", "PUBLISHED"), "GROCERY", "USA"))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings("NEWEST", "GROCERY", "us");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::providerCountryCode).containsExactly("USA");
    }

    @Test
    void searchCanBeScopedByVerticalAndCategory() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(listingRepository.searchActiveListings(List.of("ACTIVE", "PUBLISHED"), "basket", "GROCERY", "GROCERY", "USA", PageRequest.of(0, 24)))
                .thenReturn(List.of(listing("GRO-1", "Fresh basket", "GROCERY")));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.ListingResponse> response = service.searchActiveListings("basket", "GROCERY", "NEWEST", "GROCERY", "us");

        assertThat(response).extracting(MarketplaceDtos.ListingResponse::publicId).containsExactly("GRO-1");
    }

    @Test
    void categoriesCanBeFilteredByVertical() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        when(categoryRepository.findByActiveTrueAndVerticalCodeOrderByDisplayOrderAscCategoryNameAsc("GROCERY"))
                .thenReturn(List.of(category("GROCERY", "Grocery")));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.CategoryResponse> response = service.activeCategories("GROCERY");

        assertThat(response).extracting(MarketplaceDtos.CategoryResponse::verticalCode).containsExactly("GROCERY");
    }

    @Test
    void publicListingResponsesExposeSyntheticSeedMetadata() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
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

        MarketplaceService service = newService(listingRepository, categoryRepository);

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
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("SEED-2", "   ", "GROCERY");
        listing.setSellerDisplayName("   ");
        listing.setSourceName("Sharity Seed Studio");
        listing.setProviderCountryCode("USA");
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        MarketplaceDtos.ListingResponse response = service.activeListings("NEWEST").getFirst();

        assertThat(response.title()).isEqualTo("Marketplace Listing");
        assertThat(response.sellerDisplayName()).isEqualTo("Sharity Seed Studio");
    }

    @Test
    void listingReviewsReturnPublicTrustSignalsForListing() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("REV-1", "Retail gift card bundle", "GIFT_CARDS");
        listing.setSellerDisplayName("RetailCard Vault");
        listing.setVerifiedSeller(true);
        when(listingRepository.findByPublicId("REV-1")).thenReturn(java.util.Optional.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.ListingReviewResponse> reviews = service.listingReviews("REV-1");

        assertThat(reviews).hasSizeGreaterThanOrEqualTo(2);
        assertThat(reviews).extracting(MarketplaceDtos.ListingReviewResponse::listingPublicId)
                .containsOnly("REV-1");
        assertThat(reviews).extracting(MarketplaceDtos.ListingReviewResponse::verifiedPurchase)
                .containsOnly(true);
    }

    @Test
    void listingResponsesIncludeEmbeddedPublicReviewsForBrowseAndDetailViews() {
        MarketplaceCategoryRepository categoryRepository = mock(MarketplaceCategoryRepository.class);
        ListingRepository listingRepository = mock(ListingRepository.class);
        Listing listing = listing("REV-1", "Retail gift card bundle", "GIFT_CARDS");
        listing.setSellerDisplayName("RetailCard Vault");
        listing.setVerifiedSeller(true);
        when(listingRepository.findTop24ByListingStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "PUBLISHED")))
                .thenReturn(List.of(listing));

        MarketplaceService service = newService(listingRepository, categoryRepository);

        List<MarketplaceDtos.ListingResponse> response = service.activeListings();

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().publicReviews()).hasSizeGreaterThanOrEqualTo(2);
        assertThat(response.getFirst().publicReviews()).extracting(MarketplaceDtos.ListingReviewResponse::listingPublicId)
                .containsOnly("REV-1");
    }

    private static MarketplaceService newService(ListingRepository listingRepository,
                                                 MarketplaceCategoryRepository categoryRepository) {
        return new MarketplaceService(
                listingRepository,
                categoryRepository,
                mock(OrderHeaderRepository.class),
                mock(DeliverySubmissionRepository.class),
                mock(CustomerAcceptanceRepository.class),
                mock(DisputeCaseRepository.class),
                mock(MarketplaceEventOutboxService.class),
                "http://authorization-server:8080/authorization-server/api/internal/providers",
                "http://payment-service:8080/payment-service",
                "test-token");
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
}
