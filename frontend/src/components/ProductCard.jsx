import React, { useState } from 'react';
import { Star, ShoppingCart, Info, Layers, ShoppingBag, Sprout, Leaf, Wheat, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

const renderCropIcon = (cropName) => {
  const name = (cropName || '').toLowerCase();
  if (name.includes('paddy') || name.includes('rice') || name.includes('wheat') || name.includes('ಭತ್ತ')) {
    return <Wheat className="w-3 h-3 shrink-0 text-amber-700" />;
  }
  if (name.includes('soy') || name.includes('seed') || name.includes('ಸೋಯಾ') || name.includes('ಬೀಜ')) {
    return <Sprout className="w-3 h-3 shrink-0 text-agri-primary" />;
  }
  if (name.includes('groundnut') || name.includes('peanut') || name.includes('ಕಡಲೆಕಾಯಿ')) {
    return <Leaf className="w-3 h-3 shrink-0 text-agri-primary" />;
  }
  return <Sprout className="w-3 h-3 shrink-0 text-agri-primary" />;
};

export default function ProductCard({ product, onSelectSize, onViewGuidelines, onBuyNow, setCurrentTab, onViewDetail }) {
  const { language, t } = useLanguage();
  const { addToCart, startDirectBuy } = useCart();
  const [showOutOfStockPopup, setShowOutOfStockPopup] = useState(false);

  const title = language === 'kn' ? (product.name_kn || product.name) : product.name;
  const categoryName = language === 'kn' ? (product.category_name_kn || product.category_name) : product.category_name;

  const defaultVariant = product.variants?.[0] || { size: 'Standard', price: 500, discount: 10, stock: 50 };
  const discountedPrice = defaultVariant.discounted_price || (defaultVariant.price * (1 - defaultVariant.discount / 100));

  // Determine out-of-stock from all variants
  const totalStock = (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
  const isOutOfStock = totalStock === 0;

  const handleBuyNowClick = () => {
    if (isOutOfStock) { setShowOutOfStockPopup(true); return; }
    if (onBuyNow) {
      onBuyNow(product, defaultVariant);
    } else {
      startDirectBuy(product, defaultVariant, 1);
      if (setCurrentTab) setCurrentTab('checkout');
    }
  };

  const handleAddToCartClick = () => {
    if (isOutOfStock) { setShowOutOfStockPopup(true); return; }
    addToCart(product, defaultVariant);
  };

  const handleCardClick = () => {
    if (onViewDetail) {
      onViewDetail(product);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm transition-all duration-300 flex flex-col justify-between h-full group text-break-words ${isOutOfStock ? 'border-red-200 opacity-80' : 'border-agri-light hover:shadow-xl'}`}>
        {/* Image & Category Header */}
        <div>
          <div 
            onClick={handleCardClick}
            className="relative aspect-[16/9] w-full bg-agri-bg overflow-hidden cursor-pointer"
          >
            <img
              src={product.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600'}
              alt={title}
              loading="lazy"
              className={`w-full h-full object-cover transition duration-500 ${isOutOfStock ? 'grayscale' : 'group-hover:scale-105'}`}
            />
            {defaultVariant.discount > 0 && !isOutOfStock && (
              <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                {defaultVariant.discount}% OFF
              </span>
            )}
            {/* Out-of-stock overlay badge */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {language === 'kn' ? 'ಸ್ಟಾಕ್ ಇಲ್ಲ' : 'Out of Stock'}
                </span>
              </div>
            )}
            <span className="absolute top-2 right-2 bg-agri-dark/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm max-w-[65%] truncate text-right">
              {categoryName}
            </span>
          </div>

          {/* Card Body Content */}
          <div className="px-3 pt-3 pb-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-agri-textMuted font-semibold gap-2">
              <span className="text-agri-earth font-bold text-[11px] truncate">{product.brand}</span>
              <div className="flex items-center gap-0.5 text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 text-[11px] shrink-0">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{product.rating || 4.8}</span>
              </div>
            </div>

            <h3 
              onClick={handleCardClick}
              className="fluid-product-title font-bold text-agri-dark leading-snug text-break-words text-[13px] line-clamp-2 min-h-[36px] cursor-pointer hover:text-agri-primary transition"
            >
              {title}
            </h3>

            <div className="flex flex-wrap gap-1">
              {(product.crop_usage || 'All Crops').split(',').slice(0, 3).map((crop, idx) => {
                const cropName = crop.trim();
                return (
                  <span key={idx} className="bg-agri-light text-agri-dark text-[10px] font-semibold px-2 py-0.5 rounded-md text-break-words inline-flex items-center gap-1">
                    {renderCropIcon(cropName)}
                    <span>{cropName}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pricing & CTA Actions */}
        <div className="px-3 pb-3 pt-2 space-y-2">
          <div className="flex items-center justify-between gap-2 border-t border-agri-light/60 pt-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`text-lg font-black ${isOutOfStock ? 'text-gray-400 line-through' : 'text-agri-dark'}`}>
                ₹{Math.round(discountedPrice)}
              </span>
              {defaultVariant.discount > 0 && !isOutOfStock && (
                <span className="text-[11px] text-agri-textMuted line-through">
                  ₹{Math.round(defaultVariant.price)}
                </span>
              )}
              {isOutOfStock && (
                <span className="text-[11px] font-black text-red-500">
                  {language === 'kn' ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unavailable'}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-agri-secondary bg-agri-light px-2 py-0.5 rounded-md shrink-0">
              {defaultVariant.size}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onSelectSize(product)}
                className="py-1.5 px-2 bg-agri-light text-agri-dark font-bold text-[11px] rounded-lg hover:bg-agri-secondary/20 transition flex items-center justify-center gap-1 whitespace-normal text-center"
                aria-label="Choose Pack Size"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>{t('chooseSize')}</span>
              </button>

              <button
                onClick={() => onViewGuidelines(product)}
                className="py-1.5 px-2 bg-amber-50 text-amber-900 font-bold text-[11px] rounded-lg hover:bg-amber-100 transition flex items-center justify-center gap-1 border border-amber-200 whitespace-normal text-center"
                aria-label="View Product Guidelines"
              >
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                <span>{t('guidelines')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleAddToCartClick}
                className={`w-full py-2 px-2 border-2 font-black text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                  isOutOfStock
                    ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'bg-agri-bg border-agri-primary text-agri-primary hover:bg-agri-primary hover:text-white'
                }`}
                aria-label="Add Product to Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>{t('addToCart')}</span>
              </button>

              <button
                onClick={handleBuyNowClick}
                className={`w-full py-2 px-2 font-black text-xs rounded-lg transition flex items-center justify-center gap-1 shadow-md active:scale-95 ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-agri-primary to-emerald-700 text-white hover:from-agri-dark hover:to-agri-primary'
                }`}
                aria-label="Buy Product Immediately"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>{isOutOfStock ? (language === 'kn' ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unavailable') : t('buyNow')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Out-of-Stock Popup Modal ─────────────────────────────────────── */}
      {showOutOfStockPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowOutOfStockPopup(false)}>
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">
                  {language === 'kn' ? 'ಸ್ಟಾಕ್ ಮುಗಿದಿದೆ' : 'Out of Stock'}
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 font-medium leading-relaxed">
                  {language === 'kn'
                    ? `"${title}" ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ಶೀಘ್ರದಲ್ಲೇ ಮರು-ಸ್ಟಾಕ್ ಆಗಲಿದೆ.`
                    : `"${title}" is currently unavailable. We are restocking soon — please check back later.`}
                </p>
              </div>

              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 font-semibold text-left flex items-start gap-2">
                <span>💡</span>
                <span>
                  {language === 'kn'
                    ? 'ಮಾರ್ಕೆಟ್‌ಪ್ಲೇಸ್‌ನಲ್ಲಿ ಬೇರೆ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ ಅಥವಾ AI ಸಹಾಯಕದಲ್ಲಿ ಪರ್ಯಾಯ ಶಿಫಾರಸ್ ಪಡೆಯಿರಿ.'
                    : 'Browse other products in the Marketplace or use the AI Assistant for an alternative recommendation.'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowOutOfStockPopup(false)}
              className="w-full py-3 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md"
            >
              {language === 'kn' ? 'ಸರಿ, ಅರ್ಥವಾಯಿತು' : 'OK, Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
