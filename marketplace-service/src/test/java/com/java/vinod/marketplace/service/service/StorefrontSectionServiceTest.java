package com.java.vinod.marketplace.service.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class StorefrontSectionServiceTest {
    final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    final Instant now = Instant.parse("2026-10-27T12:00:00Z");
    final StorefrontSectionService service = new StorefrontSectionService(jdbc, Clock.fixed(now, ZoneOffset.UTC));
    StorefrontSectionService.Section campaign(Instant start, Instant end) {
        return new StorefrontSectionService.Section("FLASH_DEALS", "Flash Deals", true, 1, List.of("listing-1"), start, end);
    }
    @Test void campaignWindowIncludesStartAndExcludesEnd() {
        assertTrue(service.activeCampaign(campaign(now, now.plusSeconds(1))));
        assertFalse(service.activeCampaign(campaign(now.minusSeconds(1), now)));
        assertFalse(service.activeCampaign(campaign(now.plusSeconds(1), now.plusSeconds(2))));
        assertFalse(service.activeCampaign(campaign(null, null)));
    }
    @Test void rejectsUnknownSectionsAndInvalidCampaignsBeforeWriting() {
        assertThrows(ResponseStatusException.class, () -> service.update("UNKNOWN", new StorefrontSectionService.Change(true, List.of(), null, null)));
        assertThrows(ResponseStatusException.class, () -> service.update("FLASH_DEALS", new StorefrontSectionService.Change(true, List.of("listing-1"), null, null)));
        assertThrows(ResponseStatusException.class, () -> service.update("FLASH_DEALS", new StorefrontSectionService.Change(true, List.of(), now, now)));
        assertThrows(ResponseStatusException.class, () -> service.update("FLASH_DEALS", new StorefrontSectionService.Change(true, List.of("x');DELETE"), now, now.plusSeconds(10))));
        assertThrows(ResponseStatusException.class, () -> service.update("ALL_PRODUCTS", new StorefrontSectionService.Change(true, List.of("listing-1"), null, null)));
        verifyNoInteractions(jdbc);
    }
    @Test void disabledAndUnscheduledSectionsNeverQuerySalesOrDeals() {
        StorefrontSectionService spy = spy(service);
        doReturn(List.of(new StorefrontSectionService.Section("BEST_SELLING", "Best selling", false, 1, List.of(), null, null), campaign(null, null))).when(spy).settings();
        assertTrue(spy.storefront().stream().allMatch(s -> s.listingIds().isEmpty()));
        verifyNoInteractions(jdbc);
    }
    @Test void disabledCampaignCanBeSavedEvenWhenItsProductsAreUnavailable() {
        StorefrontSectionService spy = spy(service);
        var saved = campaign(now, now.plusSeconds(60));
        doReturn(List.of(saved)).when(spy).settings();
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        assertEquals(saved, spy.update("FLASH_DEALS", new StorefrontSectionService.Change(false, List.of("listing-1"), now, now.plusSeconds(60))));
        verify(jdbc).update(contains("UPDATE storefront_section"), any(Object[].class));
        verifyNoMoreInteractions(jdbc);
    }
}
