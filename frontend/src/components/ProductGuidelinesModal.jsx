import React, { useState } from 'react';
import { X, Sun, CloudRain, Wind, Snowflake, ShieldAlert, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function ProductGuidelinesModal({ product, isOpen, onClose }) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('usage');

  if (!isOpen || !product) return null;

  const title = language === 'kn' ? (product.name_kn || product.name) : product.name;
  const guideline = product.guideline || {
    usage_instructions: 'Dissolve recommended dosage in clean water and spray evenly over leaves.',
    dosage: '2-3 grams per liter of water',
    timing: 'Early morning (6 AM - 9 AM) or late evening',
    sunny_guidance: 'Ideal for sunny days. Ensure adequate soil moisture before spraying.',
    rainy_guidance: 'Avoid spraying if heavy rain is expected within 4 hours.',
    windy_guidance: 'Avoid spraying in high wind to prevent drift to neighboring crops.',
    cold_guidance: 'Store in warm dry place. Ensure thorough mixing before application.',
    precautions: 'Wear rubber gloves and protective goggles. Wash hands with soap after handling.',
    storage: 'Store in locked original container away from children.',
    safety_warning: 'Use only according to the product label and applicable agricultural guidance. Do not exceed the recommended dosage.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative border-4 border-agri-light max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-agri-textMuted hover:text-agri-textDark rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-agri-light">
          <img 
            src={product.image} 
            alt={title} 
            className="w-16 h-16 rounded-xl object-cover border border-agri-light"
          />
          <div>
            <span className="text-xs font-bold text-agri-earth">{product.brand} • {product.category_name}</span>
            <h3 className="text-lg font-black text-agri-dark leading-snug">{title}</h3>
            <span className="text-xs text-agri-secondary font-bold">🌾 {product.crop_usage}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-agri-light pb-3 mb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('usage')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'usage' ? 'bg-agri-primary text-white shadow-md' : 'bg-agri-bg text-agri-dark hover:bg-agri-light'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('usageGuidelines')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'weather' ? 'bg-agri-primary text-white shadow-md' : 'bg-agri-bg text-agri-dark hover:bg-agri-light'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span>{t('weatherGuidance')}</span>
          </button>

          <button 
            onClick={() => setActiveTab('precautions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'precautions' ? 'bg-agri-primary text-white shadow-md' : 'bg-agri-bg text-agri-dark hover:bg-agri-light'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-300" />
            <span>{t('precautions')}</span>
          </button>
        </div>

        {/* Tab 1: Usage & Dosage */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="p-4 bg-agri-bg rounded-2xl border border-agri-light">
              <h4 className="text-xs font-bold text-agri-textMuted uppercase tracking-wider mb-1">Product Description</h4>
              <p className="text-sm text-agri-dark font-medium leading-relaxed">{product.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t('dosage')}</span>
                </div>
                <p className="text-sm font-bold text-emerald-950">{guideline.dosage}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{t('bestTiming')}</span>
                </div>
                <p className="text-sm font-bold text-blue-950">{guideline.timing}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Step-by-Step Application</h4>
              <p className="text-sm text-amber-950 font-medium leading-relaxed">{guideline.usage_instructions}</p>
            </div>
          </div>
        )}

        {/* Tab 2: Weather Guidance */}
        {activeTab === 'weather' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-sm mb-2">
                <Sun className="w-5 h-5 text-amber-500 fill-amber-300" />
                <span>{t('weatherSunny')}</span>
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">{guideline.sunny_guidance}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 font-bold text-blue-800 text-sm mb-2">
                <CloudRain className="w-5 h-5 text-blue-500" />
                <span>{t('weatherRainy')}</span>
              </div>
              <p className="text-xs text-blue-950 font-medium leading-relaxed">{guideline.rainy_guidance}</p>
            </div>

            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
              <div className="flex items-center gap-2 font-bold text-teal-800 text-sm mb-2">
                <Wind className="w-5 h-5 text-teal-500" />
                <span>{t('weatherWindy')}</span>
              </div>
              <p className="text-xs text-teal-950 font-medium leading-relaxed">{guideline.windy_guidance}</p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
              <div className="flex items-center gap-2 font-bold text-indigo-800 text-sm mb-2">
                <Snowflake className="w-5 h-5 text-indigo-500" />
                <span>{t('weatherCold')}</span>
              </div>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed">{guideline.cold_guidance}</p>
            </div>
          </div>
        )}

        {/* Tab 3: Safety & Precautions */}
        {activeTab === 'precautions' && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Protective Measures</h4>
              <p className="text-sm text-red-950 font-medium leading-relaxed">{guideline.precautions}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Storage Instructions</h4>
              <p className="text-sm text-slate-900 font-medium leading-relaxed">{guideline.storage}</p>
            </div>
          </div>
        )}

        {/* Regulatory Warning Label */}
        <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-black text-amber-900 uppercase">{t('safetyWarning')}</h5>
            <p className="text-xs font-semibold text-amber-950 mt-0.5">{guideline.safety_warning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
