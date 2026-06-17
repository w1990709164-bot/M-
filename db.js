function loadChatList() {

    const tx =
        db.transaction(
            ["contacts","messages"],
            "readonly"
        )

    const contactStore =
        tx.objectStore("contacts")

    const messageStore =
        tx.objectStore("messages")

    const contactReq =
        contactStore.getAll()

    const messageReq =
        messageStore.getAll()

    let contacts = []
    let messages = []

    contactReq.onsuccess =
        () => contacts = contactReq.result

    messageReq.onsuccess =
        () => messages = messageReq.result

    tx.oncomplete = function() {

        let html = ""

        contacts.sort((a,b)=>{

            const aLast =
                messages
                    .filter(m => m.contactId === a.id)
                    .sort((x,y)=>y.createdAt-x.createdAt)[0]

            const bLast =
                messages
                    .filter(m => m.contactId === b.id)
                    .sort((x,y)=>y.createdAt-x.createdAt)[0]

            return (bLast?.createdAt || 0) - (aLast?.createdAt || 0)
        })

        contacts.forEach(c => {

            const contactMessages =
                messages
                    .filter(m => m.contactId === c.id)
                    .sort((a,b)=>b.createdAt-a.createdAt)

            if (contactMessages.length === 0) {
                return
            }

            const last =
                contactMessages[0]

            const unread =
                c.unreadCount || 0

            html += `
                <div class="contact"
                     onclick="openChat('${c.id}')">

                    <div class="contact-avatar">
                        ${avatarHtml(c.avatar, "🙂")}
                    </div>

                    <div class="contact-info">

                        <div class="chat-list-top">
                            <div class="contact-name">
                                ${escapeHtml(c.name)}
                            </div>

                            <div class="chat-list-time">
                                ${formatMsgTime(last.createdAt)}
                            </div>
                        </div>

                        <div class="chat-list-bottom">
                            <div class="contact-sub">
                                ${escapeHtml(last.content.slice(0,30))}
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

        document
            .getElementById("chatList")
            .innerHTML =
                html ||
                "<p class='empty'>暂无聊天</p>"
    }
}
function openChat(contactId) {

    if (currentPage === "chat") {
        chatBackPage = "chat"
    } else {
        chatBackPage = "contacts"
    }

    currentPage = "chatDetail"
    const tx = db.transaction("contacts", "readonly")
    const store = tx.objectStore("contacts")
    const req = store.get(contactId)

    req.onsuccess = function() {
        currentContact = req.result
if(currentContact){

    currentContact.unreadCount = 0

    const tx2 =
        db.transaction(
            "contacts",
            "readwrite"
        )

    tx2.objectStore("contacts")
       .put(currentContact)
       tx2.oncomplete = function() {
    updateDesktopUnreadBadge()
}
}
 document.getElementById("appTitle").innerText = currentContact.name


       document.getElementById("appContent").innerHTML = `
    <button class="memory-entry" onclick="showContactEditor()">编辑角色</button>
    <button class="memory-entry" onclick="showMemoryEditor()">长期记忆</button>
   <button class="memory-entry" onclick="testAiMessage()">
    让TA主动找我
</button>
    <div id="chatBox" class="chat-box"></div>
            <div class="chat-input">
                <input id="messageInput" placeholder="输入消息">
             <button onclick="sendMessage()">发送</button>
<button onclick="replyNow()">让TA回复</button>
            </div>
        `

        loadMessages(currentContact.id)
        applyChatBackground()
    }
}
function loadMessages(contactId) {
    const tx = db.transaction("messages", "readonly")
    const store = tx.objectStore("messages")
    const req = store.getAll()

    req.onsuccess = function() {
        const box = document.getElementById("chatBox")
        if (!box) return

        const list = req.result
            .filter(m => m.contactId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)

        let html = ""

        list.forEach(function(m) {

            const timeText =
                formatMsgTime(m.createdAt)

            if (m.role === "user") {
                html += `
                    <div class="chat-row user-row">
                        <div class="msg-wrap user-wrap">
                            <div class="msg user-msg">
                                ${escapeHtml(m.content)}
                            </div>
                            <div class="msg-time">${timeText}</div>
                        </div>

                        <div class="chat-avatar">
                            ${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}
                        </div>
                    </div>
                `
            } else {
                html += `
                    <div class="chat-row ai-row">
                        <div class="chat-avatar">
                            ${avatarHtml(currentContact.avatar, "🙂")}
                        </div>

                        <div class="msg-wrap ai-wrap">
                            <div class="msg ai-msg">
                                ${escapeHtml(m.content)}
                            </div>
                            <div class="msg-time">${timeText}</div>
                        </div>
                    </div>
                `
            }
        })

        box.innerHTML = html
        box.scrollTop = box.scrollHeight
    }
}
function sendMessage() {
    const input = document.getElementById("messageInput")
    const text = input.value.trim()

    if (!text) return
    if (!currentContact) return

    const box = document.getElementById("chatBox")
    const now = Date.now()

    box.innerHTML += `
        <div class="chat-row user-row">
            <div class="msg-wrap user-wrap">
                <div class="msg user-msg">
                    ${escapeHtml(text)}
                </div>
                <div class="msg-time">${formatMsgTime(now)}</div>
            </div>

            <div class="chat-avatar">
                ${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}
            </div>
        </div>
    `

    saveMessage(
        currentContact.id,
        "user",
        text,
        now
    )

    input.value = ""
    box.scrollTop = box.scrollHeight
}
async function replyNow() {
    if (!currentContact) return

    const recent =
        await getRecentMessages(currentContact.id)

    const lastUserMsg =
        [...recent]
        .reverse()
        .find(m => m.role === "user")

    if (!lastUserMsg) {
        alert("还没有用户消息")
        return
    }

    callAI(lastUserMsg.content)
}
async function callAI(userText) {
    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")
    const history = await getRecentMessages(currentContact.id)
    const memory =
    safeMemory(
        await getMemory(currentContact.id)
    )

const worldBookText =
    safeWorldBook(
        await getWorldBookInjection(userText)
    )

    if (!apiBase || !apiKey || !apiModel) {
        alert("请先配置API")
        return
    }

    const box = document.getElementById("chatBox")

   box.innerHTML += `
    <div id="thinking" class="chat-row ai-row">
        <div class="chat-avatar">
            ${
               avatarHtml(currentContact.avatar, "🙂")
            }
        </div>
        <div class="msg ai-msg">
            正在输入中...
        </div>
    </div>
`

    try {
        const history = await getRecentMessages(currentContact.id)
const memory = await recallRelevantMemory(currentContact.id, userText)
        const messages = [
    {
        role: "system",
       content: `
${currentContact?.prompt || "你是一个AI角色"}

【角色资料】
姓名：${currentContact.name || ""}

身份：${currentContact.identity || ""}

生日：${currentContact.birthday || ""}

年龄：${currentContact.age || ""}

性格：${currentContact.personality || ""}

简介：
${currentContact.profile || ""}

【长期记忆】
${memory || "暂无长期记忆"}

【世界书】
${worldBookText || "暂无命中的世界书"}

【回复格式】
你可以一次回复1到3条短消息。

如果需要分成多条气泡，每条消息前面必须加 [MSG]。

格式示例：
[MSG]第一条消息
[MSG]第二条消息
[MSG]第三条消息

每条消息必须表达不同内容。
不要用不同说法重复同一个意思。

如果上一条已经提醒过“早点休息”“早点睡”“休息”，这次不要继续重复提醒睡觉。
除非用户主动提到睡觉。

不要把多条消息写成一整段。
不要解释格式。
不要输出超过3条。
每条都要像微信私聊。
【防重复】
不要连续围绕同一个话题说话。
上一轮如果已经说过早点睡、早点休息、休息、睡觉，这一轮不要再重复。
用户问“你呢”的时候，优先回答你自己的状态，不要立刻转回劝用户休息。
每条消息必须有不同信息量。
`
    },
            ...history.map(m => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content
}))
        ]

        const response = await fetch(
            getChatApiUrl(),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: apiModel,
                    messages
                })
            }
        )

        const data = await response.json()

        const thinking = document.getElementById("thinking")
        if (thinking) thinking.remove()

        const reply =
            data.choices?.[0]?.message?.content || "无回复"

       const replies =
    splitAiMessages(reply)

console.log("AI原文：", reply)
console.log("拆分后：", replies)

await showAiRepliesSlowly(
    currentContact.id,
    replies
)
maybeExtractMemory()
        box.scrollTop = box.scrollHeight

    } catch (e) {
        const thinking = document.getElementById("thinking")
        if (thinking) thinking.remove()

        box.innerHTML += `
            <div class="msg ai-msg">
                API错误：${escapeHtml(e.message)}
            </div>
        `
    }
}
async function testAiMessage() {
    if (!currentContact) return

    await generateNpcMessage(
        currentContact,
        true
    )
}
function receiveAiMessage(contactId, text) {

    const parts =
        splitAiMessages(text)

    if (parts.length === 0) return

    const isCurrentChat =
        currentContact &&
        currentContact.id === contactId &&
        currentPage === "chatDetail"

    const tx =
        db.transaction(
            ["contacts", "messages"],
            "readwrite"
        )

    const contactStore =
        tx.objectStore("contacts")

    const messageStore =
        tx.objectStore("messages")

    const req =
        contactStore.get(contactId)

    req.onsuccess = function() {

        const contact =
            req.result

        if (!contact) return

        contact.lastNpcMessageAt =
            Date.now()

        if (isCurrentChat) {
            contact.unreadCount = 0
        } else {
            contact.unreadCount =
                (contact.unreadCount || 0) + parts.length
        }

        if (
            currentContact &&
            currentContact.id === contactId
        ) {
            currentContact = contact
        }

        contactStore.put(contact)

        if (!isCurrentChat) {

            parts.forEach(function(part, index) {

                messageStore.put({
                    id:
                        "msg_" +
                        Date.now() +
                        "_" +
                        index +
                        "_" +
                        Math.random().toString(16).slice(2),

                    contactId,
                    role: "assistant",
                    content: part,
                    createdAt: Date.now() + index
                })
            })
        }
    }

    tx.oncomplete = async function() {

        if (isCurrentChat) {

            await showAiRepliesSlowly(
                contactId,
                parts
            )
        }

        if (currentPage === "chat") {
            loadChatList()
        }
        updateDesktopUnreadBadge()
    }
}
async function generateNpcMessage(contact, showAlert = false) {

    if (!contact) return

    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        if (showAlert) alert("请先配置API")
        return
    }

    const now = Date.now()

    const lastNpcMessageAt =
        contact.lastNpcMessageAt || 0

    if (
        lastNpcMessageAt &&
        now - lastNpcMessageAt < NPC_MESSAGE_COOLDOWN_MS
    ) {
        const leftSeconds =
            Math.ceil(
                (NPC_MESSAGE_COOLDOWN_MS - (now - lastNpcMessageAt)) / 1000
            )

        if (showAlert) {
            alert(
                "主动消息冷却中，还剩 " +
                leftSeconds +
                " 秒"
            )
        }

        return
    }

    const memory =
        safeMemory(
            await getMemory(contact.id)
        )

    const history =
        await getRecentMessages(contact.id)

    const chatText =
        history
            .slice(-20)
            .map(m =>
                `${m.role === "user" ? "用户" : "角色"}：${m.content}`
            )
            .join("\n")

    try {

        const response = await fetch(
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
你是一个AI陪伴应用里的角色。

你现在要主动给用户发一条微信式私聊消息。

这不是回复用户刚刚说的话，而是你主动找用户。

只输出消息正文。

不要解释。
不要旁白。
不要动作描写。
不要加引号。
不要超过30字。
`
                        },
                        {
                            role: "user",
                            content: `
请根据以下资料，主动给用户发一条消息。

【角色资料】
姓名：${contact.name || ""}
身份：${contact.identity || ""}
性格：${contact.personality || ""}
简介：${contact.profile || ""}

【角色系统Prompt】
${contact.prompt || ""}

【长期记忆】
${memory || "暂无"}

【最近聊天】
${chatText || "暂无"}

要求：
像微信私聊。
自然。
不要像客服。
不要每次都问“在吗”。

不要连续围绕同一个话题说话。
最近聊天里如果已经提过休息、早点睡、睡觉，这次不要继续重复。
用户问“你呢”的时候，优先回答你自己的状态。
可以说你正在做什么、看到什么、想到什么。
不要每次都把话题转回用户休息。
`
                        }
                    ]
                })
            }
        )

        const data =
            await response.json()

        console.log("主动消息API返回：", data)

        if (!response.ok) {
            if (showAlert) {
                alert(
                    "主动消息API错误：" +
                    (data.error?.message || response.status)
                )
            }
            return
        }

        const reply =
            data.choices?.[0]?.message?.content?.trim()

        if (!reply) {
            if (showAlert) {
                alert("主动消息生成失败：模型没有返回内容")
            }
            return
        }

        receiveAiMessage(
            contact.id,
            reply
        )

    } catch (e) {

        console.log("主动消息请求失败", e)

        if (showAlert) {
            alert("主动消息请求失败：" + e.message)
        }
    }
}
function startNpcAutoCheck() {

    if (npcAutoTimer) {
        clearInterval(npcAutoTimer)
    }

    npcAutoTimer =
        setInterval(
            checkAndSendNpcMessages,
            NPC_AUTO_CHECK_MS
        )

    console.log("AI主动消息自动检查已启动")
}
async function checkAndSendNpcMessages() {

    const npcAutoEnabled =
        localStorage.getItem("MJI_NPC_AUTO_ENABLED") !== "false"

    if (!npcAutoEnabled) {
        return
    }

    const contacts =
        await getAllStoreData("contacts")

    const messages =
        await getAllStoreData("messages")

    const now =
        Date.now()

    const candidates = []

    for (const contact of contacts) {

        if (contact.npcAutoEnabled === false) {
            continue
        }

        const isCurrentChat =
            currentContact &&
            currentContact.id === contact.id &&
            currentPage === "chatDetail"

        if (isCurrentChat) {
            continue
        }

        const contactMessages =
            messages
                .filter(m => m.contactId === contact.id)
                .sort((a, b) => b.createdAt - a.createdAt)

        const last =
            contactMessages[0]

        if (!last) {
            continue
        }

        if (last.role !== "user") {
            continue
        }

        if (
            now - last.createdAt <
            NPC_IDLE_TRIGGER_MS
        ) {
            continue
        }

        if (
            contact.lastNpcMessageAt &&
            now - contact.lastNpcMessageAt <
            NPC_MESSAGE_COOLDOWN_MS
        ) {
            continue
        }

        candidates.push(contact)
    }

    if (candidates.length === 0) {
    return
}

if (Math.random() > NPC_AUTO_SEND_CHANCE) {
    console.log("这次检查没有触发主动消息")
    return
}

const picked =
    candidates[
        Math.floor(
            Math.random() * candidates.length
        )
    ]

    console.log(
        "随机抽中主动发消息：",
        picked.name
    )

    await generateNpcMessage(
        picked,
        false
    )
}
async function showAiRepliesSlowly(contactId, replies) {

    const box =
        document.getElementById("chatBox")

    for (let i = 0; i < replies.length; i++) {

        const now =
            Date.now()

        if (
            currentContact &&
            currentContact.id === contactId &&
            currentPage === "chatDetail" &&
            box
        ) {

            const typingId =
                "typing_" + now + "_" + i

            box.innerHTML += `
                <div id="${typingId}" class="chat-row ai-row">
                    <div class="chat-avatar">
                        ${avatarHtml(currentContact.avatar, "🙂")}
                    </div>

                    <div class="msg-wrap ai-wrap">
                        <div class="msg ai-msg typing-msg">
                            正在输入中...
                        </div>
                    </div>
                </div>
            `

            box.scrollTop = box.scrollHeight

            await sleep(700 + Math.random() * 900)

            const typing =
                document.getElementById(typingId)

            if (typing) {
                typing.remove()
            }

            box.innerHTML += `
                <div class="chat-row ai-row">
                    <div class="chat-avatar">
                        ${avatarHtml(currentContact.avatar, "🙂")}
                    </div>

                    <div class="msg-wrap ai-wrap">
                        <div class="msg ai-msg">
                            ${escapeHtml(replies[i])}
                        </div>
                        <div class="msg-time">${formatMsgTime(now)}</div>
                    </div>
                </div>
            `

            box.scrollTop = box.scrollHeight
        }

        saveMessage(
            contactId,
            "assistant",
            replies[i],
            now
        )

        if (i < replies.length - 1) {
            await sleep(500 + Math.random() * 700)
        }
    }
}
async function updateDesktopUnreadBadge() {

    const chatIcon =
        document.getElementById("chatAppIcon")

    if (!chatIcon || !db) return

    const contacts =
        await getAllStoreData("contacts")

    const total =
        contacts.reduce(
            (sum, c) => sum + (c.unreadCount || 0),
            0
        )

    let badge =
        document.getElementById("desktopChatBadge")

    if (total <= 0) {
        if (badge) badge.remove()
        return
    }

    if (!badge) {
        badge =
            document.createElement("div")

        badge.id =
            "desktopChatBadge"

        badge.className =
            "desktop-unread-badge"

        chatIcon.appendChild(badge)
    }

    badge.innerText =
        total > 99 ? "99+" : total
}


/* ============================================================
   WeChat Shell + Chat Theme + Thoughts Card Overrides
   这一段放在文件最后，覆盖前面的简版聊天函数。
============================================================ */
let currentWechatTab = "msg"
let __wechatOpenGroupList = false

function applyChatCustomCss() {
    let style = document.getElementById("mji-chat-custom-css")
    if (!style) {
        style = document.createElement("style")
        style.id = "mji-chat-custom-css"
        document.head.appendChild(style)
    }
    const userCss = localStorage.getItem("MJI_CHAT_CUSTOM_CSS") || ""
    style.textContent = getChatFullscreenBaseCss() + "\n" + userCss
}

function getChatFullscreenBaseCss() {
    return `
#screen.chat-webview-mode{
    background:#000!important;
    padding:0!important;
}
#screen.chat-webview-mode .app-header{
    display:none!important;
}
#screen.chat-webview-mode .app-content{
    position:absolute!important;
    inset:0!important;
    padding:0!important;
    margin:0!important;
    height:100%!important;
    overflow:hidden!important;
    background:transparent!important;
}
.chat-webview-shell{
    position:absolute;
    inset:0;
    display:flex;
    flex-direction:column;
    min-height:0;
    background:var(--chat-page-bg, #0b0b0f);
    overflow:hidden;
}
.chat-webview-bg{
    position:absolute;
    inset:0;
    z-index:0;
    background:
        radial-gradient(circle at 18% 10%, rgba(255,255,255,.06), transparent 26%),
        linear-gradient(180deg, rgba(36,36,43,.98), rgba(18,18,24,.98));
    background-size:cover;
    background-position:center;
}
.chat-webview-shell.has-bg .chat-webview-bg::after{
    content:"";
    position:absolute;
    inset:0;
    background:rgba(0,0,0,.18);
    backdrop-filter:blur(0px);
}
.chat-webview-header{
    position:relative;
    z-index:2;
    height:58px;
    flex-shrink:0;
    display:grid;
    grid-template-columns:48px minmax(0,1fr)48px;
    align-items:center;
    padding:0 6px;
    background:rgba(28,28,34,.58);
    border-bottom:1px solid rgba(255,255,255,.12);
    backdrop-filter:blur(22px) saturate(160%);
    -webkit-backdrop-filter:blur(22px) saturate(160%);
    color:#f5f5f7;
}
.chat-webview-back,
.chat-webview-more{
    width:42px;
    height:42px;
    border:0;
    border-radius:16px;
    background:rgba(255,255,255,.08);
    color:#f5f5f7;
    font-size:25px;
    display:flex;
    align-items:center;
    justify-content:center;
}
.chat-webview-more{
    font-size:22px;
}
.chat-webview-title{
    min-width:0;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:9px;
    font-weight:700;
}
.chat-webview-title .chat-title-avatar{
    width:30px;
    height:30px;
    border-radius:50%;
    overflow:hidden;
    flex-shrink:0;
    background:rgba(255,255,255,.12);
}
.chat-webview-title .chat-title-name{
    max-width:190px;
    white-space:nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    font-size:16px;
}
.chat-webview-box{
    position:relative;
    z-index:1;
    flex:1;
    min-height:0;
    overflow-y:auto;
    padding:14px 12px 18px!important;
    background:transparent!important;
    -webkit-overflow-scrolling:touch;
}
.chat-webview-input{
    position:relative;
    z-index:2;
    flex-shrink:0;
    display:flex;
    gap:8px;
    align-items:center;
    padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px))!important;
    background:rgba(28,28,34,.62)!important;
    border-top:1px solid rgba(255,255,255,.12);
    backdrop-filter:blur(22px) saturate(160%);
    -webkit-backdrop-filter:blur(22px) saturate(160%);
}
.chat-webview-input input{
    flex:1;
    min-width:0;
    height:42px;
    border:0;
    outline:0;
    border-radius:18px;
    padding:0 14px;
    background:rgba(255,255,255,.16);
    color:#fff;
    font-size:15px;
}
.chat-webview-input input::placeholder{
    color:rgba(255,255,255,.48);
}
.chat-webview-input button{
    height:42px;
    border:0;
    border-radius:16px;
    padding:0 13px;
    background:rgba(198,210,234,.86);
    color:#333845;
    font-weight:700;
    white-space:nowrap;
}
.chat-webview-input .reply-now-btn{
    width:48px;
    padding:0;
    background:rgba(255,255,255,.14);
    color:rgba(255,255,255,.88);
}
.chat-webview-box .chat-row{
    margin:8px 0;
}
.chat-webview-box .msg{
    max-width:min(74vw, 270px);
    word-break:break-word;
    white-space:pre-wrap;
    line-height:1.55;
    box-shadow:0 6px 18px rgba(0,0,0,.12);
}
.chat-webview-box .ai-msg{
    background:rgba(255,255,255,.82)!important;
    color:#24242b!important;
    border:1px solid rgba(255,255,255,.52);
    backdrop-filter:blur(18px) saturate(150%);
    -webkit-backdrop-filter:blur(18px) saturate(150%);
}
.chat-webview-box .user-msg{
    background:rgba(198,210,234,.88)!important;
    color:#2f3543!important;
    border:1px solid rgba(255,255,255,.42);
    backdrop-filter:blur(18px) saturate(150%);
    -webkit-backdrop-filter:blur(18px) saturate(150%);
}
.chat-webview-settings-mask{
    position:fixed;
    inset:0;
    z-index:9999;
    display:flex;
    align-items:flex-end;
    justify-content:center;
    background:rgba(0,0,0,.28);
    backdrop-filter:blur(5px);
    -webkit-backdrop-filter:blur(5px);
}
.chat-webview-settings-panel{
    width:min(390px, 100vw);
    border-radius:26px 26px 0 0;
    background:rgba(245,244,241,.92);
    border:1px solid rgba(255,255,255,.6);
    box-shadow:0 -16px 40px rgba(0,0,0,.2);
    padding:14px 16px 22px;
    color:#333;
}
.chat-webview-settings-title{
    text-align:center;
    font-size:14px;
    color:#777;
    margin-bottom:10px;
}
.chat-webview-settings-panel button{
    width:100%;
    height:48px;
    border:0;
    border-radius:16px;
    margin-top:8px;
    background:rgba(255,255,255,.66);
    color:#333;
    font-size:15px;
    font-weight:700;
}
.chat-webview-settings-panel button.danger{
    color:#d14b4b;
}
`
}

function setChatWebViewMode(enabled) {
    const screen = document.getElementById("screen")
    if (!screen) return
    screen.classList.toggle("chat-webview-mode", !!enabled)
}

function closeChatSettingsPanel() {
    const old = document.getElementById("chatWebviewSettingsMask")
    if (old) old.remove()
}

function showChatSettingsPanel() {
    closeChatSettingsPanel()
    const mask = document.createElement("div")
    mask.id = "chatWebviewSettingsMask"
    mask.className = "chat-webview-settings-mask"
    mask.onclick = function(e) {
        if (e.target === mask) closeChatSettingsPanel()
    }
    mask.innerHTML = `
        <div class="chat-webview-settings-panel">
            <div class="chat-webview-settings-title">${escapeHtml(currentContact?.name || "角色")} · 聊天设置</div>
            <button onclick="closeChatSettingsPanel();openChatContactEditor()">编辑角色资料</button>
            <button onclick="closeChatSettingsPanel();openChatMemoryEditor()">长期记忆</button>
            <button onclick="closeChatSettingsPanel();testAiMessage()">让TA主动找我</button>
            <button onclick="closeChatSettingsPanel();openApp('chat','me')">Chat主题 / 心声卡片</button>
            <button class="danger" onclick="closeChatSettingsPanel()">关闭</button>
        </div>
    `
    document.body.appendChild(mask)
}

function openChatContactEditor() {
    setChatWebViewMode(false)
    showContactEditor()
}

function openChatMemoryEditor() {
    setChatWebViewMode(false)
    showMemoryEditor()
}

function getChatBackgroundStyle(contact) {
    const bg = contact?.chatBackground || localStorage.getItem("MJI_CHAT_BG") || ""
    if (!bg) return ""
    if (bg.startsWith("color:")) return `background:${bg.replace("color:", "")};`
    return `background-image:url('${String(bg).replace(/'/g, "\'")}');`
}

function applyChatBackground() {
    const bg = document.getElementById("chatWebviewBg")
    const shell = document.getElementById("chatWebviewShell")
    if (!bg || !shell) return
    const style = getChatBackgroundStyle(currentContact)
    if (style) {
        bg.setAttribute("style", style)
        shell.classList.add("has-bg")
    } else {
        bg.removeAttribute("style")
        shell.classList.remove("has-bg")
    }
}

function showWechatShell(tab = "msg") {
    currentPage = "chat"
    currentWechatTab = tab
    setChatWebViewMode(false)
    closeChatSettingsPanel()
    applyChatCustomCss()

    const root = document.getElementById("wechatRoot")
    if (!root) return

    root.innerHTML = `
        <div class="wechat-shell">
            <div class="wechat-view" id="wechatView"></div>

            <div class="wechat-bottom-nav">
                <button id="nav_msg" onclick="switchWechatTab('msg')"><span>💬</span><em>消息</em></button>
                <button id="nav_contact" onclick="switchWechatTab('contact')"><span>👥</span><em>联系人</em></button>
                <button id="nav_discovery" onclick="switchWechatTab('discovery')"><span>🌙</span><em>朋友圈</em></button>
                <button id="nav_me" onclick="switchWechatTab('me')"><span>🙂</span><em>我</em></button>
            </div>
        </div>
    `

    switchWechatTab(tab)
}

function switchWechatTab(tab) {
    currentPage = "chat"
    currentWechatTab = tab

    document.querySelectorAll(".wechat-bottom-nav button").forEach(btn => btn.classList.remove("active"))
    const active = document.getElementById("nav_" + tab)
    if (active) active.classList.add("active")

    if (tab === "msg") return renderWechatMessages()
    if (tab === "contact") return renderWechatContacts()
    if (tab === "discovery") return renderWechatDiscovery()
    if (tab === "me") return renderWechatMe()
}

async function renderWechatMessages() {
    const view = document.getElementById("wechatView")
    if (!view) return

    view.innerHTML = `
        <div class="wechat-page-head">
            <div>
                <div class="wechat-title">消息</div>
                <div class="wechat-subtitle">私聊和群聊都在这里</div>
            </div>
            <button class="wechat-head-btn" onclick="showCreateGroup()">＋ 群聊</button>
        </div>
        <div id="chatList"></div>
    `

    await loadChatList()
}

function renderWechatContacts() {
    const view = document.getElementById("wechatView")
    if (!view) return

    view.innerHTML = `
        <div class="wechat-page-head">
            <div>
                <div class="wechat-title">联系人</div>
                <div class="wechat-subtitle">角色档案和私聊入口</div>
            </div>
            <button class="wechat-head-btn" onclick="showAddContact()">＋ 添加</button>
        </div>
        <div id="contactList"></div>
    `

    loadContacts()
}

function renderWechatDiscovery() {
    const view = document.getElementById("wechatView")
    if (!view) return

    view.innerHTML = `<div id="momentsRoot"></div>`
    showMoments()
    currentPage = "chat"
}

function renderWechatMe() {
    const view = document.getElementById("wechatView")
    if (!view) return

    const name = localStorage.getItem("MJI_MY_NAME") || "我"
    const avatar = localStorage.getItem("MJI_MY_AVATAR") || ""

    view.innerHTML = `
        <div class="me-simple-page">
            <button class="me-simple-profile" onclick="showMyProfileEditor()">
                <div class="me-simple-avatar">${avatarHtml(avatar, "我")}</div>
                <div class="me-simple-name">${escapeHtml(name)}</div>
                <span class="me-simple-arrow">›</span>
            </button>

            <button class="me-simple-setting" onclick="showChatDisplaySettingsPage()">
                <div>
                    <div class="me-simple-setting-title">设置</div>
                    <div class="me-simple-setting-sub">聊天气泡设置、心声卡片设置</div>
                </div>
                <span>›</span>
            </button>
        </div>
    `

    ensureStrictMePageStyle()
}

function ensureStrictMePageStyle(){
    if (document.getElementById("strictMePageStyle")) return
    const style = document.createElement("style")
    style.id = "strictMePageStyle"
    style.textContent = `
        .me-simple-page{padding:18px 14px 90px;background:var(--app-bg,#f3f1ec);min-height:100%;box-sizing:border-box;}
        .me-simple-profile,.me-simple-setting{width:100%;border:0;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.55);border-radius:22px;box-shadow:0 8px 24px rgba(0,0,0,.045);color:#141821;text-align:left;box-sizing:border-box;}
        .me-simple-profile{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 14px;}
        .me-simple-avatar{width:62px;height:62px;border-radius:20px;overflow:hidden;background:rgba(232,230,224,.8);flex-shrink:0;}
        .me-simple-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
        .me-simple-name{font-size:20px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .me-simple-arrow,.me-simple-setting span{font-size:24px;color:#9ca3af;}
        .me-simple-setting{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;margin:0;}
        .me-simple-setting-title{font-size:16px;font-weight:800;margin-bottom:4px;}
        .me-simple-setting-sub{font-size:12px;color:#8b909a;line-height:1.45;}
    `
    document.head.appendChild(style)
}

function bindThemeFileInputs() {
    const chatFile = document.getElementById("chatCssFile")
    if (chatFile) {
        chatFile.onchange = async function() {
            const file = chatFile.files?.[0]
            if (!file) return
            document.getElementById("chatCssText").value = await file.text()
            chatFile.value = ""
        }
    }

    const thoughtsFile = document.getElementById("thoughtsFile")
    if (thoughtsFile) {
        thoughtsFile.onchange = async function() {
            const file = thoughtsFile.files?.[0]
            if (!file) return
            document.getElementById("thoughtsTemplateText").value = await file.text()
            thoughtsFile.value = ""
        }
    }
}

function saveChatThemeCss() {
    const css = document.getElementById("chatCssText")?.value || ""
    localStorage.setItem("MJI_CHAT_CUSTOM_CSS", css)
    applyChatCustomCss()
    alert("Chat主题已应用")
}

function clearChatThemeCss() {
    localStorage.removeItem("MJI_CHAT_CUSTOM_CSS")
    applyChatCustomCss()
    renderWechatMe()
    alert("已恢复默认Chat主题")
}

function saveThoughtsCardStyle() {
    const raw = document.getElementById("thoughtsTemplateText")?.value || ""
    const text = raw.trim()
    if (!text) {
        alert("内容不能为空")
        return
    }

    if (text.includes("<") && text.includes("{{thoughts}}")) {
        localStorage.setItem("MJI_THOUGHTS_CARD_TEMPLATE", text)
        localStorage.removeItem("MJI_THOUGHTS_CARD_CSS")
    } else {
        localStorage.setItem("MJI_THOUGHTS_CARD_CSS", text)
        localStorage.removeItem("MJI_THOUGHTS_CARD_TEMPLATE")
    }

    alert("心声卡片样式已应用")
}

function clearThoughtsCardStyle() {
    localStorage.removeItem("MJI_THOUGHTS_CARD_TEMPLATE")
    localStorage.removeItem("MJI_THOUGHTS_CARD_CSS")
    renderWechatMe()
    alert("已恢复默认心声卡片")
}

async function loadChatList() {
    const container = document.getElementById("chatList")
    if (!container) return

    const contacts = await getAllStoreData("contacts")
    const messages = await getAllStoreData("messages")
    const groups = await getAllStoreData("groups")

    const rows = []

    contacts.forEach(c => {
        const list = messages
            .filter(m => m.contactId === c.id)
            .sort((a,b) => b.createdAt - a.createdAt)

        const last = list[0]
        if (!last) return

        rows.push({
            type: "contact",
            id: c.id,
            name: c.name,
            avatar: c.avatar,
            sub: last.content || "",
            time: last.createdAt || 0,
            unread: c.unreadCount || 0
        })
    })

    groups.forEach(g => {
        const list = messages
            .filter(m => m.contactId === g.id)
            .sort((a,b) => b.createdAt - a.createdAt)

        const last = list[0]

        rows.push({
            type: "group",
            id: g.id,
            name: g.name || "群聊",
            avatar: g.avatar,
            sub: last ? (last.content || "") : "点击进入群聊",
            time: last?.createdAt || g.updatedAt || g.createdAt || 0,
            unread: g.unreadCount || 0
        })
    })

    rows.sort((a,b) => b.time - a.time)

    container.innerHTML = rows.map(row => `
        <div class="contact" onclick="${row.type === "group" ? `openGroupChat('${row.id}')` : `openChat('${row.id}')`}">
            <div class="contact-avatar">
                ${avatarHtml(row.avatar, row.type === "group" ? "👥" : "🙂")}
            </div>

            <div class="contact-info">
                <div class="chat-list-top">
                    <div class="contact-name">${escapeHtml(row.name)}</div>
                    <div class="chat-list-time">${row.time ? formatMsgTime(row.time) : ""}</div>
                </div>
                <div class="chat-list-bottom">
                    <div class="contact-sub">${escapeHtml((row.sub || "").slice(0, 30))}</div>
                    ${row.unread > 0 ? `<div class="unread-badge">${row.unread > 99 ? "99+" : row.unread}</div>` : ""}
                </div>
            </div>
        </div>
    `).join("") || `<p class="empty">暂无聊天。去联系人页添加角色，或右上角新建群聊。</p>`
}

function openChat(contactId) {
    chatBackPage = currentWechatTab === "contact" ? "contacts" : "chat"
    currentPage = "chatDetail"
    applyChatCustomCss()

    const tx = db.transaction("contacts", "readonly")
    const store = tx.objectStore("contacts")
    const req = store.get(contactId)

    req.onsuccess = function() {
        currentContact = req.result
        if (!currentContact) {
            alert("角色不存在")
            openApp("chat", "contact")
            return
        }

        currentContact.unreadCount = 0
        const tx2 = db.transaction("contacts", "readwrite")
        tx2.objectStore("contacts").put(currentContact)
        tx2.oncomplete = function() { updateDesktopUnreadBadge() }

        document.getElementById("appTitle").innerText = currentContact.name
        setChatWebViewMode(true)
        document.getElementById("appContent").innerHTML = `
            <div class="chat-webview-shell" id="chatWebviewShell">
                <div class="chat-webview-bg" id="chatWebviewBg"></div>
                <div class="chat-webview-header">
                    <button class="chat-webview-back" onclick="openApp('chat', chatBackPage === 'contacts' ? 'contact' : 'msg')">‹</button>
                    <div class="chat-webview-title">
                        <div class="chat-title-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                        <div class="chat-title-name">${escapeHtml(currentContact.name || "聊天")}</div>
                    </div>
                    <button class="chat-webview-more" onclick="showChatSettingsPanel()">⋯</button>
                </div>
                <div id="chatBox" class="chat-box themed-chat-box chat-webview-box"></div>
                <div class="chat-input themed-chat-input chat-webview-input">
                    <input id="messageInput" placeholder="输入消息" onkeydown="if(event.key==='Enter'){sendMessage()}">
                    <button onclick="sendMessage()">发送</button>
                    <button class="reply-now-btn" onclick="replyNow()">TA</button>
                </div>
            </div>
        `

        loadMessages(currentContact.id)
        applyChatBackground()
    }
}

function makeThoughtAvatarHtml(avatar, fallback, onClick) {
    return `<div class="chat-avatar thought-avatar" onclick="event.stopPropagation();${onClick}">${avatarHtml(avatar, fallback)}</div>`
}

function loadMessages(contactId) {
    const tx = db.transaction("messages", "readonly")
    const store = tx.objectStore("messages")
    const req = store.getAll()

    req.onsuccess = function() {
        const box = document.getElementById("chatBox")
        if (!box) return

        const list = req.result
            .filter(m => m.contactId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)

        let html = ""

        list.forEach(function(m) {
            const timeText = formatMsgTime(m.createdAt)

            if (m.role === "user") {
                html += `
                    <div class="chat-row user-row" data-msg-id="${escapeHtml(m.id || "")}">
                        <div class="msg-wrap user-wrap">
                            <div class="msg user-msg">${escapeHtml(m.content)}</div>
                            <div class="msg-time">${timeText}</div>
                        </div>
                        <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
                    </div>
                `
            } else {
                const safeThought = escapeHtml(m.innerThoughts || "")
                html += `
                    <div class="chat-row ai-row" data-msg-id="${escapeHtml(m.id || "")}">
                        ${makeThoughtAvatarHtml(currentContact.avatar, "🙂", `showThoughtsCardForMessage('${m.id || ""}', '${currentContact.id}', '')`)}
                        <div class="msg-wrap ai-wrap">
                            <div class="msg ai-msg">${escapeHtml(m.content)}</div>
                            ${safeThought ? `<div class="thought-hint">点头像看心声</div>` : ""}
                            <div class="msg-time">${timeText}</div>
                        </div>
                    </div>
                `
            }
        })

        box.innerHTML = html || `<p class="empty">暂无消息</p>`
        box.scrollTop = box.scrollHeight
    }
}

function sendMessage() {
    const input = document.getElementById("messageInput")
    const text = input.value.trim()

    if (!text) return
    if (!currentContact) return

    const box = document.getElementById("chatBox")
    const now = Date.now()

    box.innerHTML += `
        <div class="chat-row user-row">
            <div class="msg-wrap user-wrap">
                <div class="msg user-msg">${escapeHtml(text)}</div>
                <div class="msg-time">${formatMsgTime(now)}</div>
            </div>
            <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
        </div>
    `

    saveMessage(currentContact.id, "user", text, now)
    input.value = ""
    box.scrollTop = box.scrollHeight
}

function parseAiReplyBlocks(raw) {
    const text = String(raw || "").trim()
    if (!text) return []

    let blocks = []

    if (text.includes("<|SPLIT|>")) {
        blocks = text.split("<|SPLIT|>")
    } else if (/\[MSG\]/.test(text)) {
        blocks = text.split(/\[MSG\]/)
    } else {
        blocks = [text]
    }

    return blocks.map(block => {
        const b = block.trim()
        if (!b) return null

        const inner = (b.match(/【\s*内心\s*】[：:]?\s*([\s\S]*?)(?=【\s*台词\s*】|$)/) || [])[1]?.trim() || ""
        let content = (b.match(/【\s*台词\s*】[：:]?\s*([\s\S]*)/) || [])[1]?.trim() || ""

        if (!content) {
            content = b
                .replace(/【\s*内心\s*】[：:]?[\s\S]*?(?=【\s*台词\s*】|$)/g, "")
                .replace(/【\s*台词\s*】[：:]?/g, "")
                .trim()
        }

        return {
            content: content.replace(/^\[MSG\]/, "").trim(),
            innerThoughts: inner
        }
    }).filter(x => x && x.content)
}

async function callAI(userText) {
    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        alert("请先配置API")
        return
    }

    const box = document.getElementById("chatBox")
    box.innerHTML += `
        <div id="thinking" class="chat-row ai-row">
            <div class="chat-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
            <div class="msg ai-msg">正在输入中...</div>
        </div>
    `

    try {
        const history = await getRecentMessages(currentContact.id)
        const memory = await recallRelevantMemory(currentContact.id, userText)
        const worldBookText = safeWorldBook(await getWorldBookInjection(userText))

        const messages = [
            {
                role: "system",
                content: `
${currentContact?.prompt || "你是一个AI角色"}

【角色资料】
姓名：${currentContact.name || ""}
身份：${currentContact.identity || ""}
生日：${currentContact.birthday || ""}
年龄：${currentContact.age || ""}
性格：${currentContact.personality || ""}
简介：${currentContact.profile || ""}

【长期记忆】
${memory || "暂无长期记忆"}

【世界书】
${worldBookText || "暂无命中的世界书"}

【输出格式】
你可以一次回复1到3条短消息，每条之间用 <|SPLIT|> 分隔。
每条都必须严格包含：
【内心】这一条消息背后的真实心理活动，中文，给用户点头像查看，不直接显示在聊天气泡里。
【台词】真正发给用户的微信消息。

示例：
【内心】她刚才说这句话的时候，我有点想靠近，但不能表现得太急。
【台词】嗯，我听着。你慢慢说。
<|SPLIT|>
【内心】想确认她是不是还在难受。
【台词】刚才那句不像随口说的。

不要动作描写。不要解释格式。不要超过3条。`
            },
            ...history.map(m => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content
            }))
        ]

        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({ model: apiModel, messages })
        })

        const data = await response.json()
        const thinking = document.getElementById("thinking")
        if (thinking) thinking.remove()

        if (!response.ok) {
            alert("API错误：" + (data.error?.message || response.status))
            return
        }

        const reply = data.choices?.[0]?.message?.content || "无回复"
        const replies = parseAiReplyBlocks(reply)

        await showAiRepliesSlowly(currentContact.id, replies)
        maybeExtractMemory()
        box.scrollTop = box.scrollHeight

    } catch (e) {
        const thinking = document.getElementById("thinking")
        if (thinking) thinking.remove()
        box.innerHTML += `<div class="msg ai-msg">API错误：${escapeHtml(e.message)}</div>`
    }
}

async function showAiRepliesSlowly(contactId, replies) {
    const box = document.getElementById("chatBox")

    for (let i = 0; i < replies.length; i++) {
        const item = typeof replies[i] === "string" ? { content: replies[i], innerThoughts: "" } : replies[i]
        const now = Date.now()

        if (currentContact && currentContact.id === contactId && currentPage === "chatDetail" && box) {
            const typingId = "typing_" + now + "_" + i

            box.innerHTML += `
                <div id="${typingId}" class="chat-row ai-row">
                    <div class="chat-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                    <div class="msg-wrap ai-wrap"><div class="msg ai-msg typing-msg">正在输入中...</div></div>
                </div>
            `

            box.scrollTop = box.scrollHeight
            await sleep(700 + Math.random() * 900)

            const typing = document.getElementById(typingId)
            if (typing) typing.remove()

            const msgId = "msg_" + now + "_" + Math.random().toString(16).slice(2)

            box.innerHTML += `
                <div class="chat-row ai-row" data-msg-id="${msgId}">
                    ${makeThoughtAvatarHtml(currentContact.avatar, "🙂", `showThoughtsCardForMessage('${msgId}', '${contactId}', '')`)}
                    <div class="msg-wrap ai-wrap">
                        <div class="msg ai-msg">${escapeHtml(item.content)}</div>
                        ${item.innerThoughts ? `<div class="thought-hint">点头像看心声</div>` : ""}
                        <div class="msg-time">${formatMsgTime(now)}</div>
                    </div>
                </div>
            `

            box.scrollTop = box.scrollHeight

            saveMessage(contactId, "assistant", item.content, now, {
                id: msgId,
                innerThoughts: item.innerThoughts || ""
            })
        } else {
            saveMessage(contactId, "assistant", item.content, now, {
                innerThoughts: item.innerThoughts || ""
            })
        }

        Promise.all([getRecentMessages(contactId), getContactById(contactId)]).then(([history, contact]) => {
            const lastUser = [...history].reverse().find(m => m.role === "user")
            afterAiMessageMemoryChecks(contactId, contact?.name || currentContact?.name || "角色", lastUser?.content || "", item.content)
        }).catch(() => {})

        if (i < replies.length - 1) {
            await sleep(500 + Math.random() * 700)
        }
    }
}

async function showThoughtsCardForMessage(msgId, contactId, senderId = "") {
    const messages = await getAllStoreData("messages")
    const contacts = await getAllStoreData("contacts")

    const msg = messages.find(m => m.id === msgId)
    if (!msg) {
        alert("这条消息没有心声")
        return
    }

    const contact = senderId ? contacts.find(c => c.id === senderId) : (currentContact || contacts.find(c => c.id === contactId))
    showThoughtsCard(msg.innerThoughts || "这条消息没有记录心声。", contact || {})
}

function showThoughtsCard(thoughts, contact = {}) {
    let overlay = document.getElementById("pwaThoughtsOverlay")
    if (!overlay) {
        overlay = document.createElement("div")
        overlay.id = "pwaThoughtsOverlay"
        overlay.innerHTML = `<div class="pwa-thoughts-mask" onclick="closeThoughtsCard()"></div><div id="pwaThoughtsInner"></div>`
        document.body.appendChild(overlay)
    }

    const inner = document.getElementById("pwaThoughtsInner")
    const name = contact.name || currentContact?.name || "角色"
    const avatar = contact.avatar || currentContact?.avatar || ""
    const template = localStorage.getItem("MJI_THOUGHTS_CARD_TEMPLATE") || ""
    const css = localStorage.getItem("MJI_THOUGHTS_CARD_CSS") || ""

    if (template) {
        inner.innerHTML = template
            .replaceAll("{{name}}", escapeHtml(name))
            .replaceAll("{{avatar}}", avatar)
            .replaceAll("{{thoughts}}", escapeHtml(thoughts))
    } else {
        inner.innerHTML = `
            <div class="default-thought-card">
                <div class="thought-card-head">
                    <div class="thought-card-avatar">${avatarHtml(avatar, "🙂")}</div>
                    <div><div class="thought-card-label">内心独白</div><div class="thought-card-name">${escapeHtml(name)}</div></div>
                    <button onclick="event.stopPropagation();openApp('chat','me')">⚙</button>
                    <button onclick="event.stopPropagation();closeThoughtsCard()">✕</button>
                </div>
                <div class="thought-card-body">${escapeHtml(thoughts)}</div>
            </div>
        `
    }

    let style = document.getElementById("mji-thoughts-card-css")
    if (!style) {
        style = document.createElement("style")
        style.id = "mji-thoughts-card-css"
        document.head.appendChild(style)
    }
    style.textContent = css

    overlay.classList.add("visible")
}

function closeThoughtsCard() {
    const overlay = document.getElementById("pwaThoughtsOverlay")
    if (overlay) overlay.classList.remove("visible")
}

async function generateNpcMessage(contact, showAlert = false) {
    if (!contact) return

    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")

    if (!apiBase || !apiKey || !apiModel) {
        if (showAlert) alert("请先配置API")
        return
    }

    const now = Date.now()
    const lastNpcMessageAt = contact.lastNpcMessageAt || 0

    if (lastNpcMessageAt && now - lastNpcMessageAt < NPC_MESSAGE_COOLDOWN_MS) {
        if (showAlert) alert("主动消息冷却中")
        return
    }

    const memory = safeMemory(await recallRelevantMemory(contact.id, "主动消息"))
    const history = await getRecentMessages(contact.id)
    const chatText = history.slice(-20).map(m => `${m.role === "user" ? "用户" : "角色"}：${m.content}`).join("\n")

    try {
        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                messages: [
                    { role: "system", content: `你是一个AI陪伴应用里的角色。你现在要主动给用户发一条微信式私聊消息。输出必须包含【内心】和【台词】。不要解释，不要旁白。` },
                    { role: "user", content: `
【角色资料】
姓名：${contact.name || ""}
身份：${contact.identity || ""}
性格：${contact.personality || ""}
简介：${contact.profile || ""}
角色系统Prompt：${contact.prompt || ""}

【长期记忆】
${memory || "暂无"}

【最近聊天】
${chatText || "暂无"}

【格式】
【内心】你主动找用户时真正的心理活动
【台词】真正发出的消息，不超过30字
` }
                ]
            })
        })

        const data = await response.json()
        if (!response.ok) {
            if (showAlert) alert("主动消息API错误：" + (data.error?.message || response.status))
            return
        }

        const reply = data.choices?.[0]?.message?.content?.trim()
        if (!reply) {
            if (showAlert) alert("主动消息生成失败：模型没有返回内容")
            return
        }

        const parsed = parseAiReplyBlocks(reply)
        receiveAiMessage(contact.id, parsed.length ? parsed[0] : { content: reply, innerThoughts: "" })

    } catch (e) {
        if (showAlert) alert("主动消息请求失败：" + e.message)
    }
}

function receiveAiMessage(contactId, text) {
    const parts = Array.isArray(text)
        ? text
        : (typeof text === "object" ? [text] : parseAiReplyBlocks(text))

    if (parts.length === 0) return

    const isCurrentChat = currentContact && currentContact.id === contactId && currentPage === "chatDetail"

    const tx = db.transaction(["contacts", "messages"], "readwrite")
    const contactStore = tx.objectStore("contacts")
    const messageStore = tx.objectStore("messages")
    const req = contactStore.get(contactId)
    let contactForMemory = null

    req.onsuccess = function() {
        const contact = req.result
        contactForMemory = contact
        if (!contact) return

        contact.lastNpcMessageAt = Date.now()
        contact.unreadCount = isCurrentChat ? 0 : (contact.unreadCount || 0) + parts.length
        if (currentContact && currentContact.id === contactId) currentContact = contact
        contactStore.put(contact)

        if (!isCurrentChat) {
            parts.forEach(function(part, index) {
                const item = typeof part === "string" ? { content: part, innerThoughts: "" } : part
                messageStore.put({
                    id: "msg_" + Date.now() + "_" + index + "_" + Math.random().toString(16).slice(2),
                    contactId,
                    role: "assistant",
                    content: item.content,
                    innerThoughts: item.innerThoughts || "",
                    createdAt: Date.now() + index
                })
            })
        }
    }

    tx.oncomplete = async function() {
        if (isCurrentChat) {
            await showAiRepliesSlowly(contactId, parts)
        } else {
            parts.forEach(part => {
                const item = typeof part === "string" ? { content: part, innerThoughts: "" } : part
                afterAiMessageMemoryChecks(contactId, contactForMemory?.name || "角色", "", item.content)
            })
        }
        if (currentPage === "chat") switchWechatTab(currentWechatTab || "msg")
        updateDesktopUnreadBadge()
    }
}

/* ============================================================
   Chat UI fix 2026-06-16
   - 顶部只显示名字，不显示头像
   - 删除“点头像看心声”文字
   - 左侧 + 发图片，输入框旁表情包按钮
   - 三个点进入设置页，不再弹出底部选项
============================================================ */

function saveMessage(contactId, role, content, createdAt = Date.now(), extra = {}) {
    const tx = db.transaction("messages", "readwrite")
    const store = tx.objectStore("messages")
    store.put({
        id: extra.id || ("msg_" + createdAt + "_" + Math.random().toString(16).slice(2)),
        contactId,
        role,
        content,
        createdAt,
        ...extra
    })
}

function getChatFullscreenBaseCss() {
    return `
#screen.chat-webview-mode{background:#000!important;padding:0!important;}
#screen.chat-webview-mode .app-header{display:none!important;}
#screen.chat-webview-mode .app-content{position:absolute!important;inset:0!important;padding:0!important;margin:0!important;height:100%!important;overflow:hidden!important;background:transparent!important;}
.chat-webview-shell{position:absolute;inset:0;display:flex;flex-direction:column;min-height:0;background:var(--chat-page-bg,#0b0b0f);overflow:hidden;}
.chat-webview-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle at 18% 10%,rgba(255,255,255,.06),transparent 26%),linear-gradient(180deg,rgba(36,36,43,.98),rgba(18,18,24,.98));background-size:cover;background-position:center;}
.chat-webview-shell.has-bg .chat-webview-bg::after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.18);}
.chat-webview-header{position:relative;z-index:2;height:58px;flex-shrink:0;display:grid;grid-template-columns:48px minmax(0,1fr)48px;align-items:center;padding:0 6px;background:rgba(28,28,34,.58);border-bottom:1px solid rgba(255,255,255,.12);backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);color:#f5f5f7;}
.chat-webview-back,.chat-webview-more{width:42px;height:42px;border:0;border-radius:16px;background:rgba(255,255,255,.08);color:#f5f5f7;font-size:25px;display:flex;align-items:center;justify-content:center;}
.chat-webview-more{font-size:22px;}
.chat-webview-title{min-width:0;display:flex;align-items:center;justify-content:center;font-weight:700;}
.chat-webview-title .chat-title-avatar{display:none!important;}
.chat-webview-title .chat-title-name{max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px;}
.chat-webview-box{position:relative;z-index:1;flex:1;min-height:0;overflow-y:auto;padding:14px 12px 18px!important;background:transparent!important;-webkit-overflow-scrolling:touch;}
.chat-webview-input{position:relative;z-index:2;flex-shrink:0;display:flex;gap:7px;align-items:center;padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px))!important;background:rgba(28,28,34,.62)!important;border-top:1px solid rgba(255,255,255,.12);backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);}
.chat-webview-input input[type="text"],.chat-webview-input input:not([type]){flex:1;min-width:0;height:42px;border:0;outline:0;border-radius:18px;padding:0 14px;background:rgba(255,255,255,.16);color:#fff;font-size:15px;}
.chat-webview-input input::placeholder{color:rgba(255,255,255,.48);}
.chat-webview-input button{height:42px;border:0;border-radius:16px;padding:0 13px;background:rgba(198,210,234,.86);color:#333845;font-weight:700;white-space:nowrap;}
.chat-webview-input .input-icon-btn{width:42px;padding:0;border-radius:50%;background:rgba(255,255,255,.16);color:rgba(255,255,255,.9);font-size:21px;font-weight:700;flex-shrink:0;}
.chat-webview-input .sticker-btn{font-size:20px;}
.chat-webview-input .reply-now-btn{width:48px;padding:0;background:rgba(255,255,255,.14);color:rgba(255,255,255,.88);}
.chat-webview-box .chat-row{margin:8px 0;}
.chat-webview-box .msg{max-width:min(74vw,270px);word-break:break-word;white-space:pre-wrap;line-height:1.55;box-shadow:0 6px 18px rgba(0,0,0,.12);}
.chat-webview-box .ai-msg{background:rgba(255,255,255,.82)!important;color:#24242b!important;border:1px solid rgba(255,255,255,.52);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);}
.chat-webview-box .user-msg{background:rgba(198,210,234,.88)!important;color:#2f3543!important;border:1px solid rgba(255,255,255,.42);backdrop-filter:blur(18px) saturate(150%);-webkit-backdrop-filter:blur(18px) saturate(150%);}
.chat-webview-box .thought-hint{display:none!important;}
.chat-media-image{display:block;max-width:min(62vw,230px);max-height:260px;border-radius:16px;object-fit:cover;}
.chat-sticker-image{display:block;width:96px;max-height:120px;border-radius:12px;object-fit:contain;background:transparent;}
.chat-settings-page{padding:14px;background:#f2f2f6;min-height:100%;}
.chat-settings-card{background:#fff;border-radius:18px;overflow:hidden;margin-bottom:14px;box-shadow:0 8px 22px rgba(0,0,0,.04);}
.chat-settings-profile{display:flex;align-items:center;gap:12px;padding:16px;}
.chat-settings-avatar{width:52px;height:52px;border-radius:16px;overflow:hidden;background:#eee;flex-shrink:0;}
.chat-settings-name{font-size:18px;font-weight:700;color:#111;}
.chat-settings-sub{font-size:12px;color:#888;margin-top:4px;}
.chat-settings-row{width:100%;height:52px;border:0;background:#fff;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;font-size:15px;color:#111;text-align:left;}
.chat-settings-row:first-child{border-top:0;}
.chat-settings-row span:last-child{color:#aaa;}
.chat-settings-row.danger{color:#e14b4b;}
.sticker-mask{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.25);display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
.sticker-panel{width:min(390px,100vw);max-height:58vh;background:rgba(246,245,242,.96);border-radius:24px 24px 0 0;padding:14px 14px 20px;box-shadow:0 -18px 45px rgba(0,0,0,.22);overflow:auto;}
.sticker-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;color:#333;font-weight:700;}
.sticker-panel-head button{border:0;background:rgba(0,0,0,.06);border-radius:12px;padding:8px 12px;color:#333;}
.sticker-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.sticker-item{border:0;background:#fff;border-radius:16px;height:72px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.sticker-item img{max-width:100%;max-height:100%;object-fit:contain;}
.sticker-add-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px;}
.sticker-add-row input{height:42px;border:0;border-radius:14px;padding:0 12px;background:#fff;outline:0;}
.sticker-add-row button{border:0;border-radius:14px;background:#c8d4ee;color:#333845;font-weight:700;padding:0 14px;}
`
}

function showChatSettingsPanel() {
    showChatSettingsPage()
}

function showChatSettingsPage() {
    if (!currentContact) return
    setChatWebViewMode(false)
    closeChatSettingsPanel?.()
    currentPage = "chatSettingsPage"
    document.getElementById("appTitle").innerText = "聊天设置"
    document.getElementById("appContent").innerHTML = `
        <div class="chat-settings-page">
            <div class="chat-settings-card">
                <div class="chat-settings-profile">
                    <div class="chat-settings-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                    <div>
                        <div class="chat-settings-name">${escapeHtml(currentContact.name || "角色")}</div>
                        <div class="chat-settings-sub">角色资料、记忆、背景和聊天管理</div>
                    </div>
                </div>
            </div>
            <div class="chat-settings-card">
                <button class="chat-settings-row" onclick="showContactEditor()"><span>编辑角色资料</span><span>›</span></button>
                <button class="chat-settings-row" onclick="showMemoryEditor()"><span>长期记忆</span><span>›</span></button>
                <button class="chat-settings-row" onclick="openApp('chat','me')"><span>Chat主题 / 心声卡片</span><span>›</span></button>
                <button class="chat-settings-row" onclick="testAiMessage()"><span>让TA主动找我</span><span>›</span></button>
            </div>
            <div class="chat-settings-card">
                <button class="chat-settings-row" onclick="openChat(currentContact.id)"><span>返回聊天</span><span>›</span></button>
            </div>
        </div>
    `
}

function renderPrivateMessageContent(m) {
    if (m.imageSrc) {
        return `<img class="chat-media-image" src="${escapeHtml(m.imageSrc)}" alt="图片">`
    }
    if (m.stickerSrc) {
        return `<img class="chat-sticker-image" src="${escapeHtml(m.stickerSrc)}" alt="表情包">`
    }
    return escapeHtml(m.content || "")
}

function openChat(contactId) {
    chatBackPage = currentWechatTab === "contact" ? "contacts" : "chat"
    currentPage = "chatDetail"
    applyChatCustomCss()

    const tx = db.transaction("contacts", "readonly")
    const store = tx.objectStore("contacts")
    const req = store.get(contactId)

    req.onsuccess = function() {
        currentContact = req.result
        if (!currentContact) {
            alert("角色不存在")
            openApp("chat", "contact")
            return
        }

        currentContact.unreadCount = 0
        const tx2 = db.transaction("contacts", "readwrite")
        tx2.objectStore("contacts").put(currentContact)
        tx2.oncomplete = function() { updateDesktopUnreadBadge() }

        document.getElementById("appTitle").innerText = currentContact.name
        setChatWebViewMode(true)
        document.getElementById("appContent").innerHTML = `
            <div class="chat-webview-shell" id="chatWebviewShell">
                <div class="chat-webview-bg" id="chatWebviewBg"></div>
                <div class="chat-webview-header">
                    <button class="chat-webview-back" onclick="openApp('chat', chatBackPage === 'contacts' ? 'contact' : 'msg')">‹</button>
                    <div class="chat-webview-title">
                        <div class="chat-title-name">${escapeHtml(currentContact.name || "聊天")}</div>
                    </div>
                    <button class="chat-webview-more" onclick="showChatSettingsPage()">⋯</button>
                </div>
                <div id="chatBox" class="chat-box themed-chat-box chat-webview-box"></div>
                <div class="chat-input themed-chat-input chat-webview-input">
                    <input type="file" id="chatImageInput" accept="image/*" hidden onchange="sendChatImageFromInput(event)">
                    <button class="input-icon-btn" onclick="document.getElementById('chatImageInput').click()">＋</button>
                    <input id="messageInput" type="text" placeholder="输入消息" onkeydown="if(event.key==='Enter'){sendMessage()}">
                    <button class="input-icon-btn sticker-btn" onclick="showStickerPanel('private')">☺</button>
                    <button onclick="sendMessage()">发送</button>
                    <button class="reply-now-btn" onclick="replyNow()">TA</button>
                </div>
            </div>
        `

        loadMessages(currentContact.id)
        applyChatBackground()
    }
}

function loadMessages(contactId) {
    const tx = db.transaction("messages", "readonly")
    const store = tx.objectStore("messages")
    const req = store.getAll()

    req.onsuccess = function() {
        const box = document.getElementById("chatBox")
        if (!box) return

        const list = req.result
            .filter(m => m.contactId === contactId)
            .sort((a, b) => a.createdAt - b.createdAt)

        let html = ""
        list.forEach(function(m) {
            const timeText = formatMsgTime(m.createdAt)
            if (m.role === "user") {
                html += `
                    <div class="chat-row user-row" data-msg-id="${escapeHtml(m.id || "")}">
                        <div class="msg-wrap user-wrap">
                            <div class="msg user-msg">${renderPrivateMessageContent(m)}</div>
                            <div class="msg-time">${timeText}</div>
                        </div>
                        <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
                    </div>
                `
            } else {
                html += `
                    <div class="chat-row ai-row" data-msg-id="${escapeHtml(m.id || "")}">
                        ${makeThoughtAvatarHtml(currentContact.avatar, "🙂", `showThoughtsCardForMessage('${m.id || ""}', '${currentContact.id}', '')`)}
                        <div class="msg-wrap ai-wrap">
                            <div class="msg ai-msg">${renderPrivateMessageContent(m)}</div>
                            <div class="msg-time">${timeText}</div>
                        </div>
                    </div>
                `
            }
        })
        box.innerHTML = html || `<p class="empty">暂无消息</p>`
        box.scrollTop = box.scrollHeight
    }
}

function sendMessage() {
    const input = document.getElementById("messageInput")
    const text = input?.value?.trim() || ""
    if (!text || !currentContact) return
    appendPrivateUserMessage({ content: text, createdAt: Date.now() })
    saveMessage(currentContact.id, "user", text, Date.now())
    input.value = ""
}

function appendPrivateUserMessage(m) {
    const box = document.getElementById("chatBox")
    if (!box) return
    const now = m.createdAt || Date.now()
    box.innerHTML += `
        <div class="chat-row user-row">
            <div class="msg-wrap user-wrap">
                <div class="msg user-msg">${renderPrivateMessageContent(m)}</div>
                <div class="msg-time">${formatMsgTime(now)}</div>
            </div>
            <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
        </div>
    `
    box.scrollTop = box.scrollHeight
}

async function sendChatImageFromInput(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !currentContact) return
    const src = await fileToBase64(file)
    const now = Date.now()
    appendPrivateUserMessage({ content: "[图片]", imageSrc: src, createdAt: now })
    saveMessage(currentContact.id, "user", "[图片]", now, { imageSrc: src })
}

function getMjiStickers() {
    try { return JSON.parse(localStorage.getItem("MJI_STICKERS") || "[]") } catch (_) { return [] }
}
function saveMjiStickers(list) {
    localStorage.setItem("MJI_STICKERS", JSON.stringify(list || []))
}
function closeStickerPanel() {
    const old = document.getElementById("mjiStickerMask")
    if (old) old.remove()
}
function showStickerPanel(target = "private") {
    closeStickerPanel()
    const stickers = getMjiStickers()
    const mask = document.createElement("div")
    mask.id = "mjiStickerMask"
    mask.className = "sticker-mask"
    mask.onclick = e => { if (e.target === mask) closeStickerPanel() }
    mask.innerHTML = `
        <div class="sticker-panel">
            <div class="sticker-panel-head">
                <span>表情包</span>
                <button onclick="closeStickerPanel()">关闭</button>
            </div>
            <div class="sticker-grid">
                ${stickers.map((s, i) => `<button class="sticker-item" onclick="sendStickerByIndex('${target}', ${i})"><img src="${escapeHtml(s.url)}" alt=""></button>`).join("") || `<div style="grid-column:1/-1;color:#888;font-size:13px;padding:10px 0">还没有表情包，下面粘贴 URL 添加。</div>`}
            </div>
            <div class="sticker-add-row">
                <input id="stickerUrlInput" placeholder="粘贴图片 URL，例如 https://...gif">
                <button onclick="addStickerFromPanel('${target}')">添加并发送</button>
            </div>
        </div>
    `
    document.body.appendChild(mask)
}
function addStickerFromPanel(target) {
    const input = document.getElementById("stickerUrlInput")
    const url = input?.value?.trim() || ""
    if (!/^https?:\/\//i.test(url) && !/^data:image\//i.test(url)) {
        alert("请粘贴图片 URL")
        return
    }
    const list = getMjiStickers()
    list.unshift({ id: "sticker_" + Date.now(), url, createdAt: Date.now() })
    saveMjiStickers(list.slice(0, 80))
    sendStickerUrl(target, url)
    closeStickerPanel()
}
function sendStickerByIndex(target, index) {
    const s = getMjiStickers()[index]
    if (!s) return
    sendStickerUrl(target, s.url)
    closeStickerPanel()
}
function sendStickerUrl(target, url) {
    if (target === "group") {
        if (typeof sendGroupStickerUrl === "function") sendGroupStickerUrl(url)
        return
    }
    if (!currentContact) return
    const now = Date.now()
    appendPrivateUserMessage({ content: "[表情包]", stickerSrc: url, createdAt: now })
    saveMessage(currentContact.id, "user", "[表情包]", now, { stickerSrc: url })
}

async function showAiRepliesSlowly(contactId, replies) {
    const box = document.getElementById("chatBox")
    for (let i = 0; i < replies.length; i++) {
        const item = typeof replies[i] === "string" ? { content: replies[i], innerThoughts: "" } : replies[i]
        const now = Date.now()
        if (currentContact && currentContact.id === contactId && currentPage === "chatDetail" && box) {
            const typingId = "typing_" + now + "_" + i
            box.innerHTML += `
                <div id="${typingId}" class="chat-row ai-row">
                    <div class="chat-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                    <div class="msg-wrap ai-wrap"><div class="msg ai-msg typing-msg">正在输入中...</div></div>
                </div>
            `
            box.scrollTop = box.scrollHeight
            await sleep(700 + Math.random() * 900)
            const typing = document.getElementById(typingId)
            if (typing) typing.remove()
            const msgId = "msg_" + now + "_" + Math.random().toString(16).slice(2)
            box.innerHTML += `
                <div class="chat-row ai-row" data-msg-id="${msgId}">
                    ${makeThoughtAvatarHtml(currentContact.avatar, "🙂", `showThoughtsCardForMessage('${msgId}', '${contactId}', '')`)}
                    <div class="msg-wrap ai-wrap">
                        <div class="msg ai-msg">${escapeHtml(item.content)}</div>
                        <div class="msg-time">${formatMsgTime(now)}</div>
                    </div>
                </div>
            `
            box.scrollTop = box.scrollHeight
            saveMessage(contactId, "assistant", item.content, now, { id: msgId, innerThoughts: item.innerThoughts || "" })
        } else {
            saveMessage(contactId, "assistant", item.content, now, { innerThoughts: item.innerThoughts || "" })
        }
        Promise.all([getRecentMessages(contactId), getContactById(contactId)]).then(([history, contact]) => {
            const lastUser = [...history].reverse().find(m => m.role === "user")
            afterAiMessageMemoryChecks(contactId, contact?.name || currentContact?.name || "角色", lastUser?.content || "", item.content)
        }).catch(() => {})
        if (i < replies.length - 1) await sleep(500 + Math.random() * 700)
    }
}

/* ============================================================
   Chat / Settings / Call polish 2026-06-16
   - 底部消息/联系人/动态/我改成线性图标，不再用 emoji
   - 私聊顶栏增加电话按钮，三个点进入设置页
   - 角色设置页补齐聊天、AI、语音语言、关系等项目
   - 通话页 PWA 版
============================================================ */

(function(){
    if (window.__mjiChatTtsCallUiPatch) return
    window.__mjiChatTtsCallUiPatch = true

    const __oldGetChatFullscreenBaseCss = window.getChatFullscreenBaseCss
    window.getChatFullscreenBaseCss = function(){
        const oldCss = typeof __oldGetChatFullscreenBaseCss === "function" ? __oldGetChatFullscreenBaseCss() : ""
        return oldCss + `
.wechat-shell{height:100%;display:flex;flex-direction:column;background:#f3f1ee;}
.wechat-view{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;padding-bottom:10px;}
.wechat-bottom-nav{height:64px;flex-shrink:0;display:grid;grid-template-columns:repeat(4,1fr);background:rgba(245,244,241,.82);border-top:1px solid rgba(255,255,255,.56);backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);}
.wechat-bottom-nav button{border:0;background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#7b7b82;font-size:11px;font-weight:600;}
.wechat-bottom-nav button.active{color:#5e6f8c;}
.wechat-bottom-nav button span.nav-line-icon{width:24px;height:22px;position:relative;display:block;color:currentColor;}
.nav-line-icon::before,.nav-line-icon::after{content:"";position:absolute;box-sizing:border-box;}
.nav-msg::before{left:3px;top:3px;width:18px;height:14px;border:2px solid currentColor;border-radius:7px;}
.nav-msg::after{left:8px;bottom:1px;width:8px;height:8px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-35deg);border-radius:1px;}
.nav-contact::before{left:8px;top:2px;width:9px;height:9px;border:2px solid currentColor;border-radius:50%;}
.nav-contact::after{left:3px;bottom:2px;width:18px;height:10px;border:2px solid currentColor;border-radius:10px 10px 5px 5px;}
.nav-discovery::before{left:4px;top:2px;width:16px;height:16px;border:2px solid currentColor;border-radius:50%;}
.nav-discovery::after{left:10px;top:8px;width:4px;height:4px;background:currentColor;border-radius:50%;box-shadow:7px -5px 0 -1px currentColor,-6px 8px 0 -1px currentColor;}
.nav-me::before{left:8px;top:2px;width:9px;height:9px;border:2px solid currentColor;border-radius:50%;}
.nav-me::after{left:5px;bottom:1px;width:14px;height:9px;border:2px solid currentColor;border-radius:9px 9px 4px 4px;}
.chat-webview-header{grid-template-columns:48px minmax(0,1fr)92px!important;}
.chat-webview-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;}
.chat-webview-call,.chat-webview-more{width:42px;height:42px;border:0;border-radius:16px;background:rgba(255,255,255,.08);color:#f5f5f7;display:flex;align-items:center;justify-content:center;}
.chat-webview-call svg{width:20px;height:20px;display:block;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.chat-webview-more{font-size:22px;}
.chat-settings-page{padding:14px;background:#f2f2f6;min-height:100%;}
.chat-settings-section{font-size:12px;color:#8d8d94;margin:16px 6px 8px;font-weight:700;letter-spacing:.5px;}
.chat-settings-card{background:#fff;border-radius:18px;overflow:hidden;margin-bottom:12px;box-shadow:0 8px 22px rgba(0,0,0,.04);}
.chat-settings-profile{display:flex;align-items:center;gap:12px;padding:16px;}
.chat-settings-avatar{width:52px;height:52px;border-radius:16px;overflow:hidden;background:#eee;flex-shrink:0;}
.chat-settings-name{font-size:18px;font-weight:700;color:#111;}
.chat-settings-sub{font-size:12px;color:#888;margin-top:4px;line-height:1.4;}
.chat-settings-row{width:100%;min-height:52px;border:0;background:#fff;border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 16px;font-size:15px;color:#111;text-align:left;}
.chat-settings-row:first-child{border-top:0;}
.chat-settings-row span:first-child{min-width:0;}
.chat-settings-row span:last-child{color:#aaa;white-space:nowrap;font-size:13px;}
.chat-settings-row.danger{color:#e14b4b;}
.chat-settings-form{padding:14px;background:#f2f2f6;min-height:100%;}
.chat-settings-form-card{background:#fff;border-radius:18px;padding:16px;box-shadow:0 8px 22px rgba(0,0,0,.04);}
.chat-settings-form-card input,.chat-settings-form-card textarea,.chat-settings-form-card select{width:100%;border:0;outline:0;background:#f5f5f5;border-radius:14px;padding:12px 14px;font-size:15px;color:#111;margin:8px 0;box-sizing:border-box;}
.chat-settings-form-card textarea{min-height:130px;resize:vertical;line-height:1.6;}
.chat-settings-form-card button{width:100%;height:46px;border:0;border-radius:15px;background:#c8d4ee;color:#323846;font-weight:800;margin-top:10px;}
.call-page{position:absolute;inset:0;background:linear-gradient(180deg,#27272d,#151519);color:#fff;display:flex;flex-direction:column;align-items:center;overflow:hidden;padding:18px 22px 34px;}
.call-top{width:100%;display:flex;align-items:center;justify-content:space-between;height:44px;flex-shrink:0;}
.call-top button{width:42px;height:42px;border:0;border-radius:16px;background:rgba(255,255,255,.08);color:#fff;font-size:24px;}
.call-body{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-bottom:12px;}
.call-avatar{width:104px;height:104px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.12);box-shadow:0 16px 36px rgba(0,0,0,.24);margin-bottom:22px;}
.call-name{font-size:27px;font-weight:800;margin-bottom:8px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.call-status{font-size:14px;color:rgba(255,255,255,.62);margin-bottom:4px;}
.call-duration{font-size:13px;color:rgba(255,255,255,.42);margin-bottom:22px;}
.call-wave{height:30px;display:flex;align-items:center;gap:5px;margin-bottom:18px;}
.call-wave i{display:block;width:4px;height:8px;border-radius:999px;background:#c8d4ee;animation:callwave 1s ease-in-out infinite;opacity:.82;}
.call-wave i:nth-child(2){animation-delay:.1s}.call-wave i:nth-child(3){animation-delay:.2s}.call-wave i:nth-child(4){animation-delay:.3s}.call-wave i:nth-child(5){animation-delay:.4s}
@keyframes callwave{0%,100%{height:8px;opacity:.35}50%{height:28px;opacity:1}}
.call-subtitle{min-height:78px;width:100%;max-width:330px;border-radius:22px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);padding:14px 16px;line-height:1.65;font-size:15px;color:rgba(255,255,255,.9);white-space:pre-wrap;}
.call-input-row{width:100%;display:flex;align-items:center;gap:8px;flex-shrink:0;margin-bottom:18px;}
.call-input-row input{flex:1;height:46px;border:0;outline:0;border-radius:20px;background:rgba(255,255,255,.12);color:#fff;padding:0 15px;font-size:15px;}
.call-input-row input::placeholder{color:rgba(255,255,255,.42);}
.call-input-row button{height:46px;border:0;border-radius:18px;background:#c8d4ee;color:#323846;font-weight:800;padding:0 18px;}
.call-controls{display:flex;align-items:center;justify-content:center;gap:40px;flex-shrink:0;}
.call-round{width:72px;height:72px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;display:flex;align-items:center;justify-content:center;}
.call-round svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.call-round.hang{background:#ff453a;}
`
    }

    window.showWechatShell = function(tab = "msg") {
        currentPage = "chat"
        currentWechatTab = tab
        setChatWebViewMode(false)
        closeChatSettingsPanel()
        applyChatCustomCss()

        const root = document.getElementById("wechatRoot")
        if (!root) return

        root.innerHTML = `
            <div class="wechat-shell">
                <div class="wechat-view" id="wechatView"></div>
                <div class="wechat-bottom-nav">
                    <button id="nav_msg" onclick="switchWechatTab('msg')"><span class="nav-line-icon nav-msg"></span><em>消息</em></button>
                    <button id="nav_contact" onclick="switchWechatTab('contact')"><span class="nav-line-icon nav-contact"></span><em>联系人</em></button>
                    <button id="nav_discovery" onclick="switchWechatTab('discovery')"><span class="nav-line-icon nav-discovery"></span><em>动态</em></button>
                    <button id="nav_me" onclick="switchWechatTab('me')"><span class="nav-line-icon nav-me"></span><em>我</em></button>
                </div>
            </div>
        `
        switchWechatTab(tab)
    }

    function saveCurrentContactPatch(patch, cb){
        if (!currentContact) return
        currentContact = Object.assign({}, currentContact, patch, { updatedAt: Date.now() })
        try{
            const tx = db.transaction("contacts", "readwrite")
            tx.objectStore("contacts").put(currentContact)
            tx.oncomplete = function(){ if (cb) cb() }
        }catch(e){ alert("保存失败：" + e.message) }
    }
    window.saveCurrentContactPatch = saveCurrentContactPatch

    function settingValue(v, fallback="未设置"){
        if (v === true) return "已开"
        if (v === false) return "已关"
        return (v === undefined || v === null || String(v).trim() === "") ? fallback : String(v)
    }

    window.showChatSettingsPage = function(){
        if (!currentContact) return
        setChatWebViewMode(false)
        currentPage = "chatSettingsPage"
        document.getElementById("appTitle").innerText = "聊天设置"
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-page">
                <div class="chat-settings-card">
                    <div class="chat-settings-profile">
                        <div class="chat-settings-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                        <div>
                            <div class="chat-settings-name">${escapeHtml(currentContact.name || "角色")}</div>
                            <div class="chat-settings-sub">角色资料、聊天、记忆、语音和通话设置</div>
                        </div>
                    </div>
                </div>

                <div class="chat-settings-section">聊天</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-row" onclick="showPrivateChatSearchPage()"><span>查找聊天记录</span><span>搜索 / 按天浏览 ›</span></button>
                    <button class="chat-settings-row" onclick="togglePrivatePin()"><span>置顶聊天</span><span>${currentContact.isPinned ? "已开" : "已关"}</span></button>
                    <button class="chat-settings-row" onclick="showContactBackgroundEditor()"><span>设置聊天背景</span><span>›</span></button>
                </div>

                <div class="chat-settings-section">AI 核心逻辑</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-row" onclick="showContactFieldEditor('上下文记忆深度','historyDepth', currentContact.historyDepth || localStorage.getItem('MJI_CONTEXT_COUNT') || '40','例如 40')"><span>上下文记忆深度</span><span>${escapeHtml(currentContact.historyDepth || localStorage.getItem("MJI_CONTEXT_COUNT") || "40")} 条 ›</span></button>
                    <button class="chat-settings-row" onclick="showMemoryEditor()"><span>修改角色记忆</span><span>MemoryBank ›</span></button>
                    <button class="chat-settings-row" onclick="showContactFieldEditor('角色外形描写（生图用）','appearance', currentContact.appearance || '','描述角色外貌，用于生图参考', true)"><span>角色外形描写（生图用）</span><span>${currentContact.appearance ? "已填" : "未填"} ›</span></button>
                </div>

                <div class="chat-settings-section">语音与语言</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-row" onclick="showContactFieldEditor('自动语音触发概率','voiceProb', currentContact.voiceProb ?? '30','0-100')"><span>自动语音触发概率</span><span>${escapeHtml(currentContact.voiceProb ?? "30")}% ›</span></button>
                    <button class="chat-settings-row" onclick="toggleContactField('ttsEnabled')"><span>开启语音生成（TTS）</span><span>${currentContact.ttsEnabled ? "已开" : "已关"}</span></button>
                    <button class="chat-settings-row" onclick="showContactFieldEditor('音色配置 ID','voiceId', currentContact.voiceId || '','例如 krueger / ghostNew / FunAudioLLM/CosyVoice2-0.5B')"><span>音色配置 ID</span><span>${escapeHtml(settingValue(currentContact.voiceId))} ›</span></button>
                    <button class="chat-settings-row" onclick="showContactSelectEditor('角色对话语言','aiLang',['默认 (中文)','英文','德语','日语','韩语','法语','俄语'])"><span>角色对话语言</span><span>${escapeHtml(currentContact.aiLang || "默认 (中文)")} ›</span></button>
                    <button class="chat-settings-row" onclick="toggleContactField('autoTrans')"><span>开启回复自动翻译</span><span>${currentContact.autoTrans ? "已开" : "已关"}</span></button>
                </div>

                <div class="chat-settings-section">角色关系</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-row" onclick="showContactSelectEditor('与角色的关系','relationship',['陌生人','普通朋友','好友','恋人','暗恋对象','家人'])"><span>与角色的关系</span><span>${escapeHtml(currentContact.relationship || "普通朋友")} ›</span></button>
                </div>

                <div class="chat-settings-section">高级管理</div>
                <div class="chat-settings-card">
                    <button class="chat-settings-row" onclick="showContactEditor()"><span>编辑角色资料</span><span>›</span></button>
                    <button class="chat-settings-row" onclick="openApp('chat','me')"><span>Chat 主题 / 心声卡片</span><span>›</span></button>
                    <button class="chat-settings-row" onclick="testAiMessage()"><span>让TA主动找我</span><span>›</span></button>
                    <button class="chat-settings-row" onclick="openChat(currentContact.id)"><span>返回聊天</span><span>›</span></button>
                </div>
            </div>
        `
    }

    window.togglePrivatePin = function(){
        saveCurrentContactPatch({ isPinned: !currentContact.isPinned }, showChatSettingsPage)
    }
    window.toggleContactField = function(field){
        const next = !currentContact[field]
        const p = {}; p[field] = next
        saveCurrentContactPatch(p, showChatSettingsPage)
    }

    window.showContactFieldEditor = function(title, field, value, placeholder, multiline){
        currentPage = "chatSettingsSubPage"
        document.getElementById("appTitle").innerText = title
        const input = multiline ?
            `<textarea id="settingFieldInput" placeholder="${escapeHtml(placeholder || "")}">${escapeHtml(value || "")}</textarea>` :
            `<input id="settingFieldInput" placeholder="${escapeHtml(placeholder || "")}" value="${escapeHtml(value || "")}">`
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <div class="settings-title">${escapeHtml(title)}</div>
                    ${input}
                    <button onclick="saveContactFieldEditor('${escapeHtml(field)}')">保存</button>
                </div>
            </div>
        `
    }

    window.saveContactFieldEditor = function(field){
        const v = document.getElementById("settingFieldInput")?.value?.trim() || ""
        const p = {}; p[field] = v
        saveCurrentContactPatch(p, showChatSettingsPage)
    }

    window.showContactSelectEditor = function(title, field, options){
        currentPage = "chatSettingsSubPage"
        document.getElementById("appTitle").innerText = title
        const current = currentContact[field] || ""
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <div class="settings-title">${escapeHtml(title)}</div>
                    <select id="settingSelectInput">
                        ${options.map(x => `<option value="${escapeHtml(x)}" ${x === current ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}
                    </select>
                    <button onclick="saveContactSelectEditor('${escapeHtml(field)}')">保存</button>
                </div>
            </div>
        `
    }

    window.saveContactSelectEditor = function(field){
        const v = document.getElementById("settingSelectInput")?.value || ""
        const p = {}; p[field] = v
        saveCurrentContactPatch(p, showChatSettingsPage)
    }

    window.showContactBackgroundEditor = function(){
        currentPage = "chatSettingsSubPage"
        document.getElementById("appTitle").innerText = "聊天背景"
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <div class="settings-title">设置聊天背景</div>
                    <input type="file" id="contactBgFile" accept="image/*">
                    <input id="contactBgUrl" placeholder="也可以粘贴图片 URL / 或填 color:#F2F2F6" value="${escapeHtml(currentContact.chatBackground || "")}">
                    <button onclick="saveContactBackground()">保存背景</button>
                    <button onclick="clearContactBackground()">恢复默认背景</button>
                </div>
            </div>
        `
    }

    window.saveContactBackground = async function(){
        const file = document.getElementById("contactBgFile")?.files?.[0]
        let bg = document.getElementById("contactBgUrl")?.value?.trim() || ""
        if (file) bg = await fileToBase64(file)
        saveCurrentContactPatch({ chatBackground: bg }, function(){ openChat(currentContact.id) })
    }

    window.clearContactBackground = function(){
        saveCurrentContactPatch({ chatBackground: "" }, function(){ openChat(currentContact.id) })
    }

    window.showPrivateChatSearchPage = async function(){
        if (!currentContact) return
        currentPage = "chatSettingsSubPage"
        document.getElementById("appTitle").innerText = "查找聊天记录"
        const all = (await getAllStoreData("messages")).filter(m => m.contactId === currentContact.id).sort((a,b)=>a.createdAt-b.createdAt)
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <input id="chatSearchKw" placeholder="搜索聊天内容" oninput="filterPrivateChatSearch()">
                    <div id="chatSearchResult" style="margin-top:10px"></div>
                </div>
            </div>
        `
        window.__privateSearchMessages = all
        filterPrivateChatSearch()
    }

    window.filterPrivateChatSearch = function(){
        const box = document.getElementById("chatSearchResult")
        const kw = document.getElementById("chatSearchKw")?.value?.trim() || ""
        const list = (window.__privateSearchMessages || []).filter(m => !kw || String(m.content || "").includes(kw)).slice(-80).reverse()
        box.innerHTML = list.map(m => `<div style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;line-height:1.5"><div style="color:#999;font-size:12px">${formatMsgTime(m.createdAt)} · ${m.role === "user" ? "我" : escapeHtml(currentContact.name || "TA")}</div><div>${escapeHtml(m.content || (m.imageSrc ? "[图片]" : m.stickerSrc ? "[表情包]" : ""))}</div></div>`).join("") || `<p class="empty">没有聊天记录</p>`
    }

    const callPhoneSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.8l2.2-.9 2.5 5-1.6 1.2c.9 1.8 2.3 3.2 4.1 4.1l1.2-1.6 5 2.5-.9 2.2c-.4 1-1.5 1.6-2.6 1.4C10.1 16.8 5.2 11.9 4.3 5.5 4.1 4.4 4.7 4.2 6.6 3.8z"></path></svg>`

    window.openChat = function(contactId){
        chatBackPage = currentWechatTab === "contact" ? "contacts" : "chat"
        currentPage = "chatDetail"
        applyChatCustomCss()
        const tx = db.transaction("contacts", "readonly")
        const store = tx.objectStore("contacts")
        const req = store.get(contactId)
        req.onsuccess = function(){
            currentContact = req.result
            if (!currentContact) { alert("角色不存在"); openApp("chat", "contact"); return }
            currentContact.unreadCount = 0
            const tx2 = db.transaction("contacts", "readwrite")
            tx2.objectStore("contacts").put(currentContact)
            tx2.oncomplete = function(){ updateDesktopUnreadBadge() }
            document.getElementById("appTitle").innerText = currentContact.name
            setChatWebViewMode(true)
            document.getElementById("appContent").innerHTML = `
                <div class="chat-webview-shell" id="chatWebviewShell">
                    <div class="chat-webview-bg" id="chatWebviewBg"></div>
                    <div class="chat-webview-header">
                        <button class="chat-webview-back" onclick="openApp('chat', chatBackPage === 'contacts' ? 'contact' : 'msg')">‹</button>
                        <div class="chat-webview-title"><div class="chat-title-name">${escapeHtml(currentContact.name || "聊天")}</div></div>
                        <div class="chat-webview-actions">
                            <button class="chat-webview-call" onclick="openCallPage()">${callPhoneSvg}</button>
                            <button class="chat-webview-more" onclick="showChatSettingsPage()">⋯</button>
                        </div>
                    </div>
                    <div id="chatBox" class="chat-box themed-chat-box chat-webview-box"></div>
                    <div class="chat-input themed-chat-input chat-webview-input">
                        <input type="file" id="chatImageInput" accept="image/*" hidden onchange="sendChatImageFromInput(event)">
                        <button class="input-icon-btn" onclick="document.getElementById('chatImageInput').click()">＋</button>
                        <input id="messageInput" type="text" placeholder="输入消息" onkeydown="if(event.key==='Enter'){sendMessage()}">
                        <button class="input-icon-btn sticker-btn" onclick="showStickerPanel('private')">☺</button>
                        <button onclick="sendMessage()">发送</button>
                        <button class="reply-now-btn" onclick="replyNow()">TA</button>
                    </div>
                </div>`
            loadMessages(currentContact.id)
            applyChatBackground()
        }
    }

    let callTimer = null, callSeconds = 0, callBusy = false, callHistory = []
    window.openCallPage = function(){
        if (!currentContact) return
        currentPage = "callPage"
        setChatWebViewMode(true)
        callSeconds = 0
        callHistory = []
        document.getElementById("appContent").innerHTML = `
            <div class="call-page">
                <div class="call-top">
                    <button onclick="endCurrentCall(false)">‹</button>
                    <button onclick="endCurrentCall(true)" style="font-size:15px">挂断</button>
                </div>
                <div class="call-body">
                    <div class="call-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                    <div class="call-name">${escapeHtml(currentContact.name || "TA")}</div>
                    <div class="call-status" id="callStatus">正在连接…</div>
                    <div class="call-duration" id="callDuration">00:00</div>
                    <div class="call-wave" id="callWave"><i></i><i></i><i></i><i></i><i></i></div>
                    <div class="call-subtitle" id="callSubtitle">接通后可以打字通话。浏览器支持的话也可以用语音识别。</div>
                </div>
                <div class="call-input-row">
                    <input id="callInput" placeholder="在这里打字和TA说话…" onkeydown="if(event.key==='Enter'){sendCallTextInput()}">
                    <button onclick="sendCallTextInput()">发送</button>
                </div>
                <div class="call-controls">
                    <button class="call-round" onclick="startCallSpeechInput()"><svg viewBox="0 0 24 24"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"></path><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg></button>
                    <button class="call-round hang" onclick="endCurrentCall(true)"><svg viewBox="0 0 24 24"><path d="M5 15c4-4 10-4 14 0"></path><path d="M8 14l-2 3"></path><path d="M16 14l2 3"></path></svg></button>
                </div>
            </div>`
        callTimer = setInterval(function(){
            callSeconds++
            const m = String(Math.floor(callSeconds / 60)).padStart(2,"0")
            const s = String(callSeconds % 60).padStart(2,"0")
            const d = document.getElementById("callDuration")
            if (d) d.textContent = `${m}:${s}`
        },1000)
        setTimeout(function(){ callSendToAi("[通话刚接通，你先打个招呼]", true) }, 500)
    }

    window.sendCallTextInput = function(){
        const input = document.getElementById("callInput")
        const text = input?.value?.trim() || ""
        if (!text || callBusy) return
        input.value = ""
        document.getElementById("callSubtitle").textContent = "你：" + text
        callSendToAi(text, false)
    }

    async function callSendToAi(text, isSystem){
        if (!currentContact) return
        callBusy = true
        document.getElementById("callStatus").textContent = `${currentContact.name || "TA"}说话中…`
        const apiBase = localStorage.getItem("MJI_API_BASE")
        const apiKey = localStorage.getItem("MJI_API_KEY")
        const apiModel = localStorage.getItem("MJI_API_MODEL")
        if (!apiBase || !apiKey || !apiModel) { document.getElementById("callStatus").textContent = "未配置API"; callBusy=false; return }
        if (!isSystem) callHistory.push({role:"user",content:text})
        try{
            const lang = currentContact.aiLang || "默认 (中文)"
            const langRule = lang === "默认 (中文)" ? "用中文说话，直接输出说话内容。" : `用${lang}说话，并在下一行用中文翻译。`
            const messages = [{role:"system",content:`你是${currentContact.name}，人设：${currentContact.prompt || currentContact.profile || ""}\n当前场景：你正在和用户通电话。\n规则：回复简短自然，一次1-3句话，不要动作描写。${langRule}`}]
            callHistory.slice(-10).forEach(m=>messages.push(m))
            if (isSystem) messages.push({role:"user",content:text})
            const res = await fetch(getChatApiUrl(),{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model:apiModel,messages,max_tokens:200})})
            const data = await res.json()
            const raw = data.choices?.[0]?.message?.content?.trim() || "我在。"
            document.getElementById("callSubtitle").textContent = `${currentContact.name || "TA"}：${raw}`
            callHistory.push({role:"assistant",content:raw})
            speakBrowserCall(raw)
        }catch(e){
            document.getElementById("callSubtitle").textContent = "通话连接失败，可以稍后再试。"
        }finally{
            callBusy = false
            const st = document.getElementById("callStatus")
            if (st) st.textContent = "通话中"
        }
    }
    window.callSendToAi = callSendToAi

    function speakBrowserCall(text){
        if (!currentContact?.ttsEnabled) return
        try{
            if (!window.speechSynthesis) return
            const u = new SpeechSynthesisUtterance(String(text).replace(/（[\s\S]*?）/g,""))
            u.lang = (currentContact.aiLang || "").includes("英") ? "en-US" : "zh-CN"
            speechSynthesis.cancel(); speechSynthesis.speak(u)
        }catch(e){}
    }

    window.startCallSpeechInput = function(){
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { alert("当前浏览器不支持语音识别，可以直接打字通话。"); return }
        try{
            const rec = new SR()
            rec.lang = "zh-CN"
            rec.interimResults = false
            rec.maxAlternatives = 1
            document.getElementById("callStatus").textContent = "聆听中…"
            rec.onresult = function(e){
                const text = e.results?.[0]?.[0]?.transcript || ""
                if (text) { document.getElementById("callInput").value = text; sendCallTextInput() }
            }
            rec.onend = function(){ const st=document.getElementById("callStatus"); if(st) st.textContent="通话中" }
            rec.start()
        }catch(e){ alert("语音识别启动失败，可以直接打字。") }
    }

    window.endCurrentCall = function(saveMemory){
        try{ clearInterval(callTimer) }catch(e){}
        try{ speechSynthesis?.cancel?.() }catch(e){}
        if (saveMemory && currentContact && callHistory.length){
            const summary = `【通话记录】和用户通话${Math.floor(callSeconds/60)}分${callSeconds%60}秒，聊到：` + callHistory.map(x => (x.role === "user" ? "用户：" : `${currentContact.name}：`) + x.content).join(" / ").slice(0,180)
            try{ saveMemoryEntry(currentContact.id, summary, "shared_event") }catch(e){}
        }
        if (currentContact) openChat(currentContact.id)
        else openApp("chat","msg")
    }

    const __baseGoHome = window.goHome
    window.goHome = function(){
        if (currentPage === "callPage") { endCurrentCall(false); return }
        if (currentPage === "chatSettingsSubPage") { showChatSettingsPage(); return }
        return __baseGoHome ? __baseGoHome() : undefined
    }
})()



/* ============================================================
   Chat "我" page / profile / chat display settings / image & voice patch
   2026-06-16
============================================================ */
(function(){
    if (window.__mjiMeProfileVoiceImagePatch) return
    window.__mjiMeProfileVoiceImagePatch = true

    function getMyProfile(){
        return {
            name: localStorage.getItem("MJI_MY_NAME") || "我",
            age: localStorage.getItem("MJI_MY_AGE") || "",
            birthday: localStorage.getItem("MJI_MY_BIRTHDAY") || "",
            gender: localStorage.getItem("MJI_MY_GENDER") || "",
            identity: localStorage.getItem("MJI_MY_IDENTITY") || "",
            profile: localStorage.getItem("MJI_MY_PROFILE") || "",
            avatar: localStorage.getItem("MJI_MY_AVATAR") || ""
        }
    }

    function escapeAttr(v){ return escapeHtml(v || "").replace(/"/g, "&quot;") }

    window.renderWechatMe = function(){
        const view = document.getElementById("wechatView")
        if (!view) return
        const me = getMyProfile()
        view.innerHTML = `
            <div class="me-simple-page">
                <button class="me-simple-profile" onclick="showMyProfileEditor()">
                    <div class="me-simple-avatar">${avatarHtml(me.avatar, "我")}</div>
                    <div class="me-simple-name">${escapeHtml(me.name || "我")}</div>
                    <span class="me-simple-arrow">›</span>
                </button>

                <button class="me-simple-setting" onclick="showChatDisplaySettingsPage()">
                    <div>
                        <div class="me-simple-setting-title">设置</div>
                        <div class="me-simple-setting-sub">聊天气泡设置、心声卡片设置</div>
                    </div>
                    <span>›</span>
                </button>
            </div>
        `
        ensureStrictMePageStyle()
    }

    window.ensureStrictMePageStyle = window.ensureStrictMePageStyle || function(){
        if (document.getElementById("strictMePageStyle")) return
        const style = document.createElement("style")
        style.id = "strictMePageStyle"
        style.textContent = `
            .me-simple-page{padding:18px 14px 90px;background:var(--app-bg,#f3f1ec);min-height:100%;box-sizing:border-box;}
            .me-simple-profile,.me-simple-setting{width:100%;border:0;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.55);border-radius:22px;box-shadow:0 8px 24px rgba(0,0,0,.045);color:#141821;text-align:left;box-sizing:border-box;}
            .me-simple-profile{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 14px;}
            .me-simple-avatar{width:62px;height:62px;border-radius:20px;overflow:hidden;background:rgba(232,230,224,.8);flex-shrink:0;}
            .me-simple-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
            .me-simple-name{font-size:20px;font-weight:800;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            .me-simple-arrow,.me-simple-setting span{font-size:24px;color:#9ca3af;}
            .me-simple-setting{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;margin:0;}
            .me-simple-setting-title{font-size:16px;font-weight:800;margin-bottom:4px;}
            .me-simple-setting-sub{font-size:12px;color:#8b909a;line-height:1.45;}
        `
        document.head.appendChild(style)
    }

    window.showMyProfileEditor = function(){
        const me = getMyProfile()
        currentPage = "myProfileEditor"
        document.getElementById("appTitle").innerText = "个人资料"
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                        <div style="width:64px;height:64px;border-radius:20px;overflow:hidden;background:#eee">${avatarHtml(me.avatar, "我")}</div>
                        <div style="flex:1;color:#777;font-size:13px;line-height:1.5">点击下面选择头像。这里是全局用户资料，所有角色、动态、日程、通话都会读取。</div>
                    </div>
                    <label class="file-label">我的头像</label>
                    <input type="file" id="myProfileAvatarFile" accept="image/*">

                    <input id="myProfileName" placeholder="姓名 / 昵称" value="${escapeAttr(me.name)}">
                    <input id="myProfileAge" placeholder="年龄" value="${escapeAttr(me.age)}">
                    <input id="myProfileBirthday" placeholder="生日，例如 09-16 / 1999-09-16" value="${escapeAttr(me.birthday)}">
                    <select id="myProfileGender">
                        ${["","女","男","非二元","不透露"].map(v => `<option value="${v}" ${me.gender === v ? "selected" : ""}>${v || "选择性别"}</option>`).join("")}
                    </select>
                    <input id="myProfileIdentity" placeholder="身份 / 职业 / 自设身份" value="${escapeAttr(me.identity)}">
                    <textarea id="myProfileInfo" placeholder="具体信息：角色需要知道的你的设定、性格、雷点、偏好等">${escapeHtml(me.profile)}</textarea>

                    <button onclick="saveMyProfile()">保存个人资料</button>
                </div>
            </div>
        `
    }

    window.saveMyProfile = async function(){
        const avatarFile = document.getElementById("myProfileAvatarFile")?.files?.[0]
        if (avatarFile) {
            const b64 = await fileToBase64(avatarFile)
            localStorage.setItem("MJI_MY_AVATAR", b64)
        }
        localStorage.setItem("MJI_MY_NAME", document.getElementById("myProfileName")?.value.trim() || "我")
        localStorage.setItem("MJI_MY_AGE", document.getElementById("myProfileAge")?.value.trim() || "")
        localStorage.setItem("MJI_MY_BIRTHDAY", document.getElementById("myProfileBirthday")?.value.trim() || "")
        localStorage.setItem("MJI_MY_GENDER", document.getElementById("myProfileGender")?.value || "")
        localStorage.setItem("MJI_MY_IDENTITY", document.getElementById("myProfileIdentity")?.value.trim() || "")
        localStorage.setItem("MJI_MY_PROFILE", document.getElementById("myProfileInfo")?.value.trim() || "")
        alert("个人资料已保存")
        currentPage = "chat"
        showWechatShell("me")
    }

    window.showChatDisplaySettingsPage = function(){
        const chatCss = localStorage.getItem("MJI_CHAT_CUSTOM_CSS") || ""
        const thoughtsTemplate = localStorage.getItem("MJI_THOUGHTS_CARD_TEMPLATE") || ""
        const thoughtsCss = localStorage.getItem("MJI_THOUGHTS_CARD_CSS") || ""
        currentPage = "chatDisplaySettings"
        document.getElementById("appTitle").innerText = "Chat 设置"
        document.getElementById("appContent").innerHTML = `
            <div class="chat-settings-form">
                <div class="chat-settings-form-card">
                    <div class="settings-title">聊天气泡设置</div>
                    <p class="settings-desc">只控制聊天页视觉：背景、气泡、字体、圆角等。</p>
                    <input type="file" id="chatCssFile" accept=".css,text/css,text/plain">
                    <textarea id="chatCssText" class="code-textarea" placeholder="粘贴 Chat CSS">${escapeHtml(chatCss)}</textarea>
                    <button onclick="saveChatThemeCss()">应用聊天气泡设置</button>
                    <button onclick="clearChatThemeCss()" class="danger-btn">恢复默认聊天气泡</button>
                </div>

                <div class="chat-settings-form-card" style="margin-top:14px">
                    <div class="settings-title">心声卡片设置</div>
                    <p class="settings-desc">心声卡片模板支持 {{name}}、{{avatar}}、{{thoughts}}、{{action}}、{{outfit}}、{{location}}、{{time}}。</p>
                    <input type="file" id="thoughtsFile" accept=".html,.css,text/html,text/css,text/plain">
                    <textarea id="thoughtsTemplateText" class="code-textarea" placeholder="粘贴心声卡片 HTML 模板">${escapeHtml(thoughtsTemplate)}</textarea>
                    <textarea id="thoughtsCssText" class="code-textarea" placeholder="单独 CSS，可空">${escapeHtml(thoughtsCss)}</textarea>
                    <button onclick="saveThoughtsCardTemplate()">保存心声卡片设置</button>
                    <button onclick="clearThoughtsCardTemplate()" class="danger-btn">恢复默认心声卡片</button>
                </div>
            </div>
        `

        const chatCssFile = document.getElementById("chatCssFile")
        if (chatCssFile) {
            chatCssFile.onchange = async function(){
                const file = chatCssFile.files?.[0]
                if (!file) return
                document.getElementById("chatCssText").value = await file.text()
            }
        }

        const thoughtsFile = document.getElementById("thoughtsFile")
        if (thoughtsFile) {
            thoughtsFile.onchange = async function(){
                const file = thoughtsFile.files?.[0]
                if (!file) return
                const text = await file.text()
                if ((file.name || "").toLowerCase().endsWith(".css")) {
                    document.getElementById("thoughtsCssText").value = text
                } else {
                    document.getElementById("thoughtsTemplateText").value = text
                }
            }
        }
    }

    window.saveChatThemeCss = function(){
        localStorage.setItem("MJI_CHAT_CUSTOM_CSS", document.getElementById("chatCssText")?.value || "")
        alert("聊天气泡设置已保存")
    }
    window.clearChatThemeCss = function(){
        localStorage.removeItem("MJI_CHAT_CUSTOM_CSS")
        alert("已恢复默认聊天气泡")
        showChatDisplaySettingsPage()
    }
    window.saveThoughtsCardTemplate = function(){
        localStorage.setItem("MJI_THOUGHTS_CARD_TEMPLATE", document.getElementById("thoughtsTemplateText")?.value || "")
        localStorage.setItem("MJI_THOUGHTS_CARD_CSS", document.getElementById("thoughtsCssText")?.value || "")
        alert("心声卡片设置已保存")
    }
    window.clearThoughtsCardTemplate = function(){
        localStorage.removeItem("MJI_THOUGHTS_CARD_TEMPLATE")
        localStorage.removeItem("MJI_THOUGHTS_CARD_CSS")
        alert("已恢复默认心声卡片")
        showChatDisplaySettingsPage()
    }

    function shouldSendVoiceForContact(contact){
        if (!contact) return false
        const globalOn = localStorage.getItem("MJI_VOICE_MSG_ENABLED") === "true"
        const contactOn = contact.allowVoiceMsg === true || contact.ttsEnabled === true
        if (!globalOn && !contactOn) return false
        const p = Number(contact.voiceMsgProb || contact.voiceProb || localStorage.getItem("MJI_VOICE_MSG_PROB") || "30")
        return Math.random() * 100 < Math.max(0, Math.min(100, p))
    }

    window.playMjiVoiceMessage = function(text, lang){
        try{
            if (!window.speechSynthesis) { alert("当前浏览器不支持语音播放"); return }
            const clean = String(text || "").replace(/【翻译】[\s\S]*$/,"").replace(/（[\s\S]*?）/g,"").trim()
            if (!clean) return
            const u = new SpeechSynthesisUtterance(clean)
            u.lang = String(lang || "").includes("英") ? "en-US" : "zh-CN"
            speechSynthesis.cancel()
            speechSynthesis.speak(u)
        }catch(e){ alert("语音播放失败") }
    }

    window.renderPrivateMessageContent = function(m) {
        if (m.imageSrc) return `<img class="chat-media-image" src="${escapeHtml(m.imageSrc)}" alt="图片">`
        if (m.stickerSrc) return `<img class="chat-sticker-image" src="${escapeHtml(m.stickerSrc)}" alt="表情包">`
        if (m.isVoice || m.voiceMsg) {
            const dur = m.voiceDuration || Math.max(2, Math.min(18, Math.ceil(String(m.content || "").length / 6)))
            return `<div class="chat-voice-bubble" onclick="playMjiVoiceMessage('${escapeAttr(m.content || "")}','${escapeAttr(currentContact?.aiLang || "")}')"><span class="voice-wave"><i></i><i></i><i></i></span><span class="voice-duration">${dur}"</span></div>`
        }
        return escapeHtml(m.content || "")
    }

    async function mjiGenerateImage(prompt){
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

    async function maybeGeneratePrivateChatImage(contactId, text){
        const enabled = localStorage.getItem("MJI_CHAT_IMAGE_ENABLED") === "true" || currentContact?.allowChatImage === true
        if (!enabled || !currentContact) return
        if (currentContact.allowChatImage === false) return
        const trigger = /发图|照片|拍|看看你|你在哪|在干嘛|图来|send.*photo|picture|selfie/i.test(text || "")
        const prob = Number(localStorage.getItem("MJI_AUTO_IMAGE_PROB") || "20")
        if (!trigger && Math.random() * 100 >= prob) return
        try{
            const prompt = `first-person POV phone photo, no face, no head, candid real life moment. Character: ${currentContact.name || ""}. Appearance: ${currentContact.appearance || ""}. Context: ${text || ""}`
            const src = await mjiGenerateImage(prompt)
            const now = Date.now()
            saveMessage(contactId, "assistant", "【照片】", now, { imageSrc: src })
            if (currentContact?.id === contactId && currentPage === "chatDetail") loadMessages(contactId)
        }catch(e){
            console.warn("chat image generation failed", e)
        }
    }

    window.showAiRepliesSlowly = async function(contactId, replies) {
        const box = document.getElementById("chatBox")
        for (let i = 0; i < replies.length; i++) {
            const item = typeof replies[i] === "string" ? { content: replies[i], innerThoughts: "" } : replies[i]
            const now = Date.now()
            const isVoice = currentContact && currentContact.id === contactId ? shouldSendVoiceForContact(currentContact) : false
            const msgId = "msg_" + now + "_" + Math.random().toString(16).slice(2)

            if (currentContact && currentContact.id === contactId && currentPage === "chatDetail" && box) {
                const typingId = "typing_" + now + "_" + i
                box.innerHTML += `
                    <div id="${typingId}" class="chat-row ai-row">
                        <div class="chat-avatar">${avatarHtml(currentContact.avatar, "🙂")}</div>
                        <div class="msg-wrap ai-wrap"><div class="msg ai-msg typing-msg">${isVoice ? "正在录音中..." : "正在输入中..."}</div></div>
                    </div>
                `
                box.scrollTop = box.scrollHeight
                await sleep(700 + Math.random() * 900)
                const typing = document.getElementById(typingId)
                if (typing) typing.remove()
                const msgObj = { id: msgId, content: item.content, createdAt: now, isVoice, voiceDuration: Math.max(2, Math.min(18, Math.ceil(String(item.content || "").length / 6))) }
                box.innerHTML += `
                    <div class="chat-row ai-row" data-msg-id="${msgId}">
                        ${makeThoughtAvatarHtml(currentContact.avatar, "🙂", `showThoughtsCardForMessage('${msgId}', '${contactId}', '')`)}
                        <div class="msg-wrap ai-wrap">
                            <div class="msg ai-msg">${renderPrivateMessageContent(msgObj)}</div>
                            <div class="msg-time">${formatMsgTime(now)}</div>
                        </div>
                    </div>
                `
                box.scrollTop = box.scrollHeight
            }

            saveMessage(contactId, "assistant", item.content, now, { id: msgId, innerThoughts: item.innerThoughts || "", isVoice, voiceMsg: isVoice, voiceDuration: Math.max(2, Math.min(18, Math.ceil(String(item.content || "").length / 6))) })

            Promise.all([getRecentMessages(contactId), getContactById(contactId)]).then(([history, contact]) => {
                const lastUser = [...history].reverse().find(m => m.role === "user")
                afterAiMessageMemoryChecks(contactId, contact?.name || currentContact?.name || "角色", lastUser?.content || "", item.content)
                maybeGeneratePrivateChatImage(contactId, (lastUser?.content || "") + "\n" + item.content)
            }).catch(() => {})
            if (i < replies.length - 1) await sleep(500 + Math.random() * 700)
        }
    }

    const __oldShowChatSettingsPage = window.showChatSettingsPage
    window.showChatSettingsPage = function(){
        if (!currentContact) return
        if (typeof __oldShowChatSettingsPage === "function") __oldShowChatSettingsPage()
        const page = document.querySelector(".chat-settings-page")
        if (!page) return
        const extra = document.createElement("div")
        extra.innerHTML = `
            <div class="chat-settings-section">生图与语音消息</div>
            <div class="chat-settings-card">
                <button class="chat-settings-row" onclick="toggleContactField('allowChatImage')"><span>允许对话生图</span><span>${currentContact.allowChatImage ? "已开" : "已关"}</span></button>
                <button class="chat-settings-row" onclick="toggleContactField('allowMomentImage')"><span>允许角色动态生图</span><span>${currentContact.allowMomentImage ? "已开" : "已关"}</span></button>
                <button class="chat-settings-row" onclick="toggleContactField('allowVoiceMsg')"><span>允许发送语音消息</span><span>${currentContact.allowVoiceMsg ? "已开" : "已关"}</span></button>
                <button class="chat-settings-row" onclick="showContactFieldEditor('语音消息概率','voiceMsgProb', currentContact.voiceMsgProb || localStorage.getItem('MJI_VOICE_MSG_PROB') || '30','0-100')"><span>语音消息概率</span><span>${escapeHtml(currentContact.voiceMsgProb || localStorage.getItem("MJI_VOICE_MSG_PROB") || "30")}% ›</span></button>
                <button class="chat-settings-row" onclick="showContactFieldEditor('角色动态风格','momentImageStyle', currentContact.momentImageStyle || '','例如：生活照、第一人称、不露脸、灰调胶片', true)"><span>角色动态生图风格</span><span>${currentContact.momentImageStyle ? "已填" : "未填"} ›</span></button>
            </div>
        `
        const backCard = Array.from(page.querySelectorAll(".chat-settings-card")).find(card => card.textContent.includes("返回聊天"))
        if (backCard) page.insertBefore(extra, backCard)
        else page.appendChild(extra)
    }

    const __oldGoHomeProfile = window.goHome
    window.goHome = function(){
        if (currentPage === "myProfileEditor" || currentPage === "chatDisplaySettings") {
            currentPage = "chat"
            showWechatShell("me")
            return
        }
        if (currentPage === "chatSettingsSubPage" && currentContact) {
            showChatSettingsPage()
            return
        }
        return __oldGoHomeProfile ? __oldGoHomeProfile() : undefined
    }
})()


/* Strict fix: Chat → 我 must only show avatar/name + Settings entry */
(function(){
    const oldSwitch = window.switchWechatTab
    window.switchWechatTab = function(tab){
        currentWechatTab = tab
        document.querySelectorAll(".wechat-bottom-nav button").forEach(b => b.classList.remove("active"))
        const active = document.getElementById("nav_" + tab)
        if (active) active.classList.add("active")
        if (tab === "msg") return renderWechatMessages()
        if (tab === "contact") return renderWechatContacts()
        if (tab === "discovery") return renderWechatDiscovery()
        if (tab === "me") return (window.renderWechatMe ? window.renderWechatMe() : renderWechatMe())
        if (oldSwitch) return oldSwitch(tab)
    }
    const oldShell = window.showWechatShell
    window.showWechatShell = function(tab = "msg"){
        currentPage = "chat"
        currentWechatTab = tab
        if (typeof setChatWebViewMode === "function") setChatWebViewMode(false)
        if (typeof closeChatSettingsPanel === "function") closeChatSettingsPanel()
        if (typeof applyChatCustomCss === "function") applyChatCustomCss()
        const root = document.getElementById("wechatRoot")
        if (!root) return
        root.innerHTML = `
            <div class="wechat-shell">
                <div class="wechat-view" id="wechatView"></div>
                <div class="wechat-bottom-nav">
                    <button id="nav_msg" onclick="switchWechatTab('msg')"><span class="nav-line-icon nav-msg"></span><em>消息</em></button>
                    <button id="nav_contact" onclick="switchWechatTab('contact')"><span class="nav-line-icon nav-contact"></span><em>联系人</em></button>
                    <button id="nav_discovery" onclick="switchWechatTab('discovery')"><span class="nav-line-icon nav-discovery"></span><em>动态</em></button>
                    <button id="nav_me" onclick="switchWechatTab('me')"><span class="nav-line-icon nav-me"></span><em>我</em></button>
                </div>
            </div>
        `
        window.switchWechatTab(tab)
    }
})()

/* ============================================================
   STRICT CLICK FIX: Chat → 我 / 设置 可点击修复
   只保留“头像昵称 + 设置”，点击后进入对应页面
============================================================ */
(function(){
    if (window.__mjiMeStrictClickableFixV2) return;
    window.__mjiMeStrictClickableFixV2 = true;

    function h(v){
        try { return (window.escapeHtml ? window.escapeHtml(String(v || "")) : String(v || "").replace(/[&<>\"]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]))); }
        catch(e){ return String(v || ""); }
    }
    function attr(v){ return h(v).replace(/"/g, "&quot;"); }
    function b64(file){
        if (typeof fileToBase64 === "function") return fileToBase64(file);
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result || "");
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }
    function my(){
        return {
            name: localStorage.getItem("MJI_MY_NAME") || "我",
            age: localStorage.getItem("MJI_MY_AGE") || "",
            birthday: localStorage.getItem("MJI_MY_BIRTHDAY") || "",
            gender: localStorage.getItem("MJI_MY_GENDER") || "",
            identity: localStorage.getItem("MJI_MY_IDENTITY") || "",
            profile: localStorage.getItem("MJI_MY_PROFILE") || "",
            avatar: localStorage.getItem("MJI_MY_AVATAR") || ""
        };
    }
    function avatar(src){
        if (src) return `<img src="${attr(src)}" alt="头像">`;
        return `<div class="mji-me-avatar-fallback">我</div>`;
    }
    function title(t){
        const el = document.getElementById("appTitle");
        if (el) el.innerText = t;
    }
    function content(html){
        const el = document.getElementById("appContent");
        if (el) el.innerHTML = html;
    }

    function ensureStyle(){
        if (document.getElementById("mjiMeClickableFixStyle")) return;
        const s = document.createElement("style");
        s.id = "mjiMeClickableFixStyle";
        s.textContent = `
        .mji-me-page{padding:18px 14px 92px;background:var(--app-bg,#f3f1ec);min-height:100%;box-sizing:border-box;}
        .mji-me-card{width:100%;border:0;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.55);border-radius:22px;box-shadow:0 8px 24px rgba(0,0,0,.045);color:#141821;text-align:left;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent;}
        .mji-me-profile{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 14px;}
        .mji-me-avatar{width:62px;height:62px;border-radius:20px;overflow:hidden;background:rgba(232,230,224,.8);flex-shrink:0;}
        .mji-me-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
        .mji-me-avatar-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#6b7280;}
        .mji-me-name{font-size:20px;font-weight:900;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .mji-me-arrow{font-size:24px;color:#9ca3af;}
        .mji-me-setting{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;margin:0;}
        .mji-me-setting-title{font-size:16px;font-weight:900;margin-bottom:4px;}
        .mji-me-setting-sub{font-size:12px;color:#8b909a;line-height:1.45;}
        .mji-page-wrap{padding:14px;background:#f3f1ec;min-height:100%;box-sizing:border-box;}
        .mji-form-card{background:rgba(255,255,255,.78);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.58);border-radius:22px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.045);box-sizing:border-box;}
        .mji-form-card input,.mji-form-card textarea,.mji-form-card select{width:100%;border:1px solid rgba(0,0,0,.06);outline:0;background:rgba(255,255,255,.72);border-radius:15px;padding:12px 13px;margin:8px 0;font-size:15px;color:#111;box-sizing:border-box;}
        .mji-form-card textarea{min-height:128px;resize:vertical;line-height:1.55;}
        .mji-save-btn,.mji-row-btn{width:100%;min-height:48px;border:0;border-radius:16px;background:#c8d4ee;color:#323846;font-weight:900;margin-top:10px;font-size:15px;}
        .mji-row-btn{background:rgba(255,255,255,.78);display:flex;align-items:center;justify-content:space-between;padding:0 15px;text-align:left;color:#141821;}
        .mji-row-btn small{display:block;color:#8b909a;font-size:12px;font-weight:500;margin-top:3px;line-height:1.4;}
        .mji-danger{background:#f3d1d1;color:#8f1d1d;}
        .mji-profile-avatar-preview{width:70px;height:70px;border-radius:22px;overflow:hidden;background:#e8e6e0;margin-bottom:10px;}
        .mji-profile-avatar-preview img{width:100%;height:100%;object-fit:cover;display:block;}
        .code-textarea{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px!important;min-height:210px!important;}
        `;
        document.head.appendChild(s);
    }

    window.renderWechatMe = function(){
        ensureStyle();
        const view = document.getElementById("wechatView");
        if (!view) return;
        const m = my();
        view.innerHTML = `
            <div class="mji-me-page">
                <div id="mjiMeProfileCard" class="mji-me-card mji-me-profile" role="button" tabindex="0">
                    <div class="mji-me-avatar">${avatar(m.avatar)}</div>
                    <div class="mji-me-name">${h(m.name || "我")}</div>
                    <span class="mji-me-arrow">›</span>
                </div>
                <div id="mjiMeSettingCard" class="mji-me-card mji-me-setting" role="button" tabindex="0">
                    <div>
                        <div class="mji-me-setting-title">设置</div>
                        <div class="mji-me-setting-sub">聊天气泡设置、心声卡片设置</div>
                    </div>
                    <span class="mji-me-arrow">›</span>
                </div>
            </div>
        `;
        const profileCard = document.getElementById("mjiMeProfileCard");
        const settingCard = document.getElementById("mjiMeSettingCard");
        const goProfile = function(e){ if(e) e.stopPropagation(); window.showMyProfileEditor(); };
        const goSetting = function(e){ if(e) e.stopPropagation(); window.showChatDisplaySettingsPage(); };
        if (profileCard) {
            profileCard.onclick = goProfile;
            profileCard.ontouchend = goProfile;
            profileCard.onkeydown = e => { if (e.key === "Enter" || e.key === " ") goProfile(e); };
        }
        if (settingCard) {
            settingCard.onclick = goSetting;
            settingCard.ontouchend = goSetting;
            settingCard.onkeydown = e => { if (e.key === "Enter" || e.key === " ") goSetting(e); };
        }
    };

    window.showMyProfileEditor = function(){
        ensureStyle();
        const m = my();
        currentPage = "myProfileEditor";
        title("个人资料");
        content(`
            <div class="mji-page-wrap">
                <div class="mji-form-card">
                    <div class="mji-profile-avatar-preview">${avatar(m.avatar)}</div>
                    <input type="file" id="mjiMyAvatarFile" accept="image/*">
                    <input id="mjiMyName" placeholder="姓名 / 昵称" value="${attr(m.name)}">
                    <input id="mjiMyAge" placeholder="年龄" value="${attr(m.age)}">
                    <input id="mjiMyBirthday" placeholder="生日，例如 09-16 / 1999-09-16" value="${attr(m.birthday)}">
                    <select id="mjiMyGender">
                        ${["","女","男","非二元","不透露"].map(x=>`<option value="${attr(x)}" ${x===m.gender?"selected":""}>${x || "选择性别"}</option>`).join("")}
                    </select>
                    <input id="mjiMyIdentity" placeholder="身份 / 职业 / 自设身份" value="${attr(m.identity)}">
                    <textarea id="mjiMyProfile" placeholder="具体信息：角色需要知道的你的设定、性格、雷点、偏好等">${h(m.profile)}</textarea>
                    <button class="mji-save-btn" id="mjiSaveProfileBtn">保存个人资料</button>
                </div>
            </div>
        `);
        const btn = document.getElementById("mjiSaveProfileBtn");
        if (btn) btn.onclick = window.saveMyProfile;
    };

    window.saveMyProfile = async function(){
        const f = document.getElementById("mjiMyAvatarFile")?.files?.[0];
        if (f) localStorage.setItem("MJI_MY_AVATAR", await b64(f));
        localStorage.setItem("MJI_MY_NAME", document.getElementById("mjiMyName")?.value.trim() || "我");
        localStorage.setItem("MJI_MY_AGE", document.getElementById("mjiMyAge")?.value.trim() || "");
        localStorage.setItem("MJI_MY_BIRTHDAY", document.getElementById("mjiMyBirthday")?.value.trim() || "");
        localStorage.setItem("MJI_MY_GENDER", document.getElementById("mjiMyGender")?.value || "");
        localStorage.setItem("MJI_MY_IDENTITY", document.getElementById("mjiMyIdentity")?.value.trim() || "");
        localStorage.setItem("MJI_MY_PROFILE", document.getElementById("mjiMyProfile")?.value.trim() || "");
        alert("个人资料已保存");
        openApp("chat", "me");
    };

    window.showChatDisplaySettingsPage = function(){
        ensureStyle();
        currentPage = "chatDisplaySettings";
        title("设置");
        content(`
            <div class="mji-page-wrap">
                <button class="mji-row-btn" id="mjiBubbleSettingBtn"><span><b>聊天气泡设置</b><small>修改聊天背景、气泡颜色、圆角、字体等 CSS</small></span><span>›</span></button>
                <button class="mji-row-btn" id="mjiThoughtSettingBtn"><span><b>心声卡片设置</b><small>修改点击角色头像后弹出的心声卡片模板</small></span><span>›</span></button>
            </div>
        `);
        const b = document.getElementById("mjiBubbleSettingBtn");
        const t = document.getElementById("mjiThoughtSettingBtn");
        if (b) b.onclick = window.showChatBubbleSettingsEditor;
        if (t) t.onclick = window.showThoughtsCardSettingsEditor;
    };

    window.showChatBubbleSettingsEditor = function(){
        ensureStyle();
        currentPage = "chatBubbleSettings";
        title("聊天气泡设置");
        const css = localStorage.getItem("MJI_CHAT_CUSTOM_CSS") || "";
        content(`
            <div class="mji-page-wrap">
                <div class="mji-form-card">
                    <input type="file" id="mjiChatCssFile" accept=".css,text/css,text/plain">
                    <textarea id="mjiChatCssText" class="code-textarea" placeholder="粘贴 Chat CSS">${h(css)}</textarea>
                    <button class="mji-save-btn" id="mjiSaveBubbleBtn">保存并应用</button>
                    <button class="mji-save-btn mji-danger" id="mjiClearBubbleBtn">恢复默认</button>
                </div>
            </div>
        `);
        const file = document.getElementById("mjiChatCssFile");
        if (file) file.onchange = async () => {
            const f = file.files?.[0];
            if (f) document.getElementById("mjiChatCssText").value = await f.text();
        };
        document.getElementById("mjiSaveBubbleBtn").onclick = function(){
            localStorage.setItem("MJI_CHAT_CUSTOM_CSS", document.getElementById("mjiChatCssText")?.value || "");
            if (typeof applyChatCustomCss === "function") applyChatCustomCss();
            alert("聊天气泡设置已保存");
        };
        document.getElementById("mjiClearBubbleBtn").onclick = function(){
            localStorage.removeItem("MJI_CHAT_CUSTOM_CSS");
            if (typeof applyChatCustomCss === "function") applyChatCustomCss();
            alert("已恢复默认聊天气泡");
            showChatBubbleSettingsEditor();
        };
    };

    window.showThoughtsCardSettingsEditor = function(){
        ensureStyle();
        currentPage = "thoughtsCardSettings";
        title("心声卡片设置");
        const tpl = localStorage.getItem("MJI_THOUGHTS_CARD_TEMPLATE") || "";
        const css = localStorage.getItem("MJI_THOUGHTS_CARD_CSS") || "";
        content(`
            <div class="mji-page-wrap">
                <div class="mji-form-card">
                    <input type="file" id="mjiThoughtsFile" accept=".html,.css,text/html,text/css,text/plain">
                    <textarea id="mjiThoughtsTpl" class="code-textarea" placeholder="粘贴心声卡片 HTML 模板">${h(tpl)}</textarea>
                    <textarea id="mjiThoughtsCss" class="code-textarea" placeholder="单独 CSS，可空">${h(css)}</textarea>
                    <button class="mji-save-btn" id="mjiSaveThoughtsBtn">保存心声卡片</button>
                    <button class="mji-save-btn mji-danger" id="mjiClearThoughtsBtn">恢复默认</button>
                </div>
            </div>
        `);
        const file = document.getElementById("mjiThoughtsFile");
        if (file) file.onchange = async () => {
            const f = file.files?.[0];
            if (!f) return;
            const text = await f.text();
            if ((f.name || "").toLowerCase().endsWith(".css")) document.getElementById("mjiThoughtsCss").value = text;
            else document.getElementById("mjiThoughtsTpl").value = text;
        };
        document.getElementById("mjiSaveThoughtsBtn").onclick = function(){
            localStorage.setItem("MJI_THOUGHTS_CARD_TEMPLATE", document.getElementById("mjiThoughtsTpl")?.value || "");
            localStorage.setItem("MJI_THOUGHTS_CARD_CSS", document.getElementById("mjiThoughtsCss")?.value || "");
            alert("心声卡片设置已保存");
        };
        document.getElementById("mjiClearThoughtsBtn").onclick = function(){
            localStorage.removeItem("MJI_THOUGHTS_CARD_TEMPLATE");
            localStorage.removeItem("MJI_THOUGHTS_CARD_CSS");
            alert("已恢复默认心声卡片");
            showThoughtsCardSettingsEditor();
        };
    };

    const oldSwitch = window.switchWechatTab;
    window.switchWechatTab = function(tab){
        currentPage = "chat";
        currentWechatTab = tab;
        document.querySelectorAll(".wechat-bottom-nav button").forEach(b => b.classList.remove("active"));
        const active = document.getElementById("nav_" + tab);
        if (active) active.classList.add("active");
        if (tab === "me") return window.renderWechatMe();
        if (typeof oldSwitch === "function") return oldSwitch(tab);
    };

    const oldGoHome = window.goHome;
    window.goHome = function(){
        if (["myProfileEditor","chatDisplaySettings","chatBubbleSettings","thoughtsCardSettings"].includes(currentPage)) {
            openApp("chat", "me");
            return;
        }
        return typeof oldGoHome === "function" ? oldGoHome() : undefined;
    };
})();

/* ============================================================
   NUCLEAR FIX 2026-06-16: Chat → 我 / 设置 点不进去
   - 不再依赖 inline onclick
   - 不再依赖替换 appContent 才跳页
   - 全部在 wechatView 内部渲染
   - 用 document 捕获事件兜底
============================================================ */
(function(){
    if (window.__mjiMeNuclearClickFixV3) return;
    window.__mjiMeNuclearClickFixV3 = true;

    function esc(v){
        const s = String(v == null ? "" : v);
        return s.replace(/[&<>\"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
    }
    function attr(v){ return esc(v).replace(/"/g, "&quot;"); }
    function getView(){ return document.getElementById("wechatView") || document.getElementById("appContent"); }
    function setTitle(t){ const el = document.getElementById("appTitle"); if (el) el.innerText = t; }
    function setView(html){ const v = getView(); if (v) v.innerHTML = html; }
    function fileToDataUrl(file){
        if (typeof window.fileToBase64 === "function") return window.fileToBase64(file);
        return new Promise((resolve,reject)=>{
            const r = new FileReader();
            r.onload = () => resolve(r.result || "");
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }
    function profile(){
        return {
            name: localStorage.getItem("MJI_MY_NAME") || "我",
            age: localStorage.getItem("MJI_MY_AGE") || "",
            birthday: localStorage.getItem("MJI_MY_BIRTHDAY") || "",
            gender: localStorage.getItem("MJI_MY_GENDER") || "",
            identity: localStorage.getItem("MJI_MY_IDENTITY") || "",
            profile: localStorage.getItem("MJI_MY_PROFILE") || "",
            avatar: localStorage.getItem("MJI_MY_AVATAR") || ""
        };
    }
    function avatarHtml2(src){
        if (src) return `<img src="${attr(src)}" alt="头像">`;
        return `<div class="mji-me-avatar-fallback">我</div>`;
    }
    function ensureCss(){
        if (document.getElementById("mjiMeNuclearCss")) return;
        const css = document.createElement("style");
        css.id = "mjiMeNuclearCss";
        css.textContent = `
        #wechatView{pointer-events:auto!important;}
        .mji-me-page,.mji-me-page *{pointer-events:auto!important;box-sizing:border-box;}
        .mji-me-page{padding:18px 14px 96px;background:var(--app-bg,#f3f1ec);min-height:100%;}
        .mji-me-card{position:relative;z-index:5;width:100%;border:0;background:rgba(255,255,255,.76);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.58);border-radius:22px;box-shadow:0 8px 24px rgba(0,0,0,.045);color:#141821;text-align:left;cursor:pointer;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:manipulation;user-select:none;}
        .mji-me-profile{display:flex;align-items:center;gap:14px;padding:16px;margin:0 0 14px;}
        .mji-me-avatar{width:62px;height:62px;border-radius:20px;overflow:hidden;background:rgba(232,230,224,.8);flex:0 0 62px;}
        .mji-me-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
        .mji-me-avatar-fallback{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:#6b7280;}
        .mji-me-name{font-size:20px;font-weight:900;line-height:1.2;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .mji-me-arrow{font-size:24px;color:#9ca3af;}
        .mji-me-setting{display:flex;align-items:center;justify-content:space-between;padding:17px 16px;margin:0;}
        .mji-me-setting-title{font-size:16px;font-weight:900;margin-bottom:4px;}
        .mji-me-setting-sub{font-size:12px;color:#8b909a;line-height:1.45;}
        .mji-subpage{padding:14px 14px 96px;background:var(--app-bg,#f3f1ec);min-height:100%;}
        .mji-form-card{background:rgba(255,255,255,.78);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.58);border-radius:22px;padding:16px;box-shadow:0 8px 24px rgba(0,0,0,.045);}
        .mji-form-card input,.mji-form-card textarea,.mji-form-card select{width:100%;border:1px solid rgba(0,0,0,.06);outline:0;background:rgba(255,255,255,.72);border-radius:15px;padding:12px 13px;margin:8px 0;font-size:15px;color:#111;}
        .mji-form-card textarea{min-height:130px;resize:vertical;line-height:1.55;}
        .mji-save-btn,.mji-row-btn{width:100%;min-height:48px;border:0;border-radius:16px;background:#c8d4ee;color:#323846;font-weight:900;margin-top:10px;font-size:15px;touch-action:manipulation;}
        .mji-row-btn{background:rgba(255,255,255,.78);display:flex;align-items:center;justify-content:space-between;padding:0 15px;text-align:left;color:#141821;}
        .mji-row-btn small{display:block;color:#8b909a;font-size:12px;font-weight:500;margin-top:3px;line-height:1.4;}
        .mji-danger{background:#f3d1d1;color:#8f1d1d;}
        .mji-profile-avatar-preview{width:70px;height:70px;border-radius:22px;overflow:hidden;background:#e8e6e0;margin-bottom:10px;}
        .mji-profile-avatar-preview img{width:100%;height:100%;object-fit:cover;display:block;}
        .mji-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px!important;min-height:220px!important;}
        `;
        document.head.appendChild(css);
    }

    window.renderWechatMe = function(){
        ensureCss();
        currentPage = "chat";
        currentWechatTab = "me";
        setTitle("Chat");
        const m = profile();
        setView(`
            <div class="mji-me-page">
                <button type="button" class="mji-me-card mji-me-profile" data-mji-action="profile">
                    <div class="mji-me-avatar">${avatarHtml2(m.avatar)}</div>
                    <div class="mji-me-name">${esc(m.name || "我")}</div>
                    <span class="mji-me-arrow">›</span>
                </button>
                <button type="button" class="mji-me-card mji-me-setting" data-mji-action="settings">
                    <div>
                        <div class="mji-me-setting-title">设置</div>
                        <div class="mji-me-setting-sub">聊天气泡设置、心声卡片设置</div>
                    </div>
                    <span class="mji-me-arrow">›</span>
                </button>
            </div>
        `);
        bindNow();
    };

    window.showMyProfileEditor = function(){
        ensureCss();
        currentPage = "myProfileEditor";
        setTitle("个人资料");
        const m = profile();
        setView(`
            <div class="mji-subpage">
                <div class="mji-form-card">
                    <div class="mji-profile-avatar-preview">${avatarHtml2(m.avatar)}</div>
                    <input type="file" id="mjiMyAvatarFile" accept="image/*">
                    <input id="mjiMyName" placeholder="姓名 / 昵称" value="${attr(m.name)}">
                    <input id="mjiMyAge" placeholder="年龄" value="${attr(m.age)}">
                    <input id="mjiMyBirthday" placeholder="生日，例如 09-16 / 1999-09-16" value="${attr(m.birthday)}">
                    <select id="mjiMyGender">
                        ${["","女","男","非二元","不透露"].map(x=>`<option value="${attr(x)}" ${x===m.gender?"selected":""}>${x || "选择性别"}</option>`).join("")}
                    </select>
                    <input id="mjiMyIdentity" placeholder="身份 / 职业 / 自设身份" value="${attr(m.identity)}">
                    <textarea id="mjiMyProfile" placeholder="具体信息：角色需要知道的你的设定、性格、雷点、偏好等">${esc(m.profile)}</textarea>
                    <button type="button" class="mji-save-btn" data-mji-action="save-profile">保存个人资料</button>
                </div>
            </div>
        `);
        bindNow();
    };

    window.saveMyProfile = async function(){
        const f = document.getElementById("mjiMyAvatarFile")?.files?.[0];
        if (f) localStorage.setItem("MJI_MY_AVATAR", await fileToDataUrl(f));
        localStorage.setItem("MJI_MY_NAME", document.getElementById("mjiMyName")?.value.trim() || "我");
        localStorage.setItem("MJI_MY_AGE", document.getElementById("mjiMyAge")?.value.trim() || "");
        localStorage.setItem("MJI_MY_BIRTHDAY", document.getElementById("mjiMyBirthday")?.value.trim() || "");
        localStorage.setItem("MJI_MY_GENDER", document.getElementById("mjiMyGender")?.value || "");
        localStorage.setItem("MJI_MY_IDENTITY", document.getElementById("mjiMyIdentity")?.value.trim() || "");
        localStorage.setItem("MJI_MY_PROFILE", document.getElementById("mjiMyProfile")?.value.trim() || "");
        alert("个人资料已保存");
        window.renderWechatMe();
    };

    window.showChatDisplaySettingsPage = function(){
        ensureCss();
        currentPage = "chatDisplaySettings";
        setTitle("设置");
        setView(`
            <div class="mji-subpage">
                <button type="button" class="mji-row-btn" data-mji-action="bubble-settings"><span><b>聊天气泡设置</b><small>修改聊天背景、气泡颜色、圆角、字体等 CSS</small></span><span>›</span></button>
                <button type="button" class="mji-row-btn" data-mji-action="thoughts-settings"><span><b>心声卡片设置</b><small>修改点击角色头像后弹出的心声卡片模板</small></span><span>›</span></button>
            </div>
        `);
        bindNow();
    };

    window.showChatBubbleSettingsEditor = function(){
        ensureCss();
        currentPage = "chatBubbleSettings";
        setTitle("聊天气泡设置");
        const css = localStorage.getItem("MJI_CHAT_CUSTOM_CSS") || "";
        setView(`
            <div class="mji-subpage"><div class="mji-form-card">
                <input type="file" id="mjiChatCssFile" accept=".css,text/css,text/plain">
                <textarea id="mjiChatCssText" class="mji-code" placeholder="粘贴 Chat CSS">${esc(css)}</textarea>
                <button type="button" class="mji-save-btn" data-mji-action="save-bubble">保存并应用</button>
                <button type="button" class="mji-save-btn mji-danger" data-mji-action="clear-bubble">恢复默认</button>
            </div></div>
        `);
        const file = document.getElementById("mjiChatCssFile");
        if (file) file.onchange = async () => {
            const f = file.files?.[0];
            if (f) document.getElementById("mjiChatCssText").value = await f.text();
        };
        bindNow();
    };

    window.showThoughtsCardSettingsEditor = function(){
        ensureCss();
        currentPage = "thoughtsCardSettings";
        setTitle("心声卡片设置");
        const tpl = localStorage.getItem("MJI_THOUGHTS_CARD_TEMPLATE") || "";
        const css = localStorage.getItem("MJI_THOUGHTS_CARD_CSS") || "";
        setView(`
            <div class="mji-subpage"><div class="mji-form-card">
                <input type="file" id="mjiThoughtsFile" accept=".html,.css,text/html,text/css,text/plain">
                <textarea id="mjiThoughtsTpl" class="mji-code" placeholder="粘贴心声卡片 HTML 模板">${esc(tpl)}</textarea>
                <textarea id="mjiThoughtsCss" class="mji-code" placeholder="单独 CSS，可空">${esc(css)}</textarea>
                <button type="button" class="mji-save-btn" data-mji-action="save-thoughts">保存心声卡片</button>
                <button type="button" class="mji-save-btn mji-danger" data-mji-action="clear-thoughts">恢复默认</button>
            </div></div>
        `);
        const file = document.getElementById("mjiThoughtsFile");
        if (file) file.onchange = async () => {
            const f = file.files?.[0];
            if (!f) return;
            const text = await f.text();
            if ((f.name || "").toLowerCase().endsWith(".css")) document.getElementById("mjiThoughtsCss").value = text;
            else document.getElementById("mjiThoughtsTpl").value = text;
        };
        bindNow();
    };

    function runAction(action, ev){
        if (!action) return false;
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        if (action === "profile") { window.showMyProfileEditor(); return true; }
        if (action === "settings") { window.showChatDisplaySettingsPage(); return true; }
        if (action === "save-profile") { window.saveMyProfile(); return true; }
        if (action === "bubble-settings") { window.showChatBubbleSettingsEditor(); return true; }
        if (action === "thoughts-settings") { window.showThoughtsCardSettingsEditor(); return true; }
        if (action === "save-bubble") { localStorage.setItem("MJI_CHAT_CUSTOM_CSS", document.getElementById("mjiChatCssText")?.value || ""); if (typeof applyChatCustomCss === "function") applyChatCustomCss(); alert("聊天气泡设置已保存"); return true; }
        if (action === "clear-bubble") { localStorage.removeItem("MJI_CHAT_CUSTOM_CSS"); if (typeof applyChatCustomCss === "function") applyChatCustomCss(); alert("已恢复默认聊天气泡"); window.showChatBubbleSettingsEditor(); return true; }
        if (action === "save-thoughts") { localStorage.setItem("MJI_THOUGHTS_CARD_TEMPLATE", document.getElementById("mjiThoughtsTpl")?.value || ""); localStorage.setItem("MJI_THOUGHTS_CARD_CSS", document.getElementById("mjiThoughtsCss")?.value || ""); alert("心声卡片设置已保存"); return true; }
        if (action === "clear-thoughts") { localStorage.removeItem("MJI_THOUGHTS_CARD_TEMPLATE"); localStorage.removeItem("MJI_THOUGHTS_CARD_CSS"); alert("已恢复默认心声卡片"); window.showThoughtsCardSettingsEditor(); return true; }
        return false;
    }

    let lastTap = 0;
    function handle(ev){
        const t = ev.target;
        const navMe = t && t.closest ? t.closest("#nav_me") : null;
        if (navMe) { ev.preventDefault(); ev.stopPropagation(); window.renderWechatMe(); return; }
        const node = t && t.closest ? t.closest("[data-mji-action]") : null;
        if (!node) return;
        const now = Date.now();
        if (now - lastTap < 180) { ev.preventDefault(); ev.stopPropagation(); return; }
        lastTap = now;
        runAction(node.getAttribute("data-mji-action"), ev);
    }

    function bindNow(){
        document.querySelectorAll("[data-mji-action]").forEach(el => {
            el.onclick = e => runAction(el.getAttribute("data-mji-action"), e);
            el.onpointerup = e => runAction(el.getAttribute("data-mji-action"), e);
            el.ontouchend = e => runAction(el.getAttribute("data-mji-action"), e);
        });
    }

    document.addEventListener("click", handle, true);
    document.addEventListener("pointerup", handle, true);
    document.addEventListener("touchend", handle, true);

    const oldSwitch = window.switchWechatTab;
    window.switchWechatTab = function(tab){
        currentPage = "chat";
        currentWechatTab = tab;
        document.querySelectorAll(".wechat-bottom-nav button").forEach(b => b.classList.remove("active"));
        const active = document.getElementById("nav_" + tab);
        if (active) active.classList.add("active");
        if (tab === "me") return window.renderWechatMe();
        if (typeof oldSwitch === "function") return oldSwitch(tab);
    };

    const oldGoHome = window.goHome;
    window.goHome = function(){
        if (["myProfileEditor","chatDisplaySettings","chatBubbleSettings","thoughtsCardSettings"].includes(currentPage)) {
            window.renderWechatMe();
            return;
        }
        return typeof oldGoHome === "function" ? oldGoHome() : undefined;
    };
})();

/* ============================================================
   MJI PWA BUGFIX 2026-06-17
   1) 角色语言/翻译强制生效
   2) 私聊消息长按：引用/删除/撤回；角色撤回后可查看
   3) 私聊内置返回键，避免桌面版 PWA 无法返回
============================================================ */
(function(){
    if (window.__mjiPwaBugfix0617) return;
    window.__mjiPwaBugfix0617 = true;

    function esc(v){
        if (typeof escapeHtml === "function") return escapeHtml(v == null ? "" : String(v));
        return String(v == null ? "" : v).replace(/[&<>"]/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]));
    }
    function attr(v){ return esc(v).replace(/'/g, "&#39;"); }
    function hasCjk(v){ return /[\u4e00-\u9fff]/.test(String(v || "")); }
    function normLang(contact){
        const raw = String(contact?.aiLang || contact?.lang || "默认 (中文)").trim();
        if (!raw || raw.includes("默认") || raw.includes("中文") || raw.toLowerCase()==="zh" || raw.toLowerCase()==="chinese") return { raw:"默认 (中文)", target:"中文", isChinese:true, speech:"zh-CN" };
        if (/英|english|en/i.test(raw)) return { raw, target:"英文", isChinese:false, speech:"en-US" };
        if (/德|german|de/i.test(raw)) return { raw, target:"德语", isChinese:false, speech:"de-DE" };
        if (/日|japanese|ja/i.test(raw)) return { raw, target:"日语", isChinese:false, speech:"ja-JP" };
        if (/韩|korean|ko/i.test(raw)) return { raw, target:"韩语", isChinese:false, speech:"ko-KR" };
        if (/法|french|fr/i.test(raw)) return { raw, target:"法语", isChinese:false, speech:"fr-FR" };
        if (/俄|russian|ru/i.test(raw)) return { raw, target:"俄语", isChinese:false, speech:"ru-RU" };
        return { raw, target:raw, isChinese:false, speech:"en-US" };
    }
    function langRuleFor(contact){
        const l = normLang(contact);
        if (l.isChinese) {
            return `角色语言：中文。\n【台词】必须使用中文。\n不要输出【翻译】。`;
        }
        return `角色语言：${l.target}。\n强制要求：\n1. 【台词】只能写${l.target}，不能夹中文。\n2. 【翻译】必须另起一行写完整中文翻译。\n3. 如果你不会${l.target}，也必须先用${l.target}表达，再给中文翻译。`;
    }
    function buildFormatExample(contact){
        const l = normLang(contact);
        if (l.isChinese) {
            return `【内心】我想先接住她的话，不要显得敷衍。\n【台词】我在，慢慢说。`;
        }
        if (l.target === "英文") {
            return `【内心】我想先接住她的话，不要显得敷衍。\n【台词】I'm here. Take your time.\n【翻译】我在。慢慢说。`;
        }
        return `【内心】我想先接住她的话，不要显得敷衍。\n【台词】用${l.target}写给用户的内容\n【翻译】对应的中文翻译`;
    }

    window.parseAiReplyBlocks = function(raw, contactArg){
        const contact = contactArg || window.currentContact || currentContact;
        const l = normLang(contact);
        const text = String(raw || "").trim();
        if (!text) return [];
        let blocks = text.includes("<|SPLIT|>") ? text.split("<|SPLIT|>") : (text.includes("[MSG]") ? text.split(/\[MSG\]/) : [text]);
        return blocks.map(block => {
            let b = String(block || "").trim();
            if (!b) return null;
            const inner = (/【\s*内心\s*】[：:]?\s*([\s\S]*?)(?=【\s*台词\s*】|【\s*(?:翻译|译)\s*】|$)/.exec(b) || [])[1]?.trim() || "";
            let dialog = (/【\s*台词\s*】[：:]?\s*([\s\S]*?)(?=【\s*(?:翻译|译)\s*】|$)/.exec(b) || [])[1]?.trim() || "";
            let trans = (/【\s*(?:翻译|译)\s*】[：:]?\s*([\s\S]+)$/ .exec(b) || [])[1]?.trim() || "";
            if (!dialog) {
                dialog = b
                    .replace(/【\s*内心\s*】[：:]?[\s\S]*?(?=【\s*台词\s*】|【\s*(?:翻译|译)\s*】|$)/g, "")
                    .replace(/【\s*台词\s*】[：:]?/g, "")
                    .replace(/【\s*(?:翻译|译)\s*】[：:]?[\s\S]*$/g, "")
                    .trim();
            }
            dialog = dialog.replace(/^\[MSG\]/, "").replace(/\*[^*]{1,80}\*/g, "").trim();
            if (!l.isChinese) {
                if (!trans && hasCjk(dialog)) {
                    const idx = dialog.search(/[\u4e00-\u9fff]/);
                    if (idx > 0) { trans = dialog.slice(idx).trim(); dialog = dialog.slice(0, idx).trim(); }
                }
            } else {
                trans = "";
            }
            return dialog ? { content: dialog, innerThoughts: inner, translatedText: trans } : null;
        }).filter(Boolean).slice(0,3);
    };

    async function translateByAi(text, target){
        const apiKey = localStorage.getItem("MJI_API_KEY") || "";
        const apiModel = localStorage.getItem("MJI_API_MODEL") || "";
        if (!apiKey || !apiModel || !text) return "";
        try{
            const res = await fetch(getChatApiUrl(), {
                method:"POST",
                headers:{"Content-Type":"application/json", "Authorization":"Bearer " + apiKey},
                body: JSON.stringify({
                    model: apiModel,
                    temperature: 0.2,
                    max_tokens: 240,
                    messages:[{role:"user", content:`请把下面内容翻译成${target}，只输出译文，不要解释：\n${text}`}]
                })
            });
            const data = await res.json();
            return (data.choices?.[0]?.message?.content || "").trim();
        }catch(e){ return ""; }
    }

    async function normalizeLanguageReplies(replies, contact){
        const l = normLang(contact);
        if (l.isChinese) return replies.map(r => ({...r, translatedText:""}));
        for (const r of replies) {
            if (hasCjk(r.content)) {
                const cn = r.translatedText || r.content;
                const foreign = await translateByAi(cn, l.target);
                if (foreign) {
                    r.content = foreign;
                    r.translatedText = cn;
                }
            }
            if (!r.translatedText) {
                const cn = await translateByAi(r.content, "简体中文");
                if (cn) r.translatedText = cn;
            }
        }
        return replies;
    }

    window.renderPrivateMessageContent = function(m){
        if (!m) return "";
        const id = attr(m.id || "");
        if (m.recalled) {
            const who = m.role === "assistant" ? "TA" : "你";
            return `<button class="mji-recalled-msg" onclick="mjiShowRecalled('${id}')">（${who}撤回了一条消息）</button>`;
        }
        let html = "";
        if (m.quoteText || m.quoteImage) {
            html += `<div class="mji-quote-card"><b>${esc(m.quoteWho || "引用")}</b><span>${esc(m.quoteText || "[图片]")}</span></div>`;
        }
        if (m.imageSrc) html += `<img class="chat-media-image" src="${esc(m.imageSrc)}" alt="图片">`;
        else if (m.stickerSrc) html += `<img class="chat-sticker-image" src="${esc(m.stickerSrc)}" alt="表情包">`;
        else if (m.isVoice || m.voiceMsg) {
            const dur = m.voiceDuration || Math.max(2, Math.min(18, Math.ceil(String(m.content || "").length / 6)));
            html += `<div class="chat-voice-bubble" onclick="playMjiVoiceMessage('${attr(m.content || "")}','${attr(currentContact?.aiLang || "")}' )"><span class="voice-wave"><i></i><i></i><i></i></span><span class="voice-duration">${dur}"</span></div>`;
        } else html += esc(m.content || "");
        if (m.translatedText) html += `<div class="msg-translation">${esc(m.translatedText)}</div>`;
        return html;
    };

    async function getMessageById(id){
        return new Promise(resolve => {
            try{
                const tx = db.transaction("messages","readonly");
                const req = tx.objectStore("messages").get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            }catch(e){ resolve(null); }
        });
    }
    async function putMessage(m){
        return new Promise(resolve => {
            try{
                const tx = db.transaction("messages","readwrite");
                tx.objectStore("messages").put(m);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            }catch(e){ resolve(false); }
        });
    }
    async function deleteMessageById(id){
        return new Promise(resolve => {
            try{
                const tx = db.transaction("messages","readwrite");
                tx.objectStore("messages").delete(id);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            }catch(e){ resolve(false); }
        });
    }

    window.mjiShowRecalled = async function(id){
        const m = await getMessageById(id);
        const text = m?.recalledContent || "没有可查看的撤回内容";
        alert(text);
    };

    function renderPrivateRow(m){
        const timeText = typeof formatMsgTime === "function" ? formatMsgTime(m.createdAt) : "";
        if (m.role === "user") {
            return `<div class="chat-row user-row" data-msg-id="${attr(m.id || "")}">
                <div class="msg-wrap user-wrap"><div class="msg user-msg">${renderPrivateMessageContent(m)}</div><div class="msg-time">${timeText}</div></div>
                <div class="chat-avatar">${avatarHtml(localStorage.getItem("MJI_MY_AVATAR"), "👤")}</div>
            </div>`;
        }
        return `<div class="chat-row ai-row" data-msg-id="${attr(m.id || "")}">
            ${makeThoughtAvatarHtml(currentContact?.avatar, "🙂", `showThoughtsCardForMessage('${m.id || ""}', '${currentContact?.id || ""}', '')`)}
            <div class="msg-wrap ai-wrap"><div class="msg ai-msg">${renderPrivateMessageContent(m)}</div><div class="msg-time">${timeText}</div></div>
        </div>`;
    }

    window.loadMessages = function(contactId){
        const tx = db.transaction("messages", "readonly");
        const req = tx.objectStore("messages").getAll();
        req.onsuccess = function(){
            const box = document.getElementById("chatBox");
            if (!box) return;
            const list = req.result.filter(m => m.contactId === contactId).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
            box.innerHTML = list.map(renderPrivateRow).join("") || `<p class="empty">暂无消息</p>`;
            box.scrollTop = box.scrollHeight;
        };
    };

    window.appendPrivateUserMessage = function(m){
        const box = document.getElementById("chatBox");
        if (!box) return;
        const row = renderPrivateRow({ ...m, role:"user", id:m.id || ("msg_" + (m.createdAt||Date.now()) + "_" + Math.random().toString(16).slice(2)) });
        box.insertAdjacentHTML("beforeend", row);
        box.scrollTop = box.scrollHeight;
    };

    window.sendMessage = function(){
        const input = document.getElementById("messageInput");
        const text = input?.value?.trim() || "";
        if (!text || !currentContact) return;
        const now = Date.now();
        const id = "msg_" + now + "_" + Math.random().toString(16).slice(2);
        const q = window.__mjiQuote || null;
        const extra = { id };
        if (q) { extra.quoteWho = q.who; extra.quoteText = q.text; extra.quoteImage = q.image || ""; }
        const msg = { content:text, createdAt:now, role:"user", ...extra };
        appendPrivateUserMessage(msg);
        saveMessage(currentContact.id, "user", text, now, extra);
        window.__mjiQuote = null;
        input.placeholder = "输入消息";
        input.value = "";
    };

    window.callAI = async function(userText){
        if (!currentContact) return;
        const apiBase = localStorage.getItem("MJI_API_BASE");
        const apiKey = localStorage.getItem("MJI_API_KEY");
        const apiModel = localStorage.getItem("MJI_API_MODEL");
        if (!apiBase || !apiKey || !apiModel) { alert("请先配置API"); return; }
        const box = document.getElementById("chatBox");
        const thinkingId = "thinking_" + Date.now();
        if (box) {
            box.insertAdjacentHTML("beforeend", `<div id="${thinkingId}" class="chat-row ai-row"><div class="chat-avatar">${avatarHtml(currentContact.avatar,"🙂")}</div><div class="msg-wrap ai-wrap"><div class="msg ai-msg typing-msg">正在输入中...</div></div></div>`);
            box.scrollTop = box.scrollHeight;
        }
        try{
            const history = await getRecentMessages(currentContact.id);
            const memory = await recallRelevantMemory(currentContact.id, userText);
            const worldBookText = safeWorldBook(await getWorldBookInjection(userText));
            const messages = [{role:"system", content:`${currentContact?.prompt || "你是一个AI角色"}

【角色资料】
姓名：${currentContact.name || ""}
身份：${currentContact.identity || ""}
生日：${currentContact.birthday || ""}
年龄：${currentContact.age || ""}
性格：${currentContact.personality || ""}
简介：${currentContact.profile || ""}

【长期记忆】
${memory || "暂无长期记忆"}

【世界书】
${worldBookText || "暂无命中的世界书"}

【语言规则】
${langRuleFor(currentContact)}

【输出格式】
你可以一次回复1到3条短消息，每条之间用 <|SPLIT|> 分隔。
每条都必须严格包含：
【内心】中文心理活动，给用户点头像查看，不直接显示在聊天气泡里。
【台词】真正发给用户的消息。
${normLang(currentContact).isChinese ? "" : "【翻译】台词的中文翻译。"}

示例：
${buildFormatExample(currentContact)}

不要动作描写。不要解释格式。不要超过3条。`}];
            history.slice(-40).forEach(m => messages.push({ role:m.role === "user" ? "user" : "assistant", content:m.content || "" }));
            const res = await fetch(getChatApiUrl(), { method:"POST", headers:{"Content-Type":"application/json", "Authorization":"Bearer " + apiKey}, body: JSON.stringify({ model:apiModel, messages, temperature: Number(localStorage.getItem("MJI_TEMPERATURE") || "0.8") }) });
            const data = await res.json();
            document.getElementById(thinkingId)?.remove();
            if (!res.ok) { alert("API错误：" + (data.error?.message || res.status)); return; }
            let replies = parseAiReplyBlocks(data.choices?.[0]?.message?.content || "", currentContact);
            replies = await normalizeLanguageReplies(replies, currentContact);
            await showAiRepliesSlowly(currentContact.id, replies);
            try { maybeExtractMemory?.(); } catch(e) {}
        } catch(e){
            document.getElementById(thinkingId)?.remove();
            if (box) box.insertAdjacentHTML("beforeend", `<div class="msg ai-msg">API错误：${esc(e.message)}</div>`);
        }
    };

    window.showAiRepliesSlowly = async function(contactId, replies){
        const box = document.getElementById("chatBox");
        for (let i=0;i<replies.length;i++){
            const item = typeof replies[i] === "string" ? {content:replies[i], innerThoughts:""} : replies[i];
            const now = Date.now() + i;
            const msgId = "msg_" + now + "_" + Math.random().toString(16).slice(2);
            const isVoice = typeof shouldSendVoiceForContact === "function" ? shouldSendVoiceForContact(currentContact) : false;
            const voiceDuration = Math.max(2, Math.min(18, Math.ceil(String(item.content || "").length / 6)));
            if (currentContact && currentContact.id === contactId && currentPage === "chatDetail" && box) {
                const typingId = "typing_" + now + "_" + i;
                box.insertAdjacentHTML("beforeend", `<div id="${typingId}" class="chat-row ai-row"><div class="chat-avatar">${avatarHtml(currentContact.avatar,"🙂")}</div><div class="msg-wrap ai-wrap"><div class="msg ai-msg typing-msg">${isVoice ? "正在录音中..." : "正在输入中..."}</div></div></div>`);
                box.scrollTop = box.scrollHeight;
                await sleep(650 + Math.random()*750);
                document.getElementById(typingId)?.remove();
                const msgObj = { id:msgId, contactId, role:"assistant", content:item.content, innerThoughts:item.innerThoughts || "", translatedText:item.translatedText || "", isVoice, voiceMsg:isVoice, voiceDuration, createdAt:now };
                box.insertAdjacentHTML("beforeend", renderPrivateRow(msgObj));
                box.scrollTop = box.scrollHeight;
            }
            saveMessage(contactId, "assistant", item.content, now, { id:msgId, innerThoughts:item.innerThoughts || "", translatedText:item.translatedText || "", isVoice, voiceMsg:isVoice, voiceDuration });
            try{
                Promise.all([getRecentMessages(contactId), getContactById(contactId)]).then(([history, contact]) => {
                    const lastUser = [...history].reverse().find(m => m.role === "user");
                    afterAiMessageMemoryChecks(contactId, contact?.name || currentContact?.name || "角色", lastUser?.content || "", item.content);
                    if (typeof maybeGeneratePrivateChatImage === "function") maybeGeneratePrivateChatImage(contactId, (lastUser?.content || "") + "\n" + item.content);
                });
            }catch(e){}
            if (i < replies.length - 1) await sleep(450 + Math.random()*600);
        }
    };

    window.generateNpcMessage = async function(contact, showAlert=false){
        if (!contact) return;
        const apiKey = localStorage.getItem("MJI_API_KEY") || "";
        const apiModel = localStorage.getItem("MJI_API_MODEL") || "";
        if (!apiKey || !apiModel) { if(showAlert) alert("请先配置API"); return; }
        const memory = safeMemory(await recallRelevantMemory(contact.id, "主动消息"));
        const history = await getRecentMessages(contact.id);
        const chatText = history.slice(-20).map(m => `${m.role === "user" ? "用户" : "角色"}：${m.content}`).join("\n");
        try{
            const payload = {
                model: apiModel,
                messages: [
                    { role:"system", content:`你是AI陪伴应用里的角色，要主动给用户发一条微信式私聊消息。必须包含【内心】和【台词】${normLang(contact).isChinese ? "" : "和【翻译】"}。
${langRuleFor(contact)}
不要解释，不要旁白，不要动作描写。` },
                    { role:"user", content:`【角色资料】
姓名：${contact.name||""}
身份：${contact.identity||""}
性格：${contact.personality||""}
简介：${contact.profile||""}
角色系统Prompt：${contact.prompt||""}

【长期记忆】
${memory||"暂无"}

【最近聊天】
${chatText||"暂无"}

【格式示例】
${buildFormatExample(contact)}

请生成一条主动消息。` }
                ]
            };
            const res = await fetch(getChatApiUrl(), {
                method:"POST",
                headers:{"Content-Type":"application/json", "Authorization":"Bearer " + apiKey},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) { if(showAlert) alert("主动消息API错误：" + (data.error?.message || res.status)); return; }
            let parsed = parseAiReplyBlocks(data.choices?.[0]?.message?.content || "", contact);
            parsed = await normalizeLanguageReplies(parsed, contact);
            receiveAiMessage(contact.id, parsed.length ? parsed : []);
        }catch(e){ if(showAlert) alert("主动消息请求失败：" + e.message); }
    };

    function closeMsgMenu(){ document.getElementById("mjiMsgMenuMask")?.remove(); }
    window.closeMjiMsgMenu = closeMsgMenu;
    window.mjiShowMsgMenu = async function(id, x, y){
        closeMsgMenu();
        const m = await getMessageById(id);
        if (!m) return;
        const isAi = m.role === "assistant";
        const mask = document.createElement("div");
        mask.id = "mjiMsgMenuMask";
        mask.className = "mji-msg-menu-mask";
        mask.onclick = e => { if (e.target === mask) closeMsgMenu(); };
        const canPeek = m.recalled && m.recalledContent;
        mask.innerHTML = `<div class="mji-msg-menu" style="left:${Math.max(12, Math.min(window.innerWidth-180, x || 100))}px;top:${Math.max(80, Math.min(window.innerHeight-260, y || 160))}px">
            ${canPeek ? `<button onclick="mjiShowRecalled('${attr(id)}');closeMjiMsgMenu()">查看撤回内容</button>` : ""}
            ${!m.recalled ? `<button onclick="mjiQuoteMessage('${attr(id)}')">引用</button>` : ""}
            ${!m.recalled ? `<button onclick="mjiCopyMessage('${attr(id)}')">复制</button>` : ""}
            ${!m.recalled && !isAi ? `<button onclick="mjiRecallUserMessage('${attr(id)}')">撤回</button>` : ""}
            ${!m.recalled && isAi ? `<button onclick="mjiRecallAiMessage('${attr(id)}')">角色撤回</button>` : ""}
            <button class="danger" onclick="mjiDeleteMessage('${attr(id)}')">删除</button>
        </div>`;
        document.body.appendChild(mask);
    };
    window.mjiQuoteMessage = async function(id){
        const m = await getMessageById(id); if (!m) return;
        const who = m.role === "user" ? "你" : (currentContact?.name || "TA");
        const text = m.imageSrc ? "[图片]" : (m.stickerSrc ? "[表情包]" : (m.content || ""));
        window.__mjiQuote = { who, text: text.slice(0,80), image:m.imageSrc || m.stickerSrc || "" };
        const input = document.getElementById("messageInput");
        if (input) { input.placeholder = `引用「${who}: ${text.slice(0,24)}」`; input.focus(); }
        closeMsgMenu();
    };
    window.mjiCopyMessage = async function(id){
        const m = await getMessageById(id); if (!m) return;
        try { await navigator.clipboard.writeText(m.content || ""); alert("已复制"); } catch(e){ prompt("复制这段文字", m.content || ""); }
        closeMsgMenu();
    };
    window.mjiDeleteMessage = async function(id){
        if (!confirm("删除这条消息？")) return;
        await deleteMessageById(id);
        document.querySelector(`[data-msg-id="${CSS.escape(id)}"]`)?.remove();
        closeMsgMenu();
    };
    window.mjiRecallUserMessage = async function(id){
        const m = await getMessageById(id); if (!m) return;
        m.recalled = true; m.recalledBy = "user"; m.recalledContent = m.recalledContent || m.content || ""; m.content = "（你撤回了一条消息）";
        await putMessage(m); if (currentContact) loadMessages(currentContact.id); closeMsgMenu();
    };
    window.mjiRecallAiMessage = async function(id){
        const m = await getMessageById(id); if (!m) return;
        m.recalled = true; m.recalledBy = "ai"; m.recalledContent = m.recalledContent || m.content || ""; m.content = "（TA撤回了一条消息）";
        await putMessage(m); if (currentContact) loadMessages(currentContact.id); closeMsgMenu();
    };

    function bindLongPress(){
        if (window.__mjiLongPressBound) return; window.__mjiLongPressBound = true;
        let timer = null, sx=0, sy=0, targetRow=null;
        document.addEventListener("pointerdown", e => {
            const row = e.target.closest && e.target.closest("#chatBox .chat-row[data-msg-id]");
            if (!row || e.target.closest("button,input,textarea,a")) return;
            targetRow = row; sx = e.clientX; sy = e.clientY;
            timer = setTimeout(() => { if (targetRow) mjiShowMsgMenu(targetRow.dataset.msgId, sx, sy); }, 560);
        }, true);
        ["pointerup","pointercancel","pointermove","scroll"].forEach(ev => document.addEventListener(ev, e => {
            if (ev === "pointermove" && (Math.abs((e.clientX||sx)-sx)+Math.abs((e.clientY||sy)-sy) < 14)) return;
            clearTimeout(timer); timer=null; if(ev!=="pointermove") targetRow=null;
        }, true));
        document.addEventListener("contextmenu", e => {
            const row = e.target.closest && e.target.closest("#chatBox .chat-row[data-msg-id]");
            if (!row) return;
            e.preventDefault(); mjiShowMsgMenu(row.dataset.msgId, e.clientX, e.clientY);
        }, true);
    }
    bindLongPress();

    const css = document.createElement("style");
    css.id = "mjiBugfix0617Css";
    css.textContent = `
.chat-webview-header{grid-template-columns:48px minmax(0,1fr)96px!important;}
.chat-webview-actions{display:flex;justify-content:flex-end;gap:6px;}
.msg-translation{margin-top:6px;padding-top:6px;border-top:1px solid rgba(0,0,0,.08);font-size:12px;line-height:1.45;color:#6d7280;white-space:pre-wrap;}
.user-msg .msg-translation{border-top-color:rgba(47,53,67,.12);color:#667085;}
.mji-quote-card{margin-bottom:6px;padding:6px 8px;border-left:3px solid rgba(112,123,145,.45);border-radius:8px;background:rgba(255,255,255,.28);font-size:12px;color:#747b88;display:flex;flex-direction:column;gap:2px;max-width:210px;}
.mji-quote-card span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mji-recalled-msg{border:0;background:transparent;color:#888;font-size:13px;padding:0;text-align:left;}
.mji-msg-menu-mask{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.08);}
.mji-msg-menu{position:fixed;z-index:10051;width:168px;background:rgba(255,255,255,.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.7);border-radius:16px;box-shadow:0 14px 35px rgba(0,0,0,.18);padding:6px;overflow:hidden;}
.mji-msg-menu button{width:100%;height:40px;border:0;border-radius:12px;background:transparent;text-align:left;padding:0 12px;font-size:14px;color:#242833;}
.mji-msg-menu button:active{background:rgba(0,0,0,.06);}
.mji-msg-menu button.danger{color:#e14b4b;}
`;
    document.head.appendChild(css);
})();
