/* ============================================================
   M叽 PWA 匿名信箱
   - 角色信箱：匿名用户问角色，AI 自动回答
   - 我的信箱：角色匿名问用户，用户回答后其他角色反应
   - 长按删除信件
   - 信件/回答写入 shared_event 记忆
============================================================ */

let mailboxContacts = []
let mailboxCharLetters = []
let mailboxUserLetters = []
let mailboxCurrentChar = ""
let mailboxCurrentTab = "char"
let mailboxGeneratingSet = new Set()

const MAILBOX_VERSION = "pwa_v1"

function mailboxEscape(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
}

function mailboxNowText() {
    const d = new Date()
    return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function mailboxSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function mailboxRand(list) {
    return list[Math.floor(Math.random() * list.length)]
}

function mailboxApiUrl() {
    if (typeof getChatApiUrl === "function") return getChatApiUrl()

    let base = localStorage.getItem("MJI_API_BASE") || ""
    base = base.replace(/\/+$/, "")
    if (!base) return ""
    if (base.endsWith("/chat/completions")) return base
    return base.includes("/v1") ? base + "/chat/completions" : base + "/v1/chat/completions"
}

function mailboxContactPersona(c) {
    return [
        c.identity,
        c.personality,
        c.profile,
        c.prompt
    ].filter(Boolean).join("\n").slice(0, 900)
}

function ensureMailboxStyle() {
    if (document.getElementById("mailboxStyle")) return

    const style = document.createElement("style")
    style.id = "mailboxStyle"
    style.textContent = `
.mailbox-page{min-height:100%;background:#f9f1e4;color:#3d4a38;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",serif;position:relative;padding-bottom:92px;}
.mailbox-page:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 80% 55% at 5% 15%,rgba(213,211,160,.38),transparent 60%),radial-gradient(ellipse 55% 75% at 95% 85%,rgba(162,184,145,.30),transparent 55%);}
.mailbox-top{position:sticky;top:0;z-index:20;height:54px;background:rgba(251,236,207,.92);backdrop-filter:blur(14px);border-bottom:1px solid rgba(123,152,108,.22);display:flex;align-items:center;justify-content:space-between;padding:0 14px;}
.mailbox-title{font-size:19px;color:#7b986c;letter-spacing:3px;font-weight:800;}
.mailbox-top-btn{width:34px;height:34px;border:none;background:transparent;color:#7b986c;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.mailbox-top-btn.spin{animation:mailboxSpin .5s linear;}@keyframes mailboxSpin{to{transform:rotate(360deg)}}
.mailbox-tabs{position:sticky;top:54px;z-index:19;display:flex;background:rgba(249,241,228,.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(123,152,108,.22);}
.mailbox-tab{flex:1;padding:11px 0;border:none;background:transparent;color:#5a6e54;font-size:14px;position:relative;cursor:pointer;}
.mailbox-tab.active{color:#7b986c;font-weight:700;}.mailbox-tab.active:after{content:"";position:absolute;left:22%;right:22%;bottom:0;height:2px;background:#7b986c;border-radius:2px;}
.mailbox-charbar{position:sticky;top:98px;z-index:18;padding:9px 14px;display:flex;gap:9px;overflow-x:auto;background:rgba(249,241,228,.92);border-bottom:1px solid rgba(123,152,108,.22);scrollbar-width:none;}.mailbox-charbar::-webkit-scrollbar{display:none;}
.mailbox-chip{flex-shrink:0;padding:6px 13px;border-radius:18px;border:1.5px solid rgba(123,152,108,.25);background:#f9f1e4;color:#5a6e54;font-size:13px;cursor:pointer;white-space:nowrap;}.mailbox-chip.active{background:#7b986c;color:#fff;border-color:#7b986c;}
.mailbox-list{position:relative;z-index:1;padding:14px;display:flex;flex-direction:column;gap:13px;}
.mailbox-card{background:rgba(251,236,207,.78);border:1px solid rgba(123,152,108,.18);border-radius:14px;padding:15px;box-shadow:0 2px 14px rgba(61,74,56,.10);position:relative;animation:mailboxUp .25s ease both;user-select:none;-webkit-user-select:none;}
@keyframes mailboxUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.mailbox-card-head{display:flex;align-items:center;gap:9px;margin-bottom:10px;}.mailbox-head-main{flex:1;min-width:0;}.mailbox-name{font-size:13px;font-weight:700;color:#7b986c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.mailbox-time{font-size:11px;color:#a2b891;margin-top:1px;}
.mailbox-anon-av,.mailbox-av{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#fff;background:#a2b891;font-size:15px;}.mailbox-anon-av{background:#d5d3a0;font-size:16px;color:#3d4a38;}.mailbox-av .avatar-img{width:100%;height:100%;object-fit:cover;}
.mailbox-badge{font-size:10px;padding:3px 7px;border-radius:10px;background:rgba(162,184,145,.22);color:#5a6e54;border:1px solid rgba(162,184,145,.38);white-space:nowrap;}
.mailbox-question{font-size:14px;line-height:1.72;color:#3d4a38;padding:9px 11px;background:rgba(249,241,228,.66);border-left:3px solid #d5d3a0;border-radius:0 8px 8px 0;margin-bottom:10px;white-space:pre-wrap;word-break:break-word;}
.mailbox-answer-label{font-size:11px;color:#a2b891;margin-bottom:5px;display:flex;align-items:center;gap:4px;}.mailbox-answer-label:before{content:"✦";font-size:8px;color:#7b986c;}
.mailbox-answer{font-size:14px;line-height:1.75;color:#3d4a38;padding:10px 12px;background:rgba(123,152,108,.09);border-radius:8px;border:1px solid rgba(123,152,108,.18);white-space:pre-wrap;word-break:break-word;}
.mailbox-pending{font-size:13px;color:#a2b891;font-style:italic;display:flex;align-items:center;gap:6px;padding:4px 0;}.mailbox-dots{display:inline-flex;gap:3px}.mailbox-dots span{width:5px;height:5px;border-radius:50%;background:#a2b891;animation:mailboxBlink 1.2s infinite}.mailbox-dots span:nth-child(2){animation-delay:.2s}.mailbox-dots span:nth-child(3){animation-delay:.4s}@keyframes mailboxBlink{0%,80%,100%{opacity:.2}40%{opacity:1}}
.mailbox-reactions{margin-top:10px;padding-top:9px;border-top:1px solid rgba(162,184,145,.22);}.mailbox-reaction-row{display:flex;gap:8px;align-items:flex-start;margin-top:7px;}.mailbox-reaction-text{font-size:12px;color:#5a6e54;padding-top:3px;line-height:1.5;}
.mailbox-reply-area{margin-top:10px;display:flex;gap:8px;}.mailbox-reply-input{flex:1;padding:8px 11px;background:rgba(249,241,228,.86);border:1.5px solid rgba(123,152,108,.25);border-radius:10px;font-family:inherit;font-size:13px;color:#3d4a38;resize:none;outline:none;}.mailbox-reply-btn{padding:8px 13px;border-radius:10px;background:#7b986c;color:#fff;border:none;cursor:pointer;font-size:13px;align-self:flex-end;}
.mailbox-fab{position:fixed;right:18px;bottom:26px;z-index:50;width:54px;height:54px;border-radius:50%;background:#7b986c;color:#fff;border:none;box-shadow:0 4px 18px rgba(123,152,108,.42);font-size:22px;cursor:pointer;}.mailbox-fab:active{transform:scale(.92)}
.mailbox-modal{position:fixed;inset:0;z-index:70;background:rgba(61,74,56,.38);backdrop-filter:blur(5px);display:flex;align-items:flex-end;justify-content:center;}.mailbox-modal-box{width:100%;max-width:480px;background:#fbeccf;border-radius:20px 20px 0 0;padding:18px 18px 38px;animation:mailboxModal .25s ease;}@keyframes mailboxModal{from{transform:translateY(55px);opacity:0}to{transform:translateY(0);opacity:1}}
.mailbox-modal-title{font-size:17px;color:#7b986c;margin-bottom:4px;text-align:center;letter-spacing:2px;font-weight:800;}.mailbox-modal-to{font-size:12px;color:#a2b891;margin-bottom:12px;text-align:center;}.mailbox-modal-text{width:100%;height:105px;background:rgba(249,241,228,.9);border:1.5px solid rgba(123,152,108,.25);border-radius:11px;padding:11px;font-family:inherit;font-size:14px;color:#3d4a38;resize:none;outline:none;}.mailbox-modal-hint{font-size:11px;color:#a2b891;margin:7px 0 14px;text-align:right;}.mailbox-modal-actions{display:flex;gap:9px;}.mailbox-cancel,.mailbox-send{padding:11px;border-radius:11px;font-family:inherit;font-size:14px;cursor:pointer;}.mailbox-cancel{flex:1;border:1.5px solid rgba(123,152,108,.25);background:transparent;color:#5a6e54;}.mailbox-send{flex:2;background:#7b986c;color:#fff;border:none;}
.mailbox-delete-cover{position:absolute;inset:0;border-radius:14px;background:rgba(180,80,60,.12);display:flex;align-items:center;justify-content:center;z-index:9;}.mailbox-delete-btn{background:#c0705a;color:#fff;padding:8px 24px;border-radius:10px;font-size:14px;box-shadow:0 2px 10px rgba(192,112,90,.3);cursor:pointer;}
.mailbox-empty{text-align:center;padding:55px 20px;color:#a2b891;font-size:14px;line-height:2.2;}.mailbox-empty-icon{font-size:38px;margin-bottom:10px;opacity:.45;}
.mailbox-error{margin:14px;padding:12px;border-radius:12px;background:rgba(192,112,90,.12);color:#9a503c;font-size:13px;line-height:1.6;}
`
    document.head.appendChild(style)
}

function mailboxAvatar(contact, size = 36) {
    const initial = String(contact?.name || "?").slice(0, 1)
    const avatar = contact?.avatar || ""
    if (avatar && typeof avatarHtml === "function") {
        return `<div class="mailbox-av" style="width:${size}px;height:${size}px">${avatarHtml(avatar, initial)}</div>`
    }
    if (avatar) {
        return `<div class="mailbox-av" style="width:${size}px;height:${size}px"><img class="avatar-img" src="${mailboxEscape(avatar)}" onerror="this.remove()"></div>`
    }
    return `<div class="mailbox-av" style="width:${size}px;height:${size}px;font-size:${Math.floor(size * .4)}px">${mailboxEscape(initial)}</div>`
}

function mailboxAnonAvatar(size = 36) {
    return `<div class="mailbox-anon-av" style="width:${size}px;height:${size}px;font-size:${Math.floor(size * .45)}px">✉</div>`
}

function mailboxDots(text = "正在生成…") {
    return `<div class="mailbox-pending"><span class="mailbox-dots"><span></span><span></span><span></span></span>${mailboxEscape(text)}</div>`
}

function mailboxPut(storeName, item) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction(storeName, "readwrite")
            tx.objectStore(storeName).put(item)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (e) {
            console.error(e)
            resolve(false)
        }
    })
}

function mailboxDelete(storeName, id) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction(storeName, "readwrite")
            tx.objectStore(storeName).delete(id)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (e) {
            console.error(e)
            resolve(false)
        }
    })
}

async function mailboxSaveSharedMemory(contactId, question, answer) {
    if (!contactId) return
    const date = new Date()
    const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`
    const memoryText = `【匿名信箱 ${dateStr}】收到匿名提问：「${String(question || "").slice(0, 50)}」，回答/看到：「${String(answer || "").slice(0, 100)}」`

    if (typeof saveMemoryEntry === "function") {
        await saveMemoryEntry(contactId, memoryText, "shared_event", "auto")
        return
    }

    await mailboxPut("memories", {
        id: "mem_mailbox_" + contactId + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        contactId,
        aiId: contactId,
        memoryText,
        content: memoryText,
        category: "shared_event",
        source: "auto",
        insertTime: Date.now(),
        updatedAt: Date.now(),
        embedding: ""
    })
}

async function mailboxLoadData() {
    mailboxContacts = (await getAllStoreData("contacts"))
        .filter(c => c && c.id && String(c.id).trim())
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    mailboxCharLetters = (await getAllStoreData("mailboxCharLetters"))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    mailboxUserLetters = (await getAllStoreData("mailboxUserLetters"))
        .filter(Boolean)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (!mailboxCurrentChar && mailboxContacts[0]) mailboxCurrentChar = mailboxContacts[0].id
}

async function showMailboxHome() {
    ensureMailboxStyle()
    currentPage = "mailboxHome"

    const root = document.getElementById("mailboxRoot") || document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="mailbox-page">
            <div class="mailbox-top">
                <button class="mailbox-top-btn" onclick="goHome()">‹</button>
                <div class="mailbox-title">匿名信箱</div>
                <button class="mailbox-top-btn" id="mailboxRefreshBtn" onclick="mailboxRefresh()">↻</button>
            </div>
            <div class="mailbox-tabs">
                <button class="mailbox-tab active" id="mailboxTabChar" onclick="mailboxSwitchTab('char')">角色信箱</button>
                <button class="mailbox-tab" id="mailboxTabUser" onclick="mailboxSwitchTab('user')">我的信箱</button>
            </div>
            <div class="mailbox-charbar" id="mailboxCharBar"></div>
            <div class="mailbox-list" id="mailboxList">
                ${mailboxDots("正在读取角色列表…")}
            </div>
            <button class="mailbox-fab" id="mailboxAskFab" onclick="mailboxOpenAskModal()">✉</button>
            <div id="mailboxModalHost"></div>
        </div>
    `

    await mailboxLoadData()

    if (!mailboxContacts.length) {
        document.getElementById("mailboxList").innerHTML = `<div class="mailbox-empty"><div class="mailbox-empty-icon">✉</div>暂无角色<br>请先去 Chat → 联系人 添加角色</div>`
        document.getElementById("mailboxCharBar").innerHTML = ""
        return
    }

    await mailboxEnsureInitialLetters()
    mailboxRender()
}

function mailboxSwitchTab(tab) {
    mailboxCurrentTab = tab
    document.getElementById("mailboxTabChar")?.classList.toggle("active", tab === "char")
    document.getElementById("mailboxTabUser")?.classList.toggle("active", tab === "user")
    const charBar = document.getElementById("mailboxCharBar")
    const askFab = document.getElementById("mailboxAskFab")
    if (charBar) charBar.style.display = tab === "char" ? "flex" : "none"
    if (askFab) askFab.style.display = tab === "char" ? "block" : "none"
    mailboxRender()
}

function mailboxSelectChar(id) {
    mailboxCurrentChar = id
    mailboxRender()
}

function mailboxRender() {
    mailboxRenderCharBar()
    if (mailboxCurrentTab === "user") mailboxRenderUserList()
    else mailboxRenderCharList()
}

function mailboxRenderCharBar() {
    const bar = document.getElementById("mailboxCharBar")
    if (!bar) return
    bar.innerHTML = mailboxContacts.map(c => `
        <button class="mailbox-chip ${c.id === mailboxCurrentChar ? "active" : ""}" onclick="mailboxSelectChar(${JSON.stringify(c.id)})">${mailboxEscape(c.name || "未知")}</button>
    `).join("")
}

function mailboxRenderCharList() {
    const box = document.getElementById("mailboxList")
    if (!box) return
    const ch = mailboxContacts.find(c => c.id === mailboxCurrentChar)
    if (!ch) {
        box.innerHTML = `<div class="mailbox-empty"><div class="mailbox-empty-icon">✉</div>请选择一个角色</div>`
        return
    }

    const list = mailboxCharLetters
        .filter(l => l.contactId === mailboxCurrentChar)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (!list.length) {
        box.innerHTML = `<div class="mailbox-empty"><div class="mailbox-empty-icon">✉</div>还没有任何提问<br>点右上角刷新收信</div>`
        return
    }

    box.innerHTML = list.map((l, i) => {
        const qHtml = l.question
            ? `<div class="mailbox-question">${mailboxEscape(l.question)}</div>`
            : mailboxDots("正在生成提问…")
        const ansHtml = l.answer
            ? `<div class="mailbox-answer-label">${mailboxEscape(ch.name || "角色")} 的回答</div><div class="mailbox-answer">${mailboxEscape(l.answer)}</div>`
            : mailboxDots("正在思考中…")
        const sender = l.fromUser ? "你" : "匿名用户"
        return `
            <div class="mailbox-card" data-id="${mailboxEscape(l.id)}" data-type="char" style="animation-delay:${i * .035}s">
                <div class="mailbox-card-head">
                    ${l.fromUser ? mailboxAvatar({ name: "我", avatar: localStorage.getItem("MJI_MY_AVATAR") || "" }) : mailboxAnonAvatar()}
                    <div class="mailbox-head-main">
                        <div class="mailbox-name">${sender}</div>
                        <div class="mailbox-time">${mailboxEscape(l.timeText || "")}</div>
                    </div>
                    <span class="mailbox-badge">投递给 ${mailboxEscape(ch.name || "角色")}</span>
                </div>
                ${qHtml}
                <div class="mailbox-card-head" style="margin-top:10px;margin-bottom:6px">
                    ${mailboxAvatar(ch, 28)}
                    <div class="mailbox-head-main"><div class="mailbox-name" style="font-size:12px">${mailboxEscape(ch.name || "角色")} 的回答</div></div>
                </div>
                ${ansHtml}
            </div>
        `
    }).join("")

    mailboxBindLongPress(box)
}

function mailboxRenderUserList() {
    const box = document.getElementById("mailboxList")
    if (!box) return

    const list = mailboxUserLetters.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    if (!list.length) {
        box.innerHTML = `<div class="mailbox-empty"><div class="mailbox-empty-icon">📬</div>还没有人给你写信<br>点右上角刷新收信</div>`
        return
    }

    box.innerHTML = list.map((l, i) => {
        const qHtml = l.question
            ? `<div class="mailbox-question">${mailboxEscape(l.question)}</div>`
            : mailboxDots("正在写信中…")

        let bodyHtml = ""
        if (l.answer) {
            const reactions = l.reactions || {}
            const reactionHtml = Object.entries(reactions).map(([cid, text]) => {
                const rc = mailboxContacts.find(c => c.id === cid)
                if (!rc) return ""
                return `<div class="mailbox-reaction-row">${mailboxAvatar(rc, 24)}<div class="mailbox-reaction-text"><span style="color:#7b986c;font-size:11px">${mailboxEscape(rc.name || "角色")}</span>：${mailboxEscape(text)}</div></div>`
            }).join("")
            bodyHtml = `<div class="mailbox-answer-label">你的回答</div><div class="mailbox-answer">${mailboxEscape(l.answer)}</div>${reactionHtml ? `<div class="mailbox-reactions">${reactionHtml}</div>` : ""}`
        } else if (l.question) {
            bodyHtml = `
                <div class="mailbox-reply-area">
                    <textarea class="mailbox-reply-input" id="mailboxReply_${mailboxEscape(l.id)}" placeholder="写下你的回答…" rows="2"></textarea>
                    <button class="mailbox-reply-btn" onclick="mailboxSubmitReply(${JSON.stringify(l.id)})">回答</button>
                </div>
            `
        }

        return `
            <div class="mailbox-card" data-id="${mailboxEscape(l.id)}" data-type="user" style="animation-delay:${i * .035}s">
                <div class="mailbox-card-head">
                    ${mailboxAnonAvatar()}
                    <div class="mailbox-head-main">
                        <div class="mailbox-name">匿名用户</div>
                        <div class="mailbox-time">${mailboxEscape(l.timeText || "")}</div>
                    </div>
                </div>
                ${qHtml}
                ${bodyHtml}
            </div>
        `
    }).join("")

    mailboxBindLongPress(box)
}

async function mailboxEnsureInitialLetters() {
    // 角色信箱：每个角色至少保留 3 封基础信。
    for (const ch of mailboxContacts) {
        const have = mailboxCharLetters.filter(l => l.contactId === ch.id).length
        for (let i = have; i < 3; i++) {
            const letter = {
                id: "mbc_" + ch.id + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                contactId: ch.id,
                question: "",
                answer: "",
                fromUser: false,
                version: MAILBOX_VERSION,
                timeText: mailboxNowText(),
                createdAt: Date.now() + i
            }
            mailboxCharLetters.push(letter)
            await mailboxPut("mailboxCharLetters", letter)
            mailboxGenerateNpcQuestion(letter.id, ch.id)
            await mailboxSleep(350)
        }
    }

    // 我的信箱：首次至少 3 封匿名来信。
    if (mailboxUserLetters.length < 3) {
        const shuffled = [...mailboxContacts].sort(() => Math.random() - .5).slice(0, Math.min(4, mailboxContacts.length))
        for (let i = 0; i < shuffled.length && mailboxUserLetters.length < 3; i++) {
            const ch = shuffled[i]
            const letter = {
                id: "mbu_" + ch.id + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                fromId: ch.id,
                question: "",
                answer: "",
                reactions: {},
                version: MAILBOX_VERSION,
                timeText: mailboxNowText(),
                createdAt: Date.now() + i
            }
            mailboxUserLetters.push(letter)
            await mailboxPut("mailboxUserLetters", letter)
            mailboxGenerateUserQuestion(letter.id, ch.id)
            await mailboxSleep(350)
        }
    }
}

async function mailboxCallAI(systemPrompt, userPrompt, maxTokens = 180, temperature = 1.0) {
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"
    const url = mailboxApiUrl()
    if (!apiKey || !url) throw new Error("API未配置")

    const resp = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
            model: apiModel,
            temperature,
            max_tokens: maxTokens,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ]
        })
    })

    if (!resp.ok) throw new Error("HTTP " + resp.status)
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim() || ""
    if (!text) throw new Error("空响应")
    return text.replace(/^['"“”]+|['"“”]+$/g, "").trim()
}

async function mailboxGenerateNpcQuestion(letterId, contactId) {
    const key = "npcq_" + letterId
    if (mailboxGeneratingSet.has(key)) return
    mailboxGeneratingSet.add(key)

    const ch = mailboxContacts.find(c => c.id === contactId)
    if (!ch) return

    let question = ""
    try {
        const seed = Math.floor(Math.random() * 10000)
        question = await mailboxCallAI(
            `你是一个匿名陌生人，正在向「${ch.name}」的匿名信箱投递提问。要求：问题走心、私密、有触动，可以涉及过去、秘密、关系、内心深处。禁止重复或雷同。随机种子：${seed}。只输出一句疑问句，25字以内。`,
            "请生成一个独特的匿名提问。",
            90,
            1.0
        )
    } catch (_) {
        question = mailboxRand([
            "有什么话，你一直没能说出口？",
            "有没有一件事，你至今还在后悔？",
            "你最害怕别人发现你哪一面？",
            "你会偷偷想念某个人吗？",
            "你有没有不能承认的软肋？"
        ])
    }

    const letter = mailboxCharLetters.find(l => l.id === letterId)
    if (letter) {
        letter.question = question.slice(0, 120)
        await mailboxPut("mailboxCharLetters", letter)
        if (mailboxCurrentTab === "char" && mailboxCurrentChar === contactId) mailboxRenderCharList()
        await mailboxSleep(600)
        mailboxGenerateCharAnswer(letterId, contactId, letter.question)
    }

    mailboxGeneratingSet.delete(key)
}

async function mailboxGenerateCharAnswer(letterId, contactId, question) {
    const key = "ansa_" + letterId
    if (mailboxGeneratingSet.has(key)) return
    mailboxGeneratingSet.add(key)

    const ch = mailboxContacts.find(c => c.id === contactId)
    if (!ch || !question) return

    let answer = ""
    try {
        const persona = mailboxContactPersona(ch)
        answer = await mailboxCallAI(
            `你正在扮演「${ch.name}」。人设：${persona || "暂无"}\n你在自己的匿名信箱收到一个匿名提问，不知道对方是谁。请用符合人设和性格的方式回答，50字以内。只输出回答内容。`,
            question,
            150,
            0.9
        )
    } catch (_) {
        answer = "这个问题……我可能需要再想一会儿。"
    }

    const letter = mailboxCharLetters.find(l => l.id === letterId)
    if (letter) {
        letter.answer = answer.slice(0, 300)
        letter.answeredAt = Date.now()
        await mailboxPut("mailboxCharLetters", letter)
        await mailboxSaveSharedMemory(contactId, question, letter.answer)
        if (mailboxCurrentTab === "char" && mailboxCurrentChar === contactId) mailboxRenderCharList()
    }

    mailboxGeneratingSet.delete(key)
}

async function mailboxGenerateUserQuestion(letterId, contactId) {
    const key = "userq_" + letterId
    if (mailboxGeneratingSet.has(key)) return
    mailboxGeneratingSet.add(key)

    const ch = mailboxContacts.find(c => c.id === contactId)
    if (!ch) return

    let question = ""
    try {
        const persona = mailboxContactPersona(ch)
        const seed = Math.floor(Math.random() * 10000)
        question = await mailboxCallAI(
            `你是「${ch.name}」。人设：${persona || "暂无"}\n你想匿名给一个你认识的人发一个私密提问，对方不知道这是你发的。提问要走心、私密、可以涉及情感、内心、关系、秘密，符合你的人设风格。随机种子：${seed}。只输出一句疑问句，30字以内。`,
            "请生成一个匿名提问。",
            100,
            1.0
        )
    } catch (_) {
        question = mailboxRand([
            "你有没有一件事，一直想说却没说出口？",
            "你会因为谁的一句话反复想很久吗？",
            "如果有人偷偷在意你，你会发现吗？",
            "你最想被谁坚定选择？",
            "你有没有假装无所谓的时刻？"
        ])
    }

    const letter = mailboxUserLetters.find(l => l.id === letterId)
    if (letter) {
        letter.question = question.slice(0, 130)
        await mailboxPut("mailboxUserLetters", letter)
        if (mailboxCurrentTab === "user") mailboxRenderUserList()
    }

    mailboxGeneratingSet.delete(key)
}

async function mailboxGenerateReactions(letterId, userAnswer) {
    const letter = mailboxUserLetters.find(l => l.id === letterId)
    if (!letter) return

    const reactors = mailboxContacts
        .filter(c => c.id !== letter.fromId)
        .sort(() => Math.random() - .5)
        .slice(0, 3)

    letter.reactions = letter.reactions || {}

    for (const ch of reactors) {
        await mailboxSleep(700)
        let reaction = ""
        try {
            const persona = mailboxContactPersona(ch)
            reaction = await mailboxCallAI(
                `你是「${ch.name}」。人设：${persona || "暂无"}\n你看到了用户对一个匿名提问的回答。请用符合人设的方式做出简短反应，20字以内。只输出反应内容。`,
                `提问：${letter.question}\n用户的回答：${userAnswer}`,
                80,
                0.9
            )
        } catch (_) {
            reaction = "……"
        }
        letter.reactions[ch.id] = reaction.slice(0, 80)
        await mailboxPut("mailboxUserLetters", letter)
        await mailboxSaveSharedMemory(ch.id, letter.question || "匿名提问", "用户回答了匿名提问：" + userAnswer + "。我的反应：" + reaction)
        if (mailboxCurrentTab === "user") mailboxRenderUserList()
    }
}

async function mailboxRefresh() {
    const btn = document.getElementById("mailboxRefreshBtn")
    btn?.classList.add("spin")
    setTimeout(() => btn?.classList.remove("spin"), 550)

    await mailboxLoadData()
    if (!mailboxContacts.length) return

    if (mailboxCurrentTab === "user") {
        const ch = mailboxRand(mailboxContacts)
        const letter = {
            id: "mbu_" + ch.id + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
            fromId: ch.id,
            question: "",
            answer: "",
            reactions: {},
            version: MAILBOX_VERSION,
            timeText: mailboxNowText(),
            createdAt: Date.now()
        }
        mailboxUserLetters.unshift(letter)
        await mailboxPut("mailboxUserLetters", letter)
        mailboxRenderUserList()
        mailboxGenerateUserQuestion(letter.id, ch.id)
    } else {
        const ch = mailboxContacts.find(c => c.id === mailboxCurrentChar) || mailboxContacts[0]
        const letter = {
            id: "mbc_" + ch.id + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
            contactId: ch.id,
            question: "",
            answer: "",
            fromUser: false,
            version: MAILBOX_VERSION,
            timeText: mailboxNowText(),
            createdAt: Date.now()
        }
        mailboxCharLetters.unshift(letter)
        await mailboxPut("mailboxCharLetters", letter)
        mailboxRenderCharList()
        mailboxGenerateNpcQuestion(letter.id, ch.id)
    }
}

function mailboxOpenAskModal() {
    const ch = mailboxContacts.find(c => c.id === mailboxCurrentChar)
    if (!ch) return
    const host = document.getElementById("mailboxModalHost")
    if (!host) return

    host.innerHTML = `
        <div class="mailbox-modal" onclick="mailboxCloseModalOutside(event)">
            <div class="mailbox-modal-box">
                <div class="mailbox-modal-title">悄悄问一句</div>
                <div class="mailbox-modal-to">你的提问将以匿名方式发送给 ${mailboxEscape(ch.name || "角色")}</div>
                <textarea class="mailbox-modal-text" id="mailboxAskInput" maxlength="200" placeholder="你想匿名问什么……"></textarea>
                <div class="mailbox-modal-hint"><span id="mailboxAskCount">0</span>/200</div>
                <div class="mailbox-modal-actions">
                    <button class="mailbox-cancel" onclick="mailboxCloseModal()">算了</button>
                    <button class="mailbox-send" onclick="mailboxSubmitQuestion()">寄出去</button>
                </div>
            </div>
        </div>
    `

    const input = document.getElementById("mailboxAskInput")
    input?.addEventListener("input", () => {
        const count = document.getElementById("mailboxAskCount")
        if (count) count.textContent = input.value.length
    })
    setTimeout(() => input?.focus(), 120)
}

function mailboxCloseModal() {
    const host = document.getElementById("mailboxModalHost")
    if (host) host.innerHTML = ""
}

function mailboxCloseModalOutside(e) {
    if (e.target?.classList?.contains("mailbox-modal")) mailboxCloseModal()
}

async function mailboxSubmitQuestion() {
    const ch = mailboxContacts.find(c => c.id === mailboxCurrentChar)
    const input = document.getElementById("mailboxAskInput")
    const question = input?.value?.trim() || ""
    if (!ch || !question) return
    mailboxCloseModal()

    const letter = {
        id: "mbc_user_" + ch.id + "_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        contactId: ch.id,
        question: question.slice(0, 200),
        answer: "",
        fromUser: true,
        version: MAILBOX_VERSION,
        timeText: mailboxNowText(),
        createdAt: Date.now()
    }
    mailboxCharLetters.unshift(letter)
    await mailboxPut("mailboxCharLetters", letter)
    mailboxRenderCharList()
    mailboxGenerateCharAnswer(letter.id, ch.id, letter.question)
}

async function mailboxSubmitReply(id) {
    const letter = mailboxUserLetters.find(l => String(l.id) === String(id))
    if (!letter) return
    const input = document.getElementById("mailboxReply_" + id)
    const answer = input?.value?.trim() || ""
    if (!answer) {
        if (input) input.style.borderColor = "#c0705a"
        return
    }

    letter.answer = answer.slice(0, 500)
    letter.answeredAt = Date.now()
    await mailboxPut("mailboxUserLetters", letter)
    mailboxRenderUserList()

    if (letter.fromId) {
        await mailboxSaveSharedMemory(letter.fromId, letter.question || "匿名提问", "用户回答了匿名提问：" + answer)
    }
    mailboxGenerateReactions(letter.id, answer)
}

function mailboxBindLongPress(container) {
    container.querySelectorAll(".mailbox-card").forEach(card => {
        let timer = null
        const start = () => {
            timer = setTimeout(() => {
                if (card.querySelector(".mailbox-delete-cover")) return
                const cover = document.createElement("div")
                cover.className = "mailbox-delete-cover"
                cover.innerHTML = `<div class="mailbox-delete-btn">删除这封信</div>`
                card.appendChild(cover)
                cover.querySelector(".mailbox-delete-btn")?.addEventListener("click", () => mailboxDeleteLetter(card.dataset.id, card.dataset.type))
                const cancel = e => {
                    if (!card.contains(e.target)) {
                        cover.remove()
                        document.removeEventListener("touchstart", cancel)
                        document.removeEventListener("mousedown", cancel)
                    }
                }
                setTimeout(() => {
                    document.addEventListener("touchstart", cancel, { passive: true })
                    document.addEventListener("mousedown", cancel)
                }, 50)
            }, 600)
        }
        const end = () => clearTimeout(timer)
        card.addEventListener("touchstart", start, { passive: true })
        card.addEventListener("touchend", end)
        card.addEventListener("touchcancel", end)
        card.addEventListener("mousedown", start)
        card.addEventListener("mouseup", end)
        card.addEventListener("mouseleave", end)
    })
}

async function mailboxDeleteLetter(id, type) {
    if (type === "user") {
        mailboxUserLetters = mailboxUserLetters.filter(l => String(l.id) !== String(id))
        await mailboxDelete("mailboxUserLetters", id)
        mailboxRenderUserList()
    } else {
        mailboxCharLetters = mailboxCharLetters.filter(l => String(l.id) !== String(id))
        await mailboxDelete("mailboxCharLetters", id)
        mailboxRenderCharList()
    }
}
