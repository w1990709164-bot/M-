let pomoState = {
    aiId: "",
    aiName: "TA",
    aiPersona: "",
    taskType: "学习",
    workMinutes: 25,
    breakMinutes: 5,
    remainSeconds: 25 * 60,
    totalSeconds: 25 * 60,
    isRunning: false,
    isWorkPhase: true,
    completed: 0,
    distractCount: 0,
    focusSeconds: 0,
    timerId: null,
    cameraStream: null,
    cameraTimer: null,
    voiceHistory: []
}

function pomoSettings() {
    try {
        return JSON.parse(localStorage.getItem("MJI_POMODORO_SETTINGS") || "{}") || {}
    } catch (e) {
        return {}
    }
}

function savePomoSettings(partial) {
    const next = { ...pomoSettings(), ...partial }
    localStorage.setItem("MJI_POMODORO_SETTINGS", JSON.stringify(next))
}

function pomoDateKey() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function pomoFormat(s) {
    return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`
}

function pomoEscape(s) {
    return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

async function pomoContacts() {
    const list = await getAllStoreData("contacts")
    return (list || []).filter(c => c && c.id).map(c => ({
        id: c.id,
        name: c.name || c.realName || "TA",
        avatar: c.avatar || c.avatarUri || "",
        persona: [c.prompt, c.identity, c.personality, c.profile, c.identityInfo].filter(Boolean).join("\n").trim()
    }))
}

async function pomoLoadAi() {
    const contacts = await pomoContacts()
    const savedId = localStorage.getItem("MJI_POMODORO_SELECTED_AI") || ""
    const selected = contacts.find(c => c.id === savedId) || contacts[0]
    if (!selected) return null
    pomoState.aiId = selected.id
    pomoState.aiName = selected.name
    pomoState.aiPersona = selected.persona || ""
    localStorage.setItem("MJI_POMODORO_SELECTED_AI", selected.id)
    return selected
}

async function showPomodoroHome() {
    currentPage = "pomodoroHome"
    const root = document.getElementById("pomodoroRoot") || document.getElementById("appContent")
    if (!root) return

    const s = pomoSettings()
    pomoState.taskType = s.taskType || pomoState.taskType || "学习"
    pomoState.workMinutes = Number(s.workMinutes || pomoState.workMinutes || 25)
    pomoState.breakMinutes = Number(s.breakMinutes || pomoState.breakMinutes || 5)
    if (!pomoState.isRunning) {
        pomoState.totalSeconds = pomoState.workMinutes * 60
        pomoState.remainSeconds = pomoState.totalSeconds
    }

    const contacts = await pomoContacts()
    const ai = await pomoLoadAi()
    await pomoLoadTodayStats()

    root.innerHTML = `
        <style>
            .pomo-root{height:100%;min-height:100%;background:#05050b;color:#fff;position:relative;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;}
            .pomo-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 15%,rgba(255,90,90,.23),transparent 34%),linear-gradient(160deg,#15152b,#05050b 62%,#160b14);background-size:cover;background-position:center;opacity:.92;}
            .pomo-dim{position:absolute;inset:0;background:rgba(0,0,0,.38);}
            .pomo-top{position:relative;z-index:2;height:52px;background:rgba(0,0,0,.42);display:flex;align-items:center;justify-content:center;padding:0 12px;backdrop-filter:blur(12px);}
            .pomo-back{position:absolute;left:8px;top:0;height:52px;border:0;background:transparent;color:#fff;font-size:28px;padding:0 12px;}
            .pomo-title{font-size:15px;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,.5);}
            .pomo-set{position:absolute;right:8px;top:0;height:52px;border:0;background:transparent;color:#fff;font-size:20px;padding:0 12px;}
            .pomo-video{position:absolute;right:12px;top:62px;width:110px;height:150px;border-radius:14px;object-fit:cover;background:#222;z-index:3;display:none;border:1px solid rgba(255,255,255,.22);box-shadow:0 8px 24px rgba(0,0,0,.35);}
            .pomo-center{position:relative;z-index:2;height:calc(100% - 52px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 20px 150px;text-align:center;}
            .pomo-phase{font-size:16px;color:#ff6b6b;font-weight:800;margin-bottom:8px;text-shadow:0 2px 8px rgba(0,0,0,.45);}
            .pomo-timer{font-size:72px;font-weight:900;letter-spacing:-3px;line-height:1;color:#fff;text-shadow:0 8px 26px rgba(0,0,0,.5);}
            .pomo-count{margin-top:10px;color:rgba(255,255,255,.8);font-size:13px;}
            .pomo-distract{min-height:18px;color:#ffcc88;font-size:12px;margin-top:3px;}
            .pomo-ai{position:absolute;z-index:4;left:20px;right:20px;bottom:92px;background:rgba(26,26,46,.78);border:1px solid rgba(255,255,255,.13);backdrop-filter:blur(12px);border-radius:16px;padding:13px 14px;color:#fff;font-size:14px;line-height:1.55;text-align:center;white-space:pre-wrap;box-shadow:0 10px 28px rgba(0,0,0,.22);}
            .pomo-bottom{position:absolute;z-index:5;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 8px 16px;}
            .pomo-btn{border:0;border-radius:999px;background:rgba(255,255,255,.23);color:#fff;font-weight:800;padding:10px 15px;min-height:42px;}
            .pomo-btn.main{background:#ff3b30;padding:12px 22px;font-size:16px;}
            .pomo-btn.on{background:#34c759;}
            .pomo-select{position:relative;z-index:2;margin:12px 18px 0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:12px;display:flex;gap:10px;align-items:center;}
            .pomo-select label{font-size:12px;color:rgba(255,255,255,.7);}
            .pomo-select select{flex:1;border:0;outline:0;border-radius:12px;background:rgba(255,255,255,.12);color:#fff;padding:10px;}
            .pomo-settings-mask{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.48);display:flex;align-items:flex-end;}
            .pomo-settings{width:100%;background:#fff;color:#222;border-radius:22px 22px 0 0;padding:18px 18px 30px;}
            .pomo-settings h3{font-size:17px;margin-bottom:14px;}.pomo-settings label{display:block;font-size:13px;color:#777;margin:12px 0 8px;}.pomo-chiprow{display:flex;gap:8px;flex-wrap:wrap}.pomo-chip{border:0;border-radius:999px;background:#eee;color:#555;padding:9px 14px;font-weight:700}.pomo-chip.active{background:#ff3b30;color:#fff}.pomo-settings select,.pomo-settings input{width:100%;border:1px solid #ddd;border-radius:12px;padding:11px;background:#fafafa}.pomo-save{width:100%;border:0;border-radius:14px;background:#ff3b30;color:#fff;padding:13px;font-weight:900;margin-top:16px}.pomo-mini-note{font-size:12px;color:#888;line-height:1.7;margin-top:8px}
        </style>
        <div class="pomo-root" onclick="pomoScreenTap(event)">
            <div class="pomo-bg" id="pomoBg"></div><div class="pomo-dim"></div>
            <video class="pomo-video" id="pomoVideo" autoplay muted playsinline></video>
            <div class="pomo-top">
                <button class="pomo-back" onclick="event.stopPropagation();goHome()">‹</button>
                <div class="pomo-title" id="pomoTitle">🍅 ${pomoEscape(ai?.name || "TA")}陪你专注</div>
                <button class="pomo-set" onclick="event.stopPropagation();showPomodoroSettings()">⚙</button>
            </div>
            <div class="pomo-select" onclick="event.stopPropagation()">
                <label>陪伴角色</label>
                <select id="pomoAiSelect" onchange="changePomodoroAi(this.value)">
                    ${contacts.length ? contacts.map(c => `<option value="${pomoEscape(c.id)}" ${c.id === pomoState.aiId ? "selected" : ""}>${pomoEscape(c.name)}</option>`).join("") : `<option value="">请先添加角色</option>`}
                </select>
            </div>
            <div class="pomo-center">
                <div class="pomo-phase" id="pomoPhase"></div>
                <div class="pomo-timer" id="pomoTimer"></div>
                <div class="pomo-count" id="pomoCount"></div>
                <div class="pomo-distract" id="pomoDistract"></div>
            </div>
            <div class="pomo-ai" id="pomoAiComment">点击开始，我陪着你 💕</div>
            <div class="pomo-bottom" onclick="event.stopPropagation()">
                <button class="pomo-btn" onclick="resetPomodoro()">重置</button>
                <button class="pomo-btn main" id="pomoStartBtn" onclick="togglePomodoro()">开始专注</button>
                <button class="pomo-btn" onclick="pickPomodoroBackground()">🖼</button>
                <button class="pomo-btn" id="pomoCamBtn" onclick="togglePomodoroCamera()">📷</button>
                <button class="pomo-btn" onclick="startPomodoroVoice()">🎙</button>
                <input type="file" id="pomoBgFile" accept="image/*" style="display:none" onchange="savePomodoroBackground(event)">
            </div>
        </div>
    `

    loadPomodoroBackground()
    updatePomodoroDisplay()
}

async function changePomodoroAi(id) {
    if (!id) return
    localStorage.setItem("MJI_POMODORO_SELECTED_AI", id)
    const contacts = await pomoContacts()
    const c = contacts.find(x => x.id === id)
    if (c) {
        pomoState.aiId = c.id
        pomoState.aiName = c.name
        pomoState.aiPersona = c.persona || ""
    }
    await pomoLoadTodayStats()
    loadPomodoroBackground()
    updatePomodoroDisplay()
    const title = document.getElementById("pomoTitle")
    if (title) title.textContent = `🍅 ${pomoState.aiName}陪你专注`
}

function showPomodoroSettings() {
    const s = pomoSettings()
    const mask = document.createElement("div")
    mask.className = "pomo-settings-mask"
    mask.id = "pomoSettingsMask"
    mask.onclick = e => { if (e.target === mask) mask.remove() }
    mask.innerHTML = `
        <div class="pomo-settings" onclick="event.stopPropagation()">
            <h3>番茄钟设置</h3>
            <label>任务类型</label>
            <div class="pomo-chiprow" id="pomoTaskRow">
                ${["学习","工作"].map(t => `<button class="pomo-chip ${pomoState.taskType === t ? "active" : ""}" onclick="selectPomoTask('${t}', this)">${t}</button>`).join("")}
            </div>
            <label>专注时长</label>
            <div class="pomo-chiprow" id="pomoWorkRow">
                ${[15,25,45].map(n => `<button class="pomo-chip ${pomoState.workMinutes === n ? "active" : ""}" onclick="selectPomoWork(${n}, this)">${n}分</button>`).join("")}
            </div>
            <label>休息时长</label>
            <input id="pomoBreakInput" type="number" min="1" max="60" value="${Number(s.breakMinutes || pomoState.breakMinutes || 5)}">
            <label><input id="pomoTtsCheck" type="checkbox" ${s.tts ? "checked" : ""} style="width:auto;margin-right:8px">用浏览器语音读出角色台词</label>
            <div class="pomo-mini-note">摄像头只在你点 📷 后开启；PWA版用浏览器能力代替安卓 CameraX 和录音转写。</div>
            <button class="pomo-save" onclick="savePomodoroSettingForm()">保存</button>
        </div>
    `
    document.body.appendChild(mask)
}

function selectPomoTask(t, btn) {
    pomoState.taskType = t
    document.querySelectorAll("#pomoTaskRow .pomo-chip").forEach(x => x.classList.remove("active"))
    btn.classList.add("active")
}
function selectPomoWork(n, btn) {
    pomoState.workMinutes = n
    document.querySelectorAll("#pomoWorkRow .pomo-chip").forEach(x => x.classList.remove("active"))
    btn.classList.add("active")
}
function savePomodoroSettingForm() {
    const br = Math.max(1, Number(document.getElementById("pomoBreakInput")?.value || 5))
    const tts = !!document.getElementById("pomoTtsCheck")?.checked
    pomoState.breakMinutes = br
    savePomoSettings({ taskType: pomoState.taskType, workMinutes: pomoState.workMinutes, breakMinutes: br, tts })
    document.getElementById("pomoSettingsMask")?.remove()
    if (!pomoState.isRunning) resetPomodoro(false)
    updatePomodoroDisplay()
}

function updatePomodoroDisplay() {
    const timer = document.getElementById("pomoTimer")
    const phase = document.getElementById("pomoPhase")
    const count = document.getElementById("pomoCount")
    const distract = document.getElementById("pomoDistract")
    const btn = document.getElementById("pomoStartBtn")
    if (timer) timer.textContent = pomoFormat(pomoState.remainSeconds)
    if (phase) {
        phase.textContent = pomoState.isWorkPhase ? `专注 · ${pomoState.taskType}` : "休息时间"
        phase.style.color = pomoState.isWorkPhase ? "#ff6b6b" : "#34c759"
    }
    if (count) count.textContent = `今日完成 ${pomoState.completed || 0} 🍅`
    if (distract) distract.textContent = pomoState.distractCount ? `开小差 ×${pomoState.distractCount}` : ""
    if (btn) btn.textContent = pomoState.isRunning ? "暂停" : (pomoState.isWorkPhase ? "开始专注" : "开始休息")
}

function togglePomodoro() {
    if (!pomoState.aiId) { alert("请先添加角色"); return }
    if (pomoState.isRunning) {
        pomoState.isRunning = false
        clearInterval(pomoState.timerId)
        updatePomodoroDisplay()
        return
    }
    pomoState.isRunning = true
    currentPage = "pomodoroRunning"
    if (pomoState.remainSeconds === pomoState.totalSeconds && pomoState.isWorkPhase) pomoFetchAiLine("start")
    pomoState.timerId = setInterval(() => {
        if (!pomoState.isRunning) return
        if (pomoState.remainSeconds > 0) {
            pomoState.remainSeconds--
            if (pomoState.isWorkPhase) {
                pomoState.focusSeconds++
                if (pomoState.focusSeconds % 30 === 0) savePomodoroStats()
            }
            updatePomodoroDisplay()
        } else {
            onPomodoroPhaseComplete()
        }
    }, 1000)
    updatePomodoroDisplay()
}

function resetPomodoro(showMsg = true) {
    pomoState.isRunning = false
    clearInterval(pomoState.timerId)
    pomoState.isWorkPhase = true
    pomoState.distractCount = 0
    pomoState.completed = 0
    pomoState.focusSeconds = 0
    pomoState.totalSeconds = pomoState.workMinutes * 60
    pomoState.remainSeconds = pomoState.totalSeconds
    if (showMsg) setPomoAi("已重置，重新开始吧。")
    updatePomodoroDisplay()
    savePomodoroStats()
}

async function onPomodoroPhaseComplete() {
    pomoState.isRunning = false
    clearInterval(pomoState.timerId)
    if (pomoState.isWorkPhase) {
        pomoState.completed++
        await savePomodoroStats()
        await savePomodoroSessionMemory()
        pomoState.isWorkPhase = false
        pomoState.totalSeconds = pomoState.breakMinutes * 60
        pomoState.remainSeconds = pomoState.totalSeconds
        pomoFetchAiLine("complete")
    } else {
        pomoState.isWorkPhase = true
        pomoState.distractCount = 0
        pomoState.totalSeconds = pomoState.workMinutes * 60
        pomoState.remainSeconds = pomoState.totalSeconds
        pomoFetchAiLine("rest_end")
    }
    updatePomodoroDisplay()
}

function pomoScreenTap(e) {
    if (!pomoState.isRunning || !pomoState.isWorkPhase) return
    const y = e.clientY
    if (y > 52 && y < window.innerHeight - 82) {
        pomoState.distractCount++
        updatePomodoroDisplay()
        pomoFetchAiLine("distract")
    }
}

async function pomoLoadTodayStats() {
    const key = `pomo_${pomoDateKey()}_${pomoState.aiId}`
    try {
        const all = await getAllStoreData("pomodoroStats")
        const item = (all || []).find(x => x.id === key)
        pomoState.completed = item?.completed || 0
        pomoState.focusSeconds = item?.focusSeconds || 0
    } catch (e) {
        pomoState.completed = 0
        pomoState.focusSeconds = 0
    }
}

function savePomodoroStats() {
    return new Promise(resolve => {
        try {
            const key = `pomo_${pomoDateKey()}_${pomoState.aiId}`
            const tx = db.transaction("pomodoroStats", "readwrite")
            tx.objectStore("pomodoroStats").put({
                id: key,
                contactId: pomoState.aiId,
                dateKey: pomoDateKey(),
                completed: pomoState.completed,
                focusSeconds: pomoState.focusSeconds,
                updatedAt: Date.now()
            })
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (e) { resolve(false) }
    })
}

async function savePomodoroSessionMemory() {
    if (!pomoState.aiId) return
    const focusMin = Math.floor((pomoState.focusSeconds || 0) / 60)
    const d = new Date()
    const dateStr = `${d.getMonth()+1}月${d.getDate()}日`
    const text = `[番茄钟记录] ${dateStr} ${pomoState.aiName}陪用户进行了${pomoState.taskType}，完成${pomoState.completed}个番茄钟（共约${focusMin}分钟），期间开小差${pomoState.distractCount}次。`
    try {
        const session = {
            id: "pomo_session_" + Date.now() + "_" + Math.random().toString(16).slice(2),
            contactId: pomoState.aiId,
            contactName: pomoState.aiName,
            taskType: pomoState.taskType,
            workMinutes: pomoState.workMinutes,
            distractCount: pomoState.distractCount,
            focusSeconds: pomoState.focusSeconds,
            dateKey: pomoDateKey(),
            createdAt: Date.now()
        }
        const tx = db.transaction("pomodoroSessions", "readwrite")
        tx.objectStore("pomodoroSessions").put(session)
    } catch (e) {}
    try {
        if (typeof saveMemoryText === "function") await saveMemoryText(pomoState.aiId, text)
        else {
            const tx = db.transaction("memories", "readwrite")
            tx.objectStore("memories").put({
                id: "mem_pomo_" + Date.now(),
                contactId: pomoState.aiId,
                aiId: pomoState.aiId,
                memoryText: text,
                content: text,
                category: "shared_event",
                insertTime: Date.now(),
                updatedAt: Date.now()
            })
        }
    } catch (e) {}
}

async function pomoFetchAiLine(event) {
    const myName = localStorage.getItem("MJI_MY_NAME") || "你"
    const eventPrompt = {
        start: `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,160)}。${myName}开始了${pomoState.workMinutes}分钟${pomoState.taskType}番茄钟，你在视频陪着TA。说一句鼓励，15字以内，符合性格，不要标签。`,
        distract: `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,180)}。${myName}在${pomoState.taskType}时第${pomoState.distractCount}次走神了。随机轻轻吐槽、暗示、半开玩笑、拉TA回来或说一句具体小观察。15字以内，不要说教，不要重复“专心/回来/继续”。`,
        complete: `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,160)}。${myName}完成了第${pomoState.completed}个番茄钟，开小差${pomoState.distractCount}次。夸TA一句，20字以内，符合性格。`,
        rest_end: `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,160)}。${myName}休息结束继续${pomoState.taskType}。说一句15字以内的话，符合性格。`
    }[event]
    if (!eventPrompt) return
    try {
        const reply = await pomoCallAI(eventPrompt, 80, 0.88)
        setPomoAi("💭 " + reply)
        pomoSpeak(reply)
    } catch (e) {}
}

async function pomoCallAI(prompt, maxTokens = 120, temperature = 0.85) {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || ""
    if (!apiBase || !apiKey || !apiModel) throw new Error("API未配置")
    let url = apiBase.replace(/\/$/, "")
    if (!url.endsWith("/chat/completions")) url += url.includes("/v1") ? "/chat/completions" : "/v1/chat/completions"
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
        body: JSON.stringify({ model: apiModel, temperature, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] })
    })
    if (!resp.ok) throw new Error("HTTP " + resp.status)
    const data = await resp.json()
    return (data?.choices?.[0]?.message?.content || "").trim()
}

function setPomoAi(text) {
    const el = document.getElementById("pomoAiComment")
    if (el) el.textContent = text
}

function pomoSpeak(text) {
    if (!pomoSettings().tts || !window.speechSynthesis) return
    try {
        speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text.replace(/^💭\s*/, ""))
        u.lang = "zh-CN"
        speechSynthesis.speak(u)
    } catch (e) {}
}

function pickPomodoroBackground() {
    document.getElementById("pomoBgFile")?.click()
}

async function savePomodoroBackground(event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ""
    if (!file) return
    const b64 = await fileToBase64(file)
    localStorage.setItem("MJI_POMODORO_BG_" + pomoState.aiId, b64)
    loadPomodoroBackground()
}

function loadPomodoroBackground() {
    const bg = localStorage.getItem("MJI_POMODORO_BG_" + pomoState.aiId) || ""
    const el = document.getElementById("pomoBg")
    if (el && bg) el.style.backgroundImage = `url('${bg}')`
}

async function togglePomodoroCamera() {
    const btn = document.getElementById("pomoCamBtn")
    const video = document.getElementById("pomoVideo")
    if (pomoState.cameraStream) {
        pomoState.cameraStream.getTracks().forEach(t => t.stop())
        pomoState.cameraStream = null
        if (video) video.style.display = "none"
        if (btn) { btn.textContent = "📷"; btn.classList.remove("on") }
        clearInterval(pomoState.cameraTimer)
        return
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
        pomoState.cameraStream = stream
        if (video) { video.srcObject = stream; video.style.display = "block" }
        if (btn) { btn.textContent = "📷✓"; btn.classList.add("on") }
        clearInterval(pomoState.cameraTimer)
        pomoState.cameraTimer = setInterval(() => {
            if (pomoState.isRunning && pomoState.isWorkPhase) capturePomodoroScene()
        }, 7 * 60 * 1000 + 30 * 1000)
    } catch (e) {
        alert("摄像头开启失败，浏览器可能没有权限")
    }
}

async function capturePomodoroScene() {
    const video = document.getElementById("pomoVideo")
    if (!video || !video.videoWidth) return
    try {
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = Math.round(512 * video.videoHeight / video.videoWidth)
        const ctx = canvas.getContext("2d")
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75)
        const apiBase = localStorage.getItem("MJI_API_BASE") || ""
        const apiKey = localStorage.getItem("MJI_API_KEY") || ""
        const apiModel = localStorage.getItem("MJI_API_MODEL") || ""
        if (!apiBase || !apiKey || !apiModel) return
        let url = apiBase.replace(/\/$/, "")
        if (!url.endsWith("/chat/completions")) url += url.includes("/v1") ? "/chat/completions" : "/v1/chat/completions"
        const prompt = `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,120)}。你正在视频陪用户${pomoState.taskType}。你悄悄看了一眼摄像头画面，根据画面里的场景，用你的口吻说一句内心小感触，15字以内，不要说教，不要标签。`
        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.9,
                messages: [{ role: "user", content: [
                    { type: "image_url", image_url: { url: dataUrl } },
                    { type: "text", text: prompt }
                ] }]
            })
        })
        if (!resp.ok) return
        const json = await resp.json()
        const reply = json?.choices?.[0]?.message?.content?.trim()
        if (reply) { setPomoAi(reply); pomoSpeak(reply) }
    } catch (e) {}
}

function startPomodoroVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
        const text = prompt("这个浏览器不支持语音识别。你可以直接输入想对TA说的话：")
        if (text) sendPomodoroVoiceText(text)
        return
    }
    const rec = new SR()
    rec.lang = "zh-CN"
    rec.interimResults = false
    rec.maxAlternatives = 1
    setPomoAi("录音中…")
    rec.onresult = e => {
        const text = e.results?.[0]?.[0]?.transcript || ""
        if (text) sendPomodoroVoiceText(text)
    }
    rec.onerror = () => setPomoAi("没听清，再说一次？")
    rec.onend = () => {}
    rec.start()
}

async function sendPomodoroVoiceText(userText) {
    setPomoAi("你：" + userText)
    pomoState.voiceHistory.push({ role: "user", content: userText })
    while (pomoState.voiceHistory.length > 20) pomoState.voiceHistory.shift()
    try {
        const messages = pomoState.voiceHistory.slice(-8).map(m => `${m.role === "user" ? "用户" : pomoState.aiName}：${m.content}`).join("\n")
        const prompt = `你是${pomoState.aiName}，人设：${pomoState.aiPersona.slice(0,180)}。你正在视频陪用户${pomoState.taskType}。最近对话：\n${messages}\n用户刚说：「${userText}」\n用口语化语气简短回复1-2句，符合性格，不要标签。`
        const reply = await pomoCallAI(prompt, 160, 0.8)
        pomoState.voiceHistory.push({ role: "assistant", content: reply })
        setPomoAi(`${pomoState.aiName}：${reply}`)
        pomoSpeak(reply)
    } catch (e) {
        setPomoAi("回复失败，请重试")
    }
}
