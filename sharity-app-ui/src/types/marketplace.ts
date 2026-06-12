export type MarketplaceVertical = {
  moduleCode: string;
  moduleName: string;
  description: string;
  status: string;
  displayOrder: number;
  iconKey?: string;
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
};

export type MarketplaceHomeResponse = {
  verticals: MarketplaceVertical[];
  categories: MarketplaceCategory[];
  featuredListings: MarketplaceListing[];
};
