import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MoreHorizontal, 
  Download,
  ShieldAlert,
  Layers,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../../../api';
import Modal from '../../../shared/components/Modal';

interface Tenant {
  id: string;
  _id?: string;
  name: string;
  alias: string;
  status: string;
  subscriptionPlan: string;
  availablePermissions?: string[] | null;
  createdAt?: string;
}

interface TenantTableProps {
  tenants: Tenant[];
  permissionGroups: api.PermissionGroup[];
  onBulkAction?: (ids: string[], action: string, data?: any) => void | Promise<void>;
  onToggleStatus?: (id: string, currentStatus: string) => void | Promise<void>;
}

const TenantTable: React.FC<TenantTableProps> = ({ 
  tenants, 
  permissionGroups,
  onBulkAction,
  onToggleStatus
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Row dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply group modal states
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [targetTenantIds, setTargetTenantIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('merge');

  useEffect(() => {
    if (permissionGroups.length > 0) {
      setSelectedGroupId(permissionGroups[0].id);
    }
  }, [permissionGroups]);

  // Click outside to close row dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const openBulkApplyModal = () => {
    setTargetTenantIds(Array.from(selectedIds));
    setIsApplyModalOpen(true);
  };

  const openSingleApplyModal = (tenantId: string) => {
    setTargetTenantIds([tenantId]);
    setIsApplyModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleApplyPermissions = async () => {
    if (!selectedGroupId || targetTenantIds.length === 0) return;
    if (onBulkAction) {
      await onBulkAction(targetTenantIds, 'apply-group', {
        groupId: selectedGroupId,
        mode: applyMode
      });
    }
    setIsApplyModalOpen(false);
    setSelectedIds(new Set());
  };

  const getPlanStyles = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'PRO': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'STARTER': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default: return 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };



  const activeSelectedGroup = permissionGroups.find(g => g.id === selectedGroupId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[13px] focus:ring-1 focus:ring-primary/30 outline-none shadow-sm text-slate-900 dark:text-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-primary/30 outline-none shadow-sm cursor-pointer"
          >
            <option value="ALL">{t('common.allStatus')}</option>
            <option value="ACTIVE">{t('common.active')}</option>
            <option value="SUSPENDED">{t('common.suspended')}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 border border-primary/10 px-2.5 py-1 rounded-xl shadow-sm"
              >
                <span className="text-[11px] font-bold text-primary tracking-tight whitespace-nowrap">{selectedIds.size} {t('common.selected')}</span>
                <div className="w-px h-4 bg-primary/10 mx-1"></div>
                
                {/* Bulk Apply Permission Group */}
                <button 
                  onClick={openBulkApplyModal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 text-[11px] font-bold transition-all"
                  title="Apply Permission Group to batch"
                >
                  <Layers size={14} />
                  <span>{t('tenants.applyTemplate', { defaultValue: 'Apply Template' })}</span>
                </button>

                <div className="w-px h-4 bg-primary/10 mx-1"></div>

                {/* Bulk Suspend */}
                <button 
                  onClick={() => onBulkAction?.(Array.from(selectedIds), 'suspend')}
                  className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-rose-500 transition-colors"
                  title={t('details.suspend')}
                >
                  <ShieldAlert size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[13px] font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm cursor-pointer">
            <Download size={16} />
            {t('common.export')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <th className="px-4 py-3.5 w-10">
                  <input 
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('tenants.table.name')}</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-32">{t('tenants.table.plan')}</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-36">{t('tenants.table.status')}</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-40">{t('tenants.table.permissions')}</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-28">{t('tenants.table.createdAt')}</th>
                <th className="px-4 py-3.5 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((tenant) => {
                const id = tenant._id || tenant.id;
                const isSelected = selectedIds.has(id);
                
                return (
                  <motion.tr 
                    key={id}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5 dark:bg-primary/5' : ''}`}
                    onClick={() => navigate(`/tenants/${id}`)}
                  >
                    <td className="px-4 py-3.5" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary/20 h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <div className="text-[13px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{tenant.name}</div>
                        <div className="text-[11px] font-medium text-slate-400 tracking-wide mt-0.5">{tenant.alias}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPlanStyles(tenant.subscriptionPlan)}`}>
                        {tenant.subscriptionPlan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className={`text-[12px] font-bold ${tenant.status === 'ACTIVE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {tenant.status === 'ACTIVE' ? t('common.active') : t('common.suspended')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-2 py-0.5 rounded-lg text-slate-700 dark:text-slate-300">
                        {tenant.availablePermissions?.length || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider ml-1.5">
                        {t('tenants.table.permsGranted')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] font-bold text-slate-400">
                      {tenant.createdAt
                        ? new Date(tenant.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === id ? null : id)}
                        className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all ${openDropdownId === id ? 'opacity-100 bg-slate-100 dark:bg-slate-800' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {openDropdownId === id && (
                          <div ref={dropdownRef} className="absolute right-4 mt-1.5 w-48 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-30 text-left overflow-hidden">
                            <button
                              onClick={() => navigate(`/tenants/${id}`)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <ExternalLink size={14} className="text-slate-400" />
                              {t('details.viewLog', { defaultValue: 'View Details' })}
                            </button>
                            
                            <button
                              onClick={() => openSingleApplyModal(id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                            >
                              <Layers size={14} className="text-primary/75" />
                              {t('permissionGroups.applyToTenants', { defaultValue: 'Apply Template' })}
                            </button>
                            
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                            
                            <button
                              onClick={() => {
                                setOpenDropdownId(null);
                                if (onToggleStatus) void onToggleStatus(id, tenant.status);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-bold transition-colors ${
                                tenant.status === 'ACTIVE' 
                                  ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10' 
                                  : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                              }`}
                            >
                              <ShieldAlert size={14} className="shrink-0" />
                              {tenant.status === 'ACTIVE' ? t('details.suspend') : t('details.activate')}
                            </button>
                          </div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">{t('common.noResults')}</h3>
            <p className="text-slate-400 dark:text-slate-500 text-[12px] font-medium max-w-xs mx-auto">{t('common.noResultsDesc')}</p>
          </div>
        )}
      </div>

      {/* Apply Permission Group Modal Overlay */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <Layers size={18} className="text-primary" />
            <span>{t('permissionGroups.applyToTenants')}</span>
          </div>
        }
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[13px] font-bold text-slate-500 dark:text-slate-400 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleApplyPermissions}
              disabled={!selectedGroupId}
              className="px-4 py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-[13px] font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-lg shadow-primary/10"
            >
              <Check size={14} />
              {t('permissionGroups.applySelected')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 text-[12px]">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              Applying to <span className="text-primary font-black">{targetTenantIds.length}</span> selected tenant(s).
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Permission Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-[13px] outline-none text-slate-800 dark:text-slate-100 font-bold focus:ring-1 focus:ring-primary/30 cursor-pointer shadow-sm"
            >
              {permissionGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} {group.isSystem ? `(${t('permissionGroups.system')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Render selected group details if present */}
          {activeSelectedGroup && (
            <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/40 dark:border-slate-800/30 text-[12px]">
              <span className="block font-bold text-slate-800 dark:text-slate-200">{activeSelectedGroup.name}</span>
              <p className="text-[11px] text-slate-500 mt-1">{activeSelectedGroup.description || t('permissionGroups.noDescription')}</p>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[10px] font-mono font-bold border border-primary/10">
                  {activeSelectedGroup.permissions.length} feature permissions
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Apply Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['merge', 'replace'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setApplyMode(mode)}
                  className={`py-3 rounded-xl border text-[12px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm ${
                    applyMode === mode
                      ? 'border-primary bg-primary/5 text-primary dark:bg-primary/10 font-black'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80 dark:text-slate-400'
                  }`}
                >
                  <span className="uppercase text-[11px] tracking-wider">
                    {mode === 'replace' ? t('permissionGroups.replace') : t('permissionGroups.merge')}
                  </span>
                  <span className="text-[9px] font-medium lowercase tracking-tighter opacity-70">
                    {mode === 'replace' 
                      ? 'overwrites all current permissions' 
                      : 'combines with current permissions'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TenantTable;
