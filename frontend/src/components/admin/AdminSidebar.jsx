import React from 'react';
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, Users,
  TrendingUp, BarChart2, Bell, Settings, LogOut, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'orders',        label: 'Orders',         icon: ShoppingBag },
  { id: 'products',      label: 'Products',       icon: Package },
  { id: 'inventory',     label: 'Inventory',      icon: Warehouse },
  { id: 'farmers',       label: 'Farmers',        icon: Users },
  { id: 'revenue',       label: 'Revenue',        icon: TrendingUp },
  { id: 'analytics',     label: 'Analytics',      icon: BarChart2 },
  { id: 'notifications', label: 'Notifications',  icon: Bell },
  { id: 'settings',      label: 'Settings',       icon: Settings },
];

export default function AdminSidebar({ activeSection, setActiveSection, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) {

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #14532d 0%, #166534 60%, #15803d 100%)' }}>

      {/* ── Logo / Brand ── */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-11 h-11 rounded-2xl bg-white/95 p-1.5 flex items-center justify-center shrink-0 shadow-xl ring-2 ring-green-400/30">
          <img
            src="/logo-icon-transparent.png"
            alt="AgriOwl"
            className="h-8 w-auto object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-black text-white text-[15px] tracking-tight block leading-tight">AgriOwl</span>
            <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#86efac' }}>Admin Console</p>
          </div>
        )}
      </div>

      {/* ── Nav Items ── */}
      <nav className="flex-1 py-5 space-y-1 px-3 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveSection(id); setMobileOpen(false); }}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-150
                ${isActive
                  ? 'bg-white text-green-800 shadow-lg shadow-black/20'
                  : 'text-green-100/75 hover:bg-white/10 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-600 ring-2 ring-green-300 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Collapse Toggle (desktop) ── */}
      <div className="hidden md:flex px-3 pb-3 pt-2 border-t border-white/10">
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`flex items-center gap-2 text-green-300/60 hover:text-white transition-all text-xs font-bold w-full py-2 px-2 rounded-lg hover:bg-white/10 ${collapsed ? 'justify-center' : ''}`}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>
          }
        </button>
      </div>

      {/* ── Logout ── */}
      <div className="px-3 pb-5">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}
        style={{ minHeight: '100%' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col h-full shadow-2xl" style={{ background: 'linear-gradient(180deg, #14532d 0%, #166534 60%, #15803d 100%)' }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-green-300 hover:text-white transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
