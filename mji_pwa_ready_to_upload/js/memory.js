/* ============================================================
   M叽 PWA 记忆系统增强版
   - 记忆库：按角色查看记忆数量
   - 记忆详情：用户信息 / 共同经历 / 未来计划 / 珍贵碎片 / 关键时刻 / 时间线 / 生活事件
   - 自动记忆：30条左右生成时间线、关键事件检测、AI生活事件记录
   - 聊天召回：按分类 + 关键词本地召回，不再只是一整块文本
============================================================ */

const MEMORY_CATEGORIES = [
    { key: "user_info", label: "用户信息", empty: "这里还没有用户信息记忆\n点右上角＋手动添加" },
    { key: "shared_event", label: "共同经历", empty: "这里还没有共同经历\n聊到重要事件后可手动添加" },
    { key: "future_plan", label: "未来计划", empty: "这里还没有未来计划\n可以记录约定、安排和承诺" },
    { key: "misc_treasure", label: "珍贵碎片", empty: "这里还没有珍贵碎片\n适合放小细节、小偏好、小心事" },
    { key: "key_event", label: "关键时刻", empty: "还没有关键事件记忆\n聊到重要时刻会自动记录", auto: true },
    { key: "timeline", label: "时间线", empty: "还没有时间线记忆\n聊天、群聊、朋友圈积累后会自动生成", auto: true },
    { key: "ai_life", label: "生活事件", empty: "还没有角色生活事件\n角色提到今天做了什么时会自动记录", auto: true }
]

let currentMemoryContactId = ""
let currentMemoryContactName = ""
let currentMemoryCategory = "user_info"
let currentMemoryRows = []
let memoryBackTarget = "home"
const memoryRunningSet = new Set()

function getCategoryName(category) {
    return (MEMORY_CATEGORIES.find(c => c.key === category)?.label) || category || "未分类"
}

function getCategoryInfo(category) {
    return MEMORY_CATEGORIES.find(c => c.key === category) || MEMORY_CATEGORIES[0]
}

function normalizeMemoryEntry(raw, contactId = "") {
    if (!raw) return null

    const id = raw.id || ("legacy_" + (raw.contactId || raw.aiId || contactId || "unknown"))
    const memoryText = String(raw.memoryText || raw.content || "").trim()
    if (!memoryText) return null

    let category = raw.category || "user_info"
    if (raw.id && String(raw.id).startsWith("memory_") && !raw.category) {
        category = "user_info"
    }

    return {
        id,
        contactId: raw.contactId || raw.aiId || contactId || "",
        memoryText,
        category,
        insertTime: raw.insertTime || raw.createdAt || raw.updatedAt || 0,
        source: raw.source || (getCategoryInfo(category).auto ? "auto" : "manual"),
        embedding: raw.embedding || ""
    }
}

async function getMemoryRows(contactId, category = "") {
    const rows = await getAllStoreData("memories")
    return rows
        .filter(r =>
            r.contactId === contactId ||
            r.aiId === contactId ||
            r.id === "memory_" + contactId
        )
        .map(r => normalizeMemoryEntry(r, contactId))
        .filter(Boolean)
        .filter(r => !category || r.category === category)
        .sort((a, b) => (b.insertTime || 0) - (a.insertTime || 0))
}

function putMemoryEntry(entry) {
    return new Promise(resolve => {
        const tx = db.transaction("memories", "readwrite")
        tx.objectStore("memories").put(entry)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

function deleteMemoryEntryById(id) {
    return new Promise(resolve => {
        const tx = db.transaction("memories", "readwrite")
        tx.objectStore("memories").delete(id)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

async function saveMemoryEntry(contactId, text, category = "misc_treasure", source = "manual", id = "") {
    const content = String(text || "").trim()
    if (!contactId || !content) return false

    const now = Date.now()
    const entry = {
        id: id || ("mem_" + contactId + "_" + now + "_" + Math.random().toString(16).slice(2)),
        contactId,
        aiId: contactId,
        memoryText: content,
        content, // 兼容旧版 getMemory 结构
        category,
        source,
        insertTime: now,
        updatedAt: now,
        embedding: ""
    }

    return putMemoryEntry(entry)
}

async function updateMemoryEntryText(id, newText) {
    const content = String(newText || "").trim()
    if (!id || !content) return false

    const rows = await getAllStoreData("memories")
    const raw = rows.find(r => r.id === id)
    if (!raw) return false

    raw.memoryText = content
    raw.content = content
    raw.embedding = ""
    raw.updatedAt = Date.now()
    raw.insertTime = Date.now()

    return putMemoryEntry(raw)
}

function showMemoryVault(backTarget = "home") {
    memoryBackTarget = backTarget || "home"
    currentPage = "memoryVault"

    document.getElementById("screen").classList.remove("hidden")
    document.getElementById("appTitle").innerText = "记忆库"
    document.getElementById("appContent").innerHTML = `
        <div class="memory-vault-page">
            <div class="wechat-page-head memory-head">
                <div>
                    <div class="wechat-title">记忆库</div>
                    <div class="wechat-subtitle">每个角色的长期记忆都在这里</div>
                </div>
            </div>
            <div id="memoryContactList"></div>
        </div>
    `

    loadMemoryContacts()
}

async function loadMemoryContacts() {
    const box = document.getElementById("memoryContactList")
    if (!box) return

    const contacts = await getAllStoreData("contacts")
    const rows = (await getAllStoreData("memories"))
        .map(r => normalizeMemoryEntry(r))
        .filter(Boolean)

    const contactRows = contacts.map(c => {
        const cnt = rows.filter(r => r.contactId === c.id || r.id === "memory_" + c.id).length
        return { ...c, memoryCount: cnt }
    }).sort((a, b) => (b.memoryCount || 0) - (a.memoryCount || 0) || String(a.name || "").localeCompare(String(b.name || "")))

    box.innerHTML = contactRows.map(c => `
        <div class="contact memory-contact-row" onclick="showMemoryDetail(${JSON.stringify(c.id)}, ${JSON.stringify(c.name || "未知")})">
            <div class="contact-avatar">${avatarHtml(c.avatar, "🙂")}</div>
            <div class="contact-info">
                <div class="chat-list-top">
                    <div class="contact-name">${escapeHtml(c.name || "未知")}</div>
                    <div class="chat-list-time">记忆</div>
                </div>
                <div class="chat-list-bottom">
                    <div class="contact-sub">${c.memoryCount || 0} 条记忆</div>
                </div>
            </div>
        </div>
    `).join("") || `<p class="empty">还没有角色，先去 Chat → 联系人 添加角色。</p>`
}

async function showMemoryDetail(contactId, contactName) {
    currentPage = "memoryDetail"
    currentMemoryContactId = contactId
    currentMemoryContactName = contactName || "角色"
    currentMemoryCategory = currentMemoryCategory || "user_info"

    document.getElementById("appTitle").innerText = currentMemoryContactName + "的记忆"
    document.getElementById("appContent").innerHTML = `
        <div class="memory-detail-page">
            <div class="memory-detail-top">
                <div>
                    <div class="memory-title">${escapeHtml(currentMemoryContactName)} 的记忆</div>
                    <div class="memory-subtitle">分类保存，自动记忆也会沉淀到这里</div>
                </div>
                <button class="wechat-head-btn" onclick="showAddMemoryDialog()">＋</button>
            </div>

            <div class="memory-tabs" id="memoryTabs">
                ${MEMORY_CATEGORIES.map(c => `
                    <button onclick="switchMemoryTab('${c.key}')" data-cat="${c.key}">${c.label}</button>
                `).join("")}
            </div>

            <div id="memoryList" class="memory-list"></div>
        </div>
    `

    switchMemoryTab(currentMemoryCategory)
}

function switchMemoryTab(category) {
    currentMemoryCategory = category
    document.querySelectorAll("#memoryTabs button").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.cat === category)
    })
    loadMemories()
}

async function loadMemories() {
    if (!currentMemoryContactId) return

    currentMemoryRows = await getMemoryRows(currentMemoryContactId, currentMemoryCategory)
    const box = document.getElementById("memoryList")
    if (!box) return

    const info = getCategoryInfo(currentMemoryCategory)

    if (!currentMemoryRows.length) {
        box.innerHTML = `
            <div class="memory-empty">
                ${escapeHtml(info.empty).replaceAll("\n", "<br>")}
            </div>
        `
        return
    }

    box.innerHTML = currentMemoryRows.map(entry => `
        <div class="memory-entry-card" onclick="showMemoryEntryDialog('${entry.id}')">
            <div class="memory-entry-meta">
                <span>${escapeHtml(getCategoryName(entry.category))}</span>
                <span>${entry.source === "auto" ? "自动" : "手动"}</span>
            </div>
            <div class="memory-entry-text">${escapeHtml(entry.memoryText)}</div>
        </div>
    `).join("")
}

function showMemoryModal(title, bodyHtml, footerHtml = "") {
    let modal = document.getElementById("memoryModal")
    if (!modal) {
        modal = document.createElement("div")
        modal.id = "memoryModal"
        document.body.appendChild(modal)
    }

    modal.innerHTML = `
        <div class="memory-modal-mask" onclick="closeMemoryModal()"></div>
        <div class="memory-modal-box">
            <div class="memory-modal-title">${escapeHtml(title)}</div>
            <div class="memory-modal-body">${bodyHtml}</div>
            <div class="memory-modal-footer">${footerHtml}</div>
        </div>
    `
    modal.classList.add("visible")
}

function closeMemoryModal() {
    const modal = document.getElementById("memoryModal")
    if (modal) modal.classList.remove("visible")
}

function showAddMemoryDialog() {
    const label = getCategoryName(currentMemoryCategory)
    showMemoryModal(
        "✍️ 手动添加记忆",
        `
            <div class="memory-form-label">分类：${escapeHtml(label)}</div>
            <textarea id="newMemoryText" class="memory-textarea" placeholder="输入记忆内容..." autofocus></textarea>
        `,
        `
            <button onclick="closeMemoryModal()">取消</button>
            <button onclick="confirmAddMemory()">保存</button>
        `
    )
}

async function confirmAddMemory() {
    const text = document.getElementById("newMemoryText")?.value?.trim() || ""
    if (!text) {
        alert("内容不能为空")
        return
    }

    await saveMemoryEntry(currentMemoryContactId, text, currentMemoryCategory, "manual")
    closeMemoryModal()
    loadMemories()
}

function showMemoryEntryDialog(entryId) {
    const entry = currentMemoryRows.find(e => e.id === entryId)
    if (!entry) return

    const isAuto = getCategoryInfo(entry.category).auto || entry.source === "auto"
    showMemoryModal(
        isAuto ? "🤖 自动生成的记忆" : "📝 记忆内容",
        `<div class="memory-read-text">${escapeHtml(entry.memoryText).replaceAll("\n", "<br>")}</div>`,
        `
            <button onclick="closeMemoryModal()">关闭</button>
            ${isAuto ? "" : `<button onclick="showEditMemoryDialog('${entry.id}')">编辑</button>`}
            <button class="danger-btn" onclick="confirmDeleteMemory('${entry.id}')">删除</button>
        `
    )
}

function showEditMemoryDialog(entryId) {
    const entry = currentMemoryRows.find(e => e.id === entryId)
    if (!entry) return

    showMemoryModal(
        "编辑记忆",
        `<textarea id="editMemoryText" class="memory-textarea">${escapeHtml(entry.memoryText)}</textarea>`,
        `
            <button onclick="closeMemoryModal()">取消</button>
            <button onclick="confirmEditMemory('${entry.id}')">保存</button>
        `
    )
}

async function confirmEditMemory(entryId) {
    const text = document.getElementById("editMemoryText")?.value?.trim() || ""
    if (!text) {
        alert("内容不能为空")
        return
    }

    await updateMemoryEntryText(entryId, text)
    closeMemoryModal()
    loadMemories()
}

async function confirmDeleteMemory(entryId) {
    if (!confirm("删掉这条记忆？不可恢复。")) return
    await deleteMemoryEntryById(entryId)
    closeMemoryModal()
    loadMemories()
}

// 旧入口兼容：聊天页按钮“长期记忆”打开当前角色的分类记忆详情
function showMemoryEditor() {
    if (!currentContact) return
    showMemoryDetail(currentContact.id, currentContact.name || "角色")
}

// 旧版单条长记忆兼容读取：现在改为分类召回
async function getMemory(contactId, currentMsg = "") {
    return recallRelevantMemory(contactId, currentMsg)
}

// 旧函数兼容：把文本作为用户信息记忆追加一条
async function saveMemoryText(contactId, content) {
    return saveMemoryEntry(contactId, content, "user_info", "manual")
}

function getRecentMessages(contactId) {
    return new Promise(function(resolve) {
        const tx = db.transaction("messages", "readonly")
        const store = tx.objectStore("messages")
        const req = store.getAll()

        req.onsuccess = function() {
            const list = req.result
                .filter(m => m.contactId === contactId)
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(-Number(localStorage.getItem("MJI_CONTEXT_COUNT") || 20))

            resolve(list)
        }

        req.onerror = function() {
            resolve([])
        }
    })
}

function memoryKeywords(text) {
    return String(text || "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(" ")
        .map(s => s.trim())
        .filter(s => s.length >= 2)
        .slice(0, 8)
}

function scoreMemoryText(memoryText, currentMsg) {
    const kws = memoryKeywords(currentMsg)
    let score = 0
    for (const kw of kws) {
        if (String(memoryText).toLowerCase().includes(kw.toLowerCase())) score += 3
    }
    const head = String(currentMsg || "").slice(0, 8)
    if (head && String(memoryText).includes(head)) score += 5
    return score
}

async function recallRelevantMemory(contactId, currentMsg = "") {
    const rows = await getMemoryRows(contactId)
    if (!rows.length) return ""

    const alwaysInclude = new Set(["key_event", "user_info", "shared_event", "future_plan"])
    const fixed = rows
        .filter(r => alwaysInclude.has(r.category))
        .slice(0, 6)

    const candidates = rows
        .filter(r => !alwaysInclude.has(r.category))
        .map(r => ({ row: r, score: scoreMemoryText(r.memoryText, currentMsg) + ((Date.now() - (r.insertTime || 0)) < 7 * 24 * 60 * 60 * 1000 ? 1 : 0) }))
        .sort((a, b) => b.score - a.score || (b.row.insertTime || 0) - (a.row.insertTime || 0))
        .slice(0, 5)
        .map(x => x.row)

    const picked = [...fixed, ...candidates]
    const seen = new Set()

    return picked
        .filter(r => {
            const key = r.category + "_" + r.memoryText
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .map(r => `【${getCategoryName(r.category)}】${r.memoryText}`)
        .join("\n")
        .slice(0, 1200)
}

function buildMemoryApiUrl() {
    return getChatApiUrl()
}

async function callMemoryApi(prompt, temperature = 0.3) {
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")
    if (!apiKey || !apiModel) return ""

    try {
        const resp = await fetch(buildMemoryApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature,
                messages: [{ role: "user", content: prompt.slice(0, 4000) }]
            })
        })

        if (!resp.ok) return ""
        const data = await resp.json()
        return data.choices?.[0]?.message?.content?.trim() || ""
    } catch (e) {
        console.log("记忆API失败", e)
        return ""
    }
}

function todayMemoryLabel() {
    const d = new Date()
    return (d.getMonth() + 1) + "月" + d.getDate() + "日"
}

async function trimMemoryCategory(contactId, category, max = 50) {
    const rows = await getMemoryRows(contactId, category)
    if (rows.length <= max) return

    const toDelete = rows.slice(max)
    for (const row of toDelete) {
        await deleteMemoryEntryById(row.id)
    }
}

async function getContactById(contactId) {
    const contacts = await getAllStoreData("contacts")
    return contacts.find(c => c.id === contactId) || null
}

async function getMyDisplayName() {
    return localStorage.getItem("MJI_MY_NAME") || "用户"
}

async function checkAndSummarizeMemory(contactId, contactName = "角色") {
    if (!contactId || memoryRunningSet.has("summary_" + contactId)) return

    memoryRunningSet.add("summary_" + contactId)

    try {
        const messages = await getAllStoreData("messages")
        const moments = await getAllStoreData("moments")

        const privateMsgs = messages
            .filter(m => m.contactId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)

        const groupMsgs = messages
            .filter(m => m.senderId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-10)

        const aiMoments = moments
            .filter(m => m.authorId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-5)

        const totalCount = privateMsgs.length + groupMsgs.length + aiMoments.length
        if (totalCount < 30) return

        const lastCountKey = "MJI_MEMORY_LAST_COUNT_" + contactId
        const lastRunKey = "MJI_MEMORY_LAST_RUN_" + contactId
        const lastCount = Number(localStorage.getItem(lastCountKey) || 0)
        const lastRun = Number(localStorage.getItem(lastRunKey) || 0)
        const now = Date.now()

        if (lastCount > 0 && totalCount - lastCount < 30) return
        if (now - lastRun < 10 * 60 * 1000) return

        localStorage.setItem(lastRunKey, String(now))

        const myName = await getMyDisplayName()
        const chatLines = privateMsgs.slice(-40).map(m => `${m.role === "user" ? myName : contactName}：${String(m.content || "").slice(0, 220)}`)
        const groupLines = groupMsgs.map(m => `[群聊]${contactName}：${String(m.content || "").slice(0, 160)}`)
        const momentLines = aiMoments.map(m => `[朋友圈]${contactName} 发了动态：${String(m.content || "").slice(0, 160)}`)
        const allContent = [...chatLines, ...groupLines, ...momentLines].join("\n").slice(-3600)
        if (!allContent) return

        const today = todayMemoryLabel()
        const existedToday = (await getMemoryRows(contactId, "timeline"))
            .filter(r => r.memoryText.includes(today))
            .length
        if (existedToday >= 3) return

        const prompt = `
请将以下互动总结为「${contactName}」的长期记忆片段。
要求：
1. 保留关键情节、${myName} 的喜好、重要承诺、情绪变化
2. 用第三人称简洁描述，100字以内，称呼对方时用「${myName}」而不是「用户」
3. 开头标注时间：${today}
4. 只输出记忆正文，不要解释

互动内容：
${allContent}
        `.trim()

        const summary = await callMemoryApi(prompt, 0.3)
        if (!summary) {
            localStorage.setItem(lastCountKey, String(totalCount))
            return
        }

        await saveMemoryEntry(contactId, "[时间线]" + summary.slice(0, 300), "timeline", "auto")
        await trimMemoryCategory(contactId, "timeline", 50)
        localStorage.setItem(lastCountKey, String(totalCount))

    } catch (e) {
        console.log("时间线记忆失败", e)
    } finally {
        memoryRunningSet.delete("summary_" + contactId)
    }
}

async function checkKeyEvent(contactId, contactName, userMsg, aiReply) {
    if (!contactId) return

    const combined = String(userMsg || "") + String(aiReply || "")
    const keyEventWords = [
        "喜欢你", "爱你", "表白", "在一起", "想你",
        "生日", "纪念日", "约定", "答应我", "记住",
        "对不起", "吵架", "误会", "和好", "第一次", "第一个",
        "从来没有", "永远", "秘密", "只告诉你", "不能告诉别人",
        "i like you", "i love you", "promise", "never forget", "birthday", "anniversary"
    ]

    if (!keyEventWords.some(w => combined.toLowerCase().includes(w.toLowerCase()))) return

    const lockKey = "key_" + contactId + "_" + combined.slice(0, 20)
    if (memoryRunningSet.has(lockKey)) return
    memoryRunningSet.add(lockKey)

    try {
        const dateStr = todayMemoryLabel()
        const prompt = `
以下是一段对话中的关键时刻，请用一句话（30字以内）提炼为核心记忆片段。
格式：[${dateStr}] + 一句话描述
只输出这一句话，不要其他内容。

对话：
我：${String(userMsg || "").slice(0, 300)}
${contactName}：${String(aiReply || "").slice(0, 300)}
        `.trim()

        let memory = await callMemoryApi(prompt, 0.3)
        if (!memory) memory = `[${dateStr}] ${combined.slice(0, 60)}`

        await saveMemoryEntry(contactId, "[关键]" + memory.slice(0, 120), "key_event", "auto")
        await trimMemoryCategory(contactId, "key_event", 50)
    } catch (e) {
        console.log("关键记忆失败", e)
    } finally {
        memoryRunningSet.delete(lockKey)
    }
}

async function checkAiLifeEvent(contactId, contactName, aiMsg) {
    if (!contactId || !aiMsg || String(aiMsg).length < 10) return

    const lifeKeywords = ["今天", "刚才", "刚刚", "任务", "回来", "去了", "遇到", "发生", "看到", "听说", "完成", "结束", "出发", "到了"]
    if (!lifeKeywords.some(w => String(aiMsg).includes(w))) return

    try {
        const dateStr = todayMemoryLabel()
        const todayRows = await getMemoryRows(contactId, "ai_life")
        if (todayRows.filter(r => r.memoryText.includes(dateStr)).length >= 3) return

        await saveMemoryEntry(contactId, `[${dateStr}] ${contactName} 说：${String(aiMsg).slice(0, 80)}`, "ai_life", "auto")
        await trimMemoryCategory(contactId, "ai_life", 50)
    } catch (e) {
        console.log("AI生活记忆失败", e)
    }
}

async function afterAiMessageMemoryChecks(contactId, contactName, userMsg, aiReply) {
    try {
        await checkAiLifeEvent(contactId, contactName, aiReply)
        await checkKeyEvent(contactId, contactName, userMsg, aiReply)
        checkAndSummarizeMemory(contactId, contactName)
    } catch (e) {
        console.log("记忆检查失败", e)
    }
}

// 兼容旧调用：AI回复后触发
async function maybeExtractMemory() {
    if (!currentContact) return
    const messages = await getRecentMessages(currentContact.id)
    const lastUser = [...messages].reverse().find(m => m.role === "user")
    const lastAi = [...messages].reverse().find(m => m.role === "assistant")
    if (!lastAi) return
    afterAiMessageMemoryChecks(currentContact.id, currentContact.name || "角色", lastUser?.content || "", lastAi.content || "")
}

// 兼容旧函数名：不再做旧版“整块提取”，避免重复写大段记忆
async function extractMemory(messages) {
    return maybeExtractMemory()
}
