import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import * as api from '../api';
import { useToast } from '../shared/context/ToastContext';
import TenantTable from '../features/tenants/components/TenantTable';
import ConfirmationModal from '../shared/components/ConfirmationModal';

const TenantsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: api.fetchTenants,
  });

  const { data: permissionGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['permissionGroups'],
    queryFn: api.fetchPermissionGroups,
  });

  const loading = tenantsLoading || groupsLoading;

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  const handleBulkAction = async (ids: string[], action: string, data?: any) => {
    if (ids.length === 0) return;

    if (action === 'suspend') {
      setConfirmModal({
        isOpen: true,
        title: t('details.suspend', { defaultValue: 'Suspend Tenants' }),
        message: t('tenants.confirmBulkSuspend', {
          count: ids.length,
          defaultValue: `Are you sure you want to suspend the ${ids.length} selected tenant(s)? They will no longer be able to log in or use their workspace channels.`
        }),
        type: 'danger',
        confirmText: t('details.suspend', { defaultValue: 'Suspend' }),
        onConfirm: async () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setActionLoading(true);
          try {
            await Promise.all(ids.map(id => api.updateTenantStatus(id, 'SUSPENDED')));
            showToast(t('tenants.bulkSuspendSuccess', { count: ids.length, defaultValue: `Successfully suspended ${ids.length} selected tenant(s).` }), 'success');
            await queryClient.invalidateQueries({ queryKey: ['tenants'] });
          } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.message || t('tenants.bulkSuspendError', { defaultValue: 'Failed to suspend some tenants.' }), 'error');
          } finally {
            setActionLoading(false);
          }
        }
      });
      return;
    }

    if (action === 'apply-group') {
      setActionLoading(true);
      try {
        const groupName = permissionGroups.find(g => g.id === data?.groupId)?.name || 'selected template';
        await api.applyPermissionGroupToTenants(data.groupId, {
          tenantIds: ids,
          mode: data.mode
        });
        showToast(t('permissionGroups.applySuccessDetailed', { name: groupName, count: ids.length, defaultValue: `Successfully applied permission group "${groupName}" to ${ids.length} tenant(s).` }), 'success');
        await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      } catch (err: any) {
        console.error(err);
        showToast(err.response?.data?.message || t('permissionGroups.applyError'), 'error');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const targetTenantName = tenants.find(t => (t._id || t.id) === id)?.name || 'Tenant';
    const confirmTitle = nextStatus === 'SUSPENDED'
      ? t('details.suspend', { defaultValue: 'Suspend Tenant' })
      : t('details.activate', { defaultValue: 'Activate Tenant' });

    setConfirmModal({
      isOpen: true,
      title: confirmTitle,
      message: t(nextStatus === 'SUSPENDED' ? 'details.confirmSuspend' : 'details.confirmActivate', {
        name: targetTenantName,
        defaultValue: `Are you sure you want to ${nextStatus === 'SUSPENDED' ? 'suspend' : 'activate'} ${targetTenantName}?`
      }),
      type: nextStatus === 'SUSPENDED' ? 'danger' : 'success',
      confirmText: confirmTitle,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setActionLoading(true);
        try {
          await api.updateTenantStatus(id, nextStatus);
          showToast(
            nextStatus === 'ACTIVE'
              ? t('details.activateSuccess', { name: targetTenantName, defaultValue: `${targetTenantName} has been activated.` })
              : t('details.suspendSuccess', { name: targetTenantName, defaultValue: `${targetTenantName} has been suspended.` }),
            'success'
          );
          await queryClient.invalidateQueries({ queryKey: ['tenants'] });
        } catch (err: any) {
          console.error(err);
          showToast(err.response?.data?.message || t('details.statusError', { defaultValue: 'Could not change tenant status.' }), 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('tenants.title')}</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">{t('tenants.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-xl font-bold text-[13px] transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] w-full sm:w-auto"
        >
          <Plus size={16} />
          {t('tenants.addTenant')}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <TenantTable
          tenants={tenants}
          permissionGroups={permissionGroups}
          onBulkAction={handleBulkAction}
          onToggleStatus={handleToggleStatus}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={t('common.cancel')}
        isConfirming={actionLoading}
      />
    </div>
  );
};

export default TenantsPage;
