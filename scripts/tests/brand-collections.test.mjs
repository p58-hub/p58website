import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parse} from '@babel/parser';
function declarations(file,names) {
  const source=fs.readFileSync(file,'utf8');
  return parse(source,{sourceType:'script',plugins:['jsx']}).program.body.filter(node=>node.type==='FunctionDeclaration' && names.includes(node.id.name)).map(node=>source.slice(node.start,node.end)).join('\n');
}
const context=vm.createContext({encodeURIComponent,URLSearchParams,ALIAS:{},ROUTES:['home','projects'],BRAND_MAP_AREAS:[],BRAND_STORIES:{},URL,window:{}});
vm.runInContext(declarations('data.jsx',['normaliseBrandSections','normaliseBrandInstagram','normaliseBrandPresentation','brandConceptCopy','brandStorySections','brandStoryImages','brandStoryIntro'])+'\nwindow.normaliseBrandPresentation=normaliseBrandPresentation;',context);
vm.runInContext(declarations('brand-pages.jsx',['projectCollectionEntries','brandProjectPoint','brandMapColorMatrix'])+'\n'+declarations('app.jsx',['pathFromRoute','routeFromLocation','resolveRoute']),context);
const retail={id:'retail',subcategories:[{id:'protein-garden',label:'Protein Garden'}]};
test('retail chains appear once; independent and hidden projects stay separate',()=>{
 const projects=[{id:'a',brand:'Protein Garden'},{id:'b',brand:'Protein Garden'},{id:'c',brand:'Independent'},{id:'d',brand:'Other',visible:false},{id:'e'}];
 const entries=context.projectCollectionEntries(projects,retail);
 assert.equal(entries.length,3);
 assert.equal(entries[0].kind,'brand');
 assert.equal(entries[0].id,'protein-garden');
 assert.equal(entries[0].projects.length,2);
 assert.equal(entries[1].project.id,'c');
 assert.equal(entries[2].project.id,'e');
 assert.equal(projects.length,5);
});
test('other categories retain separate projects and new retail chains get distinct routes',()=>{
 const projects=[{id:'a',brand:'New Brand'},{id:'b',brand:'New Brand'}];
 assert.equal(context.projectCollectionEntries(projects,{id:'residential'}).length,2);
 const brand=context.projectCollectionEntries(projects,retail)[0];
 const url=context.pathFromRoute({name:'brand',id:brand.id});
 context.location={pathname:url,search:'',hash:''};
 assert.equal(context.routeFromLocation().id,brand.id);
 assert.equal(context.routeFromLocation().name,'brand');
});
test('brand direct links are distinct from individual project links',()=>{
 context.location={pathname:'/projects/brands/protein-garden',search:'',hash:''};
 assert.equal(context.routeFromLocation().name,'brand');
 context.location.pathname='/projects/pg-panormou';
 assert.equal(context.routeFromLocation().name,'project');
 assert.equal(context.resolveRoute({name:'projects',type:'retail',brand:'dn'}).id,'dinas');
});
test('map accepts real coordinates and never coerces missing or invalid data to a location',()=>{
 assert.equal(context.brandProjectPoint({coordinates:{lat:null,lng:null}}),null);
 assert.equal(context.brandProjectPoint({coordinates:{lat:91,lng:23}}),null);
 assert.equal(context.brandProjectPoint({coordinates:{lat:NaN,lng:23}}),null);
 assert.equal(context.brandProjectPoint({location:'Unknown'}),null);
 assert.equal(context.brandProjectPoint({coordinates:{lat:38,lng:23}}).approximate,false);
});

test('address markers use saved geocoding and suppress stale or unconfirmed positions',()=>{
 const project={address:'Ακαδημίας 76, Αθήνα',coordinates:{lat:37.98,lng:23.73,address:'Ακαδημίας 76, Αθήνα',approximate:false}};
 assert.equal(context.brandProjectPoint(JSON.parse(JSON.stringify(project))).approximate,false);
 assert.equal(context.brandProjectPoint({...project,coordinates:{...project.coordinates,approximate:true}}).approximate,true);
 assert.equal(context.brandProjectPoint({...project,address:'Different street'}),null);
 assert.equal(context.brandProjectPoint({...project,coordinates:null}),null);
 assert.equal(context.brandProjectPoint({...project,coordinates:{lat:37.98,lng:23.73}}),null);
});

test('brand settings survive both dashboard and public category normalisation', () => {
 const getDeclaration = (file, name) => {
   const source=fs.readFileSync(file,'utf8');
   return parse(source,{sourceType:'script',plugins:['jsx']}).program.body.filter(node=>node.type==='VariableDeclaration' && node.declarations.some(d=>d.id.name===name)).map(node=>source.slice(node.start,node.end)).join('\n');
 };
 vm.runInContext('const slugifyId = value => value; const slugifyCategoryId = value => value; const newId = () => "new";\n'+getDeclaration('dashboard.jsx','normaliseSubcategories')+'\n'+getDeclaration('data.jsx','normaliseCategorySubs'),context);
 const source={id:'dinas',label:'Dinas',brandStoreCount:23,brandStoreCountSize:20,instagram:'@dinas_test',mapColor:'#123456',mapBackground:'#abcdef',mapAccent:'#fedcba',brandDescription:'Description',brandDescription_gr:'Περιγραφή',brandConcept:'Concept',brandConcept_gr:'Ιδέα',brandCover:'assets/cover.png',brandLogo:'assets/brand-logo.svg'};
 context.source=source;
 const result=vm.runInContext('normaliseCategorySubs(normaliseSubcategories([source]))[0]',context);
 for(const key of ['brandStoreCount','brandStoreCountSize','mapColor','mapBackground','mapAccent','brandCover','brandLogo','brandDescription','brandDescription_gr','brandConcept','brandConcept_gr']) assert.equal(result[key],source[key]);
 assert.equal(result.instagram,'https://www.instagram.com/dinas_test/');
});
test('Instagram profile links and palette values reject unsafe inputs',()=>{
 for(const input of ['javascript:alert(1)','https://instagram.com.evil.com/name','https://user:pass@instagram.com/name','https://instagram.com/p/post/']) assert.equal(context.normaliseBrandInstagram(input),'');
 assert.equal(context.normaliseBrandInstagram('https://instagram.com/example/?utm_source=site'),'https://www.instagram.com/example/');
 assert.equal(context.normaliseBrandPresentation({id:'dinas',mapColor:'url(evil)'}).mapColor,'#253b91');
 assert.equal(context.normaliseBrandPresentation({}).instagram,'');
});

test('map tint maps black and white to the configured brand palette',()=>{
 const values=context.brandMapColorMatrix('#254f3d','#dce7d6').split(' ').map(Number);
 assert.equal(values.length,20);
 for(let channel=0;channel<3;channel++) {
  const offset=channel*5;
  const expectedDark=[37,79,61][channel]/255;
  const expectedLight=[220,231,214][channel]/255;
  assert.ok(Math.abs(values[offset+4]-expectedDark)<1e-10);
  assert.ok(Math.abs(values[offset]+values[offset+1]+values[offset+2]+values[offset+4]-expectedLight)<1e-10);
 }
});

test('brand store counts preserve manual totals and allow automatic fallback', () => {
 for (const value of [undefined, null, '', '  ', -1, 1.5, 'invalid', true, Infinity]) {
  assert.equal(context.normaliseBrandPresentation({brandStoreCount:value}).brandStoreCount, null);
 }
 for (const value of [0, 1, 23, '23']) {
  assert.equal(context.normaliseBrandPresentation({brandStoreCount:value}).brandStoreCount, Number(value));
 }
 const category = {id:'retail',subcategories:[{id:'example',label:'Example',brandStoreCount:23}]};
 const entry = context.projectCollectionEntries([{id:'one',brand:'Example'},{id:'two',brand:'Example'}], category)[0];
 assert.equal(entry.brandStoreCount,23);
 assert.equal(entry.projects.length,2);
});

test('store label size defaults safely and retains supported dashboard sizes', () => {
 for (const value of [undefined, null, '', 0, 11, 29, 'bad', 18.5]) {
  assert.equal(context.normaliseBrandPresentation({brandStoreCountSize:value}).brandStoreCountSize,18);
 }
 for (const value of [12, 18, 22, 28, '20']) {
  assert.equal(context.normaliseBrandPresentation({brandStoreCountSize:value}).brandStoreCountSize,Number(value));
 }
});

test('brand sections survive dashboard save/public load with bilingual content and order', () => {
 context.source={id:'dinas',label:'Dinas',brandSections:[
  {id:'one',type:'gallery',title:'Materials',title_gr:'Υλικά',images:[{src:'assets/one.svg',caption:'Oak',caption_gr:'Δρυς'},{src:'assets/two.png',caption:'Steel'}]},
  {id:'two',type:'image-text',title:'Counter',text:'English',text_gr:'Ελληνικά',imageSide:'right',images:[{src:'assets/counter.png'}]},
  {id:'three',type:'text',title:'Details',text:'Line one\n\nLine two'},
 ]};
 const result=vm.runInContext('normaliseCategorySubs(normaliseSubcategories([source]))[0]',context);
 const sections=context.brandStorySections(result,[]);
 assert.deepEqual(Array.from(sections,s=>s.id),['one','two','three']);
 assert.equal(sections[0].images[0].caption_gr,'Δρυς');
 assert.equal(sections[0].images[1].src,'assets/two.png');
 assert.equal(sections[1].imageSide,'right');
 assert.equal(sections[1].text_gr,'Ελληνικά');
 assert.equal(sections[2].text,'Line one\n\nLine two');
});
test('unset sections preserve defaults; deliberately empty sections stay empty', () => {
 const projects=[{name:'Shop',hero:'hero.png',gallery:[{src:'detail.png',tag:'Detail'}]}];
 const brand={id:'protein-garden',brandDescription:'Overview',brandConcept:'Concept'};
 assert.equal(context.brandStorySections(brand,projects)[0].text,'Overview\n\nConcept');
 assert.equal(context.brandStorySections(brand,projects)[1].images[0].src,'detail.png');
 const custom=context.normaliseBrandPresentation({...brand,brandSections:[]});
 assert.equal(context.brandStorySections(custom,projects).length,0);
 assert.equal(context.brandStoryImages(projects)[0].src,'hero.png');
});
test('section normalisation rejects unknown layouts and repairs duplicate IDs without mutating input', () => {
 const source=[null,{type:'unsafe'}, {id:'same',type:'text',text:{invalid:true}}, {id:'same',type:'gallery',images:[null,{src:'x.png'}]}];
 const result=context.normaliseBrandSections(source);
 assert.equal(result.length,2);
 assert.notEqual(result[0].id,result[1].id);
 assert.equal(result[0].text,'');
 assert.equal(source[3].id,'same');
 assert.equal(result[1].images.length,1);
});

test('presentation intro edits survive save/reload independently of brand identity and projects', () => {
 const projects=[{name:'Shop',hero:'original.jpg'}];
 context.source={id:'garden',label:'Garden',brandStoryTitle:'New story',brandStoryTitle_gr:'Νέα ιστορία',brandStorySubtitle:'New subtitle',brandStorySubtitle_gr:'Νέος υπότιτλος',brandStoryImage:'custom.jpg'};
 const saved=vm.runInContext('normaliseCategorySubs(normaliseSubcategories([JSON.parse(JSON.stringify(source))]))[0]',context);
 const intro=context.brandStoryIntro(saved,projects);
 assert.equal(intro.title,'New story');
 assert.equal(intro.title_gr,'Νέα ιστορία');
 assert.equal(intro.subtitle,'New subtitle');
 assert.equal(intro.subtitle_gr,'Νέος υπότιτλος');
 assert.equal(intro.image.src,'custom.jpg');
 assert.equal(saved.label,'Garden');
 assert.equal(projects[0].hero,'original.jpg');
});
test('intro defaults, translation fallback, empty values and reset remain distinct', () => {
 const brand={label:'Garden',label_gr:'Κήπος'};
 const projects=[{name:'Shop',hero:'original.jpg'}];
 const resolve=patch=>context.brandStoryIntro({...brand,...context.normaliseBrandPresentation(patch)},projects);
 assert.equal(resolve({}).title,'Garden');
 assert.equal(resolve({}).title_gr,'Κήπος');
 assert.equal(resolve({}).image.src,'original.jpg');
 assert.equal(resolve({}).subtitle,'A shared design language.');
 assert.equal(resolve({brandStoryTitle:'Custom'}).title_gr,'Custom');
 assert.equal(resolve({brandStorySubtitle:'Custom'}).subtitle_gr,'Custom');
 assert.equal(resolve({brandStoryTitle:'',brandStorySubtitle:'',brandStoryImage:''}).title,'');
 assert.equal(resolve({brandStorySubtitle:''}).subtitle,'');
 assert.equal(resolve({brandStoryImage:''}).image.src,'');
 assert.equal(resolve({brandStoryImage:null}).image.src,'original.jpg');
 assert.equal(resolve({brandStoryTitle:42}).title,'Garden');
 assert.equal(context.brandStoryIntro(brand,[]).image,undefined);
});

test('applying the presentation transfers both intro edits and sections into the subcategory draft', () => {
 const source=fs.readFileSync('dashboard.jsx','utf8');
 const ast=parse(source,{sourceType:'script',plugins:['jsx']});
 let apply;
 const visit=node=>{
  if(!node || typeof node!=='object')return;
  if(node.type==='JSXOpeningElement' && node.name.name==='BrandPresentationEditor')apply=node.attributes.find(attribute=>attribute.name?.name==='onApply').value.expression;
  for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value && typeof value==='object')visit(value);
 };
 visit(ast);
 assert.ok(apply);
 let draft={id:'garden',label:'Garden',icon:'logo.svg'};
 let closed=false;
 const ctx=vm.createContext({window:{normaliseBrandPresentation:context.normaliseBrandPresentation},setDraft:update=>{draft=update(draft);},closePresentation:()=>{closed=true;}});
 const onApply=vm.runInContext(`(${source.slice(apply.start,apply.end)})`,ctx);
 onApply({...draft,brandStoryTitle:'Edited title',brandStorySubtitle_gr:'Υπότιτλος',brandStoryImage:'new.jpg',brandSections:[{id:'one',type:'text',text:'Body'}]});
 assert.equal(draft.brandStoryTitle,'Edited title');
 assert.equal(draft.brandStorySubtitle_gr,'Υπότιτλος');
 assert.equal(draft.brandStoryImage,'new.jpg');
 assert.equal(draft.brandSections[0].text,'Body');
 assert.equal(draft.label,'Garden');
 assert.equal(draft.icon,'logo.svg');
 assert.equal(closed,true);
});
