import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Check, ChevronRight, CreditCard, Smartphone, Banknote, 
  Loader2, AlertCircle, CheckCircle2, Package, QrCode, ShieldCheck, Zap, 
  FileText, X, Receipt, FileSpreadsheet, Tag, ArrowLeft, RefreshCw, UserCheck, UserX, Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { setStored, getStored, STORE_KEYS } from '../utils/persistentStore';
import { orderApi, paymentApi } from '../services/api';
import { exportOrderReceiptExcel } from '../utils/exportReceiptExcel';
import { AVAILABLE_COUPONS, validateCouponCode } from '../utils/couponHelper';
import FarmerAuthModal from '../components/FarmerAuthModal';

const STEPS = ['review', 'address', 'confirmation', 'payment'];

export default function CheckoutPage({ setCurrentTab, setTrackingOrderId, onOpenFarmerAuth }) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { 
    cartItems, clearCart, directBuyItem, clearDirectBuy, 
    appliedCoupon, applyCoupon, removeCoupon 
  } = useCart();

  const [step, setStep] = useState(0);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [localAuthModalOpen, setLocalAuthModalOpen] = useState(false);
  const [pendingRazorpayOrderId, setPendingRazorpayOrderId] = useState(null);

  // Coupon state in checkout
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Use ONLY directBuyItem if "Buy Now" was clicked, otherwise use full cart
  const checkoutItems = directBuyItem ? [directBuyItem] : cartItems;

  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
    return sum + price * item.quantity;
  }, 0);

  const couponDiscount = appliedCoupon ? (appliedCoupon.discount || 0) : 0;
  const deliveryCharge = (subtotal - couponDiscount) >= 1000 || subtotal >= 1000 ? 0 : 50;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  // Address state with all required fields
  const [address, setAddress] = useState({
    full_name: '',
    mobile: '',
    email: '',
    house_no: '',
    village: '',
    taluk: '',
    district: 'Dharwad',
    state: 'Karnataka',
    country: 'India',
    pincode: '',
    latitude: 15.5647,
    longitude: 75.3640
  });

  // Validation errors map
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-fill from user profile when authenticated
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        full_name: prev.full_name || (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username || ''),
        mobile: prev.mobile || user.mobile || '',
        email: prev.email || user.email || '',
        district: prev.district || user.district || 'Dharwad',
        state: prev.state || user.state || 'Karnataka',
      }));
    }
  }, [user]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_UPI'); // 'COD' | 'ONLINE_UPI' | 'CARD'
  const [onlineSubMethod, setOnlineSubMethod] = useState('phonepe'); // 'phonepe' | 'gpay' | 'paytm' | 'bhim'
  const [upiId, setUpiId] = useState('');

  // Form Validation
  const validateAddressForm = () => {
    const errors = {};
    if (!address.full_name.trim() || address.full_name.trim().length < 2) {
      errors.full_name = language === 'kn' ? 'ದಯವಿಟ್ಟು ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ (ಕನಿಷ್ಠ 2 ಅಕ್ಷರ).' : 'Please enter your full name (minimum 2 characters).';
    }

    const mobileClean = address.mobile.replace(/\D/g, '');
    if (!mobileClean || mobileClean.length !== 10 || !/^[6-9]\d{9}$/.test(mobileClean)) {
      errors.mobile = language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ (6-9 ರಿಂದ ಆರಂಭ).' : 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      errors.email = language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.' : 'Please enter a valid email address (e.g. farmer@gmail.com).';
    }

    if (!address.house_no.trim()) {
      errors.house_no = language === 'kn' ? 'ಮನೆ ನಂ / ಸರ್ವೆ ನಂ / ರಸ್ತೆ ನಮೂದಿಸಿ.' : 'House No. / Farm Survey No. is required.';
    }

    if (!address.village.trim()) {
      errors.village = language === 'kn' ? 'ಗ್ರಾಮ / ಊರು / ನಗರ ನಮೂದಿಸಿ.' : 'Village / Town / City is required.';
    }

    if (!address.taluk.trim()) {
      errors.taluk = language === 'kn' ? 'ತಾಲೂಕು ನಮೂದಿಸಿ.' : 'Taluk is required.';
    }

    if (!address.district.trim()) {
      errors.district = language === 'kn' ? 'ಜಿಲ್ಲೆ ನಮೂದಿಸಿ.' : 'District is required.';
    }

    const pinClean = address.pincode.replace(/\D/g, '');
    if (!pinClean || pinClean.length !== 6 || !/^\d{6}$/.test(pinClean)) {
      errors.pincode = language === 'kn' ? 'ದಯವಿಟ್ಟು ಮಾನ್ಯವಾದ 6-ಅಂಕಿಯ ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ.' : 'Please enter a valid 6-digit PIN code.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    const res = await validateCouponCode(code, subtotal);
    setCouponLoading(false);

    if (res.success) {
      applyCoupon(res);
      setCouponSuccess(`Coupon "${res.code}" applied! You save ₹${res.discount}.`);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleDetectLocation = () => {
    setDetectingLoc(true);
    setError('');
    if (!navigator.geolocation) {
      setDetectingLoc(false);
      setError("Geolocation is not supported by this browser. Please enter your address manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddress(prev => ({ ...prev, latitude, longitude }));
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
            email: address.email || '',
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

  const finishOrderSuccess = (orderId, paymentStatus = 'Paid') => {
    if (setTrackingOrderId) setTrackingOrderId(orderId);
    setPlacedOrder({ order_id: orderId, payment_status: paymentStatus });
    if (directBuyItem) clearDirectBuy(); else clearCart();
    setStep(4); // Placed Order Screen
    setSubmitting(false);
  };

  const handleProceedToConfirmation = () => {
    if (!validateAddressForm()) {
      setError(language === 'kn' ? 'ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ.' : 'Please correct the highlighted errors before proceeding.');
      return;
    }
    setError('');
    setStep(2); // Order Confirmation Review
  };

  // Triggers order submission and Razorpay payment
  const handleInitiatePayment = async () => {
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
      coupon_code: appliedCoupon ? appliedCoupon.code : '',
    };

    try {
      // 1. Create order on backend with server-verified total
      const createRes = await orderApi.createOrder(orderPayload);
      if (!createRes.data.success) {
        throw new Error(createRes.data.message || 'Order creation failed');
      }
      const newOrderId = createRes.data.order_id;
      const orderData = createRes.data.data;
      setPendingRazorpayOrderId(newOrderId);

      const orderRecordForCache = {
        order_id: newOrderId,
        farmer_name: address.full_name || 'Farmer',
        farmer_mobile: address.mobile || '',
        farmer_email: address.email || '',
        created_at: orderData.created_at || new Date().toISOString(),
        total_amount: orderData.total_amount || grandTotal,
        discount: orderData.discount || couponDiscount,
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

      // 2. COD flow
      if (paymentMethod === 'COD') {
        cacheOrderLocally({ ...orderRecordForCache, payment_status: 'Pending on COD' });
        finishOrderSuccess(newOrderId, 'Pending on COD');
        return;
      }

      // 3. Online Razorpay flow
      const rzpOrderRes = await paymentApi.createRazorpayOrder(newOrderId);
      if (!rzpOrderRes.data.success) {
        throw new Error(rzpOrderRes.data.message || 'Could not initiate Razorpay order on server.');
      }
      const { key, amount, currency, razorpay_order_id } = rzpOrderRes.data;

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      const rzp = new window.Razorpay({
        key,
        amount,
        currency,
        name: 'AgriOwl Marketplace',
        description: `Order #${newOrderId}`,
        order_id: razorpay_order_id,
        prefill: {
          name: address.full_name,
          contact: address.mobile,
          email: address.email,
        },
        theme: { color: '#2f7d32' },
        notes: { agriowl_order_id: newOrderId },
        handler: async (response) => {
          try {
            // Cryptographic server-side signature verification
            const verifyRes = await paymentApi.verifyRazorpayPayment(newOrderId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verifyRes.data.success) {
              throw new Error(verifyRes.data.message || 'Payment signature verification failed.');
            }
            cacheOrderLocally({ ...orderRecordForCache, payment_status: 'Paid' });
            finishOrderSuccess(newOrderId, 'Paid');
          } catch (err) {
            setSubmitting(false);
            setError(`Payment verification failed: ${err.message}. Please contact support with Order #${newOrderId}.`);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setError(`Payment was cancelled or closed. Your order #${newOrderId} is reserved as Pending. You can retry payment below.`);
          },
        },
      });

      rzp.on('payment.failed', (resp) => {
        setSubmitting(false);
        setError(`Payment failed: ${resp.error?.description || 'Gateway error'}. Please retry payment.`);
      });

      rzp.open();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Could not complete order. Please try again.');
    }
  };

  const handleDownloadReceipt = () => {
    if (!placedOrder) return;
    exportOrderReceiptExcel({
      order: placedOrder,
      items: checkoutItems.map(item => ({
        product_name: item.product.name,
        brand: item.product.brand,
        category: item.product.category_name,
        variant_size: item.variant.size,
        unit_price: item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100)),
        quantity: item.quantity,
        total_price: (item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100))) * item.quantity,
      })),
      address,
      paymentInfo: {
        subtotal,
        discount: couponDiscount,
        deliveryCharge,
        grandTotal,
        methodDisplay: paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : `Online Payment (${onlineSubMethod.toUpperCase()}${upiId ? ` - ${upiId}` : ''})`
      }
    });
  };

  const stepLabels = [
    language === 'kn' ? '1. ಕಾರ್ಟ್ ಪರಿಶೀಲನೆ' : '1. Cart & Items',
    language === 'kn' ? '2. ವಿತರಣಾ ವಿಳಾಸ' : '2. Delivery Address',
    language === 'kn' ? '3. ಆದೇಶ ದೃಢೀಕರಣ' : '3. Order Confirmation',
    language === 'kn' ? '4. ಪಾವತಿ ಆಯ್ಕೆ' : '4. Payment',
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Farmer Auth Modal */}
      <FarmerAuthModal
        isOpen={localAuthModalOpen}
        onClose={() => setLocalAuthModalOpen(false)}
      />

      {/* Authentication Notice Banner */}
      <div className="bg-white rounded-2xl border-2 border-agri-light p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            user ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
          }`}>
            {user ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-agri-dark">
                {user ? `Logged in as: ${user.first_name || user.username}` : (language === 'kn' ? 'ಅತಿಥಿಯಾಗಿ ಆದೇಶಿಸುತ್ತಿದ್ದೀರಿ (Guest Farmer)' : 'Ordering as Guest Farmer')}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                user ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {user ? 'Verified' : 'Guest'}
              </span>
            </div>
            <p className="text-[11px] text-agri-textMuted font-medium">
              {user 
                ? (user.mobile || user.email || 'Farmer Account Linked')
                : (language === 'kn' ? 'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಲಾಗಿನ್ ಆಗಿ ಅಥವಾ ಅತಿಥಿಯಾಗಿ ಮುಂದುವರಿಯಿರಿ' : 'Sign in to save this order to your farmer account and track shipments easily')}
            </p>
          </div>
        </div>

        {!user && (
          <button
            type="button"
            onClick={() => {
              if (onOpenFarmerAuth) onOpenFarmerAuth();
              else setLocalAuthModalOpen(true);
            }}
            className="px-4 py-2 bg-agri-primary text-white font-bold text-xs rounded-xl hover:bg-agri-dark transition shadow-xs shrink-0"
          >
            {language === 'kn' ? 'ರೈತ ಲಾಗಿನ್ / ಸೈನ್ ಅಪ್' : 'Sign In / Register'}
          </button>
        )}
      </div>

      {/* Stepper Header (4 steps) */}
      <div className="bg-white rounded-3xl border-2 border-agri-light p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-4 gap-1">
          {stepLabels.map((label, idx) => (
            <div key={idx} className={`flex flex-col items-center text-center relative ${idx < 3 ? 'after:absolute after:top-4 after:left-1/2 after:w-full after:h-0.5 after:bg-agri-light after:z-0' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition ${
                step === idx ? 'bg-agri-primary text-white ring-4 ring-agri-light shadow-md' :
                step > idx ? 'bg-agri-secondary text-white' :
                'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                {step > idx ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[10px] font-bold mt-1.5 hidden sm:block ${step === idx ? 'text-agri-primary font-black' : step > idx ? 'text-agri-secondary' : 'text-gray-400'}`}>
                {label.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0: Cart / Review Items & Coupons */}
      {step === 0 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
              <Package className="w-5 h-5 text-agri-primary" />
              {language === 'kn' ? 'ಆದೇಶಿಸಿದ ಉತ್ಪನ್ನಗಳು & ಕೂಪನ್' : 'Order Items & Discounts'}
            </h2>
            {directBuyItem && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-black">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {language === 'kn' ? 'ನೇರ ಖರೀದಿ' : 'Direct Buy (Single Item)'}
              </span>
            )}
          </div>

          {checkoutItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-gray-500 font-bold">No product selected for order.</p>
              <button 
                onClick={() => {
                  if (directBuyItem) clearDirectBuy();
                  setCurrentTab('marketplace');
                }}
                className="px-6 py-2.5 bg-agri-primary text-white font-bold text-xs rounded-xl shadow"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-3">
                {checkoutItems.map((item, idx) => {
                  const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
                  return (
                    <div key={idx} className="flex items-center gap-4 p-3.5 bg-agri-bg rounded-2xl border border-agri-light">
                      <img src={item.product.image} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover border border-agri-light shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-agri-earth">{item.product.brand}</span>
                        <h4 className="text-sm font-bold text-agri-dark line-clamp-1">{language === 'kn' ? (item.product.name_kn || item.product.name) : item.product.name}</h4>
                        <p className="text-xs text-agri-textMuted font-semibold">{item.variant.size} × {item.quantity} (₹{Math.round(price)} each)</p>
                      </div>
                      <span className="text-base font-black text-agri-dark shrink-0">₹{Math.round(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Section */}
              <div className="bg-agri-bg p-4 rounded-2xl border border-agri-light space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-agri-dark uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-agri-primary" />
                    {language === 'kn' ? 'ಕೂಪನ್ ಕೋಡ್ ಅನ್ವಯಿಸಿ' : 'Apply Promo / Coupon Code'}
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. KISAN10 or AGRI50"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-agri-light rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-agri-primary"
                    />
                    <button
                      type="button"
                      disabled={couponLoading || !couponInput.trim()}
                      onClick={() => handleApplyCoupon(couponInput)}
                      className="px-5 py-2.5 bg-agri-primary text-white font-black text-xs rounded-xl hover:bg-agri-dark transition disabled:opacity-50"
                    >
                      {couponLoading ? '...' : (language === 'kn' ? 'ಅನ್ವಯಿಸಿ' : 'Apply')}
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <div>
                        <span className="text-xs font-black text-emerald-900">{appliedCoupon.code}</span>
                        <p className="text-[11px] text-emerald-700 font-semibold">{appliedCoupon.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-700">-₹{Math.round(couponDiscount)}</span>
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

                {/* Quick Coupon Chips */}
                {!appliedCoupon && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {AVAILABLE_COUPONS.slice(0, 3).map(c => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="text-[11px] bg-white border border-gray-300 hover:border-agri-primary px-2.5 py-1 rounded-lg font-bold text-gray-700 flex items-center gap-1 transition"
                      >
                        <span className="text-agri-primary font-black">{c.code}</span>
                        <span className="text-gray-400">({c.badge})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light space-y-2">
                <div className="flex justify-between text-sm font-semibold text-agri-textDark">
                  <span>{t('subtotal')}</span>
                  <span>₹{Math.round(subtotal)}</span>
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

                <div className="flex justify-between text-base font-black text-agri-dark border-t border-agri-light pt-2 mt-1">
                  <span>{t('total')}</span>
                  <span className="text-agri-primary text-xl">₹{Math.round(grandTotal)}</span>
                </div>
              </div>

              <button 
                onClick={() => setStep(1)} 
                className="w-full py-4 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2"
              >
                <span>{language === 'kn' ? 'ವಿತರಣಾ ವಿಳಾಸಕ್ಕೆ ಮುಂದುವರಿಯಿರಿ' : 'Proceed to Delivery Address'}</span> 
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 1: Delivery Address & Customer Information */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
              <MapPin className="w-5 h-5 text-agri-primary" />
              {language === 'kn' ? 'ಗ್ರಾಹಕರ ವಿವರಗಳು & ವಿಳಾಸ' : 'Customer & Delivery Information'}
            </h2>
            <span className="text-xs text-agri-textMuted font-bold">Step 2 of 4</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GPS Auto-detect */}
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingLoc}
            className="w-full py-3 bg-agri-accent text-agri-textDark font-black text-sm rounded-2xl hover:bg-yellow-400 transition flex items-center justify-center gap-2 shadow-sm"
          >
            {detectingLoc ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('detectingLoc')}</>
            ) : (
              <><Navigation className="w-4 h-4" /> {t('detectLocation')}</>
            )}
          </button>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('fullName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.full_name}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, full_name: e.target.value }));
                  if (fieldErrors.full_name) setFieldErrors(prev => ({ ...prev, full_name: '' }));
                }}
                placeholder="e.g. Ramesh Patil"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.full_name ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.full_name && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.full_name}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('mobileNumber')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                maxLength={10}
                value={address.mobile}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, mobile: e.target.value }));
                  if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                }}
                placeholder="10-digit mobile (e.g. 9876543210)"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.mobile ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.mobile && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.mobile}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {language === 'kn' ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={address.email}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="e.g. ramesh.farmer@gmail.com"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.email && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.email}</p>}
            </div>

            {/* House / Street / Farm Plot */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('houseNo')} / Farm Survey No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.house_no}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, house_no: e.target.value }));
                  if (fieldErrors.house_no) setFieldErrors(prev => ({ ...prev, house_no: '' }));
                }}
                placeholder="Plot #24, Near Gram Panchayat / Main Road"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.house_no ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.house_no && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.house_no}</p>}
            </div>

            {/* Village / City */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('village')} / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.village}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, village: e.target.value }));
                  if (fieldErrors.village) setFieldErrors(prev => ({ ...prev, village: '' }));
                }}
                placeholder="e.g. Bengeri or Navanagar"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.village ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.village && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.village}</p>}
            </div>

            {/* Taluk */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('taluk')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.taluk}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, taluk: e.target.value }));
                  if (fieldErrors.taluk) setFieldErrors(prev => ({ ...prev, taluk: '' }));
                }}
                placeholder="e.g. Hubballi Rural"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.taluk ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.taluk && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.taluk}</p>}
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('district')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.district}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, district: e.target.value }));
                  if (fieldErrors.district) setFieldErrors(prev => ({ ...prev, district: '' }));
                }}
                placeholder="e.g. Dharwad"
                className="w-full px-4 py-2.5 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-medium focus:outline-none focus:border-agri-primary transition"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('state')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.state}
                onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-4 py-2.5 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-medium focus:outline-none focus:border-agri-primary transition"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {language === 'kn' ? 'ದೇಶ (Country)' : 'Country'}
              </label>
              <input
                type="text"
                disabled
                value={address.country}
                className="w-full px-4 py-2.5 bg-gray-100 border-2 border-agri-light rounded-xl text-sm font-medium text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* PIN Code */}
            <div>
              <label className="block text-xs font-bold text-agri-dark mb-1">
                {t('pincode')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={address.pincode}
                onChange={(e) => {
                  setAddress(prev => ({ ...prev, pincode: e.target.value }));
                  if (fieldErrors.pincode) setFieldErrors(prev => ({ ...prev, pincode: '' }));
                }}
                placeholder="e.g. 580020"
                className={`w-full px-4 py-2.5 bg-agri-bg border-2 rounded-xl text-sm font-medium focus:outline-none transition ${
                  fieldErrors.pincode ? 'border-red-400 bg-red-50' : 'border-agri-light focus:border-agri-primary'
                }`}
              />
              {fieldErrors.pincode && <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.pincode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setStep(0)} 
              className="py-3.5 bg-agri-bg text-agri-dark font-bold text-sm rounded-2xl border-2 border-agri-light hover:border-agri-secondary/40 transition flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Cart
            </button>
            <button 
              type="button" 
              onClick={handleProceedToConfirmation} 
              className="py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-1"
            >
              <span>{language === 'kn' ? 'ಆದೇಶ ಪರಿಶೀಲನೆಗೆ ಮುಂದುವರಿಯಿರಿ' : 'Review Confirmation'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Order Confirmation (Pre-Payment Review Screen) */}
      {step === 2 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-agri-dark flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-agri-primary" />
              {language === 'kn' ? 'ಆದೇಶದ ದೃಢೀಕರಣ & ಪರಿಶೀಲನೆ' : 'Order Confirmation & Review'}
            </h2>
            <span className="text-xs text-agri-textMuted font-bold">Step 3 of 4</span>
          </div>

          <p className="text-xs sm:text-sm text-agri-textMuted font-medium">
            {language === 'kn' 
              ? 'ದಯವಿಟ್ಟು ಪಾವತಿ ಮಾಡುವ ಮುನ್ನ ನಿಮ್ಮ ವಿಳಾಸ, ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಅಂತಿಮ ಮೊತ್ತವನ್ನು ಪರಿಶೀಲಿಸಿ.' 
              : 'Please review your delivery address, ordered items, and payable amount before proceeding to secure payment.'}
          </p>

          {/* Delivery Address Card */}
          <div className="bg-agri-bg rounded-2xl p-4 sm:p-5 border border-agri-light space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-agri-earth flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-agri-primary" /> Delivery Recipient & Address
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-agri-primary hover:underline"
              >
                Edit Address
              </button>
            </div>
            <div className="text-sm space-y-0.5 pt-1">
              <p className="font-black text-agri-dark">{address.full_name}</p>
              <p className="text-xs text-gray-600 font-semibold">📞 {address.mobile} • ✉️ {address.email}</p>
              <p className="text-xs text-agri-textDark mt-1">
                {address.house_no}, {address.village}, Taluk: {address.taluk}, Dist: {address.district}, {address.state} - {address.pincode} ({address.country})
              </p>
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-agri-dark">
              {language === 'kn' ? 'ಖರೀದಿಸಲಿರುವ ಉತ್ಪನ್ನಗಳು' : 'Items Being Purchased'} ({checkoutItems.length})
            </h4>
            <div className="space-y-2">
              {checkoutItems.map((item, idx) => {
                const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-agri-bg rounded-xl border border-agri-light">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.product.image} alt={item.product.name} className="w-12 h-12 rounded-lg object-cover border border-agri-light shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-agri-dark line-clamp-1">{item.product.name}</p>
                        <p className="text-[11px] text-agri-textMuted font-medium">{item.variant.size} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-black text-sm text-agri-dark shrink-0">₹{Math.round(price * item.quantity)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light space-y-2.5">
            <div className="flex justify-between text-sm font-semibold text-agri-textDark">
              <span>Original Subtotal</span>
              <span>₹{Math.round(subtotal)}</span>
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
              <span>Delivery Charges (Hubballi Hub)</span>
              <span>{deliveryCharge === 0 ? <span className="text-agri-primary font-black">FREE</span> : `₹${deliveryCharge}`}</span>
            </div>

            <div className="flex justify-between text-base font-black text-agri-dark border-t border-agri-light pt-2">
              <span>Total Payable Amount</span>
              <span className="text-xl font-black text-agri-primary">₹{Math.round(grandTotal)}</span>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-500 py-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-agri-primary" /> 256-bit Secure Checkout
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-agri-primary" /> 100% Genuine Agri Guarantee
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="py-3.5 bg-agri-bg text-agri-dark font-bold text-sm rounded-2xl border-2 border-agri-light hover:border-agri-secondary/40 transition flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> {language === 'kn' ? 'ವಿಳಾಸ ಬದಲಿಸಿ' : 'Edit Address'}
            </button>
            <button 
              type="button" 
              onClick={() => setStep(3)} 
              className="py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{language === 'kn' ? `ಪಾವತಿಗೆ ಮುಂದುವರಿಯಿರಿ (₹${Math.round(grandTotal)})` : `Proceed to Payment (₹${Math.round(grandTotal)})`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Payment Gateway & Method Selection */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-agri-dark flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-agri-primary" />
              {language === 'kn' ? 'ಪಾವತಿ ವಿಧಾನವನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Select Payment Gateway & Method'}
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-bold border border-green-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Razorpay Verified
            </span>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {pendingRazorpayOrderId && (
                <button
                  type="button"
                  onClick={handleInitiatePayment}
                  disabled={submitting}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-black hover:bg-red-700 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Payment Now
                </button>
              )}
            </div>
          )}

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
                      {language === 'kn' ? 'ಆನ್‌ಲೈನ್ ಪಾವತಿ (PhonePe, GPay, Paytm, QR, UPI)' : 'Online UPI & QR (PhonePe, Google Pay, Paytm, BHIM)'}
                    </span>
                    <span className="text-xs text-agri-textMuted font-medium">
                      Fast, instant secure payment via Razorpay Payment Gateway.
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'ONLINE_UPI' ? 'border-agri-primary bg-agri-primary text-white' : 'border-gray-300'}`}>
                  {paymentMethod === 'ONLINE_UPI' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              {/* Expanded Online Sub-methods */}
              {paymentMethod === 'ONLINE_UPI' && (
                <div className="mt-4 pt-4 border-t border-agri-light space-y-3.5" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-bold text-gray-700">Select preferred payment mode:</p>
                  
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
                      <span className="text-[9px] font-black text-green-700">Pay ₹{Math.round(grandTotal)}</span>
                    </div>
                    <div className="space-y-1 text-center sm:text-left flex-1">
                      <h4 className="text-xs font-black text-gray-800">Direct QR / UPI Payment</h4>
                      <p className="text-[11px] text-gray-500 font-medium leading-tight">
                        Scan from PhonePe, Google Pay or BHIM app to pay instantly with zero extra fee.
                      </p>
                      <div className="pt-1.5 flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded border border-green-200">Instant Verification</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-200">Zero Gateway Charges</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom UPI ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">Or enter your VPA / UPI ID (Optional):</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@ybl or farmer@oksbi"
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
                      {language === 'kn' ? 'ಕಿಸಾನ್ ಕಾರ್ಡ್ / ಡೆಬಿಟ್ ಕಾರ್ಡ್ (Kisan Credit Card / RuPay / Visa)' : 'Kisan Credit Card / RuPay / Visa / MasterCard'}
                    </span>
                    <span className="text-xs text-agri-textMuted font-medium">
                      Pay using Kisan Credit Card (KCC), RuPay or Net Banking via Razorpay.
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
                      Pay cash to logistics executive upon delivery at your village/farm.
                    </span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-agri-primary bg-agri-primary text-white' : 'border-gray-300'}`}>
                  {paymentMethod === 'COD' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>

          {/* Amount to Pay Banner */}
          <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 block">Final Amount to Pay:</span>
              <span className="text-2xl font-black text-agri-primary">₹{Math.round(grandTotal)}</span>
            </div>
            {couponDiscount > 0 && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-300">
                You saved ₹{Math.round(couponDiscount)} with coupon!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setStep(2)} 
              className="py-3.5 bg-agri-bg text-agri-dark font-bold text-sm rounded-2xl border-2 border-agri-light hover:border-agri-secondary/40 transition flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> {language === 'kn' ? 'ದೃಢೀಕರಣಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to Review'}
            </button>
            <button 
              type="button" 
              onClick={handleInitiatePayment} 
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

      {/* STEP 4: Order Placed / Status Screen */}
      {step === 4 && placedOrder && (
        <div className="bg-white rounded-3xl border-2 border-agri-light p-8 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-agri-dark">
              {placedOrder.payment_status === 'Paid' ? 'Payment Successful & Order Confirmed!' : t('orderSuccessTitle')}
            </h2>
            <p className="text-sm text-agri-textMuted mt-1 max-w-md mx-auto">
              {language === 'kn' 
                ? 'ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನಗಳ ಆದೇಶವನ್ನು ಹುಬ್ಬಳ್ಳಿ ಕೇಂದ್ರದಿಂದ ರವಾನಿಸಲು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ.' 
                : 'Thank you! Your agricultural inputs order has been placed and is being packed at Hubballi Agricultural Hub.'}
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-agri-bg rounded-2xl p-5 border border-agri-light text-left space-y-2.5 max-w-lg mx-auto">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">{t('orderIdLabel')}:</span>
              <span className="font-black text-agri-dark text-lg">#{placedOrder.order_id}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Status:</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {placedOrder.payment_status === 'Paid' ? 'Paid & Confirmed' : 'Pending on COD'}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Payment Mode:</span>
              <span className="font-bold text-agri-dark">
                {paymentMethod === 'COD' ? 'Cash on Delivery' : `Online Razorpay (${onlineSubMethod.toUpperCase()})`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-emerald-700">
                <span>Coupon Applied:</span>
                <span className="font-bold">{appliedCoupon?.code} (-₹{Math.round(couponDiscount)})</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Total Amount:</span>
              <span className="font-black text-agri-primary text-lg">₹{Math.round(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-agri-textMuted">Delivery Destination:</span>
              <span className="font-bold text-agri-dark text-right truncate max-w-[60%]">
                {address.full_name}, {address.village}, {address.district}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="py-3.5 bg-blue-50 text-blue-800 font-bold text-xs sm:text-sm rounded-2xl hover:bg-blue-100 border-2 border-blue-200 transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {language === 'kn' ? 'ವಿವರಗಳು ನೋಡಿ' : 'View Details'}
            </button>

            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="py-3.5 bg-emerald-50 text-emerald-800 font-bold text-xs sm:text-sm rounded-2xl hover:bg-emerald-100 border-2 border-emerald-200 transition flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              {language === 'kn' ? 'ಎಕ್ಸೆಲ್ ರಸೀದಿ (.xlsx)' : 'Download Excel Receipt'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('orders')}
              className="py-3.5 bg-agri-light text-agri-dark font-bold text-xs sm:text-sm rounded-2xl hover:bg-agri-secondary/20 transition"
            >
              {t('myOrders')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (setTrackingOrderId && placedOrder.order_id) setTrackingOrderId(placedOrder.order_id);
                setCurrentTab('tracking');
              }}
              className="py-3.5 bg-agri-primary text-white font-black text-xs sm:text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-1.5"
            >
              🚚 {t('trackOrderBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Receipt Modal */}
      {showReceiptModal && placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl relative border-4 border-agri-light max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-5 pb-4 border-b border-agri-light flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-agri-light flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-agri-primary" />
                </div>
                <div>
                  <h3 className="font-black text-agri-dark text-lg leading-tight">
                    {language === 'kn' ? 'ಪಾವತಿ & ಆರ್ಡರ್ ರಸೀದಿ' : 'Official Order Receipt'}
                  </h3>
                  <p className="text-xs text-agri-textMuted">Order #{placedOrder.order_id}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowReceiptModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light space-y-2">
                <div className="flex justify-between">
                  <span className="text-agri-textMuted font-bold">Order ID:</span>
                  <span className="font-black text-agri-dark">#{placedOrder.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-textMuted font-bold">Customer:</span>
                  <span className="font-bold text-agri-dark">{address.full_name} ({address.mobile})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-textMuted font-bold">Email:</span>
                  <span className="font-bold text-agri-dark">{address.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-agri-textMuted font-bold">Delivery Address:</span>
                  <span className="font-bold text-agri-dark text-right max-w-[60%]">
                    {address.house_no}, {address.village}, {address.taluk}, {address.district} - {address.pincode}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-black text-agri-dark uppercase tracking-wider text-xs">Ordered Products</h4>
                {checkoutItems.map((item, idx) => {
                  const price = item.variant.discounted_price || (item.variant.price * (1 - (item.variant.discount || 0) / 100));
                  return (
                    <div key={idx} className="flex justify-between p-2.5 bg-agri-bg rounded-xl border border-agri-light">
                      <div>
                        <p className="font-bold text-agri-dark">{item.product.name}</p>
                        <p className="text-[11px] text-agri-textMuted">{item.variant.size} × {item.quantity}</p>
                      </div>
                      <span className="font-black text-agri-dark">₹{Math.round(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="bg-agri-bg rounded-2xl p-4 border border-agri-light space-y-1.5 font-semibold">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{Math.round(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Discount</span>
                    <span>-₹{Math.round(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-base font-black text-agri-dark border-t border-agri-light pt-2 mt-1">
                  <span>Grand Total</span>
                  <span className="text-agri-primary text-lg">₹{Math.round(grandTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadReceipt}
                className="w-full py-3.5 bg-agri-primary text-white font-black text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {language === 'kn' ? 'ಎಕ್ಸೆಲ್ ರಸೀದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ (.xlsx)' : 'Download Excel Receipt (.xlsx)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
