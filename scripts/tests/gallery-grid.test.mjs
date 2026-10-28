import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const source = fs.readFileSync('data.jsx', 'utf8');
const names = ['galleryAutoLayouts', 'galleryLayoutSignature', 'galleryImageEmptySlots', 'insertGalleryImageInSlot', 'galleryImageStyle', 'galleryImageCanvasStyle', 'galleryImageBox', 'galleryImageOverlaps', 'resizeGalleryImage', 'projectGalleryImageLayout', 'placeGalleryImage', 'compactProjectGalleryLayout', 'projectGalleryGap', 'galleryGridBox', 'galleryGridStyle', 'galleryGridCenterOffset', 'resizeGalleryGridBox', 'galleryGridOverlaps', 'projectGalleryLayout', 'normaliseProject', 'packGalleryGrid', 'placeGalleryGridImage', 'reorderGalleryGrid', 'galleryGridDropIndex'];
const context = vm.createContext({ PROJECTS_GR: {}, projectSlugFromFields: p => p.id });
const ast = parse(source, { sourceType: 'script', plugins: ['jsx'] });
vm.runInContext(ast.program.body.filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id.name)).map(node => source.slice(node.start, node.end)).join('\n'), context);
const plain = value => JSON.parse(JSON.stringify(value));

test('centering balances outer margins without changing relative positions or stored geometry', () => {
  for (const layout of [
    [{ x: 1, y: 1, w: 4.4, h: 3 }, { x: 5.5, y: 1, w: 4.7, h: 7 }, { x: 1, y: 4, w: 4.4, h: 3 }],
    [{ x: 8, y: 1, w: 4, h: 3 }],
    [{ x: 1, y: 1, w: 12, h: 4 }],
    [{ x: 1, y: 1, w: 5.9, h: 3 }],
  ]) {
    const before = plain(layout);
    const shift = context.galleryGridCenterOffset(layout);
    const left = Math.min(...layout.map(box => box.x)) - 1 + shift;
    const right = 13 - Math.max(...layout.map(box => box.x + box.w)) - shift;
    assert.ok(Math.abs(left - right) < 1e-8);
    assert.ok(left >= 0 && right >= 0);
    assert.deepEqual(layout, before);
  }
  assert.equal(context.galleryGridCenterOffset([]), 0);
  assert.equal(context.galleryGridCenterOffset([{ x: 1, y: 1, w: 12, h: 4 }]), 0);
});

test('third image can occupy the gap below a short first image beside a tall second image', () => {
  const gallery = [
    { src: 'one.png', grid: { x: 1, y: 1, w: 5, h: 3 } },
    { src: 'two.png', grid: { x: 6, y: 1, w: 5, h: 7 } },
    { src: 'three.png', tag: 'Third', grid: { x: 1, y: 8, w: 5, h: 3 } },
  ];
  const before = plain(gallery);
  const moved = context.placeGalleryGridImage(gallery, 2, { ...gallery[2].grid, y: 4 });
  assert.deepEqual(plain(moved.slice(0, 2)), gallery.slice(0, 2));
  assert.equal(moved[2].grid.y, 4);
  assert.equal(moved[2].tag, 'Third');
  assert.deepEqual(plain(context.projectGalleryLayout(plain(moved))), plain(moved.map(image => image.grid)));
  assert.equal(context.placeGalleryGridImage(gallery, 2, { ...gallery[2].grid, y: 2 }), gallery);
  assert.deepEqual(gallery, before);
  const resized = context.placeGalleryGridImage(moved, 2, { ...moved[2].grid, w: 4.5 }, true);
  assert.equal(resized[2].grid.y, 4);
  assert.deepEqual(plain(resized.slice(0, 2)), gallery.slice(0, 2));
});

test('resizing keeps independent positions and moves only colliding images out of the way', () => {
  const gallery = [
    { grid: { x: 1, y: 1, w: 5, h: 3 } }, { grid: { x: 6, y: 1, w: 5, h: 7 } },
    { grid: { x: 1, y: 4, w: 5, h: 3 } },
  ];
  const resized = context.placeGalleryGridImage(gallery, 0, { ...gallery[0].grid, h: 4 }, true);
  assert.deepEqual(plain(resized[1]), gallery[1]);
  assert.equal(resized[2].grid.y, 5);
  assert.deepEqual(plain(context.projectGalleryLayout(resized)), plain(resized.map(image => image.grid)));
});

test('fine resizing advances by tenths and preserves values through save and reload', () => {
  const box = { x: 1, y: 1, w: 6, h: 4 };
  const resized = context.resizeGalleryGridBox(box, 0.12, -0.08);
  assert.deepEqual(plain(resized), { x: 1, y: 1, w: 6.1, h: 3.9 });
  assert.deepEqual(plain(context.projectGalleryLayout(plain([{ grid: resized }]))[0]), plain(resized));
  assert.deepEqual(plain(box), { x: 1, y: 1, w: 6, h: 4 });
  const limited = context.resizeGalleryGridBox(box, 100, -100);
  assert.equal(limited.w, 12);
  assert.equal(limited.h, 1);
});

test('fine tracks keep requested spacing and positive cells at every supported gap', () => {
  for (const width of [540, 750, 1440]) for (const percent of [0, 0.6, 3]) {
    const gap = width * percent / 100;
    const cell = (width + gap) / 120;
    assert.ok(cell > 0);
    const boxes = [{x:1,y:1,w:6.1,h:3.9}, {x:7.1,y:1,w:5.9,h:3.9}];
    const rects = boxes.map(box => {
      const [line, span] = context.galleryGridStyle(box).gridColumn.split(' / span ').map(Number);
      return {left:(line-1)*cell, width:span*cell-gap};
    });
    assert.ok(Math.abs(rects[1].left - rects[0].width - gap) < 1e-8);
    assert.ok(Math.abs(rects[1].left + rects[1].width - width) < 1e-8);
  }
});

test('fractional packing fills an exact row without rounding drift or false collisions', () => {
  const gallery = [3.3, 3.3, 5.4, 6.1, 5.9].map((w, i) => ({ src: `${i}.png`, grid: { w, h: 3.9 } }));
  const packed = context.packGalleryGrid(gallery);
  assert.deepEqual(plain(packed.map(image => image.grid)), [
    { x: 1, y: 1, w: 3.3, h: 3.9 }, { x: 4.3, y: 1, w: 3.3, h: 3.9 }, { x: 7.6, y: 1, w: 5.4, h: 3.9 },
    { x: 1, y: 4.9, w: 6.1, h: 3.9 }, { x: 7.1, y: 4.9, w: 5.9, h: 3.9 },
  ]);
  assert.deepEqual(plain(context.projectGalleryLayout(packed)), plain(packed.map(image => image.grid)));
});
const dashboardSource = fs.readFileSync('dashboard.jsx', 'utf8');
const append = parse(dashboardSource, { sourceType: 'script', plugins: ['jsx'] }).program.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'appendProjectGalleryImage');
context.window = { compactProjectGalleryLayout: context.compactProjectGalleryLayout, packGalleryGrid: context.packGalleryGrid, projectGalleryLayout: context.projectGalleryLayout };
vm.runInContext(dashboardSource.slice(append.start, append.end), context);

test('gallery selection appends the chosen media and caption without creating empty entries', () => {
  const project = { id: 'one', gallery: [{ src: 'old.png', scale: 50 }] };
  for (const item of [null, {}, { url: '' }, { url: ' ' }]) assert.equal(context.appendProjectGalleryImage(project, item), project);
  const result = context.appendProjectGalleryImage(project, { url: 'library.png', caption: 'Front', caption_gr: 'Όψη' });
  assert.equal(project.gallery.length, 1);
  assert.equal(result.gallery[0], project.gallery[0]);
  assert.deepEqual(plain(result.gallery[1]), { src: 'library.png', tag: 'Front', tag_gr: 'Όψη', span: 'gal-6' });
});

test('uploaded media joins the grid in a free slot with the existing image sizes intact', () => {
  const project = { galleryLayout: 'grid', gallery: [{ src: 'old.png', grid: { x: 1, y: 1, w: 6, h: 3 } }] };
  const result = context.appendProjectGalleryImage(project, { url: 'uploaded.png' });
  assert.equal(result.gallery.length, 2);
  assert.equal(result.gallery[1].src, 'uploaded.png');
  assert.equal(result.gallery[0].grid.w, 6);
  assert.equal(result.gallery[0].grid.h, 3);
  assert.equal(context.galleryGridOverlaps(result.gallery[0].grid, result.gallery[1].grid), false);
});

test('custom gallery positions survive draft serialization and public normalization', () => {
  const gallery = [
    { src: 'square.png', tag: 'Square', scale: 50, grid: { x: 2, y: 3, w: 4, h: 4 } },
    { src: 'landscape.jpg', grid: { x: 7, y: 1, w: 6, h: 3 } },
  ];
  const project = context.normaliseProject(plain({ id: 'test', galleryLayout: 'grid', gallery }), 0);
  assert.equal(project.galleryLayout, 'grid');
  assert.deepEqual(plain(project.gallery), gallery);
  assert.deepEqual(plain(context.projectGalleryLayout(project.gallery)), gallery.map(image => image.grid));
});

test('adjacent cells are allowed while intersecting cells collide', () => {
  const box = { x: 1, y: 1, w: 6, h: 4 };
  assert.equal(context.galleryGridOverlaps(box, { x: 7, y: 1, w: 6, h: 4 }), false);
  assert.equal(context.galleryGridOverlaps(box, { x: 1, y: 5, w: 6, h: 4 }), false);
  assert.equal(context.galleryGridOverlaps(box, { x: 6, y: 4, w: 4, h: 4 }), true);
});

test('new and overlapping images get free slots without changing saved inputs', () => {
  const gallery = [{ grid: { x: 1, y: 1, w: 12, h: 4 } }, { grid: { x: 1, y: 1, w: 6, h: 4 } }, { src: 'new.png' }];
  const before = plain(gallery);
  const layout = context.projectGalleryLayout(gallery);
  assert.equal(layout[1].y, 5);
  assert.equal(layout[2].y, 9);
  assert.deepEqual(gallery, before);
  for (let i = 0; i < layout.length; i++) for (let j = i + 1; j < layout.length; j++) assert.equal(context.galleryGridOverlaps(layout[i], layout[j]), false);
});

test('invalid geometry is constrained to usable grid bounds', () => {
  for (const value of [null, {}, { x: -2, y: Infinity, w: 30, h: 0 }, { x: 12, y: -5, w: 6, h: 50 }]) {
    const box = context.galleryGridBox(value);
    assert.ok(box.x >= 1 && box.x + box.w <= 13);
    assert.ok(box.y >= 1 && box.h >= 1 && box.h <= 24);
  }
});

test('moving the first image after the third advances the others and keeps image sizes and captions', () => {
  const gallery = [
    { src: 'one.png', tag: 'One', grid: { x: 1, y: 1, w: 5, h: 3 } },
    { src: 'two.png', tag: 'Two', grid: { x: 6, y: 1, w: 5, h: 4 } },
    { src: 'three.png', tag: 'Three', grid: { x: 1, y: 5, w: 5, h: 3 } },
  ];
  const before = plain(gallery);
  const result = plain(context.reorderGalleryGrid(gallery, 0, 2));
  assert.deepEqual(result.map(image => image.src), ['two.png', 'three.png', 'one.png']);
  assert.deepEqual(result.map(image => image.tag), ['Two', 'Three', 'One']);
  assert.deepEqual(result.map(image => image.grid), [
    { x: 1, y: 1, w: 5, h: 4 }, { x: 6, y: 1, w: 5, h: 3 }, { x: 1, y: 5, w: 5, h: 3 },
  ]);
  assert.deepEqual(gallery, before);
  assert.deepEqual(plain(context.reorderGalleryGrid(result, 2, 0)).map(image => image.src), ['one.png', 'two.png', 'three.png']);
});

test('drag targets allow insertion before and after images, including the final image', () => {
  const layout = [{ x: 1, y: 1, w: 5, h: 3 }, { x: 6, y: 1, w: 5, h: 3 }, { x: 1, y: 4, w: 5, h: 3 }];
  assert.equal(context.galleryGridDropIndex(layout, 0, { x: 5, y: 5 }), 2);
  assert.equal(context.galleryGridDropIndex(layout, 2, { x: 1, y: 2 }), 0);
  assert.equal(context.galleryGridDropIndex(layout, 0, { x: 7, y: 2 }), 0);
  assert.equal(context.galleryGridDropIndex(layout, 0, { x: 10, y: 2 }), 1);
});

test('packing mixed sizes after resize or removal stays within bounds without overlaps or order changes', () => {
  const gallery = [12, 3, 4, 5, 7, 2].map((w, i) => ({ src: `${i}.png`, grid: { w, h: i + 1 } }));
  const result = context.packGalleryGrid(gallery);
  assert.deepEqual(plain(result.map(image => image.src)), gallery.map(image => image.src));
  const layout = result.map(image => image.grid);
  for (let i = 0; i < layout.length; i++) {
    assert.ok(layout[i].x >= 1 && layout[i].x + layout[i].w <= 13);
    for (let j = i + 1; j < layout.length; j++) assert.equal(context.galleryGridOverlaps(layout[i], layout[j]), false);
  }
  assert.equal(context.reorderGalleryGrid(gallery, -1, 2), gallery);
  assert.equal(context.reorderGalleryGrid(gallery, 2, 2), gallery);
});


test('automatic compaction closes holes after moving, shrinking or removing an image', () => {
  const gallery = [
    {src:'wide',grid:{x:1,y:3,w:12,h:3}},
    {src:'left',grid:{x:1,y:9,w:4,h:6}},
    {src:'right',grid:{x:5,y:10,w:4,h:4}},
    {src:'below',grid:{x:5,y:20,w:4,h:2}},
  ];
  const before=plain(gallery);
  const layout=plain(context.compactProjectGalleryLayout(gallery));
  assert.deepEqual(layout.map(box=>box.y),[1,4,4,8]);
  assert.deepEqual(layout.map(({x,w,h})=>({x,w,h})),gallery.map(({grid:{x,w,h}})=>({x,w,h})));
  assert.deepEqual(plain(context.compactProjectGalleryLayout(gallery.map((image,i)=>({...image,grid:layout[i]})))),layout);
  const removed=context.compactProjectGalleryLayout(gallery.slice(1));
  assert.deepEqual(plain(removed.map(box=>box.y)),[1,1,5]);
  const shrunk=context.compactProjectGalleryLayout([{...gallery[0],grid:{...gallery[0].grid,h:1.5}},...gallery.slice(1)]);
  assert.deepEqual(plain(shrunk.map(box=>box.y)),[1,2.5,2.5,6.5]);
  for(let i=0;i<layout.length;i++) for(let j=i+1;j<layout.length;j++) assert.equal(context.galleryGridOverlaps(layout[i],layout[j]),false);
  assert.deepEqual(gallery,before);
});

test('gallery spacing is bounded, preserves zero and survives project normalization', () => {
  assert.equal(context.projectGalleryGap({}),0.6);
  assert.equal(context.projectGalleryGap({galleryGap:null}),0.6);
  assert.equal(context.projectGalleryGap({galleryGap:0}),0);
  assert.equal(context.projectGalleryGap({galleryGap:20}),3);
  assert.equal(context.projectGalleryGap({galleryGap:-2}),0);
  assert.equal(context.projectGalleryGap({galleryGap:NaN}),0.6);
  const saved=context.normaliseProject(plain({id:'spacing',galleryGap:1.2,gallery:[]}),0);
  assert.equal(context.projectGalleryGap(saved),1.2);
});


test('actual media frames preserve natural aspect ratio at every gap and viewport width', () => {
  for (const ratio of [16 / 9, 2 / 3, 1, 4]) for (const gap of [0, .6, 3]) {
    for (const w of [3, 4.1, 6, 12]) for (const width of [540, 976, 1440]) {
      const box = context.galleryImageBox({ x: 1, y: 1, w, h: 2 }, ratio, gap);
      const gutter = width * gap / 100, unit = (width + gutter) / 12;
      assert.ok(Math.abs((box.w * unit - gutter) / (box.h * unit - gutter) - ratio) < 1e-9);
    }
  }
});

test('horizontal, vertical and diagonal resize keep the original image proportions and metadata', () => {
  const ratio = 16 / 9, gap = 3;
  const first = context.galleryImageBox({ x: 1, y: 1, w: 6 }, ratio, gap);
  for (const delta of [[1, 0], [0, 1], [-1, -.5], [100, 100], [-100, -100]]) {
    const box = context.resizeGalleryImage(first, ...delta, ratio, gap);
    assert.ok(box.w >= 3 && box.w <= 12);
    const gutter = 12 * gap / (100 + gap);
    assert.ok(Math.abs((box.w - gutter) / (box.h - gutter) - ratio) < 1e-9);
  }
  const gallery = [{ src: 'a', tag: 'Caption', tag_gr: 'Λεζάντα', grid: first }];
  const updated = context.placeGalleryImage(gallery, 0, { ...first, w: 8 }, { a: ratio }, gap, true);
  assert.equal(updated[0].tag_gr, 'Λεζάντα');
  assert.equal(updated[0].tag, 'Caption');
  assert.equal(gallery[0].grid.w, 6);
});

test('intrinsic image layout compacts exact fractional heights without collisions after resizing or replacement', () => {
  const gallery = [
    { src: 'landscape', grid: { x: 1, y: 1, w: 6, h: 8 } },
    { src: 'portrait', grid: { x: 7, y: 1, w: 6, h: 8 } },
    { src: 'square', grid: { x: 1, y: 12, w: 6, h: 8 } },
  ];
  for (const ratios of [{ landscape: 16/9, portrait: 2/3, square: 1 }, { landscape: 2/3, portrait: 16/9, square: 1 }]) {
    const boxes = context.projectGalleryImageLayout(gallery, ratios, .6);
    assert.equal(boxes[2].y, boxes[0].y + boxes[0].h);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.equal(context.galleryImageOverlaps(boxes[i], boxes[j]), false);
    const saved = gallery.map((g, i) => ({ ...g, grid: boxes[i] }));
    assert.deepEqual(plain(context.projectGalleryImageLayout(saved, ratios, .6)), plain(boxes));
  }
});


test('empty image slots identify the open column between full-width images', () => {
  const layout = [{x:1,y:1,w:12,h:3}, {x:1,y:4,w:4,h:6}, {x:5,y:4,w:4,h:6}, {x:1,y:10,w:12,h:3}];
  const slots = context.galleryImageEmptySlots(layout);
  assert.deepEqual(plain(slots), [{x:9,y:4,w:4,h:6}]);
  for (const slot of slots) for (const box of layout) assert.equal(context.galleryImageOverlaps(slot,box), false);
  assert.deepEqual(plain(context.galleryImageEmptySlots([{x:1,y:1,w:12,h:4}])), []);
  assert.deepEqual(plain(context.galleryImageEmptySlots([])), [{x:1,y:1,w:12,h:4}]);
});

test('empty slots account for centered images and exclude narrow gutters', () => {
  const layout = [{x:1,y:1,w:4,h:6}];
  const slots = context.galleryImageEmptySlots(layout, 4);
  assert.deepEqual(plain(slots), [{x:1,y:1,w:4,h:6},{x:9,y:1,w:4,h:6}]);
  assert.deepEqual(plain(context.galleryImageEmptySlots([{x:1,y:1,w:12,h:3},{x:1,y:3.1,w:12,h:3}])), []);
});

test('inserting into an empty slot preserves existing photos and places the new image in that column', () => {
  const gallery = [{src:'wide', tag:'Original',grid:{x:1,y:1,w:12,h:3}}, {src:'tall',grid:{x:1,y:4,w:4,h:6}}, {src:'tall',grid:{x:5,y:4,w:4,h:6}}];
  const ratios = {wide:4,tall:2/3,new:1};
  const before = plain(gallery);
  const layout = context.projectGalleryImageLayout(gallery,ratios,0);
  const slot = context.galleryImageEmptySlots(layout)[0];
  const result = context.insertGalleryImageInSlot(gallery,{src:'new',tag:'New',tag_gr:'Νέα'},slot,ratios,0);
  assert.deepEqual(gallery,before);
  assert.equal(result[3].grid.x,9);
  assert.equal(result[3].grid.y,4);
  assert.equal(result[3].grid.w,4);
  assert.equal(result[3].tag_gr,'Νέα');
  assert.deepEqual(plain(result.slice(0,3)),before);
  const final = context.projectGalleryImageLayout(result,ratios,0);
  for(let i=0;i<final.length;i++) for(let j=i+1;j<final.length;j++) assert.equal(context.galleryImageOverlaps(final[i],final[j]),false);
});


test('insertion below a photo preserves fractional boundaries at nonzero spacing', () => {
  for (const gap of [.1, .6, 1.2, 3]) {
    const gallery = [
      {src:'one',grid:{x:1,y:1,w:6,h:4}},
      {src:'two',grid:{x:7,y:1,w:6,h:4}},
      {src:'three',grid:{x:1,y:5,w:6,h:4}},
    ];
    const ratios = {one:16/9,two:16/9,three:16/9,new:16/9};
    const before = context.projectGalleryImageLayout(gallery, ratios, gap);
    const slot = context.galleryImageEmptySlots(before)[0];
    const result = context.insertGalleryImageInSlot(gallery,{src:'new'},slot,ratios,gap);
    const after = context.projectGalleryImageLayout(result,ratios,gap);
    assert.deepEqual(plain(after.slice(0,3)),plain(before));
    assert.equal(after[3].x,slot.x);
    assert.equal(after[3].y,slot.y);
  }
});


test('auto layouts offer distinct compact arrangements without cropping or changing media metadata', () => {
  const gallery = [
    {src:'wide', tag:'Exterior', tag_gr:'Όψη',grid:{x:1,y:1,w:6,h:4}},
    {src:'portrait',tag:'Interior',grid:{x:7,y:10,w:4,h:6}},
    {src:'square',grid:{x:1,y:20,w:5,h:5}},
    {src:'other',grid:{x:7,y:30,w:4,h:5}},
  ];
  const before = plain(gallery), ratios = {wide:16/9,portrait:2/3,square:1,other:4/3};
  for (const gap of [0,.6,3]) {
    const candidates = context.galleryAutoLayouts(gallery,ratios,gap);
    assert.ok(candidates.length > 5);
    assert.equal(new Set(candidates.map(item=>item.signature)).size,candidates.length);
    assert.ok(candidates[0].waste < .02);
    for (let index=0;index<candidates.length;index++) {
      const candidate = candidates[index];
      if(index) assert.ok(candidate.waste >= candidates[index-1].waste);
      const gutter = 12*gap/(100+gap);
      candidate.layout.forEach((box,i)=>{
        assert.ok(box.x >= 1 && box.x+box.w <= 13+1e-7);
        assert.ok(Math.abs((box.w-gutter)/(box.h-gutter)-ratios[gallery[i].src])<1e-7);
        for(let j=i+1;j<candidate.layout.length;j++) assert.equal(context.galleryImageOverlaps(box,candidate.layout[j]),false);
      });
      const applied = gallery.map((image,i)=>({...image,grid:candidate.layout[i]}));
      assert.equal(context.galleryLayoutSignature(context.projectGalleryImageLayout(applied,ratios,gap)),candidate.signature);
    }
  }
  assert.deepEqual(gallery,before);
  assert.deepEqual(plain(context.galleryAutoLayouts([],ratios)),[]);
  assert.deepEqual(plain(context.galleryAutoLayouts(gallery.slice(0,1),ratios)),[]);
});
