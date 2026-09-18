import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Package, ShoppingBag, Clock, CheckCircle2, TrendingUp, AlertTriangle,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const STATUS_COLORS = {
  Pending:          '#F59E0B',
  Confirmed:        '#3B82F6',
  Shipped:          '#8B5CF6',
  'Out for Delivery':'#F97316',
  Delivered:        '#22C55E',
  Rejected:         '#EF4444',
};
const PIE_COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#22C55E', '#EF4444'];

/* ── KPI Card ─────────────────────────────────────────────────────────── */
function KPICard({ label, value, icon: Icon, bg, iconBg, textColor, trend, trendUp, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 shadow-sm border flex items-start gap-4 transition ${bg} ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''}`}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
        <Icon style={{ width: 20, height: 20, color: textColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-black mt-0.5 ${textColor}`}>{value}</p>
        {trend && (
          <p className={`text-[11px] font-bold flex items-center gap-0.5 mt-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Section Title ─────────────────────────────────────────────────────── */
function SectionTitle({ title, sub }) {
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <h2 className="text-sm font-black text-gray-800">{title}</h2>
      {sub && <span className="text-[11px] text-gray-400 font-semibold">{sub}</span>}
    </div>
  );
}

/* ── Chart Card wrapper ─────────────────────────────────────────────────── */
function ChartCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function AdminDashboardHome({ stats, orders, setActiveSection }) {
  const kpis = stats?.kpis || {};

  const kpiCards = [
    {
      label: 'Total Products', value: kpis.total_products ?? '—', icon: Package,
      bg: 'bg-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', textColor: 'text-emerald-700',
      trend: 'Active listings', trendUp: true,
      onClick: () => setActiveSection && setActiveSection('products'),
    },
    {
      label: 'Total Orders', value: kpis.total_orders ?? '—', icon: ShoppingBag,
      bg: 'bg-blue-50 border-blue-100', iconBg: 'bg-blue-100', textColor: 'text-blue-700',
      trend: 'All time', trendUp: true,
      onClick: () => setActiveSection && setActiveSection('orders'),
    },
    {
      label: 'Pending Orders', value: kpis.pending_orders ?? '—', icon: Clock,
      bg: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-100', textColor: 'text-amber-700',
      trend: 'Needs action', trendUp: false,
      onClick: () => setActiveSection && setActiveSection('orders'),
    },
    {
      label: 'Delivered Orders', value: kpis.delivered_orders ?? '—', icon: CheckCircle2,
      bg: 'bg-green-50 border-green-100', iconBg: 'bg-green-100', textColor: 'text-green-700',
      trend: 'Completed', trendUp: true,
      onClick: () => setActiveSection && setActiveSection('orders'),
    },
    {
      label: 'Total Revenue', value: `₹${(kpis.total_revenue ?? 0).toLocaleString('en-IN')}`, icon: TrendingUp,
      bg: 'bg-purple-50 border-purple-100', iconBg: 'bg-purple-100', textColor: 'text-purple-700',
      trend: 'Confirmed orders', trendUp: true,
      onClick: () => setActiveSection && setActiveSection('revenue'),
    },
    {
      label: 'Low Stock Alert', value: kpis.low_stock_count ?? '—', icon: AlertTriangle,
      bg: 'bg-red-50 border-red-100', iconBg: 'bg-red-100', textColor: 'text-red-600',
      trend: 'Variants < 10 units', trendUp: false,
      onClick: () => setActiveSection && setActiveSection('inventory'),
    },
  ];

  const salesData  = stats?.sales_trend || [];
  const statusData = stats?.status_distribution || [];
  const paymentData = (stats?.payment_distribution || []).map(p => ({
    name: p.method || p.payment_method || 'Unknown',
    value: p.count,
  }));
  const recentOrders = (orders || []).slice(0, 5);

  return (
    <div className="space-y-7">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => <KPICard key={i} {...card} />)}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Weekly Revenue Area Chart */}
        <ChartCard>
          <SectionTitle title="Weekly Revenue (₹)" sub="Last 6 days" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={salesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Sales']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#16a34a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Order Status Donut */}
        <ChartCard>
          <SectionTitle title="Order Status Distribution" />
          {statusData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400 font-semibold">No order data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="45%"
                  cy="50%"
                  outerRadius={72}
                  innerRadius={38}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, fontWeight: 700 }}
                  formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
                />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Payment Distribution */}
        <ChartCard>
          <SectionTitle title="Payment Method Distribution" />
          {paymentData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400 font-semibold">No payment data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={paymentData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Recent Orders Table */}
        <ChartCard>
          <SectionTitle title="Recent Orders" sub={`${recentOrders.length} latest`} />
          <div className="space-y-2">
            {recentOrders.map(order => (
              <div
                key={order.order_id}
                className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/40 transition"
              >
                <div className="min-w-0 mr-2">
                  <p className="font-black text-gray-800 text-[13px]">#{order.order_id}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {order.farmer_name || order.user?.first_name || 'Guest'}
                    {' · '}
                    <span className="font-bold text-gray-700">₹{Math.round(order.total_amount).toLocaleString('en-IN')}</span>
                  </p>
                </div>
                <StatusBadge status={order.order_status} label={order.status_display} />
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8 font-semibold">No orders yet</p>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

/* ── StatusBadge ─────────────────────────────────────────────────────────── */
export function StatusBadge({ status, label }) {
  const cfg = {
    '-1': 'bg-red-100 text-red-700',
    '0':  'bg-amber-100 text-amber-800',
    '1':  'bg-blue-100 text-blue-700',
    '2':  'bg-purple-100 text-purple-700',
    '3':  'bg-orange-100 text-orange-700',
    '4':  'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${cfg[String(status)] || 'bg-gray-100 text-gray-600'}`}>
      {label || '—'}
    </span>
  );
}
