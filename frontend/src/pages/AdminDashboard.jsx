import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi, orderApi, productApi } from '../services/api';
import { setStored, getStored, mergeStoredArray, STORE_KEYS } from '../utils/persistentStore';
import { SEED_PRODUCTS, SEED_INVENTORY, SEED_FARMERS } from '../utils/seedData';

import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminDashboardHome from '../components/admin/AdminDashboardHome';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminInventory from '../components/admin/AdminInventory';
import AdminFarmers from '../components/admin/AdminFarmers';
import AdminRevenue from '../components/admin/AdminRevenue';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminNotifications from '../components/admin/AdminNotifications';
import AdminSettings from '../components/admin/AdminSettings';

// ── Logout Confirmation Modal ──────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
            <LogOut className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-800">Log Out of Admin Console?</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Your session will end. You'll need to log in again to access the admin dashboard.
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <span>Any unsaved changes will be discarded. Pending actions like order approvals will remain saved.</span>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 bg-gray-100 text-gray-800 font-bold text-sm rounded-2xl hover:bg-gray-200 transition"
          >
            No, Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="py-3 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-700 transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: extract farmer profile from an order ───────────────────────────────
function farmerFromOrder(order) {
  const addr = order.address || {};
  return {
    id: `f_${order.farmer_mobile || addr.mobile || order.farmer_name || Date.now()}`,
    username: (order.farmer_name || addr.full_name || 'farmer').toLowerCase().replace(/\s+/g, '_'),
    first_name: (order.farmer_name || addr.full_name || 'Farmer').split(' ')[0],
    last_name: (order.farmer_name || addr.full_name || '').split(' ').slice(1).join(' '),
    email: addr.email || '',
    mobile: order.farmer_mobile || addr.mobile || '',
    district: addr.district || 'Karnataka',
    state: addr.state || 'Karnataka',
    date_joined: order.created_at || new Date().toISOString(),
    total_orders: 1,
    total_spending: Number(order.total_amount) || 0,
    is_active: true,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard({ setCurrentTab }) {
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Core Data States
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // ── Seed default data once if store is empty ─────────────────────────────────
  const ensureSeeded = useCallback(() => {
    if (!getStored(STORE_KEYS.PRODUCTS)) {
      setStored(STORE_KEYS.PRODUCTS, SEED_PRODUCTS);
    }
    if (!getStored(STORE_KEYS.INVENTORY)) {
      setStored(STORE_KEYS.INVENTORY, SEED_INVENTORY);
    }
    if (!getStored(STORE_KEYS.FARMERS)) {
      setStored(STORE_KEYS.FARMERS, SEED_FARMERS);
    }
    if (!getStored(STORE_KEYS.ORDERS)) {
      setStored(STORE_KEYS.ORDERS, []);
    }
    if (!getStored(STORE_KEYS.NOTIFICATIONS)) {
      setStored(STORE_KEYS.NOTIFICATIONS, []);
    }
  }, []);

  // ── Load all admin data ───────────────────────────────────────────────────────
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    // Make sure defaults exist first
    ensureSeeded();

    try {
      const [
        statsRes,
        ordersRes,
        productsRes,
        catRes,
        invRes,
        farmersRes,
        revRes,
        notifRes
      ] = await Promise.allSettled([
        adminApi.getStats(),
        orderApi.getOrders(),
        productApi.getProducts({}),
        productApi.getCategories(),
        adminApi.getInventory(),
        adminApi.getFarmers(),
        adminApi.getRevenue(),
        adminApi.getNotifications()
      ]);

      // ── 1. ORDERS: merge API + persistentStore ──────────────────────────────
      let apiOrders = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data?.data) {
        apiOrders = ordersRes.value.data.data;
      }
      // Also read old-style localStorage for backward compat
      let legacyOrders = [];
      try { legacyOrders = JSON.parse(localStorage.getItem('agriowl_orders') || '[]'); } catch {}
      const storedOrders = getStored(STORE_KEYS.ORDERS) || [];

      // Build order map: API first, then legacy, then persistentStore last.
      // persistentStore has FINAL authority — admin actions (reject/confirm) written
      // there must never be overwritten by a stale API response on the next poll.
      const orderMap = new Map();
      apiOrders.forEach(o => orderMap.set(String(o.order_id), o));
      legacyOrders.forEach(o => {
        const key = String(o.order_id);
        if (!orderMap.has(key)) orderMap.set(key, o);
        else orderMap.set(key, { ...orderMap.get(key), ...o });
      });
      storedOrders.forEach(o => {
        const key = String(o.order_id);
        const existing = orderMap.get(key);
        if (!existing) {
          orderMap.set(key, o);
        } else {
          // If local store has an actioned status (rejected=-1 or confirmed≥1)
          // and the API still returns pending (0), keep the local actioned status.
          const localStatus = o.order_status;
          const apiStatus = existing.order_status;
          if ((localStatus === -1 || localStatus >= 1) && apiStatus === 0) {
            orderMap.set(key, { ...existing, ...o });
          } else {
            orderMap.set(key, { ...o, ...existing });
          }
        }
      });

      const combinedOrders = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      // Persist merged orders
      setStored(STORE_KEYS.ORDERS, combinedOrders);
      setOrders(combinedOrders);

      // ── 2. FARMERS: merge API + orders + persistentStore ───────────────────
      let apiFarmers = [];
      if (farmersRes.status === 'fulfilled' && farmersRes.value?.data?.data) {
        apiFarmers = farmersRes.value.data.data;
      }
      const storedFarmers = getStored(STORE_KEYS.FARMERS) || SEED_FARMERS;
      const farmerMap = new Map();
      storedFarmers.forEach(f => farmerMap.set(String(f.id), f));
      apiFarmers.forEach(f => farmerMap.set(String(f.id), { ...farmerMap.get(String(f.id)) || {}, ...f }));

      // Auto-extract farmers from orders that have address info
      combinedOrders.forEach(order => {
        if (!order.address && !order.farmer_mobile) return;
        const derived = farmerFromOrder(order);
        const key = `f_${derived.mobile || derived.first_name}`;
        if (!farmerMap.has(key)) {
          farmerMap.set(key, { ...derived, id: key });
        } else {
          // Update order count / spending for existing farmer
          const existing = farmerMap.get(key);
          farmerMap.set(key, {
            ...existing,
            total_orders: (existing.total_orders || 0) + 1,
            total_spending: (existing.total_spending || 0) + Number(order.total_amount || 0),
          });
        }
      });

      const combinedFarmers = Array.from(farmerMap.values());
      setStored(STORE_KEYS.FARMERS, combinedFarmers);
      setFarmers(combinedFarmers);

      // ── 3. NOTIFICATIONS ─────────────────────────────────────────────────────
      let apiNotifs = [];
      if (notifRes.status === 'fulfilled' && notifRes.value?.data?.data) {
        apiNotifs = notifRes.value.data.data;
      }
      let legacyNotifs = [];
      try { legacyNotifs = JSON.parse(localStorage.getItem('agriowl_notifications') || '[]'); } catch {}
      const storedNotifs = getStored(STORE_KEYS.NOTIFICATIONS) || [];

      // Build a lookup of non-pending order IDs so we can suppress their pending notifs
      const nonPendingOrderIds = new Set(
        combinedOrders.filter(o => o.order_status !== 0).map(o => String(o.order_id))
      );

      const notifMap = new Map();
      storedNotifs.forEach(n => notifMap.set(String(n.id || n.message), n));
      legacyNotifs.forEach(n => notifMap.set(String(n.id || n.message), n));
      // API notifs: skip NEW_ORDER entries for orders that are no longer pending
      apiNotifs.forEach(n => {
        if (n.type === 'NEW_ORDER') {
          const match = String(n.message || '').match(/#(\S+)/);
          const oId = match ? match[1].replace(/[^a-zA-Z0-9]/g, '') : null;
          if (oId && nonPendingOrderIds.has(oId)) return; // suppress stale pending notif
        }
        notifMap.set(String(n.id || n.message), n);
      });

      // Remove any pending_* entries for orders that are no longer pending
      nonPendingOrderIds.forEach(oId => {
        notifMap.delete(`pending_${oId}`);
      });

      // Auto-generate notifications for STILL pending orders only
      combinedOrders.filter(o => o.order_status === 0).forEach(po => {
        const key = `pending_${po.order_id}`;
        if (!notifMap.has(key)) {
          notifMap.set(key, {
            id: key,
            type: 'NEW_ORDER',
            message: `New Order #${po.order_id} placed by ${po.farmer_name || po.address?.full_name || 'Farmer'} for ₹${Math.round(po.total_amount)}. Action required: Accept or Reject.`,
            status: 'UNREAD',
            created_at: po.created_at || new Date().toISOString()
          });
        }
      });

      const combinedNotifs = Array.from(notifMap.values()).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setStored(STORE_KEYS.NOTIFICATIONS, combinedNotifs);
      setNotifications(combinedNotifs);

      // ── 4. PRODUCTS ──────────────────────────────────────────────────────────
      let combinedProducts = getStored(STORE_KEYS.PRODUCTS) || SEED_PRODUCTS;
      if (productsRes.status === 'fulfilled' && productsRes.value?.data?.data?.length > 0) {
        const apiProducts = productsRes.value.data.data;
        const prodMap = new Map();
        combinedProducts.forEach(p => prodMap.set(String(p.id), p));
        apiProducts.forEach(p => prodMap.set(String(p.id), { ...prodMap.get(String(p.id)) || {}, ...p }));
        combinedProducts = Array.from(prodMap.values());
        setStored(STORE_KEYS.PRODUCTS, combinedProducts);
      }
      setProducts(combinedProducts);

      // ── 5. CATEGORIES ────────────────────────────────────────────────────────
      if (catRes.status === 'fulfilled' && catRes.value?.data?.data?.length > 0) {
        setCategories(catRes.value.data.data);
      } else {
        setCategories([
          { id: 1, name: 'Fertilizers' },
          { id: 2, name: 'Pesticides' },
          { id: 3, name: 'Seeds' },
          { id: 4, name: 'Irrigation' },
          { id: 5, name: 'Tools & Equipment' },
        ]);
      }

      // ── 6. INVENTORY ─────────────────────────────────────────────────────────
      let combinedInventory = getStored(STORE_KEYS.INVENTORY) || SEED_INVENTORY;
      if (invRes.status === 'fulfilled' && invRes.value?.data?.data?.length > 0) {
        const apiInv = invRes.value.data.data;
        const invMap = new Map();
        combinedInventory.forEach(i => invMap.set(String(i.id), i));
        apiInv.forEach(i => invMap.set(String(i.id), { ...invMap.get(String(i.id)) || {}, ...i }));
        combinedInventory = Array.from(invMap.values());
        setStored(STORE_KEYS.INVENTORY, combinedInventory);
      }
      setInventory(combinedInventory);

      // ── 7. STATS / KPIs ──────────────────────────────────────────────────────
      const totalRevenue = combinedOrders
        .filter(o => o.order_status >= 1)
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      const statusCounts = {};
      const statusNames = { '-1': 'Rejected', '0': 'Pending', '1': 'Confirmed', '2': 'Shipped', '3': 'Out for Delivery', '4': 'Delivered' };
      combinedOrders.forEach(o => {
        const sName = statusNames[String(o.order_status)] || 'Unknown';
        statusCounts[sName] = (statusCounts[sName] || 0) + 1;
      });
      const dynamicStatusDist = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      const dynamicPaymentDist = [
        { method: 'COD', count: combinedOrders.filter(o => o.payment_method === 'COD').length || 1 },
        { method: 'UPI', count: combinedOrders.filter(o => o.payment_method === 'UPI').length },
        { method: 'CARD', count: combinedOrders.filter(o => o.payment_method === 'CARD').length },
      ].filter(p => p.count > 0);

      let fetchedStats = statsRes.status === 'fulfilled' ? statsRes.value?.data : null;
      setStats({
        kpis: {
          total_products: combinedProducts.length,
          total_orders: combinedOrders.length,
          pending_orders: combinedOrders.filter(o => o.order_status === 0).length,
          delivered_orders: combinedOrders.filter(o => o.order_status === 4).length,
          total_revenue: totalRevenue || (fetchedStats?.kpis?.total_revenue || 0),
          low_stock_count: combinedInventory.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock').length,
        },
        status_distribution: dynamicStatusDist.length ? dynamicStatusDist : (fetchedStats?.status_distribution || []),
        payment_distribution: dynamicPaymentDist.length ? dynamicPaymentDist : (fetchedStats?.payment_distribution || []),
        sales_trend: fetchedStats?.sales_trend || [
          { day: 'Mon', sales: Math.round(totalRevenue * 0.12) || 1200 },
          { day: 'Tue', sales: Math.round(totalRevenue * 0.18) || 2400 },
          { day: 'Wed', sales: Math.round(totalRevenue * 0.22) || 1800 },
          { day: 'Thu', sales: Math.round(totalRevenue * 0.15) || 3100 },
          { day: 'Fri', sales: Math.round(totalRevenue * 0.20) || 2800 },
          { day: 'Sat', sales: Math.round(totalRevenue * 0.13) || 1950 },
        ]
      });

      if (revRes.status === 'fulfilled') setRevenueData(revRes.value.data);

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [ensureSeeded]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Logout handlers ──────────────────────────────────────────────────────────
  const handleLogoutRequest = () => setShowLogoutModal(true);
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    setCurrentTab('home');
  };
  const handleLogoutCancel = () => setShowLogoutModal(false);

  const unreadNotifCount = notifications.filter(n => n.status !== 'READ').length;
  const pendingOrdersCount = orders.filter(o => o.order_status === 0).length;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#F7FAF7] overflow-hidden text-gray-800 flex flex-row z-50">
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <LogoutModal onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />
      )}

      {/* Collapsible / Responsive Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onLogout={handleLogoutRequest}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <AdminTopbar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          unreadCount={unreadNotifCount}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onGoHome={() => setCurrentTab('home')}
          onLogout={handleLogoutRequest}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={() => loadData(false)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Real-time Pending Order Action Banner */}
          {pendingOrdersCount > 0 && activeSection !== 'orders' && (
            <div className="mb-5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-base shrink-0">
                  🔔
                </span>
                <div>
                  <p className="text-sm font-black">
                    {pendingOrdersCount} New Farmer Order{pendingOrdersCount > 1 ? 's' : ''} Awaiting Confirmation!
                  </p>
                  <p className="text-xs text-amber-100 font-medium">
                    Farmers have submitted orders that require admin acceptance or rejection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSection('orders')}
                className="px-4 py-2 bg-white text-amber-800 hover:bg-amber-50 font-black text-xs rounded-xl shadow-sm transition"
              >
                Review Orders Now →
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-72">
              <Loader2 className="w-10 h-10 text-green-700 animate-spin" />
              <p className="text-xs font-bold text-gray-500 mt-3">Loading AgriOwl Admin Management...</p>
            </div>
          ) : (
            <>
              {activeSection === 'dashboard' && (
                <AdminDashboardHome
                  stats={stats}
                  orders={orders}
                  onRefresh={loadData}
                  setActiveSection={setActiveSection}
                />
              )}

              {activeSection === 'orders' && (
                <AdminOrders
                  orders={orders}
                  setOrders={(updatedOrders) => {
                    setOrders(updatedOrders);
                    // Persist order changes immediately
                    if (Array.isArray(updatedOrders)) {
                      setStored(STORE_KEYS.ORDERS, updatedOrders);
                    }
                  }}
                  searchQuery={searchQuery}
                  onRefresh={loadData}
                />
              )}

              {activeSection === 'products' && (
                <AdminProducts
                  products={products}
                  setProducts={(updatedProducts) => {
                    const next = typeof updatedProducts === 'function' ? updatedProducts(products) : updatedProducts;
                    setProducts(next);
                    setStored(STORE_KEYS.PRODUCTS, next);
                  }}
                  categories={categories}
                  searchQuery={searchQuery}
                />
              )}

              {activeSection === 'inventory' && (
                <AdminInventory
                  inventory={inventory}
                  setInventory={(updatedInv) => {
                    const next = typeof updatedInv === 'function' ? updatedInv(inventory) : updatedInv;
                    setInventory(next);
                    setStored(STORE_KEYS.INVENTORY, next);
                  }}
                  products={products}
                  setProducts={(updatedProds) => {
                    const next = typeof updatedProds === 'function' ? updatedProds(products) : updatedProds;
                    setProducts(next);
                    setStored(STORE_KEYS.PRODUCTS, next);
                  }}
                  searchQuery={searchQuery}
                  onRefresh={loadData}
                />
              )}

              {activeSection === 'farmers' && (
                <AdminFarmers
                  farmers={farmers}
                  setFarmers={(updatedFarmers) => {
                    const next = typeof updatedFarmers === 'function' ? updatedFarmers(farmers) : updatedFarmers;
                    setFarmers(next);
                    setStored(STORE_KEYS.FARMERS, next);
                  }}
                  searchQuery={searchQuery}
                />
              )}

              {activeSection === 'revenue' && (
                <AdminRevenue
                  revenueData={revenueData}
                />
              )}

              {activeSection === 'analytics' && (
                <AdminAnalytics
                  stats={stats}
                  orders={orders}
                />
              )}

              {activeSection === 'notifications' && (
                <AdminNotifications
                  notifications={notifications}
                  setNotifications={(updatedNotifs) => {
                    const next = typeof updatedNotifs === 'function' ? updatedNotifs(notifications) : updatedNotifs;
                    setNotifications(next);
                    setStored(STORE_KEYS.NOTIFICATIONS, next);
                  }}
                />
              )}

              {activeSection === 'settings' && (
                <AdminSettings
                  user={user}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
