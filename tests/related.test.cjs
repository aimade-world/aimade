const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8').split('applyLang();restoreDraft();')[0];
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const work = {id:id(1), category:'prompt', title:'Current'};
const other = {id:id(2), category:'prompt', title:'Related', owner_name:'Creator'};
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve}}

function harness(responses = []) {
  const elements = new Map(), calls = [], timers = new Map();
  let now = 100000, timerId = 0;
  function el(key) {
    if(!elements.has(key)) elements.set(key,{value:'',textContent:'',innerHTML:'',hidden:true,disabled:false,checked:false,files:[],style:{},dataset:{},
      addEventListener(){},setAttribute(){},getAttribute(){return ''},removeAttribute(){},classList:{add(){},remove(){},contains(){return false}},querySelector(){return el('button')},reset(){},focus(){},showModal(){},close(){},scrollIntoView(){}});
    return elements.get(key);
  }
  class TestDate extends Date {static now(){return now}}
  const context=vm.createContext({console,URL,URLSearchParams,AbortController,Set,Map,Date:TestDate,
    setTimeout(fn,ms){const key=++timerId;timers.set(key,{fn,ms});return key},clearTimeout(key){timers.delete(key)},
    localStorage:{getItem(){return null},setItem(){},removeItem(){}},
    document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener(){},documentElement:{},title:''},
    window:{addEventListener(){},scrollTo(){}},location:{hash:'#home',origin:'https://aimade.world',search:'',pathname:'/'},navigator:{},history:{replaceState(){}},confirm:()=>false});
  vm.runInContext(source,context);
  context.mock={from(table){
    const call={table,filters:[],orders:[]};calls.push(call);
    return {select(columns){call.columns=columns;return this},eq(...args){call.filters.push(['eq',...args]);return this},neq(...args){call.filters.push(['neq',...args]);return this},order(...args){call.orders.push(args);return this},range(...args){call.range=args;return this},
      abortSignal(signal){call.signal=signal;const response=responses.shift();return typeof response==='function'?response(signal):Promise.resolve(response||{data:[],error:null})}};
  }};
  context.fixture=work;
  const run=s=>vm.runInContext(s,context);
  run("sb=mock;mode='detail';detailSeq=1;detailWork=fixture");
  return {run,context,calls,el,responses,timers,advance(ms){now+=ms},fire(ms){for(const [key,t] of [...timers])if(t.ms===ms){timers.delete(key);t.fn()}},load(){return run('loadRelated(fixture,detailSeq)')}};
}

test('Related query reads only five display fields, public rows and three other IDs',async()=>{
  const h=harness([{data:[other]}]);await h.load();
  assert.equal(h.calls.length,1);const q=h.calls[0];
  assert.equal(q.table,'work_catalog');assert.equal(q.columns,'id,title,category,owner_name,cover_url');
  assert.deepEqual(q.filters,[['eq','archived',false],['neq','id',work.id],['eq','category','prompt']]);
  assert.deepEqual(q.range,[0,2]);assert.equal(q.orders.map(x=>x[0]).join(','),'likes_count,created_at,id');
  assert.equal(h.run('detailRelated.length'),1);assert.equal(h.el('related').hidden,false);
});
test('Related fallback runs at most once and retains visibility and self-exclusion filters',async()=>{
  const h=harness([{data:[]},{data:[other]}]);await h.load();assert.equal(h.calls.length,2);
  assert.deepEqual(h.calls[1].filters,[['eq','archived',false],['neq','id',work.id]]);assert.deepEqual(h.calls[1].range,[0,2]);
});
test('A partial same-category result keeps the existing ranking behaviour without a second query',async()=>{
  const h=harness([{data:[other]}]);await h.load();assert.equal(h.calls.length,1);
});
test('Related results retain defensive UUID/self filtering and the three-card cap',async()=>{
  const h=harness([{data:[work,{id:'bad'},other,{...other,id:id(3)},{...other,id:id(4)},{...other,id:id(5)}]}]);await h.load();
  assert.equal(h.run('detailRelated.length'),3);assert.equal(h.run('detailRelated.some(x=>x.id===fixture.id)'),false);
});
test('Related HTML escapes title and creator and rejects foreign cover hosts',async()=>{
  const h=harness([{data:[{...other,title:'<img onerror="bad()">',owner_name:'<script>bad()</script>',cover_url:'https://evil.invalid/image.png'}]}]);await h.load();
  const html=h.el('related').innerHTML;assert(html.includes('&lt;img'));assert(!html.includes('<script>'));assert(!html.includes('evil.invalid'));
});
test('Reopening the same work uses the in-memory cache until the 30-second TTL expires',async()=>{
  const h=harness([{data:[other]},{data:[{...other,title:'Fresh'}]}]);await h.load();h.advance(29999);await h.load();assert.equal(h.calls.length,1);
  h.advance(1);await h.load();assert.equal(h.calls.length,2);assert(h.el('related').innerHTML.includes('Fresh'));
});
test('Empty results are cached but remain hidden',async()=>{
  const h=harness([{data:[]},{data:[]}]);await h.load();await h.load();assert.equal(h.calls.length,2);assert.equal(h.el('related').hidden,true);
});
test('Failures are not cached and a later deliberate visit can retry',async()=>{
  const h=harness([{error:new Error('offline')},{data:[other]}]);await h.load();assert.equal(h.run('relatedCache.size'),0);await h.load();assert.equal(h.calls.length,2);assert.equal(h.el('related').hidden,false);
});
test('Related memory cache is bounded to 24 entries',async()=>{
  const h=harness(Array.from({length:25},()=>({data:[other]})));
  for(let n=10;n<35;n++){h.context.fixture={...work,id:id(n)};h.run('detailWork=fixture;++detailSeq');await h.load()}
  assert.equal(h.run('relatedCache.size'),24);
});
test('Stale detail sequences do not start a request',async()=>{
  const h=harness();await h.run('loadRelated(fixture,0)');assert.equal(h.calls.length,0);
});
test('Leaving a work aborts its request and suppresses fallback, cache and rendering',async()=>{
  const d=deferred(),h=harness([()=>d.promise]);const pending=h.load();h.run("cancelRelated();mode='home'");
  assert.equal(h.calls[0].signal.aborted,true);d.resolve({data:[]});await pending;
  assert.equal(h.calls.length,1);assert.equal(h.run('relatedCache.size'),0);assert.equal(h.el('related').innerHTML,'');assert.equal(h.timers.size,0);
});
test('Route changes cancel optional related requests',async()=>{
  const d=deferred(),h=harness([()=>d.promise]);const pending=h.load();h.run("location.hash='#guide';route()");
  assert.equal(h.calls[0].signal.aborted,true);d.resolve({data:[other]});await pending;assert.equal(h.el('related').innerHTML,'');
});
test('The 15-second budget aborts the whole recommendation operation, with no fallback',async()=>{
  const d=deferred(),h=harness([()=>d.promise]);const pending=h.load();h.fire(15000);
  assert.equal(h.calls[0].signal.aborted,true);d.resolve({data:[]});await pending;assert.equal(h.calls.length,1);assert.equal(h.run('relatedCache.size'),0);
});
test('Replacing a request cannot let its late response replace the new work',async()=>{
  const d=deferred(),h=harness([()=>d.promise,{data:[{...other,title:'New page'}]}]);const old=h.load();
  h.context.fixture={...work,id:id(3)};h.run('detailWork=fixture;++detailSeq');await h.load();
  assert.equal(h.calls[0].signal.aborted,true);d.resolve({data:[{...other,title:'Old page'}]});await old;
  assert(h.el('related').innerHTML.includes('New page'));assert(!h.el('related').innerHTML.includes('Old page'));
});
test('Account scope changes cannot consume the previous scope cache',async()=>{
  const h=harness([{data:[other]},{data:[other]}]);await h.load();h.run(`user={id:'${id(90)}'}`);await h.load();assert.equal(h.calls.length,2);
});
test('An account switch during a request prevents rendering and caching the old result',async()=>{
  const d=deferred(),h=harness([()=>d.promise]);const pending=h.load();h.run(`user={id:'${id(90)}'}`);d.resolve({data:[other]});await pending;
  assert.equal(h.el('related').innerHTML,'');assert.equal(h.run('relatedCache.size'),0);
});
test('Changing the actual signed-in account clears optional recommendation state',async()=>{
  const h=harness([{data:[other]}]);await h.load();h.run(`user={id:'${id(90)}'};loadWorks=async()=>{};mode='home'`);await h.run('refreshUser(null)');assert.equal(h.run('relatedCache.size'),0);assert.equal(h.run('detailRelated.length'),0);
});
test('Narrow layout gives controls a full row without an overflow-hiding workaround',()=>{
  const css=fs.readFileSync(path.join(__dirname,'../assets/app.css'),'utf8');
  assert.match(css,/@media\(max-width:360px\)\{\s*\.card\{grid-template-areas:"cover body" "foot foot"/);
  assert.match(css,/\.card-footer\{display:flex;flex-wrap:wrap;/);assert(!/overflow-x\s*:\s*hidden/.test(css));
});
