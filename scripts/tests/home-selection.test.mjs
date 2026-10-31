import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
function declarations(file, names) {
  const source = fs.readFileSync(file, 'utf8');
  return parse(source, {sourceType:'script',plugins:['jsx']}).program.body
    .filter(node => names.includes(node.id?.name) || node.declarations?.some(item => names.includes(item.id.name)))
    .map(node => source.slice(node.start,node.end)).join('\n');
}
const context = vm.createContext({window:{}});
vm.runInContext(declarations('data.jsx',['HOME_SELECTED_MAX','homeSelectedProjects','isProjectVisible']) + '\nObject.assign(window,{HOME_SELECTED_MAX,homeSelectedProjects});',context);
vm.runInContext(declarations('dashboard.jsx',['applyHomeSelection','projectPublishPayload']),context);
const ids = content => Array.from(context.homeSelectedProjects(content.projects, content.site), project => project.id);
const fixture = () => ({projects:['a','b','c','d','e','f'].map(id=>({id,name:id,hero:`${id}.jpg`,featured:true,visible:true})),site:{heroGallery:{order:['b','a','d','c','e','f']},unrelated:'live'}});

test('legacy selection keeps the actual first four visible hero picks in their original order',()=>{
  const content=fixture();
  assert.deepEqual(ids(content),['b','a','d','c']);
  content.projects[1].visible=false;
  assert.deepEqual(ids(content),['a','d','c','e']);
});
test('full selection requires an explicit existing replacement and never mutates content while pending/cancelled',()=>{
  const content=fixture(), original=JSON.stringify(content), incoming=content.projects[4];
  assert.equal(context.applyHomeSelection(content,incoming,true),content);
  assert.equal(context.applyHomeSelection(content,incoming,true,'missing'),content);
  assert.equal(JSON.stringify(content),original);
});
test('replacement takes the selected slot, keeps all projects and leaves the hero untouched',()=>{
  const content=fixture(), original=JSON.stringify(content);
  const next=context.applyHomeSelection(content,content.projects[4],true,'a');
  assert.deepEqual(ids(next),['b','e','d','c']);
  assert.equal(next.projects.length,6);
  assert.ok(next.projects.every(project=>project.featured));
  assert.equal(next.site.heroGallery,content.site.heroGallery);
  assert.equal(JSON.stringify(content),original);
  assert.deepEqual(ids(JSON.parse(JSON.stringify(next))),['b','e','d','c']);
});
test('removal leaves a free slot, adding fills it, and explicitly empty selection never falls back',()=>{
  let content=fixture();
  content=context.applyHomeSelection(content,content.projects[0],false);
  assert.deepEqual(ids(content),['b','d','c']);
  content=context.applyHomeSelection(content,content.projects[4],true);
  assert.deepEqual(ids(content),['b','d','c','e']);
  for(const id of ids(content)) content=context.applyHomeSelection(content,content.projects.find(p=>p.id===id),false);
  assert.deepEqual(ids(JSON.parse(JSON.stringify(content))),[]);
});
test('explicit cards are independent of later hero selection and ignore duplicate, missing and hidden projects',()=>{
  const content=fixture();
  content.site.homeSelected={order:['a','a','missing','b','c','d','e','f']};
  content.projects[1].visible=false;
  content.projects.forEach(project=>{project.featured=false;});
  content.site.heroGallery.order.reverse();
  assert.deepEqual(ids(content),['a','c','d','e']);
  assert.equal(context.applyHomeSelection(content,content.projects[1],true,'a'),content);
});
test('publishing a replacement carries the selection atomically without publishing unrelated drafts',()=>{
  const live=fixture();
  const draft=context.applyHomeSelection(live,{...live.projects[4],name:'New title'},true,'a');
  draft.site.unrelated='draft only';
  draft.projects=draft.projects.map(project=>project.id==='f'?{...project,name:'Unpublished'}:project);
  const published=context.projectPublishPayload(live,draft,draft.projects[4]);
  assert.deepEqual(ids(published),['b','e','d','c']);
  assert.equal(published.projects.find(p=>p.id==='e').name,'New title');
  assert.equal(published.projects.find(p=>p.id==='f').name,'f');
  assert.equal(published.site.unrelated,'live');
  assert.equal(published.site.heroGallery,live.site.heroGallery);
});
test('publishing an unrelated project leaves a pending home replacement unpublished',()=>{
  const live=fixture(),draft=context.applyHomeSelection(live,live.projects[4],true,'a');
  const published=context.projectPublishPayload(live,draft,{...draft.projects[5],name:'Published title'});
  assert.deepEqual(ids(published),['b','a','d','c']);
  assert.equal(published.projects[5].name,'Published title');
});
test('a brand new replacement is included when publishing the displaced project',()=>{
  const live=fixture();
  const draft=context.applyHomeSelection(live,{id:'new',name:'New',visible:true},true,'a');
  const published=context.projectPublishPayload(live,draft,draft.projects.find(p=>p.id==='a'));
  assert.deepEqual(ids(published),['b','new','d','c']);
  assert.equal(published.projects.length,7);
});
test('publishing from a displaced card makes its replacement visible without leaking other edits',()=>{
  const live=fixture(); live.projects[4].visible=false;
  const draft=context.applyHomeSelection(live,{...live.projects[4],visible:true,name:'Unpublished title'},true,'a');
  const published=context.projectPublishPayload(live,draft,draft.projects[0]);
  assert.deepEqual(ids(published),['b','e','d','c']);
  assert.equal(published.projects[4].visible,true);
  assert.equal(published.projects[4].name,'e');
});
