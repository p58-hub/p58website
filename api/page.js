import { readDocument } from './_firebase.js';
import { renderSite } from '../lib/render-site.js';
import '../seo.js';

const seo = globalThis.P58SEO;
export default async function handler(req, res) {
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Allow','GET, HEAD');res.statusCode=405;return res.end(); }
  const requestURL = new URL(req.url,'https://p58website.vercel.app');
  const siteOrigin=seo.origin(process.env.SITE_URL);
  const output=requestURL.searchParams.get('document');
  if(output==='robots') {
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    return res.end(req.method==='HEAD'?'':'User-agent: *\nAllow: /\nAllow: /api/media-file\nAllow: /api/content\nDisallow: /api/\nDisallow: /dashboard\nDisallow: /card/settings\nDisallow: /login\nDisallow: /walkthrough/\n\nSitemap: '+siteOrigin+'/sitemap.xml\n');
  }
  try {
    // Read only the authoritative published snapshot. Never serve drafts or bundled demo content.
    const saved=await readDocument('content/site.json');
    if(!saved?.content) throw new Error('Published content unavailable');
    if(output==='sitemap') {
      res.setHeader('Content-Type','application/xml; charset=utf-8');
      res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
      return res.end(req.method==='HEAD'?'':seo.sitemap(saved.content,siteOrigin));
    }
    const path=requestURL.searchParams.get('path') || requestURL.pathname;
    const url=new URL(path,siteOrigin);
    // Keep preview parameters available for the editor but never cache or index previews.
    for(const [key,value] of requestURL.searchParams) if(!['path','document'].includes(key)) url.searchParams.set(key,value);
    const noindex=['preview','textPreview','visualTextEditor'].some(key=>url.searchParams.has(key));
    const result=renderSite({content:saved.content,url:url.href,siteOrigin,mobile:/Mobile|Android|iPhone/i.test(req.headers['user-agent']||''),noindex});
    res.statusCode=result.status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    if(result.meta.missing||noindex) res.setHeader('X-Robots-Tag','noindex, follow');
    res.end(req.method==='HEAD'?'':result.html);
  } catch(error) {
    console.error('Public page unavailable:',error.message);
    res.statusCode=503;
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Retry-After','60');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end('<!doctype html><html lang="en"><meta name="robots" content="noindex"><title>Project58 — Temporarily unavailable</title><body><h1>We will be back shortly.</h1><p>Please try again in a moment.</p></body></html>');
  }
}
