import { sessionFetch as fetch } from './sessionFetch';
import type {
  ApplyCreditResponse,
  GiveawayClaimResponse,
  RewardSimulationResponse,
  RewardsDashboardResponse
} from '../features/rewards/rewardsTypes';

const bffBaseUrl = process.env.EXPO_PUBLIC_BFF_BASE_URL ?? '/bff';
const marketplaceRewardsBaseUrl = `${bffBaseUrl}/api/marketplace-service`;
const defaultCheckoutSessionId = 'checkout-session-1000';

export async function getRewardsDashboard(): Promise<RewardsDashboardResponse> {
  const response = await fetch(`${marketplaceRewardsBaseUrl}/api/rewards/dashboard`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to load rewards dashboard: ${response.statusText}`);
  }

  const body = await response.json() as RewardsDashboardResponse;
  const arrays: (keyof RewardsDashboardResponse)[] = ['availableRewards', 'creditHistory', 'campaigns', 'creditIssuance', 'creditRedemption', 'giveawayClaims', 'auditLog', 'abuseQueue'];
  if (!body?.creditBalance || !Number.isFinite(body.creditBalance.availableBalance)
      || !Number.isFinite(body.creditBalance.expiringSoonAmount)
      || !Array.isArray(body.creditBalance.typeBreakdown)
      || !body.creditAllocation || !body.sellerPromotionImpact || !body.simulation
      || arrays.some(key => !Array.isArray(body[key]))) {
    throw new Error('Rewards information is temporarily unavailable. Please try again.');
  }
  return body;
}

export async function claimGiveaway(campaignId: string): Promise<GiveawayClaimResponse> {
  const response = await fetch(`${marketplaceRewardsBaseUrl}/api/rewards/giveaways/${campaignId}/claim`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyerAcceptedDigitalTerms: true })
  });

  if (!response.ok) {
    throw new Error(`Failed to claim giveaway: ${response.statusText}`);
  }

  return await response.json();
}

export async function applyCredit(checkoutSessionId: string = defaultCheckoutSessionId): Promise<ApplyCreditResponse> {
  const response = await fetch(`${marketplaceRewardsBaseUrl}/api/checkout/sessions/${checkoutSessionId}/credit/apply`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestedAmount: 10 })
  });

  if (!response.ok) {
    throw new Error(`Failed to apply credit: ${response.statusText}`);
  }

  return await response.json();
}

export async function removeCredit(checkoutSessionId: string = defaultCheckoutSessionId): Promise<ApplyCreditResponse> {
  const response = await fetch(`${marketplaceRewardsBaseUrl}/api/checkout/sessions/${checkoutSessionId}/credit/remove`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Failed to remove credit: ${response.statusText}`);
  }

  return await response.json();
}

export async function runRewardSimulation(): Promise<RewardSimulationResponse> {
  const response = await fetch(`${marketplaceRewardsBaseUrl}/api/admin/rewards/simulate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Failed to run reward simulation: ${response.statusText}`);
  }

  return await response.json();
}
