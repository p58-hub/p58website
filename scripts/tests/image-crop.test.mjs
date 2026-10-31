import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('dashboard.jsx', 'utf8');
const ast = parse(source, { sourceType: 'script', plugins: ['jsx'] });
const names = ['fitImageCrop', 'constrainImageCrop', 'canCropImage'];
const code = ast.program.body.filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id.name)).map(node => source.slice(node.start, node.end)).join('\n');
const context = vm.createContext({ window: { isVideoSrc: src => /\.mp4(?:[?&]|$)|^data:video\//i.test(src) } });
vm.runInContext(code, context);
const { fitImageCrop, constrainImageCrop, canCropImage } = context;

test('crop presets fit and center inside landscape, portrait and tiny source images', () => {
  for (const [width, height] of [[2400, 1600], [900, 1800], [1, 1]]) {
    for (const ratio of [0, 1, 4 / 3, 3 / 2, 16 / 9, 4 / 5, 9 / 16]) {
      const crop = fitImageCrop(width, height, ratio);
      assert.ok(crop.width > 0 && crop.height > 0);
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= width + 1e-9);
      assert.ok(crop.y + crop.height <= height + 1e-9);
      assert.equal(crop.x, (width - crop.width) / 2);
      assert.equal(crop.y, (height - crop.height) / 2);
      if (ratio) assert.ok(Math.abs(crop.width / crop.height - ratio) < 1e-9);
      else { assert.equal(crop.width, width); assert.equal(crop.height, height); }
    }
  }
});

test('dragging past edges or shrinking past zero keeps crops within the source and preserves the ratio', () => {
  for (const ratio of [0, 1, 16 / 9, 9 / 16]) {
    for (const x of [-100, 20, 9999]) {
      for (const y of [-100, 40, 9999]) {
        for (const size of [-500, 1, 100, 9999]) {
          const crop = constrainImageCrop({ x, y, width: size, height: size }, 640, 480, ratio);
          assert.ok(crop.width > 0 && crop.height > 0);
          assert.ok(crop.x >= 0 && crop.y >= 0);
          assert.ok(crop.x + crop.width <= 640 + 1e-9);
          assert.ok(crop.y + crop.height <= 480 + 1e-9);
          if (ratio) assert.ok(Math.abs(crop.width / crop.height - ratio) < 1e-9);
        }
      }
    }
  }
});

test('crop is available for raster photos but excludes videos, animated GIF and SVG artwork', () => {
  for (const src of ['/photo.jpg', '/photo.png?v=2', '/api/media-file?id=abc&name=photo.webp', 'data:image/png;base64,AAAA']) assert.equal(canCropImage(src), true, src);
  for (const src of ['', null, '/clip.mp4', '/animation.GIF?v=2', '/api/media-file?id=abc&name=logo.svg', 'data:image/svg+xml;base64,AAAA', 'data:image/gif;base64,AAAA']) assert.equal(canCropImage(src), false, src);
  assert.equal(canCropImage('/media/opaque-id', 'image/gif'), false);
  assert.equal(canCropImage('/media/opaque-id', 'image/svg+xml'), false);
  assert.equal(canCropImage('/media/opaque-id', 'video/mp4'), false);
});

const dialog = ast.program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'ImageCropDialog');
const saveNode = dialog.body.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : []).find(node => node.id.name === 'save').init;
function saveHarness({ failure = false, tainted = false } = {}) {
  const state = { busy: false, error: '', pending: 0, requests: [], saved: [], draws: [] };
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: (...args) => state.draws.push(args) }), toDataURL: () => {
    if (tainted) throw Object.assign(new Error('Tainted canvas'), { name: 'SecurityError' });
    return 'data:image/webp;base64,TEST';
  } };
  const ctx = vm.createContext({
    image: { naturalWidth: 6000, naturalHeight: 4000 },
    crop: { x: 100, y: 200, width: 4000, height: 2000 },
    src: '/source.png', uploadKey: 'project-one', item: null,
    saving: { current: false }, MEDIA_MAX_DIM: 2400, MEDIA_QUALITY: .85,
    document: { createElement: () => canvas }, crypto: { randomUUID: () => 'unique' },
    cachedMediaItems: () => [{ url: '/source.png', filename: 'original.png', caption: 'Original caption', kind: 'image' }],
    setBusy: value => { state.busy = value; }, setError: value => { state.error = value; },
    uploadRegistry: { begin: () => state.pending++, step: () => state.pending-- },
    mediaApi: { upload: async payload => { state.requests.push(payload); if (failure) throw new Error('Offline'); return { item: { id: 'new', url: '/crop.webp' } }; } },
    onSave: item => state.saved.push(item),
  });
  return { state, canvas, save: vm.runInContext(`(${source.slice(saveNode.start, saveNode.end)})`, ctx) };
}

test('crop saves source coordinates with bounded output resolution and keeps original metadata', async () => {
  const { state, canvas, save } = saveHarness();
  await save();
  assert.equal(canvas.width, 2400);
  assert.equal(canvas.height, 1200);
  assert.deepEqual(state.draws[0].slice(1), [100, 200, 4000, 2000, 0, 0, 2400, 1200]);
  assert.equal(state.requests[0].filename, 'original-crop-unique.webp');
  assert.equal(state.requests[0].projectId, 'project-one');
  assert.equal(state.requests[0].caption, 'Original caption');
  assert.equal(state.saved[0].url, '/crop.webp');
  assert.equal(state.pending, 0);
  assert.equal(state.busy, false);
});

test('failed uploads and blocked canvas exports preserve the selected image and release the upload lock', async () => {
  for (const options of [{ failure: true }, { tainted: true }]) {
    const { state, save } = saveHarness(options);
    await save();
    assert.equal(state.saved.length, 0);
    assert.equal(state.pending, 0);
    assert.equal(state.busy, false);
    assert.ok(state.error);
    if (options.tainted) assert.equal(state.requests.length, 0);
  }
});

test('double clicks cannot upload the same crop twice', async () => {
  const { state, save } = saveHarness();
  await Promise.all([save(), save()]);
  assert.equal(state.requests.length, 1);
  assert.equal(state.saved.length, 1);
  assert.equal(state.pending, 0);
});
