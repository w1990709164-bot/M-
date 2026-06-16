let radioContacts = []
let radioStations = []
let radioSelectedContact = null
let radioSelectedProgram = "story"
let radioSegments = []
let radioCurrentIndex = 0
let radioPlaying = false
let radioPaused = false
let radioStopFlag = false
let radioSpeechUtterance = null
let radioSegmentTimer = null
let radioBgCtx = null
let radioBgGain = null
let radioBgNodes = []
let radioMusicTimer = null
let radioFreqTimer = null
let radioProgramStartedAt = 0

const RADIO_PROGRAM_NAMES = {
    story: "故事时间",
    news: "赛博新闻",
    music: "音乐节目",
    sleep: "哄睡电台"
}

const RADIO_PROGRAM_ICONS = {
    story: "📖",
    news: "📡",
    music: "🎵",
    sleep: "🌙"
}

function ensureRadioStyles() {
    if (document.getElementById("radioStyle")) return
    const style = document.createElement("style")
    style.id = "radioStyle"
    style.textContent = `
        .radio-shell{min-height:100%;background:#0a0a0c;color:#e8e0d0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;padding-bottom:86px;position:relative;overflow:hidden;}
        .radio-shell:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 40% at 85% 15%,rgba(200,160,80,.05),transparent 60%),radial-gradient(ellipse 50% 50% at 15% 85%,rgba(100,80,30,.06),transparent 60%);}
        .radio-head{position:sticky;top:0;z-index:5;height:54px;background:#141418;border-bottom:1px solid rgba(200,160,80,.15);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;}
        .radio-title{font-size:15px;font-weight:800;letter-spacing:4px;color:#c8a050;z-index:2;}
        .radio-ticks{position:absolute;bottom:0;left:0;right:0;height:12px;display:flex;align-items:flex-end;overflow:hidden;}
        .radio-tick{flex:1;background:rgba(200,160,80,.18);height:5px;}
        .radio-tick:nth-child(3n){height:10px}.radio-tick:nth-child(3n+1){height:6px}.radio-tick.active{background:#c8a050;}
        .radio-needle{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:2px;height:14px;background:#e05050;border-radius:1px;box-shadow:0 0 6px #e05050;z-index:3;}
        .radio-body{position:relative;z-index:1;padding:16px 16px 0;}
        .radio-card{background:#141418;border-radius:18px;border:1px solid rgba(200,160,80,.12);padding:18px 16px;display:flex;align-items:center;gap:14px;}
        .radio-disc-wrap{width:72px;height:72px;position:relative;flex-shrink:0;}
        .radio-disc{width:72px;height:72px;border-radius:50%;background:conic-gradient(#1a1a22 0deg,#111116 45deg,#1a1a22 90deg,#111116 135deg,#1a1a22 180deg,#111116 225deg,#1a1a22 270deg,#111116 315deg,#1a1a22 360deg);border:2px solid #2a2a36;}
        .radio-disc.spinning{animation:radioSpin 3s linear infinite}@keyframes radioSpin{to{transform:rotate(360deg)}}
        .radio-hole{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle,#282832 0%,#0a0a0c 58%,#050506 100%);border:1px solid #333;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
        .radio-info{flex:1;min-width:0;}.radio-station-title{font-size:17px;font-weight:800;color:#e8c870;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:1px;}.radio-host{font-size:13px;color:#706858;margin-top:4px}.radio-plays{font-size:11px;color:#706858;margin-top:6px;display:flex;align-items:center;gap:5px}.radio-dot{width:5px;height:5px;border-radius:50%;background:#c8a050;opacity:.65;}
        .radio-avatar{width:72px;height:72px;border-radius:12px;object-fit:cover;background:#1c1c22;border:2px solid #3a3428;flex-shrink:0;}.radio-avatar-empty{display:flex;align-items:center;justify-content:center;color:#c8a050;font-weight:800;background:linear-gradient(135deg,#25252c,#15151a);}
        .radio-tabs{display:flex;background:#141418;border-radius:12px;overflow:hidden;border:1px solid rgba(200,160,80,.1);margin-top:14px;}.radio-tab{flex:1;padding:10px 4px;text-align:center;font-size:12px;color:#706858;border:0;background:transparent;display:flex;flex-direction:column;gap:3px;align-items:center;}.radio-tab.active{background:rgba(200,160,80,.12);color:#c8a050;}.radio-tab-icon{font-size:16px;}
        .radio-hosts{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:14px 0 2px;}.radio-hosts::-webkit-scrollbar{display:none}.radio-host-chip{flex-shrink:0;min-width:60px;display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 10px;background:#141418;border-radius:12px;border:1.5px solid transparent;}.radio-host-chip.active{border-color:#c8a050;background:rgba(200,160,80,.1)}.radio-host-av{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1.5px solid #3a3428;background:#1c1c22;}.radio-host-initial{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#1c1c22;color:#c8a050;font-weight:800;border:1.5px solid #3a3428;}.radio-host-name{font-size:11px;color:#706858;max-width:56px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}.radio-host-chip.active .radio-host-name{color:#c8a050}
        .radio-wave{display:flex;align-items:center;justify-content:center;gap:2px;height:24px;padding:6px 0;}.radio-wv{width:2px;border-radius:1px;background:#c8a050;height:3px;opacity:.35}.radio-wave.active .radio-wv{animation:radioWv .8s ease infinite;opacity:1}.radio-wv:nth-child(2){animation-delay:.1s}.radio-wv:nth-child(3){animation-delay:.2s}.radio-wv:nth-child(4){animation-delay:.15s}.radio-wv:nth-child(5){animation-delay:.05s}.radio-wv:nth-child(6){animation-delay:.25s}.radio-wv:nth-child(7){animation-delay:.08s}.radio-wv:nth-child(8){animation-delay:.18s}@keyframes radioWv{0%,100%{height:3px;opacity:.3}50%{height:16px;opacity:1}}
        .radio-subtitles{display:none;margin-top:10px;background:#141418;border-radius:14px;border:1px solid rgba(200,160,80,.08);min-height:128px;max-height:240px;overflow-y:auto;padding:14px;}.radio-subtitles::-webkit-scrollbar{display:none}.radio-line{font-size:14px;line-height:1.9;color:#706858;transition:all .2s;padding:1px 0;white-space:pre-wrap;word-break:break-word;}.radio-line.active{color:#e8e0d0;font-size:15px}.radio-trans{font-size:12px;color:rgba(200,160,80,.58);margin:1px 0 8px;display:none;font-style:italic;line-height:1.6;white-space:pre-wrap;word-break:break-word}.radio-trans.show{display:block}.radio-song{display:none;align-items:center;gap:8px;padding:10px 14px;background:rgba(200,160,80,.06);border-radius:10px;margin-top:8px;font-size:13px;color:#c8a050;}.radio-song.show{display:flex}.radio-note{display:none;font-size:13px;color:#706858;padding:8px 14px;background:rgba(200,160,80,.06);border-radius:10px;margin-top:8px}.radio-note.show{display:block}
        .radio-status{text-align:center;font-size:12px;color:#706858;padding:10px 4px 0;min-height:30px;line-height:1.7}.radio-start-wrap{padding:10px 0 6px}.radio-start{width:100%;padding:14px;background:linear-gradient(135deg,#c8a050,#a07030);color:#fff;border:0;border-radius:14px;font-size:16px;font-weight:800;letter-spacing:2px;box-shadow:0 3px 16px rgba(200,160,80,.22)}.radio-start:disabled{background:#2a2a2a;color:#555;box-shadow:none}
        .radio-settings{margin-top:12px;background:#141418;border:1px solid rgba(200,160,80,.1);border-radius:14px;overflow:hidden}.radio-settings summary{padding:12px 14px;color:#c8a050;font-size:13px;font-weight:700}.radio-setting-body{padding:0 14px 14px;display:flex;flex-direction:column;gap:8px}.radio-setting-row{display:flex;gap:8px}.radio-input,.radio-select{width:100%;border:1px solid rgba(200,160,80,.18);background:#1c1c22;color:#e8e0d0;border-radius:10px;padding:10px;font-size:13px;outline:0}.radio-save{border:0;background:#c8a050;color:#141418;border-radius:10px;padding:10px 12px;font-weight:800;white-space:nowrap}.radio-mini-tip{font-size:11px;color:#706858;line-height:1.6}
        .radio-bottom{position:fixed;bottom:0;left:0;right:0;height:72px;z-index:20;background:#141418;border-top:1px solid rgba(200,160,80,.12);display:flex;align-items:center;justify-content:space-between;padding:0 24px}.radio-ctrl{width:46px;height:46px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;font-size:18px}.radio-ctrl-exit{background:#1c1c22;color:#706858}.radio-ctrl-stop{background:rgba(224,80,80,.15);color:#e05050;display:none}.radio-ctrl-play{background:linear-gradient(135deg,#c8a050,#a07030);color:#fff;width:54px;height:54px;font-size:22px;box-shadow:0 3px 16px rgba(200,160,80,.3)}.radio-now{flex:1;min-width:0;padding:0 12px}.radio-now-name{font-size:13px;color:#c8a050;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}.radio-now-prog{font-size:11px;color:#706858;margin-top:2px}.radio-ctrl-group{display:flex;align-items:center;gap:16px}
        .radio-dots{display:inline-flex;gap:3px}.radio-dots span{width:4px;height:4px;border-radius:50%;background:#c8a050;animation:radioDb 1.2s infinite}.radio-dots span:nth-child(2){animation-delay:.2s}.radio-dots span:nth-child(3){animation-delay:.4s}@keyframes radioDb{0%,80%,100%{opacity:.2}40%{opacity:1}}
    `
    document.head.appendChild(style)
}

function radioEsc(s) {
    if (typeof escapeHtml === "function") return escapeHtml(s || "")
    return String(s || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;")
}

function radioContactName(c) {
    return c?.name || c?.realName || c?.aiName || "未知"
}

function radioPersona(c) {
    return [c?.prompt, c?.profile, c?.identity, c?.identityInfo, c?.personality, c?.description].filter(Boolean).join("\n")
}

function radioAvatarHtml(contact, cls = "radio-avatar") {
    const src = contact?.avatar || contact?.avatarUri || ""
    const name = radioContactName(contact)
    const initial = radioEsc((name || "?").slice(0, 1))
    if (src && typeof isImageSrc === "function" && isImageSrc(src)) {
        return `<img class="${cls}" src="${radioEsc(src)}" onerror="this.outerHTML='<div class=&quot;${cls} radio-avatar-empty&quot;>${initial}</div>'">`
    }
    return `<div class="${cls} radio-avatar-empty">${initial}</div>`
}

async function showRadioHome() {
    ensureRadioStyles()
    currentPage = "radioHome"
    const root = document.getElementById("radioRoot") || document.getElementById("appContent")
    if (!root) return
    root.innerHTML = renderRadioShell()
    radioBuildTicks()
    radioContacts = (await getAllStoreData("contacts")).filter(c => c && c.id)
    radioStations = await getAllStoreData("radioStations")
    renderRadioHosts()
    radioLoadSearchSettings()
    if (radioContacts.length) selectRadioHost(radioContacts[0].id)
    updateRadioUiState()
}

function renderRadioShell() {
    return `
        <div class="radio-shell">
            <div class="radio-head">
                <div class="radio-title" id="radioFreqTitle">随心听 FM</div>
                <div class="radio-ticks" id="radioTicks"></div>
                <div class="radio-needle"></div>
            </div>
            <div class="radio-body">
                <div class="radio-card">
                    <div class="radio-disc-wrap"><div class="radio-disc" id="radioDisc"></div><div class="radio-hole"></div></div>
                    <div class="radio-info">
                        <div class="radio-station-title" id="radioStationTitle">选择主播开始收听</div>
                        <div class="radio-host" id="radioStationHost">—</div>
                        <div class="radio-plays"><div class="radio-dot"></div><span id="radioStationPlays">0 次播放</span></div>
                    </div>
                    <div id="radioAvatarBox"><div class="radio-avatar radio-avatar-empty">？</div></div>
                </div>
                <div class="radio-tabs">
                    ${Object.keys(RADIO_PROGRAM_NAMES).map(t => `
                        <button class="radio-tab ${t === radioSelectedProgram ? "active" : ""}" onclick="selectRadioProgram('${t}')">
                            <span class="radio-tab-icon">${RADIO_PROGRAM_ICONS[t]}</span><span>${RADIO_PROGRAM_NAMES[t].replace("时间", "").replace("节目", "")}</span>
                        </button>
                    `).join("")}
                </div>
                <div class="radio-hosts" id="radioHostList"><div style="color:#555;font-size:13px;padding:8px">加载中…</div></div>
                <div class="radio-wave" id="radioWave">${Array.from({length:8}).map(()=>`<div class="radio-wv"></div>`).join("")}</div>
                <div class="radio-subtitles" id="radioSubtitles"><div id="radioSubtitleContent"></div><div class="radio-song" id="radioSongSearch"><span class="radio-dots"><span></span><span></span><span></span></span><span id="radioSongSearchText">正在搜索歌曲…</span></div><div class="radio-note" id="radioSongNote"></div></div>
                <div class="radio-status" id="radioStatus">选择主播和节目类型后开播</div>
                <div class="radio-start-wrap"><button class="radio-start" id="radioStartBtn" onclick="startRadioProgram()" disabled>选择主播后开播</button></div>
                <details class="radio-settings">
                    <summary>新闻搜索 API 设置</summary>
                    <div class="radio-setting-body">
                        <div class="radio-setting-row">
                            <select class="radio-select" id="radioSearchType"><option value="serper">Serper</option><option value="bing">Bing</option><option value="tavily">Tavily</option></select>
                            <button class="radio-save" onclick="saveRadioSearchSettings()">保存</button>
                        </div>
                        <input class="radio-input" id="radioSearchKey" placeholder="搜索 API Key，用于新闻节目真实新闻">
                        <div class="radio-mini-tip">不填也能播，新闻会改为角色世界观虚构新闻。浏览器跨域拦截时也会自动降级。</div>
                    </div>
                </details>
            </div>
            <div class="radio-bottom">
                <button class="radio-ctrl radio-ctrl-exit" onclick="goHome()">✕</button>
                <div class="radio-now"><div class="radio-now-name" id="radioNowName">—</div><div class="radio-now-prog" id="radioNowProg">未开播</div></div>
                <div class="radio-ctrl-group"><button class="radio-ctrl radio-ctrl-stop" id="radioStopBtn" onclick="stopRadioProgram()">⏹</button><button class="radio-ctrl radio-ctrl-play" id="radioPlayBtn" onclick="radioPlayPause()">▶</button></div>
            </div>
        </div>
    `
}

function radioBuildTicks() {
    const wrap = document.getElementById("radioTicks")
    if (!wrap) return
    wrap.innerHTML = Array.from({ length: 60 }).map(() => `<div class="radio-tick"></div>`).join("")
}

function radioStartFreqAnim() {
    if (radioFreqTimer) return
    radioFreqTimer = setInterval(() => {
        const ticks = document.querySelectorAll(".radio-tick")
        ticks.forEach(t => t.classList.remove("active"))
        const center = 30 + Math.floor(Math.random() * 5 - 2)
        for (let i = center - 2; i <= center + 2; i++) if (ticks[i]) ticks[i].classList.add("active")
    }, 220)
}

function radioStopFreqAnim() {
    clearInterval(radioFreqTimer)
    radioFreqTimer = null
    document.querySelectorAll(".radio-tick").forEach(t => t.classList.remove("active"))
}

function renderRadioHosts() {
    const list = document.getElementById("radioHostList")
    if (!list) return
    if (!radioContacts.length) {
        list.innerHTML = `<div style="color:#555;font-size:13px;padding:8px">暂无角色，先去联系人里添加角色</div>`
        return
    }
    list.innerHTML = radioContacts.map(c => {
        return `<div class="radio-host-chip" data-radio-id="${radioEsc(c.id)}" onclick="selectRadioHost('${radioEsc(c.id)}')">
            ${radioAvatarHtml(c, "radio-host-av")}
            <div class="radio-host-name">${radioEsc(radioContactName(c))}</div>
        </div>`
    }).join("")
}

function getRadioStation(contactId) {
    let st = radioStations.find(x => x.id === contactId)
    if (!st) {
        const c = radioContacts.find(x => x.id === contactId)
        st = { id: contactId, stationTitle: `${radioContactName(c)} 的电台`, playCount: 0, createdAt: Date.now(), updatedAt: Date.now() }
        radioStations.push(st)
        saveRadioStation(st)
        generateRadioStationTitle(c)
    }
    return st
}

async function saveRadioStation(st) {
    try {
        if (!db) return
        await restoreStore("radioStations", [st])
    } catch (_) {}
}

async function putRadioStation(st) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction("radioStations", "readwrite")
            tx.objectStore("radioStations").put(st)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (_) { resolve(false) }
    })
}

function selectRadioHost(contactId) {
    if (radioPlaying) return
    const c = radioContacts.find(x => x.id === contactId)
    if (!c) return
    radioSelectedContact = c
    document.querySelectorAll(".radio-host-chip").forEach(el => el.classList.remove("active"))
    const chip = Array.from(document.querySelectorAll(".radio-host-chip")).find(el => el.dataset.radioId === contactId)
    if (chip) chip.classList.add("active")
    const st = getRadioStation(contactId)
    document.getElementById("radioStationTitle").textContent = st.stationTitle || `${radioContactName(c)} 的电台`
    document.getElementById("radioStationHost").textContent = radioContactName(c)
    document.getElementById("radioStationPlays").textContent = `${st.playCount || 0} 次播放`
    document.getElementById("radioAvatarBox").innerHTML = radioAvatarHtml(c, "radio-avatar")
    document.getElementById("radioNowName").textContent = st.stationTitle || `${radioContactName(c)} 的电台`
    document.getElementById("radioNowProg").textContent = RADIO_PROGRAM_NAMES[radioSelectedProgram]
    document.getElementById("radioStartBtn").disabled = false
    document.getElementById("radioStartBtn").textContent = "开始播出"
}

function selectRadioProgram(type) {
    if (radioPlaying) return
    radioSelectedProgram = type
    document.querySelectorAll(".radio-tab").forEach(el => el.classList.remove("active"))
    const all = Array.from(document.querySelectorAll(".radio-tab"))
    const idx = Object.keys(RADIO_PROGRAM_NAMES).indexOf(type)
    if (all[idx]) all[idx].classList.add("active")
    const np = document.getElementById("radioNowProg")
    if (np) np.textContent = RADIO_PROGRAM_NAMES[type]
}

function radioLoadSearchSettings() {
    const t = localStorage.getItem("MJI_RADIO_SEARCH_TYPE") || "serper"
    const k = localStorage.getItem("MJI_RADIO_SEARCH_KEY") || ""
    const te = document.getElementById("radioSearchType")
    const ke = document.getElementById("radioSearchKey")
    if (te) te.value = t
    if (ke) ke.value = k
}

function saveRadioSearchSettings() {
    localStorage.setItem("MJI_RADIO_SEARCH_TYPE", document.getElementById("radioSearchType")?.value || "serper")
    localStorage.setItem("MJI_RADIO_SEARCH_KEY", document.getElementById("radioSearchKey")?.value || "")
    alert("电台搜索设置已保存")
}

function radioSetStatus(html) {
    const el = document.getElementById("radioStatus")
    if (el) el.innerHTML = html
}

function updateRadioUiState() {
    const disc = document.getElementById("radioDisc")
    const wave = document.getElementById("radioWave")
    const stopBtn = document.getElementById("radioStopBtn")
    const playBtn = document.getElementById("radioPlayBtn")
    if (disc) disc.classList.toggle("spinning", radioPlaying && !radioPaused)
    if (wave) wave.classList.toggle("active", radioPlaying && !radioPaused)
    if (stopBtn) stopBtn.style.display = radioPlaying ? "flex" : "none"
    if (playBtn) playBtn.textContent = (radioPlaying && !radioPaused) ? "⏸" : "▶"
    if (radioPlaying && !radioPaused) radioStartFreqAnim(); else radioStopFreqAnim()
}

function updateDesktopRadioNow(statusText) {
    const title = document.getElementById("musicTitle")
    const artist = document.getElementById("musicArtist")
    const bar = document.getElementById("musicBar")
    const btn = document.getElementById("musicPlayBtn")
    if (title && radioSelectedContact) title.textContent = RADIO_PROGRAM_NAMES[radioSelectedProgram] || "随心听 FM"
    if (artist && radioSelectedContact) artist.textContent = `${radioContactName(radioSelectedContact)} · ${statusText || "正在播出"}`
    if (btn) btn.textContent = radioPlaying && !radioPaused ? "⏸" : "▶"
    if (bar) bar.style.width = radioPlaying ? "66%" : "0%"
}

async function generateRadioStationTitle(contact) {
    if (!contact) return
    try {
        const text = await radioChatCall(`你是 ${radioContactName(contact)}，人设：${radioPersona(contact).slice(0, 300)}。请为你的个人电台起一个独特名字，6-12字，符合人设气质。只输出电台名称，不要解释。`)
        const title = String(text || "").replace(/[「」"“”]/g, "").trim().slice(0, 18)
        if (!title) return
        let st = radioStations.find(x => x.id === contact.id) || { id: contact.id, playCount: 0 }
        st.stationTitle = title
        st.updatedAt = Date.now()
        if (!radioStations.find(x => x.id === contact.id)) radioStations.push(st)
        await putRadioStation(st)
        if (radioSelectedContact?.id === contact.id) {
            document.getElementById("radioStationTitle").textContent = title
            document.getElementById("radioNowName").textContent = title
        }
    } catch (_) {}
}

function normalizeChatApiUrl() {
    const apiBase = (localStorage.getItem("MJI_API_BASE") || "").trim()
    if (!apiBase) return ""
    if (apiBase.endsWith("/chat/completions")) return apiBase
    if (apiBase.endsWith("/v1")) return apiBase + "/chat/completions"
    return apiBase.replace(/\/$/, "") + "/v1/chat/completions"
}

async function radioChatCall(prompt, maxTokens = 1500) {
    const url = normalizeChatApiUrl()
    const apiKey = (localStorage.getItem("MJI_API_KEY") || "").trim()
    const model = (localStorage.getItem("MJI_API_MODEL") || "").trim() || "gpt-4o"
    if (!url || !apiKey) throw new Error("未配置API")
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ model, temperature: 0.86, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] })
    })
    const txt = await resp.text()
    if (!resp.ok) throw new Error("API错误 " + resp.status + " " + txt.slice(0, 80))
    const data = JSON.parse(txt)
    return data.choices?.[0]?.message?.content?.trim() || ""
}

async function fetchRadioNews() {
    const key = (localStorage.getItem("MJI_RADIO_SEARCH_KEY") || "").trim()
    const type = localStorage.getItem("MJI_RADIO_SEARCH_TYPE") || "serper"
    if (!key) return ""
    try {
        if (type === "tavily") {
            const resp = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ api_key: key, query: "今日最新新闻", search_depth: "basic", max_results: 5, topic: "news" })
            })
            const data = await resp.json()
            return (data.results || []).slice(0, 5).map(x => `・${x.title || ""}: ${String(x.content || "").slice(0, 60)}`).join("\n")
        }
        if (type === "bing") {
            const resp = await fetch("https://api.bing.microsoft.com/v7.0/news/search?q=%E4%BB%8A%E6%97%A5%E6%96%B0%E9%97%BB&count=5&mkt=zh-CN", { headers: { "Ocp-Apim-Subscription-Key": key } })
            const data = await resp.json()
            return (data.value || []).slice(0, 5).map(x => `・${x.name || ""}`).join("\n")
        }
        const resp = await fetch("https://google.serper.dev/news", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-API-KEY": key },
            body: JSON.stringify({ q: "今日新闻 最新", num: 5, gl: "cn", hl: "zh-cn" })
        })
        const data = await resp.json()
        return (data.news || []).slice(0, 5).map(x => `・${x.title || ""}`).join("\n")
    } catch (e) {
        return ""
    }
}

async function startRadioProgram() {
    if (!radioSelectedContact || radioPlaying) return
    radioStopFlag = false
    radioPaused = false
    radioSegments = []
    radioCurrentIndex = 0
    document.getElementById("radioStartBtn").disabled = true
    document.getElementById("radioSubtitles").style.display = "block"
    document.getElementById("radioSubtitleContent").innerHTML = ""
    radioSetStatus('<span class="radio-dots"><span></span><span></span><span></span></span> 节目生成中…')
    document.getElementById("radioDisc")?.classList.add("spinning")
    try {
        const programText = await generateRadioProgramText(radioSelectedContact, radioSelectedProgram)
        radioSegments = parseRadioSegments(programText)
        if (!radioSegments.length) throw new Error("生成内容为空")
        await incrementRadioPlayCount()
        renderRadioSubtitles()
        radioPlaying = true
        radioProgramStartedAt = Date.now()
        document.getElementById("radioNowProg").textContent = "🔴 直播中 · " + RADIO_PROGRAM_NAMES[radioSelectedProgram]
        document.getElementById("radioStartBtn").textContent = "播出中"
        document.getElementById("radioStartBtn").disabled = true
        radioSetStatus("正在播出")
        updateRadioUiState()
        startRadioBg(radioSelectedProgram)
        updateDesktopRadioNow("正在播出")
        playRadioNextSegment()
    } catch (e) {
        radioPlaying = false
        radioSetStatus("⚠ " + radioEsc(e.message || "生成失败"))
        document.getElementById("radioStartBtn").disabled = false
        document.getElementById("radioStartBtn").textContent = "重试"
        updateRadioUiState()
        updateDesktopRadioNow("生成失败")
    }
}

async function generateRadioProgramText(contact, programType) {
    const allMem = await getAllStoreData("memories")
    const memory = allMem.filter(m => (m.contactId || m.aiId) === contact.id).sort((a,b)=>(b.insertTime||0)-(a.insertTime||0)).slice(0,8).map(m=>m.memoryText || m.content || "").filter(Boolean).join("\n")
    const news = programType === "news" ? await fetchRadioNews() : ""
    const newsContext = news ? `\n【今日真实新闻摘要，必须以这些为基础，用你的口吻重新播报】：\n${news}` : ""
    const name = radioContactName(contact)
    const persona = radioPersona(contact).slice(0, 700)
    const programDesc = {
        story: "【节目：故事时间】讲述一个完整小故事，风格温柔、有画面感，结尾留有余韵。故事可以来自你的世界观、亲历、听说或想象。",
        news: `【节目：新闻播报】${newsContext}\n用你的口吻播报3-5条新闻。有真实新闻摘要时必须以摘要为基础；没有则基于你的世界观虚构。语气专业但带个人色彩。`,
        music: "【节目：音乐推荐】推荐5首歌。每首格式：先说40字内介绍词，然后在末尾加 [MUSIC:歌名 歌手名]。5首推荐完后说一段收台语。",
        sleep: "【节目：哄睡电台】语气轻柔、缓慢、温暖，像在耳边低声说话。内容：开场问候、放松冥想、安静场景、晚安。禁止激动表达。"
    }[programType]
    const prompt = `你是 ${name}，人设：${persona}\n【核心记忆】：${memory}\n\n${programDesc}\n\n【格式要求】\n将节目内容分成若干自然段，每段之间用 <|PAUSE|> 分隔。\n每段不超过80字。\n禁止markdown、动作描写、星号、括号动作。\n音乐节目：[MUSIC:] 标记必须在该段末尾。\n只输出节目正文。`
    return await radioChatCall(prompt, programType === "story" ? 2200 : 1700)
}

function parseRadioSegments(raw) {
    return String(raw || "").split("<|PAUSE|>").map(x => x.trim()).filter(Boolean).map(seg => {
        const musicMatch = seg.match(/\[MUSIC:([^\]]+)\]/)
        const transMatch = seg.match(/\[译：([^\]]+)\]/)
        const text = seg.replace(/\[MUSIC:[^\]]+\]/g, "").replace(/\[译：[^\]]+\]/g, "").trim()
        return { raw: seg, text, trans: transMatch ? transMatch[1].trim() : "", musicQuery: musicMatch ? musicMatch[1].trim() : "" }
    }).filter(x => x.text || x.musicQuery)
}

async function incrementRadioPlayCount() {
    if (!radioSelectedContact) return
    let st = getRadioStation(radioSelectedContact.id)
    st.playCount = (Number(st.playCount) || 0) + 1
    st.updatedAt = Date.now()
    await putRadioStation(st)
    document.getElementById("radioStationPlays").textContent = `${st.playCount} 次播放`
}

function renderRadioSubtitles() {
    const box = document.getElementById("radioSubtitleContent")
    if (!box) return
    box.innerHTML = radioSegments.map((s, i) => `
        <div class="radio-line ${i === 0 ? "active" : ""}">${radioEsc(s.text || (s.musicQuery ? "正在播放音乐" : ""))}</div>
        ${s.trans ? `<div class="radio-trans ${i === 0 ? "show" : ""}">${radioEsc(s.trans)}</div>` : `<div class="radio-trans"></div>`}
    `).join("")
}

function setRadioActiveSubtitle(idx) {
    document.querySelectorAll(".radio-line").forEach((el, i) => el.classList.toggle("active", i === idx))
    document.querySelectorAll(".radio-trans").forEach((el, i) => el.classList.toggle("show", i === idx && el.textContent.trim()))
    const active = document.querySelectorAll(".radio-line")[idx]
    if (active) active.scrollIntoView({ behavior: "smooth", block: "center" })
    document.getElementById("radioSongSearch")?.classList.remove("show")
    document.getElementById("radioSongNote")?.classList.remove("show")
}

function estimateRadioDelay(text) {
    const len = String(text || "").replace(/\s+/g, "").length || 1
    const per = radioSelectedProgram === "sleep" ? 190 : 125
    const base = radioSelectedProgram === "sleep" ? 3800 : 2400
    const min = radioSelectedProgram === "sleep" ? 8000 : 4500
    const max = radioSelectedProgram === "sleep" ? 32000 : 22000
    return Math.max(min, Math.min(max, base + len * per))
}

function playRadioNextSegment() {
    clearTimeout(radioSegmentTimer)
    if (radioStopFlag || !radioPlaying) return
    if (radioCurrentIndex >= radioSegments.length) {
        finishRadioProgram()
        return
    }
    const seg = radioSegments[radioCurrentIndex]
    setRadioActiveSubtitle(radioCurrentIndex)
    radioSetStatus("正在播出")
    if (seg.text) {
        speakRadioText(seg.text, () => {
            if (radioStopFlag) return
            if (seg.musicQuery && radioSelectedProgram === "music") playRadioMusic(seg.musicQuery)
            else {
                radioCurrentIndex++
                radioSegmentTimer = setTimeout(playRadioNextSegment, 650)
            }
        })
    } else if (seg.musicQuery && radioSelectedProgram === "music") {
        playRadioMusic(seg.musicQuery)
    } else {
        radioCurrentIndex++
        radioSegmentTimer = setTimeout(playRadioNextSegment, 400)
    }
}

function speakRadioText(text, done) {
    stopRadioSpeechOnly()
    radioDuckBg()
    const delayDone = () => {
        radioRestoreBg()
        radioSegmentTimer = setTimeout(done, estimateRadioDelay(text))
    }
    try {
        if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
            delayDone()
            return
        }
        const u = new SpeechSynthesisUtterance(text)
        u.lang = radioSelectedProgram === "sleep" ? "zh-CN" : "zh-CN"
        u.rate = radioSelectedProgram === "sleep" ? 0.78 : 0.92
        u.pitch = radioSelectedProgram === "sleep" ? 0.86 : 0.95
        u.volume = 1
        let finished = false
        const finish = () => {
            if (finished) return
            finished = true
            radioRestoreBg()
            done()
        }
        u.onend = () => setTimeout(finish, 350)
        u.onerror = () => delayDone()
        radioSpeechUtterance = u
        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(u)
        radioSegmentTimer = setTimeout(finish, estimateRadioDelay(text) + 16000)
    } catch (_) {
        delayDone()
    }
}

function playRadioMusic(query) {
    const search = document.getElementById("radioSongSearch")
    const text = document.getElementById("radioSongSearchText")
    const note = document.getElementById("radioSongNote")
    if (text) text.textContent = `正在搜索「${query}」…`
    if (search) search.classList.add("show")
    if (note) note.classList.remove("show")
    setTimeout(() => {
        if (radioStopFlag) return
        if (search) search.classList.remove("show")
        if (note) {
            note.textContent = `🎵 正在播放：${query}`
            note.classList.add("show")
        }
        startRadioMusicTone()
        radioMusicTimer = setTimeout(() => {
            stopRadioMusicTone()
            radioCurrentIndex++
            playRadioNextSegment()
        }, 22000)
    }, 1200)
}

function radioPlayPause() {
    if (!radioPlaying && !radioPaused) {
        startRadioProgram()
        return
    }
    if (radioPlaying && !radioPaused) {
        radioPaused = true
        stopRadioSpeechOnly()
        clearTimeout(radioSegmentTimer)
        clearTimeout(radioMusicTimer)
        pauseRadioBg()
        radioSetStatus("已暂停")
    } else if (radioPlaying && radioPaused) {
        radioPaused = false
        resumeRadioBg()
        radioSetStatus("正在播出")
        playRadioNextSegment()
    }
    updateRadioUiState()
    updateDesktopRadioNow(radioPaused ? "已暂停" : "正在播出")
}

function stopRadioProgram() {
    radioStopFlag = true
    radioPlaying = false
    radioPaused = false
    clearTimeout(radioSegmentTimer)
    clearTimeout(radioMusicTimer)
    stopRadioSpeechOnly()
    stopRadioBg()
    stopRadioMusicTone()
    document.getElementById("radioSubtitles")?.style && (document.getElementById("radioSubtitles").style.display = "none")
    const btn = document.getElementById("radioStartBtn")
    if (btn) { btn.disabled = !radioSelectedContact; btn.textContent = radioSelectedContact ? "开始播出" : "选择主播后开播" }
    const np = document.getElementById("radioNowProg")
    if (np) np.textContent = RADIO_PROGRAM_NAMES[radioSelectedProgram]
    radioSetStatus("已停止")
    updateRadioUiState()
    updateDesktopRadioNow("已停止")
}

function finishRadioProgram() {
    radioPlaying = false
    radioPaused = false
    stopRadioSpeechOnly()
    stopRadioBg()
    stopRadioMusicTone()
    const btn = document.getElementById("radioStartBtn")
    if (btn) { btn.disabled = false; btn.textContent = "再播一期" }
    const np = document.getElementById("radioNowProg")
    if (np) np.textContent = RADIO_PROGRAM_NAMES[radioSelectedProgram]
    radioSetStatus("本期节目播出完毕")
    updateRadioUiState()
    updateDesktopRadioNow("播出完毕")
    saveRadioMemory()
}

function stopRadioSpeechOnly() {
    try { window.speechSynthesis && window.speechSynthesis.cancel() } catch (_) {}
    radioSpeechUtterance = null
}

function getRadioAudioContext() {
    if (!radioBgCtx) radioBgCtx = new (window.AudioContext || window.webkitAudioContext)()
    return radioBgCtx
}

function startRadioBg(type) {
    try {
        stopRadioBg()
        if (type === "music") return
        const ctx = getRadioAudioContext()
        if (ctx.state === "suspended") ctx.resume()
        const gain = ctx.createGain()
        gain.gain.value = type === "sleep" ? 0.035 : 0.045
        gain.connect(ctx.destination)
        const freqs = type === "news" ? [196, 392] : type === "sleep" ? [174, 261] : [220, 330]
        radioBgNodes = freqs.map((f, i) => {
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = i === 0 ? "sine" : "triangle"
            osc.frequency.value = f
            g.gain.value = i === 0 ? 0.28 : 0.12
            osc.connect(g); g.connect(gain); osc.start()
            return { osc, g }
        })
        radioBgGain = gain
    } catch (_) {}
}

function stopRadioBg() {
    try { radioBgNodes.forEach(n => n.osc.stop()) } catch (_) {}
    radioBgNodes = []
    try { radioBgGain && radioBgGain.disconnect() } catch (_) {}
    radioBgGain = null
}

function pauseRadioBg() {
    try { radioBgCtx && radioBgCtx.suspend() } catch (_) {}
}

function resumeRadioBg() {
    try { radioBgCtx && radioBgCtx.resume() } catch (_) {}
}

function radioDuckBg() {
    try { if (radioBgGain) radioBgGain.gain.value = 0.012 } catch (_) {}
}

function radioRestoreBg() {
    try { if (radioBgGain) radioBgGain.gain.value = radioSelectedProgram === "sleep" ? 0.035 : 0.045 } catch (_) {}
}

let radioMusicCtx = null
let radioMusicOsc = []
function startRadioMusicTone() {
    try {
        stopRadioMusicTone()
        const ctx = getRadioAudioContext()
        if (ctx.state === "suspended") ctx.resume()
        const gain = ctx.createGain()
        gain.gain.value = 0.055
        gain.connect(ctx.destination)
        const freqs = [261.63, 329.63, 392.0]
        radioMusicOsc = freqs.map((f, i) => {
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = i === 0 ? "sine" : "triangle"
            osc.frequency.value = f
            g.gain.value = 0.2 / (i + 1)
            osc.connect(g); g.connect(gain); osc.start()
            return { osc, g, gain }
        })
        radioMusicCtx = ctx
    } catch (_) {}
}

function stopRadioMusicTone() {
    try { radioMusicOsc.forEach(n => { n.osc.stop(); n.g.disconnect(); n.gain.disconnect() }) } catch (_) {}
    radioMusicOsc = []
}

async function saveRadioMemory() {
    try {
        if (!radioSelectedContact || typeof saveMemoryEntry !== "function") return
        const mins = Math.max(1, Math.round((Date.now() - radioProgramStartedAt) / 60000))
        const text = `【电台 ${new Date().toLocaleDateString("zh-CN", {month:"2-digit", day:"2-digit"})}】${radioContactName(radioSelectedContact)}陪我听了「${RADIO_PROGRAM_NAMES[radioSelectedProgram]}」，大约${mins}分钟。`
        await saveMemoryEntry(radioSelectedContact.id, text, "shared_event", "radio")
    } catch (_) {}
}

window.addEventListener("beforeunload", () => {
    try { stopRadioProgram() } catch (_) {}
})
