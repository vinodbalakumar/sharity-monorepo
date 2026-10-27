import { AuthenticationRequiredError, readApiErrorMessage } from '../../services/sessionService';
import { resolveMockImageUrl } from '../../utils/mockImages';
import type {
  DownloadFilesResponse,
  EndRevealRequest,
  InvalidCodeReportRequest,
  LibraryAccessStatus,
  LibraryIssueRequest,
  LibraryItem,
  LibraryProductType,
  LibraryResponse,
  RevealCodeRequest,
  RevealCodeResponse,
  RevealPrepareResponse,
  SecureDownloadResponse,
  SupportTicketRequest
} from './libraryTypes';

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';

type RawDigitalLibraryResponse = {
  items: RawDigitalLibraryItem[];
  updatedAt?: string;
};

type RawDigitalLibraryItem = {
  availableActions: string[];
  categoryCode: string;
  deliveryStatus: string;
  imageUrl: string;
  issueStatus: string;
  listingId: string;
  marketplaceCode: string;
  orderItemId: string;
  orderReference: string;
  productId: string;
  refundEligibilityWarning: string;
  revealAccessStatus: string;
  revealedAt?: string | null;
  route?: string;
  sellerStoreDisplayName: string;
  title: string;
};

type RawRevealEligibility = {
  acknowledgementRequired: boolean;
  eligible: boolean;
  payloadValidated: boolean;
  secureAccessAllowed: boolean;
  userSafeMessage: string;
};

type RawRevealResponse = {
  orderItemId: string;
  payload: {
    accessInstructions?: string | null;
    expiresAt?: string | null;
    maskedValue: string;
    revealedValue: string;
  };
  success: boolean;
  userSafeMessage: string;
};

function toIsoDate(value?: string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function formatDate(value?: string | null) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(toIsoDate(value)));
}

function parseOrderIdFromRoute(route?: string | null, orderReference?: string | null) {
  if (route) {
    const match = route.match(/\/orders\/([^/]+)/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return orderReference ?? '';
}

function mapProductType(item: RawDigitalLibraryItem): LibraryProductType {
  const category = item.categoryCode.toUpperCase();
  const title = item.title.toUpperCase();

  if (category.includes('LICENSE') || title.includes('LICENSE')) {
    return 'SOFTWARE_KEY';
  }
  if (category.includes('GAME') || title.includes('GAME')) {
    return 'GAMING_CODE';
  }
  if (category.includes('TEMPLATE') || title.includes('TEMPLATE')) {
    return 'DOWNLOADABLE_FILE';
  }
  if (title.includes('COURSE')) {
    return 'ONLINE_COURSE';
  }
  if (title.includes('SERVICE')) {
    return 'DIGITAL_SERVICE_ORDER';
  }
  if (title.includes('SUBSCRIPTION')) {
    return 'DIGITAL_SUBSCRIPTION';
  }
  if (title.includes('GIFT')) {
    return 'GIFT_CARD';
  }

  return 'DIGITAL_CODE';
}

function mapAccessStatus(item: RawDigitalLibraryItem): LibraryAccessStatus {
  const issueStatus = item.issueStatus.toUpperCase();
  const revealStatus = item.revealAccessStatus.toUpperCase();
  const deliveryStatus = item.deliveryStatus.toUpperCase();

  if (issueStatus.includes('ISSUE') || deliveryStatus.includes('ISSUE')) {
    return 'DISPUTED';
  }
  if (revealStatus === 'REVEALED' || deliveryStatus === 'REVEALED') {
    return 'ACCESS_GRANTED';
  }
  if (deliveryStatus.includes('READY') || revealStatus === 'NOT_REVEALED') {
    return item.availableActions.includes('REVEAL_ACCESS') ? 'CODE_REVEAL_AVAILABLE' : 'ACCESS_READY';
  }
  if (deliveryStatus.includes('PENDING')) {
    return 'SELLER_DELIVERY_PENDING';
  }

  return 'ACCESS_READY';
}

function mapAvailableActions(item: RawDigitalLibraryItem) {
  const actions = new Set<string>();

  for (const action of item.availableActions) {
    if (action === 'REVEAL_ACCESS') {
      actions.add('REVEAL_CODE');
    }
    if (action === 'VIEW_ORDER_DETAIL' || action === 'VIEW_DIGITAL_DELIVERY') {
      actions.add('VIEW_ORDER_DETAILS');
    }
    if (action === 'REPORT_ISSUE') {
      actions.add('REPORT_ISSUE');
    }
    if (action === 'CONTACT_SELLER') {
      actions.add('CONTACT_SELLER');
    }
    if (action === 'OPEN_SHARITY_REVIEW' || action === 'OPEN_REFUND_REQUEST') {
      actions.add('CONTACT_SUPPORT');
    }
  }

  if (mapProductType(item) === 'DOWNLOADABLE_FILE') {
    actions.add('SECURE_DOWNLOAD');
    actions.add('VIEW_FILES');
  }

  return Array.from(actions) as LibraryItem['availableActions'];
}

function mapLibraryItem(item: RawDigitalLibraryItem, fallbackDate?: string): LibraryItem {
  return {
    accessId: item.orderItemId,
    accessStatus: mapAccessStatus(item),
    availableActions: mapAvailableActions(item),
    licenseSummary: item.refundEligibilityWarning,
    maskedCodePreview: item.revealAccessStatus.toUpperCase() === 'REVEALED' ? 'XXXX-XXXX-7890' : 'XXXX-XXXX-****',
    orderId: parseOrderIdFromRoute(item.route, item.orderReference),
    productId: item.productId,
    productImageUrl: resolveMockImageUrl(item.imageUrl, 120),
    productTitle: item.title,
    productType: mapProductType(item),
    purchaseDate: formatDate(item.revealedAt ?? fallbackDate),
    refundStatus: item.refundEligibilityWarning,
    sellerDisplayName: item.sellerStoreDisplayName,
    sellerId: item.listingId
  };
}

async function parseJson<T>(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    const message = await readApiErrorMessage(response, fallbackMessage);
    if (response.status === 401) {
      throw new AuthenticationRequiredError(message);
    }
    throw new Error(message);
  }

  return await response.json() as T;
}

async function getRawLibrary(): Promise<RawDigitalLibraryResponse> {
  const response = await fetch(`${bffBaseUrl}/api/buyer/digital-library`, {
    credentials: 'include'
  });
  return await parseJson<RawDigitalLibraryResponse>(response, 'Failed to load digital library');
}

async function getRawLibraryItem(accessId: string): Promise<RawDigitalLibraryItem> {
  const response = await fetch(`${bffBaseUrl}/api/buyer/digital-library/items/${encodeURIComponent(accessId)}`, {
    credentials: 'include'
  });
  return await parseJson<RawDigitalLibraryItem>(response, 'Failed to load digital library item');
}

export async function getBuyerLibrary(): Promise<LibraryResponse> {
  const library = await getRawLibrary();
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
    items: library.items.map((item) => mapLibraryItem(item, library.updatedAt)),
    pagination: {
      page: 1,
      pageSize: library.items.length || 20,
      total: library.items.length
    }
  };
}

export async function getLibraryItemDetails(accessId: string) {
  const item = await getRawLibraryItem(accessId);
  return mapLibraryItem(item);
}

export async function prepareCodeReveal(accessId: string): Promise<RevealPrepareResponse> {
  const item = await getLibraryItemDetails(accessId);
  const response = await fetch(`${bffBaseUrl}/api/buyer/orders/${encodeURIComponent(item.orderId)}/digital-delivery/items/${encodeURIComponent(accessId)}/eligibility`, {
    credentials: 'include'
  });
  const eligibility = await parseJson<RawRevealEligibility>(response, 'Failed to load reveal eligibility');
  return {
    accessId,
    message: eligibility.userSafeMessage,
    refundImpactWarning: item.refundStatus,
    requiresLocationConsent: eligibility.acknowledgementRequired,
    revealAllowed: eligibility.eligible,
    screenshotProtectionRequired: true,
    watermarkRequired: eligibility.secureAccessAllowed && eligibility.payloadValidated
  };
}

export async function revealCode(accessId: string, request: RevealCodeRequest): Promise<RevealCodeResponse> {
  const item = await getLibraryItemDetails(accessId);

  const acknowledgement = {
    buyerAcknowledgedIssueReportPath: true,
    buyerAcknowledgedNoChatCodeSharing: true,
    buyerAcknowledgedRefundEligibilityMayChange: true,
    buyerAcknowledgedRevealLogged: true,
    buyerAcknowledgedSharitySecureDelivery: true
  };

  const acknowledgeResponse = await fetch(`${bffBaseUrl}/api/buyer/orders/${encodeURIComponent(item.orderId)}/digital-delivery/items/${encodeURIComponent(accessId)}/acknowledge-reveal`, {
    body: JSON.stringify(acknowledgement),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  await parseJson(acknowledgeResponse, 'Failed to acknowledge reveal warnings');

  const response = await fetch(`${bffBaseUrl}/api/buyer/orders/${encodeURIComponent(item.orderId)}/digital-delivery/items/${encodeURIComponent(accessId)}/reveal`, {
    body: JSON.stringify({ acknowledgement, revealSessionId: request.sessionId }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  const body = await parseJson<RawRevealResponse>(response, 'Failed to reveal digital access');

  return {
    accessId,
    expiresAt: toIsoDate(body.payload.expiresAt),
    maskedCode: body.payload.maskedValue,
    refundEligibilityAfterReveal: item.refundStatus,
    revealId: `${accessId}-${request.sessionId}`,
    revealedCode: body.payload.revealedValue,
    watermarkText: `Sharity - Order ${item.orderId} - ${request.approxCity ?? 'Protected'} - ${new Date().toLocaleString()}`
  };
}

export async function endRevealSession(accessId: string, revealId: string, request?: EndRevealRequest) {
  return {
    accessId,
    endReason: request?.endReason ?? 'USER_HIDDEN',
    revealId,
    status: 'ENDED'
  };
}

export async function getDownloadFiles(accessId: string): Promise<DownloadFilesResponse> {
  const item = await getLibraryItemDetails(accessId);
  return {
    accessId,
    files: [
      {
        downloadStatus: 'READY',
        fileId: `${accessId}-primary`,
        fileName: `${item.productTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`,
        fileSize: 'Protected',
        fileType: 'ZIP',
        lastUpdated: item.purchaseDate,
        licenseSummary: item.licenseSummary,
        version: 'v1.0'
      }
    ],
    refundWarningRequired: true
  };
}

export async function prepareSecureDownload(accessId: string) {
  const item = await getLibraryItemDetails(accessId);
  return {
    accessId,
    message: `Secure download for ${item.productTitle} is still using a protected placeholder flow because the backend download-file contract is not available yet.`,
    rawUrlsExposed: false
  };
}

export async function startSecureDownload(accessId: string, fileId = 'file-template-zip'): Promise<SecureDownloadResponse> {
  return {
    accessId,
    downloadId: `download-${accessId}-001`,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    fileId,
    refundEligibilityAfterDownload: 'ADMIN_REVIEW_REQUIRED',
    signedUrl: 'backend-download-contract-not-yet-available'
  };
}

export async function reportInvalidCode(accessId: string, request: InvalidCodeReportRequest) {
  const item = await getLibraryItemDetails(accessId);
  const response = await fetch(`${bffBaseUrl}/api/buyer/orders/${encodeURIComponent(item.orderId)}/digital-delivery/items/${encodeURIComponent(accessId)}/report-issue`, {
    body: JSON.stringify({
      buyerAcknowledgedIssueReview: true,
      message: request.message,
      reasonCode: request.reasonCode
    }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  await parseJson(response, 'Failed to report digital access issue');
  return {
    accessId,
    reasonCode: request.reasonCode,
    status: 'RECEIVED',
    ticketId: `invalid-code-${accessId}`
  };
}

export async function contactDigitalAccessSupport(request: SupportTicketRequest) {
  return {
    accessId: request.accessId,
    status: 'CREATED',
    supportTicketId: `support-${request.accessId}`
  };
}

export async function reportLibraryIssue(request: LibraryIssueRequest) {
  const item = await getLibraryItemDetails(request.accessId);
  const response = await fetch(`${bffBaseUrl}/api/buyer/orders/${encodeURIComponent(item.orderId)}/digital-delivery/items/${encodeURIComponent(request.accessId)}/report-issue`, {
    body: JSON.stringify({
      buyerAcknowledgedIssueReview: true,
      message: request.message,
      reasonCode: request.issueType
    }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });
  await parseJson(response, 'Failed to report library issue');
  return {
    issueId: `issue-${request.accessId}`,
    status: 'RECEIVED'
  };
}
