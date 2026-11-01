import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const sheet = parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'ProjectSheet');
const declarations = sheet.body.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []);
function harness() {
  const gallery = [{ src: 'a' }, { src: 'b' }];
  const layout = [{ x: 1, y: 1, w: 6, h: 4 }, { x: 7, y: 1, w: 6, h: 4 }];
  const state = { writes: 0, previews: 0 };
  const grid = { clientWidth: 600, getBoundingClientRect: () => ({ left: 100, right: 700, top: 200, width: 600 }) };
  const files = { querySelector: () => grid };
  const scroller = { scrollTop: 0, getBoundingClientRect: () => ({ top: 0, bottom: 1000 }) };
  const handle = {
    closest: selector => selector === '.gal-files' ? files : selector === '.sheet-body' ? scroller : { getBoundingClientRect: () => ({ left: 100, top: 200, width: 300, height: 200 }) },
    focus() {}, setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {},
  };
  const globals = {
    p: { gallery }, exactGalleryGrid: true, baseCardLayout: layout, cardLayout: layout,
    galleryGap: 0, galleryCenterOffset: 0, galleryRatios: {},
    dragGesture: { current: null }, dragFrame: { current: null }, dragTick: { current() {} },
    dragFloatRef: { current: { style: {} } },
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    window: { galleryImageBox: box => box, galleryImageOverlaps: () => true },
    galleryDragPreview: (items, from, target) => {
      state.previews++;
      return { gallery: [items[1], items[0]], layout: [layout[1], layout[0]], box: layout[1], position: target };
    },
    setP: updater => { state.writes++; globals.p = updater(globals.p); },
  };
  for (const key of ['dragIndex', 'overIndex', 'dropBox', 'dragPreview', 'dragFloat']) {
    globals['set' + key[0].toUpperCase() + key.slice(1)] = value => { state[key] = value; };
  }
  const context = vm.createContext(globals);
  for (const name of ['endDrag', 'updateDragTarget', 'handleProps']) {
    const node = declarations.find(node => node.id.name === name).init;
    globals[name] = vm.runInContext(`(${source.slice(node.start, node.end)})`, context);
  }
  const handlers = globals.handleProps(0);
  const event = (x = 120, y = 220) => ({ button: 0, clientX: x, clientY: y, pointerId: 1,
    currentTarget: handle, preventDefault() {}, stopPropagation() {} });
  return { state, globals, handlers, event, gallery };
}

test('pointer drag lifts immediately, previews without saving, and commits once on release', () => {
  const { state, globals, handlers, event } = harness();
  handlers.onPointerDown(event());
  assert.equal(state.dragFloat.src, 'a');
  assert.ok(state.dragFloat.width < 300);
  assert.equal(state.dropBox.x, 1);
  handlers.onPointerMove(event(550, 240));
  assert.equal(state.dragPreview.position, 1);
  assert.equal(state.writes, 0);
  assert.equal(globals.dragFloatRef.current.style.transform, 'translate3d(526px, 216px, 0)');
  globals.updateDragTarget();
  assert.equal(state.previews, 1, 'stationary pointer does not oscillate between animated cards');
  handlers.onPointerUp(event(550, 240));
  assert.equal(state.writes, 1);
  assert.deepEqual(globals.p.gallery.map(image => image.src), ['b', 'a']);
  assert.equal(state.dragFloat, null);
  assert.equal(state.dragPreview, null);
});

test('Escape, pointer cancellation and capture loss discard preview without saving', () => {
  for (const method of ['onKeyDown', 'onPointerCancel', 'onLostPointerCapture']) {
    const { state, handlers, event } = harness();
    handlers.onPointerDown(event());
    handlers.onPointerMove(event(550, 240));
    handlers[method]({ ...event(), key: 'Escape' });
    handlers.onPointerUp(event(550, 240));
    assert.equal(state.writes, 0);
    assert.equal(state.dragFloat, null);
    assert.equal(state.dropBox, null);
  }
});

test('a click or dropping outside the canvas does not save an accidental reorder', () => {
  for (const moveOutside of [false, true]) {
    const { state, handlers, event } = harness();
    handlers.onPointerDown(event());
    if (moveOutside) {
      handlers.onPointerMove(event(550, 240));
      handlers.onPointerMove(event(800, 240));
    }
    handlers.onPointerUp(moveOutside ? event(800, 240) : event());
    assert.equal(state.writes, 0);
    assert.equal(state.dragFloat, null);
  }
});
