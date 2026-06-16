// 朋友圈模块
// 功能：朋友圈列表、用户发动态、AI发动态、点赞、评论、AI围观回应、删除动态

function getMyProfileForMoments() {
    return {
        id: "me",
        name: localStorage.getItem("MJI_MY_NAME") || "我",
        avatar: localStorage.getItem("MJI_MY_AVATAR") || ""
    }
}

function getMomentCover() {
    return localStorage.getItem("MJI_MOMENT_COVER") || ""
}

async function setMomentCoverFromFile(inputId = "momentCoverFile") {
    const file = document.getElementById(inputId)?.files?.[0]
    if (!file) return

    const base64 = await fileToBase64(file)
    localStorage.setItem("MJI_MOMENT_COVER", base64)
    showMoments()
}

async function showMoments() {

    currentPage = "moments"

    const root = document.getElementById("momentsRoot") || document.getElementById("appContent")
    if (!root) return

    const my = getMyProfileForMoments()
    const cover = getMomentCover()

    root.innerHTML = `
        <div class="moments-page">

            <div class="moments-cover" style="${cover ? `background-image:url(${cover})` : ""}">
                <label class="moments-cover-btn">
                    换封面
                    <input id="momentCoverFile" type="file" accept="image/*" onchange="setMomentCoverFromFile()">
                </label>

                <div class="moments-my-info">
                    <div class="moments-my-name">
                        ${escapeHtml(my.name)}
                    </div>

                    <div class="moments-my-avatar">
                        ${avatarHtml(my.avatar, "👤")}
                    </div>
                </div>
            </div>

            <div class="moments-actions">
                <button onclick="showAddMoment()">
                    ＋ 发动态
                </button>

                <button onclick="generateAiMoment()">
                    🔮 AI发一条
                </button>
            </div>

            <div id="momentList"></div>
        </div>
    `

    loadMoments()
}

async function loadMoments() {

    const box = document.getElementById("momentList")
    if (!box) return

    const [moments, likes, comments, contacts] = await Promise.all([
        getAllStoreData("moments"),
        getAllStoreData("momentLikes"),
        getAllStoreData("momentComments"),
        getAllStoreData("contacts")
    ])

    const my = getMyProfileForMoments()

    const sorted = moments
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (sorted.length === 0) {
        box.innerHTML = `<p class="empty">还没有朋友圈动态。</p>`
        return
    }

    let html = ""

    sorted.forEach(function(moment) {

        const author = getMomentAuthor(moment, contacts, my)
        const momentLikes = likes.filter(l => l.momentId === moment.id)
        const momentComments = comments
            .filter(c => c.momentId === moment.id)
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))

        const iLiked = momentLikes.some(l => l.userId === my.id)

        html += `
            <div class="moment-card" data-moment-id="${moment.id}">
                <div class="moment-avatar">
                    ${avatarHtml(author.avatar, "🙂")}
                </div>

                <div class="moment-body">
                    <div class="moment-name">
                        ${escapeHtml(author.name)}
                    </div>

                    <div class="moment-content">
                        ${escapeHtml(moment.content || "")}
                    </div>

                    ${
                        moment.translatedText
                        ? `
                            <div class="moment-translation hidden" id="momentTrans_${moment.id}">
                                ${escapeHtml(moment.translatedText)}
                            </div>

                            <button class="moment-small-btn" onclick="toggleMomentTranslation('${moment.id}')">
                                查看翻译
                            </button>
                        `
                        : ""
                    }

                    ${renderMomentImage(moment)}

                    <div class="moment-time-row">
                        <span>${formatMomentTime(moment.createdAt)}</span>

                        <div class="moment-action-links">
                            <button onclick="toggleMomentLike('${moment.id}')">
                                ${iLiked ? "❤️" : "🤍"} 赞
                            </button>

                            <button onclick="showMomentCommentBox('${moment.id}')">
                                评论
                            </button>

                            <button onclick="triggerMomentAiReactions('${moment.id}', true)">
                                AI围观
                            </button>

                            <button onclick="deleteMoment('${moment.id}')">
                                删除
                            </button>
                        </div>
                    </div>

                    ${renderMomentInteractions(moment.id, momentLikes, momentComments)}
                </div>
            </div>
        `
    })

    box.innerHTML = html
}

function getMomentAuthor(moment, contacts, my) {
    if (moment.authorType === "user" || moment.authorId === my.id) {
        return my
    }

    const c = contacts.find(item => item.id === moment.authorId)

    return {
        id: c?.id || moment.authorId || "unknown",
        name: c?.name || moment.authorName || "神秘人",
        avatar: c?.avatar || moment.authorAvatar || ""
    }
}

function renderMomentImage(moment) {

    if (moment.image) {
        return `
            <img class="moment-image" src="${moment.image}">
        `
    }

    if (moment.imagePrompt) {
        return `
            <div class="moment-image-prompt">
                🖼️ ${escapeHtml(moment.imagePrompt)}
            </div>
        `
    }

    return ""
}

function renderMomentInteractions(momentId, likes, comments) {

    if (likes.length === 0 && comments.length === 0) {
        return ""
    }

    const likeNames = likes.map(l => l.userName).filter(Boolean).join("、")

    let commentsHtml = ""

    comments.forEach(function(c) {
        commentsHtml += `
            <div class="moment-comment" onclick="replyMomentComment('${momentId}', '${c.id}')">
                <span>${escapeHtml(c.userName || "匿名")}：</span>
                ${c.replyToName ? `<em>回复 ${escapeHtml(c.replyToName)}：</em>` : ""}
                ${escapeHtml(c.content || "")}
                ${c.translatedText ? `<div class="moment-comment-trans">${escapeHtml(c.translatedText)}</div>` : ""}
            </div>
        `
    })

    return `
        <div class="moment-interactions">
            ${likes.length > 0 ? `<div class="moment-likes">❤️ ${escapeHtml(likeNames)}</div>` : ""}
            ${commentsHtml}
        </div>
    `
}

function showAddMoment() {

    currentPage = "addMoment"

    document.getElementById("appTitle").innerText = "发朋友圈"

    document.getElementById("appContent").innerHTML = `
        <div class="form moment-editor">
            <textarea id="momentContent" placeholder="这一刻的想法..."></textarea>

            <label class="file-label">配图，可不选</label>
            <input type="file" id="momentImageFile" accept="image/*">

            <button onclick="saveMyMoment()">
                发布
            </button>
        </div>
    `
}

async function saveMyMoment() {

    const content = document.getElementById("momentContent")?.value?.trim() || ""
    const file = document.getElementById("momentImageFile")?.files?.[0]

    if (!content && !file) {
        alert("好歹写点字或发张图吧")
        return
    }

    const my = getMyProfileForMoments()

    let image = ""
    if (file) {
        image = await fileToBase64(file)
    }

    const moment = {
        id: "moment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        authorId: my.id,
        authorType: "user",
        authorName: my.name,
        authorAvatar: my.avatar,
        content,
        translatedText: "",
        image,
        imagePrompt: "",
        createdAt: Date.now()
    }

    await putStoreItem("moments", moment)

    alert("动态已发布，AI正在围观")

    openApp("moments")

    triggerMomentAiReactions(moment.id, false)
}

function putStoreItem(storeName, item) {
    return new Promise(resolve => {
        const tx = db.transaction(storeName, "readwrite")
        tx.objectStore(storeName).put(item)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

function deleteStoreItem(storeName, id) {
    return new Promise(resolve => {
        const tx = db.transaction(storeName, "readwrite")
        tx.objectStore(storeName).delete(id)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
    })
}

async function toggleMomentLike(momentId) {

    const my = getMyProfileForMoments()
    const likes = await getAllStoreData("momentLikes")

    const old = likes.find(l => l.momentId === momentId && l.userId === my.id)

    if (old) {
        await deleteStoreItem("momentLikes", old.id)
    } else {
        await putStoreItem("momentLikes", {
            id: "like_" + momentId + "_" + my.id,
            momentId,
            userId: my.id,
            userName: my.name,
            createdAt: Date.now()
        })
    }

    loadMoments()
}

async function showMomentCommentBox(momentId) {

    const text = prompt("写评论")
    if (!text || !text.trim()) return

    const my = getMyProfileForMoments()

    const comment = {
        id: "comment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        momentId,
        userId: my.id,
        userName: my.name,
        content: text.trim(),
        translatedText: "",
        replyToId: "",
        replyToName: "",
        createdAt: Date.now()
    }

    await putStoreItem("momentComments", comment)

    loadMoments()

    triggerMomentCommentReply(momentId, comment)
}

async function replyMomentComment(momentId, commentId) {

    const comments = await getAllStoreData("momentComments")
    const target = comments.find(c => c.id === commentId)

    if (!target) return

    const text = prompt("回复 " + target.userName)
    if (!text || !text.trim()) return

    const my = getMyProfileForMoments()

    const reply = {
        id: "comment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        momentId,
        userId: my.id,
        userName: my.name,
        content: text.trim(),
        translatedText: "",
        replyToId: target.id,
        replyToName: target.userName,
        createdAt: Date.now()
    }

    await putStoreItem("momentComments", reply)

    loadMoments()

    triggerMomentCommentReply(momentId, reply)
}

function toggleMomentTranslation(momentId) {
    const el = document.getElementById("momentTrans_" + momentId)
    if (!el) return
    el.classList.toggle("hidden")
}

async function generateAiMoment() {

    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiKey || !apiModel) {
        alert("请先配置API")
        return
    }

    const contacts = await getAllStoreData("contacts")
    if (contacts.length === 0) {
        alert("还没有角色，先添加联系人")
        return
    }

    const poster = contacts[Math.floor(Math.random() * contacts.length)]
    const memory = safeMemory(await getMemory(poster.id), 1200)
    const timeText = getMomentTimeContext()

    document.getElementById("momentList")?.insertAdjacentHTML(
        "afterbegin",
        `<p class="empty" id="momentGenerating">${escapeHtml(poster.name)} 正在发朋友圈...</p>`
    )

    try {
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
                        role: "system",
                        content: `
你正在扮演一个真实的人发朋友圈。
不要说自己是AI。
不要解释。
不要旁白。
只输出朋友圈正文。
可选：如果这条动态需要配图，最后另起一行写【图片：画面描述】。
如果使用外语并需要中文解释，最后写【翻译】中文翻译。
`
                    },
                    {
                        role: "user",
                        content: `
【当前时间】
${timeText}

【角色资料】
姓名：${poster.name || ""}
身份：${poster.identity || ""}
性格：${poster.personality || ""}
简介：${poster.profile || ""}
角色设定：${poster.prompt || ""}

【长期记忆】
${memory || "暂无"}

请让这个角色发一条自然的朋友圈。
`
                    }
                ]
            })
        })

        const data = await response.json()
        document.getElementById("momentGenerating")?.remove()

        if (!response.ok) {
            alert("AI发动态失败：" + (data.error?.message || response.status))
            return
        }

        const raw = data.choices?.[0]?.message?.content?.trim() || ""
        if (!raw) {
            alert("AI没有返回内容")
            return
        }

        const parsed = parseMomentText(raw)

        const moment = {
            id: "moment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
            authorId: poster.id,
            authorType: "ai",
            authorName: poster.name,
            authorAvatar: poster.avatar,
            content: parsed.content,
            translatedText: parsed.translatedText,
            image: "",
            imagePrompt: parsed.imagePrompt,
            createdAt: Date.now()
        }

        await putStoreItem("moments", moment)

        loadMoments()

        triggerMomentAiReactions(moment.id, false)

    } catch (e) {
        document.getElementById("momentGenerating")?.remove()
        alert("AI发动态失败：" + e.message)
    }
}

function getMomentTimeContext() {
    const d = new Date()
    const hour = d.getHours()
    let period = ""

    if (hour >= 5 && hour <= 8) period = "清晨，大多数人刚起床或准备出门"
    else if (hour >= 9 && hour <= 11) period = "上午，正常工作学习时间"
    else if (hour >= 12 && hour <= 13) period = "中午，午饭或午休时间"
    else if (hour >= 14 && hour <= 16) period = "下午，正常活动时间"
    else if (hour >= 17 && hour <= 18) period = "傍晚，下班放学时间"
    else if (hour >= 19 && hour <= 21) period = "晚上，大多数人在休息或娱乐"
    else if (hour >= 22 && hour <= 23) period = "深夜，大多数人已入睡或准备睡觉"
    else period = "凌晨，绝大多数人在睡觉"

    return d.toLocaleString() + "｜" + period
}

function parseMomentText(raw) {
    let text = String(raw || "").trim()
    let imagePrompt = ""
    let translatedText = ""

    const imageMatch = text.match(/【图片[:：]([\s\S]*?)】/)
    if (imageMatch) {
        imagePrompt = imageMatch[1].trim()
        text = text.replace(imageMatch[0], "").trim()
    }

    const transMatch = text.match(/【翻译】([\s\S]+)$/)
    if (transMatch) {
        translatedText = transMatch[1].trim()
        text = text.substring(0, transMatch.index).trim()
    }

    return {
        content: text,
        imagePrompt,
        translatedText
    }
}

async function triggerMomentAiReactions(momentId, showAlert = false) {

    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiKey || !apiModel) {
        if (showAlert) alert("请先配置API")
        return
    }

    const [moments, contacts, likes, comments] = await Promise.all([
        getAllStoreData("moments"),
        getAllStoreData("contacts"),
        getAllStoreData("momentLikes"),
        getAllStoreData("momentComments")
    ])

    const moment = moments.find(m => m.id === momentId)
    if (!moment) return

    const my = getMyProfileForMoments()
    const author = getMomentAuthor(moment, contacts, my)

    let reactors = contacts.filter(c => c.id !== moment.authorId)

    if (reactors.length === 0) return

    reactors = reactors
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)

    if (showAlert) {
        alert("AI开始围观")
    }

    const promptReactors = []

    for (const c of reactors) {
        const memory = safeMemory(await getMemory(c.id), 500)
        promptReactors.push(`
角色ID：${c.id}
姓名：${c.name || ""}
身份：${c.identity || ""}
性格：${c.personality || ""}
简介：${c.profile || ""}
角色设定：${c.prompt || ""}
长期记忆：${memory || "暂无"}
`)
    }

    const existingText = comments
        .filter(c => c.momentId === moment.id)
        .map(c => `${c.userName}：${c.content}`)
        .join("\n")

    try {
        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.78,
                messages: [
                    {
                        role: "system",
                        content: `
你正在为朋友圈生成多个角色的社交反应。
必须按角色分别输出。
不要解释。
不要旁白。
必须遵守角色与发帖人的关系，不要越界暧昧。

每个角色输出格式：
[ROLE:角色ID]
LIKE: yes/no
COMMENT: 评论内容，可留空
DM: 私聊内容，可留空

评论要像真实朋友圈，简短自然。
私聊不是必须，只有很想私下说才写。
`
                    },
                    {
                        role: "user",
                        content: `
【发帖人】
${author.name}

【朋友圈内容】
${moment.content}

【配图】
${moment.imagePrompt || (moment.image ? "用户发了图片" : "无")}

【已有评论】
${existingText || "暂无"}

【需要反应的角色】
${promptReactors.join("\n---\n")}

请生成这些角色的点赞、评论、私聊反应。
`
                    }
                ]
            })
        })

        const data = await response.json()

        if (!response.ok) {
            if (showAlert) alert("AI围观失败：" + (data.error?.message || response.status))
            return
        }

        const raw = data.choices?.[0]?.message?.content?.trim() || ""
        const parsed = parseMomentReactions(raw, reactors)

        for (const item of parsed) {
            await applyMomentReaction(moment, item, likes)
        }

        loadMoments()
        updateDesktopUnreadBadge()

    } catch (e) {
        if (showAlert) alert("AI围观失败：" + e.message)
    }
}

function parseMomentReactions(raw, reactors) {

    const text = String(raw || "").trim()
    const result = []

    const blocks = text
        .split(/\[ROLE:/)
        .map(t => t.trim())
        .filter(Boolean)

    blocks.forEach(function(block) {
        const end = block.indexOf("]")
        if (end === -1) return

        const id = block.substring(0, end).trim()
        const body = block.substring(end + 1).trim()
        const contact = reactors.find(c => c.id === id)
        if (!contact) return

        const likeMatch = body.match(/LIKE[:：]\s*(yes|no|true|false|是|否)/i)
        const commentMatch = body.match(/COMMENT[:：]\s*([\s\S]*?)(?=\n\s*DM[:：]|$)/i)
        const dmMatch = body.match(/DM[:：]\s*([\s\S]*)$/i)

        const likeRaw = likeMatch ? likeMatch[1].toLowerCase() : "no"

        result.push({
            contact,
            like: ["yes", "true", "是"].includes(likeRaw),
            comment: cleanMomentAiText(commentMatch ? commentMatch[1] : ""),
            dm: cleanMomentAiText(dmMatch ? dmMatch[1] : "")
        })
    })

    return result
}

function cleanMomentAiText(text) {
    return String(text || "")
        .replace(/^无$/, "")
        .replace(/^none$/i, "")
        .replace(/^null$/i, "")
        .replace(/^["“”]+|["“”]+$/g, "")
        .trim()
}

async function applyMomentReaction(moment, reaction, existingLikes) {

    const c = reaction.contact

    if (reaction.like) {
        const existed = existingLikes.some(l => l.momentId === moment.id && l.userId === c.id)

        if (!existed) {
            await putStoreItem("momentLikes", {
                id: "like_" + moment.id + "_" + c.id,
                momentId: moment.id,
                userId: c.id,
                userName: c.name,
                createdAt: Date.now()
            })
        }
    }

    if (reaction.comment) {
        await putStoreItem("momentComments", {
            id: "comment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
            momentId: moment.id,
            userId: c.id,
            userName: c.name,
            content: reaction.comment,
            translatedText: "",
            replyToId: "",
            replyToName: "",
            createdAt: Date.now()
        })
    }

    if (reaction.dm && moment.authorType === "user") {
        saveMessage(
            c.id,
            "assistant",
            reaction.dm,
            Date.now()
        )

        await increaseContactUnread(c.id)
    }
}

async function increaseContactUnread(contactId) {

    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === contactId)

    if (!contact) return

    contact.unreadCount = (contact.unreadCount || 0) + 1
    contact.updatedAt = Date.now()

    await putStoreItem("contacts", contact)
}

async function triggerMomentCommentReply(momentId, userComment) {

    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiKey || !apiModel) return

    const [moments, contacts] = await Promise.all([
        getAllStoreData("moments"),
        getAllStoreData("contacts")
    ])

    const moment = moments.find(m => m.id === momentId)
    if (!moment) return

    let target = contacts.find(c => c.id === moment.authorId)

    if (!target && contacts.length > 0) {
        target = contacts[Math.floor(Math.random() * contacts.length)]
    }

    if (!target) return

    try {
        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.8,
                messages: [
                    {
                        role: "system",
                        content: `
你正在扮演朋友圈里的角色回复评论。
不要解释。
不要旁白。
输出格式：
【评论】评论回复内容
【私聊】可选私聊内容
评论不超过25字，像真实朋友圈。
`
                    },
                    {
                        role: "user",
                        content: `
【角色】
姓名：${target.name}
身份：${target.identity || ""}
性格：${target.personality || ""}
简介：${target.profile || ""}
设定：${target.prompt || ""}

【动态】
${moment.content}

【用户评论】
${userComment.userName}：${userComment.content}

请自然回复。
`
                    }
                ]
            })
        })

        const data = await response.json()
        if (!response.ok) return

        const raw = data.choices?.[0]?.message?.content?.trim() || ""
        if (!raw) return

        const commentText = extractTaggedText(raw, "评论") || raw
        const dmText = extractTaggedText(raw, "私聊") || ""

        if (commentText) {
            await putStoreItem("momentComments", {
                id: "comment_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                momentId,
                userId: target.id,
                userName: target.name,
                content: cleanMomentAiText(commentText),
                translatedText: "",
                replyToId: userComment.id,
                replyToName: userComment.userName,
                createdAt: Date.now()
            })
        }

        if (dmText && moment.authorType === "user") {
            saveMessage(target.id, "assistant", cleanMomentAiText(dmText), Date.now())
            await increaseContactUnread(target.id)
            updateDesktopUnreadBadge()
        }

        loadMoments()

    } catch (e) {
        console.log("朋友圈评论AI回复失败", e)
    }
}

function extractTaggedText(raw, tag) {
    const text = String(raw || "")
    const re = new RegExp("【" + tag + "】([\\s\\S]*?)(?=【|$)")
    const match = text.match(re)
    return match ? match[1].trim() : ""
}

async function deleteMoment(momentId) {

    if (!confirm("确定删除这条动态吗？")) return

    const [likes, comments] = await Promise.all([
        getAllStoreData("momentLikes"),
        getAllStoreData("momentComments")
    ])

    await deleteStoreItem("moments", momentId)

    for (const l of likes.filter(item => item.momentId === momentId)) {
        await deleteStoreItem("momentLikes", l.id)
    }

    for (const c of comments.filter(item => item.momentId === momentId)) {
        await deleteStoreItem("momentComments", c.id)
    }

    loadMoments()
}

function formatMomentTime(time) {
    if (!time) return ""
    const d = new Date(time)
    const now = new Date()

    const sameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()

    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")

    if (sameDay) {
        return h + ":" + m
    }

    return `${d.getMonth() + 1}-${d.getDate()} ${h}:${m}`
}
