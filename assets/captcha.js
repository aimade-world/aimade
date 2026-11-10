'use strict';
// Public sitekey only. The matching secret belongs exclusively in Supabase Auth.
(() => {
  const $=id=>document.getElementById(id);
  const sitekey=document.querySelector('meta[name="aimade-turnstile-sitekey"]')?.content||'';
  const copy={
    loading:['正在載入安全驗證…','Loading security verification…'],
    waiting:['請完成安全驗證後繼續。','Complete the security check to continue.'],
    ready:['安全驗證已完成。','Security check complete.'],
    used:['正在處理，請稍候…','Processing, please wait…'],
    expired:['安全驗證已過期，請重新驗證。','Verification expired. Please retry.'],
    error:['安全驗證無法載入。請檢查網絡、允許 challenges.cloudflare.com，然後重試。','Verification is unavailable. Check your connection, allow challenges.cloudflare.com, then retry.']
  };
  let visible=false,lang='zh',busy=false,state='loading',widget=null,generation=0,token='',expires=0,expiryTimer=null;
  let loadPromise=null,script=null,onChange=()=>{},widgetSize='compact';
  // Flexible Turnstile still needs 300px; compact fits narrow dialog content.
  const fittingSize=()=>$('authCaptchaWidget').clientWidth>=300?'flexible':'compact';
  function notify(){
    $('authCaptcha').hidden=!visible;
    $('authCaptchaStatus').textContent=copy[state][lang==='en'?1:0];
    $('authCaptchaRetry').hidden=!['error','expired','waiting'].includes(state);
    $('authCaptchaRetry').disabled=busy;
    $('authCaptchaRetry').textContent=lang==='en'?'Retry verification':'重新載入驗證';
    onChange();
  }
  function drop(){
    ++generation;token='';expires=0;clearTimeout(expiryTimer);
    if(widget!==null){try{window.turnstile?.remove(widget)}catch{}widget=null}
  }
  function status(next){state=next;notify()}
  function load(){
    if(window.turnstile?.render)return Promise.resolve(window.turnstile);
    if(loadPromise)return loadPromise;
    loadPromise=new Promise((resolve,reject)=>{
      script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
      const timer=setTimeout(()=>finish(false),15000);
      let finished=false;
      function finish(ok){if(finished)return;finished=true;clearTimeout(timer);script.onload=script.onerror=null;ok&&window.turnstile?.render?resolve(window.turnstile):reject(Error('captcha_unavailable'))}
      script.onload=()=>finish(true);script.onerror=()=>finish(false);document.head.appendChild(script);
    }).catch(error=>{script?.remove();script=null;loadPromise=null;throw error});
    return loadPromise;
  }
  async function mount(){
    drop();const current=generation;state='loading';notify();
    if(!sitekey){status('error');return}
    try{
      const ts=await load();if(current!==generation||!visible||busy)return;
      status('waiting');
      const expire=()=>{if(current!==generation)return;token='';expires=0;clearTimeout(expiryTimer);status('expired')};
      widgetSize=fittingSize();
      widget=ts.render($('authCaptchaWidget'),{
        sitekey,theme:'light',size:widgetSize,language:lang==='en'?'en':'zh-tw',action:'auth',
        'response-field':false,'refresh-expired':'manual','refresh-timeout':'manual',retry:'never',
        callback(value){if(current!==generation||!visible||busy)return;token=typeof value==='string'?value:'';expires=Date.now()+290000;clearTimeout(expiryTimer);expiryTimer=setTimeout(expire,290000);status(token?'ready':'error')},
        'expired-callback':expire,'timeout-callback':expire,
        'error-callback'(){if(current!==generation)return;token='';expires=0;clearTimeout(expiryTimer);status('error')},
        'unsupported-callback'(){if(current!==generation)return;token='';expires=0;status('error')}
      });
    }catch{if(current===generation&&visible)status('error')}
  }
  function ready(){return visible&&state==='ready'&&!!token&&Date.now()<expires}
  window.AIMadeCaptcha={
    sync(options){
      const changedLanguage=lang!==options.lang,wasVisible=visible;
      lang=options.lang;busy=options.busy;onChange=options.onChange||(()=>{});visible=options.visible;
      if(!visible){if(wasVisible)drop();state='loading';notify();return}
      if(!busy&&(!wasVisible||changedLanguage||state==='used')){void mount();return}
      notify();
    },
    ready,
    takeToken(){if(!ready())return null;const result=token;drop();status('used');return result},
    clear(){visible=false;drop();state='loading';notify()}
  };
  $('authCaptchaRetry').addEventListener('click',()=>{if(visible&&!busy)void mount()});
  window.addEventListener('resize',()=>{
    if(visible&&!busy&&widget!==null&&fittingSize()!==widgetSize)void mount();
  });
})();
