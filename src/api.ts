import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Tenants ───

export const fetchTenants = () => api.get('/tenants').then((r) => r.data);

export const fetchTenantById = (id: string) =>
  api.get(`/tenants/${id}`).then((r) => r.data);

export const createTenant = (data: {
  name: string;
  alias: string;
  subscriptionPlan?: string;
}) => api.post('/tenants', data).then((r) => r.data);

export const updateTenantStatus = (id: string, status: string) =>
  api.patch(`/tenants/${id}/status`, { status }).then((r) => r.data);

export const updateTenantSubscription = (
  id: string,
  data: { subscriptionPlan?: string; storageQuotaLimitMB?: number },
) => api.patch(`/tenants/${id}/subscription`, data).then((r) => r.data);

// ─── Feature Permissions ───

export const fetchFeaturePermissions = (tenantId: string) =>
  api.get(`/tenants/${tenantId}/feature-permissions`).then((r) => r.data);

export const grantFeaturePermissions = (
  tenantId: string,
  permissions: string[],
) =>
  api
    .post(`/tenants/${tenantId}/feature-permissions/grant`, { permissions })
    .then((r) => r.data);

export const revokeFeaturePermissions = (
  tenantId: string,
  permissions: string[],
) =>
  api
    .delete(`/tenants/${tenantId}/feature-permissions/revoke`, {
      data: { permissions },
    })
    .then((r) => r.data);

export const setFeaturePermissions = (
  tenantId: string,
  permissions: string[],
) =>
  api
    .put(`/tenants/${tenantId}/feature-permissions`, { permissions })
    .then((r) => r.data);

// ─── Analytics ───

export const fetchDashboardStats = () =>
  api.get('/analytics/dashboard').then((r) => r.data);

export default api;
