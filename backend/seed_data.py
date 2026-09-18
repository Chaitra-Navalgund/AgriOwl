import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agriowl.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Category, Product, ProductVariant, ProductGuideline
from apps.orders.models import Address, Order, OrderItem, OrderStatusHistory

User = get_user_model()

def seed_database():
    print("🌱 Seeding AgriOwl Database...")
    
    # 1. Create Super Admin / Admin User
    admin, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@agriowl.in',
            'first_name': 'AgriOwl Admin',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'preferred_language': 'en'
        }
    )
    if created:
        admin.set_password('AgriOwl2026!')
        admin.save()
        print("  ✅ Admin user created: admin / AgriOwl2026!")
    else:
        print("  ℹ️ Admin user already exists.")

    # 2. Create Demo Farmer User
    farmer, created = User.objects.get_or_create(
        username='basavaraj',
        defaults={
            'email': 'basavaraj@farmer.in',
            'first_name': 'Basavaraj Patil',
            'mobile': '9876543210',
            'role': 'FARMER',
            'preferred_language': 'kn'
        }
    )
    if created:
        farmer.set_password('Farmer123!')
        farmer.save()
        print("  ✅ Demo farmer user created: basavaraj / Farmer123!")

    # 3. Create Categories (Excluding Tools as requested)
    categories_data = [
        {'name': 'Fertilizers', 'name_kn': 'ಗೊಬ್ಬರಗಳು', 'description': 'Soil nutrients, organic & inorganic fertilizers for enhanced yield.', 'icon': 'Sprout'},
        {'name': 'Pesticides', 'name_kn': 'ಕೀಟನಾಶಕಗಳು', 'description': 'Insecticides & pesticides for crop health protection.', 'icon': 'Bug'},
        {'name': 'Seeds', 'name_kn': 'ಬೀಜಗಳು', 'description': 'High-yield hybrid seeds certified for Karnataka climate.', 'icon': 'Wheat'},
        {'name': 'Crop Protection', 'name_kn': 'ಬೆಳೆ ರಕ್ಷಣೆ', 'description': 'Fungicides, herbicides & anti-disease treatments.', 'icon': 'ShieldAlert'},
        {'name': 'Plant Nutrition', 'name_kn': 'ಸಸ್ಯ ಪೋಷಣೆ', 'description': 'Micronutrient foliar sprays & growth boosters.', 'icon': 'Zap'},
    ]

    cat_map = {}
    for cat_info in categories_data:
        cat, _ = Category.objects.get_or_create(
            name=cat_info['name'],
            defaults={
                'name_kn': cat_info['name_kn'],
                'description': cat_info['description'],
                'icon': cat_info['icon']
            }
        )
        cat_map[cat_info['name']] = cat
    print(f"  ✅ {len(cat_map)} Categories ready.")

    # 4. Create Products, Variants & Guidelines
    products_data = [
        {
            'category': 'Fertilizers',
            'name': 'NPK 19-19-19 Water Soluble Fertilizer',
            'name_kn': 'ಎನ್.ಪಿ.ಕೆ 19-19-19 ನೀರಿನಲ್ಲಿ ಕರಗುವ ಗೊಬ್ಬರ',
            'brand': 'Iffco Agri',
            'description': 'Balanced water-soluble fertilizer providing nitrogen, phosphorus, and potassium equally for early crop growth stage.',
            'crop_usage': 'Cotton, Sugarcane, Chilli, Soybean, Maize',
            'rating': 4.8,
            'image': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '1 KG', 'price': 220.00, 'discount': 10, 'stock': 120},
                {'size': '5 KG', 'price': 980.00, 'discount': 12, 'stock': 50},
                {'size': '25 KG', 'price': 4200.00, 'discount': 15, 'stock': 30},
            ],
            'guideline': {
                'usage_instructions': 'Dissolve 5 grams in 1 liter of clean water. Apply via foliar spray or drip irrigation every 12-15 days during vegetative growth.',
                'dosage': '5g per liter of water (2-3 KG per acre)',
                'timing': 'Apply early morning (6 AM - 9 AM) or late evening when stomata are open.',
                'sunny_guidance': 'Ideal for sunny days. Ensure adequate soil moisture before spraying.',
                'rainy_guidance': 'Avoid spraying if rainfall is forecasted within 3-4 hours.',
                'windy_guidance': 'Do not spray when wind velocity exceeds 15 km/h.',
                'cold_guidance': 'Dissolve thoroughly in warm water if water temperature is below 15°C.',
                'precautions': 'Wear rubber gloves and protective goggles. Wash hands thoroughly with soap after handling.',
                'storage': 'Store in cool, dry place away from direct sunlight and children.',
                'safety_warning': 'Use only according to the product label and applicable agricultural guidance. Do not exceed the recommended dosage.'
            }
        },
        {
            'category': 'Pesticides',
            'name': 'Coragen Insecticide (Chlorantraniliprole 18.5% SC)',
            'name_kn': 'ಕೋರಾಜೆನ್ ಕೀಟನಾಶಕ',
            'brand': 'FMC Bio',
            'description': 'Advanced broad-spectrum insecticide effective against Stem Borer, Bollworm, and Fruit Borer pests.',
            'crop_usage': 'Cotton, Paddy, Sugarcane, Chilli, Tomato',
            'rating': 4.9,
            'image': 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '60 ML', 'price': 850.00, 'discount': 8, 'stock': 80},
                {'size': '150 ML', 'price': 1950.00, 'discount': 10, 'stock': 40},
            ],
            'guideline': {
                'usage_instructions': 'Mix 0.4 ml per liter of water. Spray evenly over leaves showing pest damage.',
                'dosage': '60 ml per acre in 150 liters of water',
                'timing': 'Apply at first sign of pest infestation or egg hatching stage.',
                'sunny_guidance': 'Spray early morning. Avoid application during intense midday sun.',
                'rainy_guidance': 'Rainfast within 2 hours. Re-apply if heavy rain occurs within 2 hours.',
                'windy_guidance': 'Avoid application in high winds to prevent drift to non-target crops.',
                'cold_guidance': 'No temperature restriction. Ensure uniform agitation.',
                'precautions': 'Full protective suits, gloves, mask required. Keep away from water bodies and honey bees.',
                'storage': 'Store locked in original container away from foodstuffs.',
                'safety_warning': 'Use only according to the product label and applicable agricultural guidance. Do not exceed the recommended dosage.'
            }
        },
        {
            'category': 'Seeds',
            'name': 'Byadgi Hybrid Chilli Seeds (KDL-20)',
            'name_kn': 'ಬ್ಯಾಡಗಿ ಹೈಬ್ರಿಡ್ ಮೆಣಸಿನಕಾಯಿ ಬೀಜಗಳು',
            'brand': 'Karnataka State Seeds Corp',
            'description': 'High-color intensity, moderate pungency Byadgi chilli seeds specifically bred for North Karnataka region.',
            'crop_usage': 'Chilli, Dry Red Pepper',
            'rating': 4.7,
            'image': 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '100 Grams', 'price': 450.00, 'discount': 5, 'stock': 200},
                {'size': '500 Grams', 'price': 2100.00, 'discount': 12, 'stock': 90},
            ],
            'guideline': {
                'usage_instructions': 'Treat seeds with Trichoderma (5g/kg) before nursery bed sowing. Transplant 40-day-old seedlings into main field.',
                'dosage': '100-150 grams per acre nursery',
                'timing': 'Sow nursery beds during June-July or October-November.',
                'sunny_guidance': 'Maintain optimum soil moisture in nursery beds using shade nets.',
                'rainy_guidance': 'Provide raised nursery beds with proper drainage channels to prevent waterlogging.',
                'windy_guidance': 'Protect young transplanted seedlings with windbreaks or rows of maize.',
                'cold_guidance': 'Cold temperatures slow germination. Maintain nursery bed warmth.',
                'precautions': 'Do not handle treated seeds with bare hands. Avoid swallowing.',
                'storage': 'Store in airtight containers at room temperature in dark place.',
                'safety_warning': 'Certified hybrid seeds. Treated with fungicide - not for human or animal consumption.'
            }
        },
        {
            'category': 'Seeds',
            'name': 'Bt Cotton Hybrid Seeds (Bollgard II)',
            'name_kn': 'ಬಿಟಿ ಹತ್ತಿ ಹೈಬ್ರಿಡ್ ಬೀಜಗಳು',
            'brand': 'Mahyco Seeds',
            'description': 'High yield pink bollworm resistant hybrid cotton seed suitable for rainfed and irrigated black soils.',
            'crop_usage': 'Cotton',
            'rating': 4.9,
            'image': 'https://images.unsplash.com/photo-1605001011156-cbf0b0f67a31?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '475 Gram Packet', 'price': 860.00, 'discount': 0, 'stock': 300},
            ],
            'guideline': {
                'usage_instructions': 'Plant non-Bt refuge seeds along borders as recommended. Dibble seeds 2-3 cm deep at 90cm x 60cm spacing.',
                'dosage': '2 packets per acre',
                'timing': 'Sow at onset of monsoon (June-July).',
                'sunny_guidance': 'Plant in well-drained deep black soil with good sunlight exposure.',
                'rainy_guidance': 'Sow immediately after first soaking rains of 50mm.',
                'windy_guidance': 'Ensure strong root anchorage through earthing up at 45 days.',
                'cold_guidance': 'Not sensitive at germination phase under monsoon conditions.',
                'precautions': 'Sow non-Bt refuge seeds around Bt cotton field to delay pest resistance.',
                'storage': 'Keep away from moisture and direct sun in dry place.',
                'safety_warning': 'Certified Bt Cotton Seed. Follow non-Bt refuge planting rules strictly.'
            }
        },
        {
            'category': 'Crop Protection',
            'name': 'Bavistin Fungicide (Carbendazim 50% WP)',
            'name_kn': 'ಬಾವಿಸ್ಟಿನ್ ಶಿಲೀಂಧ್ರನಾಶಕ',
            'brand': 'Crystal Crop Care',
            'description': 'Systemic fungicide with protective and curative action against Powdery Mildew, Anthracnose, and Tikka leaf spot.',
            'crop_usage': 'Groundnut, Soybean, Paddy, Grapes, Mango',
            'rating': 4.6,
            'image': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '250 Grams', 'price': 320.00, 'discount': 8, 'stock': 150},
                {'size': '500 Grams', 'price': 590.00, 'discount': 10, 'stock': 75},
            ],
            'guideline': {
                'usage_instructions': 'Mix 2g per liter of water. Spray thoroughly on both leaf surfaces at initial symptom stage.',
                'dosage': '200-250 grams per acre in 150 liters water',
                'timing': 'Apply every 10-14 days depending on disease severity.',
                'sunny_guidance': 'Spray when leaves are dry. Morning hours preferred.',
                'rainy_guidance': 'Requires 3-4 rain-free hours for maximum systemic absorption.',
                'windy_guidance': 'Avoid drift to water sources or adjacent non-target crops.',
                'cold_guidance': 'Effective in cool, humid weather when fungal diseases spread rapidly.',
                'precautions': 'Do not mix with alkaline substances. Wear mask during spraying.',
                'storage': 'Store in sealed original packet in dry store room.',
                'safety_warning': 'Use only according to the product label and applicable agricultural guidance. Do not exceed the recommended dosage.'
            }
        },
        {
            'category': 'Plant Nutrition',
            'name': 'Bio-Zyme Plant Growth Booster Spray',
            'name_kn': 'ಬಯೋ-ಜೈಮ್ ಸಸ್ಯ ಬೆಳವಣಿಗೆಯ ವರ್ಧಕ',
            'brand': 'Seaweed Organics',
            'description': '100% Organic seaweed extract enriched with amino acids and natural humic acid to boost flower retention and root yield.',
            'crop_usage': 'All Field Crops, Horticulture, Vegetables & Spices',
            'rating': 4.8,
            'image': 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&auto=format&fit=crop',
            'variants': [
                {'size': '500 ML', 'price': 480.00, 'discount': 15, 'stock': 110},
                {'size': '1 Liter', 'price': 890.00, 'discount': 18, 'stock': 65},
            ],
            'guideline': {
                'usage_instructions': 'Mix 2 ml per liter of water. Spray during flowering, fruit set, and stress conditions.',
                'dosage': '300-500 ml per acre',
                'timing': 'Apply at pre-flowering stage and 15 days after fruit set.',
                'sunny_guidance': 'Best applied early morning for fast stomatal uptake.',
                'rainy_guidance': 'Bio-stimulant is organic; repeat spray if rained off immediately.',
                'windy_guidance': 'Normal spraying safety precautions apply.',
                'cold_guidance': 'Helps crops recover from frost and winter cold shock.',
                'precautions': 'Shake bottle well before use. Compatible with most pesticides.',
                'storage': 'Keep away from intense heat and direct sunlight.',
                'safety_warning': 'Organic Plant Growth Regulator. Safe for non-target organisms.'
            }
        }
    ]

    for p_data in products_data:
        cat = cat_map[p_data['category']]
        prod, _ = Product.objects.get_or_create(
            name=p_data['name'],
            defaults={
                'category': cat,
                'name_kn': p_data['name_kn'],
                'brand': p_data['brand'],
                'description': p_data['description'],
                'crop_usage': p_data['crop_usage'],
                'rating': p_data['rating'],
                'image': p_data['image']
            }
        )

        for v_data in p_data['variants']:
            ProductVariant.objects.get_or_create(
                product=prod,
                size=v_data['size'],
                defaults={
                    'price': v_data['price'],
                    'discount': v_data['discount'],
                    'stock': v_data['stock']
                }
            )

        g_data = p_data['guideline']
        ProductGuideline.objects.get_or_create(
            product=prod,
            defaults={
                'usage_instructions': g_data['usage_instructions'],
                'dosage': g_data['dosage'],
                'timing': g_data['timing'],
                'sunny_guidance': g_data['sunny_guidance'],
                'rainy_guidance': g_data['rainy_guidance'],
                'windy_guidance': g_data['windy_guidance'],
                'cold_guidance': g_data['cold_guidance'],
                'precautions': g_data['precautions'],
                'storage': g_data['storage'],
                'safety_warning': g_data['safety_warning']
            }
        )

    print(f"  ✅ Seeded {len(products_data)} Products with variants & complete guidelines!")

    # 5. Create Sample Demo Order for Live Tracking
    if not Order.objects.filter(order_id='AGR12345').exists():
        sample_addr = Address.objects.create(
            user=farmer,
            full_name='Basavaraj Patil',
            mobile='9876543210',
            house_no='Plot #45, Near Govt School',
            village='Navalgund',
            taluk='Navalgund',
            district='Dharwad',
            state='Karnataka',
            pincode='582208',
            latitude=15.5647,
            longitude=75.3640
        )

        sample_order = Order.objects.create(
            order_id='AGR12345',
            user=farmer,
            address=sample_addr,
            total_amount=1950.00,
            discount=150.00,
            delivery_charge=0.00,
            payment_method='COD',
            payment_status='Pending on COD',
            order_status=3, # Out for Delivery
            current_lat=15.4200,
            current_lng=75.2500,
            estimated_delivery='Today by 4:00 PM'
        )

        coragen_prod = Product.objects.get(name__icontains='Coragen')
        coragen_var = coragen_prod.variants.first()

        OrderItem.objects.create(
            order=sample_order,
            product=coragen_prod,
            variant=coragen_var,
            quantity=1,
            unit_price=1950.00,
            total_price=1950.00
        )

        history_steps = [
            (0, 'Order Placed', 'Farmer placed order online.'),
            (1, 'Confirmed', 'Admin verified inventory and approved order.'),
            (2, 'Shipped', 'Dispatched from Hubballi Central Warehouse.'),
            (3, 'Out for Delivery', 'Assigned to AgriOwl Express Delivery Agent - Vehicle KA-25-EA-4412.')
        ]

        for st, display, notes in history_steps:
            OrderStatusHistory.objects.create(
                order=sample_order,
                status=st,
                status_display=display,
                updated_by='System Log',
                notes=notes
            )

        print("  ✅ Created Sample Order #AGR12345 (Out for Delivery) for live tracking demonstration!")
    else:
        print("  ℹ️ Sample Order #AGR12345 already exists.")
    print("\n🎉 Database Seeding Complete!")

if __name__ == '__main__':
    seed_database()
