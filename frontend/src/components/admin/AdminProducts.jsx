import React, { useState } from 'react';
import { Plus, Edit, Eye, EyeOff, X, Loader2, Star, Download, Trash2, Layers } from 'lucide-react';
import { productApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportCsv';

const EMPTY_VARIANT = { size: '1 KG', price: 100, discount: 0, stock: 50 };

const EMPTY_FORM = {
  name: '', name_kn: '', brand: '', category: 1, description: '',
  crop_usage: '', rating: 4.8, active: true, image: '',
  variants: [EMPTY_VARIANT],
};

export default function AdminProducts({ products, setProducts, categories, searchQuery }) {
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?.id || 1,
      variants: [{ size: '1 KG', price: 250, discount: 5, stock: 50 }],
    });
    setModal('add');
  };

  const openEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name || '',
      name_kn: p.name_kn || '',
      brand: p.brand || '',
      category: p.category || categories[0]?.id || 1,
      description: p.description || '',
      crop_usage: p.crop_usage || '',
      rating: p.rating || 4.8,
      active: p.active ?? true,
      image: p.image || '',
      variants: (p.variants && p.variants.length > 0)
        ? p.variants.map(v => ({ id: v.id, size: v.size, price: v.price, discount: v.discount, stock: v.stock }))
        : [{ size: '1 KG', price: 100, discount: 0, stock: 50 }],
    });
    setModal('edit');
  };

  const handleAddVariant = () => {
    setForm(f => ({
      ...f,
      variants: [...(f.variants || []), { size: '5 KG', price: 500, discount: 10, stock: 30 }],
    }));
  };

  const handleRemoveVariant = (idx) => {
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== idx),
    }));
  };

  const handleVariantChange = (idx, field, value) => {
    setForm(f => {
      const nextVariants = [...f.variants];
      nextVariants[idx] = {
        ...nextVariants[idx],
        [field]: field === 'price' || field === 'discount' || field === 'stock' ? Number(value) : value,
      };
      return { ...f, variants: nextVariants };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'edit') {
        const res = await productApi.updateProduct(form.id, form);
        const updated = res.data?.data || {
          ...form,
          category_name: categories.find(c => c.id === Number(form.category))?.name || 'General',
        };
        setProducts(prev => prev.map(p => p.id === form.id ? updated : p));
      } else {
        const res = await productApi.createProduct(form);
        const newProduct = res.data?.data || {
          ...form,
          id: Date.now(),
          category_name: categories.find(c => c.id === Number(form.category))?.name || 'General',
        };
        setProducts(prev => [newProduct, ...prev]);
      }
    } catch {
      if (modal === 'edit') {
        setProducts(prev => prev.map(p => p.id === form.id ? { ...p, ...form } : p));
      } else {
        setProducts(prev => [{ ...form, id: Date.now(), category_name: categories.find(c => c.id === Number(form.category))?.name || 'General' }, ...prev]);
      }
    }
    setModal(null);
    setSaving(false);
  };

  const handleToggleActive = async (p) => {
    setBusyId(p.id);
    try {
      if (p.active) await productApi.deleteProduct(p.id);
      else await productApi.updateProduct(p.id, { active: true });
    } catch {}
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
    setBusyId(null);
  };

  const handleExportCSV = () => {
    const cols = [
      { key: 'id', label: 'Product ID' },
      { key: 'name', label: 'Product Name (EN)' },
      { key: 'name_kn', label: 'Product Name (KN)' },
      { key: 'brand', label: 'Brand' },
      { key: 'category_name', label: 'Category' },
      { key: 'rating', label: 'Rating' },
      { key: 'variants', label: 'Variants / Stock', formatter: (v) => (v || []).map(x => `${x.size}: ₹${x.price} (Qty: ${x.stock})`).join(' | ') },
      { key: 'active', label: 'Status', formatter: (v) => v ? 'Active' : 'Inactive' },
    ];
    exportToCSV(filtered, cols, 'AgriOwl_Products');
  };

  const F = ({ label, children }) => (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-green-500 transition";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              Product Inventory
              <span className="text-xs font-bold text-gray-400">({filtered.length} products)</span>
            </h2>
            <p className="text-xs text-gray-400">Manage agricultural products, package variants, and pricing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition shadow-sm"
              title="Download products CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white font-bold text-xs rounded-xl hover:bg-green-800 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Image', 'Product Name', 'Category', 'Brand', 'Rating', 'Size Variants', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <img src={p.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=80'} alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-gray-100" />
                  </td>
                  <td className="px-4 py-3 max-w-40">
                    <p className="font-bold text-gray-800 line-clamp-1">{p.name}</p>
                    <p className="text-gray-400 text-[10px]">{p.name_kn}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-700">{p.category_name}</td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{p.brand}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-0.5 text-amber-500 font-black">
                      <Star className="w-3 h-3 fill-amber-400" /> {p.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(p.variants || []).map((v, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700">
                          {v.size} · ₹{v.price} {v.discount > 0 && <span className="text-red-500">(-{v.discount}%)</span>}
                        </span>
                      ))}
                      {(!p.variants || p.variants.length === 0) && (
                        <span className="text-gray-400 italic">No variants</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Edit Product & Variants">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(p)} disabled={busyId === p.id}
                        className={`p-1.5 rounded-lg transition ${p.active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                        title={p.active ? 'Deactivate' : 'Activate'}>
                        {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : p.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-bold">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-gray-800">{modal === 'edit' ? 'Edit Product' : 'Add New Product'}</h3>
                <p className="text-xs text-gray-400">Provide product details and package variants</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <F label="Product Name (English)">
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. NPK 19-19-19 Fertilizer" className={inputCls} />
                </F>
                <F label="Product Name (Kannada ಕನ್ನಡ)">
                  <input value={form.name_kn} onChange={e => setForm(f => ({ ...f, name_kn: e.target.value }))}
                    placeholder="e.g. ಎನ್.ಪಿ.ಕೆ 19-19-19 ಗೊಬ್ಬರ" className={inputCls} />
                </F>
                <F label="Brand">
                  <input required value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g. Iffco Agri" className={inputCls} />
                </F>
                <F label="Category">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: Number(e.target.value) }))} className={inputCls}>
                    {categories.length ? categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : (
                      <><option value={1}>Fertilizers</option><option value={2}>Pesticides</option><option value={3}>Seeds</option></>
                    )}
                  </select>
                </F>
              </div>

              <F label="Crop Usage (comma-separated)">
                <input value={form.crop_usage} onChange={e => setForm(f => ({ ...f, crop_usage: e.target.value }))}
                  placeholder="e.g. Cotton, Chilli, Sugarcane" className={inputCls} />
              </F>

              <F label="Description">
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description and features..." className={`${inputCls} resize-none`} />
              </F>

              {/* Package Variants Management */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-green-700" />
                    <span className="text-xs font-black text-gray-800 uppercase tracking-wide">Package Variants & Pricing</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-800 text-xs font-bold rounded-lg border border-green-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Size Variant
                  </button>
                </div>

                <div className="space-y-2">
                  {(form.variants || []).map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200 text-xs">
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 block font-bold">Size / SKU</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1 KG"
                          value={variant.size}
                          onChange={e => handleVariantChange(idx, 'size', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 block font-bold">MRP (₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={variant.price}
                          onChange={e => handleVariantChange(idx, 'price', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-400 block font-bold">Disc %</label>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={variant.discount || 0}
                          onChange={e => handleVariantChange(idx, 'discount', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 block font-bold">Stock Qty</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stock || 0}
                          onChange={e => handleVariantChange(idx, 'stock', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded font-bold text-gray-800 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pt-3">
                        {(form.variants || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 text-red-400 hover:text-red-600 transition"
                            title="Remove variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <F label="Product Image URL">
                <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..." className={inputCls} />
              </F>

              <div className="grid grid-cols-2 gap-3">
                <F label="Rating (1–5)">
                  <input type="number" step="0.1" min="1" max="5" value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 4.5 }))} className={inputCls} />
                </F>
                <F label="Status">
                  <select value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))} className={inputCls}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </F>
              </div>

              {form.image && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <img src={form.image} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200" onError={e => e.target.style.display = 'none'} />
                  <p className="text-xs text-gray-500">Image preview</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="py-2.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="py-2.5 bg-green-700 text-white font-black text-sm rounded-2xl hover:bg-green-800 transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {modal === 'edit' ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
