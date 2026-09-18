import React, { useState, useEffect } from 'react';
import { Package, MapPin, Filter, ChevronRight, Loader2, RefreshCw, Clock, CheckCircle2, XCircle, Truck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { orderApi } from '../services/api';

const DEMO_ORDERS = [
  {
    order_id: 'AGR12345',
    created_at: '2026-08-12T08:00:00Z',
    total_amount: 1950,
    payment_method: 'COD',
    order_status: 3,
    status_display: 'Out for Delivery',
    items: [{ product_name: 'Coragen Insecticide', variant_size: '150 ML', quantity: 1, total_price: 1950 }],
    address: { village: 'Navalgund', district: 'Dharwad' }
  },
  {
    order_id: 'AGR98765',
    created_at: '2026-08-10T10:30:00Z',
    total_amount: 2200,
    payment_method: 'UPI',
    order_status: 4,
    status_display: 'Delivered',
    items: [{ product_name: 'NPK 19-19-19 Fertilizer', variant_size: '5 KG', quantity: 2, total_price: 2200 }],
    address: { village: 'Kalghatagi', district: 'Dharwad' }
  }
];

const STATUS_COLORS = {
  '-1': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
  '0': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
  '1': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle2 },
  '2': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Package },
  '3': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: Truck },
  '4': { bg: 'bg-agri-light', text: 'text-agri-primary', border: 'border-agri-secondary/40', icon: CheckCircle2 },
};

export default function MyOrdersPage({ setCurrentTab, setTrackingOrderId }) {
  const { language, t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadOrders = async () => {
    setLoading(true);
    let apiList = [];
    try {
      const res = await orderApi.getOrders();
      if (res.data?.data) apiList = res.data.data;
    } catch {}

    let localList = [];
    try {
      localList = JSON.parse(localStorage.getItem('agriowl_orders') || '[]');
    } catch {}

    const orderMap = new Map();
    apiList.forEach(o => orderMap.set(o.order_id, o));
    localList.forEach(o => {
      if (!orderMap.has(o.order_id)) {
        orderMap.set(o.order_id, o);
      } else {
        orderMap.set(o.order_id, { ...orderMap.get(o.order_id), ...o });
      }
    });

    const combined = Array.from(orderMap.values());
    setOrders(combined.length ? combined : DEMO_ORDERS);
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => String(o.order_status) === filter);

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: '0', label: 'Pending' },
    { key: '1', label: 'Confirmed' },
    { key: '2', label: 'Shipped' },
    { key: '3', label: 'Out for Delivery' },
    { key: '4', label: 'Delivered' },
    { key: '-1', label: 'Rejected' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-agri-dark flex items-center gap-2">
          <Package className="w-6 h-6 text-agri-primary" /> {t('myOrders')}
        </h1>
        <button onClick={loadOrders} className="p-2 text-agri-textMuted hover:text-agri-primary rounded-lg hover:bg-agri-light transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${filter === f.key ? 'bg-agri-primary text-white border-agri-primary' : 'bg-white text-agri-textDark border-agri-light hover:border-agri-secondary/40'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-agri-primary animate-spin" />
          <span className="ml-3 font-bold text-agri-textMuted">Loading your orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-agri-light text-center space-y-4">
          <div className="text-4xl">📦</div>
          <h3 className="text-lg font-black text-agri-dark">No orders found for this filter</h3>
          <button onClick={() => setCurrentTab('marketplace')} className="px-5 py-2.5 bg-agri-primary text-white font-bold text-sm rounded-xl hover:bg-agri-dark transition shadow-md">
            Shop Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusKey = String(order.order_status);
            const style = STATUS_COLORS[statusKey] || STATUS_COLORS['0'];
            const StatusIcon = style.icon;
            const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={order.order_id} className="bg-white rounded-2xl border-2 border-agri-light p-5 shadow-sm space-y-4 hover:shadow-md transition">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-agri-textMuted font-semibold">Order ID</span>
                    <h3 className="text-base font-black text-agri-dark">#{order.order_id}</h3>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${style.bg} ${style.text} ${style.border}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {order.status_display}
                  </span>
                </div>

                {/* Order items summary */}
                <div className="bg-agri-bg rounded-xl p-3 border border-agri-light">
                  {order.items?.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-semibold text-agri-textDark py-0.5">
                      <span className="line-clamp-1">{item.product_name} ({item.variant_size}) × {item.quantity}</span>
                      <span className="shrink-0 ml-2 font-bold">₹{Math.round(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between pt-2 border-t border-agri-light">
                  <div className="space-y-0.5">
                    <p className="text-xs text-agri-textMuted flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {order.address?.village}, {order.address?.district}
                    </p>
                    <p className="text-xs text-agri-textMuted">{dateStr} • {order.payment_method}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-agri-dark">₹{Math.round(order.total_amount)}</span>
                    {[3, 2, 1].includes(order.order_status) && (
                      <button
                        onClick={() => { setTrackingOrderId(order.order_id); setCurrentTab('tracking'); }}
                        className="px-4 py-2 bg-agri-primary text-white font-bold text-xs rounded-xl hover:bg-agri-dark transition shadow-sm flex items-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track
                      </button>
                    )}
                    {order.order_status === -1 && (
                      <span className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
