import React, { useEffect } from 'react';
import { Trash2, LogOut, AlertTriangle, X, Check, ArrowRight } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'logout' | 'warning' | 'success'
  loading = false,
  subMessage,
}) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isLogout = type === 'logout';
  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon & Close Button */}
        <div className="flex items-start justify-between">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
            isLogout ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' :
            isDanger ? 'bg-red-100 text-red-600 ring-4 ring-red-50' :
            isWarning ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' :
            'bg-green-100 text-green-700 ring-4 ring-green-50'
          }`}>
            {isLogout && <LogOut className="w-7 h-7" />}
            {isDanger && <Trash2 className="w-7 h-7" />}
            {isWarning && <AlertTriangle className="w-7 h-7" />}
            {!isLogout && !isDanger && !isWarning && <Check className="w-7 h-7" />}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          <p className="text-sm font-medium text-gray-600 leading-relaxed">{message}</p>
          {subMessage && (
            <p className="text-xs font-bold text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              {subMessage}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="touch-target py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`touch-target py-3 px-4 text-white font-black text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60 ${
              isLogout
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200'
                : isDanger
                ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-red-200'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-200'
            }`}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogout ? (
              <LogOut className="w-4 h-4" />
            ) : isDanger ? (
              <Trash2 className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
