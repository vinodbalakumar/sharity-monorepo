export type LibraryProductType =
  | 'DIGITAL_CODE'
  | 'GAMING_CODE'
  | 'SOFTWARE_KEY'
  | 'GIFT_CARD'
  | 'DIGITAL_SUBSCRIPTION'
  | 'DOWNLOADABLE_FILE'
  | 'ONLINE_COURSE'
  | 'DIGITAL_SERVICE_ORDER';

export type LibraryAccessStatus =
  | 'ACCESS_READY'
  | 'DOWNLOAD_READY'
  | 'CODE_REVEAL_AVAILABLE'
  | 'PENDING_RISK_REVIEW'
  | 'SELLER_DELIVERY_PENDING'
  | 'ACCESS_GRANTED'
  | 'ACCESS_REVOKED'
  | 'REFUNDED'
  | 'EXPIRED'
  | 'DISPUTED';

export type LibraryAction =
  | 'REVEAL_CODE'
  | 'SECURE_DOWNLOAD'
  | 'OPEN_ACCESS'
  | 'OPEN_COURSE'
  | 'VIEW_SERVICE_ORDER'
  | 'CONTACT_SELLER'
  | 'VIEW_REQUIREMENTS'
  | 'VIEW_FILES'
  | 'VIEW_LICENSE'
  | 'VIEW_ORDER_DETAILS'
  | 'CONTACT_SUPPORT'
  | 'REPORT_ISSUE';

export type LibraryFilter =
  | 'All'
  | 'Codes'
  | 'Downloads'
  | 'Subscriptions'
  | 'Courses'
  | 'Services'
  | 'Access Ready'
  | 'Pending Review'
  | 'Refunded'
  | 'Seller Delivery Pending';

export type LibraryItem = {
  accessId: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImageUrl: string;
  productType: LibraryProductType;
  sellerId: string;
  sellerDisplayName: string;
  purchaseDate: string;
  accessStatus: LibraryAccessStatus;
  refundStatus: string;
  maskedCodePreview?: string;
  licenseSummary: string;
  availableActions: LibraryAction[];
};

export type LibraryResponse = {
  items: LibraryItem[];
  filters: LibraryFilter[];
  accessStatuses: LibraryAccessStatus[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type RevealPrepareResponse = {
  accessId: string;
  revealAllowed: boolean;
  requiresLocationConsent: boolean;
  refundImpactWarning: string;
  screenshotProtectionRequired: boolean;
  watermarkRequired: boolean;
  message: string;
};

export type RevealCodeRequest = {
  locationConsentStatus: 'ACCEPTED' | 'DENIED';
  approxCountry?: string;
  approxState?: string;
  approxCity?: string;
  deviceId: string;
  sessionId: string;
  platform: string;
  appVersion: string;
};

export type RevealCodeResponse = {
  revealId: string;
  accessId: string;
  revealedCode: string;
  maskedCode: string;
  expiresAt: string;
  watermarkText: string;
  refundEligibilityAfterReveal: string;
};

export type SecureDownloadResponse = {
  downloadId: string;
  accessId: string;
  fileId?: string;
  signedUrl: string;
  expiresAt: string;
  refundEligibilityAfterDownload: string;
};

export type LibraryIssueRequest = {
  accessId: string;
  issueType: 'INVALID_CODE' | 'DOWNLOAD_FAILED' | 'WRONG_PRODUCT' | 'SELLER_ISSUE';
  message: string;
};

export type EndRevealRequest = {
  endReason: 'TIMER_EXPIRED' | 'USER_HIDDEN' | 'APP_BACKGROUND' | 'NAVIGATION_EXIT';
  endedAt: string;
};

export type DownloadFileItem = {
  fileId: string;
  fileName: string;
  fileType: 'PDF' | 'ZIP' | 'PNG' | 'JPG' | 'SVG' | 'FIG' | 'DOCX' | 'XLSX' | 'PPTX' | 'TXT' | 'MD' | 'JSON' | 'CSV' | 'MP3' | 'MP4';
  fileSize: string;
  version: string;
  lastUpdated: string;
  downloadStatus: 'READY' | 'DOWNLOADED' | 'EXPIRED' | 'BLOCKED';
  licenseSummary: string;
};

export type DownloadFilesResponse = {
  accessId: string;
  files: DownloadFileItem[];
  refundWarningRequired: boolean;
};

export type InvalidCodeReportRequest = {
  reasonCode: 'CODE_ALREADY_USED' | 'CODE_INVALID' | 'WRONG_PRODUCT' | 'REGION_LOCKED' | 'WRONG_INSTRUCTIONS' | 'OTHER';
  message: string;
  revealId?: string;
};

export type SupportTicketRequest = {
  accessId: string;
  orderId: string;
  productId: string;
  sellerId: string;
  revealId?: string;
  message: string;
};
