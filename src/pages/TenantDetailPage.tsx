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
  ChevronRight,
  Building2
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
  const [localDisabledCore, setLocalDisabledCore] = useState<Set<string>>(
    new Set(),
  );
  const [savedGranted, setSavedGranted] = useState<Set<string>>(new Set());
  const [savedDisabledCore, setSavedDisabledCore] = useState<Set<string>>(
    new Set(),
  );
  const [permissionGroups, setPermissionGroups] = useState<api.PermissionGroup[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [tData, pData, groupsData] = await Promise.all([
        api.fetchTenantById(id),
        api.fetchFeaturePermissions(id),
        api.fetchPermissionGroups(),
      ]);
      setTenant(tData);
      setPermData(pData);
      setPermissionGroups(groupsData);
      const granted = new Set<string>(pData.grantedFeaturePermissions || []);
      const disabledCore = new Set<string>(pData.disabledCorePermissions || []);
      setLocalGranted(granted);
      setSavedGranted(new Set(granted));
      setLocalDisabledCore(disabledCore);
      setSavedDisabledCore(new Set(disabledCore));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sameSet = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && Array.from(a).every((value) => b.has(value));

  const hasPermissionChanges =
    !sameSet(localGranted, savedGranted) ||
    !sameSet(localDisabledCore, savedDisabledCore);

  const handleToggle = (perm: string, checked: boolean) => {
    setLocalGranted(prev => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });
  };

  const handleApplyTemplate = (perms: string[]) => {
    const allowed = new Set<string>(permData?.featurePermissions || []);
    setLocalGranted(new Set(perms.filter((perm) => allowed.has(perm))));
  };

  const handleToggleCore = (perm: string, checked: boolean) => {
    setLocalDisabledCore(prev => {
      const next = new Set(prev);
      if (checked) next.delete(perm);
      else next.add(perm);
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!id || !permData?.corePermissions) return;
    setSaving(true);
    try {
      const enabledCore = permData.corePermissions.filter(
        (corePerm: string) => !localDisabledCore.has(corePerm),
      );
      const [featureResult, coreResult] = await Promise.all([
        api.setFeaturePermissions(id, Array.from(localGranted)),
        api.setCorePermissions(id, enabledCore),
      ]);
      const granted = new Set<string>(
        featureResult.grantedFeaturePermissions || [],
      );
      const disabledCore = new Set<string>(
        coreResult.disabledCorePermissions || [],
      );
      setLocalGranted(granted);
      setSavedGranted(new Set(granted));
      setLocalDisabledCore(disabledCore);
      setSavedDisabledCore(new Set(disabledCore));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPermissions = () => {
    setLocalGranted(new Set(savedGranted));
    setLocalDisabledCore(new Set(savedDisabledCore));
  };

  const handleGrantAll = () => {
    if (
      !window.confirm(
        t('permissions.confirmGrantAll', {
          defaultValue:
            'Grant all feature permissions? Changes will be saved only after you click Save.',
        }),
      )
    ) return;
    handleApplyTemplate(permData?.featurePermissions || []);
  };

  const handleRevokeAll = () => {
    if (
      !window.confirm(
        t('permissions.confirmRevokeAll', {
          defaultValue:
            'Revoke all feature permissions? Changes will be saved only after you click Save.',
        }),
      )
    ) return;
    handleApplyTemplate([]);
  };

  const handleToggleStatus = async () => {
    if (!id || !tenant) return;
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmKey =
      nextStatus === 'SUSPENDED'
        ? 'details.confirmSuspend'
        : 'details.confirmActivate';
    if (
      !window.confirm(
        t(confirmKey, {
          name: tenant.name,
          defaultValue: `${nextStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} ${tenant.name}?`,
        }),
      )
    ) return;

    setSaving(true);
    try {
      const updated = await api.updateTenantStatus(id, nextStatus);
      setTenant(updated);
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
      <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <button onClick={() => navigate('/tenants')} className="hover:text-primary transition-colors">{t('common.tenants')}</button>
        <ChevronRight size={12} />
        <span className="text-slate-900 dark:text-white font-black">{tenant.name}</span>
      </nav>

      {/* Header Card */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
        
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Building2 size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{tenant.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  tenant.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' : 'bg-rose-50 text-rose-600 border-rose-500/20'
                }`}>
                  {tenant.status === 'ACTIVE' ? t('common.active') : t('common.suspended')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Globe size={14} className="text-slate-400" /> {tenant.alias}</span>
                <span className="flex items-center gap-1.5"><Crown size={14} className="text-slate-400" /> {tenant.subscriptionPlan}</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-400" /> {tenant.storageQuota?.usedMB || 0}/{tenant.storageQuota?.limitMB || 0} MB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/audit-logs?targetId=${tenant.id}&targetType=TENANT`)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg font-medium transition-all text-[13px] text-slate-700 dark:text-slate-200"
            >
              <Activity size={14} />
              {t('details.viewLog')}
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={saving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-[13px] disabled:opacity-50 ${
              tenant.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            >
              {tenant.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
              {tenant.status === 'ACTIVE' ? t('details.suspend') : t('details.activate')}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Manager */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('details.accessControl')}</h2>
            <p className="text-[12px] text-slate-500 font-medium mt-0.5">{t('details.accessControlDesc')}</p>
          </div>
        </div>

        <PermissionManager 
          corePermissions={permData?.corePermissions || []}
          featurePermissions={permData?.featurePermissions || []}
          grantedPermissions={localGranted}
          disabledCorePermissions={localDisabledCore}
          permissionGroups={permissionGroups}
          onToggle={handleToggle}
          onToggleCore={handleToggleCore}
          onGrantAll={handleGrantAll}
          onRevokeAll={handleRevokeAll}
          onApplyTemplate={handleApplyTemplate}
          onSave={handleSavePermissions}
          onReset={handleResetPermissions}
          isSaving={saving}
          hasChanges={hasPermissionChanges}
        />
      </div>
    </div>
  );
};

export default TenantDetailPage;
