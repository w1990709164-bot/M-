function openApp(type, tab) {

    // 联系人 / 群聊 / 朋友圈 都收进 Chat 里
    if (type === "contacts") {
        type = "chat"
        tab = "contact"
    }

    if (type === "groups") {
        type = "chat"
        tab = "msg"
        window.__wechatOpenGroupList = true
    }

    if (type === "moments") {
        type = "chat"
        tab = "discovery"
    }

    // 备份收进设置里
    if (type === "backup") {
        type = "settings"
    }

    currentPage = type

    document
        .getElementById("screen")
        .classList
        .remove("hidden")

    const title =
        document.getElementById("appTitle")

    if (title) {
        title.onclick = null
        title.style.color = ""
    }

    const content =
        document.getElementById("appContent")

    if (type === "chat") {

        title.innerText = "Chat"

        content.innerHTML = `
            <div id="wechatRoot"></div>
        `

        showWechatShell(tab || "msg")
        return
    }


    if (type === "memory") {

        showMemoryVault("home")
        return
    }

    if (type === "radio") {

        title.innerText = "随心听 FM"
        content.innerHTML = `
            <div id="radioRoot"></div>
        `

        showRadioHome()
        return
    }

    if (type === "door") {

        title.innerText = "门"
        content.innerHTML = `
            <div id="doorRoot"></div>
        `

        showDoorHome()
        return
    }

    if (type === "forum") {

        title.innerText = "论坛"
        content.innerHTML = `
            <div id="forumRoot"></div>
        `

        showForumHome()
        return
    }

    if (type === "hacker") {

        title.innerText = "入侵"
        content.innerHTML = `
            <div id="hackerRoot"></div>
        `

        showHackerHome()
        return
    }



    if (type === "blindbox") {

        title.innerText = "每日盲盒"
        content.innerHTML = `
            <div id="blindboxRoot"></div>
        `

        showBlindboxHome()
        return
    }



    if (type === "game") {

        title.innerText = "游戏中心"
        content.innerHTML = `
            <div id="gameRoot"></div>
        `

        showGameCenter()
        return
    }

    if (type === "mailbox") {

        title.innerText = "匿名信箱"
        content.innerHTML = `
            <div id="mailboxRoot"></div>
        `

        showMailboxHome()
        return
    }

    if (type === "diary") {

        title.innerText = "交换日记"
        content.innerHTML = `
            <div id="diaryRoot"></div>
        `

        showDiaryHome()
        return
    }

    if (type === "worldbook") {

        title.innerText = "世界书"

        content.innerHTML = `
            <button class="add-btn" onclick="showAddWorldBook()">
                ＋ 添加世界书
            </button>

            <div id="worldBookList"></div>
        `

        loadWorldBooks()
        return
    }



    if (type === "dreamhouse") {

        title.innerText = "梦男之家"
        content.innerHTML = `
            <div id="dreamHouseRoot"></div>
        `

        showDreamHouseHome()
        return
    }

    if (type === "reading") {

        title.innerText = "一起读"
        content.innerHTML = `
            <div id="readingRoot"></div>
        `

        showReadingHome()
        return
    }

    if (type === "pomodoro") {

        title.innerText = "番茄钟"
        content.innerHTML = `
            <div id="pomodoroRoot"></div>
        `

        showPomodoroHome()
        return
    }

    if (type === "schedule") {

        title.innerText = "今日行程"
        content.innerHTML = `
            <div id="scheduleRoot"></div>
        `

        showScheduleHome()
        return
    }

    if (type === "weather") {

        title.innerText = "天气"
        content.innerHTML = `
            <div id="weatherRoot"></div>
        `

        showWeatherHome()
        return
    }

    if (type === "settings") {

        title.innerText = "设置"
        showSettings()
        return
    }
}

function goHome() {

    if (currentPage === "chatDetail") {
        openApp("chat", chatBackPage === "contacts" ? "contact" : "msg")
        return
    }

    if (currentPage === "chatSettingsPage") {
        if (currentContact) {
            openChat(currentContact.id)
        } else {
            openApp("chat", "msg")
        }
        return
    }

    if (currentPage === "groupChat") {
        openApp("chat", "msg")
        return
    }

    if (currentPage === "groupInfo") {
        if (currentGroup) {
            openGroupChat(currentGroup.id)
        } else {
            openApp("chat", "msg")
        }
        return
    }

    if (currentPage === "groupSettingsPage") {
        if (currentGroup) {
            openGroupChat(currentGroup.id)
        } else {
            openApp("chat", "msg")
        }
        return
    }

    if (currentPage === "createGroup") {
        openApp("chat", "msg")
        return
    }

    if (currentPage === "addMoment") {
        openApp("chat", "discovery")
        return
    }


    if (currentPage === "radioHome") {
        try { stopRadioProgram() } catch (_) {}
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "doorChat" || currentPage === "doorSetup") {
        showDoorHome()
        return
    }

    if (currentPage === "doorHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "hackerTarget" || currentPage === "hackerReport") {
        showHackerHome()
        return
    }

    if (currentPage === "hackerHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }


    if (
        currentPage === "gameCenter" ||
        currentPage === "guessNumberGame" ||
        currentPage === "truthDareZone" ||
        currentPage === "truthDareLoading" ||
        currentPage === "truthDareDice" ||
        currentPage === "truthDareCard" ||
        currentPage === "truthDareChat" ||
        currentPage === "truthDareEnd"
    ) {
        if (currentPage === "gameCenter") {
            currentPage = "home"
            document.getElementById("screen").classList.add("hidden")
        } else {
            showGameCenter()
        }
        return
    }

    if (currentPage === "blindboxHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "mailboxHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "forumHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "forumDetail" || currentPage === "forumEditor") {
        openApp("forum")
        return
    }


    if (
        currentPage === "dreamHouseHome" ||
        currentPage === "dreamHouseProfile" ||
        currentPage === "dreamHouseDetail" ||
        currentPage === "dreamHouseHistory"
    ) {
        if (currentPage === "dreamHouseHome") {
            currentPage = "home"
            document.getElementById("screen").classList.add("hidden")
        } else {
            showDreamHouseHome()
        }
        return
    }

    if (currentPage === "readingHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "readingReader") {
        showReadingHome()
        return
    }

    if (
        currentPage === "pomodoroHome" ||
        currentPage === "pomodoroRunning"
    ) {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "scheduleDetail") {
        showScheduleHome()
        return
    }

    if (
        currentPage === "scheduleHome" ||
        currentPage === "weatherHome"
    ) {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (currentPage === "diaryHome") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    if (
        currentPage === "aiDiary" ||
        currentPage === "userDiary" ||
        currentPage === "userDiaryWrite"
    ) {
        showDiaryHome()
        return
    }

    if (currentPage === "diaryDetail") {
        if (currentDiaryOwner) {
            if (currentDiaryOwner.type === "ai") {
                openAiDiary(currentDiaryOwner.id)
            } else {
                openUserDiary()
            }
        } else {
            showDiaryHome()
        }
        return
    }

    if (currentPage === "contactEditor") {
        if (currentContact) {
            openChat(currentContact.id)
        } else {
            openApp("chat", "contact")
        }
        return
    }

    if (currentPage === "memoryEditor") {
        if (currentContact) {
            openChat(currentContact.id)
        } else {
            openApp("chat", "msg")
        }
        return
    }

    if (currentPage === "memoryDetail") {
        showMemoryVault(memoryBackTarget || "home")
        return
    }

    if (currentPage === "memoryVault") {
        if (memoryBackTarget === "chatMe") {
            openApp("chat", "me")
        } else {
            currentPage = "home"
            document.getElementById("screen").classList.add("hidden")
        }
        return
    }

    if (currentPage === "worldbookEditor") {
        openApp("worldbook")
        return
    }

    if (currentPage === "settings") {
        currentPage = "home"
        document.getElementById("screen").classList.add("hidden")
        return
    }

    currentPage = "home"
    document.getElementById("screen").classList.add("hidden")
}

/* ============================================================
   MJI PWA BACK FIX 2026-06-17
   - 独立桌面打开时，系统返回/浏览器返回优先走应用内返回，避免直接退出桌面
============================================================ */
(function(){
    if (window.__mjiPwaBackFix0617) return;
    window.__mjiPwaBackFix0617 = true;

    function screenOpen(){
        const s = document.getElementById("screen");
        return s && !s.classList.contains("hidden");
    }
    function armBackState(){
        try{
            if (!history.state || !history.state.mjiGuard) {
                history.replaceState({mjiGuard:true, home:true}, "", location.href);
            }
            history.pushState({mjiGuard:true, page: window.currentPage || "home"}, "", location.href);
        }catch(e){}
    }

    const oldOpenApp = window.openApp;
    window.openApp = function(type, tab){
        const r = oldOpenApp.apply(this, arguments);
        if (type) setTimeout(armBackState, 30);
        return r;
    };

    const oldGoHome = window.goHome;
    window.goHome = function(){
        const r = oldGoHome.apply(this, arguments);
        setTimeout(function(){
            try{
                if (screenOpen()) history.replaceState({mjiGuard:true, page: window.currentPage || "app"}, "", location.href);
            }catch(e){}
        }, 30);
        return r;
    };

    window.addEventListener("popstate", function(e){
        if (screenOpen()) {
            try { oldGoHome.call(window); } catch(err) {}
            setTimeout(armBackState, 20);
        }
    });

    window.addEventListener("load", function(){ setTimeout(armBackState, 80); });
})();
