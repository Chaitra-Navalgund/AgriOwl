import React, { useState } from 'react';
import { X, CheckCircle, ShoppingCart, Plus, Minus, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function SizeSelectorModal({ product, isOpen, onClose, onCheckout }) {
  const { language, t } = useLanguage();
  const { addToCart, startDirectBuy } = useCart();
  
  const variants = product?.variants || [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [stockWarning, setStockWarning] = useState(false);

  if (!isOpen || !product) return null;

  const activeVar = selectedVariant || variants[0];
  const title = language === 'kn' ? (product.name_kn || product.name) : product.name;
  const discountedPrice = activeVar?.discounted_price || (activeVar?.price * (1 - (activeVar?.discount || 0) / 100));
  const isVariantOutOfStock = activeVar && (activeVar.stock === 0 || activeVar.stock < 0);

  const handleAddToCart = () => {
    if (isVariantOutOfStock) {
      setStockWarning(true);
      return;
    }
    addToCart(product, activeVar, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    if (isVariantOutOfStock) {
      setStockWarning(true);
      return;
    }
    startDirectBuy(product, activeVar, quantity);
    onClose();
    if (onCheckout) onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border-4 border-agri-light animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-agri-textMuted hover:text-agri-textDark rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-agri-light">
          <img 
            src={product.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300'} 
            alt={title} 
            className="w-16 h-16 rounded-xl object-cover border border-agri-light"
          />
          <div>
            <span className="text-xs font-bold text-agri-earth">{product.brand}</span>
            <h3 className="text-base font-bold text-agri-dark leading-snug line-clamp-1">{title}</h3>
            <span className="text-xs text-agri-secondary font-semibold">🌾 {product.crop_usage || 'All Crops'}</span>
          </div>
        </div>

        <h4 className="text-sm font-black text-agri-dark mb-3">
          {language === 'kn' ? 'ಉಪಲಬ್ದ ಪ್ರಮಾಣದ ಪ್ಯಾಕ್‌ಗಳು (Pack Sizes)' : 'Available Pack Sizes:'}
        </h4>

        {/* Variant Cards Options */}
        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
          {variants.map((v) => {
            const vPrice = v.discounted_price || (v.price * (1 - (v.discount || 0) / 100));
            const isSelected = (activeVar?.id ? activeVar.id === v.id : activeVar?.size === v.size);
            const isOOS = v.stock === 0 || v.stock < 0;

            return (
              <div 
                key={v.id || v.size}
                onClick={() => {
                  setSelectedVariant(v);
                  setStockWarning(false);
                }}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                  isSelected 
                    ? isOOS ? 'border-red-400 bg-red-50/50 shadow-sm' : 'border-agri-primary bg-agri-light/60 shadow-sm' 
                    : isOOS ? 'border-red-100 bg-red-50/20 opacity-70' : 'border-gray-200 hover:border-agri-secondary/50 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? isOOS ? 'border-red-600 bg-red-600 text-white' : 'border-agri-primary bg-agri-primary text-white' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-4 h-4 fill-white text-agri-primary" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-agri-dark block">{v.size}</span>
                    <span className={`text-xs font-semibold ${isOOS ? 'text-red-600' : 'text-agri-textMuted'}`}>
                      {isOOS 
                        ? (language === 'kn' ? '⚠️ ಸ್ಟಾಕ್ ಮುಗಿದಿದೆ (Out of Stock)' : '⚠️ Out of Stock') 
                        : (language === 'kn' ? `ಸ್ಟಾಕ್: ${v.stock} ಯೂನಿಟ್‌ಗಳು ಲಭ್ಯ` : `Stock: ${v.stock} units available`)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-base font-black block ${isOOS ? 'text-gray-400 line-through' : 'text-agri-dark'}`}>
                    ₹{Math.round(vPrice)}
                  </span>
                  {v.discount > 0 && !isOOS && (
                    <span className="text-xs text-agri-textMuted line-through">₹{Math.round(v.price)} ({v.discount}% OFF)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Stock Warning Notice */}
        {stockWarning && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center gap-2 text-xs font-bold text-red-700 animate-in shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>
              {language === 'kn'
                ? 'ಕ್ಷಮಿಸಿ, ಈ ಗಾತ್ರದ ಪ್ಯಾಕ್ ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಬೇರೆ ಗಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.'
                : 'Selected pack size is out of stock. Please choose another pack size or check back soon.'}
            </span>
          </div>
        )}

        {/* Quantity Adjuster */}
        <div className="flex items-center justify-between mb-4 p-3 bg-agri-bg rounded-2xl border border-agri-light">
          <span className="text-sm font-bold text-agri-dark">
            {language === 'kn' ? 'ಪ್ರಮಾಣ (Quantity):' : 'Quantity:'}
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isVariantOutOfStock}
              className="p-2 bg-white rounded-lg border border-agri-light shadow-sm hover:bg-agri-light font-bold disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-base font-black text-agri-dark w-6 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              disabled={isVariantOutOfStock}
              className="p-2 bg-white rounded-lg border border-agri-light shadow-sm hover:bg-agri-light font-bold disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Total & CTAs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-base font-black text-agri-dark mb-2 px-1">
            <span>Subtotal:</span>
            <span className={`text-xl ${isVariantOutOfStock ? 'text-gray-400 line-through' : 'text-agri-primary'}`}>
              ₹{Math.round(discountedPrice * quantity)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={isVariantOutOfStock}
              className={`touch-target py-3 px-4 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 whitespace-normal text-center ${
                isVariantOutOfStock 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-agri-light text-agri-dark hover:bg-agri-secondary/30'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{t('addToCart')}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isVariantOutOfStock}
              className={`touch-target py-3 px-4 font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md whitespace-normal text-center ${
                isVariantOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-agri-primary text-white hover:bg-agri-dark'
              }`}
            >
              <span>{isVariantOutOfStock ? (language === 'kn' ? 'ಸ್ಟಾಕ್ ಇಲ್ಲ' : 'Out of Stock') : t('buyNow')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
