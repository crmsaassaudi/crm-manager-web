import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Activity,
  Database,
  Search,
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldPlus,
  Globe,
  Package,
  ChevronRight,
  Power,
  PowerOff,
  Check,
  X,
  HardDrive,
  Crown,
} from 'lucide-react';
import * as api from './api';
import './index.css';

// ─── Types ───
interface Tenant {
  id: string;
  _id: string;
  name: string;
  alias: string;
  status: string;
  subscriptionPlan: string;
  provisioningStatus: string;
  storageQuota: { limitMB: number; usedMB: number };
  availablePermissions: string[] | null;
  createdAt: string;
}

interface FeaturePermData {
  tenantId: string;
  tenantName: string;
  tenantAlias: string;
  corePermissions: string[];
  featurePermissions: string[];
  grantedFeaturePermissions: string[];
}

// ─── Toast System ───
type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let setToastsGlobal: React.Dispatch<React.SetStateAction<Toast[]>>;

function showToast(message: string, type: ToastType = 'success') {
  const id = ++toastId;
  setToastsGlobal?.((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToastsGlobal?.((prev) => prev.filter((t) => t.id !== id));
  }, 3500);
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  setToastsGlobal = setToasts;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {t.message}
        </div>
      ))}
    </div>
  );
};

// ─── Helpers ───
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getPlanBadge = (plan: string) => {
  const cls: Record<string, string> = {
    FREE: 'badge-free',
    STARTER: 'badge-starter',
    PRO: 'badge-pro',
    ENTERPRISE: 'badge-enterprise',
  };
  return cls[plan] || 'badge-free';
};

const getStatusBadge = (status: string) => {
  if (status === 'ACTIVE') return 'badge-active';
  if (status === 'SUSPENDED') return 'badge-suspended';
  return 'badge-pending';
};

// ─── Permission Resource Grouping ───
function groupByResource(permissions: string[]) {
  const groups: Record<string, string[]> = {};
  permissions.forEach((p) => {
    const [resource] = p.split(':');
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  });
  return groups;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  leads: <Users size={16} />,
  contacts: <Users size={16} />,
  accounts: <Building2 size={16} />,
  deals: <Package size={16} />,
  campaigns: <Globe size={16} />,
  tickets: <Activity size={16} />,
  reports: <Database size={16} />,
  users: <Users size={16} />,
  groups: <Users size={16} />,
  settings: <Shield size={16} />,
  tasks: <Check size={16} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchDashboardStats()
      .then(setStats)
      .catch(() => {
        // Fallback if API unavailable
        setStats({
          totalTenants: '—',
          totalStorageUsedMB: 0,
          activeUsers: '—',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">
          Real-time statistics for your CRM platform.
        </p>
      </div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Tenants</h3>
            <p>{stats?.totalTenants ?? '—'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <HardDrive size={24} />
          </div>
          <div className="stat-info">
            <h3>Storage Used</h3>
            <p>
              {stats?.totalStorageUsedMB
                ? `${(stats.totalStorageUsedMB / 1024).toFixed(1)} GB`
                : '—'}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Users</h3>
            <p>{stats?.activeUsers ?? '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant List Page
// ─────────────────────────────────────────────────────────────────────────────
const TenantList = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .fetchTenants()
      .then(setTenants)
      .catch(() => showToast('Failed to load tenants', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.alias.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading tenants...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tenant Management</h1>
        <p className="page-subtitle">
          View and manage all tenants, permissions, and subscriptions.
        </p>
      </div>

      <div className="action-bar">
        <div className="action-bar-left">
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={48} />
          <h3>No tenants found</h3>
          <p>
            {search
              ? 'Try adjusting your search.'
              : 'No tenants have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Alias</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Feature Perms</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t._id || t.id}
                  onClick={() => navigate(`/tenants/${t._id || t.id}`)}
                >
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{t.alias}</td>
                  <td>
                    <span className={`badge ${getPlanBadge(t.subscriptionPlan)}`}>
                      {t.subscriptionPlan}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {t.availablePermissions
                      ? t.availablePermissions.length
                      : '0'}{' '}
                    granted
                  </td>
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                    {formatDate(t.createdAt)}
                  </td>
                  <td>
                    <ChevronRight size={16} color="var(--text-dim)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant Detail Page (Permission Management)
// ─────────────────────────────────────────────────────────────────────────────
const TenantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [permData, setPermData] = useState<FeaturePermData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'info'>('permissions');

  // Local granted state for optimistic UI
  const [localGranted, setLocalGranted] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [t, fp] = await Promise.all([
        api.fetchTenantById(id),
        api.fetchFeaturePermissions(id),
      ]);
      setTenant(t);
      setPermData(fp);
      setLocalGranted(new Set(fp.grantedFeaturePermissions));
    } catch {
      showToast('Failed to load tenant', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePermission = async (perm: string, checked: boolean) => {
    if (!id) return;
    setSaving(true);

    // Optimistic update
    setLocalGranted((prev) => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });

    try {
      if (checked) {
        await api.grantFeaturePermissions(id, [perm]);
      } else {
        await api.revokeFeaturePermissions(id, [perm]);
      }
      showToast(
        `${perm} ${checked ? 'granted' : 'revoked'} successfully`,
        'success',
      );
    } catch {
      // Rollback
      setLocalGranted((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(perm);
        else next.add(perm);
        return next;
      });
      showToast(`Failed to ${checked ? 'grant' : 'revoke'} ${perm}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantAll = async () => {
    if (!id || !permData) return;
    setSaving(true);
    try {
      const result = await api.setFeaturePermissions(
        id,
        permData.featurePermissions,
      );
      setLocalGranted(new Set(result.grantedFeaturePermissions));
      showToast('All feature permissions granted', 'success');
    } catch {
      showToast('Failed to grant all permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const result = await api.setFeaturePermissions(id, []);
      setLocalGranted(new Set(result.grantedFeaturePermissions));
      showToast('All feature permissions revoked', 'success');
    } catch {
      showToast('Failed to revoke all permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!id || !tenant) return;
    const newStatus =
      tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await api.updateTenantStatus(id, newStatus);
      setTenant(updated);
      showToast(
        `Tenant ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`,
        'success',
      );
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        Loading tenant...
      </div>
    );
  }

  if (!tenant || !permData) {
    return (
      <div className="empty-state">
        <h3>Tenant not found</h3>
        <button className="btn btn-outline" onClick={() => navigate('/tenants')}>
          Back to Tenants
        </button>
      </div>
    );
  }

  const coreGrouped = groupByResource(permData.corePermissions);
  const featureGrouped = groupByResource(permData.featurePermissions);

  return (
    <div>
      <button className="back-link" onClick={() => navigate('/tenants')}>
        <ArrowLeft size={16} /> Back to Tenants
      </button>

      {/* Header */}
      <div className="tenant-header">
        <div className="tenant-header-left">
          <h1 className="page-title">
            {tenant.name}
            <span className={`badge ${getStatusBadge(tenant.status)}`}>
              {tenant.status}
            </span>
          </h1>
          <div className="tenant-meta">
            <span className="tenant-meta-item">
              <Globe size={14} /> {tenant.alias}
            </span>
            <span className="tenant-meta-item">
              <Crown size={14} />{' '}
              <span className={`badge ${getPlanBadge(tenant.subscriptionPlan)}`}>
                {tenant.subscriptionPlan}
              </span>
            </span>
            <span className="tenant-meta-item">
              <HardDrive size={14} /> {tenant.storageQuota.usedMB}/
              {tenant.storageQuota.limitMB} MB
            </span>
          </div>
        </div>
        <div className="tenant-header-right">
          {tenant.status === 'ACTIVE' ? (
            <button
              className="btn btn-danger"
              onClick={handleStatusToggle}
            >
              <PowerOff size={14} /> Suspend Tenant
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleStatusToggle}
            >
              <Power size={14} /> Activate Tenant
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'permissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          <Shield size={16} />
          Permissions
          <span className="tab-count">{localGranted.size}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Building2 size={16} />
          Information
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'permissions' && (
        <div>
          {/* ─── Feature Permissions ─── */}
          <div className="perm-section">
            <div className="perm-section-header">
              <div>
                <div className="perm-section-title">
                  <ShieldPlus size={18} style={{ color: 'var(--purple)' }} />
                  Feature Permissions
                </div>
                <p className="perm-section-subtitle">
                  Toggle individual feature permissions on/off for this
                  tenant. Changes take effect immediately.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={handleRevokeAll}
                  disabled={saving || localGranted.size === 0}
                >
                  Revoke All
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleGrantAll}
                  disabled={
                    saving ||
                    localGranted.size === permData.featurePermissions.length
                  }
                >
                  Grant All
                </button>
              </div>
            </div>

            {Object.entries(featureGrouped).map(([resource, perms]) => (
              <div className="perm-resource-group" key={resource}>
                <div className="perm-resource-header">
                  <span className="perm-resource-name">
                    {RESOURCE_ICONS[resource]}
                    {resource}
                  </span>
                  <span className="perm-resource-count">
                    {perms.filter((p) => localGranted.has(p)).length}/
                    {perms.length} active
                  </span>
                </div>
                <div className="perm-list">
                  {perms.map((perm) => (
                    <div className="perm-item" key={perm}>
                      <div className="perm-item-left">
                        <span className="perm-key">{perm}</span>
                        <span className="perm-type-badge perm-type-feature">
                          Feature
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={localGranted.has(perm)}
                          onChange={(e) =>
                            handleTogglePermission(perm, e.target.checked)
                          }
                          disabled={saving}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Core Permissions (read-only) ─── */}
          <div className="perm-section">
            <div className="perm-section-header">
              <div>
                <div className="perm-section-title">
                  <ShieldCheck
                    size={18}
                    style={{ color: 'var(--success)' }}
                  />
                  Core Permissions
                </div>
                <p className="perm-section-subtitle">
                  Always available to all tenants. These cannot be
                  disabled per-tenant.
                </p>
              </div>
            </div>

            {Object.entries(coreGrouped).map(([resource, perms]) => (
              <div className="perm-resource-group" key={resource}>
                <div className="perm-resource-header">
                  <span className="perm-resource-name">
                    {RESOURCE_ICONS[resource]}
                    {resource}
                  </span>
                  <span className="perm-resource-count">
                    {perms.length} always-on
                  </span>
                </div>
                <div className="perm-list">
                  {perms.map((perm) => (
                    <div className="perm-item" key={perm}>
                      <div className="perm-item-left">
                        <span className="perm-key">{perm}</span>
                        <span className="perm-type-badge perm-type-core">
                          Core
                        </span>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked
                          disabled
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'info' && (
        <div className="info-card">
          <div className="info-grid">
            <div className="info-item">
              <label>Tenant ID</label>
              <p style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                {tenant._id || tenant.id}
              </p>
            </div>
            <div className="info-item">
              <label>Alias</label>
              <p>{tenant.alias}</p>
            </div>
            <div className="info-item">
              <label>Subscription Plan</label>
              <p>{tenant.subscriptionPlan}</p>
            </div>
            <div className="info-item">
              <label>Status</label>
              <p>{tenant.status}</p>
            </div>
            <div className="info-item">
              <label>Provisioning</label>
              <p>{tenant.provisioningStatus}</p>
            </div>
            <div className="info-item">
              <label>Storage Quota</label>
              <p>
                {tenant.storageQuota.usedMB} / {tenant.storageQuota.limitMB} MB
              </p>
            </div>
            <div className="info-item">
              <label>Feature Permissions</label>
              <p>{localGranted.size} granted</p>
            </div>
            <div className="info-item">
              <label>Created</label>
              <p>{formatDate(tenant.createdAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// App Shell
// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <ToastContainer />
      <div className="app-container">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="brand">
            <Shield size={24} />
            CRM Manager
          </div>

          <div>
            <div className="nav-section-label">Overview</div>
            <div className="nav-links">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
            </div>
          </div>

          <div>
            <div className="nav-section-label">Management</div>
            <div className="nav-links">
              <NavLink
                to="/tenants"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Building2 size={18} />
                Tenants
              </NavLink>
              <NavLink
                to="/staff"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <Users size={18} />
                Staff
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tenants" element={<TenantList />} />
            <Route path="/tenants/:id" element={<TenantDetail />} />
            <Route
              path="/staff"
              element={
                <div className="empty-state">
                  <Users size={48} />
                  <h3>Staff Management</h3>
                  <p>Coming soon — manage platform Super Admins.</p>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
