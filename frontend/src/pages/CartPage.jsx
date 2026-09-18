import React from 'react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, PackageOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';

export default function CartPage({ setCurrentTab }) {
  const { language, t } = useLanguage();
  const { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart, clearDirectBuy } = useCart();
  const deliveryCharge = cartTotal >= 1000 ? 0 : 50;
  const grandTotal = cartTotal + deliveryCharge;

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
    <div className="max-w-4xl mx-auto space-y-6">
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
                  <span className="text-xs font-semibold text-agri-secondary">{item.variant.size}</span>

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
                    className="mt-2 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border-2 border-agri-light shadow-sm space-y-4 sticky top-24">
            <h3 className="text-base font-black text-agri-dark">{t('orderSummary')}</h3>
            <div className="space-y-2 pb-3 border-b border-agri-light">
              <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                <span>{t('subtotal')}</span><span>₹{Math.round(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                <span>{t('deliveryFee')}</span>
                <span>{deliveryCharge === 0 ? <span className="text-agri-primary font-black">{t('free')}</span> : `₹${deliveryCharge}`}</span>
              </div>
              {deliveryCharge === 0 && (
                <p className="text-xs text-agri-secondary font-bold bg-agri-light p-2 rounded-lg">
                  🎉 {language === 'kn' ? '₹1000 ಮೇಲಿನ ಖರೀದಿಗೆ ಉಚಿತ ತಲುಪಿಸಿ!' : 'Free delivery on orders above ₹1000!'}
                </p>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-agri-dark">{t('total')}</span>
              <span className="text-xl font-black text-agri-primary">₹{Math.round(grandTotal)}</span>
            </div>
            <button onClick={() => { clearDirectBuy(); setCurrentTab('checkout'); }}
              className="w-full py-4 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2">
              <span>{t('proceedCheckout')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
