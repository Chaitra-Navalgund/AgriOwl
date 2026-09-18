import React, { useState } from 'react';
import { MapPin, Navigation, Check, ChevronRight, CreditCard, Smartphone, Banknote, Loader2, AlertCircle, CheckCircle2, Package, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { setStored, getStored, STORE_KEYS } from '../utils/persistentStore';
import { orderApi, paymentApi } from '../services/api';

const STEPS = ['review', 'address', 'payment', 'confirmation'];

export default function CheckoutPage({ setCurrentTab, setTrackingOrderId }) {
  const { language, t } = useLanguage();
  const { cartItems, clearCart, directBuyItem, clearDirectBuy } = useCart();
  const [step, setStep] = useState(0);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);

  // Use ONLY directBuyItem if "Buy Now" was clicked, otherwise use full cart
  const checkoutItems = directBuyItem ? [directBuyItem] : cartItems;

  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
    return sum + price * item.quantity;
  }, 0);

  const [address, setAddress] = useState({
    full_name: '', mobile: '', house_no: '', village: '', taluk: '', district: 'Dharwad', state: 'Karnataka', pincode: '', latitude: 15.5647, longitude: 75.3640
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_UPI'); // 'COD' | 'ONLINE_UPI' | 'CARD'
  const [onlineSubMethod, setOnlineSubMethod] = useState('phonepe'); // 'phonepe' | 'gpay' | 'paytm' | 'bhim'
  const [upiId, setUpiId] = useState('');

  const deliveryCharge = subtotal >= 1000 ? 0 : 50;
  const grandTotal = subtotal + deliveryCharge;

  const handleDetectLocation = () => {
    setDetectingLoc(true);
    if (!navigator.geolocation) {
      setDetectingLoc(false);
      setError("Geolocation is not supported by this browser. Please enter your address manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress(prev => ({ ...prev, latitude, longitude }));
        // OpenStreetMap Nominatim Reverse Geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          const a = data.address || {};
          const detectedLocality = a.suburb || a.neighbourhood || a.residential || a.village || a.town || a.city_district || a.city || 'Navanagar';
          const detectedTaluk = a.county || a.state_district || a.subdistrict || 'Hubballi';
          const detectedDistrict = a.state_district || a.county || 'Dharwad';
          const detectedState = a.state || 'Karnataka';
          const detectedPincode = a.postcode || '';

          setAddress(prev => ({
            ...prev,
            village: detectedLocality,
            taluk: detectedTaluk,
            district: detectedDistrict,
            state: detectedState,
            pincode: detectedPincode,
            latitude: Number(latitude),
            longitude: Number(longitude)
          }));
        } catch {}
        setDetectingLoc(false);
      },
      () => {
        setDetectingLoc(false);
        setError("Location detection failed. Please enter your address manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Mirrors the newly placed order into the local persistent store so the
  // Admin dashboard's offline demo views and notifications stay in sync.
  const cacheOrderLocally = (orderRecord) => {
    try {
      const storedOrders = getStored(STORE_KEYS.ORDERS) || [];
      const updatedOrders = [orderRecord, ...storedOrders.filter(o => String(o.order_id) !== String(orderRecord.order_id))];
      setStored(STORE_KEYS.ORDERS, updatedOrders);
      localStorage.setItem('agriowl_orders', JSON.stringify(updatedOrders.slice(0, 50)));

      const storedNotifs = getStored(STORE_KEYS.NOTIFICATIONS) || [];
      const newNotif = {
        id: `notif_${Date.now()}`,
        type: 'NEW_ORDER',
        message: `New Order #${orderRecord.order_id} placed by ${orderRecord.farmer_name} for ₹${Math.round(orderRecord.total_amount)}. Action required: Accept or Reject.`,
        status: 'UNREAD',
        created_at: new Date().toISOString(),
      };
      setStored(STORE_KEYS.NOTIFICATIONS, [newNotif, ...storedNotifs]);
      localStorage.setItem('agriowl_notifications', JSON.stringify([newNotif, ...storedNotifs].slice(0, 50)));
      localStorage.setItem('agriowl_latest_order', JSON.stringify({ ...orderRecord, ...address }));

      const farmerKey = `f_${address.mobile || address.full_name || Date.now()}`;
      const storedFarmers = getStored(STORE_KEYS.FARMERS) || [];
      const existingFarmer = storedFarmers.find(f => String(f.id) === farmerKey);
      const farmerRecord = existingFarmer
        ? { ...existingFarmer, total_orders: (existingFarmer.total_orders || 0) + 1, total_spending: (existingFarmer.total_spending || 0) + orderRecord.total_amount }
        : {
            id: farmerKey,
            username: (address.full_name || 'farmer').toLowerCase().replace(/\s+/g, '_'),
            first_name: (address.full_name || 'Farmer').split(' ')[0],
            last_name: (address.full_name || '').split(' ').slice(1).join(' '),
            email: '',
            mobile: address.mobile || '',
            district: address.district || 'Karnataka',
            state: address.state || 'Karnataka',
            date_joined: new Date().toISOString(),
            total_orders: 1,
            total_spending: orderRecord.total_amount,
            is_active: true,
          };
      const updatedFarmers = [farmerRecord, ...storedFarmers.filter(f => String(f.id) !== farmerKey)];
      setStored(STORE_KEYS.FARMERS, updatedFarmers);
    } catch {}
  };

  const finishOrderSuccess = (orderId) => {
    if (setTrackingOrderId) setTrackingOrderId(orderId);
    setPlacedOrder({ order_id: orderId });
    if (directBuyItem) clearDirectBuy(); else clearCart();
    setStep(3);
    setSubmitting(false);
  };

  const handlePlaceOrder = async () => {
    if (!address.full_name || !address.mobile || !address.village) {
      setError("Please fill in Full Name, Mobile, and Village fields.");
      return;
    }
    setSubmitting(true);
    setError('');

    const backendPaymentMethod = paymentMethod === 'COD' ? 'COD' : (paymentMethod === 'CARD' ? 'CARD' : 'UPI');

    const orderPayload = {
      address: { ...address },
      items: checkoutItems.map(item => ({
        product_id: item.product.id,
        variant_id: item.variant.id,
        quantity: item.quantity,
      })),
      payment_method: backendPaymentMethod,
    };

    try {
      // 1. Always create the order on the backend first (payment_status starts
      //    'Pending' for online methods — it only flips to 'Paid' once Razorpay
      //    signature verification succeeds below).
      const createRes = await orderApi.createOrder(orderPayload);
      if (!createRes.data.success) {
        throw new Error(createRes.data.message || 'Order creation failed');
      }
      const newOrderId = createRes.data.order_id;
      const orderData = createRes.data.data;

      const orderRecordForCache = {
        order_id: newOrderId,
        farmer_name: address.full_name || 'Farmer',
        farmer_mobile: address.mobile || '',
        created_at: orderData.created_at || new Date().toISOString(),
        total_amount: orderData.total_amount || grandTotal,
        payment_method: paymentMethod,
        payment_method_display: paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : `Online Payment (${onlineSubMethod.toUpperCase()}${upiId ? ` - ${upiId}` : ''})`,
        online_provider: onlineSubMethod,
        order_status: 0,
        status_display: 'Pending',
        items: checkoutItems.map(item => ({
          product_name: item.product.name,
          variant_size: item.variant.size,
          quantity: item.quantity,
          unit_price: item.variant.discounted_price || item.variant.price,
          total_price: (item.variant.discounted_price || item.variant.price) * item.quantity,
        })),
        address: { ...address },
      };

      // 2. Cash on Delivery needs no gateway — we're done.
      if (paymentMethod === 'COD') {
        cacheOrderLocally(orderRecordForCache);
        finishOrderSuccess(newOrderId);
        return;
      }

      // 3. Online (UPI/Card): ask the backend to open a matching Razorpay Order.
      const rzpOrderRes = await paymentApi.createRazorpayOrder(newOrderId);
      if (!rzpOrderRes.data.success) {
        throw new Error(rzpOrderRes.data.message || 'Could not start payment');
      }
      const { key, amount, currency, razorpay_order_id } = rzpOrderRes.data;

      if (!window.Razorpay) {
        throw new Error('Payment SDK failed to load. Check your internet connection and try again.');
      }

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: 'AgriOwl',
        description: `Order #${newOrderId}`,
        order_id: razorpay_order_id,
        prefill: {
          name: address.full_name,
          contact: address.mobile,
        },
        theme: { color: '#2f7d32' },
        notes: { agriowl_order_id: newOrderId },
        handler: async (response) => {
          // 4. Payment succeeded in the popup — verify the signature server-side
          //    before trusting it and marking the order Paid.
          try {
            const verifyRes = await paymentApi.verifyRazorpayPayment(newOrderId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verifyRes.data.success) {
              throw new Error(verifyRes.data.message || 'Payment verification failed');
            }
            cacheOrderLocally({ ...orderRecordForCache, payment_status: 'Paid' });
            finishOrderSuccess(newOrderId);
          } catch (err) {
            setSubmitting(false);
            setError('Payment was received but verification failed. Please contact support with Order #' + newOrderId + '.');
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setError('Payment was cancelled. Your order is saved as Pending — you can retry payment from My Orders.');
          },
        },
      });

      rzp.on('payment.failed', (resp) => {
        setSubmitting(false);
        setError(`Payment failed: ${resp.error?.description || 'Please try again.'}`);
      });

      rzp.open();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Could not complete order. Please try again.');
    }
  };

  const stepLabels = [t('step1'), t('step2'), t('step3'), t('step4')];

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Stepper Header */}
      <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          {stepLabels.map((label, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center relative ${idx < STEPS.length - 1 ? 'after:absolute after:top-4 after:left-1/2 after:w-full after:h-0.5 after:bg-agri-light after:z-0' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition ${
                step === idx ? 'bg-agri-primary text-white ring-4 ring-agri-light shadow-md' :
                step > idx ? 'bg-agri-secondary text-white' :
                'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                {step > idx ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-bold mt-1.5 hidden sm:block ${step === idx ? 'text-agri-primary' : step > idx ? 'text-agri-secondary' : 'text-gray-400'}`}>
                {label.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Review Items */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
              <Package className="w-5 h-5 text-agri-primary" /> {t('step1')}
            </h2>
            {directBuyItem && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {language === 'kn' ? 'ನೇರ ಖರೀದಿ (Single Product)' : 'Direct Buy (Single Product)'}
              </span>
            )}
          </div>

          {checkoutItems.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-gray-500 font-bold">No product selected for order.</p>
              <button 
                onClick={() => {
                  if (directBuyItem) clearDirectBuy();
                  setCurrentTab('marketplace');
                }}
                className="px-5 py-2.5 bg-agri-primary text-white font-bold text-xs rounded-xl shadow"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {checkoutItems.map((item, idx) => {
                  const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3.5 bg-agri-bg rounded-2xl border border-agri-light">
                      <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover border border-agri-light" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-agri-dark line-clamp-1">{language === 'kn' ? (item.product.name_kn || item.product.name) : item.product.name}</h4>
                        <p className="text-xs text-agri-textMuted font-semibold">{item.variant.size} × {item.quantity}</p>
                      </div>
                      <span className="text-base font-black text-agri-dark shrink-0">₹{Math.round(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
              {/* Order Summary */}
              <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light space-y-2">
                <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                  <span>{t('subtotal')}</span><span>₹{Math.round(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                  <span>{t('deliveryFee')}</span>
                  <span>{deliveryCharge === 0 ? <span className="text-agri-primary font-black">{t('free')}</span> : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-base font-black text-agri-dark border-t border-agri-light pt-2 mt-1">
                  <span>{t('total')}</span><span className="text-agri-primary text-lg">₹{Math.round(grandTotal)}</span>
                </div>
              </div>
              <button onClick={() => setStep(1)} className="w-full py-4 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2">
                <span>{language === 'kn' ? 'ವಿತರಣಾ ವಿಳಾಸಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ' : 'Proceed to Delivery Address'}</span> <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
            <MapPin className="w-5 h-5 text-agri-primary" /> {t('step2')}
          </h2>

          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

          <button
            onClick={handleDetectLocation}
            disabled={detectingLoc}
            className="w-full py-3 bg-agri-accent text-agri-textDark font-black text-sm rounded-2xl hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow-sm"
          >
            {detectingLoc ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('detectingLoc')}</> : <><Navigation className="w-4 h-4" /> {t('detectLocation')}</>}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {[
              ['full_name', t('fullName'), 'text', 'full'],
              ['mobile', t('mobileNumber'), 'tel', 'full'],
              ['house_no', t('houseNo'), 'text', 'half'],
              ['village', t('village') + ' *', 'text', 'half'],
              ['taluk', t('taluk'), 'text', 'half'],
              ['district', t('district'), 'text', 'half'],
              ['state', t('state'), 'text', 'half'],
              ['pincode', t('pincode'), 'text', 'half'],
            ].map(([field, label, type, span]) => (
              <div key={field} className={span === 'full' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-agri-dark mb-1">{label}</label>
                <input
                  type={type}
                  value={address[field]}
                  onChange={(e) => setAddress(prev => ({ ...prev, [field]: e.target.value }))}
                  className="touch-target w-full px-4 py-2.5 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-medium focus:outline-none focus:border-agri-primary transition text-break-words"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button onClick={() => setStep(0)} className="touch-target py-3 bg-agri-bg text-agri-dark font-bold text-sm rounded-2xl border-2 border-agri-light hover:border-agri-secondary/40 transition flex items-center justify-center">
              ← Back
            </button>
            <button onClick={() => setStep(2)} className="touch-target py-3 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center">
              {language === 'kn' ? 'ಪಾವತಿ ವಿಧಾನ ಆಯ್ಕೆಮಾಡಿ →' : 'Select Payment Method →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-agri-primary" /> {language === 'kn' ? 'ಪಾವತಿ ವಿಧಾನ' : 'Choose Payment Method'}
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-bold border border-green-200">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Safe & Encrypted
            </span>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            {/* 1. Online UPI / QR / Net Banking Option */}
            <div 
              onClick={() => setPaymentMethod('ONLINE_UPI')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                paymentMethod === 'ONLINE_UPI' ? 'border-agri-primary bg-agri-light/40 shadow-sm' : 'border-gray-200 bg-white hover:border-agri-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-agri-dark block">
                      {language === 'kn' ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ (PhonePe, GPay, Paytm, UPI)' : 'Online Payment (UPI, PhonePe, GPay, Paytm, QR)'}
                    </span>
                    <span className="text-xs text-agri-textMuted font-medium">
                      Fast, instant payment via any UPI application or QR code scan.
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ONLINE_UPI' ? 'border-agri-primary bg-agri-primary text-white' : 'border-gray-300'}`}>
                  {paymentMethod === 'ONLINE_UPI' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Expanded Online Sub-methods */}
              {paymentMethod === 'ONLINE_UPI' && (
                <div className="mt-4 pt-4 border-t border-agri-light space-y-3.5 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-bold text-gray-700">Select your preferred Online Payment app / mode:</p>
                  
                  {/* App Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'phonepe', name: 'PhonePe', icon: '📱', color: 'bg-purple-50 border-purple-200 text-purple-800' },
                      { id: 'gpay', name: 'Google Pay', icon: '⚡', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                      { id: 'paytm', name: 'Paytm UPI', icon: '💳', color: 'bg-sky-50 border-sky-200 text-sky-800' },
                      { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: 'bg-orange-50 border-orange-200 text-orange-800' },
                    ].map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setOnlineSubMethod(app.id)}
                        className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center gap-2 transition ${
                          onlineSubMethod === app.id ? `${app.color} ring-2 ring-agri-primary shadow-xs` : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base">{app.icon}</span>
                        <span className="truncate">{app.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* QR Code Scan Option */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-1 text-center shrink-0">
                      <QrCode className="w-14 h-14 text-gray-800" />
                      <span className="text-[9px] font-black text-green-700">Scan & Pay ₹{Math.round(grandTotal)}</span>
                    </div>
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <h4 className="text-xs font-black text-gray-800">Direct QR Code Payment</h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-tight">
                        Scan from PhonePe, Google Pay or BHIM to pay instantly at 0% extra fee.
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">Instant Verification</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">Zero Charges</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom UPI ID Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">Or enter your UPI ID (Optional):</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. mobileNumber@ybl or yourname@oksbi"
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:border-agri-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Kisan RuPay / Credit / Debit Card */}
            <div 
              onClick={() => setPaymentMethod('CARD')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                paymentMethod === 'CARD' ? 'border-agri-primary bg-agri-light/40 shadow-sm' : 'border-gray-200 bg-white hover:border-agri-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-agri-dark block">
                      {language === 'kn' ? 'ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ / ಡೆಬಿಟ್ ಕಾರ್ಡ್ (Kisan Card / RuPay)' : 'Kisan Credit / Debit Card / Visa / RuPay'}
                    </span>
                    <span className="text-xs text-agri-textMuted font-medium">
                      Pay using Kisan Credit Card, RuPay, Visa or MasterCard.
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'CARD' ? 'border-agri-primary bg-agri-primary text-white' : 'border-gray-300'}`}>
                  {paymentMethod === 'CARD' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* 3. Cash on Delivery (COD) */}
            <div 
              onClick={() => setPaymentMethod('COD')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                paymentMethod === 'COD' ? 'border-agri-primary bg-agri-light/40 shadow-sm' : 'border-gray-200 bg-white hover:border-agri-secondary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-agri-dark block">{t('paymentCOD')}</span>
                    <span className="text-xs text-agri-textMuted font-medium">
                      Pay cash to delivery executive when package arrives at your farm.
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-agri-primary bg-agri-primary text-white' : 'border-gray-300'}`}>
                  {paymentMethod === 'COD' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Final Total */}
          <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">Final Payable Amount:</span>
              <span className="text-xl font-black text-agri-dark">₹{Math.round(grandTotal)}</span>
            </div>
            <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1.5 rounded-xl border border-green-300">
              Free Delivery Included
            </span>
          </div>

          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold"><AlertCircle className="w-4 h-4" />{error}</div>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => setStep(1)} className="py-3.5 bg-agri-bg text-agri-dark font-bold text-sm rounded-2xl border-2 border-agri-light hover:border-agri-secondary/40 transition">
              ← Back
            </button>
            <button 
              onClick={handlePlaceOrder} 
              disabled={submitting}
              className="py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...</>
              ) : (
                `✅ ${paymentMethod === 'COD' ? t('placeOrder') : `Pay ₹${Math.round(grandTotal)} Now`}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && placedOrder && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-8 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-agri-dark">{t('orderSuccessTitle')}</h2>
            <p className="text-sm text-agri-textMuted mt-1">
              {language === 'kn' ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಆದೇಶವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ.' : 'Thank you! Your agricultural inputs order has been placed and is being dispatched.'}
            </p>
          </div>

          <div className="bg-agri-bg rounded-2xl p-6 border border-agri-light text-left space-y-3">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">{t('orderIdLabel')}:</span>
              <span className="font-black text-agri-dark text-lg">#{placedOrder.order_id}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Payment Mode:</span>
              <span className="font-bold text-agri-dark">
                {paymentMethod === 'COD' ? 'Cash on Delivery' : `Online (${onlineSubMethod.toUpperCase()})`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Total Paid/Payable:</span>
              <span className="font-black text-agri-primary text-lg">₹{Math.round(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Estimated Delivery:</span>
              <span className="font-bold text-agri-dark">2-3 Business Days (Hubballi Hub)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setCurrentTab('orders')} className="py-3.5 bg-agri-light text-agri-dark font-bold text-sm rounded-2xl hover:bg-agri-secondary/20 transition">
              {t('myOrders')}
            </button>
            <button
              onClick={() => {
                if (setTrackingOrderId && placedOrder.order_id) {
                  setTrackingOrderId(placedOrder.order_id);
                }
                setCurrentTab('tracking');
              }}
              className="py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-1.5"
            >
              🚚 {t('trackOrderBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
