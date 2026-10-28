import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const ast = parse(source, {sourceType:'script',plugins:['jsx']});
const ctx = vm.createContext({});
vm.runInContext(ast.program.body.filter(node => node.type === 'FunctionDeclaration' && ['projectGalleryHasMedia','setProjectMediaActive'].includes(node.id.name)).map(node => source.slice(node.start,node.end)).join('\n'), ctx);
const media = {id:'image-one',url:'/api/media-file?id=image-one',projectId:'project-one',kind:'image',caption:'Courtyard'};
const initial = () => ({site:{title:'Keep'},projects:[
  {id:'project-one',hero:'/hero.jpg',gallery:[{src:'/existing.jpg',tag:'Existing',tag_gr:'Υπάρχουσα',span:'gal-12'}]},
  {id:'project-two',gallery:[{src:media.url,tag:'Other project'}]},
]});

test('Active adds a library image to its assigned project once and preserves other content', () => {
  const content = initial();
  const next = ctx.setProjectMediaActive(content,media,true);
  assert.equal(ctx.projectGalleryHasMedia(next.projects[0],media),true);
  assert.equal(next.projects[0].gallery.length,2);
  assert.equal(next.projects[0].gallery[1].tag,'Courtyard');
  assert.equal(next.projects[0].gallery[1].span,'gal-6');
  assert.equal(next.projects[0].gallery[0],content.projects[0].gallery[0]);
  assert.equal(next.projects[1],content.projects[1]);
  assert.equal(next.site,content.site);
  assert.equal(content.projects[0].gallery.length,1);
  assert.equal(ctx.setProjectMediaActive(next,media,true),next);
});

test('Active reflects existing project selections, draft reloads and removal from either view', () => {
  const saved = JSON.parse(JSON.stringify(ctx.setProjectMediaActive(initial(),media,true)));
  assert.equal(ctx.projectGalleryHasMedia(saved.projects[0],media),true);
  const inactive = ctx.setProjectMediaActive(saved,media,false);
  assert.equal(ctx.projectGalleryHasMedia(inactive.projects[0],media),false);
  assert.equal(inactive.projects[0].gallery.length,1);
  assert.equal(inactive.projects[0].hero,'/hero.jpg');
  assert.equal(ctx.projectGalleryHasMedia(inactive.projects[1],media),true);
  assert.equal(ctx.setProjectMediaActive(inactive,media,false),inactive);
  saved.projects[0].gallery = saved.projects[0].gallery.filter(image => image.src !== media.url);
  assert.equal(ctx.projectGalleryHasMedia(saved.projects[0],media),false);
  saved.projects[0].gallery.push({src:media.url,tag:'Edited in project',tag_gr:'Λεζάντα',span:'gal-12'});
  assert.equal(ctx.projectGalleryHasMedia(saved.projects[0],media),true);
  assert.equal(ctx.setProjectMediaActive(saved,media,true),saved);
});

test('activation requires an existing assigned project and image URL; graphics stay separate', () => {
  const content = initial();
  for (const item of [null,{...media,projectId:null},{...media,projectId:'missing'},{...media,url:''},{...media,kind:'logo'},{...media,kind:'icon'}]) {
    assert.equal(ctx.setProjectMediaActive(content,item,true),content);
  }
  const emptyProject = {projects:[{id:'project-one'}]};
  assert.equal(ctx.setProjectMediaActive(emptyProject,media,true).projects[0].gallery.length,1);
});
