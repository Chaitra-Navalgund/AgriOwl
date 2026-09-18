import React, { useState } from 'react';
import { SlidersHorizontal, Search, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';

export default function Marketplace({ products, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, onSelectSize, onViewGuidelines, onBuyNow, setCurrentTab }) {
  const { language, t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const categories = ['All', 'Fertilizers', 'Pesticides', 'Seeds', 'Crop Protection', 'Plant Nutrition'];
  const crops = ['All Crops', 'Cotton', 'Chilli', 'Sugarcane', 'Soybean', 'Paddy', 'Groundnut', 'Tomato'];

  // Smart comprehensive search filter
  const filteredProducts = (products || []).filter((p) => {
    // Search query matching across all product metadata
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      
      const searchableText = [
        p.name,
        p.name_kn,
        p.brand,
        p.category_name,
        p.category_name_kn,
        p.crop_usage,
        p.description,
        ...(p.variants || []).map(v => `${v.size} ₹${v.price}`),
      ].filter(Boolean).join(' ').toLowerCase();

      // Check if any token matches or entire query matches
      const isMatch = tokens.every(token => searchableText.includes(token)) || searchableText.includes(q);
      if (!isMatch) return false;
    }

    // Category match
    if (selectedCategory && selectedCategory !== 'All') {
      const catMatch = (p.category_name && p.category_name.toLowerCase() === selectedCategory.toLowerCase()) ||
                       (p.category_name_kn && p.category_name_kn.toLowerCase() === selectedCategory.toLowerCase());
      if (!catMatch) return false;
    }

    // Crop match
    if (selectedCrop && selectedCrop !== 'All Crops') {
      const cropText = (p.crop_usage || '').toLowerCase();
      if (!cropText.includes(selectedCrop.toLowerCase())) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
    return (b.variants?.[0]?.discount || 0) - (a.variants?.[0]?.discount || 0);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-agri-light shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="fluid-heading font-black text-agri-dark text-break-words">
              {language === 'kn' ? 'ರೈತರ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ' : 'Farmer Marketplace'}
            </h1>
            <span className="bg-agri-light text-agri-primary font-black text-xs px-2.5 py-1 rounded-full border border-agri-secondary/30">
              {filteredProducts.length} {language === 'kn' ? 'ಉತ್ಪನ್ನಗಳು' : 'Products'}
            </span>
          </div>
          <p className="fluid-caption text-agri-textMuted font-medium mt-0.5 text-break-words">
            {language === 'kn' ? 'ಉತ್ತಮ ಇಳುವರಿಗಾಗಿ ಪ್ರಮಾಣೀಕೃತ ಗೊಬ್ಬರ, ಕೀಟನಾಶಕ ಮತ್ತು ಬೀಜಗಳನ್ನು ಅನ್ವೇಷಿಸಿ' : 'Discover certified fertilizers, pesticides and high-yield hybrid seeds'}
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold text-agri-textMuted flex items-center gap-1">
            <SlidersHorizontal className="w-4 h-4 text-agri-primary" /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="touch-target px-3.5 py-2 bg-agri-bg border border-agri-light rounded-xl text-xs font-bold text-agri-dark focus:outline-none focus:border-agri-primary cursor-pointer"
          >
            <option value="popular">Popularity & Offers</option>
            <option value="rating">Rating (High to Low)</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {/* Category Pills & Crop Filters */}
      <div className="space-y-3">
        {/* Category horizontal scroll / wrap */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <span className="text-xs font-bold text-agri-textMuted shrink-0">Category:</span>
          {categories.map((cat) => {
            const isSelected = (!selectedCategory && cat === 'All') || selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                className={`touch-target px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border flex items-center justify-center ${
                  isSelected 
                    ? 'bg-agri-primary text-white border-agri-primary shadow-sm' 
                    : 'bg-white text-agri-dark border-agri-light hover:border-agri-secondary/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Crop Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <span className="text-xs font-bold text-agri-textMuted shrink-0">Crop:</span>
          {crops.map((crop) => {
            const isSelected = (!selectedCrop && crop === 'All Crops') || selectedCrop === crop;
            return (
              <button
                key={crop}
                onClick={() => setSelectedCrop(crop === 'All Crops' ? '' : crop)}
                className={`touch-target px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap border flex items-center justify-center ${
                  isSelected 
                    ? 'bg-agri-accent text-agri-textDark border-amber-400 font-bold shadow-sm' 
                    : 'bg-agri-bg text-agri-textDark border-agri-light hover:bg-white'
                }`}
              >
                🌾 {crop}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Search & Filters Info */}
      {(searchQuery || selectedCategory || selectedCrop) && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-agri-dark bg-agri-light p-3 rounded-2xl border border-agri-secondary/30">
          <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5 text-agri-primary" /> Active Filters:</span>
          {searchQuery && (
            <span className="bg-white px-2.5 py-1 rounded-lg border border-agri-light flex items-center gap-1 shadow-sm">
              Search: <span className="text-agri-primary font-black">"{searchQuery}"</span>
            </span>
          )}
          {selectedCategory && <span className="bg-white px-2.5 py-1 rounded-lg border border-agri-light">Category: {selectedCategory}</span>}
          {selectedCrop && <span className="bg-white px-2.5 py-1 rounded-lg border border-agri-light">Crop: {selectedCrop}</span>}

          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedCrop(''); }}
            className="ml-auto text-red-600 hover:underline flex items-center gap-1 font-black"
          >
            <X className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-5 sm:gap-6">
          {filteredProducts.map((product) => (
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
      ) : (
        <div className="bg-white p-8 sm:p-12 rounded-3xl border-2 border-agri-light text-center space-y-3 shadow-sm">
          <div className="text-5xl animate-bounce">🌾</div>
          <h3 className="fluid-subheading font-black text-agri-dark">
            {language === 'kn' ? 'ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No products found matching your search'}
          </h3>
          <p className="fluid-caption text-agri-textMuted max-w-md mx-auto">
            {language === 'kn' 
              ? 'ದಯವಿಟ್ಟು "NPK", "Coragen", "ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ", "ಕವಚ್" ಅಥವಾ "ಸೋಯಾಬಿನ್" ನಂತಹ ಪದಗಳನ್ನು ಪ್ರಯತ್ನಿಸಿ.' 
              : 'Try searching for terms like "NPK", "Coragen", "Chilli", "Kavach", "Soybean" or clear your active filters.'}
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedCrop(''); }}
            className="touch-target px-5 py-2.5 bg-agri-primary text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-agri-dark transition shadow-md"
          >
            {language === 'kn' ? 'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಮರುಹೊಂದಿಸಿ' : 'Reset All Filters'}
          </button>
        </div>
      )}
    </div>
  );
}
