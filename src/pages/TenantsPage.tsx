import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import * as api from '../api';
import TenantTable from '../features/tenants/components/TenantTable';

const TenantsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenants = () => {
    setLoading(true);
    api.fetchTenants()
      .then(setTenants)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleBulkAction = async (ids: string[], action: string) => {
    // Implement bulk action logic here
    console.log(`Bulk action ${action} on`, ids);
    // Refresh list after action
    setTimeout(loadTenants, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('tenants.title')}</h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">{t('tenants.subtitle')}</p>
        </div>
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors shadow-sm"
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
        <TenantTable tenants={tenants} onBulkAction={handleBulkAction} />
      )}
    </div>
  );
};

export default TenantsPage;
