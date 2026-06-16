/* ============================================================
   M叽 PWA 游戏中心
   - 猜数字：HTML小游戏 + 角色实时陪玩吐槽
   - 真心话大冒险：选区、生成题库、掷骰、抽卡、对话、总结
   - 总结写入 shared_event 记忆，也可写入私聊消息
============================================================ */

let gameContacts = []
let gameSelectedContactId = ""
let gameSelectedContact = null
let gameAiBubbleText = "💭 等待游戏开始…"
let gameGuessState = null
let tdState = null

const GAME_ZONES = {
    daily: { name: "日常区", icon: "☀️", desc: "轻松有趣\n随时可玩" },
    romance: { name: "情感区", icon: "🌙", desc: "暧昧深情\n二人世界" },
    daring: { name: "挑战区", icon: "🔥", desc: "大胆刺激\n勇气牌局" }
}

const GAME_FALLBACK_CARDS = [
    { type: "truth", text: "最近一次让你心里一软的瞬间是什么？" },
    { type: "dare", text: "用一句话描述你现在最想做的事。" },
    { type: "truth", text: "你有没有一个不太想承认的小习惯？" },
    { type: "dare", text: "认真夸对方一句，不能敷衍。" },
    { type: "truth", text: "你最怕对方误会你的哪一点？" },
    { type: "dare", text: "假装现在给对方发一条深夜消息。" },
    { type: "truth", text: "如果能重来一次，你想改掉哪次沉默？" },
    { type: "dare", text: "用三个词形容这场游戏里的对方。" },
    { type: "truth", text: "你最舍不得丢掉的一段记忆是什么？" },
    { type: "dare", text: "说一句平时不好意思说出口的话。" }
]

function ensureGameStyle() {
    if (document.getElementById("game-style")) return

    const style = document.createElement("style")
    style.id = "game-style"
    style.textContent = `
        .game-page{min-height:100%;background:#1a1a2e;color:#fff;padding:14px 14px 34px;font-family:-apple-system,"PingFang SC",sans-serif;}
        .game-top-card{background:#12122a;border-radius:18px;padding:14px;margin-bottom:14px;border:1px solid rgba(124,131,253,.18);box-shadow:0 12px 30px rgba(0,0,0,.18);}
        .game-label{font-size:12px;color:#888;margin-bottom:8px;}
        .game-select{width:100%;height:46px;border-radius:12px;background:#252540;color:#fff;border:1px solid #7c83fd;padding:0 12px;font-size:15px;outline:none;}
        .game-card{display:flex;align-items:center;gap:12px;background:#252540;border-radius:16px;padding:14px;margin-bottom:12px;border:1px solid rgba(124,131,253,.18);cursor:pointer;}
        .game-card:active{opacity:.75;transform:scale(.99)}
        .game-icon{width:50px;height:50px;border-radius:14px;background:#1a1a3e;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;}
        .game-card-name{font-size:16px;font-weight:800;color:#fff;}
        .game-card-desc{font-size:12px;color:#8c8ca8;margin-top:4px;line-height:1.45;}
        .game-play-wrap{min-height:100%;background:#1a1a2e;color:#fff;display:flex;flex-direction:column;}
        .game-ai-bar{display:flex;align-items:center;gap:10px;background:#12122a;padding:10px 14px;border-bottom:1px solid rgba(124,131,253,.12);}
        .game-ai-avatar{width:40px;height:40px;border-radius:50%;background:#333;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .game-ai-avatar img{width:100%;height:100%;object-fit:cover;}
        .game-ai-bubble{flex:1;background:#2a2a4a;border-radius:13px;padding:9px 12px;font-size:13px;line-height:1.55;color:#ddd;}
        .guess-body{flex:1;display:flex;flex-direction:column;align-items:center;padding:24px 20px;}
        .guess-title{font-size:22px;font-weight:800;margin-bottom:8px;color:#e0e0ff;}
        .guess-desc{font-size:13px;color:#888;margin-bottom:26px;}
        .guess-range{font-size:28px;font-weight:900;color:#7c83fd;margin-bottom:20px;text-align:center;}
        .guess-tries{font-size:13px;color:#777;margin-bottom:12px;}
        .guess-hint{font-size:18px;min-height:28px;margin-bottom:16px;color:#ffd700;font-weight:700;text-align:center;}
        .guess-row{display:flex;gap:10px;width:100%;max-width:330px;margin-bottom:18px;}
        .guess-input{flex:1;padding:14px;border-radius:12px;background:#252540;border:2px solid #3a3a6a;color:#fff;font-size:20px;text-align:center;outline:none;}
        .guess-input:focus{border-color:#7c83fd;}
        .guess-btn{padding:14px 22px;border-radius:12px;border:none;background:#7c83fd;color:#fff;font-size:16px;font-weight:800;cursor:pointer;}
        .guess-btn:disabled{background:#444;color:#999;}
        .guess-history{width:100%;max-width:330px;}
        .guess-history-item{display:flex;justify-content:space-between;padding:8px 12px;border-radius:9px;background:#252540;margin-bottom:7px;font-size:14px;}
        .tag-high{color:#ff6b6b}.tag-low{color:#6bffb8}.tag-win{color:#ffd700}
        .td-wrap{min-height:100%;background:#fdf7f2;color:#2a1810;font-family:-apple-system,"PingFang SC",serif;display:flex;flex-direction:column;}
        .td-top{background:linear-gradient(135deg,#e05070,#b83050);padding:16px 18px 14px;color:#fff;text-align:center;}
        .td-top h2{font-size:18px;letter-spacing:2px;margin:0;}.td-top p{font-size:11px;opacity:.78;margin-top:3px;}
        .td-section{padding:14px 16px;}
        .td-players{display:flex;align-items:center;justify-content:center;gap:24px;padding:18px 20px 6px;}
        .td-pav{width:54px;height:54px;border-radius:50%;background:#f5eae2;border:3px solid rgba(224,80,112,.25);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:22px;}
        .td-pav img{width:100%;height:100%;object-fit:cover;}.td-pname{font-size:12px;color:#7a5248;text-align:center;margin-top:6px;font-weight:700;}.td-vs{font-size:24px;color:#e05070;}
        .td-zone-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px;}.td-zone{padding:14px 8px;border-radius:14px;background:rgba(255,252,250,.9);border:2px solid transparent;box-shadow:0 2px 10px rgba(160,50,60,.1);text-align:center;cursor:pointer;}.td-zone.active{border-color:#e05070;background:rgba(224,80,112,.06)}.td-zone-icon{font-size:25px}.td-zone-name{font-size:13px;font-weight:800;margin-top:4px}.td-zone-desc{font-size:10px;color:#b89088;white-space:pre-line;margin-top:3px;}
        .td-btn{width:calc(100% - 32px);margin:12px 16px 0;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:800;cursor:pointer;}.td-btn:active{opacity:.8;}.td-btn-rose{background:linear-gradient(135deg,#e05070,#b83050);color:#fff;}.td-btn-outline{background:transparent;color:#e05070;border:2px solid #e05070;}.td-btn-gold{background:linear-gradient(135deg,#d4965a,#b87840);color:#fff;}.td-btn-ghost{background:rgba(224,80,112,.07);color:#7a5248;border:1px solid rgba(224,80,112,.2);}
        .td-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:380px;color:#7a5248;}.td-dots{display:flex;gap:6px}.td-dots span{width:8px;height:8px;border-radius:50%;background:#e05070;animation:tdBlink 1.2s infinite}.td-dots span:nth-child(2){animation-delay:.2s}.td-dots span:nth-child(3){animation-delay:.4s}@keyframes tdBlink{0%,80%,100%{opacity:.25;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        .td-round{text-align:center;font-size:13px;color:#7a5248;padding:12px 20px 0;}.td-dice-row{display:flex;justify-content:center;gap:42px;padding:24px 20px 8px;}.td-dice-box{text-align:center}.td-dlabel{font-size:11px;color:#7a5248;margin-bottom:8px;font-weight:700}.td-dice{width:74px;height:74px;border-radius:16px;background:linear-gradient(135deg,#fff8f5,#f0e0d8);border:2px solid rgba(224,80,112,.25);display:flex;align-items:center;justify-content:center;font-size:38px;box-shadow:0 6px 20px rgba(160,50,60,.12)}.td-dice.roll{animation:tdRoll .5s ease}@keyframes tdRoll{0%{transform:rotate(0)scale(1)}25%{transform:rotate(-15deg)scale(1.1)}50%{transform:rotate(15deg)scale(.95)}75%{transform:rotate(-8deg)scale(1.05)}100%{transform:rotate(0)scale(1)}}.td-dice-msg{text-align:center;font-size:15px;font-weight:800;color:#e05070;min-height:44px;padding:10px 20px;}
        .td-spread{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;padding:20px 16px;}.td-card-back{width:92px;height:128px;border-radius:13px;background:linear-gradient(135deg,#e05070,#a02848 55%,#6030a0);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:0 6px 20px rgba(160,50,60,.14);cursor:pointer;}.td-card-back:active{transform:translateY(-10px) scale(1.04)}.td-big-card{width:190px;min-height:235px;border-radius:18px;background:linear-gradient(160deg,#fff8f5,#f8eee8);border:2px solid rgba(224,80,112,.2);box-shadow:0 12px 36px rgba(160,50,60,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;margin:22px auto;gap:12px}.td-badge{padding:4px 12px;border-radius:999px;font-size:12px;font-weight:900;color:#fff;background:#e05070}.td-badge.dare{background:#3070b0}.td-card-text{text-align:center;font-size:15px;line-height:1.65;}
        .td-chat{display:flex;flex-direction:column;height:calc(100vh - 54px);}.td-chat-area{flex:1;overflow-y:auto;padding:12px 14px;}.td-msg{display:flex;gap:8px;margin-bottom:10px;align-items:flex-end}.td-msg.user{flex-direction:row-reverse}.td-chat-av{width:34px;height:34px;border-radius:50%;background:#f5eae2;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}.td-chat-av img{width:100%;height:100%;object-fit:cover}.td-bubble{max-width:72%;padding:10px 13px;border-radius:16px;font-size:14px;line-height:1.65;word-break:break-word}.td-msg.ai .td-bubble{background:rgba(255,252,250,.94);border:1px solid rgba(224,80,112,.1);border-bottom-left-radius:4px}.td-msg.user .td-bubble{background:linear-gradient(135deg,#e05070,#b83050);color:#fff;border-bottom-right-radius:4px}.td-input-bar{padding:10px 14px;background:rgba(253,247,242,.97);border-top:1px solid rgba(224,80,112,.1);display:flex;gap:8px;align-items:flex-end}.td-input{flex:1;padding:10px 13px;border-radius:14px;border:1.5px solid rgba(224,80,112,.2);background:#f5eae2;font-size:14px;resize:none;outline:none;line-height:1.5;}.td-send{width:40px;height:40px;border-radius:12px;border:none;background:linear-gradient(135deg,#e05070,#b83050);color:#fff;font-size:18px;}.td-action-bar{padding:10px 14px;background:rgba(253,247,242,.97);border-top:1px solid rgba(224,80,112,.1)}.td-action-row{display:flex;gap:10px}.td-action-row .td-btn{margin:0;flex:1}.td-summary{margin:16px;padding:18px;border-radius:16px;background:rgba(224,80,112,.05);border:1px solid rgba(224,80,112,.15);font-size:14px;line-height:1.9;color:#7a5248;white-space:pre-wrap;}
        .game-empty{padding:40px 20px;text-align:center;color:#888;line-height:1.8;}.game-toast{position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#111;color:#fff;border-radius:999px;padding:9px 18px;font-size:13px;z-index:9999;opacity:0;pointer-events:none;transition:opacity .2s}.game-toast.show{opacity:1;}
    `
    document.head.appendChild(style)
}

async function showGameCenter() {
    ensureGameStyle()
    currentPage = "gameCenter"

    const root = document.getElementById("gameRoot")
    if (!root) return

    gameContacts = (await getAllStoreData("contacts"))
        .filter(c => c && c.id && String(c.id).trim())
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (!gameSelectedContactId && gameContacts[0]) gameSelectedContactId = gameContacts[0].id
    gameSelectedContact = gameContacts.find(c => c.id === gameSelectedContactId) || gameContacts[0] || null

    if (!gameContacts.length) {
        root.innerHTML = `<div class="game-page"><div class="game-empty">还没有角色。<br>先去 Chat → 联系人 添加角色，再回来一起玩。</div></div>`
        return
    }

    root.innerHTML = `
        <div class="game-page">
            <div class="game-top-card">
                <div class="game-label">选择一起玩的角色</div>
                <select class="game-select" onchange="selectGameContact(this.value)">
                    ${gameContacts.map(c => `<option value="${escapeHtml(c.id)}" ${c.id === gameSelectedContactId ? "selected" : ""}>${escapeHtml(c.name || "未知")}</option>`).join("")}
                </select>
            </div>

            <div class="game-label">选择游戏</div>

            <div class="game-card" onclick="openGuessNumberGame()">
                <div class="game-icon">🎯</div>
                <div style="flex:1">
                    <div class="game-card-name">猜数字</div>
                    <div class="game-card-desc">1-100 数字挑战，角色会实时吐槽、鼓励或挑衅你。</div>
                </div>
                <div style="color:#7c83fd;font-size:18px">▶</div>
            </div>

            <div class="game-card" onclick="openTruthDareGame()">
                <div class="game-icon">🃏</div>
                <div style="flex:1">
                    <div class="game-card-name">真心话大冒险</div>
                    <div class="game-card-desc">选牌局氛围，AI生成题库，掷骰、抽卡、聊天和总结。</div>
                </div>
                <div style="color:#7c83fd;font-size:18px">▶</div>
            </div>
        </div>
    `
}

function selectGameContact(id) {
    gameSelectedContactId = id
    gameSelectedContact = gameContacts.find(c => c.id === id) || gameContacts[0] || null
}

function getGameContact() {
    if (!gameSelectedContact) {
        gameSelectedContact = gameContacts.find(c => c.id === gameSelectedContactId) || gameContacts[0] || null
    }
    return gameSelectedContact
}

function getGameAiAvatarHtml(contact = getGameContact()) {
    return avatarHtml(contact?.avatar, "🤖")
}

function getGameUserName() {
    return localStorage.getItem("MJI_MY_NAME") || "你"
}

function setGameTitle(text) {
    const title = document.getElementById("appTitle")
    if (title) title.innerText = text
}

function gameToast(text) {
    let el = document.getElementById("gameToast")
    if (!el) {
        el = document.createElement("div")
        el.id = "gameToast"
        el.className = "game-toast"
        document.body.appendChild(el)
    }
    el.textContent = text
    el.classList.add("show")
    clearTimeout(el._timer)
    el._timer = setTimeout(() => el.classList.remove("show"), 2200)
}

async function callGameAI(prompt, maxTokens = 180, temperature = 0.75) {
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const model = localStorage.getItem("MJI_API_MODEL") || ""
    const apiUrl = getChatApiUrl()

    if (!apiKey || !model || !apiUrl || apiUrl === "/chat/completions") {
        throw new Error("API未配置")
    }

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
            model,
            temperature,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }]
        })
    })

    if (!response.ok) throw new Error("HTTP " + response.status)
    const data = await response.json()
    return (data.choices?.[0]?.message?.content || "").trim()
}

function buildGameRolePrompt(task, contact = getGameContact()) {
    const name = contact?.name || "TA"
    const persona = contact?.identity || contact?.prompt || ""
    return `你是「${name}」。\n${persona ? `【角色人设】\n${persona}\n` : ""}\n你正在和${getGameUserName()}一起玩游戏。\n必须用简体中文，像真人陪玩一样自然，不能说自己是AI，不能出戏。\n\n${task}`
}

async function commentGameEvent(eventType, eventData = {}) {
    const contact = getGameContact()
    if (!contact) return

    const eventDesc = {
        start: "游戏刚开始了，说一句开场话激励或挑衅对方。",
        struggling: `对方已经猜了 ${eventData.tries || 5} 次还没猜中，适当吐槽或鼓励。`,
        almost: `答案范围只剩 ${eventData.remaining || "很少"} 个数字，催促对方冲刺。`,
        win: `对方猜对了，一共猜了 ${eventData.tries || "几"} 次，给出结束评价。`
    }[eventType] || `游戏发生事件：${eventType}，简单回应。`

    try {
        const reply = await callGameAI(buildGameRolePrompt(`${eventDesc}\n只输出一句10-25字的评论。`), 90, 0.8)
        if (reply) {
            gameAiBubbleText = "💬 " + reply
            renderGuessNumberGame()
        }
    } catch (e) {
        const fallback = {
            start: "💬 我看着呢，别第一轮就露怯。",
            struggling: "💬 猜了这么久？再冷静一点。",
            almost: "💬 快贴到答案了，别手抖。",
            win: "💬 行，这次算你赢得漂亮。"
        }[eventType]
        if (fallback) {
            gameAiBubbleText = fallback
            renderGuessNumberGame()
        }
    }
}

function openGuessNumberGame() {
    const contact = getGameContact()
    if (!contact) {
        gameToast("请先添加角色")
        return
    }

    currentPage = "guessNumberGame"
    setGameTitle("猜数字")
    gameAiBubbleText = "💭 等待游戏开始…"
    gameGuessState = {
        secret: Math.floor(Math.random() * 100) + 1,
        tries: 0,
        lo: 1,
        hi: 100,
        gameOver: false,
        hint: "",
        history: []
    }
    renderGuessNumberGame()
    commentGameEvent("start", { game: "guess_number", range: "1-100" })
}

function renderGuessNumberGame() {
    const root = document.getElementById("gameRoot")
    const contact = getGameContact()
    if (!root || !gameGuessState) return

    const g = gameGuessState
    root.innerHTML = `
        <div class="game-play-wrap">
            <div class="game-ai-bar">
                <div class="game-ai-avatar">${getGameAiAvatarHtml(contact)}</div>
                <div class="game-ai-bubble">${escapeHtml(gameAiBubbleText)}</div>
            </div>
            <div class="guess-body">
                <div class="guess-title">🎯 猜数字</div>
                <div class="guess-desc">我心里有一个 1-100 的数字</div>
                <div class="guess-range">范围：${g.lo} ~ ${g.hi}</div>
                <div class="guess-tries">已猜 ${g.tries} 次</div>
                <div class="guess-hint">${escapeHtml(g.hint || "")}</div>
                <div class="guess-row">
                    <input class="guess-input" id="guessInput" type="number" min="1" max="100" placeholder="输入数字" ${g.gameOver ? "disabled" : ""} onkeydown="if(event.key==='Enter') doGuessNumber()">
                    <button class="guess-btn" onclick="doGuessNumber()" ${g.gameOver ? "disabled" : ""}>猜！</button>
                </div>
                ${g.gameOver ? `<button class="guess-btn" onclick="openGuessNumberGame()" style="margin-bottom:16px">再来一局</button>` : ""}
                <div class="guess-history">
                    ${g.history.map(item => `
                        <div class="guess-history-item">
                            <span>猜了 <b>${item.val}</b></span>
                            <span class="${item.cls}">${item.text}</span>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `
    setTimeout(() => document.getElementById("guessInput")?.focus(), 60)
}

async function doGuessNumber() {
    const g = gameGuessState
    if (!g || g.gameOver) return

    const input = document.getElementById("guessInput")
    const val = parseInt(input?.value || "")
    if (Number.isNaN(val) || val < 1 || val > 100) {
        g.hint = "请输入 1-100 的数字"
        renderGuessNumberGame()
        return
    }

    g.tries++

    if (val === g.secret) {
        g.gameOver = true
        g.hint = `🎉 答对了！答案就是 ${g.secret}`
        g.history.unshift({ val, cls: "tag-win", text: "✓ 正确！" })
        renderGuessNumberGame()
        commentGameEvent("win", { guess: val, tries: g.tries, secret: g.secret })
        await saveGameMemory(`【猜数字】${getGameUserName()}猜中了数字 ${g.secret}，共猜了 ${g.tries} 次。`)
        return
    }

    if (val < g.secret) {
        g.lo = Math.max(g.lo, val + 1)
        g.hint = "📈 猜小了，再大一点"
        g.history.unshift({ val, cls: "tag-low", text: "↑ 小了" })
    } else {
        g.hi = Math.min(g.hi, val - 1)
        g.hint = "📉 猜大了，再小一点"
        g.history.unshift({ val, cls: "tag-high", text: "↓ 大了" })
    }

    const remaining = g.hi - g.lo + 1
    renderGuessNumberGame()

    if (g.tries === 5) {
        commentGameEvent("struggling", { guess: val, tries: g.tries, remaining })
    } else if (remaining <= 10 && remaining > 1) {
        commentGameEvent("almost", { guess: val, tries: g.tries, remaining })
    }
}

async function saveGameMemory(memoryText) {
    const contact = getGameContact()
    if (!contact || !memoryText) return
    if (typeof saveMemoryEntry === "function") {
        await saveMemoryEntry(contact.id, memoryText, "shared_event", "auto")
        return
    }
    try {
        const now = Date.now()
        const tx = db.transaction("memories", "readwrite")
        tx.objectStore("memories").put({
            id: "mem_game_" + contact.id + "_" + now,
            contactId: contact.id,
            aiId: contact.id,
            memoryText,
            content: memoryText,
            category: "shared_event",
            source: "auto",
            insertTime: now,
            updatedAt: now,
            embedding: ""
        })
    } catch (e) {}
}

function saveGameChatSummary(text) {
    const contact = getGameContact()
    if (!contact || !text || typeof saveMessage !== "function") return
    const content = "【游戏中心】" + text
    saveMessage(contact.id, "assistant", content, Date.now(), { source: "game_summary" })
}

function openTruthDareGame() {
    const contact = getGameContact()
    if (!contact) {
        gameToast("请先添加角色")
        return
    }
    currentPage = "truthDareZone"
    setGameTitle("真心话大冒险")
    tdState = {
        zone: "daily",
        cards: [],
        round: 0,
        totalRounds: 10,
        loserIsUser: false,
        currentCard: null,
        gameLog: [],
        stage: "zone",
        chatMessages: [],
        summary: ""
    }
    renderTruthDare()
}

function renderTruthDare() {
    const root = document.getElementById("gameRoot")
    if (!root || !tdState) return

    const s = tdState
    if (s.stage === "zone") return renderTruthDareZone(root)
    if (s.stage === "loading") return renderTruthDareLoading(root)
    if (s.stage === "dice") return renderTruthDareDice(root)
    if (s.stage === "card") return renderTruthDareCard(root)
    if (s.stage === "chat") return renderTruthDareChat(root)
    if (s.stage === "end") return renderTruthDareEnd(root)
}

function tdPlayerHtml() {
    const contact = getGameContact()
    return `
        <div class="td-players">
            <div>
                <div class="td-pav">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "🙂")}</div>
                <div class="td-pname">${escapeHtml(getGameUserName())}</div>
            </div>
            <div class="td-vs">♥</div>
            <div>
                <div class="td-pav">${getGameAiAvatarHtml(contact)}</div>
                <div class="td-pname">${escapeHtml(contact?.name || "TA")}</div>
            </div>
        </div>
    `
}

function renderTruthDareZone(root) {
    currentPage = "truthDareZone"
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top"><h2>真心话大冒险</h2><p>恋人牌局 · 每局不同</p></div>
            ${tdPlayerHtml()}
            <div class="td-section">
                <div style="font-size:11px;letter-spacing:2px;color:#b89088;margin-bottom:8px">选择今晚的牌局氛围</div>
                <div class="td-zone-grid">
                    ${Object.entries(GAME_ZONES).map(([key, z]) => `
                        <div class="td-zone ${tdState.zone === key ? "active" : ""}" onclick="selectTruthDareZone('${key}')">
                            <div class="td-zone-icon">${z.icon}</div>
                            <div class="td-zone-name">${z.name}</div>
                            <div class="td-zone-desc">${z.desc}</div>
                        </div>
                    `).join("")}
                </div>
            </div>
            <button class="td-btn td-btn-rose" onclick="generateTruthDareCards()">生成今日题库 ✨</button>
        </div>
    `
}

function selectTruthDareZone(zone) {
    tdState.zone = zone
    renderTruthDare()
}

function renderTruthDareLoading(root) {
    currentPage = "truthDareLoading"
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top"><h2>准备牌局</h2><p>正在生成专属题目…</p></div>
            <div class="td-loading">
                <div style="font-size:52px">🃏</div>
                <div class="td-dots"><span></span><span></span><span></span></div>
                <div>AI 正在洗牌中…</div>
            </div>
        </div>
    `
}

async function generateTruthDareCards() {
    tdState.stage = "loading"
    renderTruthDare()

    const zoneInfo = GAME_ZONES[tdState.zone]
    const prompt = buildGameRolePrompt(`
你正在为一场真心话大冒险设计题目。
区域：${zoneInfo.name}（${zoneInfo.desc.replace("\n", "，")}）
请生成10道题，5道真心话 truth，5道大冒险 dare。
题目要符合当前氛围，要有创意，不要陈词滥调。
只输出合法JSON数组，不要解释，不要markdown：
[{"type":"truth","text":"题目内容"},{"type":"dare","text":"题目内容"}]
`) 

    try {
        const text = await callGameAI(prompt, 1100, 0.9)
        const clean = text.replace(/```json|```/g, "").trim()
        let arr = null
        try {
            arr = JSON.parse(clean)
        } catch (e) {
            const m = clean.match(/\[[\s\S]*\]/)
            if (m) arr = JSON.parse(m[0].replace(/,\s*([}\]])/g, "$1"))
        }
        if (!Array.isArray(arr) || arr.length < 5) throw new Error("题库不足")
        tdState.cards = arr.slice(0, 10).map(c => ({
            type: c.type === "dare" ? "dare" : "truth",
            text: String(c.text || "说一个秘密。")
        }))
    } catch (e) {
        tdState.cards = GAME_FALLBACK_CARDS.slice()
        gameToast("题库生成失败，已使用备用题库")
    }

    tdState.round = 0
    tdState.gameLog = []
    tdState.stage = "dice"
    renderTruthDare()
}

function renderTruthDareDice(root) {
    currentPage = "truthDareDice"
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top"><h2>掷骰决定命运</h2><p>点数低的接受挑战</p></div>
            ${tdPlayerHtml()}
            <div class="td-round">第 ${tdState.round + 1} 轮 / 共 ${tdState.totalRounds} 轮</div>
            <div class="td-dice-row">
                <div class="td-dice-box"><div class="td-dlabel">${escapeHtml(getGameUserName())}</div><div class="td-dice" id="tdDiceUser">🎲</div></div>
                <div class="td-dice-box"><div class="td-dlabel">${escapeHtml(getGameContact()?.name || "TA")}</div><div class="td-dice" id="tdDiceAi">🎲</div></div>
            </div>
            <div class="td-dice-msg" id="tdDiceMsg">点击下方按钮掷骰</div>
            <button class="td-btn td-btn-rose" id="tdRollBtn" onclick="truthDareRollDice()">🎲 掷骰子</button>
            <button class="td-btn td-btn-outline" id="tdEnterCardBtn" style="display:none" onclick="truthDareEnterCard()">翻牌接受挑战 →</button>
        </div>
    `
}

const TD_DICE_FACE = ["", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"]

function truthDareRollDice() {
    const du = document.getElementById("tdDiceUser")
    const da = document.getElementById("tdDiceAi")
    const btn = document.getElementById("tdRollBtn")
    const next = document.getElementById("tdEnterCardBtn")
    const msg = document.getElementById("tdDiceMsg")
    if (!du || !da) return
    btn.disabled = true
    next.style.display = "none"
    du.classList.add("roll")
    da.classList.add("roll")
    msg.textContent = "骰子在飞…"

    setTimeout(() => {
        let u = 1, a = 1
        do {
            u = Math.floor(Math.random() * 6) + 1
            a = Math.floor(Math.random() * 6) + 1
        } while (u === a)
        du.classList.remove("roll")
        da.classList.remove("roll")
        du.textContent = TD_DICE_FACE[u]
        da.textContent = TD_DICE_FACE[a]
        tdState.loserIsUser = u < a
        const loser = tdState.loserIsUser ? getGameUserName() : (getGameContact()?.name || "TA")
        msg.textContent = `${u} : ${a} — ${loser}点数低，接受挑战！`
        btn.disabled = false
        next.style.display = "block"
    }, 850)
}

function truthDareEnterCard() {
    tdState.currentCard = tdState.cards[tdState.round % tdState.cards.length]
    tdState.stage = "card"
    renderTruthDare()
}

function renderTruthDareCard(root) {
    currentPage = "truthDareCard"
    const contact = getGameContact()
    const loserName = tdState.loserIsUser ? getGameUserName() : (contact?.name || "TA")
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top"><h2>${tdState.loserIsUser ? "你来抽一张" : `帮 ${escapeHtml(contact?.name || "TA")} 翻一张`}</h2><p>从牌堆中选一张翻开</p></div>
            <div class="td-section" style="text-align:center;color:#7a5248;font-size:13px">${escapeHtml(loserName)} 将接受这道题的挑战</div>
            <div id="tdCardSpread" class="td-spread">
                ${Array.from({ length: 5 }).map(() => `<div class="td-card-back" onclick="truthDareRevealCard()"><div style="font-size:30px">💌</div><div style="font-size:10px;letter-spacing:2px;margin-top:6px">翻开我</div></div>`).join("")}
            </div>
            <div id="tdCardReveal" style="display:none;flex-direction:column;align-items:center;width:100%">
                <div class="td-big-card">
                    <div id="tdCardBadge" class="td-badge">真心话</div>
                    <div id="tdCardText" class="td-card-text"></div>
                </div>
            </div>
            <button class="td-btn td-btn-rose" id="tdEnterChatBtn" style="display:none" onclick="truthDareEnterChat()">开始挑战 💬</button>
        </div>
    `
}

function truthDareRevealCard() {
    const c = tdState.currentCard
    document.getElementById("tdCardSpread").style.display = "none"
    const rv = document.getElementById("tdCardReveal")
    rv.style.display = "flex"
    const badge = document.getElementById("tdCardBadge")
    badge.textContent = c.type === "truth" ? "💗 真心话" : "✨ 大冒险"
    badge.className = "td-badge " + (c.type === "dare" ? "dare" : "")
    document.getElementById("tdCardText").textContent = c.text
    document.getElementById("tdEnterChatBtn").style.display = "block"
}

function truthDareEnterChat() {
    tdState.stage = "chat"
    tdState.chatMessages = []
    renderTruthDare()
    if (tdState.loserIsUser) {
        truthDareAiAnnounceCard()
    } else {
        truthDareAiAnswerCard()
    }
}

function renderTruthDareChat(root) {
    currentPage = "truthDareChat"
    const c = tdState.currentCard
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top" style="padding:12px 18px 10px"><h2>第 ${tdState.round + 1} 轮</h2><p>${c.type === "truth" ? "💗 真心话" : "✨ 大冒险"}：${escapeHtml(c.text.length > 26 ? c.text.slice(0, 26) + "…" : c.text)}</p></div>
            <div class="td-chat">
                <div class="td-chat-area" id="tdChatArea"></div>
                <div id="tdActionBar"></div>
            </div>
        </div>
    `
    renderTruthDareMessages()
}

function renderTruthDareMessages() {
    const area = document.getElementById("tdChatArea")
    if (!area) return
    area.innerHTML = tdState.chatMessages.map(m => {
        if (m.role === "typing") {
            return `<div class="td-msg ai" id="tdTyping"><div class="td-chat-av">${getGameAiAvatarHtml()}</div><div class="td-bubble"><div class="td-dots"><span></span><span></span><span></span></div></div></div>`
        }
        if (m.role === "user") {
            return `<div class="td-msg user"><div class="td-chat-av">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "🙂")}</div><div class="td-bubble">${escapeHtml(m.text)}</div></div>`
        }
        return `<div class="td-msg ai"><div class="td-chat-av">${getGameAiAvatarHtml()}</div><div class="td-bubble">${escapeHtml(m.text)}</div></div>`
    }).join("")
    area.scrollTop = area.scrollHeight
}

function setTruthDareAction(kind) {
    const bar = document.getElementById("tdActionBar")
    if (!bar) return
    if (kind === "input") {
        bar.innerHTML = `
            <div class="td-input-bar">
                <textarea class="td-input" id="tdUserInput" rows="1" placeholder="写下你的回答…"></textarea>
                <button class="td-send" onclick="truthDareSendUserMsg()">➤</button>
            </div>
        `
        setTimeout(() => document.getElementById("tdUserInput")?.focus(), 60)
        return
    }
    if (kind === "after") {
        bar.innerHTML = `
            <div class="td-action-bar"><div class="td-action-row">
                <button class="td-btn td-btn-ghost" onclick="setTruthDareAction('input')">💬 继续聊</button>
                <button class="td-btn td-btn-rose" onclick="truthDareNextRound()">下一轮 →</button>
            </div></div>
        `
        return
    }
    if (kind === "next") {
        bar.innerHTML = `<div class="td-action-bar"><button class="td-btn td-btn-rose" style="width:100%;margin:0" onclick="truthDareNextRound()">继续游戏 →</button></div>`
        return
    }
    bar.innerHTML = ""
}

function truthDareAddTyping() {
    tdState.chatMessages.push({ role: "typing" })
    renderTruthDareMessages()
}

function truthDareRemoveTyping() {
    tdState.chatMessages = tdState.chatMessages.filter(m => m.role !== "typing")
    renderTruthDareMessages()
}

async function truthDareAiAnnounceCard() {
    setTruthDareAction("")
    truthDareAddTyping()
    const c = tdState.currentCard
    const typeW = c.type === "truth" ? "真心话" : "大冒险"
    try {
        const text = await callGameAI(buildGameRolePrompt(`这一轮${getGameUserName()}输了，需要回答一道${typeW}。题目是：「${c.text}」\n请用你的口吻宣读这道题，1-2句话，带一点期待或调侃。只输出台词。`), 180, 0.75)
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: text || `好，你的${typeW}是：「${c.text}」` })
    } catch (e) {
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: `好，你的${typeW}是：「${c.text}」` })
    }
    renderTruthDareMessages()
    setTruthDareAction("input")
}

async function truthDareAiAnswerCard() {
    setTruthDareAction("")
    truthDareAddTyping()
    const c = tdState.currentCard
    const typeW = c.type === "truth" ? "真心话" : "大冒险"
    try {
        const text = await callGameAI(buildGameRolePrompt(`这一轮你输了，需要完成这道${typeW}：「${c.text}」\n请以你的口吻认真回答，3-6句话。真心话要真实有个性；大冒险要描述你的行动和感受。只输出回答。`), 380, 0.8)
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: text || "（TA想了很久，一时说不出来。）" })
        tdState.gameLog.push({ round: tdState.round, loserIsUser: false, card: c, userAnswer: "", aiReply: text || "" })
    } catch (e) {
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: "（TA想了很久，一时说不出来。）" })
        tdState.gameLog.push({ round: tdState.round, loserIsUser: false, card: c, userAnswer: "", aiReply: "" })
    }
    renderTruthDareMessages()
    setTruthDareAction("next")
}

async function truthDareSendUserMsg() {
    const input = document.getElementById("tdUserInput")
    const text = String(input?.value || "").trim()
    if (!text) return
    input.value = ""
    tdState.chatMessages.push({ role: "user", text })
    renderTruthDareMessages()
    setTruthDareAction("")

    let log = tdState.gameLog.find(l => l.round === tdState.round)
    const firstAnswer = tdState.loserIsUser && !log
    if (!log) {
        log = { round: tdState.round, loserIsUser: tdState.loserIsUser, card: tdState.currentCard, userAnswer: text, aiReply: "", extra: [] }
        tdState.gameLog.push(log)
    } else {
        log.extra = log.extra || []
        log.extra.push(getGameUserName() + "：" + text)
    }

    truthDareAddTyping()
    const c = tdState.currentCard
    const prompt = firstAnswer
        ? buildGameRolePrompt(`题目是：「${c.text}」。${getGameUserName()}的回答是：「${text}」。请以你的口吻回应2-4句话，可以感动、调侃、追问或分享感受。只输出回复。`)
        : buildGameRolePrompt(`你们正在真心话大冒险里继续聊天。本轮题目是：「${c.text}」。${getGameUserName()}说：「${text}」。请自然回应2-3句话。只输出回复。`)

    try {
        const reply = await callGameAI(prompt, 320, 0.82)
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: reply || "……" })
        log.aiReply = (log.aiReply || "") + (reply || "") + " "
    } catch (e) {
        truthDareRemoveTyping()
        tdState.chatMessages.push({ role: "ai", text: "……" })
    }
    renderTruthDareMessages()
    setTruthDareAction("after")
}

function truthDareNextRound() {
    tdState.round++
    if (tdState.round >= tdState.totalRounds) {
        truthDareEndGame()
        return
    }
    tdState.currentCard = null
    tdState.chatMessages = []
    tdState.stage = "dice"
    renderTruthDare()
}

async function truthDareEndGame() {
    tdState.stage = "end"
    tdState.summary = ""
    renderTruthDare()

    const contact = getGameContact()
    const zoneName = GAME_ZONES[tdState.zone]?.name || "日常区"
    const logText = tdState.gameLog.map((l, idx) => {
        const tw = l.card?.type === "dare" ? "大冒险" : "真心话"
        const loser = l.loserIsUser ? getGameUserName() : (contact?.name || "TA")
        let line = `第${idx + 1}轮：${loser}抽到${tw}「${l.card?.text || ""}」`
        if (l.userAnswer) line += `，${getGameUserName()}说：「${String(l.userAnswer).slice(0, 40)}」`
        if (l.aiReply) line += `，${contact?.name || "TA"}回应：「${String(l.aiReply).slice(0, 40)}」`
        return line
    }).join("；\n")

    try {
        const summary = await callGameAI(buildGameRolePrompt(`你和${getGameUserName()}刚刚完成了一场${zoneName}的真心话大冒险。\n游戏摘要：\n${logText || "暂无记录"}\n\n请以你的口吻写一段4-6句话的游戏总结，可以提到印象深刻的瞬间、感受，或对${getGameUserName()}说的话。只输出总结。`, contact), 550, 0.78)
        tdState.summary = summary || "今晚玩得很开心，谢谢你的真心与勇气。"
    } catch (e) {
        tdState.summary = "今晚玩得很开心，谢谢你的真心与勇气。"
    }
    renderTruthDare()
}

function renderTruthDareEnd(root) {
    currentPage = "truthDareEnd"
    root.innerHTML = `
        <div class="td-wrap">
            <div class="td-top"><h2>牌局结束</h2><p>感谢今晚的真心与冒险</p></div>
            ${tdPlayerHtml()}
            <div style="padding:14px 20px 4px;font-size:11px;letter-spacing:2px;color:#b89088">今晚的故事</div>
            <div class="td-summary">
                ${tdState.summary ? escapeHtml(tdState.summary) : `<div class="td-loading" style="min-height:120px"><div class="td-dots"><span></span><span></span><span></span></div><div>正在整理今晚的故事…</div></div>`}
            </div>
            <button class="td-btn td-btn-rose" onclick="openTruthDareGame()">再来一局 🎴</button>
            <button class="td-btn td-btn-outline" onclick="truthDareNotifyAndExit()" ${tdState.summary ? "" : "disabled"}>结束并告知TA ✉️</button>
        </div>
    `
}

async function truthDareNotifyAndExit() {
    const contact = getGameContact()
    const zoneName = GAME_ZONES[tdState.zone]?.name || "日常区"
    const summary = tdState.summary || "今晚完成了一场真心话大冒险。"
    const text = `【真心话大冒险·${zoneName}】${summary}`
    await saveGameMemory(text)
    saveGameChatSummary(text)
    gameToast("已写入记忆，并告知 " + (contact?.name || "TA"))
    setTimeout(() => showGameCenter(), 700)
}
