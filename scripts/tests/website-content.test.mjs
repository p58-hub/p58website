import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parse} from '@babel/parser';
const source=fs.readFileSync('data.jsx','utf8');
const declarations=parse(source,{sourceType:'script',plugins:['jsx']}).program.body.filter(node=>
  node.type==='FunctionDeclaration' ? node.id.name!=='Ph' : node.type==='VariableDeclaration' && !node.declarations.some(d=>['BUNDLED_CONTENT','P58_CONTENT_READY'].includes(d.id.name))
).map(node=>source.slice(node.start,node.end)).join('\n');
const ctx=vm.createContext({window:{},URL,URLSearchParams});
vm.runInContext(declarations+'\nObject.assign(window,{normaliseSiteSettings,normaliseCategories,brandConceptCopy,brandStorySections,brandStoryIntro,projectCategoryId});',ctx);
vm.runInContext(fs.readFileSync('website-content.js','utf8'),ctx);
const {siteContentKey:key,visualContentCatalogue:catalogue,applyVisualContentEdits:apply}=ctx.window;
const input=()=>({projects:[{id:'one',slug:'same',brand:'Protein Garden',category:'retail',name:'First',name_gr:'Πρώτο',status:'Completed',gallery:[{src:'image.jpg',tag:'Front'}]},{id:'two',slug:'same',brand:'Protein Garden',category:'retail',name:'Second'}],team:[{_id:'person',name:'Name',note:'Bio'}],news:[],categories:[{id:'retail',label:'Retail',subcategories:[{id:'protein-garden',label:'Protein Garden'}]}],site:{contact:{address:'Address',address_gr:'Διεύθυνση'}}});
test('canonical bilingual edits preserve unrelated values and round-trip through normalization',()=>{
 const original=input();
 const edits={
  [key('project','one','name')]:{en:'New',gr:'Νέο'},
  [key('gallery','one/0','tag')]:{gr:'Πρόσοψη'},
  [key('team','person','note')]:{en:'Updated biography',gr:'Βιογραφικό'},
  [key('contact','footer','address')]:{gr:'Νέα διεύθυνση'},
  [key('question','location','placeholder')]:{en:'Area',gr:'Περιοχή'},
  [key('option','type','0')]:{en:'Shops',gr:'Καταστήματα'}
 };
 const next=apply(original,edits);
 assert.equal(original.projects[0].name,'First');
 assert.equal(next.projects[0].name,'New');assert.equal(next.projects[0].name_gr,'Νέο');
 assert.equal(next.projects[1].name,'Second');assert.equal(next.projects[0].gallery[0].src,'image.jpg');
 assert.equal(next.projects[0].gallery[0].tag_gr,'Πρόσοψη');assert.equal(next.team[0].note_gr,'Βιογραφικό');
 assert.equal(next.site.contact.address,'Address');assert.equal(next.site.contact.address_gr,'Νέα διεύθυνση');
 const fields=catalogue(next).fields;
 for(const [k,value] of Object.entries(edits))for(const lang of Object.keys(value))assert.equal(fields.find(f=>f.key===k)[lang],value[lang],`${k} ${lang}`);
 assert.equal(fields.find(f=>f.key===key('project','one','name')).route,'project/one');
 assert.equal(fields.find(f=>f.key===key('project','two','name')).route,'project/two');
});
test('editing default story sections materializes them without changing other brand settings',()=>{
 const original=input();
 const fields=catalogue(original).fields;
 const section=fields.find(f=>f.key.startsWith('content:section:')&&f.key.endsWith(':title'));
 const next=apply(original,{[section.key]:{gr:'Νέα ενότητα'}});
 assert.equal(next.categories[0].subcategories[0].brandSections[0].title_gr,'Νέα ενότητα');
 assert.equal(original.categories[0].subcategories[0].brandSections,undefined);
 assert.equal(apply(original,{}).categories[0].subcategories[0].brandSections,null);
 assert.equal(catalogue(next).fields.find(f=>f.key===section.key).gr,'Νέα ενότητα');
});
test('brand rename preserves linked projects and translated name',()=>{
 const next=apply(input(),{[key('brand','protein-garden','label')]:{en:'Garden',gr:'Κήπος'}});
 assert.ok(next.projects.every(p=>p.brand==='Garden'));
 assert.equal(catalogue(next).fields.find(f=>f.key===key('brand','protein-garden','label')).gr,'Κήπος');
});
test('stable IDs survive reordered records; unknown paths and non-string edits are ignored',()=>{
 const original=input();original.projects.reverse();
 const next=apply(original,{[key('project','one','name')]:{en:'Right record',gr:123},'content:project:one:__proto__':{en:'bad'},'__proto__.polluted':{en:'bad'}});
 assert.equal(next.projects[1].name,'Right record');assert.equal(next.projects[1].name_gr,'Πρώτο');assert.equal(next.projects[0].name,'Second');assert.equal({}.polluted,undefined);
});

test('presentation title edits use their own fields without renaming the brand or linked projects',()=>{
 const original=input();
 const next=apply(original,{[key('brand','protein-garden','brandStoryTitle')]:{en:'Our spaces',gr:'Οι χώροι μας'},[key('brand','protein-garden','brandStorySubtitle')]:{en:'Made to grow'}});
 const brand=next.categories[0].subcategories[0];
 assert.equal(brand.label,'Protein Garden');
 assert.equal(brand.brandStoryTitle,'Our spaces');
 assert.equal(brand.brandStoryTitle_gr,'Οι χώροι μας');
 assert.equal(brand.brandStorySubtitle,'Made to grow');
 assert.ok(next.projects.every(project=>project.brand==='Protein Garden'));
 assert.equal(catalogue(next).fields.find(field=>field.key===key('brand','protein-garden','brandStoryTitle')).en,'Our spaces');
});
