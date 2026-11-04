const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/captcha.js'),'utf8');
function harness({loaded=true,key='public-test-key'}={}){
  const nodes=new Map(),timers=new Map();let now=0,id=0,options,removed=0,renders=0,script;
  const el=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',hidden:true,disabled:false,addEventListener(n,fn){this[n]=fn}});return nodes.get(id)};
  const ts={render(node,p){options=p;renders++;return 'widget-'+renders},remove(){removed++}};
  class Clock extends Date{static now(){return now}}
  const window={};if(loaded)window.turnstile=ts;
  vm.runInNewContext(source,{window,Date:Clock,document:{getElementById:el,querySelector:()=>({content:key}),createElement:()=>({remove(){this.removed=true}}),head:{appendChild(s){script=s}}},
    setTimeout(fn,ms){const n=++id;timers.set(n,{fn,ms});return n},clearTimeout(n){timers.delete(n)}});
  const sync=(opts={})=>window.AIMadeCaptcha.sync({visible:true,lang:'zh',busy:false,...opts});
  return {api:window.AIMadeCaptcha,el,window,ts,sync,get opts(){return options},get renders(){return renders},get removed(){return removed},get script(){return script},advance(ms){now+=ms},fire(ms){for(const [n,t]of [...timers])if(t.ms===ms){timers.delete(n);t.fn()}}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('CAPTCHA loads lazily, renders once, and has no automatic form submission',async()=>{
  const h=harness();assert.equal(h.renders,0);assert.equal(h.api.ready(),false);h.sync();await tick();
  assert.equal(h.renders,1);h.sync();h.sync();await tick();assert.equal(h.renders,1);
  assert.equal(h.opts['response-field'],false);assert.equal(h.opts.sitekey,'public-test-key');assert.equal(h.opts.language,'zh-tw');
  h.opts.callback('token');assert.equal(h.api.ready(),true);
});
test('Tokens are consumed once and a fresh widget follows each request',async()=>{
  const h=harness();h.sync();await tick();h.opts.callback('one');assert.equal(h.api.takeToken(),'one');assert.equal(h.api.takeToken(),null);
  h.sync({busy:true});await tick();assert.equal(h.renders,1);h.sync();await tick();assert.equal(h.renders,2);assert.equal(h.api.ready(),false);
});
test('Old callbacks cannot resurrect a consumed or closed token',async()=>{
  const h=harness();h.sync();await tick();const old=h.opts;old.callback('one');h.api.takeToken();old.callback('replayed');assert.equal(h.api.takeToken(),null);
  h.sync();await tick();const current=h.opts;h.api.clear();current.callback('late');assert.equal(h.api.ready(),false);assert.equal(h.el('authCaptcha').hidden,true);
});
test('Five-minute tokens expire early both by timer and wall clock',async()=>{
  const h=harness();h.sync();await tick();h.opts.callback('token');h.advance(290000);assert.equal(h.api.takeToken(),null);h.fire(290000);
  assert.equal(h.api.ready(),false);assert.equal(h.el('authCaptchaRetry').hidden,false);assert(h.el('authCaptchaStatus').textContent.includes('過期'));
});
test('Provider error and timeout revoke tokens without exposing details',async()=>{
  const h=harness();h.sync();await tick();h.opts.callback('token');h.opts['error-callback']('private');assert.equal(h.api.ready(),false);assert(!h.el('authCaptchaStatus').textContent.includes('private'));
  h.el('authCaptchaRetry').click();await tick();h.opts.callback('new');h.opts['timeout-callback']();assert.equal(h.api.takeToken(),null);
});
test('Language changes reset widget; hidden recovery pages remove it',async()=>{
  const h=harness();h.sync();await tick();h.opts.callback('zh');h.sync({lang:'en'});await tick();assert.equal(h.opts.language,'en');assert.equal(h.api.ready(),false);
  h.sync({visible:false});assert.equal(h.el('authCaptcha').hidden,true);assert(h.removed>=2);
});
test('Absent sitekey fails closed without rendering or accepting a token',async()=>{
  const h=harness({key:''});h.sync();await tick();assert.equal(h.renders,0);assert.equal(h.api.takeToken(),null);assert.equal(h.el('authCaptchaRetry').hidden,false);
});
test('Blocked script times out safely and allows a retry',async()=>{
  const h=harness({loaded:false});h.sync();assert.equal(h.script.src,'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
  h.fire(15000);await tick();assert.equal(h.api.ready(),false);assert.equal(h.el('authCaptchaRetry').hidden,false);
  h.el('authCaptchaRetry').click();h.window.turnstile=h.ts;h.script.onload();await tick();assert.equal(h.renders,1);
});
test('Closing during script loading does not render a hidden challenge',async()=>{
  const h=harness({loaded:false});h.sync();h.api.clear();h.window.turnstile=h.ts;h.script.onload();await tick();assert.equal(h.renders,0);assert.equal(h.api.ready(),false);
});
test('Public page allows only the official CAPTCHA script and frame host',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert(html.includes("script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;"));
  assert(!html.includes("script-src 'self' 'unsafe-inline'"));assert(html.includes('0x4AAAAAAFyvQs5mB-t3aKTN'));
  assert(!source.includes('localStorage'));assert(!source.includes('console.'));
});
