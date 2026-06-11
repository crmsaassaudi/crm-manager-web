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
    const url = originalRequest?.url || '';
    const isAuthRequest =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/logout');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;
      try {
        await api.get('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('crm-manager-auth:logout'));
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401 && isAuthRequest) {
      window.dispatchEvent(new Event('crm-manager-auth:logout'));
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
  customDomain?: string | null;
  customDomainStatus?: 'NONE' | 'DNS_PENDING' | 'SSL_ISSUING' | 'ACTIVE';
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

export type DashboardStats = {
  totalTenants: number;
  activeUsers: number;
  totalStorageUsedMB: number;
  systemHealth: string;
  trends: {
    tenantsTrend: number | null;
    usersTrend: number | null;
    storageTrend: number | null;
  };
  topStorageConsumers: Array<{
    tenantId: string;
    name: string;
    usedMB: number;
    limitMB: number;
  }>;
  recentActivity: Array<{
    action: string;
    actorEmail: string;
    targetName: string;
    targetType: string;
    createdAt: string;
  }>;
};

export type FeaturePermissionResponse = {
  featurePermissions: string[];
  corePermissions: string[];
  grantedFeaturePermissions: string[];
  disabledCorePermissions: string[];
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
  subStepLogs?: string[];
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

export const fetchFeaturePermissions = (tenantId: string): Promise<FeaturePermissionResponse> =>
  api.get<FeaturePermissionResponse>(`/tenants/${tenantId}/feature-permissions`).then((r) => r.data);

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

export const retryProvisioning = (provisioningId: string) =>
  api
    .post<{ status: string; provisioningId: string }>(`/onboarding/status/${provisioningId}/retry`)
    .then((r) => r.data);

export const inviteCustomerUser = (
  tenantId: string,
  data: { email: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
) =>
  api
    .post(`/onboarding/tenants/${tenantId}/invite`, data)
    .then((r) => r.data);

export const fetchDashboardStats = (): Promise<DashboardStats> =>
  api.get<DashboardStats>('/analytics/dashboard').then((r) => r.data);

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

// ─── Custom Domain ───

export type CustomDomainConfig = {
  tenantId: string;
  tenantAlias: string;
  featureEnabled?: boolean;
  customDomain: string | null;
  customDomainStatus: 'NONE' | 'DNS_PENDING' | 'SSL_ISSUING' | 'ACTIVE';
  dnsRecords: { type: string; name: string; value: string; ttl: number }[];
};

export const fetchCustomDomain = (tenantId: string): Promise<CustomDomainConfig> =>
  api.get<CustomDomainConfig>(`/tenants/${tenantId}/custom-domain`).then((r) => r.data);

export const setCustomDomain = (tenantId: string, domain: string) =>
  api.put(`/tenants/${tenantId}/custom-domain`, { domain }).then((r) => r.data);

export const removeCustomDomain = (tenantId: string) =>
  api.delete(`/tenants/${tenantId}/custom-domain`).then((r) => r.data);

export const verifyCustomDomain = (
  tenantId: string,
): Promise<{ verified: boolean; dnsVerified?: boolean; status: string; message: string }> =>
  api.post(`/tenants/${tenantId}/custom-domain/verify`).then((r) => r.data);

// ─── Disaster Recovery ───

export type BackupRecord = {
  id: string;
  tenantId: string;
  tenantAlias: string;
  fileName: string;
  sizeBytes: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  initiatedBy: string;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const fetchBackups = (tenantId: string): Promise<BackupRecord[]> =>
  api.get<BackupRecord[]>(`/tenants/${tenantId}/backups`).then((r) => r.data);

export const createBackup = (tenantId: string): Promise<BackupRecord> =>
  api.post<BackupRecord>(`/tenants/${tenantId}/backups`).then((r) => r.data);

export const restoreBackup = (
  tenantId: string,
  backupId: string,
  confirmationAlias: string,
): Promise<{ success: boolean; backupId: string; tenantAlias: string }> =>
  api
    .post(`/tenants/${tenantId}/backups/${backupId}/restore`, {
      confirmationAlias,
    })
    .then((r) => r.data);

// ─── System Settings ───

export type SystemSettings = {
  id: string;
  maintenanceMode: {
    enabled: boolean;
    enabledAt: string | null;
    enabledBy: string | null;
    whitelistedIPs: string[];
  };
  emergencyBanner: {
    enabled: boolean;
    title: string;
    message: string;
    color: 'yellow' | 'red';
    activatedAt: string | null;
    activatedBy: string | null;
  };
};

export const fetchSystemSettings = (): Promise<SystemSettings> =>
  api.get<SystemSettings>('/system-settings').then((r) => r.data);

export const toggleMaintenance = (
  enabled: boolean,
  whitelistedIPs?: string[],
): Promise<SystemSettings> =>
  api
    .patch<SystemSettings>('/system-settings/maintenance', {
      enabled,
      whitelistedIPs,
    })
    .then((r) => r.data);

export const updateEmergencyBanner = (data: {
  enabled: boolean;
  title?: string;
  message?: string;
  color?: 'yellow' | 'red';
}): Promise<SystemSettings> =>
  api
    .patch<SystemSettings>('/system-settings/emergency-banner', data)
    .then((r) => r.data);

// ─── Webhook Monitor ───

export type WebhookStat = {
  webhookId: string;
  name: string;
  url: string;
  events: string[];
  status: 'ACTIVE' | 'INACTIVE';
  totalDeliveries: number;
  failedDeliveries: number;
  successRate: number;
};

export type WebhookStatsResponse = {
  tenantId: string;
  tenantAlias: string;
  webhooks: WebhookStat[];
};

export type WebhookDelivery = {
  id: string;
  tenantId: string;
  webhookConfigId: string;
  webhookUrl: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  responseCode?: number | null;
  durationMs?: number | null;
  error?: string | null;
  createdAt: string;
};

export const fetchWebhookStats = (tenantId: string): Promise<WebhookStatsResponse> =>
  api.get<WebhookStatsResponse>(`/tenants/${tenantId}/webhooks/stats`).then((r) => r.data);

export const fetchWebhookDeliveries = (
  tenantId: string,
  webhookConfigId: string,
): Promise<WebhookDelivery[]> =>
  api
    .get<WebhookDelivery[]>(
      `/tenants/${tenantId}/webhooks/${webhookConfigId}/deliveries`,
    )
    .then((r) => r.data);

export const resendWebhookDelivery = (
  tenantId: string,
  deliveryId: string,
): Promise<{
  queued: boolean;
  delivered?: boolean;
  deliveryId: string;
  status?: string;
  responseCode?: number;
  durationMs?: number;
}> =>
  api
    .post(`/tenants/${tenantId}/webhooks/${deliveryId}/resend`)
    .then((r) => r.data);

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
