import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import * as api from '../api';
import TenantTable from '../features/tenants/components/TenantTable';

const TenantsPage = () => {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t('tenants.title')}</h1>
          <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
          <Plus size={20} />
          Provision Tenant
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <TenantTable tenants={tenants} onBulkAction={handleBulkAction} />
      )}
    </div>
  );
};

export default TenantsPage;
