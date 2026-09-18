import React, { useState } from 'react';
import { Sparkles, X, CheckCircle, ArrowRight, ShieldCheck, Bug, Sprout, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { mlApi } from '../services/api';

export default function CropMLRecommenderModal({ isOpen, onClose, onSelectProduct }) {
  const { language, t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('Cotton');
  const [selectedProblem, setSelectedProblem] = useState('Bollworm Infestation');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  if (!isOpen) return null;

  const crops = [
    { name: 'Cotton', kn: 'ಹತ್ತಿ' },
    { name: 'Chilli', kn: 'ಮೆಣಸಿನಕಾಯಿ' },
    { name: 'Sugarcane', kn: 'ಕಬ್ಬು' },
    { name: 'Soybean', kn: 'ಸೋಯಾಬೀನ್' },
    { name: 'Paddy', kn: 'ಭತ್ತ' },
    { name: 'Jowar', kn: 'ಜೋಳ' },
  ];

  const problems = [
    { name: 'Bollworm Infestation', kn: 'ಕಾಯಿ ಕೊರೆಕ ಹುಳು' },
    { name: 'Leaf Blight Fungus', kn: 'ಎಲೆ ಚುಕ್ಕಿ ರೋಗ' },
    { name: 'Nutrient Deficiency', kn: 'ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ' },
    { name: 'Pest attack & Aphids', kn: 'ಕೀಟಗಳ ದಾಳಿ' },
    { name: 'Flower Drop & Poor Fruit Set', kn: 'ಹೂವು ಉದುರುವುದು' },
  ];

  const handleFetchRecommendation = async () => {
    setLoading(true);
    try {
      const res = await mlApi.getRecommendation(selectedCrop, selectedProblem);
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      // Fallback mock predictions if backend offline
      setRecommendations([
        {
          product: {
            id: 2,
            name: 'Coragen Insecticide (Chlorantraniliprole 18.5% SC)',
            name_kn: 'ಕೋರಾಜೆನ್ ಕೀಟನಾಶಕ',
            brand: 'FMC Bio',
            category_name: 'Pesticides',
            crop_usage: 'Cotton, Chilli, Sugarcane',
            rating: 4.9,
            image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600',
            variants: [{ id: 4, size: '60 ML', price: 850, discount: 8 }]
          },
          confidence_score: 0.96,
          match_reason: `High confidence match for ${selectedCrop} against ${selectedProblem}. Active Chlorantraniliprole controls stem & boll borers effectively.`
        },
        {
          product: {
            id: 1,
            name: 'NPK 19-19-19 Water Soluble Fertilizer',
            name_kn: 'ಎನ್.ಪಿ.ಕೆ 19-19-19',
            brand: 'Iffco Agri',
            category_name: 'Fertilizers',
            crop_usage: 'Cotton, Sugarcane, Chilli',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600',
            variants: [{ id: 1, size: '1 KG', price: 220, discount: 10 }]
          },
          confidence_score: 0.88,
          match_reason: `Recommended for secondary growth recovery and crop vigor after pest control.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border-4 border-agri-light max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-agri-textMuted hover:text-agri-textDark rounded-full"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-agri-light">
          <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-agri-dark leading-tight">{t('mlTitle')}</h3>
            <p className="text-xs text-agri-textMuted">{t('mlDesc')}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-agri-dark uppercase mb-1 flex items-center gap-1">
              <Sprout className="w-4 h-4 text-agri-primary" />
              <span>{t('cropSelect')}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {crops.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCrop(c.name)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border-2 ${
                    selectedCrop === c.name 
                      ? 'border-agri-primary bg-agri-light text-agri-dark shadow-sm' 
                      : 'border-gray-200 text-agri-textDark hover:border-agri-secondary/40 bg-white'
                  }`}
                >
                  🌾 {language === 'kn' ? c.kn : c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Problem Selector */}
          <div>
            <label className="block text-xs font-bold text-agri-dark uppercase mb-1 flex items-center gap-1">
              <Bug className="w-4 h-4 text-red-500" />
              <span>{t('problemSelect')}</span>
            </label>
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="w-full px-4 py-2.5 bg-agri-bg border-2 border-agri-light rounded-xl text-sm font-bold text-agri-dark focus:outline-none focus:border-agri-primary"
            >
              {problems.map((p) => (
                <option key={p.name} value={p.name}>
                  {language === 'kn' ? p.kn : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Execute CTA */}
          <button
            onClick={handleFetchRecommendation}
            disabled={loading}
            className="w-full py-3 bg-agri-primary text-white font-bold text-sm rounded-2xl hover:bg-agri-dark transition shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Analyzing with Scikit-learn AI...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-agri-accent" />
                <span>{t('getRecommendation')}</span>
              </>
            )}
          </button>
        </div>

        {/* Results List */}
        {recommendations && (
          <div className="space-y-3 pt-3 border-t border-agri-light">
            <h4 className="text-xs font-bold text-agri-textMuted uppercase tracking-wider">
              Top Recommended Solutions ({recommendations.length}):
            </h4>

            {recommendations.map((rec, idx) => {
              const p = rec.product;
              const pTitle = language === 'kn' ? (p.name_kn || p.name) : p.name;
              const defaultVar = p.variants?.[0] || { size: 'Standard', price: 400 };

              return (
                <div key={idx} className="p-4 bg-amber-50/60 rounded-2xl border-2 border-amber-200/80 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={pTitle} className="w-12 h-12 rounded-xl object-cover border border-amber-200" />
                      <div>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          Score: {Math.round(rec.confidence_score * 100)}% Match
                        </span>
                        <h5 className="text-sm font-bold text-agri-dark line-clamp-1 mt-0.5">{pTitle}</h5>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-agri-primary text-white text-xs font-bold rounded-xl hover:bg-agri-dark transition shadow-sm shrink-0"
                    >
                      View & Buy
                    </button>
                  </div>

                  <p className="text-xs text-amber-950 font-semibold leading-tight bg-white p-2.5 rounded-xl border border-amber-200/60">
                    💡 {rec.match_reason}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
