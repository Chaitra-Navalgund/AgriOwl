import React, { useState } from 'react';
import { Bell, Search, Menu, ChevronDown, LogOut, Home, RefreshCw } from 'lucide-react';

const PAGE_TITLES = {
  dashboard:     'Dashboard Overview',
  orders:        'Orders Management',
  products:      'Product Management',
  inventory:     'Inventory Control',
  farmers:       'Farmer Records',
  revenue:       'Revenue & Finance',
  analytics:     'Analytics & Insights',
  notifications: 'Notifications',
  settings:      'Settings',
};

const PAGE_SUBTITLES = {
  dashboard:     'Real-time stats and insights',
  orders:        'Track and manage all orders',
  products:      'Manage your product catalog',
  inventory:     'Monitor stock levels',
  farmers:       'Manage registered farmers',
  revenue:       'Financial overview',
  analytics:     'Trends and performance',
  notifications: 'System alerts and messages',
  settings:      'Configure your platform',
};

export default function AdminTopbar({ activeSection, setActiveSection, user, unreadCount, onMenuOpen, onGoHome, onLogout, searchQuery, setSearchQuery, onRefresh }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const initials = (user?.first_name?.[0] || user?.username?.[0] || 'A').toUpperCase();

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-16 flex items-center gap-4 sticky top-0 z-30 shrink-0" style={{ boxShadow: '0 1px 8px 0 rgba(0,0,0,0.06)' }}>

      {/* Mobile hamburger */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title block */}
      <div className="hidden sm:flex flex-col justify-center shrink-0 border-r border-gray-100 pr-5 mr-1" style={{ minWidth: 160 }}>
        <h1 className="text-sm font-black text-gray-800 leading-tight">{PAGE_TITLES[activeSection] || 'Admin'}</h1>
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{PAGE_SUBTITLES[activeSection] || ''}</p>
      </div>

      {/* Mobile title */}
      <h1 className="sm:hidden text-sm font-black text-gray-800 shrink-0">{PAGE_TITLES[activeSection] || 'Admin'}</h1>

      {/* Search bar */}
      <div className="flex-1 max-w-xs lg:max-w-sm flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-green-300 transition focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`Search ${PAGE_TITLES[activeSection]?.toLowerCase() || ''}...`}
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none flex-1 min-w-0"
        />
      </div>

      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh data"
            className="hidden md:flex p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-green-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Farmer View */}
        <button
          onClick={onGoHome}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border"
          style={{ background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Farmer View</span>
        </button>

        {/* Notification bell */}
        <button
          onClick={() => setActiveSection && setActiveSection('notifications')}
          title="Notifications"
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-green-700 transition"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Admin avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a, #14532d)' }}
            >
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-black text-gray-800 leading-tight">{user?.first_name || user?.username || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 font-medium">Administrator</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                      style={{ background: 'linear-gradient(135deg, #16a34a, #14532d)' }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{user?.first_name || user?.username}</p>
                      <p className="text-[10px] text-gray-400">{user?.email || 'admin@agriowl.in'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); onGoHome(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-semibold transition"
                >
                  <Home className="w-4 h-4 text-green-600" /> Farmer View
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); onLogout(); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold transition border-t border-gray-100"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
