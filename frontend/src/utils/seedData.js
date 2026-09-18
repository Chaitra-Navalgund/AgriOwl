/**
 * seedData.js
 * Default demo data for Products, Inventory, and Farmers (8 Products total).
 * Used when the backend is offline or returns empty data.
 * This data is seeded into persistentStore and lasts 30 days.
 */

export const SEED_PRODUCTS = [
  {
    id: 1,
    name: 'NPK 19-19-19 Water Soluble Fertilizer',
    name_kn: 'ಎನ್.ಪಿ.ಕೆ 19-19-19 ನೀರಿನಲ್ಲಿ ಕರಗುವ ಗೊಬ್ಬರ',
    brand: 'Iffco Agri',
    category: 1,
    category_name: 'Fertilizers',
    category_name_kn: 'ಗೊಬ್ಬರಗಳು',
    description: 'Balanced NPK fertilizer for early crop growth stage and maximum root development.',
    crop_usage: 'Cotton, Sugarcane, Chilli, Soybean',
    rating: 4.8,
    active: true,
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop',
    variants: [
      { id: 1, size: '1 KG', price: 220, discount: 10, discounted_price: 198, stock: 120 },
      { id: 2, size: '5 KG', price: 980, discount: 12, discounted_price: 862, stock: 50 },
      { id: 3, size: '25 KG', price: 4200, discount: 15, discounted_price: 3570, stock: 25 },
    ],
    guideline: {
      usage_instructions: 'Dissolve 5g per liter of water. Spray every 15 days on leaves.',
      dosage: '2-3 KG per acre',
      timing: 'Early morning or late evening',
      sunny_guidance: 'Ideal for sunny days with moist soil.',
      rainy_guidance: 'Avoid spray if heavy rain is expected within 4 hours.',
      windy_guidance: 'Avoid spray during high winds.',
      cold_guidance: 'Mix in lukewarm water for best dissolution.',
      precautions: 'Wear gloves and eye goggles during application.',
      storage: 'Store in a cool, dry place away from direct sunlight.',
      safety_warning: 'Use only according to label instructions. Keep away from children.'
    }
  },
  {
    id: 2,
    name: 'Coragen Insecticide (Chlorantraniliprole 18.5% SC)',
    name_kn: 'ಕೋರಾಜೆನ್ ಕೀಟನಾಶಕ (ಕ್ಲೋರಾಂಟ್ರಾನಿಲಿಪ್ರೋಲ್ 18.5% SC)',
    brand: 'FMC Bio',
    category: 2,
    category_name: 'Pesticides',
    category_name_kn: 'ಕೀಟನಾಶಕಗಳು',
    description: 'Advanced broad-spectrum insecticide effective against Bollworm, Stem Borer, and Fruit Borer.',
    crop_usage: 'Cotton, Paddy, Chilli, Tomato, Sugarcane',
    rating: 4.9,
    active: true,
    image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop',
    variants: [
      { id: 4, size: '60 ML', price: 850, discount: 8, discounted_price: 782, stock: 85 },
      { id: 5, size: '150 ML', price: 1950, discount: 10, discounted_price: 1755, stock: 45 },
    ],
    guideline: {
      usage_instructions: 'Mix 0.4 ml per liter of water. Spray evenly on pest-affected foliage.',
      dosage: '60 ml per acre',
      timing: 'Apply at first sign of pest infestation or egg laying.',
      sunny_guidance: 'Spray in early morning.',
      rainy_guidance: 'Rainfast within 2 hours of application.',
      windy_guidance: 'Avoid spraying when wind speed exceeds 10 km/h.',
      cold_guidance: 'No special restrictions.',
      precautions: 'Wear full protective spray mask and protective rubber gloves.',
      storage: 'Store locked in original container away from foodstuff.',
      safety_warning: 'Hazardous if swallowed or inhaled. Follow safety intervals.'
    }
  },
  {
    id: 3,
    name: 'Byadgi Hybrid Chilli Seeds (KDL-20)',
    name_kn: 'ಬ್ಯಾಡಗಿ ಹೈಬ್ರಿಡ್ ಮೆಣಸಿನಕಾಯಿ ಬೀಜಗಳು (KDL-20)',
    brand: 'Karnataka State Seeds Corp',
    category: 3,
    category_name: 'Seeds',
    category_name_kn: 'ಬೀಜಗಳು',
    description: 'High-color deep red Byadgi chilli seeds specially bred for Karnataka black and red soils.',
    crop_usage: 'Chilli, Dry Red Pepper, Horticulture',
    rating: 4.7,
    active: true,
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&auto=format&fit=crop',
    variants: [
      { id: 6, size: '100 Grams', price: 450, discount: 5, discounted_price: 427, stock: 180 },
      { id: 7, size: '500 Grams', price: 2100, discount: 8, discounted_price: 1932, stock: 60 },
    ],
    guideline: {
      usage_instructions: 'Treat seeds with Trichoderma before sowing in raised nursery beds.',
      dosage: '250-300 grams per acre nursery',
      timing: 'Sow in May-June for Kharif or Sept-Oct for Rabi',
      sunny_guidance: 'Requires 6-8 hours of direct sunshine.',
      rainy_guidance: 'Ensure proper drainage in nursery bed.',
      windy_guidance: 'Provide windbreak around nursery.',
      cold_guidance: 'Cover nursery with agrifilm during extreme cold nights.',
      precautions: 'Use certified bio-fungicide seed treatment.',
      storage: 'Store seed packets in moisture-free airtight container.',
      safety_warning: 'Treated seeds are not fit for human or animal consumption.'
    }
  },
  {
    id: 4,
    name: 'Bt Cotton Hybrid Seeds (Bollgard II)',
    name_kn: 'ಬಿಟಿ ಹತ್ತಿ ಹೈಬ್ರಿಡ್ ಬೀಜಗಳು (ಬೋಲ್‌ಗಾರ್ಡ್ II)',
    brand: 'Mahyco Seeds',
    category: 3,
    category_name: 'Seeds',
    category_name_kn: 'ಬೀಜಗಳು',
    description: 'High boll retention hybrid Bt cotton seeds offering superior resistance against American bollworm.',
    crop_usage: 'Cotton, Cash Crops',
    rating: 4.9,
    active: true,
    image: 'https://images.unsplash.com/photo-1605001011156-cbf0b0f67a31?w=600&auto=format&fit=crop',
    variants: [
      { id: 8, size: '475 Gram Packet', price: 860, discount: 0, discounted_price: 860, stock: 250 },
      { id: 9, size: '5 Packets (Combo)', price: 4300, discount: 5, discounted_price: 4085, stock: 40 },
    ],
    guideline: {
      usage_instructions: 'Plant along with refuge non-Bt seeds along boundary rows as instructed.',
      dosage: '2 packets per acre for 4x2 ft spacing',
      timing: 'With onset of monsoon (June-July)',
      sunny_guidance: 'Ideal for sunny kharif season.',
      rainy_guidance: 'Avoid waterlogging around seedlings.',
      windy_guidance: 'Earth up soil around roots at 45 days.',
      cold_guidance: 'Not suitable for severe frost.',
      precautions: 'Plant refuge seeds provided in the pack.',
      storage: 'Keep seeds in original sealed tamper-proof pack.',
      safety_warning: 'Seed treated with chemical poison. Do not feed to livestock.'
    }
  },
  {
    id: 5,
    name: 'Bavistin Fungicide (Carbendazim 50% WP)',
    name_kn: 'ಬಾವಿಸ್ಟಿನ್ ಶಿಲೀಂಧ್ರನಾಶಕ (ಕಾರ್ಬೆಂಡಾಜಿಮ್ 50% WP)',
    brand: 'Crystal Crop Care',
    category: 2,
    category_name: 'Pesticides',
    category_name_kn: 'ಕೀಟನಾಶಕಗಳು',
    description: 'Proven systemic fungicide for seed treatment and foliar spray against tikka disease, blast and rust.',
    crop_usage: 'Groundnut, Soybean, Paddy, Grapes, Vegetables',
    rating: 4.6,
    active: true,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop',
    variants: [
      { id: 9, size: '250 Grams', price: 320, discount: 8, discounted_price: 294, stock: 140 },
      { id: 10, size: '500 Grams', price: 590, discount: 10, discounted_price: 531, stock: 70 },
      { id: 11, size: '1 KG', price: 1100, discount: 12, discounted_price: 968, stock: 35 },
    ],
    guideline: {
      usage_instructions: 'Mix 2 grams per liter water for foliar spray. For seed treatment: 2g/kg seed.',
      dosage: '200-250 grams per acre',
      timing: 'At first appearance of leaf spots or blast lesions.',
      sunny_guidance: 'Spray during morning hours after dew has dried.',
      rainy_guidance: 'Do not spray if rain is likely within 3 hours.',
      windy_guidance: 'Avoid drifting by spraying on calm mornings.',
      cold_guidance: 'Effective in all temperature ranges.',
      precautions: 'Wear protective mask; wash hands thoroughly with soap after handling.',
      storage: 'Keep dry and away from humidity.',
      safety_warning: 'Toxic to aquatic organisms. Do not discard in water bodies.'
    }
  },
  {
    id: 6,
    name: 'Bio-Zyme Plant Growth Booster Spray',
    name_kn: 'ಬಯೋ-ಜೈಮ್ ಸಸ್ಯ ಬೆಳವಣಿಗೆಯ ವರ್ಧಕ ದ್ರಾವಣ',
    brand: 'Seaweed Organics',
    category: 4,
    category_name: 'Plant Nutrition',
    category_name_kn: 'ಸಸ್ಯ ಪೋಷಣೆ',
    description: '100% organic seaweed bio-stimulant extract enriched with micro-nutrients to increase flower set and yield.',
    crop_usage: 'All Field Crops, Vegetables, Spices, Fruits',
    rating: 4.8,
    active: true,
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&auto=format&fit=crop',
    variants: [
      { id: 11, size: '500 ML', price: 480, discount: 15, discounted_price: 408, stock: 110 },
      { id: 12, size: '1 Litre', price: 890, discount: 18, discounted_price: 729, stock: 55 },
    ],
    guideline: {
      usage_instructions: 'Mix 2 ml per liter of water. Spray at vegetative and flowering stage.',
      dosage: '400-500 ml per acre',
      timing: 'Before flowering and at early pod/fruit development',
      sunny_guidance: 'Spray in cool morning or late afternoon for best leaf absorption.',
      rainy_guidance: 'Allow 2 hours before rain for full absorption.',
      windy_guidance: 'Standard spray conditions.',
      cold_guidance: 'Excellent for helping crops recover from cold stress.',
      precautions: 'Compatible with most non-alkaline sprays.',
      storage: 'Store away from freezing temperatures.',
      safety_warning: 'Organic formulation. Safe for beneficial bees and soil microbes.'
    }
  },
  {
    id: 7,
    name: 'Kavach Broad-Spectrum Fungicide (Chlorothalonil 75% WP)',
    name_kn: 'ಕವಚ್ ಶಿಲೀಂಧ್ರನಾಶಕ (ಕ್ಲೋರೋಥಲೋನಿಲ್ 75% WP)',
    brand: 'Syngenta Agri',
    category: 2,
    category_name: 'Pesticides',
    category_name_kn: 'ಕೀಟನಾಶಕಗಳು',
    description: 'World-renowned broad-spectrum contact fungicide providing unbeatable defense against Early & Late Blight, Anthracnose and Tikka disease.',
    crop_usage: 'Groundnut, Potato, Chilli, Tomato, Onion, Cotton',
    rating: 4.9,
    active: true,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop',
    variants: [
      { id: 9, size: '250 GM', price: 390, discount: 6, discounted_price: 366, stock: 130 },
      { id: 10, size: '500 GM', price: 740, discount: 10, discounted_price: 666, stock: 75 },
      { id: 11, size: '1 KG', price: 1390, discount: 12, discounted_price: 1223, stock: 30 },
    ],
    guideline: {
      usage_instructions: 'Dissolve 2-2.5g per liter of clean water. Spray thoroughly covering both sides of leaves.',
      dosage: '400-500 grams per acre',
      timing: 'Preventive application before disease spread.',
      sunny_guidance: 'Best applied during morning hours.',
      rainy_guidance: 'High sticking quality; resists wash-off after drying.',
      windy_guidance: 'Avoid spraying in heavy wind.',
      cold_guidance: 'Stir well in water before loading spray tank.',
      precautions: 'Wear protective mask, apron and gloves.',
      storage: 'Store in dry place tightly sealed.',
      safety_warning: 'Keep away from domestic animals and food supplies.'
    }
  },
  {
    id: 8,
    name: 'Mahabeej JS-335 Certified Soybean Seeds',
    name_kn: 'ಮಹಾಬೀಜ್ ಜೆಎಸ್-335 ಪ್ರಮಾಣೀಕೃತ ಸೋಯಾಬಿನ್ ಬೀಜಗಳು',
    brand: 'Mahabeej State Seeds',
    category: 3,
    category_name: 'Seeds',
    category_name_kn: 'ಬೀಜಗಳು',
    description: 'High-germination certified hybrid soybean seeds with 38% protein content, drought tolerance, and high pod yield.',
    crop_usage: 'Soybean, Oilseeds, Kharif Crops',
    rating: 4.8,
    active: true,
    image: 'https://images.unsplash.com/photo-1599818451838-89c0a6b5791c?w=600&auto=format&fit=crop',
    variants: [
      { id: 11, size: '5 KG Bag', price: 680, discount: 5, discounted_price: 646, stock: 160 },
      { id: 12, size: '30 KG Bag', price: 3800, discount: 8, discounted_price: 3496, stock: 45 },
    ],
    guideline: {
      usage_instructions: 'Inoculate with Rhizobium culture and treat with Thiram/Carbendazim before sowing.',
      dosage: '25-30 KG seeds per acre',
      timing: 'Sow with first 75-100mm monsoon rains in June-July.',
      sunny_guidance: 'Ensure adequate soil moisture before sowing.',
      rainy_guidance: 'Do not sow in flooded or water-stagnant soil.',
      windy_guidance: 'Sow at depth of 3-4 cm across wind direction.',
      cold_guidance: 'Requires warm soil temperature above 18°C.',
      precautions: 'Do not drop bags heavily to prevent seed coat damage.',
      storage: 'Stack on wooden pallets in dry aerated godown.',
      safety_warning: 'Certified agricultural seed for agricultural planting only.'
    }
  }
];

export const SEED_INVENTORY = SEED_PRODUCTS.flatMap(p =>
  p.variants.map(v => {
    const available = Math.max(0, v.stock - Math.floor(v.stock * 0.08));
    const reserved = v.stock - available;
    const reorder_level = 15;
    let status = 'ok';
    if (v.stock === 0) status = 'out_of_stock';
    else if (v.stock < reorder_level) status = 'low_stock';
    return {
      id: v.id,
      product_name: p.name,
      brand: p.brand,
      category: p.category_name,
      size: v.size,
      price: v.price,
      stock: v.stock,
      reserved,
      available,
      reorder_level,
      status,
    };
  })
);

export const SEED_FARMERS = [
  {
    id: 9001,
    username: 'rajesh_k',
    first_name: 'Rajesh',
    last_name: 'Kumar',
    email: 'rajesh.k@gmail.com',
    mobile: '9876543210',
    district: 'Dharwad',
    state: 'Karnataka',
    date_joined: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    total_orders: 4,
    total_spending: 8420,
    is_active: true,
  },
  {
    id: 9002,
    username: 'lakshmi_p',
    first_name: 'Lakshmi',
    last_name: 'Patil',
    email: 'lakshmi.p@gmail.com',
    mobile: '9845612378',
    district: 'Belagavi',
    state: 'Karnataka',
    date_joined: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    total_orders: 2,
    total_spending: 3250,
    is_active: true,
  },
  {
    id: 9003,
    username: 'suresh_m',
    first_name: 'Suresh',
    last_name: 'Manjunath',
    email: 'suresh.m@gmail.com',
    mobile: '7760012345',
    district: 'Gadag',
    state: 'Karnataka',
    date_joined: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    total_orders: 6,
    total_spending: 15800,
    is_active: true,
  },
  {
    id: 9004,
    username: 'anitha_r',
    first_name: 'Anitha',
    last_name: 'Reddy',
    email: 'anitha.r@gmail.com',
    mobile: '9632587410',
    district: 'Haveri',
    state: 'Karnataka',
    date_joined: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    total_orders: 1,
    total_spending: 1799,
    is_active: true,
  },
];
