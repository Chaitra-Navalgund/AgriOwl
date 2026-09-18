import React from 'react';
import { Star, ShoppingCart, Info, Layers, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, onSelectSize, onViewGuidelines, onBuyNow, setCurrentTab }) {
  const { language, t } = useLanguage();
  const { addToCart, startDirectBuy } = useCart();

  const title = language === 'kn' ? (product.name_kn || product.name) : product.name;
  const categoryName = language === 'kn' ? (product.category_name_kn || product.category_name) : product.category_name;
  
  const defaultVariant = product.variants?.[0] || { size: 'Standard', price: 500, discount: 10 };
  const discountedPrice = defaultVariant.discounted_price || (defaultVariant.price * (1 - defaultVariant.discount / 100));

  const handleBuyNowClick = () => {
    if (onBuyNow) {
      onBuyNow(product, defaultVariant);
    } else {
      startDirectBuy(product, defaultVariant, 1);
      if (setCurrentTab) setCurrentTab('checkout');
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-agri-light overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full group text-break-words">
      {/* Image & Category Header */}
      <div>
        <div className="relative aspect-[16/9] w-full bg-agri-bg overflow-hidden">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600'} 
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          {defaultVariant.discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
              {defaultVariant.discount}% OFF
            </span>
          )}
          <span className="absolute top-2 right-2 bg-agri-dark/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm max-w-[65%] truncate text-right">
            {categoryName}
          </span>
        </div>

        {/* Card Body Content */}
        <div className="px-3 pt-3 pb-1 space-y-1.5">
          {/* Brand & Star Rating Row */}
          <div className="flex items-center justify-between text-xs text-agri-textMuted font-semibold gap-2">
            <span className="text-agri-earth font-bold text-[11px] truncate">{product.brand}</span>
            <div className="flex items-center gap-0.5 text-amber-600 font-black bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 text-[11px] shrink-0">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>{product.rating || 4.8}</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="fluid-product-title font-bold text-agri-dark leading-snug text-break-words text-[13px] line-clamp-2 min-h-[36px]">
            {title}
          </h3>

          {/* Suitable Crop Pills */}
          <div className="flex flex-wrap gap-1">
            {(product.crop_usage || 'All Crops').split(',').slice(0, 3).map((crop, idx) => (
              <span key={idx} className="bg-agri-light text-agri-dark text-[10px] font-semibold px-2 py-0.5 rounded-md text-break-words">
                🌾 {crop.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing & CTA Actions */}
      <div className="px-3 pb-3 pt-2 space-y-2">
        {/* Pricing Row */}
        <div className="flex items-center justify-between gap-2 border-t border-agri-light/60 pt-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-black text-agri-dark">
              ₹{Math.round(discountedPrice)}
            </span>
            {defaultVariant.discount > 0 && (
              <span className="text-[11px] text-agri-textMuted line-through">
                ₹{Math.round(defaultVariant.price)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-agri-secondary bg-agri-light px-2 py-0.5 rounded-md shrink-0">
            {defaultVariant.size}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-1.5">
          {/* Secondary actions: Choose Size & Guidelines */}
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

          {/* Primary actions: Add to Cart & Buy Now Side-by-Side */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => addToCart(product, defaultVariant)}
              className="w-full py-2 px-2 bg-agri-bg border-2 border-agri-primary text-agri-primary font-black text-xs rounded-lg hover:bg-agri-primary hover:text-white transition flex items-center justify-center gap-1 shadow-sm active:scale-95"
              aria-label="Add Product to Cart"
              title="Add to shopping cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{t('addToCart')}</span>
            </button>

            <button
              onClick={handleBuyNowClick}
              className="w-full py-2 px-2 bg-gradient-to-r from-agri-primary to-emerald-700 text-white font-black text-xs rounded-lg hover:from-agri-dark hover:to-agri-primary transition flex items-center justify-center gap-1 shadow-md active:scale-95"
              aria-label="Buy Product Immediately"
              title="Instant Direct Purchase"
            >
              <Zap className="w-3.5 h-3.5 shrink-0 fill-amber-300 text-amber-300" />
              <span>{t('buyNow')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
