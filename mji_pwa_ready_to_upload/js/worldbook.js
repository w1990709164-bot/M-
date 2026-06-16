let worldBookAdminMode = false
let worldBookSecretClickCount = 0
let worldBookSecretLastClick = 0

function bindWorldBookSecretTitle() {
    const title = document.getElementById("appTitle")
    if (!title) return

    title.onclick = function() {
        if (currentPage !== "worldbook") return

        const now = Date.now()
        if (now - worldBookSecretLastClick < 500) {
            worldBookSecretClickCount++
        } else {
            worldBookSecretClickCount = 1
        }
        worldBookSecretLastClick = now

        if (worldBookSecretClickCount >= 7) {
            worldBookAdminMode = !worldBookAdminMode
            worldBookSecretClickCount = 0
            alert(worldBookAdminMode ? "已进入管理员绝密大厅" : "已返回普通世界书")
            loadWorldBooks()
        }
    }
}

function getWorldBookModeName(type) {
    const mode = type || "keyword"
    if (mode === "high" || mode === "global") return "最高"
    if (mode === "medium") return "中等"
    return "关键词"
}

function getWorldBookModeClass(type) {
    const mode = type || "keyword"
    if (mode === "high" || mode === "global") return "wb-badge-high"
    if (mode === "medium") return "wb-badge-medium"
    return "wb-badge-keyword"
}

function normalizeWorldBookType(wb) {
    if (!wb) return "keyword"

    if (wb.priority) return wb.priority

    if (wb.type === "global") return "high"
    if (wb.type === "medium") return "medium"
    if (wb.type === "keyword") return "keyword"

    return "keyword"
}

async function getWorldBookTargetOptions(selectedId = "global") {
    const contacts = await getAllStoreData("contacts")

    let html = `
        <option value="global" ${selectedId === "global" || !selectedId ? "selected" : ""}>
            全局（所有角色）
        </option>
    `

    contacts
        .slice()
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "zh-Hans-CN"))
        .forEach(function(c) {
            html += `
                <option value="${escapeHtml(c.id)}" ${selectedId === c.id ? "selected" : ""}>
                    ${escapeHtml(c.name || "未命名角色")}
                </option>
            `
        })

    return html
}

async function showAddWorldBook() {
    currentPage = "worldbookEditor"

    document.getElementById("appTitle").innerText =
        worldBookAdminMode ? "新增管理员世界书" : "新增世界书"

    const targetOptions = await getWorldBookTargetOptions("global")

    document.getElementById("appContent").innerHTML = `
        <div class="form wb-form">
            <input id="wbTitle" placeholder="标题，例如 141设定 / Krueger专属记忆">

            ${worldBookAdminMode ? `
                <div class="wb-admin-warning">
                    管理员世界书会作为底层设定注入，普通列表不会显示。
                </div>
            ` : ""}

            <label class="wb-label">权重</label>
            <select id="wbType" onchange="refreshWorldBookKeywordHint()">
                <option value="high">最高：每次必读，放最前</option>
                <option value="medium">中等：每次附带，放后面</option>
                <option value="keyword" selected>关键词触发：出现关键词才注入</option>
            </select>

            <label class="wb-label">适用范围</label>
            <select id="wbTargetAiId" ${worldBookAdminMode ? "disabled" : ""}>
                ${targetOptions}
            </select>

            <input id="wbKeywords" placeholder="触发关键词，多个用逗号分隔，例如 Ghost,141,Task Force">

            <textarea id="wbContent" placeholder="世界书设定内容，最多2000字"></textarea>

            <button onclick="saveWorldBook()">保存世界书</button>
        </div>
    `

    refreshWorldBookKeywordHint()
}

function refreshWorldBookKeywordHint() {
    const type = document.getElementById("wbType")?.value || "keyword"
    const input = document.getElementById("wbKeywords")
    if (!input) return

    if (type === "keyword") {
        input.placeholder = "关键词触发模式必填，多个用逗号分隔"
    } else {
        input.placeholder = "关键词可留空，用于搜索和备注"
    }
}

function saveWorldBook() {
    const title = document.getElementById("wbTitle").value.trim()
    const type = document.getElementById("wbType").value
    const keywords = document.getElementById("wbKeywords").value.trim()
    const content = document.getElementById("wbContent").value.trim().slice(0, 2000)
    const targetAiId = worldBookAdminMode ? "global" : (document.getElementById("wbTargetAiId")?.value || "global")

    if (!content) {
        alert("内容不能为空")
        return
    }

    if (type === "keyword" && !keywords) {
        alert("关键词触发模式需要填写关键词")
        return
    }

    const finalTitle = title || (keywords ? keywords.split(/[,，]/)[0].trim() : "未命名世界书")

    const tx = db.transaction("worldbooks", "readwrite")
    const store = tx.objectStore("worldbooks")

    store.put({
        id: "wb_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        title: finalTitle,
        type,
        priority: type,
        keywords,
        content,
        targetAiId,
        isAdmin: worldBookAdminMode,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
    })

    tx.oncomplete = function() {
        openApp("worldbook")
    }

    tx.onerror = function() {
        alert("世界书保存失败")
    }
}

async function loadWorldBooks() {
    bindWorldBookSecretTitle()

    const title = document.getElementById("appTitle")
    if (title) {
        title.innerText = worldBookAdminMode ? "管理员绝密大厅" : "世界书"
        title.style.color = worldBookAdminMode ? "#EF4444" : ""
    }

    const books = await getAllStoreData("worldbooks")
    const contacts = await getAllStoreData("contacts")
    const box = document.getElementById("worldBookList")
    if (!box) return

    const visibleBooks = books
        .filter(wb => Boolean(wb.isAdmin) === worldBookAdminMode)
        .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))

    const modeHint = `
        <div class="wb-mode-card ${worldBookAdminMode ? "wb-admin-mode" : ""}">
            <div>
                <div class="wb-mode-title">
                    ${worldBookAdminMode ? "管理员模式" : "普通用户世界书"}
                </div>
                <div class="wb-mode-sub">
                    ${worldBookAdminMode ? "底层绝密设定｜点标题7次退出" : "最高 / 中等 / 关键词触发｜点标题7次进入管理员模式"}
                </div>
            </div>
            <button onclick="showAddWorldBook()">＋</button>
        </div>
    `

    if (visibleBooks.length === 0) {
        box.innerHTML =
            modeHint + `<p class="empty">还没有世界书设定。</p>`
        return
    }

    let html = modeHint

    visibleBooks.forEach(function(wb) {
        const mode = normalizeWorldBookType(wb)
        const targetAiId = wb.targetAiId || wb.aiId || "global"
        const targetName = getWorldBookTargetName(targetAiId, contacts)
        const kw = wb.keywords || "无"
        const contentPreview = String(wb.content || "").slice(0, 70)

        html += `
            <div class="contact wb-card" onclick="editWorldBook('${wb.id}')">
                <div class="contact-avatar">${worldBookAdminMode ? "🔐" : "📚"}</div>

                <div class="contact-info">
                    <div class="chat-list-top">
                        <div class="contact-name">
                            ${escapeHtml(wb.title || "未命名世界书")}
                        </div>
                        <div class="chat-list-time">
                            ${wb.enabled === false ? "关闭" : "启用"}
                        </div>
                    </div>

                    <div class="wb-badge-row">
                        <span class="wb-badge ${getWorldBookModeClass(mode)}">${getWorldBookModeName(mode)}</span>
                        <span class="wb-badge wb-badge-target">${escapeHtml(targetName)}</span>
                        <span class="wb-badge wb-badge-key">关键词：${escapeHtml(kw)}</span>
                    </div>

                    <div class="contact-sub wb-preview">
                        ${escapeHtml(contentPreview)}${String(wb.content || "").length > 70 ? "…" : ""}
                    </div>
                </div>
            </div>
        `
    })

    box.innerHTML = html
}

function getWorldBookTargetName(targetAiId, contacts = []) {
    if (!targetAiId || targetAiId === "global") return "全局"

    const contact = contacts.find(c => c.id === targetAiId)
    return contact ? contact.name : targetAiId
}

async function editWorldBook(id) {
    currentPage = "worldbookEditor"

    const books = await getAllStoreData("worldbooks")
    const wb = books.find(item => item.id === id)

    if (!wb) {
        alert("世界书不存在")
        openApp("worldbook")
        return
    }

    const type = normalizeWorldBookType(wb)
    const targetAiId = wb.targetAiId || wb.aiId || "global"
    const targetOptions = await getWorldBookTargetOptions(targetAiId)

    document.getElementById("appTitle").innerText =
        wb.isAdmin ? "编辑管理员世界书" : "编辑世界书"

    document.getElementById("appContent").innerHTML = `
        <div class="form wb-form">
            <input id="wbEditId" type="hidden" value="${escapeHtml(wb.id)}">

            <input id="wbTitle" placeholder="标题" value="${escapeHtml(wb.title || "")}">

            ${wb.isAdmin ? `
                <div class="wb-admin-warning">
                    这是管理员底层设定。
                </div>
            ` : ""}

            <label class="wb-label">权重</label>
            <select id="wbType" onchange="refreshWorldBookKeywordHint()">
                <option value="high" ${type === "high" ? "selected" : ""}>最高：每次必读，放最前</option>
                <option value="medium" ${type === "medium" ? "selected" : ""}>中等：每次附带，放后面</option>
                <option value="keyword" ${type === "keyword" ? "selected" : ""}>关键词触发：出现关键词才注入</option>
            </select>

            <label class="wb-label">适用范围</label>
            <select id="wbTargetAiId" ${wb.isAdmin ? "disabled" : ""}>
                ${targetOptions}
            </select>

            <input id="wbKeywords" placeholder="关键词，用逗号分隔" value="${escapeHtml(wb.keywords || "")}">

            <textarea id="wbContent" placeholder="世界书设定内容">${escapeHtml(wb.content || "")}</textarea>

            <button onclick="updateWorldBook()">保存修改</button>
            <button onclick="toggleWorldBook('${wb.id}')">${wb.enabled === false ? "启用世界书" : "关闭世界书"}</button>
            <button onclick="deleteWorldBook('${wb.id}')">删除世界书</button>
        </div>
    `

    refreshWorldBookKeywordHint()
}

async function updateWorldBook() {
    const id = document.getElementById("wbEditId").value
    const title = document.getElementById("wbTitle").value.trim()
    const type = document.getElementById("wbType").value
    const keywords = document.getElementById("wbKeywords").value.trim()
    const content = document.getElementById("wbContent").value.trim().slice(0, 2000)
    const targetAiId = document.getElementById("wbTargetAiId")?.value || "global"

    if (!content) {
        alert("内容不能为空")
        return
    }

    if (type === "keyword" && !keywords) {
        alert("关键词触发模式需要填写关键词")
        return
    }

    const books = await getAllStoreData("worldbooks")
    const old = books.find(item => item.id === id)

    if (!old) {
        alert("世界书不存在")
        openApp("worldbook")
        return
    }

    const finalTitle = title || (keywords ? keywords.split(/[,，]/)[0].trim() : "未命名世界书")

    const tx = db.transaction("worldbooks", "readwrite")
    const store = tx.objectStore("worldbooks")

    store.put({
        ...old,
        title: finalTitle,
        type,
        priority: type,
        keywords,
        content,
        targetAiId: old.isAdmin ? "global" : targetAiId,
        aiId: old.isAdmin ? "global" : targetAiId,
        updatedAt: Date.now()
    })

    tx.oncomplete = function() {
        openApp("worldbook")
    }
}

async function toggleWorldBook(id) {
    const books = await getAllStoreData("worldbooks")
    const wb = books.find(item => item.id === id)
    if (!wb) return

    const tx = db.transaction("worldbooks", "readwrite")
    const store = tx.objectStore("worldbooks")

    store.put({
        ...wb,
        enabled: wb.enabled === false ? true : false,
        updatedAt: Date.now()
    })

    tx.oncomplete = function() {
        openApp("worldbook")
    }
}

function deleteWorldBook(id) {
    if (!confirm("确定删除这条世界书设定吗？不可恢复。")) return

    const tx = db.transaction("worldbooks", "readwrite")
    const store = tx.objectStore("worldbooks")

    store.delete(id)

    tx.oncomplete = function() {
        openApp("worldbook")
    }
}

function worldBookKeywordHit(userText, keywords) {
    const source = String(userText || "").toLowerCase()

    return String(keywords || "")
        .split(/[,，、\n]/)
        .map(k => k.trim())
        .filter(Boolean)
        .some(k => source.includes(k.toLowerCase()))
}

async function getWorldBookInjection(userText, explicitContactId = "") {
    return new Promise(function(resolve) {
        const tx = db.transaction("worldbooks", "readonly")
        const store = tx.objectStore("worldbooks")
        const req = store.getAll()

        req.onsuccess = function() {
            const contactId =
                explicitContactId ||
                currentContact?.id ||
                ""

            const enabledBooks = req.result
                .filter(wb => wb.enabled !== false)
                .filter(function(wb) {
                    const targetAiId = wb.targetAiId || wb.aiId || "global"
                    return targetAiId === "global" || targetAiId === contactId
                })

            const high = []
            const medium = []
            const keyword = []

            enabledBooks.forEach(function(wb) {
                const mode = normalizeWorldBookType(wb)
                const itemText = `【世界书-${getWorldBookModeName(mode)}｜${wb.title || "未命名"}】\n${wb.content || ""}`

                if (mode === "high") {
                    high.push(itemText)
                    return
                }

                if (mode === "medium") {
                    medium.push(itemText)
                    return
                }

                if (worldBookKeywordHit(userText, wb.keywords)) {
                    keyword.push(itemText)
                }
            })

            resolve(
                high.concat(medium).concat(keyword).join("\n\n")
            )
        }

        req.onerror = function() {
            resolve("")
        }
    })
}
