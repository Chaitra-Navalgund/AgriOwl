import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import VoiceSearchModal from './components/VoiceSearchModal';
import SizeSelectorModal from './components/SizeSelectorModal';
import ProductGuidelinesModal from './components/ProductGuidelinesModal';
import CropMLRecommenderModal from './components/CropMLRecommenderModal';
import FarmerAuthModal from './components/FarmerAuthModal';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import AIAssistantPage from './pages/AIAssistantPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetailPage from './pages/ProductDetailPage';
import { productApi } from './services/api';
import { SEED_PRODUCTS } from './utils/seedData';

function AppInner() {
  const { isAdmin } = useAuth();
  const { addToCart, startDirectBuy } = useCart();
  const [currentTab, setCurrentTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState('AGR12345');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  // Products state
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(false);

  // Modal states
  const [voiceSearchOpen, setVoiceSearchOpen] = useState(false);
  const [mlOpen, setMlOpen] = useState(false);
  const [farmerAuthOpen, setFarmerAuthOpen] = useState(false);
  const [sizeProduct, setSizeProduct] = useState(null);
  const [guidelinesProduct, setGuidelinesProduct] = useState(null);

  // Fetch products (debounced search with instant local fallback)
  const loadProducts = useCallback(async (query) => {
    try {
      const params = {};
      if (query) params.q = query;
      if (selectedCategory) params.category_name = selectedCategory;
      const res = await productApi.getProducts(params);
      if (res.data?.data && res.data.data.length > 0) {
        setProducts(res.data.data);
      } else {
        setProducts(SEED_PRODUCTS);
      }
    } catch {
      // Use 8 seed products if backend offline
      setProducts(SEED_PRODUCTS);
    }
  }, [selectedCategory]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => loadProducts(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadProducts]);

  // Redirect to admin if admin and on login page
  useEffect(() => {
    if (isAdmin && currentTab === 'login') setCurrentTab('admin');
  }, [isAdmin, currentTab]);

  const handleVoiceSearch = (query) => {
    setSearchQuery(query);
    setCurrentTab('marketplace');
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
  };

  const handleBuyNow = (product, variant) => {
    const selectedVariant = variant || product.variants?.[0];
    startDirectBuy(product, selectedVariant, 1);
    setCurrentTab('checkout');
  };

  const handleViewProductDetail = (product) => {
    setSelectedProductDetail(product);
    setCurrentTab('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin-only guard
  if (currentTab === 'admin' && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <AdminLoginPage setCurrentTab={setCurrentTab} />
      </div>
    );
  }

  // Render admin dashboard full-screen (no farmer navbar/footer)
  if (currentTab === 'admin' && isAdmin) {
    return (
      <LanguageProvider>
        <AdminDashboard setCurrentTab={setCurrentTab} />
      </LanguageProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-agri-bg">
      {/* Global Modals */}
      <VoiceSearchModal
        isOpen={voiceSearchOpen}
        onClose={() => setVoiceSearchOpen(false)}
        onSearch={handleVoiceSearch}
      />
      <SizeSelectorModal
        product={sizeProduct}
        isOpen={!!sizeProduct}
        onClose={() => setSizeProduct(null)}
        onCheckout={() => setCurrentTab('checkout')}
      />
      <ProductGuidelinesModal
        product={guidelinesProduct}
        isOpen={!!guidelinesProduct}
        onClose={() => setGuidelinesProduct(null)}
      />
      <CropMLRecommenderModal
        isOpen={mlOpen}
        onClose={() => setMlOpen(false)}
        onSelectProduct={(p) => { setSizeProduct(p); setMlOpen(false); }}
      />
      <FarmerAuthModal
        isOpen={farmerAuthOpen}
        onClose={() => setFarmerAuthOpen(false)}
      />

      {/* Header */}
      <Navbar
        onOpenVoiceSearch={() => setVoiceSearchOpen(true)}
        onOpenML={() => setMlOpen(true)}
        onOpenFarmerAuth={() => setFarmerAuthOpen(true)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-6 sm:py-8">
        {currentTab === 'home' && (
          <Home
            setCurrentTab={setCurrentTab}
            onOpenML={() => setMlOpen(true)}
            onSelectCategory={handleSelectCategory}
            products={products}
            onSelectSize={(p) => setSizeProduct(p)}
            onViewGuidelines={(p) => setGuidelinesProduct(p)}
            onBuyNow={handleBuyNow}
            onViewDetail={handleViewProductDetail}
          />
        )}
        {currentTab === 'marketplace' && (
          <Marketplace
            products={products}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectSize={(p) => setSizeProduct(p)}
            onViewGuidelines={(p) => setGuidelinesProduct(p)}
            onBuyNow={handleBuyNow}
            setCurrentTab={setCurrentTab}
            onViewDetail={handleViewProductDetail}
          />
        )}
        {currentTab === 'product-detail' && (
          <ProductDetailPage
            product={selectedProductDetail}
            setCurrentTab={setCurrentTab}
            onViewGuidelines={(p) => setGuidelinesProduct(p)}
            onOpenML={() => setMlOpen(true)}
          />
        )}
        {(currentTab === 'assistant' || currentTab === 'ai-assistant') && (
          <AIAssistantPage
            onSelectProduct={(p) => setSizeProduct(p)}
            setCurrentTab={setCurrentTab}
          />
        )}
        {currentTab === 'cart' && <CartPage setCurrentTab={setCurrentTab} />}
        {currentTab === 'checkout' && (
          <CheckoutPage 
            setCurrentTab={setCurrentTab} 
            setTrackingOrderId={setTrackingOrderId} 
            onOpenFarmerAuth={() => setFarmerAuthOpen(true)}
          />
        )}
        {currentTab === 'orders' && (
          <MyOrdersPage
            setCurrentTab={setCurrentTab}
            setTrackingOrderId={setTrackingOrderId}
          />
        )}
        {currentTab === 'tracking' && (
          <OrderTrackingPage
            orderId={trackingOrderId}
            setCurrentTab={setCurrentTab}
          />
        )}
        {currentTab === 'login' && <AdminLoginPage setCurrentTab={setCurrentTab} />}
      </main>

      {/* Footer with Chaitra N Developer Info */}
      <Footer setCurrentTab={setCurrentTab} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <AppInner />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
