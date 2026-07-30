import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

interface ResetPasswordFormProps {
  token: string;
  email: string;
  onSuccess: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, email, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch(
        `${API_URL}/auth/verify-reset?token=${token}&email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
      } else {
        setError(data.error || 'Link reset tidak valid');
      }
    } catch (err) {
      setError('Gagal memverifikasi link reset');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reset password gagal');
      }

      setSuccess('Password berhasil direset! Silakan login dengan password baru.');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Memverifikasi link reset...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131b2e] border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Expired</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Kembali ke Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">Masukkan password baru untuk akun Anda</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password Baru</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                required
                disabled={isLoading || !!success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                required
                disabled={isLoading || !!success}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <>
                <span>Reset Password</span>
              </>
            )}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-4">
          <a
            href="/"
            className="block text-center text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Kembali ke halaman login
          </a>
        </div>

        <p className="text-[11px] text-center text-slate-500">
          WebPro Business Operations v2.5 • Secure Authentication
        </p>
      </div>
    </div>
  );
};
