import { couponApi } from '../services/api';

export const AVAILABLE_COUPONS = [
  {
    code: 'KISAN10',
    title: 'Farmer Special 10% Off',
    title_kn: 'ರೈತ ವಿಶೇಷ 10% ರಿಯಾಯಿತಿ',
    type: 'percent',
    value: 10,
    maxDiscount: 200,
    minOrder: 300,
    badge: 'Popular',
    description: '10% off up to ₹200 on orders above ₹300'
  },
  {
    code: 'AGRI50',
    title: 'Flat ₹50 Welcome Discount',
    title_kn: 'ಫ್ಲಾಟ್ ₹50 ಸ್ವಾಗತ ರಿಯಾಯಿತಿ',
    type: 'flat',
    value: 50,
    maxDiscount: 50,
    minOrder: 400,
    badge: 'Instant',
    description: 'Flat ₹50 off on minimum purchase of ₹400'
  },
  {
    code: 'HARVEST20',
    title: 'Bumper Harvest 20% Off',
    title_kn: 'ಬಂಪರ್ ಸುಗ್ಗಿ 20% ರಿಯಾಯಿತಿ',
    type: 'percent',
    value: 20,
    maxDiscount: 500,
    minOrder: 1000,
    badge: 'Max Savings',
    description: '20% off up to ₹500 on bulk orders above ₹1000'
  },
  {
    code: 'FIRSTBUY',
    title: 'New Farmer ₹100 Off',
    title_kn: 'ಹೊಸ ರೈತರಿಗೆ ₹100 ರಿಯಾಯಿತಿ',
    type: 'flat',
    value: 100,
    maxDiscount: 100,
    minOrder: 600,
    badge: 'New User',
    description: 'Flat ₹100 off on first agricultural input order above ₹600'
  }
];

export async function validateCouponCode(code, subtotal) {
  if (!code || !code.trim()) {
    return { success: false, message: 'Please enter a coupon code.' };
  }

  const cleanCode = code.trim().toUpperCase();

  // First try backend API validation
  try {
    const res = await couponApi.validateCoupon(cleanCode, subtotal);
    if (res.data?.success) {
      return {
        success: true,
        code: res.data.code,
        discount: res.data.discount,
        final_amount: res.data.final_amount,
        description: res.data.description
      };
    }
  } catch (err) {
    if (err.response?.data?.message) {
      return { success: false, message: err.response.data.message };
    }
  }

  // Fallback client-side validation
  const found = AVAILABLE_COUPONS.find(c => c.code === cleanCode);
  if (!found) {
    return { success: false, message: `Coupon "${cleanCode}" is invalid or expired.` };
  }

  if (subtotal < found.minOrder) {
    return {
      success: false,
      message: `Coupon "${found.code}" requires a minimum order amount of ₹${found.minOrder}. Current subtotal: ₹${Math.round(subtotal)}.`
    };
  }

  let discount = 0;
  if (found.type === 'percent') {
    discount = Math.min(subtotal * (found.value / 100), found.maxDiscount);
  } else {
    discount = Math.min(found.value, subtotal);
  }

  return {
    success: true,
    code: found.code,
    discount: Math.round(discount),
    final_amount: Math.max(0, Math.round(subtotal - discount)),
    description: found.description
  };
}
