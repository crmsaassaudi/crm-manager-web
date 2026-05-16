import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Search,
  Shield,
  UserPlus,
} from 'lucide-react';
import * as api from '../api';

const ManagerUsersPage = () => {
  const [users, setUsers] = useState<api.ManagerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    temporaryPassword: '',
    sendInvite: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      setUsers(await api.fetchManagerUsers());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.firstName, user.lastName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [search, users]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const created = await api.createManagerUser({
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        temporaryPassword: form.temporaryPassword || undefined,
        sendInvite: form.sendInvite,
      });

      setForm({
        email: '',
        firstName: '',
        lastName: '',
        temporaryPassword: '',
        sendInvite: true,
      });
      await loadUsers();

      if (created.temporaryPassword) {
        setMessage(`Created. Temporary password: ${created.temporaryPassword}`);
      } else if (created.inviteError) {
        setMessage(`Created, but invite failed: ${created.inviteError}`);
      } else {
        setMessage('Manager user created and invite email queued.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not create user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: api.ManagerUser) => {
    setSaving(true);
    setMessage(null);
    try {
      await api.updateManagerUser(user.id, {
        status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      await loadUsers();
      setMessage('Manager user status updated.');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Could not update user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manager Users
          </h1>
          <p className="text-[13px] text-slate-500 font-medium mt-1">
            Create platform users that can sign in to this manager console.
          </p>
        </div>
        {message && (
          <div className="max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0F172A] dark:text-slate-300">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Add Manager User
              </h2>
              <p className="text-[12px] text-slate-500">
                Tenant-scoped permissions will be added later.
              </p>
            </div>
          </div>

          <form onSubmit={(event) => void createUser(event)} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                placeholder="First name"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
              <input
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Last name"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                required
                placeholder="manager@company.com"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <div className="relative">
              <KeyRound
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.temporaryPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    temporaryPassword: event.target.value,
                  }))
                }
                type="password"
                placeholder="Temporary password, optional"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.sendInvite}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sendInvite: event.target.checked,
                  }))
                }
              />
              Send Keycloak password setup email
            </label>
            <button
              type="submit"
              disabled={saving || !form.email}
              className="w-full h-10 rounded-lg bg-primary text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Create manager user
            </button>
          </form>
        </section>

        <section className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center dark:bg-slate-800">
                <Shield size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Console Access
                </h2>
                <p className="text-[12px] text-slate-500">
                  {users.length} manager account(s)
                </p>
              </div>
            </div>
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users"
                className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/70 dark:bg-slate-800/30">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">
                    User
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">
                    Keycloak
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') ||
                          user.email}
                      </div>
                      <div className="text-[12px] text-slate-400">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        {user.keycloakId ? 'Linked' : 'Missing'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {user.status || 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void toggleStatus(user)}
                        disabled={saving}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ManagerUsersPage;
