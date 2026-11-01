import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const picker = parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'FunctionDeclaration' && node.id.name === 'MediaPicker');
const declarations = picker.body.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []);
const handler = name => {
  const node = declarations.find(node => node.id.name === name).init;
  return `(${source.slice(node.start, node.end)})`;
};
function harness() {
  const state = { items: [{ id: 'existing', url: '/existing.jpg' }], uploading: false, error: null,
    query: 'unrelated search', projectFilter: 'other', groupView: 'other', collapsed: { project: true },
    dateFrom: '2020-01-01', dateTo: '2020-01-02', picked: [], closed: 0, pending: 0, requests: [] };
  const globals = {
    replacementImage: { src: '/current.jpg' }, currentProjectId: 'project',
    busyRef: { current: false }, uploadedItems: { current: [] }, selected: new Set(['/already-used.jpg']),
    downscaleImage: async file => ({ dataUrl: file.name, width: 20, height: 30 }),
    mediaApi: { upload: payload => new Promise((resolve, reject) => state.requests.push({ payload, resolve, reject })) },
    ensureProjectMediaAssignment: async item => { state.assigned = item.id; return { ...item, projectId: 'project' }; },
    uploadRegistry: { begin: () => state.pending++, step: () => state.pending-- },
    onPick: item => state.picked.push(item), onClose: () => state.closed++,
  };
  for (const key of ['items', 'uploading', 'error', 'status', 'uploadError', 'uploadNotice', 'query', 'projectFilter', 'groupView', 'collapsed', 'dateFrom', 'dateTo']) {
    globals['set' + key[0].toUpperCase() + key.slice(1)] = value => { state[key] = typeof value === 'function' ? value(state[key]) : value; };
  }
  const context = vm.createContext(globals);
  return { state, globals, upload: vm.runInContext(handler('upload'), context), choose: vm.runInContext(handler('choose'), context) };
}
const event = () => ({ target: { files: [{ name: 'new.png' }], value: 'file' } });
const flush = () => new Promise(resolve => setImmediate(resolve));

test('replacement upload belongs to the current project and waits for an explicit selection', async () => {
  const { state, globals, upload, choose } = harness();
  const input = event(), task = upload(input);
  await flush();
  assert.equal(state.pending, 1);
  assert.equal(state.requests[0].payload.projectId, 'project');
  assert.equal(state.requests[0].payload.kind, 'image');
  assert.equal(input.target.value, '');
  choose({ url: '/other.jpg' });
  await upload(event());
  assert.equal(state.requests.length, 1);
  assert.equal(state.picked.length, 0);
  state.requests[0].resolve({ item: { id: 'new', url: '/new.png', projectId: 'project' } });
  await task;
  assert.equal(state.items[0].id, 'new');
  assert.equal(globals.uploadedItems.current[0].id, 'new');
  assert.equal(state.projectFilter, 'project');
  assert.equal(state.groupView, 'project');
  assert.equal(state.collapsed.project, false);
  for (const key of ['query', 'dateFrom', 'dateTo']) assert.equal(state[key], '');
  assert.equal(state.pending, 0);
  assert.equal(state.closed, 0);
  choose({ url: '/current.jpg' }); choose({ url: '/already-used.jpg' });
  assert.equal(state.picked.length, 0);
  choose(state.items[0]);
  assert.equal(state.picked[0].url, '/new.png');
  assert.equal(state.closed, 1);
});

test('failed replacement upload preserves the gallery and releases the dialog for retry', async () => {
  const { state, globals, upload } = harness();
  const task = upload(event()); await flush();
  state.requests[0].reject(new Error('Offline')); await task;
  assert.match(state.uploadError, /Offline/);
  assert.equal(state.items.length, 1);
  assert.equal(state.picked.length, 0);
  assert.equal(state.closed, 0);
  assert.equal(state.pending, 0);
  assert.equal(state.uploading, false);
  assert.equal(globals.busyRef.current, false);
  const retry = upload(event()); await flush();
  state.requests[1].resolve({ item: { id: 'retry', url: '/retry.png', projectId: null } });
  await retry;
  assert.equal(state.assigned, 'retry');
  assert.equal(state.items[0].projectId, 'project');
  assert.equal(state.uploadError, '');
});
