import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSite} from '../../lib/render-site.js';
import '../../seo.js';
const seo=globalThis.P58SEO;
const siteOrigin='https://p58website.vercel.app';
const content={projects:[
  {id:'one',slug:'public-space',name:'Public Space',name_gr:'Δημόσιος χώρος',brand:'Example',typology:'retail',summary:'A published description.',summary_gr:'Μια δημοσιευμένη περιγραφή.',hero:'/assets/example.jpg',gallery:[],visible:true,featured:true},
  {id:'two',slug:'second-space',name:'Second Space',brand:'Example',typology:'retail',hero:'/assets/second.jpg',gallery:[],visible:true},
  {id:'hidden',slug:'hidden-space',name:'Unpublished secret',visible:false,hero:'/assets/hidden.jpg'},
],categories:[{id:'retail',label:'Retail',label_gr:'Λιανική',subcategories:[{id:'example',label:'Example'}]}],team:[],news:[],site:{homeV2:{enabled:false},contact:{phone:'+30 123',email:'studio@example.test'},websiteTexts:{en:{home_hero_title:'Designing a world of possibilities.'}}}};

test('metadata localizes project copy and keeps a stable origin and canonical without filters',()=>{
  const meta=seo.metadata({route:{name:'project',id:'one',sort:'region'},content,lang:'gr',siteOrigin});
  assert.match(meta.title,/Δημόσιος χώρος/);
  assert.equal(meta.description,'Μια δημοσιευμένη περιγραφή.');
  assert.equal(meta.canonical,siteOrigin+'/el/projects/public-space');
  assert.equal(meta.alternatives.en,siteOrigin+'/en/projects/public-space');
  assert.equal(seo.metadata({route:{name:'projects',sort:'region',type:'retail'},content,siteOrigin}).canonical,siteOrigin+'/en/projects');
});
test('sitemap contains both language versions and published collections but excludes hidden projects',()=>{
  const xml=seo.sitemap(content,siteOrigin);
  assert.match(xml,/<loc>https:\/\/p58website.vercel.app\/el\/projects\/public-space<\/loc>/);
  assert.match(xml,/\/en\/projects\/brands\/example/);
  assert.match(xml,/hreflang="el"/);
  assert.doesNotMatch(xml,/hidden-space|dashboard|card\/settings|draft/);
  assert.equal((xml.match(/<loc>/g)||[]).length,22);
});
test('server HTML includes the actual page copy, localized SEO and one H1 without running browser JavaScript',()=>{
  for(const path of ['/en/','/el/projects','/en/services','/el/people','/en/contact','/el/start-a-project','/en/projects/public-space','/el/projects/brands/example']) {
    const result=renderSite({content,url:siteOrigin+path,siteOrigin});
    assert.equal(result.status,200,path);
    const root=result.html.split('<div id="root">')[1].split('<script>window.P58_INITIAL_CONTENT=')[0];
    assert.equal((root.match(/<h1\b/g)||[]).length,1,path);
    assert.match(result.html,/rel="canonical"/);
    assert.match(result.html,/application\/ld\+json/);
    assert.doesNotMatch(result.html,/@babel\/standalone|type="text\/babel"/);
    assert.match(result.html,/site\.bundle\.js\?v=/);
  }
});
test('hero preserves exactly three explicit English lines in server HTML',()=>{
  const {html}=renderSite({content,url:siteOrigin+'/en/',siteOrigin});
  assert.equal((html.match(/class="home-hero-line"/g)||[]).length,3);
  assert.match(html,/home-hero-title--three-lines/);
});
test('missing and unpublished pages respond with 404 and noindex instead of a successful fallback page',()=>{
  for(const path of ['/en/projects/hidden-space','/el/projects/missing','/en/projects/brands/missing','/en/unknown']) {
    const result=renderSite({content,url:siteOrigin+path,siteOrigin});
    assert.equal(result.status,404,path);
    assert.match(result.html,/name="robots" content="noindex, follow"/);
    assert.match(result.html, /Page not found|Η σελίδα δεν βρέθηκε/);
  }
});
test('editor previews are noindex and an empty published portfolio does not resurrect demo projects',()=>{
  const empty={...content,projects:[]};
  const result=renderSite({content:empty,url:siteOrigin+'/en/projects?preview=test',siteOrigin,noindex:true});
  assert.match(result.html,/name="robots" content="noindex, follow"/);
  const body=result.html.split('<script>window.P58_INITIAL_CONTENT=')[0];
  assert.doesNotMatch(body,/pg-panormou|panormou-athens|Unpublished secret/);
  assert.equal(seo.sitemap(empty,siteOrigin).includes('projects/public-space'),false);
});
test('HTML and bootstrap data escape malicious text and preserve replacement-dollar characters literally',()=>{
  const unsafe={...content,projects:[{...content.projects[0],name:'$& </script><script>alert(1)</script>',summary:'A "quoted" <img src=x onerror=alert(1)> description'}]};
  const result=renderSite({content:unsafe,url:siteOrigin+'/en/projects/public-space',siteOrigin});
  assert.doesNotMatch(result.html,/<script>alert\(1\)<\/script>|<img src=x onerror/);
  assert.match(result.html,/\\u003c\/script>/);
  assert.match(result.html,/\$&amp;/);
});
