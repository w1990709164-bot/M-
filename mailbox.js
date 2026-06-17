/* ============================================================
   M叽 PWA 入侵系统增强版
   - 扫描联系人目标
   - 角色锁屏密码
   - 解锁后查看目标手机
   - 消息 / 钱包 / 健康 / 备忘录 / 相册 / 通话 / 搜索 / 音乐 / 行程 / 购物
============================================================ */

let currentHackerTarget = null
let hackerTerminalTimer = null
let hackerInputPassword = ""
let hackerWrongCount = 0
let hackerLastReport = ""
let hackerPhoneDataCache = null

function ensureHackerStyle() {
    if (document.getElementById("hackerStyle")) return

    const style = document.createElement("style")
    style.id = "hackerStyle"
    style.textContent = `
.hacker-page{min-height:100%;background:#000;color:#00ff41;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;padding:0 0 24px;}
.hacker-top{padding:14px 16px;border-bottom:1px solid rgba(0,255,65,.65);background:#000;position:sticky;top:0;z-index:5;}
.hacker-title{font-size:13px;letter-spacing:1px;text-align:center;color:#00ff41;text-shadow:0 0 8px rgba(0,255,65,.6);}
.hacker-terminal{padding:14px 16px 10px;font-size:12px;line-height:1.75;white-space:pre-wrap;color:#00ff41;text-shadow:0 0 6px rgba(0,255,65,.45);border-bottom:1px solid rgba(0,255,65,.22);}
.hacker-list{padding:8px 0;}
.hacker-target{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(0,255,65,.16);background:#000;cursor:pointer;}
.hacker-target:active{background:#031b08;}
.hacker-avatar{width:44px;height:44px;border-radius:7px;overflow:hidden;border:1px solid #00ff41;background:#003300;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(0,255,65,.18);flex-shrink:0;}
.hacker-avatar .avatar-img{width:100%;height:100%;object-fit:cover;border-radius:0;}
.hacker-info{flex:1;min-width:0;}
.hacker-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hacker-id{font-size:11px;color:#006b22;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hacker-action{border:1px solid #00ff41;border-radius:4px;padding:5px 8px;font-size:12px;color:#00ff41;box-shadow:0 0 8px rgba(0,255,65,.14);}
.hacker-empty{padding:54px 18px;text-align:center;color:#007c28;line-height:1.8;font-size:13px;}
.hacker-lock-wrap{min-height:calc(100vh - 68px);display:flex;flex-direction:column;align-items:center;background:#000;padding:16px 14px 30px;}
.hacker-lock-card{width:min(100%,420px);border:1px solid rgba(0,255,65,.65);border-radius:16px;background:radial-gradient(circle at top,rgba(0,255,65,.13),#000 46%);box-shadow:0 0 24px rgba(0,255,65,.12);padding:18px 14px 22px;}
.hacker-lock-target{text-align:left;line-height:1.7;font-size:12px;color:#00aa44;margin-bottom:22px;white-space:pre-wrap;}
.hacker-pass-display{text-align:center;font-size:34px;font-weight:800;letter-spacing:9px;color:#00ff41;text-shadow:0 0 10px rgba(0,255,65,.5);margin:12px 0 8px;}
.hacker-pass-display.error{color:#ff3131;text-shadow:0 0 10px rgba(255,49,49,.6);}
.hacker-pass-hint{text-align:center;font-size:12px;color:#007c28;line-height:1.7;min-height:42px;margin-bottom:18px;white-space:pre-wrap;}
.hacker-pass-hint.ok{color:#00ff41;}
.hacker-pass-hint.error{color:#ff3131;}
.hacker-keypad{display:grid;grid-template-columns:repeat(3,80px);gap:12px;justify-content:center;margin-top:10px;}
.hacker-key{height:68px;border:1px solid #003300;background:#0a0a0a;color:#00ff41;border-radius:10px;font-family:inherit;font-size:22px;font-weight:800;cursor:pointer;box-shadow:inset 0 0 14px rgba(0,255,65,.04);}
.hacker-key:active{background:#00220b;transform:scale(.97);}
.hacker-btn-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;}
.hacker-btn{background:#001b08;color:#00ff41;border:1px solid #00ff41;border-radius:10px;padding:11px 10px;font-family:inherit;font-size:12px;cursor:pointer;}
.hacker-btn:active{transform:scale(.98);background:#003611;}
.hacker-btn.primary{background:#00ff41;color:#001b08;font-weight:800;}
.hacker-warning{width:min(100%,420px);margin:12px auto 0;padding:10px 12px;border-left:3px solid #00ff41;background:rgba(0,255,65,.06);color:#75ff99;font-size:12px;line-height:1.6;}
.hacker-loading{min-height:calc(100vh - 68px);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:#000;color:#00ff41;font-size:13px;line-height:1.8;white-space:pre-wrap;padding:28px;}
.hacker-spinner{width:34px;height:34px;border:3px solid rgba(0,255,65,.25);border-top-color:#00ff41;border-radius:50%;animation:hackerSpin .8s linear infinite;margin-top:16px;}
@keyframes hackerSpin{to{transform:rotate(360deg)}}
.hacker-phone{min-height:100%;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;padding-bottom:30px;}
.hp-top{position:sticky;top:0;background:#050505;border-bottom:1px solid rgba(0,255,65,.45);z-index:20;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;color:#00ff41;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;}
.hp-back{cursor:pointer;color:#00ff41;padding:4px 6px;}
.hp-save{cursor:pointer;color:#00ff41;border:1px solid rgba(0,255,65,.75);border-radius:8px;padding:5px 8px;}
.hp-header{padding:20px 16px 8px;text-align:center;color:#888;font-size:12px;}
.hp-section{margin:12px;background:#1c1c1e;border-radius:12px;overflow:hidden;}
.hp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:16px;}
.hp-app{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;}
.hp-ic{width:56px;height:56px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;}
.hp-nm{font-size:11px;color:rgba(255,255,255,.65);}
.hp-screen{display:none;position:fixed;inset:0;background:#111;z-index:100;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:36px;}
.hp-screen-top{position:sticky;top:0;background:rgba(17,17,17,.97);padding:12px 16px;display:flex;align-items:center;z-index:101;border-bottom:1px solid rgba(255,255,255,.05);}
.hp-screen-back{color:#07c160;font-size:20px;cursor:pointer;margin-right:12px;padding:2px 8px;}
.hp-screen-title{font-size:16px;font-weight:700;}
.hp-chat-item{display:flex;align-items:center;gap:12px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;}
.hp-chat-av{width:44px;height:44px;border-radius:8px;background:#333;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.hp-chat-nm{font-size:15px;color:#fff;}
.hp-chat-last{font-size:12px;color:#888;margin-top:2px;}
.hp-msgs{padding:12px 14px;}
.hp-msg-left{display:flex;flex-direction:column;align-items:flex-start;margin-bottom:10px;}
.hp-msg-right{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:10px;}
.hp-sender{font-size:11px;color:#888;margin-bottom:3px;}
.hp-time{font-size:11px;color:#888;margin-bottom:3px;}
.hp-bubble-left{background:#2a2a2e;color:rgba(255,255,255,.88);padding:9px 13px;border-radius:16px 16px 16px 4px;font-size:14px;line-height:1.6;max-width:76%;white-space:pre-wrap;word-break:break-word;}
.hp-bubble-right{background:#07c160;color:#fff;padding:9px 13px;border-radius:16px 16px 4px 16px;font-size:14px;line-height:1.6;max-width:76%;white-space:pre-wrap;word-break:break-word;}
.hp-row{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.05);}
.hp-desc{font-size:14px;color:#fff;}
.hp-sub{font-size:11px;color:#888;margin-top:2px;}
.hp-amount{font-size:16px;font-weight:700;}
.hp-stat-row{display:flex;justify-content:space-around;padding:18px 12px;}
.hp-stat{text-align:center;}.hp-stat-val{font-size:25px;font-weight:800;color:#07c160;}.hp-stat-label{font-size:12px;color:#888;margin-top:4px;}
.hp-info{padding:14px 16px;font-size:14px;color:#aaa;line-height:1.8;white-space:pre-wrap;word-break:break-word;}
.hp-memo{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;}.hp-memo-title{font-size:15px;color:#fff;font-weight:600;}.hp-memo-preview{font-size:12px;color:#888;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.hp-memo-full{display:none;font-size:13px;color:#aaa;line-height:1.8;margin-top:8px;white-space:pre-wrap;}
.hp-photo-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}.hp-photo{position:relative;aspect-ratio:1;cursor:pointer;overflow:hidden;background:#1a1a1a;}.hp-photo-dark{width:100%;height:100%;background:linear-gradient(135deg,#222,#050505);}.hp-photo-desc{position:absolute;inset:0;background:rgba(0,0,0,.88);padding:8px;font-size:11px;color:#ccc;line-height:1.5;overflow:auto;display:none;}
.hp-search-item,.hp-music-item{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);font-size:14px;color:#aaa;}
.hp-shop{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.05);position:relative;}.hp-shop-name{font-size:14px;color:#fff;padding-right:78px;}.hp-shop-price{position:absolute;right:16px;top:12px;font-size:14px;color:#fff;font-weight:700;}.hp-shop-note{font-size:12px;color:#888;margin-top:3px;}
.hp-call{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer;}.hp-call-name{font-size:15px;color:#fff;}.hp-call-type{font-size:12px;margin-top:2px;}.hp-call-content{display:none;margin-top:8px;font-size:13px;color:#888;line-height:1.6;}
.hp-balance{padding:24px 16px;text-align:center;}.hp-balance-num{font-size:36px;font-weight:800;color:#fff;}.hp-balance-label{font-size:12px;color:#888;margin-top:4px;}
`
    document.head.appendChild(style)
}

function hackerEscape(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function hackerAvatar(value, fallback = "▣") {
    if (typeof avatarHtml === "function") return avatarHtml(value, fallback)
    if (value) return `<img class="avatar-img" src="${hackerEscape(value)}" onerror="this.remove()">`
    return `<span>${hackerEscape(fallback)}</span>`
}

function hackerApiUrl() {
    if (typeof getChatApiUrl === "function") return getChatApiUrl()
    let base = localStorage.getItem("MJI_API_BASE") || ""
    base = base.replace(/\/+$/, "")
    if (!base) return ""
    if (base.endsWith("/chat/completions")) return base
    return base.includes("/v1") ? base + "/chat/completions" : base + "/v1/chat/completions"
}

function hackerOneLine(text) {
    return String(text || "").replace(/\s+/g, " ").trim()
}

function hackerRand(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function showHackerHome() {
    ensureHackerStyle()
    currentPage = "hackerHome"
    currentHackerTarget = null
    hackerLastReport = ""
    hackerPhoneDataCache = null

    const root = document.getElementById("hackerRoot") || document.getElementById("appContent")
    if (!root) return

    const contacts = (await getAllStoreData("contacts"))
        .filter(c => c && c.id && String(c.id).trim())
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    root.innerHTML = `
        <div class="hacker-page">
            <div class="hacker-top">
                <div class="hacker-title">// CYBER_INTRUDE v2.0</div>
            </div>
            <div class="hacker-terminal" id="hackerTerminal">&gt; 正在扫描目标节点...\n&gt; 检测到 ${contacts.length} 个活跃目标\n&gt; 选择渗透目标：</div>
            <div class="hacker-list" id="hackerTargetList">
                ${contacts.length ? contacts.map(c => hackerTargetRow(c)).join("") : `<div class="hacker-empty">没有可入侵目标<br>先去 Chat → 联系人 添加角色</div>`}
            </div>
        </div>
    `

    animateHackerTerminal([
        "> 正在扫描局域网...",
        "> 检测到加密通信节点...",
        "> 破解防火墙中...",
        "> 渗透成功，选择目标开始入侵："
    ])
}

function hackerTargetRow(c) {
    const id = JSON.stringify(c.id)
    return `
        <div class="hacker-target" onclick='openHackerTarget(${id})'>
            <div class="hacker-avatar">${hackerAvatar(c.avatar, "▣")}</div>
            <div class="hacker-info">
                <div class="hacker-name">TARGET_${hackerEscape(String(c.name || "UNKNOWN").toUpperCase())}</div>
                <div class="hacker-id">ID: ${hackerEscape(String(c.id).slice(0, 12))}...</div>
            </div>
            <div class="hacker-action">[入侵]</div>
        </div>
    `
}

function animateHackerTerminal(lines) {
    const tv = document.getElementById("hackerTerminal")
    if (!tv) return
    if (hackerTerminalTimer) clearTimeout(hackerTerminalTimer)

    let index = 0
    const run = () => {
        if (!document.getElementById("hackerTerminal")) return
        if (index < lines.length) {
            tv.textContent = lines.slice(0, index + 1).join("\n")
            index++
            hackerTerminalTimer = setTimeout(run, 520)
        }
    }
    run()
}

async function openHackerTarget(contactId) {
    ensureHackerStyle()
    currentPage = "hackerTarget"
    hackerInputPassword = ""
    hackerWrongCount = 0
    hackerLastReport = ""
    hackerPhoneDataCache = null

    const contacts = await getAllStoreData("contacts")
    currentHackerTarget = contacts.find(c => c.id === contactId)
    if (!currentHackerTarget) {
        alert("目标不存在")
        showHackerHome()
        return
    }

    document.getElementById("appTitle").innerText = "入侵 " + (currentHackerTarget.name || "目标")
    document.getElementById("appContent").innerHTML = `
        <div id="hackerRoot" class="hacker-page">
            <div class="hacker-top"><div class="hacker-title">// TARGET_LOCK_SCREEN</div></div>
            <div class="hacker-loading">&gt; 正在读取目标锁屏协议...<br>&gt; 正在生成密码规则...<div class="hacker-spinner"></div></div>
        </div>
    `

    await ensureHackerLockPassword(currentHackerTarget)
    renderHackerLockScreen()
}

async function ensureHackerLockPassword(contact) {
    const existing = String(contact.lockPassword || "").replace(/\D/g, "").slice(0, 6)
    if (existing.length === 6) return existing

    let password = ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"
    const url = hackerApiUrl()

    if (apiKey && url) {
        try {
            const prompt = `
你是 ${contact.name || "这个角色"}。
人设：${contact.identity || contact.profile || contact.personality || "暂无"}
请根据你的人设，生成一个对你有特殊意义的6位数手机锁屏密码。
只输出6位数字，不要解释，不要换行，不要空格。
            `.trim()
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
                body: JSON.stringify({
                    model: apiModel,
                    temperature: 0.7,
                    messages: [{ role: "user", content: prompt }]
                })
            })
            if (resp.ok) {
                const data = await resp.json()
                const raw = data?.choices?.[0]?.message?.content || ""
                password = String(raw).replace(/\D/g, "").slice(0, 6)
            }
        } catch (_) {}
    }

    if (password.length !== 6) {
        password = hackerDeterministicPassword(contact)
    }

    contact.lockPassword = password
    await hackerPutContact(contact)
    return password
}

function hackerDeterministicPassword(contact) {
    const seed = String(contact.id || "") + String(contact.name || "")
    let n = 0
    for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i) * (i + 17)) % 900000
    return String(100000 + n).slice(0, 6)
}

function hackerPutContact(contact) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction("contacts", "readwrite")
            tx.objectStore("contacts").put(contact)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (_) { resolve(false) }
    })
}

function renderHackerLockScreen() {
    if (!currentHackerTarget) return
    const root = document.getElementById("hackerRoot") || document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="hacker-page">
            <div class="hacker-top"><div class="hacker-title">// TARGET_LOCK_SCREEN</div></div>
            <div class="hacker-lock-wrap">
                <div class="hacker-lock-card">
                    <div class="hacker-lock-target">// 目标：${hackerEscape(String(currentHackerTarget.name || "UNKNOWN").toUpperCase())}\n// 正在尝试解锁...</div>
                    <div style="display:flex;justify-content:center;margin-bottom:8px"><div class="hacker-big-avatar">${hackerAvatar(currentHackerTarget.avatar, "▣")}</div></div>
                    <div class="hacker-pass-display" id="hackerPassDisplay">______</div>
                    <div class="hacker-pass-hint" id="hackerPassHint">输入6位密码</div>
                    <div class="hacker-keypad">
                        ${["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(k => `<button class="hacker-key" onclick="hackerPressKey('${k}')">${k}</button>`).join("")}
                    </div>
                    <div class="hacker-btn-row">
                        <button class="hacker-btn" onclick="hackerAutoHint()">获取提示</button>
                        <button class="hacker-btn primary" onclick="hackerUseMasterKey()">应急口令</button>
                    </div>
                </div>
                <div class="hacker-warning">应急口令为 666666。角色专属密码会根据角色人设生成，输错两次会给出密码线索。</div>
            </div>
        </div>
    `
    updateHackerPasswordDisplay()
}

function hackerPressKey(key) {
    if (key === "⌫") {
        hackerInputPassword = hackerInputPassword.slice(0, -1)
        updateHackerPasswordDisplay()
        return
    }
    if (key === "✓") {
        checkHackerPassword()
        return
    }
    if (/^\d$/.test(key) && hackerInputPassword.length < 6) {
        hackerInputPassword += key
        updateHackerPasswordDisplay()
        if (hackerInputPassword.length === 6) setTimeout(checkHackerPassword, 260)
    }
}

function updateHackerPasswordDisplay(error = false) {
    const display = document.getElementById("hackerPassDisplay")
    if (!display) return
    const filled = "●".repeat(hackerInputPassword.length)
    const empty = "_".repeat(6 - hackerInputPassword.length)
    display.textContent = filled + empty
    display.classList.toggle("error", !!error)
}

function checkHackerPassword() {
    if (!currentHackerTarget) return
    const correct = String(currentHackerTarget.lockPassword || "")
    const master = "666666"
    const hint = document.getElementById("hackerPassHint")

    if (hackerInputPassword === correct || hackerInputPassword === master) {
        if (hint) {
            hint.className = "hacker-pass-hint ok"
            hint.textContent = "// 解锁成功！正在入侵..."
        }
        updateHackerPasswordDisplay(false)
        setTimeout(showHackerPhoneLoading, 700)
        return
    }

    hackerWrongCount++
    updateHackerPasswordDisplay(true)
    if (hint) {
        hint.className = "hacker-pass-hint error"
        if (hackerWrongCount === 1) hint.textContent = "✗ 密码错误，再想想~"
        else if (hackerWrongCount === 2) hint.textContent = "✗ 再错一次就要锁定了哦" + hackerPasswordHintText()
        else hint.textContent = "⚠ 系统警告！" + hackerPasswordHintText()
    }

    setTimeout(() => {
        hackerInputPassword = ""
        updateHackerPasswordDisplay(false)
        const h = document.getElementById("hackerPassHint")
        if (h) {
            h.className = "hacker-pass-hint"
            h.textContent = "输入6位密码"
        }
    }, 1700)
}

function hackerPasswordHintText() {
    const pw = String(currentHackerTarget?.lockPassword || "")
    if (pw.length !== 6) return ""
    const firstTwo = pw.slice(0, 2)
    const lastOne = pw.slice(-1)
    const sum = pw.split("").reduce((s, c) => s + Number(c || 0), 0)
    return `\n💡 提示：开头是 ${firstTwo}，结尾是 ${lastOne}，各位数字之和为 ${sum}`
}

function hackerAutoHint() {
    const hint = document.getElementById("hackerPassHint")
    if (!hint) return
    hint.className = "hacker-pass-hint error"
    hint.textContent = hackerPasswordHintText() || "暂时无法解析密码线索"
}

function hackerUseMasterKey() {
    hackerInputPassword = "666666"
    updateHackerPasswordDisplay()
    setTimeout(checkHackerPassword, 160)
}

async function showHackerPhoneLoading(forceRegenerate = false) {
    if (!currentHackerTarget) return
    currentPage = "hackerPhone"
    const root = document.getElementById("hackerRoot") || document.getElementById("appContent")
    if (!root) return
    root.innerHTML = `
        <div class="hacker-page">
            <div class="hacker-top"><div class="hacker-title">📱 ${hackerEscape(currentHackerTarget.name || "目标")} 的手机</div></div>
            <div class="hacker-loading" id="hackerPhoneLoading">&gt; 正在入侵目标设备...\n&gt; 读取个人数据中...\n&gt; 请稍候...<div class="hacker-spinner"></div></div>
        </div>
    `
    const dataPack = await generateHackerPhoneData(forceRegenerate)
    renderHackerPhone(dataPack.data, dataPack.realChatHtml, dataPack.userNickname)
}

async function generateHackerPhoneData(forceRegenerate = false) {
    const contact = currentHackerTarget
    const contacts = await getAllStoreData("contacts")
    const messages = await getAllStoreData("messages")
    const groups = await safeGetStoreData("groups")
    const memories = await safeGetStoreData("memories")
    const myName = localStorage.getItem("MJI_MY_NAME") || localStorage.getItem("MJI_MY_NICKNAME") || "用户"
    const userNickname = contact.userNicknameByAi || myName

    const recentMsgs = messages
        .filter(m => m.contactId === contact.id)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
        .reverse()

    const realChatHtml = buildHackerRealChatHtml(recentMsgs, contact, userNickname)
    const chatSummary = recentMsgs.map(m => {
        const role = m.role === "user" ? userNickname : (contact.name || "TA")
        return `${role}: ${m.content || ""}`
    }).join("\n").slice(0, 900)

    const cyberMemory = memories
        .filter(m => m.contactId === contact.id)
        .sort((a, b) => (b.insertTime || b.createdAt || 0) - (a.insertTime || a.createdAt || 0))
        .slice(0, 10)
        .map(m => m.text || m.memoryText || "")
        .filter(Boolean)
        .join("\n")
        .slice(0, 1100)

    const fallback = buildFallbackPhoneData(contact, userNickname, contacts, groups, cyberMemory)

    if (!forceRegenerate && contact.hackerPhoneCache && contact.hackerPhoneCache.data) {
        hackerPhoneDataCache = contact.hackerPhoneCache.data
        return { data: contact.hackerPhoneCache.data, realChatHtml, userNickname }
    }

    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"
    const url = hackerApiUrl()
    if (!apiKey || !url) {
        contact.hackerPhoneCache = { data: fallback, cachedAt: Date.now() }
        await hackerPutContact(contact)
        hackerPhoneDataCache = fallback
        return { data: fallback, realChatHtml, userNickname }
    }

    try {
        const nowTime = new Date().toLocaleString("zh-CN")
        const scheduleText = await getHackerScheduleText(contact.id)
        const prompt = `
你现在扮演 ${contact.name || "这个角色"}。
【人设】：${contact.identity || contact.profile || contact.personality || "暂无"}
【关于 ${myName} 的记忆】：${cyberMemory || "暂无"}
【最近和 ${myName} 的聊天，最新5条】：
${chatSummary || "暂无"}
【今日行程】：${scheduleText || "无"}
【当前时间】：${nowTime}

请以 ${contact.name || "该角色"} 的角度生成他/她手机里的虚拟数据。
注意：
1. 这是AI陪伴APP里的沉浸式演出，不是真实手机数据。
2. 群聊和好友私聊内容必须各至少5条消息，要有来有往，内容真实自然。
3. 与 ${myName} 相关的私聊内容必须严格参考最近聊天，只能引用或延伸真实聊天内容，禁止编造 ${myName} 说过的话。
4. 备忘录第三条必须是关于 ${userNickname} 的隐秘想法或感情。
5. 聊天记录里如果提到对方，统一用「${myName}」称呼，禁止用「用户」这个词。
6. 所有内容必须中文，除非歌曲名/网名需要少量外文，外文后要带中文括号解释。

严格按以下JSON格式输出，只输出JSON：
{
  "chat_group_name":"群聊名称",
  "chat_group_msgs":[{"sender":"群员A","content":"消息内容","isMe":false}],
  "chat_friend1_name":"好友1名字",
  "chat_friend1_msgs":[{"sender":"好友1","content":"内容","isMe":false}],
  "chat_friend2_name":"好友2名字",
  "chat_friend2_msgs":[{"sender":"好友2","content":"内容","isMe":false}],
  "wallet_balance":"1234.56",
  "wallet_records":[{"amount":"+500.00","desc":"名目","time":"时间"}],
  "steps":8432,
  "calories":312,
  "memo1_title":"备忘标题",
  "memo1_body":"备忘内容",
  "memo2_title":"标题",
  "memo2_body":"内容",
  "memo3_title":"关于${userNickname}的秘密",
  "memo3_body":"对${userNickname}的真实感情或秘密想法，至少100字",
  "photos":[{"desc":"照片描述"},{"desc":"照片描述"},{"desc":"照片描述"},{"desc":"照片描述"},{"desc":"照片描述"},{"desc":"照片描述"}],
  "secret_photos":[{"desc":"私密照片描述"},{"desc":"私密照片描述"},{"desc":"私密照片描述"}],
  "call_records":[{"name":"联系人","type":"拨出","duration":"3分钟","content":"通话内容"}],
  "search_history":["搜索词1","搜索词2","搜索词3","搜索词4","搜索词5"],
  "music_playlist":"歌单名称",
  "music_songs":["歌曲1 - 歌手","歌曲2 - 歌手","歌曲3 - 歌手"],
  "sleep_record":"昨晚几点睡到几点",
  "schedule_today":"${scheduleText || "根据角色人设生成今日行程"}",
  "shop_recent":[{"name":"商品名称","price":"88.00","status":"已收货","time":"3天前"}],
  "shop_cart":[{"name":"购物车商品","price":"299.00","note":"犹豫了好久"}]
}
        `.trim()

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.85,
                messages: [{ role: "user", content: prompt }]
            })
        })
        if (!resp.ok) throw new Error("API " + resp.status)
        const responseData = await resp.json()
        const content = responseData?.choices?.[0]?.message?.content?.trim() || ""
        const parsed = parseHackerJsonObject(content) || fallback
        normalizePhoneData(parsed)
        contact.hackerPhoneCache = { data: parsed, cachedAt: Date.now() }
        await hackerPutContact(contact)
        hackerPhoneDataCache = parsed
        return { data: parsed, realChatHtml, userNickname }
    } catch (e) {
        contact.hackerPhoneCache = { data: fallback, cachedAt: Date.now() }
        await hackerPutContact(contact)
        hackerPhoneDataCache = fallback
        return { data: fallback, realChatHtml, userNickname }
    }
}

async function safeGetStoreData(name) {
    try { return await getAllStoreData(name) } catch (_) { return [] }
}

function parseHackerJsonObject(text) {
    const clean = String(text || "").replace(/```json|```/g, "").trim()
    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")
    if (start < 0 || end <= start) return null
    try { return JSON.parse(clean.slice(start, end + 1)) } catch (_) { return null }
}

function normalizePhoneData(d) {
    d.chat_group_msgs = Array.isArray(d.chat_group_msgs) ? d.chat_group_msgs : []
    d.chat_friend1_msgs = Array.isArray(d.chat_friend1_msgs) ? d.chat_friend1_msgs : []
    d.chat_friend2_msgs = Array.isArray(d.chat_friend2_msgs) ? d.chat_friend2_msgs : []
    d.wallet_records = Array.isArray(d.wallet_records) ? d.wallet_records : []
    d.photos = Array.isArray(d.photos) ? d.photos : []
    d.secret_photos = Array.isArray(d.secret_photos) ? d.secret_photos : []
    d.call_records = Array.isArray(d.call_records) ? d.call_records : []
    d.search_history = Array.isArray(d.search_history) ? d.search_history : []
    d.music_songs = Array.isArray(d.music_songs) ? d.music_songs : []
    d.shop_recent = Array.isArray(d.shop_recent) ? d.shop_recent : []
    d.shop_cart = Array.isArray(d.shop_cart) ? d.shop_cart : []
}

function buildHackerRealChatHtml(messages, contact, userNickname) {
    if (!messages.length) return `<div style="text-align:center;color:#555;font-size:13px;padding:40px 20px">暂无聊天记录</div>`
    return messages.map(m => {
        const content = hackerEscape(String(m.content || "")
            .replace(/\[[^\]]*QUOTE[^\]]*\]/g, "")
            .replace(/（[^）]{0,100}）/g, "")
            .trim())
        if (!content) return ""
        if (m.role === "user") {
            return `<div class="hp-msg-left"><div class="hp-sender">${hackerEscape(userNickname)}</div><div class="hp-bubble-left">${content}</div></div>`
        }
        return `<div class="hp-msg-right"><div class="hp-time">${formatHackerTime(m.createdAt)}</div><div class="hp-bubble-right">${content}</div></div>`
    }).join("") || `<div style="text-align:center;color:#555;font-size:13px;padding:40px 20px">暂无聊天记录</div>`
}

function formatHackerTime(ts) {
    try {
        const d = new Date(ts || Date.now())
        return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0")
    } catch (_) { return "" }
}

async function getHackerScheduleText(contactId) {
    try {
        const diaries = await safeGetStoreData("diaries")
        const today = new Date().toISOString().slice(0, 10)
        const list = diaries.filter(d => d.ownerId === contactId && String(d.dateKey || d.date || "").includes(today))
        return list.slice(0, 3).map(d => d.content || d.title || "").join("\n")
    } catch (_) { return "" }
}

function buildFallbackPhoneData(contact, userNickname, contacts, groups, memory) {
    const other = contacts.filter(c => c.id !== contact.id).slice(0, 3)
    const friend1 = other[0]?.name || hackerRand(["夜猫子", "路过的同事", "老朋友"])
    const friend2 = other[1]?.name || hackerRand(["便利店门口的人", "匿名好友", "训练场同伴"])
    const groupName = groups?.[0]?.name || hackerRand(["深夜摸鱼小组", "临时任务群", "今天也要活下去"])
    const name = contact.name || "TA"
    return {
        chat_group_name: groupName,
        chat_group_msgs: [
            { sender: friend1, content: "今天外面风好大，刚出去一趟人都清醒了。", isMe: false },
            { sender: name, content: "嗯，路上小心。", isMe: true },
            { sender: friend2, content: "你怎么又这么短句，笑死。", isMe: false },
            { sender: name, content: "够表达意思就行。", isMe: true },
            { sender: friend1, content: "行行行，懂你。", isMe: false }
        ],
        chat_friend1_name: friend1,
        chat_friend1_msgs: [
            { sender: friend1, content: "你最近状态还行吗？", isMe: false },
            { sender: name, content: "还行。", isMe: true },
            { sender: friend1, content: "你这两个字一般就代表不太行。", isMe: false },
            { sender: name, content: "别拆穿。", isMe: true },
            { sender: friend1, content: "知道了，给你留点面子。", isMe: false }
        ],
        chat_friend2_name: friend2,
        chat_friend2_msgs: [
            { sender: friend2, content: "那个东西我放你桌上了。", isMe: false },
            { sender: name, content: "看到了。", isMe: true },
            { sender: friend2, content: "记得吃饭，别又忘。", isMe: false },
            { sender: name, content: "嗯。", isMe: true },
            { sender: friend2, content: "每次都嗯，真服了。", isMe: false }
        ],
        wallet_balance: String((Math.random() * 3600 + 200).toFixed(2)),
        wallet_records: [
            { amount: "-18.00", desc: "咖啡", time: "今天 09:12" },
            { amount: "-42.50", desc: "便利店", time: "昨天 22:40" },
            { amount: "+500.00", desc: "转入", time: "前天" }
        ],
        steps: Math.floor(Math.random() * 9000 + 1200),
        calories: Math.floor(Math.random() * 420 + 120),
        memo1_title: "待办",
        memo1_body: "整理桌面。把没回的消息处理掉。晚上别再拖到太晚。",
        memo2_title: "别忘了",
        memo2_body: "有些话可以晚一点说，但不要一直不说。",
        memo3_title: `关于${userNickname}的秘密`,
        memo3_body: `我其实会反复看和${userNickname}的聊天。不是每次都知道该怎么回，但每次看到新的消息，心里都会安静一点。${memory ? "记忆里有些片段一直没散：" + memory.slice(0, 80) : "有些细节明明很小，却像被单独存进了某个地方。"}`,
        photos: [
            { desc: "桌角上的半杯水，旁边压着一张皱掉的便签。" },
            { desc: "窗外很暗，只拍到一点反光。" },
            { desc: "随手拍的天空，云层像被撕开。" },
            { desc: "一张模糊的路灯照片。" },
            { desc: "桌面，几样常用的小东西排得很乱。" },
            { desc: "一条没发出去的截图，被裁掉了名字。" }
        ],
        secret_photos: [
            { desc: `和${userNickname}有关的一张截图，被小心藏在最后。` },
            { desc: "一张只拍到手边阴影的照片。" },
            { desc: "备忘录截图，像是写了又删。" }
        ],
        call_records: [
            { name: friend1, type: "拨出", duration: "3分钟", content: "对方问他最近是不是又没睡好，他说没有。" },
            { name: friend2, type: "未接", duration: "未接听", content: "看到来电时在发呆，过了很久才想起来。" }
        ],
        search_history: ["怎么自然地道歉", "附近便利店 营业时间", `${userNickname} 喜欢什么`, "失眠怎么办", "天气 明天"],
        music_playlist: "夜里别乱想",
        music_songs: ["After Dark - Mr.Kitty", "夜に駆ける（奔向夜晚）- YOASOBI", "慢慢喜欢你 - 莫文蔚"],
        sleep_record: "02:18 入睡，07:06 醒来，中途醒了2次。",
        schedule_today: "上午：处理杂事\n下午：外出\n晚上：一个人待着，可能会看消息",
        shop_recent: [
            { name: "黑色便签本", price: "28.00", status: "已收货", time: "3天前" },
            { name: "无糖薄荷糖", price: "12.80", status: "已收货", time: "昨天" }
        ],
        shop_cart: [
            { name: "小夜灯", price: "69.00", note: "犹豫要不要买" },
            { name: "软毛毯", price: "129.00", note: "看起来很暖" }
        ]
    }
}

function renderHackerPhone(data, realChatHtml = "", userNickname = "用户") {
    normalizePhoneData(data)
    const root = document.getElementById("hackerRoot") || document.getElementById("appContent")
    if (!root) return
    root.innerHTML = buildHackerPhoneHtml(data, realChatHtml, userNickname)
}

function hpScreen(id, title, body) {
    return `<div class="hp-screen" id="${id}"><div class="hp-screen-top"><span class="hp-screen-back" onclick="hpHide('${id}')">‹</span><span class="hp-screen-title">${hackerEscape(title)}</span></div>${body}</div>`
}

function buildHackerPhoneHtml(data, realChatHtml, userNickname) {
    const name = currentHackerTarget?.name || "目标"
    const chatGroupName = data.chat_group_name || "群聊"
    const friend1 = data.chat_friend1_name || "好友1"
    const friend2 = data.chat_friend2_name || "好友2"

    return `
        <div class="hacker-phone">
            <div class="hp-top">
                <span class="hp-back" onclick="renderHackerLockScreen()">‹ 锁屏</span>
                <span>📱 ${hackerEscape(name)}的手机</span>
                <span class="hp-save" onclick="saveHackerPhoneMemory()">写入记忆</span>
            </div>
            <div class="hp-header">// ACCESS_GRANTED / DEVICE_MIRROR</div>
            <div class="hp-section">
                <div class="hp-grid">
                    ${hpApp("chat-screen", "💬", "#07C160", "消息")}
                    ${hpApp("wallet-screen", "💰", "#FF9500", "钱包")}
                    ${hpApp("health-screen", "❤️", "#FF2D55", "健康")}
                    ${hpApp("memo-screen", "📝", "#FFD60A", "备忘录")}
                    ${hpApp("photo-screen", "🖼️", "#5856D6", "相册")}
                    ${hpApp("call-screen", "📞", "#34C759", "通话")}
                    ${hpApp("search-screen", "🔍", "#636366", "搜索")}
                    ${hpApp("music-screen", "🎵", "#FF375F", "音乐")}
                    ${hpApp("schedule-screen", "📅", "#007AFF", "行程")}
                    ${hpApp("shop-screen", "🛍️", "#FF6B00", "购物")}
                    <div class="hp-app" onclick="showHackerPhoneLoading(true)"><div class="hp-ic" style="background:#222;color:#00ff41">↻</div><div class="hp-nm">重扫</div></div>
                </div>
            </div>
        </div>
        ${hpScreen("chat-screen", "消息", `
            ${hpChatItem("chat-group", "👥", chatGroupName, "群聊")}
            ${hpChatItem("chat-friend1", "👤", friend1, "私聊")}
            ${hpChatItem("chat-friend2", "👤", friend2, "私聊")}
            ${hpChatItem("chat-real", "⭐", userNickname + " [置顶]", `与${name}的对话`, true)}
        `)}
        ${hpScreen("chat-group", chatGroupName, `<div class="hp-msgs">${buildGeneratedChatMsgs(data.chat_group_msgs)}</div>`)}
        ${hpScreen("chat-friend1", friend1, `<div class="hp-msgs">${buildGeneratedChatMsgs(data.chat_friend1_msgs)}</div>`)}
        ${hpScreen("chat-friend2", friend2, `<div class="hp-msgs">${buildGeneratedChatMsgs(data.chat_friend2_msgs)}</div>`)}
        ${hpScreen("chat-real", userNickname, `<div class="hp-msgs">${realChatHtml}</div>`)}
        ${hpScreen("wallet-screen", "钱包", `
            <div class="hp-section"><div class="hp-balance"><div class="hp-balance-label">余额</div><div class="hp-balance-num">¥${hackerEscape(data.wallet_balance || "0.00")}</div></div></div>
            <div style="padding:0 12px 8px;color:#888;font-size:12px">最近交易</div>
            <div class="hp-section">${buildWalletRecords(data.wallet_records)}</div>
        `)}
        ${hpScreen("health-screen", "健康数据", `
            <div class="hp-section"><div class="hp-stat-row"><div class="hp-stat"><div class="hp-stat-val">${Number(data.steps || 0)}</div><div class="hp-stat-label">今日步数</div></div><div class="hp-stat"><div class="hp-stat-val">${Number(data.calories || 0)}</div><div class="hp-stat-label">消耗卡路里</div></div></div></div>
            <div class="hp-section"><div style="padding:12px 16px;font-size:12px;color:#888">昨晚睡眠</div><div class="hp-info">${hackerEscape(data.sleep_record || "暂无记录")}</div></div>
        `)}
        ${hpScreen("memo-screen", "备忘录", `<div class="hp-section">
            ${buildMemoItem(data.memo1_title, data.memo1_body)}
            ${buildMemoItem(data.memo2_title, data.memo2_body)}
            ${buildMemoItem("🔒 " + (data.memo3_title || `关于${userNickname}的秘密`), data.memo3_body, true)}
        </div>`)}
        ${hpScreen("photo-screen", "相册", `
            <div style="padding:8px 12px;font-size:12px;color:#888">点击照片查看描述</div>
            <div class="hp-photo-grid">${buildPhotos(data.photos)}</div>
            <div style="padding:14px 16px;font-size:13px;color:#FF3B30;font-weight:700">🔒 私密相册</div>
            <div class="hp-photo-grid">${buildPhotos(data.secret_photos, true)}</div>
        `)}
        ${hpScreen("call-screen", "通话记录", `<div class="hp-section">${buildCallRecords(data.call_records)}</div>`)}
        ${hpScreen("search-screen", "搜索历史", `<div class="hp-section">${(data.search_history || []).map(x => `<div class="hp-search-item">🔍 ${hackerEscape(x)}</div>`).join("")}</div>`)}
        ${hpScreen("music-screen", data.music_playlist || "音乐", `<div class="hp-section">${(data.music_songs || []).map(x => `<div class="hp-music-item">🎵 ${hackerEscape(x)}</div>`).join("")}</div>`)}
        ${hpScreen("schedule-screen", "今日行程", `<div class="hp-section"><div class="hp-info">${hackerEscape(data.schedule_today || "暂无")}</div></div>`)}
        ${hpScreen("shop-screen", "购物", `
            <div style="padding:8px 12px 4px;color:#888;font-size:12px">最近购买</div><div class="hp-section">${buildShop(data.shop_recent)}</div>
            <div style="padding:8px 12px 4px;color:#888;font-size:12px">购物车</div><div class="hp-section">${buildShop(data.shop_cart, true)}</div>
        `)}
    `
}

function hpApp(id, emoji, color, label) {
    return `<div class="hp-app" onclick="hpShow('${id}')"><div class="hp-ic" style="background:${color}">${emoji}</div><div class="hp-nm">${label}</div></div>`
}

function hpChatItem(id, icon, name, sub, green = false) {
    return `<div class="hp-chat-item" ${green ? `style="background:rgba(7,193,96,.06)"` : ""} onclick="hpShow('${id}')"><div class="hp-chat-av" ${green ? `style="background:#07c160"` : ""}>${icon}</div><div><div class="hp-chat-nm" ${green ? `style="color:#07c160"` : ""}>${hackerEscape(name)}</div><div class="hp-chat-last">${hackerEscape(sub)}</div></div></div>`
}

function buildGeneratedChatMsgs(msgs) {
    if (!Array.isArray(msgs) || !msgs.length) return `<div style="text-align:center;color:#555;font-size:13px;padding:40px 20px">暂无记录</div>`
    return msgs.map(m => {
        const content = hackerEscape(m.content || "")
        if (m.isMe) return `<div class="hp-msg-right"><div class="hp-bubble-right">${content}</div></div>`
        return `<div class="hp-msg-left"><div class="hp-sender">${hackerEscape(m.sender || "匿名")}</div><div class="hp-bubble-left">${content}</div></div>`
    }).join("")
}

function buildWalletRecords(records) {
    if (!Array.isArray(records) || !records.length) return `<div class="hp-info">暂无交易记录</div>`
    return records.map(r => {
        const amount = String(r.amount || "")
        const color = amount.startsWith("+") ? "#07C160" : "#FF3B30"
        return `<div class="hp-row"><div><div class="hp-desc">${hackerEscape(r.desc || "交易")}</div><div class="hp-sub">${hackerEscape(r.time || "")}</div></div><div class="hp-amount" style="color:${color}">${hackerEscape(amount)}</div></div>`
    }).join("")
}

function buildMemoItem(title, body, secret = false) {
    return `<div class="hp-memo" onclick="hpToggleMemo(this)" ${secret ? `style="border-left:3px solid #FF3B30"` : ""}><div class="hp-memo-title" ${secret ? `style="color:#FF3B30"` : ""}>${hackerEscape(title || "未命名")}</div><div class="hp-memo-preview">${hackerEscape(body || "")}</div><div class="hp-memo-full">${hackerEscape(body || "")}</div></div>`
}

function buildPhotos(list, secret = false) {
    if (!Array.isArray(list) || !list.length) return ""
    return list.map(p => `<div class="hp-photo" onclick="hpTogglePhoto(this)"><div class="hp-photo-dark" ${secret ? `style="background:#1a0000"` : ""}></div><div class="hp-photo-desc">${secret ? "🔒 " : ""}${hackerEscape(p.desc || "照片描述缺失")}</div></div>`).join("")
}

function buildCallRecords(list) {
    if (!Array.isArray(list) || !list.length) return `<div class="hp-info">暂无通话记录</div>`
    return list.map(r => {
        const type = String(r.type || "")
        const icon = type.includes("未接") ? "📵" : type.includes("拒绝") ? "🚫" : type.includes("拨出") ? "📞" : "✅"
        const color = type.includes("未接") ? "#FF3B30" : type.includes("拒绝") ? "#FF9500" : "#07C160"
        return `<div class="hp-call" onclick="hpToggleCall(this)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div class="hp-call-name">${icon} ${hackerEscape(r.name || "联系人")}</div><div class="hp-call-type" style="color:${color}">${hackerEscape(r.type || "通话")} · ${hackerEscape(r.duration || "")}</div></div><div style="color:#888;font-size:12px">▼</div></div><div class="hp-call-content">${hackerEscape(r.content || "")}</div></div>`
    }).join("")
}

function buildShop(list, isCart = false) {
    if (!Array.isArray(list) || !list.length) return `<div class="hp-info">${isCart ? "购物车是空的" : "暂无购买记录"}</div>`
    return list.map(r => {
        const note = r.note ? `<div class="hp-shop-note">${hackerEscape(r.note)}</div>` : `<div class="hp-shop-note">${hackerEscape(r.status || "")} ${hackerEscape(r.time || "")}</div>`
        return `<div class="hp-shop"><div class="hp-shop-name">${isCart ? "🛒 " : ""}${hackerEscape(r.name || "商品")}</div>${note}<div class="hp-shop-price" style="color:${isCart ? "#FF9500" : "#fff"}">${hackerEscape(r.price || "")}</div></div>`
    }).join("")
}

function hpShow(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = "block"
}
function hpHide(id) {
    const el = document.getElementById(id)
    if (el) el.style.display = "none"
}
function hpToggleMemo(el) {
    const full = el.querySelector(".hp-memo-full")
    const preview = el.querySelector(".hp-memo-preview")
    const show = !full.style.display || full.style.display === "none"
    full.style.display = show ? "block" : "none"
    preview.style.display = show ? "none" : "block"
}
function hpTogglePhoto(el) {
    const desc = el.querySelector(".hp-photo-desc")
    if (desc) desc.style.display = desc.style.display === "block" ? "none" : "block"
}
function hpToggleCall(el) {
    const content = el.querySelector(".hp-call-content")
    if (content) content.style.display = content.style.display === "block" ? "none" : "block"
}

async function saveHackerPhoneMemory() {
    if (!currentHackerTarget) return
    const data = hackerPhoneDataCache || currentHackerTarget.hackerPhoneCache?.data || {}
    const summary = `【入侵手机】用户成功解锁并查看了 ${currentHackerTarget.name || "目标"} 的手机。读取到：步数${data.steps || 0}，备忘录「${data.memo3_title || "隐秘想法"}」，搜索记录「${(data.search_history || []).slice(0, 2).join("、")}」。`
    const ok = await hackerSaveMemory(currentHackerTarget.id, summary, "shared_event")
    alert(ok ? "已写入长期记忆" : "写入失败")
}

async function hackerSaveMemory(contactId, text, category) {
    if (typeof saveMemoryEntry === "function") {
        return await saveMemoryEntry(contactId, text, category, "hacker")
    }
    return new Promise(resolve => {
        try {
            const item = {
                id: "mem_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                contactId,
                text,
                memoryText: text,
                category,
                source: "hacker",
                insertTime: Date.now(),
                createdAt: Date.now()
            }
            const tx = db.transaction("memories", "readwrite")
            tx.objectStore("memories").put(item)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (_) { resolve(false) }
    })
}
