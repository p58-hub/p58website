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
    project_types: "Project types",
    projects: "Projects",
    categories_view: "Categories",
    all_projects_view: "All projects",
    all: "All",
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
    see_all_projects: "See all projects",
    location: "Location",
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
    interiors_eyebrow: "/ Twelve rooms · 2023 — 2026  ·  Multi-site retail · Fixtures · Roll-out",
    interiors_brand_eyebrow_a: "/",
    interiors_brand_eyebrow_b: " rooms · Multi-site retail",
    proj_word: "projects",

    arch_meta_b: "Open for commissions",


    work_with_us: "/ Work with us",
    cta_2026: "2026",
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
    view: "View",

    // footer
    foot_copy_left: "© 2025 — 2026 Project58 Architecture",
    foot_copy_right: "Designed in-house · v1.0",
    foot_big: "Let’s design your",
    foot_big_em: "next space!",
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
    project_types: "Τύποι έργων",
    projects: "Έργα",
    categories_view: "Κατηγορίες",
    all_projects_view: "Όλα τα έργα",
    all: "Όλα",
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
    see_all_projects: "Δείτε όλα τα έργα",
    location: "Τοποθεσία",
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
    interiors_eyebrow: "/ Δώδεκα δωμάτια · 2023 — 2026  ·  Λιανική πολλαπλών σημείων · Έπιπλα · Roll-out",
    interiors_brand_eyebrow_a: "/",
    interiors_brand_eyebrow_b: " δωμάτια · Λιανική πολλαπλών σημείων",
    proj_word: "έργα",

    arch_meta_b: "Δεκτές αναθέσεις",


    work_with_us: "/ Συνεργαστείτε μαζί μας",
    cta_2026: "2026",
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
    view: "Δες",

    // footer
    foot_copy_left: "© 2025 — 2026 Project58 Αρχιτεκτονική",
    foot_copy_right: "Σχεδιασμός από το γραφείο · v1.0",
    foot_big: "Ας σχεδιάσουμε τον",
    foot_big_em: "επόμενο χώρο σας!",
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
