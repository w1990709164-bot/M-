async function loadGroups() {

    const groups =
        await getAllStoreData("groups")

    const box =
        document.getElementById("groupList")

    if (!box) return

    if (groups.length === 0) {
        box.innerHTML =
            `<p class="empty">还没有群聊，先建一个。</p>`
        return
    }

    let html = ""

    groups
        .sort((a, b) =>
            (b.updatedAt || b.createdAt || 0) -
            (a.updatedAt || a.createdAt || 0)
        )
        .forEach(function(group) {

            const count =
                group.memberIds
                ? group.memberIds.length
                : 0

            const unread =
                group.unreadCount || 0

            html += `
                <div class="contact" onclick="openGroupChat('${group.id}')">
                    <div class="contact-avatar">
                        ${avatarHtml(group.avatar, "👥")}
                    </div>

                    <div class="contact-info">
                        <div class="chat-list-top">
                            <div class="contact-name">
                                ${escapeHtml(group.name)}
                            </div>

                            <div class="chat-list-time">
                                群聊
                            </div>
                        </div>

                        <div class="chat-list-bottom">
                            <div class="contact-sub">
                                ${count} 个成员${group.observeOnly ? "｜围观模式" : ""}
                            </div>

                            ${
                                unread > 0
                                ?
                                `<div class="unread-badge">
                                    ${unread > 99 ? "99+" : unread}
                                 </div>`
                                :
                                ""
                            }
                        </div>
                    </div>
                </div>
            `
        })

    box.innerHTML = html
}

async function showCreateGroup() {

    currentPage = "createGroup"

    document.getElementById("appTitle").innerText =
        "新建群聊"

    const contacts =
        await getAllStoreData("contacts")

    let memberHtml = ""

    contacts.forEach(function(c) {

        memberHtml += `
            <label class="group-member-row">
                <input type="checkbox"
                       class="group-member-check"
                       value="${c.id}">

                <div class="contact-avatar small-avatar">
                    ${avatarHtml(c.avatar, "🙂")}
                </div>

                <span>${escapeHtml(c.name)}</span>
            </label>
        `
    })

    document.getElementById("appContent").innerHTML = `
        <div class="form">
            <input id="groupName"
                   placeholder="群聊名字，例如 141小队">

            <div class="group-member-list">
                ${memberHtml || "<p class='empty'>还没有联系人。</p>"}
            </div>

            <button onclick="saveGroup()">
                保存群聊
            </button>
        </div>
    `
}

function saveGroup() {

    const name =
        document
            .getElementById("groupName")
            .value
            .trim()

    if (!name) {
        alert("群聊名字不能为空")
        return
    }

    const checks =
        Array.from(
            document.querySelectorAll(
                ".group-member-check:checked"
            )
        )

    const memberIds =
        checks.map(c => c.value)

    if (memberIds.length < 2) {
        alert("群聊至少选择2个角色")
        return
    }

    const memberMeta = {}

    memberIds.forEach(function(id) {
        memberMeta[id] = {
            nickname: "",
            title: ""
        }
    })

    const group = {
        id: "group_" + Date.now(),
        name,
        avatar: "",
        memberIds,
        memberMeta,
        observeOnly: false,
        unreadCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
    }

    const tx =
        db.transaction(
            "groups",
            "readwrite"
        )

    tx.objectStore("groups")
        .put(group)

    tx.oncomplete = function() {
        openApp("groups")
    }

    tx.onerror = function() {
        alert("群聊保存失败")
    }
}

async function openGroupChat(groupId) {

    currentPage = "groupChat"

    const groups =
        await getAllStoreData("groups")

    currentGroup =
        groups.find(g => g.id === groupId)

    if (!currentGroup) {
        alert("群聊不存在")
        return
    }

    document.getElementById("appTitle").innerText =
        currentGroup.name

    const observeOnly =
        currentGroup.observeOnly === true

    document.getElementById("appContent").innerHTML = `
        <div class="group-top-actions">
            <button class="memory-entry" onclick="showGroupInfo()">
                群聊资料
            </button>

            <button class="memory-entry" onclick="toggleGroupSearch()">
                搜索聊天
            </button>
        </div>

        <div id="groupSearchBar" class="group-search-bar hidden">
            <input id="groupSearchInput"
                   placeholder="搜索群聊记录"
                   oninput="searchGroupMessages()">

            <button onclick="clearGroupSearch()">取消</button>
        </div>

        <div id="chatBox" class="chat-box"></div>

        ${
            observeOnly
            ?
            `
            <div class="chat-input">
                <input id="observeGuideInput" placeholder="输入引导词，可不填">
                <button onclick="triggerObserveGroupReply()">触发对话</button>
            </div>
            `
            :
            `
            <div class="chat-input">
                <input id="groupMessageInput" placeholder="在群里说点什么">
                <button onclick="sendGroupMessage()">发送</button>
                <button onclick="groupAiReply()">群友回复</button>
            </div>
            `
        }
    `

    await clearGroupUnread(groupId)

    loadGroupMessages(groupId)
}

async function loadGroupMessages(groupId, keyword = "") {

    const box =
        document.getElementById("chatBox")

    if (!box) return

    const messages =
        await getAllStoreData("messages")

    const contacts =
        await getAllStoreData("contacts")

    let list =
        messages
            .filter(m => m.contactId === groupId)
            .sort((a, b) => a.createdAt - b.createdAt)

    if (keyword) {
        list =
            list.filter(m =>
                String(m.content || "")
                    .includes(keyword)
            )
    }

    let html = ""

    list.forEach(function(m) {

        const timeText =
            formatMsgTime(m.createdAt)

        if (m.role === "user") {

            html += `
                <div class="chat-row user-row">
                    <div class="msg-wrap user-wrap">
                        <div class="msg user-msg">
                            ${renderGroupMessageContent(m)}
                        </div>
                        <div class="msg-time">${timeText}</div>
                    </div>

                    <div class="chat-avatar">
                        ${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}
                    </div>
                </div>
            `

        } else {

            const sender =
                contacts.find(c => c.id === m.senderId)

            const display =
                getGroupMemberDisplayName(
                    currentGroup,
                    sender
                )

            html += `
                <div class="chat-row ai-row">
                    <div class="chat-avatar">
                        ${avatarHtml(sender?.avatar, "🙂")}
                    </div>

                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">
                            ${escapeHtml(display)}
                        </div>

                        <div class="msg ai-msg">
                            ${renderGroupMessageContent(m)}
                        </div>

                        <div class="msg-time">${timeText}</div>
                    </div>
                </div>
            `
        }
    })

    box.innerHTML =
        html || `<p class="empty">暂无群聊消息</p>`

    box.scrollTop = box.scrollHeight
}

async function getGroupRecentMessages(groupId) {

    const messages =
        await getAllStoreData("messages")

    return messages
        .filter(m => m.contactId === groupId)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-30)
}

async function clearGroupUnread(groupId) {

    const groups =
        await getAllStoreData("groups")

    const group =
        groups.find(g => g.id === groupId)

    if (!group) return

    group.unreadCount = 0

    const tx =
        db.transaction(
            "groups",
            "readwrite"
        )

    tx.objectStore("groups")
        .put(group)
}

function sendGroupMessage() {

    if (!currentGroup) return

    const input =
        document.getElementById("groupMessageInput")

    const text =
        input.value.trim()

    if (!text) return

    const now =
        Date.now()

    saveMessage(
        currentGroup.id,
        "user",
        text,
        now
    )

    currentGroup.updatedAt =
        now

    updateGroup(currentGroup)

    input.value = ""

    loadGroupMessages(currentGroup.id)
}

async function groupAiReply(guideText = "") {

    if (!currentGroup) return

    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        alert("请先配置API")
        return
    }

    const contacts =
        await getAllStoreData("contacts")

    const members =
        contacts.filter(c =>
            currentGroup.memberIds.includes(c.id)
        )

    if (members.length === 0) {
        alert("群聊里没有成员")
        return
    }

    const speakerCount =
        Math.min(
            members.length,
            Math.floor(Math.random() * 3) + 2
        )

    const speakers =
        members
            .slice()
            .sort(() => Math.random() - 0.5)
            .slice(0, speakerCount)

    const groupMessages =
        await getGroupRecentMessages(currentGroup.id)

    const chatText =
        groupMessages
            .map(m => {
                if (m.role === "user") {
                    return "用户：" + m.content
                }

                const sender =
                    members.find(c => c.id === m.senderId)

                return `${getGroupMemberDisplayName(currentGroup, sender)}：${m.content}`
            })
            .join("\n")

    const box =
        document.getElementById("chatBox")

    const thinkingId =
        "groupThinking_" + Date.now()

    box.innerHTML += `
        <div id="${thinkingId}" class="chat-row ai-row">
            <div class="chat-avatar">
                👥
            </div>

            <div class="msg-wrap ai-wrap">
                <div class="msg ai-msg typing-msg">
                    群友正在输入中...
                </div>
            </div>
        </div>
    `

    box.scrollTop = box.scrollHeight

    try {

        const response =
            await fetch(
                getChatApiUrl(),
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + apiKey
                    },

                    body: JSON.stringify({
                        model: apiModel,

                        messages: [
                            {
                                role: "system",
                                content: `
你正在生成一个AI群聊里的真实群聊片段。

你不是助手。
不要解释。
不要旁白。
不要动作描写。
不要写小说。

你必须让指定的2到4个角色依次发言。

输出格式必须严格如下：

[SPEAKER:角色ID]
消息内容

[SPEAKER:角色ID]
消息内容

每个角色只说1条。
每条不超过40字。
不要重复同一个意思。
像真实群聊。
`
                            },
                            {
                                role: "user",
                                content: `
【群聊名称】
${currentGroup.name}

【用户引导】
${guideText || "无"}

【本轮发言角色】
${speakers.map(s => {
    return `
角色ID：${s.id}
姓名：${getGroupMemberDisplayName(currentGroup, s)}
身份：${s.identity || ""}
性格：${s.personality || ""}
简介：${s.profile || ""}
角色设定：${s.prompt || ""}
`
}).join("\n")}

【全部群成员】
${members.map(m => getGroupMemberDisplayName(currentGroup, m)).join("、")}

【最近群聊】
${chatText || "暂无"}

请生成这一轮群聊。
`
                            }
                        ]
                    })
                }
            )

        const data =
            await response.json()

        const thinking =
            document.getElementById(thinkingId)

        if (thinking) thinking.remove()

        if (!response.ok) {
            alert("群友回复失败：" + (data.error?.message || response.status))
            return
        }

        const raw =
            data.choices?.[0]?.message?.content?.trim()

        if (!raw) {
            alert("群友没有回复内容")
            return
        }

        const parsed =
            parseGroupAiReplies(raw, speakers)

        if (parsed.length === 0) {
            alert("群聊回复解析失败")
            console.log("群聊AI原文：", raw)
            return
        }

        await showGroupRepliesSlowly(
            currentGroup.id,
            parsed
        )

        currentGroup.updatedAt =
            Date.now()

        updateGroup(currentGroup)

    } catch (e) {

        const thinking =
            document.getElementById(thinkingId)

        if (thinking) thinking.remove()

        alert("群友回复失败：" + e.message)
    }
}

function saveGroupAiMessage(
    groupId,
    senderId,
    content,
    createdAt = Date.now()
) {

    const tx =
        db.transaction(
            "messages",
            "readwrite"
        )

    tx.objectStore("messages").put({
        id:
            "msg_" +
            createdAt +
            "_" +
            Math.random().toString(16).slice(2),

        contactId: groupId,
        role: "assistant",
        senderId,
        content,
        createdAt
    })
}

function renderGroupMessageContent(m) {

    if (m.imageSrc) {
        return `
            <img src="${m.imageSrc}"
                 class="group-msg-image">
        `
    }

    return escapeHtml(m.content || "")
}

function parseGroupAiReplies(raw, speakers) {

    const text =
        String(raw || "").trim()

    if (!text) return []

    const result = []

    const blocks =
        text
            .split(/\[SPEAKER:/)
            .map(t => t.trim())
            .filter(Boolean)

    blocks.forEach(function(block) {

        const id =
            block
                .substring(0, block.indexOf("]"))
                .trim()

        const content =
            block
                .substring(block.indexOf("]") + 1)
                .trim()
                .replace(/^[:：]/, "")
                .trim()

        const speaker =
            speakers.find(s => s.id === id)

        if (!speaker || !content) return

        result.push({
            senderId: speaker.id,
            content: content
        })
    })

    if (result.length > 0) {
        return result.slice(0, 4)
    }

    const fallbackSpeaker =
        speakers[0]

    return [{
        senderId: fallbackSpeaker.id,
        content: text
    }]
}

async function showGroupRepliesSlowly(groupId, replies) {

    const box =
        document.getElementById("chatBox")

    const contacts =
        await getAllStoreData("contacts")

    for (let i = 0; i < replies.length; i++) {

        const item =
            replies[i]

        const sender =
            contacts.find(c => c.id === item.senderId)

        const now =
            Date.now()

        if (
            currentGroup &&
            currentGroup.id === groupId &&
            currentPage === "groupChat" &&
            box
        ) {

            const typingId =
                "group_typing_" + now + "_" + i

            box.innerHTML += `
                <div id="${typingId}" class="chat-row ai-row">
                    <div class="chat-avatar">
                        ${avatarHtml(sender?.avatar, "🙂")}
                    </div>

                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">
                            ${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}
                        </div>

                        <div class="msg ai-msg typing-msg">
                            正在输入中...
                        </div>
                    </div>
                </div>
            `

            box.scrollTop =
                box.scrollHeight

            await sleep(
                700 + Math.random() * 900
            )

            const typing =
                document.getElementById(typingId)

            if (typing) {
                typing.remove()
            }

            box.innerHTML += `
                <div class="chat-row ai-row">
                    <div class="chat-avatar">
                        ${avatarHtml(sender?.avatar, "🙂")}
                    </div>

                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">
                            ${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}
                        </div>

                        <div class="msg ai-msg">
                            ${escapeHtml(item.content)}
                        </div>

                        <div class="msg-time">
                            ${formatMsgTime(now)}
                        </div>
                    </div>
                </div>
            `

            box.scrollTop =
                box.scrollHeight
        }

        saveGroupAiMessage(
            groupId,
            item.senderId,
            item.content,
            now
        )

        if (i < replies.length - 1) {
            await sleep(
                500 + Math.random() * 700
            )
        }
    }
}

function getGroupMemberDisplayName(group, contact) {

    if (!contact) return "群成员"

    const meta =
        group?.memberMeta?.[contact.id] || {}

    const nickname =
        meta.nickname || ""

    const title =
        meta.title || ""

    let name =
        nickname || contact.name || "群成员"

    if (title) {
        name += `｜${title}`
    }

    return name
}

function updateGroup(group) {

    const tx =
        db.transaction(
            "groups",
            "readwrite"
        )

    tx.objectStore("groups")
        .put(group)
}

async function showGroupInfo() {

    if (!currentGroup) return

    currentPage = "groupInfo"

    const contacts =
        await getAllStoreData("contacts")

    const members =
        contacts.filter(c =>
            currentGroup.memberIds.includes(c.id)
        )

    let memberHtml = ""

    members.forEach(function(m) {

        const meta =
            currentGroup.memberMeta?.[m.id] || {}

        memberHtml += `
            <div class="group-setting-member">
                <div class="contact-avatar small-avatar">
                    ${avatarHtml(m.avatar, "🙂")}
                </div>

                <div class="group-setting-main">
                    <div class="contact-name">
                        ${escapeHtml(m.name)}
                    </div>

                    <input id="nick_${m.id}"
                           placeholder="群昵称"
                           value="${escapeHtml(meta.nickname || "")}">

                    <input id="title_${m.id}"
                           placeholder="群头衔，例如 群主、狙击手"
                           value="${escapeHtml(meta.title || "")}">
                </div>
            </div>
        `
    })

    document.getElementById("appTitle").innerText =
        "群聊资料"

    document.getElementById("appContent").innerHTML = `
        <div class="form">

            <div class="avatar-preview">
                ${avatarHtml(currentGroup.avatar, "👥")}
            </div>

            <label class="file-label">上传群头像</label>
            <input type="file" id="groupAvatarFile" accept="image/*">

            <input id="editGroupName"
                   placeholder="群聊名称"
                   value="${escapeHtml(currentGroup.name || "")}">

            <select id="editGroupObserve">
                <option value="false" ${currentGroup.observeOnly ? "" : "selected"}>
                    普通群聊：用户可以发言
                </option>

                <option value="true" ${currentGroup.observeOnly ? "selected" : ""}>
                    仅围观模式：用户不能发言
                </option>
            </select>

            <div class="group-section-title">
                成员昵称 / 头衔
            </div>

            <div class="group-member-list">
                ${memberHtml}
            </div>

            <button onclick="saveGroupInfo()">
                保存群聊资料
            </button>

            <button onclick="clearGroupMessages()">
                清空群聊记录
            </button>

            <button onclick="deleteGroup()">
                解散并删除群聊
            </button>
        </div>
    `
}

async function saveGroupInfo() {

    if (!currentGroup) return

    const name =
        document
            .getElementById("editGroupName")
            .value
            .trim()

    if (!name) {
        alert("群名不能为空")
        return
    }

    currentGroup.name =
        name

    currentGroup.observeOnly =
        document
            .getElementById("editGroupObserve")
            .value === "true"

    const avatarFile =
        document
            .getElementById("groupAvatarFile")
            ?.files?.[0]

    if (avatarFile) {
        currentGroup.avatar =
            await fileToBase64(avatarFile)
    }

    if (!currentGroup.memberMeta) {
        currentGroup.memberMeta = {}
    }

    currentGroup.memberIds.forEach(function(id) {

        const nick =
            document.getElementById("nick_" + id)
                ?.value
                ?.trim() || ""

        const title =
            document.getElementById("title_" + id)
                ?.value
                ?.trim() || ""

        currentGroup.memberMeta[id] = {
            nickname: nick,
            title: title
        }
    })

    currentGroup.updatedAt =
        Date.now()

    const tx =
        db.transaction(
            "groups",
            "readwrite"
        )

    tx.objectStore("groups")
        .put(currentGroup)

    tx.oncomplete = function() {
        alert("群聊资料已保存")
        openGroupChat(currentGroup.id)
    }
}

async function clearGroupMessages() {

    if (!currentGroup) return

    if (!confirm("确定清空这个群的所有聊天记录吗？")) {
        return
    }

    const messages =
        await getAllStoreData("messages")

    const tx =
        db.transaction(
            "messages",
            "readwrite"
        )

    const store =
        tx.objectStore("messages")

    messages
        .filter(m => m.contactId === currentGroup.id)
        .forEach(m => store.delete(m.id))

    tx.oncomplete = function() {
        alert("已清空")
        openGroupChat(currentGroup.id)
    }
}

async function deleteGroup() {

    if (!currentGroup) return

    if (!confirm("确定解散并删除这个群聊吗？")) {
        return
    }

    const groupId =
        currentGroup.id

    const messages =
        await getAllStoreData("messages")

    const tx =
        db.transaction(
            ["groups", "messages"],
            "readwrite"
        )

    tx.objectStore("groups")
        .delete(groupId)

    const msgStore =
        tx.objectStore("messages")

    messages
        .filter(m => m.contactId === groupId)
        .forEach(m => msgStore.delete(m.id))

    tx.oncomplete = function() {
        currentGroup = null
        alert("群聊已删除")
        openApp("groups")
    }
}

function toggleGroupSearch() {

    const bar =
        document.getElementById("groupSearchBar")

    if (!bar) return

    bar.classList.toggle("hidden")

    const input =
        document.getElementById("groupSearchInput")

    if (input && !bar.classList.contains("hidden")) {
        input.focus()
    }
}

function searchGroupMessages() {

    if (!currentGroup) return

    const keyword =
        document
            .getElementById("groupSearchInput")
            ?.value
            ?.trim() || ""

    loadGroupMessages(
        currentGroup.id,
        keyword
    )
}

function clearGroupSearch() {

    const input =
        document.getElementById("groupSearchInput")

    if (input) {
        input.value = ""
    }

    const bar =
        document.getElementById("groupSearchBar")

    if (bar) {
        bar.classList.add("hidden")
    }

    if (currentGroup) {
        loadGroupMessages(currentGroup.id)
    }
}

function triggerObserveGroupReply() {

    const guide =
        document
            .getElementById("observeGuideInput")
            ?.value
            ?.trim() || ""

    const input =
        document.getElementById("observeGuideInput")

    if (input) {
        input.value = ""
    }

    groupAiReply(guide)
}


/* ============================================================
   Group chat UI fix 2026-06-16
   - 群聊也走全屏 WebView 式聊天
   - 三个点进入群聊设置页
   - 左侧 + 发图片，表情按钮发/上传表情包
============================================================ */

async function openGroupChat(groupId) {
    currentPage = "groupChat"
    if (typeof applyChatCustomCss === "function") applyChatCustomCss()

    const groups = await getAllStoreData("groups")
    currentGroup = groups.find(g => g.id === groupId)

    if (!currentGroup) {
        alert("群聊不存在")
        return
    }

    document.getElementById("appTitle").innerText = currentGroup.name || "群聊"
    if (typeof setChatWebViewMode === "function") setChatWebViewMode(true)

    const observeOnly = currentGroup.observeOnly === true

    document.getElementById("appContent").innerHTML = `
        <div class="chat-webview-shell" id="chatWebviewShell">
            <div class="chat-webview-bg" id="chatWebviewBg"></div>
            <div class="chat-webview-header">
                <button class="chat-webview-back" onclick="openApp('chat','msg')">‹</button>
                <div class="chat-webview-title">
                    <div class="chat-title-name">${escapeHtml(currentGroup.name || "群聊")}</div>
                </div>
                <button class="chat-webview-more" onclick="showGroupSettingsPage()">⋯</button>
            </div>
            <div id="chatBox" class="chat-box themed-chat-box chat-webview-box"></div>
            ${observeOnly ? `
                <div class="chat-input themed-chat-input chat-webview-input">
                    <input id="observeGuideInput" type="text" placeholder="输入引导词，可不填" onkeydown="if(event.key==='Enter'){triggerObserveGroupReply()}">
                    <button class="reply-now-btn" onclick="triggerObserveGroupReply()">TA</button>
                </div>
            ` : `
                <div class="chat-input themed-chat-input chat-webview-input">
                    <input type="file" id="groupImageInput" accept="image/*" hidden onchange="sendGroupImageFromInput(event)">
                    <button class="input-icon-btn" onclick="document.getElementById('groupImageInput').click()">＋</button>
                    <input id="groupMessageInput" type="text" placeholder="在群里说点什么" onkeydown="if(event.key==='Enter'){sendGroupMessage()}">
                    <button class="input-icon-btn sticker-btn" onclick="showStickerPanel('group')">☺</button>
                    <button onclick="sendGroupMessage()">发送</button>
                    <button class="reply-now-btn" onclick="groupAiReply()">TA</button>
                </div>
            `}
        </div>
    `

    await clearGroupUnread(groupId)
    loadGroupMessages(groupId)
}

function showGroupSettingsPage() {
    if (!currentGroup) return
    if (typeof setChatWebViewMode === "function") setChatWebViewMode(false)
    currentPage = "groupSettingsPage"
    document.getElementById("appTitle").innerText = "群聊设置"
    document.getElementById("appContent").innerHTML = `
        <div class="chat-settings-page">
            <div class="chat-settings-card">
                <div class="chat-settings-profile">
                    <div class="chat-settings-avatar">${avatarHtml(currentGroup.avatar, "👥")}</div>
                    <div>
                        <div class="chat-settings-name">${escapeHtml(currentGroup.name || "群聊")}</div>
                        <div class="chat-settings-sub">群聊资料、成员昵称、记录管理</div>
                    </div>
                </div>
            </div>
            <div class="chat-settings-card">
                <button class="chat-settings-row" onclick="showGroupInfo()"><span>编辑群聊资料</span><span>›</span></button>
                <button class="chat-settings-row" onclick="groupAiReply()"><span>让群友回复</span><span>›</span></button>
                <button class="chat-settings-row" onclick="openGroupChat(currentGroup.id)"><span>返回群聊</span><span>›</span></button>
            </div>
            <div class="chat-settings-card">
                <button class="chat-settings-row danger" onclick="clearGroupMessages()"><span>清空群聊记录</span><span>›</span></button>
                <button class="chat-settings-row danger" onclick="deleteGroup()"><span>解散并删除群聊</span><span>›</span></button>
            </div>
        </div>
    `
}

function renderGroupMessageContent(m) {
    if (m.imageSrc) {
        return `<img src="${escapeHtml(m.imageSrc)}" class="chat-media-image group-msg-image" alt="图片">`
    }
    if (m.stickerSrc) {
        return `<img src="${escapeHtml(m.stickerSrc)}" class="chat-sticker-image" alt="表情包">`
    }
    return escapeHtml(m.content || "")
}

async function loadGroupMessages(groupId, keyword = "") {
    const box = document.getElementById("chatBox")
    if (!box) return

    const messages = await getAllStoreData("messages")
    const contacts = await getAllStoreData("contacts")

    let list = messages
        .filter(m => m.contactId === groupId)
        .sort((a, b) => a.createdAt - b.createdAt)

    if (keyword) {
        list = list.filter(m => String(m.content || "").includes(keyword))
    }

    let html = ""
    list.forEach(function(m) {
        const timeText = formatMsgTime(m.createdAt)
        if (m.role === "user") {
            html += `
                <div class="chat-row user-row">
                    <div class="msg-wrap user-wrap">
                        <div class="msg user-msg">${renderGroupMessageContent(m)}</div>
                        <div class="msg-time">${timeText}</div>
                    </div>
                    <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
                </div>
            `
        } else {
            const sender = contacts.find(c => c.id === m.senderId)
            const display = getGroupMemberDisplayName(currentGroup, sender)
            html += `
                <div class="chat-row ai-row">
                    <div class="chat-avatar">${avatarHtml(sender?.avatar, "🙂")}</div>
                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">${escapeHtml(display)}</div>
                        <div class="msg ai-msg">${renderGroupMessageContent(m)}</div>
                        <div class="msg-time">${timeText}</div>
                    </div>
                </div>
            `
        }
    })

    box.innerHTML = html || `<p class="empty">暂无群聊消息</p>`
    box.scrollTop = box.scrollHeight
}

function saveGroupUserMessage(extra) {
    if (!currentGroup) return
    const now = extra.createdAt || Date.now()
    saveMessage(currentGroup.id, "user", extra.content || "", now, extra)
    currentGroup.updatedAt = now
    updateGroup(currentGroup)
}

function sendGroupMessage() {
    if (!currentGroup) return
    const input = document.getElementById("groupMessageInput")
    const text = input?.value?.trim() || ""
    if (!text) return
    saveGroupUserMessage({ content: text, createdAt: Date.now() })
    input.value = ""
    loadGroupMessages(currentGroup.id)
}

async function sendGroupImageFromInput(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !currentGroup) return
    const src = await fileToBase64(file)
    saveGroupUserMessage({ content: "[图片]", imageSrc: src, createdAt: Date.now() })
    loadGroupMessages(currentGroup.id)
}

function sendGroupStickerUrl(url) {
    if (!currentGroup) return
    saveGroupUserMessage({ content: "[表情包]", stickerSrc: url, createdAt: Date.now() })
    loadGroupMessages(currentGroup.id)
}

async function showGroupRepliesSlowly(groupId, replies) {
    const box = document.getElementById("chatBox")
    const contacts = await getAllStoreData("contacts")

    for (let i = 0; i < replies.length; i++) {
        const item = replies[i]
        const sender = contacts.find(c => c.id === item.senderId)
        const now = Date.now()

        if (currentGroup && currentGroup.id === groupId && currentPage === "groupChat" && box) {
            const typingId = "group_typing_" + now + "_" + i
            box.innerHTML += `
                <div id="${typingId}" class="chat-row ai-row">
                    <div class="chat-avatar">${avatarHtml(sender?.avatar, "🙂")}</div>
                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}</div>
                        <div class="msg ai-msg typing-msg">正在输入中...</div>
                    </div>
                </div>
            `
            box.scrollTop = box.scrollHeight
            await sleep(700 + Math.random() * 900)
            const typing = document.getElementById(typingId)
            if (typing) typing.remove()
            box.innerHTML += `
                <div class="chat-row ai-row">
                    <div class="chat-avatar">${avatarHtml(sender?.avatar, "🙂")}</div>
                    <div class="msg-wrap ai-wrap">
                        <div class="group-sender-name">${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}</div>
                        <div class="msg ai-msg">${escapeHtml(item.content)}</div>
                        <div class="msg-time">${formatMsgTime(now)}</div>
                    </div>
                </div>
            `
            box.scrollTop = box.scrollHeight
        }

        saveGroupAiMessage(groupId, item.senderId, item.content, now)
        if (i < replies.length - 1) await sleep(500 + Math.random() * 700)
    }
}



/* ============================================================
   Group voice/image patch 2026-06-16
   - 群聊角色可发送语音消息
   - 群聊可按设置触发生图消息
============================================================ */
(function(){
    if (window.__mjiGroupVoiceImagePatch) return
    window.__mjiGroupVoiceImagePatch = true

    function escapeAttr(v){ return escapeHtml(v || "").replace(/"/g, "&quot;") }

    function shouldGroupVoice(sender){
        if (!sender) return false
        const globalOn = localStorage.getItem("MJI_VOICE_MSG_ENABLED") === "true"
        const contactOn = sender.allowVoiceMsg === true || sender.ttsEnabled === true
        if (!globalOn && !contactOn) return false
        const p = Number(sender.voiceMsgProb || sender.voiceProb || localStorage.getItem("MJI_VOICE_MSG_PROB") || "30")
        return Math.random() * 100 < Math.max(0, Math.min(100, p))
    }

    window.playMjiGroupVoiceMessage = function(text, lang){
        try{
            if (!window.speechSynthesis) { alert("当前浏览器不支持语音播放"); return }
            const clean = String(text || "").replace(/【翻译】[\s\S]*$/,"").replace(/（[\s\S]*?）/g,"").trim()
            const u = new SpeechSynthesisUtterance(clean)
            u.lang = String(lang || "").includes("英") ? "en-US" : "zh-CN"
            speechSynthesis.cancel()
            speechSynthesis.speak(u)
        }catch(e){}
    }

    window.renderGroupMessageContent = function(m) {
        if (m.imageSrc) {
            return `<img src="${escapeHtml(m.imageSrc)}" class="chat-media-image group-msg-image" alt="图片">`
        }
        if (m.stickerSrc) {
            return `<img src="${escapeHtml(m.stickerSrc)}" class="chat-sticker-image" alt="表情包">`
        }
        if (m.isVoice || m.voiceMsg) {
            const dur = m.voiceDuration || Math.max(2, Math.min(18, Math.ceil(String(m.content || "").length / 6)))
            return `<div class="chat-voice-bubble" onclick="playMjiGroupVoiceMessage('${escapeAttr(m.content || "")}','')"><span class="voice-wave"><i></i><i></i><i></i></span><span class="voice-duration">${dur}"</span></div>`
        }
        return escapeHtml(m.content || "")
    }

    async function mjiGenerateGroupImage(prompt){
        const base = (localStorage.getItem("MJI_IMG_API_BASE") || "").replace(/\/+$/,"")
        const key = localStorage.getItem("MJI_IMG_API_KEY") || ""
        const model = localStorage.getItem("MJI_IMG_MODEL") || ""
        const size = localStorage.getItem("MJI_IMG_SIZE") || "1024x1024"
        const pos = localStorage.getItem("MJI_IMG_POSITIVE") || ""
        const neg = localStorage.getItem("MJI_IMG_NEGATIVE") || ""
        if (!base || !key || !model) throw new Error("未配置生图 API")
        let url = base
        if (!url.endsWith("/images/generations")) url += (url.endsWith("/v1") ? "" : "/v1") + "/images/generations"
        const body = { model, prompt: [prompt, pos].filter(Boolean).join(", "), n: 1, size }
        if (neg) body.negative_prompt = neg
        const res = await fetch(url, { method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer " + key }, body: JSON.stringify(body) })
        const data = await res.json()
        const first = data.data?.[0]
        if (first?.b64_json) return "data:image/png;base64," + first.b64_json
        if (first?.url) return first.url
        if (data.url) return data.url
        if (data.image) return "data:image/png;base64," + data.image
        throw new Error("生图返回里没有图片")
    }

    async function maybeGroupImage(groupId, sender, text){
        const enabled = localStorage.getItem("MJI_CHAT_IMAGE_ENABLED") === "true" || sender?.allowChatImage === true
        if (!enabled || sender?.allowChatImage === false) return
        const trigger = /发图|照片|拍|看看|图来|picture|photo|selfie/i.test(text || "")
        const prob = Number(localStorage.getItem("MJI_AUTO_IMAGE_PROB") || "20")
        if (!trigger && Math.random() * 100 >= prob) return
        try{
            const src = await mjiGenerateGroupImage(`first-person POV phone photo, no face, no head, candid real life moment. Character: ${sender?.name || ""}. Appearance: ${sender?.appearance || ""}. Context: ${text || ""}`)
            const now = Date.now()
            saveMessage(groupId, "assistant", "【照片】", now, { senderId: sender?.id || "", imageSrc: src })
            if (currentGroup?.id === groupId && currentPage === "groupChat") loadGroupMessages(groupId)
        }catch(e){ console.warn("group image generation failed", e) }
    }

    window.showGroupRepliesSlowly = async function(groupId, replies) {
        const box = document.getElementById("chatBox")
        const contacts = await getAllStoreData("contacts")

        for (let i = 0; i < replies.length; i++) {
            const item = replies[i]
            const sender = contacts.find(c => c.id === item.senderId)
            const now = Date.now()
            const isVoice = shouldGroupVoice(sender)
            const voiceDuration = Math.max(2, Math.min(18, Math.ceil(String(item.content || "").length / 6)))

            if (currentGroup && currentGroup.id === groupId && currentPage === "groupChat" && box) {
                const typingId = "group_typing_" + now + "_" + i
                box.innerHTML += `
                    <div id="${typingId}" class="chat-row ai-row">
                        <div class="chat-avatar">${avatarHtml(sender?.avatar, "🙂")}</div>
                        <div class="msg-wrap ai-wrap">
                            <div class="group-sender-name">${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}</div>
                            <div class="msg ai-msg typing-msg">${isVoice ? "正在录音中..." : "正在输入中..."}</div>
                        </div>
                    </div>
                `
                box.scrollTop = box.scrollHeight
                await sleep(700 + Math.random() * 900)
                const typing = document.getElementById(typingId)
                if (typing) typing.remove()
                const msgObj = { content: item.content, isVoice, voiceMsg: isVoice, voiceDuration }
                box.innerHTML += `
                    <div class="chat-row ai-row">
                        <div class="chat-avatar">${avatarHtml(sender?.avatar, "🙂")}</div>
                        <div class="msg-wrap ai-wrap">
                            <div class="group-sender-name">${escapeHtml(getGroupMemberDisplayName(currentGroup, sender))}</div>
                            <div class="msg ai-msg">${renderGroupMessageContent(msgObj)}</div>
                            <div class="msg-time">${formatMsgTime(now)}</div>
                        </div>
                    </div>
                `
                box.scrollTop = box.scrollHeight
            }

            saveGroupAiMessage(groupId, item.senderId, item.content, now, { isVoice, voiceMsg: isVoice, voiceDuration })
            maybeGroupImage(groupId, sender, item.content)
            if (i < replies.length - 1) await sleep(500 + Math.random() * 700)
        }
    }

    const __oldSaveGroupAiMessage = window.saveGroupAiMessage
    window.saveGroupAiMessage = function(groupId, senderId, content, createdAt = Date.now(), extra = {}) {
        if (typeof __oldSaveGroupAiMessage === "function" && Object.keys(extra || {}).length === 0) {
            return __oldSaveGroupAiMessage(groupId, senderId, content, createdAt)
        }
        saveMessage(groupId, "assistant", content, createdAt, { senderId, ...(extra || {}) })
    }
})()
