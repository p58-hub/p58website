import test from 'node:test';
import assert from 'node:assert/strict';
let published={content:{projects:[],categories:[],team:[],site:{}}};
let fail=false,paths=[];
test.mock.module('../../api/_firebase.js',{namedExports:{readDocument:async path=>{paths.push(path);if(fail)throw new Error('offline');return published;}}});
const {default:handler}=await import('../../api/page.js');
function response(){return {statusCode:200,headers:{},setHeader(name,value){this.headers[name]=value;},end(body=''){this.body=body;}};}
test('public page reads published data only, including requests with a draft parameter',async()=>{
 paths=[];const res=response();await handler({method:'GET',url:'/api/page?path=/el/services&draft=1',headers:{}},res);
 assert.equal(res.statusCode,200);assert.deepEqual(paths,['content/site.json']);assert.match(res.body,/<html lang="el">/);assert.match(res.body,/Αρχιτεκτονική για κατοικίες/);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('robots and sitemap advertise the canonical origin and never need account access',async()=>{
 const robots=response();await handler({method:'GET',url:'/api/page?document=robots',headers:{}},robots);
 assert.match(robots.body,/Sitemap: https:\/\/p58website.vercel.app\/sitemap.xml/);
 assert.match(robots.body,/Allow: \/api\/media-file/);
 const xml=response();await handler({method:'GET',url:'/api/page?document=sitemap',headers:{}},xml);
 assert.equal(xml.statusCode,200);assert.match(xml.headers['Content-Type'],/application\/xml/);assert.doesNotMatch(xml.body,/draft|dashboard/);
});
test('HEAD returns status and metadata headers without a page body',async()=>{
 const res=response();await handler({method:'HEAD',url:'/api/page?path=/en/contact',headers:{}},res);assert.equal(res.statusCode,200);assert.equal(res.body,'');
});
test('preview pages are not indexed and unsupported mutations are rejected',async()=>{
 const res=response();await handler({method:'GET',url:'/api/page?path=/en/projects&visualTextEditor=1',headers:{}},res);assert.equal(res.headers['X-Robots-Tag'],'noindex, follow');
 const mutation=response();await handler({method:'PUT',url:'/api/page?path=/en',headers:{}},mutation);assert.equal(mutation.statusCode,405);
});
test('content outages return a retryable 503 rather than indexing demo content',async()=>{
 fail=true;try {const res=response();await handler({method:'GET',url:'/api/page?path=/en/',headers:{}},res);assert.equal(res.statusCode,503);assert.equal(res.headers['Retry-After'],'60');assert.doesNotMatch(res.body,/Panormou|Protein Garden/);}finally{fail=false;}
});
