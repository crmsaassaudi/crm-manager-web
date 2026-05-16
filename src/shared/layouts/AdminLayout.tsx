import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../core/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  ChevronLeft, 
  Bell,
  Search,
  Zap,
  LogOut,
  User,
  ChevronDown,
  Check
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../../api';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) setIsLangOpen(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setIsUserOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    api.clearStoredAccessToken();
    window.location.reload();
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('common.dashboard'), path: '/' },
    { id: 'tenants', icon: Users, label: t('common.tenants'), path: '/tenants' },
    { id: 'settings', icon: Settings, label: t('common.settings'), path: '/settings' },
  ];

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 64 : 220 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="h-14 flex items-center px-4 border-b border-slate-100 dark:border-slate-800/50">
          <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/20">
              <Zap size={16} fill="currentColor" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-black text-sm tracking-tighter text-slate-900 dark:text-white uppercase">CRM Admin</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5 mt-3">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-primary/5 text-primary' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
              `}
            >
              <item.icon size={16} className={`transition-transform duration-200 ${isSidebarCollapsed ? 'mx-auto' : ''}`} />
              {!isSidebarCollapsed && (
                <span className="text-[13px] font-semibold tracking-tight">{item.label}</span>
              )}
              {/* Active Indicator */}
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive && !isSidebarCollapsed ? "absolute left-0 w-1 h-4 bg-primary rounded-r-full" : "hidden"} 
              />
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-100 dark:border-slate-800/50">
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180 mx-auto' : ''}`} />
            {!isSidebarCollapsed && <span className="text-[12px] font-bold uppercase tracking-wider">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-16' : 'pl-[220px]'}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-6 justify-between shadow-sm shadow-slate-200/20 dark:shadow-none">
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search anything..." 
                  className="bg-slate-100 dark:bg-slate-800/50 border-none rounded-lg pl-9 pr-4 py-1.5 text-[12px] w-48 focus:ring-1 focus:ring-primary/30 outline-none transition-all focus:w-64"
                />
             </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="h-8 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Globe size={16} />
                <span className="text-[11px] font-black">{i18n.language.toUpperCase()}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i18n.language === lang.code ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                        {i18n.language === lang.code && <Check size={12} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white dark:border-[#0F172A]"></span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5"></div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button 
                onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[11px] font-black leading-none text-slate-900 dark:text-white">Admin User</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">Manager</p>
                </div>
                <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isUserOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isUserOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Logged in as</p>
                       <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 truncate">admin@crm-manager.io</p>
                    </div>
                    <div className="p-1 space-y-0.5">
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <User size={14} className="text-slate-400" />
                        Profile Settings
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <Shield size={14} className="text-slate-400" />
                        Security
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors font-bold"
                      >
                        <LogOut size={14} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-5 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

const Shield = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

export default AdminLayout;
