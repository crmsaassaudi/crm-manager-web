import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal, 
  Download,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Tenant {
  id: string;
  _id: string;
  name: string;
  alias: string;
  status: string;
  subscriptionPlan: string;
  availablePermissions: string[] | null;
  createdAt: string;
}

interface TenantTableProps {
  tenants: Tenant[];
  onBulkAction?: (ids: string[], action: string) => void;
}

const TenantTable: React.FC<TenantTableProps> = ({ tenants, onBulkAction }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                         t.alias.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t._id || t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const getPlanStyles = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'PRO': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'STARTER': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'SUSPENDED': return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      default: return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0F172A] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-[12px] focus:ring-1 focus:ring-primary/30 outline-none"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg px-3 py-1.5 text-[12px] font-semibold focus:ring-1 focus:ring-primary/30 outline-none"
          >
            <option value="ALL">ALL STATUS</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-2 py-1 rounded-lg"
              >
                <span className="text-[10px] font-black text-primary tracking-tighter uppercase">{selectedIds.size} SELECTED</span>
                <div className="w-px h-3 bg-primary/10 mx-0.5"></div>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'suspend')}
                  className="p-1 hover:bg-primary/10 rounded text-primary transition-colors"
                >
                  <ShieldAlert size={14} />
                </button>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'delete')}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded text-rose-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-black uppercase tracking-tight transition-colors shadow-sm">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-4 py-2.5 w-8">
                  <input 
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-3.5 w-3.5"
                  />
                </th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tenants.table.name')}</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tenants.table.plan')}</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tenants.table.status')}</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Permissions</th>
                <th className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('tenants.table.createdAt')}</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((tenant) => {
                const id = tenant._id || tenant.id;
                const isSelected = selectedIds.has(id);
                
                return (
                  <motion.tr 
                    key={id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => navigate(`/tenants/${id}`)}
                  >
                    <td className="px-4 py-2" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-3.5 w-3.5"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 dark:text-slate-200 group-hover:text-primary transition-colors">{tenant.name}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{tenant.alias}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getPlanStyles(tenant.subscriptionPlan)}`}>
                        {tenant.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyles(tenant.status).replace('bg-', 'bg-').split(' ')[0].replace('-50', '-500')}`}></div>
                        <span className={`text-[11px] font-bold uppercase ${getStatusStyles(tenant.status).split(' ')[1]}`}>
                          {tenant.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                      {tenant.availablePermissions?.length || 0} granted
                    </td>
                    <td className="px-4 py-2 text-[10px] font-medium text-slate-400 uppercase">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={14} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Search size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-200 uppercase mb-0.5">No results</h3>
            <p className="text-slate-400 text-[11px] font-medium">No tenants match your current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantTable;
