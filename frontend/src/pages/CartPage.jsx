import React, { useState } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, PackageOpen, Tag, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { AVAILABLE_COUPONS, validateCouponCode } from '../utils/couponHelper';

export default function CartPage({ setCurrentTab }) {
  const { language, t } = useLanguage();
  const { 
    cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, 
    clearDirectBuy, appliedCoupon, applyCoupon, removeCoupon 
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const couponDiscount = appliedCoupon ? (appliedCoupon.discount || 0) : 0;
  const deliveryCharge = (cartTotal - couponDiscount) >= 1000 || cartTotal >= 1000 ? 0 : 50;
  const grandTotal = Math.max(0, cartTotal - couponDiscount + deliveryCharge);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError(language === 'kn' ? 'ದಯವಿಟ್ಟು ಕೂಪನ್ ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await validateCouponCode(code, cartTotal);
    setCouponLoading(false);

    if (res.success) {
      applyCoupon(res);
      setCouponSuccess(language === 'kn' ? `ಕೂಪನ್ "${res.code}" ಯಶಸ್ವಿಯಾಗಿ ಅನ್ವಯಿಸಲಾಗಿದೆ!` : `Coupon "${res.code}" applied successfully! You saved ₹${res.discount}.`);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess('');
    setCouponError('');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
        <div className="w-24 h-24 rounded-full bg-agri-light flex items-center justify-center mx-auto">
          <PackageOpen className="w-12 h-12 text-agri-textMuted" />
        </div>
        <h2 className="text-2xl font-black text-agri-dark">{t('cartEmpty')}</h2>
        <p className="text-sm text-agri-textMuted max-w-sm mx-auto">
          {language === 'kn' ? 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮಾರುಕಟ್ಟೆಯಿಂದ ಉತ್ಪನ್ನಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.' : 'Your cart is empty. Browse our marketplace to add agricultural products.'}
        </p>
        <button
          onClick={() => setCurrentTab('marketplace')}
          className="px-6 py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md inline-flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" /> {t('marketplace')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-agri-dark flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-agri-primary" />
          {t('shoppingCart')}
          <span className="ml-1 text-sm font-bold bg-agri-primary text-white px-2.5 py-0.5 rounded-full">{cartCount}</span>
        </h1>
        <button onClick={() => setCurrentTab('marketplace')} className="text-xs font-bold text-agri-primary hover:underline">
          ← {t('continueShopping')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, idx) => {
            const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
            const title = language === 'kn' ? (item.product.name_kn || item.product.name) : item.product.name;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border-2 border-agri-light shadow-sm flex items-center gap-4">
                <img src={item.product.image} alt={title} className="w-20 h-20 rounded-xl object-cover border border-agri-light shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-agri-earth">{item.product.brand} • {item.product.category_name}</span>
                  <h3 className="text-sm font-bold text-agri-dark leading-snug line-clamp-2">{title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-agri-secondary">{item.variant.size}</span>
                    <span className="text-xs font-bold text-gray-500">• ₹{Math.round(price)} / unit</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-agri-light border border-agri-secondary/30 flex items-center justify-center hover:bg-agri-secondary/20 transition">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-agri-dark w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.variant.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-agri-light border border-agri-secondary/30 flex items-center justify-center hover:bg-agri-secondary/20 transition">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-black text-agri-dark">₹{Math.round(price * item.quantity)}</p>
                  {item.variant.discount > 0 && (
                    <p className="text-xs text-agri-textMuted line-through">₹{Math.round(item.variant.price * item.quantity)}</p>
                  )}
                  <button onClick={() => removeFromCart(item.product.id, item.variant.id)}
                    className="mt-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Quick Coupons Card */}
          <div className="bg-white p-5 rounded-2xl border-2 border-agri-light shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-agri-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-agri-dark">
                {language === 'kn' ? 'ಲಭ್ಯವಿರುವ ಕೃಷಿ ಕೊಡುಗೆಗಳು (Available Offers)' : 'Available Agricultural Coupons'}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_COUPONS.map(c => {
                const isCurrent = appliedCoupon?.code === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleApplyCoupon(c.code)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                        : 'bg-agri-bg border-agri-light hover:border-agri-secondary/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-agri-dark tracking-wide">{c.code}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-agri-textMuted font-medium line-clamp-1">{c.description}</p>
                    </div>
                    <span className="font-bold text-[11px] text-agri-primary underline shrink-0 ml-2">
                      {isCurrent ? 'Applied' : 'Apply'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border-2 border-agri-light shadow-sm space-y-4 sticky top-24">
            <h3 className="text-base font-black text-agri-dark">{t('orderSummary')}</h3>

            {/* Coupon Input Box */}
            <div className="space-y-2 pt-1 border-t border-agri-light">
              <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                <span>{language === 'kn' ? 'ರಿಯಾಯಿತಿ ಕೂಪನ್ ಕೋಡ್' : 'Discount Coupon'}</span>
                {appliedCoupon && (
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-[11px] text-red-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </label>

              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KISAN10 or AGRI50"
                    className="flex-1 px-3 py-2 bg-agri-bg border border-agri-light rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-agri-primary"
                  />
                  <button
                    type="button"
                    disabled={couponLoading || !couponInput.trim()}
                    onClick={() => handleApplyCoupon(couponInput)}
                    className="px-4 py-2 bg-agri-primary text-white font-black text-xs rounded-xl hover:bg-agri-dark transition disabled:opacity-50"
                  >
                    {couponLoading ? '...' : (language === 'kn' ? 'ಅನ್ವಯಿಸಿ' : 'Apply')}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <div>
                      <span className="text-xs font-black text-emerald-900">{appliedCoupon.code}</span>
                      <p className="text-[10px] text-emerald-700 font-semibold">{appliedCoupon.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700">-₹{Math.round(couponDiscount)}</span>
                </div>
              )}

              {couponError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
              {couponSuccess && !couponError && (
                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {couponSuccess}
                </div>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pb-3 border-b border-agri-light">
              <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                <span>{t('subtotal')}</span>
                <span>₹{Math.round(cartTotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Coupon Discount ({appliedCoupon?.code})
                  </span>
                  <span>-₹{Math.round(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                <span>{t('deliveryFee')}</span>
                <span>{deliveryCharge === 0 ? <span className="text-agri-primary font-black">{t('free')}</span> : `₹${deliveryCharge}`}</span>
              </div>

              {deliveryCharge === 0 ? (
                <p className="text-xs text-agri-secondary font-bold bg-agri-light p-2 rounded-lg">
                  🎉 {language === 'kn' ? '₹1000 ಮೇಲಿನ ಖರೀದಿಗೆ ಉಚಿತ ತಲುಪಿಸಿ!' : 'Free delivery on orders above ₹1000!'}
                </p>
              ) : (
                <p className="text-[11px] text-agri-textMuted font-medium">
                  Add items worth ₹{Math.max(0, 1000 - (cartTotal - couponDiscount))} more for FREE delivery.
                </p>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-agri-dark">{t('total')}</span>
              <span className="text-xl font-black text-agri-primary">₹{Math.round(grandTotal)}</span>
            </div>

            <button 
              onClick={() => { clearDirectBuy(); setCurrentTab('checkout'); }}
              className="w-full py-4 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2"
            >
              <span>{t('proceedCheckout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
