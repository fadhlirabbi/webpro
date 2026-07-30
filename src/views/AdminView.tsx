import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserPlus, ShieldCheck, Trash2, Edit, CheckCircle, XCircle,
  Key, Activity, Lock, Unlock, Eraser, RefreshCw, AlertTriangle, Check
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
  activeSessions: number;
  created_at: string;
}

interface Approval {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface Stats {
  users: {
    total_users: number;
    active_users: number;
    pending_users: number;
    locked_users: number;
    banned_users: number
  };
  approvals: { total: number; pending: number };
  sessions: { active_sessions: number };
}

export const AdminView: React.FC<AdminViewProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'approvals'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const [usersResult, approvalsResult, statsResult] = await Promise.all([
        fetchWithAuth('/admin/users'),
        fetchWithAuth('/admin/pending-approvals'),
        fetchWithAuth('/admin/stats'),
      ]);

      setUsers(usersResult.data.users || []);
      setApprovals(approvalsResult.data.approvals || []);
      setStats(statsResult.data);
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
    if (reason === null) return; // User cancelled

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
    if (!confirm('Reset password user ini?\nPassword baru akan dikirim ke email user.')) return;

    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/reset-user-password/${userId}`, {
        method: 'POST',
      });
      showSuccess(`Password direset.\nPassword sementara: ${result.data.tempPassword}`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEraseData = async (userId: string) => {
    if (!confirm('⚠️ PERINGATAN!\nSemua data user akan dihapus permanen!\n\nYakin melanjutkan?')) return;
    if (!confirm('Konfirmasi:\nKlik OK untuk menghapus semua data.')) return;

    setActionLoading(userId);
    try {
      const result = await fetchWithAuth(`/admin/erase-user-data/${userId}`, {
        method: 'POST',
      });
      showSuccess(result.data.message || 'Semua data user berhasil dihapus');
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
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
        >
          <Activity className="w-4 h-4 inline mr-1" /> Overview
        </button>
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
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800">
                <div className="text-3xl font-bold text-white">{stats.users.total_users}</div>
                <div className="text-sm text-slate-400">Total Users</div>
              </div>
              <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800">
                <div className="text-3xl font-bold text-green-400">{stats.users.active_users}</div>
                <div className="text-sm text-slate-400">Active Users</div>
              </div>
              <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800">
                <div className="text-3xl font-bold text-yellow-400">{stats.approvals.pending}</div>
                <div className="text-sm text-slate-400">Pending Approvals</div>
              </div>
              <div className="bg-[#131b2e] p-4 rounded-xl border border-slate-800">
                <div className="text-3xl font-bold text-cyan-400">{stats.sessions.active_sessions}</div>
                <div className="text-sm text-slate-400">Active Sessions</div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-[#131b2e] rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr className="text-left text-xs text-slate-400 uppercase">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Sessions</th>
                      <th className="px-4 py-3">Failed</th>
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
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                            disabled={user.role === 'admin' || actionLoading === user.id}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                        <td className="px-4 py-3">
                          <span className={user.activeSessions >= 2 ? 'text-orange-400' : 'text-slate-400'}>
                            {user.activeSessions}/2
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={user.failed_attempts >= 3 ? 'text-red-400' : 'text-slate-400'}>
                            {user.failed_attempts}/3
                          </span>
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
                            <button
                              onClick={() => handleEraseData(user.id)}
                              disabled={actionLoading === user.id}
                              className="p-1.5 bg-orange-500/20 text-orange-400 rounded hover:bg-orange-500/30 disabled:opacity-50"
                              title="Erase All Data"
                            >
                              <Eraser className="w-4 h-4" />
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
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                approvals.map((approval) => (
                  <div key={approval.id} className="bg-[#131b2e] p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{approval.username}</div>
                        <div className="text-sm text-slate-400">{approval.email}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(approval.created_at).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval.id)}
                          disabled={actionLoading === approval.id}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === approval.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
