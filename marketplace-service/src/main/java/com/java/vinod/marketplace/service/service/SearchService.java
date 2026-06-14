package com.java.vinod.marketplace.service.service;

import com.java.vinod.marketplace.service.dto.SearchExploreDtos;
import com.java.vinod.marketplace.service.entity.Listing;
import com.java.vinod.marketplace.service.entity.MarketplaceCategory;
import com.java.vinod.marketplace.service.entity.MarketplaceVertical;
import com.java.vinod.marketplace.service.repository.ListingRepository;
import com.java.vinod.marketplace.service.repository.ListingStatusMasterRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceCategoryRepository;
import com.java.vinod.marketplace.service.repository.MarketplaceVerticalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {
    private final ListingRepository listingRepository;
    private final MarketplaceCategoryRepository categoryRepository;
    private final MarketplaceVerticalRepository verticalRepository;
    private final ListingStatusMasterRepository listingStatusMasterRepository;

    private static final int DEFAULT_PAGE_SIZE = 24;

    private List<String> activeListingStatuses() {
        List<String> statuses = listingStatusMasterRepository.findByActiveTrueOrderBySortOrderAscDisplayLabelAsc()
                .stream()
                .map(status -> status.getStatusCode())
                .toList();
        return statuses.isEmpty() ? List.of("ACTIVE", "PUBLISHED") : statuses;
    }

    public SearchExploreDtos.SearchResultsResponse search(String query, String verticalCode,
                                                          String categoryCode, String countryCode, int page) {
        Pageable pageable = PageRequest.of(page, DEFAULT_PAGE_SIZE);

        List<Listing> results = listingRepository.searchActiveListings(
            activeListingStatuses(),
            query != null ? query : "",
            categoryCode,
            verticalCode,
            countryCode,
            pageable
        );

        List<SearchExploreDtos.SearchResultItem> items = results.stream()
            .map(this::mapToSearchResult)
            .collect(Collectors.toList());

        return new SearchExploreDtos.SearchResultsResponse(
            query,
            filters(verticalCode, categoryCode, countryCode),
            "DIGITAL_FIRST",
            items.size(),
            List.of("DIGITAL_PRODUCTS", "STORES", "COUPONS", "SPONSORED_PLACEHOLDER"),
            items,
            "1 result hidden because restricted inventory must not leak.",
            alternatives(),
            page,
            DEFAULT_PAGE_SIZE
        );
    }

    public List<SearchExploreDtos.SearchSuggestionItem> suggestions(String query, String countryCode) {
        if (query == null || query.isBlank()) {
            return getPopularSuggestions();
        }

        Pageable pageable = PageRequest.of(0, 5);
        List<Listing> matches = listingRepository.searchActiveListings(
            activeListingStatuses(),
            query,
            null,
            null,
            countryCode,
            pageable
        );

        return matches.stream()
            .map(listing -> new SearchExploreDtos.SearchSuggestionItem(
                listing.getPublicId(),
                "LISTING",
                listing.getTitle(),
                listing.getVerticalCode(),
                listing.getCategoryCode(),
                listing.getImageUrl(),
                "AVAILABLE",
                null,
                "/listing/" + listing.getPublicId()
            ))
            .collect(Collectors.toList());
    }

    public List<SearchExploreDtos.SearchCategoryResult> getCategories(String verticalCode, String countryCode) {
        List<MarketplaceCategory> categories;

        if (verticalCode != null && countryCode != null) {
            categories = categoryRepository.findByActiveTrueAndVerticalCodeAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(verticalCode, countryCode);
        } else if (verticalCode != null) {
            categories = categoryRepository.findByActiveTrueAndVerticalCodeAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc(verticalCode);
        } else if (countryCode != null) {
            categories = categoryRepository.findByActiveTrueAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(countryCode);
        } else {
            categories = categoryRepository.findByActiveTrueAndCountryCodeIsNullOrderByDisplayOrderAscCategoryNameAsc();
        }

        return categories.stream()
            .map(category -> new SearchExploreDtos.SearchCategoryResult(
                category.getVerticalCode(),
                category.getCategoryCode(),
                category.getCategoryName(),
                category.getIconRef(),
                0,
                "AVAILABLE",
                null,
                "/search/category/" + category.getCategoryCode()
            ))
            .collect(Collectors.toList());
    }

    public List<SearchExploreDtos.PopularSearchItem> getPopularSearches() {
        return List.of(
            new SearchExploreDtos.PopularSearchItem("popular-1", "Digital Games", "DIGITAL", null,
                "Popular in your country", "/search/results?q=digital%20games"),
            new SearchExploreDtos.PopularSearchItem("popular-2", "Software Keys", "DIGITAL", null,
                "Popular in your country", "/search/results?q=software%20keys"),
            new SearchExploreDtos.PopularSearchItem("popular-3", "Imitation Jewelry", "JEWELLERY", null,
                "Popular in your country", "/search/results?q=jewellery")
        );
    }

    public SearchExploreDtos.SearchDashboardResponse getDashboard(String countryCode) {
        return new SearchExploreDtos.SearchDashboardResponse(
            marketplaceHighlights(countryCode),
            recentSearches(),
            getPopularSearches(),
            marketplaceHighlights(countryCode),
            getCategories(null, countryCode),
            savedSearches(),
            "/history",
            List.of(
                "SEARCH", "APPLY_FILTERS", "CLEAR_FILTERS", "SORT_RESULTS", "OPEN_LISTING",
                "OPEN_STORE", "SAVE_SEARCH", "CLEAR_RECENT_SEARCH", "VIEW_CATEGORY",
                "VIEW_MARKETPLACE", "MOVE_ELIGIBLE_ITEM_TO_CART", "BACK"
            )
        );
    }

    private SearchExploreDtos.SearchResultItem mapToSearchResult(Listing listing) {
        return new SearchExploreDtos.SearchResultItem(
            listing.getPublicId(),
            "LISTING",
            new SearchExploreDtos.SearchListingResult(
                listing.getPublicId(),
                listing.getProviderAccountPublicId(),
                listing.getTitle(),
                listing.getImageUrl(),
                listing.getVerticalCode(),
                listing.getCategoryCode(),
                null,
                listing.getProductType(),
                listing.getPriceAmount() != null ? listing.getPriceAmount().toPlainString() : null,
                listing.getCurrencyCode(),
                listing.getListingStatus(),
                new SearchExploreDtos.SearchStoreResult(
                    listing.getProviderAccountPublicId(),
                    listing.getSellerDisplayName(),
                    listing.getImageUrl(),
                    listing.isVerifiedSeller(),
                    List.of(listing.getVerticalCode()),
                    List.of(listing.getCategoryCode()),
                    listing.getProviderCountryCode(),
                    0,
                    "Reviews later",
                    true,
                    "/store/" + listing.getProviderAccountPublicId()
                ),
                listing.isVerifiedSeller(),
                true,
                "Reviews later",
                "/listing/" + listing.getPublicId()
            ),
            null,
            null,
            null,
            null,
            null,
            null,
            "Digital-first match",
            List.of("OPEN_LISTING", "SAVE", "MOVE_TO_CART")
        );
    }

    private List<SearchExploreDtos.SearchSuggestionItem> getPopularSuggestions() {
        return List.of(
            new SearchExploreDtos.SearchSuggestionItem("suggestion-1", "POPULAR", "Steam Game Keys",
                "DIGITAL", "GIFT_CARDS", "marketplace/icons/gift-card.png", "AVAILABLE", null, "/search/results?q=steam%20game%20keys"),
            new SearchExploreDtos.SearchSuggestionItem("suggestion-2", "POPULAR", "Microsoft Office",
                "DIGITAL", "SOFTWARE", "marketplace/icons/software.png", "AVAILABLE", null, "/search/results?q=microsoft%20office"),
            new SearchExploreDtos.SearchSuggestionItem("suggestion-3", "POPULAR", "Adobe Creative Suite",
                "DIGITAL", "SOFTWARE", "marketplace/icons/software.png", "AVAILABLE", null, "/search/results?q=adobe%20creative%20suite"),
            new SearchExploreDtos.SearchSuggestionItem("suggestion-4", "POPULAR", "Gold Jewelry",
                "JEWELLERY", "JEWELLERY", "marketplace/icons/jewellery.png", "AVAILABLE", null, "/search/results?q=gold%20jewelry")
        );
    }

    private List<SearchExploreDtos.RecentSearchItem> recentSearches() {
        return List.of(
            new SearchExploreDtos.RecentSearchItem("recent-1", "gift card", "DIGITAL", "GIFT_CARDS",
                "Digital, available, under 50 USD", java.time.LocalDateTime.now().minusHours(1),
                "/search/results?q=gift%20card")
        );
    }

    private List<SearchExploreDtos.SavedSearchItem> savedSearches() {
        return List.of(
            new SearchExploreDtos.SavedSearchItem("saved-search-1", "Digital deals", "digital",
                "Digital Marketplace, coupon eligible", "DIGITAL_FIRST", java.time.LocalDateTime.now().minusDays(2),
                "/search/saved/saved-search-1")
        );
    }

    private List<SearchExploreDtos.EmptyStateAlternative> alternatives() {
        return List.of(
            new SearchExploreDtos.EmptyStateAlternative("REMOVE_FILTERS", "Remove filters",
                "Try a broader search with fewer filters.", "Clear filters", "/search/results",
                new SearchExploreDtos.SearchFilterState("DIGITAL", null, null, null, null, "DIGITAL", "AVAILABLE",
                    null, null, "US", null, null, null, null))
        );
    }

    private List<SearchExploreDtos.SearchMarketplaceResult> marketplaceHighlights(String countryCode) {
        List<String> statuses = activeListingStatuses();
        return verticalRepository.findByStatusAndAvailableToCustomerTrueOrderByDisplayOrderAscModuleNameAsc("ACTIVE").stream()
                .map(vertical -> new SearchExploreDtos.SearchMarketplaceResult(
                        vertical.getModuleCode(),
                        vertical.getModuleName(),
                        iconForVertical(vertical),
                        vertical.getStatus(),
                        true,
                        vertical.isCustomerAccessEnabled(),
                        (int) listingRepository.countByListingStatusInAndVerticalCode(statuses, vertical.getModuleCode()),
                        null,
                        "/search/marketplace/" + vertical.getModuleCode()))
                .toList();
    }

    private SearchExploreDtos.SearchFilterState filters(String verticalCode, String categoryCode, String countryCode) {
        return new SearchExploreDtos.SearchFilterState(
            verticalCode != null ? verticalCode : "DIGITAL",
            categoryCode,
            null,
            "0",
            "50",
            "DIGITAL",
            "AVAILABLE",
            null,
            true,
            countryCode != null ? countryCode : "US",
            true,
            "SECURE_REVEAL",
            null,
            "LATER"
        );
    }

    private List<SearchExploreDtos.SearchCategoryResult> categoryHighlights(String countryCode) {
        List<String> statuses = activeListingStatuses();
        List<MarketplaceCategory> categories = countryCode == null || countryCode.isBlank()
                ? categoryRepository.findByActiveTrueOrderByDisplayOrderAscCategoryNameAsc()
                : categoryRepository.findByActiveTrueAndCountryCodeOrderByDisplayOrderAscCategoryNameAsc(countryCode.trim().toUpperCase());
        return categories.stream()
                .map(category -> new SearchExploreDtos.SearchCategoryResult(
                        category.getVerticalCode(),
                        category.getCategoryCode(),
                        category.getCategoryName(),
                        category.getIconRef(),
                        (int) listingRepository.countByListingStatusInAndCategoryCode(statuses, category.getCategoryCode()),
                        "AVAILABLE",
                        null,
                        "/search/category/" + category.getCategoryCode()))
                .toList();
    }

    private List<SearchExploreDtos.SearchMarketplaceResult> digitalDiscovery(String countryCode) {
        return marketplaceHighlights(countryCode);
    }

    private String iconForVertical(MarketplaceVertical vertical) {
        if (vertical.getIconKey() == null || vertical.getIconKey().isBlank()) {
            return "marketplace/icons/" + vertical.getModuleCode().toLowerCase() + ".png";
        }
        return "marketplace/icons/" + vertical.getIconKey() + ".png";
    }
}
