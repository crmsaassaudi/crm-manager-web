import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Building2, 
  HardDrive, 
  Activity
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
      .catch(() => setStats({ totalTenants: 5, activeUsers: 0, totalStorageUsedMB: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { 
      label: t('dashboard.totalTenants'), 
      value: stats?.totalTenants || 0, 
      icon: Building2, 
      trend: '+12%', 
      isUp: true,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      label: t('dashboard.activeUsers'), 
      value: stats?.activeUsers || 0, 
      icon: Users, 
      trend: '+5.4%', 
      isUp: true,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { 
      label: t('dashboard.storageUsage'), 
      value: `${((stats?.totalStorageUsedMB || 0) / 1024).toFixed(1)} GB`, 
      icon: HardDrive, 
      trend: '+2.1%', 
      isUp: false,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20'
    },
    { 
      label: 'Sức khỏe hệ thống', 
      value: '99.9%', 
      icon: Activity, 
      trend: 'Optimal', 
      isUp: true,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
  ];

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-[13px] text-slate-500 font-medium uppercase tracking-wider mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div 
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-[#0F172A] p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-lg ${m.bg} ${m.color}`}>
                <m.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${m.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                {m.trend}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{m.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{m.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Monitor */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <HardDrive size={18} className="text-primary" />
              Tiêu thụ bộ nhớ hàng đầu
            </h3>
            <button className="text-[12px] font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors uppercase">Xem tất cả</button>
          </div>
          <div className="space-y-5">
             {[
               { name: 'Acme Corp', used: 8.2, limit: 10, color: 'bg-primary' },
               { name: 'Global Tech', used: 4.5, limit: 5, color: 'bg-amber-500' },
               { name: 'Startup Inc', used: 1.2, limit: 2, color: 'bg-emerald-500' },
               { name: 'Enterprise Ltd', used: 18.9, limit: 20, color: 'bg-rose-500' },
             ].map(tenant => (
               <div key={tenant.name} className="space-y-2">
                 <div className="flex justify-between text-[13px] font-semibold">
                   <span className="text-slate-700 dark:text-slate-300">{tenant.name}</span>
                   <span className="text-slate-500 font-medium">{tenant.used} GB / {tenant.limit} GB</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(tenant.used / tenant.limit) * 100}%` }}
                     transition={{ duration: 1, ease: 'easeOut' }}
                     className={`h-full ${tenant.color} shadow-sm`}
                   ></motion.div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <Activity size={18} className="text-primary" />
              Lịch sử hoạt động
            </h3>
          </div>
          <div className="space-y-5">
            {[
              { type: 'grant', user: 'admin', target: 'Acme Corp', time: '2 phút trước' },
              { type: 'suspend', user: 'system', target: 'Old Tenant', time: '15 phút trước' },
              { type: 'create', user: 'admin', target: 'New Tech', time: '1 giờ trước' },
              { type: 'login', user: 'manager_1', target: 'Security', time: '2 giờ trước' },
              { type: 'revoke', user: 'admin', target: 'Acme Corp', time: '4 giờ trước' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  item.type === 'grant' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                  item.type === 'suspend' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                  'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-slate-200">@{item.user}</span> {item.type === 'grant' ? 'đã cấp quyền' : item.type === 'suspend' ? 'đã tạm khóa' : 'thao tác trên'} <span className="font-bold text-slate-900 dark:text-slate-200">{item.target}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.time}</p>
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
