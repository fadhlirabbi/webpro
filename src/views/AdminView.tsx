import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, ShieldCheck, Trash2, CheckCircle, XCircle,
  Key, Lock, Unlock, Eraser, RefreshCw, AlertTriangle, Check, Eye, EyeOff
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

interface AdminViewProps {
  token: string;
  onLogout: () => void;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  failed_attempts: number;
  locked_until: string | null;
  activeSessions: number;
  created_at: string;
}

interface Approval {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'approvals'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [tempPasswords, setTempPasswords] = useState<{ [key: string]: string }>({});

  const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        onLogout();
        throw new Error('Session expired');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan');
      }

      return { ok: response.ok, data };
    } catch (err: any) {
      throw err;
    }
  }, [token, onLogout]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, approvalsResult] = await Promise.all([
        fetchWithAuth('/admin/users'),
        fetchWithAuth('/admin/pending-approvals'),
      ]);

      setUsers(usersResult.data.users || []);
      setApprovals(approvalsResult.data.approvals || []);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleApprove = async (approvalId: string) => {
    setActionLoading(approvalId);
    try {
      const result = await fetchWithAuth('/admin/approve-user', {
        method: 'POST',
        body: JSON.stringify({ approvalId }),
      });
      showSuccess(result.data.message || 'User berhasil diapprove');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approvalId: string) => {
    const reason = prompt('Alasan penolakan (opsional):');
    if (reason === null) return;

    setActionLoading(approvalId);
    try {
      const result = await fetchWithAuth('/admin/reject-user', {
        method: 'POST',
        body: JSON.stringify({ approvalId, reason }),
      });
      showSuccess(result.data.message || 'User berhasil ditolak');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Yakin ingin menghapus user "${username}"?\nSemua datanya akan dihapus permanen!`)) return;

    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      showSuccess(result.data.message || 'User berhasil dihapus');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/unlock-user/${userId}`, {
        method: 'POST',
      });
      showSuccess(result.data.message || 'User berhasil diunlock');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/reset-user-password/${userId}`, {
        method: 'POST',
      });
      const tempPass = result.data.tempPassword || 'password123';
      setTempPasswords(prev => ({ ...prev, [userId]: tempPass }));
      setShowPassword(userId);
      showSuccess(`Password direset. Password sementara: ${tempPass}`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const result = await fetchWithAuth(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      showSuccess(result.data.message || 'Role berhasil diubah');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Ban user ini?\nUser tidak akan bisa login.')) return;

    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'banned' }),
      });
      showSuccess(result.data.message || 'User berhasil dibanned');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      locked: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      banned: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
    locked: users.filter(u => u.status === 'locked').length,
    banned: users.filter(u => u.status === 'banned').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            Admin Panel
          </h1>
          <p className="text-sm text-slate-400 mt-1">Kelola pengguna dan sistem</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400">Total User</div>
        </div>
        <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          <div className="text-xs text-slate-400">Active</div>
        </div>
        <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-slate-400">Pending</div>
        </div>
        <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.locked}</div>
          <div className="text-xs text-slate-400">Locked</div>
        </div>
        <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-800 text-center">
          <div className="text-2xl font-bold text-red-400">{stats.banned}</div>
          <div className="text-xs text-slate-400">Banned</div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${activeTab === 'users' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Users className="w-4 h-4 inline mr-1" /> Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors relative ${activeTab === 'approvals' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          <UserPlus className="w-4 h-4 inline mr-1" /> Pending Approvals
          {approvals.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {approvals.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Users Tab - Consolidated Table */}
          {activeTab === 'users' && (
            <div className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr className="text-left text-xs text-slate-400 uppercase">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Security</th>
                      <th className="px-4 py-3">Login</th>
                      <th className="px-4 py-3">Bergabung</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="text-sm hover:bg-slate-800/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{user.username}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs disabled:opacity-50"
                            disabled={user.role === 'admin' || actionLoading === user.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${user.failed_attempts >= 3 ? 'text-red-400' : 'text-slate-400'}`}>
                              Gagal: {user.failed_attempts}/3
                            </span>
                            {showPassword === user.id && tempPasswords[user.id] && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                <EyeOff className="w-3 h-3 inline" /> {tempPasswords[user.id]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${user.activeSessions >= 2 ? 'text-orange-400' : 'text-slate-400'}`}>
                            {user.activeSessions}/2 sesi
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(user.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {user.status === 'locked' && (
                              <button
                                onClick={() => handleUnlockUser(user.id)}
                                disabled={actionLoading === user.id}
                                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 disabled:opacity-50"
                                title="Unlock"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            {user.status !== 'banned' && user.role !== 'admin' && (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                disabled={actionLoading === user.id}
                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 disabled:opacity-50"
                                title="Ban User"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                disabled={actionLoading === user.id}
                                className="p-1.5 bg-red-600/20 text-red-500 rounded hover:bg-red-600/30 disabled:opacity-50"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Tidak ada user
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {approvals.length === 0 ? (
                <div className="bg-[#131b2e] p-8 rounded-xl border border-slate-800 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-slate-400">Tidak ada permintaan pendaftaran</p>
                </div>
              ) : (
                <div className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr className="text-left text-xs text-slate-400 uppercase">
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {approvals.map((approval) => (
                        <tr key={approval.id} className="text-sm">
                          <td className="px-4 py-3 font-medium text-white">{approval.username}</td>
                          <td className="px-4 py-3 text-slate-400">{approval.email}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(approval.created_at).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleApprove(approval.id)}
                                disabled={actionLoading === approval.id}
                                className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(approval.id)}
                                disabled={actionLoading === approval.id}
                                className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-1 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
