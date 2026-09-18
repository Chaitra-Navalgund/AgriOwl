import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, CreditCard, PieChart as PieIcon, BarChart3, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';

const COLORS = ['#2E7D32', '#F9A825', '#1565C0', '#9C27B0', '#E53935', '#00897B'];

export default function AdminAnalytics({ stats, orders }) {
  const [timeframe, setTimeframe] = useState('weekly');

  const kpis = stats?.kpis || {};

  // Orders overview metrics
  const totalOrders = kpis.total_orders || (orders?.length || 0);
  const deliveredOrders = kpis.delivered_orders || orders?.filter(o => o.order_status === 4).length || 0;
  const pendingOrders = kpis.pending_orders || orders?.filter(o => o.order_status === 0).length || 0;
  const rejectedOrders = orders?.filter(o => o.order_status === -1).length || 0;

  // Chart data based on timeframe
  const revenueTrends = {
    daily: [
      { label: '06:00', revenue: 2400 },
      { label: '09:00', revenue: 7800 },
      { label: '12:00', revenue: 14500 },
      { label: '15:00', revenue: 11200 },
      { label: '18:00', revenue: 19800 },
      { label: '21:00', revenue: 8600 },
    ],
    weekly: stats?.sales_trend || [
      { day: 'Mon', sales: 4200 },
      { day: 'Tue', sales: 6800 },
      { day: 'Wed', sales: 5600 },
      { day: 'Thu', sales: 8200 },
      { day: 'Fri', sales: 9400 },
      { day: 'Sat', sales: 7480 },
    ],
    monthly: [
      { label: 'Week 1', revenue: 38000 },
      { label: 'Week 2', revenue: 54000 },
      { label: 'Week 3', revenue: 49000 },
      { label: 'Week 4', revenue: 68000 },
    ]
  };

  const paymentData = (stats?.payment_distribution || [
    { method: 'COD', count: 7 },
    { method: 'UPI', count: 4 },
    { method: 'CARD', count: 2 },
  ]).map(p => ({
    name: p.method || p.payment_method,
    value: p.count
  }));

  const categoryPerformance = [
    { category: 'Fertilizers', orders: 28, revenue: 34500 },
    { category: 'Pesticides', orders: 19, revenue: 28900 },
    { category: 'Seeds', orders: 24, revenue: 18600 },
    { category: 'Plant Nutrition', orders: 14, revenue: 12400 },
    { category: 'Tools / Protection', orders: 9, revenue: 8200 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar / Timeframe switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="font-black text-gray-800 text-sm">Marketplace Analytics Engine</h2>
          <p className="text-xs text-gray-400">Holistic insights on conversions, logistics, and payments</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {['daily', 'weekly', 'monthly'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                timeframe === t ? 'bg-white text-green-800 shadow-sm font-black' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Health Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Total Orders</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-gray-800 mt-2">{totalOrders}</p>
          <p className="text-[11px] text-green-600 font-bold mt-1">100% Platform Traffic</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Delivered</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-green-700 mt-2">{deliveredOrders}</p>
          <p className="text-[11px] text-green-600 font-bold mt-1">
            {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}% Success Rate
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingOrders}</p>
          <p className="text-[11px] text-amber-600 font-bold mt-1">Awaiting dispatch</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Rejected</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-700 mt-2">{rejectedOrders}</p>
          <p className="text-[11px] text-red-500 font-bold mt-1">With recorded reason</p>
        </div>
      </div>

      {/* Revenue Trajectory Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-green-700" />
          <h3 className="text-sm font-black text-gray-800">
            Revenue Performance ({timeframe.toUpperCase()})
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={timeframe === 'weekly' ? revenueTrends.weekly : timeframe === 'daily' ? revenueTrends.daily : revenueTrends.monthly}>
            <defs>
              <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#43A047" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#43A047" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey={timeframe === 'weekly' ? 'day' : 'label'} tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
            <Area type="monotone" dataKey={timeframe === 'weekly' ? 'sales' : 'revenue'} stroke="#2E7D32" strokeWidth={3} fill="url(#analyticsRevGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payment & Category Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Gateway Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-gray-800">Payment Method Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={4}>
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-green-700" />
            <h3 className="text-sm font-black text-gray-800">Category Volume & Demand</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fontWeight: 700, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Bar dataKey="orders" fill="#2E7D32" radius={[6, 6, 0, 0]} name="Order Units" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
