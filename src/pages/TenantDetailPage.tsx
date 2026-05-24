import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
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
  Building2,
  Network,
  DatabaseBackup,
  Webhook,
} from 'lucide-react';
import * as api from '../api';
import type { Tenant, FeaturePermissionResponse } from '../api';
import { useToast } from '../shared/context/ToastContext';
import PermissionManager from '../features/tenants/components/PermissionManager';
import PermissionDiffViewer from '../features/tenants/components/PermissionDiffViewer';
import CustomDomainTab from '../features/tenants/components/CustomDomainTab';
import DisasterRecoveryTab from '../features/tenants/components/DisasterRecoveryTab';
import WebhookMonitorTab from '../features/tenants/components/WebhookMonitorTab';
import ConfirmationModal from '../shared/components/ConfirmationModal';

type TabId = 'permissions' | 'domain' | 'backup' | 'webhooks';

const TenantDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'permissions', label: t('details.tabs.permissions'), icon: Shield },
    { id: 'domain', label: t('details.tabs.domain'), icon: Network },
    { id: 'backup', label: t('details.tabs.backup'), icon: DatabaseBackup },
    { id: 'webhooks', label: t('details.tabs.webhooks'), icon: Webhook },
  ];
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<TabId>('permissions');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [permData, setPermData] = useState<FeaturePermissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [localGranted, setLocalGranted] = useState<Set<string>>(new Set());
  const [localDisabledCore, setLocalDisabledCore] = useState<Set<string>>(new Set());
  const [savedGranted, setSavedGranted] = useState<Set<string>>(new Set());
  const [savedDisabledCore, setSavedDisabledCore] = useState<Set<string>>(new Set());
  const [permissionGroups, setPermissionGroups] = useState<api.PermissionGroup[]>([]);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    type: 'danger' | 'warning' | 'info' | 'success';
    showDiffViewer?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false, showDiffViewer: false }));
  };

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
      const granted = new Set<string>(pData.grantedFeaturePermissions);
      const disabledCore = new Set<string>(pData.disabledCorePermissions);
      setLocalGranted(granted);
      setSavedGranted(new Set(granted));
      setLocalDisabledCore(disabledCore);
      setSavedDisabledCore(new Set(disabledCore));
    } catch (err) {
      console.error(err);
      showToast(t('details.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, t, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sameSet = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && Array.from(a).every((value) => b.has(value));

  const hasPermissionChanges =
    !sameSet(localGranted, savedGranted) ||
    !sameSet(localDisabledCore, savedDisabledCore);

  const initialMatchingGroup = useMemo(() => {
    if (!permData || !permissionGroups.length) return null;
    return permissionGroups.find(group => {
      const groupPerms = new Set(group.permissions);
      return groupPerms.size === savedGranted.size &&
             Array.from(savedGranted).every(p => groupPerms.has(p));
    });
  }, [permissionGroups, savedGranted, permData]);

  const localMatchingGroup = useMemo(() => {
    if (!permData || !permissionGroups.length) return null;
    return permissionGroups.find(group => {
      const groupPerms = new Set(group.permissions);
      return groupPerms.size === localGranted.size &&
             Array.from(localGranted).every(p => groupPerms.has(p));
    });
  }, [permissionGroups, localGranted, permData]);

  const handleToggle = (perm: string, checked: boolean) => {
    setLocalGranted(prev => {
      const next = new Set(prev);
      if (checked) next.add(perm);
      else next.delete(perm);
      return next;
    });
  };

  const handleApplyTemplate = (perms: string[]) => {
    const allowed = new Set<string>(permData?.featurePermissions ?? []);
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

  const handleSavePermissions = (bypassConfirm = false) => {
    if (!id || !permData?.corePermissions) return;

    if (
      !bypassConfirm &&
      initialMatchingGroup &&
      (!localMatchingGroup || localMatchingGroup.id !== initialMatchingGroup.id)
    ) {
      setConfirmModal({
        isOpen: true,
        title: t('permissions.overrideTitle'),
        message: t('permissions.confirmOverride', {
          groupName: initialMatchingGroup.name,
        }),
        type: 'warning',
        confirmText: t('permissions.decoupleConfirm'),
        cancelText: t('common.cancel'),
        showDiffViewer: true,
        onConfirm: () => {
          closeConfirmModal();
          handleSavePermissions(true);
        }
      });
      return;
    }

    startTransition(async () => {
      try {
        const enabledCore = permData.corePermissions.filter(
          (corePerm) => !localDisabledCore.has(corePerm),
        );
        const [featureResult, coreResult] = await Promise.all([
          api.setFeaturePermissions(id, Array.from(localGranted)),
          api.setCorePermissions(id, enabledCore),
        ]);
        const granted = new Set<string>(featureResult.grantedFeaturePermissions ?? []);
        const disabledCore = new Set<string>(coreResult.disabledCorePermissions ?? []);
        setLocalGranted(granted);
        setSavedGranted(new Set(granted));
        setLocalDisabledCore(disabledCore);
        setSavedDisabledCore(new Set(disabledCore));
        showToast(t('permissions.saveSuccess'), 'success');
      } catch (err: any) {
        console.error(err);
        showToast(err.response?.data?.message || t('permissions.saveError'), 'error');
      }
    });
  };

  const handleResetPermissions = () => {
    setLocalGranted(new Set(savedGranted));
    setLocalDisabledCore(new Set(savedDisabledCore));
    showToast(t('permissions.resetSuccess'), 'success');
  };

  const handleGrantAll = () => {
    setConfirmModal({
      isOpen: true,
      title: t('permissions.grantAll'),
      message: t('permissions.confirmGrantAll'),
      type: 'warning',
      confirmText: t('permissions.grantAll'),
      cancelText: t('common.cancel'),
      onConfirm: () => {
        handleApplyTemplate(permData?.featurePermissions ?? []);
        closeConfirmModal();
      }
    });
  };

  const handleRevokeAll = () => {
    setConfirmModal({
      isOpen: true,
      title: t('permissions.revokeAll'),
      message: t('permissions.confirmRevokeAll'),
      type: 'danger',
      confirmText: t('permissions.revokeAll'),
      cancelText: t('common.cancel'),
      onConfirm: () => {
        handleApplyTemplate([]);
        closeConfirmModal();
      }
    });
  };

  const handleToggleStatus = () => {
    if (!id || !tenant) return;
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmKey = nextStatus === 'SUSPENDED' ? 'details.confirmSuspend' : 'details.confirmActivate';
    const confirmTitle = nextStatus === 'SUSPENDED'
      ? t('details.suspend')
      : t('details.activate');

    setConfirmModal({
      isOpen: true,
      title: confirmTitle,
      message: t(confirmKey, { name: tenant.name }),
      type: nextStatus === 'SUSPENDED' ? 'danger' : 'success',
      confirmText: confirmTitle,
      cancelText: t('common.cancel'),
      onConfirm: () => {
        closeConfirmModal();
        startTransition(async () => {
          try {
            const updated = await api.updateTenantStatus(id, nextStatus);
            setTenant(updated);
            showToast(
              nextStatus === 'ACTIVE'
                ? t('details.activateSuccess', { name: tenant.name })
                : t('details.suspendSuccess', { name: tenant.name }),
              'success'
            );
          } catch (err: any) {
            console.error(err);
            showToast(
              err.response?.data?.message || t('details.statusError'),
              'error'
            );
          }
        });
      }
    });
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!tenant) return <div>{t('details.tenantNotFound')}</div>;

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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-linear-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
              <Building2 size={28} className="sm:size-8" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">{tenant.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  tenant.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
                }`}>
                  {tenant.status === 'ACTIVE' ? t('common.active') : t('common.suspended')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] sm:text-[13px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Globe size={14} className="text-slate-400" /> {tenant.alias}</span>
                <span className="flex items-center gap-1.5"><Crown size={14} className="text-slate-400" /> {tenant.subscriptionPlan}</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-400" /> {tenant.storageQuota?.usedMB ?? 0}/{tenant.storageQuota?.limitMB ?? 0} MB</span>
                {tenant.customDomain && (
                  <span className="flex items-center gap-1.5">
                    <Network size={14} className="text-slate-400" />
                    <span className="font-mono">{tenant.customDomain}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      tenant.customDomainStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>{tenant.customDomainStatus}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => navigate(`/audit-logs?targetId=${tenant.id}&targetType=TENANT`)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg font-semibold transition-all text-[13px] text-slate-700 dark:text-slate-200"
            >
              <Activity size={14} />
              {t('details.viewLog')}
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all text-[13px] disabled:opacity-50 ${
                tenant.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}
            >
              {tenant.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
              {tenant.status === 'ACTIVE' ? t('details.suspend') : t('details.activate')}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? 'border-primary text-primary bg-primary/3'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'permissions' && (
            <PermissionManager
              corePermissions={permData?.corePermissions ?? []}
              featurePermissions={permData?.featurePermissions ?? []}
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
              isSaving={isPending}
              hasChanges={hasPermissionChanges}
            />
          )}

          {activeTab === 'domain' && (
            <CustomDomainTab tenantId={tenant.id} tenantAlias={tenant.alias} />
          )}

          {activeTab === 'backup' && (
            <DisasterRecoveryTab tenantId={tenant.id} tenantAlias={tenant.alias} />
          )}

          {activeTab === 'webhooks' && (
            <WebhookMonitorTab tenantId={tenant.id} />
          )}
        </div>
      </div>

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        isConfirming={isPending}
        size={confirmModal.showDiffViewer ? 'lg' : 'sm'}
      >
        {confirmModal.showDiffViewer && initialMatchingGroup && (
          <PermissionDiffViewer
            groupPermissions={initialMatchingGroup.permissions}
            tenantCurrentPermissions={Array.from(localGranted)}
          />
        )}
      </ConfirmationModal>
    </div>
  );
};

export default TenantDetailPage;
