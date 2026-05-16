import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as api from './api';
import AdminLayout from './shared/layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import TenantsPage from './pages/TenantsPage';
import TenantDetailPage from './pages/TenantDetailPage';
import { Shield, Check, X } from 'lucide-react';

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
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border transition-all animate-in slide-in-from-right duration-300 ${
            t.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {t.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span className="text-sm font-bold tracking-tight">{t.message}</span>
        </div>
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-primary/5 -z-10 blur-3xl rounded-full scale-150 animate-pulse"></div>
      <div className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30">
            <Shield size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">CRM Admin</h1>
            <p className="text-muted-foreground font-medium">Platform Management Console</p>
          </div>
          <div className="w-full h-px bg-border"></div>
          <button
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
            onClick={handleLogin}
          >
            Sign in to Console
          </button>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Secure Administrative Access Required</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      api.clearStoredAccessToken();
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/tenants/:id" element={<TenantDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
