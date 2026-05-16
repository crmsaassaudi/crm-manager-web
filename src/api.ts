import axios from 'axios';

const TOKEN_STORAGE_KEY = 'crm-manager-access-token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.dispatchEvent(new Event('crm-manager-auth:logout'));
    }
    return Promise.reject(error);
  },
);

export const getStoredAccessToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY);

export const clearStoredAccessToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const fetchCurrentUser = () => api.get('/auth/me').then((r) => r.data);

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
