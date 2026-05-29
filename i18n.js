/* ================================================================
   DEAD DROP — Client-side translations
   Supported: en (English), sv (Swedish), ar (Arabic / RTL)
   ================================================================ */

const TRANSLATIONS = {

  // ── ENGLISH ──────────────────────────────────────────────────────
  en: {
    // Brand / chrome
    brand_sub:             "Classified Field Protocol · v2.0",
    secure_channel:        "Secure Channel",

    // Home
    case_file:             "Case File 00 · Briefing Room",
    hero_headline:         'Find the <span class="accent">spy</span><br/>before they find the location.',
    hero_blurb:            "Real-time multiplayer · 4–8 operatives · Each on their own device",
    deploy_host:           "▸ Deploy as Host",
    step_01:               "Step 01",
    codename_label:        "Agent codename",
    codename_ph:           "Enter your codename…",
    create_room_btn:       "Create Room",
    or_divider:            "OR",
    enter_field:           "▸ Enter Field",
    room_code_label:       "Room code",
    join_room_btn:         "Join Room",

    // Lobby
    briefing_room:         "Briefing Room",
    room_label:            "ROOM",
    leave_btn:             "← Leave",
    op_params:             "▸ Operation Parameters",
    host_selects:          "Host selects",
    field_roster:          "▸ Field Roster",
    begin_mission:         "Begin Mission →",
    waiting_operatives:    "Waiting for operatives…",

    // Game dashboard
    mode_label:            "Mode",
    players_label:         "Players",
    exit_btn:              "← Exit",
    field_operatives:      "▸ Field Operatives",
    player_status:         "Player Status",
    cards_hint:            "Cards sealed · tap to accuse",
    accuse_btn:            "⌖ Accuse Player",
    declare_btn:           "⌬ Declare Location",
    loc_roster:            "Location Roster",
    field_tip:             "// FIELD TIP",
    field_tip_text:        "Tap a site to cross it off. Spy — identify which one matches the clues.",
    view_card_label:       "View My Secret Card",
    view_card_hint:        "tap to reveal your dossier",

    // Overlays – static labels
    encrypted_dossier:     "▸ Encrypted Dossier",
    hold_privately:        "Hold the device privately. Memorize your dossier, then close.",
    classified_tap:        "Classified · Tap to read",
    eyes_only:             "EYES ONLY",
    tap_reveal:            "Tap to reveal identity",
    hide_pass:             "Hide · pass device",
    accusation_label:      "▸ Accusation",
    spy_declaration:       "▸ Spy Declaration",
    commit_blurb:          "Commit to a location. Correct guess wins the round for the spy.",
    one_attempt:           "ONE ATTEMPT",
    commit_guess_btn:      "Commit Guess →",
    round_resolved:        "▸ Round Resolved",
    return_lobby_btn:      "Return to Lobby",
    new_round_btn:         "New Round →",
    leave_room_btn:        "Leave Room",
    waiting_host:          "Waiting for the host to start the next round…",

    // Loading
    loading_connecting:    "CONNECTING…",
    loading_reconnecting:  "RECONNECTING…",
    loading_creating:      "CREATING ROOM…",
    loading_joining:       "JOINING ROOM…",
    loading_briefing:      "BRIEFING OPERATIVES…",
    loading_resolving:     "RESOLVING…",
    loading_transmitting:  "TRANSMITTING DECLARATION…",
    loading_locations:     "LOADING LOCATIONS…",

    // Toasts
    toast_briefing:        "Briefing complete · Check your card",
    toast_times_up:        "Time's up · Call an accusation",
    toast_link_copied:     "Join link copied!",
    toast_back_to_lobby:   "Back in the lobby · Set up the next round",
    toast_card_not_ready:  "Your card is not ready yet",
    toast_spy_only:        "Only the spy can declare a location",
    toast_loc_error:       "Could not load locations — try again",

    // Errors
    err_room_not_found:    "Room not found or game already started",
    err_room_full:         "Room is full",
    err_already_in_room:   "You are already in this room",
    err_join_failed:       "Couldn't join the room — please try again",

    // Player badges
    badge_host:            "HOST",
    badge_you:             "YOU",
    badge_agent:           "AGENT",
    badge_offline:         "OFFLINE",

    // Player card states
    pcard_you:             "YOU",
    pcard_offline:         "OFFLINE",
    pcard_active:          "ACTIVE",
    pcard_accused:         "⚠ ACCUSED",
    pcard_out:             "✕ OUT",
    pcard_reconnecting:    "⚡ Reconnecting…",
    pcard_in_field:        "In field",

    // Score
    score_label:           "Score",
    score_civilians:       "Civilians",
    score_spy:             "Spy",

    // Settings panel
    settings_title:        "▸ Round Settings",
    settings_host_ctrl:    "Host controls",
    settings_timer:        "Timer",
    settings_spies:        "Spies",

    // Timer cards
    t01_name: "5 Minutes",  t01_desc: "Fast pace · High pressure on everyone.",
    t02_name: "8 Minutes",  t02_desc: "Standard mission length. Balanced.",
    t03_name: "10 Minutes", t03_desc: "Extended interrogation time.",
    t04_name: "15 Minutes", t04_desc: "Long operation · Deep cover play.",

    // Spy count cards
    s01_name: "1 Spy",    s01_desc: "One infiltrator. Classic deduction.",
    s02_name: "2 Spies",  s02_desc: "Two operatives. Double the deception.",

    // Game mode cards
    m01_name: "Classic Mode",   m01_desc: "One spy. Everyone else shares the secret location.",
    m02_name: "Double Agent",   m02_desc: "A Double Agent knows the location and secretly shields the spy.",
    m03_name: "Condition Mode", m03_desc: "Civilians each receive a secret behavioral rule to follow.",
    m04_name: "Decoy Mode",     m04_desc: "The spy sees 4 locations — one real, three fakes. Deduce which.",

    // Role card
    role_identity:         "Identity",
    role_spy_title:        "YOU ARE THE SPY",
    role_spy_sub:          "Blend in. Listen to the clues. Guess the location before the others identify you.",
    role_spy_decoy_sub:    "One of these 4 locations is the real one. Deduce it from the conversation — then guess when ready.",
    role_cospies:          "Co-spies",
    role_cospies_none:     "None",
    role_cospies_double:   "None known to you",
    role_double_title:     "DOUBLE AGENT",
    role_double_sub:       "You know the location. Act like a civilian — but feed vague answers to protect the hidden spy.",
    role_true_loc:         "True Location",
    role_cover:            "Your Cover",
    role_location:         "Location",
    role_civ_sub:          "Expose the spy without giving too much away. Watch for hesitation.",
    role_your_role:        "Your Role",
    role_secret_cond:      "Secret Condition",
    seat_eyes_only:        "Eyes only",

    // Accusation modal
    accuse_blurb:          "Select the operative you suspect. The host will confirm or cancel the accusation.",
    accuse_select:         "SELECT TARGET",
    accuse_submit:         "Accuse →",
    accuse_active:         "▸ Active Accusation",
    accuse_majority:       "Majority decides · all active players vote",
    guilty:                "GUILTY",
    innocent:              "INNOCENT",
    pending:               "PENDING",
    vote_guilty:           "⚑ Guilty",
    vote_innocent:         "✓ Innocent",
    you_voted:             "You voted:",
    you_are_accused:       "You are accused — waiting for the verdict…",
    abort_accuse:          "✕ Abort accusation",

    // Result modal
    winner_label:          "Winner",
    spy_label:             "The Spy",
    true_loc_label:        "True Location",

    // Misc
    confirm_leave:         "Leave the game? You will exit the room.",
    sites_suffix:          "sites",
  },


  // ── SWEDISH ──────────────────────────────────────────────────────
  sv: {
    brand_sub:             "Klassificerat Fältprotokoll · v2.0",
    secure_channel:        "Säker Kanal",
    case_file:             "Aktfil 00 · Genomgångsrum",
    hero_headline:         'Hitta <span class="accent">spionen</span><br/>innan de hittar platsen.',
    hero_blurb:            "Realtidsmultiplayer · 4–8 agenter · Var och en på sin enhet",
    deploy_host:           "▸ Starta som värd",
    step_01:               "Steg 01",
    codename_label:        "Agentens kodnamn",
    codename_ph:           "Ange ditt kodnamn…",
    create_room_btn:       "Skapa rum",
    or_divider:            "ELLER",
    enter_field:           "▸ Gå in i fältet",
    room_code_label:       "Rumskod",
    join_room_btn:         "Gå med i rum",
    briefing_room:         "Genomgångsrum",
    room_label:            "RUM",
    leave_btn:             "← Lämna",
    op_params:             "▸ Operationsparametrar",
    host_selects:          "Värd väljer",
    field_roster:          "▸ Fältlista",
    begin_mission:         "Påbörja uppdrag →",
    waiting_operatives:    "Väntar på agenter…",
    mode_label:            "Läge",
    players_label:         "Spelare",
    exit_btn:              "← Avsluta",
    field_operatives:      "▸ Fältagenter",
    player_status:         "Spelarstatus",
    cards_hint:            "Kort förseglade · tryck för att anklaga",
    accuse_btn:            "⌖ Anklaga spelare",
    declare_btn:           "⌬ Deklarera plats",
    loc_roster:            "Platsregister",
    field_tip:             "// FÄLTTIPS",
    field_tip_text:        "Tryck på en plats för att stryka den. Spion — identifiera vilken som stämmer med ledtrådarna.",
    view_card_label:       "Visa mitt hemliga kort",
    view_card_hint:        "tryck för att avslöja dossier",
    encrypted_dossier:     "▸ Krypterad akt",
    hold_privately:        "Håll enheten privat. Memorera din akt och stäng sedan.",
    classified_tap:        "Hemligstämplat · Tryck för att läsa",
    eyes_only:             "KONFIDENTIELLT",
    tap_reveal:            "Tryck för att avslöja identitet",
    hide_pass:             "Dölj · lämna enhet",
    accusation_label:      "▸ Anklagelse",
    spy_declaration:       "▸ Spiondeklaration",
    commit_blurb:          "Välj en plats. Rätt gissning vinner rundan för spionen.",
    one_attempt:           "ETT FÖRSÖK",
    commit_guess_btn:      "Bekräfta gissning →",
    round_resolved:        "▸ Runda avgjord",
    return_lobby_btn:      "Tillbaka till lobby",
    new_round_btn:         "Ny runda →",
    leave_room_btn:        "Lämna rummet",
    waiting_host:          "Väntar på att värden startar nästa runda…",
    loading_connecting:    "ANSLUTER…",
    loading_reconnecting:  "ÅTERANSLUTER…",
    loading_creating:      "SKAPAR RUM…",
    loading_joining:       "GÅR MED I RUM…",
    loading_briefing:      "BRIEFAR AGENTER…",
    loading_resolving:     "AVGÖR…",
    loading_transmitting:  "SÄNDER DEKLARATION…",
    loading_locations:     "LADDAR PLATSER…",
    toast_briefing:        "Briefing klar · Kolla ditt kort",
    toast_times_up:        "Tiden är ute · Gör en anklagelse",
    toast_link_copied:     "Länk kopierad!",
    toast_back_to_lobby:   "Tillbaka i lobbyn · Ställ in nästa runda",
    toast_card_not_ready:  "Ditt kort är inte klart än",
    toast_spy_only:        "Bara spionen kan deklarera en plats",
    toast_loc_error:       "Kunde inte ladda platser — försök igen",
    err_room_not_found:    "Rum hittades inte eller spelet har redan börjat",
    err_room_full:         "Rummet är fullt",
    err_already_in_room:   "Du är redan i det här rummet",
    err_join_failed:       "Kunde inte gå med i rummet — försök igen",
    badge_host:            "VÄRD",
    badge_you:             "DU",
    badge_agent:           "AGENT",
    badge_offline:         "OFFLINE",
    pcard_you:             "DU",
    pcard_offline:         "OFFLINE",
    pcard_active:          "AKTIV",
    pcard_accused:         "⚠ ANKLAGAD",
    pcard_out:             "✕ UTE",
    pcard_reconnecting:    "⚡ Återansluter…",
    pcard_in_field:        "I fältet",
    score_label:           "Poäng",
    score_civilians:       "Civila",
    score_spy:             "Spion",
    settings_title:        "▸ Rundinställningar",
    settings_host_ctrl:    "Värdens kontroller",
    settings_timer:        "Timer",
    settings_spies:        "Spioner",
    t01_name: "5 Minuter",  t01_desc: "Snabbt tempo · Högt tryck på alla.",
    t02_name: "8 Minuter",  t02_desc: "Standarduppdragets längd. Balanserat.",
    t03_name: "10 Minuter", t03_desc: "Förlängd förhörstid.",
    t04_name: "15 Minuter", t04_desc: "Lång operation · Djupt täckmantel.",
    s01_name: "1 Spion",    s01_desc: "En infiltratör. Klassisk deduktion.",
    s02_name: "2 Spioner",  s02_desc: "Två agenter. Dubbelt bedrägeri.",
    m01_name: "Klassiskt läge",   m01_desc: "En spion. Alla andra delar den hemliga platsen.",
    m02_name: "Dubbelagent",      m02_desc: "En dubbelagent känner platsen och skyddar spionen i hemlighet.",
    m03_name: "Tillståndsläge",   m03_desc: "Civila får var sin hemlig beteenderegel att följa.",
    m04_name: "Lockbetsläge",     m04_desc: "Spionen ser 4 platser — en riktig, tre falska. Lista ut vilken.",
    role_identity:         "Identitet",
    role_spy_title:        "DU ÄR SPIONEN",
    role_spy_sub:          "Smälta in. Lyssna på ledtrådarna. Gissa platsen innan de andra identifierar dig.",
    role_spy_decoy_sub:    "En av dessa 4 platser är den riktiga. Avgör det från konversationen — gissa sedan när du är redo.",
    role_cospies:          "Medspioner",
    role_cospies_none:     "Inga",
    role_cospies_double:   "Inga kända för dig",
    role_double_title:     "DUBBELAGENT",
    role_double_sub:       "Du känner platsen. Agera som civil — men ge vaga svar för att skydda den dolda spionen.",
    role_true_loc:         "Sann plats",
    role_cover:            "Din täckmantel",
    role_location:         "Plats",
    role_civ_sub:          "Avslöja spionen utan att avslöja för mycket. Håll ögonen öppna för tveksamheter.",
    role_your_role:        "Din roll",
    role_secret_cond:      "Hemligt tillstånd",
    seat_eyes_only:        "Konfidentiellt",
    accuse_blurb:          "Välj den agent du misstänker. Värden bekräftar eller avbryter anklagelsen.",
    accuse_select:         "VÄLJ MÅL",
    accuse_submit:         "Anklaga →",
    accuse_active:         "▸ Aktiv anklagelse",
    accuse_majority:       "Majoritet avgör · alla aktiva spelare röstar",
    guilty:                "SKYLDIG",
    innocent:              "OSKYLDIG",
    pending:               "AVVAKTAR",
    vote_guilty:           "⚑ Skyldig",
    vote_innocent:         "✓ Oskyldig",
    you_voted:             "Du röstade:",
    you_are_accused:       "Du är anklagad — väntar på domen…",
    abort_accuse:          "✕ Avbryt anklagelse",
    winner_label:          "Vinnare",
    spy_label:             "Spionen",
    true_loc_label:        "Sann plats",
    confirm_leave:         "Lämna spelet? Du lämnar rummet.",
    sites_suffix:          "platser",
  },


  // ── ARABIC ───────────────────────────────────────────────────────
  ar: {
    brand_sub:             "بروتوكول ميداني سري · الإصدار 2.0",
    secure_channel:        "قناة آمنة",
    case_file:             "ملف القضية 00 · غرفة الإحاطة",
    hero_headline:         'اعثر على <span class="accent">الجاسوس</span><br/>قبل أن يكتشف الموقع.',
    hero_blurb:            "متعدد اللاعبين الفوري · 4–8 عملاء · كل منهم على جهازه",
    deploy_host:           "▸ ابدأ كمضيف",
    step_01:               "الخطوة 01",
    codename_label:        "الاسم الرمزي للعميل",
    codename_ph:           "أدخل اسمك الرمزي…",
    create_room_btn:       "إنشاء غرفة",
    or_divider:            "أو",
    enter_field:           "▸ الدخول للميدان",
    room_code_label:       "رمز الغرفة",
    join_room_btn:         "انضم للغرفة",
    briefing_room:         "غرفة الإحاطة",
    room_label:            "الغرفة",
    leave_btn:             "مغادرة ←",
    op_params:             "▸ معامل العملية",
    host_selects:          "المضيف يختار",
    field_roster:          "▸ قائمة الميدان",
    begin_mission:         "← ابدأ المهمة",
    waiting_operatives:    "في انتظار العملاء…",
    mode_label:            "النمط",
    players_label:         "اللاعبون",
    exit_btn:              "خروج ←",
    field_operatives:      "▸ عملاء الميدان",
    player_status:         "حالة اللاعبين",
    cards_hint:            "البطاقات مختومة · اضغط للاتهام",
    accuse_btn:            "⌖ اتهام لاعب",
    declare_btn:           "⌬ الإعلان عن الموقع",
    loc_roster:            "قائمة المواقع",
    field_tip:             "// نصيحة ميدانية",
    field_tip_text:        "اضغط على موقع لشطبه. الجاسوس — حدد أيها يتطابق مع الأدلة.",
    view_card_label:       "عرض بطاقتي السرية",
    view_card_hint:        "اضغط للكشف عن الملف",
    encrypted_dossier:     "▸ ملف مشفر",
    hold_privately:        "احتفظ بالجهاز بخصوصية. احفظ ملفك ثم أغلق.",
    classified_tap:        "سري · اضغط للقراءة",
    eyes_only:             "للعيون فقط",
    tap_reveal:            "اضغط للكشف عن الهوية",
    hide_pass:             "أخفِ · مرر الجهاز",
    accusation_label:      "▸ الاتهام",
    spy_declaration:       "▸ إعلان الجاسوس",
    commit_blurb:          "حدد موقعاً. التخمين الصحيح يفوز بالجولة للجاسوس.",
    one_attempt:           "محاولة واحدة",
    commit_guess_btn:      "← تأكيد التخمين",
    round_resolved:        "▸ انتهت الجولة",
    return_lobby_btn:      "العودة إلى الردهة",
    new_round_btn:         "← جولة جديدة",
    leave_room_btn:        "مغادرة الغرفة",
    waiting_host:          "في انتظار المضيف لبدء الجولة التالية…",
    loading_connecting:    "جارٍ الاتصال…",
    loading_reconnecting:  "إعادة الاتصال…",
    loading_creating:      "جارٍ إنشاء الغرفة…",
    loading_joining:       "جارٍ الانضمام…",
    loading_briefing:      "إحاطة العملاء…",
    loading_resolving:     "جارٍ الحل…",
    loading_transmitting:  "إرسال الإعلان…",
    loading_locations:     "تحميل المواقع…",
    toast_briefing:        "الإحاطة مكتملة · تحقق من بطاقتك",
    toast_times_up:        "انتهى الوقت · قدم اتهاماً",
    toast_link_copied:     "تم نسخ الرابط!",
    toast_back_to_lobby:   "عدنا إلى الردهة · جهّز الجولة التالية",
    toast_card_not_ready:  "بطاقتك غير جاهزة بعد",
    toast_spy_only:        "الجاسوس فقط يمكنه الإعلان عن الموقع",
    toast_loc_error:       "تعذر تحميل المواقع — حاول مجدداً",
    err_room_not_found:    "الغرفة غير موجودة أو اللعبة بدأت بالفعل",
    err_room_full:         "الغرفة ممتلئة",
    err_already_in_room:   "أنت موجود بالفعل في هذه الغرفة",
    err_join_failed:       "تعذّر الانضمام إلى الغرفة — حاول مرة أخرى",
    badge_host:            "مضيف",
    badge_you:             "أنت",
    badge_agent:           "عميل",
    badge_offline:         "غير متصل",
    pcard_you:             "أنت",
    pcard_offline:         "غير متصل",
    pcard_active:          "نشط",
    pcard_accused:         "⚠ متهم",
    pcard_out:             "✕ خارج",
    pcard_reconnecting:    "⚡ إعادة اتصال…",
    pcard_in_field:        "في الميدان",
    score_label:           "النتيجة",
    score_civilians:       "المدنيون",
    score_spy:             "الجاسوس",
    settings_title:        "▸ إعدادات الجولة",
    settings_host_ctrl:    "تحكم المضيف",
    settings_timer:        "المؤقت",
    settings_spies:        "الجواسيس",
    t01_name: "5 دقائق",   t01_desc: "وتيرة سريعة · ضغط عالٍ على الجميع.",
    t02_name: "8 دقائق",   t02_desc: "مدة مهمة قياسية. متوازنة.",
    t03_name: "10 دقائق",  t03_desc: "وقت استجواب ممتد.",
    t04_name: "15 دقيقة",  t04_desc: "عملية طويلة · غطاء عميق.",
    s01_name: "جاسوس واحد", s01_desc: "متسلل واحد. استنتاج كلاسيكي.",
    s02_name: "جاسوسان",    s02_desc: "عميلان. خداع مضاعف.",
    m01_name: "النمط الكلاسيكي",   m01_desc: "جاسوس واحد. الباقون يشتركون في الموقع السري.",
    m02_name: "العميل المزدوج",     m02_desc: "العميل المزدوج يعرف الموقع ويحمي الجاسوس سراً.",
    m03_name: "نمط الشروط",        m03_desc: "يحصل كل مدني على قاعدة سلوك سرية لاتباعها.",
    m04_name: "نمط الطُّعم",       m04_desc: "يرى الجاسوس 4 مواقع — واحد حقيقي وثلاثة مزيفة. استنتج أيها.",
    role_identity:         "الهوية",
    role_spy_title:        "أنت الجاسوس",
    role_spy_sub:          "اندمج مع الآخرين. استمع إلى الأدلة. خمّن الموقع قبل أن يكشفوك.",
    role_spy_decoy_sub:    "أحد هذه المواقع الأربعة هو الحقيقي. استنتجه من المحادثة — ثم خمّن عندما تكون مستعداً.",
    role_cospies:          "زملاء الجواسيس",
    role_cospies_none:     "لا أحد",
    role_cospies_double:   "لا أحد معروف لك",
    role_double_title:     "العميل المزدوج",
    role_double_sub:       "أنت تعرف الموقع. تصرف كمدني — لكن أعطِ إجابات مبهمة لحماية الجاسوس المخفي.",
    role_true_loc:         "الموقع الحقيقي",
    role_cover:            "غطاؤك",
    role_location:         "الموقع",
    role_civ_sub:          "اكشف الجاسوس دون الإفصاح كثيراً. راقب التردد.",
    role_your_role:        "دورك",
    role_secret_cond:      "الشرط السري",
    seat_eyes_only:        "للعيون فقط",
    accuse_blurb:          "اختر العميل الذي تشك فيه. المضيف سيؤكد أو يلغي الاتهام.",
    accuse_select:         "اختر الهدف",
    accuse_submit:         "← اتهم",
    accuse_active:         "▸ اتهام نشط",
    accuse_majority:       "الأغلبية تقرر · جميع اللاعبين النشطين يصوتون",
    guilty:                "مذنب",
    innocent:              "بريء",
    pending:               "معلق",
    vote_guilty:           "⚑ مذنب",
    vote_innocent:         "✓ بريء",
    you_voted:             "صوّتت:",
    you_are_accused:       "أنت متهم — في انتظار الحكم…",
    abort_accuse:          "✕ إلغاء الاتهام",
    winner_label:          "الفائز",
    spy_label:             "الجاسوس",
    true_loc_label:        "الموقع الحقيقي",
    confirm_leave:         "هل تريد مغادرة اللعبة؟ ستخرج من الغرفة.",
    sites_suffix:          "مواقع",
  }
};

// ── Core ──────────────────────────────────────────────────────────

let LANG = localStorage.getItem("dd_lang") || "en";

/** Return translated string, falling back to English, then the key itself. */
function t(key) {
  return TRANSLATIONS[LANG]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

/** Lobby ready/waiting strings with per-language plural logic. */
function lobbyReadyStr(n) {
  if (LANG === "ar") return `${n} عملاء جاهزون · ابدأ عندما ينضم الجميع`;
  if (LANG === "sv") return `${n} agent${n !== 1 ? "er" : ""} redo · Börja när alla har anslutit`;
  return `${n} operative${n !== 1 ? "s" : ""} ready · Begin when all have joined`;
}
function lobbyWaitStr(need) {
  if (LANG === "ar") return `في انتظار ${need} عملاء آخرين…`;
  if (LANG === "sv") return `Väntar på ${need} agent${need !== 1 ? "er" : ""} till…`;
  return `Waiting for ${need} more operative${need !== 1 ? "s" : ""}…`;
}

// ── DOM helpers ───────────────────────────────────────────────────

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
}

function _updateLangPicker() {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.lang === LANG);
  });
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem("dd_lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === "ar" ? "rtl" : "ltr";
  applyStaticTranslations();
  _updateLangPicker();
  // Re-render dynamic content if a game is active
  if (typeof S !== "undefined" && S.room) {
    const screen = document.querySelector(".screen.is-active");
    if (screen?.id === "screen-lobby")     renderLobby();
    else if (screen?.id === "screen-game") renderGame();
  }
}

// ── Init ──────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = LANG;
  document.documentElement.dir  = LANG === "ar" ? "rtl" : "ltr";
  applyStaticTranslations();
  _updateLangPicker();

  document.addEventListener("click", e => {
    const btn = e.target.closest(".lang-btn");
    if (btn?.dataset.lang) setLang(btn.dataset.lang);
  });
});
