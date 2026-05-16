import { useState, useMemo } from 'react';
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
  onToggle: (perm: string, checked: boolean) => void;
  onGrantAll: () => void;
  onRevokeAll: () => void;
  onApplyTemplate: (perms: string[]) => void;
  isSaving: boolean;
}

const TEMPLATES = [
  { name: 'SILVER', perms: ['leads:read', 'contacts:read', 'accounts:read', 'deals:read'] },
  { name: 'GOLD', perms: ['leads:*', 'contacts:*', 'accounts:*', 'deals:read', 'reports:read'] },
  { name: 'PLATINUM', perms: ['leads:*', 'contacts:*', 'accounts:*', 'deals:*', 'reports:*', 'campaigns:*', 'tickets:*'] },
];

const PermissionManager: React.FC<PermissionManagerProps> = ({
  corePermissions,
  featurePermissions,
  grantedPermissions,
  onToggle,
  onGrantAll,
  onRevokeAll,
  onApplyTemplate,
  isSaving
}) => {
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

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button 
            onClick={() => setActiveTab('feature')}
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'feature' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
          >
            Features
          </button>
          <button 
            onClick={() => setActiveTab('core')}
            className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter transition-all ${activeTab === 'core' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}
          >
            Core Access
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-[12px] w-52 focus:ring-1 focus:ring-primary/30 outline-none"
            />
          </div>
          {activeTab === 'feature' && (
            <div className="flex items-center gap-1.5">
               <button 
                 onClick={onRevokeAll}
                 disabled={isSaving}
                 className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all shadow-sm"
                 title="Revoke All"
               >
                 <RotateCcw size={14} />
               </button>
               <button 
                 onClick={onGrantAll}
                 disabled={isSaving}
                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all shadow-sm"
                 title="Grant All"
               >
                 <Zap size={14} />
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Template Selector */}
      {activeTab === 'feature' && (
        <div className="bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Quick Templates</span>
          </div>
          <div className="flex gap-2">
            {TEMPLATES.map(template => (
              <button
                key={template.name}
                onClick={() => onApplyTemplate(template.perms)}
                disabled={isSaving}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all shadow-sm"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Permission List */}
      <div className="space-y-2">
        {Object.entries(currentGroups).map(([resource, perms]) => {
          const isExpanded = expandedGroups.has(resource) || search.length > 0;
          const activeCount = perms.filter(p => grantedPermissions.has(p)).length;
          
          return (
            <div key={resource} className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => toggleGroup(resource)}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Shield size={14} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{resource}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{perms.length} AVAILABLE</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-tighter">
                    {activeCount} / {perms.length} ACTIVE
                  </div>
                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10"
                  >
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {perms.map(perm => {
                        const isGranted = grantedPermissions.has(perm) || activeTab === 'core';
                        return (
                          <div 
                            key={perm}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isGranted ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'}`}
                          >
                            <span className={`text-[11px] font-mono font-bold truncate mr-1 ${isGranted ? 'text-primary' : 'text-slate-500'}`} title={perm}>
                              {perm.split(':')[1] || perm}
                            </span>
                            
                            {activeTab === 'feature' ? (
                              <button 
                                onClick={() => onToggle(perm, !isGranted)}
                                disabled={isSaving}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-sm ${isGranted ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                              >
                                {isGranted ? <Check size={12} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                              </button>
                            ) : (
                              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Check size={12} />
                              </div>
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
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce z-[100]">
          <Save size={14} className="animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Saving Changes</span>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
