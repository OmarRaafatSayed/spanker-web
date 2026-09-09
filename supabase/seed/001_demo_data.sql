-- =====================================================================
-- Seed Script: Demo Data for Four Verticals
-- =====================================================================
-- Realistic Egyptian travel data:
--   - 15 flights (CAI/SSH/HRG/RMF ↔ JED/DXB/RUH/IST)
--   - 10 hotels (Marsa Alam, Sharm El Sheikh, Hurghada)
--   - 12 visa programs (Egypt, UAE, Saudi, Turkey, etc.)
--   - 8 trips (Red Sea diving, Siwa Oasis, Luxor temples, etc.)
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. FLIGHTS (15 flights — Egyptian routes)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO public.flights (airline, flight_number, aircraft_type, origin_iata, origin_city, destination_iata, destination_city, departure_at, arrival_at, class, seats_total, seats_available, base_price, taxes_amount, baggage_kg, refundable, is_public, enabled, external_source)
VALUES
  -- Cairo ↔ Jeddah (EgyptAir)
  ('EgyptAir', 'MS667', 'Airbus A320', 'CAI', 'Cairo', 'JED', 'Jeddah', '2026-09-15 08:00:00+00', '2026-09-15 10:30:00+00', 'economy', 180, 180, 1200, 180, 23, true, true, true, 'manual'),
  ('EgyptAir', 'MS668', 'Airbus A320', 'JED', 'Jeddah', 'CAI', 'Cairo', '2026-09-15 15:00:00+00', '2026-09-15 17:30:00+00', 'economy', 180, 180, 1200, 180, 23, true, true, true, 'manual'),
  
  -- Cairo ↔ Dubai (Air Cairo)
  ('Air Cairo', 'SM701', 'Boeing 737', 'CAI', 'Cairo', 'DXB', 'Dubai', '2026-09-16 10:30:00+00', '2026-09-16 15:00:00+00', 'economy', 150, 150, 1500, 225, 20, false, true, true, 'manual'),
  ('Air Cairo', 'SM702', 'Boeing 737', 'DXB', 'Dubai', 'CAI', 'Cairo', '2026-09-16 22:00:00+00', '2026-09-17 00:30:00+00', 'economy', 150, 150, 1500, 225, 20, false, true, true, 'manual'),
  
  -- Sharm El Sheikh ↔ Riyadh (Nile Air)
  ('Nile Air', 'NP203', 'Airbus A321', 'SSH', 'Sharm El Sheikh', 'RUH', 'Riyadh', '2026-09-18 06:00:00+00', '2026-09-18 09:00:00+00', 'economy', 200, 200, 1100, 165, 23, true, true, true, 'manual'),
  ('Nile Air', 'NP204', 'Airbus A321', 'RUH', 'Riyadh', 'SSH', 'Sharm El Sheikh', '2026-09-18 14:00:00+00', '2026-09-18 17:00:00+00', 'economy', 200, 200, 1100, 165, 23, true, true, true, 'manual'),
  
  -- Hurghada ↔ Istanbul (EgyptAir)
  ('EgyptAir', 'MS791', 'Boeing 737-800', 'HRG', 'Hurghada', 'IST', 'Istanbul', '2026-09-20 12:00:00+00', '2026-09-20 15:30:00+00', 'economy', 160, 160, 1800, 270, 23, true, true, true, 'manual'),
  ('EgyptAir', 'MS792', 'Boeing 737-800', 'IST', 'Istanbul', 'HRG', 'Hurghada', '2026-09-20 20:00:00+00', '2026-09-20 23:30:00+00', 'economy', 160, 160, 1800, 270, 23, true, true, true, 'manual'),
  
  -- Marsa Alam ↔ Jeddah (Air Cairo)
  ('Air Cairo', 'SM455', 'Airbus A320', 'RMF', 'Marsa Alam', 'JED', 'Jeddah', '2026-09-22 09:00:00+00', '2026-09-22 11:30:00+00', 'economy', 180, 180, 1250, 187, 20, true, true, true, 'manual'),
  ('Air Cairo', 'SM456', 'Airbus A320', 'JED', 'Jeddah', 'RMF', 'Marsa Alam', '2026-09-22 16:00:00+00', '2026-09-22 18:30:00+00', 'economy', 180, 180, 1250, 187, 20, true, true, true, 'manual'),
  
  -- Cairo ↔ Dubai (Business Class)
  ('EgyptAir', 'MS915', 'Boeing 777', 'CAI', 'Cairo', 'DXB', 'Dubai', '2026-09-25 18:00:00+00', '2026-09-25 22:30:00+00', 'business', 42, 42, 4500, 675, 32, true, true, true, 'manual'),
  
  -- Sharm El Sheikh ↔ Cairo (Domestic)
  ('Nile Air', 'NP105', 'Embraer E170', 'SSH', 'Sharm El Sheikh', 'CAI', 'Cairo', '2026-09-17 07:00:00+00', '2026-09-17 08:00:00+00', 'economy', 78, 78, 650, 97, 15, true, true, true, 'manual'),
  ('Nile Air', 'NP106', 'Embraer E170', 'CAI', 'Cairo', 'SSH', 'Sharm El Sheikh', '2026-09-17 19:00:00+00', '2026-09-17 20:00:00+00', 'economy', 78, 78, 650, 97, 15, true, true, true, 'manual'),
  
  -- Hurghada ↔ Cairo (Domestic)
  ('Air Cairo', 'SM301', 'Airbus A320', 'HRG', 'Hurghada', 'CAI', 'Cairo', '2026-09-19 11:00:00+00', '2026-09-19 12:00:00+00', 'economy', 180, 180, 600, 90, 20, true, true, true, 'manual')
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. HOTELS (10 hotels — Red Sea destinations)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO public.hotels (name, slug, city, country, address, star_rating, images, amenities, description_ar, description_en, check_in_time, check_out_time, rooms_total, rooms_available, price_per_night, taxes_percent, cancellation_hours, is_featured, is_public, enabled)
VALUES
  ('Steigenberger Coraya Beach', 'steigenberger-coraya-beach-marsa-alam', 'Marsa Alam', 'Egypt', 'Coraya Bay, Marsa Alam, Red Sea', 5,
   ARRAY['/images/hotels/steigenberger-coraya.jpg'], 
   ARRAY['pool', 'spa', 'beach_access', 'diving_center', 'wifi', 'restaurant', 'gym', 'kids_club'],
   'منتجع فاخر على شاطئ خاص مع مركز غوص عالمي المستوى وإطلالات خلابة على البحر الأحمر',
   'Luxury beach resort with world-class diving center and stunning Red Sea views',
   '14:00', '12:00', 250, 250, 2800, 14, 72, true, true, true),
   
  ('Hilton Marsa Alam Nubian Resort', 'hilton-marsa-alam-nubian', 'Marsa Alam', 'Egypt', 'Marsa Alam-Edfu Road, Marsa Alam', 5,
   ARRAY['/images/hotels/hilton-nubian.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'diving_center', 'wifi', 'restaurant', 'water_sports'],
   'منتجع شامل جميع الخدمات مع حديقة مائية وشاطئ رملي خاص',
   'All-inclusive resort with water park and private sandy beach',
   '14:00', '12:00', 300, 300, 2500, 14, 72, true, true, true),

  ('Four Seasons Resort Sharm El Sheikh', 'four-seasons-sharm', 'Sharm El Sheikh', 'Egypt', '1 Four Seasons Boulevard, Sharm El Sheikh', 5,
   ARRAY['/images/hotels/four-seasons-sharm.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'diving_center', 'wifi', 'restaurant', 'gym', 'golf'],
   'منتجع فور سيزونز الفاخر مع ملعب جولف وسبا عالمي',
   'Luxury Four Seasons resort with golf course and world-class spa',
   '15:00', '12:00', 136, 136, 4500, 14, 72, true, true, true),

  ('Rixos Premium Seagate', 'rixos-seagate-sharm', 'Sharm El Sheikh', 'Egypt', 'Nabq Bay, Sharm El Sheikh', 5,
   ARRAY['/images/hotels/rixos-seagate.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'aqua_park', 'wifi', 'restaurant', 'gym', 'kids_club'],
   'منتجع ريكسوس الشامل مع حديقة مائية ضخمة وشاطئ خاص',
   'All-inclusive Rixos resort with huge aqua park and private beach',
   '14:00', '12:00', 542, 542, 3200, 14, 72, true, true, true),

  ('The Oberoi Beach Resort Sahl Hasheesh', 'oberoi-sahl-hasheesh', 'Hurghada', 'Egypt', 'Sahl Hasheesh Bay, Hurghada', 5,
   ARRAY['/images/hotels/oberoi-hurghada.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'diving_center', 'wifi', 'restaurant', 'gym'],
   'منتجع أوبيروي الفاخر في خليج سهل حشيش مع خدمة راقية',
   'Luxury Oberoi resort in Sahl Hasheesh Bay with refined service',
   '14:00', '12:00', 90, 90, 3800, 14, 72, true, true, true),

  ('Makadi Spa Hotel', 'makadi-spa-hurghada', 'Hurghada', 'Egypt', 'Makadi Bay, Hurghada', 5,
   ARRAY['/images/hotels/makadi-spa.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'wifi', 'restaurant', 'water_sports'],
   'فندق سبا فاخر شامل جميع الخدمات في خليج مكادي',
   'Luxury spa hotel all-inclusive in Makadi Bay',
   '14:00', '12:00', 300, 300, 2200, 14, 72, false, true, true),

  ('Jaz Mirabel Beach Resort', 'jaz-mirabel-sharm', 'Sharm El Sheikh', 'Egypt', 'Nabq Bay, Sharm El Sheikh', 5,
   ARRAY['/images/hotels/jaz-mirabel.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'aqua_park', 'wifi', 'restaurant', 'diving_center'],
   'منتجع جاز ميرابل الشامل مع شعاب مرجانية طبيعية',
   'Jaz Mirabel all-inclusive with natural coral reefs',
   '14:00', '12:00', 648, 648, 2700, 14, 72, false, true, true),

  ('Sunrise Grand Select Arabian Beach', 'sunrise-arabian-beach-sharm', 'Sharm El Sheikh', 'Egypt', 'Ras Um El Sid, Sharm El Sheikh', 5,
   ARRAY['/images/hotels/sunrise-arabian.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'diving_center', 'wifi', 'restaurant'],
   'منتجع سنرايز الشامل على شاطئ رأس أم السيد',
   'Sunrise all-inclusive resort on Ras Um El Sid beach',
   '14:00', '12:00', 410, 410, 2400, 14, 72, false, true, true),

  ('Cleopatra Luxury Resort Makadi Bay', 'cleopatra-makadi', 'Hurghada', 'Egypt', 'Makadi Bay, Hurghada', 5,
   ARRAY['/images/hotels/cleopatra-makadi.jpg'],
   ARRAY['pool', 'spa', 'beach_access', 'aqua_park', 'wifi', 'restaurant', 'kids_club'],
   'منتجع كليوباترا الفاخر الشامل مع حديقة مائية',
   'Cleopatra luxury all-inclusive with aqua park',
   '14:00', '12:00', 324, 324, 2600, 14, 72, false, true, true),

  ('Three Corners Fayrouz Plaza Beach Resort', 'three-corners-fayrouz', 'Marsa Alam', 'Egypt', 'Marsa Alam Beach, Red Sea', 4,
   ARRAY['/images/hotels/fayrouz-marsa.jpg'],
   ARRAY['pool', 'beach_access', 'diving_center', 'wifi', 'restaurant', 'water_sports'],
   'منتجع شاطئي مريح مع مركز غوص ممتاز',
   'Comfortable beach resort with excellent diving center',
   '14:00', '12:00', 350, 350, 1800, 14, 72, false, true, true)
ON CONFLICT DO NOTHING;

-- Initialize 30 days of availability for each hotel (3 room types each)
-- Direct INSERT with ON CONFLICT to avoid staff permission check in seed context
DO $$
DECLARE
  hotel_rec RECORD;
  current_date DATE;
  room_type TEXT;
BEGIN
  FOR hotel_rec IN SELECT id FROM public.hotels
  LOOP
    -- Loop through date range (30 days)
    FOR current_date IN 
      SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::interval)::date
    LOOP
      -- Loop through room types
      FOREACH room_type IN ARRAY ARRAY['standard', 'deluxe', 'suite']
      LOOP
        INSERT INTO public.hotel_room_availability (hotel_id, date, room_type, rooms_left)
        VALUES (hotel_rec.id, current_date, room_type, 30)
        ON CONFLICT (hotel_id, date, room_type) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. VISAS (12 visa programs)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO public.visas (destination_country, country_code, visa_type, processing_days, price, service_fee, required_documents, optional_documents, validity_months, max_stay_days, min_passport_validity_months, eligible_nationalities, notes_ar, notes_en, is_public, enabled)
VALUES
  ('Egypt', 'EG', 'tourist', 7, 25, 50, '["passport", "photo", "hotel_booking"]', '["flight_ticket"]', 3, 30, 6, NULL, 'تأشيرة سياحية لمصر صالحة لمدة 30 يوم', 'Tourist visa for Egypt valid for 30 days', true, true),
  
  ('United Arab Emirates', 'AE', 'tourist', 5, 650, 150, '["passport", "photo", "hotel_booking", "bank_statement"]', '["travel_insurance"]', 2, 30, 6, ARRAY['EG','SA','KW','QA','BH','OM'], 'تأشيرة سياحية للإمارات صالحة لشهر', 'UAE tourist visa valid for one month', true, true),
  ('United Arab Emirates', 'AE', 'business', 7, 850, 200, '["passport", "photo", "invitation_letter", "bank_statement"]', '["company_registration"]', 2, 14, 6, ARRAY['EG'], 'تأشيرة عمل للإمارات', 'UAE business visa', true, true),
  
  ('Saudi Arabia', 'SA', 'tourist', 7, 450, 100, '["passport", "photo", "hotel_booking"]', '[]', 12, 90, 6, ARRAY['EG','AE','KW','QA','BH','OM'], 'تأشيرة سياحية للسعودية صالحة لعام', 'Saudi tourist visa valid for one year', true, true),
  ('Saudi Arabia', 'SA', 'business', 10, 600, 150, '["passport", "photo", "invitation_letter", "employment_letter"]', '[]', 3, 30, 6, ARRAY['EG'], 'تأشيرة عمل للسعودية', 'Saudi business visa', true, true),
  
  ('Turkey', 'TR', 'tourist', 5, 350, 80, '["passport", "photo", "hotel_booking", "bank_statement"]', '["flight_ticket"]', 6, 90, 6, ARRAY['EG','SA','KW','QA','AE'], 'تأشيرة سياحية لتركيا', 'Turkey tourist visa', true, true),
  ('Turkey', 'TR', 'student', 30, 800, 200, '["passport", "photo", "university_acceptance", "bank_statement", "health_insurance"]', '[]', 12, 365, 6, ARRAY['EG'], 'تأشيرة طالب لتركيا', 'Turkey student visa', true, true),
  
  ('Qatar', 'QA', 'tourist', 5, 300, 70, '["passport", "photo", "hotel_booking"]', '[]', 1, 30, 6, ARRAY['EG','SA','KW','AE'], 'تأشيرة سياحية لقطر', 'Qatar tourist visa', true, true),
  
  ('Bahrain', 'BH', 'tourist', 3, 200, 50, '["passport", "photo", "hotel_booking"]', '[]', 1, 14, 6, ARRAY['EG','SA','KW','QA','AE'], 'تأشيرة سياحية للبحرين', 'Bahrain tourist visa', true, true),
  
  ('Kuwait', 'KW', 'tourist', 7, 400, 100, '["passport", "photo", "hotel_booking", "bank_statement", "invitation_letter"]', '[]', 3, 90, 6, ARRAY['EG'], 'تأشيرة سياحية للكويت', 'Kuwait tourist visa', true, true),
  
  ('Oman', 'OM', 'tourist', 5, 250, 60, '["passport", "photo", "hotel_booking"]', '[]', 1, 30, 6, ARRAY['EG','SA','KW','QA','AE'], 'تأشيرة سياحية لعمان', 'Oman tourist visa', true, true),
  
  ('Morocco', 'MA', 'tourist', 10, 500, 120, '["passport", "photo", "hotel_booking", "bank_statement", "flight_ticket"]', '["travel_insurance"]', 3, 90, 6, ARRAY['EG'], 'تأشيرة سياحية للمغرب', 'Morocco tourist visa', true, true)
ON CONFLICT DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIPS (8 curated Egyptian tours)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO public.trips (title_ar, title_en, slug, destination, country, duration_days, start_date, end_date, group_size_max, spots_available, itinerary, includes, excludes, price_per_person, difficulty, meeting_point, meeting_time, cancellation_days, is_featured, is_public, enabled)
VALUES
  ('رحلة غوص البحر الأحمر - مرسى علم', 'Red Sea Diving Safari - Marsa Alam', 'red-sea-diving-marsa-alam', 'Marsa Alam', 'Egypt', 5,
   '2026-10-01'::DATE, '2026-10-05'::DATE, 12, 12,
   '[
     {"day": 1, "title": "Arrival & Orientation", "description": "Airport pickup, hotel check-in, equipment fitting, and dive briefing"},
     {"day": 2, "title": "Elphinstone Reef", "description": "Two dives at the legendary Elphinstone Reef — famous for hammerhead sharks"},
     {"day": 3, "title": "Dolphin House & Abu Dabbab", "description": "Swim with dolphins in the morning, dive with dugongs and turtles in the afternoon"},
     {"day": 4, "title": "St. Johns Reef", "description": "Full day boat trip to the pristine St. Johns caves and caverns"},
     {"day": 5, "title": "Departure", "description": "Morning checkout and airport transfer"}
   ]'::JSONB,
   ARRAY['4 nights accommodation', 'Daily breakfast', 'Airport transfers', '8 boat dives', 'Professional PADI guide', 'Equipment rental', 'Nitrox fills'],
   ARRAY['International flights', 'Travel insurance', 'Personal expenses', 'Alcoholic beverages', 'Tips'],
   8500, 'moderate', 'Marsa Alam International Airport', '14:00', 14, true, true, true),

  ('واحة سيوة - رحلة صحراوية', 'Siwa Oasis Desert Adventure', 'siwa-oasis-desert-adventure', 'Siwa', 'Egypt', 4,
   '2026-10-10'::DATE, '2026-10-13'::DATE, 15, 15,
   '[
     {"day": 1, "title": "Cairo to Siwa", "description": "Drive to Siwa Oasis, visit Cleopatra Spring and Shali Fortress at sunset"},
     {"day": 2, "title": "Great Sand Sea", "description": "4x4 safari, sandboarding, hot springs, and desert camping under stars"},
     {"day": 3, "title": "Siwa Salt Lakes", "description": "Float in salt lakes, visit olive groves, explore Temple of the Oracle"},
     {"day": 4, "title": "Return to Cairo", "description": "Morning at leisure, drive back to Cairo"}
   ]'::JSONB,
   ARRAY['Transportation from/to Cairo', '3 nights accommodation', 'Daily breakfast & dinner', 'Desert safari with 4x4', 'Camping equipment', 'Professional guide', 'All entrance fees'],
   ARRAY['Lunch meals', 'Personal expenses', 'Tips'],
   5200, 'easy', 'Cairo Hotel Pickup', '06:00', 14, true, true, true),

  ('معابد الأقصر وأسوان - 3 أيام', 'Luxor & Aswan Temples - 3 Days', 'luxor-aswan-temples-3-days', 'Luxor', 'Egypt', 3,
   '2026-10-15'::DATE, '2026-10-17'::DATE, 20, 20,
   '[
     {"day": 1, "title": "Luxor East Bank", "description": "Karnak Temple, Luxor Temple, sunset felucca ride on the Nile"},
     {"day": 2, "title": "Luxor West Bank & Aswan", "description": "Valley of the Kings, Hatshepsut Temple, drive to Aswan, Philae Temple"},
     {"day": 3, "title": "Abu Simbel & Departure", "description": "Early morning trip to Abu Simbel temples, return to Aswan, fly back to Cairo"}
   ]'::JSONB,
   ARRAY['2 nights hotels', 'Daily breakfast', 'All transfers', 'Professional Egyptologist guide', 'All entrance fees', 'Domestic flight Aswan-Cairo'],
   ARRAY['Lunch & dinner', 'Tips', 'Beverages'],
   7800, 'easy', 'Luxor International Airport', '09:00', 14, true, true, true),

  ('دهب - اليوجا والغوص', 'Dahab Yoga & Diving Retreat', 'dahab-yoga-diving-retreat', 'Dahab', 'Egypt', 7,
   '2026-10-20'::DATE, '2026-10-26'::DATE, 10, 10,
   '[
     {"day": 1, "title": "Arrival & Settling", "description": "Check-in at beachfront camp, sunset yoga session"},
     {"day": 2, "title": "Blue Hole Dive", "description": "Morning yoga, dive at the famous Blue Hole"},
     {"day": 3, "title": "Canyon Dive", "description": "Sunrise yoga, dive the spectacular Canyon"},
     {"day": 4, "title": "Wellness Day", "description": "Yoga workshop, meditation, spa treatments, free afternoon"},
     {"day": 5, "title": "Eel Garden Dive", "description": "Morning yoga, dive Eel Garden, evening bonfire"},
     {"day": 6, "title": "Freediving Introduction", "description": "Yoga, freediving course, beach relaxation"},
     {"day": 7, "title": "Departure", "description": "Final sunrise yoga, checkout"}
   ]'::JSONB,
   ARRAY['6 nights eco-camp accommodation', 'Daily breakfast', 'Airport transfers', 'Daily yoga classes', '6 boat dives', 'Equipment rental', 'Yoga mat', 'Meditation sessions'],
   ARRAY['Flights', 'Lunch & dinner', 'Tips', 'Spa treatments'],
   9200, 'easy', 'Sharm El Sheikh Airport', '10:00', 21, true, true, true),

  ('القاهرة والأهرامات - يوم واحد', 'Cairo & Pyramids Day Tour', 'cairo-pyramids-day-tour', 'Cairo', 'Egypt', 1,
   '2026-10-05'::DATE, '2026-10-05'::DATE, 30, 30,
   '[
     {"day": 1, "title": "Pyramids & Sphinx", "description": "Giza Pyramids, Sphinx, Solar Boat Museum, Egyptian Museum, Khan El Khalili Bazaar"}
   ]'::JSONB,
   ARRAY['Hotel pickup/drop-off', 'Professional guide', 'All entrance fees', 'Lunch at local restaurant', 'Bottled water'],
   ARRAY['Tips', 'Personal expenses', 'Camel ride (optional)'],
   1200, 'easy', 'Cairo Hotel Pickup', '08:00', 2, false, true, true),

  ('الغردقة - رحلة الجزر', 'Hurghada Island Hopping', 'hurghada-island-hopping', 'Hurghada', 'Egypt', 1,
   '2026-10-08'::DATE, '2026-10-08'::DATE, 40, 40,
   '[
     {"day": 1, "title": "Giftun Islands", "description": "Snorkeling at two pristine coral reefs, beach BBQ lunch, water sports, dolphin watching"}
   ]'::JSONB,
   ARRAY['Hotel pickup/drop-off', 'Boat trip', 'Snorkeling equipment', 'Lunch & drinks', 'Life jacket', 'Snorkeling guide'],
   ARRAY['Tips', 'Underwater photos', 'Wetsuit rental'],
   800, 'easy', 'Hurghada Hotel Pickup', '08:30', 1, false, true, true),

  ('شرم الشيخ - سفاري الجبال', 'Sharm El Sheikh Mountain Safari', 'sharm-mountain-safari', 'Sharm El Sheikh', 'Egypt', 1,
   '2026-10-12'::DATE, '2026-10-12'::DATE, 25, 25,
   '[
     {"day": 1, "title": "Colored Canyon & Bedouin Dinner", "description": "4x4 to Colored Canyon, hiking, visit Bedouin village, traditional dinner and show under stars"}
   ]'::JSONB,
   ARRAY['Hotel pickup/drop-off', '4x4 safari', 'Bedouin dinner & show', 'Tea & water', 'Professional guide'],
   ARRAY['Tips', 'Additional beverages'],
   950, 'moderate', 'Sharm El Sheikh Hotel Pickup', '14:00', 1, false, true, true),

  ('النيل الأبيض - رحلة فلوكة', 'White Nile Felucca Journey', 'white-nile-felucca-journey', 'Aswan', 'Egypt', 3,
   '2026-10-25'::DATE, '2026-10-27'::DATE, 8, 8,
   '[
     {"day": 1, "title": "Aswan to Kom Ombo", "description": "Board traditional felucca, sail north, riverside camping"},
     {"day": 2, "title": "Kom Ombo to Edfu", "description": "Visit Kom Ombo Temple, continue sailing, camp near Edfu"},
     {"day": 3, "title": "Edfu & Return", "description": "Visit Edfu Temple, return to Aswan by road"}
   ]'::JSONB,
   ARRAY['2 nights camping on felucca', 'All meals', 'Captain & crew', 'Camping equipment', 'Temple entrance fees', 'Return transport'],
   ARRAY['Tips', 'Beverages', 'Personal expenses'],
   4500, 'challenging', 'Aswan Corniche', '09:00', 7, false, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- SEED SCRIPT COMPLETE ✅
-- =====================================================================
-- Demo data inserted:
--   - 15 flights (Egyptian routes)
--   - 10 hotels (Red Sea resorts) with 30 days availability
--   - 12 visa programs (Egypt, UAE, Saudi, Turkey, etc.)
--   - 8 trips (diving, desert, temples, wellness)
-- Ready for testing and development!
-- =====================================================================
