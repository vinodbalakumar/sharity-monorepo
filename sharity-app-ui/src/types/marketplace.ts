export type MarketplaceVertical = {
  moduleCode: string;
  moduleName: string;
  description: string;
  status: string;
  displayOrder: number;
  iconKey?: string;
  imageUrl?: string | null;
  imageKeys?: string | null;
  frontendRoute?: string;
  availableToCustomer: boolean;
  customerAccessEnabled: boolean;
  providerAccessEnabled?: boolean;
  requiresProviderApproval?: boolean;
  providerAccessActive?: boolean;
};

export type MarketplaceCategory = {
  id: number;
  code: string;
  name: string;
  slug: string;
  verticalCode: string;
  countryCode: string | null;
  iconRef: string | null;
  imageUrl?: string | null;
  active: boolean;
};

export type MarketplaceReview = {
  reviewId: string;
  listingPublicId: string;
  reviewerDisplayName: string;
  title: string;
  body: string;
  rating: number;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type MarketplaceListing = {
  publicId: string;
  title: string;
  description: string;
  productType: string;
  deliveryType: string;
  currencyCode: string;
  priceAmount: number;
  originalPriceAmount: number | null;
  imageUrl: string | null;
  sellerDisplayName: string;
  verifiedSeller: boolean;
  categoryCode: string;
  verticalCode: string;
  providerCountryCode: string;
  listingStatus: string;
  conditionLabel: string | null;
  stockQuantity: number | null;
  sourceType: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  licenseNote: string | null;
  demoSeed: boolean;
  publicReviews: MarketplaceReview[];
  createdAt: string;
  displayCurrencyCode?: string | null;
  displayPriceAmount?: number | null;
  displayOriginalPriceAmount?: number | null;
};

export type MarketplaceHomeResponse = {
  verticals: MarketplaceVertical[];
  categories: MarketplaceCategory[];
  featuredListings: MarketplaceListing[];
  topCategories?: MarketplaceCategoryHighlight[];
  discountedSubcategories?: SubcategoryHighlight[];
  topRatedSellers?: SellerHighlight[];
};

export type MarketplaceCategoryHighlight = {
  categoryCode: string;
  categoryName: string;
  slug: string;
  verticalCode: string;
  iconRef: string | null;
  imageUrl: string | null;
  soldCount: number;
  activeCount: number;
  maxDiscountPercent: number;
};

export type SubcategoryHighlight = {
  subcategoryCode: string;
  subcategoryName: string;
  categoryName: string;
  verticalCode: string;
  discountPercentage: number;
  listingImageUrl: string | null;
  listingTitle: string;
  originalPrice: number;
  discountedPrice: number;
  currencyCode: string;
};

export type SellerHighlight = {
  sellerPublicId: string;
  sellerName: string;
  sellerRating: number;
  completedOrders: number;
  listings: MarketplaceListing[];
};
