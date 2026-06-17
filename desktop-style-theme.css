/* ============================================================
   MJI GLOBAL NAV + FULLSCREEN FIX 2026-06-18 SAFE
   - Every app gets a stable back button
   - Top-right fullscreen button
   - iOS/PWA fallback fullscreen mode
============================================================ */
(function(){
  if (window.__mjiGlobalNavFullscreenFix0618Safe) return;
  window.__mjiGlobalNavFullscreenFix0618Safe = true;

  function $(id){ return document.getElementById(id); }
  function screenOpen(){ const s = $('screen'); return !!(s && !s.classList.contains('hidden')); }
  function hideScreen(){
    try { window.currentPage = 'home'; } catch(e) {}
    const s = $('screen'); if (s) s.classList.add('hidden');
    syncNavButtons();
  }
  function safe(fn){ try { return fn && fn(); } catch(e){ console.warn('MJI back handler failed', e); } }

  function backByPage(){
    const p = window.currentPage || 'home';

    // Chat internal pages
    if (p === 'callPage' && typeof window.endCurrentCall === 'function') { window.endCurrentCall(false); return true; }
    if (p === 'chatSettingsSubPage' && typeof window.showChatSettingsPage === 'function') { window.showChatSettingsPage(); return true; }
    if (['myProfileEditor','chatDisplaySettings','chatBubbleSettings','thoughtsCardSettings'].includes(p)) {
      if (typeof window.renderWechatMe === 'function') { window.currentPage = 'chat'; window.renderWechatMe(); return true; }
      if (typeof window.openApp === 'function') { window.openApp('chat','me'); return true; }
    }

    // Chat shell/detail/group
    if (p === 'chatDetail') { if (typeof window.openApp === 'function') window.openApp('chat', window.chatBackPage === 'contacts' ? 'contact' : 'msg'); return true; }
    if (p === 'chatSettingsPage') { if (window.currentContact && typeof window.openChat === 'function') window.openChat(window.currentContact.id); else if (typeof window.openApp === 'function') window.openApp('chat','msg'); return true; }
    if (p === 'groupChat') { if (typeof window.openApp === 'function') window.openApp('chat','msg'); return true; }
    if (p === 'groupInfo' || p === 'groupSettingsPage') { if (window.currentGroup && typeof window.openGroupChat === 'function') window.openGroupChat(window.currentGroup.id); else if (typeof window.openApp === 'function') window.openApp('chat','msg'); return true; }
    if (p === 'createGroup') { if (typeof window.openApp === 'function') window.openApp('chat','msg'); return true; }
    if (p === 'moments' || p === 'addMoment') { if (typeof window.openApp === 'function') window.openApp('chat','discovery'); return true; }
    if (p === 'contactEditor') { if (window.currentContact && typeof window.openChat === 'function') window.openChat(window.currentContact.id); else if (typeof window.openApp === 'function') window.openApp('chat','contact'); return true; }
    if (p === 'memoryEditor') { if (window.currentContact && typeof window.openChat === 'function') window.openChat(window.currentContact.id); else if (typeof window.openApp === 'function') window.openApp('chat','msg'); return true; }

    // Memory / worldbook
    if (p === 'memoryDetail') { if (typeof window.showMemoryVault === 'function') window.showMemoryVault(window.memoryBackTarget || 'home'); return true; }
    if (p === 'memoryVault') { if (window.memoryBackTarget === 'chatMe' && typeof window.openApp === 'function') window.openApp('chat','me'); else hideScreen(); return true; }
    if (p === 'worldbookEditor') { if (typeof window.openApp === 'function') window.openApp('worldbook'); return true; }

    // Radio / door / hacker
    if (p === 'radioHome') { safe(window.stopRadioProgram); hideScreen(); return true; }
    if (p === 'doorChat' || p === 'doorSetup') { if (typeof window.showDoorHome === 'function') window.showDoorHome(); return true; }
    if (p === 'doorHome') { hideScreen(); return true; }
    if (p === 'hackerTarget' || p === 'hackerReport' || p === 'hackerPhone') { if (typeof window.showHackerHome === 'function') window.showHackerHome(); return true; }
    if (p === 'hackerHome') { hideScreen(); return true; }

    // Forum / mailbox / blindbox / game
    if (p === 'forumDetail' || p === 'forumEditor') { if (typeof window.openApp === 'function') window.openApp('forum'); return true; }
    if (p === 'forumHome' || p === 'mailboxHome' || p === 'blindboxHome') { hideScreen(); return true; }
    if (['guessNumberGame','truthDareZone','truthDareLoading','truthDareDice','truthDareCard','truthDareChat','truthDareEnd'].includes(p)) { if (typeof window.showGameCenter === 'function') window.showGameCenter(); return true; }
    if (p === 'gameCenter') { hideScreen(); return true; }

    // Dream house / reading / pomodoro / schedule / weather / diary
    if (['dreamHouseProfile','dreamHouseDetail','dreamHouseHistory'].includes(p)) { if (typeof window.showDreamHouseHome === 'function') window.showDreamHouseHome(); return true; }
    if (p === 'dreamHouseHome') { hideScreen(); return true; }
    if (p === 'readingReader') { if (typeof window.showReadingHome === 'function') window.showReadingHome(); return true; }
    if (p === 'readingHome') { hideScreen(); return true; }
    if (p === 'pomodoroRunning') { if (typeof window.showPomodoroHome === 'function') window.showPomodoroHome(); else hideScreen(); return true; }
    if (p === 'pomodoroHome') { hideScreen(); return true; }
    if (p === 'scheduleDetail') { if (typeof window.showScheduleHome === 'function') window.showScheduleHome(); return true; }
    if (p === 'scheduleHome' || p === 'weatherHome') { hideScreen(); return true; }
    if (['aiDiary','userDiary','userDiaryWrite'].includes(p)) { if (typeof window.showDiaryHome === 'function') window.showDiaryHome(); return true; }
    if (p === 'diaryDetail') {
      if (window.currentDiaryOwner && typeof window.openAiDiary === 'function' && typeof window.openUserDiary === 'function') {
        if (window.currentDiaryOwner.type === 'ai') window.openAiDiary(window.currentDiaryOwner.id); else window.openUserDiary();
      } else if (typeof window.showDiaryHome === 'function') window.showDiaryHome();
      return true;
    }
    if (p === 'diaryHome') { hideScreen(); return true; }

    // Desktop placeholder / settings / top-level apps
    if (p === 'desktopPlaceholder' || p === 'settings') { hideScreen(); return true; }
    if (['chat','worldbook','radio','door','forum','hacker','mailbox','blindbox','game','diary','dreamhouse','reading','pomodoro','schedule','weather','memory'].includes(p)) { hideScreen(); return true; }

    return false;
  }

  const baseGoHome = window.goHome;
  window.mjiGoBack = function(){
    if (!screenOpen()) return;
    if (backByPage()) { setTimeout(syncNavButtons, 30); pushGuard(); return; }
    try { if (typeof baseGoHome === 'function') baseGoHome.call(window); else hideScreen(); }
    catch(e) { hideScreen(); }
    setTimeout(syncNavButtons, 30);
    pushGuard();
  };
  window.goHome = window.mjiGoBack;

  async function realRequestFullscreen(){
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) { await req.call(el); return true; }
    return false;
  }
  async function realExitFullscreen(){
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (exit) { await exit.call(document); return true; }
    return false;
  }
  function isFull(){ return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || document.body.classList.contains('mji-fake-fullscreen')); }
  function setFakeFull(on){
    document.body.classList.toggle('mji-fake-fullscreen', !!on);
    syncNavButtons();
  }
  window.mjiToggleFullscreen = async function(){
    if (isFull()) {
      try { await realExitFullscreen(); } catch(e) {}
      setFakeFull(false);
    } else {
      let ok = false;
      try { ok = await realRequestFullscreen(); } catch(e) { ok = false; }
      // iPhone Safari often has no requestFullscreen for normal pages, so use CSS fullscreen fallback.
      setFakeFull(true || ok);
    }
  };

  function ensureStyle(){
    if (document.getElementById('mjiGlobalNavFullscreenStyle')) return;
    const st = document.createElement('style');
    st.id = 'mjiGlobalNavFullscreenStyle';
    st.textContent = `
      .app-header{position:relative;z-index:9998;display:flex!important;align-items:center!important;gap:10px!important;}
      .app-header #appTitle{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      #mjiGlobalBackBtn,#mjiFullscreenBtn{width:36px;height:36px;border:0;border-radius:13px;background:rgba(255,255,255,.52);color:#687080;display:flex;align-items:center;justify-content:center;font-weight:900;-webkit-tap-highlight-color:transparent;cursor:pointer;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
      #mjiGlobalBackBtn{font-size:28px;line-height:1;padding-bottom:3px;}
      #mjiFullscreenBtn{font-size:17px;margin-left:auto;}
      .screen.hidden #mjiGlobalBackBtn,.screen.hidden #mjiFullscreenBtn{display:none!important;}
      body.mji-fake-fullscreen{background:#000!important;align-items:stretch!important;justify-content:stretch!important;width:100vw!important;height:100dvh!important;overflow:hidden!important;}
      body.mji-fake-fullscreen .phone{width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;border-radius:0!important;box-shadow:none!important;}
      body.mji-fake-fullscreen .screen{border-radius:0!important;}
      body.mji-fake-fullscreen .desktop-main,body.mji-fake-fullscreen .desktop-bg{border-radius:0!important;}
      body.mji-fake-fullscreen .app-header{height:calc(54px + env(safe-area-inset-top))!important;padding-top:env(safe-area-inset-top)!important;}
      @supports (height:100svh){body.mji-fake-fullscreen .phone{height:100svh!important;}}
      :fullscreen body{background:#000!important;}
    `;
    document.head.appendChild(st);
  }

  function syncNavButtons(){
    ensureStyle();
    const header = document.querySelector('.app-header');
    if (!header) return;
    let back = document.getElementById('mjiGlobalBackBtn') || header.querySelector('button');
    if (!back) {
      back = document.createElement('button');
      header.insertBefore(back, header.firstChild);
    }
    back.id = 'mjiGlobalBackBtn';
    back.type = 'button';
    if (back.textContent !== '‹') back.textContent = '‹';
    back.setAttribute('aria-label','返回');
    back.onclick = function(e){ e.preventDefault(); e.stopPropagation(); window.mjiGoBack(); };

    let title = document.getElementById('appTitle');
    if (title && title.parentElement !== header) header.appendChild(title);

    let fs = document.getElementById('mjiFullscreenBtn');
    if (!fs) {
      fs = document.createElement('button');
      fs.id = 'mjiFullscreenBtn';
      fs.type = 'button';
      header.appendChild(fs);
    } else if (fs.parentElement !== header) {
      header.appendChild(fs);
    }
    const __mjiFsText = isFull() ? '⤢' : '⛶'; if (fs.textContent !== __mjiFsText) fs.textContent = __mjiFsText;
    const __mjiFsTitle = isFull() ? '退出全屏' : '全屏'; if (fs.title !== __mjiFsTitle) fs.title = __mjiFsTitle; if (fs.getAttribute('aria-label') !== __mjiFsTitle) fs.setAttribute('aria-label', __mjiFsTitle);
    fs.onclick = function(e){ e.preventDefault(); e.stopPropagation(); window.mjiToggleFullscreen(); };
  }

  function pushGuard(){
    try{
      if (!history.state || !history.state.mjiGuard) history.replaceState({mjiGuard:true, home:true}, '', location.href);
      history.pushState({mjiGuard:true, page: window.currentPage || 'home'}, '', location.href);
    }catch(e){}
  }

  const baseOpenApp = window.openApp;
  if (typeof baseOpenApp === 'function') {
    window.openApp = function(){
      const r = baseOpenApp.apply(this, arguments);
      setTimeout(function(){ syncNavButtons(); pushGuard(); }, 30);
      return r;
    };
  }

  window.addEventListener('popstate', function(){
    if (screenOpen()) {
      try { window.mjiGoBack(); } catch(e) { hideScreen(); }
      setTimeout(pushGuard, 20);
    }
  }, true);
  ['fullscreenchange','webkitfullscreenchange','resize','orientationchange'].forEach(ev => window.addEventListener(ev, syncNavButtons));
  document.addEventListener('DOMContentLoaded', function(){ syncNavButtons(); setTimeout(pushGuard, 80); });
  window.addEventListener('load', function(){ syncNavButtons(); setTimeout(pushGuard, 120); });

  // 不再用全局 MutationObserver：部分手机浏览器会因为按钮文字/节点同步产生死循环，导致页面无响应。
  syncNavButtons();
})();

/* ============================================================
   MJI FINAL HOTFIX 2026-06-18 SAFE
   - Desktop visible fullscreen button
   - Force Chat -> Me profile/settings click to work after cache merges
   - No dependency on older inline onclick handlers
============================================================ */
(function(){
  if (window.__mjiFinalHotfix0618Safe) return;
  window.__mjiFinalHotfix0618Safe = true;

  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s])); }
  function attr(v){ return esc(v).replace(/'/g, '&#39;'); }
  function setAppTitle(t){ const el = byId('appTitle'); if (el) el.textContent = t || 'Chat'; }
  function appContent(){ return byId('wechatView') || byId('appContent'); }
  function openScreen(){ const s=byId('screen'); if(s) s.classList.remove('hidden'); }
  function setActiveMe(){
    document.querySelectorAll('.wechat-bottom-nav button').forEach(b=>b.classList.remove('active'));
    const me=byId('nav_me'); if(me) me.classList.add('active');
  }
  function profile(){
    return {
      name: localStorage.getItem('MJI_MY_NAME') || localStorage.getItem('MJI_PROFILE_NAME') || '我',
      age: localStorage.getItem('MJI_MY_AGE') || '',
      birthday: localStorage.getItem('MJI_MY_BIRTHDAY') || '',
      gender: localStorage.getItem('MJI_MY_GENDER') || '',
      identity: localStorage.getItem('MJI_MY_IDENTITY') || '',
      profile: localStorage.getItem('MJI_MY_PROFILE') || '',
      avatar: localStorage.getItem('MJI_MY_AVATAR') || localStorage.getItem('MJI_MY_AVATAR_DATA') || ''
    };
  }
  function avatarHtml(src){
    return src ? '<img src="'+attr(src)+'" alt="头像">' : '<div class="mji-me-avatar-fallback">我</div>';
  }
  function fileToDataUrl(file){
    return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
  }
  function ensureFinalCss(){
    if (byId('mjiFinalHotfixCss0618')) return;
    const st=document.createElement('style');
    st.id='mjiFinalHotfixCss0618';
    st.textContent = `
      #mjiDesktopFullscreenBtn{position:fixed;right:14px;top:calc(env(safe-area-inset-top,0px) + 74px);z-index:99999;width:42px;height:42px;border:0;border-radius:15px;background:rgba(245,242,236,.58);color:#677082;font-weight:900;font-size:18px;box-shadow:0 8px 22px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.68);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;}
      #mjiDesktopFullscreenBtn:active,#mjiGlobalBackBtn:active,#mjiFullscreenBtn:active{transform:scale(.96);}
      .screen:not(.hidden) ~ #mjiDesktopFullscreenBtn{display:none!important;}
      .mji-me-final,.mji-me-final *{box-sizing:border-box;pointer-events:auto!important;}
      .mji-me-final{padding:18px 14px 96px;min-height:100%;background:var(--app-bg,#f3f1ec);}
      .mji-me-card-final{width:100%;border:0;background:rgba(255,255,255,.78);border-radius:22px;border:1px solid rgba(255,255,255,.6);box-shadow:0 8px 24px rgba(0,0,0,.045);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);color:#141821;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
      .mji-me-profile-final{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 14px;}
      .mji-me-avatar-final{width:62px;height:62px;border-radius:20px;overflow:hidden;background:#e8e6e0;flex:0 0 62px;}
      .mji-me-avatar-final img{width:100%;height:100%;object-fit:cover;display:block;}
      .mji-me-avatar-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#6b7280;}
      .mji-me-name-final{font-size:20px;font-weight:900;line-height:1.2;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .mji-me-arrow-final{font-size:24px;color:#9ca3af;}
      .mji-me-setting-final{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;}
      .mji-me-setting-title-final{font-size:16px;font-weight:900;margin-bottom:4px;}
      .mji-me-setting-sub-final{font-size:12px;color:#8b909a;line-height:1.45;}
      .mji-final-subpage{padding:14px 14px 96px;background:var(--app-bg,#f3f1ec);min-height:100%;}
      .mji-final-form{background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.6);border-radius:22px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.045);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}
      .mji-final-form input,.mji-final-form select,.mji-final-form textarea{width:100%;border:1px solid rgba(0,0,0,.07);outline:0;background:rgba(255,255,255,.75);border-radius:15px;padding:12px 13px;margin:8px 0;font-size:15px;color:#111;}
      .mji-final-form textarea{min-height:130px;resize:vertical;line-height:1.55;}
      .mji-final-save,.mji-final-row{width:100%;min-height:48px;border:0;border-radius:16px;background:#c8d4ee;color:#323846;font-weight:900;margin-top:10px;font-size:15px;touch-action:manipulation;}
      .mji-final-row{background:rgba(255,255,255,.78);display:flex;align-items:center;justify-content:space-between;padding:0 15px;text-align:left;color:#141821;}
      .mji-final-row small{display:block;color:#8b909a;font-size:12px;font-weight:500;margin-top:3px;line-height:1.4;}
      .mji-final-danger{background:#f3d1d1;color:#8f1d1d;}
      .mji-final-avatar-preview{width:70px;height:70px;border-radius:22px;overflow:hidden;background:#e8e6e0;margin-bottom:10px;}
      .mji-final-avatar-preview img{width:100%;height:100%;object-fit:cover;display:block;}
      .mji-final-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px!important;min-height:220px!important;}
      body.mji-fake-fullscreen #mjiDesktopFullscreenBtn{display:none!important;}
    `;
    document.head.appendChild(st);
  }

  function renderMe(){
    ensureFinalCss(); openScreen(); setActiveMe(); setAppTitle('Chat');
    window.currentPage='chat'; window.currentWechatTab='me';
    const v=appContent(); if(!v) return;
    const m=profile();
    v.innerHTML = `
      <div class="mji-me-final">
        <button type="button" class="mji-me-card-final mji-me-profile-final" data-mji-final-action="profile">
          <div class="mji-me-avatar-final">${avatarHtml(m.avatar)}</div>
          <div class="mji-me-name-final">${esc(m.name || '我')}</div>
          <span class="mji-me-arrow-final">›</span>
        </button>
        <button type="button" class="mji-me-card-final mji-me-setting-final" data-mji-final-action="settings">
          <div><div class="mji-me-setting-title-final">设置</div><div class="mji-me-setting-sub-final">聊天气泡设置、心声卡片设置</div></div>
          <span class="mji-me-arrow-final">›</span>
        </button>
      </div>`;
  }

  function renderProfile(){
    ensureFinalCss(); openScreen(); setAppTitle('个人资料'); window.currentPage='myProfileEditor';
    const v=appContent(); if(!v) return; const m=profile();
    v.innerHTML = `
      <div class="mji-final-subpage"><div class="mji-final-form">
        <div class="mji-final-avatar-preview">${avatarHtml(m.avatar)}</div>
        <input type="file" id="mjiFinalAvatar" accept="image/*">
        <input id="mjiFinalName" placeholder="姓名 / 昵称" value="${attr(m.name)}">
        <input id="mjiFinalAge" placeholder="年龄" value="${attr(m.age)}">
        <input id="mjiFinalBirthday" placeholder="生日，例如 09-16 / 1999-09-16" value="${attr(m.birthday)}">
        <select id="mjiFinalGender">${['','女','男','非二元','不透露'].map(x=>`<option value="${attr(x)}" ${x===m.gender?'selected':''}>${x||'选择性别'}</option>`).join('')}</select>
        <input id="mjiFinalIdentity" placeholder="身份 / 职业 / 自设身份" value="${attr(m.identity)}">
        <textarea id="mjiFinalProfile" placeholder="具体信息：角色需要知道的你的设定、性格、雷点、偏好等">${esc(m.profile)}</textarea>
        <button type="button" class="mji-final-save" data-mji-final-action="save-profile">保存个人资料</button>
      </div></div>`;
  }

  async function saveProfile(){
    const f=byId('mjiFinalAvatar')?.files?.[0];
    if(f){ const data=await fileToDataUrl(f); localStorage.setItem('MJI_MY_AVATAR', data); localStorage.setItem('MJI_MY_AVATAR_DATA', data); }
    localStorage.setItem('MJI_MY_NAME', byId('mjiFinalName')?.value.trim() || '我');
    localStorage.setItem('MJI_PROFILE_NAME', byId('mjiFinalName')?.value.trim() || '我');
    localStorage.setItem('MJI_MY_AGE', byId('mjiFinalAge')?.value.trim() || '');
    localStorage.setItem('MJI_MY_BIRTHDAY', byId('mjiFinalBirthday')?.value.trim() || '');
    localStorage.setItem('MJI_MY_GENDER', byId('mjiFinalGender')?.value || '');
    localStorage.setItem('MJI_MY_IDENTITY', byId('mjiFinalIdentity')?.value.trim() || '');
    localStorage.setItem('MJI_MY_PROFILE', byId('mjiFinalProfile')?.value.trim() || '');
    alert('个人资料已保存'); renderMe();
  }

  function renderSettings(){
    ensureFinalCss(); openScreen(); setAppTitle('设置'); window.currentPage='chatDisplaySettings';
    const v=appContent(); if(!v) return;
    v.innerHTML = `<div class="mji-final-subpage">
      <button type="button" class="mji-final-row" data-mji-final-action="bubble"><span><b>聊天气泡设置</b><small>修改聊天背景、气泡颜色、圆角、字体等 CSS</small></span><span>›</span></button>
      <button type="button" class="mji-final-row" data-mji-final-action="thoughts"><span><b>心声卡片设置</b><small>修改点击角色头像后弹出的心声卡片模板</small></span><span>›</span></button>
    </div>`;
  }
  function renderBubble(){
    ensureFinalCss(); setAppTitle('聊天气泡设置'); window.currentPage='chatBubbleSettings';
    const v=appContent(); if(!v) return; const css=localStorage.getItem('MJI_CHAT_CUSTOM_CSS')||'';
    v.innerHTML=`<div class="mji-final-subpage"><div class="mji-final-form">
      <input type="file" id="mjiFinalCssFile" accept=".css,text/css,text/plain">
      <textarea id="mjiFinalCssText" class="mji-final-code" placeholder="粘贴 Chat CSS">${esc(css)}</textarea>
      <button type="button" class="mji-final-save" data-mji-final-action="save-bubble">保存并应用</button>
      <button type="button" class="mji-final-save mji-final-danger" data-mji-final-action="clear-bubble">恢复默认</button>
    </div></div>`;
    const file=byId('mjiFinalCssFile'); if(file) file.onchange=async()=>{ const f=file.files?.[0]; if(f) byId('mjiFinalCssText').value=await f.text(); };
  }
  function renderThoughts(){
    ensureFinalCss(); setAppTitle('心声卡片设置'); window.currentPage='thoughtsCardSettings';
    const v=appContent(); if(!v) return; const tpl=localStorage.getItem('MJI_THOUGHTS_CARD_TEMPLATE')||''; const css=localStorage.getItem('MJI_THOUGHTS_CARD_CSS')||'';
    v.innerHTML=`<div class="mji-final-subpage"><div class="mji-final-form">
      <input type="file" id="mjiFinalThoughtsFile" accept=".html,.css,text/html,text/css,text/plain">
      <textarea id="mjiFinalThoughtsTpl" class="mji-final-code" placeholder="粘贴心声卡片 HTML 模板">${esc(tpl)}</textarea>
      <textarea id="mjiFinalThoughtsCss" class="mji-final-code" placeholder="单独 CSS，可空">${esc(css)}</textarea>
      <button type="button" class="mji-final-save" data-mji-final-action="save-thoughts">保存心声卡片</button>
      <button type="button" class="mji-final-save mji-final-danger" data-mji-final-action="clear-thoughts">恢复默认</button>
    </div></div>`;
    const file=byId('mjiFinalThoughtsFile'); if(file) file.onchange=async()=>{ const f=file.files?.[0]; if(!f)return; const text=await f.text(); if((f.name||'').toLowerCase().endsWith('.css')) byId('mjiFinalThoughtsCss').value=text; else byId('mjiFinalThoughtsTpl').value=text; };
  }

  async function action(a,e){
    if(!a) return false; if(e){ e.preventDefault(); e.stopPropagation(); }
    if(a==='profile'){ renderProfile(); return true; }
    if(a==='settings'){ renderSettings(); return true; }
    if(a==='save-profile'){ await saveProfile(); return true; }
    if(a==='bubble'){ renderBubble(); return true; }
    if(a==='thoughts'){ renderThoughts(); return true; }
    if(a==='save-bubble'){ localStorage.setItem('MJI_CHAT_CUSTOM_CSS', byId('mjiFinalCssText')?.value||''); if(typeof window.applyChatCustomCss==='function') window.applyChatCustomCss(); alert('聊天气泡设置已保存'); return true; }
    if(a==='clear-bubble'){ localStorage.removeItem('MJI_CHAT_CUSTOM_CSS'); if(typeof window.applyChatCustomCss==='function') window.applyChatCustomCss(); alert('已恢复默认聊天气泡'); renderBubble(); return true; }
    if(a==='save-thoughts'){ localStorage.setItem('MJI_THOUGHTS_CARD_TEMPLATE', byId('mjiFinalThoughtsTpl')?.value||''); localStorage.setItem('MJI_THOUGHTS_CARD_CSS', byId('mjiFinalThoughtsCss')?.value||''); alert('心声卡片设置已保存'); return true; }
    if(a==='clear-thoughts'){ localStorage.removeItem('MJI_THOUGHTS_CARD_TEMPLATE'); localStorage.removeItem('MJI_THOUGHTS_CARD_CSS'); alert('已恢复默认心声卡片'); renderThoughts(); return true; }
    return false;
  }

  function handle(e){
    const t=e.target;
    const finalNode=t && t.closest ? t.closest('[data-mji-final-action]') : null;
    if(finalNode){ action(finalNode.getAttribute('data-mji-final-action'), e); return; }
    const me=t && t.closest ? t.closest('#nav_me') : null;
    if(me){ e.preventDefault(); e.stopPropagation(); renderMe(); return; }
  }
  document.addEventListener('click', handle, true);
  document.addEventListener('pointerup', handle, true);
  document.addEventListener('touchend', handle, true);

  const oldSwitch=window.switchWechatTab;
  window.switchWechatTab=function(tab){ if(tab==='me') return renderMe(); return typeof oldSwitch==='function' ? oldSwitch.apply(this, arguments) : undefined; };
  window.renderWechatMe=renderMe;
  window.showMyProfileEditor=renderProfile;
  window.showChatDisplaySettingsPage=renderSettings;
  window.showChatBubbleSettingsEditor=renderBubble;
  window.showThoughtsCardSettingsEditor=renderThoughts;

  const oldOpenApp=window.openApp;
  if(typeof oldOpenApp==='function'){
    window.openApp=function(app, sub){
      const r=oldOpenApp.apply(this, arguments);
      if(app==='chat' && sub==='me') setTimeout(renderMe, 60);
      return r;
    };
  }

  function bindDesktopFullscreen(){
    ensureFinalCss();
    let btn=byId('mjiDesktopFullscreenBtn');
    const phone=byId('desktopRoot') || document.querySelector('.phone');
    if(!btn && phone){ btn=document.createElement('button'); btn.id='mjiDesktopFullscreenBtn'; btn.type='button'; btn.textContent='⛶'; btn.setAttribute('aria-label','全屏'); phone.appendChild(btn); }
    if(btn){ btn.onclick=function(e){ e.preventDefault(); e.stopPropagation(); if(typeof window.mjiToggleFullscreen==='function') window.mjiToggleFullscreen(); else document.body.classList.toggle('mji-fake-fullscreen'); }; }
  }
  document.addEventListener('DOMContentLoaded', bindDesktopFullscreen);
  window.addEventListener('load', bindDesktopFullscreen);
  setTimeout(bindDesktopFullscreen, 60);
})();
