/* ============================================================
   MJI GLOBAL NAV + FULLSCREEN FIX 2026-06-17
   - Every app gets a stable back button
   - Top-right fullscreen button
   - iOS/PWA fallback fullscreen mode
============================================================ */
(function(){
  if (window.__mjiGlobalNavFullscreenFix0617) return;
  window.__mjiGlobalNavFullscreenFix0617 = true;

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
    back.textContent = '‹';
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
    fs.textContent = isFull() ? '⤢' : '⛶';
    fs.title = isFull() ? '退出全屏' : '全屏';
    fs.setAttribute('aria-label', fs.title);
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

  try{
    const mo = new MutationObserver(function(){ syncNavButtons(); });
    mo.observe(document.body, { childList:true, subtree:true });
  }catch(e){}

  syncNavButtons();
})();
