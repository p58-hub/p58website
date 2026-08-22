// =========================================================
// i18n.jsx — language state, dictionary, hooks, toggle
// =========================================================
// Two languages: en (default), gr (Greek).
// Persisted in localStorage["p58_lang"].
//
// Usage in components:
//   const t = window.useT();   t("retail")  →  "Retail" or "Λιανική"
//   const pick = window.usePick(); pick(project, "name") → name_gr fallback to name
// =========================================================

const I18N_KEY = "p58_lang";
const LangContext = React.createContext(null);

function LangProvider({ children }) {
  const [lang, setLangState] = React.useState(() => {
    try {
      const previewLang = new URLSearchParams(location.search).get("previewLang");
      return previewLang === "gr" || previewLang === "en" ? previewLang : localStorage.getItem(I18N_KEY) || "en";
    } catch (e) { return "en"; }
  });
  const setLang = React.useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(I18N_KEY, l); } catch (e) {}
    document.documentElement.lang = l === "gr" ? "el" : "en";
  }, []);
  React.useEffect(() => {
    document.documentElement.lang = lang === "gr" ? "el" : "en";
  }, [lang]);
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

function useLang() {
  const ctx = React.useContext(LangContext);
  return ctx || { lang: "en", setLang: () => {} };
}

function useT() {
  const { lang } = useLang();
  let textPreview = null;
  try {
    const previewKey = new URLSearchParams(location.search).get("textPreview");
    const storedPreview = JSON.parse(localStorage.getItem("p58_website_text_preview") || "null");
    if (previewKey && storedPreview && storedPreview.key === previewKey && storedPreview.lang === lang && Date.now() - storedPreview.createdAt < 60 * 60 * 1000) textPreview = storedPreview;
  } catch (error) {}
  const stored = window.readP58Store ? window.readP58Store() : null;
  const websiteTexts = stored && stored.site && stored.site.websiteTexts && stored.site.websiteTexts[lang]
    ? stored.site.websiteTexts[lang]
    : {};
  return React.useCallback((key) => {
    if (textPreview && textPreview.key === key) return textPreview.value;
    if (websiteTexts[key] != null && websiteTexts[key] !== "") return websiteTexts[key];
    const dict = DICT[lang] || DICT.en;
    if (dict[key] != null) return dict[key];
    if (DICT.en[key] != null) return DICT.en[key];
    return key;
  }, [lang, JSON.stringify(websiteTexts), JSON.stringify(textPreview)]);
}

// pick a localised content field: pick(project, "name") → project.name_gr if lang=gr & set, else project.name
function usePick() {
  const { lang } = useLang();
  return React.useCallback((obj, field) => {
    if (!obj) return "";
    if (lang === "gr") {
      const grKey = field + "_gr";
      if (obj[grKey] != null && obj[grKey] !== "") return obj[grKey];
    }
    return obj[field] != null ? obj[field] : "";
  }, [lang]);
}

/* ================ Language toggle (segmented control) ================ */
function LangToggle({ compact }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-toggle ${compact ? "compact" : ""}`} role="tablist" aria-label="Language">
      <button
        role="tab"
        aria-selected={lang === "en"}
        className={lang === "en" ? "on" : ""}
        onClick={() => setLang("en")}>EN</button>
      <button
        role="tab"
        aria-selected={lang === "gr"}
        className={lang === "gr" ? "on" : ""}
        onClick={() => setLang("gr")}>GR</button>
    </div>
  );
}

/* ================ Dictionary ================ */
const DICT = {
  en: {
    // nav
    retail: "Retail",
    residential: "Residential",
    agency: "People",
    contact: "Contact",
    home: "Home",
    menu: "Menu",
    more: "More",
    search_placeholder: "Search projects, brands, pages…",
    no_results: "No results for",
    nav: "navigate",
    open_kbd: "open",
    close_kbd: "close",
    retail_brands: "Retail brands",
    project_types: "Project types",
    projects: "Projects",
    categories_view: "Categories",
    all_projects_view: "All projects",
    all: "All",
    all_brands: "All brands",
    sort: "Sort",
    sort_date: "Completion date",
    sort_region: "Region · City",
    primary_navigation: "Primary navigation",
    search: "Search",
    language: "Language",
    switch_language: "Switch language",
    scroll: "Scroll",
    project: "Project",
    country_greece: "Greece",
    show_next_gallery: "Show next gallery image",
    page_progress: "Page progress",
    back: "Back",
    back_to_top: "Back to top",
    back_to_people: "Back to People",
    view_profile: "View profile",

    // projects rail — the pane that closes the works index
    rail_end_eyebrow: "End of selection",
    rail_end_h: "Let's design your next space.",
    rail_end_cta: "Start a project",

    // mobile drawer
    menu_eyebrow: "Project58 · Menu",
    studio_location: "Athens",

    // home
    home_strip_eyebrow: "/01 — Interiors · Multi-site retail across Athens & Piraeus",
    home_strip_h: "Selected work.",
    see_more_projects: "See more projects",
    see_all_projects: "See all projects",
    all_rooms_cta: "All projects",
    view_project: "View project",
    home_note_eyebrow: "/02 — Note",
    home_note: "A practice for buildings, shops",
    home_note_em: "& the rooms",
    home_note_tail: "in between.",
    location: "Location",
    year: "Year",
    size: "Size",
    status: "Status",
    home_hero_kicker: "Project58 Architecture & Design Practice",
    home_hero_title: "Designing for an emerging world!",
    home_hero_body: "We create architecture, interiors, design, and research for innovative solutions in an emerging world.",
    home_practice_kicker: "01 / Practice",
    home_practice_title: "Project58 is an architecture and design practice based in Athens, Greece. We can design your residence, your business and your workplace.",
    home_method_computational: "Computational design",
    home_method_human: "Human-centered design",
    home_method_data: "Data-driven design",
    home_method_research: "Research",
    home_method_environmental: "Environmental design",
    home_scalable_kicker: "Scalable design systems",
    home_scalable_text: "We developed scalable design systems for two fast-casual brands, delivering 10+ shops across Greece in less than a year.",
    home_systems_kicker: "03 / Design systems",
    home_systems_title: "We focus on human-centered design, technology, and data-driven research in order to shape meaningful spatial experiences.",
    view_all_projects: "View all projects",
    recent_projects: "Recent Projects",
    no_projects_category: "No projects in this category yet.",
    residential_coming_soon: "Residential projects coming soon.",

    // interiors
    interiors_h: "Retail.",
    interiors_eyebrow: "/ Twelve rooms · 2023 — 2026  ·  Multi-site retail · Fixtures · Roll-out",
    interiors_brand_eyebrow_a: "/",
    interiors_brand_eyebrow_b: " rooms · Multi-site retail",
    two_operators: "Two operators",
    rooms_plus_rooms: "rooms",
    proj_word: "projects",
    pg_rollout: "Protein Garden roll-out",
    dn_rollout: "Dinas roll-out",

    // architecture
    arch_h: "Residential.",
    arch_eyebrow: "/ Buildings · Renovations · New-build  ·  In development",
    arch_meta_a: "2026 — onward",
    arch_meta_b: "Open for commissions",
    arch_note_eyebrow: "/01 — Note",
    arch_note_a: "Our ground-up",
    arch_note_em: "architecture & renovation",
    arch_note_b: "portfolio is in development. First projects launch through 2026.",

    // services (names)
    svc_arch: "Architecture",
    svc_arch_d: "Ground-up buildings, additions, and full architectural services from feasibility through permit and construction administration. Equal attention to plan, fixture and site.",
    svc_arch_b: ["Concept & feasibility", "Planning & permit", "Construction administration", "Site supervision"],
    svc_reno: "Renovation",
    svc_reno_d: "Whole-floor and whole-building renovations of post-war housing, commercial shells, and listed structures. We work as much with what is there as with what is added.",
    svc_reno_b: ["Heritage and post-war housing", "Structural reorganisation", "Material reclamation", "Permit-grade conversions"],
    svc_ret: "Retail & hospitality",
    svc_ret_d: "Quick-service shops, bakeries, kiosks, restaurants and counter-led hospitality. Single-site work and roll-out systems for operators with multiple locations.",
    svc_ret_b: ["Single-site fit-out", "Multi-site roll-out systems", "Operator handover documentation", "Brand-aligned fixturing"],
    svc_wp: "Workplace",
    svc_wp_d: "Small and mid-sized studios, professional practices, and headquarters fit-outs for owner-led businesses.",
    svc_wp_b: ["Floor planning", "Acoustic & lighting strategy", "Bespoke joinery"],

    work_with_us: "/ Work with us",
    arch_cta: "Briefing for",
    cta_2026: "2026",
    arch_cta_tail: "commissions — renovation, additions, new-build.",
    agency_cta: "Open for",
    agency_cta_tail: "commissions — retail, renovation, one or two new-builds.",

    // agency
    agency_eyebrow: "/ The agency  ·  Eight people, two cities",
    agency_h_a: "An architectural",
    agency_h_em: "practice,",
    agency_h_b: "first.",
    agency_p1: "Founded in 2018, Project58 is a Greek architecture studio working at the scale of the room and the building — half our work is",
    agency_p1_em: "quick-service retail",
    agency_p1_b: ", the other half is",
    agency_p1_em2: "renovation",
    agency_p1_c: ". We do not run a separate interior service; the interior is part of the architecture.",
    agency_p2: "We operate from Thessaloniki and Athens, with eight people across architecture, project delivery and model-making. Repeat operators on multi-site programmes and one or two listed shells per year.",
    team_eyebrow: "/02",
    team_h: "The team",
    headcount: "Headcount",
    headcount_unit: "people",
    studios: "Studios",
    updated_label: "Updated 2026.03",
    practice_eyebrow: "/ 03 — Practice",
    short_history: "A short history.",
    news_eyebrow: "/ 04 — News & press",
    search_news: "News",
    recently: "Recently in the studio.",

    // project detail
    pd_code: "Project",
    pd_details: "Details",
    pd_description: "Description",
    pd_type: "Type",
    pd_contractor: "Contractor",
    pd_engineer: "Engineer",
    pd_lead_architect: "Lead Architect",
    pd_design_team: "Design Team",
    next_project: "Next project",
    view: "View",

    // footer
    foot_studio: "Studio",
    foot_thess: "Thessaloniki",
    foot_athens: "Athens",
    foot_copy_left: "© 2025 — 2026 Project58 Architecture",
    foot_copy_mid: "Architecture · Renovation · Retail",
    foot_copy_right: "Designed in-house · v1.0",
    foot_addr_thess: "Vasilissis Olgas 84\n546 43 Thessaloniki\nGreece",
    foot_addr_athens: "Akademias 76\n106 76 Athens\nGreece",
    foot_big: "Let’s design your",
    foot_big_em: "next space!",
    foot_instagram: "Instagram → @project.58",
    foot_meet: "Let’s meet!",

    // appointment form — the "step 0" screen shown before the four questions
    inquiry_intro_kicker: "Before we begin",
    inquiry_intro_cta: "Continue",
    inquiry_intro_title: "Before we meet, a little context.",
    inquiry_intro_body: "Four short questions about the space and the idea behind it. They let us walk into the appointment already thinking about your project — with the right people in the room and something to show you.",
    inquiry_success_title: "Thank you — we’ve got your details.",
    inquiry_success_body: "We’ll review your project and get back to you by email within two business days.",
    inquiry_call: "Prefer to talk now? Call us at",
    inquiry_close: "Close",
    inquiry_step: "Step",
    inquiry_of: "of",
    inquiry_title: "Project inquiry",
    inquiry_empty: "This form has no questions yet.",
    inquiry_back: "Back",
    inquiry_continue: "Continue",
    inquiry_sending: "Sending…",
    inquiry_send: "Send inquiry",
    inquiry_back_contact: "Back to contact",

    // status options (project content). The three current ones come from
    // the dashboard dropdown; the lowercase entries below are older values
    // still sitting in saved content and are kept so those keep rendering.
    "Design Phase": "Design Phase",
    "In Construction": "In Construction",
    "Built": "Built",
    "Completed": "Completed",
    "In construction": "In construction",
    "In design": "In design",
    "Concept": "Concept",

    // body section headings (common ones)
    "Brief": "Brief",
    "Move": "Move",
    "Material": "Material",
    "Site": "Site",
    "Light": "Light",
    "Approach": "Approach",
    "Refinement": "Refinement",
    "Plan": "Plan",
    "Idea": "Idea",
    "Inside": "Inside",
  },

  gr: {
    // nav
    retail: "Λιανική",
    residential: "Κατοικίες",
    agency: "Άνθρωποι",
    contact: "Επικοινωνία",
    home: "Αρχική",
    menu: "Μενού",
    more: "Περισσότερα",
    search_placeholder: "Αναζήτηση έργων, brands, σελίδων…",
    no_results: "Κανένα αποτέλεσμα για",
    nav: "πλοήγηση",
    open_kbd: "άνοιγμα",
    close_kbd: "κλείσιμο",
    retail_brands: "Brands λιανικής",
    project_types: "Τύποι έργων",
    projects: "Έργα",
    categories_view: "Κατηγορίες",
    all_projects_view: "Όλα τα έργα",
    all: "Όλα",
    all_brands: "Όλα τα brands",
    sort: "Ταξινόμηση",
    sort_date: "Ημερομηνία ολοκλήρωσης",
    sort_region: "Περιοχή · Πόλη",
    primary_navigation: "Κύρια πλοήγηση",
    search: "Αναζήτηση",
    language: "Γλώσσα",
    switch_language: "Αλλαγή γλώσσας",
    scroll: "Κύλιση",
    project: "Έργο",
    country_greece: "Ελλάδα",
    show_next_gallery: "Εμφάνιση επόμενης εικόνας",
    page_progress: "Πρόοδος σελίδας",
    back: "Πίσω",
    back_to_top: "Επιστροφή στην κορυφή",
    back_to_people: "Πίσω στους ανθρώπους",
    view_profile: "Προβολή προφίλ",

    // projects rail — the pane that closes the works index
    rail_end_eyebrow: "Τέλος επιλογής",
    rail_end_h: "Ας σχεδιάσουμε τον επόμενο χώρο σας.",
    rail_end_cta: "Ξεκινήστε ένα έργο",

    // mobile drawer
    menu_eyebrow: "Project58 · Μενού",
    studio_location: "Αθήνα",

    // home
    home_strip_eyebrow: "/01 — Εσωτερικοί χώροι · Λιανική σε πολλαπλά σημεία στην Αθήνα και τον Πειραιά",
    home_strip_h: "Επιλεγμένα έργα.",
    see_more_projects: "Δείτε περισσότερα έργα",
    see_all_projects: "Δείτε όλα τα έργα",
    all_rooms_cta: "Όλα τα έργα",
    view_project: "Δες το έργο",
    home_note_eyebrow: "/02 — Σημείωση",
    home_note: "Ένα γραφείο για κτίρια, καταστήματα",
    home_note_em: "& τα δωμάτια",
    home_note_tail: "στο ενδιάμεσο.",
    location: "Τοποθεσία",
    year: "Έτος",
    size: "Μέγεθος",
    status: "Κατάσταση",
    home_hero_kicker: "Project58 Αρχιτεκτονική & Σχεδιασμός",
    home_hero_title: "Σχεδιάζοντας για έναν κόσμο που εξελίσσεται!",
    home_hero_body: "Δημιουργούμε αρχιτεκτονική, εσωτερικούς χώρους, σχεδιασμό και έρευνα για καινοτόμες λύσεις σε έναν κόσμο που εξελίσσεται.",
    home_practice_kicker: "01 / Γραφείο",
    home_practice_title: "Το Project58 είναι ένα γραφείο αρχιτεκτονικής και σχεδιασμού με έδρα την Αθήνα. Μπορούμε να σχεδιάσουμε την κατοικία, την επιχείρηση και τον χώρο εργασίας σας.",
    home_method_computational: "Υπολογιστικός σχεδιασμός",
    home_method_human: "Ανθρωποκεντρικός σχεδιασμός",
    home_method_data: "Σχεδιασμός βάσει δεδομένων",
    home_method_research: "Έρευνα",
    home_method_environmental: "Περιβαλλοντικός σχεδιασμός",
    home_scalable_kicker: "Κλιμακούμενα συστήματα σχεδιασμού",
    home_scalable_text: "Αναπτύξαμε κλιμακούμενα συστήματα σχεδιασμού για δύο εμπορικά σήματα γρήγορης εστίασης, παραδίδοντας περισσότερα από 10 καταστήματα σε όλη την Ελλάδα σε λιγότερο από έναν χρόνο.",
    home_systems_kicker: "03 / Συστήματα σχεδιασμού",
    home_systems_title: "Εστιάζουμε στον ανθρωποκεντρικό σχεδιασμό, την τεχνολογία και την έρευνα βάσει δεδομένων, ώστε να διαμορφώνουμε ουσιαστικές χωρικές εμπειρίες.",
    view_all_projects: "Δείτε όλα τα έργα",
    recent_projects: "Πρόσφατα έργα",
    no_projects_category: "Δεν υπάρχουν ακόμη έργα σε αυτή την κατηγορία.",
    residential_coming_soon: "Τα έργα κατοικίας θα παρουσιαστούν σύντομα.",

    // interiors
    interiors_h: "Λιανική.",
    interiors_eyebrow: "/ Δώδεκα δωμάτια · 2023 — 2026  ·  Λιανική πολλαπλών σημείων · Έπιπλα · Roll-out",
    interiors_brand_eyebrow_a: "/",
    interiors_brand_eyebrow_b: " δωμάτια · Λιανική πολλαπλών σημείων",
    two_operators: "Δύο operators",
    rooms_plus_rooms: "δωμάτια",
    proj_word: "έργα",
    pg_rollout: "Roll-out Protein Garden",
    dn_rollout: "Roll-out Dinas",

    // architecture
    arch_h: "Κατοικίες.",
    arch_eyebrow: "/ Κτίρια · Ανακαινίσεις · Νέα κατασκευή  ·  Σε εξέλιξη",
    arch_meta_a: "2026 — και μετά",
    arch_meta_b: "Δεκτές αναθέσεις",
    arch_note_eyebrow: "/01 — Σημείωση",
    arch_note_a: "Το χαρτοφυλάκιό μας σε",
    arch_note_em: "αρχιτεκτονική & ανακαίνιση",
    arch_note_b: "αναπτύσσεται. Τα πρώτα έργα παρουσιάζονται στο 2026.",

    svc_arch: "Αρχιτεκτονική",
    svc_arch_d: "Νέα κτίρια, προσθήκες, και πλήρης αρχιτεκτονική υπηρεσία από τη σύλληψη έως την άδεια και τη διαχείριση κατασκευής. Ίση προσοχή σε κάτοψη, έπιπλο και χώρο.",
    svc_arch_b: ["Σύλληψη & σκοπιμότητα", "Σχεδιασμός & άδεια", "Διαχείριση κατασκευής", "Επίβλεψη εργοταξίου"],
    svc_reno: "Ανακαίνιση",
    svc_reno_d: "Ανακαινίσεις ορόφων και ολόκληρων κτιρίων σε μεταπολεμικές κατοικίες, εμπορικά κελύφη και διατηρητέα κτίρια. Δουλεύουμε εξίσου με αυτό που υπάρχει και αυτό που προστίθεται.",
    svc_reno_b: ["Διατηρητέα & μεταπολεμικές κατοικίες", "Δομική αναδιοργάνωση", "Επανάχρηση υλικών", "Μετατροπές αδειοδότησης"],
    svc_ret: "Λιανική & φιλοξενία",
    svc_ret_d: "Καταστήματα γρήγορου σερβίς, αρτοποιεία, περίπτερα, εστιατόρια και bar-led φιλοξενία. Έργα ενός σημείου και συστήματα roll-out για operators πολλαπλών τοποθεσιών.",
    svc_ret_b: ["Έργα ενός σημείου", "Συστήματα roll-out", "Τεκμηρίωση παράδοσης", "Έπιπλα brand-aligned"],
    svc_wp: "Χώροι εργασίας",
    svc_wp_d: "Μικρά και μεσαία στούντιο, επαγγελματικά γραφεία και έδρες εταιρειών για ιδιοκτήτες επιχειρήσεων.",
    svc_wp_b: ["Διάταξη χώρου", "Στρατηγική ακουστικής & φωτισμού", "Custom ξυλουργικά"],

    work_with_us: "/ Συνεργαστείτε μαζί μας",
    arch_cta: "Briefing για αναθέσεις",
    cta_2026: "2026",
    arch_cta_tail: "— ανακαίνιση, προσθήκες, νέα κατασκευή.",
    agency_cta: "Δεκτές αναθέσεις",
    agency_cta_tail: "— λιανική, ανακαίνιση, μία-δύο νέες κατασκευές.",

    // agency
    agency_eyebrow: "/ Το γραφείο  ·  Οκτώ άνθρωποι, δύο πόλεις",
    agency_h_a: "Πρωτίστως ένα",
    agency_h_em: "αρχιτεκτονικό",
    agency_h_b: "γραφείο.",
    agency_p1: "Ιδρύθηκε το 2018, το Project58 είναι ένα ελληνικό αρχιτεκτονικό γραφείο που εργάζεται στην κλίμακα του δωματίου και του κτιρίου — το ήμισυ της δουλειάς μας είναι",
    agency_p1_em: "λιανική γρήγορου σερβίς",
    agency_p1_b: ", το άλλο ήμισυ είναι",
    agency_p1_em2: "ανακαίνιση",
    agency_p1_c: ". Δεν λειτουργούμε ξεχωριστή υπηρεσία εσωτερικού χώρου· το εσωτερικό είναι μέρος της αρχιτεκτονικής.",
    agency_p2: "Δραστηριοποιούμαστε από Θεσσαλονίκη και Αθήνα, με οκτώ άτομα σε αρχιτεκτονική, διαχείριση έργου και κατασκευή μακέτας. Επανερχόμενοι operators σε προγράμματα πολλαπλών σημείων και ένα-δύο διατηρητέα κελύφη ανά έτος.",
    team_eyebrow: "/02",
    team_h: "Η ομάδα",
    headcount: "Σύνθεση",
    headcount_unit: "άτομα",
    studios: "Στούντιο",
    updated_label: "Ενημ. 2026.03",
    practice_eyebrow: "/ 03 — Πρακτική",
    short_history: "Μια σύντομη ιστορία.",
    news_eyebrow: "/ 04 — Νέα & τύπος",
    search_news: "Νέα",
    recently: "Πρόσφατα στο γραφείο.",

    // project detail
    pd_code: "Έργο",
    pd_details: "Στοιχεία",
    pd_description: "Περιγραφή",
    pd_type: "Τύπος",
    pd_contractor: "Εργολάβος",
    pd_engineer: "Μηχανολόγος",
    pd_lead_architect: "Επικεφαλής Αρχιτέκτονας",
    pd_design_team: "Ομάδα Μελέτης",
    next_project: "Επόμενο έργο",
    view: "Δες",

    // footer
    foot_studio: "Στούντιο",
    foot_thess: "Θεσσαλονίκη",
    foot_athens: "Αθήνα",
    foot_copy_left: "© 2025 — 2026 Project58 Αρχιτεκτονική",
    foot_copy_mid: "Αρχιτεκτονική · Ανακαίνιση · Λιανική",
    foot_copy_right: "Σχεδιασμός από το γραφείο · v1.0",
    foot_addr_thess: "Βασιλίσσης Όλγας 84\n546 43 Θεσσαλονίκη\nΕλλάδα",
    foot_addr_athens: "Ακαδημίας 76\n106 76 Αθήνα\nΕλλάδα",
    foot_big: "Ας σχεδιάσουμε τον",
    foot_big_em: "επόμενο χώρο σας!",
    foot_instagram: "Instagram → @project.58",
    foot_meet: "Ας γνωριστούμε!",

    // appointment form — the "step 0" screen shown before the four questions
    inquiry_intro_kicker: "Πριν ξεκινήσουμε",
    inquiry_intro_cta: "Συνέχεια",
    inquiry_intro_title: "Πριν συναντηθούμε, λίγα λόγια για εσάς.",
    inquiry_intro_body: "Τέσσερις σύντομες ερωτήσεις για τον χώρο και την ιδέα πίσω από αυτόν. Μας επιτρέπουν να έρθουμε στο ραντεβού έχοντας ήδη σκεφτεί το έργο σας — με τους κατάλληλους ανθρώπους και κάτι έτοιμο να σας δείξουμε.",
    inquiry_success_title: "Ευχαριστούμε — λάβαμε τα στοιχεία σας.",
    inquiry_success_body: "Θα εξετάσουμε το έργο σας και θα επικοινωνήσουμε μαζί σας μέσω email μέσα σε δύο εργάσιμες ημέρες.",
    inquiry_call: "Προτιμάτε να μιλήσουμε τώρα; Καλέστε μας στο",
    inquiry_close: "Κλείσιμο",
    inquiry_step: "Βήμα",
    inquiry_of: "από",
    inquiry_title: "Εκδήλωση ενδιαφέροντος",
    inquiry_empty: "Η φόρμα δεν έχει ακόμη ερωτήσεις.",
    inquiry_back: "Πίσω",
    inquiry_continue: "Συνέχεια",
    inquiry_sending: "Αποστολή…",
    inquiry_send: "Αποστολή αιτήματος",
    inquiry_back_contact: "Πίσω στην επικοινωνία",

    // status options
    "Design Phase": "Στάδιο Μελέτης",
    "In Construction": "Υπό Κατασκευή",
    "Built": "Ολοκληρωμένο",
    "Completed": "Ολοκληρωμένο",
    "In construction": "Σε κατασκευή",
    "In design": "Σε σχεδιασμό",
    "Concept": "Concept",

    // project gallery captions
    "Streetfront elevation": "Όψη προς τον δρόμο",
    "Counter & queue line": "Πάγκος & γραμμή αναμονής",
    "Seating banquette": "Πάγκος καθιστικού",
    "Counter axial": "Αξονική άποψη πάγκου",
    "Mirror end-wall": "Τελικός τοίχος με καθρέφτη",
    "Streetfront": "Όψη δρόμου",
    "Interior, counter view": "Εσωτερικό, άποψη πάγκου",
    "Seating zone": "Ζώνη καθιστικού",
    "Back wall, fixtures": "Πίσω τοίχος, εξοπλισμός",
    "Interior 1": "Εσωτερικό 1",
    "Interior 2": "Εσωτερικό 2",
    "Second elevation": "Δεύτερη όψη",
    "Counter detail": "Λεπτομέρεια πάγκου",
    "Banquette end": "Απόληξη πάγκου καθιστικού",
    "Deep room axial": "Αξονική άποψη του χώρου",
    "Pickup window": "Παράθυρο παραλαβής",
    "Bench": "Καθιστικός πάγκος",
    "Streetfront, evening": "Όψη δρόμου, βράδυ",
    "Counter at dusk": "Πάγκος στο σούρουπο",
    "Cove detail": "Λεπτομέρεια κρυφού φωτισμού",
    "Full interior": "Συνολική άποψη εσωτερικού",
    "Mirror back-wall": "Πίσω τοίχος με καθρέφτη",
    "Counter view": "Άποψη πάγκου",
    "Full room": "Συνολική άποψη χώρου",
    "Bar long-axis": "Διαμήκης άποψη bar",
    "Grill station": "Σταθμός ψησίματος",
    "Dwell zone": "Ζώνη παραμονής",
    "Counter & cove": "Πάγκος & κρυφός φωτισμός",
    "Terrace edge": "Όριο βεράντας",
    "Cornice + counter": "Κορνίζα + πάγκος",
    "Encaustic floor": "Εγκαυστικό δάπεδο",
    "Room axial": "Αξονική άποψη χώρου",
    "Sliding shopfront": "Συρόμενη βιτρίνα",
    "Outdoor counter": "Εξωτερικός πάγκος",
    "Banquette + light": "Πάγκος καθιστικού + φωτισμός",

    // body section headings
    "Brief": "Brief",
    "Move": "Κίνηση",
    "Material": "Υλικό",
    "Site": "Χώρος",
    "Light": "Φως",
    "Approach": "Προσέγγιση",
    "Refinement": "Εξέλιξη",
    "Plan": "Κάτοψη",
    "Idea": "Ιδέα",
    "Inside": "Εσωτερικό",
  },
};

Object.assign(window, { LangProvider, useLang, useT, usePick, LangToggle, DICT_I18N: DICT });
