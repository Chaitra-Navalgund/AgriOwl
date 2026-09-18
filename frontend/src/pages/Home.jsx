import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Sparkles, Globe, Award, Sprout, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';

export default function Home({ setCurrentTab, onOpenML, onSelectCategory, products, onSelectSize, onViewGuidelines, onBuyNow }) {
  const { language, t } = useLanguage();

  const trustBadges = [
    { icon: Globe, title: t('trustBilingual'), desc: 'English & Kannada (ಕನ್ನಡ)' },
    { icon: ShieldCheck, title: t('trustGuidance'), desc: 'Dosage & Weather Guidance' },
    { icon: Truck, title: t('trustDelivery'), desc: 'Hubballi Express Delivery' },
    { icon: Award, title: t('trustTracking'), desc: 'Live GPS Map Movement' },
  ];

  const categories = [
    { name: 'Fertilizers', name_kn: 'ಗೊಬ್ಬರಗಳು', icon: '🌱', desc: 'Soluble NPK & nutrients' },
    { name: 'Pesticides', name_kn: 'ಕೀಟನಾಶಕಗಳು', icon: '🐛', desc: 'Coragen & pest control' },
    { name: 'Seeds', name_kn: 'ಬೀಜಗಳು', icon: '🌾', desc: 'Byadgi chilli & Bt cotton' },
    { name: 'Crop Protection', name_kn: 'ಬೆಳೆ ರಕ್ಷಣೆ', icon: '🛡️', desc: 'Fungicides & herbicides' },
    { name: 'Plant Nutrition', name_kn: 'ಸಸ್ಯ ಪೋಷಣೆ', icon: '⚡', desc: 'Boosters & micronutrients' },
  ];

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Hero Banner Section with Kannada/English Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-agri-dark via-agri-primary to-agri-secondary text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-64 h-64 bg-agri-accent/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-agri-accent/20 border border-agri-accent/40 px-3.5 py-1.5 rounded-full text-agri-accent text-xs sm:text-sm font-bold backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            <span>{language === 'kn' ? 'ಕರ್ನಾಟಕದ ರೈತರಿಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಪೋರ್ಟಲ್' : 'Karnataka’s Smart Agricultural Marketplace'}</span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <h1 className="fluid-hero font-black tracking-tight leading-tight text-white text-break-words">
              {t('heroTitle')}
            </h1>
            <p className="fluid-subheading text-white/85 font-medium leading-relaxed max-w-2xl text-break-words">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Action CTAs & Voice helper note */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button 
              onClick={() => setCurrentTab('marketplace')}
              className="touch-target px-6 sm:px-8 py-3.5 sm:py-4 bg-agri-accent text-agri-textDark font-black text-sm sm:text-base rounded-2xl hover:bg-yellow-400 transition shadow-lg flex items-center justify-center gap-2 active:scale-95 text-break-words"
            >
              <span>{t('exploreBtn')}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </button>

            <button 
              onClick={onOpenML}
              className="touch-target px-6 sm:px-8 py-3.5 sm:py-4 bg-white/10 hover:bg-white/20 border-2 border-white/30 text-white font-bold text-sm sm:text-base rounded-2xl transition backdrop-blur-md flex items-center justify-center gap-2 active:scale-95 text-break-words"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-agri-accent shrink-0" />
              <span>{t('aiAssistant')}</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/90">
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-agri-accent/20 flex items-center justify-center text-agri-accent shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Hubballi - Dharwad Hub Express</span>
                <span className="text-[11px] text-white/70">Fast 2-3 day direct dispatch to your village</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-agri-accent/20 flex items-center justify-center text-agri-accent shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">ಕನ್ನಡ & English Voice Search</span>
                <span className="text-[11px] text-white/70">Speak in Kannada to find any seed or pesticide</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {trustBadges.map((badge, idx) => {
          const IconComponent = badge.icon;
          return (
            <div key={idx} className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-agri-light shadow-sm flex flex-col items-center text-center space-y-2 hover:border-agri-secondary/50 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-agri-light flex items-center justify-center text-agri-primary font-bold shrink-0">
                <IconComponent className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-agri-dark text-break-words leading-tight">{badge.title}</h3>
              <p className="text-[11px] sm:text-xs text-agri-textMuted font-medium text-break-words">{badge.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Product Categories Section */}
      <section className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-agri-dark text-break-words">
              {language === 'kn' ? 'ಉತ್ಪನ್ನಗಳ ವರ್ಗಗಳು' : 'Browse Categories'}
            </h2>
            <p className="text-xs sm:text-sm text-agri-textMuted font-medium mt-0.5">
              {language === 'kn' ? 'ನಿಮ್ಮ ಬೆಳೆ ಅಗತ್ಯಕ್ಕೆ ತಕ್ಕಂತೆ ವರ್ಗೀಕರಿಸಲಾಗಿದೆ' : 'Select category to explore agricultural inputs'}
            </p>
          </div>

          <button 
            onClick={() => setCurrentTab('marketplace')}
            className="text-xs sm:text-sm font-bold text-agri-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectCategory(cat.name);
                setCurrentTab('marketplace');
              }}
              className="p-5 sm:p-6 bg-white rounded-2xl border-2 border-agri-light shadow-sm hover:shadow-md hover:border-agri-primary cursor-pointer transition flex flex-col items-center text-center justify-center group h-full"
            >
              <div className="text-3xl sm:text-4xl mb-2.5 group-hover:scale-110 transition duration-300">
                {cat.icon}
              </div>
              <h3 className="text-sm font-bold text-agri-dark group-hover:text-agri-primary transition text-break-words">
                {language === 'kn' ? cat.name_kn : cat.name}
              </h3>
              <p className="text-xs text-agri-textMuted mt-1 text-break-words">
                {cat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Agricultural Inputs */}
      <section className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-agri-dark text-break-words">
              {language === 'kn' ? 'ಜನಪ್ರಿಯ ಕೃಷಿ ಉತ್ಪನ್ನಗಳು' : 'Featured Products'}
            </h2>
            <p className="text-xs sm:text-sm text-agri-textMuted font-medium mt-0.5">
              {language === 'kn' ? 'ಕರ್ನಾಟಕದ ರೈತರಿಂದ ಹೆಚ್ಚು ಅನುಮೋದಿತ' : 'Top rated fertilizers, pesticides & hybrid seeds'}
            </p>
          </div>

          <button 
            onClick={() => setCurrentTab('marketplace')}
            className="px-4 py-2 bg-agri-light text-agri-dark font-bold text-xs sm:text-sm rounded-xl hover:bg-agri-secondary/20 transition shrink-0"
          >
            {t('marketplace')} &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-5 sm:gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectSize={onSelectSize}
              onViewGuidelines={onViewGuidelines}
              onBuyNow={onBuyNow}
              setCurrentTab={setCurrentTab}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
