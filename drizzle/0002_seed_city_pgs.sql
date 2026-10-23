-- Seed 60 PGs in each of Hyderabad, Bangalore, Anantapur, Dharmavaram,
-- and Tirupati (300 total). Every PG uses a distinct locality/street
-- and is filled with ~20 mock tenants (plus rooms and a current invoice).
--
-- Idempotent: skips when system_settings.key = 'seed.city_pgs_v1' exists.
-- Mock logins use password "password123".
--   Owners:  owner.hyderabad@pgapp.local, owner.bangalore@pgapp.local,
--            owner.anantapur@pgapp.local, owner.dharmavaram@pgapp.local,
--            owner.tirupati@pgapp.local
--   Tenants: tenant.<city>.<pg>.<n>@pgapp.local  e.g. tenant.hyd.01.01@pgapp.local

DO $$
DECLARE
  password_hash text := '724473976c567c6d87bc1ce308ad1c34:7642b9d0b05e016b3a45628675cec81ebaf8df6ff75f03efe2c17245bfab63c6086b6a477c5536709c0d8d7fbbd7d140e5e44522830813010beb1fcd70344dba';
  first_names text[] := ARRAY[
    'Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Karthik', 'Sneha', 'Ananya', 'Priya',
    'Divya', 'Meera', 'Rahul', 'Nikhil', 'Suresh', 'Pooja', 'Kavya', 'Deepak',
    'Harsha', 'Nandini', 'Teja', 'Swathi', 'Arjun', 'Lakshmi', 'Ravi', 'Bhavana'
  ];
  last_names text[] := ARRAY[
    'Reddy', 'Rao', 'Sharma', 'Iyer', 'Nair', 'Patel', 'Singh', 'Gupta',
    'Naidu', 'Prasad', 'Kumar', 'Das'
  ];
  amenity_sets jsonb[] := ARRAY[
    '["Wi-Fi", "AC", "Laundry", "Power Backup", "Mess / Food"]'::jsonb,
    '["Wi-Fi", "Gym", "CCTV", "Hot Water", "Parking"]'::jsonb,
    '["Wi-Fi", "Laundry", "Mess / Food", "Water Purifier", "Housekeeping"]'::jsonb,
    '["Wi-Fi", "AC", "Parking", "CCTV", "Power Backup"]'::jsonb,
    '["Wi-Fi", "Mess / Food", "Study Rooms", "Hot Water", "Laundry"]'::jsonb
  ];
  brands text[] := ARRAY['Nest', 'Comfort', 'Heights', 'Stay', 'Residency'];
  streets text[] := ARRAY['1st Cross', '2nd Main', '3rd Cross', '4th Main', 'Service Road'];
  city_rec record;
  loc_idx int;
  brand_idx int;
  pg_idx int;
  owner_id uuid;
  pg_id uuid;
  room_ids uuid[];
  room_id uuid;
  tenant_n int;
  room_slot int;
  first_name text;
  last_name text;
  tenant_email text;
  profile_id uuid;
  tenant_id uuid;
  rent_status text;
  rent_min numeric;
  rent_max numeric;
  room_price numeric;
  room_n int;
  cap int;
  house_no text;
  locality text;
  brand text;
  street text;
  pg_name text;
  address text;
  pincode text;
  amenity jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM system_settings WHERE key = 'seed.city_pgs_v1') THEN
    RAISE NOTICE 'city PG seed already applied — skipping';
    RETURN;
  END IF;

  FOR city_rec IN
    SELECT * FROM (
      VALUES
        (
          'Hyderabad'::text, 'Telangana'::text, 'hyd'::text, '500032'::text,
          'Kavya Reddy'::text, 'owner.hyderabad@pgapp.local'::text, '+919100000001'::text,
          9000::numeric, 17000::numeric,
          ARRAY[
            'Gachibowli', 'Madhapur', 'HITEC City', 'Kondapur', 'Kukatpally', 'Ameerpet',
            'Banjara Hills', 'Jubilee Hills', 'Secunderabad', 'Begumpet', 'Dilsukhnagar', 'LB Nagar'
          ]::text[]
        ),
        (
          'Bangalore', 'Karnataka', 'blr', '560095',
          'Arjun Rao', 'owner.bangalore@pgapp.local', '+919100000002',
          9500, 18500,
          ARRAY[
            'Koramangala', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Marathahalli',
            'BTM Layout', 'Jayanagar', 'Hebbal', 'Yelahanka', 'Banashankari', 'Bellandur'
          ]
        ),
        (
          'Anantapur', 'Andhra Pradesh', 'atp', '515001',
          'Suresh Naidu', 'owner.anantapur@pgapp.local', '+919100000003',
          4500, 9000,
          ARRAY[
            'Clock Tower', 'Sapthagiri Circle', 'RTC Bus Stand', 'SK University Road', 'Old Town', 'Railway Colony',
            'Kamalanagar', 'Adimurthy Nagar', 'JNTU Area', 'Sangamesh Nagar', 'New Town', 'Court Road'
          ]
        ),
        (
          'Dharmavaram', 'Andhra Pradesh', 'dmm', '515671',
          'Lakshmi Devi', 'owner.dharmavaram@pgapp.local', '+919100000004',
          4000, 8000,
          ARRAY[
            'Silk Market', 'Bus Stand Road', 'Railway Station Area', 'Temple Street', 'Gandhi Circle', 'Old Town',
            'New Colony', 'College Road', 'Bypass Road', 'Market Yard', 'Housing Board Colony', 'Peddacheruvu'
          ]
        ),
        (
          'Tirupati', 'Andhra Pradesh', 'tpt', '517501',
          'Venkatesh Reddy', 'owner.tirupati@pgapp.local', '+919100000005',
          5500, 12000,
          ARRAY[
            'Alipiri', 'Kapila Theertham', 'Renigunta Road', 'SV University', 'Balaji Colony', 'Bhavani Nagar',
            'Tilak Road', 'Korlagunta', 'AIR Bypass', 'Chandragiri Road', 'Leela Mahal Circle', 'Gandhi Road'
          ]
        )
    ) AS t(city, state, code, pincode, owner_name, owner_email, owner_phone, rent_min, rent_max, localities)
  LOOP
    SELECT id INTO owner_id FROM profiles WHERE email = city_rec.owner_email;
    IF owner_id IS NULL THEN
      INSERT INTO profiles (full_name, email, password_hash, role, phone)
      VALUES (city_rec.owner_name, city_rec.owner_email, password_hash, 'MANAGER', city_rec.owner_phone)
      RETURNING id INTO owner_id;
    END IF;

    pg_idx := 0;
    FOR loc_idx IN 1..array_length(city_rec.localities, 1) LOOP
      locality := city_rec.localities[loc_idx];
      FOR brand_idx IN 1..5 LOOP
        pg_idx := pg_idx + 1;
        brand := brands[brand_idx];
        street := streets[brand_idx];
        house_no := format('%s-%s-%s', loc_idx + 10, brand_idx, 18 + loc_idx);
        pg_name := format('%s %s PG', locality, brand);
        address := format('%s, %s, %s', house_no, street, locality);
        pincode := (city_rec.pincode::int + loc_idx - 1)::text;
        rent_min := city_rec.rent_min + (brand_idx - 1) * 400;
        rent_max := city_rec.rent_max + (brand_idx - 1) * 300;
        amenity := amenity_sets[((pg_idx - 1) % array_length(amenity_sets, 1)) + 1];

        INSERT INTO pg_properties (
          owner_id, name, description, address, city, state, pincode,
          amenities, total_rooms, occupied_rooms, rent_range_min, rent_range_max, is_active
        ) VALUES (
          owner_id,
          pg_name,
          format(
            'A well-kept paying guest stay in %s, %s — close to local transit, food, and daily conveniences.',
            locality, city_rec.city
          ),
          address,
          city_rec.city,
          city_rec.state,
          pincode,
          amenity,
          16,
          12,
          rent_min,
          rent_max,
          true
        )
        RETURNING id INTO pg_id;

        room_ids := ARRAY[]::uuid[];

        FOR room_n IN 1..16 LOOP
          -- 101-108 double occupancy, 109-116 singles. First 12 rooms are filled.
          cap := CASE WHEN room_n <= 8 THEN 2 ELSE 1 END;
          room_price := rent_min + ((room_n - 1) * ((rent_max - rent_min) / 15));
          INSERT INTO rooms (pg_id, room_number, price, capacity, current_occupancy)
          VALUES (
            pg_id,
            (100 + room_n)::text,
            round(room_price, 2),
            cap,
            0
          )
          RETURNING id INTO room_id;
          room_ids := room_ids || room_id;
        END LOOP;

        FOR tenant_n IN 1..20 LOOP
          -- Pack tenants into rooms 1-12 without exceeding capacity
          -- rooms 1-8 (cap 2) → 16 people, rooms 9-12 (cap 1) → 4 people.
          IF tenant_n <= 16 THEN
            room_slot := ((tenant_n - 1) / 2) + 1;
          ELSE
            room_slot := 8 + (tenant_n - 16);
          END IF;

          first_name := first_names[((tenant_n + loc_idx + brand_idx - 2) % array_length(first_names, 1)) + 1];
          last_name := last_names[((tenant_n + pg_idx - 2) % array_length(last_names, 1)) + 1];
          tenant_email := format(
            'tenant.%s.%s.%s@pgapp.local',
            city_rec.code,
            lpad(pg_idx::text, 2, '0'),
            lpad(tenant_n::text, 2, '0')
          );
          rent_status := CASE WHEN tenant_n % 5 = 0 THEN 'PENDING' ELSE 'PAID' END;

          INSERT INTO profiles (full_name, email, password_hash, role, phone)
          VALUES (
            first_name || ' ' || last_name,
            tenant_email,
            password_hash,
            'TENANT',
            format(
              '+91%s',
              (9000000000 + (ascii(city_rec.code) * 10000) + (pg_idx * 100) + tenant_n)::text
            )
          )
          RETURNING id INTO profile_id;

          INSERT INTO tenants (user_id, pg_id, room_id, rent_status, last_payment_date, joined_at)
          VALUES (
            profile_id,
            pg_id,
            room_ids[room_slot],
            rent_status,
            CASE
              WHEN rent_status = 'PAID' THEN (CURRENT_DATE - ((tenant_n % 20) + 3))
              ELSE NULL
            END,
            now() - (((pg_idx * 3) + tenant_n) || ' days')::interval
          )
          RETURNING id INTO tenant_id;

          UPDATE rooms
          SET current_occupancy = current_occupancy + 1
          WHERE id = room_ids[room_slot];

          INSERT INTO billing (tenant_id, amount, due_date, status, paid_at)
          VALUES (
            tenant_id,
            (SELECT rooms.price FROM rooms WHERE rooms.id = room_ids[room_slot]),
            CURRENT_DATE + 5,
            rent_status::billing_status,
            CASE WHEN rent_status = 'PAID' THEN now() - ((tenant_n % 10) || ' days')::interval ELSE NULL END
          );

        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  INSERT INTO system_settings (key, value, description)
  VALUES (
    'seed.city_pgs_v1',
    'applied',
    'Mock seed: 60 PGs each in Hyderabad, Bangalore, Anantapur, Dharmavaram, Tirupati with ~20 tenants per PG.'
  );
END $$;
