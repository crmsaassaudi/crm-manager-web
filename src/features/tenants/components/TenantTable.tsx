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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0F172A] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[320px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg pl-10 pr-4 py-2 text-[13px] focus:ring-1 focus:ring-primary/30 outline-none"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary/30 outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="SUSPENDED">Tạm khóa</option>
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
                <span className="text-[11px] font-bold text-primary tracking-tight uppercase">{selectedIds.size} ĐÃ CHỌN</span>
                <div className="w-px h-3 bg-primary/10 mx-1"></div>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'suspend')}
                  className="p-1 hover:bg-primary/10 rounded text-primary transition-colors"
                >
                  <ShieldAlert size={16} />
                </button>
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'delete')}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[12px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight transition-colors shadow-sm">
            <Download size={16} />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-4 w-4"
                  />
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('tenants.table.name')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('tenants.table.plan')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('tenants.table.status')}</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Quyền hạn</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('tenants.table.createdAt')}</th>
                <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{tenant.name}</div>
                        <div className="text-[11px] font-medium text-slate-400 tracking-wide">{tenant.alias}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPlanStyles(tenant.subscriptionPlan)}`}>
                        {tenant.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyles(tenant.status).replace('bg-', 'bg-').split(' ')[0].replace('-50', '-500')}`}></div>
                        <span className={`text-[12px] font-semibold ${getStatusStyles(tenant.status).split(' ')[1]}`}>
                          {tenant.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                      {tenant.availablePermissions?.length || 0} quyền được cấp
                    </td>
                    <td className="px-4 py-3 text-[11px] font-medium text-slate-400">
                      {new Date(tenant.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-200 mb-1">Không có kết quả</h3>
            <p className="text-slate-400 text-[13px] font-medium">Không tìm thấy khách hàng nào khớp với bộ lọc hiện tại.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantTable;
