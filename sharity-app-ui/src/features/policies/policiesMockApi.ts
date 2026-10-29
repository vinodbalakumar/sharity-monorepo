import type { PoliciesDashboardResponse, PolicyChangesResponse, PolicyDetailResponse, PolicySummaryItem } from './policiesTypes';

const now = new Date().toISOString();

export async function getPoliciesDashboard(): Promise<PoliciesDashboardResponse> {
  const policies = [
    policy('policy-buyer-terms', 'Buyer Terms', 'BUYER_TERMS', 'v2.0', undefined, 'NOT_ACCEPTED', true, ['BUYER'], ['CHECKOUT']),
    policy('policy-seller-terms', 'Seller Terms', 'SELLER_TERMS', 'v3.0', 'v2.0', 'REACCEPT_REQUIRED', true, ['SELLER'], ['CREATE_LISTING', 'PAYOUT']),
    policy('policy-digital', 'Digital Product Policy', 'DIGITAL_PRODUCT_POLICY', 'v2.0', 'v1.0', 'REACCEPT_REQUIRED', true, ['BUYER', 'SELLER'], ['DIGITAL_CHECKOUT', 'DIGITAL_DELIVERY']),
    policy('policy-refund', 'Refund/Return Policy', 'REFUND_RETURN_POLICY', 'v1.5', 'v1.5', 'ACCEPTED', false, ['BUYER', 'SELLER'], ['REFUND']),
    policy('policy-payout', 'Payout Policy', 'PAYOUT_POLICY', 'v1.0', undefined, 'NOT_ACCEPTED', true, ['SELLER'], ['PAYOUT']),
    policy('policy-safe-message', 'Safe Messaging Policy', 'SAFE_MESSAGING_POLICY', 'v1.0', 'v1.0', 'ACCEPTED', false, ['BUYER', 'SELLER'], ['MESSAGING'])
  ];
  return {
    policyGroups: [
      { groupCode: 'BUYER', groupName: 'Buyer policies', acceptedCount: 1, requiredCount: 2, reacceptRequiredCount: 1, blocking: true, policyIds: ['policy-buyer-terms', 'policy-digital'] },
      { groupCode: 'SELLER', groupName: 'Seller policies', acceptedCount: 1, requiredCount: 3, reacceptRequiredCount: 1, blocking: true, policyIds: ['policy-seller-terms', 'policy-payout'] },
      { groupCode: 'DIGITAL', groupName: 'Digital product policies', acceptedCount: 0, requiredCount: 1, reacceptRequiredCount: 1, blocking: true, policyIds: ['policy-digital'] }
    ],
    requiredPolicies: policies.filter((item) => item.required || item.reacceptanceRequired),
    acceptedPolicies: policies.filter((item) => item.acceptanceStatus === 'ACCEPTED'),
    blockingSummary: {
      blocked: true,
      missingPolicyCount: 3,
      reacceptRequiredCount: 2,
      userSafeMessage: 'Review required policies before checkout or listing. Live payouts remain disabled regardless of policy acceptance.',
      blockedActions: [
        { actionCode: 'CREATE_LISTING', actionLabel: 'Create listing blocked', blocked: true, requiredPolicyIds: ['policy-seller-terms'], userSafeMessage: 'Accept Seller Terms v3.0 to continue.', route: '/seller/policies' },
        { actionCode: 'DIGITAL_CHECKOUT', actionLabel: 'Digital checkout blocked', blocked: true, requiredPolicyIds: ['policy-digital'], userSafeMessage: 'Accept digital product terms before checkout.', route: '/policies/required' },
        { actionCode: 'SELLER_PAYOUT', actionLabel: 'Seller payout blocked', blocked: true, requiredPolicyIds: ['policy-payout'], userSafeMessage: 'Live payouts are disabled. Accepting a policy does not enable or promise payout release.', route: '/seller/policies/required' }
      ]
    },
    acceptanceHistorySummary: [
      { acceptanceId: 'accept-1', policyId: 'policy-refund', policyName: 'Refund/Return Policy', acceptedVersion: 'v1.5', currentVersion: 'v1.5', acceptedAt: now, role: 'BUYER', context: 'REFUND', marketplaceCode: 'DIGITAL', countryCode: 'USA', reacceptanceNeeded: false }
    ],
    adminPreviewVersions: policies.map((item) => ({ policyId: item.policyId, policyName: item.policyName, policyType: item.policyType, version: item.currentVersion, status: 'PUBLISHED', published: true, reacceptanceRequired: item.reacceptanceRequired, appliesToRoles: item.requiredForRoles, appliesToContexts: item.requiredContexts, marketplaceCode: item.marketplaceCode, countryCode: item.countryCode, effectiveAt: now, publishedAt: now })),
    availableActions: ['VIEW_POLICY', 'ACCEPT_POLICY', 'ACCEPT_ALL_REQUIRED', 'VIEW_WHAT_CHANGED', 'DOWNLOAD_POLICY_COPY']
  };
}

export async function getPolicyDetail(policyId = 'policy-seller-terms'): Promise<PolicyDetailResponse> {
  const dashboard = await getPoliciesDashboard();
  const policy = dashboard.requiredPolicies.find((item) => item.policyId === policyId) ?? dashboard.requiredPolicies[0] ?? dashboard.acceptedPolicies[0];
  if (!policy) {
    throw new Error('Policy not found');
  }
  return { policyId: policy.policyId, policyName: policy.policyName, policyType: policy.policyType, currentVersion: policy.currentVersion, publishedAt: now, effectiveAt: now, appliesToRoles: policy.requiredForRoles, appliesToContexts: policy.requiredContexts, marketplaceCode: policy.marketplaceCode, countryCode: policy.countryCode, summary: 'User-facing summary of required Sharity rules.', content: 'Published policy content placeholder. Full policy text is fetched from backend/static policy source and acceptance is never trusted from local storage.', whatChangedSummary: 'Updated seller payout and digital refund language.', acceptanceStatus: policy.acceptanceStatus, availableActions: policy.availableActions };
}

export async function getPolicyChanges(policyId = 'policy-digital'): Promise<PolicyChangesResponse> {
  return { policyId, fromVersion: 'v1.0', toVersion: 'v2.0', majorUpdate: true, reacceptanceRequired: true, effectiveAt: now, affectedActions: ['DIGITAL_CHECKOUT', 'REFUND_REQUEST'], changeSummaryItems: [{ title: 'Digital refund after reveal', description: 'Clarifies that refunds after code reveal may require Sharity Review.', severity: 'IMPORTANT', affectedContext: 'DIGITAL_CHECKOUT' }] };
}

export async function acceptPolicy(policyId: string, version: string) {
  return { policyId, policyVersion: version, accepted: true, acceptedAt: now, acceptanceStatus: 'ACCEPTED', blockingStatusUpdated: true, message: 'Policy acceptance recorded with version and context.' };
}

export async function acceptAllRequired() {
  const dashboard = await getPoliciesDashboard();
  return { acceptedPolicies: dashboard.requiredPolicies.map((item) => ({ policyId: item.policyId, policyVersion: item.currentVersion, accepted: true, acceptedAt: now, acceptanceStatus: 'ACCEPTED', blockingStatusUpdated: true, message: 'Accepted' })), failedPolicies: [], blockingStatusUpdated: true, message: 'All eligible required policies accepted.' };
}

function policy(policyId: string, policyName: string, policyType: string, currentVersion: string, acceptedVersion: string | undefined, acceptanceStatus: string, required: boolean, roles: string[], contexts: string[]): PolicySummaryItem {
  return { policyId, policyName, policyType, currentVersion, acceptedVersion, acceptanceStatus, reacceptanceRequired: acceptanceStatus === 'REACCEPT_REQUIRED', required, requiredForRoles: roles, requiredContexts: contexts, marketplaceCode: 'DIGITAL', countryCode: 'USA', lastAcceptedAt: acceptedVersion ? now : undefined, whatChangedAvailable: acceptanceStatus === 'REACCEPT_REQUIRED', availableActions: ['VIEW_POLICY', acceptanceStatus === 'REACCEPT_REQUIRED' ? 'REACCEPT_UPDATED_POLICY' : 'ACCEPT_POLICY', 'VIEW_WHAT_CHANGED', 'DOWNLOAD_POLICY_COPY'] };
}
