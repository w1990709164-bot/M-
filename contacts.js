/* ============================================================
   M叽 PWA 每日盲盒
   - 每日抽取盲盒物品
   - 选择角色互动 4 轮
   - 生成同人文
   - 珍品室保存历史
   - 写入 shared_event 共同经历记忆
============================================================ */

const BB_TODAY_KEY = "MJI_BLINDBOX_TODAY_V1"
const BB_TREASURY_KEY = "MJI_BLINDBOX_TREASURY_V1"

let bbContacts = []
let bbTodayData = null
let bbTreasury = []
let bbCurrentView = "main"
let bbDialogState = {
    step: 0,
    selectedChar: null,
    answers: [],
    aiQuestions: [],
    loading: false
}

const BB_BALL_COLORS = [
    "#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff",
    "#ff922b", "#cc5de8", "#f06595", "#74c0fc"
]

function bbEsc(s) {
    return String(s || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
}

function bbTodayKey() {
    const d = new Date()
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function bbTimeLabel() {
    const d = new Date()
    return `${d.getMonth() + 1}月${d.getDate()}日`
}

function bbSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function bbLoadJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return fallback
        return JSON.parse(raw)
    } catch (_) {
        return fallback
    }
}

function bbSaveJson(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
}

async function showBlindboxHome() {
    currentPage = "blindboxHome"

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "每日盲盒"

    const content = document.getElementById("appContent")
    if (!content) return

    content.innerHTML = `
        <style>
            #blindboxRoot {
                min-height: calc(100vh - 54px);
                margin: -14px;
                background: #fff8f0;
                color: #3a2a1a;
                font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Serif SC", serif;
                position: relative;
                overflow: hidden;
            }
            #blindboxRoot * { box-sizing: border-box; }
            #blindboxRoot::before {
                content: "";
                position: absolute;
                inset: 0;
                pointer-events: none;
                background:
                    radial-gradient(ellipse 70% 50% at 10% 10%, rgba(245,166,35,0.16) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 60% at 90% 90%, rgba(232,69,60,0.11) 0%, transparent 55%);
            }
            .bb-nav {
                height: 54px;
                background: rgba(255,248,240,0.95);
                backdrop-filter: blur(14px);
                border-bottom: 1px solid rgba(232,69,60,0.18);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 16px;
                position: relative;
                z-index: 5;
            }
            .bb-nav-title {
                font-size: 20px;
                color: #e8453c;
                letter-spacing: 3px;
                font-weight: 800;
            }
            .bb-nav-back,
            .bb-nav-right {
                border: none;
                background: none;
                cursor: pointer;
                color: #e8453c;
                font-size: 18px;
            }
            .bb-nav-right {
                font-size: 13px;
                color: #f5a623;
                background: rgba(245,166,35,0.12);
                border: 1.5px solid rgba(245,166,35,0.30);
                border-radius: 16px;
                padding: 4px 12px;
                white-space: nowrap;
            }
            .bb-main {
                position: relative;
                z-index: 2;
                height: calc(100vh - 108px);
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 16px 20px 40px;
                gap: 16px;
            }
            .bb-machine {
                width: 200px;
                height: 285px;
                position: relative;
                flex-shrink: 0;
            }
            .bb-globe {
                width: 180px;
                height: 180px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(200,240,255,0.6) 40%, rgba(180,220,255,0.3));
                border: 4px solid #e8453c;
                position: absolute;
                top: 0;
                left: 10px;
                overflow: hidden;
            }
            .bb-globe::after {
                content: "";
                position: absolute;
                top: 10px;
                left: 18px;
                width: 50px;
                height: 30px;
                border-radius: 50%;
                background: rgba(255,255,255,0.55);
                transform: rotate(-20deg);
            }
            .bb-balls {
                position: absolute;
                bottom: 8px;
                left: 8px;
                right: 8px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                justify-content: center;
                align-items: flex-end;
                padding: 0 6px;
            }
            .bb-ball {
                border-radius: 50%;
                box-shadow: inset -2px -2px 4px rgba(0,0,0,0.15), inset 1px 1px 3px rgba(255,255,255,0.6);
            }
            .bb-cap { width:120px; height:20px; background:linear-gradient(180deg,#cc3333,#e8453c); border-radius:50% 50% 0 0/100% 100% 0 0; position:absolute; top:158px; left:40px; }
            .bb-cap-top { width:24px; height:24px; border-radius:50%; background:linear-gradient(135deg,#ffcc00,#f5a623); position:absolute; top:150px; left:88px; box-shadow:0 2px 6px rgba(0,0,0,0.2); z-index:2; }
            .bb-body { width:160px; height:95px; background:linear-gradient(180deg,#f5a623 0%,#e8951a 100%); border-radius:10px 10px 18px 18px; position:absolute; top:172px; left:20px; }
            .bb-panel { width:76px; height:64px; background:linear-gradient(180deg,#cc2222,#aa1111); border-radius:8px; position:absolute; top:180px; left:62px; }
            .bb-knob { width:32px; height:32px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#f7c96e,#f5a623); position:absolute; top:196px; left:84px; box-shadow:0 2px 6px rgba(0,0,0,0.25); }
            .bb-slot { width:38px; height:5px; border-radius:3px; background:rgba(0,0,0,0.3); position:absolute; top:184px; left:81px; }
            .bb-base { width:178px; height:16px; background:linear-gradient(180deg,#cc3333,#aa1111); border-radius:0 0 18px 18px; position:absolute; top:260px; left:11px; }
            .bb-outlet { position:absolute; top:228px; left:76px; width:48px; height:32px; display:flex; align-items:center; justify-content:center; z-index:10; }
            .bb-item-card {
                width: 100%;
                background: rgba(255,240,220,0.85);
                border: 2px solid rgba(245,166,35,0.30);
                border-radius: 20px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(58,42,26,0.12);
                animation: bbPop .35s ease;
            }
            @keyframes bbPop { from{opacity:0; transform:scale(.88)} to{opacity:1; transform:scale(1)} }
            .bb-item-emoji { font-size: 50px; margin-bottom: 10px; display: block; }
            .bb-item-name { font-size: 22px; color: #e8453c; margin-bottom: 6px; font-weight: 800; }
            .bb-item-desc { font-size: 13px; color: #8a6a4a; line-height: 1.7; }
            .bb-btn-primary,
            .bb-btn-secondary,
            .bb-item-action {
                width: 100%;
                max-width: 300px;
                padding: 14px;
                border-radius: 24px;
                cursor: pointer;
                font-size: 18px;
                letter-spacing: 2px;
                font-weight: 800;
            }
            .bb-btn-primary,
            .bb-item-action {
                background: linear-gradient(135deg,#e8453c,#c0392b);
                color: #fff;
                border: none;
                box-shadow: 0 4px 20px rgba(232,69,60,0.35);
            }
            .bb-item-action {
                width: auto;
                margin-top: 14px;
                padding: 10px 28px;
                font-size: 14px;
                letter-spacing: 0;
            }
            .bb-btn-primary:disabled { background: #bbb; box-shadow: none; }
            .bb-btn-secondary {
                background: rgba(245,166,35,0.12);
                border: 2px solid rgba(245,166,35,0.38);
                color: #f5a623;
            }
            .bb-countdown { font-size: 13px; color: #8a6a4a; text-align: center; line-height: 1.8; }
            .bb-countdown strong { color: #e8453c; }
            .bb-treasury {
                position: relative;
                z-index: 2;
                height: calc(100vh - 108px);
                overflow-y: auto;
                padding: 16px 16px 80px;
                display: none;
            }
            .bb-treasury.active { display: block; }
            .bb-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
            .bb-treasury-item { background:rgba(255,240,220,0.85); border:1.5px solid rgba(245,166,35,0.25); border-radius:16px; padding:14px 8px; text-align:center; cursor:pointer; position:relative; }
            .bb-treasury-emoji { font-size:32px; display:block; margin-bottom:6px; }
            .bb-treasury-name { font-size:12px; color:#3a2a1a; line-height:1.4; }
            .bb-treasury-date { font-size:10px; color:#8a6a4a; margin-top:3px; }
            .bb-empty { text-align:center; padding:60px 20px; color:#8a6a4a; font-size:14px; line-height:2.2; grid-column:1/-1; }
            .bb-modal,
            .bb-fanfic-overlay {
                position: fixed;
                inset: 0;
                z-index: 999;
                background: rgba(58,42,26,0.48);
                backdrop-filter: blur(6px);
                display: none;
                align-items: flex-end;
                justify-content: center;
            }
            .bb-modal-box,
            .bb-fanfic-box {
                width: 100%;
                max-width: 480px;
                background: #fff8f0;
                border-radius: 24px 24px 0 0;
                max-height: 88vh;
                display: flex;
                flex-direction: column;
                animation: bbSlide .25s ease;
            }
            .bb-fanfic-overlay { align-items:center; padding:20px; }
            .bb-fanfic-box { border-radius:20px; }
            @keyframes bbSlide { from{transform:translateY(60px); opacity:0} to{transform:translateY(0); opacity:1} }
            .bb-modal-head,
            .bb-fanfic-head { padding:16px 18px 12px; border-bottom:1px solid rgba(232,69,60,0.18); display:flex; align-items:center; gap:10px; flex-shrink:0; }
            .bb-modal-emoji { font-size:28px; }
            .bb-modal-title,
            .bb-fanfic-title { font-size:18px; color:#e8453c; font-weight:800; }
            .bb-modal-sub { font-size:12px; color:#8a6a4a; margin-top:2px; }
            .bb-modal-body,
            .bb-fanfic-body { flex:1; overflow-y:auto; padding:16px 20px; }
            .bb-dialog-step { margin-bottom:20px; animation: bbPop .28s ease; }
            .bb-dialog-q { font-size:14px; color:#3a2a1a; line-height:1.7; padding:10px 14px; background:rgba(245,166,35,0.10); border-left:3px solid #f5a623; border-radius:0 10px 10px 0; margin-bottom:10px; white-space:pre-wrap; word-break:break-word; }
            .bb-answered { padding:8px 12px; border-radius:10px; background:rgba(232,69,60,0.08); border:1px solid rgba(232,69,60,0.20); font-size:13px; color:#e8453c; margin-top:6px; }
            .bb-contact-grid { display:flex; flex-wrap:wrap; gap:8px; }
            .bb-contact-chip { padding:7px 14px; border-radius:16px; border:1.5px solid rgba(232,69,60,0.20); background:#fff0dc; font-size:13px; color:#3a2a1a; cursor:pointer; }
            .bb-contact-chip.selected { background:#e8453c; color:#fff; border-color:#e8453c; }
            .bb-options { display:flex; flex-direction:column; gap:8px; }
            .bb-option { padding:10px 14px; border-radius:12px; border:1.5px solid rgba(232,69,60,0.20); background:rgba(255,248,240,0.95); font-size:13px; color:#3a2a1a; cursor:pointer; text-align:left; line-height:1.6; }
            .bb-progress-wrap { padding:16px 20px; border-top:1px solid rgba(232,69,60,0.18); }
            .bb-progress-label { font-size:12px; color:#8a6a4a; margin-bottom:8px; display:flex; justify-content:space-between; }
            .bb-progress-bar { height:6px; background:rgba(232,69,60,0.15); border-radius:3px; overflow:hidden; }
            .bb-progress-fill { height:100%; background:linear-gradient(90deg,#f5a623,#e8453c); border-radius:3px; transition:width .4s ease; }
            .bb-progress-btn { width:100%; margin-top:12px; padding:12px; background:linear-gradient(135deg,#e8453c,#c0392b); color:#fff; border:none; border-radius:16px; font-size:14px; cursor:pointer; }
            .bb-progress-btn:disabled { opacity:.55; }
            .bb-dots { display:inline-flex; gap:3px; }
            .bb-dots span { width:5px; height:5px; border-radius:50%; background:#e8453c; animation:bbBlink 1.2s infinite; }
            .bb-dots span:nth-child(2){animation-delay:.2s} .bb-dots span:nth-child(3){animation-delay:.4s}
            @keyframes bbBlink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
            .bb-pending { font-size:13px; color:#8a6a4a; font-style:italic; display:flex; align-items:center; gap:6px; padding:4px 0; }
            .bb-fanfic-close { margin-left:auto; width:30px; height:30px; border-radius:50%; border:none; background:rgba(232,69,60,0.10); color:#e8453c; cursor:pointer; }
            .bb-fanfic-text { font-size:14px; line-height:2; color:#3a2a1a; white-space:pre-wrap; word-break:break-word; }
        </style>

        <div id="blindboxRoot">
            <div class="bb-nav">
                <button class="bb-nav-back" onclick="bbGoBack()">‹</button>
                <span class="bb-nav-title" id="bbNavTitle">每日盲盒</span>
                <button class="bb-nav-right" id="bbNavRight" onclick="bbOpenTreasury()">✨ 珍品室</button>
            </div>

            <div class="bb-main" id="bbMainPage">
                <div class="bb-machine">
                    <div class="bb-globe"><div class="bb-balls" id="bbBalls"></div></div>
                    <div class="bb-cap-top"></div>
                    <div class="bb-cap"></div>
                    <div class="bb-body"></div>
                    <div class="bb-panel"><div class="bb-slot"></div><div class="bb-knob"></div></div>
                    <div class="bb-outlet" id="bbOutlet"></div>
                    <div class="bb-base"></div>
                </div>
                <div id="bbItemArea" style="width:100%"></div>
                <button class="bb-btn-primary" id="bbDrawBtn" onclick="bbDrawItem()">转动扭蛋机</button>
                <button class="bb-btn-secondary" onclick="bbOpenTreasury()">✨ 珍品室</button>
                <div class="bb-countdown" id="bbCountdown"></div>
            </div>

            <div class="bb-treasury" id="bbTreasuryPage">
                <div class="bb-grid" id="bbTreasuryGrid"></div>
            </div>

            <div class="bb-modal" id="bbDialogModal">
                <div class="bb-modal-box">
                    <div class="bb-modal-head">
                        <div class="bb-modal-emoji" id="bbDialogEmoji"></div>
                        <div>
                            <div class="bb-modal-title" id="bbDialogTitle"></div>
                            <div class="bb-modal-sub" id="bbDialogSub"></div>
                        </div>
                    </div>
                    <div class="bb-modal-body" id="bbDialogBody"></div>
                    <div class="bb-progress-wrap" id="bbProgressWrap" style="display:none">
                        <div class="bb-progress-label"><span>故事存档中</span><span id="bbProgressPct">0%</span></div>
                        <div class="bb-progress-bar"><div class="bb-progress-fill" id="bbProgressFill" style="width:0%"></div></div>
                        <button class="bb-progress-btn" id="bbProgressBtn" onclick="bbStartGenerate()" disabled>生成同人文</button>
                    </div>
                </div>
            </div>

            <div class="bb-fanfic-overlay" id="bbFanficOverlay">
                <div class="bb-fanfic-box">
                    <div class="bb-fanfic-head">
                        <div class="bb-fanfic-title" id="bbFanficTitle">✦ 同人文</div>
                        <button class="bb-fanfic-close" onclick="bbCloseFanfic()">✕</button>
                    </div>
                    <div class="bb-fanfic-body" id="bbFanficBody"></div>
                </div>
            </div>
        </div>
    `

    bbContacts = await getAllStoreData("contacts")
    bbTreasury = bbLoadJson(BB_TREASURY_KEY, []) || []

    const saved = bbLoadJson(BB_TODAY_KEY, null)
    bbTodayData = saved && saved.date === bbTodayKey() ? saved : null

    bbRenderBalls()
    bbRenderMain()
    bbStartCountdown()
}

function bbRenderBalls() {
    const wrap = document.getElementById("bbBalls")
    if (!wrap) return
    const sizes = [26,22,24,20,26,22,24,20,22,24]
    wrap.innerHTML = sizes.map((s, i) => `
        <div class="bb-ball" style="width:${s}px;height:${s}px;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.75),${BB_BALL_COLORS[i % BB_BALL_COLORS.length]})"></div>
    `).join("")
}

function bbStartCountdown() {
    const el = document.getElementById("bbCountdown")
    if (!el) return

    function update() {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        const diff = midnight - now
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        if (el) {
            el.innerHTML = `每日盲盒将在 <strong>${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}</strong> 后刷新`
        }
    }

    update()
    clearInterval(window.__bbCountdownTimer)
    window.__bbCountdownTimer = setInterval(update, 1000)
}

function bbRenderMain() {
    const itemArea = document.getElementById("bbItemArea")
    const drawBtn = document.getElementById("bbDrawBtn")
    const outlet = document.getElementById("bbOutlet")
    if (!itemArea || !drawBtn) return
    if (outlet) outlet.innerHTML = ""

    if (bbTodayData && bbTodayData.item) {
        const it = bbTodayData.item
        itemArea.innerHTML = `
            <div class="bb-item-card">
                <span class="bb-item-emoji">${bbEsc(it.emoji)}</span>
                <div class="bb-item-name">${bbEsc(it.name)}</div>
                <div class="bb-item-desc">${bbEsc(it.desc)}</div>
                <button class="bb-item-action" onclick="bbOpenDialog()">
                    ${bbTodayData.fanfic ? "再看同人文 ✦" : "开启互动 ✦"}
                </button>
            </div>
        `
        drawBtn.disabled = true
        drawBtn.textContent = "今日已抽取"
    } else {
        itemArea.innerHTML = ""
        drawBtn.disabled = false
        drawBtn.textContent = "转动扭蛋机"
    }
}

async function bbDrawItem() {
    const btn = document.getElementById("bbDrawBtn")
    const outlet = document.getElementById("bbOutlet")
    if (!btn) return

    btn.disabled = true
    btn.textContent = "✦ 转动中…"

    const rndColor = BB_BALL_COLORS[Math.floor(Math.random() * BB_BALL_COLORS.length)]
    if (outlet) {
        outlet.innerHTML = `<div style="width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.75),${rndColor});display:flex;align-items:center;justify-content:center;font-size:16px">⟳</div>`
    }

    const today = bbTodayKey()
    const system = `你是一台神秘的扭蛋机，今天（${today}）会随机吐出一件独特的盲盒物品。
物品范围极广：书籍、首饰、鲜花、衣服、鞋子、食物、古董、乐器、文具、香水、植物、游戏道具、艺术品、玩具、生活用品、科技产品。越意想不到越好。
必须严格按照JSON格式输出，不要加任何其他内容：
{"emoji":"一个最贴切的emoji","name":"物品名称（8字以内）","desc":"物品描述（35字以内，有质感有细节）"}`

    let item
    try {
        const resp = await bbCallAI(system, "请生成今天的盲盒物品", 180)
        item = bbParseJsonObject(resp)
    } catch (_) {
        item = {
            emoji: "🎁",
            name: "神秘礼物",
            desc: "包装精美，触感柔软，不知道里面藏着什么惊喜。"
        }
    }

    if (outlet) {
        outlet.innerHTML = `<div style="width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.75),${rndColor});display:flex;align-items:center;justify-content:center;font-size:16px;animation:bbPop .35s ease">${bbEsc(item.emoji || "🎁")}</div>`
    }

    setTimeout(function() {
        bbTodayData = {
            id: "bb_" + Date.now(),
            date: bbTodayKey(),
            item,
            dialog: null,
            fanfic: null,
            createdAt: Date.now()
        }
        bbSaveJson(BB_TODAY_KEY, bbTodayData)
        bbSaveToTreasury(bbTodayData)
        bbRenderMain()
    }, 700)
}

function bbSaveToTreasury(row) {
    bbTreasury = bbLoadJson(BB_TREASURY_KEY, []) || []
    const idx = bbTreasury.findIndex(t => t.date === row.date)
    if (idx >= 0) bbTreasury[idx] = row
    else bbTreasury.unshift(row)
    bbSaveJson(BB_TREASURY_KEY, bbTreasury)
}

function bbOpenDialog() {
    if (!bbTodayData || !bbTodayData.item) return
    if (bbTodayData.fanfic) {
        bbShowFanfic(bbTodayData.fanfic, bbTodayData.item)
        return
    }

    bbDialogState = {
        step: 0,
        selectedChar: null,
        answers: [],
        aiQuestions: [],
        loading: false
    }

    document.getElementById("bbDialogEmoji").textContent = bbTodayData.item.emoji || "🎁"
    document.getElementById("bbDialogTitle").textContent = bbTodayData.item.name || "神秘礼物"
    document.getElementById("bbDialogSub").textContent = "与角色的互动对话"
    document.getElementById("bbProgressWrap").style.display = "none"
    document.getElementById("bbDialogModal").style.display = "flex"
    bbRenderDialogStep()
}

function bbRenderDialogStep() {
    const body = document.getElementById("bbDialogBody")
    if (!body) return

    if (!bbContacts.length) {
        body.innerHTML = `<div class="bb-empty">还没有角色<br>请先在 Chat 里添加角色</div>`
        return
    }

    if (bbDialogState.step === 0) {
        body.innerHTML = `
            <div class="bb-dialog-step">
                <div class="bb-dialog-q">这个盲盒，你想送给谁？</div>
                <div class="bb-contact-grid">
                    ${bbContacts.map(c => `
                        <button class="bb-contact-chip ${bbDialogState.selectedChar?.id === c.id ? "selected" : ""}"
                            onclick="bbSelectContact('${bbEsc(c.id)}')">
                            ${bbEsc(c.name)}
                        </button>
                    `).join("")}
                </div>
            </div>
        `
        return
    }

    let html = `
        <div class="bb-dialog-step">
            <div class="bb-dialog-q">这个盲盒，你想送给谁？</div>
            <div class="bb-answered">→ ${bbEsc(bbDialogState.selectedChar?.name || "")}</div>
        </div>
    `

    bbDialogState.aiQuestions.forEach((q, i) => {
        const ans = bbDialogState.answers[i]
        html += `
            <div class="bb-dialog-step">
                <div style="font-size:11px;color:#8a6a4a;margin-bottom:6px">✦ ${bbEsc(q.charName)} 说</div>
                <div class="bb-dialog-q">${bbEsc(q.question)}</div>
                ${ans ? `
                    <div class="bb-answered">→ ${bbEsc(ans)}</div>
                ` : q.options ? `
                    <div class="bb-options">
                        ${q.options.map(o => `<button class="bb-option" onclick="bbSelectOption(${i}, '${bbEsc(String(o)).replaceAll("'", "&#39;")}')">${bbEsc(o)}</button>`).join("")}
                    </div>
                ` : `
                    <div class="bb-pending"><span class="bb-dots"><span></span><span></span><span></span></span> 角色正在想说什么…</div>
                `}
            </div>
        `
    })

    if (bbDialogState.loading) {
        html += `<div class="bb-dialog-step"><div class="bb-pending"><span class="bb-dots"><span></span><span></span><span></span></span> 角色正在想说什么…</div></div>`
    }

    body.innerHTML = html
    body.scrollTop = body.scrollHeight
    bbUpdateProgress()
}

function bbSelectContact(id) {
    const c = bbContacts.find(x => x.id === id)
    if (!c) return
    bbDialogState.selectedChar = c
    bbDialogState.step = 1
    bbRenderDialogStep()
    bbGenerateNextQuestion(0)
}

async function bbGenerateNextQuestion(idx) {
    if (idx >= 4) return

    bbDialogState.loading = true
    bbRenderDialogStep()

    const it = bbTodayData.item
    const ch = bbDialogState.selectedChar
    const prevQA = bbDialogState.answers
        .map((a, i) => `${bbDialogState.aiQuestions[i]?.charName || ch.name}：${bbDialogState.aiQuestions[i]?.question || ""}\n用户：${a}`)
        .join("\n")

    const persona = [ch.identity, ch.personality, ch.profile, ch.prompt]
        .filter(Boolean)
        .join("\n")
        .slice(0, 1000)

    const system = `你正在扮演“${ch.name}”。
${persona ? `人设资料：\n${persona}\n` : ""}
用户今天抽到了盲盒：${it.emoji}${it.name}（${it.desc}）。用户把这个盲盒送给了你。
请根据物品和你的人设，生成一句自然的互动对话（不超过35字），同时生成3个用户可以选择的回应选项（每个不超过20字，口语化）。
${prevQA ? `之前的对话：\n${prevQA}` : ""}
必须严格按照JSON格式输出，不要加markdown：
{"question":"角色说的话","options":["选项A","选项B","选项C"]}`

    try {
        const resp = await bbCallAI(system, "请生成对话和选项", 280)
        const parsed = bbParseJsonObject(resp)
        bbDialogState.aiQuestions[idx] = {
            charName: ch.name,
            question: parsed.question || `这个${it.name}……是给我的？`,
            options: Array.isArray(parsed.options) && parsed.options.length ? parsed.options.slice(0, 3) : ["是的，特意选的", "随便送送", "看你喜不喜欢"]
        }
    } catch (_) {
        bbDialogState.aiQuestions[idx] = {
            charName: ch.name,
            question: `这个${it.name}……是给我的？`,
            options: ["是的，特意选的", "随便送送", "看你喜不喜欢"]
        }
    }

    bbDialogState.loading = false
    bbRenderDialogStep()
}

function bbSelectOption(idx, option) {
    bbDialogState.answers[idx] = option
    bbDialogState.step = idx + 2
    bbRenderDialogStep()

    if (idx < 3) {
        bbGenerateNextQuestion(idx + 1)
    } else {
        bbShowProgressBar()
    }
}

function bbUpdateProgress() {
    const pct = Math.round((bbDialogState.answers.length / 4) * 100)
    const p = document.getElementById("bbProgressPct")
    const f = document.getElementById("bbProgressFill")
    if (p) p.textContent = pct + "%"
    if (f) f.style.width = pct + "%"
}

function bbShowProgressBar() {
    const wrap = document.getElementById("bbProgressWrap")
    const btn = document.getElementById("bbProgressBtn")
    if (wrap) wrap.style.display = "block"
    if (btn) {
        btn.disabled = false
        btn.textContent = "生成同人文"
    }
    setTimeout(function() {
        const p = document.getElementById("bbProgressPct")
        const f = document.getElementById("bbProgressFill")
        if (p) p.textContent = "100%"
        if (f) f.style.width = "100%"
    }, 300)
}

async function bbStartGenerate() {
    const btn = document.getElementById("bbProgressBtn")
    if (btn) {
        btn.disabled = true
        btn.textContent = "生成中…"
    }

    document.getElementById("bbFanficTitle").textContent = "✦ 故事生成中"
    document.getElementById("bbFanficBody").innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;gap:16px">
            <div style="font-size:18px;color:#e8453c;font-weight:800">正在编织故事…</div>
            <div class="bb-dots"><span></span><span></span><span></span></div>
            <div style="width:100%;height:4px;background:rgba(232,69,60,0.15);border-radius:2px;overflow:hidden"><div style="height:100%;width:70%;background:linear-gradient(90deg,#f5a623,#e8453c);border-radius:2px"></div></div>
            <div style="font-size:13px;color:#8a6a4a;text-align:center;line-height:1.8">参考小红书、lofter、晋江、ao3风格<br>为你生成专属同人文</div>
        </div>
    `
    document.getElementById("bbFanficOverlay").style.display = "flex"
    document.getElementById("bbDialogModal").style.display = "none"

    const it = bbTodayData.item
    const ch = bbDialogState.selectedChar
    const qaText = bbDialogState.aiQuestions
        .map((q, i) => `${q.charName}：${q.question}\n用户：${bbDialogState.answers[i] || "…"}`)
        .join("\n\n")

    const persona = [ch.identity, ch.personality, ch.profile, ch.prompt]
        .filter(Boolean)
        .join("\n")
        .slice(0, 1500)

    const system = `你是一位擅长写同人文的作者。
请根据以下信息，创作一篇约2000字的同人文短篇故事。
角色：${ch.name}
${persona ? `角色资料：\n${persona}\n` : ""}
今日盲盒物品：${it.emoji}${it.name}（${it.desc}）
两人的互动对话：
${qaText}

写作要求：
1. 第三或第二人称叙述，重点描写角色收到物品时的反应和情感，融入对话细节，结尾留有余韵，直接输出正文不需要标题。

【文风规范——最高优先级】
语言质地：以名词和动词为骨架，削减形容词与副词。不说“她很悲伤”，写她做了什么。意象优先——角色的心境借由器物、景致、气味来烘托，不直接点破。
叙事距离：叙事者保持疏离的旁观姿态，如隔薄雾观察，不直接介入角色内心。情节推进缓慢，重心在氛围营造与情绪沉淀，不制造强烈戏剧冲突。
情感处理：情感是水面之下的潜流，从不喷涌。巨大的悲喜往往通过极平淡的日常行为表现。对话简短，充满潜台词，沉默与停顿本身就是表达。
句式节奏：长短句交替，善用短句制造停顿。单独成行的短句有重量。说七分，留三分给读者。
具体禁令：禁止极其、无比、心跳骤停、命运齿轮、刻进DNA、难以言喻、邪魅一笑、眸色一暗、四肢百骸；禁止直接抒情，禁止写“我爱你”“我被感动了”“我心里涌起一阵暖意”；禁止网文套路结构和爽文节奏。
结尾：意犹未尽。可以是一个动作，一句话，一个场景，一个细节。不总结，不点题，不升华主题。结尾像一扇半开的门。`

    try {
        const fanfic = await bbCallAI(system, "请开始写故事", 4000)
        bbTodayData.dialog = {
            contactId: ch.id,
            contactName: ch.name,
            item: it,
            questions: bbDialogState.aiQuestions,
            answers: bbDialogState.answers,
            createdAt: Date.now()
        }
        bbTodayData.fanfic = fanfic
        bbSaveJson(BB_TODAY_KEY, bbTodayData)
        bbSaveToTreasury(bbTodayData)
        await bbSaveBlindboxMemory(ch, it, fanfic)
        bbShowFanfic(fanfic, it)
    } catch (e) {
        document.getElementById("bbFanficBody").innerHTML = `
            <div style="padding:50px 20px;text-align:center;color:#8a6a4a;line-height:1.8">
                <div style="font-size:18px;color:#e8453c;font-weight:800;margin-bottom:10px">生成失败</div>
                请检查 API 设置后重试<br>${bbEsc(e.message || "")}
            </div>
        `
    }
}

async function bbSaveBlindboxMemory(ch, it, fanfic) {
    const text = `【每日盲盒 ${bbTimeLabel()}】用户抽到了${it.emoji || ""}${it.name || "盲盒物品"}，并把它送给了${ch.name}。${it.desc ? "物品描述：" + it.desc + "。" : ""}互动后生成了一段故事：${String(fanfic || "").replace(/\s+/g, " ").slice(0, 180)}`
    try {
        if (typeof saveMemoryEntry === "function") {
            await saveMemoryEntry(ch.id, text, "shared_event", "blindbox")
        }
    } catch (_) {}
}

function bbShowFanfic(text, item) {
    document.getElementById("bbFanficTitle").textContent = `✦ ${item.emoji || "🎁"} ${item.name || "盲盒"} 的故事`
    document.getElementById("bbFanficBody").innerHTML = `<div class="bb-fanfic-text">${bbEsc(text)}</div>`
    document.getElementById("bbFanficOverlay").style.display = "flex"
    document.getElementById("bbDialogModal").style.display = "none"
}

function bbCloseFanfic() {
    const overlay = document.getElementById("bbFanficOverlay")
    if (overlay) overlay.style.display = "none"
    bbRenderMain()
}

function bbOpenTreasury() {
    bbCurrentView = "treasury"
    document.getElementById("bbMainPage").style.display = "none"
    document.getElementById("bbTreasuryPage").classList.add("active")
    document.getElementById("bbNavTitle").textContent = "珍品室"
    document.getElementById("bbNavRight").style.display = "none"
    bbTreasury = bbLoadJson(BB_TREASURY_KEY, []) || []
    bbRenderTreasury()
}

function bbRenderTreasury() {
    const grid = document.getElementById("bbTreasuryGrid")
    if (!grid) return

    if (!bbTreasury.length) {
        grid.innerHTML = `<div class="bb-empty"><div style="font-size:40px;margin-bottom:12px;opacity:.45">🎁</div>珍品室空空如也<br>快去抽盲盒吧</div>`
        return
    }

    grid.innerHTML = bbTreasury.map((t, i) => `
        <div class="bb-treasury-item">
            <div onclick="bbViewTreasuryItem(${i})">
                <span class="bb-treasury-emoji">${bbEsc(t.item?.emoji || "🎁")}</span>
                <div class="bb-treasury-name">${bbEsc(t.item?.name || "盲盒")}</div>
                <div class="bb-treasury-date">${bbEsc(t.date || "")}</div>
            </div>
            <button onclick="event.stopPropagation();bbDeleteTreasuryItem(${i})" style="margin-top:8px;border:none;background:rgba(232,69,60,0.10);color:#e8453c;border-radius:10px;padding:5px 10px;font-size:11px">删除</button>
        </div>
    `).join("")
}

function bbViewTreasuryItem(idx) {
    const item = bbTreasury[idx]
    if (!item) return
    bbTodayData = item
    if (item.fanfic) bbShowFanfic(item.fanfic, item.item)
    else bbOpenDialog()
}

function bbDeleteTreasuryItem(idx) {
    if (!confirm("删除这个盲盒存档吗？")) return
    bbTreasury.splice(idx, 1)
    bbSaveJson(BB_TREASURY_KEY, bbTreasury)
    bbRenderTreasury()
}

function bbGoBack() {
    if (bbCurrentView === "treasury") {
        bbCurrentView = "main"
        document.getElementById("bbMainPage").style.display = "flex"
        document.getElementById("bbTreasuryPage").classList.remove("active")
        document.getElementById("bbNavTitle").textContent = "每日盲盒"
        document.getElementById("bbNavRight").style.display = "block"
        return
    }

    goHome()
}

function bbParseJsonObject(text) {
    const clean = String(text || "").replace(/```json|```/g, "").trim()
    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")
    if (start === -1 || end === -1 || end <= start) throw new Error("JSON解析失败")
    return JSON.parse(clean.slice(start, end + 1))
}

async function bbCallAI(systemPrompt, userPrompt, maxTokens = 300, retries = 2) {
    const apiBase = (localStorage.getItem("MJI_API_BASE") || "").trim()
    const apiKey = (localStorage.getItem("MJI_API_KEY") || "").trim()
    const model = (localStorage.getItem("MJI_API_MODEL") || "").trim()

    if (!apiBase || !apiKey || !model) {
        throw new Error("API未配置")
    }

    let url = apiBase.replace(/\/$/, "")
    if (!url.endsWith("/chat/completions")) {
        url += url.includes("/v1") ? "/chat/completions" : "/v1/chat/completions"
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const resp = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.95
                })
            })

            if (!resp.ok) throw new Error("HTTP " + resp.status)
            const data = await resp.json()
            const text = data.choices?.[0]?.message?.content?.trim() || ""
            if (text) return text
            throw new Error("空响应")
        } catch (e) {
            if (attempt < retries) {
                await bbSleep(1800 * (attempt + 1))
            } else {
                throw e
            }
        }
    }
}
