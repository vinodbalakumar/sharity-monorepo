export type PoliciesDashboardResponse = {
  policyGroups: PolicyGroup[];
  requiredPolicies: PolicySummaryItem[];
  acceptedPolicies: PolicySummaryItem[];
  blockingSummary: PolicyBlockingSummary;
  acceptanceHistorySummary: PolicyAcceptanceHistoryItem[];
  adminPreviewVersions: AdminPolicyVersionPreview[];
  availableActions: string[];
};

export type PolicyGroup = {
  groupCode: string;
  groupName: string;
  acceptedCount: number;
  requiredCount: number;
  reacceptRequiredCount: number;
  blocking: boolean;
  policyIds: string[];
};

export type PolicySummaryItem = {
  policyId: string;
  policyName: string;
  policyType: string;
  currentVersion: string;
  acceptedVersion?: string;
  acceptanceStatus: string;
  reacceptanceRequired: boolean;
  required: boolean;
  requiredForRoles: string[];
  requiredContexts: string[];
  marketplaceCode?: string;
  countryCode?: string;
  lastAcceptedAt?: string;
  whatChangedAvailable: boolean;
  availableActions: string[];
};

export type PolicyDetailResponse = {
  policyId: string;
  policyName: string;
  policyType: string;
  currentVersion: string;
  publishedAt: string;
  effectiveAt: string;
  appliesToRoles: string[];
  appliesToContexts: string[];
  marketplaceCode?: string;
  countryCode?: string;
  summary: string;
  content: string;
  whatChangedSummary: string;
  acceptanceStatus: string;
  availableActions: string[];
};

export type PolicyChangesResponse = {
  policyId: string;
  fromVersion: string;
  toVersion: string;
  majorUpdate: boolean;
  reacceptanceRequired: boolean;
  effectiveAt: string;
  affectedActions: string[];
  changeSummaryItems: PolicyChangeSummaryItem[];
};

export type PolicyChangeSummaryItem = {
  title: string;
  description: string;
  severity: string;
  affectedContext: string;
};

export type PolicyAcceptanceRequest = {
  policyId: string;
  policyVersion: string;
  role: string;
  context: string;
  marketplaceCode?: string;
  countryCode?: string;
  checkoutSessionId?: string;
  parentOrderId?: string;
  sellerId?: string;
  userAcknowledged: boolean;
};

export type PolicyAcceptanceResponse = {
  policyId: string;
  policyVersion: string;
  accepted: boolean;
  acceptedAt: string;
  acceptanceStatus: string;
  blockingStatusUpdated: boolean;
  message: string;
};

export type AcceptAllRequiredPoliciesRequest = {
  context: string;
  role: string;
  marketplaceCode?: string;
  countryCode?: string;
  checkoutSessionId?: string;
  sellerId?: string;
  userAcknowledgedAll: boolean;
  policyIds: string[];
};

export type AcceptAllRequiredPoliciesResponse = {
  acceptedPolicies: PolicyAcceptanceResponse[];
  failedPolicies: string[];
  blockingStatusUpdated: boolean;
  message: string;
};

export type PolicyAcceptanceHistoryItem = {
  acceptanceId: string;
  policyId: string;
  policyName: string;
  acceptedVersion: string;
  currentVersion: string;
  acceptedAt: string;
  role: string;
  context: string;
  marketplaceCode?: string;
  countryCode?: string;
  reacceptanceNeeded: boolean;
};

export type PolicyBlockingSummary = {
  blocked: boolean;
  blockedActions: PolicyBlockedAction[];
  missingPolicyCount: number;
  reacceptRequiredCount: number;
  userSafeMessage: string;
};

export type PolicyBlockedAction = {
  actionCode: string;
  actionLabel: string;
  blocked: boolean;
  requiredPolicyIds: string[];
  userSafeMessage: string;
  route: string;
};

export type DigitalCheckoutTermsAcceptanceRequest = {
  checkoutSessionId: string;
  digitalTermsPolicyId: string;
  digitalTermsVersion: string;
  refundPolicyId: string;
  refundPolicyVersion: string;
  marketplaceCode: string;
  countryCode: string;
  buyerAcknowledgedDigitalRules: boolean;
  buyerAcknowledgedRefundRules: boolean;
};

export type DigitalCheckoutTermsAcceptanceResponse = {
  checkoutSessionId: string;
  accepted: boolean;
  acceptedAt: string;
  termsSnapshotId: string;
  checkoutReady: boolean;
  message: string;
};

export type AdminPolicyVersionPreview = {
  policyId: string;
  policyName: string;
  policyType: string;
  version: string;
  status: string;
  published: boolean;
  reacceptanceRequired: boolean;
  appliesToRoles: string[];
  appliesToContexts: string[];
  marketplaceCode?: string;
  countryCode?: string;
  effectiveAt: string;
  publishedAt: string;
};
