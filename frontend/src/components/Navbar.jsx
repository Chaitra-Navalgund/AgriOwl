import React, { useState } from 'react';
import { ShoppingCart, Mic, Globe, Menu, X, User, Sparkles, Sprout, Home, ShoppingBag, ClipboardList, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './common/ConfirmModal';

export default function Navbar({ onOpenVoiceSearch, onOpenML, onOpenFarmerAuth, currentTab, setCurrentTab, searchQuery, setSearchQuery }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { cartCount } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-agri-light shadow-sm">
      {/* Top Banner for Farmers */}
      <div className="bg-agri-dark text-white text-[11px] sm:text-xs">
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium truncate">
            <Sprout className="w-3.5 h-3.5 text-agri-accent shrink-0" />
            <span className="truncate">
              {language === 'kn' ? 'ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಪೋರ್ಟಲ್' : 'Smart Farming Portal for Karnataka Farmers'}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button 
              onClick={onOpenML}
              className="flex items-center gap-1 bg-agri-accent text-agri-textDark px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black hover:bg-yellow-400 transition shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-agri-textDark" />
              <span>{t('aiAssistant')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Section */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer shrink-0 group" onClick={() => setCurrentTab('home')}>
            <img 
              src="/logo-icon-transparent.png" 
              alt="AgriOwl Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-sm" 
            />
            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-agri-dark leading-none flex items-center">
                Agri<span className="text-agri-primary">Owl</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-agri-textMuted font-extrabold block mt-1 tracking-wider uppercase">
                {language === 'kn' ? 'ಅಗ್ರಿ-ಔಲ್ ಕೃಷಿ ಸೇವೆ' : 'FROM FARM TO YOUR DOORSTEP'}
              </span>
            </div>
          </div>

          {/* Desktop & Tablet Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl relative items-center mx-4">
            <input 
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setCurrentTab('marketplace')}
              className="w-full pl-4 pr-11 py-2 bg-agri-bg border-2 border-agri-light rounded-full text-xs lg:text-sm font-medium focus:outline-none focus:border-agri-primary focus:bg-white transition"
            />
            <button 
              onClick={onOpenVoiceSearch}
              title={t('voiceSearch')}
              className="absolute right-1.5 p-1.5 bg-agri-accent text-agri-textDark rounded-full hover:scale-105 transition shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5">
            <nav className="flex items-center gap-3 lg:gap-5 text-xs lg:text-sm font-bold text-agri-textDark">
              <button 
                onClick={() => setCurrentTab('home')} 
                className={`hover:text-agri-primary transition ${currentTab === 'home' ? 'text-agri-primary border-b-2 border-agri-primary py-1' : ''}`}
              >
                {t('home')}
              </button>
              <button 
                onClick={() => setCurrentTab('marketplace')} 
                className={`hover:text-agri-primary transition ${currentTab === 'marketplace' ? 'text-agri-primary border-b-2 border-agri-primary py-1' : ''}`}
              >
                {t('marketplace')}
              </button>
              <button 
                onClick={() => setCurrentTab('orders')} 
                className={`hover:text-agri-primary transition ${currentTab === 'orders' ? 'text-agri-primary border-b-2 border-agri-primary py-1' : ''}`}
              >
                {t('myOrders')}
              </button>

            </nav>

            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 bg-agri-light text-agri-dark font-bold text-xs rounded-full border border-agri-secondary/30 hover:bg-agri-primary hover:text-white transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'ಕನ್ನಡ' : 'EN'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 bg-agri-light px-2.5 py-1.5 rounded-full border border-agri-secondary/30">
                <User className="w-3.5 h-3.5 text-agri-primary" />
                <span className="text-xs font-bold text-agri-dark max-w-20 lg:max-w-28 truncate">{user.first_name || user.username}</span>
                <button onClick={() => setLogoutModalOpen(true)} className="text-[10px] font-black text-red-600 hover:underline ml-1">
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenFarmerAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-agri-bg border-2 border-agri-light text-agri-dark font-bold text-xs rounded-full hover:border-agri-primary transition"
              >
                <User className="w-3.5 h-3.5 text-agri-primary" />
                <span className="hidden lg:inline">{language === 'kn' ? 'ಲಾಗಿನ್' : 'Login / Register'}</span>
                <span className="lg:hidden">Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button 
              onClick={() => setCurrentTab('cart')}
              className="relative p-2 lg:p-2.5 bg-agri-primary text-white rounded-full hover:bg-agri-dark transition shadow-md"
            >
              <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-agri-accent text-agri-textDark font-black text-[10px] w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="px-2 py-1 bg-agri-light text-agri-dark font-black text-xs rounded-full border border-agri-secondary/30"
            >
              {language === 'en' ? 'ಕನ್ನಡ' : 'EN'}
            </button>

            <button 
              onClick={() => setCurrentTab('cart')}
              className="relative p-2 bg-agri-primary text-white rounded-full"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-agri-accent text-agri-textDark font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-agri-textDark rounded-lg hover:bg-agri-light transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Row */}
        <div className="mt-2.5 flex md:hidden items-center gap-2">
          <input 
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setCurrentTab('marketplace')}
            className="flex-1 px-3.5 py-2 bg-agri-bg border-2 border-agri-light rounded-full text-xs font-medium focus:outline-none focus:border-agri-primary"
          />
          <button 
            onClick={onOpenVoiceSearch}
            className="p-2 bg-agri-accent text-agri-textDark rounded-full shadow-sm shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-agri-light space-y-1 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <button 
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs ${currentTab === 'home' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-agri-light'}`}
            >
              <Home className="w-4 h-4" />
              <span>{t('home')}</span>
            </button>
            <button 
              onClick={() => { setCurrentTab('marketplace'); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs ${currentTab === 'marketplace' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-agri-light'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t('marketplace')}</span>
            </button>
            <button 
              onClick={() => { setCurrentTab('orders'); setMobileMenuOpen(false); }} 
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs ${currentTab === 'orders' ? 'bg-agri-primary text-white' : 'text-gray-700 hover:bg-agri-light'}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{t('myOrders')}</span>
            </button>
            <button 
              onClick={() => { onOpenML(); setMobileMenuOpen(false); }} 
              className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs text-amber-900 bg-amber-50 border border-amber-200"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>{t('aiAssistant')}</span>
            </button>

            {user ? (
              <div className="pt-2 border-t border-agri-light/60 flex items-center justify-between px-3 py-2 bg-agri-bg rounded-xl">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-agri-primary" />
                  <span className="text-xs font-bold text-gray-800">{user.first_name || user.username}</span>
                </div>
                <button onClick={() => { setLogoutModalOpen(true); setMobileMenuOpen(false); }} className="text-xs font-black text-red-600 flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { onOpenFarmerAuth(); setMobileMenuOpen(false); }} 
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs text-agri-primary bg-agri-light"
              >
                <User className="w-4 h-4" />
                <span>{language === 'kn' ? 'ರೈತರ ಲಾಗಿನ್ / ನೋಂದಣಿ' : 'Farmer Login / Register'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Styled Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setLogoutModalOpen(false);
          logout();
          setCurrentTab('home');
        }}
        title={language === 'kn' ? 'ಅಗ್ರಿ-ಔಲ್‌ನಿಂದ ಲಾಗ್ ಔಟ್ ಮಾಡಬೇಕೇ?' : 'Log Out of AgriOwl?'}
        message={
          language === 'kn'
            ? 'ನಿಮ್ಮ ಸಕ್ರಿಯ ಸೆಶನ್ ಅನ್ನು ಕೊನೆಗೊಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ? ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಆರ್ಡರ್ ಮಾಡಲು ನೀವು ಮತ್ತೆ ಲಾಗಿನ್ ಆಗಬೇಕಾಗುತ್ತದೆ.'
            : 'Are you sure you want to end your active session? You will need to log in again to place orders.'
        }
        confirmText={language === 'kn' ? 'ಹೌದು, ನಿರ್ಗಮಿಸಿ' : 'Yes, Log Out'}
        cancelText={language === 'kn' ? 'ಇಲ್ಲ, ಇಲ್ಲೇ ಇರು' : 'No, Stay Here'}
        type="logout"
      />
    </header>
  );
}
