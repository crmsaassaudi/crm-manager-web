import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  Crown, 
  HardDrive, 
  Power, 
  PowerOff,
  Shield,
  Activity,
  ChevronRight
} from 'lucide-react';
import * as api from '../api';
import PermissionManager from '../features/tenants/components/PermissionManager';

const TenantDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tenant, setTenant] = useState<any>(null);
  const [permData, setPermData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localGranted, setLocalGranted] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [tData, pData] = await Promise.all([
        api.fetchTenantById(id),
        api.fetchFeaturePermissions(id),
      ]);
      setTenant(tData);
      setPermData(pData);
      setLocalGranted(new Set(pData.grantedFeaturePermissions));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggle = async (perm: string, checked: boolean) => {
    if (!id) return;
    setSaving(true);
    setLocalGranted(prev => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });

    try {
      if (checked) await api.grantFeaturePermissions(id, [perm]);
      else await api.revokeFeaturePermissions(id, [perm]);
    } catch (err) {
      console.error(err);
      // Rollback
      setLocalGranted(prev => {
        const next = new Set(prev);
        if (checked) next.delete(perm);
        else next.add(perm);
        return next;
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyTemplate = async (perms: string[]) => {
    if (!id) return;
    setSaving(true);
    try {
      const result = await api.setFeaturePermissions(id, perms);
      setLocalGranted(new Set(result.grantedFeaturePermissions));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!tenant) return <div>Tenant not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <button onClick={() => navigate('/tenants')} className="hover:text-primary transition-colors uppercase">{t('common.tenants')}</button>
        <ChevronRight size={10} />
        <span className="text-foreground">{tenant.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
        
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold tracking-tight">{tenant.name}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                  tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                }`}>
                  {tenant.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1"><Globe size={12} /> {tenant.alias}</span>
                <span className="flex items-center gap-1"><Crown size={12} /> {tenant.subscriptionPlan}</span>
                <span className="flex items-center gap-1"><HardDrive size={12} /> {tenant.storageQuota.usedMB}/{tenant.storageQuota.limitMB} MB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-accent hover:bg-border px-3 py-1.5 rounded-lg font-bold transition-all text-xs">
              <Activity size={14} />
              Logs
            </button>
            <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
              tenant.status === 'ACTIVE' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
            }`}>
              {tenant.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
              {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Manager */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none">Access Control</h2>
            <p className="text-xs text-muted-foreground mt-1">Configure feature flags and core permissions for this workspace.</p>
          </div>
        </div>

        <PermissionManager 
          corePermissions={permData?.corePermissions || []}
          featurePermissions={permData?.featurePermissions || []}
          grantedPermissions={localGranted}
          onToggle={handleToggle}
          onGrantAll={() => handleApplyTemplate(permData?.featurePermissions || [])}
          onRevokeAll={() => handleApplyTemplate([])}
          onApplyTemplate={handleApplyTemplate}
          isSaving={saving}
        />
      </div>
    </div>
  );
};

const Building2 = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/></svg>
);

export default TenantDetailPage;
