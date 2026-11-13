/* Pure SEO model shared by the server response and browser navigation. */
(function (root) {
  const DEFAULT_ORIGIN = 'https://p58website.vercel.app';
  const clean = value => String(value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const pick = (item, key, lang) => clean(lang === 'gr' ? (item?.[key + '_gr'] ?? item?.[key]) : item?.[key]);
  const language = path => /^\/el(?:\/|$)/.test(path) ? 'gr' : /^\/en(?:\/|$)/.test(path) ? 'en' : null;
  const stripLocale = path => path.replace(/^\/(en|el)(?=\/|$)/, '') || '/';
  const localPath = (path, lang = 'en') => '/' + (lang === 'gr' || lang === 'el' ? 'el' : 'en') + (stripLocale(path) === '/' ? '' : stripLocale(path));
  function origin(value) {
    try { const u = new URL(value || DEFAULT_ORIGIN); return /^https?:$/.test(u.protocol) ? u.origin : DEFAULT_ORIGIN; } catch { return DEFAULT_ORIGIN; }
  }
  const absolute = (path, base) => {
    try { const u = new URL(path, origin(base) + '/'); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; }
  };
  const shareImage = value => typeof value === 'string' && !/^data:video\//i.test(value) && !/\.(mp4|webm|mov)(?:[?#]|$)/i.test(value) ? value : '';
  function routePath(route) {
    if (route.name === 'home') return '/';
    if (route.name === 'project') return '/projects/' + encodeURIComponent(route.id);
    if (route.name === 'brand') return '/projects/brands/' + encodeURIComponent(route.id);
    if (route.name === 'agency') return '/people';
    if (route.name === 'start') return '/start-a-project';
    return '/' + route.name;
  }
  function brands(content) {
    const projects = (content.projects || []).filter(p => p.visible !== false);
    const definitions = (content.categories || []).find(c => c.id === 'retail')?.subcategories || [];
    const labels = [...new Set(projects.filter(p => (p.typology || p.category || 'retail') === 'retail').map(p => clean(p.brand)).filter(Boolean))];
    return labels.map(label => {
      const definition = definitions.find(d => clean(d.label).toLowerCase() === label.toLowerCase()) || {};
      const members = projects.filter(p => clean(p.brand).toLowerCase() === label.toLowerCase() && (p.typology || p.category || 'retail') === 'retail');
      return {...definition, id:definition.id || encodeURIComponent(label.toLowerCase()), label, projects:members};
    }).filter(b => b.projects.length > 1 || ['protein-garden','dinas'].includes(b.id));
  }
  function metadata({route, content = {}, lang = 'en', siteOrigin}) {
    const base = origin(siteOrigin), greek = lang === 'gr';
    const contact = content.site?.contact || {};
    const projects = (content.projects || []).filter(p => p.visible !== false);
    const project = route.name === 'project' ? projects.find(p => p.id === route.id || p.slug === route.id) : null;
    const brand = route.name === 'brand' ? brands(content).find(b => b.id === route.id) : null;
    const missing = route.name === 'notfound' || (route.name === 'project' && !project) || (route.name === 'brand' && !brand);
    const titles = greek ? {
      home:'Αρχιτεκτονικό γραφείο στην Αθήνα', projects:'Έργα κατοικίας και επαγγελματικών χώρων',
      architecture:'Αρχιτεκτονική κατοικίας', interiors:'Καταστήματα και επαγγελματικοί χώροι',
      agency:'Η ομάδα', contact:'Επικοινωνία με το γραφείο στην Αθήνα', start:'Μιλήστε μας για το έργο σας',
      services:'Αρχιτεκτονικές υπηρεσίες & προσέγγιση', notfound:'Η σελίδα δεν βρέθηκε'
    } : {
      home:'Architecture & Design Studio in Athens', projects:'Residential & Commercial Projects',
      architecture:'Residential Architecture', interiors:'Retail & Commercial Interiors',
      agency:'Our Team', contact:'Contact Our Athens Studio', start:'Tell Us About Your Project',
      services:'Architectural Services & Approach', notfound:'Page Not Found'
    };
    const descriptions = greek ? {
      home:'Το Project58 είναι γραφείο αρχιτεκτονικής και σχεδιασμού στην Αθήνα. Ανακαλύψτε έργα κατοικίας, καταστημάτων και επαγγελματικών χώρων.',
      projects:'Έργα του Project58 σε κατοικίες και επαγγελματικούς χώρους. Δείτε φωτογραφίες, τοποθεσίες και τη σχεδιαστική προσέγγιση κάθε έργου.',
      architecture:'Εξερευνήστε έργα κατοικίας του Project58 και τον τρόπο με τον οποίο η οργάνωση, το φως και τα υλικά διαμορφώνουν την καθημερινή ζωή.',
      interiors:'Ανακαλύψτε τον σχεδιασμό καταστημάτων και επαγγελματικών χώρων του Project58, μαζί με τις συλλογές έργων Protein Garden και Dinas.',
      agency:'Γνωρίστε την ομάδα του Project58, του γραφείου αρχιτεκτονικής και σχεδιασμού στην Αθήνα, και τους ανθρώπους πίσω από τα έργα του.',
      contact:'Επικοινωνήστε με το Project58 για το αρχιτεκτονικό σας έργο. Βρείτε τη διεύθυνση του γραφείου στην Αθήνα, το τηλέφωνο και το email.',
      start:'Περιγράψτε τον χώρο, τις ανάγκες και τις προτεραιότητές σας στην ομάδα του Project58, ώστε να ξεκινήσει η συζήτηση για το έργο σας.',
      services:'Η προσέγγιση του Project58 στην αρχιτεκτονική κατοικίας, τον σχεδιασμό επαγγελματικών χώρων και τα συστήματα σχεδιασμού πολλαπλών καταστημάτων.'
    } : {
      home:'Project58 is an architecture and design studio in Athens. Explore residential projects, retail spaces and commercial interiors.',
      projects:'Explore residential and commercial projects by Project58, with photographs, locations and the design approach behind each space.',
      architecture:'Discover residential projects by Project58 and the relationship between spatial organisation, light, materials and everyday life.',
      interiors:'Explore retail and commercial interiors by Project58, including the Protein Garden and Dinas project collections.',
      agency:'Meet the people behind Project58, the Athens-based architecture and design practice, and discover the team working on its projects.',
      contact:'Contact Project58 about your architectural project. Find our Athens studio address, telephone number and email.',
      start:'Tell Project58 about your space, needs and priorities to begin a conversation about your architectural project.',
      services:'Explore the Project58 approach to residential architecture, commercial interiors and adaptable design systems for multiple retail locations.'
    };
    let title = titles[route.name] || titles.notfound;
    let description = descriptions[route.name] || '';
    let image = projects.find(p => p.featured && shareImage(p.hero))?.hero || projects.find(p => shareImage(p.hero))?.hero || '/assets/logo-black.png';
    let path = routePath(route);
    if (project) {
      title = [pick(project,'name',lang), pick(project,'location',lang)].filter(Boolean).join(' — ');
      description = pick(project,'summary',lang) || [pick(project,'name',lang), pick(project,'type',lang), pick(project,'location',lang), 'Project58'].filter(Boolean).join(' · ');
      image = shareImage(project.hero) || image;
      path = routePath({name:'project',id:project.slug || project.id});
    }
    if (brand) {
      title = `${pick(brand,'label',lang)} — ${greek ? 'Σχεδιασμός καταστημάτων' : 'Retail Design'}`;
      description = greek ? `Η συλλογή έργων ${pick(brand,'label',lang)} από το Project58. Ανακαλύψτε τα καταστήματα και την κοινή σχεδιαστική τους ταυτότητα.` : `Explore the ${pick(brand,'label',lang)} project collection by Project58, its individual locations and their shared design identity.`;
      image = shareImage(brand.brandCover) || shareImage(brand.projects[0]?.hero) || image;
    }
    if (missing) { title = titles.notfound; description = ''; }
    description = clean(description);
    if (description.length > 180) description = description.slice(0,177).replace(/\s+\S*$/, '') + '…';
    const canonical = base + localPath(path,lang);
    const alternatives = {en:base + localPath(path,'en'), el:base + localPath(path,'gr')};
    const organisation = {
      '@type':'Organization', '@id':base + '/#organization', name:'Project58', url:base + '/en',
      logo:absolute('/assets/logo-black.png',base),
      ...(contact.phone ? {telephone:clean(contact.phone)} : {}),
      ...(contact.email ? {email:clean(contact.email)} : {}),
      ...(contact.address ? {address:{'@type':'PostalAddress',streetAddress:pick(contact,'address',lang),addressLocality:pick(contact,'location_label',lang)}} : {}),
      ...(absolute(contact.instagram_url,base) && contact.instagram_url ? {sameAs:[absolute(contact.instagram_url,base)]} : {})
    };
    const graph = [organisation, {'@type':'WebSite','@id':base+'/#website',url:base+'/en',name:'Project58',inLanguage:['en','el'],publisher:{'@id':organisation['@id']}},
      {'@type':route.name==='contact'?'ContactPage':route.name==='agency'?'AboutPage':'WebPage','@id':canonical+'#page',url:canonical,name:title+' | Project58',description,inLanguage:greek?'el':'en',isPartOf:{'@id':base+'/#website'},publisher:{'@id':organisation['@id']}}];
    return {title:title+' | Project58',description,canonical,alternatives,image:absolute(image,base),locale:greek?'el_GR':'en_GB',lang:greek?'el':'en',missing,structured:{'@context':'https://schema.org','@graph':graph}};
  }
  function head(meta, noindex = false) {
    return `<title>${escape(meta.title)}</title>\n<meta name="description" content="${escape(meta.description)}">\n<link rel="canonical" href="${escape(meta.canonical)}">\n` +
      Object.entries({...meta.alternatives,'x-default':meta.alternatives.en}).map(([lang,href])=>`<link rel="alternate" hreflang="${lang}" href="${escape(href)}">`).join('\n') +
      `\n<meta name="robots" content="${noindex || meta.missing ? 'noindex, follow' : 'index, follow'}">\n` +
      Object.entries({'og:type':'website','og:site_name':'Project58','og:title':meta.title,'og:description':meta.description,'og:url':meta.canonical,'og:image':meta.image,'og:locale':meta.locale}).map(([name,value])=>`<meta property="${name}" content="${escape(value)}">`).join('\n') +
      `\n<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${escape(meta.image)}">\n<script type="application/ld+json" id="p58-structured-data">${json(meta.structured)}</script>`;
  }
  function apply(meta) {
    document.title = meta.title;
    const set = (selector, tag, attrs) => { let el=document.head.querySelector(selector); if(!el){el=document.createElement(tag);document.head.appendChild(el);}Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); };
    set('meta[name="description"]','meta',{name:'description',content:meta.description});
    set('link[rel="canonical"]','link',{rel:'canonical',href:meta.canonical});
    for(const [lang,href] of Object.entries({...meta.alternatives,'x-default':meta.alternatives.en})) set(`link[hreflang="${lang}"]`,'link',{rel:'alternate',hreflang:lang,href});
    for(const [property,content] of Object.entries({'og:type':'website','og:site_name':'Project58','og:title':meta.title,'og:description':meta.description,'og:url':meta.canonical,'og:image':meta.image,'og:locale':meta.locale})) set(`meta[property="${property}"]`,'meta',{property,content});
    for(const [name,content] of Object.entries({'twitter:card':'summary_large_image','twitter:title':meta.title,'twitter:description':meta.description,'twitter:image':meta.image})) set(`meta[name="${name}"]`,'meta',{name,content});
    const preview = /(?:preview|textPreview|visualTextEditor)=/.test(location.search);
    set('meta[name="robots"]','meta',{name:'robots',content:preview||meta.missing?'noindex, follow':'index, follow'});
    set('#p58-structured-data','script',{id:'p58-structured-data',type:'application/ld+json'});
    document.getElementById('p58-structured-data').textContent=json(meta.structured);
  }
  function sitemap(content, siteOrigin) {
    const base=origin(siteOrigin);
    const paths=['/','/projects','/architecture','/interiors','/people','/services','/contact','/start-a-project',...(content.projects||[]).filter(p=>p.visible!==false).map(p=>routePath({name:'project',id:p.slug||p.id})),...brands(content).map(b=>routePath({name:'brand',id:b.id}))];
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+[...new Set(paths)].flatMap(path=>['en','gr'].map(lang=>'<url><loc>'+escape(base+localPath(path,lang))+'</loc>'+['en','gr'].map(other=>`<xhtml:link rel="alternate" hreflang="${other==='gr'?'el':'en'}" href="${escape(base+localPath(path,other))}"/>`).join('')+'</url>')).join('')+'</urlset>';
  }
  root.P58SEO={clean,escape,json,pick,language,stripLocale,localPath,origin,absolute,routePath,brands,metadata,head,apply,sitemap};
})(typeof window === 'undefined' ? globalThis : window);
