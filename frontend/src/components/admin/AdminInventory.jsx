import React from 'react';
import { AlertTriangle, Package, CheckCircle2, Download } from 'lucide-react';
import { exportToCSV } from '../../utils/exportCsv';

export default function AdminInventory({ inventory, searchQuery }) {
  const filtered = (inventory || []).filter(item => {
    const q = searchQuery.toLowerCase();
    return !q || item.product_name?.toLowerCase().includes(q) || item.brand?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q);
  });

  const outOfStock = filtered.filter(i => i.status === 'out_of_stock');
  const lowStock = filtered.filter(i => i.status === 'low_stock');
  const ok = filtered.filter(i => i.status === 'ok');

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
    exportToCSV(filtered, columns, 'AgriOwl_Inventory');
  };

  return (
    <div className="space-y-5">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-600">Out of Stock</p>
            <p className="text-2xl font-black text-red-700">{outOfStock.length}</p>
          </div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-700">Low Stock (&lt;10)</p>
            <p className="text-2xl font-black text-amber-700">{lowStock.length}</p>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-green-700">Well Stocked</p>
            <p className="text-2xl font-black text-green-700">{ok.length}</p>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              Inventory & Stock Levels
              <span className="text-xs font-bold text-gray-400">({filtered.length} variants)</span>
            </h2>
            <p className="text-xs text-gray-400">Real-time SKU quantities and safety reorder alerts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 text-xs font-bold mr-2">
              <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Out of Stock</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Low Stock</span>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition shadow-sm"
              title="Download inventory CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Brand', 'Category', 'Size/SKU', 'Price', 'Stock', 'Reserved', 'Available', 'Reorder Lvl', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className={`transition ${item.status === 'out_of_stock' ? 'bg-red-50/40' : item.status === 'low_stock' ? 'bg-amber-50/30' : 'hover:bg-gray-50/40'}`}>
                  <td className="px-4 py-3 font-bold text-gray-800 max-w-36">
                    <span className="line-clamp-1">{item.product_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.brand}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">{item.category}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold text-gray-700">{item.size}</p>
                      <p className="text-gray-400">SKU-{item.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-gray-800">₹{item.price}</td>
                  <td className="px-4 py-3 font-black text-gray-800">{item.stock}</td>
                  <td className="px-4 py-3 text-gray-500 font-semibold">{item.reserved}</td>
                  <td className="px-4 py-3 font-black text-gray-700">{item.available}</td>
                  <td className="px-4 py-3 text-gray-500">{item.reorder_level}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      item.status === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                      item.status === 'low_stock' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status === 'out_of_stock' ? 'Out of Stock' : item.status === 'low_stock' ? 'Low Stock' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No inventory data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
