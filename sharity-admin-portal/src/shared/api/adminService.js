import { httpClient } from './httpClient.js';

export const adminService = {
  users: async (params = {}) => (await httpClient.get('/authorization-server/api/v1/admin/users', { params })).data,
  createUser: async (payload) => (await httpClient.post('/authorization-server/api/v1/admin/users', payload)).data,
  user: async (publicId) => (await httpClient.get(`/authorization-server/api/v1/admin/users/${publicId}`)).data,
  updateUserStatus: async (publicId, payload) =>
    (await httpClient.put(`/authorization-server/api/v1/admin/users/${publicId}/status`, payload)).data,
  updateUserProfile: async (publicId, payload) =>
    (await httpClient.put(`/authorization-server/api/v1/admin/users/${publicId}/profile`, payload)).data,
  deleteUser: async (publicId) => (await httpClient.delete(`/authorization-server/api/v1/admin/users/${publicId}`)).data,
  assignRole: async (publicId, role) =>
    (await httpClient.post(`/authorization-server/api/v1/admin/users/${publicId}/roles`, { role })).data,
  removeRole: async (publicId, role) =>
    (await httpClient.delete(`/authorization-server/api/v1/admin/users/${publicId}/roles/${role}`)).data,
  roles: async () => (await httpClient.get('/authorization-server/api/v1/admin/roles')).data,
  applications: async () => (await httpClient.get('/authorization-server/api/v1/admin/applications')).data,
  createApplication: async (payload) => (await httpClient.post('/authorization-server/api/v1/admin/applications', payload)).data,
  assignApplication: async (publicId, appCode) =>
    (await httpClient.post(`/authorization-server/api/v1/admin/users/${publicId}/applications`, { appCode })).data,
  removeApplication: async (publicId, appCode) =>
    (await httpClient.delete(`/authorization-server/api/v1/admin/users/${publicId}/applications/${appCode}`)).data,
  auditLogs: async (params = {}) => (await httpClient.get('/authorization-server/api/v1/admin/audit-logs', { params })).data,
  dashboardSummary: async () => (await httpClient.get('/authorization-server/api/v1/admin/dashboard/summary')).data,
  userSessions: async (publicId) => (await httpClient.get(`/authorization-server/api/v1/admin/users/${publicId}/sessions`)).data,
  revokeUserSession: async (publicId, sessionId) =>
    (await httpClient.delete(`/authorization-server/api/v1/admin/users/${publicId}/sessions/${sessionId}`)).data,
  modules: async () => (await httpClient.get('/authorization-server/api/v1/admin/modules')).data,
  pendingProviders: async () => (await httpClient.get('/authorization-server/api/v1/admin/providers/pending')).data,
  provider: async (publicId) => (await httpClient.get(`/authorization-server/api/v1/admin/providers/${publicId}`)).data,
  updateProviderModuleStatus: async (providerPublicId, moduleCode, payload) =>
    (await httpClient.put(`/authorization-server/api/v1/admin/providers/${providerPublicId}/modules/${moduleCode}/status`, payload)).data,
  supportedCountries: async () => (await httpClient.get('/authorization-server/api/v1/admin/supported-countries')).data,
  marketplaceOrders: async () => (await httpClient.get('/marketplace-service/api/v1/marketplace/admin/orders')).data,
  marketplaceDisputes: async () => (await httpClient.get('/marketplace-service/api/v1/marketplace/admin/disputes')).data,
  marketplaceDispute: async (publicId) => (await httpClient.get(`/marketplace-service/api/v1/marketplace/admin/disputes/${publicId}`)).data,
  marketplaceDisputeDecision: async (publicId) =>
    (await httpClient.put(`/marketplace-service/api/v1/marketplace/admin/disputes/${publicId}/decision`)).data,
  paymentTransactions: async () => (await httpClient.get('/payment-service/api/v1/payments/admin/transactions')).data,
  paymentPayouts: async () => (await httpClient.get('/payment-service/api/v1/payments/admin/payouts')).data,
  blockedPayouts: async () => (await httpClient.get('/payment-service/api/v1/payments/admin/payouts/blocked')).data,
  paymentGatewayCatalog: async () => (await httpClient.get('/payment-service/api/v1/payments/admin/gateways/catalog')).data,
  paymentGatewayPolicies: async () => (await httpClient.get('/payment-service/api/v1/payments/admin/gateways/policies')).data,
  paymentGatewayPolicy: async (countryCode) =>
    (await httpClient.get(`/payment-service/api/v1/payments/admin/gateways/policies/${countryCode}`)).data,
  paymentGatewayRecommendation: async (countryCode) =>
    (await httpClient.get('/payment-service/api/v1/payments/admin/gateways/recommendation', { params: { countryCode } })).data,
  upsertPaymentGatewayPolicy: async (countryCode, payload) =>
    (await httpClient.put(`/payment-service/api/v1/payments/admin/gateways/policies/${countryCode}`, payload)).data,
  walletAccounts: async () => (await httpClient.get('/wallet-service/api/v1/wallet/admin/accounts')).data,
  walletActivity: async () => (await httpClient.get('/wallet-service/api/v1/wallet/admin/activity')).data,
};
