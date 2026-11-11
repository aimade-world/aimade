const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const WORK = '3517bbf5-6468-4e23-8eaa-aa02e228c7b4';
const OWNER = '6e3ccb94-b4f1-4906-88c7-3dcdb8a5085e';
const SB = 'https://ulntmokjyvbxmkdejagt.supabase.co';
const fullSource = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8');
const source = fullSource.split('applyLang();restoreDraft();')[0];
const initDefinition = fullSource.slice(fullSource.indexOf('async function init(){'),fullSource.lastIndexOf('\ninit();'));

function harness(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k,v]) => [k,JSON.stringify(v)]));
  const elements = new Map(), timers = new Map(), documentEvents = new Map();
  let now = 1793678000000, timerId = 0, failWrites = false;
  function el(id) {
    if (elements.has(id)) return elements.get(id);
    let value = '';
    const classes = new Set();
    const listeners = {};
    const node = {id,textContent:'',innerHTML:'',hidden:false,disabled:false,checked:false,files:[],style:{},dataset:{},attrs:{},
      addEventListener(k,fn){(listeners[k]??=[]).push(fn)},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]},
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k){classes.has(k)?classes.delete(k):classes.add(k)}},
      querySelector(){return el('button')},focus(){},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false;for(const fn of listeners.close||[])fn()},
      checkValidity(){return id!=='email'||value.includes('@')},reportValidity(){return this.checkValidity()},
      reset(){if(id==='workForm'){for(const field of ['category','access','link','title','description','prompt','displayName','tools','cover'])el(field).value='';for(const field of ['mobile','feedback','rights','removeCover'])el(field).checked=false}}
    };
    Object.defineProperty(node,'value',{get:()=>value,set:v=>{value=String(v);if(id==='cover'&&!value)node.files=[]}});
    elements.set(id,node);return node;
  }
  const location = {origin:'https://aimade.world',pathname:'/',search:'',_hash:'#home',assigned:null,assign(url){this.assigned=url},get hash(){return this._hash},set hash(v){this._hash=v?(v.startsWith('#')?v:'#'+v):''}};
  class TestURL extends URL {static createObjectURL(){return 'blob:test-cover'}static revokeObjectURL(){}}
  class TestDate extends Date {static now(){return now}}
  const context = vm.createContext({console:{warn(){},log(){},error(){}},URL:TestURL,URLSearchParams,AbortController,Set,Map,Date:TestDate,crypto,
    setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
    localStorage:{getItem:k=>store.get(k)??null,setItem(k,v){if(failWrites)throw Error('Quota');store.set(k,v)},removeItem(k){store.delete(k)}},
    document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener(type,fn){const handlers=documentEvents.get(type)||[];handlers.push(fn);documentEvents.set(type,handlers)},documentElement:{},title:''},
    window:{addEventListener(){},scrollTo(){},AIMadeCaptcha:{ready:()=>true,takeToken:()=> 'mock-captcha-token',sync(){},clear(){}}},location,navigator:{},
    history:{replaceState(_,__,url){const u=new URL(url,location.origin);location.pathname=u.pathname;location.search=u.search;location.hash=u.hash}},confirm:()=>true
  });
  el('loginDone').hidden=true;
  vm.runInContext(source,context);
  return {context,el,store,location,click(target){for(const handler of documentEvents.get('click')||[])handler({target})},run:s=>vm.runInContext(s,context),advance:ms=>now+=ms,fireDelay(ms){const results=[];for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);results.push(timer.fn())}return Promise.all(results)},failWrites(){failWrites=true}};
}

// A tiny ancestor-selector fixture exercises the real document click handler.
// In the sidebar redesign HTML carries data-cat for CSS, but is not a control.
function clickNode(tag,dataset={},parent=null){return {tagName:tag.toUpperCase(),dataset,parentElement:parent,closest(selector){
  for(let node=this;node;node=node.parentElement){
    for(const part of selector.split(',').map(s=>s.trim())){
      if(part==='header'&&node.tagName==='HEADER')return node;
      const match=/^(button|a)?\[data-([a-z-]+)\]$/.exec(part);
      if(match&&(!match[1]||node.tagName===match[1].toUpperCase())&&Object.hasOwn(node.dataset,match[2].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())))return node;
    }
  }return null;
}}}
function actionTarget(action,extra={}){const root=clickNode('html',{cat:'all'}),button=clickNode('button',{action,id:WORK,...extra},root);return clickNode('span',{},button)}

for(const action of ['restore','trash'])test('Real delegated '+action+' click opens confirmation despite html data-cat',()=>{
  const h=harness(),a=moderationApi();moderator(h,a.client);h.run("activeCat='game'");h.click(actionTarget('admin-action',{kind:action}));
  assert.equal(h.el('moderationDialog').open,true);assert.equal(h.run('adminPending.action'),action);assert.equal(h.run('activeCat'),'game');assert.equal(a.calls.length,0);
});
for(const [action,expected] of [['like','like'],['save','save'],['copy-link','copy'],['copy-prompt','copy'],['retry','load'],['reset','reset'],['admin-retry','admin']])test('Delegated '+action+' does not become a root category click',()=>{
  const h=harness();h.context.observed=[];h.run("toggleLike=id=>observed.push('like');saveWork=id=>observed.push('save');copy=value=>observed.push('copy');loadWorks=()=>observed.push('load');resetFilters=()=>observed.push('reset');loadAdmin=()=>observed.push('admin');activeCat='game'");h.click(actionTarget(action));assert.deepEqual([...h.context.observed],[expected]);assert.equal(h.run('activeCat'),'game');
});
test('Delegated report click opens the report form instead of filtering',()=>{
  const h=harness();h.run(`user={id:'${OWNER}'}`);h.click(actionTarget('report'));assert.equal(h.el('reportDialog').open,true);assert.equal(h.run('reportId'),WORK);
});
test('Empty page space does not act like the html data-cat filter',()=>{
  const h=harness();h.context.observed=[];h.run("loadWorks=()=>observed.push('load');activeCat='game'");h.click(clickNode('div',{},clickNode('html',{cat:'all'})));assert.equal(h.run('activeCat'),'game');assert.equal(h.context.observed.length,0);
});
test('Mobile browse shortcut only scrolls to the catalogue without changing filters or writing',()=>{
  const h=harness();let target;h.el('discover').scrollIntoView=options=>{target=options.block};h.context.reloads=0;h.run("loadWorks=()=>{reloads++};activeCat='game'");h.click(actionTarget('browse-works'));assert.equal(target,'start');assert.equal(h.run('activeCat'),'game');assert.equal(h.context.reloads,0);
});
for(const tag of ['button','a'])test('Actual sidebar category '+tag+' still filters and routes home',()=>{
  const h=harness();h.run("mode='admin';activeCat='all'");h.location.hash='#admin';const root=clickNode('html',{cat:'all'}),header=clickNode('header',{},root),control=clickNode(tag,{cat:'game'},header);h.click(clickNode('svg',{},control));assert.equal(h.run('activeCat'),'game');assert.equal(h.location.hash,'#home');
});
test('Inline category buttons still load the selected category',()=>{
  const h=harness();h.context.observed=[];h.run("mode='home';loadWorks=()=>observed.push('load')");h.click(clickNode('button',{cat:'prompt'},clickNode('html',{cat:'all'})));assert.equal(h.run('activeCat'),'prompt');assert.deepEqual([...h.context.observed],['load']);
});

function api({work,writeError=null,roles}={}) {
  const stats = {uploads:0,writes:[],mail:0,logins:[],signups:[],resets:[],resends:[],updates:[],oauth:[]};
  const client = {
    auth:{
      async signInWithOtp(){stats.mail++;return {error:null}},
      async signInWithPassword(p){stats.logins.push(p);return {data:{session:{user:{id:OWNER}}},error:null}},
      async signUp(p){stats.signups.push(p);return {data:{session:null},error:null}},
      async resetPasswordForEmail(...p){stats.resets.push(p);return {error:null}},
      async resend(p){stats.resends.push(p);return {error:null}},
      async updateUser(p){stats.updates.push(p);return {data:{user:{id:OWNER}},error:null}},
      async getUser(){return {data:{user:{id:OWNER}},error:null}},
      async signInWithOAuth(p){stats.oauth.push(p);return {data:{url:SB+'/auth/v1/authorize?provider='+p.provider},error:null}}
    },
    storage:{from(){return {async upload(){stats.uploads++;return {error:null}},getPublicUrl:p=>({data:{publicUrl:SB+'/storage/v1/object/public/covers/'+p}})}}},
    from(table){let payload=null;const query={
      select(){return this},eq(){return this},maybeSingle(){return this},single(){return this},range(){return this},order(){return this},
      update(p){payload=p;stats.writes.push(p);return this},upsert(p){payload=p;stats.writes.push(p);return this},
      abortSignal(){
        if(table==='works')return Promise.resolve(payload?{data:{id:payload.id||WORK},error:typeof writeError==='function'?writeError():writeError}:{data:work||null,error:null});
        if(roles&&['likes','admins'].includes(table))return roles(table);
        return Promise.resolve({data:table==='work_catalog'?[]:null,error:null,count:0});
      }
    };return query}
  };
  return {client,stats};
}

function ready(h,client){h.context.client=client;h.run(`sb=client;user={id:'${OWNER}'};authReady=true;mode='upload';restoreDraft()`);h.location.hash='#upload'}
for(const [label,signedIn,admin,visible] of [['guest',false,false,false],['member',true,false,false],['admin',true,true,true],['signed-out stale role',false,true,false]])test('Admin navigation visibility: '+label,()=>{
  const h=harness();h.run(`user=${signedIn?`{id:'${OWNER}'}`:'null'};isAdmin=${admin};renderAuth()`);assert.equal(h.el('adminShortcut').hidden,!visible);
});
test('Switching from admin to ordinary account hides the management navigation item',()=>{
  const h=harness();h.run(`user={id:'${OWNER}'};isAdmin=true;renderAuth()`);assert.equal(h.el('adminShortcut').hidden,false);h.run("user={id:'other'};isAdmin=false;renderAuth()");assert.equal(h.el('adminShortcut').hidden,true);
});
function validForm(h){h.run("fillEditor({category:'prompt',title:'作品介紹助手',description:'將真實作品資料整理成介紹，先填寫作品用途及使用方法，再核對所有輸出內容是否符合事實。',prompt:'請只使用我提供的資料，不要捏造功能。',displayName:'AIMade Team',tools:'ChatGPT'})");h.el('rights').checked=true}

for(const title of ['a','中','12','１２','١٢','!!!',' 中 ','\u200b中\u200b'])test('Publication rejects weak title '+JSON.stringify(title),async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);h.el('title').value=title;
  await h.run('submitWork({preventDefault(){}})');assert.equal(a.stats.writes.length,0);assert.equal(a.stats.uploads,0);assert.equal(h.el('formStatus').textContent,h.run("t('titleQuality')"));
});
for(const title of ['中文','AI','遊戲2','１２遊戲','テスト','테스트','αβ'])test('Publication accepts letter-based title '+title,()=>{
  const h=harness();validForm(h);h.el('title').value=title;assert.equal(h.run('validateWork(draftData(),true)'),'');
});
test('Description minimum counts non-whitespace code points, not padding',()=>{
  const h=harness();validForm(h);for(const description of ['中'.repeat(29),'中'+' '.repeat(80),'中'+'\u200b'.repeat(80)]){h.el('description').value=description;assert.equal(h.run('validateWork(draftData(),true)'),'descriptionQuality')}
  h.el('description').value='中'.repeat(30);assert.equal(h.run('validateWork(draftData(),true)'),'');h.run('updateQualityHints()');assert(h.el('descriptionCount').textContent.includes('30'));
});
function moderationApi(result={data:{id:WORK},error:null}){
  const calls=[];
  return {calls,client:{from(table){const call={table,filters:[]};calls.push(call);return {select(...p){call.select=p;return this},update(p){call.payload=p;return this},delete(){call.delete=true;return this},eq(...p){call.filters.push(['eq',...p]);return this},neq(...p){call.filters.push(['neq',...p]);return this},is(...p){call.filters.push(['is',...p]);return this},or(...p){call.filters.push(['or',...p]);return this},order(){return this},range(...p){call.range=p;return this},maybeSingle(){return this},abortSignal(signal){call.signal=signal;return typeof result==='function'?result(call):Promise.resolve(result)}}}}};
}
function moderator(h,client,w={}){ready(h,client);h.context.w={id:WORK,owner:'00000000-0000-4000-8000-000000000099',title:'另一位作者的作品',category:'prompt',archived:true,moderation_status:'hidden',moderated_at:null,...w};h.run("isAdmin=true;adminRoleState='admin';mode='admin';adminRows=[w]");h.location.hash='#admin'}
const featuredWork={id:WORK,title:'公開作品',owner:OWNER,category:'prompt',details:{feedback:true},archived:false,moderation_status:'clear',likes_count:1};
function featuredHarness(responses){const h=harness(),a=moderationApi(()=>{const next=responses.shift();return typeof next==='function'?next():Promise.resolve(next||{data:[]})});ready(h,a.client);h.context.fixture=featuredWork;h.run("mode='home';user=null");return {...h,calls:a.calls}}
function seedFeatured(h){h.context.fixture=featuredWork;h.run('featured={pick:normalize(fixture),chosen:false,rows:[normalize(fixture)]};renderFeatured()')}
test('Featured reload removes a work that was unpublished after the first visit',async()=>{
  const h=featuredHarness([{data:[featuredWork]},{data:[]}]);await h.run('loadFeatured()');assert.equal(h.el('featured').hidden,false);await h.run('loadFeatured()');assert.equal(h.calls.length,2);assert.equal(h.el('featured').hidden,true);assert.equal(h.el('featured').innerHTML,'');
});
test('Featured reads publication flags, excludes moderation and keeps the forty-row bound',async()=>{
  const h=featuredHarness([{data:[featuredWork]}]);await h.run('loadFeatured()');const c=h.calls[0];assert(c.select[0].includes('archived'));assert(c.select[0].includes('moderation_status'));assert(c.filters.some(x=>x[1]==='archived'&&x[2]===false));assert(c.filters.some(x=>x[1]==='moderation_status'&&x[2]==='clear'));assert.deepEqual(c.range,[0,39]);
});
for(const patch of [{archived:true},{moderation_status:'hidden'},{moderation_status:'trash'},{archived:undefined}])test('Featured defensively rejects non-public row '+JSON.stringify(patch),async()=>{
  const h=featuredHarness([{data:[{...featuredWork,...patch}]}]);await h.run('loadFeatured()');assert.equal(h.el('featured').hidden,true);assert.equal(h.el('featured').innerHTML,'');
});
test('Configured archived pick is not displayed even if a moderator can read it',async()=>{
  const h=featuredHarness([{data:[]},{data:{...featuredWork,archived:true,moderation_status:'hidden'}}]);h.context.window.AIMadeFeatured={pick:{id:WORK}};h.run('isAdmin=true');await h.run('loadFeatured()');assert.equal(h.calls.length,2);assert(h.calls[1].filters.some(x=>x[1]==='archived'&&x[2]===false));assert(h.calls[1].filters.some(x=>x[1]==='moderation_status'&&x[2]==='clear'));assert.equal(h.el('featured').hidden,true);
});
test('Refresh hides cached featured content before the network completes and on error',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r)]);seedFeatured(h);const wait=h.run('loadFeatured()');assert.equal(h.el('featured').hidden,true);assert.equal(h.el('featured').innerHTML,'');resolve({error:{message:'offline'}});await wait;assert.equal(h.el('featured').hidden,true);
});
test('A late featured read cannot resurrect content after invalidation',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r)]),wait=h.run('loadFeatured()');h.run('clearFeatured()');assert.equal(h.calls[0].signal.aborted,true);resolve({data:[featuredWork]});await wait;assert.equal(h.run('featured'),null);assert.equal(h.el('featured').hidden,true);
});
test('An older featured request cannot replace a newer response',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r),{data:[]}]),old=h.run('loadFeatured()');await h.run('loadFeatured()');resolve({data:[featuredWork]});await old;assert.equal(h.calls[0].signal.aborted,true);assert.equal(h.el('featured').hidden,true);
});
test('A late featured result is discarded when the signed-in account changes',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r)]),wait=h.run('loadFeatured()');h.run("user={id:'new-account'}");resolve({data:[featuredWork]});await wait;assert.equal(h.run('featured'),null);
});
test('Leaving home cancels pending recommendations and does not start a fallback',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r)]);h.context.window.AIMadeFeatured={pick:{id:WORK}};const wait=h.run('loadFeatured()');h.location.hash='#guide';h.run('route()');resolve({data:[]});await wait;assert.equal(h.calls.length,1);assert.equal(h.el('featured').hidden,true);assert.equal(h.calls[0].signal.aborted,true);
});
test('Filtering does not query optional featured works; clearing filters does',async()=>{
  const h=featuredHarness([{data:[featuredWork]}]);h.run("activeCat='game'");await h.run('loadFeatured()');assert.equal(h.calls.length,0);h.run("activeCat='all'");await h.run('loadFeatured()');assert.equal(h.calls.length,1);
});
test('Featured requests share one fifteen-second abort budget',async()=>{
  let resolve;const h=featuredHarness([()=>new Promise(r=>resolve=r)]),wait=h.run('loadFeatured()');await h.fireDelay(15000);assert.equal(h.calls[0].signal.aborted,true);resolve({data:[featuredWork]});await wait;assert.equal(h.el('featured').hidden,true);
});
test('Home list refresh also revalidates featured works',async()=>{
  const h=featuredHarness([{data:[],count:0}]);h.context.callsToFeatured=0;h.run('loadFeatured=async()=>{callsToFeatured++}');await h.run('loadWorks()');assert.equal(h.context.callsToFeatured,1);
});
test('Renderer never includes a moderated shelf row',()=>{
  const h=featuredHarness([]);h.context.window.AIMadeFeatured={lists:[{title:['測試清單','Test list']}]};h.run(`featured={pick:normalize(fixture),chosen:false,rows:[normalize({...fixture,id:'00000000-0000-4000-8000-000000000099',title:'不可公開',archived:true,moderation_status:'hidden'})]};renderFeatured()`);assert(!h.el('featured').innerHTML.includes('不可公開'));
});
for(const action of ['hide','restore','trash','recover','delete'])test('Successful moderator '+action+' clears the featured snapshot',async()=>{
  const h=harness(),a=moderationApi(call=>Promise.resolve(call.table==='works'?{data:{id:WORK}}:{data:[],count:0}));moderator(h,a.client,{archived:action!=='hide',moderation_status:['recover','delete'].includes(action)?'trash':action==='hide'?'clear':'hidden'});seedFeatured(h);h.run(`openModeration('${WORK}','${action}')`);if(action==='delete')h.el('deleteConfirm').value=h.context.w.title;await h.run('submitModeration({preventDefault(){}})');assert.equal(h.run('featured'),null);assert.equal(h.el('featured').innerHTML,'');
});
test('Ordinary author unpublish clears the featured snapshot',async()=>{
  const h=harness(),a=api();ready(h,a.client);h.run(`mode='detail';detailWork={id:'${WORK}',owner:'${OWNER}',archived:false,moderation_status:'clear'};loadDetail=async()=>{}`);seedFeatured(h);await h.run(`archiveWork('${WORK}')`);assert.equal(h.run('featured'),null);
});
test('Publish or edit clears the featured snapshot',async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);seedFeatured(h);await h.run('submitWork({preventDefault(){}})');assert.equal(h.run('featured'),null);
});

test('Admin My works still queries only the signed-in owner and excludes Trash',async()=>{
  const a=moderationApi({data:[{id:WORK,owner:OWNER},{id:'00000000-0000-4000-8000-000000000099',owner:'other'}],count:2}),h=harness();moderator(h,a.client);h.run("mode='mine'");await h.run('loadWorks()');assert(a.calls[0].filters.some(x=>x[1]==='owner'&&x[2]===OWNER));assert(a.calls[0].filters.some(x=>x[1]==='moderation_status'&&x[2]==='trash'));assert.equal(h.run('works.length'),1);
});
test('Guests and ordinary members cannot load the moderator queue or open actions',async()=>{
  for(const member of [false,true]){const h=harness(),a=moderationApi();ready(h,a.client);h.run(`mode='admin';isAdmin=false;adminRoleState='member';${member?'':'user=null;'}`);await h.run('loadAdmin()');assert.equal(a.calls.length,0);await h.run(`openModeration('${WORK}','restore')`);assert.equal(h.run('adminPending'),null)}
});
test('Moderator queue loads archived works across owners with bounded pagination',async()=>{
  const h=harness(),a=moderationApi({data:[],count:0});moderator(h,a.client);await h.run('loadAdmin()');assert(!a.calls[0].filters.some(x=>x[1]==='owner'));assert(a.calls[0].filters.some(x=>x[1]==='archived'&&x[2]===true));assert.deepEqual(a.calls[0].range,[0,23]);
});
test('Moderator row escapes titles and only trash exposes permanent deletion',()=>{
  const h=harness();h.run("user={id:'x'}");const html=h.run(`adminRow({id:'${WORK}',title:'<img onerror="bad()">',owner_name:'<script>bad()</script>',archived:true,moderation_status:'hidden'})`);assert(!html.includes('<script>'));assert(html.includes('&lt;img'));assert(!html.includes('data-kind="delete"'));
});
test('Moderator republish only changes visibility fields with stale-state guards',async()=>{
  const h=harness(),a=moderationApi(call=>Promise.resolve(call.table==='works'?{data:{id:WORK}}:{data:[],count:0}));moderator(h,a.client);h.run(`openModeration('${WORK}','restore')`);await h.run('submitModeration({preventDefault(){}})');const c=a.calls[0];assert.deepEqual({...c.payload},{archived:false,moderation_status:'clear'});assert(c.filters.some(x=>x[1]==='id'&&x[2]===WORK));assert(c.filters.some(x=>x[1]==='title'));assert(c.filters.some(x=>x[1]==='moderated_at'));assert(!('owner'in c.payload));
});
test('Permanent deletion requires Trash and exact typed title',async()=>{
  const h=harness(),a=moderationApi();moderator(h,a.client);h.run(`openModeration('${WORK}','delete')`);assert.equal(h.run('adminPending'),null);h.run("adminRows[0].moderation_status='trash'");h.run(`openModeration('${WORK}','delete')`);await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);h.el('deleteConfirm').value='wrong';await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);
  h.el('deleteConfirm').value='另一位作者的作品';await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls[0].delete,true);assert(a.calls[0].filters.some(x=>x[1]==='moderation_status'&&x[2]==='trash'));
});
test('Stale moderation never claims success or automatically retries',async()=>{
  const h=harness(),a=moderationApi({data:null,error:null});moderator(h,a.client);h.run(`openModeration('${WORK}','restore')`);await h.run('submitModeration({preventDefault(){}})');assert.equal(h.run('adminPending'),null);assert.equal(h.el('moderationStatus').textContent,h.run("t('adminStale')"));await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,1);
});
test('Preview origins never mutate moderation data',async()=>{
  const h=harness(),a=moderationApi();moderator(h,a.client);h.location.origin='http://localhost:4182';h.run(`openModeration('${WORK}','restore')`);await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);
});
test('Authors cannot trigger restore on moderator-hidden works',async()=>{
  const h=harness(),a=api();ready(h,a.client);h.run(`detailWork={id:'${WORK}',owner:'${OWNER}',archived:true,moderation_status:'hidden'}`);await h.run(`archiveWork('${WORK}')`);assert.equal(a.stats.writes.length,0);
});
test('Late moderator list cannot render after leaving its route',async()=>{
  let finish;const h=harness(),a=moderationApi(()=>new Promise(r=>finish=r));moderator(h,a.client);const wait=h.run('loadAdmin()');h.run("location.hash='#guide';route()");finish({data:[h.context.w],count:1});await wait;assert.equal(h.el('adminList').innerHTML,'');
});

function detailActor(h,client,{admin=true,own=false,guest=false,archived=false,status='clear'}={}){
  moderator(h,client,{owner:own?OWNER:'00000000-0000-4000-8000-000000000099',archived,moderation_status:status,details:{},created_at:'2026-11-11T00:00:00Z'});
  h.run(`mode='detail';isAdmin=${admin};${guest?'user=null;':''}detailWork=normalize(w);renderDetail(detailWork)`);h.location.hash='#work/'+WORK;
}
for(const own of [false,true])test('Admin detail exposes one unpublish action on '+(own?'own':'another author’s')+' work',()=>{
  const h=harness();detailActor(h,moderationApi().client,{own});const html=h.el('detail').innerHTML;
  assert.equal((html.match(/data-kind="hide"/g)||[]).length,1);assert(!html.includes('data-action="archive"'));assert.equal(html.includes('#edit/'+WORK),own);
});
test('Ordinary author keeps the own-work unpublish control',()=>{
  const h=harness();detailActor(h,moderationApi().client,{admin:false,own:true});const html=h.el('detail').innerHTML;assert(html.includes('data-action="archive"'));assert(html.includes('#edit/'+WORK));assert(!html.includes('data-action="admin-action"'));
});
for(const guest of [false,true])test((guest?'Guest':'Other author')+' gets no detail management controls',()=>{
  const h=harness();detailActor(h,moderationApi().client,{admin:false,guest});const html=h.el('detail').innerHTML;assert(!html.includes('data-action="archive"'));assert(!html.includes('data-action="admin-action"'));assert(!html.includes('#edit/'+WORK));
});
for(const status of ['clear','hidden'])test('Admin can restore '+status+' archived work from detail',()=>{
  const h=harness();detailActor(h,moderationApi().client,{archived:true,status});const html=h.el('detail').innerHTML;assert(html.includes('data-kind="restore"'));assert(!html.includes('data-kind="hide"'));h.click(actionTarget('admin-action',{kind:'restore'}));assert.equal(h.el('moderationDialog').open,true);
});
for(const status of ['hidden','trash'])test('Moderator-'+status+' detail gives its ordinary owner no republish control',async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client,{admin:false,own:true,archived:true,status});const html=h.el('detail').innerHTML;assert(!html.includes('data-action="archive"'));assert(!html.includes('data-action="admin-action"'));await h.run(`archiveWork('${WORK}')`);assert.equal(a.calls.length,0);
});
test('Admin trash detail keeps deletion and recovery in the management page',()=>{
  const h=harness();detailActor(h,moderationApi().client,{archived:true,status:'trash'});const html=h.el('detail').innerHTML;assert(!html.includes('data-action="admin-action"'));assert(html.includes('href="#admin"'));
});
test('Actual detail unpublish click opens confirmation; cancellation writes nothing',async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client);h.click(actionTarget('admin-action',{kind:'hide'}));assert.equal(h.el('moderationDialog').open,true);assert.equal(h.el('moderationHeading').textContent,h.run("t('adminHide')"));assert.equal(h.el('moderationWorkTitle').textContent,h.context.w.title);assert.equal(a.calls.length,0);
  h.click(clickNode('button',{close:'moderationDialog'}));await h.run('submitModeration({preventDefault(){}})');assert.equal(h.el('moderationDialog').open,false);assert.equal(h.run('adminPending'),null);assert.equal(a.calls.length,0);
});
for(const action of ['hide','restore'])test('Confirmed detail '+action+' only changes visibility and reloads the same detail',async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client,{archived:action==='restore',status:action==='restore'?'hidden':'clear'});h.context.reloaded=[];h.run('loadDetail=async id=>reloaded.push(id)');h.click(actionTarget('admin-action',{kind:action}));await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,1);
  const c=a.calls[0];assert.equal(c.table,'works');assert.deepEqual({...c.payload},{archived:action==='hide',moderation_status:action==='hide'?'hidden':'clear'});assert.deepEqual(c.filters.map(x=>x[1]),['id','title','archived','moderation_status','moderated_at']);assert.deepEqual([...h.context.reloaded],[WORK]);assert.equal(h.el('moderationDialog').open,false);
});
test('Detail confirmation rejects a different work ID and non-detail routes',()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client);h.run("openModeration('00000000-0000-4000-8000-000000000099','hide')");assert.equal(h.run('adminPending'),null);h.run(`mode='mine';openModeration('${WORK}','hide')`);assert.equal(h.run('adminPending'),null);assert.equal(a.calls.length,0);
});
for(const action of ['trash','recover','delete'])test('Detail cannot invoke management-only '+action,()=>{
  const h=harness();detailActor(h,moderationApi().client,{archived:true,status:action==='trash'?'hidden':'trash'});h.run(`openModeration('${WORK}','${action}')`);assert.equal(h.run('adminPending'),null);
});
for(const change of ["mode='admin'","detailWork={...detailWork,id:'00000000-0000-4000-8000-000000000099'}","++detailSeq","isAdmin=false","user={id:'different'}"])test('Detail confirmation refuses stale context: '+change,async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client);h.click(actionTarget('admin-action',{kind:'hide'}));assert.equal(h.el('moderationDialog').open,true);h.run(change);await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);
});
test('Detail moderation remains blocked on a preview origin',async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client);h.location.origin='http://localhost:4183';h.click(actionTarget('admin-action',{kind:'hide'}));await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);
});
test('Detail moderation error never retries or refreshes as success',async()=>{
  const h=harness(),a=moderationApi({data:null,error:{message:'denied'}});detailActor(h,a.client);h.context.reloaded=[];h.run('loadDetail=async id=>reloaded.push(id)');h.click(actionTarget('admin-action',{kind:'hide'}));await h.run('submitModeration({preventDefault(){}})');assert.equal(h.el('moderationStatus').textContent,h.run("t('adminFail')"));assert.equal(h.run('adminPending'),null);await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,1);assert.equal(h.context.reloaded.length,0);
});
test('Navigating away dismisses an unsubmitted detail moderation dialog',async()=>{
  const h=harness(),a=moderationApi();detailActor(h,a.client);h.click(actionTarget('admin-action',{kind:'hide'}));h.location.hash='#guide';h.run('route()');assert.equal(h.el('moderationDialog').open,false);assert.equal(h.run('adminPending'),null);await h.run('submitModeration({preventDefault(){}})');assert.equal(a.calls.length,0);
});
test('Ordinary owner archive and restore retain owner-scoped writes',async()=>{
  for(const archived of [false,true]){const h=harness(),a=api();detailActor(h,a.client,{admin:false,own:true,archived});h.context.reloaded=[];h.run('loadDetail=async id=>reloaded.push(id)');await h.run(`archiveWork('${WORK}')`);assert.deepEqual({...a.stats.writes[0]},{archived:!archived});assert.deepEqual([...h.context.reloaded],[WORK]);}
});
test('Ordinary author cancelling unpublish does not write',async()=>{
  const h=harness(),a=api();detailActor(h,a.client,{admin:false,own:true});h.context.confirm=()=>false;await h.run(`archiveWork('${WORK}')`);assert.equal(a.stats.writes.length,0);
});

test('Legacy edit draft is preserved separately, not restored as a new creation',()=>{
  const h=harness({aimade_draft_v2:{editId:WORK,title:'尚未提交的修改',description:'保留此內容'}});
  h.run('restoreDraft();persistDrafts(drafts)');
  assert.equal(h.run('editId'),null);assert.equal(h.el('title').value,'');
  assert.equal(h.run(`legacyDrafts().edits['${WORK}'].title`),'尚未提交的修改');
  assert.equal(h.store.has('aimade_draft_v2'),true);
  assert.equal(h.el('editorContext').hidden,true); // Unowned legacy draft titles stay private until ownership is known.
});

test('New draft and each edit draft do not overwrite one another',()=>{
  const h=harness();h.run(`fillEditor({editId:'${WORK}',owner:'${OWNER}',title:'編輯草稿'});saveDraft(false);fillEditor({title:'新作品草稿'});saveDraft(false)`);
  const saved=JSON.parse(h.store.get('aimade_drafts_v4:guest'));
  assert.equal(saved.create.title,'新作品草稿');assert.equal(saved.edits[WORK].title,'編輯草稿');
});

test('Switching from edit to upload restores only the new draft',()=>{
  const h=harness();h.run(`fillEditor({title:'另一件新作品'});saveDraft(false);fillEditor({editId:'${WORK}',owner:'${OWNER}',title:'更新舊作品'});dirty=true;mode='upload'`);
  h.location.hash='#upload';h.run('route()');
  assert.equal(h.run('editId'),null);assert.equal(h.el('title').value,'另一件新作品');
  assert.equal(h.run(`drafts.edits['${WORK}'].title`),'更新舊作品');
});

test('Clearing an edit draft keeps the unrelated new draft',()=>{
  const h=harness();h.run(`fillEditor({title:'保留的新作品'});saveDraft(false);fillEditor({editId:'${WORK}',title:'可清除的修改'});saveDraft(false);discardCurrentDraft()`);
  assert.equal(h.run('drafts.create.title'),'保留的新作品');assert.equal(h.run(`drafts.edits['${WORK}']`),undefined);
});

test('Editor resets unspecified fields and never restores legal consent',()=>{
  const h=harness();h.el('description').value='原有資料';h.el('rights').checked=true;
  h.run("fillEditor({title:'新作品',rights:true})");
  assert.equal(h.el('description').value,'');assert.equal(h.el('rights').checked,false);
});

test('Storage failure blocks an editor switch rather than discarding unsaved input',()=>{
  const h=harness();h.run("fillEditor({title:'不可遺失'});dirty=true");h.failWrites();
  assert.equal(h.run('guardEditorChange()'),false);assert.equal(h.el('title').value,'不可遺失');
});

test('Malformed draft storage cannot inject an edit identifier',()=>{
  const h=harness({aimade_drafts_v3:{version:3,create:[],edits:{'javascript:evil()':{editId:'javascript:evil()'}},lastEdit:'javascript:evil()'}});
  h.run('restoreDraft()');assert.equal(h.run('drafts.lastEdit'),null);assert.equal(h.run('editId'),null);
});

test('Pending initial authentication does not display a spurious sign-in dialog',async()=>{
  const h=harness();h.location.hash='#edit/'+WORK;await h.run(`startEdit('${WORK}')`);
  assert.notEqual(h.el('loginDialog').open,true);assert.equal(h.el('workForm').hidden,true);
});

test('Only an owner-verified work can restore its saved edit draft',async()=>{
  const h=harness({aimade_drafts_v3:{version:3,create:null,edits:{[WORK]:{editId:WORK,owner:OWNER,title:'我的未提交修改'}},lastEdit:WORK}});
  const a=api({work:{id:WORK,owner:OWNER,title:'已發布名稱',category:'app',details:{}}});ready(h,a.client);h.location.hash='#edit/'+WORK;
  await h.run(`startEdit('${WORK}')`);assert.equal(h.el('title').value,'我的未提交修改');assert.equal(h.el('workForm').hidden,false);
});

test('A slow edit response cannot overwrite a different route',async()=>{
  const h=harness(),a=api();let resolve;
  const pending=new Promise(r=>resolve=r);a.client.from=table=>({select(){return this},eq(){return this},maybeSingle(){return this},abortSignal(){return pending}});
  ready(h,a.client);h.el('title').value='要保留的新草稿';h.location.hash='#edit/'+WORK;
  const request=h.run(`startEdit('${WORK}')`);h.location.hash='#home';h.run("mode='home';++editSeq");
  resolve({data:{id:WORK,owner:OWNER,title:'遲到的舊內容',details:{}},error:null});await request;
  assert.equal(h.el('title').value,'要保留的新草稿');assert.equal(h.run('editId'),null);
});

test('An inaccessible edit hides the publish form',async()=>{
  const h=harness(),a=api();ready(h,a.client);h.location.hash='#edit/'+WORK;
  await h.run(`startEdit('${WORK}')`);assert.equal(h.el('workForm').hidden,true);assert.equal(h.el('editorLoadStatus').textContent,'找不到這件作品');
});

test('Whitespace-only required text is rejected before file upload',async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);h.el('title').value='   ';h.el('cover').files=[{size:500,type:'image/png'}];
  await h.run('submitWork({preventDefault(){}})');assert.equal(a.stats.uploads,0);assert.equal(a.stats.writes.length,0);assert(h.el('formStatus').textContent.includes('不能只有空白'));
});

test('Missing sharing consent is never silently accepted by submission code',async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);h.el('rights').checked=false;
  await h.run('submitWork({preventDefault(){}})');assert.equal(a.stats.writes.length,0);assert(h.el('formStatus').textContent.includes('親自確認'));
});

test('Oversized prompt text and missing prompt are rejected',()=>{
  const h=harness();validForm(h);h.el('prompt').value='x'.repeat(6001);
  assert.equal(h.run('validateWork(draftData(),true)'),'fieldTooLong');h.el('prompt').value='  ';
  assert.equal(h.run('validateWork(draftData(),true)'),'needPrompt');
});

test('Database retry reuses its uploaded cover and pending creation ID',async()=>{
  let first=true;const a=api({writeError:()=>first?(first=false,{message:'Network failed'}):null}),h=harness();ready(h,a.client);validForm(h);
  h.el('cover').files=[{size:500,type:'image/png'}];
  await h.run('submitWork({preventDefault(){}})');const id=h.run('pendingId');
  assert.equal(a.stats.uploads,1);assert.equal(h.el('editorFields').disabled,false);assert(h.run('editingCover').includes('/covers/'));
  await h.run('submitWork({preventDefault(){}})');
  assert.equal(a.stats.uploads,1);assert.equal(a.stats.writes.length,2);assert.equal(a.stats.writes[0].id,id);assert.equal(a.stats.writes[1].id,id);assert.equal(h.run('pendingId'),null);
});

test('Reload after a failed database save retains the completed cover upload',async()=>{
  const a=api({writeError:{message:'Network failed'}}),h=harness();ready(h,a.client);validForm(h);h.el('cover').files=[{size:500,type:'image/png'}];
  await h.run('submitWork({preventDefault(){}})');
  const reloaded=harness({['aimade_drafts_v4:'+OWNER]:JSON.parse(h.store.get('aimade_drafts_v4:'+OWNER))}),retry=api();ready(reloaded,retry.client);reloaded.el('rights').checked=true;
  await reloaded.run('submitWork({preventDefault(){}})');
  assert.equal(retry.stats.uploads,0);assert.equal(retry.stats.writes.length,1);assert.equal(retry.stats.writes[0].cover_url,a.stats.writes[0].cover_url);
});

test('A slow cover upload releases the UI and retry reuses the same in-flight request',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r),a=api(),h=harness();
  a.client.storage.from=()=>({upload(){a.stats.uploads++;return pending},getPublicUrl:p=>({data:{publicUrl:SB+'/storage/v1/object/public/covers/'+p}})});
  ready(h,a.client);validForm(h);h.el('cover').files=[{size:500,type:'image/png'}];
  const first=h.run('submitWork({preventDefault(){}})');h.fireDelay(20000);await first;
  assert.equal(h.el('editorFields').disabled,false);assert.equal(a.stats.uploads,1);assert.equal(a.stats.writes.length,0);
  const retry=h.run('submitWork({preventDefault(){}})');resolve({error:null});await retry;
  assert.equal(a.stats.uploads,1);assert.equal(a.stats.writes.length,1);
});

function authReady(h,a,mode='signin'){
  h.context.client=a.client;h.run(`sb=client;user=null;authReady=true;setAuthMode('${mode}');openLogin()`);
  h.el('email').value='owner@example.com';
}
const MOCK_PASSWORD='mock-only-long-password-123';
function newPassword(h){h.el('password').value=MOCK_PASSWORD;h.el('passwordConfirm').value=MOCK_PASSWORD}
const submit=()=> 'submitAuth({preventDefault(){}})';

test('Password sign-in uses the password SDK, never a magic-link email',async()=>{
  const h=harness(),a=api();authReady(h,a);h.el('password').value=MOCK_PASSWORD;
  await h.run(submit());assert.equal(a.stats.logins.length,1);assert.equal(a.stats.mail,0);assert.equal(a.stats.resets.length,0);
  assert.equal(a.stats.logins[0].email,'owner@example.com');assert.equal(h.run('user.id'),OWNER);assert.equal(h.el('loginDialog').open,false);
  assert.equal(h.el('password').value,'');assert(![...h.store.values()].join('').includes(MOCK_PASSWORD));
});

test('Existing shorter passwords are not blocked by the new-password policy',async()=>{
  const h=harness(),a=api();authReady(h,a);h.el('password').value='old-short';
  await h.run(submit());assert.equal(a.stats.logins.length,1);
});

test('Wrong credentials show a safe, useful error and clear password inputs',async()=>{
  const h=harness(),a=api();a.client.auth.signInWithPassword=async()=>({error:{code:'invalid_credentials',message:'do not echo backend details'}});
  authReady(h,a);h.el('password').value=MOCK_PASSWORD;await h.run(submit());
  assert(h.el('loginStatus').textContent.includes('電郵或密碼不正確'));assert(!h.el('loginStatus').textContent.includes('backend'));
  assert.equal(h.el('password').value,'');assert.equal(h.el('authFields').disabled,false);
});

test('Registration requires the user’s own legal consent',async()=>{
  const h=harness(),a=api();authReady(h,a,'signup');newPassword(h);await h.run(submit());
  assert.equal(a.stats.signups.length,0);assert(h.el('loginStatus').textContent.includes('親自同意'));assert.equal(h.el('signupConsent').checked,false);
});

test('New-password length and confirmation are checked before registration',async()=>{
  const h=harness(),a=api();authReady(h,a,'signup');h.el('signupConsent').checked=true;
  h.el('password').value='short';h.el('passwordConfirm').value='short';await h.run(submit());assert(h.el('loginStatus').textContent.includes('12'));
  newPassword(h);h.el('passwordConfirm').value='different-long-password';await h.run(submit());assert(h.el('loginStatus').textContent.includes('不相同'));assert.equal(a.stats.signups.length,0);
});

test('Registration asks for email confirmation once and blocks immediate duplicate sends',async()=>{
  const h=harness(),a=api();authReady(h,a,'signup');newPassword(h);h.el('signupConsent').checked=true;await h.run(submit());
  assert.equal(a.stats.signups.length,1);assert.equal(a.stats.signups[0].options.emailRedirectTo,'https://aimade.world/');assert.equal(a.stats.mail,0);
  assert.equal(h.el('loginDone').hidden,false);assert.equal(h.el('loginSentEmail').textContent,'owner@example.com');assert.equal(h.el('resendLink').disabled,true);
  await h.run("requestAuthMail('signup','owner@example.com',true)");assert.equal(a.stats.resends.length,0);
  h.advance(61000);await h.run("requestAuthMail('signup','owner@example.com',true)");assert.equal(a.stats.resends.length,1);assert.equal(a.stats.resends[0].type,'signup');
  assert.equal(h.el('password').value,'');assert(![...h.store.values()].join('').includes(MOCK_PASSWORD));
});

test('Unverified email offers confirmation resend, not another passwordless sign-in',async()=>{
  const h=harness(),a=api();a.client.auth.signInWithPassword=async()=>({error:{code:'email_not_confirmed'}});authReady(h,a);h.el('password').value=MOCK_PASSWORD;
  await h.run(submit());assert.equal(h.run('authMail.kind'),'signup');assert(h.el('loginStatus').textContent.includes('驗證'));assert.equal(a.stats.mail,0);
});

test('Forgot / initial password setup reuses the account and does not reveal account existence',async()=>{
  const h=harness(),a=api();authReady(h,a,'forgot');await h.run(submit());await h.run(submit());
  assert.equal(a.stats.resets.length,1);assert.equal(a.stats.signups.length,0);assert.equal(a.stats.mail,0);
  assert.equal(a.stats.resets[0][1].redirectTo,'https://aimade.world/?auth=recovery');assert(h.el('loginSentHelp').textContent.includes('若此電郵已註冊'));
  assert(h.el('loginSentHelp').textContent.includes('另一裝置'));assert.equal(h.el('password').required,false);
});

test('Email rate limiting has a distinct message and resend cooldown',async()=>{
  const h=harness(),a=api();a.client.auth.resetPasswordForEmail=async()=>({error:{status:429,code:'over_email_send_rate_limit'}});
  authReady(h,a,'forgot');await h.run(submit());assert(h.el('loginStatus').textContent.includes('請求次數較多'));assert.equal(h.el('authSubmit').disabled,true);
});

test('A timed-out password sign-in releases controls without saving a password',async()=>{
  const h=harness(),a=api();a.client.auth.signInWithPassword=()=>new Promise(()=>{});authReady(h,a);h.el('password').value=MOCK_PASSWORD;
  const pending=h.run(submit());h.fireDelay(20000);await pending;
  assert(h.el('loginStatus').textContent.includes('尚未確認'));assert.equal(h.el('authFields').disabled,false);assert.equal(h.el('password').value,'');
});

test('Switching auth modes clears passwords and never restores agreement',()=>{
  const h=harness(),a=api();authReady(h,a,'signup');newPassword(h);h.el('signupConsent').checked=true;
  h.run("setAuthMode('signin')");assert.equal(h.el('password').value,'');assert.equal(h.el('passwordConfirm').value,'');assert.equal(h.el('signupConsent').checked,false);
  h.run("setAuthMode('forgot')");assert.equal(h.el('password').disabled,true);assert.equal(h.el('password').required,false);
});

test('Closing the dialog clears password fields and a visible password returns to masked',()=>{
  const h=harness(),a=api();authReady(h,a);newPassword(h);h.run("passwordVisible=true;$('password').type='text';$('loginDialog').close()");
  assert.equal(h.el('password').value,'');assert.equal(h.el('password').type,'password');
});

test('Password recovery verifies the session against Auth before allowing an update',async()=>{
  const h=harness(),a=api();authReady(h,a);h.location.search='?auth=recovery';h.run(`user={id:'${OWNER}'};recoveryActive=true`);
  await h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);assert.equal(h.run('recoveryVerified'),true);assert.equal(h.el('email').disabled,true);
  assert.equal(h.el('password').autocomplete,'new-password');assert.equal(h.el('authSubmit').disabled,false);
});

test('Recovery cannot update a password without the verified account',async()=>{
  const h=harness(),a=api();authReady(h,a);h.run("authMode='recovery';recoveryActive=true;recoveryVerified=false");newPassword(h);
  await h.run(submit());assert.equal(a.stats.updates.length,0);assert(h.el('loginStatus').textContent.includes('無效'));
});

test('Recovery rejects a mismatched / expired server identity',async()=>{
  const h=harness(),a=api();a.client.auth.getUser=async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}},error:null});
  authReady(h,a);h.run(`user={id:'${OWNER}'};recoveryActive=true`);h.location.search='?auth=recovery';
  await h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);assert.equal(h.run('recoveryVerified'),false);assert.equal(h.run('authMode'),'forgot');assert.equal(h.location.search,'');assert(h.el('loginStatus').textContent.includes('已過期'));
});

test('Password recovery preserves the existing UID, draft and safe return route',async()=>{
  const h=harness({aimade_auth_return_v3:'#upload',aimade_drafts_v3:{version:3,create:{owner:OWNER,title:'保留的草稿'},edits:{},lastEdit:null}}),a=api();authReady(h,a);
  h.run(`user={id:'${OWNER}'};restoreDraft();recoveryActive=true`);h.location.search='?auth=recovery';await h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);
  newPassword(h);await h.run(submit());assert.equal(a.stats.updates.length,1);assert.deepEqual(Object.keys(a.stats.updates[0]),['password']);assert.equal(a.stats.signups.length,0);
  assert.equal(h.run('user.id'),OWNER);assert.equal(h.location.search,'');assert.equal(h.location.hash,'#upload');assert.equal(h.el('loginDialog').open,false);assert.equal(h.run('drafts.create.title'),'保留的草稿');
  assert(![...h.store.values()].join('').includes(MOCK_PASSWORD));
});

test('Signing out during recovery invalidates a pending session verification',async()=>{
  const h=harness(),a=api();let resolve;const pending=new Promise(r=>resolve=r);a.client.auth.getUser=()=>pending;
  authReady(h,a);h.run(`user={id:'${OWNER}'};recoveryActive=true`);const request=h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);
  await h.run("handleAuthState('SIGNED_OUT',null)");resolve({data:{user:{id:OWNER}},error:null});await request;
  assert.equal(h.run('recoveryVerified'),false);assert.equal(h.run('user'),null);assert.equal(h.run('authMode'),'forgot');
});











test('Preview pages cannot submit real authentication requests',async()=>{
  const h=harness(),a=api();authReady(h,a);h.location.origin='http://127.0.0.1:4173';h.el('password').value=MOCK_PASSWORD;
  await h.run(submit());assert.equal(a.stats.logins.length,0);assert(h.el('loginStatus').textContent.includes('預覽頁'));
});

test('Auth callback token fragments are removed without exposing them as a return route',()=>{
  const h=harness();h.location.hash='#access_token=mock-secret&refresh_token=mock-refresh&type=recovery';h.location.search='?auth=recovery';
  h.run('cleanAuthUrl()');assert.equal(h.location.hash,'');assert.equal(h.location.search,'?auth=recovery');h.run('cleanAuthUrl(true)');assert.equal(h.location.search,'');
});

function initialAuth(h,a,session=null,error=null){
  a.client.auth.onAuthStateChange=()=>({});a.client.auth.getSession=async()=>({data:{session},error});
  h.context.window.supabase={createClient:()=>a.client};h.context.fetch=async()=>({ok:true,json:async()=>({external:{}})});h.run(initDefinition);
}

test('A recovery URL without a session opens a persistent, safe retry form',async()=>{
  const h=harness(),a=api();h.location.search='?auth=recovery';initialAuth(h,a);await h.run('init()');
  assert.equal(h.el('loginDialog').open,true);assert.equal(h.run('authMode'),'forgot');assert.equal(h.run('recoveryVerified'),false);assert(h.el('loginStatus').textContent.includes('已過期'));
});

test('Auth callback errors remain visible even when the SDK returns an error',async()=>{
  const h=harness(),a=api();h.location.hash='#error=access_denied&error_description=private-provider-detail';initialAuth(h,a,null,{code:'bad_oauth_callback'});await h.run('init()');
  assert.equal(h.location.hash,'');assert.equal(h.el('loginDialog').open,true);assert.equal(h.run('authMode'),'signin');assert(h.el('loginStatus').textContent.includes('登入未完成'));assert(!h.el('loginStatus').textContent.includes('private-provider-detail'));
});

test('A recovery callback does not get closed by ordinary session refresh',async()=>{
  const h=harness(),a=api();h.location.search='?auth=recovery';h.location.hash='#access_token=mock-secret&type=recovery';initialAuth(h,a,{user:{id:OWNER}});await h.run('init()');
  assert.equal(h.location.hash,'');assert.equal(h.el('loginDialog').open,true);assert.equal(h.run('authMode'),'recovery');assert.equal(h.run('recoveryVerified'),true);
});

test('Auth return routes cannot become external redirects or contain tokens',()=>{
  const h=harness();for(const route of ['https://evil.test/','#upload/extra','#access_token=secret','#edit/------------------------------------'])assert.equal(h.run(`validReturnHash(${JSON.stringify(route)})`),'#home');
  assert.equal(h.run("validReturnHash('#upload')"),'#upload');assert.equal(h.run(`validReturnHash('#edit/${WORK}')`),'#edit/'+WORK);
});

test('Slow old account metadata cannot restore privileges after sign-out',async()=>{
  let resolve;const p=new Promise(r=>resolve=r),h=harness(),a=api({roles:()=>p});h.context.client=a.client;h.run('sb=client');
  const request=h.run(`refreshUser({user:{id:'${OWNER}'}})`);await h.run('refreshUser(null)');resolve({data:[{work_id:WORK}],error:null});await request;
  assert.equal(h.run('user'),null);assert.equal(h.run('isAdmin'),false);assert.equal(h.run('likes.size'),0);
});

test('A late like response cannot change the next account’s like state',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r),h=harness();
  h.context.client={from:()=>({insert(){return this},abortSignal(){return pending}})};
  h.run(`sb=client;user={id:'${OWNER}'}`);const request=h.run(`toggleLike('${WORK}')`);
  h.run("user={id:'11111111-1111-4111-8111-111111111111'};likes=new Set()");resolve({error:null});await request;
  assert.equal(h.run('likes.size'),0);
});

test('Ordinary sign-out affects the current session, not every user device',async()=>{
  const h=harness(),a=api();let scope;a.client.auth.signOut=async options=>{scope=options.scope;return {error:null}};ready(h,a.client);
  await h.run('signOutCurrent()');assert.equal(scope,'local');assert.equal(h.run('user'),null);
});

test('Public authentication is email/password only, with no unconnected social buttons',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert(!html.includes('oauth-'));assert(!html.includes('socialAuth'));
  assert(!fullSource.includes('signInWithOAuth'));assert(!fullSource.includes('signInWithOtp'));
  assert(html.includes('autocomplete="current-password"'));assert(html.includes('id="passwordConfirm"'));
});

test('Obfuscated repeated signup is not presented as a new account or delivered email',async()=>{
  const h=harness(),a=api();a.client.auth.signUp=async()=>({data:{user:{identities:[]},session:null},error:null});
  authReady(h,a,'signup');newPassword(h);h.el('signupConsent').checked=true;await h.run(submit());
  assert.equal(h.el('loginSentTitle').textContent,'下一步：驗證或登入');assert(h.el('loginSentHelp').textContent.includes('不會透露'));
  assert(!h.el('loginSentTitle').textContent.includes('已寄'));assert.equal(h.run('user'),null);assert.equal(h.el('setupExistingPassword').hidden,false);assert.equal(a.stats.resets.length,0);
});

test('An already-registered signup error has the same private, actionable next steps',async()=>{
  const h=harness(),a=api();a.client.auth.signUp=async()=>({error:{code:'user_already_exists'}});
  authReady(h,a,'signup');newPassword(h);h.el('signupConsent').checked=true;await h.run(submit());
  assert.equal(h.el('loginDone').hidden,false);assert.equal(h.el('loginSentTitle').textContent,'下一步：驗證或登入');assert.equal(h.el('setupExistingPassword').hidden,false);
});

test('The existing-account action preserves email but never sends setup mail automatically',async()=>{
  const h=harness(),a=api();authReady(h,a,'signup');h.run("mailResult('signup','owner@example.com');openExistingPasswordSetup()");
  assert.equal(h.run('authMode'),'forgot');assert.equal(h.el('email').value,'owner@example.com');assert.equal(h.el('signupConsent').checked,false);assert.equal(a.stats.resets.length,0);
  h.advance(61000);await h.run(submit());assert.equal(a.stats.resets.length,1);
});

test('Legacy password-setup controls do not run while an auth request is pending',()=>{
  const h=harness(),a=api();authReady(h,a,'signup');h.run('authBusy=true;openExistingPasswordSetup()');assert.equal(h.run('authMode'),'signup');
});

test('A recovery broadcast signs the sender tab in without another password form',async()=>{
  const h=harness(),a=api();authReady(h,a,'forgot');
  h.run(`onAuthEvent('PASSWORD_RECOVERY',{user:{id:'${OWNER}'}})`);await h.fireDelay(0);
  assert.equal(h.run('user.id'),OWNER);assert.equal(h.run('recoveryActive'),false);assert.equal(h.el('loginDialog').open,false);
});

test('The actual recovery callback tab still verifies Auth before showing reset controls',async()=>{
  const h=harness(),a=api();authReady(h,a);h.run('recoveryCallbackTab=true');
  h.run(`onAuthEvent('PASSWORD_RECOVERY',{user:{id:'${OWNER}'}})`);await h.fireDelay(0);
  assert.equal(h.run('recoveryVerified'),true);assert.equal(h.run('authMode'),'recovery');assert.equal(h.el('loginDialog').open,true);
  newPassword(h);await h.run(submit());assert.equal(h.run('recoveryCallbackTab'),false);assert.equal(h.el('loginDialog').open,false);
});

test('Choosing a cover replaces the stale reselect warning without claiming server upload',async()=>{
  const h=harness(),a=api();ready(h,a.client);h.el('draftStatus').textContent='已還原文字草稿；尚未上傳的封面請重新選取。';h.el('cover').files=[{size:500,type:'image/png'}];
  await h.run('chooseCover()');assert.equal(a.stats.uploads,0);assert(h.el('draftStatus').textContent.includes('將於發布時上傳'));assert.equal(h.el('coverPreview').hidden,false);
});


test('A different account never sees the previous owner edit-draft title or link',()=>{
  const h=harness({aimade_drafts_v3:{version:3,create:null,edits:{[WORK]:{editId:WORK,owner:OWNER,title:'Private unfinished title'}},lastEdit:WORK}});
  h.run("user={id:'1ca75222-cd0f-49d0-b3e8-a52fd6e58f79'};renderEditorContext()");
  assert.equal(h.el('editorContext').hidden,true);assert.equal(h.el('editorContextText').textContent,'');assert.equal(h.el('editorContextAction').getAttribute('href'),'#upload');
  assert.equal(h.run(`legacyDrafts().edits['${WORK}'].title`),'Private unfinished title');
  h.run(`user={id:'${OWNER}'};renderEditorContext()`);
  assert.equal(h.el('editorContext').hidden,false);assert.equal(h.el('editorContextAction').getAttribute('href'),'#edit/'+WORK);
  h.run('user=null;renderEditorContext()');assert.equal(h.el('editorContextText').textContent,'');
});

test('Account identity is shown only in the signed-in workspace and cleared elsewhere',()=>{
  const h=harness();h.run(`user={id:'${OWNER}',email:'private@example.com'};mode='upload';adminRoleState='member';renderAuth()`);
  assert.equal(h.el('accountStatus').hidden,false);assert.equal(h.el('accountEmail').textContent,'private@example.com');assert.equal(h.el('accountRole').textContent,'普通會員');
  h.run("mode='detail';renderAccount()");assert.equal(h.el('accountStatus').hidden,true);assert.equal(h.el('accountEmail').textContent,'');
  h.run("mode='mine';user=null;renderAuth()");assert.equal(h.el('accountStatus').hidden,true);assert.equal(h.el('accountRole').textContent,'');
});

test('Only a matching admin UUID can label the authenticated workspace as admin',async()=>{
  const h=harness(),a=api({roles:table=>Promise.resolve({data:table==='admins'?{user_id:OWNER}:[],error:null})});h.context.client=a.client;h.run("sb=client;mode='upload'");
  await h.run(`refreshUser({user:{id:'${OWNER}',email:'admin@example.com'}})`);assert.equal(h.run('isAdmin'),true);assert.equal(h.el('accountRole').textContent,'管理員');
  await h.run("refreshUser({user:{id:'1ca75222-cd0f-49d0-b3e8-a52fd6e58f79',email:'member@example.com'}})");assert.equal(h.run('isAdmin'),false);assert.equal(h.el('accountRole').textContent,'普通會員');
});

test('An unavailable role query is not presented as confirmed membership',async()=>{
  const h=harness(),a=api({roles:()=>Promise.resolve({data:null,error:{message:'offline'}})});h.context.client=a.client;h.run("sb=client;mode='mine'");
  await h.run(`refreshUser({user:{id:'${OWNER}',email:'member@example.com'}})`);assert.equal(h.run('isAdmin'),false);assert.equal(h.el('accountRole').textContent,'暫時無法確認角色');
});

test('Prompt cards use a concrete content action and recent rankings state their scope',()=>{
  const h=harness();assert.match(h.run(`card(normalize({id:'${WORK}',title:'Prompt',category:'prompt'}),0)`),/查看 Prompt/);
  assert.equal(h.run("t('hot')"),'近 30 天新作 · 最多讚');
});
const MEMBER='1ca75222-cd0f-49d0-b3e8-a52fd6e58f79';
const newDrafts=(owner,title)=>({version:4,create:{owner,title,category:'prompt'},edits:{},lastEdit:null});

test('A new draft and public author name are isolated by account UUID',async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);h.el('title').value='Admin private draft';h.run('dirty=true;saveDraft(false)');
  h.store.set('aimade_display_v4:'+OWNER,JSON.stringify('Admin name'));
  await h.run(`refreshUser({user:{id:'${MEMBER}'}})`);
  assert.equal(h.el('title').value,'');assert.equal(h.el('displayName').value,'');assert.equal(h.run('pendingId'),null);
  h.el('title').value='Member private draft';h.run('dirty=true;saveDraft(false)');
  await h.run(`refreshUser({user:{id:'${OWNER}'}})`);
  assert.equal(h.el('title').value,'Admin private draft');
  assert.equal(JSON.parse(h.store.get('aimade_drafts_v4:'+MEMBER)).create.title,'Member private draft');
});
test('Signing out hides the account form and keeps guest and account drafts separate',async()=>{
  const h=harness({'aimade_drafts_v4:guest':newDrafts(null,'Guest note')}),a=api();ready(h,a.client);validForm(h);h.run('dirty=true;saveDraft(false)');
  await h.run('refreshUser(null)');assert.equal(h.el('title').value,'Guest note');assert.equal(h.el('rights').checked,false);
  await h.run(`refreshUser({user:{id:'${OWNER}'}})`);assert.equal(h.el('title').value,'作品介紹助手');
});
test('Legacy owned create migrates only to its owner and original data is retained',()=>{
  const legacy={version:3,create:{owner:OWNER,title:'Legacy admin'},edits:{},lastEdit:null};
  const h=harness({aimade_drafts_v3:legacy});h.run(`user={id:'${MEMBER}'};restoreDraft()`);assert.equal(h.el('title').value,'');
  h.run(`user={id:'${OWNER}'};restoreDraft()`);assert.equal(h.el('title').value,'Legacy admin');
  h.run('discardCurrentDraft();restoreDraft()');assert.equal(h.el('title').value,''); // no resurrection
  assert.deepEqual(JSON.parse(h.store.get('aimade_drafts_v3')),legacy);
});
test('Unattributed legacy create is preserved but never automatically assigned',()=>{
  const h=harness({aimade_draft_v2:{title:'Unknown owner'}});h.run('restoreDraft()');assert.equal(h.el('title').value,'');
  h.run(`user={id:'${OWNER}'};restoreDraft()`);assert.equal(h.el('title').value,'');assert.equal(JSON.parse(h.store.get('aimade_draft_v2')).title,'Unknown owner');
});
test('Anonymous legacy edit can be recovered only after server owner verification',async()=>{
  const h=harness({aimade_draft_v2:{editId:WORK,title:'Original legacy edit'}}),a=api({work:{id:WORK,owner:OWNER,title:'Published'}});ready(h,a.client);h.location.hash='#edit/'+WORK;
  await h.run(`startEdit('${WORK}')`);assert.equal(h.el('title').value,'Original legacy edit');assert.equal(h.run('editOwner'),OWNER);
});
test('Forged server edit ownership cannot restore a legacy draft',async()=>{
  const h=harness({aimade_draft_v2:{editId:WORK,title:'Never leak'}}),a=api({work:{id:WORK,owner:MEMBER,title:'Other'}});ready(h,a.client);h.location.hash='#edit/'+WORK;
  await h.run(`startEdit('${WORK}')`);assert.equal(h.el('workForm').hidden,true);assert.notEqual(h.el('title').value,'Never leak');
});
test('Switching accounts with blocked storage keeps old input only in scoped memory',async()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);h.run('dirty=true');h.failWrites();
  await h.run(`refreshUser({user:{id:'${MEMBER}'}})`);assert.equal(h.el('title').value,'');assert.equal(h.run(`unsavedScopes.get('${OWNER}').create.title`),'作品介紹助手');
  await h.run(`refreshUser({user:{id:'${OWNER}'}})`);assert.equal(h.el('title').value,'作品介紹助手');
});
test('A same-account save merges latest unrelated edit data from another tab',()=>{
  const h=harness(),a=api();ready(h,a.client);validForm(h);
  h.store.set('aimade_drafts_v4:'+OWNER,JSON.stringify({version:4,create:null,edits:{[WORK]:{editId:WORK,owner:OWNER,title:'Other tab edit'}},lastEdit:WORK}));
  h.run('saveDraft(false)');assert.equal(JSON.parse(h.store.get('aimade_drafts_v4:'+OWNER)).edits[WORK].title,'Other tab edit');
});
test('Delayed cover upload cannot attach old account cover to a new account draft',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r),h=harness(),a=api();
  a.client.storage.from=()=>({upload(){return pending},getPublicUrl:p=>({data:{publicUrl:SB+'/storage/v1/object/public/covers/'+p}})});
  ready(h,a.client);validForm(h);h.el('cover').files=[{size:100,type:'image/png'}];const request=h.run('submitWork({preventDefault(){}})');
  await h.run(`refreshUser({user:{id:'${MEMBER}'}})`);h.el('title').value='Member in progress';h.run('dirty=true;saveDraft(false)');resolve({error:null});await request;
  assert.equal(a.stats.writes.length,0);assert.equal(h.el('title').value,'Member in progress');assert.equal(h.run('editingCover'),'');assert.equal(h.run('pendingId'),null);
});
test('Delayed database response cannot clear the next account draft',async()=>{
  let resolve;const pending=new Promise(r=>resolve=r),h=harness(),a=api();ready(h,a.client);validForm(h);
  const original=a.client.from;a.client.from=table=>{if(table!=='works')return original(table);return {upsert(){return this},select(){return this},single(){return this},abortSignal(){return pending}}};
  const request=h.run('submitWork({preventDefault(){}})');await h.run(`refreshUser({user:{id:'${MEMBER}'}})`);h.el('title').value='Member survives';h.run('dirty=true;saveDraft(false)');
  resolve({data:{id:WORK},error:null});await request;assert.equal(h.el('title').value,'Member survives');assert.equal(h.location.hash,'#upload');assert.equal(JSON.parse(h.store.get('aimade_drafts_v4:'+MEMBER)).create.title,'Member survives');
});
test('Cleared legacy edits never reappear when the owner reopens the work',async()=>{
 const h=harness({aimade_draft_v2:{editId:WORK,title:'Retired legacy'}}),a=api({work:{id:WORK,owner:OWNER,title:'Live title'}});ready(h,a.client);h.location.hash='#edit/'+WORK;
 await h.run(`startEdit('${WORK}')`);assert.equal(h.el('title').value,'Retired legacy');h.run('discardCurrentDraft();editId=null');await h.run(`startEdit('${WORK}')`);assert.equal(h.el('title').value,'Live title');
 assert.equal(JSON.parse(h.store.get('aimade_draft_v2')).title,'Retired legacy');
});
test('A malformed legacy edit cannot change the target work identifier',async()=>{
 const h=harness({aimade_drafts_v3:{version:3,create:null,edits:{[WORK]:{editId:MEMBER,owner:OWNER,title:'Wrong target'}}}}),a=api({work:{id:WORK,owner:OWNER,title:'Verified live work'}});ready(h,a.client);h.location.hash='#edit/'+WORK;
 await h.run(`startEdit('${WORK}')`);assert.equal(h.el('title').value,'Verified live work');assert.equal(h.run('editId'),WORK);
});


test('All unauthenticated auth endpoints carry a CAPTCHA token',async()=>{
  for(const mode of ['signin','signup','forgot']){
    const h=harness(),a=api();authReady(h,a,mode);newPassword(h);h.el('signupConsent').checked=true;
    await h.run(submit());
    const sent=mode==='signin'?a.stats.logins[0].options:mode==='signup'?a.stats.signups[0].options:a.stats.resets[0][1];
    assert.equal(sent.captchaToken,'mock-captcha-token');
    if(mode==='signup'){h.advance(61000);await h.run("requestAuthMail('signup','owner@example.com',true)");assert.equal(a.stats.resends[0].options.captchaToken,'mock-captcha-token')}
    assert(![...h.store.values()].join('').includes('mock-captcha-token'));
  }
});
test('Missing CAPTCHA fails closed for sign-in, signup, reset and resend',async()=>{
  for(const mode of ['signin','signup','forgot']){
    const h=harness(),a=api();authReady(h,a,mode);newPassword(h);h.el('signupConsent').checked=true;
    h.context.window.AIMadeCaptcha={ready:()=>false,takeToken:()=>null,sync(){},clear(){}};
    h.run('renderAuthDialog()');assert.equal(h.el('authSubmit').disabled,true);await h.run(submit());
    assert.equal(a.stats.logins.length+a.stats.signups.length+a.stats.resets.length,0);assert(h.el('loginStatus').textContent.includes('安全驗證'));
    await h.run("requestAuthMail('signup','owner@example.com',true)");assert.equal(a.stats.resends.length,0);
  }
});
test('Missing CAPTCHA module cannot bypass verification',async()=>{
  const h=harness(),a=api();authReady(h,a);delete h.context.window.AIMadeCaptcha;h.el('password').value=MOCK_PASSWORD;
  await h.run(submit());assert.equal(a.stats.logins.length,0);
});
test('Verified recovery updates password without requesting a new CAPTCHA token',async()=>{
  const h=harness(),a=api();authReady(h,a);h.run(`user={id:'${OWNER}'};recoveryActive=true`);
  await h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);newPassword(h);
  h.context.window.AIMadeCaptcha.takeToken=()=>{throw Error('must not consume')};await h.run(submit());assert.equal(a.stats.updates.length,1);
});
test('Backend CAPTCHA failures are actionable and do not expose server messages',async()=>{
  const h=harness(),a=api();a.client.auth.signInWithPassword=async()=>({error:{code:'captcha_failed',message:'private'}});
  authReady(h,a);h.el('password').value=MOCK_PASSWORD;await h.run(submit());
  assert(h.el('loginStatus').textContent.includes('安全驗證未通過'));assert(!h.el('loginStatus').textContent.includes('private'));
});

// Regression cases for expired recovery callbacks without a redirect marker.
test('Expired dashboard callback opens resend form, never reset controls',async()=>{
 for(const sdkError of [null,{code:'otp_expired'}]){
  const h=harness(),a=api();h.location.hash='#error=access_denied&error_code=otp_expired&error_description=private-detail';initialAuth(h,a,null,sdkError);await h.run('init()');
  assert.equal(h.run('authMode'),'forgot');assert.equal(h.el('loginDialog').open,true);assert.equal(h.run('recoveryVerified'),false);assert.equal(h.location.hash,'');assert(h.el('loginStatus').textContent.includes('已過期'));assert(!h.el('loginStatus').textContent.includes('private-detail'));assert.equal(a.stats.updates.length,0);
 }
});
test('Expired callback with old session does not authorize password update',async()=>{
 const h=harness(),a=api();h.location.hash='#error=access_denied&error_code=otp_expired';initialAuth(h,a,{user:{id:OWNER}});await h.run('init()');assert.equal(h.run('authMode'),'forgot');assert.equal(h.run('recoveryVerified'),false);assert.equal(a.stats.updates.length,0);
});
test('Valid dashboard recovery without query marker still opens reset form',async()=>{
 const h=harness(),a=api();h.location.hash='#access_token=fake-fixture&type=recovery';initialAuth(h,a,{user:{id:OWNER}});await h.run('init()');assert.equal(h.run('authMode'),'recovery');assert.equal(h.run('recoveryVerified'),true);assert.equal(h.el('loginDialog').open,true);
});
test('Explicit recovery redirect without session cannot update password',async()=>{
 const h=harness(),a=api();h.location.search='?auth=recovery';initialAuth(h,a);await h.run('init()');assert.equal(h.run('authMode'),'forgot');assert.equal(h.run('recoveryVerified'),false);
});
test('Unrelated callback error keeps generic signin error and hides provider detail',async()=>{
 const h=harness(),a=api();h.location.hash='#error=access_denied&error_description=private-detail';initialAuth(h,a);await h.run('init()');assert.equal(h.run('authMode'),'signin');assert(!h.el('loginStatus').textContent.includes('private-detail'));
});
