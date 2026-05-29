/* ================================================================
   DEAD DROP — Multiplayer Logic
   Supabase backend · anonymous auth · realtime sync

   SETUP:
   1. Create a project at supabase.com
   2. Run schema.sql in the SQL editor
   3. Fill in SUPABASE_URL and SUPABASE_ANON_KEY below
   4. Open index.html (or serve via any static server)
   ================================================================ */

const SUPABASE_URL      = "https://beawtkyqpdssuyhchfbn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlYXd0a3lxcGRzc3V5aGNoZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MjM3NTcsImV4cCI6MjA5NTM5OTc1N30.2XgbF0XNL4uivtvjvwdsA__VZNZYdzEpfY5dorXm1sw";

const GAME_MODES = [
  { id:"classic",   name:"Classic Mode",   short:"Classic",
    desc:"One spy. Everyone else shares the secret location." },
  { id:"double",    name:"Double Agent",   short:"Double",
    desc:"A Double Agent knows the location and secretly shields the spy." },
  { id:"condition", name:"Condition Mode", short:"Condition",
    desc:"Civilians each receive a secret behavioral rule to follow." },
  { id:"decoy",     name:"Decoy Mode",     short:"Decoy",
    desc:"The spy sees 4 locations — one real, three fakes. Deduce which." }
];

// Location names are fetched from the DB at game start (see fetchAllLocations)

// Player seat colours — deterministic by index 0–7
const SEAT_COLORS = ["#FF4757","#2ED573","#1E90FF","#FFA502","#FF6EB4","#00DDFF","#A29BFE","#FDCB6E"];

// ================================================================
// SOUND & HAPTICS
// ================================================================
let _audioCtx = null;
function _ac() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}
function _tone(freq, dur, type = "sine", vol = 0.3) {
  try {
    const ctx = _ac(), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(_) {}
}
function playTick()   { _tone(900, 0.04, "square", 0.12); }
function playSting()  {
  _tone(523, 0.18, "sine", 0.35);
  setTimeout(() => _tone(415, 0.18, "sine", 0.35), 190);
  setTimeout(() => _tone(311, 0.45, "sine", 0.45), 380);
}
function playAccuse() { _tone(280, 0.28, "sawtooth", 0.18); }
function haptic(p)    { try { navigator.vibrate?.(p); } catch(_) {} }

// ================================================================
// STATE
// ================================================================
const S = {
  sb:               null,
  uid:              null,
  room:             null,
  me:               null,
  players:          [],
  secret:           null,
  isHost:           false,
  timerInterval:    null,
  timerEndsAt:      null,
  channel:          null,
  heartbeatInterval:null,
  crossedLocs:      new Set(),
  allLocationNames: [],
  guessSelected:    null,
  accuseSelected:   null,
  revealShown:      false,
};

// ================================================================
// UTILITIES
// ================================================================
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

let _toastTimer = null;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2800);
}

function showLoading(msg = "CONNECTING…") {
  $("#loading-msg").textContent = msg;
  $("#overlay-loading").classList.add("is-open");
}
function hideLoading() {
  $("#overlay-loading").classList.remove("is-open");
}

function showScreen(id) {
  $$(".screen").forEach(s => s.classList.toggle("is-active", s.id === `screen-${id}`));
}

function openOverlay(id)  { $(`#${id}`).classList.add("is-open"); }
function closeOverlay(id) { $(`#${id}`).classList.remove("is-open"); }

function fmtTime(s) {
  const m = Math.floor(Math.abs(s) / 60);
  const r = Math.abs(s) % 60;
  return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`;
}

function applyHostVisibility() {
  $$(".host-only").forEach(el => el.classList.toggle("hide", !S.isHost));
  $$(".non-host-only").forEach(el => el.classList.toggle("hide", S.isHost));
}

// ================================================================
// SUPABASE INIT + AUTH
// ================================================================
async function boot() {
  const { createClient } = supabase;
  S.sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Anonymous sign-in — idempotent (re-uses existing session from localStorage)
  const { data: { session } } = await S.sb.auth.getSession();
  if (!session) {
    const { error } = await S.sb.auth.signInAnonymously();
    if (error) { alert("Auth error: " + error.message); return; }
  }
  S.uid = (await S.sb.auth.getUser()).data.user.id;

  // Auto-fill room code from shareable link (?room=ABCD)
  const urlCode = new URLSearchParams(location.search).get("room");
  if (urlCode) {
    const jc = $("#join-code");
    if (jc) { jc.value = urlCode.toUpperCase().slice(0,4); jc.dispatchEvent(new Event("input")); }
  }

  // Restore room from localStorage if we were previously in one
  const saved = localStorage.getItem("dd_room_id");
  if (saved) {
    showLoading(t("loading_reconnecting"));
    try {
      await rejoinRoom(saved);
    } catch {
      localStorage.removeItem("dd_room_id");
    }
    hideLoading();
  }

  // Heartbeat — keeps last_seen_at fresh for disconnect detection
  S.heartbeatInterval = setInterval(async () => {
    if (S.me && S.room) await S.sb.rpc("player_heartbeat", { p_room_id: S.room.id });
  }, 20000);

  bindHome();
}

// ================================================================
// ROOM — CREATE
// ================================================================
async function createRoom(nickname) {
  showLoading(t("loading_creating"));
  try {
    // Generate a unique code via DB function
    const { data: code, error: cErr } = await S.sb.rpc("generate_room_code");
    if (cErr) throw cErr;

    // Insert room
    const { data: room, error: rErr } = await S.sb
      .from("rooms")
      .insert({ room_code: code, host_user_id: S.uid })
      .select()
      .single();
    if (rErr) throw rErr;

    // Insert myself as host player
    const { data: player, error: pErr } = await S.sb
      .from("players")
      .insert({ user_id: S.uid, room_id: room.id, nickname, is_host: true })
      .select()
      .single();
    if (pErr) throw pErr;

    S.room    = room;
    S.me      = player;
    S.isHost  = true;
    localStorage.setItem("dd_room_id", room.id);

    await fetchPlayers();
    subscribeToRoom();
    renderLobby();
    showScreen("lobby");
  } catch (e) {
    toast("Error: " + e.message);
  } finally {
    hideLoading();
  }
}

// ================================================================
// ROOM — JOIN
// ================================================================
async function joinRoom(code, nickname) {
  showLoading(t("loading_joining"));
  try {
    const { data: room, error: rErr } = await S.sb
      .from("rooms")
      .select("*")
      .eq("room_code", code.toUpperCase())
      .eq("game_state", "lobby")
      .single();
    if (rErr || !room) throw new Error(t("err_room_not_found"));

    if (S.players.length >= 8) throw new Error(t("err_room_full"));

    const { data: player, error: pErr } = await S.sb
      .from("players")
      .insert({ user_id: S.uid, room_id: room.id, nickname })
      .select()
      .single();
    if (pErr) {
      if (pErr.code === "23505") throw new Error(t("err_already_in_room"));
      throw pErr;
    }

    S.room   = room;
    S.me     = player;
    S.isHost = false;
    localStorage.setItem("dd_room_id", room.id);

    await fetchPlayers();
    subscribeToRoom();
    renderLobby();
    showScreen("lobby");
  } catch (e) {
    toast("Error: " + e.message);
  } finally {
    hideLoading();
  }
}

// Restore session after page refresh
async function rejoinRoom(roomId) {
  const { data: player } = await S.sb
    .from("players")
    .select("*")
    .eq("room_id", roomId)
    .eq("user_id", S.uid)
    .single();
  if (!player) throw new Error("Not in room");

  const { data: room } = await S.sb
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();
  if (!room) throw new Error("Room gone");

  S.room   = room;
  S.me     = player;
  S.isHost = player.is_host;
  localStorage.setItem("dd_room_id", roomId);

  await fetchPlayers();
  subscribeToRoom();

  if (room.game_state === "lobby") {
    renderLobby();
    showScreen("lobby");
  } else if (room.game_state !== "lobby") {
    await fetchSecret();
    renderGame();
    showScreen("game");
    updateTimerFromRoom(room);
    if (room.game_state === "voting") renderAccuseVoting();
    if (room.game_state === "ended" && room.last_result) showResult(room.last_result);
  }
}

// ================================================================
// LEAVE / CLEANUP
// ================================================================
async function leaveRoom() {
  stopTimer();
  if (S.channel) { S.sb.removeChannel(S.channel); S.channel = null; }
  if (S.me) {
    await S.sb.from("players").delete().eq("id", S.me.id);
  }
  S.room = null; S.me = null; S.players = []; S.secret = null; S.isHost = false;
  S.crossedLocs = new Set(); S.allLocationNames = [];
  clearInterval(S.heartbeatInterval); S.heartbeatInterval = null;
  localStorage.removeItem("dd_room_id");
  showScreen("home");
}

// ================================================================
// FETCH HELPERS
// ================================================================
async function fetchPlayers() {
  const { data } = await S.sb
    .from("players")
    .select("*")
    .eq("room_id", S.room.id)
    .order("created_at");
  S.players = data || [];
}

async function fetchSecret() {
  const { data } = await S.sb
    .from("player_secrets")
    .select("*")
    .eq("player_id", S.me.id)
    .single();
  if (data) S.secret = data;
}

async function fetchAllLocations() {
  if (S.allLocationNames.length > 0) return; // already loaded
  const { data } = await S.sb
    .from("locations")
    .select("name")
    .order("name");
  if (data) S.allLocationNames = data.map(r => r.name);
}

// ================================================================
// REALTIME SUBSCRIPTIONS
// ================================================================
function subscribeToRoom() {
  if (S.channel) S.sb.removeChannel(S.channel);

  S.channel = S.sb.channel(`room-${S.room.id}`)
    // Room state changes (timer, game_state, accusation, result)
    .on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "rooms",
      filter: `id=eq.${S.room.id}`
    }, ({ new: room }) => {
      S.room = room;
      handleRoomUpdate(room);
    })
    // Player joins / updates / leaves
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "players",
      filter: `room_id=eq.${S.room.id}`
    }, ({ new: p }) => {
      if (!S.players.find(x => x.id === p.id)) S.players.push(p);
      onPlayersChanged();
    })
    .on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "players",
      filter: `room_id=eq.${S.room.id}`
    }, ({ new: p }) => {
      const idx = S.players.findIndex(x => x.id === p.id);
      if (idx >= 0) S.players[idx] = p; else S.players.push(p);
      if (p.id === S.me.id) S.me = p;
      onPlayersChanged();
    })
    .on("postgres_changes", {
      event: "DELETE", schema: "public", table: "players",
      filter: `room_id=eq.${S.room.id}`
    }, ({ old: p }) => {
      S.players = S.players.filter(x => x.id !== p.id);
      onPlayersChanged();
    })
    // My secret card (written by start_game server function)
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "player_secrets",
      filter: `player_id=eq.${S.me.id}`
    }, ({ new: secret }) => {
      S.secret = secret;
      S.revealShown = false;
      renderRoleCard();
      // Show/hide Declare Location button now that we know the role
      const guessBtn = $("#open-guess");
      if (guessBtn) guessBtn.style.display = secret.role === "spy" ? "" : "none";
    })
    .subscribe();
}

function onPlayersChanged() {
  const screen = $(".screen.is-active");
  if (screen?.id === "screen-lobby") renderLobbyPlayerList();
  if (screen?.id === "screen-game")  renderPlayerGrid();
}

// ================================================================
// HANDLE ROOM STATE CHANGES (realtime)
// ================================================================
function handleRoomUpdate(room) {
  updateTimerFromRoom(room);
  applyHostVisibility();

  const screen = $(".screen.is-active");

  if (room.game_state === "lobby" && screen?.id !== "screen-lobby") {
    // Host returned the group to the lobby for a rematch — bring everyone back.
    closeOverlay("overlay-result");
    closeOverlay("overlay-accuse");
    closeOverlay("overlay-guess");
    closeOverlay("overlay-role");
    stopTimer();
    S.secret = null;
    S.revealShown = false;
    S.crossedLocs = new Set();
    renderLobby();
    showScreen("lobby");
    toast(t("toast_back_to_lobby"));
    return;
  }

  if (room.game_state === "playing") {
    // Transition lobby → game
    if (screen?.id === "screen-lobby") {
      fetchSecret().then(() => {
        renderGame();
        showScreen("game");
        toast(t("toast_briefing"));
      });
    } else {
      // Continuing game (e.g. accusation cancelled)
      closeOverlay("overlay-accuse");
      renderPlayerGrid();
    }
  }

  if (room.game_state === "voting") {
    renderAccuseVoting();
    openOverlay("overlay-accuse");
  }

  if (room.game_state === "ended" && room.last_result) {
    closeOverlay("overlay-accuse");
    closeOverlay("overlay-guess");
    stopTimer();
    showResult(room.last_result);
  }

  // Update player grid accusation highlight
  if (screen?.id === "screen-game") renderPlayerGrid();
}

// ================================================================
// TIMER  (local countdown from server timestamp)
// ================================================================
function updateTimerFromRoom(room) {
  stopTimer();
  const fill   = $("#timer-fill");
  const timerEl = $("#timer");

  const maxSecs = room.round_duration ?? 480;

  if (room.is_timer_paused) {
    const rem = room.timer_paused_remaining ?? maxSecs;
    $("#timer-display").textContent = fmtTime(rem);
    if (fill) fill.style.width = `${(rem / maxSecs) * 100}%`;
    timerEl?.classList.remove("is-warn", "is-critical");
    updateTimerPlayBtn(false);
    return;
  }

  if (!room.timer_ends_at) return;
  S.timerEndsAt = new Date(room.timer_ends_at);
  updateTimerPlayBtn(true);

  let _lastTickSec = -1;
  S.timerInterval = setInterval(() => {
    const rem = Math.max(0, Math.floor((S.timerEndsAt - Date.now()) / 1000));
    $("#timer-display").textContent = fmtTime(rem);
    if (fill) fill.style.width = `${(rem / maxSecs) * 100}%`;
    timerEl?.classList.toggle("is-warn",     rem <= 120 && rem > 30);
    timerEl?.classList.toggle("is-critical", rem <= 30);
    // Tick every second in the last 60s
    if (rem <= 60 && rem > 0 && rem !== _lastTickSec) {
      _lastTickSec = rem;
      playTick();
      if (rem <= 10) haptic(30);
    }
    if (rem === 0) {
      stopTimer();
      playSting();
      haptic([100, 50, 100, 50, 200]);
      toast(t("toast_times_up"));
    }
  }, 500);
}

function stopTimer() {
  clearInterval(S.timerInterval);
  S.timerInterval = null;
  updateTimerPlayBtn(false);
}

function updateTimerPlayBtn(running) {
  const btn = $("#timer-play");
  if (!btn) return;
  btn.innerHTML = running
    ? `<svg viewBox="0 0 12 12"><rect x="2" y="2" width="3" height="8" fill="currentColor"/><rect x="7" y="2" width="3" height="8" fill="currentColor"/></svg>`
    : `<svg viewBox="0 0 12 12"><polygon points="3,2 10,6 3,10" fill="currentColor"/></svg>`;
}

// ================================================================
// GAME ACTIONS  (host-gated RPCs)
// ================================================================
async function startGame() {
  showLoading(t("loading_briefing"));
  const { error } = await S.sb.rpc("start_game", { p_room_id: S.room.id });
  hideLoading();
  if (error) { toast("Error: " + error.message); return; }
  haptic([50, 30, 50]);
}

async function timerToggle() {
  if (S.room.is_timer_paused) {
    await S.sb.rpc("resume_timer", { p_room_id: S.room.id });
  } else {
    await S.sb.rpc("pause_timer",  { p_room_id: S.room.id });
  }
}

async function timerReset() {
  await S.sb.rpc("reset_timer", { p_room_id: S.room.id });
}

async function callAccusation(targetId) {
  playAccuse();
  haptic([80, 40, 80]);
  const { error } = await S.sb.rpc("accuse_player", {
    p_room_id:    S.room.id,
    p_accused_id: targetId
  });
  if (error) toast("Error: " + error.message);
}

async function cancelAccusation() {
  await S.sb.rpc("cancel_accusation", { p_room_id: S.room.id });
  closeOverlay("overlay-accuse");
}

async function castVote(vote) {
  haptic(50);
  const { data, error } = await S.sb.rpc("cast_vote", { p_room_id: S.room.id, p_vote: vote });
  if (error) { toast("Error: " + error.message); return; }
  if (data?.toast) toast(data.toast);
  // Realtime fires handleRoomUpdate → re-renders voting UI or ends game
}

async function confirmElimination() {
  showLoading(t("loading_resolving"));
  const { data, error } = await S.sb.rpc("confirm_elimination", { p_room_id: S.room.id });
  hideLoading();
  if (error) { toast("Error: " + error.message); return; }
  // Wrong target: server returns toast-only result
  if (data?.toast) {
    toast(data.toast);
    closeOverlay("overlay-accuse");
  }
  // Correct: game_state → 'ended', realtime will fire showResult
}

async function spyDeclare(locationName) {
  showLoading(t("loading_transmitting"));
  const { error } = await S.sb.rpc("spy_declare_location", {
    p_room_id:       S.room.id,
    p_location_name: locationName
  });
  hideLoading();
  if (error) toast("Error: " + error.message);
  // Realtime will fire handleRoomUpdate → showResult
}

async function startNextRound() {
  closeOverlay("overlay-result");
  S.secret = null;
  S.revealShown = false;
  S.crossedLocs = new Set();
  await startGame();
}

// Host sends the whole group back to the lobby to reconfigure & rematch.
// Realtime broadcasts game_state='lobby' → every client transitions in handleRoomUpdate.
async function returnToLobby() {
  showLoading(t("loading_connecting"));
  const { error } = await S.sb.rpc("return_to_lobby", { p_room_id: S.room.id });
  hideLoading();
  if (error) { toast("Error: " + error.message); return; }
}

// ================================================================
// RENDER — LOBBY
// ================================================================
function renderLobby() {
  $("#lobby-code").textContent = S.room.room_code;
  renderModeGrid();
  renderSettings();
  renderLobbyPlayerList();
  renderScore();
  applyHostVisibility();
}

function renderScore() {
  const civ = S.room.civilian_wins ?? 0;
  const spy = S.room.spy_wins ?? 0;
  let el = $("#lobby-score");
  if (!el) {
    el = document.createElement("div");
    el.id = "lobby-score";
    el.className = "lobby-score";
    $("#lobby-player-list")?.parentElement?.appendChild(el);
  }
  el.innerHTML = (civ + spy) === 0 ? "" :
    `<span class="score-label">${t("score_label")}</span>
     <span class="score-civ">${t("score_civilians")} <b>${civ}</b></span>
     <span class="score-sep">·</span>
     <span class="score-spy">${t("score_spy")} <b>${spy}</b></span>`;
}

function renderSettings() {
  let panel = $("#settings-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "settings-panel";
    panel.className = "panel";
    $("#mode-panel")?.insertAdjacentElement("afterend", panel);
  }

  const dur  = S.room.round_duration ?? 480;
  const spyN = S.room.spy_count ?? 1;

  const timerCards = [
    { val: 300, code: "T01", nk: "t01_name", dk: "t01_desc" },
    { val: 480, code: "T02", nk: "t02_name", dk: "t02_desc" },
    { val: 600, code: "T03", nk: "t03_name", dk: "t03_desc" },
    { val: 900, code: "T04", nk: "t04_name", dk: "t04_desc" },
  ];

  const spyCards = [
    { val: 1, code: "S01", nk: "s01_name", dk: "s01_desc" },
    { val: 2, code: "S02", nk: "s02_name", dk: "s02_desc" },
  ];

  const cardHtml = (cards, dataAttr, selectedVal) => cards.map(c => `
    <button class="mode-card ${c.val === selectedVal ? "is-selected" : ""}"
            data-${dataAttr}="${c.val}"
            ${!S.isHost ? "disabled" : ""}>
      <span class="mode-check"></span>
      <span class="mode-num">${c.code}</span>
      <span class="mode-name">${t(c.nk)}</span>
      <span class="mode-desc">${t(c.dk)}</span>
    </button>
  `).join("");

  panel.innerHTML = `
    <div class="panel-head">
      <span class="eyebrow red">${t("settings_title")}</span>
      <span class="meta">${S.isHost ? t("settings_host_ctrl") : ""}</span>
    </div>
    <div class="settings-section-label">${t("settings_timer")}</div>
    <div class="mode-grid" id="dur-grid">${cardHtml(timerCards, "dur", dur)}</div>
    <div class="settings-section-label" style="margin-top:1px;">${t("settings_spies")}</div>
    <div class="mode-grid mode-grid-half" id="spy-grid">${cardHtml(spyCards, "spy", spyN)}</div>
  `;

  if (!S.isHost) return;

  $("#dur-grid")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-dur]");
    if (!btn) return;
    const d = parseInt(btn.dataset.dur);
    await S.sb.from("rooms").update({ round_duration: d }).eq("id", S.room.id);
    S.room.round_duration = d;
    renderSettings();
  });

  $("#spy-grid")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-spy]");
    if (!btn) return;
    const n = parseInt(btn.dataset.spy);
    await S.sb.from("rooms").update({ spy_count: n }).eq("id", S.room.id);
    S.room.spy_count = n;
    renderSettings();
  });
}

function renderModeGrid() {
  const grid = $("#mode-grid");
  grid.innerHTML = GAME_MODES.map((m, i) => `
    <button class="mode-card ${m.id === S.room.selected_mode ? "is-selected" : ""}"
            data-mode="${m.id}"
            ${!S.isHost ? "disabled" : ""}>
      <span class="mode-check"></span>
      <span class="mode-num">M0${i + 1}</span>
      <span class="mode-name">${t("m0"+(i+1)+"_name")}</span>
      <span class="mode-desc">${t("m0"+(i+1)+"_desc")}</span>
    </button>
  `).join("");

  if (!S.isHost) {
    const idx = GAME_MODES.findIndex(m => m.id === S.room.selected_mode);
    $("#mode-panel-meta").textContent = idx >= 0 ? t(`m0${idx+1}_name`) : "";
    return;
  }

  grid.onclick = async (e) => {
    const btn = e.target.closest(".mode-card");
    if (!btn || !S.isHost) return;
    const mode = btn.dataset.mode;
    await S.sb.from("rooms").update({ selected_mode: mode }).eq("id", S.room.id);
    S.room.selected_mode = mode;
    renderModeGrid();
  };
}

function isOffline(p) {
  if (!p.last_seen_at) return false;
  return (Date.now() - new Date(p.last_seen_at).getTime()) > 40000;
}

function renderLobbyPlayerList() {
  const list = $("#lobby-player-list");
  list.innerHTML = S.players.map((p, i) => {
    const color = SEAT_COLORS[i % SEAT_COLORS.length];
    const offline = isOffline(p);
    return `
    <div class="lobby-player-row">
      <span class="seat-color" style="background:${color}"></span>
      <span class="seat">S${String(i + 1).padStart(2,"0")}</span>
      <span class="name ${offline ? "is-offline" : ""}">${esc(p.nickname)}${offline ? ` <span class='offline-tag'>${t("badge_offline")}</span>` : ""}</span>
      <span class="badge ${p.is_host ? "host" : ""} ${p.id === S.me?.id ? "you" : ""}">
        ${p.is_host ? t("badge_host") : p.id === S.me?.id ? t("badge_you") : t("badge_agent")}
      </span>
    </div>
  `}).join("");

  const n = S.players.length;
  const ready = n >= 4;
  $("#lobby-count").textContent = `${n} / 8`;
  $("#lobby-status").textContent = ready ? lobbyReadyStr(n) : lobbyWaitStr(4 - n);
  const startBtn = $("#start-btn");
  startBtn.disabled = !ready;
}

// ================================================================
// RENDER — GAME
// ================================================================
function renderGame() {
  const mode = GAME_MODES.find(m => m.id === S.room.selected_mode);
  $("#stat-mode").textContent = (mode?.short || "").toUpperCase();
  $("#game-room-code").textContent = S.room.room_code;
  renderPlayerGrid();
  fetchAllLocations().then(() => renderCheatSheet());
  applyHostVisibility();
  // Show/hide the Declare Location button based on whether this player is the spy
  // (secret may arrive slightly after renderGame; also called from handleRoomUpdate)
  const isSpy = S.secret?.role === "spy";
  const guessBtn = $("#open-guess");
  if (guessBtn) guessBtn.style.display = isSpy ? "" : "none";
  updateTimerFromRoom(S.room);
}

function renderPlayerGrid() {
  const grid = $("#player-grid");
  const accusedId = S.room?.accused_player_id;

  grid.innerHTML = S.players.map((p, i) => {
    const isMe      = p.id === S.me?.id;
    const isAccused = p.id === accusedId;
    const offline   = isOffline(p);
    const color     = SEAT_COLORS[i % SEAT_COLORS.length];
    const cls = [
      p.is_eliminated ? "is-eliminated" : "",
      isMe            ? "is-you"        : "",
      isAccused       ? "is-accused"    : "",
      offline         ? "is-offline"    : "",
    ].join(" ");

    return `
      <div class="pcard ${cls}" style="--player-color:${color}">
        <div class="pcard-head">
          <span class="pcard-seat" style="color:${color}">S${String(i + 1).padStart(2,"0")}</span>
          <span class="pcard-status"><span class="dot" style="background:${offline ? "#888" : color}"></span>${isMe ? t("pcard_you") : offline ? t("pcard_offline") : t("pcard_active")}</span>
        </div>
        <div class="pcard-name">${esc(p.nickname)}</div>
        <div class="pcard-foot">${isAccused ? t("pcard_accused") : p.is_eliminated ? t("pcard_out") : offline ? t("pcard_reconnecting") : t("pcard_in_field")}</div>
      </div>
    `;
  }).join("");

  const active = S.players.filter(p => !p.is_eliminated).length;
  $("#stat-players").textContent = `${active}/${S.players.length}`;
}

function renderCheatSheet() {
  const list = $("#cheat-list");
  const names = S.allLocationNames.length > 0 ? S.allLocationNames : [];
  // Update the "N sites" label in the summary
  const eyebrow = list.closest(".cheat-details")?.querySelector(".eyebrow");
  if (eyebrow && names.length > 0) eyebrow.textContent = `${names.length} ${t("sites_suffix")}`;
  list.innerHTML = names.map((name, i) => `
    <button class="cheat-item ${S.crossedLocs.has(name) ? "is-crossed" : ""}" data-loc="${esc(name)}">
      <span>${esc(name)}</span>
      <span class="cheat-num">${String(i + 1).padStart(2,"0")}</span>
    </button>
  `).join("");

  list.onclick = (e) => {
    const item = e.target.closest(".cheat-item");
    if (!item) return;
    const loc = item.dataset.loc;
    if (S.crossedLocs.has(loc)) S.crossedLocs.delete(loc);
    else S.crossedLocs.add(loc);
    renderCheatSheet();
  };
}

// ================================================================
// ROLE REVEAL MODAL
// ================================================================
function openRoleModal() {
  if (!S.secret) { toast(t("toast_card_not_ready")); return; }
  const seat = S.players.findIndex(p => p.id === S.me.id) + 1;
  $("#reveal-seat").textContent = `S${String(seat).padStart(2,"0")} · ${t("seat_eyes_only")}`;
  $("#reveal-name").textContent = S.me.nickname;
  S.revealShown = false;
  renderRoleCard();
  openOverlay("overlay-role");
}

function renderRoleCard() {
  const card    = $("#reveal-card");
  const content = $("#reveal-content");
  if (!card) return;

  const wasHidden = !card.classList.contains("is-revealed");
  card.classList.toggle("is-revealed", S.revealShown);
  $("#reveal-toggle").textContent = S.revealShown ? t("hide_pass") : t("tap_reveal");
  if (S.revealShown && wasHidden) haptic([40, 20, 80]);

  if (!S.revealShown || !S.secret) { content.innerHTML = ""; return; }

  const { role, location_name, condition, decoy_locations, job } = S.secret;

  if (role === "spy") {
    if (S.room.selected_mode === "decoy" && decoy_locations) {
      const locs = decoy_locations.map(l => `<li>${esc(l)}</li>`).join("");
      content.innerHTML = `
        <div class="role-line">${t("role_identity")}</div>
        <div class="role-value spy">${t("role_spy_title")}</div>
        <div class="role-sub">${t("role_spy_decoy_sub")}</div>
        <ul class="decoy-list">${locs}</ul>
      `;
    } else {
      content.innerHTML = `
        <div class="role-line">${t("role_identity")}</div>
        <div class="role-value spy">${t("role_spy_title")}</div>
        <div class="role-sub">${t("role_spy_sub")}</div>
        <div class="role-meta single">
          <div class="role-meta-cell">
            <span class="k">${t("role_cospies")}</span>
            <span class="v">${S.room.selected_mode === "double" ? t("role_cospies_double") : t("role_cospies_none")}</span>
          </div>
        </div>
      `;
    }
  } else if (role === "double_agent") {
    content.innerHTML = `
      <div class="role-line">${t("role_identity")}</div>
      <div class="role-value double-agent">${t("role_double_title")}</div>
      <div class="role-sub">${t("role_double_sub")}</div>
      <div class="role-meta">
        <div class="role-meta-cell">
          <span class="k">${t("role_true_loc")}</span>
          <span class="v">${esc(location_name)}</span>
        </div>
        ${job ? `
        <div class="role-meta-cell">
          <span class="k">${t("role_cover")}</span>
          <span class="v" style="color:var(--signal)">${esc(job)}</span>
        </div>` : ""}
      </div>
    `;
  } else {
    // Civilian
    content.innerHTML = `
      <div class="role-line">${t("role_location")}</div>
      <div class="role-value">${esc(location_name)}</div>
      <div class="role-sub">${t("role_civ_sub")}</div>
      <div class="role-meta">
        ${job ? `
        <div class="role-meta-cell">
          <span class="k">${t("role_your_role")}</span>
          <span class="v" style="color:var(--signal)">${esc(job)}</span>
        </div>` : ""}
        ${condition ? `
        <div class="role-meta-cell">
          <span class="k">${t("role_secret_cond")}</span>
          <span class="v" style="color:var(--amber)">${esc(condition)}</span>
        </div>` : ""}
      </div>
    `;
  }
}

// ================================================================
// ACCUSATION MODAL
// ================================================================
function openAccuseModal() {
  if (S.room.game_state === "voting") {
    renderAccuseVoting();
  } else {
    renderAccusePicker();
  }
  openOverlay("overlay-accuse");
}

function renderAccusePicker() {
  S.accuseSelected = null;
  const body = $("#accuse-body");
  const foot = $("#accuse-foot");

  const eligible = S.players.filter(p => !p.is_eliminated && p.id !== S.me.id);

  body.innerHTML = `
    <p class="modal-blurb">${t("accuse_blurb")}</p>
    <div class="vote-grid" id="accuse-grid">
      ${eligible.map((p, i) => `
        <button class="vote-cell" data-id="${p.id}">
          <span class="seat">S${String(S.players.indexOf(p) + 1).padStart(2,"0")}</span>
          <span class="name">${esc(p.nickname)}</span>
        </button>
      `).join("")}
    </div>
  `;

  foot.innerHTML = `
    <span class="mono" style="font-size:10px;color:var(--ink-faint);letter-spacing:.2em;">${t("accuse_select")}</span>
    <button id="accuse-submit" class="btn btn-primary" disabled>${t("accuse_submit")}</button>
  `;

  $("#accuse-grid").onclick = (e) => {
    const cell = e.target.closest(".vote-cell");
    if (!cell) return;
    S.accuseSelected = cell.dataset.id;
    $$(".vote-cell", $("#accuse-grid")).forEach(c => c.classList.toggle("is-selected", c.dataset.id === S.accuseSelected));
    $("#accuse-submit").disabled = false;
  };

  $("#accuse-submit").onclick = async () => {
    if (!S.accuseSelected) return;
    await callAccusation(S.accuseSelected);
    // Realtime will update game_state to 'voting' → renderAccuseVoting fires
  };
}

function renderAccuseVoting() {
  const accused = S.players.find(p => p.id === S.room.accused_player_id);
  if (!accused) return;

  const votes     = S.room.accusation_votes || {};
  const myVote    = votes[S.me?.id];           // true | false | undefined
  const yesCount  = Object.values(votes).filter(v => v === true).length;
  const noCount   = Object.values(votes).filter(v => v === false).length;
  const eligible  = S.players.filter(p => !p.is_eliminated && p.id !== accused.id);
  const pending   = eligible.length - Object.keys(votes).length;
  const iAccused  = S.me?.id === accused.id;

  const body = $("#accuse-body");
  const foot = $("#accuse-foot");

  body.innerHTML = `
    <div class="accusation-banner">
      <div class="label">${t("accuse_active")}</div>
      <div class="accused-name">${esc(accused.nickname)}</div>
      <div class="sub">${t("accuse_majority")}</div>

      <div class="vote-tally">
        <div class="tally-cell tally-yes">
          <span class="tally-num">${yesCount}</span>
          <span class="tally-label">${t("guilty")}</span>
        </div>
        <div class="tally-cell tally-no">
          <span class="tally-num">${noCount}</span>
          <span class="tally-label">${t("innocent")}</span>
        </div>
        <div class="tally-cell tally-pending">
          <span class="tally-num">${pending}</span>
          <span class="tally-label">${t("pending")}</span>
        </div>
      </div>

      ${iAccused ? `
        <div class="vote-waiting">${t("you_are_accused")}</div>
      ` : myVote === undefined ? `
        <div class="vote-buttons">
          <button id="btn-vote-guilty" class="btn btn-danger">${t("vote_guilty")}</button>
          <button id="btn-vote-innocent" class="btn btn-ghost">${t("vote_innocent")}</button>
        </div>
      ` : `
        <div class="vote-cast">${t("you_voted")} <strong>${myVote ? t("guilty") : t("innocent")}</strong></div>
      `}

      ${S.isHost ? `<button id="btn-cancel-accuse" class="btn btn-ghost btn-sm" style="margin-top:14px;">${t("abort_accuse")}</button>` : ""}
    </div>
  `;
  foot.innerHTML = "";

  if (!iAccused && myVote === undefined) {
    $("#btn-vote-guilty")?.addEventListener("click", () => castVote(true));
    $("#btn-vote-innocent")?.addEventListener("click", () => castVote(false));
  }
  if (S.isHost) {
    $("#btn-cancel-accuse")?.addEventListener("click", cancelAccusation);
  }
}

// ================================================================
// SPY GUESS MODAL
// ================================================================
async function openGuessModal() {
  // Only the spy can declare a location
  if (S.secret?.role !== "spy") {
    toast(t("toast_spy_only"));
    return;
  }

  S.guessSelected = null;

  let locations;

  if (S.room.selected_mode === "decoy" && S.secret.decoy_locations) {
    // Decoy mode: spy already has 4 locations on their card (1 real + 3 fakes)
    locations = S.secret.decoy_locations;
  } else {
    // All other modes: fetch 15 locations from server (real location + 14 random)
    showLoading(t("loading_locations"));
    const { data, error } = await S.sb.rpc("get_spy_guess_locations", { p_room_id: S.room.id });
    hideLoading();
    if (error) { toast("Error: " + error.message); return; }
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast(t("toast_loc_error"));
      return;
    }
    locations = data;
  }

  const grid = $("#guess-grid");
  grid.innerHTML = locations.map((name, i) => `
    <button class="loc-cell" data-name="${esc(name)}">
      <span class="idx">L${String(i + 1).padStart(2,"0")}</span>
      <span class="nm">${esc(name)}</span>
    </button>
  `).join("");

  grid.onclick = (e) => {
    const cell = e.target.closest(".loc-cell");
    if (!cell) return;
    S.guessSelected = cell.dataset.name;
    $$(".loc-cell", grid).forEach(c => c.classList.toggle("is-selected", c.dataset.name === S.guessSelected));
    $("#guess-submit").disabled = false;
  };

  $("#guess-submit").disabled = true;
  openOverlay("overlay-guess");
}

// ================================================================
// RESULT MODAL
// ================================================================
function showResult(result) {
  const body = $("#result-body");
  body.innerHTML = `
    <div class="result-banner">
      <div class="verdict">${esc(result.verdict)}</div>
      <div class="headline ${result.cls}">${esc(result.headline)}</div>
      <div class="detail">${esc(result.detail)}</div>
      <div class="result-breakdown">
        <div>
          <div class="k">${t("winner_label")}</div>
          <div class="v" style="color:${result.cls === 'win' ? 'var(--signal)' : 'var(--crimson)'}">${esc(result.winner)}</div>
        </div>
        <div>
          <div class="k">${t("spy_label")}</div>
          <div class="v">${esc(result.spies || "—")}</div>
        </div>
        <div style="grid-column:1/-1">
          <div class="k">${t("true_loc_label")}</div>
          <div class="v">${esc(result.location || "—")}</div>
        </div>
      </div>
    </div>
  `;
  playSting();
  haptic([100, 60, 100, 60, 300]);
  applyHostVisibility();
  openOverlay("overlay-result");
}

// ================================================================
// RENDER — HOME (bind-only, no template)
// ================================================================
function bindHome() {
  const createName = $("#create-name");
  const joinCode   = $("#join-code");
  const joinName   = $("#join-name");
  const createBtn  = $("#create-btn");
  const joinBtn    = $("#join-btn");

  const checkCreate = () => { createBtn.disabled = createName.value.trim().length < 1; };
  const checkJoin   = () => { joinBtn.disabled = joinCode.value.trim().length < 4 || joinName.value.trim().length < 1; };

  createName.oninput = checkCreate;
  joinCode.oninput   = () => { joinCode.value = joinCode.value.toUpperCase(); checkJoin(); };
  joinName.oninput   = checkJoin;

  createBtn.onclick  = () => createRoom(createName.value.trim());
  joinBtn.onclick    = () => joinRoom(joinCode.value.trim(), joinName.value.trim());

  // Allow Enter to submit
  [createName].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter" && !createBtn.disabled) createBtn.click(); }));
  [joinCode, joinName].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter" && !joinBtn.disabled) joinBtn.click(); }));
}

// ================================================================
// WIRE UP — global buttons (non-dynamic)
// ================================================================
function bind() {
  // Lobby
  document.addEventListener("click", e => {
    if (e.target.matches("#copy-code")) {
      const code = S.room?.room_code || "";
      const link = `${location.origin}${location.pathname}?room=${code}`;
      navigator.clipboard?.writeText(link).then(() => toast(t("toast_link_copied")));
    }
    if (e.target.matches("#leave-lobby"))  leaveRoom();
    if (e.target.matches("#start-btn"))    startGame();
  });

  // Game topbar
  document.addEventListener("click", e => {
    if (e.target.closest("#timer-play"))  timerToggle();
    if (e.target.closest("#timer-reset")) timerReset();
    if (e.target.matches("#back-to-lobby")) {
      if (confirm(t("confirm_leave"))) leaveRoom();
    }
  });

  // Game action buttons
  document.addEventListener("click", e => {
    if (e.target.matches("#view-card-btn") || e.target.closest("#view-card-btn")) openRoleModal();
    if (e.target.matches("#open-accuse"))   openAccuseModal();
    if (e.target.matches("#open-guess"))    openGuessModal();
  });

  // Role card toggle
  document.addEventListener("click", e => {
    if (e.target.matches("#reveal-toggle") || e.target.closest("#reveal-card")) {
      S.revealShown = !S.revealShown;
      renderRoleCard();
    }
  });

  // Spy guess submit
  document.addEventListener("click", e => {
    if (e.target.matches("#guess-submit") && S.guessSelected) {
      spyDeclare(S.guessSelected);
    }
  });

  // Result actions
  document.addEventListener("click", e => {
    if (e.target.matches("#result-next"))  startNextRound();
    if (e.target.matches("#result-lobby")) returnToLobby();
    if (e.target.matches("#result-leave")) leaveRoom();
  });

  // Modal close buttons (data-overlay attribute)
  document.addEventListener("click", e => {
    const btn = e.target.closest(".modal-close");
    if (btn?.dataset.overlay) closeOverlay(btn.dataset.overlay);
  });

  // Click outside modal to close (but NOT the loading overlay)
  $$(".overlay:not(#overlay-loading)").forEach(o => {
    o.addEventListener("click", e => {
      if (e.target === o && o.id !== "overlay-accuse") closeOverlay(o.id);
    });
  });

  // ESC key
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    ["overlay-role","overlay-guess","overlay-result"].forEach(id => closeOverlay(id));
    // Don't close accusation overlay on ESC during voting phase
    if (S.room?.game_state !== "voting") closeOverlay("overlay-accuse");
  });
}

// ================================================================
// UTILITY — safe HTML escaping
// ================================================================
function esc(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ================================================================
// BOOT
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  bind();
  boot();
});
