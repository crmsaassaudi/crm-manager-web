import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Search, 
  Check, 
  Zap, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Save,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PermissionManagerProps {
  corePermissions: string[];
  featurePermissions: string[];
  grantedPermissions: Set<string>;
  disabledCorePermissions: Set<string>;
  permissionGroups?: Array<{
    id: string;
    name: string;
    description?: string;
    permissions: string[];
  }>;
  onToggle: (perm: string, checked: boolean) => void;
  onToggleCore: (perm: string, checked: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onApplyTemplate: (perms: string[]) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({
  corePermissions,
  featurePermissions,
  grantedPermissions,
  disabledCorePermissions,
  permissionGroups = [],
  onToggle,
  onToggleCore,
  onGrantAll,
  onRevokeAll,
  onApplyTemplate,
  onSave,
  onReset,
  isSaving,
  hasChanges
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feature' | 'core'>('feature');

  const groupByResource = (perms: string[]) => {
    const groups: Record<string, string[]> = {};
    perms.forEach(p => {
      const [resource] = p.split(':');
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });
    return groups;
  };

  const featureGroups = useMemo(() => groupByResource(featurePermissions), [featurePermissions]);
  const coreGroups = useMemo(() => groupByResource(corePermissions), [corePermissions]);

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const filteredGroups = (groups: Record<string, string[]>) => {
    if (!search) return groups;
    const filtered: Record<string, string[]> = {};
    Object.entries(groups).forEach(([resource, perms]) => {
      const matches = perms.filter(p => p.toLowerCase().includes(search.toLowerCase()) || resource.toLowerCase().includes(search.toLowerCase()));
      if (matches.length > 0) filtered[resource] = matches;
    });
    return filtered;
  };

  const currentGroups = filteredGroups(activeTab === 'feature' ? featureGroups : coreGroups);

  const currentMatchingGroup = useMemo(() => {
    return permissionGroups.find(group => {
      const groupPerms = new Set(group.permissions);
      return groupPerms.size === grantedPermissions.size && 
             Array.from(grantedPermissions).every(p => groupPerms.has(p));
    });
  }, [permissionGroups, grantedPermissions]);

  return (
    <div className="space-y-5">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex bg-slate-100/50 dark:bg-slate-800/30 p-1 rounded-lg w-full lg:w-auto">
          <button 
            onClick={() => setActiveTab('feature')}
            className={`flex-1 lg:flex-none text-center px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'feature' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t('permissions.features')}
          </button>
          <button 
            onClick={() => setActiveTab('core')}
            className={`flex-1 lg:flex-none text-center px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${activeTab === 'core' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            {t('permissions.core')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder={t('permissions.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-[13px] w-full focus:ring-1 focus:ring-primary/30 outline-none shadow-sm text-slate-900 dark:text-white"
            />
          </div>
          {activeTab === 'feature' && (
            <div className="flex items-center gap-1.5 shrink-0">
               <button 
                 onClick={onRevokeAll}
                 disabled={isSaving}
                 className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all shadow-sm cursor-pointer"
                 title={t('permissions.revokeAll')}
               >
                 <RotateCcw size={16} />
               </button>
               <button 
                 onClick={onGrantAll}
                 disabled={isSaving}
                 className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all shadow-sm cursor-pointer"
                 title={t('permissions.grantAll')}
               >
                 <Zap size={16} />
               </button>
            </div>
          )}
          <button
            onClick={onReset}
            disabled={isSaving || !hasChanges}
            className="flex-1 sm:flex-none h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[12px] font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer whitespace-nowrap"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="flex-1 sm:flex-none h-9 px-3 rounded-xl bg-primary text-white text-[12px] font-bold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-primary/20 shadow-md whitespace-nowrap"
          >
            <Save size={14} />
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Configuration Drift Indicator Banner */}
      {activeTab === 'feature' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
            currentMatchingGroup 
              ? 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-950/50' 
              : 'bg-amber-50/40 border-amber-100 dark:bg-amber-500/5 dark:border-amber-950/50'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              currentMatchingGroup 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}>
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                  {t('permissions.syncStatus')}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                  currentMatchingGroup 
                    ? 'bg-emerald-100/60 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : 'bg-amber-100/60 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {currentMatchingGroup 
                    ? t('permissions.synced') 
                    : t('permissions.customOverride')}
                </span>
              </div>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {currentMatchingGroup 
                  ? t('permissions.syncedDesc', { name: currentMatchingGroup.name })
                  : t('permissions.driftDesc')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Template Selector */}
      {activeTab === 'feature' && (
        <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-3">
            <Layers size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">{t('permissions.quickTemplates')}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {permissionGroups.map(template => (
              <button
                key={template.id}
                onClick={() => onApplyTemplate(template.permissions)}
                disabled={isSaving}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[12px] font-bold tracking-tight transition-all shadow-sm uppercase cursor-pointer"
                title={template.description}
              >
                {template.name}
              </button>
            ))}
            {permissionGroups.length === 0 && (
              <span className="text-[12px] font-semibold text-slate-400">
                No permission groups yet
              </span>
            )}
          </div>
        </div>
      )}

      {/* Permission List */}
      <div className="space-y-3">
        {Object.entries(currentGroups).map(([resource, perms]) => {
          const isExpanded = expandedGroups.has(resource) || search.length > 0;
          const activeCount =
            activeTab === 'core'
              ? perms.filter(p => !disabledCorePermissions.has(p)).length
              : perms.filter(p => grantedPermissions.has(p)).length;
          
          return (
            <div key={resource} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
              <button 
                onClick={() => toggleGroup(resource)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700">
                    <Shield size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[15px] font-bold capitalize text-slate-900 dark:text-slate-100">{resource}</h4>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none mt-1.5">{perms.length} {t('permissions.available')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 uppercase tracking-tighter shadow-inner">
                    {activeCount} / {perms.length} {t('permissions.active')}
                  </div>
                  {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/5"
                  >
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map(perm => {
                        const isGranted =
                          activeTab === 'core'
                            ? !disabledCorePermissions.has(perm)
                            : grantedPermissions.has(perm);
                        return (
                          <div 
                            key={perm}
                            className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isGranted ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-70'}`}
                          >
                            <span className={`text-[12px] font-mono font-bold truncate mr-2 ${isGranted ? 'text-primary' : 'text-slate-500'}`} title={perm}>
                              {perm.split(':')[1] || perm}
                            </span>
                            
                            {activeTab === 'feature' ? (
                              <button 
                                onClick={() => onToggle(perm, !isGranted)}
                                disabled={isSaving}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-md ${isGranted ? 'bg-primary text-white shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              >
                                {isGranted ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                              </button>
                            ) : (
                              <button 
                                onClick={() => onToggleCore(perm, !isGranted)}
                                disabled={isSaving}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-md ${isGranted ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                title={isGranted ? 'Disable core permission' : 'Enable core permission'}
                              >
                                {isGranted ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {isSaving && (
        <div className="fixed bottom-8 right-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce z-[100] border border-white/10 dark:border-slate-900/10">
          <Save size={18} className="animate-pulse" />
          <span className="text-[12px] font-bold uppercase tracking-widest">{t('permissions.saving')}</span>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
