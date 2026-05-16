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
      case 'ENTERPRISE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'PRO': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'STARTER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'SUSPENDED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-accent/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-accent/50 border-none rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg mr-1"
              >
                <span className="text-[10px] font-bold text-primary tracking-tight">{selectedIds.size} SELECTED</span>
                <div className="w-px h-3 bg-primary/20 mx-1"></div>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'suspend')}
                  className="p-1 hover:bg-primary/10 rounded text-primary transition-colors"
                  title="Suspend selected"
                >
                  <ShieldAlert size={14} />
                </button>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'delete')}
                  className="p-1 hover:bg-destructive/10 rounded text-destructive transition-colors"
                  title="Delete selected"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-xs font-semibold transition-colors">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="px-4 py-3 w-8">
                  <input 
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border text-primary focus:ring-primary/20 h-3.5 w-3.5"
                  />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('tenants.table.name')}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('tenants.table.plan')}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('tenants.table.status')}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Permissions</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('tenants.table.createdAt')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((tenant) => {
                const id = tenant._id || tenant.id;
                const isSelected = selectedIds.has(id);
                
                return (
                  <motion.tr 
                    key={id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group hover:bg-accent/30 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}
                    onClick={() => navigate(`/tenants/${id}`)}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-border text-primary focus:ring-primary/20 h-3.5 w-3.5"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{tenant.name}</div>
                        <div className="text-[10px] text-muted-foreground">{tenant.alias}</div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPlanStyles(tenant.subscriptionPlan)}`}>
                        {tenant.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyles(tenant.status).replace('bg-', 'bg-').split(' ')[0].replace('-100', '-500')}`}></div>
                        <span className={`text-[11px] font-medium ${getStatusStyles(tenant.status).split(' ')[1]}`}>
                          {tenant.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground font-medium">
                      {tenant.availablePermissions?.length || 0} granted
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground opacity-0 group-hover:opacity-100 transition-all">
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
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Search size={24} />
            </div>
            <h3 className="text-sm font-bold mb-0.5">No tenants found</h3>
            <p className="text-muted-foreground text-[11px]">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantTable;
