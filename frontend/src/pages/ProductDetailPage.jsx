import React, { useState } from 'react';
import { 
  ArrowLeft, ShoppingCart, ShoppingBag, Star, CheckCircle, ShieldCheck, 
  Truck, Sprout, AlertTriangle, Layers, Info, Check, Plus, Minus, Wheat, Leaf, FileText, Heart
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function ProductDetailPage({ product, setCurrentTab, onViewGuidelines, onOpenML }) {
  const { language, t } = useLanguage();
  const { addToCart, startDirectBuy } = useCart();

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-agri-dark">Product Not Found</h2>
        <button
          onClick={() => setCurrentTab('marketplace')}
          className="px-6 py-3 bg-agri-primary text-white font-bold rounded-2xl shadow"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const variants = product.variants && product.variants.length > 0
    ? product.variants
    : [{ id: 999, size: 'Standard Pack', price: 500, discount: 10, stock: 50 }];

  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  const title = language === 'kn' ? (product.name_kn || product.name) : product.name;
  const categoryName = language === 'kn' ? (product.category_name_kn || product.category_name) : product.category_name;

  const currentPrice = selectedVariant.discounted_price || (selectedVariant.price * (1 - (selectedVariant.discount || 0) / 100));
  const isOutOfStock = !selectedVariant.stock || selectedVariant.stock <= 0;
  const savings = Math.max(0, selectedVariant.price - currentPrice);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant, quantity);
    setToastMessage(language === 'kn' ? `"${title}" ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!` : `Added ${quantity} × ${selectedVariant.size} to Cart!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    startDirectBuy(product, selectedVariant, quantity);
    setCurrentTab('checkout');
  };

  const renderCropIcon = (cropName) => {
    const name = (cropName || '').toLowerCase();
    if (name.includes('paddy') || name.includes('rice') || name.includes('wheat') || name.includes('ಭತ್ತ')) {
      return <Wheat className="w-3.5 h-3.5 shrink-0 text-amber-700" />;
    }
    if (name.includes('groundnut') || name.includes('peanut') || name.includes('ಕಡಲೆಕಾಯಿ')) {
      return <Leaf className="w-3.5 h-3.5 shrink-0 text-agri-primary" />;
    }
    return <Sprout className="w-3.5 h-3.5 shrink-0 text-agri-primary" />;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-agri-dark text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-agri-secondary/40 animate-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-agri-primary flex items-center justify-center text-white">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">{toastMessage}</span>
          <button 
            onClick={() => setCurrentTab('cart')}
            className="ml-2 text-xs font-black underline text-agri-accent hover:text-white"
          >
            {language === 'kn' ? 'ಕಾರ್ಟ್ ವೀಕ್ಷಿಸಿ' : 'View Cart'} →
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => setCurrentTab('marketplace')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-agri-primary hover:text-agri-dark transition bg-white px-4 py-2 rounded-xl border border-agri-light shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'kn' ? 'ಮಾರುಕಟ್ಟೆಗೆ ಹಿಂತಿರುಗಿ' : 'Back to Marketplace'}</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-agri-textMuted">
          <span className="cursor-pointer hover:underline" onClick={() => setCurrentTab('home')}>Home</span>
          <span>/</span>
          <span className="cursor-pointer hover:underline" onClick={() => setCurrentTab('marketplace')}>Marketplace</span>
          <span>/</span>
          <span className="text-agri-dark font-bold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Card */}
      <div className="bg-white rounded-3xl border-2 border-agri-light p-6 sm:p-8 lg:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image & Badges */}
        <div className="lg:col-span-5 space-y-5">
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-agri-bg border-2 border-agri-light shadow-inner group">
            <img
              src={product.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800'}
              alt={title}
              className={`w-full h-full object-cover transition duration-500 ${isOutOfStock ? 'grayscale opacity-75' : 'group-hover:scale-105'}`}
            />
            {selectedVariant.discount > 0 && !isOutOfStock && (
              <span className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md">
                {selectedVariant.discount}% OFF
              </span>
            )}
            <span className="absolute top-3 right-3 bg-agri-dark/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              {categoryName}
            </span>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-red-600 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {language === 'kn' ? 'ಪ್ರಸ್ತುತ ಸ್ಟಾಕ್ ಇಲ್ಲ' : 'Out of Stock'}
                </div>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-agri-bg rounded-xl border border-agri-light flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-agri-primary shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-agri-dark">100% Certified</p>
                <p className="text-agri-textMuted">Govt. Verified Inputs</p>
              </div>
            </div>
            <div className="p-3 bg-agri-bg rounded-xl border border-agri-light flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-agri-primary shrink-0" />
              <div className="text-[11px] leading-tight">
                <p className="font-bold text-agri-dark">Hubballi Hub</p>
                <p className="text-agri-textMuted">2-3 Days Farm Delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information, Pricing, Pack Selector & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Rating */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-agri-earth bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                Brand: {product.brand || 'AgriOwl Certified'}
              </span>
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-amber-800 text-xs font-black">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{product.rating || 4.8} / 5</span>
                <span className="text-amber-700/60 font-medium">({product.reviews_count || 120} farmers)</span>
              </div>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-agri-dark leading-tight">
                {title}
              </h1>
              {language === 'kn' && product.name && (
                <p className="text-xs text-agri-textMuted font-bold mt-0.5">
                  English: {product.name}
                </p>
              )}
            </div>

            {/* Price Box */}
            <div className="bg-agri-bg p-4 sm:p-5 rounded-2xl border border-agri-light flex items-baseline justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-agri-primary">
                    ₹{Math.round(currentPrice)}
                  </span>
                  {selectedVariant.discount > 0 && (
                    <span className="text-base sm:text-lg text-agri-textMuted line-through font-semibold">
                      ₹{Math.round(selectedVariant.price)}
                    </span>
                  )}
                  {savings > 0 && (
                    <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Save ₹{Math.round(savings)} ({selectedVariant.discount}%)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-agri-textMuted font-semibold mt-1">
                  Inclusive of all taxes • Free delivery on orders over ₹1000
                </p>
              </div>

              {/* Stock status indicator */}
              <div className="text-right">
                {isOutOfStock ? (
                  <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                    ❌ Out of Stock
                  </span>
                ) : selectedVariant.stock < 15 ? (
                  <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 animate-pulse">
                    ⚡ Only {selectedVariant.stock} left in Hubballi
                  </span>
                ) : (
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-300">
                    ✓ In Stock ({selectedVariant.stock} units ready)
                  </span>
                )}
              </div>
            </div>

            {/* Pack Size / Variant Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-agri-dark uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-agri-primary" />
                {language === 'kn' ? 'ಪ್ಯಾಕ್ ಗಾತ್ರವನ್ನು ಆರಿಸಿ (Select Pack Size):' : 'Select Pack Size:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  const vPrice = v.discounted_price || (v.price * (1 - (v.discount || 0) / 100));
                  const vStockZero = !v.stock || v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                      className={`p-3 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                        isSelected 
                          ? 'border-agri-primary bg-agri-light/50 ring-2 ring-agri-primary/20 shadow-xs' 
                          : 'border-gray-200 hover:border-agri-secondary/50 bg-white'
                      } ${vStockZero ? 'opacity-60 bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-agri-dark">{v.size}</span>
                        {v.discount > 0 && (
                          <span className="text-[10px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {v.discount}% OFF
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-sm font-black text-agri-primary">₹{Math.round(vPrice)}</span>
                        {vStockZero && (
                          <span className="text-[9px] font-bold text-red-500">Sold out</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-black text-agri-dark uppercase tracking-wider block">
                {language === 'kn' ? 'ಪ್ರಮಾಣ (Quantity):' : 'Quantity:'}
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="inline-flex items-center bg-agri-bg border-2 border-agri-light rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-9 h-9 rounded-lg bg-white border border-agri-light flex items-center justify-center font-bold hover:bg-agri-light transition disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4 text-agri-dark" />
                  </button>
                  <span className="w-12 text-center font-black text-base text-agri-dark">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(selectedVariant.stock || 99, q + 1))}
                    disabled={isOutOfStock || quantity >= (selectedVariant.stock || 99)}
                    className="w-9 h-9 rounded-lg bg-white border border-agri-light flex items-center justify-center font-bold hover:bg-agri-light transition disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4 text-agri-dark" />
                  </button>
                </div>

                <div className="text-sm font-bold text-agri-textDark">
                  <span>Subtotal: </span>
                  <span className="text-lg font-black text-agri-primary">
                    ₹{Math.round(currentPrice * quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`py-4 px-6 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2 border-2 shadow-sm ${
                  isOutOfStock
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-agri-light border-agri-secondary text-agri-dark hover:bg-agri-secondary/30 active:scale-98'
                }`}
              >
                <ShoppingCart className="w-5 h-5 text-agri-primary" />
                <span>{language === 'kn' ? 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`py-4 px-6 font-black text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg active:scale-98 ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-agri-primary to-emerald-700 text-white hover:from-agri-dark hover:to-agri-primary'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isOutOfStock ? (language === 'kn' ? 'ಸ್ಟಾಕ್ ಇಲ್ಲ' : 'Out of Stock') : (language === 'kn' ? 'ಈಗಲೇ ಖರೀದಿಸಿ (Buy Now)' : 'Buy Now')}</span>
              </button>
            </div>
          </div>

          {/* Quick Help for Dosage & ML Recommendation */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🌾</span>
              <div>
                <p className="text-xs font-black text-amber-900">Need Dosage or Crop Advice?</p>
                <p className="text-[11px] text-amber-800 font-medium">Check our agronomic guidelines or ask AI Assistant.</p>
              </div>
            </div>
            {onViewGuidelines && (
              <button
                type="button"
                onClick={() => onViewGuidelines(product)}
                className="text-xs font-black text-amber-900 underline hover:text-agri-primary"
              >
                View Guidelines →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agronomic Details Tabs */}
      <div className="bg-white rounded-3xl border-2 border-agri-light p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex border-b border-agri-light overflow-x-auto gap-4">
          {[
            { id: 'description', label: language === 'kn' ? 'ವಿವರಣೆ & ಬಳಕೆ' : 'Description & Crop Usage' },
            { id: 'dosage', label: language === 'kn' ? 'ಪ್ರಮಾಣ & ವಿಧಾನ' : 'Dosage & Application' },
            { id: 'safety', label: language === 'kn' ? 'ಸುರಕ್ಷತೆ & ಎಚ್ಚರಿಕೆ' : 'Safety & Storage' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-xs sm:text-sm font-black transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-agri-primary text-agri-primary'
                  : 'border-transparent text-agri-textMuted hover:text-agri-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Description & Crop Usage */}
        {activeTab === 'description' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h3 className="text-sm font-black text-agri-dark mb-1">Product Details</h3>
              <p className="text-xs sm:text-sm text-agri-textDark leading-relaxed font-medium">
                {product.description || 'High quality agricultural input certified for high yield performance, pest resilience, and optimal crop growth under Karnataka climatic conditions.'}
              </p>
            </div>

            {/* Target Crops */}
            <div>
              <h4 className="text-xs font-black text-agri-dark uppercase tracking-wider mb-2">
                Recommended Crops:
              </h4>
              <div className="flex flex-wrap gap-2">
                {(product.crop_usage || 'Cotton, Chilli, Sugarcane, Soybean, Paddy, Groundnut').split(',').map((crop, idx) => {
                  const cName = crop.trim();
                  return (
                    <span key={idx} className="bg-agri-light text-agri-dark text-xs font-bold px-3 py-1.5 rounded-xl border border-agri-secondary/30 flex items-center gap-1.5">
                      {renderCropIcon(cName)}
                      <span>{cName}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dosage */}
        {activeTab === 'dosage' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-agri-bg rounded-2xl border border-agri-light space-y-1">
                <span className="text-xs font-black text-agri-earth">💧 Spray Dosage per Acre</span>
                <p className="text-sm font-bold text-agri-dark">
                  {product.dosage || '1.5 to 2.0 ml/gm per liter of water (approx 150-200 Liters spray volume per acre).'}
                </p>
              </div>
              <div className="p-4 bg-agri-bg rounded-2xl border border-agri-light space-y-1">
                <span className="text-xs font-black text-agri-earth">⏱️ Ideal Spray Timing</span>
                <p className="text-sm font-bold text-agri-dark">
                  Early morning (6:30 AM - 9:30 AM) or late evening (4:30 PM - 6:30 PM). Avoid high heat or rain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Safety */}
        {activeTab === 'safety' && (
          <div className="space-y-3 animate-in fade-in duration-200 text-xs sm:text-sm text-agri-textDark font-medium">
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-black">✓</span>
              Keep in a cool, dry place away from direct sunlight, children, and cattle fodder.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-black">✓</span>
              Always wear protective gloves, face mask, and eye goggles while spraying.
            </p>
            <p className="flex items-start gap-2">
              <span className="text-green-600 font-black">✓</span>
              Safely dispose of empty packages according to local agricultural waste guidelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
