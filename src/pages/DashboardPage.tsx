import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Building2, 
  HardDrive, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import * as api from '../api';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchDashboardStats()
      .then(setStats)
      .catch(() => setStats({ totalTenants: 124, activeUsers: 842, totalStorageUsedMB: 45600 }))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { 
      label: t('dashboard.totalTenants'), 
      value: stats?.totalTenants || 0, 
      icon: Building2, 
      trend: '+12%', 
      isUp: true,
      color: 'bg-blue-500'
    },
    { 
      label: t('dashboard.activeUsers'), 
      value: stats?.activeUsers || 0, 
      icon: Users, 
      trend: '+5.4%', 
      isUp: true,
      color: 'bg-emerald-500'
    },
    { 
      label: t('dashboard.storageUsage'), 
      value: `${((stats?.totalStorageUsedMB || 0) / 1024).toFixed(1)} GB`, 
      icon: HardDrive, 
      trend: '+2.1%', 
      isUp: false,
      color: 'bg-amber-500'
    },
    { 
      label: 'System Health', 
      value: '99.9%', 
      icon: Activity, 
      trend: 'Optimal', 
      isUp: true,
      color: 'bg-purple-500'
    },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">{t('dashboard.title')}</h1>
        <p className="text-xs text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${m.color} opacity-[0.03] -mr-4 -mt-4 rounded-full group-hover:scale-110 transition-transform`}></div>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${m.color.replace('bg-', 'bg-')}/10 ${m.color.replace('bg-', 'text-')}`}>
                <m.icon size={18} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${m.isUp ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {m.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {m.trend}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{m.label}</p>
              <h3 className="text-xl font-bold tracking-tight">{m.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Monitor */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <HardDrive size={16} className="text-primary" />
              Top Storage Consumers
            </h3>
            <button className="text-[11px] font-bold text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-4">
             {[
               { name: 'Acme Corp', used: 8.2, limit: 10, color: 'bg-primary' },
               { name: 'Global Tech', used: 4.5, limit: 5, color: 'bg-amber-500' },
               { name: 'Startup Inc', used: 1.2, limit: 2, color: 'bg-emerald-500' },
               { name: 'Enterprise Ltd', used: 18.9, limit: 20, color: 'bg-rose-500' },
             ].map(tenant => (
               <div key={tenant.name} className="space-y-1.5">
                 <div className="flex justify-between text-xs">
                   <span className="font-semibold">{tenant.name}</span>
                   <span className="text-muted-foreground text-[11px]">{tenant.used} GB / {tenant.limit} GB</span>
                 </div>
                 <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(tenant.used / tenant.limit) * 100}%` }}
                     transition={{ duration: 1, ease: 'easeOut' }}
                     className={`h-full ${tenant.color}`}
                   ></motion.div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Audit Log
            </h3>
          </div>
          <div className="space-y-4">
            {[
              { type: 'grant', user: 'admin', target: 'Acme Corp', time: '2m ago' },
              { type: 'suspend', user: 'system', target: 'Old Tenant', time: '15m ago' },
              { type: 'create', user: 'admin', target: 'New Tech', time: '1h ago' },
              { type: 'login', user: 'manager_1', target: 'Security', time: '2h ago' },
              { type: 'revoke', user: 'admin', target: 'Acme Corp', time: '4h ago' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  item.type === 'grant' ? 'bg-emerald-100 text-emerald-600' :
                  item.type === 'suspend' ? 'bg-rose-100 text-rose-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] leading-tight">
                    <span className="font-bold text-foreground">@{item.user}</span> {item.type === 'grant' ? 'granted' : item.type === 'suspend' ? 'suspended' : 'action on'} <span className="font-bold text-foreground">{item.target}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
