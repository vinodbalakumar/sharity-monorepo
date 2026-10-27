package com.java.vinod.marketplace.service.service;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.Duration;
import java.util.*;

@Service
public class StorefrontSectionService {
    static final Map<String,String> TITLES = Map.of("BEST_SELLING", "Best selling", "TRENDING", "Trending",
            "RECENTLY_VIEWED", "Recently viewed", "RECOMMENDED_DEALS", "Recommended deals for you",
            "FLASH_DEALS", "Flash Deals", "ALL_PRODUCTS", "All products");
    private final JdbcTemplate jdbc;
    private final Clock clock;
    @Autowired public StorefrontSectionService(JdbcTemplate jdbc) { this(jdbc, Clock.systemUTC()); }
    StorefrontSectionService(JdbcTemplate jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }
    public record Section(String code, String title, boolean enabled, int position, List<String> listingIds, Instant startsAt, Instant endsAt) {}
    public record Change(@NotNull Boolean enabled, @Size(max=12) List<@Size(max=80) String> listingIds, Instant startsAt, Instant endsAt) {}
    private static Instant instant(Timestamp value) { return value == null ? null : value.toInstant(); }
    private static final RowMapper<Section> ROW = (rs, index) -> {
        String code = rs.getString("section_code"); String ids = rs.getString("listing_ids");
        return new Section(code, TITLES.getOrDefault(code, code), rs.getBoolean("enabled"), rs.getInt("display_order"),
                ids == null || ids.isBlank() ? List.of() : List.of(ids.split(",")), instant(rs.getTimestamp("starts_at")), instant(rs.getTimestamp("ends_at")));
    };
    @Transactional(readOnly=true)
    public List<Section> settings() { return jdbc.query("SELECT * FROM storefront_section ORDER BY display_order, section_code", ROW); }
    @Transactional(readOnly=true)
    public List<Section> storefront() {
        return settings().stream().map(section -> {
            List<String> ids = List.of();
            if (section.enabled()) {
                if (section.code().equals("BEST_SELLING")) ids = salesSince(Instant.parse("1970-01-01T00:00:00Z"));
                if (section.code().equals("TRENDING")) ids = salesSince(clock.instant().minus(Duration.ofDays(7)));
                if (section.code().equals("FLASH_DEALS") && activeCampaign(section)) ids = eligibleDeals(section.listingIds());
            }
            // Disabled rows remain in the configuration, but never expose a product selection.
            return new Section(section.code(), section.title(), section.enabled(), section.position(), ids, section.startsAt(), section.endsAt());
        }).toList();
    }
    boolean activeCampaign(Section section) {
        Instant now = clock.instant();
        return section.startsAt() != null && section.endsAt() != null && !now.isBefore(section.startsAt()) && now.isBefore(section.endsAt());
    }
    private List<String> salesSince(Instant since) {
        return jdbc.queryForList("""
            SELECT l.public_id FROM order_header o JOIN listing l ON l.id=o.listing_id
            JOIN listing_status_master s ON s.status_code=l.listing_status
            WHERE s.active=TRUE AND s.customer_visible=TRUE AND l.stock_quantity>0
              AND o.payment_status IN ('CAPTURED','PAID','COMPLETED')
              AND o.order_status NOT IN ('CANCELLED','REFUNDED','REFUND_REQUESTED') AND o.created_at>=?
            GROUP BY l.public_id ORDER BY COUNT(o.id) DESC, MAX(o.created_at) DESC, l.public_id LIMIT 12
            """, String.class, Timestamp.from(since));
    }
    private List<String> eligibleDeals(List<String> ids) {
        if (ids.isEmpty()) return List.of();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        List<String> eligible = jdbc.queryForList("""
            SELECT l.public_id FROM listing l JOIN listing_status_master s ON s.status_code=l.listing_status
            WHERE s.active=TRUE AND s.customer_visible=TRUE AND l.stock_quantity>0
              AND l.original_price_amount>l.price_amount AND l.public_id IN (
            """ + placeholders + ")", String.class, ids.toArray());
        return ids.stream().filter(eligible::contains).toList();
    }
    @Transactional
    public Section update(String code, Change change) {
        if (!TITLES.containsKey(code)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Section not found");
        if (change.enabled() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        List<String> ids = change.listingIds() == null ? List.of() : change.listingIds().stream().distinct().toList();
        if (ids.size()>12 || ids.stream().anyMatch(id -> id == null || !id.matches("[A-Za-z0-9-]{1,80}"))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if (!code.equals("FLASH_DEALS") && (!ids.isEmpty() || change.startsAt()!=null || change.endsAt()!=null)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if ((change.startsAt()==null) != (change.endsAt()==null) || (change.startsAt()!=null && !change.endsAt().isAfter(change.startsAt()))) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a valid campaign window");
        if (!ids.isEmpty() && change.enabled() && (change.startsAt()==null || eligibleDeals(ids).size()!=ids.size())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose discounted available products and a campaign window");
        int updated = jdbc.update("UPDATE storefront_section SET enabled=?, listing_ids=?, starts_at=?, ends_at=?, updated_at=? WHERE section_code=?",
                change.enabled(), String.join(",",ids), change.startsAt()==null ? null : Timestamp.from(change.startsAt()), change.endsAt()==null ? null : Timestamp.from(change.endsAt()), Timestamp.from(clock.instant()), code);
        if (updated != 1) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return settings().stream().filter(section -> section.code().equals(code)).findFirst().orElseThrow();
    }
}
