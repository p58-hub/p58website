import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { geocodeResults } from '../../api/geocode.js';
import { createToken } from '../../api/_auth.js';

const feature = {geometry:{type:'Point',coordinates:[23.73,37.98]},properties:{street:'Ακαδημίας',housenumber:'76',city:'Αθήνα',country:'Ελλάδα'}};
test('address results preserve Greek labels, correct coordinate order and approximate accuracy', () => {
  const results = geocodeResults({features:[feature,{...feature,properties:{name:'Athens'}},{...feature,geometry:{type:'Point',coordinates:[null,37]}},{...feature,geometry:{type:'Point',coordinates:[23,91]}}]});
  assert.equal(results.length,2);
  assert.equal(results[0].lat,37.98);
  assert.equal(results[0].lng,23.73);
  assert.match(results[0].label,/Ακαδημίας 76/);
  assert.equal(results[0].approximate,false);
  assert.equal(results[1].approximate,true);
  assert.deepEqual(geocodeResults({features:[]}),[]);
  assert.throws(() => geocodeResults({}));
});

test('geocoding requires login, validates addresses, caches searches and handles provider errors', async t => {
  process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  const cookie = 'p58_session=' + createToken({u:'test',role:'admin'},60);
  let time = Date.now(), calls = 0, fail = false;
  t.mock.method(Date,'now',() => time);
  t.mock.method(globalThis,'fetch',async url => {
    calls++;
    assert.equal(url.hostname,'photon.komoot.io');
    assert.equal(url.searchParams.get('limit'),'5');
    return {ok:!fail,json:async () => ({features:[feature]})};
  });
  const call = async (address,auth=true,method='POST') => {
    const res = {headers:{},setHeader(k,v){this.headers[k]=v;},end(value){this.body=JSON.parse(value);}};
    await handler({method,headers:auth?{cookie}:{},body:{address}},res);
    return res;
  };
  assert.equal((await call('Ακαδημίας 76',false)).statusCode,401);
  assert.equal((await call('Ακαδημίας 76',true,'GET')).statusCode,405);
  assert.equal((await call('')).statusCode,400);
  assert.equal((await call('x'.repeat(401))).statusCode,400);
  assert.equal(calls,0);
  assert.equal((await call('Ακαδημίας 76')).statusCode,200);
  assert.equal((await call('Ακαδημίας 76')).statusCode,200);
  assert.equal(calls,1);
  assert.equal((await call('Another street')).statusCode,429);
  time+=1001; fail=true;
  assert.equal((await call('Another street')).statusCode,502);
  time+=1001; fail=false;
  assert.equal((await call('Another street')).statusCode,200);
});
