let readingCurrentBookId = null
let readingCurrentContactId = ""
let readingCurrentChunk = 0
let readingCurrentComments = []
let readingCurrentAfterthought = ""

function readingTx(storeName, mode = "readonly") {
    return db.transaction(storeName, mode).objectStore(storeName)
}

function readingPut(storeName, item) {
    return new Promise(resolve => {
        const req = readingTx(storeName, "readwrite").put(item)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
    })
}

function readingDelete(storeName, key) {
    return new Promise(resolve => {
        const req = readingTx(storeName, "readwrite").delete(key)
        req.onsuccess = () => resolve(true)
        req.onerror = () => resolve(false)
    })
}

function readingGet(storeName, key) {
    return new Promise(resolve => {
        const req = readingTx(storeName).get(key)
        req.onsuccess = () => resolve(req.result || null)
        req.onerror = () => resolve(null)
    })
}

function readingEscape(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function readingTimeText(ts) {
    if (!ts) return ""
    const d = new Date(ts)
    return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
}

async function showReadingHome() {
    currentPage = "readingHome"
    const root = document.getElementById("readingRoot")
    if (!root) return

    const books = (await getAllStoreData("books")).sort((a,b)=>(b.updatedAt || 0) - (a.updatedAt || 0))
    const contacts = (await getAllStoreData("contacts")).filter(c => c && c.id)

    root.innerHTML = `
        <style>
            .read-root{min-height:100%;background:#f5f0e8;color:#332b24;padding-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;}
            .read-head{padding:16px;background:linear-gradient(180deg,#fff8ed,#f5f0e8);border-bottom:1px solid rgba(120,90,60,.12);}
            .read-title{font-size:19px;font-weight:800;color:#5d4037;margin-bottom:6px;}
            .read-sub{font-size:12px;color:#9b8270;line-height:1.6;}
            .read-actions{display:flex;gap:10px;padding:14px 16px 4px;}
            .read-btn{border:0;border-radius:14px;padding:11px 14px;background:#8d6e63;color:#fff;font-weight:700;font-size:14px;}
            .read-btn.light{background:#fff8ed;color:#6d4c41;border:1px solid rgba(120,90,60,.18);}
            .read-file{display:none;}
            .read-contact{margin:10px 16px 8px;background:#fffaf2;border:1px solid rgba(120,90,60,.16);border-radius:14px;padding:12px;}
            .read-contact label{display:block;font-size:12px;color:#9b8270;margin-bottom:8px;}
            .read-contact select{width:100%;border:0;outline:0;background:#f1e8dc;border-radius:10px;padding:10px;color:#4b362c;font-size:14px;}
            .book-list{padding:10px 16px;display:flex;flex-direction:column;gap:12px;}
            .book-card{background:#fffaf2;border:1px solid rgba(120,90,60,.16);box-shadow:0 8px 22px rgba(80,50,20,.06);border-radius:18px;padding:15px;}
            .book-name{font-size:16px;font-weight:800;color:#3d2c23;margin-bottom:7px;line-height:1.35;}
            .book-meta{font-size:12px;color:#9b8270;line-height:1.7;}
            .book-foot{display:flex;gap:8px;margin-top:12px;}
            .book-foot button{flex:1;border:0;border-radius:12px;padding:10px 8px;font-size:13px;font-weight:700;background:#6d4c41;color:#fff;}
            .book-foot button.ghost{background:#f1e8dc;color:#6d4c41;}
            .empty-read{text-align:center;color:#9b8270;padding:52px 24px;line-height:2;font-size:14px;}
            .reader-wrap{min-height:100%;background:#f5f0e8;color:#333;display:flex;flex-direction:column;}
            .reader-top{position:sticky;top:0;z-index:2;background:rgba(245,240,232,.96);backdrop-filter:blur(12px);border-bottom:1px solid rgba(120,90,60,.12);padding:12px 14px;}
            .reader-top-title{font-size:14px;font-weight:800;color:#5d4037;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
            .reader-top-sub{font-size:11px;color:#9b8270;margin-top:3px;}
            .reader-scroll{padding:22px 22px 12px;font-size:18px;line-height:1.95;white-space:pre-wrap;word-break:break-word;}
            .comment-dot{display:inline-block;color:#ff6b9d;font-size:16px;margin-left:3px;cursor:pointer;vertical-align:middle;}
            .reader-loading{text-align:center;color:#a58a78;font-size:13px;padding:10px;display:none;}
            .after-card{display:none;margin:12px 18px 8px;background:#fff8e1;border:1px solid rgba(180,130,60,.22);border-radius:16px;padding:16px;color:#5d4037;font-size:15px;line-height:1.7;white-space:pre-wrap;}
            .reader-nav{display:flex;gap:10px;padding:12px 18px 24px;}
            .reader-nav button{flex:1;border:0;border-radius:14px;padding:12px;background:#8d6e63;color:#fff;font-weight:800;}
            .reader-nav button:disabled{background:#d2c6bd;color:#8d7b70;}
            .comment-mask{position:fixed;inset:0;background:rgba(0,0,0,.32);z-index:50;display:flex;align-items:flex-end;}
            .comment-box{width:100%;background:#fffdf8;border-radius:22px 22px 0 0;padding:20px 22px 32px;box-shadow:0 -12px 40px rgba(0,0,0,.18);}
            .comment-name{font-size:13px;color:#999;margin-bottom:10px;}
            .comment-anchor{font-size:13px;color:#777;background:#f0ede8;border-radius:10px;padding:10px 12px;margin-bottom:12px;line-height:1.6;}
            .comment-text{font-size:17px;line-height:1.7;color:#333;white-space:pre-wrap;}
            .comment-close{margin-top:18px;width:100%;border:0;border-radius:14px;background:#8d6e63;color:#fff;padding:12px;font-weight:800;}
        </style>
        <div class="read-root">
            <div class="read-head">
                <div class="read-title">一起读</div>
                <div class="read-sub">导入 TXT 小说，选择一个角色共读。角色会在段落里留下批注，读完一段还会写观后感。</div>
            </div>
            <div class="read-actions">
                <button class="read-btn" onclick="document.getElementById('readingImportFile').click()">＋ 导入TXT</button>
                <button class="read-btn light" onclick="showReadingHome()">刷新</button>
                <input class="read-file" id="readingImportFile" type="file" accept=".txt,text/plain" onchange="importReadingBook(event)">
            </div>
            <div class="read-contact">
                <label>选择共读角色</label>
                <select id="readingContactSelect">
                    ${contacts.length ? contacts.map(c => `<option value="${readingEscape(c.id)}">${readingEscape(c.name || c.realName || "未命名角色")}</option>`).join("") : `<option value="">请先添加角色</option>`}
                </select>
            </div>
            <div class="book-list">
                ${books.length ? books.map(book => renderReadingBookCard(book, contacts)).join("") : `<div class="empty-read"><div style="font-size:38px">📖</div>还没有书<br>先导入一个 TXT 文件</div>`}
            </div>
        </div>
    `
}

function renderReadingBookCard(book, contacts) {
    const contact = contacts.find(c => c.id === book.lastContactId)
    const reader = contact ? (contact.name || contact.realName || "角色") : "未选择"
    const last = Math.min((book.lastChunk || 0) + 1, book.totalChunks || 1)
    return `
        <div class="book-card">
            <div class="book-name">${readingEscape(book.title || "未命名书籍")}</div>
            <div class="book-meta">共 ${book.totalChunks || 1} 段 · 上次读到 ${last}/${book.totalChunks || 1}</div>
            <div class="book-meta">共读角色：${readingEscape(reader)} · ${readingTimeText(book.updatedAt || book.createdAt)}</div>
            <div class="book-foot">
                <button onclick="startReadingBook('${readingEscape(book.id)}')">开始共读</button>
                <button class="ghost" onclick="deleteReadingBook('${readingEscape(book.id)}')">删除</button>
            </div>
        </div>
    `
}

async function importReadingBook(event) {
    const file = event.target.files && event.target.files[0]
    event.target.value = ""
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".txt")) {
        alert("请导入 TXT 文件")
        return
    }
    const text = await file.text()
    const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim()
    if (!clean) {
        alert("这个文件是空的")
        return
    }
    const chunks = splitReadingText(clean)
    const now = Date.now()
    const book = {
        id: "book_" + now + "_" + Math.random().toString(16).slice(2),
        title: file.name.replace(/\.txt$/i, "") || "未命名书籍",
        fileName: file.name,
        content: clean,
        chunks,
        totalChunks: chunks.length,
        lastChunk: 0,
        lastContactId: document.getElementById("readingContactSelect")?.value || "",
        createdAt: now,
        updatedAt: now
    }
    await readingPut("books", book)
    showReadingHome()
}

function splitReadingText(text) {
    const lines = text.split("\n")
    const chapterIndexes = []
    const chapterReg = /^\s*(第\s*[一二三四五六七八九十百千万\d]+\s*[章节回卷部篇]|序章|楔子|番外|Chapter\s+\d+)/i
    lines.forEach((line, idx) => {
        if (chapterReg.test(line.trim())) chapterIndexes.push(idx)
    })

    if (chapterIndexes.length >= 2) {
        const chunks = []
        chapterIndexes.forEach((start, i) => {
            const end = chapterIndexes[i + 1] || lines.length
            const title = lines[start].trim().slice(0, 60) || `第${i + 1}段`
            const content = lines.slice(start + 1, end).join("\n").trim()
            if (content) chunks.push({ title, content })
        })
        if (chunks.length) return chunks
    }

    const chunks = []
    const size = 4200
    let index = 0
    for (let i = 0; i < text.length; i += size) {
        const raw = text.slice(i, i + size)
        chunks.push({ title: `第 ${++index} 段`, content: raw.trim() })
    }
    return chunks.length ? chunks : [{ title: "第 1 段", content: text }]
}

async function deleteReadingBook(bookId) {
    if (!confirm("确定删除这本书和它的批注缓存吗？")) return
    await readingDelete("books", bookId)
    const comments = await getAllStoreData("bookComments")
    for (const c of comments.filter(x => x.bookId === bookId)) {
        await readingDelete("bookComments", c.id)
    }
    showReadingHome()
}

async function startReadingBook(bookId) {
    const book = await readingGet("books", bookId)
    if (!book) return
    const selected = document.getElementById("readingContactSelect")?.value || book.lastContactId || ""
    if (!selected) {
        alert("请先选择一个角色")
        return
    }
    readingCurrentBookId = bookId
    readingCurrentContactId = selected
    readingCurrentChunk = Number(book.lastChunk || 0)
    await readingPut("books", { ...book, lastContactId: selected, updatedAt: Date.now() })
    renderReadingReader()
}

async function renderReadingReader() {
    currentPage = "readingReader"
    const root = document.getElementById("readingRoot")
    const book = await readingGet("books", readingCurrentBookId)
    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === readingCurrentContactId) || {}
    if (!root || !book) return
    const chunk = (book.chunks || [])[readingCurrentChunk] || { title: "空章节", content: "" }
    root.innerHTML = `
        <div class="reader-wrap">
            <div class="reader-top">
                <div class="reader-top-title">${readingEscape(book.title)} · ${readingEscape(chunk.title)}</div>
                <div class="reader-top-sub">${readingEscape(contact.name || contact.realName || "角色")} 正在共读 · ${readingCurrentChunk + 1}/${book.totalChunks || 1}</div>
            </div>
            <div class="reader-scroll" id="readingContent"></div>
            <div class="reader-loading" id="readingLoading">角色正在阅读中…</div>
            <div class="after-card" id="readingAfter"></div>
            <div class="reader-nav">
                <button ${readingCurrentChunk <= 0 ? "disabled" : ""} onclick="readingPrevChunk()">上一章</button>
                <button ${readingCurrentChunk >= (book.totalChunks || 1) - 1 ? "disabled" : ""} onclick="readingNextChunk()">下一章</button>
            </div>
        </div>
    `
    await loadReadingChunkResult(book, chunk, contact)
}

async function loadReadingChunkResult(book, chunk, contact) {
    const loading = document.getElementById("readingLoading")
    const cached = (await getAllStoreData("bookComments")).filter(c =>
        c.bookId === book.id &&
        c.contactId === readingCurrentContactId &&
        Number(c.chunkIndex) === Number(readingCurrentChunk)
    )
    if (cached.length) {
        readingCurrentAfterthought = cached.find(c => c.anchorText === "##AFTERTHOUGHT##")?.comment || ""
        readingCurrentComments = cached.filter(c => c.anchorText !== "##AFTERTHOUGHT##").map(c => [c.anchorText, c.comment])
        renderReadingText(chunk.content, readingCurrentComments, readingCurrentAfterthought, contact)
        return
    }

    if (loading) loading.style.display = "block"
    const result = await generateReadingChunkResult(book, chunk, contact)
    if (loading) loading.style.display = "none"

    readingCurrentComments = result.comments || []
    readingCurrentAfterthought = result.afterthought || ""

    const now = Date.now()
    for (const [anchor, comment] of readingCurrentComments) {
        await readingPut("bookComments", {
            id: "bc_" + now + "_" + Math.random().toString(16).slice(2),
            bookId: book.id,
            contactId: readingCurrentContactId,
            chunkIndex: readingCurrentChunk,
            anchorText: anchor,
            comment,
            createdAt: Date.now()
        })
    }
    if (readingCurrentAfterthought) {
        await readingPut("bookComments", {
            id: "bc_after_" + now + "_" + Math.random().toString(16).slice(2),
            bookId: book.id,
            contactId: readingCurrentContactId,
            chunkIndex: readingCurrentChunk,
            anchorText: "##AFTERTHOUGHT##",
            comment: readingCurrentAfterthought,
            createdAt: Date.now()
        })
        await saveReadingMemory(book, chunk, contact, readingCurrentAfterthought)
    }
    await readingPut("books", { ...book, lastChunk: readingCurrentChunk, lastContactId: readingCurrentContactId, updatedAt: Date.now() })
    renderReadingText(chunk.content, readingCurrentComments, readingCurrentAfterthought, contact)
}

function renderReadingText(text, comments, afterthought, contact) {
    const contentEl = document.getElementById("readingContent")
    const afterEl = document.getElementById("readingAfter")
    if (!contentEl) return

    const valid = (comments || [])
        .map(([anchor, comment], idx) => ({ anchor, comment, idx, pos: text.indexOf(anchor) }))
        .filter(item => item.anchor && item.pos >= 0)
        .sort((a,b) => b.pos - a.pos)

    let html = readingEscape(text)
    valid.forEach(item => {
        const safeAnchor = readingEscape(item.anchor)
        const mark = `${safeAnchor}<span class="comment-dot" onclick="showReadingComment(${item.idx})">💬</span>`
        html = html.replace(safeAnchor, mark)
    })
    contentEl.innerHTML = html

    if (afterthought) {
        afterEl.style.display = "block"
        afterEl.textContent = `📖 ${(contact.name || contact.realName || "角色")} 读完这段说：\n\n${afterthought}`
    } else {
        afterEl.style.display = "none"
    }
}

function showReadingComment(idx) {
    const item = readingCurrentComments[idx]
    if (!item) return
    const [anchor, comment] = item
    const mask = document.createElement("div")
    mask.className = "comment-mask"
    mask.onclick = e => {
        if (e.target === mask) mask.remove()
    }
    mask.innerHTML = `
        <div class="comment-box">
            <div class="comment-name">💬 角色读到这里说：</div>
            <div class="comment-anchor">「${readingEscape(anchor.slice(0, 60))}${anchor.length > 60 ? "…" : ""}」</div>
            <div class="comment-text">${readingEscape(comment)}</div>
            <button class="comment-close" onclick="this.closest('.comment-mask').remove()">关闭</button>
        </div>
    `
    document.body.appendChild(mask)
}

async function generateReadingChunkResult(book, chunk, contact) {
    try {
        const apiBase = localStorage.getItem("MJI_API_BASE") || ""
        const apiKey = localStorage.getItem("MJI_API_KEY") || ""
        const model = localStorage.getItem("MJI_API_MODEL") || ""
        if (!apiBase || !apiKey || !model) return { comments: [], afterthought: "" }
        let url = apiBase.replace(/\/$/, "")
        if (!url.endsWith("/chat/completions")) url += url.includes("/v1") ? "/chat/completions" : "/v1/chat/completions"

        const persona = contact.prompt || contact.personality || contact.profile || contact.identity || contact.identityInfo || ""
        const prompt = `你正在和用户一起阅读小说《${book.title}》。\n以下是当前阅读段落，请完成两件事：\n\n【任务一】选3到5处有感触的句子发表批注\n【任务二】用1到3句话说说读完这段的整体感受（观后感）\n\n【你的角色设定】\n${persona}\n\n【输出格式】只返回以下JSON，不要有任何其他文字：\n{\n  "comments": [\n    {"anchor": "原文中存在的连续文字约15字", "comment": "批注内容"}\n  ],\n  "afterthought": "读完这段的整体感受，口语化，像发微信一样自然"\n}\n\n【要求】\n- anchor必须是原文中真实存在的文字，不能自己编\n- 批注和观后感都要符合角色性格，口语化自然\n\n【小说内容】\n${chunk.content.slice(0, 6000)}`

        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model,
                temperature: 0.7,
                messages: [{ role: "user", content: prompt }]
            })
        })
        if (!resp.ok) return { comments: [], afterthought: "" }
        const data = await resp.json()
        const raw = data.choices?.[0]?.message?.content?.trim() || ""
        const jsonText = (raw.replace(/```json|```/g, "").match(/\{[\s\S]*\}/) || [""])[0]
        if (!jsonText) return { comments: [], afterthought: "" }
        const json = JSON.parse(jsonText)
        const comments = []
        ;(json.comments || []).forEach(obj => {
            const anchor = String(obj.anchor || "").trim()
            const comment = String(obj.comment || "").trim()
            if (anchor && comment && chunk.content.includes(anchor)) comments.push([anchor, comment])
        })
        return { comments, afterthought: String(json.afterthought || "").trim() }
    } catch (e) {
        console.warn("generateReadingChunkResult failed", e)
        return { comments: [], afterthought: "" }
    }
}

async function saveReadingMemory(book, chunk, contact, afterthought) {
    const key = `${book.id}-${readingCurrentContactId}-${readingCurrentChunk}`
    const memories = await getAllStoreData("memories")
    if (memories.some(m => String(m.memoryText || m.content || "").includes(key))) return
    const text = `和用户一起读《${book.title}》${key} ${chunk.title}，读后感：${afterthought.slice(0, 80)}`
    await readingPut("memories", {
        id: "mem_read_" + Date.now() + "_" + Math.random().toString(16).slice(2),
        contactId: readingCurrentContactId,
        aiId: readingCurrentContactId,
        memoryText: text,
        content: text,
        category: "shared_event",
        source: "reading",
        insertTime: Date.now(),
        updatedAt: Date.now(),
        embedding: ""
    })
}

async function readingPrevChunk() {
    if (readingCurrentChunk <= 0) return
    readingCurrentChunk--
    await renderReadingReader()
}

async function readingNextChunk() {
    const book = await readingGet("books", readingCurrentBookId)
    if (!book) return
    if (readingCurrentChunk >= (book.totalChunks || 1) - 1) return
    readingCurrentChunk++
    await readingPut("books", { ...book, lastChunk: readingCurrentChunk, lastContactId: readingCurrentContactId, updatedAt: Date.now() })
    await renderReadingReader()
}
