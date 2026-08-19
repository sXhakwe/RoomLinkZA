CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active','suspended','banned'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE listing_status AS ENUM ('available','pending','occupied','unavailable','removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'pending'; ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'unavailable'; ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'removed'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_status AS ENUM ('open','reviewing','resolved','dismissed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email varchar(255) UNIQUE NOT NULL, password_hash text NOT NULL,
 first_name varchar(80) NOT NULL, last_name varchar(80) NOT NULL, phone varchar(30), avatar_url text, bio text DEFAULT '',
 city varchar(120), province varchar(80), occupation varchar(120), date_of_birth date, gender varchar(40),
 role user_role NOT NULL DEFAULT 'user', status user_status NOT NULL DEFAULT 'active', is_verified boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS roommate_preferences (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, budget_min numeric(10,2) DEFAULT 0,
 budget_max numeric(10,2) DEFAULT 15000, preferred_city varchar(120), preferred_province varchar(80), move_in_date date,
 cleanliness smallint CHECK (cleanliness BETWEEN 1 AND 5), social_level smallint CHECK (social_level BETWEEN 1 AND 5),
 sleep_schedule varchar(40), smoking_ok boolean DEFAULT false, pets_ok boolean DEFAULT false, preferred_gender varchar(40),
 interests text[] DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS listings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title varchar(160) NOT NULL, description text NOT NULL, property_type varchar(50) NOT NULL, room_type varchar(50) NOT NULL,
 address_line varchar(180) NOT NULL, suburb varchar(100), city varchar(120) NOT NULL, province varchar(80) NOT NULL,
 postal_code varchar(10), latitude numeric(9,6), longitude numeric(9,6), monthly_rent numeric(10,2) NOT NULL CHECK (monthly_rent >= 0),
 deposit numeric(10,2) DEFAULT 0 CHECK (deposit >= 0), available_from date NOT NULL, bedrooms smallint NOT NULL DEFAULT 1 CHECK (bedrooms > 0),
 bathrooms numeric(3,1) NOT NULL DEFAULT 1 CHECK (bathrooms > 0), furnished boolean NOT NULL DEFAULT false,
 utilities_included boolean NOT NULL DEFAULT false, amenities text[] DEFAULT '{}', image_urls text[] DEFAULT '{}', house_rules text DEFAULT '',
 status listing_status NOT NULL DEFAULT 'available', is_approved boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_search_idx ON listings (city, province, monthly_rent, available_from);
CREATE TABLE IF NOT EXISTS saved_listings (
 user_id uuid REFERENCES users(id) ON DELETE CASCADE, listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, listing_id)
);
CREATE TABLE IF NOT EXISTS posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000), image_url text, is_hidden boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
 author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
 is_hidden boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reactions (
 user_id uuid REFERENCES users(id) ON DELETE CASCADE, post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
 type varchar(20) NOT NULL DEFAULT 'like', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, post_id)
);
CREATE TABLE IF NOT EXISTS conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS conversation_members (
 conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (conversation_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
 read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, created_at);
CREATE TABLE IF NOT EXISTS message_reactions (
 message_id uuid REFERENCES messages(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 reaction varchar(12) NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(message_id,user_id,reaction)
);
CREATE TABLE IF NOT EXISTS connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, status varchar(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(requester_id<>recipient_id), UNIQUE(requester_id,recipient_id)
);
CREATE TABLE IF NOT EXISTS events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 title varchar(160) NOT NULL, category varchar(40) NOT NULL, description text DEFAULT '', event_date date NOT NULL, event_time time NOT NULL,
 location varchar(180) NOT NULL, max_attendees integer CHECK(max_attendees>0), image_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_rsvps (
 event_id uuid REFERENCES events(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 response varchar(20) NOT NULL CHECK(response IN ('going','maybe','cant_go')), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(event_id,user_id)
);
CREATE TABLE IF NOT EXISTS event_ratings (
 event_id uuid REFERENCES events(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE,
 rating smallint NOT NULL CHECK(rating BETWEEN 1 AND 5), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(event_id,user_id)
);
CREATE TABLE IF NOT EXISTS households (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS household_members (
 household_id uuid REFERENCES households(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE, joined_at timestamptz DEFAULT now(), PRIMARY KEY(household_id,user_id)
);
CREATE TABLE IF NOT EXISTS chores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE, creator_id uuid NOT NULL REFERENCES users(id),
 title varchar(160) NOT NULL, assignee_id uuid REFERENCES users(id), due_date date NOT NULL, status varchar(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open','complete')), created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bills (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE, creator_id uuid NOT NULL REFERENCES users(id),
 title varchar(160) NOT NULL, amount numeric(10,2) NOT NULL CHECK(amount>=0), due_date date NOT NULL, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bill_shares (
 bill_id uuid REFERENCES bills(id) ON DELETE CASCADE, user_id uuid REFERENCES users(id) ON DELETE CASCADE, amount numeric(10,2) NOT NULL CHECK(amount>=0), paid_at timestamptz, PRIMARY KEY(bill_id,user_id)
);
CREATE TABLE IF NOT EXISTS notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 type varchar(50) NOT NULL, title varchar(160) NOT NULL, body text NOT NULL, link text, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blocks (
 blocker_id uuid REFERENCES users(id) ON DELETE CASCADE, blocked_id uuid REFERENCES users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (blocker_id, blocked_id), CHECK (blocker_id <> blocked_id)
);
CREATE TABLE IF NOT EXISTS reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 target_type varchar(20) NOT NULL CHECK (target_type IN ('user','listing','post','comment','message')), target_id uuid NOT NULL,
 reason varchar(100) NOT NULL, details text DEFAULT '', status report_status NOT NULL DEFAULT 'open',
 moderator_id uuid REFERENCES users(id) ON DELETE SET NULL, resolution_note text, created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE TABLE IF NOT EXISTS platform_settings (
 key varchar(80) PRIMARY KEY, value jsonb NOT NULL, updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action varchar(100) NOT NULL, target_type varchar(40), target_id uuid, details jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
