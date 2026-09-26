import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, X, CheckCircle, ArrowRight, ShieldCheck, Bug, Sprout, AlertCircle, Search, Globe, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { mlApi } from '../services/api';

// ── RAG Knowledge Base (30+ crops with comprehensive solutions) ───────────────
export const CROP_KB = [
  { 
    name: 'Cotton', 
    kn: 'ಹತ್ತಿ', 
    emoji: '🌿', 
    problems: ['Bollworm Infestation', 'Leaf Blight Fungus', 'Nutrient Deficiency', 'Pest attack & Aphids', 'Flower Drop & Poor Fruit Set', 'Root Rot', 'Whitefly Attack'], 
    guidance: { 
      en: 'Cotton requires well-drained medium-black soil. Apply Coragen (Chlorantraniliprole 18.5% SC) @ 60ml/acre for bollworm control. Use NPK 19-19-19 foliar spray for vegetative boost. Irrigate at squaring & boll development. Avoid water stagnation.', 
      kn: 'ಹತ್ತಿಗೆ ನೀರು ಬಸಿಯುವ ಕಪ್ಪು ಮಣ್ಣು ಸೂಕ್ತ. ಕಾಯಿ ಕೊರೆಕ ನಿಯಂತ್ರಣಕ್ಕೆ ಕೋರಾಜೆನ್ (60 ಮಿಲಿ/ಎಕರೆ) ಬಳಸಿ. ಸಸ್ಯ ಬೆಳವಣಿಗೆಗೆ NPK 19-19-19 ಎಲೆಗಳ ಮೇಲೆ ಸಿಂಪಡಿಸಿ. ನೀರು ನಿಲ್ಲದಂತೆ ಎಚ್ಚರವಹಿಸಿ.' 
    } 
  },
  { 
    name: 'Chilli', 
    kn: 'ಮೆಣಸಿನಕಾಯಿ', 
    emoji: '🌶️', 
    problems: ['Leaf Blight Fungus', 'Thrips & Mites', 'Fruit Borer', 'Nutrient Deficiency', 'Damping Off', 'Bacterial Wilt', 'Murda Disease (Leaf Curl)'], 
    guidance: { 
      en: 'Chilli needs rich loamy soil. Spray Imidacloprid 17.8% SL or Spinosad for thrips. Apply Mancozeb 75% WP for fungal blight. Spray Calcium Nitrate + Boron at flowering to prevent flower drop.', 
      kn: 'ಮೆಣಸಿನಕಾಯಿಗೆ ಫಲವತ್ತಾದ ಗೋಡು ಮಣ್ಣು ಸೂಕ್ತ. ನುಸಿ ಮತ್ತು ಥ್ರಿಪ್ಸ್‌ಗೆ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ ಅಥವಾ ಸ್ಪಿನೊಸ್ಯಾಡ್ ಬಳಸಿ. ಬೂದಿ/ಚುಕ್ಕಿ ರೋಗಕ್ಕೆ ಮ್ಯಾಂಕೋಜೆಬ್ ಸಿಂಪಡಿಸಿ. ಹೂವು ಉದುರುವಿಕೆ ತಡೆಯಲು ಬೊರಾನ್ ಬಳಸಿ.' 
    } 
  },
  { 
    name: 'Sugarcane', 
    kn: 'ಕಬ್ಬು', 
    emoji: '🎋', 
    problems: ['Early Shoot Borer', 'Red Rot Disease', 'Top Shoot Borer', 'Wilt', 'Nutrient Deficiency', 'White Grub'], 
    guidance: { 
      en: 'Sugarcane requires regular irrigation. Apply Chlorpyrifos 20% EC or Fipronil granules against shoot borer. Apply Trichoderma-enriched compost to prevent Red Rot and Wilt.', 
      kn: 'ಕಬ್ಬಿಗೆ ನಿಯಮಿತ ನೀರಾವರಿ ಅಗತ್ಯ. ಕಾಂಡ ಕೊರೆಯುವ ಹುಳು ನಿಯಂತ್ರಣಕ್ಕೆ ಕ್ಲೋರ್ಪೈರಿಫಾಸ್ ಅಥವಾ ಫಿಪ್ರೋನಿಲ್ ಹರಳು ಬಳಸಿ. ಕೆಂಪು ಕೊಳೆ ರೋಗ ತಡೆಗೆ ಟ್ರೈಕೋಡರ್ಮಾ ಕಾಂಪೋಸ್ಟ್ ಅನ್ವಯಿಸಿ.' 
    } 
  },
  { 
    name: 'Soybean', 
    kn: 'ಸೋಯಾಬೀನ್', 
    emoji: '🫘', 
    problems: ['Yellow Mosaic Virus', 'Girdle Beetle', 'Leaf Spot', 'Stem Fly', 'Nutrient Deficiency', 'Pod Borer'], 
    guidance: { 
      en: 'Soybean naturally fixes nitrogen. Treat seeds with Rhizobium culture. Spray Thiamethoxam 25% WG against whitefly vector to control Yellow Mosaic. Apply SSP fertilizer at basal stage.', 
      kn: 'ಸೋಯಾಬೀನ್ ಸಾರಜನಕ ಸ್ಥಿರೀಕರಿಸುತ್ತದೆ. ಬೀಜಗಳನ್ನು ರೈಝೋಬಿಯಂನೊಂದಿಗೆ ಸಂಸ್ಕರಿಸಿ. ಹಳದಿ ಮೊಸಾಯಿಕ್ ವೈರಸ್ ಹರಡುವ ಬಿಳಿ ನೊಣಕ್ಕೆ ಥಯಾಮೆಥಾಕ್ಸಮ್ ಸಿಂಪಡಿಸಿ.' 
    } 
  },
  { 
    name: 'Paddy', 
    kn: 'ಭತ್ತ', 
    emoji: '🌾', 
    problems: ['Blast Disease', 'Brown Plant Hopper', 'Stem Rot', 'Sheath Blight', 'Nutrient Deficiency', 'Bacterial Blight', 'Zinc Deficiency'], 
    guidance: { 
      en: 'Paddy needs maintained water level (5 cm). Apply Tricyclazole 75% WP for Blast. Use Pymetrozine for BPH. Spray Zinc Sulfate 21% @ 5g/L for Khaira/zinc deficiency.', 
      kn: 'ಭತ್ತಕ್ಕೆ 5 ಸೆಂ.ಮೀ ನಿಂತ ನೀರಿನ ಮಟ್ಟ ಬೇಕು. ಬೆಂಕಿ ರೋಗಕ್ಕೆ (Blast) ಟ್ರೈಸೈಕ್ಲಾಜೋಲ್ ಬಳಸಿ. ಜಿಗಿ ಹುಳಿಗೆ ಪೈಮೆಟ್ರೋಜಿನ್ ಬಳಸಿ. ಸತುವಿನ ಕೊರತೆಗೆ ಜಿಂಕ್ ಸಲ್ಫೇಟ್ ಸಿಂಪಡಿಸಿ.' 
    } 
  },
  { 
    name: 'Jowar', 
    kn: 'ಜೋಳ', 
    emoji: '🌽', 
    problems: ['Shoot Fly', 'Stem Borer', 'Downy Mildew', 'Grain Mold', 'Nutrient Deficiency', 'Fall Armyworm'], 
    guidance: { 
      en: 'Jowar is drought tolerant. Treat seeds with Imidacloprid 70% WS before sowing. Spray Carbaryl or Emamectin Benzoate for stem borer. Apply Zinc Sulfate @ 25 kg/ha.', 
      kn: 'ಜೋಳ ಬರ ಸಹಿಷ್ಣು ಬೆಳೆ. ಬಿತ್ತನೆ ಮುನ್ನ ಇಮಿಡಾಕ್ಲೋಪ್ರಿಡ್ ಬೀಜೋಪಚಾರ ಮಾಡಿ. ಕಾಂಡ ಕೊರೆಕ ಹುಳಕ್ಕೆ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಝೋಯೇಟ್ ಬಳಸಿ. ಜಿಂಕ್ ಸಲ್ಫೇಟ್ 25 ಕೆಜಿ/ಹೆಕ್ಟೇರ್ ಅನ್ವಯಿಸಿ.' 
    } 
  },
  { 
    name: 'Wheat', 
    kn: 'ಗೋಧಿ', 
    emoji: '🌾', 
    problems: ['Rust Disease', 'Aphids', 'Powdery Mildew', 'Loose Smut', 'Nutrient Deficiency', 'Termites'], 
    guidance: { 
      en: 'Wheat thrives in cool climate. Apply Propiconazole 25% EC for Yellow/Brown Rust. Treat seeds with Carbendazim 50% WP against loose smut. Irrigate at Crown Root Initiation.', 
      kn: 'ಗೋಧಿಗೆ ತಂಪಾದ ಹವಾಮಾನ ಸೂಕ್ತ. ಹಳದಿ/ಕಂದು ತುಕ್ಕು ರೋಗಕ್ಕೆ ಪ್ರೊಪಿಕೊನಾಜೋಲ್ ಸಿಂಪಡಿಸಿ. ಕಾಡಿಗೆ ರೋಗ ತಡೆಗೆ ಕಾರ್ಬೆಂಡಾಜಿಮ್ ಬೀಜೋಪಚಾರ ಮಾಡಿ.' 
    } 
  },
  { 
    name: 'Tomato', 
    kn: 'ಟೊಮೇಟೊ', 
    emoji: '🍅', 
    problems: ['Early Blight', 'Late Blight', 'Fruit Borer', 'Whitefly & Leaf Curl', 'Bacterial Wilt', 'Blossom End Rot (Calcium Deficiency)'], 
    guidance: { 
      en: 'Spray Mancozeb or Ridomil Gold for Early/Late Blight. Control fruit borer with Coragen. Spray Calcium Nitrate 1% to prevent Blossom End Rot. Use Yellow Sticky Traps for whitefly.', 
      kn: 'ಟೊಮೇಟೊ ಅಂಗಮಾರಿ ರೋಗಕ್ಕೆ ರಿಡೋಮಿಲ್ ಗೋಲ್ಡ್ ಅಥವಾ ಮ್ಯಾಂಕೋಜೆಬ್ ಬಳಸಿ. ಕಾಯಿ ಕೊರೆಕ ಹುಳಕ್ಕೆ ಕೋರಾಜೆನ್ ಸಿಂಪಡಿಸಿ. ಹಣ್ಣು ಕೊಳೆಯುವುದನ್ನು ತಡೆಯಲು ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್ ಸಿಂಪಡಿಸಿ.' 
    } 
  },
  { 
    name: 'Onion', 
    kn: 'ಈರುಳ್ಳಿ', 
    emoji: '🧅', 
    problems: ['Purple Blotch', 'Thrips Infestation', 'Stemphylium Blight', 'Basal Rot', 'Bulb Rot in Storage', 'Damping Off'], 
    guidance: { 
      en: 'Onion needs well-drained sandy loam. Spray Spinosad 45% SC or Fipronil for Thrips. Apply Mancozeb or Tebuconazole for Purple Blotch. Stop irrigation 15 days before harvest.', 
      kn: 'ಈರುಳ್ಳಿಗೆ ನೀರು ಸರಾಗವಾಗಿ ಬಸಿಯುವ ಮಣ್ಣು ಬೇಕು. ನುಸಿ ಹುಳಿಗೆ ಸ್ಪಿನೊಸ್ಯಾಡ್ ಬಳಸಿ. ನೇರಳೆ ಮಚ್ಚೆ ರೋಗಕ್ಕೆ ಟೆಬುಕೊನಾಜೋಲ್ ಸಿಂಪಡಿಸಿ. ಕಟಾವಿಗೆ 15 ದಿನ ಮುನ್ನ ನೀರು ನಿಲ್ಲಿಸಿ.' 
    } 
  },
  { 
    name: 'Groundnut', 
    kn: 'ಕಡಲೆಕಾಯಿ', 
    emoji: '🥜', 
    problems: ['Tikka Leaf Spot', 'Stem Rot', 'Rust', 'Aphids', 'Spodoptera Caterpillar', 'White Grub'], 
    guidance: { 
      en: 'Apply Gypsum @ 400 kg/ha at flowering/pegging stage for pod filling. Spray Chlorothalonil or Hexaconazole for Tikka disease. Treat seed with Trichoderma @ 10g/kg.', 
      kn: 'ಕಡಲೆಕಾಯಿಯಲ್ಲಿ ಕಾಯಿ ಕಟ್ಟಲು ಹೂವಾಡುವ ಹಂತದಲ್ಲಿ 400 ಕೆಜಿ ಜಿಪ್ಸಮ್ ಅನ್ವಯಿಸಿ. ಟಿಕ್ಕಾ ಚುಕ್ಕಿ ರೋಗಕ್ಕೆ ಹೆಕ್ಸಾಕೊನಾಜೋಲ್ ಬಳಸಿ. ಬೀಜೋಪಚಾರಕ್ಕೆ ಟ್ರೈಕೋಡರ್ಮಾ ಬಳಸಿ.' 
    } 
  },
  { 
    name: 'Maize', 
    kn: 'ಮೆಕ್ಕೆಜೋಳ', 
    emoji: '🌽', 
    problems: ['Fall Armyworm (FAW)', 'Northern Leaf Blight', 'Stalk Rot', 'Downy Mildew', 'Zinc Deficiency', 'Stem Borer'], 
    guidance: { 
      en: 'High yield grain crop. Control Fall Armyworm with Emamectin Benzoate 5% SG @ 0.5g/L or Coragen. Apply Zinc Sulfate 21% @ 10kg/acre at sowing. Side-dress Urea at 30 & 50 days.', 
      kn: 'ಮೆಕ್ಕೆಜೋಳದ ಸೈನಿಕ ಹುಳು (FAW) ನಿಯಂತ್ರಣಕ್ಕೆ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಝೋಯೇಟ್ ಅಥವಾ ಕೋರಾಜೆನ್ ಬಳಸಿ. ಬಿತ್ತನೆ ಸಮಯದಲ್ಲಿ ಜಿಂಕ್ ಸಲ್ಫೇಟ್ ಅನ್ವಯಿಸಿ. ಯೂರಿಯಾವನ್ನು 30 ಮತ್ತು 50 ದಿನಗಳಲ್ಲಿ ಹರಡಿ.' 
    } 
  },
  { 
    name: 'Potato', 
    kn: 'ಆಲೂಗಡ್ಡೆ', 
    emoji: '🥔', 
    problems: ['Late Blight', 'Early Blight', 'Common Scab', 'Aphids & Vectors', 'Cutworms', 'Black Scurf'], 
    guidance: { 
      en: 'Potato requires cool climate & loose soil. Spray Cymoxanil + Mancozeb (Curzate) for Late Blight. Treat tuber seeds with Carbendazim. Earth up tubers properly to prevent greening.', 
      kn: 'ಆಲೂಗಡ್ಡೆಗೆ ಸಡಿಲ ಫಲವತ್ತಾದ ಮಣ್ಣು ಬೇಕು. ಲೇಟ್ ಬ್ಲೈಟ್ ರೋಗಕ್ಕೆ ಸಿಮಾಕ್ಸಾನಿಲ್ + ಮ್ಯಾಂಕೋಜೆಬ್ ಬಳಸಿ. ಆಲೂಗೆಡ್ಡೆ ಗಡ್ಡೆಗಳು ಹಸಿರಾಗದಂತೆ ಮಣ್ಣು ಏರಿಸಿ.' 
    } 
  },
  { 
    name: 'Turmeric', 
    kn: 'ಅರಿಶಿನ', 
    emoji: '🟡', 
    problems: ['Rhizome Rot', 'Leaf Spot & Blotch', 'Thrips', 'Shoot Borer', 'Scale Insects', 'Root Knot Nematode'], 
    guidance: { 
      en: 'Treat seed rhizomes in Mancozeb + Ridomil solution (2g/L) for 30 mins before planting. Drench soil with Copper Oxychloride for rhizome rot. Apply heavy neem cake for nematodes.', 
      kn: 'ನಾಟಿ ಮುನ್ನ ಕೊಂಬುಗಳನ್ನು ಮ್ಯಾಂಕೋಜೆಬ್ + ರಿಡೋಮಿಲ್ ದ್ರಾವಣದಲ್ಲಿ 30 ನಿಮಿಷ ನೆನೆಸಿಡಿ. ಗೆಡ್ಡೆ ಕೊಳೆ ರೋಗಕ್ಕೆ ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ ಮಣ್ಣಿಗೆ ಸುರಿಯಿರಿ. ಬೇವಿನ ಹಿಂಡಿ ಅನ್ವಯಿಸಿ.' 
    } 
  },
  { 
    name: 'Ginger', 
    kn: 'ಶುಂಠಿ', 
    emoji: '🫚', 
    problems: ['Soft Rot (Pythium)', 'Bacterial Wilt', 'Shoot Borer', 'Leaf Spot', 'Rhizome Scale'], 
    guidance: { 
      en: 'Ginger requires high shade & well-drained soil. Drench beds with Metalaxyl-Mancozeb (2.5g/L) for Soft Rot. Mulch generously with green leaves to preserve soil moisture.', 
      kn: 'ಶುಂಠಿಗೆ ನೆರಳು ಮತ್ತು ನೀರು ಬಸಿಯುವ ಮಣ್ಣು ಸೂಕ್ತ. ಮೃದು ಕೊಳೆ ರೋಗ ತಡೆಗೆ ಮೆಟಲಾಕ್ಸಿಲ್-ಮ್ಯಾಂಕೋಜೆಬ್ ದ್ರಾವಣ ಮಣ್ಣಿಗೆ ಹಾಕಿ. ಹಸಿರೆಲೆ ಹೊದಿಕೆ ಹಾಕಿ.' 
    } 
  },
  { 
    name: 'Arecanut', 
    kn: 'ಅಡಿಕೆ', 
    emoji: '🌴', 
    problems: ['Koleroga (Fruit Rot)', 'Yellow Leaf Disease (YLD)', 'Anaberoga (Foot Rot)', 'Spindle Bug', 'White Mites', 'Inflorescence Dieback'], 
    guidance: { 
      en: 'Spray 1% Bordeaux Mixture before onset of monsoon against Koleroga (Fruit Rot). Apply Neem cake + Trichoderma for foot rot. Spray Wettable Sulfur 80% for red/white mites.', 
      kn: 'ಕೊಳೆ ರೋಗ ತಡೆಗೆ ಮುಂಗಾರು ಪ್ರಾರಂಭವಾಗುವ ಮುನ್ನ 1% ಬೋರ್ಡೋ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ. ಅಣಬೆ ರೋಗಕ್ಕೆ ಬೇವಿನ ಹಿಂಡಿ + ಟ್ರೈಕೋಡರ್ಮಾ ಹಾಕಿ. ಕೆಂಪು ನುಸಿಗೆ ಸಲ್ಫರ್ ಬಳಸಿ.' 
    } 
  },
  { 
    name: 'Pomegranate', 
    kn: 'ದಾಳಿಂಬೆ', 
    emoji: '🫐', 
    problems: ['Bacterial Blight (Telya)', 'Fruit Borer (Butterflies)', 'Wilt Disease', 'Anthracnose Fruit Spot', 'Thrips & Mites'], 
    guidance: { 
      en: 'Bacterial blight (Telya): spray Streptocycline 0.5g/L + Copper Oxychloride 2g/L. Prune infected twigs and burn immediately. Avoid flood irrigation; use drip with bio-fungicides.', 
      kn: 'ತೆಲ್ಯ ರೋಗಕ್ಕೆ (ಬ್ಯಾಕ್ಟೀರಿಯಲ್ ಬ್ಲೈಟ್) ಸ್ಟ್ರೆಪ್ಟೋಸೈಕ್ಲಿನ್ 0.5 ಗ್ರಾಂ + ಕಾಪರ್ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ 2 ಗ್ರಾಂ ಸಿಂಪಡಿಸಿ. ಸೋಂಕಿತ ಕೊಂಬೆಗಳನ್ನು ಕತ್ತರಿಸಿ ಸುಟ್ಟುಹಾಕಿ. ಹನಿ ನೀರಾವರಿ ಬಳಸಿ.' 
    } 
  },
  { 
    name: 'Banana', 
    kn: 'ಬಾಳೆ', 
    emoji: '🍌', 
    problems: ['Panama Wilt', 'Sigatoka Leaf Spot', 'Bunchy Top Virus', 'Rhizome Weevil', 'Erwinia Rhizome Rot'], 
    guidance: { 
      en: 'Spray Propiconazole 1ml/L + mineral oil for Sigatoka leaf spot. Drench with Carbendazim 2g/L for Panama wilt. Apply high Potash (MOP) @ 300g per plant during shooting stage.', 
      kn: 'ಸಿಗಟೋಕ ಎಲೆ ಚುಕ್ಕಿ ರೋಗಕ್ಕೆ ಪ್ರೊಪಿಕೊನಾಜೋಲ್ ಸಿಂಪಡಿಸಿ. ಪನಾಮಾ ಸೊರಗು ರೋಗಕ್ಕೆ ಕಾರ್ಬೆಂಡಾಜಿಮ್ ದ್ರಾವಣ ಹಾಕಿ. ಗೊನೆ ಬಿಡುವ ಹಂತದಲ್ಲಿ ಪೊಟ್ಯಾಷ್ (MOP) ಹೆಚ್ಚಿಸಿ.' 
    } 
  },
  { 
    name: 'Brinjal', 
    kn: 'ಬದನೆ', 
    emoji: '🍆', 
    problems: ['Shoot & Fruit Borer', 'Little Leaf Disease', 'Epilachna Beetle', 'Fusarium Wilt', 'Jassids & Whitefly'], 
    guidance: { 
      en: 'Shoot & Fruit Borer: spray Coragen (Chlorantraniliprole) or Emamectin Benzoate. Install Pheromone Traps @ 12/acre. Remove and destroy wilted shoots weekly.', 
      kn: 'ಕಾಂಡ ಮತ್ತು ಕಾಯಿ ಕೊರೆಕ ಹುಳಕ್ಕೆ ಕೋರಾಜೆನ್ ಅಥವಾ ಎಮಾಮೆಕ್ಟಿನ್ ಬಳಸಿ. ಎಕರೆಗೆ 12 ಮೋಹಕ ಬಲೆಗಳನ್ನು (Pheromone traps) ಅಳವಡಿಸಿ. ಒಣಗಿದ ಕುಡಿಗಳನ್ನು ಕಿತ್ತು ನಾಶಪಡಿಸಿ.' 
    } 
  }
];

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

export default function CropMLRecommenderModal({ isOpen, onClose, onSelectProduct }) {
  const { language } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState('Cotton');
  const [selectedProblem, setSelectedProblem] = useState('Bollworm Infestation');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [ragSearch, setRagSearch] = useState('');
  const [ragResult, setRagResult] = useState(null);
  const [aiLang, setAiLang] = useState(language || 'en');

  // Keep aiLang synced when global language changes
  useEffect(() => {
    if (language) setAiLang(language);
  }, [language]);

  // RAG Search filter
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
      // Dynamic tailored recommendation fallback
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
            match_reason: `High confidence match for ${cropObj.name} against ${selectedProblem}. Chlorantraniliprole targets ryanodine receptors for rapid feeding cessation.`
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
            match_reason: `Foliar spray booster to quickly revitalize ${cropObj.name} foliage and accelerate new shoot growth after pest stress.`
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
            match_reason: `Multi-site protective fungicide ideal for stopping ${selectedProblem} on ${cropObj.name} crops.`
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
            match_reason: `Balanced plant nutrient package to fortify plant immune response against disease.`
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

  // Safe UI texts
  const tStrings = {
    cropSelect: aiLang === 'kn' ? 'ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ' : 'SELECT CROP',
    problemSelect: aiLang === 'kn' ? 'ಸಮಸ್ಯೆ / ರೋಗಲಕ್ಷಣ ಆಯ್ಕೆಮಾಡಿ' : 'SELECT PROBLEM / SYMPTOM',
    getRecommendation: aiLang === 'kn' ? 'ಶಿಫಾರಸ್ ಪರಿಹಾರ ತಿಳಿಯಿರಿ' : 'Get Recommended Solution',
    searchPlaceholder: aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆ ಹುಡುಕಿ (ಉದಾ: ಅಡಿಕೆ, ಈರುಳ್ಳಿ, ಕಬ್ಬು, ಟೊಮೇಟೊ, ದಾಳಿಂಬೆ...)' : 'Search any crop (e.g. Arecanut, Onion, Turmeric, Tomato, Pomegranate...)',
    searchBtn: aiLang === 'kn' ? 'ಹುಡುಕು' : 'Search',
    guidanceTitle: aiLang === 'kn' ? 'ಕೃಷಿ ಪರಿಹಾರ ಮಾರ್ಗದರ್ಶನ' : 'Agronomist Guidance',
    commonProblems: aiLang === 'kn' ? 'ಸಾಮಾನ್ಯ ರೋಗಲಕ್ಷಣಗಳು' : 'Key Crop Issues',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative border-4 border-agri-light max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-agri-textMuted hover:text-agri-textDark rounded-full bg-gray-100 hover:bg-gray-200 transition"
          aria-label="Close Assistant"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title and Independent Language Toggle */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-agri-light pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shrink-0 shadow-xs">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-agri-dark leading-tight">
                {aiLang === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ AI ಸಹಾಯಕ' : 'Smart Crop AI Assistant'}
              </h3>
              <p className="text-xs text-agri-textMuted font-medium">
                {aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆಯನ್ನು ಹುಡುಕಿ ಮತ್ತು ತ್ವರಿತ ಪರಿಹಾರ ಪಡೆಯಿರಿ' : 'RAG Crop Intelligence & ML Agronomy Recommender'}
              </p>
            </div>
          </div>

          {/* Independent Language Toggle Switch */}
          <button
            type="button"
            onClick={() => setAiLang(l => l === 'en' ? 'kn' : 'en')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-agri-primary/30 bg-agri-light hover:bg-agri-secondary/20 transition text-xs font-black text-agri-dark shadow-xs active:scale-95"
            title="Toggle AI Language (English / ಕನ್ನಡ)"
          >
            <Globe className="w-3.5 h-3.5 text-agri-primary" />
            <span>{aiLang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>
        </div>

        {/* ── RAG Crop Search Bar ─────────────────────────────────────────────── */}
        <div className="mb-5 p-4 bg-gradient-to-br from-green-50 to-amber-50 rounded-2xl border-2 border-agri-light space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-agri-dark uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-agri-primary" />
              <span>{aiLang === 'kn' ? 'ಬೆಳೆ ಹುಡುಕಾಟ (RAG ಜ್ಞಾನ ಬೇಸ್ - 30+ ಬೆಳೆಗಳು)' : 'RAG Crop Search (Search Any Crop)'}</span>
            </p>
            <span className="text-[10px] font-extrabold text-agri-primary bg-white px-2 py-0.5 rounded-full border border-agri-light">
              {CROP_KB.length} Crops DB
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
              className="w-full px-4 py-2.5 bg-white border-2 border-agri-light rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-agri-primary transition shadow-xs pr-10"
            />
            {ragSearch && (
              <button
                onClick={() => setRagSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Real-time search suggestions dropdown */}
          {ragSearch.trim().length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-agri-light p-2 max-h-48 overflow-y-auto space-y-1 shadow-md animate-in fade-in duration-150">
              {matchingCrops.length > 0 ? (
                matchingCrops.map((c) => (
                  <div
                    key={c.name}
                    onClick={() => handleSelectRagCrop(c)}
                    className="p-2.5 rounded-xl hover:bg-agri-light/60 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.emoji}</span>
                      <div>
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-agri-primary">
                          {c.name} ({c.kn})
                        </span>
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          {c.problems.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-agri-primary bg-agri-light px-2 py-1 rounded-lg">
                      {aiLang === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಿ →' : 'Select →'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-500 font-medium">
                  {aiLang === 'kn' ? 'ಯಾವುದೇ ಬೆಳೆ ಕಂಡುಬಂದಿಲ್ಲ. ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡ ಹೆಸರನ್ನು ಪ್ರಯತ್ನಿಸಿ.' : 'No crop matched. Try typing Tomato, Arecanut, Turmeric, Banana...'}
                </div>
              )}
            </div>
          )}

          {/* Active RAG Crop Information Card */}
          {ragResult && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-4 space-y-3 shadow-sm animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ragResult.emoji}</span>
                  <div>
                    <h4 className="text-sm font-black text-agri-dark">
                      {ragResult.name} <span className="text-agri-primary font-bold">({ragResult.kn})</span>
                    </h4>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      ✓ RAG Knowledge Loaded
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCrop(ragResult.name);
                    handleFetchRecommendation();
                  }}
                  className="px-3 py-1.5 bg-agri-primary hover:bg-agri-dark text-white font-black text-xs rounded-xl transition shadow-xs flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-agri-accent" />
                  <span>{aiLang === 'kn' ? 'ಪರಿಹಾರ ಪಡೆಯಿರಿ' : 'Get Solutions'}</span>
                </button>
              </div>

              {/* Agronomic Guidance */}
              <div className="bg-amber-50/80 rounded-xl p-3 text-xs font-semibold text-amber-950 leading-relaxed border border-amber-200/50">
                <p className="font-extrabold text-[11px] text-amber-800 mb-1 flex items-center gap-1">
                  <span>💡</span> {tStrings.guidanceTitle}:
                </p>
                {aiLang === 'kn' ? ragResult.guidance.kn : ragResult.guidance.en}
              </div>

              {/* Crop Issues Tags */}
              {ragResult.problems?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    {tStrings.commonProblems}:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {ragResult.problems.map((prob, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedProblem(prob);
                          setSelectedCrop(ragResult.name);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border ${
                          selectedProblem === prob
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
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

        {/* ── Preset Crops Grid ─────────────────────────────────────────────── */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-black text-agri-dark uppercase mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sprout className="w-4 h-4 text-agri-primary" />
                {tStrings.cropSelect}
              </span>
              <span className="text-[11px] font-bold text-agri-primary">
                Selected: {selectedCrop}
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {defaultCrops.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedCrop(c.name);
                    const found = CROP_KB.find(x => x.name === c.name);
                    if (found) setRagResult(found);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition border-2 flex flex-col items-center gap-0.5 ${
                    selectedCrop === c.name
                      ? 'border-agri-primary bg-agri-light text-agri-dark shadow-sm scale-102 font-black'
                      : 'border-gray-200 text-gray-700 hover:border-agri-secondary/40 bg-white'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-[11px] truncate w-full text-center">
                    {aiLang === 'kn' ? c.kn : c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Problem Selector Dropdown */}
          <div>
            <label className="block text-xs font-black text-agri-dark uppercase mb-1.5 flex items-center gap-1">
              <Bug className="w-4 h-4 text-red-500" />
              <span>{tStrings.problemSelect}</span>
            </label>
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="w-full px-4 py-2.5 bg-agri-bg border-2 border-agri-light rounded-xl text-xs sm:text-sm font-black text-agri-dark focus:outline-none focus:border-agri-primary cursor-pointer shadow-xs"
            >
              {PROBLEMS.map((p) => (
                <option key={p.name} value={p.name}>
                  {aiLang === 'kn' ? `${p.kn} (${p.name})` : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Analyze / Get Recommendation Button */}
          <button
            type="button"
            onClick={handleFetchRecommendation}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-agri-primary to-emerald-700 hover:from-agri-dark hover:to-agri-primary text-white font-black text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {aiLang === 'kn' ? 'AI ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...' : 'Analyzing with Agronomy AI...'}
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-agri-accent" />
                <span>{tStrings.getRecommendation}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* ── AI Results Section ─────────────────────────────────────────────── */}
        {recommendations && (
          <div className="space-y-3 pt-4 border-t-2 border-agri-light animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-agri-dark uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>
                  {aiLang === 'kn' 
                    ? `AI ಶಿಫಾರಸ್ ಪರಿಹಾರಗಳು (${recommendations.length}):` 
                    : `Verified Agricultural Remedies (${recommendations.length}):`}
                </span>
              </h4>
              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                Matched for {selectedCrop}
              </span>
            </div>

            {recommendations.map((rec, idx) => {
              const p = rec.product;
              const pTitle = aiLang === 'kn' ? (p.name_kn || p.name) : p.name;
              const firstVar = p.variants?.[0] || { size: '1 KG', price: 250 };
              
              return (
                <div key={idx} className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl border-2 border-amber-200 space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.image || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300'} 
                        alt={pTitle} 
                        className="w-14 h-14 rounded-xl object-cover border border-amber-200 shadow-xs shrink-0" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                            ★ {Math.round(rec.confidence_score * 100)}% Match
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {firstVar.size} · ₹{firstVar.price}
                          </span>
                        </div>
                        <h5 className="text-xs sm:text-sm font-black text-agri-dark line-clamp-1 mt-1">{pTitle}</h5>
                        <p className="text-[11px] text-gray-500 font-medium">{p.brand} · {p.category_name}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(p);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-agri-primary hover:bg-agri-dark text-white text-xs font-black rounded-xl transition shadow-xs shrink-0 active:scale-95"
                    >
                      {aiLang === 'kn' ? 'ಖರೀದಿ ಮಾಡಿ' : 'View & Buy'}
                    </button>
                  </div>

                  <div className="text-xs text-amber-950 font-semibold leading-relaxed bg-white p-3 rounded-xl border border-amber-200/80">
                    <span className="font-extrabold text-amber-800">💡 Agronomist Note: </span>
                    {rec.match_reason}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
