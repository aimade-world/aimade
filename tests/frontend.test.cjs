const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const elements=new Map();
function el(id){if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},dataset:{},files:[],checked:false,addEventListener(){},setAttribute(){},classList:{add(){},remove(){},contains(){return false}},querySelector(){return el('button')},reset(){},focus(){},showModal(){this.open=true},close(){this.open=false}});return elements.get(id)}
const ctx=vm.createContext({console,URL,AbortController,Set,Map,Date,setTimeout,clearTimeout,localStorage:{getItem(k){return k==='aimade_saved'?'{}':null},setItem(){},removeItem(){}},document:{getElementById:el,querySelector:()=>el('query'),querySelectorAll:()=>[],addEventListener(){},documentElement:{},title:''},window:{addEventListener(){}},location:{hash:'#home',origin:'https://aimade.world',search:'',pathname:'/'},navigator:{},history:{},confirm:()=>false});
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/app.js'),'utf8').split('applyLang();restoreDraft();')[0];vm.runInContext(source,ctx);
const run=s=>vm.runInContext(s,ctx);let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name)}
test('Corrupt saved storage does not crash',()=>assert.equal(run('saved.size'),0));
for(const url of ['javascript:alert(1)','data:text/html,hi','https://user:secret@example.com','ftp://example.com','/relative'])test('Reject unsafe URL '+url,()=>assert.equal(run(`safeUrl(${JSON.stringify(url)})`),''));
test('Allow HTTPS',()=>assert.equal(run("safeUrl('https://example.com')"),'https://example.com/'));
test('Covers only from project bucket',()=>assert.equal(run("safeCover('https://example.com/x.png')"),''));
test('Covers reject hostname prefix spoof',()=>assert.equal(run("safeCover(SB_URL+'.evil.test/storage/v1/object/public/covers/a.png')"),''));
test('HTML escaping',()=>assert.equal(run(`esc('<img onerror="x">')`),'&lt;img onerror=&quot;x&quot;&gt;'));
test('Reject empty, oversized or SVG covers',()=>{assert.equal(run("validCover({size:0,type:'image/png'})"),false);assert.equal(run("validCover({size:5242881,type:'image/png'})"),false);assert.equal(run("validCover({size:20,type:'image/svg+xml'})"),false)});
test('Accept allowed cover',()=>assert.equal(run("validCover({size:500,type:'image/webp'})"),true));
test('Untrusted metadata shape normalized',()=>assert.equal(run("Object.keys(normalize({details:['x']}).details).length"),0));
test('Card cannot inject script or dangerous link',()=>{const html=run(`card(normalize({id:'3517bbf5-6468-4e23-8eaa-aa02e228c7b4',title:'<img onerror="evil()">',owner_name:'<script>x</script>',description:'<svg/onload=x>',link:'javascript:evil()',cover_url:'https://evil.test/a.png',category:'game'}),0)`);assert(!html.includes('<script>'));assert(!html.includes('href="javascript:'));assert(!html.includes('<svg/'));assert(html.includes('&lt;img'))});
(async()=>{run('sb=null');await run('loadWorks()');test('Backend failure shows retry, not empty community',()=>{assert(el('grid').innerHTML.includes('暫時無法載入'));assert(el('grid').innerHTML.includes('data-action="retry"'));assert(!el('grid').innerHTML.includes('這裡還沒有作品'))});console.log(`${checks} frontend checks passed`);})().catch(e=>{console.error(e);process.exitCode=1});
