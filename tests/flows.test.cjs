const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const WORK = '3517bbf5-6468-4e23-8eaa-aa02e228c7b4';
const OWNER = '6e3ccb94-b4f1-4906-88c7-3dcdb8a5085e';
const SB = 'https://ulntmokjyvbxmkdejagt.supabase.co';
const source = fs.readFileSync(path.join(__dirname, '../assets/app.js'), 'utf8').split('applyLang();restoreDraft();')[0];

function harness(seed = {}) {
  const store = new Map(Object.entries(seed).map(([k,v]) => [k,JSON.stringify(v)]));
  const elements = new Map(), timers = new Map();
  let now = 1793678000000, timerId = 0, failWrites = false;
  function el(id) {
    if (elements.has(id)) return elements.get(id);
    let value = '';
    const classes = new Set();
    const node = {id,textContent:'',innerHTML:'',hidden:false,disabled:false,checked:false,files:[],style:{},dataset:{},attrs:{},
      addEventListener(){},setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]},
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k){classes.has(k)?classes.delete(k):classes.add(k)}},
      querySelector(){return el('button')},focus(){},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false},
      checkValidity(){return id!=='email'||value.includes('@')},reportValidity(){return this.checkValidity()},
      reset(){if(id==='workForm'){for(const field of ['category','access','link','title','description','prompt','displayName','tools','cover'])el(field).value='';for(const field of ['mobile','feedback','rights','removeCover'])el(field).checked=false}}
    };
    Object.defineProperty(node,'value',{get:()=>value,set:v=>{value=String(v);if(id==='cover'&&!value)node.files=[]}});
    elements.set(id,node);return node;
  }
  const location = {origin:'https://aimade.world',pathname:'/',search:'',_hash:'#home',get hash(){return this._hash},set hash(v){this._hash=v?(v.startsWith('#')?v:'#'+v):''}};
  class TestURL extends URL {static createObjectURL(){return 'blob:test-cover'}static revokeObjectURL(){}}
  class TestDate extends Date {static now(){return now}}
  const context = vm.createContext({console:{warn(){},log(){},error(){}},URL:TestURL,AbortController,Set,Map,Date:TestDate,crypto,
    setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},
    localStorage:{getItem:k=>store.get(k)??null,setItem(k,v){if(failWrites)throw Error('Quota');store.set(k,v)},removeItem(k){store.delete(k)}},
    document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener(){},documentElement:{},title:''},
    window:{addEventListener(){},scrollTo(){}},location,navigator:{},
    history:{replaceState(_,__,url){const u=new URL(url,location.origin);location.pathname=u.pathname;location.search=u.search;location.hash=u.hash}},confirm:()=>true
  });
  el('loginDone').hidden=true;
  vm.runInContext(source,context);
  return {context,el,store,location,run:s=>vm.runInContext(s,context),advance:ms=>now+=ms,fireDelay(ms){for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn()}},failWrites(){failWrites=true}};
}

function api({work,writeError=null,roles}={}) {
  const stats = {uploads:0,writes:[],mail:0};
  const client = {
    auth:{async signInWithOtp(){stats.mail++;return {error:null}}},
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
function validForm(h){h.run("fillEditor({category:'prompt',title:'作品介紹助手',description:'將真實作品資料整理成介紹。',prompt:'請只使用我提供的資料，不要捏造功能。',displayName:'AIMade Team',tools:'ChatGPT'})");h.el('rights').checked=true}

test('Legacy edit draft is preserved separately, not restored as a new creation',()=>{
  const h=harness({aimade_draft_v2:{editId:WORK,title:'尚未提交的修改',description:'保留此內容'}});
  h.run('restoreDraft();persistDrafts(drafts)');
  assert.equal(h.run('editId'),null);assert.equal(h.el('title').value,'');
  assert.equal(h.run(`drafts.edits['${WORK}'].title`),'尚未提交的修改');
  assert.equal(h.store.has('aimade_draft_v2'),false);
  assert.equal(h.el('editorContext').hidden,false);
});

test('New draft and each edit draft do not overwrite one another',()=>{
  const h=harness();h.run(`fillEditor({editId:'${WORK}',owner:'${OWNER}',title:'編輯草稿'});saveDraft(false);fillEditor({title:'新作品草稿'});saveDraft(false)`);
  const saved=JSON.parse(h.store.get('aimade_drafts_v3'));
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
  const reloaded=harness({aimade_drafts_v3:JSON.parse(h.store.get('aimade_drafts_v3'))}),retry=api();ready(reloaded,retry.client);reloaded.el('rights').checked=true;
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

test('Magic-link success shows the destination and blocks immediate repeated sends',async()=>{
  const h=harness(),a=api();ready(h,a.client);h.el('email').value='owner@example.com';
  await h.run('sendLink({preventDefault(){}})');await h.run('sendLink({preventDefault(){}})');
  assert.equal(a.stats.mail,1);assert.equal(h.el('loginDone').hidden,false);assert.equal(h.el('loginForm').hidden,true);assert.equal(h.el('loginSentEmail').textContent,'owner@example.com');assert.equal(h.el('resendLink').disabled,true);
  h.advance(61000);await h.run('sendLink({preventDefault(){}})');assert.equal(a.stats.mail,2);
});

test('Authentication rate-limit errors are not shown as a broken login service',async()=>{
  const h=harness(),a=api();a.client.auth.signInWithOtp=async()=>({error:{status:429,code:'over_email_send_rate_limit'}});ready(h,a.client);h.el('email').value='owner@example.com';
  await h.run('sendLink({preventDefault(){}})');assert(h.el('loginStatus').textContent.includes('寄送次數較多'));assert.equal(h.el('sendLink').disabled,true);
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
