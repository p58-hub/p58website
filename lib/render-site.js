import vm from 'node:vm';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { source, template } from '../api/_site-source.js';

const compiled = new vm.Script(source, {filename:'p58-server.js'});
export function renderSite({content, url, siteOrigin, mobile = false, noindex = false}) {
  const location = new URL(url, siteOrigin);
  const stored = new Map();
  const storage = {getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,String(value)),removeItem:key=>stored.delete(key)};
  const classList = {add(){},remove(){},toggle(){}};
  const document = {body:{classList,style:{},dataset:{}},documentElement:{lang:location.pathname.startsWith('/el')?'el':'en',style:{setProperty(){}}},querySelector:()=>null,createElement:()=>({style:{},setAttribute(){}}),head:{appendChild(){}},addEventListener(){},removeEventListener(){}};
  const scope = {
    React:{...React,useLayoutEffect:React.useEffect},ReactDOM:{createPortal:child=>child},
    URL,URLSearchParams,console,location,document,localStorage:storage,sessionStorage:storage,
    navigator:{userAgent:mobile?'Mobile':'Server',language:document.documentElement.lang},
    innerWidth:mobile?390:1440,innerHeight:900,scrollY:0,
    P58_SERVER_RENDER:true,P58_INITIAL_CONTENT:content,P58_SITE_ORIGIN:siteOrigin,
    matchMedia:query=>({matches:query.includes('prefers-reduced-motion') || (query.includes('max-width')&&mobile),addEventListener(){},removeEventListener(){}}),
    addEventListener(){},removeEventListener(){},dispatchEvent(){},
    setTimeout,clearTimeout,setInterval,clearInterval,
  };
  scope.window=scope; scope.parent=scope;
  const context=vm.createContext(scope);
  compiled.runInContext(context,{timeout:5000});
  const route=vm.runInContext('resolveRoute(routeFromLocation())',context);
  const normalized={...content,projects:scope.visibleProjects(),categories:scope.siteCategories()};
  const language=scope.P58SEO.language(location.pathname)||'en';
  const known=['home','projects','architecture','interiors','agency','start','contact','services','brand','project'];
  const bare=scope.P58SEO.stripLocale(location.pathname);
  if(!known.includes(route.name) || (route.name==='home' && bare!=='/')) route.name='notfound';
  const meta=scope.P58SEO.metadata({route,content:normalized,lang:language,siteOrigin});
  scope.P58_NOT_FOUND=meta.missing;
  const html=renderToString(React.createElement(scope.LangProvider,null,React.createElement(scope.P58App)));
  const bootstrap=`<script>window.P58_INITIAL_CONTENT=${scope.P58SEO.json(content)};window.P58_SITE_ORIGIN=${scope.P58SEO.json(siteOrigin)};window.P58_NOT_FOUND=${meta.missing};</script>`;
  const bodyClasses = [route.name==='home'?'hz-at-hero':'',route.name==='home'&&!mobile?'desktop-presentation-home':'',route.name==='project'?'project-page':'',['projects','interiors'].includes(route.name)?'interiors-page':'',route.name==='architecture'?'architecture-page':'',route.name==='contact'?'contact-page-active':'',mobile&&route.name!=='project'?'mobile-tabbar-page':''].filter(Boolean).join(' ');
  return {status:meta.missing?404:200,meta,html:template
    .replace('<body>',`<body class="${bodyClasses}"${route.name==='home'?' data-route="home"':''}>`)
    .replace('<html lang="en">',`<html lang="${meta.lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/,() => scope.P58SEO.head(meta,noindex))
    .replace('<div id="root"></div>',() => `<div id="root">${html}</div>\n${bootstrap}`)};
}
