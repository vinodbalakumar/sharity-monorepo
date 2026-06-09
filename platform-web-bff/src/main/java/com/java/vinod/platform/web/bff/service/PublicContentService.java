package com.java.vinod.platform.web.bff.service;

import com.java.vinod.platform.web.bff.dto.PublicContentDtos;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Date;
import java.util.List;
import java.util.Locale;

@Service
public class PublicContentService {
    private static final String DEFAULT_LOCALE = "en-US";
    private static final String GLOBAL_COUNTRY = "GLOBAL";

    private final JdbcTemplate jdbcTemplate;

    public PublicContentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public PublicContentDtos.VisitorContextResponse context(VisitorCountryResolver.VisitorCountry country, String locale) {
        return new PublicContentDtos.VisitorContextResponse(
                country.countryCode(),
                country.countryName(),
                country.source(),
                country.supported(),
                normalizeLocale(locale),
                legalPolicyCodes()
        );
    }

    public PublicContentDtos.PublicContentPageResponse page(String slug, VisitorCountryResolver.VisitorCountry country, String locale) {
        List<ContentRow> rows = contentRows(slug, country.countryCode(), normalizeLocale(locale), false);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public content page not found");
        }
        ContentRow first = rows.getFirst();
        return new PublicContentDtos.PublicContentPageResponse(
                first.slug(),
                first.title(),
                first.category(),
                first.countryCode(),
                normalizeLocale(locale),
                first.version(),
                first.effectiveDate(),
                first.lastReviewedAt(),
                sections(rows)
        );
    }

    public PublicContentDtos.PublicLegalPolicyResponse policy(String policyCode, VisitorCountryResolver.VisitorCountry country, String locale) {
        List<ContentRow> rows = contentRows(policyCode, country.countryCode(), normalizeLocale(locale), true);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Public legal policy not found");
        }
        ContentRow first = rows.getFirst();
        return new PublicContentDtos.PublicLegalPolicyResponse(
                first.slug(),
                first.title(),
                first.countryCode(),
                normalizeLocale(locale),
                first.version(),
                first.effectiveDate(),
                first.lastReviewedAt(),
                sections(rows)
        );
    }

    private List<ContentRow> contentRows(String slug, String countryCode, String locale, boolean legalOnly) {
        String normalizedSlug = normalizeSlug(slug);
        List<ContentRow> exact = queryContentRows(normalizedSlug, normalizeCountry(countryCode), locale, legalOnly);
        if (!exact.isEmpty()) {
            return exact;
        }
        List<ContentRow> countryDefaultLocale = queryContentRows(normalizedSlug, normalizeCountry(countryCode), DEFAULT_LOCALE, legalOnly);
        if (!countryDefaultLocale.isEmpty()) {
            return countryDefaultLocale;
        }
        List<ContentRow> global = queryContentRows(normalizedSlug, GLOBAL_COUNTRY, locale, legalOnly);
        if (!global.isEmpty()) {
            return global;
        }
        return queryContentRows(normalizedSlug, GLOBAL_COUNTRY, DEFAULT_LOCALE, legalOnly);
    }

    private List<ContentRow> queryContentRows(String slug, String countryCode, String locale, boolean legalOnly) {
        String categoryFilter = legalOnly ? "AND category = 'Legal' " : "";
        return jdbcTemplate.query("""
                SELECT slug, title, category, country_code, version, effective_date, last_reviewed_at,
                       section_heading, section_body
                FROM public_content_page
                WHERE slug = ?
                  AND country_code = ?
                  AND locale = ?
                  AND approved = TRUE
                  AND enabled = TRUE
                """ + categoryFilter + """
                ORDER BY section_order
                """,
                (rs, rowNum) -> new ContentRow(
                        rs.getString("slug"),
                        rs.getString("title"),
                        rs.getString("category"),
                        rs.getString("country_code"),
                        rs.getString("version"),
                        isoDate(rs.getDate("effective_date")),
                        isoDate(rs.getDate("last_reviewed_at")),
                        rs.getString("section_heading"),
                        rs.getString("section_body")
                ),
                slug,
                countryCode,
                locale
        );
    }

    private List<String> legalPolicyCodes() {
        return jdbcTemplate.queryForList("""
                                SELECT slug
                                FROM (
                                        SELECT DISTINCT slug
                                        FROM public_content_page
                                        WHERE category = 'Legal'
                                            AND approved = TRUE
                                            AND enabled = TRUE
                                ) policies
                                ORDER BY CASE slug
                                        WHEN 'privacy' THEN 1
                                        WHEN 'terms' THEN 2
                                        WHEN 'guidelines' THEN 3
                                        ELSE 4
                                END, slug
                """, String.class);
    }

    private List<PublicContentDtos.ContentSection> sections(List<ContentRow> rows) {
        return rows.stream()
                .map(row -> new PublicContentDtos.ContentSection(row.sectionHeading(), List.of(row.sectionBody())))
                .toList();
    }

    private String normalizeSlug(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCountry(String value) {
        if (value == null || value.isBlank()) {
            return GLOBAL_COUNTRY;
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLocale(String value) {
        return value == null || value.isBlank() ? DEFAULT_LOCALE : value.trim();
    }

    private String isoDate(Date date) {
        return date == null ? null : date.toLocalDate().toString();
    }

    private record ContentRow(
            String slug,
            String title,
            String category,
            String countryCode,
            String version,
            String effectiveDate,
            String lastReviewedAt,
            String sectionHeading,
            String sectionBody
    ) {
    }
}
