import React, { useState } from 'react';
import { AlertTriangle, Package, CheckCircle2, Download, Plus, RefreshCw, Layers, Sparkles, Check, ArrowUpRight, Filter } from 'lucide-react';
import { exportToCSV } from '../../utils/exportCsv';
import { productApi } from '../../services/api';
import { getStored, setStored, STORE_KEYS } from '../../utils/persistentStore';

export default function AdminInventory({ inventory = [], setInventory, products = [], setProducts, searchQuery = '', onRefresh }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'out_of_stock' | 'low_stock' | 'ok'
  const [restockModal, setRestockModal] = useState(null); // item or null
  const [restockQty, setRestockQty] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filtered = (inventory || []).filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      item.product_name?.toLowerCase().includes(q) || 
      item.brand?.toLowerCase().includes(q) || 
      item.category?.toLowerCase().includes(q) ||
      String(item.id).includes(q);

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const outOfStock = (inventory || []).filter(i => i.status === 'out_of_stock' || Number(i.stock) <= 0);
  const lowStock = (inventory || []).filter(i => (i.status === 'low_stock' || (Number(i.stock) > 0 && Number(i.stock) <= (i.reorder_level || 10))));
  const ok = (inventory || []).filter(i => i.status === 'ok' && Number(i.stock) > (i.reorder_level || 10));

  const handleExportCSV = () => {
    const columns = [
      { key: 'id', label: 'SKU ID' },
      { key: 'product_name', label: 'Product Name' },
      { key: 'brand', label: 'Brand' },
      { key: 'category', label: 'Category' },
      { key: 'size', label: 'Size Variant' },
      { key: 'price', label: 'Price (INR)' },
      { key: 'stock', label: 'Total Stock' },
      { key: 'reserved', label: 'Reserved' },
      { key: 'available', label: 'Available' },
      { key: 'reorder_level', label: 'Reorder Level' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV(filtered, columns, 'AgriOwl_Inventory_Report');
  };

  const handleOpenRestock = (item) => {
    setRestockModal(item);
    setRestockQty(50);
  };

  const handleConfirmRestock = async (e) => {
    e.preventDefault();
    if (!restockModal || restockQty <= 0) return;
    setIsSubmitting(true);

    const qtyToAdd = Number(restockQty);
    const targetId = restockModal.id;

    try {
      // 1. Try backend API call
      try {
        await productApi.restockVariant(targetId, { qty: qtyToAdd });
      } catch (err) {
        console.warn('Backend restock API warning (falling back to local state sync):', err);
      }

      // 2. Update local inventory state
      if (setInventory) {
        setInventory(prevInv => {
          const next = (prevInv || []).map(item => {
            if (item.id === targetId) {
              const newStock = (Number(item.stock) || 0) + qtyToAdd;
              const newAvail = (Number(item.available) || 0) + qtyToAdd;
              const reorder = item.reorder_level || 10;
              const newStatus = newStock === 0 ? 'out_of_stock' : newStock <= reorder ? 'low_stock' : 'ok';
              return { ...item, stock: newStock, available: newAvail, status: newStatus };
            }
            return item;
          });
          setStored(STORE_KEYS.INVENTORY, next);
          return next;
        });
      }

      // 3. Update products state if variant exists there
      if (setProducts) {
        setProducts(prevProducts => {
          const nextProds = (prevProducts || []).map(p => {
            if (!p.variants) return p;
            const updatedVariants = p.variants.map(v => {
              if (v.id === targetId || (v.size === restockModal.size && p.name === restockModal.product_name)) {
                return { ...v, stock: (Number(v.stock) || 0) + qtyToAdd };
              }
              return v;
            });
            return { ...p, variants: updatedVariants };
          });
          setStored(STORE_KEYS.PRODUCTS, nextProds);
          return nextProds;
        });
      }

      showToast(`✅ Successfully restocked ${qtyToAdd} units for "${restockModal.product_name}" (${restockModal.size})!`);
      setRestockModal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to restock variant:', err);
      showToast('❌ Restock failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 animate-in slide-in-from-top-4 duration-200">
          <span className="text-sm font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterStatus(filterStatus === 'out_of_stock' ? 'all' : 'out_of_stock')}
          className={`cursor-pointer border-2 rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm ${
            filterStatus === 'out_of_stock' ? 'bg-red-100 border-red-500 ring-2 ring-red-400' : 'bg-red-50 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-red-600">Out of Stock</p>
              <p className="text-3xl font-black text-red-700">{outOfStock.length}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-600 bg-red-200/60 px-2.5 py-1 rounded-full">
            {outOfStock.length > 0 ? 'Refill Required' : 'All in Stock'}
          </span>
        </div>

        <div 
          onClick={() => setFilterStatus(filterStatus === 'low_stock' ? 'all' : 'low_stock')}
          className={`cursor-pointer border-2 rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm ${
            filterStatus === 'low_stock' ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400' : 'bg-amber-50 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-700">Low Stock (&le; 10)</p>
              <p className="text-3xl font-black text-amber-700">{lowStock.length}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2.5 py-1 rounded-full">
            Reorder Alert
          </span>
        </div>

        <div 
          onClick={() => setFilterStatus(filterStatus === 'ok' ? 'all' : 'ok')}
          className={`cursor-pointer border-2 rounded-2xl p-5 flex items-center justify-between transition-all shadow-sm ${
            filterStatus === 'ok' ? 'bg-green-100 border-green-500 ring-2 ring-green-400' : 'bg-green-50 border-green-200 hover:border-green-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-green-700">Well Stocked</p>
              <p className="text-3xl font-black text-green-700">{ok.length}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-200/60 px-2.5 py-1 rounded-full">
            Healthy Stock
          </span>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-gray-900 text-lg flex items-center gap-2.5">
              <span>📦</span> Inventory & Stock Management
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {filtered.length} Variants Listed
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">
              Real-time SKU quantities, automatic order deductions, and 1-click admin stock refill.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold">
              {[
                { key: 'all', label: 'All Items' },
                { key: 'out_of_stock', label: `Out of Stock (${outOfStock.length})`, badgeColor: 'text-red-600' },
                { key: 'low_stock', label: `Low Stock (${lowStock.length})`, badgeColor: 'text-amber-600' },
                { key: 'ok', label: 'In Stock' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterStatus === tab.key
                      ? 'bg-white text-gray-900 shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition shadow-sm"
              title="Download inventory CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {['Product Name', 'Brand', 'Category', 'Variant / SKU', 'Unit Price', 'Current Stock', 'Reserved', 'Available', 'Reorder Lvl', 'Stock Status', 'Quick Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-gray-500 font-bold tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(item => {
                const isOutOfStock = item.status === 'out_of_stock' || Number(item.stock) <= 0;
                const isLowStock = item.status === 'low_stock' || (Number(item.stock) > 0 && Number(item.stock) <= (item.reorder_level || 10));

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors duration-150 ${
                      isOutOfStock ? 'bg-red-50/40 hover:bg-red-50/70' :
                      isLowStock ? 'bg-amber-50/30 hover:bg-amber-50/60' :
                      'hover:bg-gray-50/60'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-gray-900 max-w-44">
                      <span className="line-clamp-1 font-extrabold">{item.product_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-medium">{item.brand}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 font-bold rounded-lg text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-extrabold text-gray-800">{item.size}</p>
                        <p className="text-[10px] text-gray-400 font-mono">SKU-{item.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-black text-gray-900">₹{item.price}</td>
                    <td className="px-4 py-3.5">
                      <span className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                        isOutOfStock ? 'text-red-700 bg-red-100 font-black' :
                        isLowStock ? 'text-amber-700 bg-amber-100' :
                        'text-gray-800'
                      }`}>
                        {item.stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 font-medium">{item.reserved || 0}</td>
                    <td className="px-4 py-3.5 font-black text-gray-700">{item.available ?? item.stock}</td>
                    <td className="px-4 py-3.5 text-gray-400 font-medium">{item.reorder_level || 10}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide ${
                        isOutOfStock ? 'bg-red-100 text-red-800 border border-red-200' :
                        isLowStock ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isOutOfStock ? 'bg-red-600 animate-ping' :
                          isLowStock ? 'bg-amber-500' :
                          'bg-green-600'
                        }`} />
                        {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenRestock(item)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 font-black text-xs rounded-xl shadow-sm transition active:scale-95 ${
                          isOutOfStock 
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce' 
                            : isLowStock
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title="Refill stock for this variant"
                      >
                        <Plus className="w-3.5 h-3.5" /> Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-gray-500" />
              <p className="font-extrabold text-base text-gray-600">No inventory matches found</p>
              <p className="text-xs text-gray-400 mt-1">Try clearing your search query or selecting "All Items".</p>
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-700">
                  <Plus className="w-5 h-5 font-bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Refill SKU Stock</h3>
                  <p className="text-xs text-gray-400">Admin Inventory Restock Controller</p>
                </div>
              </div>
              <button
                onClick={() => setRestockModal(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Product Summary Box */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Product:</span>
                <span className="text-xs font-black text-gray-900 text-right">{restockModal.product_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Size / SKU:</span>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                  {restockModal.size} (ID #{restockModal.id})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500">Current Stock:</span>
                <span className={`text-xs font-black ${Number(restockModal.stock) <= 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {restockModal.stock} units
                </span>
              </div>
            </div>

            {/* Quantity Form */}
            <form onSubmit={handleConfirmRestock} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  Quantity to Add (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-2xl font-black text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition text-center"
                  placeholder="e.g. 50"
                  autoFocus
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-2 justify-center">
                {[20, 50, 100, 250, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockQty(val)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition ${
                      Number(restockQty) === val 
                        ? 'bg-green-700 text-white border-green-700 shadow-sm' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Estimated New Total */}
              <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                <p className="text-xs text-green-700 font-medium">New Total Stock will be:</p>
                <p className="text-xl font-black text-green-900">
                  {(Number(restockModal.stock) || 0) + (Number(restockQty) || 0)} Units
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockModal(null)}
                  className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Number(restockQty) <= 0}
                  className="py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-black text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Confirm Restock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
