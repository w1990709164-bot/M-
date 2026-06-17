// 梦男之家模块
// 板块：同人文 / 同人图 / 交流 / 深渊；AI创作、同人图提示卡、评论反应、我的档案、往期创作

const DREAM_BOARDS = [
    { id: "fanfic", name: "同人文", label: "同人文" },
    { id: "art", name: "同人图", label: "同人图" },
    { id: "talk", name: "交流", label: "交流" },
    { id: "abyss", name: "深渊", label: "🔞 深渊" }
]

let currentDreamBoard = "fanfic"
let dreamR18Unlocked = false
let dreamGenerating = false

function dreamId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2)
}

function dreamBoardName(boardId) {
    const b = DREAM_BOARDS.find(x => x.id === boardId)
    return b ? b.name : boardId
}

function dreamTime(ts) {
    const d = new Date(ts || Date.now())
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${mm}-${dd} ${h}:${m}`
}

function dreamProfile() {
    try {
        return JSON.parse(localStorage.getItem("MJI_DREAM_PROFILE") || "{}") || {}
    } catch (e) {
        return {}
    }
}

function saveDreamProfile(profile) {
    localStorage.setItem("MJI_DREAM_PROFILE", JSON.stringify(profile || {}))
}

function dreamAppearance() {
    return (dreamProfile().appearance || "").trim()
}

function dreamUserNickname() {
    return (dreamProfile().nickname || localStorage.getItem("MJI_MY_NAME") || "主角").trim()
}

function dreamAlias() {
    const prefixes = ["星尘", "月影", "深海", "暗夜", "迷雾", "晨曦", "流光", "暮色", "烟雨", "霜降", "白塔", "灰脊", "纸月"]
    const suffixes = ["的梦", "过客", "漫游者", "观察员", "低语者", "守望者", "追光者", "迷途者", "记录员", "寄信人"]
    return prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)]
}

function dreamStorePut(storeName, value) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction(storeName, "readwrite")
            tx.objectStore(storeName).put(value)
            tx.oncomplete = () => resolve(value)
            tx.onerror = () => resolve(value)
        } catch (e) {
            console.error(e)
            resolve(value)
        }
    })
}

function dreamStoreDelete(storeName, id) {
    return new Promise(resolve => {
        try {
            const tx = db.transaction(storeName, "readwrite")
            tx.objectStore(storeName).delete(id)
            tx.oncomplete = () => resolve(true)
            tx.onerror = () => resolve(false)
        } catch (e) {
            resolve(false)
        }
    })
}

async function dreamAll(storeName) {
    try {
        return await getAllStoreData(storeName)
    } catch (e) {
        return []
    }
}

async function dreamContacts() {
    const contacts = await getAllStoreData("contacts")
    return (contacts || []).filter(c => c && c.id).map(c => ({
        id: c.id,
        name: c.name || c.realName || "未知",
        avatar: c.avatar || c.avatarUri || "",
        persona: [c.prompt, c.identity, c.personality, c.profile].filter(Boolean).join("\n").trim()
    }))
}

async function ensureDreamAliases() {
    const contacts = await dreamContacts()
    const aliases = await dreamAll("dreamHouseAliases")
    const known = new Set((aliases || []).map(a => a.contactId))

    for (const c of contacts) {
        if (!known.has(c.id)) {
            await dreamStorePut("dreamHouseAliases", {
                id: "dream_alias_" + c.id,
                contactId: c.id,
                alias: dreamAlias(),
                createdAt: Date.now()
            })
        }
    }
}

async function getDreamAlias(contactId) {
    await ensureDreamAliases()
    const aliases = await dreamAll("dreamHouseAliases")
    const found = aliases.find(a => a.contactId === contactId)
    return found?.alias || dreamAlias()
}

function ensureDreamHouseStyle() {
    if (document.getElementById("dreamhouse-style")) return

    const style = document.createElement("style")
    style.id = "dreamhouse-style"
    style.textContent = `
        .dream-page{height:100%;background:#0d0d1a;color:#e8e8ff;display:flex;flex-direction:column;overflow:hidden;position:relative}
        .dream-top{height:54px;background:#12122a;display:flex;align-items:center;gap:10px;padding:0 14px;flex-shrink:0;border-bottom:1px solid rgba(192,132,252,.16)}
        .dream-back{border:none;background:transparent;color:#c084fc;font-size:25px;padding:8px;cursor:pointer}.dream-title{flex:1;text-align:center;font-size:18px;font-weight:800;letter-spacing:1px;color:#fff}.dream-profile-btn{border:none;background:transparent;color:#c084fc;font-size:13px;cursor:pointer;padding:8px;white-space:nowrap}
        .dream-tabs{display:flex;gap:8px;overflow-x:auto;background:#12122a;padding:8px 10px;flex-shrink:0}.dream-tabs::-webkit-scrollbar{display:none}.dream-tab{flex:1;min-width:70px;border:none;border-radius:999px;background:transparent;color:#666688;padding:8px 10px;font-size:13px;cursor:pointer}.dream-tab.active{background:#1e1e3f;color:#c084fc;font-weight:800}.dream-tab.abyss{color:#f472b6}.dream-actions{display:flex;gap:10px;padding:10px 14px;background:#0d0d1a;flex-shrink:0}.dream-act{border:none;border-radius:999px;color:#fff;font-weight:700;padding:10px 14px;cursor:pointer}.dream-act.purple{background:#6d28d9}.dream-act.pink{background:#be185d}.dream-act:disabled{opacity:.5}.dream-list{flex:1;overflow-y:auto;padding:10px 12px 80px}.dream-card{background:#12122a;border:1px solid rgba(192,132,252,.12);border-radius:16px;padding:14px;margin-bottom:12px;box-shadow:0 8px 22px rgba(0,0,0,.18);cursor:pointer;position:relative}.dream-card:active{transform:scale(.995)}.dream-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.dream-alias{color:#c084fc;font-size:13px;font-weight:700}.dream-board{color:#8888aa;font-size:11px;border:1px solid rgba(136,136,170,.25);border-radius:999px;padding:2px 8px}.dream-content{font-size:14px;line-height:1.75;color:#e2e2f0;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}.dream-meta{display:flex;gap:12px;align-items:center;color:#777799;font-size:11px;margin-top:11px}.dream-like{color:#f472b6;cursor:pointer}.dream-empty{padding:70px 24px;text-align:center;color:#777799;font-size:14px;line-height:2}.dream-thumb{height:160px;border-radius:14px;background:linear-gradient(135deg,#2d1b69,#831843,#111827);margin-bottom:10px;display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;color:rgba(255,255,255,.78);font-size:13px;line-height:1.7;white-space:pre-wrap;overflow:hidden}.dream-real-img{width:100%;max-height:360px;object-fit:cover;border-radius:14px;margin:0 0 12px;background:#111827}.dream-img-note{font-size:11px;color:#777799;line-height:1.5;margin-bottom:8px;word-break:break-word}.dream-loading{padding:12px;text-align:center;color:#c084fc;font-size:13px}.dream-detail{height:100%;background:#0d0d1a;color:#e8e8ff;display:flex;flex-direction:column;overflow:hidden}.dream-detail-scroll{flex:1;overflow-y:auto;padding:14px 16px 60px}.dream-detail-card{background:#12122a;border-radius:16px;border:1px solid rgba(192,132,252,.14);padding:16px}.dream-detail-content{font-size:15px;line-height:1.9;white-space:pre-wrap;color:#f0f0ff}.dream-comment-title{text-align:center;color:#555577;font-size:12px;margin:18px 0 10px}.dream-reaction{font-size:13px;line-height:1.65;margin:8px 0;padding:9px 10px;background:rgba(255,255,255,.035);border-radius:10px}.dream-reaction.support{color:#a3a3c2}.dream-reaction.argue{color:#f87171}.dream-reaction.rival{color:#f472b6}.dream-reaction.resonate{color:#60a5fa}.dream-link{color:#818cf8;font-size:13px;margin-top:16px;cursor:pointer}.dream-form{height:100%;overflow-y:auto;background:#0d0d1a;padding:16px}.dream-form label{display:block;color:#c084fc;font-size:13px;font-weight:700;margin:12px 0 8px}.dream-form input,.dream-form textarea{width:100%;border:1px solid rgba(192,132,252,.2);border-radius:12px;background:#12122a;color:#fff;padding:12px 13px;font-size:14px;outline:none;line-height:1.65}.dream-form textarea{min-height:170px;resize:none}.dream-save{width:100%;margin-top:16px;border:none;border-radius:14px;background:#6d28d9;color:#fff;font-weight:800;padding:13px;font-size:15px}.dream-note{font-size:12px;color:#777799;line-height:1.7;margin-top:8px}.dream-history-item{padding:12px;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;line-height:1.6;color:#e2e2f0;cursor:pointer}.dream-del{position:absolute;inset:0;border-radius:16px;background:rgba(190,24,93,.14);display:flex;align-items:center;justify-content:center}.dream-del button{border:none;border-radius:10px;background:#be185d;color:#fff;padding:9px 22px;font-weight:800}.dream-r18{padding:26px 18px;text-align:center}.dream-r18-title{font-size:20px;color:#f472b6;font-weight:900;margin-bottom:10px}.dream-r18 p{font-size:13px;color:#a3a3c2;line-height:1.8}.dream-r18 button{margin-top:16px;border:none;border-radius:14px;background:#be185d;color:#fff;padding:12px 18px;font-weight:800}
    `
    document.head.appendChild(style)
}

async function showDreamHouseHome(boardId) {
    ensureDreamHouseStyle()
    await ensureDreamAliases()
    currentPage = "dreamHouseHome"
    currentDreamBoard = boardId || currentDreamBoard || "fanfic"

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "梦男之家"

    const root = document.getElementById("dreamHouseRoot") || document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="dream-page">
            <div class="dream-top">
                <button class="dream-back" onclick="goHome()">‹</button>
                <div class="dream-title">✦ 梦男之家 ✦</div>
                <button class="dream-profile-btn" onclick="showDreamProfile()">我的档案</button>
            </div>
            <div class="dream-tabs">
                ${DREAM_BOARDS.map(b => `
                    <button class="dream-tab ${b.id === currentDreamBoard ? "active" : ""} ${b.id === "abyss" ? "abyss" : ""}"
                            onclick="switchDreamBoard('${b.id}')">${b.label}</button>
                `).join("")}
            </div>
            <div class="dream-actions">
                <button class="dream-act purple" onclick="triggerDreamCreation()" ${dreamGenerating ? "disabled" : ""}>✦ 召唤创作</button>
                <button class="dream-act pink" onclick="triggerDreamArtGeneration()" ${dreamGenerating ? "disabled" : ""}>🎨 生同人图</button>
            </div>
            <div id="dreamList" class="dream-list"><div class="dream-loading">读取中…</div></div>
        </div>
    `

    if (currentDreamBoard === "abyss" && !dreamR18Unlocked) {
        document.getElementById("dreamList").innerHTML = `
            <div class="dream-r18">
                <div class="dream-r18-title">🔞 深渊入口</div>
                <p>此板块适合成人向、阴暗面、强烈情绪与更私密的幻想内容。请确认你已满18岁且自愿进入。</p>
                <button onclick="unlockDreamAbyss()">我已满18岁，进入</button>
            </div>
        `
        return
    }

    loadDreamPosts()
}

function switchDreamBoard(boardId) {
    if (boardId === "abyss" && !dreamR18Unlocked) {
        currentDreamBoard = "abyss"
        showDreamHouseHome("abyss")
        return
    }
    showDreamHouseHome(boardId)
}

function unlockDreamAbyss() {
    dreamR18Unlocked = true
    showDreamHouseHome("abyss")
}

async function loadDreamPosts() {
    const list = document.getElementById("dreamList")
    if (!list) return
    const all = await dreamAll("dreamHousePosts")
    const posts = (all || [])
        .filter(p => p.boardId === currentDreamBoard)
        .filter(p => currentDreamBoard === "abyss" ? Number(p.grade || 0) >= 1 : Number(p.grade || 0) === 0)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (!posts.length) {
        list.innerHTML = `<div class="dream-empty">这里还没有创作。<br>点「召唤创作」，让匿名崇拜者发第一篇。</div>`
        return
    }

    list.innerHTML = posts.map(p => `
        <div class="dream-card" data-id="${p.id}" onclick="showDreamPostDetail('${p.id}')">
            <div class="dream-card-head">
                <div class="dream-alias">✦ ${escapeHtml(p.authorAlias || "神秘人")}</div>
                <div class="dream-board">${escapeHtml(dreamBoardName(p.boardId))}</div>
            </div>
            ${(p.imageData || p.imageUrl) ? imageTagFromPost(p) : (p.imagePrompt ? `<div class="dream-thumb">🎨 ${escapeHtml((p.imagePrompt || "").slice(0, 180))}</div>` : "")}
            <div class="dream-content">${escapeHtml(p.content || "")}</div>
            <div class="dream-meta">
                <span>${dreamTime(p.createdAt)}</span>
                <span class="dream-like" onclick="event.stopPropagation(); likeDreamPost('${p.id}')">♡ ${Number(p.likeCount || 0)}</span>
                <span>收藏 ${Number(p.collectCount || 0)}</span>
            </div>
        </div>
    `).join("")

    bindDreamLongPress(list)
}

function bindDreamLongPress(container) {
    container.querySelectorAll(".dream-card").forEach(card => {
        let timer = null
        const start = () => {
            timer = setTimeout(() => {
                if (card.querySelector(".dream-del")) return
                const ov = document.createElement("div")
                ov.className = "dream-del"
                ov.innerHTML = `<button>删除帖子</button>`
                ov.querySelector("button").onclick = async e => {
                    e.stopPropagation()
                    await deleteDreamPost(card.dataset.id)
                }
                card.appendChild(ov)
            }, 650)
        }
        const end = () => clearTimeout(timer)
        card.addEventListener("touchstart", start, { passive: true })
        card.addEventListener("touchend", end)
        card.addEventListener("touchcancel", end)
        card.addEventListener("mousedown", start)
        card.addEventListener("mouseup", end)
    })
}

async function deleteDreamPost(postId) {
    await dreamStoreDelete("dreamHousePosts", postId)
    const reactions = await dreamAll("dreamHouseReactions")
    for (const r of reactions.filter(x => x.postId === postId)) {
        await dreamStoreDelete("dreamHouseReactions", r.id)
    }
    loadDreamPosts()
}

async function likeDreamPost(postId) {
    const all = await dreamAll("dreamHousePosts")
    const p = all.find(x => x.id === postId)
    if (!p) return
    p.likeCount = Number(p.likeCount || 0) + 1
    await dreamStorePut("dreamHousePosts", p)
    loadDreamPosts()
}

function dreamRequireProfile(forArt = false) {
    const appearance = dreamAppearance()
    if (!appearance && (forArt || currentDreamBoard !== "fanfic")) {
        alert("请先在「我的档案」填写外形描述，角色才知道怎么创作你。")
        showDreamProfile()
        return false
    }
    return true
}

async function pickDreamAuthor() {
    const contacts = await dreamContacts()
    const useNpc = Math.random() > 0.5 || !contacts.length
    if (useNpc) {
        return {
            authorId: "npc_" + Date.now(),
            authorAlias: dreamAlias(),
            persona: "一个对主角有好感的匿名崇拜者，性格随机，写作口吻有生活气。"
        }
    }
    const c = contacts[Math.floor(Math.random() * contacts.length)]
    return {
        authorId: c.id,
        authorAlias: await getDreamAlias(c.id),
        persona: c.persona || `一个名叫${c.name}的人，正在匿名创作。`
    }
}

function buildDreamPrompt(boardId, persona, appearance) {
    const nick = dreamUserNickname()
    const desc = appearance ? `主角「${nick}」的外形描述：${appearance}` : `主角「${nick}」是这个空间里被凝视、被书写、被偏爱的中心。`
    const style = `
【文风规范】
以名词和动词为骨架，少用形容词和副词。情绪藏在动作、器物、气味和场景里，不直接喊口号。对话简短，有停顿和潜台词。结尾意犹未尽，不总结，不点题。
禁止使用：极其、无比、心跳骤停、命运齿轮、刻进DNA、难以言喻、邪魅一笑、眸色一暗、四肢百骸。
`

    if (boardId === "fanfic") {
        return `你是一个匿名同人文作者，人设：${persona}\n${desc}\n请以第一人称创作一篇关于你和主角的短篇同人文，300-500字。你是爱慕者，主角是被爱的对象，焦点永远在主角身上。禁止把自己写成主角，禁止夸自己，禁止出现具体身高体重数字。直接输出正文，不要标题。\n${style}`
    }

    if (boardId === "talk") {
        return `你是一个匿名崇拜者，人设：${persona}\n${desc}\n请发一条关于主角的讨论帖，100-200字。内容可以是脑补主角日常、讨论主角特征、分享对主角的感受、轻微争宠，但焦点永远是主角。直接输出帖子内容。`
    }

    if (boardId === "abyss") {
        return `你是一个匿名崇拜者，人设：${persona}\n${desc}\n这里是成人向幻想板块，但请以心理暗面、占有欲、克制的亲密氛围和强烈情绪为主，避免露骨器官描写和低俗词汇。请写一篇400-600字的深色同人文：欲望可以存在，但必须建立在自愿、平等和互相回应上。主角永远是被凝视、被渴望、被珍重的中心。直接输出正文，不要标题。\n${style}`
    }

    return `你是一个匿名创作者，人设：${persona}\n${desc}\n请写一条以主角为中心的创作帖，100-200字。直接输出正文。`
}

async function triggerDreamCreation() {
    if (dreamGenerating) return
    if (!dreamRequireProfile(false)) return

    dreamGenerating = true
    showDreamHouseHome(currentDreamBoard)

    const list = document.getElementById("dreamList")
    if (list) list.innerHTML = `<div class="dream-loading">✦ 匿名崇拜者正在创作中…</div>`

    try {
        const author = await pickDreamAuthor()
        const prompt = buildDreamPrompt(currentDreamBoard, author.persona, dreamAppearance())
        const content = await dreamHouseCallAI(prompt, 900, 0.92)
        const post = {
            id: dreamId("dream_post"),
            authorId: author.authorId,
            authorAlias: author.authorAlias,
            boardId: currentDreamBoard,
            content: (content || "").trim() || "他把纸页折起来，夹进一本旧书里。没有署名。",
            imagePrompt: "",
            grade: currentDreamBoard === "abyss" ? 1 : 0,
            likeCount: 0,
            collectCount: 0,
            createdAt: Date.now()
        }
        await dreamStorePut("dreamHousePosts", post)
        generateDreamReactions(post)
        alert(`✦ ${post.authorAlias} 发布了新内容！`)
    } catch (e) {
        alert("创作失败：" + e.message)
    } finally {
        dreamGenerating = false
        showDreamHouseHome(currentDreamBoard)
    }
}

async function triggerDreamArtGeneration() {
    if (dreamGenerating) return
    if (!dreamRequireProfile(true)) return

    dreamGenerating = true
    showDreamHouseHome(currentDreamBoard)
    const list = document.getElementById("dreamList")
    if (list) list.innerHTML = `<div class="dream-loading">🎨 匿名画手正在构图中…</div>`

    try {
        const author = await pickDreamAuthor()
        const appearance = dreamAppearance()
        const isAbyss = currentDreamBoard === "abyss"
        const promptText = isAbyss
            ? `你是${author.persona}。你要画一幅成人向但不露骨的同人图，主角外形：${appearance}。请用英文生成60词以内的图片prompt，强调氛围、服装、光线、镜头、情绪张力，避免露骨器官描写。只输出英文prompt。`
            : `你是${author.persona}。你很喜欢主角，主角外形：${appearance}。请用英文生成60词以内的Stable Diffusion图片prompt，包含场景、服装、光线、风格。只输出英文prompt。`
        const imgPrompt = (await dreamHouseCallAI(promptText, 180, 0.9)).trim()
        let imageData = ""
        let imageUrl = ""
        try {
            if (typeof generateImageByConfig === "function") {
                const img = await generateImageByConfig(imgPrompt)
                imageData = img?.imageData || ""
                imageUrl = img?.imageUrl || ""
            }
        } catch (imgErr) {
            console.warn("梦男之家生图失败，保留提示卡", imgErr)
        }
        const captionPrompt = `你是${author.persona}，刚为主角画了一幅图。主角外形：${appearance}\n画面描述：${imgPrompt}\n请用50字以内写一段发帖配文，含蓄、有情绪，直接输出。`
        const caption = (await dreamHouseCallAI(captionPrompt, 180, 0.8)).trim()
        const post = {
            id: dreamId("dream_art"),
            authorId: author.authorId,
            authorAlias: author.authorAlias,
            boardId: isAbyss ? "abyss" : "art",
            content: caption || "画完以后，他盯着屏幕看了很久。",
            imagePrompt: imgPrompt || "portrait illustration, soft light, cinematic mood",
            imageData,
            imageUrl,
            grade: isAbyss ? 1 : 0,
            likeCount: 0,
            collectCount: 0,
            createdAt: Date.now()
        }
        await dreamStorePut("dreamHousePosts", post)
        generateDreamReactions(post)
        alert(`🎨 ${post.authorAlias} 画了一幅同人图！`)
    } catch (e) {
        alert("生同人图失败：" + e.message)
    } finally {
        dreamGenerating = false
        showDreamHouseHome(currentDreamBoard === "abyss" ? "abyss" : "art")
    }
}

async function generateDreamReactions(post) {
    try {
        post.likeCount = Math.floor(Math.random() * 305) + 8
        post.collectCount = Math.floor(Math.random() * 88) + 2
        await dreamStorePut("dreamHousePosts", post)

        const prompt = `请为以下以【主角】为中心的同人创作生成4条评论，评论者是同样迷恋主角的匿名网友。评论类型混合：支持、杠精、争宠、共鸣。焦点永远是主角，不要夸创作者本人。\n创作内容：${(post.content || "").slice(0, 220)}\n严格每条一行：评论者马甲||评论类型||评论内容`
        let raw = ""
        try {
            raw = await dreamHouseCallAI(prompt, 500, 0.95)
        } catch (e) {
            raw = `星河漫游者||支持||这段写出了主角身上那种安静的吸引力。\n雨夜低语者||共鸣||看到这里突然理解为什么大家都会惦记ta。\n别抢我月亮||争宠||你们都在写ta，可我总觉得我才最懂那一瞬间。\n路过不服||杠精||这段可以，但主角不会这么轻易把情绪交出来。`
        }
        const lines = raw.split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 6)
        for (const line of lines) {
            const parts = line.split("||")
            if (parts.length >= 3) {
                await dreamStorePut("dreamHouseReactions", {
                    id: dreamId("dream_react"),
                    postId: post.id,
                    authorId: "npc_" + Math.random().toString(16).slice(2),
                    authorAlias: parts[0].trim() || dreamAlias(),
                    reactionType: parts[1].trim() || "支持",
                    content: parts.slice(2).join("||").trim(),
                    createdAt: Date.now()
                })
            }
        }
        loadDreamPosts()
    } catch (e) {
        console.warn(e)
    }
}

async function showDreamPostDetail(postId) {
    ensureDreamHouseStyle()
    currentPage = "dreamHouseDetail"
    const all = await dreamAll("dreamHousePosts")
    const post = all.find(p => p.id === postId)
    if (!post) return
    const reactions = (await dreamAll("dreamHouseReactions"))
        .filter(r => r.postId === post.id)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "创作详情"
    const root = document.getElementById("appContent")
    root.innerHTML = `
        <div class="dream-detail">
            <div class="dream-top">
                <button class="dream-back" onclick="showDreamHouseHome('${currentDreamBoard}')">‹</button>
                <div class="dream-title">创作详情</div>
                <button class="dream-profile-btn" onclick="deleteDreamPost('${post.id}')">删除</button>
            </div>
            <div class="dream-detail-scroll">
                <div class="dream-detail-card">
                    <div class="dream-card-head">
                        <div class="dream-alias">✦ ${escapeHtml(post.authorAlias || "神秘人")}</div>
                        <div class="dream-board">${escapeHtml(dreamBoardName(post.boardId))}</div>
                    </div>
                    ${post.imagePrompt ? `<div class="dream-thumb">🎨 ${escapeHtml(post.imagePrompt)}</div>` : ""}
                    ${(post.imageData || post.imageUrl) ? imageTagFromPost(post) : ""}
            ${post.imagePrompt ? `<div class="dream-img-note">Prompt：${escapeHtml(post.imagePrompt)}</div>` : ""}
            <div class="dream-detail-content">${escapeHtml(post.content || "")}</div>
                    <div class="dream-meta">
                        <span>${dreamTime(post.createdAt)}</span>
                        <span class="dream-like" onclick="likeDreamPost('${post.id}'); showDreamPostDetail('${post.id}')">♡ ${Number(post.likeCount || 0)}</span>
                        <span>收藏 ${Number(post.collectCount || 0)}</span>
                    </div>
                    <div class="dream-comment-title">── 评论区 ──</div>
                    ${reactions.length ? reactions.map(r => `
                        <div class="dream-reaction ${dreamReactionClass(r.reactionType)}">
                            <b>${escapeHtml(r.authorAlias || "匿名")}</b>：${escapeHtml(r.content || "")}
                        </div>
                    `).join("") : `<div class="dream-empty" style="padding:25px">暂无评论</div>`}
                    <div class="dream-link" onclick="showDreamAuthorHistory('${post.authorId}', '${escapeHtml(post.authorAlias || "神秘人")}')">📚 查看 ${escapeHtml(post.authorAlias || "神秘人")} 的往期创作</div>
                </div>
            </div>
        </div>
    `
}

function dreamReactionClass(type) {
    if (type === "杠精") return "argue"
    if (type === "争宠") return "rival"
    if (type === "共鸣") return "resonate"
    return "support"
}

async function showDreamAuthorHistory(authorId, authorAlias) {
    currentPage = "dreamHouseHistory"
    const posts = (await dreamAll("dreamHousePosts"))
        .filter(p => p.authorId === authorId)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    const title = document.getElementById("appTitle")
    if (title) title.innerText = "往期创作"
    const root = document.getElementById("appContent")
    root.innerHTML = `
        <div class="dream-detail">
            <div class="dream-top">
                <button class="dream-back" onclick="showDreamHouseHome('${currentDreamBoard}')">‹</button>
                <div class="dream-title">${escapeHtml(authorAlias)} 的往期</div>
                <span style="width:45px"></span>
            </div>
            <div class="dream-detail-scroll">
                ${posts.length ? posts.map(p => `
                    <div class="dream-history-item" onclick="showDreamPostDetail('${p.id}')">
                        [${escapeHtml(dreamBoardName(p.boardId))}] ${dreamTime(p.createdAt)}<br>${escapeHtml((p.content || "").slice(0, 80))}…
                    </div>
                `).join("") : `<div class="dream-empty">暂无往期内容</div>`}
            </div>
        </div>
    `
}

function showDreamProfile() {
    ensureDreamHouseStyle()
    currentPage = "dreamHouseProfile"
    const p = dreamProfile()
    const title = document.getElementById("appTitle")
    if (title) title.innerText = "我的档案"
    const root = document.getElementById("appContent")
    root.innerHTML = `
        <div class="dream-detail">
            <div class="dream-top">
                <button class="dream-back" onclick="showDreamHouseHome('${currentDreamBoard}')">‹</button>
                <div class="dream-title">我的档案</div>
                <span style="width:45px"></span>
            </div>
            <div class="dream-form">
                <label>主角称呼</label>
                <input id="dreamNick" placeholder="例如：Moon / 我 / 你的名字" value="${escapeHtml(p.nickname || localStorage.getItem("MJI_MY_NAME") || "")}">
                <label>外形描述</label>
                <textarea id="dreamAppearance" placeholder="写给梦男之家的创作者看：发色、眼睛、气质、身形、穿搭、常见表情……">${escapeHtml(p.appearance || "")}</textarea>
                <div class="dream-note">这个档案会被同人文、交流帖、同人图提示词使用。越具体，生成越贴近你。</div>
                <button class="dream-save" onclick="saveDreamProfileFromForm()">保存档案</button>
            </div>
        </div>
    `
}

function saveDreamProfileFromForm() {
    saveDreamProfile({
        nickname: document.getElementById("dreamNick")?.value.trim() || "",
        appearance: document.getElementById("dreamAppearance")?.value.trim() || ""
    })
    alert("档案已保存")
    showDreamHouseHome(currentDreamBoard)
}

async function dreamHouseCallAI(prompt, maxTokens = 500, temperature = 0.9) {
    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL")
    if (!apiBase || !apiKey || !apiModel) throw new Error("请先在设置里配置API")

    let url = apiBase.replace(/\/$/, "")
    if (!url.endsWith("/chat/completions")) {
        url += url.includes("/v1") ? "/chat/completions" : "/v1/chat/completions"
    }

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
                { role: "user", content: prompt }
            ]
        })
    })

    if (!resp.ok) throw new Error("HTTP " + resp.status)
    const data = await resp.json()
    const text = data?.choices?.[0]?.message?.content?.trim() || ""
    if (!text) throw new Error("AI返回空内容")
    return text.replace(/```json|```/g, "").trim()
}
