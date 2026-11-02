// Project58 cartography. All visual choices live here; no hosted style or API key.
// OpenFreeMap supplies OpenMapTiles vector data and the Noto font glyphs.
const P58_MAP_COLORS = Object.freeze({
  land: '#eeecee',
  water: '#dce1ef',
  green: '#d1e1d6',
  park: '#dce7df',
  road: '#d6d3d8',
  majorRoad: '#d6d3d8',
  building: '#e3e0e4',
  label: '#827a80',
  cityLabel: '#665960',
});
const P58_MAP_ATTRIBUTION = '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>';

function p58MapStyle({ preview = false } = {}) {
  const c = P58_MAP_COLORS;
  const source = (layer) => ({ source: 'openmaptiles', 'source-layer': layer });
  const classes = (...values) => ['match', ['get', 'class'], values, true, false];
  const zoomWidth = (small, large) => ['interpolate', ['exponential', 1.4], ['zoom'], 10, small, 17, large];
  const localName = ['coalesce', ['get', 'name:el'], ['get', 'name'], ['get', 'name:latin']];
  const labelPaint = { 'text-color': c.label, 'text-halo-color': c.land, 'text-halo-width': 1.2 };
  const layers = [
    { id: 'background', type: 'background', paint: { 'background-color': c.land } },
    { id: 'vegetation', type: 'fill', ...source('landcover'), filter: classes('wood', 'grass'), paint: { 'fill-color': c.green, 'fill-opacity': .8 } },
    { id: 'green-landuse', type: 'fill', ...source('landuse'), filter: classes('cemetery', 'recreation_ground', 'village_green', 'allotments'), paint: { 'fill-color': c.park } },
    { id: 'parks', type: 'fill', ...source('park'), paint: { 'fill-color': c.park, 'fill-opacity': .85 } },
    { id: 'water', type: 'fill', ...source('water'), paint: { 'fill-color': c.water } },
    { id: 'waterways', type: 'line', ...source('waterway'), paint: { 'line-color': c.water, 'line-width': zoomWidth(.4, 2) } },
    { id: 'buildings', type: 'fill', ...source('building'), minzoom: 14, paint: { 'fill-color': c.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, .3, 16, .7] } },
    { id: 'paths', type: 'line', ...source('transportation'), minzoom: 13, filter: classes('path', 'track'), paint: { 'line-color': c.road, 'line-width': zoomWidth(.3, 1.4), 'line-dasharray': [2, 2] } },
    { id: 'local-roads', type: 'line', ...source('transportation'), filter: classes('minor', 'service'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.road, 'line-width': zoomWidth(.35, 4) } },
    { id: 'main-roads', type: 'line', ...source('transportation'), filter: classes('primary', 'secondary', 'tertiary'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.majorRoad, 'line-width': zoomWidth(.6, 7) } },
    { id: 'highways', type: 'line', ...source('transportation'), filter: classes('motorway', 'trunk'), layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': c.majorRoad, 'line-width': zoomWidth(.9, 9) } },
    { id: 'railways', type: 'line', ...source('transportation'), minzoom: 12, filter: classes('rail'), paint: { 'line-color': c.road, 'line-width': .7, 'line-dasharray': [3, 3] } },
    { id: 'boundaries', type: 'line', ...source('boundary'), filter: ['<=', ['get', 'admin_level'], 4], paint: { 'line-color': c.road, 'line-width': .8, 'line-dasharray': [4, 4] } },
    { id: 'street-names', type: 'symbol', ...source('transportation_name'), minzoom: 15, layout: { 'symbol-placement': 'line', 'text-field': localName, 'text-font': ['Noto Sans Regular'], 'text-size': 10, 'symbol-spacing': 300 }, paint: labelPaint },
    { id: 'neighbourhoods', type: 'symbol', ...source('place'), minzoom: 11, filter: classes('suburb', 'neighbourhood', 'quarter', 'village'), layout: { 'text-field': localName, 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 15, 12], 'text-max-width': 10, 'text-padding': 8 }, paint: labelPaint },
    { id: 'cities', type: 'symbol', ...source('place'), filter: classes('city', 'town'), layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 12, 16], 'text-padding': 12 }, paint: { ...labelPaint, 'text-color': c.cityLabel } },
    { id: 'countries', type: 'symbol', ...source('place'), maxzoom: 7, filter: classes('country'), layout: { 'text-field': localName, 'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-padding': 12 }, paint: labelPaint },
  ];
  return {
    version: 8,
    name: 'Project58 — soft grey',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: { openmaptiles: { type: 'vector', url: 'https://tiles.openfreemap.org/planet', attribution: P58_MAP_ATTRIBUTION } },
    layers: preview ? layers.filter(layer => layer.type !== 'symbol') : layers,
  };
}
Object.assign(window, { p58MapStyle, P58_MAP_ATTRIBUTION });
