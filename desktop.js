function showAddContact() {
    document.getElementById("appTitle").innerText = "添加联系人"

    document.getElementById("appContent").innerHTML = `
        <div class="form">
            <input id="contactName" placeholder="联系人名字，例如 Krueger">
           <input type="file" id="contactAvatarFile" accept="image/*">
            <textarea id="contactPrompt" placeholder="角色设定"></textarea>

            <button onclick="saveContact()">保存联系人</button>
        </div>
    `
}
async function saveContact() {
    const name = document.getElementById("contactName").value.trim()
    const file =
    document
    .getElementById("contactAvatarFile")
    .files[0]
    const prompt = document.getElementById("contactPrompt").value.trim()

    if (!name) {
        alert("名字不能为空")
        return
    }
let avatar = ""

if(file){
    avatar = await fileToBase64(file)
}
const contact = {
    id: "contact_" + Date.now(),
    name,
    avatar,
    prompt,

    unreadCount: 0,
    npcAutoEnabled: true,

    createdAt: Date.now()
}

    const tx = db.transaction("contacts", "readwrite")
    const store = tx.objectStore("contacts")

    store.put(contact)

    tx.oncomplete = function() {
        openApp("chat", "contact")
    }

    tx.onerror = function() {
        alert("保存失败")
    }
}
function loadContacts() {
    const tx = db.transaction(["contacts", "messages"], "readonly")
    const contactStore = tx.objectStore("contacts")
    const messageStore = tx.objectStore("messages")

    const contactReq = contactStore.getAll()
    const messageReq = messageStore.getAll()

    let contacts = []
    let messages = []

    contactReq.onsuccess = function() {
        contacts = contactReq.result
    }

    messageReq.onsuccess = function() {
        messages = messageReq.result
    }

    tx.oncomplete = function() {
        let html = ""

        contacts.forEach(function(c) {
            const contactMessages = messages
                .filter(m => m.contactId === c.id)
                .sort((a, b) => b.createdAt - a.createdAt)

            const lastMsg = contactMessages[0]

            const subText = lastMsg
                ? lastMsg.content.slice(0, 18)
                : "点击进入聊天"

            html += `
                <div class="contact" onclick="openChat('${c.id}')">
                   <div class="contact-avatar">
${
avatarHtml(c.avatar, "🙂")
}
</div>
                    <div class="contact-info">
                        <div class="contact-name">${c.name}</div>
                        <div class="contact-sub">${escapeHtml(subText)}</div>
                    </div>
                </div>
            `
        })

        document.getElementById("contactList").innerHTML =
            html || `<p class="empty">还没有联系人，先添加一个。</p>`
    }
}
function showContactEditor() {
    if (!currentContact) return

    currentPage = "contactEditor"

    document.getElementById("appTitle").innerText = "编辑角色"

    document.getElementById("appContent").innerHTML = `
        <div class="form">
           <input id="editContactName" placeholder="角色名字"
value="${escapeHtml(currentContact.name)}">

<input id="editIdentity" placeholder="身份"
value="${escapeHtml(currentContact.identity || "")}">

<input id="editBirthday" placeholder="生日"
value="${escapeHtml(currentContact.birthday || "")}">

<input id="editAge" placeholder="年龄"
value="${escapeHtml(currentContact.age || "")}">

<input id="editPersonality" placeholder="性格"
value="${escapeHtml(currentContact.personality || "")}">
<select id="editNpcAutoEnabled">
    <option value="true" ${currentContact.npcAutoEnabled !== false ? "selected" : ""}>
        允许TA主动找我
    </option>

    <option value="false" ${currentContact.npcAutoEnabled === false ? "selected" : ""}>
        禁止TA主动找我
    </option>
</select>
<textarea id="editProfile"
placeholder="角色简介">${escapeHtml(currentContact.profile || "")}</textarea>

<div class="avatar-preview">
    ${avatarHtml(currentContact.avatar, "🙂")}
</div>

<label class="file-label">上传角色头像</label>
<input type="file" id="editContactAvatarFile" accept="image/*">

<input id="editContactAvatar"
placeholder="头像链接，可不填"
value="${escapeHtml(currentContact.avatar || "")}">

<label class="file-label">上传角色专属聊天背景</label>
<input type="file" id="editContactBg" accept="image/*">

<textarea id="editContactPrompt"
placeholder="系统Prompt">${escapeHtml(currentContact.prompt || "")}</textarea>

<button onclick="saveContactEdit()">保存修改</button>

<button onclick="deleteContact()">
    删除角色
</button>
        </div>
    `
}
async function saveContactEdit(){
    if (!currentContact) return

    const name = document.getElementById("editContactName").value.trim()
    const identity =
document.getElementById("editIdentity").value.trim()

const birthday =
document.getElementById("editBirthday").value.trim()

const age =
document.getElementById("editAge").value.trim()

const personality =
document.getElementById("editPersonality").value.trim()

const profile =
document.getElementById("editProfile").value.trim()
const npcAutoEnabled =
    document.getElementById("editNpcAutoEnabled").value === "true"  
let avatar =
    document
        .getElementById("editContactAvatar")
        .value
        .trim()

const avatarFile =
    document
        .getElementById("editContactAvatarFile")
        ?.files?.[0]

if (avatarFile) {
    avatar =
        await fileToBase64(avatarFile)
}
    const prompt = document.getElementById("editContactPrompt").value.trim()
const bgFile =
    document.getElementById(
        "editContactBg"
    ).files[0]
    if (!name) {
        alert("名字不能为空")
        return
    }
let chatBackground =
    currentContact.chatBackground || ""

if(bgFile){
    chatBackground =
        await fileToBase64(bgFile)
}
 const updated = {
    ...currentContact,

    name,
    avatar,
    prompt,

    identity,
    birthday,
    age,
    personality,
    profile,
    npcAutoEnabled,

    chatBackground,

    updatedAt: Date.now()
}

    const tx = db.transaction("contacts", "readwrite")
    const store = tx.objectStore("contacts")

    store.put(updated)

    tx.oncomplete = function() {
        currentContact = updated
        openChat(currentContact.id)
    }
}
function deleteContact() {

    if (!currentContact) return

    if (!confirm("确定删除这个角色吗？")) {
        return
    }

    const tx = db.transaction(
        ["contacts","messages","memories"],
        "readwrite"
    )

    tx.objectStore("contacts")
      .delete(currentContact.id)

    tx.objectStore("memories")
      .delete("memory_" + currentContact.id)

    const msgStore =
        tx.objectStore("messages")

    const req =
        msgStore.getAll()

    req.onsuccess = function() {

        req.result
            .filter(
                m =>
                m.contactId === currentContact.id
            )
            .forEach(
                m => msgStore.delete(m.id)
            )
    }

    tx.oncomplete = function() {

        currentContact = null

        alert("角色已删除")

        openApp("chat", "contact")
    }
}
