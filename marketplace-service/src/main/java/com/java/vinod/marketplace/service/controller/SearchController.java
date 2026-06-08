package com.java.vinod.marketplace.service.controller;

import com.java.vinod.marketplace.service.dto.SearchExploreDtos;
import com.java.vinod.marketplace.service.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {
    private final SearchService searchService;

    @GetMapping("/dashboard")
    public SearchExploreDtos.SearchDashboardResponse getDashboard(
        @RequestParam(required = false) String countryCode) {
        return searchService.getDashboard(countryCode);
    }

    @GetMapping("/results")
    public SearchExploreDtos.SearchResultsResponse search(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String vertical,
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String countryCode,
        @RequestParam(defaultValue = "0") int page) {
        return searchService.search(q, vertical, category, countryCode, page);
    }

    @GetMapping("/suggestions")
    public List<SearchExploreDtos.SearchSuggestionItem> suggestions(
        @RequestParam(required = false) String q,
        @RequestParam(required = false) String countryCode) {
        return searchService.suggestions(q, countryCode);
    }

    @GetMapping("/popular")
    public List<SearchExploreDtos.PopularSearchItem> popular() {
        return searchService.getPopularSearches();
    }

    @GetMapping("/categories")
    public List<SearchExploreDtos.SearchCategoryResult> getCategories(
        @RequestParam(required = false) String vertical,
        @RequestParam(required = false) String countryCode) {
        return searchService.getCategories(vertical, countryCode);
    }
}
