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
    <div className="flex min-h-screen bg-background transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 72 : 240 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border shadow-sm"
      >
        <div className="p-4 h-16 flex items-center justify-between border-b border-border/50">
          {!isSidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-bold text-lg text-primary tracking-tight"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                <Zap size={18} fill="currentColor" />
              </div>
              <span>CRM Admin</span>
            </motion.div>
          )}
          {isSidebarCollapsed && (
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground mx-auto shadow-lg shadow-primary/20">
                <Zap size={18} fill="currentColor" />
             </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
              `}
            >
              <item.icon size={18} className="group-hover:scale-110 transition-transform" />
              {!isSidebarCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-sm"
          >
            <ChevronLeft size={18} className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            {!isSidebarCollapsed && <span className="font-medium">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'pl-[72px]' : 'pl-[240px]'}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border h-16 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4 text-muted-foreground">
             <div className="relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('common.search')} 
                  className="bg-accent/50 border-none rounded-xl pl-9 pr-4 py-1.5 text-xs w-56 focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:w-72"
                />
             </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Dropdown */}
            <div className="relative" ref={langRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors flex items-center gap-2"
              >
                <Globe size={18} />
                <span className="text-xs font-bold">{i18n.language.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent transition-colors ${i18n.language === lang.code ? 'text-primary font-bold bg-primary/5' : 'text-muted-foreground'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </div>
                        {i18n.language === lang.code && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full border border-background"></span>
            </button>

            <div className="h-6 w-px bg-border mx-2"></div>

            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button 
                onClick={() => setIsUserOpen(!isUserOpen)}
                className="flex items-center gap-3 p-1 pl-3 rounded-xl hover:bg-accent transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold leading-none">Admin User</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-1">Platform Manager</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-indigo-400 border border-border shadow-sm overflow-hidden">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </button>
              
              <AnimatePresence>
                {isUserOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border bg-accent/30">
                       <p className="text-xs font-bold">Logged in as</p>
                       <p className="text-xs text-muted-foreground truncate">admin@crm-manager.io</p>
                    </div>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors">
                      <User size={16} />
                      Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors">
                      <Shield size={16} />
                      Security
                    </button>
                    <div className="h-px bg-border my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10 transition-colors font-bold"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-[1400px] mx-auto">
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
