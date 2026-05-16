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
                  {tenant.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><Globe size={14} className="text-slate-400" /> {tenant.alias}</span>
                <span className="flex items-center gap-1.5"><Crown size={14} className="text-slate-400" /> {tenant.subscriptionPlan}</span>
                <span className="flex items-center gap-1.5"><HardDrive size={14} className="text-slate-400" /> {tenant.storageQuota.usedMB}/{tenant.storageQuota.limitMB} MB</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-lg font-bold transition-all text-[12px] uppercase tracking-tight text-slate-700 dark:text-slate-200 shadow-sm">
              <Activity size={16} />
              Xem Log
            </button>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-[12px] uppercase tracking-tight shadow-sm ${
              tenant.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
            }`}>
              {tenant.status === 'ACTIVE' ? <PowerOff size={16} /> : <Power size={16} />}
              {tenant.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Manager */}
      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kiểm soát quyền truy cập</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-1">Cấu hình các tính năng và quyền hạn cốt lõi cho không gian làm việc này.</p>
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

export default TenantDetailPage;
