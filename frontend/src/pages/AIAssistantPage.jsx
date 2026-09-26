import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, CheckCircle, ArrowRight, ShieldCheck, Bug, Sprout, AlertCircle, Search, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { mlApi } from '../services/api';
import { CROP_KB } from '../components/CropMLRecommenderModal';

const DEFAULT_CROPS = ['Cotton', 'Chilli', 'Sugarcane', 'Soybean', 'Paddy', 'Jowar'];

const PROBLEMS = [
  { name: 'Bollworm Infestation', kn: 'ಕಾಯಿ ಕೊರೆಕ ಹುಳು' },
  { name: 'Leaf Blight Fungus', kn: 'ಎಲೆ ಚುಕ್ಕಿ ರೋಗ' },
  { name: 'Nutrient Deficiency', kn: 'ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ' },
  { name: 'Pest attack & Aphids', kn: 'ಕೀಟಗಳ ದಾಳಿ' },
  { name: 'Flower Drop & Poor Fruit Set', kn: 'ಹೂವು ಉದುರುವುದು' },
  { name: 'Thrips & Mites', kn: 'ನುಸಿ ಮತ್ತು ಥ್ರಿಪ್ಸ್ ಕೀಟಗಳು' },
  { name: 'Stem Borer', kn: 'ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು' },
  { name: 'Root Rot / Wilt', kn: 'ಬೇರು ಕೊಳೆ / ಸೊರಗು ರೋಗ' },
];

export default function AIAssistantPage({ onSelectProduct, setCurrentTab }) {
  const { language } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('Cotton');
  const [selectedProblem, setSelectedProblem] = useState('Bollworm Infestation');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [ragSearch, setRagSearch] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const [aiLang, setAiLang] = useState(language || 'en');

  useEffect(() => {
    if (language) setAiLang(language);
  }, [language]);

  const matchingCrops = useMemo(() => {
    const q = ragSearch.trim().toLowerCase();
    if (!q) return [];
    return CROP_KB.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.kn.toLowerCase().includes(q) ||
      (c.problems || []).some(p => p.toLowerCase().includes(q))
    );
  }, [ragSearch]);

  const defaultCrops = useMemo(() => {
    return CROP_KB.filter(c => DEFAULT_CROPS.includes(c.name));
  }, []);

  const handleFetchRecommendation = async () => {
    setLoading(true);
    setRagResult(null);
    try {
      const res = await mlApi.getRecommendation(selectedCrop, selectedProblem);
      if (res.data && res.data.success && res.data.recommendations) {
        setRecommendations(res.data.recommendations);
      } else {
        throw new Error('API fallback');
      }
    } catch {
      const cropObj = CROP_KB.find(c => c.name === selectedCrop) || CROP_KB[0];
      const isInsect = selectedProblem.toLowerCase().includes('borer') || selectedProblem.toLowerCase().includes('worm') || selectedProblem.toLowerCase().includes('pest') || selectedProblem.toLowerCase().includes('aphid') || selectedProblem.toLowerCase().includes('thrip');
      
      if (isInsect) {
        setRecommendations([
          {
            product: {
              id: 2,
              name: 'Coragen Insecticide (Chlorantraniliprole 18.5% SC)',
              name_kn: 'ಕೋರಾಜೆನ್ ಕೀಟನಾಶಕ (Chlorantraniliprole)',
              brand: 'FMC Bio',
              category_name: 'Pesticides',
              crop_usage: `${cropObj.name}, Chilli, Sugarcane`,
              rating: 4.9,
              image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600',
              variants: [{ id: 4, size: '60 ML', price: 850, discount: 8, stock: 45 }]
            },
            confidence_score: 0.96,
            match_reason: `High confidence match for ${cropObj.name} against ${selectedProblem}. Chlorantraniliprole controls stem & boll borers effectively.`
          },
          {
            product: {
              id: 1,
              name: 'NPK 19-19-19 Water Soluble Fertilizer',
              name_kn: 'ಎನ್.ಪಿ.ಕೆ 19-19-19 ಪೋಷಕಾಂಶ',
              brand: 'Iffco Agri',
              category_name: 'Fertilizers',
              crop_usage: `${cropObj.name}, Cotton, Paddy`,
              rating: 4.8,
              image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600',
              variants: [{ id: 1, size: '1 KG', price: 220, discount: 10, stock: 80 }]
            },
            confidence_score: 0.88,
            match_reason: `Foliar booster to accelerate recovery and improve plant immunity after insect damage.`
          }
        ]);
      } else {
        setRecommendations([
          {
            product: {
              id: 4,
              name: 'Mancozeb 75% WP Broad Spectrum Fungicide',
              name_kn: 'ಮ್ಯಾಂಕೋಜೆಬ್ 75% WP ಶಿಲೀಂಧ್ರನಾಶಕ',
              brand: 'UPL Agro',
              category_name: 'Crop Protection',
              crop_usage: `${cropObj.name}, Tomato, Chilli, Potato`,
              rating: 4.8,
              image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600',
              variants: [{ id: 7, size: '500 G', price: 280, discount: 12, stock: 60 }]
            },
            confidence_score: 0.94,
            match_reason: `Protective broad-spectrum fungicide to cure and prevent ${selectedProblem} on ${cropObj.name}.`
          },
          {
            product: {
              id: 1,
              name: 'NPK 19-19-19 Water Soluble Fertilizer',
              name_kn: 'ಎನ್.ಪಿ.ಕೆ 19-19-19',
              brand: 'Iffco Agri',
              category_name: 'Fertilizers',
              crop_usage: `${cropObj.name}, Cotton, Chilli`,
              rating: 4.8,
              image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600',
              variants: [{ id: 1, size: '1 KG', price: 220, discount: 10, stock: 80 }]
            },
            confidence_score: 0.89,
            match_reason: `Balanced nutrition to restore leaf health and stimulate chlorophyll production.`
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRagCrop = (crop) => {
    setSelectedCrop(crop.name);
    setRagResult(crop);
    setRagSearch('');
  };

  const tStrings = {
    title: aiLang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ AI ಸಹಾಯಕ' : 'Smart Crop AI Assistant',
    subtitle: aiLang === 'kn' ? 'RAG ಆಧಾರಿತ ಬೆಳೆ ಜ್ಞಾನ ಮತ್ತು ML ಶಿಫಾರಸ್ ವ್ಯವಸ್ಥೆ' : 'RAG Crop Knowledge Base & ML Diagnostic Solutions',
    cropSelect: aiLang === 'kn' ? 'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ' : 'SELECT CROP',
    problemSelect: aiLang === 'kn' ? 'ಸಮಸ್ಯೆ / ರೋಗಲಕ್ಷಣ ಆಯ್ಕೆಮಾಡಿ' : 'SELECT PROBLEM / SYMPTOM',
    getRecommendation: aiLang === 'kn' ? 'ಶಿಫಾರಸ್ ಪರಿಹಾರ ತಿಳಿಯಿರಿ' : 'Get Recommended Solution',
    searchPlaceholder: aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆ ಹುಡುಕಿ (ಉದಾ: ಅಡಿಕೆ, ಈರುಳ್ಳಿ, ಕಬ್ಬು, ಟೊಮೇಟೊ, ದಾಳಿಂಬೆ, ಶುಂಠಿ...)' : 'Search any crop (e.g. Arecanut, Onion, Turmeric, Tomato, Pomegranate, Ginger...)',
    searchBtn: aiLang === 'kn' ? 'ಹುಡುಕು' : 'Search',
    guidanceTitle: aiLang === 'kn' ? 'ಕೃಷಿ ಪರಿಹಾರ ಮಾರ್ಗದರ್ಶನ' : 'Agronomist Guidance',
    commonProblems: aiLang === 'kn' ? 'ಸಾಮಾನ್ಯ ರೋಗಲಕ್ಷಣಗಳು' : 'Key Crop Issues',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header with Independent Language Switch */}
      <div className="bg-gradient-to-r from-agri-dark via-agri-primary to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-agri-accent/20 border border-agri-accent/40 px-3.5 py-1 rounded-full text-agri-accent text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Agricultural Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{tStrings.title}</h1>
          <p className="text-white/80 text-xs sm:text-sm font-medium max-w-xl">
            {tStrings.subtitle}
          </p>
        </div>

        {/* Separate Language Toggle in AI Assistant */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAiLang(l => l === 'en' ? 'kn' : 'en')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-agri-dark hover:bg-agri-accent transition font-black text-xs shadow-md active:scale-95"
          >
            <Globe className="w-4 h-4 text-agri-primary" />
            <span>{aiLang === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ' : 'Switch to English'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: RAG Search & Crop Selection (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* RAG Search Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-agri-light shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-agri-dark uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-agri-primary" />
                <span>{aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆ ಹುಡುಕಾಟ (RAG 30+ ಬೆಳೆಗಳು)' : 'RAG Crop Search (30+ Crops)'}</span>
              </h2>
              <span className="text-xs font-extrabold text-agri-primary bg-agri-light px-3 py-1 rounded-full">
                {CROP_KB.length} Crops Database
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={ragSearch}
                onChange={e => {
                  setRagSearch(e.target.value);
                  if (ragResult) setRagResult(null);
                }}
                placeholder={tStrings.searchPlaceholder}
                className="w-full px-4 py-3 bg-agri-bg border-2 border-agri-light rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-agri-primary focus:bg-white transition shadow-xs pr-10"
              />
              {ragSearch && (
                <button
                  onClick={() => setRagSearch('')}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {ragSearch.trim().length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-agri-light p-2 max-h-56 overflow-y-auto space-y-1 shadow-lg animate-in fade-in duration-150">
                {matchingCrops.length > 0 ? (
                  matchingCrops.map((c) => (
                    <div
                      key={c.name}
                      onClick={() => handleSelectRagCrop(c)}
                      className="p-3 rounded-xl hover:bg-agri-light/60 cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.emoji}</span>
                        <div>
                          <span className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-agri-primary">
                            {c.name} ({c.kn})
                          </span>
                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {c.problems.join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-agri-primary bg-agri-light px-3 py-1 rounded-xl">
                        {aiLang === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಿ →' : 'Select →'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500 font-medium">
                    {aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆ ಕಂಡುಬಂದಿಲ್ಲ. ಉದಾಹರಣೆಗೆ: ಟೊಮೇಟೊ, ದಾಳಿಂಬೆ, ಅಡಿಕೆ, ಈರುಳ್ಳಿ ಟೈಪ್ ಮಾಡಿ.' : 'No crop matched. Try typing Tomato, Arecanut, Turmeric, Banana...'}
                  </div>
                )}
              </div>
            )}

            {/* Active RAG Crop Details */}
            {ragResult && (
              <div className="bg-amber-50/70 rounded-2xl border-2 border-amber-300 p-5 space-y-4 shadow-xs animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{ragResult.emoji}</span>
                    <div>
                      <h3 className="text-base font-black text-agri-dark">
                        {ragResult.name} <span className="text-agri-primary font-bold">({ragResult.kn})</span>
                      </h3>
                      <span className="text-[10px] text-amber-900 font-black bg-amber-200 px-2.5 py-0.5 rounded-full">
                        ✓ RAG Knowledge Active
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCrop(ragResult.name);
                      handleFetchRecommendation();
                    }}
                    className="px-4 py-2 bg-agri-primary hover:bg-agri-dark text-white font-black text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-agri-accent" />
                    <span>{aiLang === 'kn' ? 'ಪರಿಹಾರ ತಿಳಿಯಿರಿ' : 'Analyze Solutions'}</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl p-4 text-xs font-semibold text-amber-950 leading-relaxed border border-amber-200/60 shadow-xs">
                  <p className="font-extrabold text-xs text-amber-800 mb-1.5 flex items-center gap-1.5">
                    <span>💡</span> {tStrings.guidanceTitle}:
                  </p>
                  {aiLang === 'kn' ? ragResult.guidance.kn : ragResult.guidance.en}
                </div>

                {ragResult.problems?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-wider mb-2">
                      {tStrings.commonProblems}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ragResult.problems.map((prob, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedProblem(prob);
                            setSelectedCrop(ragResult.name);
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full font-bold transition border ${
                            selectedProblem === prob
                              ? 'bg-red-600 text-white border-red-600 shadow-xs font-black'
                              : 'bg-white hover:bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {prob}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Presets & Problem Selector */}
          <div className="bg-white rounded-3xl p-6 border-2 border-agri-light shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-black text-agri-dark uppercase mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-agri-primary" />
                  {tStrings.cropSelect}
                </span>
                <span className="text-xs font-black text-agri-primary">
                  Selected: {selectedCrop}
                </span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {defaultCrops.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCrop(c.name);
                      const found = CROP_KB.find(x => x.name === c.name);
                      if (found) setRagResult(found);
                    }}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold transition border-2 flex flex-col items-center gap-1 ${
                      selectedCrop === c.name
                        ? 'border-agri-primary bg-agri-light text-agri-dark shadow-sm font-black'
                        : 'border-gray-200 text-gray-700 hover:border-agri-secondary/40 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs truncate w-full text-center">
                      {aiLang === 'kn' ? c.kn : c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Problem Dropdown */}
            <div>
              <label className="block text-xs font-black text-agri-dark uppercase mb-2 flex items-center gap-1.5">
                <Bug className="w-4 h-4 text-red-500" />
                <span>{tStrings.problemSelect}</span>
              </label>
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="w-full px-4 py-3 bg-agri-bg border-2 border-agri-light rounded-2xl text-xs sm:text-sm font-black text-agri-dark focus:outline-none focus:border-agri-primary cursor-pointer shadow-xs"
              >
                {PROBLEMS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {aiLang === 'kn' ? `${p.kn} (${p.name})` : p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Run Analysis Button */}
            <button
              type="button"
              onClick={handleFetchRecommendation}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-agri-primary to-emerald-700 hover:from-agri-dark hover:to-agri-primary text-white font-black text-sm sm:text-base rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {aiLang === 'kn' ? 'AI ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analyzing with Agronomy AI...'}
                </span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-agri-accent" />
                  <span>{tStrings.getRecommendation}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Recommendations Results (1 col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border-2 border-agri-light shadow-sm space-y-4 h-full">
            <h2 className="text-xs font-black text-agri-dark uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-agri-light">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                {aiLang === 'kn' ? 'ಶಿಫಾರಸ್ ಪರಿಹಾರಗಳು' : 'AI Remedies & Products'}
              </span>
            </h2>

            {recommendations ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                {recommendations.map((rec, idx) => {
                  const p = rec.product;
                  const pTitle = aiLang === 'kn' ? (p.name_kn || p.name) : p.name;
                  const firstVar = p.variants?.[0] || { size: '1 KG', price: 250 };

                  return (
                    <div key={idx} className="p-4 bg-amber-50/70 rounded-2xl border-2 border-amber-200 space-y-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=200'} 
                          alt={pTitle} 
                          className="w-14 h-14 rounded-xl object-cover border border-amber-200 shadow-xs shrink-0" 
                        />
                        <div>
                          <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            ★ {Math.round(rec.confidence_score * 100)}% Match
                          </span>
                          <h4 className="text-xs font-black text-agri-dark line-clamp-1 mt-1">{pTitle}</h4>
                          <p className="text-[11px] font-extrabold text-agri-primary">₹{firstVar.price} ({firstVar.size})</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-950 font-semibold leading-relaxed bg-white p-2.5 rounded-xl border border-amber-200/70">
                        💡 {rec.match_reason}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(p);
                        }}
                        className="w-full py-2 bg-agri-primary hover:bg-agri-dark text-white text-xs font-black rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>{aiLang === 'kn' ? 'ಖರೀದಿ ಮಾಡಿ (View & Buy)' : 'View & Buy Product'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <Sparkles className="w-12 h-12 mx-auto text-amber-400 opacity-60" />
                <p className="text-xs font-extrabold text-gray-600">
                  {aiLang === 'kn' ? 'ಬೆಳೆ ಮತ್ತು ಸಮಸ್ಯೆ ಆಯ್ಕೆಮಾಡಿ "ಶಿಫಾರಸ್ ತಿಳಿಯಿರಿ" ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Select a crop and symptom, then click Get Solution'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
