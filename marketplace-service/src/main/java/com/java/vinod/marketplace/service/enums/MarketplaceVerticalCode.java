package com.java.vinod.marketplace.service.enums;

import com.java.vinod.marketplace.service.dto.MarketplaceDtos;

/**
 * Enumerates the supported commerce verticals that power the public browse and seller flows.
 *
 * <p>The enum provides the stable vertical identity shared by browse navigation,
 * catalog data, and future storefront-specific stories.</p>
 */
public enum MarketplaceVerticalCode {
    MARKETPLACE("MARKETPLACE", "Marketplace", "Protected resale and everyday commerce", 10, "store", "/marketplace", "MARKETPLACE_API", true, true, true),
    GROCERY("GROCERY", "Grocery", "Fresh pantry and household essentials", 20, "shopping_basket", "/grocery", "GROCERY_API", true, true, true),
    MEAT_SHOP("MEAT_SHOP", "Meat Shop", "Cut-to-order meats and seafood", 30, "set_meal", "/meat-shop", "MEAT_SHOP_API", true, true, true),
    PHARMACY("PHARMACY", "Pharmacy", "OTC wellness and personal-care goods", 40, "medical_services", "/pharmacy", "PHARMACY_API", true, true, true),
    AUTOMOTIVE("AUTOMOTIVE", "Automotive", "Accessories and maintenance products", 50, "directions_car", "/automotive", "AUTOMOTIVE_API", true, true, true),
    GIFT_CARDS("GIFT_CARDS", "Gift Cards", "Digital and value cards for popular brands", 60, "card_giftcard", "/gift-cards", "GIFT_CARD_API", true, true, true);

    private final String code;
    private final String displayName;
    private final String description;
    private final int displayOrder;
    private final String iconKey;
    private final String frontendRoute;
    private final String apiAudience;
    private final boolean customerAccessEnabled;
    private final boolean providerAccessEnabled;
    private final boolean requiresProviderApproval;

    MarketplaceVerticalCode(String code, String displayName, String description, int displayOrder, String iconKey,
                            String frontendRoute, String apiAudience, boolean customerAccessEnabled,
                            boolean providerAccessEnabled, boolean requiresProviderApproval) {
        this.code = code;
        this.displayName = displayName;
        this.description = description;
        this.displayOrder = displayOrder;
        this.iconKey = iconKey;
        this.frontendRoute = frontendRoute;
        this.apiAudience = apiAudience;
        this.customerAccessEnabled = customerAccessEnabled;
        this.providerAccessEnabled = providerAccessEnabled;
        this.requiresProviderApproval = requiresProviderApproval;
    }

    /**
     * Converts the vertical definition into the public API response used by the UI.
     */
    public MarketplaceDtos.VerticalResponse toResponse() {
        return new MarketplaceDtos.VerticalResponse(code, displayName, description, "ACTIVE", displayOrder, iconKey,
                "COMMERCE_VERTICAL", frontendRoute, apiAudience, customerAccessEnabled, providerAccessEnabled,
                requiresProviderApproval, customerAccessEnabled, providerAccessEnabled);
    }
}
