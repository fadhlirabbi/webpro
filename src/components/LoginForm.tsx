import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, ArrowLeft, Key } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082/api';

type FormMode = 'login' | 'register' | 'forgot';

interface LoginFormProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState(() => localStorage.getItem('webpro_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('webpro_remember_me') !== 'false');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setResetCode('');
    setNewPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const switchMode = (newMode: FormMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap isi email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Save to storage
      if (rememberMe) {
        localStorage.setItem('webpro_token', data.token);
        localStorage.setItem('webpro_user', JSON.stringify(data.user));
        localStorage.setItem('webpro_remembered_email', email);
        localStorage.setItem('webpro_remember_me', 'true');
      } else {
        sessionStorage.setItem('webpro_token', data.token);
        sessionStorage.setItem('webpro_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.token, data.user);

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setErrorMsg('Semua field wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registrasi gagal');
      }

      setSuccessMsg('Pendaftaran berhasil! Menunggu persetujuan admin. Cek email untuk informasi lebih lanjut.');
      setTimeout(() => switchMode('login'), 3000);

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Harap masukkan email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim link reset');
      }

      setSuccessMsg('Link reset password telah dikirim ke email Anda. Klik link tersebut untuk membuat password baru.');

    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== LOGIN FORM ====================
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">WebPro Admin Portal</h1>
            <p className="text-xs text-slate-400">Masuk ke dasbor manajemen stok, transaksi & laporan keuangan</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
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

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="hover:text-slate-200 transition-colors">Ingat Sesi Saya</span>
              </label>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative border-t border-slate-800 pt-4">
            <p className="text-center text-xs text-slate-400">
              Belum punya akun?{' '}
              <button
                onClick={() => switchMode('register')}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Daftar sekarang
              </button>
            </p>
          </div>

          <p className="text-[11px] text-center text-slate-500">
            WebPro Business Operations v2.5 • Secure Authentication
          </p>
        </div>
      </div>
    );
  }

  // ==================== REGISTER FORM ====================
  if (mode === 'register') {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <UserPlus className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Daftar Akun Baru</h1>
            <p className="text-xs text-slate-400">Buat akun untuk mengakses WebPro Admin</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username</label>
              <div className="relative">
                <UserPlus className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
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
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Memproses...</span>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative border-t border-slate-800 pt-4">
            <p className="text-center text-xs text-slate-400">
              Sudah punya akun?{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-cyan-400 hover:underline font-semibold cursor-pointer"
              >
                Masuk di sini
              </button>
            </p>
          </div>

          <button
            onClick={() => switchMode('login')}
            className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // ==================== FORGOT PASSWORD FORM ====================
  if (mode === 'forgot' && !resetCode && !newPassword) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Lupa Password</h1>
            <p className="text-xs text-slate-400">Masukkan email untuk reset password</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-pulse">Mengirim...</span>
              ) : (
                <span>Kirim Kode Reset</span>
              )}
            </button>
          </form>

          <button
            onClick={() => switchMode('login')}
            className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  // ==================== RESET PASSWORD FORM ====================
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#131b2e] border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Key className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">Masukkan kode dari email dan password baru</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Kode Reset (8 digit)</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="12345678"
                maxLength={8}
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors text-center tracking-widest font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password Baru</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
                required
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Memproses...</span>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <button
          onClick={() => switchMode('login')}
          className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </button>
      </div>
    </div>
  );
};
