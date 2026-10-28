import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
function functions(file, names) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parse(source, {sourceType:'script',plugins:['jsx']});
  return ast.program.body.filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id.name)).map(node => source.slice(node.start,node.end)).join('\n');
}

test('project logo clear, reload, replace and reset preserve the intended badge', () => {
  const source = fs.readFileSync('dashboard.jsx', 'utf8');
  const ast = parse(source, {sourceType:'script',plugins:['jsx']});
  const elements = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXElement') elements.push(node);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(ast);
  const input = elements.find(node => node.openingElement.name.name === 'ImageInput' && node.openingElement.attributes.some(attr => attr.name?.name === 'placeholder' && attr.value?.value === 'Brand logo · square'));
  const reset = elements.find(node => node.openingElement.name.name === 'button' && node.children.some(child => child.type === 'JSXText' && child.value.includes('Επαναφορά προεπιλεγμένου λογοτύπου')));
  const callback = (node, name) => {
    const expression = node.openingElement.attributes.find(attr => attr.name?.name === name).value.expression;
    return source.slice(expression.start, expression.end);
  };
  const ctx = vm.createContext({DEFAULT_SITE_SETTINGS:{defaultProjectBadge:'bundled.svg'},PROJECTS_GR:{},projectSlugFromFields:p=>p.id});
  vm.runInContext(functions('data.jsx',['projectIconFor','normaliseProject']), ctx);
  ctx.project = {id:'one',category:'retail',brand:'Example',icon:'custom.svg'};
  ctx.set = (key, value) => { ctx.project = {...ctx.project,[key]:value}; };
  const change = vm.runInContext(`(${callback(input, 'onChange')})`, ctx);
  const restore = vm.runInContext(`(${callback(reset, 'onClick')})`, ctx);
  const site = {defaultProjectBadge:'general.svg'};
  const categories = [{id:'retail',subcategories:[{label:'Example',icon:'brand.svg'}]}];
  const badge = () => ctx.projectIconFor(ctx.project, site, categories);
  assert.equal(badge(),'custom.svg');
  change('');
  ctx.project = ctx.normaliseProject(JSON.parse(JSON.stringify(ctx.project)),0);
  assert.equal(badge(),'');
  assert.equal(ctx.project.icon,null);
  restore();
  assert.equal(badge(),'brand.svg');
  change(''); // Clearing an inherited logo must also suppress fallback.
  assert.equal(badge(),'');
  change('replacement.svg');
  assert.equal(badge(),'replacement.svg');
  restore();
  ctx.project = {...ctx.project,brand:''};
  assert.equal(badge(),'general.svg');
  delete ctx.project.icon; // Existing projects keep inheritance.
  assert.equal(badge(),'general.svg');
});

test('visual editor accepts only supported projectsPage text fields', () => {
  const ctx = vm.createContext({});
  vm.runInContext(functions('visual-text-editor.jsx',['visualProjectTextField']),ctx);
  for (const field of ['heroTitle','introTitle','introNote','centerText']) assert.equal(ctx.visualProjectTextField(`projectsPage.${field}`),field);
  for (const key of ['projectsPage.showIntro','projectsPage.__proto__','__proto__','projects',null,undefined]) assert.equal(ctx.visualProjectTextField(key),null);
});

test('bilingual visual text edits preserve the other language, empty text and unrelated settings', () => {
  const ctx = vm.createContext({window:{DICT_I18N:{en:{title:'Default title'},gr:{title:'Αρχικός τίτλος'}}}});
  vm.runInContext(functions('visual-text-editor.jsx',['visualProjectTextField','visualEditorText','updateVisualEditorText']),ctx);
  const initial={websiteTexts:{},websiteTypography:{en:{title:{size:24}}},projectsPage:{heroTitle:'Projects',heroTitle_gr:'Έργα',showIntro:false}};
  assert.equal(ctx.visualEditorText(initial,'title','gr'),'Αρχικός τίτλος');
  let next=ctx.updateVisualEditorText(initial,'title','gr','Νέος τίτλος\nΔεύτερη γραμμή');
  next=ctx.updateVisualEditorText(next,'title','en','New title');
  assert.equal(ctx.visualEditorText(next,'title','gr'),'Νέος τίτλος\nΔεύτερη γραμμή');
  assert.equal(ctx.visualEditorText(next,'title','en'),'New title');
  next=ctx.updateVisualEditorText(next,'title','gr','');
  assert.equal(ctx.visualEditorText(next,'title','gr'),'');
  next=ctx.updateVisualEditorText(next,'projectsPage.heroTitle','gr','Τα έργα μας');
  next=ctx.updateVisualEditorText(next,'projectsPage.heroTitle','en','Our work');
  assert.equal(ctx.visualEditorText(next,'projectsPage.heroTitle','gr'),'Τα έργα μας');
  assert.equal(ctx.visualEditorText(next,'projectsPage.heroTitle','en'),'Our work');
  assert.equal(next.projectsPage.showIntro,false);
  assert.equal(next.websiteTypography,initial.websiteTypography);
  assert.equal(initial.projectsPage.heroTitle,'Projects');
  assert.deepEqual(initial.websiteTexts,{});
});
test('media API URLs and legacy MP4 URLs are recognised as video', () => {
  const ctx = vm.createContext({URL});
  vm.runInContext(functions('data.jsx',['isVideoSrc']),ctx);
  for (const src of ['/api/media-file?id=123&name=clip.mp4','/assets/clip.MP4?v=2','data:video/mp4;base64,AAAA']) assert.equal(ctx.isVideoSrc(src),true,src);
  for (const src of ['/api/media-file?id=123&name=photo.png','/image.jpg?name=clip.mp4','',null]) assert.equal(ctx.isVideoSrc(src),false,src);
});
test('public site never substitutes local drafts for published content', () => {
  const live = {projects:[{id:'live'}]};
  const bundled = {projects:[{id:'bundled'}]};
  const ctx = vm.createContext({REMOTE_CONTENT:live,LOCAL_EDIT_WINS:true,BUNDLED_CONTENT:bundled,P58_STORE_KEY:'cache',localStorage:{getItem:()=>JSON.stringify({projects:[{id:'draft'}]})},readPreviewProject:()=>null});
  vm.runInContext(functions('data.jsx',['readP58Store']),ctx);
  assert.equal(ctx.readP58Store(),live);
  ctx.REMOTE_CONTENT=null;
  assert.equal(ctx.readP58Store(),bundled);
});
test('an explicit project preview still overlays published content', () => {
  const ctx = vm.createContext({LOCAL_EDIT_WINS:false,REMOTE_CONTENT:{projects:[{id:'live'}]},BUNDLED_CONTENT:{},readPreviewProject:()=>({id:'live',name:'Preview'})});
  vm.runInContext(functions('data.jsx',['readP58Store']),ctx);
  assert.equal(ctx.readP58Store().projects[0].name,'Preview');
});

test('failed drafts survive reload and an old completion cannot clear a newer draft', () => {
  const cache = new Map();
  const storage = {getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)};
  const ctx=vm.createContext({localStorage:storage,STORE_KEY:'content',PENDING_DRAFT_KEY:'pending',normaliseStored:value=>value});
  vm.runInContext('let pendingDraftContent = null;\n'+functions('dashboard.jsx',['rememberPendingDraft','readPendingDraft','acknowledgeDraft']),ctx);
  ctx.rememberPendingDraft({title:'First'});
  ctx.rememberPendingDraft({title:'Second'});
  ctx.acknowledgeDraft({title:'First'});
  assert.equal(ctx.readPendingDraft().title,'Second');
  const reloaded=vm.createContext({localStorage:storage,STORE_KEY:'content',PENDING_DRAFT_KEY:'pending',normaliseStored:value=>value});
  vm.runInContext('let pendingDraftContent = null;\n'+functions('dashboard.jsx',['rememberPendingDraft','readPendingDraft','acknowledgeDraft']),reloaded);
  assert.equal(reloaded.readPendingDraft().title,'Second');
  reloaded.acknowledgeDraft({title:'Second'});
  assert.equal(reloaded.readPendingDraft(),null);
});

test('dashboard navigation keeps editor tools reachable without exposing admin settings', () => {
  const ctx = vm.createContext({});
  vm.runInContext(functions('dashboard.jsx', ['dashboardNavigation']), ctx);
  const admin = ctx.dashboardNavigation(() => true);
  assert.equal(admin.length, 5);
  const ids = admin.flatMap(group => group.sections.map(item => item.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['overview', 'projects', 'texts', 'categories', 'media', 'website-texts', 'hero', 'v2', 'team', 'news', 'inquiries', 'site', 'inquiry-form', 'maintenance']) assert.ok(ids.includes(id), id);
  const editor = ctx.dashboardNavigation(capability => capability === 'heroGallery');
  assert.ok(editor.find(group => group.id === 'website').sections.some(item => item.id === 'hero'));
  assert.ok(editor.flatMap(group => group.sections).every(item => !['site', 'website-texts', 'v2', 'inquiry-form', 'maintenance'].includes(item.id)));
});

test('draft writes stay ordered and recover after a failed autosave', async () => {
  const source = fs.readFileSync('dashboard.jsx', 'utf8');
  const queueCode = source.slice(source.indexOf('let draftSaveQueue'), source.indexOf('\nconst newId'));
  let releaseFirst;
  const writes = [];
  const acknowledged = [];
  const ctx = vm.createContext({
    saveCloudContent: async (data, draft) => {
      assert.equal(draft, true);
      writes.push(data.version);
      if (data.version === 1) await new Promise(resolve => { releaseFirst = resolve; });
      if (data.version === 2) throw new Error('offline');
      return 'saved';
    },
    acknowledgeDraft: data => acknowledged.push(data.version),
  });
  vm.runInContext(queueCode + '\nthis.save = saveDraft;', ctx);
  const first = ctx.save({ version: 1 });
  const second = ctx.save({ version: 2 });
  const failed = assert.rejects(second, /offline/);
  const third = ctx.save({ version: 3 });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(writes, [1]);
  releaseFirst();
  await Promise.all([first, failed, third]);
  assert.deepEqual(writes, [1, 2, 3]);
  assert.deepEqual(acknowledged, [1, 3]);
});

test('home idle hint returns visually without scrolling, uses settings and stops on input', () => {
  let now=0, nextId=0, cancelled=0;
  const timers=new Map(), listeners=new Map(), calls=[];
  const media={matches:false,addEventListener:(name,fn)=>listeners.set('motion',fn),removeEventListener:()=>listeners.delete('motion')};
  const window={scrollY:0,matchMedia:()=>media,getComputedStyle:()=>({overflowY:'auto'}),
    setTimeout:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name),
    scrollBy:()=>assert.fail('must not scroll'),scrollTo:()=>assert.fail('must not scroll')};
  const document={hidden:false,body:{},activeElement:{tagName:'BODY'},querySelector:()=>null,
    addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  const target={animate:(frames,options)=>{calls.push({frames,options});return {cancel:()=>cancelled++};}};
  const hero={clientHeight:924,closest:()=>target};
  const ctx=vm.createContext({window,document,URLSearchParams,location:{search:''}});
  vm.runInContext(functions('pages.jsx',['startHomeIdleScroll']),ctx);
  const tick=ms=>{now+=ms;for(const [id,timer] of [...timers]) if(timer.at<=now){timers.delete(id);timer.fn();}};
  let stop=ctx.startHomeIdleScroll(hero);
  tick(14000);assert.equal(calls.length,0);
  listeners.get('pointermove')();tick(14000);assert.equal(calls.length,0);
  tick(1000);assert.equal(calls.length,1);
  assert.equal(calls[0].frames[0].transform,'translateY(0)');
  assert.match(calls[0].frames[1].transform,/translateY\(-/);
  assert.equal(calls[0].frames[2].transform,'translateY(0)');
  assert.equal(calls[0].options.duration,2400);assert.equal(window.scrollY,0);
  listeners.get('pointerdown')();assert.equal(cancelled,1);tick(30000);assert.equal(calls.length,1);
  stop();assert.equal(timers.size,0);assert.equal(listeners.size,0);
  stop=ctx.startHomeIdleScroll(hero,{idleHintDelay:3000,idleHintDuration:4000});
  tick(2999);assert.equal(calls.length,1);tick(1);assert.equal(calls.length,2);assert.equal(calls[1].options.duration,4000);stop();
  stop=ctx.startHomeIdleScroll(hero);window.scrollY=100;listeners.get('scroll')();window.scrollY=0;tick(20000);assert.equal(calls.length,2);stop();
  stop=ctx.startHomeIdleScroll(hero);document.hidden=true;listeners.get('visibilitychange')();tick(20000);assert.equal(calls.length,2);stop();document.hidden=false;
  assert.equal(ctx.startHomeIdleScroll(hero,{idleHintEnabled:false}),undefined);
  media.matches=true;assert.equal(ctx.startHomeIdleScroll(hero),undefined);assert.equal(timers.size,0);
});

test('draft content is visible only inside the explicit visual-editor iframe',()=>{
  const live={projects:[{id:'live'}]},draft={projects:[{id:'draft'}]};
  const win={P58_VISUAL_CONTENT:draft};
  const ctx=vm.createContext({window:win,parent:win,URLSearchParams,location:{search:'?visualTextEditor=1'},REMOTE_CONTENT:live,BUNDLED_CONTENT:{},readPreviewProject:()=>null});
  vm.runInContext(functions('data.jsx',['readP58Store']),ctx);
  assert.equal(ctx.readP58Store(),live);
  ctx.parent={};
  assert.equal(ctx.readP58Store(),draft);
  ctx.location.search='';
  assert.equal(ctx.readP58Store(),live);
});

test('entrance reveal is limited to the first home visit and respects reduced motion', () => {
  let seen = null, reduced = false;
  const window = {matchMedia: () => ({matches: reduced})};
  const sessionStorage = {getItem: () => seen};
  const ctx = vm.createContext({window, sessionStorage});
  vm.runInContext(functions('app.jsx', ['shouldPlaySiteIntro']), ctx);
  assert.equal(ctx.shouldPlaySiteIntro({name:'home'}), true);
  for (const name of ['project','brand','projects','agency','start']) assert.equal(ctx.shouldPlaySiteIntro({name}), false);
  seen = '1'; assert.equal(ctx.shouldPlaySiteIntro({name:'home'}), false);
  seen = null; reduced = true; assert.equal(ctx.shouldPlaySiteIntro({name:'home'}), false);
  reduced = false; window.p58IntroSeen = true; assert.equal(ctx.shouldPlaySiteIntro({name:'home'}), false);
  window.p58IntroSeen = false; sessionStorage.getItem = () => {throw new Error('blocked storage');};
  assert.equal(ctx.shouldPlaySiteIntro({name:'home'}), true);
});

test('dashboard project filters combine criteria and search both languages without accents', () => {
  const ctx = vm.createContext({});
  vm.runInContext(functions('dashboard.jsx', ['projectSearchText', 'filterDashboardProjects']), ctx);
  const categories = [{ id: 'retail', label: 'Retail', label_gr: 'Λιανική' }];
  const projects = [
    { id: 'a', name: 'Panormou', name_gr: 'Πανόρμου', location: 'Athens', location_gr: 'Αθήνας', code: 'P58-024', brand: ' Garden ', year: 2026, status: 'In design' },
    { id: 'b', name: 'Panormou', brand: 'Dinas', year: 2025, status: 'Completed', visible: false },
    { id: 'c', name: 'House', category: 'removed', year: 2026, visible: true },
  ];
  const ids = filters => Array.from(ctx.filterDashboardProjects(projects, filters, categories), p => p.id);
  assert.deepEqual(ids({ query: 'ΠΑΝΟΡΜΟΥ αθηνασ p58-024', category: 'retail', brand: 'Garden', year: '2026', status: 'In design', visibility: 'visible' }), ['a']);
  assert.deepEqual(ids({ query: 'panormou', visibility: 'hidden' }), ['b']);
  assert.deepEqual(ids({ category: '__uncategorised__', brand: '__none__' }), ['c']);
  assert.deepEqual(ids({ query: 'ανύπαρκτο' }), []);
  assert.deepEqual(ids({}), ['a', 'b', 'c']);
  assert.equal(projects[0].brand, ' Garden ');
});
