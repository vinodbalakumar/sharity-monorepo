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
};
