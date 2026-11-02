import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('brand-pages.jsx', 'utf8');
const declaration = parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'bindMapListEdgeScroll');

function fixture() {
  const list = new EventTarget();
  Object.assign(list, { scrollTop: 100, scrollHeight: 1000, clientHeight: 300,
    getBoundingClientRect: () => ({ top: 100, height: 300 }) });
  const window = new EventTarget();
  const frames = new Map();
  let clock = 0;
  let id = 0;
  const context = vm.createContext({ window, performance: { now: () => clock },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  vm.runInContext(source.slice(declaration.start, declaration.end), context);
  const cleanup = context.bindMapListEdgeScroll(list);
  const send = (type, fields = {}) => {
    const event = new Event(type, { cancelable: true });
    Object.assign(event, { pointerType: 'mouse', buttons: 0, clientY: 250 }, fields);
    list.dispatchEvent(event);
    return event;
  };
  const tick = () => { clock += 16; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(fn => fn(clock)); };
  return { list, window, frames, send, tick, cleanup };
}

test('hover near list edges scrolls in the corresponding direction; middle and exit stop it', () => {
  const f = fixture();
  f.send('pointerenter', { clientY: 101 });
  f.tick();
  assert.ok(f.list.scrollTop < 100);
  const upperPosition = f.list.scrollTop;
  f.send('pointermove', { clientY: 399 });
  f.tick();
  assert.ok(f.list.scrollTop > upperPosition);
  f.send('pointermove', { clientY: 250 });
  assert.equal(f.frames.size, 0);
  f.send('pointermove', { clientY: 399 });
  f.send('pointerleave');
  assert.equal(f.frames.size, 0);
});

test('wheel and keyboard retain native behavior and stop automatic scrolling', () => {
  const f = fixture();
  for (const type of ['wheel', 'keydown', 'pointerdown']) {
    f.send('pointermove', { clientY: 399 });
    assert.equal(f.frames.size, 1);
    assert.equal(f.send(type).defaultPrevented, false);
    assert.equal(f.frames.size, 0);
  }
  f.send('pointermove', { clientY: 399, pointerType: 'touch' });
  assert.equal(f.frames.size, 0);
  f.send('pointermove', { clientY: 399, buttons: 1 });
  assert.equal(f.frames.size, 0);
});

test('scrolling stops at both boundaries and never schedules an endless loop', () => {
  const f = fixture();
  for (const [position, clientY] of [[0, 100], [700, 400]]) {
    f.list.scrollTop = position;
    f.send('pointermove', { clientY });
    f.tick();
    assert.equal(f.list.scrollTop, position);
    assert.equal(f.frames.size, 0);
  }
  f.list.scrollHeight = f.list.clientHeight;
  f.list.scrollTop = 0;
  f.send('pointermove', { clientY: 399 });
  f.tick();
  assert.equal(f.frames.size, 0);
});

test('window blur and cleanup cancel pending scrolling', () => {
  const f = fixture();
  f.send('pointermove', { clientY: 399 });
  f.window.dispatchEvent(new Event('blur'));
  assert.equal(f.frames.size, 0);
  f.send('pointermove', { clientY: 399 });
  f.cleanup();
  f.tick();
  assert.equal(f.list.scrollTop, 100);
  f.send('pointermove', { clientY: 399 });
  assert.equal(f.frames.size, 0);
});
