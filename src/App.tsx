import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as api from './api';
import AdminLayout from './shared/layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import PermissionGroupsPage from './pages/PermissionGroupsPage';
import ManagerUsersPage from './pages/ManagerUsersPage';
import CustomerOnboardingPage from './pages/CustomerOnboardingPage';
import AuditLogPage from './pages/AuditLogPage';
import { Shield, Check, X, ArrowRight, Zap, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Auth Types ───
type AuthUser = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
};

// ─── Toast System ───
type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let setToastsGlobal: React.Dispatch<React.SetStateAction<Toast[]>> | undefined;

export function showToast(message: string, type: ToastType = 'success') {
  const id = ++toastId;
  setToastsGlobal?.((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToastsGlobal?.((prev) => prev.filter((t) => t.id !== id));
  }, 3500);
}

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    setToastsGlobal = setToasts;
    return () => {
      setToastsGlobal = undefined;
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <motion.div 
          key={t.id} 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg border backdrop-blur-sm ${
            t.type === 'success' 
            ? 'bg-emerald-500/90 text-white border-emerald-400/50' 
            : 'bg-rose-500/90 text-white border-rose-400/50'
          }`}
        >
          {t.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span className="text-xs font-bold">{t.message}</span>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Login Screen ───
const LoginScreen = () => {
  const handleLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse transition-delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-[2rem] p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/20 rotate-3 hover:rotate-0 transition-transform">
              <Zap size={32} fill="currentColor" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg border-2 border-card flex items-center justify-center text-white">
              <Shield size={12} fill="currentColor" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">CRM Manager</h1>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Platform Administration Console</p>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-accent/30 rounded-2xl p-4 border border-border/50 text-left">
               <div className="flex items-center gap-3 text-primary mb-2">
                 <Lock size={16} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Security Notice</span>
               </div>
               <p className="text-[11px] text-muted-foreground leading-relaxed">
                 You are accessing the core infrastructure management layer. All actions are audited and recorded for compliance.
               </p>
            </div>

            <button
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              onClick={handleLogin}
            >
              Sign in to Console
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 flex items-center gap-4 text-muted-foreground opacity-40">
             <div className="h-px flex-1 bg-current"></div>
             <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise Security</span>
             <div className="h-px flex-1 bg-current"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('crm-manager-auth:logout', handleLogout);

    void api
      .fetchCurrentUser()
      .then(setUser)
      .catch(handleLogout)
      .finally(() => setCheckingAuth(false));

    return () => {
      window.removeEventListener('crm-manager-auth:logout', handleLogout);
    };
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <AdminLayout user={user}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/tenants/:id" element={<TenantDetailPage />} />
          <Route path="/permission-groups" element={<PermissionGroupsPage />} />
          <Route path="/users" element={<ManagerUsersPage />} />
          <Route path="/onboarding" element={<CustomerOnboardingPage />} />
          <Route path="/audit-logs" element={<AuditLogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
