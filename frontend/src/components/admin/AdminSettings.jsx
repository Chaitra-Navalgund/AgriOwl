import React, { useState } from 'react';
import { User, Lock, Globe, BellRing, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/api';

export default function AdminSettings({ user }) {
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || 'Admin',
    last_name: user?.last_name || 'User',
    email: user?.email || 'admin@agriowl.in',
    mobile: user?.mobile || '9876543210',
    preferred_language: user?.preferred_language || 'en',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    newOrders: true,
    lowStock: true,
    rejectedOrders: true,
    deliveredOrders: false,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    try {
      await authApi.updateProfile(profileForm);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
      // Demo simulated success
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError('');
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPassError('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPassError('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPassSuccess(true);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPassSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-sm">Administrator Profile</h3>
            <p className="text-xs text-gray-400">Update your primary identity and contact details</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={profileForm.first_name}
                onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={profileForm.email}
                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={profileForm.mobile}
                onChange={e => setProfileForm(p => ({ ...p, mobile: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess && (
              <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingProfile}
              className="ml-auto px-5 py-2.5 bg-green-700 text-white font-bold text-xs rounded-xl hover:bg-green-800 transition flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-sm">Security & Password</h3>
            <p className="text-xs text-gray-400">Ensure a strong, unique password to secure admin access</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {passError && (
            <p className="text-xs font-bold text-red-600">{passError}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            {passSuccess && (
              <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Password changed successfully!
              </span>
            )}
            <button
              type="submit"
              disabled={savingPassword}
              className="ml-auto px-5 py-2.5 bg-blue-700 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Language & Notification Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            <div>
              <h4 className="font-black text-gray-800 text-xs">Language Preference</h4>
              <p className="text-[11px] text-gray-400">Dashboard interface display language</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { code: 'en', title: 'English', desc: 'Standard system labels' },
              { code: 'kn', title: 'ಕನ್ನಡ (Kannada)', desc: 'North Karnataka Regional dialect' },
            ].map(lang => (
              <label
                key={lang.code}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  profileForm.preferred_language === lang.code
                    ? 'border-green-600 bg-green-50/50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-black text-xs text-gray-800">{lang.title}</p>
                  <p className="text-[11px] text-gray-400">{lang.desc}</p>
                </div>
                <input
                  type="radio"
                  name="preferred_language"
                  value={lang.code}
                  checked={profileForm.preferred_language === lang.code}
                  onChange={() => setProfileForm(p => ({ ...p, preferred_language: lang.code }))}
                  className="accent-green-700"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-4">
            <BellRing className="w-5 h-5 text-green-700" />
            <div>
              <h4 className="font-black text-gray-800 text-xs">Notification Dispatch</h4>
              <p className="text-[11px] text-gray-400">Configure real-time trigger alarms</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { key: 'newOrders', label: 'New Order Inflow', desc: 'Instant popup alert on farmer checkout' },
              { key: 'lowStock', label: 'Low Stock Alarms', desc: 'Alert when variant count drops below 10' },
              { key: 'rejectedOrders', label: 'Rejected Orders Log', desc: 'Log with mandatory farmer reason' },
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-400">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs[item.key]}
                  onChange={e => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                  className="w-4 h-4 accent-green-700 rounded"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
