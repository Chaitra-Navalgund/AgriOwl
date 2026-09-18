import React from 'react';
import { PhoneCall, Globe, CheckCircle2, Heart, Code2, Mail, MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer({ setCurrentTab }) {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <footer className="bg-agri-dark text-white pt-10 pb-8 mt-12 sm:mt-16 border-t-4 border-agri-accent">
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 sm:pb-10 border-b border-agri-primary/50">
          {/* Brand Vision */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab && setCurrentTab('home')}>
              <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                <img 
                  src="/logo-icon-transparent.png" 
                  alt="AgriOwl Logo" 
                  className="h-9 w-auto object-contain" 
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">AgriOwl</span>
                <span className="text-[9px] text-agri-accent font-bold block mt-1 tracking-wider uppercase">From Farm To Your Doorstep</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-agri-light/80 leading-relaxed">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-2 text-xs text-agri-accent font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('trustBilingual')}</span>
            </div>
          </div>

          {/* Farmer Services */}
          <div>
            <h4 className="text-sm sm:text-base font-black text-agri-accent mb-3 sm:mb-4">
              {language === 'kn' ? 'ರೈತ ಸೇವೆಗಳು' : 'Farmer Services'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-agri-light/80 font-medium">
              <li><button onClick={() => setCurrentTab('marketplace')} className="hover:text-white transition">{t('marketplace')}</button></li>
              <li><button onClick={() => setCurrentTab('orders')} className="hover:text-white transition">{t('myOrders')}</button></li>
              <li><button onClick={() => setCurrentTab('marketplace')} className="hover:text-white transition">{t('usageGuidelines')}</button></li>
              <li><button onClick={() => setCurrentTab('marketplace')} className="hover:text-white transition">{t('trustTracking')}</button></li>
            </ul>
          </div>

          {/* Support & Helpline */}
          <div>
            <h4 className="text-sm sm:text-base font-black text-agri-accent mb-3 sm:mb-4">
              {language === 'kn' ? 'ರೈತ ಸಹಾಯವಾಣಿ' : 'Farmer Helpline'}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-agri-light/80 font-medium">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-agri-accent shrink-0" />
                <span className="font-bold text-white">1800-AGRI-OWL</span>
              </div>
              <p className="text-[11px] sm:text-xs">
                {language === 'kn' ? 'ಸೋಮವಾರ - ಶನಿವಾರ: ಬೆಳಿಗ್ಗೆ 7 ರಿಂದ ಸಂಜೆ 8' : 'Mon - Sat: 7:00 AM to 8:00 PM IST'}
              </p>
              <p className="text-[11px] sm:text-xs text-agri-light/60">Hubballi - Dharwad Hub, Karnataka</p>
            </div>
          </div>

          {/* Developer Information Card */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-2.5">
            <div className="flex items-center gap-2 text-agri-accent">
              <Code2 className="w-4 h-4" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {language === 'kn' ? 'ಡೆವಲಪರ್ ಮಾಹಿತಿ' : 'Developer Info'}
              </h4>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/70 font-semibold">Lead Developer:</span>
                <span className="font-black text-white bg-agri-primary/80 px-2 py-0.5 rounded-md">Chaitra N</span>
              </div>

              <div className="flex items-center gap-2 text-agri-light/90">
                <Mail className="w-3.5 h-3.5 text-agri-accent shrink-0" />
                <a href="mailto:chaitranavalgund@gmail.com" className="hover:text-white underline font-semibold text-[11px] truncate">
                  chaitranavalgund@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-2 text-agri-light/90">
                <MapPin className="w-3.5 h-3.5 text-agri-accent shrink-0" />
                <span className="font-semibold text-[11px]">Navalgund, Dharwad, Karnataka</span>
              </div>
            </div>

            <div className="pt-1 border-t border-white/10 flex items-center justify-between">
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-agri-primary hover:bg-agri-secondary text-white rounded-lg text-[11px] font-bold transition shadow-xs"
              >
                <Globe className="w-3 h-3" />
                <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
              <span className="text-[10px] text-agri-accent font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Smart AgriOwl
              </span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-agri-light/60 gap-3">
          <p>© 2026 AgriOwl. Developed with <Heart className="w-3.5 h-3.5 inline text-red-500 fill-red-500" /> by <strong className="text-white font-black">Chaitra N</strong> (Navalgund).</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentTab('login')} className="hover:text-white transition font-bold text-xs">
              🔒 {t('adminDashboard')} Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
