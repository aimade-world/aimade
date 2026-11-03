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
  const elements = new Map(), timers = new Map();
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
    document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener(){},documentElement:{},title:''},
    window:{addEventListener(){},scrollTo(){}},location,navigator:{},
    history:{replaceState(_,__,url){const u=new URL(url,location.origin);location.pathname=u.pathname;location.search=u.search;location.hash=u.hash}},confirm:()=>true
  });
  el('loginDone').hidden=true;
  vm.runInContext(source,context);
  return {context,el,store,location,run:s=>vm.runInContext(s,context),advance:ms=>now+=ms,fireDelay(ms){const results=[];for(const [id,timer]of [...timers])if(timer.ms===ms){timers.delete(id);results.push(timer.fn())}return Promise.all(results)},failWrites(){failWrites=true}};
}

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
function validForm(h){h.run("fillEditor({category:'prompt',title:'作品介紹助手',description:'將真實作品資料整理成介紹。',prompt:'請只使用我提供的資料，不要捏造功能。',displayName:'AIMade Team',tools:'ChatGPT'})");h.el('rights').checked=true}

test('Legacy edit draft is preserved separately, not restored as a new creation',()=>{
  const h=harness({aimade_draft_v2:{editId:WORK,title:'尚未提交的修改',description:'保留此內容'}});
  h.run('restoreDraft();persistDrafts(drafts)');
  assert.equal(h.run('editId'),null);assert.equal(h.el('title').value,'');
  assert.equal(h.run(`drafts.edits['${WORK}'].title`),'尚未提交的修改');
  assert.equal(h.store.has('aimade_draft_v2'),false);
  assert.equal(h.el('editorContext').hidden,true); // Unowned legacy draft titles stay private until ownership is known.
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
  const h=harness({aimade_auth_return_v3:'#upload',aimade_drafts_v3:{version:3,create:{title:'保留的草稿'},edits:{},lastEdit:null}}),a=api();authReady(h,a);
  h.run(`user={id:'${OWNER}'};recoveryActive=true`);h.location.search='?auth=recovery';await h.run(`prepareRecovery({user:{id:'${OWNER}'}})`);
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
  assert.equal(h.run(`drafts.edits['${WORK}'].title`),'Private unfinished title');
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
