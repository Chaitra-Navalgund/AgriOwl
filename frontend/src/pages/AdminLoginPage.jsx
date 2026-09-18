import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, Sprout } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage({ setCurrentTab }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(username, password);
    setLoading(false);
    if (result?.success) {
      if (result.user?.role === 'ADMIN' || result.user?.is_staff || result.user?.username === 'admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('home');
      }
    } else {
      setError(result?.message || 'Invalid credentials. Use admin / AgriOwl2026!');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <div className="bg-white w-full max-w-md rounded-3xl border-2 border-agri-light shadow-xl p-8 space-y-6">
        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">
            <img
              src="/logo-icon-transparent.png"
              alt="AgriOwl Logo"
              className="h-20 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-agri-dark">AgriOwl Admin</h1>
            <p className="text-xs text-agri-textMuted mt-1 font-medium">Secure Administrator Login Portal</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-agri-dark mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
              className="w-full px-4 py-3 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-medium focus:outline-none focus:border-agri-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-agri-dark mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-4 pr-12 py-3 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-medium focus:outline-none focus:border-agri-primary transition"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-agri-textMuted hover:text-agri-dark p-1">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> : <><ShieldCheck className="w-4 h-4" /> Login to Admin Panel</>}
          </button>
        </form>

        <div className="text-center p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-bold text-amber-800">Demo Credentials:</p>
          <p className="text-xs text-amber-700 mt-0.5">Username: <span className="font-black font-mono">admin</span> | Password: <span className="font-black font-mono">AgriOwl2026!</span></p>
        </div>

        <button onClick={() => setCurrentTab('home')} className="w-full text-xs font-bold text-agri-primary hover:underline text-center">
          ← Back to Farmer Marketplace
        </button>
      </div>
    </div>
  );
}
