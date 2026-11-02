import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('brand-pages.jsx', 'utf8');
const declaration = parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'bindMapTrackpadZoom');

function fixture() {
  const container = new EventTarget();
  container.clientHeight = 500;
  const frames = new Map();
  const changes = [];
  let frameId = 0;
  let zoom = 11;
  const map = {
    getContainer: () => container,
    getZoom: () => zoom,
    getMinZoom: () => 2,
    getMaxZoom: () => 19,
    mouseEventToContainerPoint: event => ({ x: event.clientX, y: event.clientY }),
    stop() {},
    setZoomAround(anchor, next, options) { zoom = next; changes.push({ anchor, zoom, options }); },
  };
  const context = vm.createContext({
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  vm.runInContext(source.slice(declaration.start, declaration.end), context);
  const cleanup = context.bindMapTrackpadZoom(map);
  const send = (type, fields = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { clientX: 100, clientY: 150, deltaMode: 0 }, fields);
    container.dispatchEvent(event);
    return event;
  };
  const flush = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn()); };
  return { send, flush, cleanup, changes, frames, map };
}

test('trackpad pinch prevents page zoom and combines small deltas around the pointer', () => {
  const f = fixture();
  assert.equal(f.send('wheel', { ctrlKey: true, deltaY: -2 }).defaultPrevented, true);
  f.send('wheel', { ctrlKey: true, deltaY: -3, clientX: 120 });
  assert.equal(f.frames.size, 1);
  f.flush();
  assert.ok(Math.abs(f.map.getZoom() - 11.05) < 1e-9);
  assert.equal(f.changes[0].anchor.x, 120);
  assert.equal(f.changes[0].options.animate, false);
  f.send('wheel', { ctrlKey: true, deltaY: 5 });
  f.flush();
  assert.ok(Math.abs(f.map.getZoom() - 11) < 1e-9);
});

test('normal scroll is not consumed; pinch stays within map zoom limits', () => {
  const f = fixture();
  assert.equal(f.send('wheel', { ctrlKey: false, deltaY: 100 }).defaultPrevented, false);
  assert.equal(f.frames.size, 0);
  for (const [deltaY, zoom] of [[-100000, 19], [100000, 2]]) {
    assert.equal(f.send('wheel', { ctrlKey: true, deltaY }).defaultPrevented, true);
    f.flush();
    assert.equal(f.map.getZoom(), zoom);
  }
  f.send('wheel', { ctrlKey: true, deltaY: -1, deltaMode: 1 });
  f.flush();
  assert.equal(f.map.getZoom(), 2.16);
});

test('Safari scale is relative to gesture start and duplicate wheel events do not double zoom', () => {
  const f = fixture();
  assert.equal(f.send('gesturestart').defaultPrevented, true);
  f.send('gesturechange', { scale: 2 });
  f.send('wheel', { ctrlKey: true, deltaY: -100 });
  f.flush();
  assert.equal(f.map.getZoom(), 12);
  f.send('gesturechange', { scale: 4 });
  f.flush();
  assert.equal(f.map.getZoom(), 13);
  assert.equal(f.send('gestureend').defaultPrevented, true);
});

test('touchscreen gestures remain with Leaflet and cleanup cancels pending zoom', () => {
  const f = fixture();
  f.send('touchstart', { touches: [{}, {}] });
  assert.equal(f.send('gesturestart').defaultPrevented, false);
  assert.equal(f.send('gesturechange', { scale: 2 }).defaultPrevented, false);
  assert.equal(f.frames.size, 0);
  f.send('touchend', { touches: [] });
  f.send('wheel', { ctrlKey: true, deltaY: -10 });
  f.cleanup();
  f.flush();
  assert.equal(f.changes.length, 0);
  assert.equal(f.send('wheel', { ctrlKey: true, deltaY: -10 }).defaultPrevented, false);
  assert.equal(f.send('gesturestart').defaultPrevented, false);
});
