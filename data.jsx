// ===== data.jsx — Project58 data + image component =====

const PROJECTS = [
  // ============ Protein Garden ============
  {
    id: "pg-panormou",
    code: "P58-024",
    brand: "Protein Garden",
    name: "Panormou",
    location: "Athens · Panormou",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2026",
    status: "In construction",
    size: "142 m²",
    client: "Protein Garden",
    role: "Architecture · Fixtures · Roll-out documentation",
    summary:
      "The largest of the Protein Garden rooms — a 142 m² corner site on Panormou with a queue line, an open kitchen and a 28-seat takeaway counter.",
    body: [
      ["Brief",
        "Protein Garden returned for a fifth site, on a busy corner of Panormou. The brief was for the most generous of the eight rooms: a wider service counter, twenty-eight covers, and a clearly resolved kitchen visible from the street."],
      ["Move",
        "We placed the counter on the long axis and let the queue come in along the glazing. The kitchen sits behind a perforated mesh wall — visible enough to read as honest, screened enough to keep the room cool."],
      ["Material",
        "Pale stained oak, brushed stainless, terrazzo flooring, deep green tile around the kitchen wall. The brand's mint accent is restricted to signage and one painted soffit."],
    ],
    hero: "assets/projects/pg-panormou/01.png",
    gallery: [
      { src: "assets/projects/pg-panormou/02.png", span: "gal-12", tag: "Streetfront elevation" },
      { src: "assets/projects/pg-panormou/03.png", span: "gal-7",  tag: "Counter & queue line" },
      { src: "assets/projects/pg-panormou/04.png", span: "gal-5",  tag: "Seating banquette" },
    ],
  },
  {
    id: "pg-skoufa",
    code: "P58-023",
    brand: "Protein Garden",
    name: "Kolonaki · Skoufa",
    location: "Athens · Kolonaki",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "64 m²",
    client: "Protein Garden",
    role: "Architecture · Fixtures",
    summary:
      "A 64 m² Kolonaki room reorganised around a single curved counter — fewer seats, more dwell, the same kit-of-parts.",
    body: [
      ["Site",
        "A narrow Kolonaki shell on Skoufa, three metres wide and twenty metres long. The neighbourhood reads slow, so we slowed the room: a curved oak counter, six soft stools, a single mirror end-wall to double the perceived depth."],
      ["Move",
        "The kitchen is pushed to the very back, leaving the entire front as a calm dwell-zone. The counter is the only object that touches both walls."],
    ],
    hero: "assets/projects/pg-skoufa/01.png",
    gallery: [
      { src: "assets/projects/pg-skoufa/02.png", span: "gal-7", tag: "Counter axial" },
      { src: "assets/projects/pg-skoufa/03.png", span: "gal-5", tag: "Mirror end-wall" },
      { src: "assets/projects/pg-skoufa/04.png", span: "gal-12", tag: "Streetfront" },
    ],
  },
  {
    id: "pg-glyfada",
    code: "P58-022",
    brand: "Protein Garden",
    name: "Glyfada · Doumani",
    location: "Athens · Glyfada",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "88 m²",
    client: "Protein Garden",
    role: "Architecture · Facade",
    summary:
      "A facade-led project — a deep green portal frames the entrance from across the avenue.",
    body: [
      ["Idea",
        "Glyfada is approached from the avenue. The brief here was as much a facade as an interior: we built a deep green portal that reads at fifty metres and pulls people across two lanes of traffic."],
      ["Inside",
        "The interior is the kit-of-parts at its quietest — pale oak, white tile, terrazzo. The colour does its work outside."],
    ],
    hero: "assets/projects/pg-glyfada/01.png",
    gallery: [
      { src: "assets/projects/pg-glyfada/02.png", span: "gal-6", tag: "Interior, counter view" },
      { src: "assets/projects/pg-glyfada/03.png", span: "gal-6", tag: "Seating zone" },
      { src: "assets/projects/pg-glyfada/04.png", span: "gal-12", tag: "Back wall, fixtures" },
    ],
  },
  {
    id: "pg-koukaki",
    code: "P58-021",
    brand: "Protein Garden",
    name: "Koukaki",
    location: "Athens · Koukaki",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2026",
    status: "In design",
    size: "72 m²",
    client: "Protein Garden",
    role: "Architecture",
    summary:
      "A corner site in Koukaki — two streets, two openings, one room. The fixture turns the corner.",
    body: [
      ["Plan",
        "Two streets meet at an oblique corner. The brief asked for an entrance from both. We rebuilt the corner as one continuous, mitred opening and let the counter follow it on the inside."],
    ],
    hero: "assets/projects/pg-koukaki/01.png",
    gallery: [
      { src: "assets/projects/pg-koukaki/02.png", span: "gal-7", tag: "Interior 1" },
      { src: "assets/projects/pg-koukaki/03.png", span: "gal-5", tag: "Interior 2" },
      { src: "assets/projects/pg-koukaki/04.png", span: "gal-12", tag: "Second elevation" },
    ],
  },
  {
    id: "pg-kolokotroni",
    code: "P58-020",
    brand: "Protein Garden",
    name: "Kolokotroni",
    location: "Athens · Kolokotroni",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2026",
    status: "In construction",
    size: "94 m²",
    client: "Protein Garden",
    role: "Architecture · Fixtures",
    summary:
      "A long, deep room with a continuous oak ribbon — counter, shelf, banquette, all from a single piece of joinery.",
    body: [
      ["Move",
        "We treated the entire room as one fixture. A four-millimetre-thick oak ribbon runs the depth of the room and folds three times — into the counter, into a wall shelf, and finally into the banquette at the back."],
    ],
    hero: "assets/projects/pg-kolokotroni/01.png",
    gallery: [
      { src: "assets/projects/pg-kolokotroni/02.png", span: "gal-6", tag: "Counter detail" },
      { src: "assets/projects/pg-kolokotroni/03.png", span: "gal-6", tag: "Banquette end" },
      { src: "assets/projects/pg-kolokotroni/04.png", span: "gal-12", tag: "Deep room axial" },
    ],
  },
  {
    id: "pg-neasmyrni",
    code: "P58-019",
    brand: "Protein Garden",
    name: "Nea Smyrni · Omirou 40",
    location: "Athens · Nea Smyrni",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "108 m²",
    client: "Protein Garden",
    role: "Architecture",
    summary:
      "Nea Smyrni's pickup-led prototype — a slim service window, a single bench, a deep interior for staff and prep.",
    body: [
      ["Idea",
        "The brief here weighted delivery and takeaway over dwell. We thinned the customer-facing zone to a single deep bench and gave the rest of the floor to a generous back-of-house."],
    ],
    hero: "assets/projects/pg-neasmyrni/01.png",
    gallery: [
      { src: "assets/projects/pg-neasmyrni/02.png", span: "gal-7", tag: "Pickup window" },
      { src: "assets/projects/pg-neasmyrni/03.png", span: "gal-5", tag: "Bench" },
      { src: "assets/projects/pg-neasmyrni/04.png", span: "gal-12", tag: "Streetfront, evening" },
    ],
  },
  {
    id: "pg-tsamadou",
    code: "P58-018",
    brand: "Protein Garden",
    name: "Piraeus · Tsamadou",
    location: "Piraeus · Tsamadou",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "76 m²",
    client: "Protein Garden",
    role: "Architecture · Lighting",
    summary:
      "The Piraeus room — a board-formed concrete plinth, an oak shelf, and a low cove that washes the back wall in evening light.",
    body: [
      ["Light",
        "Piraeus opens late. Lighting was redesigned here: a continuous cove behind the counter, an indirect wash across the ceiling, and a single pendant marking the cashier. No spot lighting in the customer zone."],
    ],
    hero: "assets/projects/pg-tsamadou/01.png",
    gallery: [
      { src: "assets/projects/pg-tsamadou/02.png", span: "gal-6", tag: "Counter at dusk" },
      { src: "assets/projects/pg-tsamadou/03.png", span: "gal-6", tag: "Cove detail" },
      { src: "assets/projects/pg-tsamadou/04.png", span: "gal-12", tag: "Full interior" },
    ],
  },
  {
    id: "pg-cheuden",
    code: "P58-017",
    brand: "Protein Garden",
    name: "Cheuden",
    location: "Athens · Cheuden",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "82 m²",
    client: "Protein Garden",
    role: "Architecture · Fixtures",
    summary:
      "Cheuden's room — a mirror-finished back wall doubles the depth of an otherwise narrow shell.",
    body: [
      ["Move",
        "A long, narrow shell asked for an optical trick. The back wall is a single sheet of antique mirror, lightly aged so it reads as a real surface, not a gimmick. The room reads twice as long."],
    ],
    hero: "assets/projects/pg-cheuden/01.png",
    gallery: [
      { src: "assets/projects/pg-cheuden/02.png", span: "gal-6", tag: "Mirror back-wall" },
      { src: "assets/projects/pg-cheuden/03.png", span: "gal-6", tag: "Counter view" },
      { src: "assets/projects/pg-cheuden/04.png", span: "gal-12", tag: "Full room" },
    ],
  },

  // ============ Dinas ============
  {
    id: "dn-kolonaki",
    code: "P58-016",
    brand: "Dinas",
    name: "Kolonaki",
    location: "Athens · Kolonaki",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "118 m²",
    client: "Dinas",
    role: "Architecture · Fixtures · Lighting",
    summary:
      "The first Dinas room — a soft-lit, low-saturation interior built around an open grill and a single eighteen-metre bar.",
    body: [
      ["Idea",
        "Dinas wanted a quick-service room that did not feel like one. The brief was to keep the takeaway flow tight but to design the dwell-zone like a restaurant — soft lighting, real tableware, no plastic in sight."],
      ["Move",
        "We pushed the kitchen to the long wall and let an eighteen-metre bar run the depth of the room. The grill is visible from two metres in; the rest of the room reads as a calm lounge."],
    ],
    hero: "assets/projects/dn-kolonaki/01.png",
    gallery: [
      { src: "assets/projects/dn-kolonaki/02.png", span: "gal-7", tag: "Bar long-axis" },
      { src: "assets/projects/dn-kolonaki/03.png", span: "gal-5", tag: "Grill station" },
      { src: "assets/projects/dn-kolonaki/04.png", span: "gal-12", tag: "Dwell zone" },
    ],
  },
  {
    id: "dn-panormou",
    code: "P58-015",
    brand: "Dinas",
    name: "Panormou",
    location: "Athens · Panormou",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2026",
    status: "In construction",
    size: "126 m²",
    client: "Dinas",
    role: "Architecture",
    summary:
      "Dinas, Panormou — second site, refining the kit-of-parts and adding a sidewalk terrace.",
    body: [
      ["Refinement",
        "The Panormou site is the first time we revisit the Dinas language. Counter geometry, lighting cove and material palette stay; the seating logic is widened, and a six-cover sidewalk terrace is added."],
    ],
    hero: "assets/projects/dn-panormou/01.png",
    gallery: [
      { src: "assets/projects/dn-panormou/02.png", span: "gal-6", tag: "Counter & cove" },
      { src: "assets/projects/dn-panormou/03.png", span: "gal-6", tag: "Seating zone" },
      { src: "assets/projects/dn-panormou/04.png", span: "gal-12", tag: "Terrace edge" },
    ],
  },
  {
    id: "dn-akadimias",
    code: "P58-014",
    brand: "Dinas",
    name: "Akadimias",
    location: "Athens · Akadimias",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2026",
    status: "In design",
    size: "96 m²",
    client: "Dinas",
    role: "Architecture · Lighting",
    summary:
      "A neoclassical shell on Akadimias — keep the cornice, replace the plan.",
    body: [
      ["Approach",
        "The shell is a protected neoclassical room. We left the cornice and the original encaustic floor; everything else is a single oak fixture set back 200 mm from every wall, so the existing room stays legible."],
    ],
    hero: "assets/projects/dn-akadimias/01.png",
    gallery: [
      { src: "assets/projects/dn-akadimias/02.png", span: "gal-6", tag: "Cornice + counter" },
      { src: "assets/projects/dn-akadimias/03.png", span: "gal-6", tag: "Encaustic floor" },
      { src: "assets/projects/dn-akadimias/04.png", span: "gal-12", tag: "Room axial" },
    ],
  },
  {
    id: "dn-dousmani",
    code: "P58-013",
    brand: "Dinas",
    name: "Glyfada · Dousmani",
    location: "Athens · Glyfada",
    type: "Fast Casual · Retail",
    typology: "retail",
    year: "2025",
    status: "Completed",
    size: "104 m²",
    client: "Dinas",
    role: "Architecture · Fixtures",
    summary:
      "Glyfada's Dousmani room — sea-facing, with a 6 m sliding shopfront and an outdoor counter.",
    body: [
      ["Site",
        "Dousmani sits two blocks from the seafront. The brief asked for as much outside as inside: a six-metre sliding shopfront, a covered outdoor counter, and a banquette that can be opened to the pavement in summer."],
    ],
    hero: "assets/projects/dn-dousmani/01.png",
    gallery: [
      { src: "assets/projects/dn-dousmani/02.png", span: "gal-6", tag: "Sliding shopfront" },
      { src: "assets/projects/dn-dousmani/03.png", span: "gal-6", tag: "Outdoor counter" },
      { src: "assets/projects/dn-dousmani/04.png", span: "gal-12", tag: "Banquette + light" },
    ],
  },
];

const NEWS = [
  {
    date: "2026 — 05 — 06",
    cat: "Project",
    title: "Dinas Panormou enters construction",
    deck: "Our second Dinas site — 126 m² on Panormou — breaks ground this month. Opening targeted for late summer 2026.",
  },
  {
    date: "2026 — 04 — 02",
    cat: "Project",
    title: "Protein Garden Koukaki goes into design development",
    deck: "An oblique corner site in Koukaki, with two entrances and a single mitred opening that turns the corner.",
  },
  {
    date: "2026 — 03 — 12",
    cat: "Press",
    title: "Project58 featured in the Greek edition of Wallpaper*, March issue",
    deck: "A four-page piece visits three Protein Garden rooms and writes about Project58's approach to fast-casual retail as a piece of civic furniture.",
  },
  {
    date: "2026 — 02 — 20",
    cat: "Studio",
    title: "Project58 opens a second studio in Athens",
    deck: "A 96 m² workspace on Mavili Square becomes our Athens base. Six new positions opening through Q2.",
  },
  {
    date: "2025 — 12 — 11",
    cat: "Project",
    title: "Protein Garden Glyfada completed",
    deck: "The deep-green portal facade lands on Doumani Avenue. The eighth Protein Garden room in three years.",
  },
  {
    date: "2025 — 11 — 04",
    cat: "Talk",
    title: "Lecture · ‘Eight rooms, one operator'",
    deck: "Founding partner presents the Protein Garden roll-out at the AUTh Architecture School's autumn lecture series.",
  },
  {
    date: "2025 — 09 — 18",
    cat: "Project",
    title: "Dinas Kolonaki opens to the public",
    deck: "The first Dinas room — 118 m² with an open grill and an 18-metre bar — opens at the corner of Kolonaki.",
  },
];

const TEAM = [
  { name: "Georgios Grigoriadis", role: "Founder", note: "Founder of Project58, leading the studio’s architectural direction and project delivery.", portrait: "assets/people/georgios-grigoriadis.jpg" },
  { name: "Naveen Kumar", role: "Architect", note: "Architect working across concept design, development, and detailed coordination.", portrait: "assets/people/naveen-kumar.png" },
  { name: "Evagelos Kastavenakis", role: "Architect", note: "Architect focused on spatial development, material research, and project execution.", portrait: "assets/people/evagelos-kastavenakis.png" },
  { name: "Maria Pappa", role: "Architect", note: "Dipl. Arch. AUTh" },
  { name: "Sofia Ioannou", role: "Project Architect", note: "Dipl. Arch. TU Delft" },
  { name: "Andreas Lekkas", role: "Architect · Model-maker", note: "M.Arch. KU Leuven" },
  { name: "Iris Mantzou", role: "Junior Architect", note: "Dipl. Arch. AUTh" },
  { name: "Petros Kostas", role: "Studio Manager", note: "BA Business · ten years studio operations" },
];

const TIMELINE = [
  { yr: "2018", ev: "Studio founded", nt: "Three architects open a 38 m² studio in Thessaloniki, with a single brief for a 28-cover restaurant." },
  { yr: "2023", ev: "Protein Garden — first commission", nt: "Protein Garden brings us the first of what will become eight rooms across Athens and Piraeus." },
  { yr: "2024", ev: "First multi-site roll-out", nt: "Three Protein Garden rooms open within five months — the kit-of-parts approach becomes the studio's signature for retail clients." },
  { yr: "2025", ev: "Dinas, Kolonaki", nt: "First Dinas room opens. The studio's second multi-site retail client, in three years." },
  { yr: "2026", ev: "Athens studio opens", nt: "A second base at Mavili Square. Currently eight architects across two studios." },
];

const SERVICES = [
  {
    n: "01",
    t: "Architecture",
    d: "Ground-up buildings, additions, and full architectural services from feasibility through permit and construction administration. Equal attention to plan, fixture and site.",
    bul: ["Concept & feasibility", "Planning & permit", "Construction administration", "Site supervision"],
  },
  {
    n: "02",
    t: "Renovation",
    d: "Whole-floor and whole-building renovations of post-war housing, commercial shells, and listed structures. We work as much with what is there as with what is added.",
    bul: ["Heritage and post-war housing", "Structural reorganisation", "Material reclamation", "Permit-grade conversions"],
  },
  {
    n: "03",
    t: "Retail & hospitality",
    d: "Quick-service shops, bakeries, kiosks, restaurants and counter-led hospitality. Single-site work and roll-out systems for operators with multiple locations.",
    bul: ["Single-site fit-out", "Multi-site roll-out systems", "Operator handover documentation", "Brand-aligned fixturing"],
  },
  {
    n: "04",
    t: "Workplace",
    d: "Small and mid-sized studios, professional practices, and headquarters fit-outs for owner-led businesses.",
    bul: ["Floor planning", "Acoustic & lighting strategy", "Bespoke joinery"],
  },
];

/* ===== Image component =====
   - When src is set, renders the real image with a small metadata overlay (corner code + bottom label).
   - When src is missing, falls back to the diagonal-striped placeholder. */
function Ph({ src, label, tag, corner, className = "", style = {} }) {
  if (src) {
    return (
      <figure className={`img-frame shape ${className}`} style={style}>
        <img src={src} alt={label || ""} loading="lazy" />
        {corner ? <span className="img-corner">{corner}</span> : null}
        {(label || tag) ? (
          <figcaption className="img-cap">
            {label ? <span className="img-label">{label}</span> : null}
            {tag ? <span className="img-tag">{tag}</span> : null}
          </figcaption>
        ) : null}
      </figure>
    );
  }
  return (
    <div className={`ph shape ${className}`} style={style}>
      {corner ? <div className="ph-corner">{corner}</div> : null}
      <div className="ph-label">{label}</div>
      <div className="ph-tag">{tag}</div>
    </div>
  );
}

Object.assign(window, { PROJECTS, NEWS, TEAM, TIMELINE, SERVICES, Ph });

/* ===== Greek (gr) translation mirror =====
   Each project / news / team / timeline entry gets `_gr` mirror fields.
   The pick() helper in i18n.jsx returns the _gr variant when language is set to "gr",
   falling back to English when an item hasn't been translated yet. */
const PROJECTS_GR = {
  "pg-panormou": {
    name_gr: "Πανόρμου",
    location_gr: "Αθήνα · Πανόρμου",
    type_gr: "Γρήγορη εστίαση · Λιανική",
    role_gr: "Αρχιτεκτονική · Έπιπλα · Τεκμηρίωση Roll-out",
    summary_gr: "Το μεγαλύτερο από τα δωμάτια Protein Garden — ένας γωνιακός χώρος 142 τ.μ. στην Πανόρμου με γραμμή αναμονής, ανοιχτή κουζίνα και πάγκο παραλαβής 28 θέσεων.",
    body_gr: [
      ["Brief", "Η Protein Garden επέστρεψε για πέμπτο σημείο, σε μία πολυσύχναστη γωνία της Πανόρμου. Το brief ζητούσε το πιο γενναιόδωρο από τα οκτώ δωμάτια: ευρύτερο πάγκο σερβίς, εικοσιοκτώ θέσεις και μια ξεκάθαρα οργανωμένη κουζίνα ορατή από τον δρόμο."],
      ["Move", "Τοποθετήσαμε τον πάγκο στον μεγάλο άξονα και αφήσαμε τη γραμμή αναμονής να εισέρχεται κατά μήκος του υαλοπίνακα. Η κουζίνα τοποθετήθηκε πίσω από ένα διάτρητο μεταλλικό τοίχωμα — αρκετά ορατή ώστε να διαβάζεται ως ειλικρινής, αρκετά κρυμμένη ώστε να διατηρεί το δωμάτιο δροσερό."],
      ["Material", "Ανοιχτόχρωμη βαμμένη δρυς, βουρτσισμένο ανοξείδωτο, δάπεδο τερράτσο, βαθύ πράσινο πλακάκι γύρω από τον τοίχο της κουζίνας. Η brand μέντα περιορίζεται στη σήμανση και σε ένα βαμμένο στόμιο."],
    ],
  },
  "pg-skoufa": {
    name_gr: "Κολωνάκι · Σκουφά",
    location_gr: "Αθήνα · Κολωνάκι",
    type_gr: "Γρήγορη εστίαση · Λιανική",
    role_gr: "Αρχιτεκτονική · Έπιπλα",
    summary_gr: "Ένα δωμάτιο 64 τ.μ. στο Κολωνάκι αναδιοργανωμένο γύρω από έναν καμπύλο πάγκο — λιγότερες θέσεις, περισσότερη παραμονή, το ίδιο σύστημα εξαρτημάτων.",
    body_gr: [
      ["Site", "Ένα στενό κέλυφος στο Κολωνάκι επί της Σκουφά, τρία μέτρα φάρδος και είκοσι βάθος. Η γειτονιά διαβάζεται αργή, έτσι επιβραδύναμε το δωμάτιο: καμπύλος πάγκος δρυός, έξι μαλακά σκαμπό, ένας μοναδικός καθρέφτης ως τερματικός τοίχος για να διπλασιάσει το αντιληπτό βάθος."],
      ["Move", "Η κουζίνα ωθήθηκε στο πίσω μέρος, αφήνοντας ολόκληρο το μπροστινό τμήμα ως ήρεμη ζώνη παραμονής. Ο πάγκος είναι το μόνο αντικείμενο που αγγίζει και τους δύο τοίχους."],
    ],
  },
  "pg-glyfada": {
    name_gr: "Γλυφάδα · Δουμάνη",
    location_gr: "Αθήνα · Γλυφάδα",
    role_gr: "Αρχιτεκτονική · Όψη",
    summary_gr: "Ένα έργο που οδηγείται από την όψη — μια βαθιά πράσινη πύλη πλαισιώνει την είσοδο από την απέναντι πλευρά της λεωφόρου.",
    body_gr: [
      ["Idea", "Η Γλυφάδα προσεγγίζεται από τη λεωφόρο. Το brief εδώ ήταν τόσο μια όψη όσο και ένα εσωτερικό: χτίσαμε μια βαθιά πράσινη πύλη που διαβάζεται από πενήντα μέτρα και τραβά τους ανθρώπους πέρα από δύο λωρίδες κυκλοφορίας."],
      ["Inside", "Το εσωτερικό είναι το kit εξαρτημάτων στην πιο ήσυχη εκδοχή του — ανοιχτή δρυς, λευκό πλακάκι, τερράτσο. Το χρώμα κάνει τη δουλειά του απ' έξω."],
    ],
  },
  "pg-koukaki": {
    name_gr: "Κουκάκι",
    location_gr: "Αθήνα · Κουκάκι",
    role_gr: "Αρχιτεκτονική",
    summary_gr: "Ένα γωνιακό σημείο στο Κουκάκι — δύο δρόμοι, δύο ανοίγματα, ένα δωμάτιο. Ο πάγκος ακολουθεί τη γωνία.",
    body_gr: [
      ["Plan", "Δύο δρόμοι συναντιούνται σε μια οξεία γωνία. Το brief ζητούσε είσοδο και από τους δύο. Ξαναχτίσαμε τη γωνία ως ένα συνεχές, λοξοτομημένο άνοιγμα και αφήσαμε τον πάγκο να το ακολουθεί από μέσα."],
    ],
  },
  "pg-kolokotroni": {
    name_gr: "Κολοκοτρώνη",
    location_gr: "Αθήνα · Κολοκοτρώνη",
    role_gr: "Αρχιτεκτονική · Έπιπλα",
    summary_gr: "Ένα μακρύ, βαθύ δωμάτιο με μια συνεχή κορδέλα από δρυ — πάγκος, ράφι, παγκάκι, όλα από ένα κομμάτι ξυλουργικής.",
    body_gr: [
      ["Move", "Αντιμετωπίσαμε ολόκληρο το δωμάτιο ως ένα έπιπλο. Μια κορδέλα δρυός πάχους τεσσάρων χιλιοστών τρέχει σε όλο το βάθος του δωματίου και διπλώνει τρεις φορές — στον πάγκο, σε ένα ράφι τοίχου, και τέλος στο παγκάκι στο πίσω μέρος."],
    ],
  },
  "pg-neasmyrni": {
    name_gr: "Νέα Σμύρνη · Ομήρου 40",
    location_gr: "Αθήνα · Νέα Σμύρνη",
    role_gr: "Αρχιτεκτονική",
    summary_gr: "Το πρότυπο της Νέας Σμύρνης με προτεραιότητα στην παραλαβή — λεπτό παράθυρο εξυπηρέτησης, ένα μοναδικό παγκάκι, βαθύ εσωτερικό για προσωπικό και προετοιμασία.",
    body_gr: [
      ["Idea", "Το brief εδώ έδινε βάρος στο delivery και το takeaway έναντι της παραμονής. Λεπτύναμε τη ζώνη πελάτη σε ένα μοναδικό βαθύ παγκάκι και δώσαμε το υπόλοιπο δάπεδο σε γενναιόδωρο back-of-house."],
    ],
  },
  "pg-tsamadou": {
    name_gr: "Πειραιάς · Τσαμαδού",
    location_gr: "Πειραιάς · Τσαμαδού",
    role_gr: "Αρχιτεκτονική · Φωτισμός",
    summary_gr: "Το δωμάτιο του Πειραιά — μια βάση από εμφανές μπετόν, ένα ράφι δρυός και ένας χαμηλός κρυφός φωτισμός που λούζει τον πίσω τοίχο στο βραδινό φως.",
    body_gr: [
      ["Light", "Ο Πειραιάς ανοίγει αργά. Ο φωτισμός επανασχεδιάστηκε εδώ: συνεχές cove πίσω από τον πάγκο, έμμεσο πλύσιμο στην οροφή και ένα μόνο κρεμαστό φωτιστικό που σηματοδοτεί το ταμείο. Χωρίς spot στη ζώνη πελάτη."],
    ],
  },
  "pg-cheuden": {
    name_gr: "Cheuden",
    location_gr: "Αθήνα · Cheuden",
    role_gr: "Αρχιτεκτονική · Έπιπλα",
    summary_gr: "Το δωμάτιο της Cheuden — ένας πίσω τοίχος με φινίρισμα καθρέφτη διπλασιάζει το βάθος ενός κατά τα άλλα στενού κελύφους.",
    body_gr: [
      ["Move", "Ένα μακρύ, στενό κέλυφος ζήτησε ένα οπτικό κόλπο. Ο πίσω τοίχος είναι ένα μοναδικό φύλλο antique καθρέφτη, ελαφρώς παλαιωμένου ώστε να διαβάζεται ως πραγματική επιφάνεια, όχι ως gimmick. Το δωμάτιο διαβάζεται διπλάσιο σε μήκος."],
    ],
  },
  "dn-kolonaki": {
    name_gr: "Κολωνάκι",
    location_gr: "Αθήνα · Κολωνάκι",
    role_gr: "Αρχιτεκτονική · Έπιπλα · Φωτισμός",
    summary_gr: "Το πρώτο δωμάτιο Dinas — εσωτερικός χώρος χαμηλού κορεσμού και απαλού φωτισμού, χτισμένος γύρω από μια ανοιχτή ψησταριά και ένα μπαρ δεκαοκτώ μέτρων.",
    body_gr: [
      ["Idea", "Η Dinas ήθελε ένα δωμάτιο γρήγορου σερβίς που δεν θα έμοιαζε με ένα τέτοιο. Το brief ήταν να κρατήσουμε τη ροή takeaway σφιχτή, αλλά να σχεδιάσουμε τη ζώνη παραμονής σαν εστιατόριο — απαλός φωτισμός, αληθινά σερβίτσια, καθόλου πλαστικό."],
      ["Move", "Ωθήσαμε την κουζίνα στον μακρύ τοίχο και αφήσαμε ένα μπαρ δεκαοκτώ μέτρων να τρέχει στο βάθος του δωματίου. Η ψησταριά είναι ορατή από δύο μέτρα μέσα· το υπόλοιπο δωμάτιο διαβάζεται ως ένα ήρεμο lounge."],
    ],
  },
  "dn-panormou": {
    name_gr: "Πανόρμου",
    location_gr: "Αθήνα · Πανόρμου",
    role_gr: "Αρχιτεκτονική",
    summary_gr: "Dinas, Πανόρμου — δεύτερο σημείο, εξελίσσοντας το σύστημα εξαρτημάτων και προσθέτοντας μια βεράντα στο πεζοδρόμιο.",
    body_gr: [
      ["Refinement", "Η Πανόρμου είναι η πρώτη φορά που ξαναεπισκεπτόμαστε τη γλώσσα Dinas. Η γεωμετρία πάγκου, το cove φωτισμού και η παλέτα υλικών παραμένουν· η λογική κάθισης διευρύνεται, και προστίθεται μια βεράντα έξι θέσεων στο πεζοδρόμιο."],
    ],
  },
  "dn-akadimias": {
    name_gr: "Ακαδημίας",
    location_gr: "Αθήνα · Ακαδημίας",
    role_gr: "Αρχιτεκτονική · Φωτισμός",
    summary_gr: "Ένα νεοκλασικό κέλυφος στην Ακαδημίας — κρατάμε την κορνίζα, αντικαθιστούμε την κάτοψη.",
    body_gr: [
      ["Approach", "Το κέλυφος είναι ένα διατηρητέο νεοκλασικό δωμάτιο. Αφήσαμε την κορνίζα και το αρχικό εγκαυστικό δάπεδο· όλα τα υπόλοιπα είναι ένα μοναδικό έπιπλο δρυός που απέχει 200 χιλιοστά από κάθε τοίχο, ώστε το υπάρχον δωμάτιο να παραμένει αναγνώσιμο."],
    ],
  },
  "dn-dousmani": {
    name_gr: "Γλυφάδα · Δουσμάνη",
    location_gr: "Αθήνα · Γλυφάδα",
    role_gr: "Αρχιτεκτονική · Έπιπλα",
    summary_gr: "Το δωμάτιο της Δουσμάνη στη Γλυφάδα — με θέα στη θάλασσα, με συρόμενη βιτρίνα 6 μέτρων και πάγκο εξωτερικού χώρου.",
    body_gr: [
      ["Site", "Η Δουσμάνη βρίσκεται δύο τετράγωνα από τη θαλασσινή λεωφόρο. Το brief ζητούσε όσο περισσότερο εξωτερικό όσο και εσωτερικό: μια συρόμενη βιτρίνα έξι μέτρων, ένας στεγασμένος εξωτερικός πάγκος, και ένα παγκάκι που μπορεί να ανοίξει στο πεζοδρόμιο το καλοκαίρι."],
    ],
  },
};

const NEWS_GR = [
  { title_gr: "Η Dinas Πανόρμου ξεκινά κατασκευή", deck_gr: "Το δεύτερό μας σημείο Dinas — 126 τ.μ. στην Πανόρμου — μπαίνει σε κατασκευή αυτόν τον μήνα. Άνοιγμα στόχος αργά καλοκαίρι 2026." },
  { title_gr: "Protein Garden Κουκάκι σε φάση σχεδιασμού", deck_gr: "Ένα οξύ γωνιακό σημείο στο Κουκάκι, με δύο εισόδους και ένα μοναδικό λοξοτομημένο άνοιγμα που ακολουθεί τη γωνία." },
  { title_gr: "Το Project58 στο Wallpaper* Greece, τεύχος Μαρτίου", deck_gr: "Ένα τετρασέλιδο άρθρο επισκέπτεται τρία δωμάτια Protein Garden και γράφει για την προσέγγιση του Project58 στη λιανική γρήγορου σερβίς ως αστικό έπιπλο." },
  { title_gr: "Το Project58 ανοίγει δεύτερο στούντιο στην Αθήνα", deck_gr: "Ένας χώρος εργασίας 96 τ.μ. στην Πλατεία Μαβίλη γίνεται η βάση μας στην Αθήνα. Έξι νέες θέσεις ανοίγουν στο Q2." },
  { title_gr: "Protein Garden Γλυφάδα ολοκληρώθηκε", deck_gr: "Η βαθιά πράσινη πύλη φτάνει στη Λεωφόρο Δουμάνη. Το όγδοο δωμάτιο Protein Garden σε τρία χρόνια." },
  { title_gr: "Διάλεξη · «Οκτώ δωμάτια, ένας operator»", deck_gr: "Ο ιδρυτής εταίρος παρουσιάζει το roll-out της Protein Garden στη φθινοπωρινή σειρά διαλέξεων της Αρχιτεκτονικής Σχολής ΑΠΘ." },
  { title_gr: "Dinas Κολωνάκι ανοίγει για το κοινό", deck_gr: "Το πρώτο δωμάτιο Dinas — 118 τ.μ. με ανοιχτή ψησταριά και μπαρ 18 μέτρων — ανοίγει στη γωνία του Κολωνακίου." },
];

const TEAM_GR = [
  { role_gr: "Ιδρυτής", note_gr: "Ιδρυτής του Project58, με ευθύνη για την αρχιτεκτονική κατεύθυνση και την υλοποίηση των έργων του γραφείου." },
  { role_gr: "Αρχιτέκτονας", note_gr: "Αρχιτέκτονας με αντικείμενο τον σχεδιασμό, την ανάπτυξη και τον λεπτομερή συντονισμό των έργων." },
  { role_gr: "Αρχιτέκτονας", note_gr: "Αρχιτέκτονας με έμφαση στη χωρική ανάπτυξη, την έρευνα υλικών και την υλοποίηση έργων." },
  { role_gr: "Αρχιτέκτων", note_gr: "Δίπλ. Αρχ. ΑΠΘ" },
  { role_gr: "Αρχιτέκτων Έργου", note_gr: "Δίπλ. Αρχ. TU Delft" },
  { role_gr: "Αρχιτέκτων · Μακετίστας", note_gr: "M.Arch. KU Leuven" },
  { role_gr: "Νέος Αρχιτέκτων", note_gr: "Δίπλ. Αρχ. ΑΠΘ" },
  { role_gr: "Υπεύθυνος Στούντιο", note_gr: "BA Επιχειρήσεων · δέκα χρόνια διαχείρισης στούντιο" },
];

const TIMELINE_GR = [
  { ev_gr: "Ίδρυση γραφείου", nt_gr: "Τρεις αρχιτέκτονες ανοίγουν ένα στούντιο 38 τ.μ. στη Θεσσαλονίκη, με ένα μοναδικό brief για εστιατόριο 28 θέσεων." },
  { ev_gr: "Protein Garden — πρώτη ανάθεση", nt_gr: "Η Protein Garden μάς φέρνει το πρώτο από αυτό που θα γίνει οκτώ δωμάτια σε Αθήνα και Πειραιά." },
  { ev_gr: "Πρώτο roll-out πολλαπλών σημείων", nt_gr: "Τρία δωμάτια Protein Garden ανοίγουν μέσα σε πέντε μήνες — η προσέγγιση του kit εξαρτημάτων γίνεται η υπογραφή του στούντιο για πελάτες λιανικής." },
  { ev_gr: "Dinas, Κολωνάκι", nt_gr: "Το πρώτο δωμάτιο Dinas ανοίγει. Ο δεύτερος πελάτης λιανικής πολλαπλών σημείων του στούντιο, σε τρία χρόνια." },
  { ev_gr: "Άνοιγμα στούντιο Αθήνας", nt_gr: "Μια δεύτερη βάση στην Πλατεία Μαβίλη. Σήμερα οκτώ αρχιτέκτονες σε δύο στούντιο." },
];

// Merge Greek mirror fields into the live arrays in place
PROJECTS.forEach((p) => {
  const gr = PROJECTS_GR[p.id];
  if (gr) Object.assign(p, gr);
});
NEWS.forEach((n, i) => { if (NEWS_GR[i]) Object.assign(n, NEWS_GR[i]); });
TEAM.forEach((m, i) => { if (TEAM_GR[i]) Object.assign(m, TEAM_GR[i]); });
TIMELINE.forEach((r, i) => { if (TIMELINE_GR[i]) Object.assign(r, TIMELINE_GR[i]); });

const P58_STORE_KEY = "p58_data_v1";
const P58_PROJECT_PREVIEW_PREFIX = "p58_project_preview_v1:";
const DEFAULT_HOME_V2_BANNERS = [
  { id: "residences", visible: true, eyebrow: "Architecture / Living", eyebrow_gr: "Αρχιτεκτονική / Κατοικία", title: "Residential", title_gr: "Κατοικίες", note: "Human-centered places for everyday life.", note_gr: "Ανθρωποκεντρικοί χώροι για την καθημερινή ζωή.", tone: "sand", image: "", destination: "architecture" },
  { id: "workplaces", visible: true, eyebrow: "Architecture / Work", eyebrow_gr: "Αρχιτεκτονική / Εργασία", title: "Business & Workplaces", title_gr: "Επιχειρήσεις & Χώροι εργασίας", note: "Studios and workplaces designed around focus, collaboration and identity.", note_gr: "Στούντιο και χώροι εργασίας σχεδιασμένοι για συγκέντρωση, συνεργασία και ταυτότητα.", tone: "ink", image: "", destination: "contact" },
  { id: "protein-garden", visible: true, eyebrow: "Scalable retail systems", eyebrow_gr: "Κλιμακούμενα συστήματα λιανικής", title: "proteingarden", title_gr: "proteingarden", note: "Protein Garden is a Greek fast-casual restaurant chain centered on high-protein, customizable meals, with a spatial identity that reflects freshness, health, and simplicity.", note_gr: "Η Protein Garden είναι μια ελληνική αλυσίδα γρήγορης εστίασης με γεύματα υψηλής πρωτεΐνης και μια χωρική ταυτότητα που εκφράζει φρεσκάδα, υγεία και απλότητα.", tone: "image", image: "", destination: "protein-garden" },
  { id: "dinas", visible: true, eyebrow: "Hospitality / Brand experience", eyebrow_gr: "Φιλοξενία / Εμπειρία ταυτότητας", title: "DINAS eat real", title_gr: "DINAS eat real", note: "Warm, fluid spaces translating care and Mediterranean references into a growing system.", note_gr: "Ζεστοί, ρευστοί χώροι που μεταφράζουν τη φροντίδα και τις μεσογειακές αναφορές σε ένα αναπτυσσόμενο σύστημα.", tone: "image", image: "", destination: "dinas" },
];

function normaliseHomeV2(homeV2) {
  const source = homeV2 && Array.isArray(homeV2.banners)
    ? homeV2.banners
    : DEFAULT_HOME_V2_BANNERS;
  const validTones = new Set(["sand", "ink", "image"]);
  const validDestinations = new Set(["architecture", "projects", "protein-garden", "dinas", "contact"]);
  const rawTitle = String(homeV2 && homeV2.title || "Design in Practice");
  const defaultsById = Object.fromEntries(DEFAULT_HOME_V2_BANNERS.map((banner) => [banner.id, banner]));
  return {
    enabled: !homeV2 || homeV2.enabled !== false,
    kicker: String(homeV2 && homeV2.kicker || "02 / Selected fields"),
    kicker_gr: String(homeV2 && homeV2.kicker_gr || "02 / Επιλεγμένοι τομείς"),
    title: rawTitle === "Where we work." ? "Design in Practice" : rawTitle,
    title_gr: String(homeV2 && homeV2.title_gr || "Σχεδιασμός στην πράξη"),
    banners: source.map((banner, order) => {
      const id = String(banner && banner.id || `banner-${order + 1}`);
      const defaults = defaultsById[id] || {};
      const legacyProteinGarden = id === "protein-garden";
      const rawBannerTitle = String(banner && banner.title || `Banner ${order + 1}`);
      const rawNote = String(banner && banner.note || "");
      const migratedTitle = id === "residences" && rawBannerTitle === "Residences"
        ? "Residential"
        : id === "workplaces" && rawBannerTitle === "Workplaces"
          ? "Business & Workplaces"
          : rawBannerTitle;
      return {
        id,
        visible: !banner || banner.visible !== false,
        eyebrow: String(banner && banner.eyebrow || ""),
        eyebrow_gr: String(banner && banner.eyebrow_gr || defaults.eyebrow_gr || banner && banner.eyebrow || ""),
        title: legacyProteinGarden && migratedTitle === "Protein Garden" ? "proteingarden" : migratedTitle,
        title_gr: String(banner && banner.title_gr || defaults.title_gr || migratedTitle),
        note: legacyProteinGarden && rawNote === "A repeatable spatial identity shaped through material research and parametric tools."
          ? "Protein Garden is a Greek fast-casual restaurant chain centered on high-protein, customizable meals, with a spatial identity that reflects freshness, health, and simplicity."
          : rawNote,
        note_gr: String(banner && banner.note_gr || defaults.note_gr || rawNote),
        tone: validTones.has(banner && banner.tone) ? banner.tone : "sand",
        image: String(banner && banner.image || ""),
        destination: validDestinations.has(banner && banner.destination) ? banner.destination : "projects",
        order,
      };
    }),
  };
}

const DEFAULT_SITE_SETTINGS = {
  favicon: "https://fdjd29ysr4tmphjq.public.blob.vercel-storage.com/media/files/document-w0X6lo2U3mFMxkuvMvwbniYZAwivdT.svg",
  heroGallery: { interval: 5200, order: [] },
  projectsPage: {
    heroTitle: "Projects",
    heroTitle_gr: "Έργα",
    heroTitleScale: 150,
    centerText: "we design what you want",
    centerText_gr: "we design what you want",
    showIntro: false,
    introTitle: "Projects",
    introTitle_gr: "Έργα",
    introNote: "A practice for buildings, shops & the rooms in between.",
    introNote_gr: "Ένα γραφείο για κτίρια, καταστήματα & τα δωμάτια στο ενδιάμεσο.",
    categoryTitlesUppercase: false,
  },
  homeV2: normaliseHomeV2(),
  menuImages: {
    home: "assets/projects/pg-panormou/01.png",
    projects: "assets/projects/pg-skoufa/01.png",
    agency: "assets/projects/dn-kolonaki/01.png",
    contact: "assets/projects/dn-dousmani/01.png",
  },
  // Shared fallback badge. A project's own icon and its category/subcategory
  // icon still take priority; this is used only when neither is set.
  defaultProjectBadge: "assets/proteingarden/Protein Garden New logo_final-03.png",
  people: {
    title: "People",
    title_gr: "Άνθρωποι",
    hero: "assets/people/people-hero-v2.png",
  },
  foot_big: "Let's design your",
  foot_big_em: "next space!",
  foot_copy_left: "© 2025 — 2026 Project58 Architecture",
  foot_copy_mid: "Architecture · Renovation · Retail",
  foot_copy_right: "Designed in-house · v1.0",
  contact: {
    location_label: "ATHENS",
    location_label_gr: "ΑΘΗΝΑ",
    address: "Akademias 76 · 106 76",
    address_gr: "Ακαδημίας 76 · 106 76",
    address_url: "",
    phone: "+30 210 000 5800",
    phone_url: "tel:+302100005800",
    email: "g.grigoriadis@project58.gr",
    email_url: "mailto:g.grigoriadis@project58.gr",
    instagram_text: "Instagram → @project.58",
    instagram_text_gr: "Instagram → @project.58",
    instagram_url: "",
  },
  inquiryForm: null,
};

const INQUIRY_FORM_GROUPS = [
  { id: "planning", title: "What are you planning?", title_gr: "Τι σχεδιάζετε;" },
  { id: "space", title: "About the space", title_gr: "Σχετικά με τον χώρο" },
  { id: "details", title: "A few details", title_gr: "Μερικές λεπτομέρειες" },
  { id: "contact", title: "How can we reach you?", title_gr: "Πώς μπορούμε να επικοινωνήσουμε;" },
];

const DEFAULT_INQUIRY_FORM = {
  groups: INQUIRY_FORM_GROUPS,
  questions: [
    { id: "type", label: "Project type", label_gr: "Τύπος έργου", type: "buttons", group: "planning", required: true, options: ["Retail", "Hospitality", "Residential", "Workplace", "Renovation", "Other"], options_gr: ["Λιανική", "Φιλοξενία", "Κατοικία", "Χώρος εργασίας", "Ανακαίνιση", "Άλλο"] },
    { id: "location", label: "Location", label_gr: "Τοποθεσία", type: "text", group: "space", required: false, placeholder: "City / neighbourhood", placeholder_gr: "Πόλη / περιοχή" },
    { id: "size", label: "Approximate size", label_gr: "Κατά προσέγγιση μέγεθος", type: "text", group: "space", required: false, placeholder: "e.g. 120 m²", placeholder_gr: "π.χ. 120 m²" },
    { id: "timeline", label: "Timeline", label_gr: "Χρονοδιάγραμμα", type: "select", group: "space", required: false, options: ["As soon as possible", "Within 1–3 months", "Within 3–6 months", "Flexible / exploring"], options_gr: ["Το συντομότερο δυνατό", "Μέσα σε 1–3 μήνες", "Μέσα σε 3–6 μήνες", "Ευέλικτο / διερεύνηση"] },
    { id: "budget", label: "Budget range", label_gr: "Εύρος προϋπολογισμού", type: "select", group: "details", required: false, options: ["Not sure yet", "Under €50k", "€50k–€150k", "€150k–€400k", "€400k+"], options_gr: ["Δεν είμαι σίγουρος ακόμα", "Κάτω από €50k", "€50k–€150k", "€150k–€400k", "€400k+"] },
    { id: "message", label: "Tell us about the project", label_gr: "Πείτε μας για το έργο", type: "textarea", group: "details", required: false, placeholder: "What you have in mind, the space, goals…", placeholder_gr: "Η ιδέα σας, ο χώρος και οι στόχοι…" },
    { id: "name", label: "Name", label_gr: "Όνομα", type: "text", group: "contact", required: true, placeholder: "Your name", placeholder_gr: "Το όνομά σας" },
    { id: "email", label: "Email", label_gr: "Email", type: "email", group: "contact", required: true, placeholder: "you@email.com", placeholder_gr: "you@email.com" },
    { id: "phone", label: "Phone", label_gr: "Τηλέφωνο", type: "tel", group: "contact", required: false, placeholder: "Optional", placeholder_gr: "Προαιρετικό" },
    { id: "company", label: "Company", label_gr: "Εταιρεία", type: "text", group: "contact", required: false, placeholder: "Optional", placeholder_gr: "Προαιρετικό" },
  ],
};

function normaliseInquiryForm(form) {
  const source = form && Array.isArray(form.questions) ? form.questions : DEFAULT_INQUIRY_FORM.questions;
  const rawGroups = form && Array.isArray(form.groups) && form.groups.length ? form.groups : INQUIRY_FORM_GROUPS;
  const seenGroups = new Set();
  const groups = rawGroups.map((group, order) => {
    const rawId = String(group && group.id || `step-${order + 1}`);
    let id = rawId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `step-${order + 1}`;
    while (seenGroups.has(id)) id = `${id}-${order + 1}`;
    seenGroups.add(id);
    return { id, title: String(group && group.title || `Step ${order + 1}`), title_gr: String(group && group.title_gr || group && group.title || `Βήμα ${order + 1}`) };
  });
  const defaultsById = Object.fromEntries(DEFAULT_INQUIRY_FORM.questions.map((question) => [question.id, question]));
  const validTypes = new Set(["text", "textarea", "email", "tel", "buttons", "select"]);
  const validGroups = new Set(groups.map((group) => group.id));
  return {
    groups,
    questions: source.map((question, order) => {
      const rawId = String(question && question.id || `question-${order + 1}`);
      const id = rawId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `question-${order + 1}`;
      const type = validTypes.has(question && question.type) ? question.type : "text";
      const defaults = defaultsById[id] || {};
      const options = (type === "buttons" || type === "select")
        ? (Array.isArray(question && question.options) ? question.options : []).map((option) => String(option)).filter(Boolean)
        : [];
      const sourceGreekOptions = Array.isArray(question && question.options_gr)
        ? question.options_gr
        : (Array.isArray(defaults.options_gr) ? defaults.options_gr : []);
      return {
        id,
        label: String(question && question.label || `Question ${order + 1}`),
        label_gr: String(question && question.label_gr || defaults.label_gr || question && question.label || `Ερώτηση ${order + 1}`),
        type,
        group: validGroups.has(question && question.group) ? question.group : groups[0].id,
        required: Boolean(question && question.required),
        placeholder: String(question && question.placeholder || ""),
        placeholder_gr: String(question && question.placeholder_gr || defaults.placeholder_gr || question && question.placeholder || ""),
        options,
        options_gr: options.map((option, index) => String(sourceGreekOptions[index] || option)),
      };
    }),
  };
}

function normaliseSiteSettings(site = {}) {
  const legacyAddress = site.athens_address || "";
  const firstLineAddress = legacyAddress ? legacyAddress.split("\n").filter(Boolean).slice(0, 2).join(" · ") : "";
  const contact = site.contact && typeof site.contact === "object" ? site.contact : {};
  const hasContact = (key) => Object.prototype.hasOwnProperty.call(contact, key);
  const instagramUrl = hasContact("instagram_url") ? contact.instagram_url : site.instagram_url || "";
  const normalisedInstagramUrl = (() => {
    const value = String(instagramUrl || "").trim();
    if (!value) return "";
    if (value.startsWith("@")) return `https://instagram.com/${value.slice(1)}`;
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) return value;
    return `https://${value.replace(/^\/\//, "")}`;
  })();
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...site,
    favicon: typeof site.favicon === "string" && site.favicon
      ? site.favicon
      : DEFAULT_SITE_SETTINGS.favicon,
    foot_big: site.foot_big || DEFAULT_SITE_SETTINGS.foot_big,
    foot_big_em: site.foot_big_em || DEFAULT_SITE_SETTINGS.foot_big_em,
    foot_copy_left: site.foot_copy_left || DEFAULT_SITE_SETTINGS.foot_copy_left,
    foot_copy_mid: site.foot_copy_mid || DEFAULT_SITE_SETTINGS.foot_copy_mid,
    foot_copy_right: site.foot_copy_right || DEFAULT_SITE_SETTINGS.foot_copy_right,
    heroGallery: {
      interval: Math.max(2000, Number((site.heroGallery || {}).interval) || 5200),
      // Display order for the home gallery, by project id. Kept separate from
      // the projects' own order so arranging the gallery doesn't reshuffle the
      // Projects list. Ids missing from here fall in after the ones listed.
      order: Array.isArray((site.heroGallery || {}).order)
        ? (site.heroGallery || {}).order.filter((id) => typeof id === "string")
        : [],
    },
    projectsPage: {
      ...DEFAULT_SITE_SETTINGS.projectsPage,
      ...(site.projectsPage || {}),
      heroTitleScale: Math.min(250, Math.max(50, Number((site.projectsPage || {}).heroTitleScale) || DEFAULT_SITE_SETTINGS.projectsPage.heroTitleScale)),
      showIntro: (site.projectsPage || {}).showIntro === true,
      categoryTitlesUppercase: (site.projectsPage || {}).categoryTitlesUppercase === true,
    },
    homeV2: normaliseHomeV2(site.homeV2),
    menuImages: {
      ...DEFAULT_SITE_SETTINGS.menuImages,
      ...(site.menuImages || {}),
    },
    // Migrate old content automatically: the former PG brand badge was the
    // only populated default in existing site settings.
    defaultProjectBadge: typeof site.defaultProjectBadge === "string"
      ? site.defaultProjectBadge
      : (site.brandLogos && (site.brandLogos.pg || site.brandLogos.dn)) || DEFAULT_SITE_SETTINGS.defaultProjectBadge,
    // Retire the former two-slot setting when normalized content is saved.
    brandLogos: undefined,
    people: {
      ...DEFAULT_SITE_SETTINGS.people,
      ...(site.people || {}),
      hero: !site.people || !site.people.hero || site.people.hero === "assets/people/people-hero.png"
        ? DEFAULT_SITE_SETTINGS.people.hero
        : site.people.hero,
    },
    inquiryForm: normaliseInquiryForm(site.inquiryForm),
    contact: {
      ...DEFAULT_SITE_SETTINGS.contact,
      ...contact,
      // The current nested settings always win, including an intentional empty
      // value. Top-level fields are legacy fallbacks for older saved documents.
      location_label: hasContact("location_label") ? contact.location_label : site.location_label || site.athens_label || DEFAULT_SITE_SETTINGS.contact.location_label,
      address: hasContact("address") ? contact.address : site.address || firstLineAddress || DEFAULT_SITE_SETTINGS.contact.address,
      address_url: hasContact("address_url") ? contact.address_url : site.address_url || "",
      phone: hasContact("phone") ? contact.phone : site.phone || site.athens_phone || DEFAULT_SITE_SETTINGS.contact.phone,
      phone_url: hasContact("phone_url") ? contact.phone_url : site.phone_url || (site.athens_phone ? `tel:${String(site.athens_phone).replace(/[^\d+]/g, "")}` : DEFAULT_SITE_SETTINGS.contact.phone_url),
      email: hasContact("email") ? contact.email : site.email || DEFAULT_SITE_SETTINGS.contact.email,
      email_url: hasContact("email_url") ? contact.email_url : site.email_url || (site.email ? `mailto:${site.email}` : DEFAULT_SITE_SETTINGS.contact.email_url),
      instagram_text: hasContact("instagram_text") ? contact.instagram_text : site.instagram_text || site.instagram || DEFAULT_SITE_SETTINGS.contact.instagram_text,
      instagram_url: normalisedInstagramUrl,
    },
  };
}

function projectSlugFromFields(project) {
  const words = String([project.name, project.location].filter(Boolean).join(" "))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z0-9]+/g) || [];
  return Array.from(new Set(words)).join("-") || project.id;
}

const BUNDLED_CONTENT = {
  projects: PROJECTS.map((p, order) => ({ ...p, order, featured: order < 6, slug: projectSlugFromFields(p) })),
  news: NEWS.map((n, order) => ({ ...n, order })),
  team: TEAM.map((m, order) => ({ ...m, order })),
  timeline: TIMELINE.map((r, order) => ({ ...r, order })),
};

function normaliseProject(p, order) {
  const brandKey = p.brand === "Dinas" || (p.id || "").startsWith("dn-") ? "dn" : "pg";
  const slug = !p.slug || p.slug === p.id ? projectSlugFromFields(p) : p.slug;
  const greekDefaults = PROJECTS_GR[p.id] || {};
  return {
    slug,
    category: p.category || p.typology || "retail",
    order: Number.isFinite(Number(p.order)) ? Number(p.order) : order,
    featured: p.featured != null ? Boolean(p.featured) : order < 6,
    ...greekDefaults,
    ...p,
    // Visibility is opt-out so every project created before this setting
    // existed remains on the public site.
    visible: p.visible !== false,
    brandKey,
    name_gr: p.name_gr || greekDefaults.name_gr || p.name || "",
    location_gr: p.location_gr || greekDefaults.location_gr || p.location || "",
    type_gr: p.type_gr || greekDefaults.type_gr || (p.type === "Fast Casual · Retail" ? "Γρήγορη εστίαση · Λιανική" : p.type || ""),
    role_gr: p.role_gr || greekDefaults.role_gr || p.role || "",
    summary_gr: p.summary_gr || greekDefaults.summary_gr || p.summary || "",
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    body: Array.isArray(p.body) ? p.body : [],
  };
}

function isProjectVisible(project) {
  return Boolean(project) && project.visible !== false;
}

function visibleProjects() {
  return PROJECTS.filter(isProjectVisible);
}

function sortByOrder(items) {
  return items.slice().sort((a, b) => {
    const ao = Number.isFinite(Number(a.order)) ? Number(a.order) : 9999;
    const bo = Number.isFinite(Number(b.order)) ? Number(b.order) : 9999;
    return ao - bo;
  });
}

/* ---------- where the content comes from ----------
   Three sources, in order of authority:

     1. /api/content   what the dashboard published — shared by everyone
     2. localStorage   this browser's own copy, for offline edits and for
                       deployments with no Blob store linked
     3. BUNDLED_CONTENT the defaults compiled into this file

   Before (1) existed an edit never left the browser that made it, so
   visitors always saw (3). REMOTE_CONTENT stays null until the fetch
   below resolves, which is why the app waits for P58_CONTENT_READY
   before its first render. */
let REMOTE_CONTENT = null;

/* One exception to that order: once the dashboard writes to localStorage in
   this browser, the local copy wins. That is the live preview — dashboard in
   one tab, site in the other — which would otherwise stop working the moment
   anything was published. Visitors never trip it: nothing writes the key. */
let LOCAL_EDIT_WINS = false;
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === P58_STORE_KEY) LOCAL_EDIT_WINS = true;
  });
}

function readPreviewProject() {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(location.search).get("preview");
  if (!id) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(P58_PROJECT_PREVIEW_PREFIX + id) || "null");
    if (!stored || !stored.project || typeof stored.project !== "object") return null;
    // Draft links are intentionally temporary. A stale bookmarked preview
    // should never masquerade as the current editor state indefinitely.
    if (stored.createdAt && Date.now() - stored.createdAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(P58_PROJECT_PREVIEW_PREFIX + id);
      return null;
    }
    return stored.project;
  } catch (e) { return null; }
}

function readP58Store() {
  let source = null;
  if (!LOCAL_EDIT_WINS && REMOTE_CONTENT && typeof REMOTE_CONTENT === "object") {
    source = REMOTE_CONTENT;
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem(P58_STORE_KEY) || "null");
      if (stored && typeof stored === "object") source = stored;
    } catch (e) { /* malformed — fall through to the defaults */ }
  }
  if (!source) source = BUNDLED_CONTENT;

  const preview = readPreviewProject();
  if (!preview) return source;
  const projects = Array.isArray(source.projects) ? source.projects.slice() : [];
  const at = projects.findIndex((project) => project.id === preview.id);
  const visiblePreview = { ...preview, visible: true };
  if (at >= 0) projects[at] = visiblePreview;
  else projects.unshift(visiblePreview);
  return { ...source, projects };
}

/* Resolves once, whether or not the fetch worked: a site that cannot reach
   its own API must still render, just with older content. */
function loadRemoteContent() {
  if (typeof fetch !== "function") return Promise.resolve(false);
  return fetch("/api/content?t=" + Date.now(), { credentials: "same-origin", cache: "no-store" })
    .then((res) => (res.ok ? res.json() : null))
    .then((body) => {
      if (!body || !body.content || typeof body.content !== "object") return false;
      REMOTE_CONTENT = body.content;
      applyP58ContentFromStore();
      return true;
    })
    .catch(() => false); // no API (static preview), offline, or a bad response
}

function applySiteFavicon(site) {
  const favicon = normaliseSiteSettings(site || {}).favicon;
  try {
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = favicon || DEFAULT_SITE_SETTINGS.favicon;
  } catch (e) { /* document is unavailable outside the browser */ }
}

function applyP58ContentFromStore() {
  try {
    const source = readP58Store();
    applySiteFavicon(source.site || {});
    if (Array.isArray(source.projects) && source.projects.length) {
      PROJECTS.splice(0, PROJECTS.length, ...sortByOrder(source.projects.map(normaliseProject)));
    }
    if (Array.isArray(source.news) && source.news.length) {
      NEWS.splice(0, NEWS.length, ...sortByOrder(source.news.map((n, order) => ({ order, ...n }))));
    }
    if (Array.isArray(source.team) && source.team.length) {
      const team = sortByOrder(source.team.map((m, order) => {
        const greekDefaults = TEAM_GR[order] || {};
        return {
          ...greekDefaults,
          order,
          ...m,
          role_gr: m.role_gr === "Studio Manager" ? "Υπεύθυνος Στούντιο" : (m.role_gr || greekDefaults.role_gr || m.role || ""),
          note_gr: m.note_gr || greekDefaults.note_gr || m.note || "",
        };
      }));
      if (team[0] && team[0].name === "Nikos Andreadis") {
        team[0] = { ...team[0], name: "Georgios Grigoriadis", role: "Founder", role_gr: "Ιδρυτής", note: "Founder of Project58, leading the studio’s architectural direction and project delivery.", note_gr: "Ιδρυτής του Project58, με ευθύνη για την αρχιτεκτονική κατεύθυνση και την υλοποίηση των έργων του γραφείου.", portrait: "assets/people/georgios-grigoriadis.jpg" };
      } else if (team[0] && team[0].name === "Georgios Grigoriadis" && !team[0].portrait) {
        team[0] = { ...team[0], portrait: "assets/people/georgios-grigoriadis.jpg" };
      }
      if (team[1] && team[1].name === "Eleni Karali") {
        team[1] = { ...team[1], name: "Naveen Kumar", role: "Architect", role_gr: "Αρχιτέκτονας", note: "Architect working across concept design, development, and detailed coordination.", note_gr: "Αρχιτέκτονας με αντικείμενο τον σχεδιασμό, την ανάπτυξη και τον λεπτομερή συντονισμό των έργων.", portrait: "assets/people/naveen-kumar.png" };
      }
      if (team[2] && team[2].name === "Dimitris Vlachos") {
        team[2] = { ...team[2], name: "Evagelos Kastavenakis", role: "Architect", role_gr: "Αρχιτέκτονας", note: "Architect focused on spatial development, material research, and project execution.", note_gr: "Αρχιτέκτονας με έμφαση στη χωρική ανάπτυξη, την έρευνα υλικών και την υλοποίηση έργων.", portrait: "assets/people/evagelos-kastavenakis.png" };
      }
      TEAM.splice(0, TEAM.length, ...team);
    }
  } catch (e) { /* ignore malformed overrides */ }
}

/* Blob URLs keep their extension, so the file type is readable from the URL.
   Used wherever a slot can hold either a still or a clip. */
function isVideoSrc(src) {
  if (typeof src !== "string" || !src) return false;
  if (src.startsWith("data:video/")) return true;
  return /\.mp4$/i.test(src.split(/[?#]/)[0]);
}

/* ===== Categories =====
   The dashboard owns this list: it publishes `categories` with the rest of the
   content, and both the dashboard and the public site read it from here so the
   two cannot drift. The defaults below are only the seed for a store that has
   never had the section saved. */
const DEFAULT_CATEGORIES = [
  { id: "retail", label: "Retail", label_gr: "Λιανική", description: "Multi-site retail and fast casual interiors", description_gr: "Χώροι λιανικής πολλαπλών σημείων και εσωτερικοί χώροι γρήγορης εστίασης", order: 0, subLabel: "Brand", subLabel_gr: "Εμπορικό σήμα", subcategories: [
    { id: "protein-garden", label: "Protein Garden", order: 0 },
    { id: "dinas", label: "Dinas", order: 1 },
  ] },
  { id: "hospitality", label: "Hospitality", label_gr: "Φιλοξενία", description: "Restaurants, cafes, bars, and service-led rooms", description_gr: "Εστιατόρια, καφέ, bar και χώροι εξυπηρέτησης", order: 1 },
  { id: "residential", label: "Residential", label_gr: "Κατοικίες", description: "Homes, renovations, and private commissions", description_gr: "Κατοικίες, ανακαινίσεις και ιδιωτικές αναθέσεις", order: 2 },
  { id: "workplace", label: "Workplace", label_gr: "Χώροι εργασίας", description: "Studios, offices, and work environments", description_gr: "Στούντιο, γραφεία και περιβάλλοντα εργασίας", order: 3 },
];

const slugifyCategoryId = (value) => String(value || "").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const normaliseCategorySubs = (subs) => (Array.isArray(subs) ? subs : [])
  .map((sub, order) => {
    const label = (typeof sub === "string" ? sub : (sub && sub.label)) || "";
    return {
      id: (sub && sub.id) || slugifyCategoryId(label) || `sub-${order}`,
      label: label || (sub && sub.id) || "Sub-category",
      order: Number.isFinite(Number(sub && sub.order)) ? Number(sub.order) : order,
      icon: (sub && sub.icon) || "",
    };
  })
  .filter((sub) => sub.label)
  .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

function normaliseCategories(items) {
  const source = Array.isArray(items) && items.length ? items : DEFAULT_CATEGORIES;
  const defaultsById = Object.fromEntries(DEFAULT_CATEGORIES.map((category) => [category.id, category]));
  return source
    .map((c, order) => {
      const id = c.id || slugifyCategoryId(c.label) || `cat-${order}`;
      const defaults = defaultsById[id] || {};
      return {
        id,
        label: c.label || c.id || "Category",
        label_gr: c.label_gr || defaults.label_gr || c.label || c.id || "Κατηγορία",
        description: c.description || "",
        description_gr: c.description_gr || defaults.description_gr || c.description || "",
        cover: c.cover || defaults.cover || "",
        order: Number.isFinite(Number(c.order)) ? Number(c.order) : order,
        subLabel: c.subLabel || "Sub-category",
        subLabel_gr: c.subLabel_gr || defaults.subLabel_gr || c.subLabel || "Υποκατηγορία",
        subcategories: normaliseCategorySubs(c.subcategories),
      };
    })
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

/* The published category list, ready to render. */
function siteCategories() {
  const stored = readP58Store();
  return normaliseCategories(stored && stored.categories);
}

/* Which category a project belongs to, tolerating the older `typology` field
   and the "architecture" id that pre-dates "residential". */
function projectCategoryId(project) {
  const raw = String((project && (project.category || project.typology)) || "retail").toLowerCase();
  return raw === "architecture" ? "residential" : raw;
}

/* The badge a project shows in the indexes: project override, then category
   icon, then the one shared site-wide default. */
function projectIconFor(project, site, categories) {
  if (!project) return "";
  if (project.icon) return project.icon;

  // The logo set beside this brand in its category's sub-category list.
  // Matched on the label rather than an id, because that label is what the
  // project stores in `brand` — there is no id link between the two.
  const brand = String(project.brand || "").trim().toLowerCase();
  if (brand && Array.isArray(categories)) {
    const catId = project.category || project.typology || "retail";
    const cat = categories.find((c) => c && c.id === catId);
    const subs = (cat && cat.subcategories) || [];
    const match = subs.find((s) => String((s && s.label) || "").trim().toLowerCase() === brand);
    if (match && match.icon) return match.icon;
  }

  return (site && site.defaultProjectBadge) || DEFAULT_SITE_SETTINGS.defaultProjectBadge || "";
}

/* Sort orders offered on the projects index. `compare` is handed the language-aware
   pick() so the region ordering follows the names actually shown on screen.
   Completion granularity is the project year — the data carries no finer date. */
const PROJECT_SORT_DEFAULT = "date";
const PROJECT_SORTS = {
  date: {
    label: "sort_date",
    compare: () => (a, b) =>
      (Number(b.year) || 0) - (Number(a.year) || 0) ||
      String(b.code || "").localeCompare(String(a.code || ""), undefined, { numeric: true }),
  },
  region: {
    label: "sort_region",
    compare: (pick) => {
      const where = (p) => String(pick(p, "location") || "").split(/\s*·\s*/);
      return (a, b) => {
        const [cityA = "", areaA = ""] = where(a);
        const [cityB = "", areaB = ""] = where(b);
        return (
          cityA.localeCompare(cityB, undefined, { sensitivity: "base" }) ||
          areaA.localeCompare(areaB, undefined, { sensitivity: "base" }) ||
          (Number(b.year) || 0) - (Number(a.year) || 0)
        );
      };
    },
  },
};

// Apply what we have synchronously so anything reading PROJECTS at import
// time still sees a populated array, then start the fetch that supersedes it.
applyP58ContentFromStore();
const P58_CONTENT_READY = loadRemoteContent();

Object.assign(window, { P58_STORE_KEY, P58_CONTENT_READY, DEFAULT_SITE_SETTINGS, DEFAULT_HOME_V2_BANNERS, DEFAULT_INQUIRY_FORM, INQUIRY_FORM_GROUPS, normaliseHomeV2, normaliseInquiryForm, normaliseSiteSettings, applySiteFavicon, projectSlugFromFields, applyP58ContentFromStore, readP58Store, PROJECT_SORTS, PROJECT_SORT_DEFAULT, projectIconFor, isProjectVisible, visibleProjects, isVideoSrc, DEFAULT_CATEGORIES, normaliseCategories, siteCategories, projectCategoryId });
