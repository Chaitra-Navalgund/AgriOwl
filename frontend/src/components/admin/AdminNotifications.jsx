import React, { useState } from 'react';
import { Bell, Check, Trash2, ShoppingBag, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminNotifications({ notifications, setNotifications }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const handleMarkRead = async (id) => {
    try {
      await adminApi.markNotificationRead(id);
    } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteNotification(id);
    } catch {}
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return n.status !== 'READ';
    return true;
  });

  const getIcon = (type) => {
    if (type?.includes('ORDER_PLACED') || type?.includes('NEW_ORDER')) {
      return <ShoppingBag className="w-5 h-5 text-blue-600" />;
    }
    if (type?.includes('LOW_STOCK') || type?.includes('ALERT')) {
      return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
    if (type?.includes('REJECTED')) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (type?.includes('DELIVERED')) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    return <Bell className="w-5 h-5 text-green-700" />;
  };

  const unreadCount = notifications.filter(n => n.status !== 'READ').length;

  return (
    <div className="space-y-4">
      {/* Header with quick filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-gray-800 text-sm">Notification Center</h2>
          {unreadCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-700">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                filter === 'unread' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
              }`}
            >
              Unread Only
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-green-200"
            >
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.map((item, idx) => {
          const isRead = item.status === 'READ';
          return (
            <div
              key={item.id || idx}
              className={`p-4 rounded-2xl border transition flex items-start gap-4 ${
                isRead
                  ? 'bg-white/80 border-gray-100 opacity-80'
                  : 'bg-white border-green-200 shadow-sm ring-1 ring-green-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-green-800 bg-green-50 px-2 py-0.5 rounded-md">
                    {item.type?.replace(/_/g, ' ') || 'SYSTEM ALERT'}
                  </span>
                  {!isRead && (
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  )}
                </div>
                <p className="text-xs font-bold text-gray-800 mt-1.5 leading-relaxed">
                  {item.message}
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  {item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : 'Just now'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-green-50 text-gray-500 hover:text-green-700 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  title="Delete notification"
                  className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-sm text-gray-600">No notifications found</p>
            <p className="text-xs text-gray-400 mt-1">Real-time alerts for orders and inventory will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
