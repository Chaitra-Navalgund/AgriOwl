import * as XLSX from 'xlsx';

/**
 * Generates and downloads a clean, professional Microsoft Excel (.xlsx) payment receipt
 * @param {Object} params
 * @param {Object} params.order
 * @param {Array} params.items
 * @param {Object} params.address
 * @param {Object} params.paymentInfo
 */
export function exportOrderReceiptExcel({ order, items, address, paymentInfo }) {
  const orderId = order.order_id || order.id || 'ORDER';
  const orderDate = order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const farmerName = address?.full_name || order.farmer_name || 'Farmer';
  const farmerMobile = address?.mobile || order.farmer_mobile || '';
  const village = address?.village || '';
  const taluk = address?.taluk || '';
  const district = address?.district || 'Dharwad';
  const state = address?.state || 'Karnataka';
  const pincode = address?.pincode || '';
  const fullAddress = [address?.house_no, village, taluk, district, state, pincode].filter(Boolean).join(', ');

  const subtotal = Number(paymentInfo?.subtotal || order.subtotal || 0);
  const deliveryCharge = Number(paymentInfo?.deliveryCharge ?? order.delivery_charge ?? 0);
  const grandTotal = Number(paymentInfo?.grandTotal || order.total_amount || 0);

  const paymentMethodDisplay = paymentInfo?.methodDisplay || order.payment_method_display || (order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : `Online Payment (${order.payment_method})`);
  const paymentStatus = order.payment_status || (order.payment_method === 'COD' ? 'Confirmed (Pay on Delivery)' : 'Paid / Verified');

  // Build spreadsheet grid rows
  const rows = [
    ['AGRIOWL - SMART AGRICULTURAL MARKETPLACE'],
    ['FROM FARM TO YOUR DOORSTEP | KARNATAKA FARMER SERVICES'],
    ['Hubballi Logistics & Distribution Hub, Dharwad, Karnataka | Helpline: 1800-AGRI-OWL'],
    [],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['OFFICIAL PAYMENT RECEIPT & TAX INVOICE'],
    ['-------------------------------------------------------------------------------------------------------------'],
    [],
    ['[ ORDER INFORMATION ]', '', '', '[ FARMER & DELIVERY DETAILS ]'],
    ['Order ID:', `#${orderId}`, '', 'Farmer Name:', farmerName],
    ['Date & Time:', orderDate, '', 'Mobile Number:', farmerMobile],
    ['Payment Mode:', paymentMethodDisplay, '', 'Village / Locality:', village],
    ['Payment Status:', paymentStatus, '', 'Taluk / District:', `${taluk ? taluk + ', ' : ''}${district}`],
    ['Order Status:', order.status_display || 'Order Placed & Processing', '', 'State & PIN:', `${state} - ${pincode}`],
    ['Dispatch Hub:', 'Hubballi Express Logistic Center', '', 'Full Address:', fullAddress],
    [],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['[ ORDERED AGRICULTURAL INPUTS & PRODUCTS ]'],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['S.No', 'Product Name', 'Brand & Category', 'Pack Size / SKU', 'Unit Price (INR)', 'Quantity', 'Item Total (INR)'],
  ];

  // Add Itemized Rows
  (items || []).forEach((item, idx) => {
    const pName = item.product_name || item.product?.name || 'Product';
    const brandCat = `${item.brand || item.product?.brand || 'AgriOwl'} (${item.category || item.product?.category_name || 'Agri Inputs'})`;
    const size = item.variant_size || item.variant?.size || 'Standard';
    const uPrice = Number(item.unit_price || item.variant?.discounted_price || item.variant?.price || 0);
    const qty = Number(item.quantity || 1);
    const total = Number(item.total_price || (uPrice * qty));

    rows.push([
      idx + 1,
      pName,
      brandCat,
      size,
      uPrice,
      qty,
      total
    ]);
  });

  // Financial Totals Block
  rows.push(
    [],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['[ BILLING & PAYMENT SUMMARY ]'],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['', '', '', '', 'Items Subtotal:', '', `INR ${subtotal.toFixed(2)}`],
    ['', '', '', '', 'Delivery Charges:', '', deliveryCharge === 0 ? 'FREE (Eligible)' : `INR ${deliveryCharge.toFixed(2)}`],
    ['', '', '', '', 'GRAND TOTAL PAID / PAYABLE:', '', `INR ${grandTotal.toFixed(2)}`],
    [],
    ['-------------------------------------------------------------------------------------------------------------'],
    ['IMPORTANT NOTES FOR FARMERS:'],
    ['1. Please inspect the product seals and expiry dates upon delivery from the Hubballi delivery partner.'],
    ['2. For dosage, weather-based spraying recommendations and crop diagnosis, use the Crop AI Assistant in AgriOwl.'],
    ['3. Farmer Support Helpline: 1800-AGRI-OWL (Toll Free) | Mon-Sat 7:00 AM to 8:00 PM.'],
    ['4. Lead Developer: Chaitra N | Navalgund, Dharwad, Karnataka.'],
    ['Thank you for trusting AgriOwl - Empowering Farmers Across Karnataka!']
  );

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Define generous column widths for perfect display in Excel
  ws['!cols'] = [
    { wch: 8 },   // S.No
    { wch: 40 },  // Product Name / Labels
    { wch: 30 },  // Brand & Category
    { wch: 20 },  // Pack Size
    { wch: 18 },  // Unit Price
    { wch: 12 },  // Qty
    { wch: 22 },  // Total Amount
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AgriOwl Receipt');

  // Trigger browser download
  XLSX.writeFile(wb, `AgriOwl_Payment_Receipt_${orderId}.xlsx`);
}
