import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const declarations = (file, names) => {
  const source = fs.readFileSync(file, 'utf8');
  return parse(source, { sourceType: 'script', plugins: ['jsx'] }).program.body
    .filter(node => names.includes(node.id?.name) || node.declarations?.some(item => names.includes(item.id.name)))
    .map(node => source.slice(node.start, node.end)).join('\n');
};
function normaliser(file) {
  const ctx = vm.createContext({
    DEFAULT_CATEGORIES: [{id:'retail',label:'Retail'}],
    slugifyId: value => value, slugifyCategoryId: value => value, newId: () => 'new',
    normaliseSubcategories: value => value || [], normaliseCategorySubs: value => value || [],
  });
  vm.runInContext(declarations(file, ['normaliseCategories']) + '\nthis.normalise = normaliseCategories;', ctx);
  return ctx.normalise;
}
for (const file of ['dashboard.jsx', 'data.jsx']) {
  test(`${file}: removing the final category survives reload without resurrecting defaults`, () => {
    const normalise = normaliser(file);
    const saved = normalise([{id:'custom',label:'Custom'}]).filter(category => category.id !== 'custom');
    assert.equal(normalise(JSON.parse(JSON.stringify(saved))).length, 0);
    assert.equal(normalise(undefined)[0].id, 'retail');
  });
}
test('category additions, removal, labels and ordering survive dashboard/public round trips', () => {
  const dashboard = normaliser('dashboard.jsx'), publicSite = normaliser('data.jsx');
  const saved = dashboard([{id:'retail',label:'Retail',order:2}, {id:'custom',label:'Custom',label_gr:'Νέα κατηγορία',order:0}]);
  const published = publicSite(JSON.parse(JSON.stringify(saved)));
  assert.equal(published[0].id, 'custom');
  assert.equal(published[0].label_gr, 'Νέα κατηγορία');
  const afterRemoval = publicSite(dashboard(published.filter(category => category.id !== 'retail')));
  assert.equal(afterRemoval.length, 1);
  assert.equal(afterRemoval[0].id, 'custom');
});
