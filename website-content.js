/* Shared allowlist: visual editing writes the original CMS fields, never a second copy. */
(function () {
  const keyFor = (kind, id, field) => `content:${kind}:${encodeURIComponent(String(id))}:${field}`;
  const get = (object, path) => path.reduce((value, part) => value?.[part], object);
  const clone = value => JSON.parse(JSON.stringify(value));
  function catalogue(input = {}) {
    const content = {...input, site:window.normaliseSiteSettings(input.site || {}), categories:window.normaliseCategories(input.categories)};
    const fields = [];
    const add = (kind,id,field,path,label,route,options={}) => {
      const enPath = [...path,field], grPath = [...path,`${field}_gr`];
      const en = options.en ?? get(content,enPath) ?? '';
      const gr = options.gr ?? get(content,grPath) ?? en;
      fields.push({key:keyFor(kind,id,field),label,route,en:String(en),gr:String(gr),enPath,grPath,...options});
    };
    (content.projects || []).forEach((p,i) => {
      const route=`project/${p.id}`;
      ['name','location','summary','type','status','size','lead_architect','design_team','contractor','engineer'].forEach(field=>add('project',p.id,field,['projects',i],`${p.name} · ${field}`,route,field==='status'?{gr:p.status_gr ?? window.DICT_I18N?.gr?.[p.status] ?? p.status ?? ''}:{}));
      (p.gallery || []).forEach((image,j)=>add('gallery',`${p.id}/${j}`,'tag',['projects',i,'gallery',j],`${p.name} · Λεζάντα ${j+1}`,route));
    });
    (content.team || []).forEach((p,i)=>['name','role','note'].forEach(field=>add('team',p._id || i,field,['team',i],`${p.name} · ${field}`,'agency')));
    (content.news || []).forEach((n,i)=>['title','date','cat','deck'].forEach(field=>add('news',n._id || i,field,['news',i],`Νέα · ${n.title || i+1} · ${field}`,'agency')));
    content.categories.forEach((category,i)=>{
      const path=['categories',i];
      ['label','description','subLabel'].forEach(field=>add('category',category.id,field,path,`${category.label} · ${field}`,'projects'));
      category.subcategories.forEach((brand,j)=>{
        const subPath=[...path,'subcategories',j], route=`brand/${brand.id}`;
        add('brand',brand.id,'label',subPath,`${brand.label} · Όνομα`,route);
        const concept=window.brandConceptCopy(brand);
        add('brand',brand.id,'brandConcept',subPath,`${brand.label} · Αρχιτεκτονικό concept`,route,{en:brand.brandConcept || concept.text,gr:brand.brandConcept_gr || concept.text_gr});
        ['brandDescription'].forEach(field=>add('brand',brand.id,field,subPath,`${brand.label} · Περιγραφή`,route));
        const projects=(content.projects || []).filter(p=>window.projectCategoryId(p)===category.id && String(p.brand||'').toLowerCase()===brand.label.toLowerCase());
        const intro=window.brandStoryIntro(brand,projects);
        add('brand',brand.id,'brandStoryTitle',subPath,`${brand.label} · Αρχικός τίτλος παρουσίασης`,route,{en:intro.title,gr:intro.title_gr});
        add('brand',brand.id,'brandStorySubtitle',subPath,`${brand.label} · Υπότιτλος παρουσίασης`,route,{en:intro.subtitle,gr:intro.subtitle_gr});
        const sections=window.brandStorySections(brand,projects);
        sections.forEach((section,k)=>{
          const sectionPath=[...subPath,'brandSections',k];
          const seed={path:[...subPath,'brandSections'],value:sections};
          ['title','text'].forEach(field=>add('section',`${brand.id}/${section.id}`,field,sectionPath,`${brand.label} · Ενότητα ${k+1} · ${field}`,route,{en:section[field]||'',gr:section[`${field}_gr`] ?? section[field] ?? '',seed}));
          section.images.forEach((image,n)=>add('section-image',`${brand.id}/${section.id}/${n}`,'caption',[...sectionPath,'images',n],`${brand.label} · Ενότητα ${k+1} · Λεζάντα ${n+1}`,route,{en:image.caption||'',gr:image.caption_gr ?? image.caption ?? '',seed}));
        });
      });
    });
    ['title'].forEach(field=>add('people','page',field,['site','people'],`Ομάδα · ${field}`,'agency'));
    ['location_label','address','phone','email','instagram_text'].forEach(field=>add('contact','footer',field,['site','contact'],`Επικοινωνία · ${field}`,'contact'));
    content.site.homeV2.banners.forEach((banner,i)=>['eyebrow','title','note'].forEach(field=>add('banner',banner.id,field,['site','homeV2','banners',i],`Αρχική · ${banner.title} · ${field}`,'home')));
    const form=content.site.inquiryForm;
    form.groups.forEach((group,i)=>add('form-group',group.id,'title',['site','inquiryForm','groups',i],`Φόρμα · ${group.title}`,'start'));
    form.questions.forEach((question,i)=>{
      ['label','placeholder'].forEach(field=>add('question',question.id,field,['site','inquiryForm','questions',i],`Φόρμα · ${question.label} · ${field}`,'start'));
      question.options.forEach((option,j)=>fields.push({key:keyFor('option',question.id,String(j)),label:`Φόρμα · ${question.label} · ${option}`,route:'start',en:option,gr:question.options_gr[j] ?? option,enPath:['site','inquiryForm','questions',i,'options',j],grPath:['site','inquiryForm','questions',i,'options_gr',j]}));
    });
    return {content,fields};
  }
  function applyEdits(input, edits = {}) {
    const {content,fields}=catalogue(input);
    const next=clone(content);
    const set=(path,value)=>{let obj=next;path.slice(0,-1).forEach((part,i)=>{if(obj[part]==null)obj[part]=typeof path[i+1]==='number'?[]:{};obj=obj[part];});obj[path.at(-1)]=value;};
    fields.forEach(field=>{
      const edit=edits[field.key];
      if(!edit || !['en','gr'].some(lang=>typeof edit[lang]==='string'))return;
      if(field.seed && !Array.isArray(get(next,field.seed.path)))set(field.seed.path,clone(field.seed.value));
      for(const lang of ['en','gr'])if(typeof edit[lang]==='string')set(field[`${lang}Path`],edit[lang]);
      // Brand membership uses the canonical English name; rename the linked projects together.
      if(field.key.startsWith('content:brand:') && field.key.endsWith(':label') && typeof edit.en==='string') {
        const category=next.categories[field.enPath[1]];
        next.projects=(next.projects||[]).map(p=>window.projectCategoryId(p)===category.id && p.brand===field.en?{...p,brand:edit.en}:p);
      }
    });
    return next;
  }
  Object.assign(window,{siteContentKey:keyFor,visualContentCatalogue:catalogue,applyVisualContentEdits:applyEdits});
})();
