import React, { useState } from 'react';
import { CheckCircle2, Truck, X, Trash2, ChevronDown, ChevronUp, Loader2, Eye, Printer, FileText, Download } from 'lucide-react';
import { StatusBadge } from './AdminDashboardHome';
import { orderApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportCsv';
import ConfirmModal from '../common/ConfirmModal';
import { setStored, getStored, STORE_KEYS } from '../../utils/persistentStore';

const STATUS_LABELS = { '-1': 'Rejected', '0': 'Pending', '1': 'Confirmed', '2': 'Shipped', '3': 'Out for Delivery', '4': 'Delivered' };
const NEXT_STATUS = { 0: 1, 1: 2, 2: 3, 3: 4 };

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: '0',   label: 'Pending' },
  { value: '1',   label: 'Confirmed' },
  { value: '2',   label: 'Shipped' },
  { value: '3',   label: 'Out for Delivery' },
  { value: '4',   label: 'Delivered' },
  { value: '-1',  label: 'Rejected' },
];

export default function AdminOrders({ orders, setOrders, searchQuery, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || String(o.order_status) === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || o.order_id?.toLowerCase().includes(q)
      || (o.farmer_name || '').toLowerCase().includes(q)
      || (o.farmer_mobile || '').includes(q);
    return matchStatus && matchSearch;
  });

  const handleStatusUpdate = async (orderId, newStatus) => {
    setBusy(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, { status: newStatus });
    } catch {}
    
    // Update local state
    setOrders(prev => prev.map(o => o.order_id === orderId
      ? { ...o, order_status: newStatus, status_display: STATUS_LABELS[String(newStatus)] }
      : o
    ));

    // Sync to persistent store (30-day TTL)
    try {
      const stored = getStored(STORE_KEYS.ORDERS) || JSON.parse(localStorage.getItem('agriowl_orders') || '[]');
      const updated = stored.map(o => o.order_id === orderId
        ? { ...o, order_status: newStatus, status_display: STATUS_LABELS[String(newStatus)] }
        : o
      );
      setStored(STORE_KEYS.ORDERS, updated);
      localStorage.setItem('agriowl_orders', JSON.stringify(updated.slice(0, 50)));

      // Add status change notification
      const storedNotifs = getStored(STORE_KEYS.NOTIFICATIONS) || [];
      const notifMsg = `Order #${orderId} status was changed to ${STATUS_LABELS[String(newStatus)]}.`;
      const newNotif = { id: `status_${Date.now()}`, type: `ORDER_${STATUS_LABELS[String(newStatus)].toUpperCase().replace(/\s+/g,'_')}`, message: notifMsg, status: 'UNREAD', created_at: new Date().toISOString() };
      setStored(STORE_KEYS.NOTIFICATIONS, [newNotif, ...storedNotifs]);
      localStorage.setItem('agriowl_notifications', JSON.stringify([newNotif, ...storedNotifs].slice(0, 50)));
    } catch {}

    if (onRefresh) onRefresh(true);
    setBusy(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    const orderId = rejectModal;
    setBusy(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, { status: -1, rejection_reason: rejectReason });
    } catch {}

    // Immediately update local React state
    setOrders(prev => prev.map(o => o.order_id === orderId
      ? { ...o, order_status: -1, status_display: 'Rejected', rejection_reason: rejectReason }
      : o
    ));

    // Sync rejection to persistent store (highest priority – will not be overwritten by stale merges)
    try {
      const storedOrders = getStored(STORE_KEYS.ORDERS) || [];
      const updatedOrders = storedOrders.map(o => o.order_id === orderId
        ? { ...o, order_status: -1, status_display: 'Rejected', rejection_reason: rejectReason }
        : o
      );
      setStored(STORE_KEYS.ORDERS, updatedOrders);
      localStorage.setItem('agriowl_orders', JSON.stringify(updatedOrders.slice(0, 50)));

      // Mark / remove old "Action required: Accept or Reject" pending notifications for this order
      const storedNotifs = getStored(STORE_KEYS.NOTIFICATIONS) || [];
      const cleanedNotifs = storedNotifs
        .filter(n => !(n.id === `pending_${orderId}` || (n.type === 'NEW_ORDER' && n.message?.includes(`#${orderId}`))))
        .map(n => n);

      // Add the REJECTED notification at the top
      const rejectedNotif = {
        id: `reject_${orderId}_${Date.now()}`,
        type: 'ORDER_REJECTED',
        message: `Order #${orderId} was REJECTED by Admin. Reason: ${rejectReason}`,
        status: 'UNREAD',
        created_at: new Date().toISOString(),
      };
      const finalNotifs = [rejectedNotif, ...cleanedNotifs];
      setStored(STORE_KEYS.NOTIFICATIONS, finalNotifs);
      localStorage.setItem('agriowl_notifications', JSON.stringify(finalNotifs.slice(0, 50)));
    } catch {}

    if (onRefresh) onRefresh(true);
    setRejectModal(null);
    setRejectReason('');
    setBusy(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalOrder) return;
    const orderId = deleteModalOrder.order_id;
    setBusy(orderId);
    try {
      await orderApi.deleteOrder(orderId);
    } catch {}

    setOrders(prev => prev.filter(o => o.order_id !== orderId));

    try {
      const stored = JSON.parse(localStorage.getItem('agriowl_orders') || '[]');
      const updated = stored.filter(o => o.order_id !== orderId);
      localStorage.setItem('agriowl_orders', JSON.stringify(updated));
    } catch {}

    if (onRefresh) onRefresh(true);
    setBusy(null);
    setDeleteModalOrder(null);
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'order_id', label: 'Order ID' },
      { key: 'farmer_name', label: 'Farmer Name', formatter: (v, r) => v || r.user?.first_name || r.address?.full_name || 'Guest' },
      { key: 'farmer_mobile', label: 'Mobile', formatter: (v, r) => v || r.address?.mobile || '—' },
      { key: 'created_at', label: 'Order Date', formatter: (v) => v ? new Date(v).toLocaleString('en-IN') : '—' },
      { key: 'payment_method', label: 'Payment Method' },
      { key: 'total_amount', label: 'Total (INR)', formatter: (v) => Math.round(v) },
      { key: 'order_status', label: 'Status', formatter: (v, r) => r.status_display || STATUS_LABELS[String(v)] || '—' },
      { key: 'rejection_reason', label: 'Rejection Reason', formatter: (v) => v || 'N/A' },
    ];
    exportToCSV(filtered, columns, 'AgriOwl_Orders');
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Filter bar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition border ${statusFilter === opt.value ? 'bg-green-700 text-white border-green-700 shadow' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-bold mr-1">{filtered.length} orders</span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order ID', 'Farmer', 'Mobile', 'Date', 'Payment', 'Amount', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(order => (
                <React.Fragment key={order.order_id}>
                  <tr className="hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 font-black text-gray-800">#{order.order_id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 max-w-28">
                      <span className="truncate block">{order.farmer_name || order.user?.first_name || 'Guest'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.farmer_mobile || order.address?.mobile || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-md font-bold text-gray-700">{order.payment_method}</span>
                    </td>
                    <td className="px-4 py-3 font-black text-gray-800">₹{Math.round(order.total_amount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.order_status} label={order.status_display} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {/* Invoice */}
                        <button
                          onClick={() => setInvoiceModalOrder(order)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
                          title="Generate Tax Invoice"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {/* Expand/details */}
                        <button onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition" title="View Details">
                          {expandedOrder === order.order_id ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        
                        {/* Accept / Reject for Pending Orders */}
                        {order.order_status === 0 && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(order.order_id, 1)}
                              disabled={busy === order.order_id}
                              className="px-2.5 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold transition text-[11px] flex items-center gap-1 shadow-sm"
                              title="Accept & Confirm Order"
                            >
                              {busy === order.order_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => setRejectModal(order.order_id)}
                              disabled={busy === order.order_id}
                              className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition text-[11px] flex items-center gap-0.5 border border-red-200"
                              title="Reject Order"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Advance status for Confirmed / Shipped / Out for Delivery */}
                        {order.order_status > 0 && NEXT_STATUS[order.order_status] && (
                          <button
                            onClick={() => handleStatusUpdate(order.order_id, NEXT_STATUS[order.order_status])}
                            disabled={busy === order.order_id}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition text-[11px] flex items-center gap-1 border border-blue-200"
                            title={`Mark as ${STATUS_LABELS[NEXT_STATUS[order.order_status]]}`}
                          >
                            {busy === order.order_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                            <span>{STATUS_LABELS[NEXT_STATUS[order.order_status]]}</span>
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => setDeleteModalOrder(order)} disabled={busy === order.order_id}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Delete Order">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Order Detail */}
                  {expandedOrder === order.order_id && (
                    <tr className="bg-green-50/30">
                      <td colSpan={8} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Farmer Info */}
                          <div className="space-y-1">
                            <p className="font-black text-gray-700 mb-2">👤 Farmer Info</p>
                            <p><span className="text-gray-500">Name:</span> <span className="font-bold">{order.farmer_name || order.address?.full_name}</span></p>
                            <p><span className="text-gray-500">Mobile:</span> <span className="font-bold">{order.farmer_mobile || order.address?.mobile}</span></p>
                            <p><span className="text-gray-500">Address:</span> <span className="font-bold">{order.address ? `${order.address.village}, ${order.address.district}, ${order.address.state}` : '—'}</span></p>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-1">
                            <p className="font-black text-gray-700 mb-2">📦 Order Items</p>
                            {(order.items || []).map((item, i) => (
                              <div key={i} className="flex justify-between">
                                <span className="text-gray-700 font-semibold">{item.product_name} ({item.variant_size}) x{item.quantity}</span>
                                <span className="font-black text-gray-800">₹{Math.round(item.total_price)}</span>
                              </div>
                            ))}
                            <div className="pt-1 border-t border-gray-200 flex justify-between font-black text-gray-800">
                              <span>Total</span><span>₹{Math.round(order.total_amount)}</span>
                            </div>
                            {order.rejection_reason && (
                              <p className="mt-2 text-red-600 font-bold">Rejection: {order.rejection_reason}</p>
                            )}
                          </div>

                          {/* Tracking Timeline */}
                          <div>
                            <p className="font-black text-gray-700 mb-2">🚚 Tracking Timeline</p>
                            <div className="space-y-2">
                              {(order.status_history || []).map((h, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-600 mt-1 shrink-0" />
                                  <div>
                                    <p className="font-bold text-gray-800">{h.status_display}</p>
                                    <p className="text-gray-400">{new Date(h.timestamp).toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBagIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {invoiceModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Invoice Print Container */}
            <div className="space-y-5 print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-green-800">AgriOwl Agro Services</h3>
                  <p className="text-xs text-gray-500 font-medium">North Karnataka Farmer Fulfillment Hub</p>
                  <p className="text-[11px] text-gray-400">GSTIN: 29AABCU9603R1ZM · Hubli-Dharwad, Karnataka</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-green-100 text-green-800 font-black text-xs rounded-full">TAX INVOICE</span>
                  <p className="font-black text-gray-800 text-sm mt-1">INV-{invoiceModalOrder.order_id}</p>
                  <p className="text-[10px] text-gray-400">{new Date(invoiceModalOrder.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
                <div>
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Billed To / Farmer</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{invoiceModalOrder.farmer_name || invoiceModalOrder.address?.full_name || 'Agri Farmer'}</p>
                  <p className="text-gray-600 font-medium">📱 {invoiceModalOrder.farmer_mobile || invoiceModalOrder.address?.mobile}</p>
                  <p className="text-gray-500 text-[11px] mt-1">{invoiceModalOrder.address ? `${invoiceModalOrder.address.village}, ${invoiceModalOrder.address.district}, ${invoiceModalOrder.address.state}` : 'North Karnataka Delivery Corridor'}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Payment & Status</p>
                  <p className="font-bold text-gray-800">Mode: <span className="font-black text-green-700">{invoiceModalOrder.payment_method}</span></p>
                  <p className="font-bold text-gray-800">Status: <span className="font-black text-blue-700">{invoiceModalOrder.status_display}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500">
                    <th className="text-left py-2 font-bold">Item Description</th>
                    <th className="text-center py-2 font-bold">Size</th>
                    <th className="text-center py-2 font-bold">Qty</th>
                    <th className="text-right py-2 font-bold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(invoiceModalOrder.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-bold text-gray-800">{item.product_name}</td>
                      <td className="py-2.5 text-center text-gray-600 font-medium">{item.variant_size}</td>
                      <td className="py-2.5 text-center font-bold text-gray-700">{item.quantity}</td>
                      <td className="py-2.5 text-right font-black text-gray-800">₹{Math.round(item.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Invoice Calculations */}
              <div className="border-t-2 border-gray-200 pt-3 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{Math.round(invoiceModalOrder.total_amount * 0.95)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Agricultural GST (5% Included):</span>
                  <span className="font-bold">₹{Math.round(invoiceModalOrder.total_amount * 0.05)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges:</span>
                  <span className="font-bold text-green-700">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>Grand Total:</span>
                  <span className="text-green-800 text-base">₹{Math.round(invoiceModalOrder.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-3">
                Thank you for choosing AgriOwl! Supporting farmers across Karnataka with certified seeds & nutrients.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setInvoiceModalOrder(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-200 transition"
              >
                Close
              </button>
              <button
                onClick={handlePrintInvoice}
                className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-red-700">Reject Order #{rejectModal}</h3>
            <p className="text-xs text-gray-500">Please provide a reason for rejection. This will be saved and shown to the farmer.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Product out of stock in requested size."
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 transition resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="py-3 bg-gray-100 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || busy}
                className="py-3 bg-red-600 text-white font-black text-sm rounded-2xl hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reject Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteModalOrder)}
        onClose={() => setDeleteModalOrder(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Order #${deleteModalOrder?.order_id}?`}
        message={`Are you sure you want to permanently remove this order for ${deleteModalOrder?.farmer_name || deleteModalOrder?.address?.full_name || 'Farmer'} (₹${Math.round(deleteModalOrder?.total_amount || 0)})?`}
        subMessage="⚠️ This will permanently remove the order record and tracking history from the system."
        confirmText="Yes, Delete Order"
        cancelText="No, Cancel"
        type="danger"
        loading={busy === deleteModalOrder?.order_id}
      />
    </div>
  );
}

function ShoppingBagIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
}
