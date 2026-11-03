'use strict';
const SB_URL='https://ulntmokjyvbxmkdejagt.supabase.co';
const SB_KEY='sb_publishable_xmQTDQxS8vOUP0q8OTHFOQ_ymHOihp2';
const $=id=>document.getElementById(id);
const storage={get(k,f=null){try{const v=localStorage.getItem(k);return v===null?f:JSON.parse(v)}catch{return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}},remove(k){try{localStorage.removeItem(k)}catch{}}};
let lang=storage.get('aimade_lang','zh');if(!['zh','en'].includes(lang))lang='zh';
const words={
navHome:['探索作品','Explore'],navSaved:['我的收藏','Saved'],navGuide:['分享指南','How to share'],navMine:['我的作品','My works'],signin:['登入','Sign in'],signout:['登出','Sign out'],share:['分享作品 ↗','Share a creation ↗'],
hero:['別只看 AI 能做什麼，\n直接玩看看。','Don’t just see what AI can do.\nTry it for yourself.'],heroSub:['發現創作者做的小遊戲、實用工具和互動作品。找到喜歡的，就打開試試；做了新作品，也歡迎分享。','Discover little games, useful tools and interactive creations. Try something new. Made something yourself? Share it here.'],explore:['探索作品 ↓','Explore creations ↓'],noteTag:['MADE WITH AI. SHARED WITH YOU.','MADE WITH AI. SHARED WITH YOU.'],noteTitle:['一個小點子，\n也值得被看見。','Small ideas.\nWorth sharing.'],noteBody:['不需要是專業開發者。\n你做的第一個作品，也歡迎。','You don’t need to be a developer.\nYour first creation belongs here, too.'],join:['分享你的創作 ↗','Share yours ↗'],new:['最新發布','Newest'],hot:['近 30 天新作 · 最多讚','New in 30 days · most liked'],pop:['最多讚','Most liked'],hasLink:['只看附有使用連結的作品','Only works with a link'],more:['載入更多作品','Load more'],stripTitle:['你做的下一件作品，放在這裡。','Your next creation belongs here.'],stripSub:['一個連結、一句介紹，就能開始分享。上傳前可先儲存草稿。','Start with a link and a short description. Save a draft before publishing.'],
uploadTitle:['分享你的 AI 作品','Share your AI creation'],editTitle:['編輯作品','Edit creation'],uploadSub:['讓別人知道它可以做什麼，以及如何開始使用。發布後仍可編輯。','Explain what it does and how to get started. You can edit it after publishing.'],step1:['作品與連結','Work & link'],step2:['介紹與封面','Story & cover'],step3:['確認並發布','Review & publish'],category:['作品類型','Category'],access:['外部作品使用條件','External access'],accessUnknown:['未標示／請看作品說明','Not specified'],accessFree:['免費使用','Free to use'],accessLogin:['需外站登入','External sign-in'],accessTrial:['有限免費試用','Limited free trial'],accessDisplay:['僅展示','Showcase only'],link:['作品連結','Work URL'],linkHelp:['遊戲和工具請提供可開啟的網址；圖片、文字或 Prompt 可只分享內容。','For games and tools, provide a working URL. Images, writing and prompts can be shared without one.'],title:['作品名稱 *','Title *'],description:['一句用途與簡介 *','What does it do? *'],promptLabel:['可複製的 Prompt *','Copyable prompt *'],promptHelp:['只放你有權分享的內容，請勿包含密碼、API key 或個人資料。','Share only content you have permission to share. No passwords, API keys or personal data.'],displayName:['公開作者名稱 *','Public display name *'],tools:['使用的 AI 工具（選填）','AI tools used (optional)'],cover:['封面圖片（選填）','Cover image (optional)'],coverHelp:['PNG、JPG、WebP 或 GIF，最多 5MB。圖片不會跟文字草稿一起保存。每帳戶每日最多 20 次封面上傳，最多保留 50 張；達上限請聯絡我們。','PNG, JPG, WebP or GIF, up to 5MB. Files are not saved with your text draft. Up to 20 cover uploads/day and 50 stored per account; contact us if you reach the limit.'],removeCover:['移除現有封面','Remove existing cover'],mobileCheck:['我已在手機測試，作品可使用','I tested this work on mobile'],feedbackCheck:['歡迎試用建議／正在找測試者','Feedback and testers welcome'],rights:['我有權分享這份內容，並同意','I have permission to share this content and agree to the'],terms:['服務條款','Terms'],privacy:['隱私政策','Privacy'],publish:['確認並發布','Publish creation'],update:['儲存更新','Save changes'],saveDraft:['儲存草稿','Save draft'],clearDraft:['清除草稿','Clear draft'],beforeShare:['BEFORE YOU SHARE','BEFORE YOU SHARE'],tipsTitle:['讓人一眼看懂，\n再親手試試。','Make it clear.\nMake it worth a try.'],tip1:['名稱具體，例如「三分鐘專注計時器」。','Use a specific title, like “Three-minute focus timer”.'],tip2:['說明用途、操作方式及使用限制。','Describe the use case, instructions and any limits.'],tip3:['放一張真實畫面，不用誇大的宣傳圖。','Use an actual screenshot, not exaggerated promises.'],hostingNote:['目前提供作品展示和外部連結分享，不代管可執行程式，也不替作品支付 AI API 費用。','We showcase creations and external links. We do not host executable code or pay the AI API costs of shared works.'],draftNote:['草稿只存在這個瀏覽器。共用電腦使用後請清除草稿；請勿在草稿中放入秘密資料。','Drafts stay in this browser only. Clear them on shared devices, and never include secrets.'],guideTitle:['分享很簡單。','A small guide to sharing.'],guideSub:['AIMade 是作品的展示入口，不是 AI 模型訓練或程式託管服務。','AIMade is a discovery and showcase platform, not a model-training or code-hosting service.'],ready:['準備好分享了嗎？','Ready to share?'],guideEnd:['也可以先逛逛，找到下一個靈感。','Or explore first and find your next idea.'],tagline:['把創意變成現實，讓世界看見。','Turn ideas into reality. Share them with the world.'],contact:['聯絡我們','Contact'],loginTitle:['用電郵登入','Sign in with email'],loginSub:['瀏覽和開啟作品不需要登入。發布、按讚或管理自己的作品時才需要。','No sign-in needed to browse or open works. Sign in to publish, like or manage your creations.'],email:['電郵地址','Email address'],report:['檢舉作品','Report work'],reportReason:['請說明侵權、詐騙或其他問題','Describe the infringement, scam or other issue'],sendReport:['提交檢舉','Submit report'],
browseTitle:['來找一件好玩的作品','Find something worth a try'],browseSub:['免費瀏覽與分享。外部作品的使用條件依作者設定。','Free to browse and share. External works have their own access conditions.'],search:['想玩什麼？搜尋作品、用途或創作者…','Find a game, a useful tool or a creator…'],all:['全部作品','All creations'],feedback:['找人試玩','Testers welcome'],savedSub:['收藏儲存在這個瀏覽器，不會跨裝置同步。','Saved in this browser only; not synced across devices.'],mineSub:['管理、編輯及分享你發布的作品。','Manage, edit and share your published creations.'],loading:['正在載入作品…','Loading creations…'],loadError:['暫時無法載入作品','Couldn’t load creations'],loadErrorBody:['這是連線問題，不代表作品被刪除。請稍後重試；如持續發生，聯絡 hello@aimade.world。','A connection problem does not mean works were deleted. Retry, or contact hello@aimade.world if it continues.'],retry:['重新載入','Retry'],empty:['這裡還沒有作品','No creations here yet'],emptyBody:['歡迎分享你的第一件 AI 創作。','Share your first AI creation.'],noResults:['找不到符合的作品','No matching creations'],noResultsBody:['試試其他關鍵字，或清除篩選。','Try another keyword or clear the filters.'],reset:['清除篩選','Clear filters'],noSaved:['還沒有收藏','Nothing saved yet'],saveHelp:['按作品上的「收藏」，下次在這裡找到它。','Save a work to find it here next time.'],view:['作品介紹','Details'],play:['立即試玩 ↗','Play now ↗'],use:['開啟使用 ↗','Try it ↗'],watch:['觀看作品 ↗','Watch ↗'],listen:['聆聽作品 ↗','Listen ↗'],external:['外部網站','External website'],save:['收藏','Save'],saved:['已收藏','Saved'],like:['讚','Like'],mobile:['手機可用 · 作者標示','Mobile · author noted'],feedbackBadge:['歡迎試用建議','Feedback welcome'],authorLabels:['使用條件由作者提供，未經平台驗證。外部網站有各自的收費、隱私與登入規則。','Access labels are provided by the author, not verified by AIMade. External sites have their own pricing, privacy and sign-in rules.'],back:['← 返回探索','← Back to explore'],copyLink:['複製分享連結','Copy share link'],copyPrompt:['複製 Prompt','Copy prompt'],copied:['已複製','Copied'],copyFail:['未能自動複製，請手動複製網址或內容。','Copy failed. Please copy the URL or content manually.'],edit:['編輯作品','Edit work'],notFound:['找不到這件作品','Work not found'],notFoundBody:['作品可能已移除，或分享網址不正確。','The work may have been removed, or the URL is incorrect.'],needLogin:['請先登入；你的文字草稿會保留。','Sign in first. Your text draft will be kept.'],sending:['寄送中…','Sending…'],authFail:['登入服務暫時無法使用，請稍後重試。','Sign-in is temporarily unavailable. Please retry later.'],busy:['儲存中…','Saving…'],published:['作品已發布','Creation published'],updated:['作品已更新','Creation updated'],saveFail:['未能儲存。你的草稿仍在；請檢查網絡後重試。','Couldn’t save. Your draft is still here; check your connection and retry.'],badLink:['請輸入有效的 https:// 或 http:// 網址，不可包含登入密碼。','Enter a valid https:// or http:// URL without embedded credentials.'],needLink:['這類作品需要提供可使用的連結。','This type of work needs a working URL.'],needPrompt:['請填寫可分享的 Prompt。','Enter a prompt to share.'],badCover:['封面只接受 5MB 以下的 PNG、JPG、WebP 或 GIF。','Cover must be PNG, JPG, WebP or GIF, up to 5MB.'],draftSaved:['文字草稿已保存於這個瀏覽器（不含圖片）。','Text draft saved in this browser (not the image).'],draftFail:['瀏覽器無法保存草稿，請先自行複製內容。','This browser cannot save your draft. Copy your text before leaving.'],draftClear:['確定清除這個瀏覽器的草稿？不會刪除已發布作品。','Clear this browser’s draft? Published works will not be deleted.'],draftRestored:['已還原文字草稿；如有封面，請重新選取。','Text draft restored. Please reselect any cover file.'],reported:['已收到檢舉，管理員會查看。','Report received for administrator review.'],reportFail:['檢舉未送出，請重試或寄信至 hello@aimade.world。','Report not sent. Retry or email hello@aimade.world.'],likeFail:['操作失敗，讚數未變更。請稍後重試。','Could not update your like. Please retry.'],sessionFail:['登入連結無效或已過期，請重新取得連結。','Sign-in link invalid or expired. Request a new link.'],savedLimit:['這個瀏覽器最多保存 300 件收藏，請先取消部分收藏。','This browser supports 300 saved works. Remove some before saving more.'],leaveEdit:['目前有未提交的內容。已保存文字草稿，是否切換至另一件作品？','You have unsaved content. Text draft saved. Switch to another work?'],untitled:['未命名作品','Untitled work'],anonymous:['創作者','Creator'],cancel:['取消','Cancel'],archived:['已下架 · 不公開','Unpublished · not public'],archiveWork:['下架作品','Unpublish'],restoreWork:['恢復公開','Restore publication'],archiveConfirm:['下架後訪客無法查看作品頁，但已公開的封面網址仍可能有效。你可以在「我的作品」恢復公開。確定下架？','Unpublish this work? Visitors will no longer see its page, but previously public cover URLs may remain accessible. You can restore it from My works.']};
Object.assign(words,{
  accountLabel:['目前登入帳戶','Signed-in account'],accountPrivate:['只在你的帳戶管理畫面顯示，電郵不會發布到作品頁。','Shown only in your account workspace; your email is not published on work pages.'],roleChecking:['正在確認權限…','Checking permissions…'],roleAdmin:['管理員','Administrator'],roleMember:['普通會員','Member'],roleUnknown:['暫時無法確認角色','Role temporarily unavailable'],viewPrompt:['查看 Prompt','View prompt'],
  signoutHint:['只登出此瀏覽器的登入階段','Sign out of this browser session only'],
  coverPrivacy:['封面是公開檔案，請勿包含個人資料、密鑰或敏感畫面；下架作品不會自動刪除圖片。','Covers are public files. Do not include personal data, keys or sensitive screenshots. Unpublishing a creation does not delete its image.'],
  draftClear:['確定清除此份草稿？其他草稿及已發布作品不會刪除。','Clear this draft? Other drafts and published creations will be kept.'],draftRestored:['已還原文字草稿；尚未上傳的封面請重新選取。','Text draft restored. Reselect any cover that has not been uploaded.'],draftNote:['新作品及各件作品的編輯草稿分開保存，只存在這個瀏覽器。共用電腦使用後請清除草稿；請勿放入秘密資料。','New creations and each creation’s edit drafts are saved separately in this browser only. Clear drafts on shared devices; never include secrets.'],
  editContext:['你正在編輯既有作品；儲存會更新原作品，不會新增一件。','You are editing an existing creation. Saving updates it; it does not publish a new one.'],
  newCreation:['分享新作品','Share a new creation'],resumeEdit:['繼續上次編輯','Resume previous edit'],editDraftAvailable:['另有一份未提交的編輯草稿：','An unfinished edit is saved separately: '],editDraftRestored:['已還原這件作品的編輯草稿；尚未發布的圖片請重新選取。','Restored this creation’s edit draft. Reselect any image that was not uploaded.'],
  switchCover:['文字草稿已保留，但尚未上傳的圖片不會隨草稿保存。確定切換？','Your text draft is saved, but an image that has not been uploaded is not saved with it. Switch anyway?'],
  requiredFields:['請填寫作品名稱、用途簡介及公開作者名稱，內容不能只有空白。','Enter a title, description and public author name; whitespace alone is not enough.'],fieldTooLong:['部分內容超過長度限制，請檢查各欄位。','Some text exceeds the field limits. Please check the form.'],consentRequired:['發布前請閱讀並親自確認分享權利及服務條款。','Read and confirm your sharing rights and the terms before publishing.'],
  loginTitle:['歡迎來到 AIMade','Welcome to AIMade'],loginSub:['登入後，分享作品、送出喜歡，或繼續你的創作。瀏覽作品不需要帳戶。','Sign in to share, like and manage your creations. Browsing needs no account.'],
  signupTitle:['讓你的創意被看見','Give your ideas a place'],signupSub:['建立帳戶，分享你的第一件 AI 作品。首次註冊需驗證電郵，之後使用密碼登入。','Create an account and share your first AI creation. Verify your email once, then sign in with your password.'],
  forgotTitle:['設定或重設密碼','Set or reset your password'],forgotSub:['輸入帳戶的電郵地址，我們會寄送一次性的密碼設定連結。曾用郵件連結登入的用戶，也可在這裡設定密碼，無需重新註冊。','Enter your account email for a one-time password setup link. Previously used email links? Set a password here without creating a new account.'],
  recoveryTitle:['設定你的新密碼','Choose your new password'],recoverySub:['設定完成後，下次直接使用電郵與密碼登入，不必每次收取登入信。','Next time, sign in with your email and password—no sign-in email needed.'],
  password:['密碼','Password'],newPassword:['新密碼','New password'],confirmPassword:['再次輸入密碼','Confirm password'],passwordHelp:['至少 12 個字元，建議使用不重複的長密碼。','Use at least 12 characters. A long, unique password is best.'],showPassword:['顯示密碼','Show password'],hidePassword:['隱藏密碼','Hide password'],
  authSignin:['登入','Sign in'],authSignup:['建立帳戶','Create account'],authForgot:['寄送密碼設定信','Send password setup email'],authRecovery:['儲存新密碼','Save new password'],authWorking:['處理中…','Working…'],forgotLink:['忘記／設定密碼','Forgot / set password'],
  noAccount:['還沒有帳戶？','New here?'],haveAccount:['已經有帳戶？','Already have an account?'],backSignin:['返回登入','Back to sign in'],signupLink:['註冊','Sign up'],
  legacyPassword:['曾用郵件連結登入？使用原電郵設定一次密碼，原有作品會保留。','Used email links before? Set a password with the same email to keep your existing creations.'],
  signupExistingHint:['曾用郵件連結登入過 AIMade？請為原帳戶設定密碼，不必重新註冊。','Previously used AIMade email links? Set a password for your existing account instead of registering again.'],existingPasswordAction:['已有帳戶？設定／重設密碼','Existing account? Set / reset password'],legacyPasswordAction:['設定／重設密碼','Set / reset password'],resendVerification:['重寄驗證信','Resend verification email'],resendPasswordSetup:['重寄設定信','Resend setup email'],coverReady:['封面已選取，將於發布時上傳；尚未上傳的圖片不會隨文字草稿保存。','Cover selected. It will upload when you publish; an unuploaded file is not saved with your text draft.'],
  signupAgree:['我已閱讀並同意','I have read and agree to the'],signupConsentRequired:['請先閱讀並親自同意服務條款及隱私政策。','Please read and agree to the terms and privacy policy yourself.'],
  and:['及','and'],
  invalidLogin:['電郵或密碼不正確。若尚未設定密碼，請選擇「忘記／設定密碼」。','Email or password is incorrect. If you have not set a password yet, choose “Forgot / set password”.'],passwordShort:['新密碼至少需要 12 個字元。','Your new password needs at least 12 characters.'],passwordMismatch:['兩次輸入的密碼不相同，請重新確認。','The passwords do not match. Please check them.'],passwordWeak:['此密碼不符合安全要求，請使用更長且不重複的密碼。','This password does not meet security requirements. Use a longer, unique password.'],
  signupMailTitle:['下一步：驗證或登入','Next: verify or sign in'],signupMailHelp:['為保障帳戶私隱，這個回覆不會透露電郵是否已註冊。新用戶請查看收件箱及垃圾郵件中的驗證信；曾登入過 AIMade 的用戶，請返回登入或設定／重設密碼，不用重新註冊。','For account privacy, this response does not reveal whether the email is already registered. New users: check inbox and spam for verification. Previously used AIMade? Sign in or set/reset your password instead of registering again.'],
  resetMailTitle:['請查看密碼設定信','Check your password setup email'],resetMailHelp:['若此電郵已註冊，你會收到密碼設定信；請查看收件箱及垃圾郵件。連結只能使用一次。可在另一裝置設定，之後回來使用新密碼登入。','If an account exists for this email, you will receive a one-time password setup link. Check inbox and spam. You can set the password on another device, then sign in here with it.'],
  confirmFirst:['請先完成電郵驗證，或重新寄送確認信。','Please verify your email first, or resend the confirmation email.'],changeEmail:['更改電郵地址','Change email'],resendLink:['重新寄送','Send again'],resendWait:['{seconds} 秒後可重寄','Send again in {seconds}s'],
  authRate:['請求次數較多，請稍後再試；重複點擊不會加快收信。','Too many requests. Please wait before trying again; repeated clicks will not speed up delivery.'],authPending:['伺服器回應尚未確認。請先查看信箱或稍後重試，避免重複操作。','The response is not confirmed yet. Check your inbox or retry later to avoid duplicate requests.'],
  recoveryChecking:['正在驗證密碼設定連結…','Verifying your password setup link…'],recoveryExpired:['密碼設定連結無效、已使用或已過期。請重新申請，不需要重新註冊。','This password setup link is invalid, used or expired. Request another one; no new account is needed.'],recoveryReauth:['為保障帳戶安全，請重新申請一封密碼設定信，並使用最新的連結。','For your security, request a new password setup email and use the latest link.'],passwordSaved:['密碼已設定，下次可直接使用電郵與密碼登入。','Password saved. Next time, use your email and password.'],
  sessionFail:['登入未完成，或連結已失效。請重試；如需設定密碼，請選擇「忘記／設定密碼」。','Sign-in was not completed, or the link expired. Retry, or choose “Forgot / set password”.'],authPreview:['預覽頁不會執行帳戶操作，請到 aimade.world 使用正式登入。','Account actions are disabled in preview. Use aimade.world to sign in.']
});
const cats={app:['網頁 / App','Web / App'],game:['小遊戲','Games'],tool:['實用工具','Tools'],prompt:['Prompt','Prompts'],image:['圖片','Images'],video:['影片','Videos'],music:['音樂','Music'],design:['3D / 設計','3D / Design'],writing:['文字創作','Writing'],other:['其他','Other']};
const t=k=>(words[k]||[k,k])[lang==='en'?1:0];
const cat=k=>(cats[k]||cats.other)[lang==='en'?1:0];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x||'');
function safeUrl(x){try{const u=new URL(x);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
function safeCover(x){const u=safeUrl(x);return u.startsWith(SB_URL+'/storage/v1/object/public/covers/')?u:''}
const colors=['#ece3d2','#e4e9dc','#e9e2ed','#e4e9ec','#f0e1d8'];
let sb=null,user=null,isAdmin=false,adminRoleState='unknown',works=[],likes=new Set(),saved=new Set((Array.isArray(storage.get('aimade_saved'))?storage.get('aimade_saved'):[]).filter(uuid).slice(0,300)),mode='home',activeCat='all',search='',sort='new',onlyLink=false,offset=0,loading=false,hasMore=false,requestSeq=0,editId=null,pendingId=null,editingCover='',detailWork=null,reportId=null,dirty=false,previewUrl=null;
const pageSize=24,cache=new Map();let detailSeq=0,authSeq=0,editSeq=0,authReady=false,editOwner=null,lastRouteHash='',mailCooldownUntil=0,mailTimer=null,stagedCoverFile=null,stagedCoverUrl='',coverUpload=null;
let toastTimer,searchTimer,draftTimer;
function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500)}
function applyLang(){document.documentElement.lang=lang==='zh'?'zh-Hant':'en';if(mode!=='detail')document.title=lang==='zh'?'AIMade — 發現、試玩、分享 AI 作品':'AIMade — Discover, try and share AI creations';document.querySelectorAll('[data-i]').forEach(el=>{el.textContent=t(el.dataset.i);if(['hero','noteTitle','noteBody','tipsTitle'].includes(el.dataset.i))el.style.whiteSpace='pre-line'});$('lang').textContent=lang==='zh'?'EN':'中文';$('search').placeholder=t('search');$('search').setAttribute('aria-label',t('search'));$('sort').setAttribute('aria-label',lang==='zh'?'作品排序':'Sort creations');const current=$('category').value||'app';$('category').innerHTML=Object.keys(cats).map(k=>`<option value="${k}">${cat(k)}</option>`).join('');$('category').value=current;$('description').placeholder=lang==='zh'?'它能幫誰做什麼？要怎樣開始？':'Who is it for? What can it do? How do you start?';renderFilters();renderAuth();renderFAQ();updateBrowseHeading();$('editorTitle').textContent=t(editId?'editTitle':'uploadTitle');$('publish').textContent=t(editId?'update':'publish');renderEditorContext();renderAuthDialog();for(const key of ['draftSaved','draftFail','draftRestored','editDraftRestored','coverReady']){if(words[key].includes($('draftStatus').textContent)){$('draftStatus').textContent=t(key);break}}if(detailWork)renderDetail(detailWork);}
function renderAccount(){
  const show=!!user&&['mine','upload'].includes(mode);
  $('accountStatus').hidden=!show;
  $('accountEmail').textContent=show?(user.email||''):'';
  $('accountRole').textContent=show?t({checking:'roleChecking',admin:'roleAdmin',member:'roleMember',unknown:'roleUnknown'}[adminRoleState]||'roleUnknown'):'';
}
function renderAuth(){$('authButton').textContent=t(user?'signout':'signin');$('authButton').setAttribute('title',t(user?'signoutHint':'signin'));document.querySelector('[data-i=navMine]').hidden=!user;renderAccount();renderEditorContext();}
function renderFilters(){const list=['all',...Object.keys(cats),'feedback'];$('filters').innerHTML=list.map(k=>`<button class="chip" data-cat="${k}" aria-pressed="${activeCat===k}">${esc(cats[k]?cat(k):t(k))}</button>`).join('')}
function updateBrowseHeading(){$('hero').hidden=mode!=='home';$('browseTitle').textContent=t(mode==='saved'?'navSaved':mode==='mine'?'navMine':'browseTitle');$('browseSubtitle').textContent=t(mode==='saved'?'savedSub':mode==='mine'?'mineSub':'browseSub');}
function empty(title,body,action='reset',label='reset',error=false){return `<div class="empty ${error?'error':''}"><h3>${esc(t(title))}</h3><p>${esc(t(body))}</p><button class="btn" data-action="${action}">${esc(t(label))}</button></div>`;}
function normalize(w){return {...w,details:w.details&&typeof w.details==='object'&&!Array.isArray(w.details)?w.details:{},likes_count:Number(w.likes_count)||0}}
async function timed(query,ms=15000){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),ms);try{return await query.abortSignal(ctrl.signal)}finally{clearTimeout(timer)}}
async function loadWorks(reset=true){
  const seq=++requestSeq;loading=true;if(reset){offset=0;works=[];$('grid').innerHTML='<div class="skeleton" aria-hidden="true"></div>'.repeat(3)}$('status').textContent=t('loading');$('loadMore').hidden=true;
  try{
    if(!sb)throw Error('SDK unavailable');
    if(mode==='mine'&&!user){$('grid').innerHTML=empty('navMine','needLogin','login','signin');$('status').textContent='';return}
    if(mode==='saved'&&!saved.size){$('grid').innerHTML=empty('noSaved','saveHelp','home','explore');$('status').textContent='';return}
    let q=sb.from('work_catalog').select('*',{count:'exact'});
    if(mode==='mine')q=q.eq('owner',user.id);else q=q.eq('archived',false);if(mode==='saved')q=q.in('id',[...saved]);
    if(cats[activeCat])q=q.eq('category',activeCat);if(activeCat==='feedback')q=q.eq('details->>feedback','true');
    if(onlyLink)q=q.not('link','is',null).neq('link','');
    const term=search.replace(/[%_*(),.\\"']/g,' ').trim().replace(/\s+/g,' ').slice(0,100);
    if(term)q=q.or(`title.ilike.%${term}%,description.ilike.%${term}%,owner_name.ilike.%${term}%`);
    if(sort==='hot')q=q.gte('created_at',new Date(Date.now()-30*86400000).toISOString());
    q=sort==='new'?q.order('created_at',{ascending:false}).order('id'):q.order('likes_count',{ascending:false}).order('created_at',{ascending:false}).order('id');
    const {data,error,count}=await timed(q.range(offset,offset+pageSize-1));if(error)throw error;if(seq!==requestSeq)return;
    const rows=(data||[]).map(normalize);rows.forEach(w=>cache.set(w.id,w));works=reset?rows:[...works,...rows];offset+=rows.length;hasMore=offset<(count??offset);renderGrid();$('status').textContent=lang==='zh'?`${count??works.length} 件作品`:`${count??works.length} ${(count??works.length)===1?'creation':'creations'}`;$('loadMore').hidden=!hasMore;$('loadMore').textContent=t('more');
  }catch(e){if(seq!==requestSeq)return;console.warn('Works could not be loaded');$('status').textContent=t('loadError');if(reset)$('grid').innerHTML=empty('loadError','loadErrorBody','retry','retry',true);else{$('loadMore').hidden=false;$('loadMore').textContent=t('retry')}}finally{if(seq===requestSeq){loading=false;$('loadMore').disabled=false}}
}
function launchLabel(w){return t(w.category==='game'?'play':w.category==='video'||w.category==='image'?'watch':w.category==='music'?'listen':'use')}
function accessLabel(w){const k={free:'accessFree',login:'accessLogin',trial:'accessTrial',display:'accessDisplay'}[w.details.access];return k?t(k):''}
function badges(w){return [w.archived?t('archived'):'',accessLabel(w),w.details.mobile===true?t('mobile'):'',w.details.feedback===true?t('feedbackBadge'):''].filter(Boolean).map(s=>`<span class="badge">${esc(s)}</span>`).join('')}
function card(w,i){const cover=safeCover(w.cover_url),url=safeUrl(w.link),title=esc(w.title||t('untitled')),savedOn=saved.has(w.id),liked=likes.has(w.id);return `<article class="card"><a href="#work/${w.id}" class="cover-link" style="background:${colors[i%colors.length]}" aria-label="${title}"><span class="letter" aria-hidden="true">${esc((w.title||'A').slice(0,1))}</span>${cover?`<img src="${esc(cover)}" alt="${title}" loading="lazy">`:''}<span class="cat-label">${esc(cat(w.category))}</span></a><div class="card-body"><h3><a href="#work/${w.id}">${title}</a></h3><div class="author">${esc(w.owner_name||t('anonymous'))}</div><p class="card-desc">${esc(w.description||'')}</p><div class="badges">${badges(w)}</div><div class="card-footer">${url?`<a class="btn small primary launch" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(launchLabel(w))} · ${title} · ${esc(t('external'))}">${esc(launchLabel(w))}</a>`:`<a class="btn small launch" href="#work/${w.id}">${esc(t(w.category==='prompt'?'viewPrompt':'view'))}</a>`}<button class="btn small ${liked?'liked':''}" data-action="like" data-id="${w.id}" aria-label="${esc(t('like'))}" aria-pressed="${liked}">♥ ${w.likes_count}</button><button class="btn small ${savedOn?'saved':''}" data-action="save" data-id="${w.id}" aria-pressed="${savedOn}">${esc(t(savedOn?'saved':'save'))}</button></div></div></article>`}
function renderGrid(){const filtered=search||activeCat!=='all'||onlyLink||sort==='hot';$('grid').innerHTML=works.length?works.map(card).join(''):empty(filtered?'noResults':'empty',filtered?'noResultsBody':'emptyBody',filtered?'reset':'upload',filtered?'reset':'share');fixImages()}
function fixImages(){document.querySelectorAll('.cover-link img').forEach(img=>img.addEventListener('error',()=>img.remove(),{once:true}));}
async function loadDetail(id){const seq=++detailSeq;detailWork=null;$('detail').innerHTML=`<p role="status">${esc(t('loading'))}</p>`;if(!uuid(id)){$('detail').innerHTML=empty('notFound','notFoundBody','home','explore');return}try{if(!sb)throw Error();const {data,error}=await timed(sb.from('work_catalog').select('*').eq('id',id).maybeSingle());if(error)throw error;if(seq!==detailSeq)return;if(!data){$('detail').innerHTML=empty('notFound','notFoundBody','home','explore');return}if(mode!=='detail'||seq!==detailSeq)return;detailWork=normalize(data);cache.set(id,detailWork);renderDetail(detailWork)}catch{if(seq!==detailSeq)return;$('detail').innerHTML=empty('loadError','loadErrorBody','retry-detail','retry',true)}}
function renderDetail(w){const cover=safeCover(w.cover_url),url=safeUrl(w.link),canEdit=user&&user.id===w.owner;document.title=`${w.title} · AIMade`;$('detail').innerHTML=`<a class="text-link" href="#home">${esc(t('back'))}</a><div style="height:20px"></div>${cover?`<img class="detail-cover" src="${esc(cover)}" alt="${esc(w.title)}">`:''}<div class="eyebrow" style="margin-top:25px">${esc(cat(w.category))}</div><h1>${esc(w.title)}</h1><div class="author">${esc(w.owner_name||t('anonymous'))} · ${new Date(w.created_at).toLocaleDateString(lang==='zh'?'zh-Hant':'en')}</div><div class="badges" style="margin-top:15px">${badges(w)}</div><div class="actions">${url?`<a class="btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(launchLabel(w))}</a>`:''}<button class="btn ${likes.has(w.id)?'liked':''}" data-action="like" data-id="${w.id}" aria-pressed="${likes.has(w.id)}">♥ ${w.likes_count}</button><button class="btn" data-action="save" data-id="${w.id}" aria-pressed="${saved.has(w.id)}">${esc(t(saved.has(w.id)?'saved':'save'))}</button><button class="btn" data-action="copy-link" data-id="${w.id}">${esc(t('copyLink'))}</button>${canEdit?`<a class="btn" href="#edit/${w.id}">${esc(t('edit'))}</a><button class="btn" data-action="archive" data-id="${w.id}">${esc(t(w.archived?'restoreWork':'archiveWork'))}</button>`:''}</div><p class="notice">${esc(t('authorLabels'))}</p><div class="description">${esc(w.description)}</div>${typeof w.details.tools==='string'&&w.details.tools?`<p class="help">${esc(t('tools'))}: ${esc(w.details.tools)}</p>`:''}${w.category==='prompt'&&typeof w.details.prompt==='string'?`<h2>Prompt</h2><pre>${esc(w.details.prompt)}</pre><button class="btn" data-action="copy-prompt">${esc(t('copyPrompt'))}</button>`:''}<hr style="border:0;border-top:1px solid var(--line);margin-top:30px"><button class="text-link" data-action="report" data-id="${w.id}">${esc(t('report'))}</button>${isAdmin?`<p class="help">${lang==='zh'?'管理員：檢舉與內容管理請使用 Supabase 後台。':'Administrator: review reports and moderate content in Supabase.'}</p>`:''}`;}
async function copy(text){try{await navigator.clipboard.writeText(text);toast(t('copied'))}catch{toast(t('copyFail'))}}
function saveWork(id){if(saved.has(id))saved.delete(id);else{if(saved.size>=300){toast(t('savedLimit'));return}saved.add(id)}if(!storage.set('aimade_saved',[...saved]))toast(t('draftFail'));if(mode==='detail'&&detailWork)renderDetail(detailWork);else if(mode==='saved')loadWorks();else renderGrid()}
const pendingLikes=new Set();
async function toggleLike(id){if(!user){openLogin();return}if(pendingLikes.has(id))return;pendingLikes.add(id);const owner=user.id;try{const was=likes.has(id);const q=was?sb.from('likes').delete().eq('work_id',id).eq('user_id',owner):sb.from('likes').insert({work_id:id,user_id:owner});const {error}=await timed(q);if(error)throw error;if(user?.id!==owner)return;if(was)likes.delete(id);else likes.add(id);const w=cache.get(id);if(w)w.likes_count=Math.max(0,w.likes_count+(was?-1:1));if(mode==='detail'&&detailWork?.id===id)renderDetail(w||detailWork);else renderGrid()}catch{toast(t('likeFail'))}finally{pendingLikes.delete(id)}}
function validReturnHash(hash){if(typeof hash!=='string')return '#home';if(/^#(?:home|upload|mine|saved|guide)$/.test(hash))return hash;const [key,id]=hash.slice(1).split('/');return ['work','edit'].includes(key)&&uuid(id)&&hash==='#'+key+'/'+id?hash:'#home'}
// Passwords stay only in their input fields / the in-flight SDK call. Never persist them.
const AUTH_ORIGIN='https://aimade.world';
let authMode='signin',authBusy=false,authUiVersion=0,authMail=null,passwordVisible=false,
  recoveryActive=false,recoveryCallbackTab=false,recoveryVerified=false,recoveryUserId=null,recoveryRequest=0;
function clearPasswordFields(){
  $('password').value='';$('passwordConfirm').value='';passwordVisible=false;
  $('password').type=$('passwordConfirm').type='password';
}
function authAllowed(){if(location.origin===AUTH_ORIGIN&&sb)return true;$('loginStatus').textContent=t(location.origin===AUTH_ORIGIN?'authFail':'authPreview');return false}
function rememberAuthReturn(){
  if(mode==='upload'&&dirty&&!saveDraft(false)){$('loginStatus').textContent=t('draftFail');return false}
  storage.set('aimade_auth_return_v3',validReturnHash(location.hash||'#home'));return true;
}
function cleanAuthUrl(removeRecovery=false){
  const u=new URL(location.pathname+location.search,location.origin);
  if(removeRecovery&&u.searchParams.get('auth')==='recovery')u.searchParams.delete('auth');
  const hash=location.hash,authHash=/(?:^#|&)(?:access_token|error|error_code|error_description|refresh_token)=/.test(hash);
  history.replaceState(null,'',u.pathname+u.search+(authHash?'':hash));
}
function renderAuthDialog(){
  clearTimeout(mailTimer);
  const recovery=authMode==='recovery',signup=authMode==='signup',forgot=authMode==='forgot',done=!!authMail;
  $('loginHeading').textContent=t(recovery?'recoveryTitle':signup?'signupTitle':forgot?'forgotTitle':'loginTitle');
  $('loginSub').textContent=t(recovery?'recoverySub':signup?'signupSub':forgot?'forgotSub':'loginSub');
  $('loginForm').hidden=done;$('loginDone').hidden=!done;
  $('signupExistingNotice').hidden=!signup||done;
  $('setupExistingPassword').hidden=!authMail||authMail.kind!=='signup';
  for(const id of ['signupExistingPassword','setupExistingPassword','legacyPasswordSetup'])$(id).disabled=authBusy;
  $('emailField').hidden=recovery;$('email').disabled=recovery;$('email').required=!recovery;
  $('passwordField').hidden=forgot;$('password').disabled=forgot;$('password').required=!forgot;
  $('password').autocomplete=signup||recovery?'new-password':'current-password';
  $('password').minLength=signup||recovery?12:0;
  if(signup||recovery)$('password').setAttribute('aria-describedby','passwordHelp');else $('password').removeAttribute('aria-describedby');
  $('passwordLabel').textContent=t(signup||recovery?'newPassword':'password');
  $('passwordConfirmField').hidden=!(signup||recovery);$('passwordConfirm').disabled=!(signup||recovery);$('passwordConfirm').required=signup||recovery;
  $('passwordHelp').hidden=!(signup||recovery);
  $('signupConsentRow').hidden=!signup;$('signupConsent').required=signup&&!done;
  $('forgotPassword').hidden=authMode!=='signin';$('legacyPassword').hidden=authMode!=='signin'||done;
  $('authFields').disabled=authBusy||(recovery&&!recoveryVerified);
  $('authSubmit').disabled=authBusy||(recovery&&!recoveryVerified);
  const seconds=Math.max(0,Math.ceil((mailCooldownUntil-Date.now())/1000));
  const waiting=t('resendWait').replace('{seconds}',String(seconds));
  if((forgot||signup)&&seconds&&!done)$('authSubmit').disabled=true;
  $('authSubmit').textContent=authBusy?t('authWorking'):(forgot||signup)&&seconds?waiting:t('auth'+(recovery?'Recovery':signup?'Signup':forgot?'Forgot':'Signin'));
  $('showPassword').textContent=t(passwordVisible?'hidePassword':'showPassword');$('showPassword').setAttribute('aria-pressed',String(passwordVisible));
  $('authSwitch').hidden=recovery||done;
  $('authSwitchLabel').textContent=signup?t('haveAccount'):forgot?'':t('noAccount');
  $('authSwitchButton').textContent=t(signup||forgot?'backSignin':'signupLink');$('authSwitchButton').disabled=authBusy;
  $('forgotPassword').disabled=authBusy;$('changeLoginEmail').disabled=authBusy;
  $('resendLink').disabled=authBusy||seconds>0;$('resendLink').textContent=authBusy?t('sending'):seconds?waiting:t(authMail?.kind==='signup'?'resendVerification':'resendPasswordSetup');
  if(authMail){$('loginSentTitle').textContent=t(authMail.kind==='signup'?'signupMailTitle':'resetMailTitle');$('loginSentHelp').textContent=t(authMail.kind==='signup'?'signupMailHelp':'resetMailHelp');$('loginSentEmail').textContent=authMail.email}
  if(seconds)mailTimer=setTimeout(renderAuthDialog,1000);
}
function setAuthMode(next){
  if(authBusy||!['signin','signup','forgot'].includes(next))return;
  ++authUiVersion;authMode=next;authMail=null;clearPasswordFields();$('signupConsent').checked=false;$('loginStatus').textContent='';renderAuthDialog();$('email').focus();
}
function openExistingPasswordSetup(){
  if(authBusy)return;const email=authMail?.email||$('email').value;setAuthMode('forgot');if(email)$('email').value=email;
}
function openLogin(){
  if(!recoveryActive)authMode=['signin','signup','forgot'].includes(authMode)?authMode:'signin';
  if(!$('loginDialog').open)$('loginDialog').showModal();renderAuthDialog();
  if(authMode!=='recovery'&&!authMail)$('email').focus();
}
async function authDeadline(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject({pending:true}),20000)})])}finally{clearTimeout(timer)}}
function authErrorKey(error){
  if(error?.status===429||['over_email_send_rate_limit','over_request_rate_limit'].includes(error?.code))return 'authRate';
  if(error?.pending)return 'authPending';
  if(['invalid_credentials','user_not_found'].includes(error?.code))return 'invalidLogin';
  if(error?.code==='weak_password')return 'passwordWeak';
  if(['reauthentication_needed','reauthentication_not_valid','session_not_found','session_expired'].includes(error?.code))return 'recoveryReauth';
  return 'authFail';
}
function mailResult(kind,email){authMail={kind,email};clearPasswordFields();renderAuthDialog()}
async function requestAuthMail(kind,email,resend=false){
  if(authBusy||Date.now()<mailCooldownUntil){renderAuthDialog();return}
  if(!authAllowed()||!rememberAuthReturn())return;
  const version=authUiVersion;authBusy=true;mailCooldownUntil=Date.now()+60000;$('loginStatus').textContent='';renderAuthDialog();
  try{
    const request=kind==='signup'&&resend?sb.auth.resend({type:'signup',email,options:{emailRedirectTo:AUTH_ORIGIN+'/'}}):sb.auth.resetPasswordForEmail(email,{redirectTo:AUTH_ORIGIN+'/?auth=recovery'});
    const {error}=await authDeadline(request);if(error)throw error;
    if(version===authUiVersion)mailResult(kind,email);
  }catch(error){if(version===authUiVersion)$('loginStatus').textContent=t(authErrorKey(error))}
  finally{authBusy=false;clearPasswordFields();renderAuthDialog()}
}
async function submitAuth(e){
  e.preventDefault();if(authBusy)return;
  const current=authMode,version=authUiVersion,email=$('email').value.trim();
  if(!authAllowed())return;
  if(current!=='recovery'&&(!email||!$('email').checkValidity())){$('email').reportValidity();return}
  if(current==='forgot'){await requestAuthMail('recovery',email);return}
  if(current==='signup'&&Date.now()<mailCooldownUntil){renderAuthDialog();return}
  const password=$('password').value;
  if(!password){$('password').reportValidity();return}
  if(['signup','recovery'].includes(current)){
    if(password.length<12){$('loginStatus').textContent=t('passwordShort');return}
    if(password!==$('passwordConfirm').value){$('loginStatus').textContent=t('passwordMismatch');return}
  }
  if(current==='signup'&&!$('signupConsent').checked){$('loginStatus').textContent=t('signupConsentRequired');return}
  if(current==='recovery'&&(!recoveryVerified||!user||user.id!==recoveryUserId)){$('loginStatus').textContent=t('recoveryExpired');return}
  if(current!=='recovery'&&!rememberAuthReturn())return;
  authBusy=true;$('loginStatus').textContent='';if(current==='signup')mailCooldownUntil=Date.now()+60000;renderAuthDialog();
  try{
    const request=current==='signin'?sb.auth.signInWithPassword({email,password}):current==='signup'?sb.auth.signUp({email,password,options:{emailRedirectTo:AUTH_ORIGIN+'/'}}):sb.auth.updateUser({password});
    const {data,error}=await authDeadline(request);if(error)throw error;
    if(current==='recovery'){
      recoveryActive=false;recoveryCallbackTab=false;recoveryVerified=false;recoveryUserId=null;++recoveryRequest;cleanAuthUrl(true);
      if($('loginDialog').open)$('loginDialog').close();toast(t('passwordSaved'));
      const next=storage.get('aimade_auth_return_v3');storage.remove('aimade_auth_return_v3');
      if(next&&(!location.hash||location.hash==='#home')){history.replaceState(null,'',location.pathname+location.search+validReturnHash(next));route()}
    }else if(data?.session)await refreshUser(data.session);
    else if(current==='signup'&&version===authUiVersion)mailResult('signup',email);
    else if(current==='signin'&&version===authUiVersion)$('loginStatus').textContent=t('authFail');
  }catch(error){
    if(version===authUiVersion){
      if(error?.code==='email_not_confirmed'&&current==='signin'){mailResult('signup',email);$('loginStatus').textContent=t('confirmFirst')}
      else if(current==='signup'&&['user_already_exists','email_exists'].includes(error?.code))mailResult('signup',email);
      else $('loginStatus').textContent=t(authErrorKey(error));
      if(error?.status===429)mailCooldownUntil=Date.now()+60000;
    }
  }finally{authBusy=false;clearPasswordFields();renderAuthDialog()}
}
async function prepareRecovery(session){
  if(!recoveryActive)return;
  if(!session?.user){failRecovery();return}
  if(recoveryUserId===session.user.id&&(recoveryVerified||authMode==='recovery'))return;
  const request=++recoveryRequest;recoveryUserId=session.user.id;recoveryVerified=false;authMode='recovery';authMail=null;clearPasswordFields();
  $('loginStatus').textContent=t('recoveryChecking');openLogin();
  try{
    const {data,error}=await authDeadline(sb.auth.getUser());
    if(request!==recoveryRequest||!recoveryActive)return;
    if(error||data?.user?.id!==recoveryUserId||user?.id!==recoveryUserId)throw Error();
    recoveryVerified=true;$('loginStatus').textContent='';renderAuthDialog();$('password').focus();
  }catch{if(request===recoveryRequest)failRecovery()}
}
function failRecovery(){
  ++recoveryRequest;recoveryActive=false;recoveryCallbackTab=false;recoveryVerified=false;recoveryUserId=null;cleanAuthUrl(true);
  authMode='forgot';authMail=null;clearPasswordFields();$('loginStatus').textContent=t('recoveryExpired');openLogin();
}
function onAuthEvent(event,session){
  if(event==='PASSWORD_RECOVERY'&&recoveryCallbackTab)recoveryActive=true;
  if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>handleAuthState(event,session),0);
}
async function handleAuthState(event,session){
  if(event==='SIGNED_OUT'){
    const wasRecovery=recoveryActive;recoveryActive=false;recoveryCallbackTab=false;recoveryVerified=false;recoveryUserId=null;++recoveryRequest;
    await refreshUser(null);if(wasRecovery)failRecovery();return;
  }
  await Promise.all([refreshUser(session),recoveryActive?prepareRecovery(session):Promise.resolve()]);
}
async function refreshUser(session){
  const seq=++authSeq,previousId=user?.id;user=session?.user||null;const currentId=user?.id;authReady=true;isAdmin=false;adminRoleState=currentId?'checking':'unknown';likes=new Set();renderAuth();
  if(user){
    if(!recoveryActive&&$('loginDialog').open)$('loginDialog').close();
    const next=!recoveryActive&&storage.get('aimade_auth_return_v3');
    if(next){storage.remove('aimade_auth_return_v3');if(!location.hash||location.hash==='#home'){history.replaceState(null,'',location.pathname+location.search+validReturnHash(next));route()}}
    if(location.hash.startsWith('#edit/'))startEdit(location.hash.split('/')[1]);
    if(sb)try{
      const [l,a]=await Promise.all([timed(sb.from('likes').select('work_id').eq('user_id',currentId)),timed(sb.from('admins').select('user_id').eq('user_id',currentId).maybeSingle())]);
      if(seq!==authSeq||user?.id!==currentId)return;
      if(!l.error)likes=new Set((l.data||[]).map(x=>x.work_id));isAdmin=!a.error&&a.data?.user_id===currentId;adminRoleState=a.error?'unknown':isAdmin?'admin':'member';
    }catch{if(seq===authSeq)adminRoleState='unknown'}
    else adminRoleState='unknown';
  }
  if(seq!==authSeq)return;renderAuth();
  if(mode==='detail'){if(previousId!==currentId)loadDetail(location.hash.split('/')[1]);else if(detailWork)renderDetail(detailWork)}
  if(['home','mine','saved'].includes(mode))loadWorks();
  if(!user&&location.hash.startsWith('#edit/'))startEdit(location.hash.split('/')[1]);
}
async function signOutCurrent(){const {error}=await sb.auth.signOut({scope:'local'});if(error)throw error;await refreshUser(null)}
const textFields=['category','access','link','title','description','prompt','displayName','tools'];
const DRAFTS_KEY='aimade_drafts_v3';
function draftObject(d){return !!d&&typeof d==='object'&&!Array.isArray(d)}
function readDrafts(){
  const raw=storage.get(DRAFTS_KEY),result={version:3,create:null,edits:{},lastEdit:null};
  if(draftObject(raw)&&raw.version===3){
    if(draftObject(raw.create)&&!uuid(raw.create.editId))result.create=raw.create;
    if(draftObject(raw.edits))for(const [id,d]of Object.entries(raw.edits))if(uuid(id)&&draftObject(d)&&d.editId===id)result.edits[id]=d;
    if(uuid(raw.lastEdit)&&result.edits[raw.lastEdit])result.lastEdit=raw.lastEdit;
    return result;
  }
  const legacy=storage.get('aimade_draft_v2');
  if(draftObject(legacy)){if(uuid(legacy.editId)){result.edits[legacy.editId]=legacy;result.lastEdit=legacy.editId}else result.create=legacy}
  return result;
}
let drafts=readDrafts();
function persistDrafts(next){if(!storage.set(DRAFTS_KEY,next))return false;drafts=next;storage.remove('aimade_draft_v2');return true}
function draftData(){const d={editId,pendingId,editingCover,owner:user?.id||editOwner||null};textFields.forEach(k=>d[k]=$(k).value);d.mobile=$('mobile').checked;d.feedback=$('feedback').checked;d.removeCover=$('removeCover').checked;return d}
function saveDraft(show=true){const d=draftData(),next={...drafts,edits:{...drafts.edits}};if(editId){next.edits[editId]=d;next.lastEdit=editId}else next.create=d;const ok=persistDrafts(next);if(show)$('draftStatus').textContent=t(ok?'draftSaved':'draftFail');renderEditorContext();return ok}
function discardCurrentDraft(){const next={...drafts,edits:{...drafts.edits}};if(editId){delete next.edits[editId];if(next.lastEdit===editId)next.lastEdit=Object.keys(next.edits).at(-1)||null}else next.create=null;return persistDrafts(next)}
function renderEditorContext(){
  const candidate=drafts.lastEdit&&drafts.edits[drafts.lastEdit];
  const old=user&&(candidate?.owner===user.id?candidate:Object.values(drafts.edits).reverse().find(d=>d.owner===user.id)),editing=!!editId;
  // Preserve other users' drafts locally, but never advertise their titles or edit links here.
  $('editorContext').hidden=!editing&&!old;
  $('editorContextText').textContent=editing?t('editContext'):old?t('editDraftAvailable')+(old.title||t('untitled')):'';
  $('editorContextAction').textContent=t(editing?'newCreation':'resumeEdit');
  $('editorContextAction').setAttribute('href',editing?'#upload':old?'#edit/'+old.editId:'#upload');
}
function clearPreview(){if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;stagedCoverFile=null;stagedCoverUrl='';coverUpload=null;$('coverPreview').hidden=true;$('cover').value='';}
function fillEditor(d){
  textFields.forEach(k=>$(k).value=String(d[k]??(k==='category'?'app':k==='access'?'unknown':k==='displayName'?storage.get('aimade_display',''):'')));
  if(!cats[$('category').value])$('category').value='app';
  $('mobile').checked=!!d.mobile;$('feedback').checked=!!d.feedback;editId=uuid(d.editId)?d.editId:null;editOwner=uuid(d.owner)?d.owner:null;pendingId=uuid(d.pendingId)?d.pendingId:null;editingCover=safeCover(d.editingCover);clearPreview();
  $('removeCover').checked=!!d.removeCover;
  if(editingCover){$('coverPreview').src=editingCover;$('coverPreview').hidden=$('removeCover').checked}
  $('removeCoverRow').hidden=!editingCover;$('rights').checked=false;updatePrompt();$('editorTitle').textContent=t(editId?'editTitle':'uploadTitle');$('publish').textContent=t(editId?'update':'publish');renderEditorContext();
}
function restoreDraft(){const d=drafts.create;$('workForm').reset();fillEditor(d||{});dirty=false;$('draftStatus').textContent=d?t('draftRestored'):'';$('formStatus').textContent=''}
function updatePrompt(){$('promptField').hidden=$('category').value!=='prompt';$('prompt').required=$('category').value==='prompt';}
function guardEditorChange(){clearTimeout(draftTimer);if(dirty&&!saveDraft(false)){toast(t('draftFail'));return false}return !$('cover').files.length||confirm(t('switchCover'))}
async function startEdit(id){
  const seq=++editSeq;$('workForm').hidden=true;$('editorContext').hidden=true;$('editorTitle').textContent=t('editTitle');$('editorLoadStatus').textContent=t('loading');
  if(!uuid(id)){$('editorLoadStatus').textContent=t('notFound');return}
  if(!authReady)return;
  if(!user){$('editorLoadStatus').textContent=t('needLogin');openLogin();return}
  const owner=user.id;
  if(editId===id&&editOwner===owner){$('workForm').hidden=false;$('editorLoadStatus').textContent='';renderEditorContext();return}
  try{
    const {data,error}=await timed(sb.from('works').select('*').eq('id',id).eq('owner',owner).maybeSingle());
    if(seq!==editSeq||user?.id!==owner||location.hash!=='#edit/'+id||mode!=='upload')return;
    if(error||!data)throw Error();const w=normalize(data),savedEdit=drafts.edits[id];
    const previous=draftObject(savedEdit)&&(!savedEdit.owner||savedEdit.owner===owner)?savedEdit:null;
    $('workForm').reset();fillEditor(previous?{...previous,owner}:{editId:id,owner,editingCover:w.cover_url,title:w.title,description:w.description||'',link:w.link||'',category:w.category,displayName:w.owner_name||'',access:w.details.access||'unknown',mobile:w.details.mobile===true,feedback:w.details.feedback===true,tools:w.details.tools||'',prompt:w.details.prompt||''});
    dirty=false;$('formStatus').textContent='';$('draftStatus').textContent=previous?t('editDraftRestored'):'';$('workForm').hidden=false;$('editorLoadStatus').textContent='';
  }catch{if(seq===editSeq)$('editorLoadStatus').textContent=t('notFound')}
}
async function chooseCover(){
  clearTimeout(draftTimer);const file=$('cover').files[0];if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=null;
  if(stagedCoverFile!==file){stagedCoverFile=null;stagedCoverUrl=''}
  if(coverUpload?.file!==file)coverUpload=null;
  if(!file||!validCover(file)){
    if(file){toast(t('badCover'));$('cover').value=''}
    $('coverPreview').hidden=!editingCover||$('removeCover').checked;if(editingCover)$('coverPreview').src=editingCover;return;
  }
  $('removeCover').checked=false;previewUrl=URL.createObjectURL(file);$('coverPreview').src=previewUrl;$('coverPreview').hidden=false;dirty=true;$('draftStatus').textContent=t('coverReady');
}
function validCover(file){return file.size>0&&file.size<=5*1024*1024&&['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)}
async function deadline(promise,ms=20000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Response unconfirmed')),ms)})])}finally{clearTimeout(timer)}}
function uploadCover(file,owner){
  if(coverUpload?.file===file&&coverUpload.owner===owner)return coverUpload.promise;
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[file.type],path=`${owner}/${crypto.randomUUID()}.${ext}`;
  const entry={file,owner,promise:null};coverUpload=entry;
  entry.promise=(async()=>{const {error}=await sb.storage.from('covers').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return sb.storage.from('covers').getPublicUrl(path).data.publicUrl})();
  entry.promise.catch(()=>{if(coverUpload===entry)coverUpload=null});return entry.promise;
}
let publishing=false;
function validateWork(d,consent){
  if(!d.title.trim()||!d.description.trim()||!d.displayName.trim())return 'requiredFields';
  if(d.title.trim().length>120||d.description.trim().length>2000||d.displayName.trim().length>40||d.tools.trim().length>160||d.prompt.length>6000||d.link.length>2000)return 'fieldTooLong';
  if(d.category==='prompt'&&!d.prompt.trim())return 'needPrompt';
  if(!consent)return 'consentRequired';return '';
}
async function submitWork(e){
  e.preventDefault();if(publishing)return;clearTimeout(draftTimer);saveDraft();$('formStatus').textContent='';
  if(!user||!sb){$('formStatus').textContent=t('needLogin');openLogin();return}
  const d=draftData(),validation=validateWork(d,$('rights').checked);
  if(validation){$('formStatus').textContent=t(validation);return}
  let url=d.link.trim();if(url&&!/^[a-z][a-z0-9+.-]*:/i.test(url))url='https://'+url;
  if(url&&!safeUrl(url)){$('formStatus').textContent=t('badLink');return}
  if(url.length>2000){$('formStatus').textContent=t('fieldTooLong');return}
  if(['game','app','tool'].includes(d.category)&&!url){$('formStatus').textContent=t('needLink');return}
  const file=$('cover').files[0];if(file&&!validCover(file)){$('formStatus').textContent=t('badCover');return}
  if(!editId&&!pendingId){pendingId=crypto.randomUUID();saveDraft(false)}
  const owner=user.id,submittedEditId=editId;
  publishing=true;$('editorFields').disabled=true;$('publish').disabled=true;$('publish').textContent=t('busy');
  try{
    let cover=$('removeCover').checked?null:editingCover||null;
    if(file){
      if(stagedCoverFile===file&&safeCover(stagedCoverUrl))cover=stagedCoverUrl;
      else{
        cover=await deadline(uploadCover(file,owner));
        stagedCoverFile=file;stagedCoverUrl=cover;editingCover=cover;saveDraft(false);
      }
    }
    if(user?.id!==owner)throw Error('Session changed');
    const payload={owner,owner_name:d.displayName.trim(),title:d.title.trim(),description:d.description.trim(),category:d.category,link:safeUrl(url)||null,cover_url:cover,details:{access:d.access,mobile:d.mobile,feedback:d.feedback,tools:d.tools.trim(),prompt:d.category==='prompt'?d.prompt.trim():''}};
    const result=submittedEditId?await timed(sb.from('works').update(payload).eq('id',submittedEditId).eq('owner',owner).select('id').single(),20000):await timed(sb.from('works').upsert({...payload,id:pendingId,price:0,accept_tips:false},{onConflict:'id'}).select('id').single(),20000);
    if(result.error)throw result.error;const id=result.data.id;
    storage.set('aimade_display',payload.owner_name);clearTimeout(draftTimer);discardCurrentDraft();dirty=false;toast(t(submittedEditId?'updated':'published'));
    $('workForm').reset();restoreDraft();$('draftStatus').textContent='';location.hash='work/'+id;
  }catch{
    /* A delayed server response may have committed. Keep the cover and pending ID for safe retry. */
    $('formStatus').textContent=t('saveFail');saveDraft(false);
  }finally{publishing=false;$('editorFields').disabled=false;$('publish').disabled=false;$('publish').textContent=t(editId?'update':'publish')}
}
async function archiveWork(id){if(!user||!detailWork||detailWork.id!==id||detailWork.owner!==user.id)return;const target=!detailWork.archived;if(target&&!confirm(t('archiveConfirm')))return;try{const {data,error}=await timed(sb.from('works').update({archived:target}).eq('id',id).eq('owner',user.id).select('id').single());if(error||!data)throw Error();loadDetail(id)}catch{toast(t('saveFail'))}}
async function submitReport(e){e.preventDefault();if(!user||!sb){openLogin();return}const b=e.target.querySelector('button[type=submit]');b.disabled=true;try{const {error}=await timed(sb.from('reports').insert({work_id:reportId,reporter:user.id,reason:$('reportReason').value.trim().slice(0,1000)}));if(error)throw error;$('reportDialog').close();toast(t('reported'))}catch{$('reportStatus').textContent=t('reportFail')}finally{b.disabled=false}}
function renderFAQ(){const entries=lang==='zh'?[
['我可以分享什麼？','AI 協助製作的遊戲、網頁、工具、圖片、影片、音樂、Prompt、文字及設計都歡迎。請上傳你有權分享的內容，註明 AI 工具及限制，不得冒充原作者。'],
['如何讓大家試玩？','已有網站或遊戲網址：分享時貼上連結。訪客不需登入 AIMade 就能開啟外部作品。若外部網站需要登入或有免費額度限制，請在使用條件中標示。'],
['可以直接上傳 HTML 或 ZIP 嗎？','目前不提供可執行程式託管。請先在你自己的網站或支援的託管服務發布，再分享網址。我們不在主站執行使用者上傳的程式。'],
['一定要登入才能瀏覽嗎？','不用。瀏覽、搜尋、開啟外部作品、複製 Prompt 都不需要登入。發布、按讚與檢舉才需要登入帳戶。收藏只保存在目前瀏覽器。'],
['分享要付費嗎？','目前 AIMade 的瀏覽與分享免費，沒有交易或打賞功能。外部作品可能有自己的使用條件，請查看作者說明；本平台不支付作品的 AI API 或託管費用。'],
['草稿、編輯及下架怎樣處理？','填寫時會在本瀏覽器保存文字草稿，圖片需重新選取。發布後登入同一帳號，在「我的作品」或作品頁編輯、下架或恢復顯示。下架不會刪除圖片檔案；永久刪除內容或帳戶請聯絡 hello@aimade.world，我們會核實擁有權後處理。'],
['版權及違規內容怎樣處理？','AIMade 不取得你原有權利的所有權；AI 輸出是否受著作權保護，須視內容及適用法律而定。請確認你有權分享。內容公開不代表平台背書，違規內容會依檢舉及管理員審查處理。'],
['如何回報問題或侵權？','登入後使用作品頁的「檢舉作品」，或把作品網址和問題說明寄至 hello@aimade.world。請勿在外部作品輸入密碼、API key 或其他敏感資料，除非你已確認其可信度。']
]:[
['What can I share?','Games, apps, tools, images, videos, music, prompts, writing and design made with AI assistance. Share only work you have permission to share, credit the tools and explain any limits.'],
['How can people try my work?','Publish your project on your own hosting service, then share its URL. Visitors can open external works without signing in to AIMade. Disclose external sign-in requirements and trial limits.'],
['Can I upload HTML or ZIP files?','Not yet. We do not host or execute user-submitted code on the main site. Share a URL to your hosted project instead.'],
['Do visitors need an account?','No account is needed to browse, search, open external works or copy prompts. Publishing, likes and reports require an account. Saved works stay in this browser only.'],
['Does sharing cost anything?','Browsing and sharing on AIMade are currently free, with no sales or tipping features. External projects may have their own costs and conditions. We do not cover their hosting or AI API bills.'],
['How do drafts, editing and removal work?','Text drafts are stored in this browser. Reselect any cover file before publishing. Sign in to the same account to edit, unpublish or restore from My works. Unpublishing does not erase cover files. For permanent content or account deletion, email hello@aimade.world; ownership will be verified.'],
['Who owns the rights?','AIMade does not take ownership of your existing rights. Whether AI output is protected depends on the content and applicable law. You must have permission to share it. Publication is not endorsement; reports are reviewed by administrators.'],
['How can I report a problem?','Use Report work after signing in, or email the work URL and details to hello@aimade.world. Be cautious about giving passwords, API keys or sensitive information to external sites.']
];$('faqItems').innerHTML=entries.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');}
function route(){
  const hash=location.hash.slice(1),[key,id]=hash.split('/');
  const changingEditor=key==='upload'&&!!editId||key==='edit'&&id!==editId;
  if(changingEditor&&(publishing||!guardEditorChange())){
    if(publishing)toast(t('busy'));
    history.replaceState(null,'',location.pathname+location.search+(lastRouteHash||'#home'));return;
  }
  if(mode==='upload'&&dirty&&!['upload','edit'].includes(key))saveDraft(false);
  $('nav').classList.remove('open');$('menu').setAttribute('aria-expanded','false');
  ['browsePage','uploadPage','detailPage','guidePage'].forEach(k=>$(k).hidden=true);
  document.title=lang==='zh'?'AIMade — 發現、試玩、分享 AI 作品':'AIMade — Discover, try and share AI creations';
  if(key==='work'){++editSeq;mode='detail';$('detailPage').hidden=false;loadDetail(id)}
  else if(key==='upload'||key==='edit'){
    mode='upload';$('uploadPage').hidden=false;
    if(key==='edit')startEdit(id);
    else{++editSeq;if(editId)restoreDraft();$('editorTitle').textContent=t('uploadTitle');$('workForm').hidden=false;$('editorLoadStatus').textContent='';renderEditorContext()}
  }else if(key==='guide'){++editSeq;mode='guide';$('guidePage').hidden=false}
  else{++editSeq;mode=['saved','mine'].includes(key)?key:'home';$('browsePage').hidden=false;updateBrowseHeading();loadWorks()}
  renderAccount();lastRouteHash=location.hash;
  document.querySelectorAll('nav a').forEach(a=>{if(a.getAttribute('href')==='#'+(mode==='detail'?'home':mode))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(hash==='discover')$('discover').scrollIntoView({block:'start'});else window.scrollTo(0,0);
}
function resetFilters(){activeCat='all';search='';sort='new';onlyLink=false;$('search').value='';$('sort').value='new';$('hasLink').checked=false;renderFilters();loadWorks()}
document.addEventListener('click',e=>{const close=e.target.closest('[data-close]');if(close)$(close.dataset.close).close();const chip=e.target.closest('[data-cat]');if(chip){activeCat=chip.dataset.cat;renderFilters();loadWorks();return}const btn=e.target.closest('[data-action]');if(!btn)return;const id=btn.dataset.id;switch(btn.dataset.action){case'retry':loadWorks();break;case'retry-detail':loadDetail(location.hash.split('/')[1]);break;case'reset':resetFilters();break;case'upload':location.hash='upload';break;case'home':location.hash='home';break;case'login':openLogin();break;case'archive':if(uuid(id))archiveWork(id);break;case'like':if(uuid(id))toggleLike(id);break;case'save':if(uuid(id))saveWork(id);break;case'copy-link':copy('https://aimade.world/?w='+id);break;case'copy-prompt':copy(detailWork?.details.prompt||'');break;case'report':if(!user){openLogin();return}reportId=id;$('reportForm').reset();$('reportStatus').textContent='';$('reportDialog').showModal();break;}});
$('menu').addEventListener('click',()=>{$('nav').classList.toggle('open');$('menu').setAttribute('aria-expanded',String($('nav').classList.contains('open')))});
$('lang').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';storage.set('aimade_lang',lang);applyLang();if(['home','saved','mine'].includes(mode))loadWorks()});
$('authButton').addEventListener('click',async()=>{if(!user){openLogin();return}try{await signOutCurrent()}catch{toast(t('authFail'))}});
$('search').addEventListener('input',()=>{search=$('search').value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>loadWorks(),300)});
$('sort').addEventListener('change',()=>{sort=$('sort').value;loadWorks()});$('hasLink').addEventListener('change',()=>{onlyLink=$('hasLink').checked;loadWorks()});$('loadMore').addEventListener('click',()=>{if(loading)return;$('loadMore').disabled=true;loadWorks(false)});
$('workForm').addEventListener('submit',submitWork);$('workForm').addEventListener('input',()=>{dirty=true;clearTimeout(draftTimer);draftTimer=setTimeout(()=>saveDraft(),500)});$('category').addEventListener('change',updatePrompt);$('cover').addEventListener('change',chooseCover);$('saveDraft').addEventListener('click',()=>saveDraft());$('clearDraft').addEventListener('click',()=>{if(publishing||!confirm(t('draftClear')))return;clearTimeout(draftTimer);if(!discardCurrentDraft()){toast(t('draftFail'));return}const wasEdit=!!editId;dirty=false;if(wasEdit){editId=null;editOwner=null;clearPreview();startEdit(location.hash.split('/')[1])}else restoreDraft();$('draftStatus').textContent='';$('formStatus').textContent=''});
$('removeCover').addEventListener('change',()=>{if($('removeCover').checked)clearPreview();else if(editingCover){$('coverPreview').src=editingCover;$('coverPreview').hidden=false}});
$('resendLink').addEventListener('click',()=>{if(authMail)requestAuthMail(authMail.kind,authMail.email,true)});
$('changeLoginEmail').addEventListener('click',()=>setAuthMode(authMail?.kind==='signup'?'signup':'forgot'));
$('authSwitchButton').addEventListener('click',()=>setAuthMode(authMode==='signin'?'signup':'signin'));
$('backToSignin').addEventListener('click',()=>setAuthMode('signin'));
$('forgotPassword').addEventListener('click',()=>setAuthMode('forgot'));
for(const id of ['signupExistingPassword','setupExistingPassword','legacyPasswordSetup'])$(id).addEventListener('click',openExistingPasswordSetup);
$('showPassword').addEventListener('click',()=>{passwordVisible=!passwordVisible;$('password').type=$('passwordConfirm').type=passwordVisible?'text':'password';renderAuthDialog()});
$('loginDialog').addEventListener('close',()=>{
  ++authUiVersion;clearPasswordFields();$('signupConsent').checked=false;authMode='signin';authMail=null;$('loginStatus').textContent='';
  if(recoveryActive){++recoveryRequest;recoveryActive=false;recoveryCallbackTab=false;recoveryVerified=false;recoveryUserId=null;authMode='signin';cleanAuthUrl(true)}
});
$('loginForm').addEventListener('submit',submitAuth);$('reportForm').addEventListener('submit',submitReport);window.addEventListener('hashchange',()=>{if(!location.hash.includes('access_token='))route()});window.addEventListener('beforeunload',()=>{if(dirty)saveDraft(false)});
applyLang();restoreDraft();persistDrafts(drafts);
async function init(){
  const params=new URLSearchParams(location.hash.slice(1)),authError=params.has('error')||params.has('error_description')||params.has('error_code');
  const recoveryIntent=new URLSearchParams(location.search).get('auth')==='recovery'||params.get('type')==='recovery';
  recoveryActive=recoveryIntent;recoveryCallbackTab=recoveryIntent;
  try{if(!window.supabase)throw Error();sb=window.supabase.createClient(SB_URL,SB_KEY);
    sb.auth.onAuthStateChange(onAuthEvent);
    const wid=new URLSearchParams(location.search).get('w');
    if(uuid(wid)&&!location.hash.includes('access_token='))history.replaceState(null,'',location.pathname+'#work/'+wid);
    route();
    const {data,error}=await sb.auth.getSession();if(error)throw error;
    cleanAuthUrl();
    if(authError){const wasRecovery=recoveryActive;recoveryActive=false;recoveryCallbackTab=false;await refreshUser(data.session);if(wasRecovery)failRecovery();else{setAuthMode('signin');$('loginStatus').textContent=t('sessionFail');openLogin()}return}
    await handleAuthState('INITIAL_SESSION',data.session);
  }catch{authReady=true;if(recoveryActive||recoveryIntent)failRecovery();else if(authError){cleanAuthUrl();setAuthMode('signin');$('loginStatus').textContent=t('sessionFail');openLogin()}else{if(!sb)route();else toast(t('authFail'))}if(location.hash.startsWith('#edit/'))$('editorLoadStatus').textContent=t('authFail')}
}
init();
