import { json } from './_auth.js';
import { readJsonBody, requireSession } from './_media.js';

const cache = new Map();
let nextRequestAt = 0;

export function geocodeResults(body) {
  if (!Array.isArray(body?.features)) throw new Error('Invalid geocoder response');
  return body.features.flatMap(feature => {
    const [lng, lat] = feature.geometry?.coordinates || [];
    if (feature.geometry?.type !== 'Point' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return [];
    const p = feature.properties || {};
    const label = [...new Set([p.name, [p.street,p.housenumber].filter(Boolean).join(' '),p.postcode,p.city || p.town || p.village,p.state,p.country].filter(value => typeof value === 'string' && value))].join(', ').slice(0,600);
    return label ? [{label,lat,lng,approximate:!p.housenumber}] : [];
  }).slice(0,5);
}

export default async function handler(req,res) {
  if (!requireSession(req,res)) return;
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return json(res,405,{error:'method_not_allowed'}); }
  const body = await readJsonBody(req,4096);
  const address = typeof body?.address === 'string' ? body.address.trim() : '';
  if (address.length < 5 || address.length > 400) return json(res,400,{message:'Γράψε πλήρη διεύθυνση, από 5 έως 400 χαρακτήρες.'});
  const endpoint = process.env.PHOTON_GEOCODE_URL || 'https://photon.komoot.io/api/';
  const key = endpoint + address.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return json(res,200,{results:cached.results});
  if (Date.now() < nextRequestAt) { res.setHeader('Retry-After','1'); return json(res,429,{message:'Περίμενε ένα δευτερόλεπτο και δοκίμασε ξανά.'}); }
  nextRequestAt = Date.now() + 1000;
  try {
    const url = new URL(endpoint);
    url.searchParams.set('q',address);
    url.searchParams.set('limit','5');
    const response = await fetch(url,{headers:{Accept:'application/json','User-Agent':'Project58 address lookup (https://p58website.vercel.app)'},signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Geocoder unavailable');
    const results = geocodeResults(await response.json());
    if (cache.size >= 100) cache.delete(cache.keys().next().value);
    cache.set(key,{results,expires:Date.now()+86400000});
    return json(res,200,{results});
  } catch {
    return json(res,502,{message:'Η αναζήτηση διεύθυνσης δεν είναι διαθέσιμη τώρα. Δοκίμασε ξανά.'});
  }
}
