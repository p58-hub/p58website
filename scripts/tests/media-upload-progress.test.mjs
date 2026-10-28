import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const ast = parse(source, { sourceType: 'script', plugins: ['jsx'] });
const library = ast.program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'MediaLibrary');
const handler = library.body.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id.name === 'onFiles').init;

function uploadHarness() {
  const state = { items: [], progress: null, busy: null, alerts: [], toasts: [], requests: [] };
  const ctx = vm.createContext({
    items: [], uploadDestination: 'project-one',
    normaliseMediaFilename: name => name,
    downscaleImage: async file => ({ dataUrl: file.name, width: 100, height: 100 }),
    mediaApi: { upload: payload => new Promise((resolve, reject) => state.requests.push({ payload, resolve, reject })) },
    setItems: update => { state.items = update(state.items); },
    setUploadProgress: update => { state.progress = typeof update === 'function' ? update(state.progress) : update; },
    setBusy: value => { state.busy = value; },
    alert: value => state.alerts.push(value),
    onToast: value => state.toasts.push(value),
  });
  return { state, onFiles: vm.runInContext(`(${source.slice(handler.start, handler.end)})`, ctx) };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const event = names => ({ target: { files: names.map(name => ({ name })), value: 'selected' } });

test('batch count advances only after successful uploads and each file appears immediately', async () => {
  const { state, onFiles } = uploadHarness();
  const selected = event(['first.jpg', 'second.jpg']);
  const task = onFiles(selected);
  await flush();
  assert.equal(selected.target.value, '');
  assert.equal(state.progress.done, 0);
  assert.equal(state.progress.total, 2);
  assert.equal(state.progress.current, 'first.jpg');
  assert.equal(state.items.length, 0);
  state.requests[0].resolve({ item: { id: 'first', url: '/first.jpg' } });
  await flush();
  assert.equal(state.progress.done, 1);
  assert.equal(state.progress.current, 'second.jpg');
  assert.equal(state.progress.status, 'uploading');
  assert.equal(state.items[0].id, 'first');
  assert.equal(state.requests[1].payload.projectId, 'project-one');
  state.requests[1].resolve({ item: { id: 'second', url: '/second.jpg' } });
  await task;
  assert.equal(state.progress.done, 2);
  assert.equal(state.progress.total, 2);
  assert.equal(state.progress.status, 'complete');
  assert.equal(state.busy, null);
  assert.equal(new Set(state.items.map(item => item.id)).size, 2);
  assert.equal(state.items.length, 2);
});

test('failed files are not counted and earlier successful uploads remain visible', async () => {
  const { state, onFiles } = uploadHarness();
  const task = onFiles(event(['first.jpg', 'failed.jpg', 'unstarted.jpg']));
  await flush();
  state.requests[0].resolve({ item: { id: 'first' } });
  await flush();
  state.requests[1].reject(new Error('Connection lost'));
  await task;
  assert.equal(state.progress.done, 1);
  assert.equal(state.progress.total, 3);
  assert.equal(state.progress.current, 'failed.jpg');
  assert.equal(state.progress.status, 'error');
  assert.equal(state.requests.length, 2);
  assert.equal(state.items.length, 1);
  assert.equal(state.busy, null);
  assert.equal(state.toasts.length, 0);
  assert.match(state.alerts[0], /failed.jpg/);
});

test('cancelled selection and duplicate batches do not begin uploading', async () => {
  const { state, onFiles } = uploadHarness();
  await onFiles(event([]));
  await onFiles(event(['same.jpg', 'same.jpg']));
  assert.equal(state.progress, null);
  assert.equal(state.requests.length, 0);
  assert.equal(state.alerts.length, 1);
});
