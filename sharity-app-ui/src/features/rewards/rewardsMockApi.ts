import type {
  ApplyCreditResponse,
  CreditHistoryItem,
  CreditType,
  RewardCampaignConfig,
  RewardCampaignSummary,
  RewardsDashboardResponse
} from './rewardsTypes';

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;

export async function getRewardsDashboard(): Promise<RewardsDashboardResponse> {
  const allocation = {
    checkoutSessionId: 'checkout-session-1000',
    parentOrderId: 'parent-order-1000',
    totalCreditApplied: 10,
    currency: 'USD',
    items: [
      {
        sellerOrderId: 'seller-order-a',
        sellerId: 'seller-gamecodehub',
        allocatedCreditAmount: 6,
        fundingSource: 'PLATFORM_FUNDED',
        sellerPayoutAffected: false,
        sellerPayoutImpactAmount: 0,
        refundBehavior: 'Promotional credit may not return after refund'
      },
      {
        sellerOrderId: 'seller-order-b',
        sellerId: 'seller-softvault',
        allocatedCreditAmount: 4,
        fundingSource: 'PLATFORM_FUNDED',
        sellerPayoutAffected: false,
        sellerPayoutImpactAmount: 0,
        refundBehavior: 'Refund credit returns to credit balance when eligible'
      }
    ]
  };

  const campaigns = [
    campaign('camp-first-order', 'First Order Reward', 'FIRST_ORDER_REWARD', 5, 'Claimed'),
    campaign('camp-giveaway', 'Free Digital Starter Pack', 'GIVEAWAY_REWARD', 0, 'Available'),
    campaign('camp-goodwill', 'Support Goodwill Credit', 'GOODWILL_SUPPORT_CREDIT', 10, 'Eligible')
  ];

  return {
    creditBalance: {
      availableBalance: 10,
      expiringSoonAmount: 3,
      currency: 'USD',
      expiryDate: '2026-07-15',
      typeBreakdown: [
        {
          creditType: 'PLATFORM_CREDIT',
          amount: 5,
          refundBehavior: 'May return based on campaign policy',
          expiryBehavior: 'Expires with campaign',
          affectsSellerPayout: false
        },
        {
          creditType: 'REFUND_CREDIT',
          amount: 3,
          refundBehavior: 'Returns to credit balance after eligible refund',
          expiryBehavior: 'Keeps original refund-credit expiry',
          affectsSellerPayout: false
        },
        {
          creditType: 'PROMOTIONAL_CREDIT',
          amount: 2,
          refundBehavior: 'May expire and not return',
          expiryBehavior: 'Expires on campaign date',
          affectsSellerPayout: false
        }
      ]
    },
    availableRewards: campaigns,
    creditHistory: [
      history('hist-1', 'PLATFORM_CREDIT', 5, 'Issued', 5),
      history('hist-2', 'PROMOTIONAL_CREDIT', -2, 'Applied to checkout', 2),
      history('hist-3', 'REFUND_CREDIT', 3, 'Returned after refund', 1),
      history('hist-4', 'GIVEAWAY_REWARD', 0, 'Free digital access created', 0)
    ],
    creditAllocation: allocation,
    sellerPromotionImpact: {
      sellerOrderId: 'seller-order-a',
      campaignName: 'First Order Reward',
      campaignVisibleToSeller: true,
      sellerPayoutAffected: false,
      sellerSafePromoImpact: 'Buyer used platform-funded Sharity Credit.',
      estimatedSellerReceives: 86.93,
      currency: 'USD',
      platformFundedNote: 'Platform-funded credit does not reduce seller payout by default.',
      payoutHoldReserveImpact: 'No payout hold or reserve impact for this promotion.'
    },
    campaigns: campaigns.map(toConfig),
    creditIssuance: [history('issue-1', 'ADMIN_MANUAL_CREDIT', 10, 'Issued by Support Admin', 4)],
    creditRedemption: [history('redeem-1', 'PROMOTIONAL_CREDIT', -10, 'Redeemed at checkout', 1)],
    giveawayClaims: campaigns.filter((item) => item.creditRewardType === 'GIVEAWAY_REWARD'),
    abuseQueue: [
      {
        reviewId: 'review-1',
        campaignName: 'Free Digital Starter Pack',
        reviewReason: 'Verification required for repeated giveaway claim',
        adminSafeExplanation: 'Claim is paused for admin review. Raw IP/device risk payload remains backend-only.',
        status: 'PENDING_REVIEW'
      }
    ],
    auditLog: [
      {
        auditId: 'audit-rewards-1',
        actorId: 'admin-1',
        actorName: 'Promotion Admin',
        action: 'Reward campaign simulated',
        entityType: 'REWARD_CAMPAIGN',
        entityId: 'camp-first-order',
        beforeSummary: 'Draft',
        afterSummary: 'Eligible for verified digital buyers',
        reason: 'Launch readiness',
        createdAt: new Date(now).toISOString()
      }
    ],
    simulation: {
      eligible: true,
      buyerCreditApplied: 10,
      buyerTotalAfterCredit: 37,
      sellerPayoutImpact: 'Seller payout unchanged because campaign is platform funded',
      platformFundedAmount: 10,
      sellerFundedAmount: 0,
      creditAllocation: allocation.items,
      refundBehavior: 'Refund credit can return; promotional credit may not return',
      antiAbuseResult: 'Verified account, country eligible, claim limit available',
      winningCampaignRules: ['PLATFORM_CREDIT', 'FIRST_ORDER_REWARD'],
      conflictWarnings: ['Seller-funded rewards are later-phase placeholders']
    }
  };
}

export async function claimGiveaway(campaignId: string) {
  if (campaignId === 'camp-giveaway') {
    return {
      campaignId,
      status: 'CLAIMED',
      parentOrderId: 'parent-order-free-001',
      accessRecordId: 'access-free-001',
      message: 'Giveaway claimed. Free digital order/access record created.'
    };
  }
  return { campaignId, status: 'NOT_AVAILABLE', message: 'This campaign is not available for giveaway claim.' };
}

export async function applyCredit(): Promise<ApplyCreditResponse> {
  const dashboard = await getRewardsDashboard();
  return {
    creditApplied: 10,
    remainingCredit: 0,
    totalAfterCredit: 37,
    currency: 'USD',
    allocation: dashboard.creditAllocation,
    message: 'Sharity Credit applied to checkout mock allocation.'
  };
}

export async function removeCredit() {
  return { creditApplied: 0, totalAfterCredit: 47, message: 'Sharity Credit removed and checkout repriced.' };
}

export async function runRewardSimulation() {
  return (await getRewardsDashboard()).simulation;
}

function campaign(
  campaignId: string,
  campaignName: string,
  creditRewardType: CreditType,
  amount: number,
  claimStatus: string
): RewardCampaignSummary {
  return {
    campaignId,
    campaignName,
    creditRewardType,
    fundingSource: 'PLATFORM_FUNDED',
    amount,
    percentage: 0,
    maxDiscount: amount,
    marketplaceScope: 'DIGITAL',
    categoryScope: 'ALL',
    countryScope: 'USA',
    status: 'ACTIVE',
    sellerPayoutImpact: 'Seller payout unchanged by default',
    refundBehavior: 'Campaign-controlled refundability',
    antiAbuseSummary: 'Verified account, country eligibility, claim limits, cooldown',
    imageUrl: placeholderImageUrl('gift_cards'),
    claimStatus
  };
}

function toConfig(summary: RewardCampaignSummary): RewardCampaignConfig {
  return {
    ...summary,
    startDate: new Date(now - dayMs).toISOString(),
    endDate: new Date(now + 60 * dayMs).toISOString(),
    buyerEligibility: 'Verified account, first-order or campaign segment',
    sellerEligibility: 'Verified digital sellers',
    usageLimit: '1 per buyer, 1000 campaign max',
    antiAbuseSettings: {
      maxClaimsPerBuyer: 1,
      maxClaimsPerDeviceLater: 1,
      maxClaimsPerCampaign: 1000,
      countryEligibilityRequired: true,
      marketplaceCategoryEligibilityRequired: true,
      emailVerificationRequired: true,
      phoneVerificationRequired: false,
      paymentMethodRequiredForHighRiskFreebies: true,
      backendRiskReviewEnabled: true,
      adminApprovalForSuspiciousClaims: true,
      cooldownPeriod: '24 hours'
    }
  };
}

function history(historyId: string, type: CreditType, amount: number, status: string, daysAgo: number): CreditHistoryItem {
  return {
    historyId,
    type,
    amount,
    currency: 'USD',
    status,
    date: new Date(now - daysAgo * dayMs).toISOString(),
    expiryDate: '2026-07-15',
    relatedOrderId: 'parent-order-1000',
    relatedCampaignId: 'camp-first-order',
    termsSummary: 'Backend-controlled eligibility, refundability, and expiry rules.'
  };
}
import { placeholderImageUrl } from '../../utils/mockImages';
