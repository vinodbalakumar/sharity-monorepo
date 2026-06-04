import type {
  DownloadFilesResponse,
  EndRevealRequest,
  InvalidCodeReportRequest,
  LibraryIssueRequest,
  LibraryResponse,
  RevealCodeRequest,
  RevealCodeResponse,
  RevealPrepareResponse,
  SecureDownloadResponse,
  SupportTicketRequest
} from './libraryTypes';

const wait = (ms = 260) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBuyerLibrary(): Promise<LibraryResponse> {
  await wait();
  return {
    accessStatuses: [
      'ACCESS_READY',
      'DOWNLOAD_READY',
      'CODE_REVEAL_AVAILABLE',
      'PENDING_RISK_REVIEW',
      'SELLER_DELIVERY_PENDING',
      'ACCESS_GRANTED',
      'ACCESS_REVOKED',
      'REFUNDED',
      'EXPIRED',
      'DISPUTED'
    ],
    filters: ['All', 'Codes', 'Downloads', 'Subscriptions', 'Courses', 'Services', 'Access Ready', 'Pending Review', 'Refunded', 'Seller Delivery Pending'],
    items: [
      {
        accessId: 'access-code-psn-001',
        accessStatus: 'CODE_REVEAL_AVAILABLE',
        availableActions: ['REVEAL_CODE', 'VIEW_ORDER_DETAILS', 'REPORT_ISSUE', 'CONTACT_SUPPORT'],
        licenseSummary: 'Single-use digital redemption code. Refund review required after reveal.',
        maskedCodePreview: '****-****-****-8KQ2',
        orderId: 'SH-12345',
        productId: 'prod-psn-50',
        productImageUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=900&q=80',
        productTitle: 'PlayStation Store Digital Code',
        productType: 'GAMING_CODE',
        purchaseDate: '2026-06-03',
        refundStatus: 'Refund eligible until reveal',
        sellerDisplayName: 'Code Vault',
        sellerId: 'seller-code-vault'
      },
      {
        accessId: 'access-soft-002',
        accessStatus: 'ACCESS_READY',
        availableActions: ['REVEAL_CODE', 'VIEW_LICENSE', 'VIEW_ORDER_DETAILS', 'REPORT_ISSUE'],
        licenseSummary: 'One-device activation key with standard license terms.',
        maskedCodePreview: '****-****-****-ABCD',
        orderId: 'SH-12346',
        productId: 'prod-design-suite',
        productImageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
        productTitle: 'Design Suite Pro License Key',
        productType: 'SOFTWARE_KEY',
        purchaseDate: '2026-06-02',
        refundStatus: 'Refund review after reveal',
        sellerDisplayName: 'Studio Keys',
        sellerId: 'seller-studio-keys'
      },
      {
        accessId: 'access-download-003',
        accessStatus: 'DOWNLOAD_READY',
        availableActions: ['SECURE_DOWNLOAD', 'VIEW_FILES', 'VIEW_LICENSE', 'VIEW_ORDER_DETAILS', 'REPORT_ISSUE'],
        licenseSummary: 'Personal and commercial use for one buyer account.',
        orderId: 'SH-12347',
        productId: 'prod-template-kit',
        productImageUrl: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=80',
        productTitle: 'Marketplace UI Template Kit',
        productType: 'DOWNLOADABLE_FILE',
        purchaseDate: '2026-06-01',
        refundStatus: 'Refund review after first download',
        sellerDisplayName: 'Pixel Forge',
        sellerId: 'seller-pixel-forge'
      },
      {
        accessId: 'access-sub-004',
        accessStatus: 'ACCESS_GRANTED',
        availableActions: ['OPEN_ACCESS', 'VIEW_ORDER_DETAILS', 'CONTACT_SUPPORT'],
        licenseSummary: 'Monthly subscription access. Manage renewal from account settings.',
        orderId: 'SH-12348',
        productId: 'prod-cloud-sub',
        productImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=900&q=80',
        productTitle: 'Cloud Asset Library Subscription',
        productType: 'DIGITAL_SUBSCRIPTION',
        purchaseDate: '2026-05-28',
        refundStatus: 'Active subscription',
        sellerDisplayName: 'CloudShelf',
        sellerId: 'seller-cloudshelf'
      },
      {
        accessId: 'access-course-005',
        accessStatus: 'ACCESS_READY',
        availableActions: ['OPEN_COURSE', 'VIEW_ORDER_DETAILS', 'CONTACT_SUPPORT'],
        licenseSummary: 'Lifetime course access for this buyer account.',
        orderId: 'SH-12349',
        productId: 'prod-react-course',
        productImageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        productTitle: 'React Native Marketplace Course',
        productType: 'ONLINE_COURSE',
        purchaseDate: '2026-05-25',
        refundStatus: 'Refund window open',
        sellerDisplayName: 'Launch School',
        sellerId: 'seller-launch-school'
      },
      {
        accessId: 'access-service-006',
        accessStatus: 'SELLER_DELIVERY_PENDING',
        availableActions: ['VIEW_SERVICE_ORDER', 'CONTACT_SELLER', 'VIEW_REQUIREMENTS', 'VIEW_ORDER_DETAILS'],
        licenseSummary: 'Seller will deliver digital service files after requirements are confirmed.',
        orderId: 'SH-12350',
        productId: 'prod-logo-review',
        productImageUrl: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c3?auto=format&fit=crop&w=900&q=80',
        productTitle: 'Digital Brand Review Service',
        productType: 'DIGITAL_SERVICE_ORDER',
        purchaseDate: '2026-05-22',
        refundStatus: 'Seller delivery pending',
        sellerDisplayName: 'Brand Desk',
        sellerId: 'seller-brand-desk'
      },
      {
        accessId: 'access-gift-007',
        accessStatus: 'REFUNDED',
        availableActions: ['VIEW_ORDER_DETAILS', 'CONTACT_SUPPORT'],
        licenseSummary: 'Gift card access disabled after refund.',
        maskedCodePreview: '****-****-****-1QAZ',
        orderId: 'SH-12351',
        productId: 'prod-gift-card',
        productImageUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=900&q=80',
        productTitle: 'Digital Gift Card',
        productType: 'GIFT_CARD',
        purchaseDate: '2026-05-18',
        refundStatus: 'Refunded',
        sellerDisplayName: 'Gift Grid',
        sellerId: 'seller-gift-grid'
      }
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 7
    }
  };
}

export async function getLibraryItemDetails(accessId: string) {
  const library = await getBuyerLibrary();
  return library.items.find((item) => item.accessId === accessId) ?? null;
}

export async function prepareCodeReveal(accessId: string): Promise<RevealPrepareResponse> {
  await wait(180);
  return {
    accessId,
    message: 'Revealing this code may affect refund eligibility. Do you want to continue?',
    refundImpactWarning: 'This code has not been revealed yet. Refunds may require admin review after reveal.',
    requiresLocationConsent: true,
    revealAllowed: true,
    screenshotProtectionRequired: true,
    watermarkRequired: true
  };
}

export async function revealCode(accessId: string, request: RevealCodeRequest): Promise<RevealCodeResponse> {
  await wait(420);
  if (request.locationConsentStatus !== 'ACCEPTED') {
    throw new Error('LOCATION_CONSENT_DENIED');
  }

  return {
    accessId,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    maskedCode: '****-****-****-8KQ2',
    refundEligibilityAfterReveal: 'ADMIN_REVIEW_REQUIRED',
    revealId: `reveal-${accessId}-001`,
    revealedCode: accessId.includes('soft') ? 'SFTW-7HA9-PROD-ABCD' : 'PSN9-D8K2-LM4Q-8KQ2',
    watermarkText: `Sharity - Order SH-12345 - Buyer V***D - ${new Date().toLocaleString()}`
  };
}

export async function endRevealSession(accessId: string, revealId: string, request?: EndRevealRequest) {
  await wait(120);
  return {
    accessId,
    endReason: request?.endReason ?? 'USER_HIDDEN',
    revealId,
    status: 'ENDED'
  };
}

export async function getDownloadFiles(accessId: string): Promise<DownloadFilesResponse> {
  await wait(220);
  return {
    accessId,
    files: [
      {
        downloadStatus: 'READY',
        fileId: 'file-template-zip',
        fileName: 'marketplace-template-kit.zip',
        fileSize: '148 MB',
        fileType: 'ZIP',
        lastUpdated: '2026-06-01',
        licenseSummary: 'Includes source files, UI screens, and asset exports.',
        version: 'v1.2'
      },
      {
        downloadStatus: 'READY',
        fileId: 'file-license-pdf',
        fileName: 'license-and-usage-guide.pdf',
        fileSize: '1.8 MB',
        fileType: 'PDF',
        lastUpdated: '2026-05-31',
        licenseSummary: 'Buyer-safe license and permitted use details.',
        version: 'v1.0'
      },
      {
        downloadStatus: 'DOWNLOADED',
        fileId: 'file-preview-png',
        fileName: 'preview-gallery.png',
        fileSize: '6.4 MB',
        fileType: 'PNG',
        lastUpdated: '2026-05-30',
        licenseSummary: 'Preview image for quick inspection.',
        version: 'v1.0'
      }
    ],
    refundWarningRequired: true
  };
}

export async function prepareSecureDownload(accessId: string) {
  await wait(180);
  return {
    accessId,
    message: 'Downloading this file may affect refund eligibility.',
    rawUrlsExposed: false
  };
}

export async function startSecureDownload(accessId: string, fileId = 'file-template-zip'): Promise<SecureDownloadResponse> {
  await wait(360);
  return {
    accessId,
    downloadId: `download-${accessId}-001`,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    fileId,
    refundEligibilityAfterDownload: 'ADMIN_REVIEW_REQUIRED',
    signedUrl: 'mock-signed-download-url-hidden-from-ui'
  };
}

export async function reportInvalidCode(accessId: string, request: InvalidCodeReportRequest) {
  await wait(220);
  return {
    accessId,
    reasonCode: request.reasonCode,
    status: 'RECEIVED',
    ticketId: `invalid-code-${accessId}`
  };
}

export async function contactDigitalAccessSupport(request: SupportTicketRequest) {
  await wait(220);
  return {
    accessId: request.accessId,
    status: 'CREATED',
    supportTicketId: `support-${request.accessId}`
  };
}

export async function reportLibraryIssue(request: LibraryIssueRequest) {
  await wait(220);
  return {
    issueId: `issue-${request.accessId}`,
    status: 'RECEIVED'
  };
}
