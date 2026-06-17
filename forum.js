function ensureDoorStyles() {
    if (document.getElementById("doorStyleTag")) return

    const style = document.createElement("style")
    style.id = "doorStyleTag"
    style.textContent = `
.door-page,.door-setup-page,.door-chat-page{min-height:100%;background:#050505;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
.door-title{padding:32px 18px 6px;text-align:center;font-size:22px;letter-spacing:2px;font-weight:700}.door-subtitle{text-align:center;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin-bottom:20px}.door-list{padding:0 16px 28px}.door-row{width:100%;display:flex;align-items:center;gap:14px;background:#151515;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px;margin-bottom:12px;color:#fff;text-align:left;box-shadow:0 10px 26px rgba(0,0,0,.25)}.door-row:active{transform:scale(.985)}.door-row-avatar,.door-setup-avatar{width:48px;height:48px;border-radius:50%;overflow:hidden;background:#333;display:flex;align-items:center;justify-content:center;flex-shrink:0}.door-row-avatar img,.door-setup-avatar img{width:100%;height:100%;object-fit:cover}.door-row-main{min-width:0}.door-row-title{font-size:16px;font-weight:650}.door-row-sub{margin-top:4px;color:#888;font-size:12px}.door-empty,.door-empty-chat{padding:55px 18px;text-align:center;color:#999;line-height:1.9;font-size:14px}
.door-setup-page{background:linear-gradient(180deg,#080808,#17120d);padding:16px}.door-setup-card{background:rgba(255,255,255,.94);color:#111;border-radius:24px;padding:18px;box-shadow:0 22px 50px rgba(0,0,0,.35)}.door-setup-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.door-setup-name{font-size:18px;font-weight:800}.door-setup-note{font-size:12px;color:#777;margin-top:3px}.door-label{display:block;margin:16px 0 8px;color:#666;font-size:13px}.door-textarea,.door-input{width:100%;border:none;outline:none;background:#f3f4f6;border-radius:14px;padding:12px;font-size:14px;color:#111}.door-textarea{min-height:90px;resize:vertical}.door-chip-grid{display:flex;flex-wrap:wrap;gap:8px}.door-chip{border:1px solid #ddd;background:#f6f6f6;color:#555;border-radius:999px;padding:8px 12px;font-size:13px}.door-chip.active{background:#4a7c59;color:#fff;border-color:#4a7c59}.door-primary-btn,.door-ghost-btn{width:100%;border:none;border-radius:16px;padding:13px 16px;margin-top:16px;font-size:15px}.door-primary-btn{background:#111;color:#fff;font-weight:700}.door-ghost-btn{background:#eee;color:#555;margin-top:10px}
.door-chat-page{position:relative;height:100%;display:flex;flex-direction:column;background:#f5f5f5;color:#111}.door-chat-top{height:50px;display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #eee;padding:0 14px;flex-shrink:0}.door-chat-title{font-size:16px;font-weight:800}.door-menu-btn{border:none;background:transparent;font-size:24px;color:#111;padding:6px 10px}.door-scene-line{font-size:12px;color:#666;background:#fff;padding:8px 14px;border-bottom:1px solid #eee;flex-shrink:0}.door-chat-list{flex:1;overflow-y:auto;padding:12px 0 96px}.door-msg-card{position:relative;background:#fff;margin:0 14px 14px;border-radius:18px;padding:20px 18px 18px;box-shadow:0 8px 24px rgba(0,0,0,.06)}.door-msg-card.me{background:#f0fdf4}.door-msg-avatar{width:64px;height:64px;border-radius:50%;overflow:hidden;background:#ddd;margin:0 auto 8px;display:flex;align-items:center;justify-content:center}.door-msg-avatar img{width:100%;height:100%;object-fit:cover}.door-msg-floor{text-align:center;font-size:12px;color:#aaa;font-weight:700}.door-msg-name{margin-top:12px;font-size:15px;font-weight:800}.door-msg-content{margin-top:10px;font-size:15px;color:#333;line-height:1.8;white-space:pre-wrap;word-break:break-word}.door-msg-content.thinking{color:#888}.door-delete-msg{position:absolute;top:10px;right:10px;border:none;background:#f3f4f6;color:#888;border-radius:999px;font-size:11px;padding:5px 9px}.door-input-bar{position:absolute;left:0;right:0;bottom:0;display:flex;gap:8px;align-items:flex-end;background:#fff;border-top:1px solid #eee;padding:10px}.door-input-bar textarea{flex:1;min-height:42px;max-height:110px;border:none;outline:none;background:#f3f4f6;border-radius:14px;padding:11px 12px;font-size:14px;resize:none}.door-regen-btn,.door-send-btn{border:none;border-radius:14px;height:42px;color:#fff}.door-regen-btn{width:42px;background:#f59e0b}.door-send-btn{background:#07c160;padding:0 15px;font-weight:700}
#doorModalRoot{position:fixed;inset:0;z-index:9999}.door-modal-mask{position:absolute;inset:0;background:rgba(0,0,0,.45)}.door-modal{position:absolute;left:18px;right:18px;bottom:22px;background:#fff;color:#111;border-radius:22px;padding:14px;box-shadow:0 24px 70px rgba(0,0,0,.35)}.door-modal-title{font-size:16px;font-weight:800;text-align:center;padding:8px 0 12px}.door-modal button{width:100%;border:none;background:#f5f5f5;color:#111;border-radius:14px;padding:13px;margin-top:8px;font-size:15px;text-align:left}.door-modal button:last-child{text-align:center;color:#666}.door-chat-page .emoji-avatar{font-size:32px}
    `
    document.head.appendChild(style)
}

let currentDoorContact = null
let doorMeetState = {
    location: "",
    time: "",
    mood: "",
    background: ""
}
let doorAiRunning = false

const DOOR_LOCATIONS = ["咖啡馆", "公园长椅", "你的住所", "对方住所", "图书馆", "便利店", "车站附近", "海边"]
const DOOR_TIMES = ["清晨", "上午", "正午", "下午", "傍晚", "深夜"]
const DOOR_MOODS = ["日常温馨", "暧昧拉扯", "久别重逢", "争执和好", "安静陪伴", "雨天偶遇"]

function doorEscAttr(text) {
    return escapeHtml(text).replaceAll("\n", "&#10;")
}

async function showDoorHome() {
    ensureDoorStyles()
    currentPage = "doorHome"

    const title = document.getElementById("appTitle")
    const content = document.getElementById("appContent")

    if (title) title.innerText = "门"
    if (!content) return

    const contacts = await getAllStoreData("contacts")
    const validContacts = contacts
        .filter(c => c && c.id && String(c.name || "").trim())
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    content.innerHTML = `
        <div class="door-page">
            <div class="door-title">选择要推开的门</div>
            <div class="door-subtitle">Offline Meeting</div>
            <div class="door-list" id="doorContactList"></div>
        </div>
    `

    const list = document.getElementById("doorContactList")
    if (!list) return

    if (!validContacts.length) {
        list.innerHTML = `
            <div class="door-empty">
                还没有角色<br>
                先去 Chat → 联系人 添加一个。
            </div>
        `
        return
    }

    list.innerHTML = validContacts.map(c => `
        <button class="door-row" onclick="openDoorSetup('${escapeHtml(c.id)}')">
            <div class="door-row-avatar">${avatarHtml(c.avatar, "🙂")}</div>
            <div class="door-row-main">
                <div class="door-row-title">🚪 推开 ${escapeHtml(c.name || "未知")} 的门</div>
                <div class="door-row-sub">进入线下见面模式</div>
            </div>
        </button>
    `).join("")
}

async function openDoorSetup(contactId) {
    ensureDoorStyles()
    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === contactId)

    if (!contact) {
        alert("角色不存在")
        showDoorHome()
        return
    }

    currentDoorContact = contact
    currentPage = "doorSetup"

    const title = document.getElementById("appTitle")
    const content = document.getElementById("appContent")

    if (title) title.innerText = "见面设置"
    if (!content) return

    doorMeetState = {
        location: "",
        time: "",
        mood: "",
        background: ""
    }

    content.innerHTML = `
        <div class="door-setup-page">
            <div class="door-setup-card">
                <div class="door-setup-head">
                    <div class="door-setup-avatar">${avatarHtml(contact.avatar, "🙂")}</div>
                    <div>
                        <div class="door-setup-name">推开 ${escapeHtml(contact.name || "未知")} 的门</div>
                        <div class="door-setup-note">先设置这次见面的场景。</div>
                    </div>
                </div>

                <label class="door-label">前情背景（可选）</label>
                <textarea id="doorMeetBackground" class="door-textarea" placeholder="两人关系的近况、上次见面的情况……"></textarea>

                <label class="door-label">地点</label>
                <div class="door-chip-grid">
                    ${DOOR_LOCATIONS.map(x => `<button class="door-chip" data-type="location" onclick="selectDoorChip(this, 'location', '${doorEscAttr(x)}')">${escapeHtml(x)}</button>`).join("")}
                </div>
                <input id="doorMeetCustomLocation" class="door-input" placeholder="或自定义地点……">

                <label class="door-label">时间</label>
                <div class="door-chip-grid">
                    ${DOOR_TIMES.map(x => `<button class="door-chip" data-type="time" onclick="selectDoorChip(this, 'time', '${doorEscAttr(x)}')">${escapeHtml(x)}</button>`).join("")}
                </div>

                <label class="door-label">情境氛围</label>
                <div class="door-chip-grid">
                    ${DOOR_MOODS.map(x => `<button class="door-chip" data-type="mood" onclick="selectDoorChip(this, 'mood', '${doorEscAttr(x)}')">${escapeHtml(x)}</button>`).join("")}
                </div>

                <button class="door-primary-btn" onclick="startDoorMeeting()">开始新的见面</button>
                <button class="door-ghost-btn" onclick="openDoorChat('${escapeHtml(contact.id)}')">跳过设置，继续上次记录</button>
            </div>
        </div>
    `
}

function selectDoorChip(el, type, value) {
    doorMeetState[type] = value

    document
        .querySelectorAll(`.door-chip[data-type="${type}"]`)
        .forEach(btn => btn.classList.remove("active"))

    el.classList.add("active")
}

function startDoorMeeting() {
    if (!currentDoorContact) return

    const bg = document.getElementById("doorMeetBackground")?.value?.trim() || ""
    const customLocation = document.getElementById("doorMeetCustomLocation")?.value?.trim() || ""

    doorMeetState.background = bg
    if (customLocation) doorMeetState.location = customLocation

    openDoorChat(currentDoorContact.id)
}

async function openDoorChat(contactId) {
    ensureDoorStyles()
    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === contactId)

    if (!contact) {
        alert("角色不存在")
        showDoorHome()
        return
    }

    currentDoorContact = contact
    currentPage = "doorChat"

    const title = document.getElementById("appTitle")
    const content = document.getElementById("appContent")

    if (title) title.innerText = `推开了 ${contact.name || "TA"} 的门`
    if (!content) return

    content.innerHTML = `
        <div class="door-chat-page">
            <div class="door-chat-top">
                <div class="door-chat-title">推开了 ${escapeHtml(contact.name || "TA")} 的门</div>
                <button class="door-menu-btn" onclick="showDoorMenu()">≡</button>
            </div>

            <div class="door-scene-line" id="doorSceneLine"></div>
            <div class="door-chat-list" id="doorChatList"></div>

            <div class="door-input-bar">
                <button class="door-regen-btn" onclick="regenerateDoorReply()">▶</button>
                <textarea id="doorInput" placeholder="输入线下互动描写/对话……"></textarea>
                <button class="door-send-btn" id="doorSendBtn" onclick="sendDoorMessage()">发送</button>
            </div>
        </div>
    `

    renderDoorSceneLine()
    await loadDoorMessages(contact.id)
}

function renderDoorSceneLine() {
    const el = document.getElementById("doorSceneLine")
    if (!el) return

    const parts = []
    if (doorMeetState.location) parts.push("📍 " + doorMeetState.location)
    if (doorMeetState.time) parts.push("🕰️ " + doorMeetState.time)
    if (doorMeetState.mood) parts.push("☁️ " + doorMeetState.mood)
    if (doorMeetState.background) parts.push("📝 有前情")

    el.textContent = parts.length ? parts.join("　") : "未设置场景，沿用普通线下见面。"
}

async function getDoorMessages(contactId) {
    const rows = await getAllStoreData("offlineMessages")
    return rows
        .filter(m => m.contactId === contactId)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

async function saveDoorMessage(contactId, role, content, createdAt = Date.now(), extra = {}) {
    return new Promise(resolve => {
        const tx = db.transaction("offlineMessages", "readwrite")
        const store = tx.objectStore("offlineMessages")

        store.put({
            id: extra.id || ("offline_" + createdAt + "_" + Math.random().toString(16).slice(2)),
            contactId,
            role,
            content,
            createdAt,
            ...extra
        })

        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

async function loadDoorMessages(contactId) {
    const box = document.getElementById("doorChatList")
    if (!box) return

    const rows = await getDoorMessages(contactId)

    if (!rows.length) {
        box.innerHTML = `
            <div class="door-empty-chat">
                这里还没有见面记录。<br>
                你可以像跑团一样输入动作、场景或对话。
            </div>
        `
        return
    }

    box.innerHTML = rows.map((m, idx) => renderDoorMessage(m, idx)).join("")
    box.scrollTop = box.scrollHeight
}

function renderDoorMessage(m, index) {
    const contact = currentDoorContact || {}
    const name = m.role === "user"
        ? (localStorage.getItem("MJI_MY_NAME") || "我")
        : (contact.name || "TA")

    const avatar = m.role === "user"
        ? localStorage.getItem("MJI_MY_AVATAR")
        : contact.avatar

    const thinking = m.thinking === true

    return `
        <div class="door-msg-card ${m.role === "user" ? "me" : "ai"}" data-id="${escapeHtml(m.id)}">
            <div class="door-msg-avatar">${avatarHtml(avatar, m.role === "user" ? "👤" : "🙂")}</div>
            <div class="door-msg-floor">#${index + 1}</div>
            <div class="door-msg-name">${escapeHtml(name)}</div>
            <div class="door-msg-content ${thinking ? "thinking" : ""}">${escapeHtml(thinking ? "正在思考中..." : (m.content || ""))}</div>
            ${thinking ? "" : `<button class="door-delete-msg" onclick="deleteDoorMessage('${escapeHtml(m.id)}')">删除</button>`}
        </div>
    `
}

async function sendDoorMessage() {
    if (doorAiRunning || !currentDoorContact) return

    const input = document.getElementById("doorInput")
    const text = input?.value?.trim() || ""

    if (!text) return

    input.value = ""

    const now = Date.now()
    await saveDoorMessage(currentDoorContact.id, "user", text, now)

    const thinkingId = "offline_thinking_" + now
    await saveDoorMessage(currentDoorContact.id, "assistant", "...", now + 1, {
        id: thinkingId,
        thinking: true
    })

    await loadDoorMessages(currentDoorContact.id)
    await callDoorAi(text, thinkingId)
}

async function regenerateDoorReply() {
    if (doorAiRunning || !currentDoorContact) return

    const rows = await getDoorMessages(currentDoorContact.id)
    const lastUser = [...rows].reverse().find(m => m.role === "user")

    if (!lastUser) {
        alert("还没有你的输入，无法重新生成")
        return
    }

    const now = Date.now()
    const thinkingId = "offline_thinking_" + now

    await saveDoorMessage(currentDoorContact.id, "assistant", "...", now, {
        id: thinkingId,
        thinking: true
    })

    await loadDoorMessages(currentDoorContact.id)
    await callDoorAi(lastUser.content, thinkingId)
}

async function replaceDoorThinkingMessage(messageId, content) {
    const rows = await getAllStoreData("offlineMessages")
    const row = rows.find(m => m.id === messageId)
    if (!row) return

    row.content = content
    row.thinking = false
    row.createdAt = Date.now()

    await new Promise(resolve => {
        const tx = db.transaction("offlineMessages", "readwrite")
        tx.objectStore("offlineMessages").put(row)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

async function deleteDoorMessage(messageId) {
    if (!confirm("要删掉这条见面记录吗？")) return

    await new Promise(resolve => {
        const tx = db.transaction("offlineMessages", "readwrite")
        tx.objectStore("offlineMessages").delete(messageId)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })

    if (currentDoorContact) {
        await loadDoorMessages(currentDoorContact.id)
    }
}

function getDoorContactPrompt(contact) {
    const parts = []

    if (contact.prompt) parts.push(contact.prompt)
    if (contact.identity) parts.push("身份：" + contact.identity)
    if (contact.personality) parts.push("性格：" + contact.personality)
    if (contact.profile) parts.push("简介：" + contact.profile)
    if (contact.presetOffline) parts.push("线下见面预设：" + contact.presetOffline)

    return parts.join("\n") || `${contact.name || "TA"}，一个真实存在的人。`
}

async function callDoorAi(inputText, thinkingId) {
    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        await replaceDoorThinkingMessage(thinkingId, "（请先在设置里配置 API）")
        await loadDoorMessages(currentDoorContact.id)
        return
    }

    doorAiRunning = true
    const sendBtn = document.getElementById("doorSendBtn")
    if (sendBtn) sendBtn.style.opacity = "0.5"

    try {
        const contact = currentDoorContact
        const history = await getDoorMessages(contact.id)
        const memory = await recallRelevantMemory(contact.id, inputText)
        const worldBook = safeWorldBook(await getWorldBookInjection(inputText), 1800)
        const offlineLang = localStorage.getItem("MJI_OFFLINE_LANG") || "中文"

        const contextLines = history
            .filter(m => !m.thinking)
            .slice(-30)
            .map(m => `${m.role === "user" ? (localStorage.getItem("MJI_MY_NAME") || "我") : contact.name}：${m.content}`)
            .join("\n")

        const scene = [
            doorMeetState.location ? `地点：${doorMeetState.location}` : "",
            doorMeetState.time ? `时间：${doorMeetState.time}` : "",
            doorMeetState.mood ? `氛围：${doorMeetState.mood}` : "",
            doorMeetState.background ? `前情背景：${doorMeetState.background}` : ""
        ].filter(Boolean).join("。")

        const languageRule = offlineLang === "英文"
            ? "You must write everything in English only. No Chinese characters."
            : "全程使用简体中文输出。"

        const prompt = `
系统设定：这是线下角色扮演。你现在的身份是 ${contact.name || "TA"}。

【角色设定】
${getDoorContactPrompt(contact)}

【本次见面场景】
${scene || "普通线下见面，没有额外场景限制。"}

【长期记忆】
${memory || "暂无长期记忆"}

【世界书】
${worldBook || "暂无命中的世界书"}

【语言指令】
${languageRule}

【写作要求】
1. 这是面对面的线下互动，不是微信聊天。
2. 可以写动作、神态、环境和对话。
3. 必须保持角色人设，像真实的人在现场回应。
4. 不要解释规则，不要说自己是 AI。
5. 输出 1 到 4 段，自然推进场景。

【历史互动】
${contextLines || "暂无历史互动"}

${localStorage.getItem("MJI_MY_NAME") || "我"}：${inputText}
        `.trim()

        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.75,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            const msg = data.error?.message || response.status
            await replaceDoorThinkingMessage(thinkingId, "（API错误：" + msg + "）")
        } else {
            const answer = data.choices?.[0]?.message?.content?.trim() || "（没有回复）"
            await replaceDoorThinkingMessage(thinkingId, answer)
            afterAiMessageMemoryChecks(contact.id, contact.name || "角色", inputText, answer)
        }

    } catch (e) {
        await replaceDoorThinkingMessage(thinkingId, "（网络异常：" + e.message + "）")
    } finally {
        doorAiRunning = false
        if (sendBtn) sendBtn.style.opacity = "1"
        if (currentDoorContact) await loadDoorMessages(currentDoorContact.id)
    }
}

function showDoorMenu() {
    if (!currentDoorContact) return

    const lang = localStorage.getItem("MJI_OFFLINE_LANG") || "中文"
    const nextLabel = lang === "中文"
        ? "🌐 语言：中文（点击切换英文）"
        : "🌐 Language: English (tap to switch 中文)"

    const html = `
        <div class="door-modal-mask" onclick="closeDoorModal()"></div>
        <div class="door-modal">
            <div class="door-modal-title">见面选项</div>
            <button onclick="summarizeDoorMeeting()">📝 结束本次见面，写入记忆</button>
            <button onclick="clearDoorHistory()">🗑️ 清除本次对话记录</button>
            <button onclick="toggleDoorLanguage()">${escapeHtml(nextLabel)}</button>
            <button onclick="closeDoorModal()">↩ 返回</button>
        </div>
    `

    document.body.insertAdjacentHTML("beforeend", `<div id="doorModalRoot">${html}</div>`)
}

function closeDoorModal() {
    document.getElementById("doorModalRoot")?.remove()
}

function toggleDoorLanguage() {
    const oldLang = localStorage.getItem("MJI_OFFLINE_LANG") || "中文"
    const newLang = oldLang === "中文" ? "英文" : "中文"
    localStorage.setItem("MJI_OFFLINE_LANG", newLang)
    closeDoorModal()
    alert(newLang === "中文" ? "已切换为中文" : "Switched to English")
}

async function clearDoorHistory() {
    if (!currentDoorContact) return
    if (!confirm("只清除本次对话记录，不影响长期记忆。确定吗？")) return

    const rows = await getDoorMessages(currentDoorContact.id)

    await new Promise(resolve => {
        const tx = db.transaction("offlineMessages", "readwrite")
        const store = tx.objectStore("offlineMessages")
        rows.forEach(m => store.delete(m.id))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })

    closeDoorModal()
    await loadDoorMessages(currentDoorContact.id)
}

async function summarizeDoorMeeting() {
    if (!currentDoorContact) return

    const rows = (await getDoorMessages(currentDoorContact.id)).filter(m => !m.thinking)

    if (!rows.length) {
        alert("没有对话内容可以总结")
        return
    }

    if (!confirm("AI 会把这次见面的内容压缩成记忆，线上聊天时也能记住。确定吗？")) return

    closeDoorModal()

    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        alert("请先在设置里配置 API")
        return
    }

    const contact = currentDoorContact
    const myName = localStorage.getItem("MJI_MY_NAME") || "我"
    const dialogText = rows
        .slice(-60)
        .map(m => `${m.role === "user" ? myName : contact.name}：${m.content}`)
        .join("\n")

    const scene = [
        doorMeetState.location ? `地点：${doorMeetState.location}` : "",
        doorMeetState.time ? `时间：${doorMeetState.time}` : "",
        doorMeetState.mood ? `氛围：${doorMeetState.mood}` : "",
        doorMeetState.background ? `背景：${doorMeetState.background}` : ""
    ].filter(Boolean).join("。")

    const prompt = `
以下是 ${myName} 和 ${contact.name} 的一次线下见面记录。
见面情况：${scene || "未特别设置"}

对话内容：
${dialogText}

请你以 ${contact.name} 的第一人称视角，把这次见面压缩成一段100-200字的记忆摘要。
要求：
1. 记录重要的情感变化、发生的事、说过的关键话。
2. 语气像是 ${contact.name} 在回忆这段经历。
3. 只输出记忆摘要文本，不要任何前缀或解释。
    `.trim()

    const tempNoticeId = "door_summarizing_notice_" + Date.now()
    await saveDoorMessage(contact.id, "assistant", "正在压缩记忆，请稍候…", Date.now(), {
        id: tempNoticeId,
        thinking: true
    })
    await loadDoorMessages(contact.id)

    try {
        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.6,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            })
        })

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
            await replaceDoorThinkingMessage(tempNoticeId, "（压缩失败：" + (data.error?.message || response.status) + "）")
            await loadDoorMessages(contact.id)
            return
        }

        const summary = data.choices?.[0]?.message?.content?.trim() || ""
        if (!summary) {
            await replaceDoorThinkingMessage(tempNoticeId, "（压缩失败：内容为空）")
            await loadDoorMessages(contact.id)
            return
        }

        const dateStr = new Date().toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }).replace("/", "月") + "日"
        await saveMemoryEntry(contact.id, `【线下见面 ${dateStr}】${summary}`, "shared_event", "door")

        await replaceDoorThinkingMessage(tempNoticeId, "记忆已写入 ✓\n\n" + summary)
        await loadDoorMessages(contact.id)

    } catch (e) {
        await replaceDoorThinkingMessage(tempNoticeId, "（压缩失败：" + e.message + "）")
        await loadDoorMessages(contact.id)
    }
}
