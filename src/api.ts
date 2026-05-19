import axios from 'axios';

// Cookie-based authentication via crm-manager-api proxy

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.get('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('crm-manager-auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export type Tenant = {
  id: string;
  _id?: string;
  name: string;
  alias: string;
  status: string;
  subscriptionPlan: string;
  availablePermissions?: string[] | null;
  disabledCorePermissions?: string[] | null;
  createdAt?: string;
  storageQuota?: { usedMB: number; limitMB: number };
};

export type PermissionGroup = {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
};

export type ManagerUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  keycloakId?: string;
  platformRole?: string;
  status?: string;
  createdAt?: string;
  inviteSent?: boolean;
  inviteError?: string;
  temporaryPassword?: string;
};

export type ProvisioningStatus = {
  status: 'QUEUED' | 'PROVISIONING' | 'READY' | 'FAILED';
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  tenantId?: string;
  redirectUrl?: string;
  error?: string;
  retryable?: boolean;
};

export const clearStoredAccessToken = () => {
  // Cookies are cleared via /auth/logout
};

export const fetchCurrentUser = () => api.get('/auth/me').then((r) => r.data);

export const fetchTenants = () =>
  api.get<Tenant[]>('/tenants').then((r) => r.data);

export const fetchTenantById = (id: string) =>
  api.get<Tenant>(`/tenants/${id}`).then((r) => r.data);

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

export const setCorePermissions = (tenantId: string, permissions: string[]) =>
  api
    .put(`/tenants/${tenantId}/core-permissions`, { permissions })
    .then((r) => r.data);

export const fetchPermissionCatalog = () =>
  api.get('/permission-groups/catalog').then((r) => r.data);

export const fetchPermissionGroups = () =>
  api.get<PermissionGroup[]>('/permission-groups').then((r) => r.data);

export const createPermissionGroup = (data: {
  name: string;
  description?: string;
  permissions: string[];
}) => api.post('/permission-groups', data).then((r) => r.data);

export const updatePermissionGroup = (
  id: string,
  data: { name?: string; description?: string; permissions?: string[] },
) => api.patch(`/permission-groups/${id}`, data).then((r) => r.data);

export const deletePermissionGroup = (id: string) =>
  api.delete(`/permission-groups/${id}`).then((r) => r.data);

export const applyPermissionGroupToTenants = (
  id: string,
  data: { tenantIds: string[]; mode?: 'replace' | 'merge' },
) =>
  api
    .post(`/permission-groups/${id}/apply-to-tenants`, data)
    .then((r) => r.data);

export const fetchManagerUsers = () =>
  api.get<ManagerUser[]>('/users').then((r) => r.data);

export const createManagerUser = (data: {
  email: string;
  firstName?: string;
  lastName?: string;
  temporaryPassword?: string;
  sendInvite?: boolean;
}) => api.post('/users', data).then((r) => r.data);

export const updateManagerUser = (
  id: string,
  data: { status?: 'ACTIVE' | 'INACTIVE' },
) => api.patch(`/users/${id}`, data).then((r) => r.data);

export const provisionCustomer = (data: {
  companyName: string;
  adminEmail: string;
  adminFullName: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}) => api.post('/onboarding/provision', data).then((r) => r.data);

export const fetchProvisioningStatus = (provisioningId: string) =>
  api
    .get<ProvisioningStatus>(`/onboarding/status/${provisioningId}`)
    .then((r) => r.data);

export const inviteCustomerUser = (
  tenantId: string,
  data: { email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
) =>
  api
    .post(`/onboarding/tenants/${tenantId}/invite`, data)
    .then((r) => r.data);

export const fetchDashboardStats = () =>
  api.get('/analytics/dashboard').then((r) => r.data);

export type AuditLog = {
  id: string;
  actorId: string;
  actorEmail: string;
  actorIp: string;
  actorUserAgent: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogListResponse = {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const fetchAuditLogs = (params: {
  targetId?: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) =>
  api
    .get<AuditLogListResponse>('/audit-logs', { params })
    .then((r) => r.data);

export default api;
