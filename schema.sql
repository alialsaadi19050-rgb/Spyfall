/* ================================================================
   DEAD DROP — Supabase Schema
   Run entirely in the Supabase SQL editor (Dashboard → SQL Editor).

   Before running:
   1. Authentication → Providers → Anonymous  → Enable
   2. After running, go to Database → Replication → Supabase Realtime
      and toggle ON: rooms, players, player_secrets
   ================================================================ */

-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- LOCATIONS  (static reference data)
-- ================================================================
CREATE TABLE IF NOT EXISTS locations (
  id         SERIAL PRIMARY KEY,
  name       TEXT   NOT NULL,
  roles      JSONB  NOT NULL,   -- TEXT[]
  conditions JSONB  NOT NULL    -- TEXT[]  (4 entries, used in Condition Mode)
);

TRUNCATE locations RESTART IDENTITY CASCADE;

INSERT INTO locations (name, roles, conditions) VALUES
('Submarine',
 '["Captain","Sonar Operator","Cook","Engineer","Torpedo Officer","Medic","Navigator","Lookout"]',
 '["Speak only in whispers","Refer to everyone by rank","Never say the word surface","Begin every sentence with Dive dive dive"]'),

('Space Station',
 '["Commander","Scientist","Pilot","Mechanic","Botanist","Comms Officer","Flight Surgeon","Mission Specialist"]',
 '["Use metric units only","Never mention Earth by name","Speak very slowly and deliberately","Pepper speech with NASA acronyms"]'),

('Movie Studio',
 '["Director","Lead Actor","Stunt Double","Gaffer","Costume Designer","Producer","Screenwriter","Camera Operator"]',
 '["Deliver every answer as a dramatic monologue","React to everything as a plot twist","Pause for effect after every sentence","Address everyone by a character name"]'),

('Embassy',
 '["Ambassador","Translator","Security Guard","Diplomat","Receptionist","Cultural Attaché","Press Secretary","Visa Officer"]',
 '["Never give a direct answer","Label everything classified","Respond only in diplomatic language","Smile warmly regardless of what is said"]'),

('Casino Royale',
 '["Dealer","High Roller","Pit Boss","Bartender","Bouncer","Croupier","Card Counter","VIP Host"]',
 '["Frame everything as a wager","Speak exclusively in gambling metaphors","Show zero emotion at all times","End every sentence with odds e.g. fifty-fifty"]'),

('Antarctic Base',
 '["Researcher","Pilot","Mechanic","Cook","Doctor","Glaciologist","Meteorologist","Supply Officer"]',
 '["Act as though you are freezing","Express everything in wind-chill terms","Casually mention polar bears which do not exist there","Never admit the cold bothers you"]'),

('Cruise Ship',
 '["Captain","Entertainer","Steward","Engineer","Tourist","Lifeguard","Chef","Shore Excursion Guide"]',
 '["Describe everything as wonderful or delightful","Reference the buffet at least once per answer","Act faintly seasick","Speak with nautical flair"]'),

('Royal Palace',
 '["Monarch","Butler","Guard","Adviser","Chef","Heir","Court Jester","Royal Scribe"]',
 '["Refer to yourself only in the third person","Bow or curtsy before answering","Use formal titles for everyone","Avoid direct eye contact"]'),

('Bank Vault',
 '["Manager","Auditor","Security Guard","Teller","Locksmith","Inspector","Loan Officer","IT Technician"]',
 '["Speak only in financial terms","Trust no one — clarify everything twice","Triple-check every statement before saying it","Whisper all sensitive information"]'),

('Train Station',
 '["Conductor","Janitor","Train Engineer","Passenger","Ticket Agent","Vendor","Station Master","Mechanic"]',
 '["Announce everything like a departure board","Always appear to be in a hurry","Reference destinations constantly","Speak as if reading from a timetable"]');

-- ================================================================
-- ROOMS
-- ================================================================
CREATE TABLE IF NOT EXISTS rooms (
  id                     UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code              TEXT    UNIQUE NOT NULL CHECK (room_code ~ '^[A-Z]{4}$'),
  host_user_id           UUID    NOT NULL,
  game_state             TEXT    NOT NULL DEFAULT 'lobby'
                           CHECK (game_state IN ('lobby','playing','voting','ended')),
  selected_mode          TEXT    NOT NULL DEFAULT 'classic'
                           CHECK (selected_mode IN ('classic','double','condition','decoy')),
  -- Timer — clients compute remaining = timer_ends_at - now()
  timer_ends_at          TIMESTAMPTZ,
  timer_paused_remaining INTEGER,           -- seconds remaining when paused
  is_timer_paused        BOOLEAN NOT NULL DEFAULT true,
  -- Accusation voting (FK added after players table)
  accused_player_id      UUID,
  -- Populated when game_state = 'ended'
  last_result            JSONB,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- PLAYERS
-- ================================================================
CREATE TABLE IF NOT EXISTS players (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL,            -- equals auth.uid() on their device
  room_id       UUID    NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname      TEXT    NOT NULL,
  is_host       BOOLEAN NOT NULL DEFAULT false,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);

ALTER TABLE rooms
  ADD CONSTRAINT fk_accused_player
  FOREIGN KEY (accused_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- ================================================================
-- ROOM SECRETS  — location hidden from all clients
-- No SELECT policy: only SECURITY DEFINER functions can touch this
-- ================================================================
CREATE TABLE IF NOT EXISTS room_secrets (
  room_id       UUID    PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  location_id   INTEGER NOT NULL REFERENCES locations(id),
  location_name TEXT    NOT NULL
);

-- ================================================================
-- PLAYER SECRETS  — per-player role card, readable only by owner
-- ================================================================
CREATE TABLE IF NOT EXISTS player_secrets (
  player_id       UUID  PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  role            TEXT  NOT NULL CHECK (role IN ('spy','double_agent','civilian')),
  location_name   TEXT,   -- NULL for classic/double spy
  condition       TEXT,   -- condition mode civilians only
  decoy_locations JSONB   -- decoy mode spy: TEXT[4] shuffled, includes real location
);

-- ================================================================
-- REALTIME REPLICATION  (required for postgres_changes subscriptions)
-- ================================================================
ALTER TABLE rooms          REPLICA IDENTITY FULL;
ALTER TABLE players        REPLICA IDENTITY FULL;
ALTER TABLE player_secrets REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE player_secrets;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE locations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_secrets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_secrets ENABLE ROW LEVEL SECURITY;

-- Helper: is the calling user a member of this room?
-- SECURITY DEFINER runs as owner (bypasses RLS) to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_room_member(p_room_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM players WHERE room_id = p_room_id AND user_id = auth.uid()
  );
$$;

-- Helper: is the calling user the host of this room?
CREATE OR REPLACE FUNCTION is_room_host(p_room_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM players
    WHERE room_id = p_room_id AND user_id = auth.uid() AND is_host = true
  );
$$;

-- LOCATIONS — public read
CREATE POLICY "loc_read" ON locations FOR SELECT USING (true);

-- ROOMS — readable by members or any unauthenticated user browsing lobby codes
CREATE POLICY "rooms_select" ON rooms FOR SELECT
  USING (game_state = 'lobby' OR is_room_member(id));
CREATE POLICY "rooms_insert" ON rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND host_user_id = auth.uid());
CREATE POLICY "rooms_update" ON rooms FOR UPDATE
  USING (is_room_host(id));

-- PLAYERS — readable in same room or in any open lobby
CREATE POLICY "players_select" ON players FOR SELECT
  USING (
    is_room_member(room_id)
    OR room_id IN (SELECT id FROM rooms WHERE game_state = 'lobby')
  );
CREATE POLICY "players_insert" ON players FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
-- hosts can eliminate players via the SECURITY DEFINER function (no direct UPDATE needed)

-- ROOM SECRETS — no client policy; functions only
-- PLAYER SECRETS — only the owning player
CREATE POLICY "secrets_own_read" ON player_secrets FOR SELECT
  USING (
    player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
  );

-- ================================================================
-- FUNCTIONS  (all SECURITY DEFINER — run as postgres, bypass RLS)
-- ================================================================

-- Generate a unique 4-letter room code (no I or O to avoid confusion)
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code  TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := concat(
      substr(v_chars, floor(random()*length(v_chars)+1)::int, 1),
      substr(v_chars, floor(random()*length(v_chars)+1)::int, 1),
      substr(v_chars, floor(random()*length(v_chars)+1)::int, 1),
      substr(v_chars, floor(random()*length(v_chars)+1)::int, 1)
    );
    SELECT EXISTS(SELECT 1 FROM rooms WHERE room_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$;

-- START GAME: shuffles players, assigns roles, writes secrets server-side
-- This is the critical anti-cheat function — roles never pass through client logic
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_mode        TEXT;
  v_loc_id      INTEGER;
  v_loc_name    TEXT;
  v_loc_conds   JSONB;
  v_cond_count  INTEGER;
  v_players     UUID[];
  v_n           INTEGER;
  v_spy_id      UUID;
  v_da_id       UUID;
  v_other_locs  TEXT[];
  v_decoys      TEXT[];
  i             INTEGER;
  pid           UUID;
BEGIN
  IF NOT is_room_host(p_room_id) THEN
    RAISE EXCEPTION 'Only the host can start the game';
  END IF;

  SELECT selected_mode INTO v_mode FROM rooms WHERE id = p_room_id;

  -- Pick random location
  SELECT id, name, conditions
  INTO v_loc_id, v_loc_name, v_loc_conds
  FROM locations ORDER BY random() LIMIT 1;

  v_cond_count := jsonb_array_length(v_loc_conds);

  -- Randomly ordered player list
  SELECT ARRAY(SELECT id FROM players WHERE room_id = p_room_id ORDER BY random())
  INTO v_players;
  v_n := array_length(v_players, 1);

  IF v_n < 4 THEN RAISE EXCEPTION 'Minimum 4 players required'; END IF;

  v_spy_id := v_players[1];
  IF v_mode = 'double' AND v_n >= 3 THEN
    v_da_id := v_players[2];
  END IF;

  -- Clear previous round secrets
  DELETE FROM player_secrets
  WHERE player_id IN (SELECT id FROM players WHERE room_id = p_room_id);
  DELETE FROM room_secrets WHERE room_id = p_room_id;

  -- Store the true location server-side only
  INSERT INTO room_secrets (room_id, location_id, location_name)
  VALUES (p_room_id, v_loc_id, v_loc_name);

  -- Build decoy pool for Decoy mode
  SELECT ARRAY(SELECT name FROM locations WHERE name <> v_loc_name ORDER BY random() LIMIT 3)
  INTO v_other_locs;
  -- Shuffle: real location inserted at a random position among the 3 decoys
  SELECT ARRAY(SELECT unnest(ARRAY[v_loc_name] || v_other_locs) ORDER BY random())
  INTO v_decoys;

  -- Assign per-player secrets
  FOR i IN 1..v_n LOOP
    pid := v_players[i];

    IF pid = v_spy_id THEN
      IF v_mode = 'decoy' THEN
        -- Spy sees 4 locations (real hidden among 3 fakes); location_name stores the true answer
        INSERT INTO player_secrets (player_id, role, location_name, decoy_locations)
        VALUES (pid, 'spy', v_loc_name, to_jsonb(v_decoys));
      ELSE
        -- Classic / double / condition spy: no location hint
        INSERT INTO player_secrets (player_id, role)
        VALUES (pid, 'spy');
      END IF;

    ELSIF v_mode = 'double' AND pid = v_da_id THEN
      -- Double Agent knows the location but must protect the spy
      INSERT INTO player_secrets (player_id, role, location_name)
      VALUES (pid, 'double_agent', v_loc_name);

    ELSE
      -- Civilian
      IF v_mode = 'condition' THEN
        INSERT INTO player_secrets (player_id, role, location_name, condition)
        VALUES (pid, 'civilian', v_loc_name,
          v_loc_conds->>(floor(random() * v_cond_count))::int);
      ELSE
        INSERT INTO player_secrets (player_id, role, location_name)
        VALUES (pid, 'civilian', v_loc_name);
      END IF;
    END IF;
  END LOOP;

  -- Transition room to playing; pause timer reset at 8 min so host presses play
  UPDATE rooms SET
    game_state             = 'playing',
    timer_ends_at          = NULL,
    timer_paused_remaining = 480,
    is_timer_paused        = true,
    accused_player_id      = NULL,
    last_result            = NULL
  WHERE id = p_room_id;

  UPDATE players SET is_eliminated = false WHERE room_id = p_room_id;
END;
$$;

-- PAUSE TIMER
CREATE OR REPLACE FUNCTION pause_timer(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_remaining INTEGER;
BEGIN
  IF NOT is_room_host(p_room_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (timer_ends_at - NOW()))::INTEGER)
  INTO v_remaining FROM rooms WHERE id = p_room_id;
  UPDATE rooms SET
    is_timer_paused        = true,
    timer_paused_remaining = v_remaining,
    timer_ends_at          = NULL
  WHERE id = p_room_id AND NOT is_timer_paused;
END;
$$;

-- RESUME TIMER
CREATE OR REPLACE FUNCTION resume_timer(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_room_host(p_room_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE rooms SET
    is_timer_paused        = false,
    timer_ends_at          = NOW() + (timer_paused_remaining * INTERVAL '1 second'),
    timer_paused_remaining = NULL
  WHERE id = p_room_id AND is_timer_paused;
END;
$$;

-- RESET TIMER (host only, returns to 8:00 paused)
CREATE OR REPLACE FUNCTION reset_timer(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_room_host(p_room_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE rooms SET
    is_timer_paused        = true,
    timer_ends_at          = NULL,
    timer_paused_remaining = 480
  WHERE id = p_room_id;
END;
$$;

-- ACCUSE PLAYER: any member can nominate; pauses timer; sets voting state
CREATE OR REPLACE FUNCTION accuse_player(p_room_id UUID, p_accused_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_remaining INTEGER;
BEGIN
  IF NOT is_room_member(p_room_id) THEN RAISE EXCEPTION 'Not in room'; END IF;
  SELECT GREATEST(0, EXTRACT(EPOCH FROM (timer_ends_at - NOW()))::INTEGER)
  INTO v_remaining FROM rooms WHERE id = p_room_id;
  UPDATE rooms SET
    game_state             = 'voting',
    accused_player_id      = p_accused_id,
    is_timer_paused        = true,
    timer_paused_remaining = COALESCE(v_remaining, timer_paused_remaining),
    timer_ends_at          = NULL
  WHERE id = p_room_id AND game_state = 'playing';
END;
$$;

-- CANCEL ACCUSATION (host only): resume game
CREATE OR REPLACE FUNCTION cancel_accusation(p_room_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_room_host(p_room_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE rooms SET
    game_state        = 'playing',
    accused_player_id = NULL
  WHERE id = p_room_id AND game_state = 'voting';
END;
$$;

-- CONFIRM ELIMINATION (host resolves accusation)
-- Returns result JSON so the host client can verify the call succeeded
CREATE OR REPLACE FUNCTION confirm_elimination(p_room_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_accused_id   UUID;
  v_accused_name TEXT;
  v_role         TEXT;
  v_location     TEXT;
  v_spy_names    TEXT;
  v_result       JSONB;
BEGIN
  IF NOT is_room_host(p_room_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT accused_player_id INTO v_accused_id FROM rooms WHERE id = p_room_id;
  IF v_accused_id IS NULL THEN RAISE EXCEPTION 'No active accusation'; END IF;

  SELECT p.nickname, ps.role
  INTO v_accused_name, v_role
  FROM players p
  LEFT JOIN player_secrets ps ON ps.player_id = p.id
  WHERE p.id = v_accused_id;

  -- Always eliminate the accused
  UPDATE players SET is_eliminated = true WHERE id = v_accused_id;

  -- Fetch location for result reveal
  SELECT location_name INTO v_location FROM room_secrets WHERE room_id = p_room_id;

  -- Collect spy names for the reveal panel
  SELECT string_agg(p.nickname, ', ' ORDER BY p.created_at)
  INTO v_spy_names
  FROM players p
  JOIN player_secrets ps ON ps.player_id = p.id
  WHERE p.room_id = p_room_id AND ps.role = 'spy';

  IF v_role = 'spy' THEN
    v_result := jsonb_build_object(
      'verdict',   'SPY UNMASKED',
      'headline',  'Civilians win',
      'cls',       'win',
      'detail',    v_accused_name || ' was the spy. The location was ' || v_location || '.',
      'winner',    'Civilians',
      'spies',     v_spy_names,
      'location',  v_location
    );
    UPDATE rooms SET
      game_state        = 'ended',
      accused_player_id = NULL,
      last_result       = v_result
    WHERE id = p_room_id;
  ELSE
    -- Wrong target — continue playing
    v_result := jsonb_build_object(
      'toast', v_accused_name || ' was innocent · Spy still at large'
    );
    UPDATE rooms SET
      game_state        = 'playing',
      accused_player_id = NULL
    WHERE id = p_room_id;
  END IF;

  RETURN v_result;
END;
$$;

-- SPY DECLARE LOCATION: compare guess against room_secrets (never exposed to client)
CREATE OR REPLACE FUNCTION spy_declare_location(p_room_id UUID, p_location_name TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_correct    BOOLEAN;
  v_true_loc   TEXT;
  v_spy_names  TEXT;
  v_result     JSONB;
BEGIN
  IF NOT is_room_member(p_room_id) THEN RAISE EXCEPTION 'Not in room'; END IF;

  SELECT location_name INTO v_true_loc FROM room_secrets WHERE room_id = p_room_id;
  v_correct := (lower(trim(p_location_name)) = lower(trim(v_true_loc)));

  SELECT string_agg(p.nickname, ', ' ORDER BY p.created_at)
  INTO v_spy_names
  FROM players p
  JOIN player_secrets ps ON ps.player_id = p.id
  WHERE p.room_id = p_room_id AND ps.role = 'spy';

  IF v_correct THEN
    v_result := jsonb_build_object(
      'verdict',   'SPY DECLARATION',
      'headline',  'Spy wins',
      'cls',       'lose',
      'detail',    'The spy correctly identified ' || v_true_loc || '.',
      'winner',    'Spy',
      'spies',     v_spy_names,
      'location',  v_true_loc
    );
  ELSE
    v_result := jsonb_build_object(
      'verdict',   'SPY DECLARATION',
      'headline',  'Civilians win',
      'cls',       'win',
      'detail',    'Wrong guess. The real location was ' || v_true_loc || '.',
      'winner',    'Civilians',
      'spies',     v_spy_names,
      'location',  v_true_loc
    );
  END IF;

  UPDATE rooms SET
    game_state        = 'ended',
    accused_player_id = NULL,
    last_result       = v_result
  WHERE id = p_room_id;

  RETURN v_result;
END;
$$;
