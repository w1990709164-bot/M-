// 论坛模块
// 功能：板块列表、AI补帖、发帖、马甲、帖子详情、评论、AI跟评、论坛动态写入世界书

const FORUM_BOARDS = [
    { id: "hot", name: "近期热门" },
    { id: "daily", name: "日常吐槽区" },
    { id: "gossip", name: "八卦闲聊区" },
    { id: "info", name: "情报交流区" },
    { id: "heart", name: "袒露心声区" }
]

let currentForumBoard = "hot"
let currentForumPostId = ""
let forumEditorBoard = "daily"
let forumEditorUseAlias = false
let forumEditorAliasName = ""

function forumId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(16).slice(2)
}

function getForumMyProfile() {
    return {
        id: "me",
        name: localStorage.getItem("MJI_MY_NAME") || "我"
    }
}

function getForumBoardName(boardId) {
    const b = FORUM_BOARDS.find(x => x.id === boardId)
    return b ? b.name : boardId
}

function forumTime(ts) {
    const d = new Date(ts || Date.now())
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    return `${mm}-${dd} ${h}:${m}`
}

function ensureForumStyle() {
    if (document.getElementById("forum-style")) return

    const style = document.createElement("style")
    style.id = "forum-style"
    style.textContent = `
        .forum-page{height:100%;display:flex;flex-direction:column;background:#f5f5f5;color:#111;overflow:hidden}
        .forum-top{height:48px;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:1px solid #eee;flex-shrink:0}
        .forum-top-title{font-size:18px;font-weight:700}
        .forum-icon-btn{border:none;background:transparent;font-size:20px;padding:8px;cursor:pointer}
        .forum-tabs{display:flex;gap:8px;overflow-x:auto;background:#fff;padding:8px 10px;border-bottom:1px solid #eee;flex-shrink:0}
        .forum-tabs::-webkit-scrollbar{display:none}
        .forum-tab{border:none;background:#eee;color:#555;border-radius:999px;padding:7px 12px;font-size:13px;white-space:nowrap;cursor:pointer}
        .forum-tab.active{background:#07c160;color:#fff;font-weight:700}
        .forum-list{flex:1;overflow-y:auto;padding:10px 0 80px}
        .forum-card{background:#fff;margin-bottom:8px;padding:14px 16px;cursor:pointer;border-top:1px solid #f2f2f2;border-bottom:1px solid #f2f2f2}
        .forum-author{font-size:12px;color:#999;margin-bottom:6px}
        .forum-title{font-size:16px;font-weight:700;color:#111;line-height:1.35;margin-bottom:7px}
        .forum-content{font-size:13px;color:#555;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;white-space:pre-wrap}
        .forum-bottom{font-size:11px;color:#aaa;margin-top:8px;display:flex;gap:10px;align-items:center}
        .forum-fab{position:absolute;right:22px;bottom:28px;width:56px;height:56px;border-radius:50%;border:none;background:#07c160;color:#fff;font-size:22px;box-shadow:0 8px 20px rgba(7,193,96,.28);cursor:pointer;z-index:4}
        .forum-empty{padding:70px 20px;text-align:center;color:#999;font-size:14px;line-height:1.8}
        .forum-loading{padding:12px;text-align:center;color:#999;font-size:13px;background:#fff}
        .forum-detail{height:100%;display:flex;flex-direction:column;background:#f5f5f5;overflow:hidden}
        .forum-detail-scroll{flex:1;overflow-y:auto;padding-bottom:8px}
        .forum-post-main{background:#fff;padding:16px;margin-bottom:8px}
        .forum-post-main .forum-title{font-size:20px;margin:8px 0 10px}
        .forum-post-main .forum-content{display:block;font-size:15px;color:#333;line-height:1.8;white-space:pre-wrap;overflow:visible}
        .forum-like-line{margin-top:14px;color:#999;font-size:14px;cursor:pointer}
        .forum-like-line.liked{color:#07c160;font-weight:700}
        .forum-section-title{font-size:15px;font-weight:700;color:#333;padding:12px 16px 8px}
        .forum-comment{background:#fff;padding:12px 16px;border-bottom:1px solid #f2f2f2}
        .forum-comment-name{font-size:13px;color:#07c160;margin-bottom:5px}
        .forum-comment-content{font-size:14px;color:#333;line-height:1.55;white-space:pre-wrap}
        .forum-comment-time{font-size:11px;color:#aaa;margin-top:6px}
        .forum-comment-bar{height:56px;background:#fff;border-top:1px solid #eee;display:flex;align-items:center;gap:8px;padding:8px 12px;flex-shrink:0}
        .forum-comment-bar input{flex:1;border:none;background:#f5f5f5;border-radius:20px;padding:9px 14px;font-size:14px;outline:none}
        .forum-comment-bar button{width:60px;height:36px;border:none;border-radius:18px;background:#07c160;color:#fff;font-weight:700}
        .forum-form{height:100%;overflow-y:auto;background:#f5f5f5;padding:14px 16px 80px}
        .forum-form label{display:block;font-size:14px;font-weight:700;color:#555;margin:12px 0 8px}
        .forum-chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
        .forum-chip{border:none;border-radius:999px;background:#eee;color:#555;padding:7px 12px;font-size:13px;cursor:pointer}
        .forum-chip.active{background:#07c160;color:#fff;font-weight:700}
        .forum-chip.alias-active{background:#ff9500;color:#fff;font-weight:700}
        .forum-form input,.forum-form textarea{width:100%;border:none;border-radius:8px;background:#fff;padding:13px 14px;font-size:15px;outline:none;margin-bottom:12px;color:#111}
        .forum-form textarea{min-height:190px;resize:none;line-height:1.6}
        .forum-submit{position:absolute;right:14px;top:7px;border:none;background:transparent;color:#07c160;font-size:15px;font-weight:700;padding:8px;cursor:pointer}
        .forum-alias-box{background:#fff;border-radius:10px;padding:12px;margin:8px 0 14px}
        .forum-alias-list{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
        .forum-small-note{font-size:12px;color:#888;line-height:1.6;margin:4px 0 10px}
    `
    document.head.appendChild(style)
}

async function showForumHome(boardId) {
    ensureForumStyle()
    currentPage = "forumHome"
    currentForumBoard = boardId || currentForumBoard || "hot"

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "论坛"

    const root = document.getElementById("forumRoot") || document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="forum-page">
            <div class="forum-top">
                <button class="forum-icon-btn" onclick="goHome()">‹</button>
                <div class="forum-top-title">论坛</div>
                <button class="forum-icon-btn" onclick="refreshForumBoard()">🔄</button>
            </div>
            <div class="forum-tabs">
                ${FORUM_BOARDS.map(b => `
                    <button class="forum-tab ${b.id === currentForumBoard ? "active" : ""}"
                            onclick="switchForumBoard('${b.id}')">
                        ${escapeHtml(b.name)}
                    </button>
                `).join("")}
            </div>
            <div id="forumList" class="forum-list">
                <div class="forum-loading">加载中...</div>
            </div>
            <button class="forum-fab" onclick="showForumEditor()">✏️</button>
        </div>
    `

    loadForumPosts()
}

function switchForumBoard(boardId) {
    currentForumBoard = boardId
    showForumHome(boardId)
}

async function refreshForumBoard() {
    const posts = await getAllStoreData("forumPosts")
    const ids = currentForumBoard === "hot"
        ? posts.map(p => p.id)
        : posts.filter(p => p.boardId === currentForumBoard).map(p => p.id)

    await deleteForumPosts(ids)
    showForumHome(currentForumBoard)
}

function deleteForumPosts(postIds) {
    return new Promise(resolve => {
        const tx = db.transaction(["forumPosts", "forumComments"], "readwrite")
        const postStore = tx.objectStore("forumPosts")
        const commentStore = tx.objectStore("forumComments")
        postIds.forEach(id => postStore.delete(id))
        const allReq = commentStore.getAll()
        allReq.onsuccess = function() {
            allReq.result
                .filter(c => postIds.includes(c.postId))
                .forEach(c => commentStore.delete(c.id))
        }
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}

async function loadForumPosts() {
    const list = document.getElementById("forumList")
    if (!list) return

    list.innerHTML = `<div class="forum-loading">加载中...</div>`

    let posts = await getAllStoreData("forumPosts")
    let visible = getVisibleForumPosts(posts)

    if (visible.length < 5) {
        list.innerHTML = `<div class="forum-loading">正在召唤网友发帖...</div>`
        await generateForumPosts(currentForumBoard, 5 - visible.length)
        posts = await getAllStoreData("forumPosts")
        visible = getVisibleForumPosts(posts)
    }

    if (visible.length === 0) {
        list.innerHTML = `<div class="forum-empty">还没有帖子。<br>点右下角发第一帖。</div>`
        return
    }

    list.innerHTML = visible.map(renderForumPostCard).join("")
}

function getVisibleForumPosts(posts) {
    const arr = currentForumBoard === "hot"
        ? posts.slice()
        : posts.filter(p => p.boardId === currentForumBoard)

    return arr
        .sort(function(a, b) {
            if (currentForumBoard === "hot") {
                const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
                if (likeDiff !== 0) return likeDiff
            }
            return (b.createdAt || 0) - (a.createdAt || 0)
        })
        .slice(0, 20)
}

function renderForumPostCard(post) {
    return `
        <div class="forum-card" onclick="showForumDetail('${post.id}')">
            <div class="forum-author">🙂 ${escapeHtml(post.authorName || "匿名网友")}</div>
            <div class="forum-title">${escapeHtml(post.title || "无标题")}</div>
            <div class="forum-content">${escapeHtml(post.content || "")}</div>
            <div class="forum-bottom">
                <span>👍 ${Number(post.likeCount || 0)}</span>
                <span>${escapeHtml(getForumBoardName(post.boardId))}</span>
                <span>${forumTime(post.createdAt)}</span>
            </div>
        </div>
    `
}

async function generateForumPosts(boardId, count) {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"

    if (!apiBase || !apiKey) {
        await saveFallbackForumPosts(boardId, count)
        return
    }

    try {
        const contacts = await getAllStoreData("contacts")
        const contactsInfo = contacts
            .slice(0, 80)
            .map(c => `- ${c.name || "未知"}：${String(c.profile || c.prompt || c.personality || c.identity || "").slice(0, 60)}`)
            .join("\n")

        const prompt = `
你正在模拟一个真实社区论坛的【${getForumBoardName(boardId)}】板块。
【已知角色（绝对保密，禁止在帖子里直接使用这些真实名字）】：
${contactsInfo || "暂无"}

请生成 ${count} 条真实感极强的论坛帖子。

【发帖人规则】：
1. 每个发帖人必须有一个像真实网友的ID，例如：萌萌的小饼干、深夜码字人、just_passing_by、柠檬味的风、摸鱼专家2077、夜猫子不睡觉。
2. 严禁直接使用角色真实名字作为ID或网名。
3. 角色可以用马甲发帖，但马甲ID必须完全看不出是谁。
4. 约一半帖子由路人网友发，一半由角色马甲发。
5. isAlias为true表示角色马甲，false表示路人。

【内容规则】：
1. 内容符合【${getForumBoardName(boardId)}】的板块氛围。
2. 语气要有生活气息，可以有错别字、缩写、emoji、口语化表达。
3. 标题简短接地气，正文80-150字，不要太工整。
4. 内容要多样：吐槽、分享、求助、炫耀、感慨、碎碎念都可以。
5. 点赞数随机分布，大部分10-100，少数可以到500。
6. 禁止角色真实姓名、CP、恋爱暗示内容。

严格按JSON数组输出，只输出JSON数组：
[
  {"title":"帖子标题","content":"帖子正文","authorId":"virtual_xxx","authorName":"真实感网名","isAlias":true,"likeCount":数字}
]
        `.trim()

        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.9,
                messages: [{ role: "user", content: prompt }]
            })
        })

        const json = await response.json()
        const raw = json?.choices?.[0]?.message?.content || ""
        const arr = parseForumJsonArray(raw)

        if (!Array.isArray(arr) || arr.length === 0) {
            await saveFallbackForumPosts(boardId, count)
            return
        }

        await saveGeneratedForumPosts(boardId, arr.slice(0, count))
    } catch (e) {
        console.warn("论坛发帖生成失败", e)
        await saveFallbackForumPosts(boardId, count)
    }
}

function parseForumJsonArray(raw) {
    try {
        const clean = String(raw || "").replace(/```json|```/g, "").trim()
        const start = clean.indexOf("[")
        const end = clean.lastIndexOf("]")
        if (start === -1 || end === -1 || end <= start) return []
        return JSON.parse(clean.slice(start, end + 1))
    } catch (e) {
        return []
    }
}

function saveGeneratedForumPosts(boardId, arr) {
    return new Promise(resolve => {
        const tx = db.transaction("forumPosts", "readwrite")
        const store = tx.objectStore("forumPosts")
        arr.forEach(function(item, i) {
            store.put({
                id: forumId("post"),
                boardId,
                title: String(item.title || "随便说点").slice(0, 60),
                content: String(item.content || "今天也想水一帖。").slice(0, 800),
                authorId: String(item.authorId || "virtual_anon"),
                authorName: String(item.authorName || "匿名网友"),
                isAlias: Boolean(item.isAlias),
                likeCount: Number(item.likeCount || (10 + Math.floor(Math.random() * 90))),
                createdAt: Date.now() - Math.floor(Math.random() * 86400000) - i
            })
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}

async function saveFallbackForumPosts(boardId, count) {
    const samples = {
        hot: [
            ["有没有人觉得最近大家都好会装忙", "不是说真的，我感觉论坛里每个人都像白天上班晚上拯救世界，结果一问都在摸鱼。笑死，只有我是真的忙到灵魂出窍吗。"],
            ["深夜刷到一句话破防了", "有些关系就是这样，不说清楚的时候像还有机会，说清楚了反而什么都没了。算了，当我凌晨脑子进水。"],
            ["今天的风有点像电影结尾", "下班路上突然起风，树叶哗啦一下，全世界都像按了慢放键。然后我外卖洒了，电影感瞬间结束。"]
        ],
        daily: [
            ["上班上到想跟键盘同归于尽", "今天第八次打开文档又关掉，我感觉我的灵魂已经从工位爬出去了。还有谁懂这种明明没干什么却累得像大战三百回合。"],
            ["刚刚把咖啡当水喝完了", "我本来只是想提神，结果现在心跳像开了倍速。朋友问我为什么手抖，我说这是我对生活的激情。"]
        ],
        gossip: [
            ["隔壁那对又开始冷战了吧", "不是我八卦，是气氛真的太明显了。一个装作不在意，一个疯狂制造存在感，路过的人都能被冻一下。"],
            ["有些人嘴上说不熟", "结果对方一个小动作都记得清清楚楚。成年人能不能坦诚一点，我作为路人看得很急。"]
        ],
        info: [
            ["分享一个保命小技巧", "遇到对方突然沉默，不要立刻追问三连。先给一点空间，过会儿再轻轻递话题，很多时候比逼问有效。亲测。"],
            ["最近大家注意备份数据", "真的，别等东西没了才开始后悔。聊天记录、设定、重要文本都备一份，电子世界说塌就塌。"]
        ],
        heart: [
            ["有时候好想被坚定选择", "不是轰轰烈烈那种，就是很普通地、很自然地，被人放在心上。今天突然有点羡慕这种关系。"],
            ["匿名说一句", "我其实没有看上去那么无所谓。很多话咽下去不是因为不在乎，是因为怕说出来连现在这一点联系都没了。"]
        ]
    }

    const pool = samples[boardId] || samples.hot
    const arr = []
    for (let i = 0; i < count; i++) {
        const item = pool[(Date.now() + i) % pool.length]
        arr.push({
            title: item[0],
            content: item[1],
            authorId: "virtual_fallback_" + i,
            authorName: ["夜猫子不睡觉", "摸鱼专家2077", "路过的小透明", "柠檬味的风", "深夜码字人"][i % 5],
            isAlias: false,
            likeCount: 10 + Math.floor(Math.random() * 120)
        })
    }
    await saveGeneratedForumPosts(boardId, arr)
}

async function showForumDetail(postId) {
    ensureForumStyle()
    currentPage = "forumDetail"
    currentForumPostId = postId

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "帖子详情"

    const root = document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="forum-detail">
            <div class="forum-top">
                <button class="forum-icon-btn" onclick="showForumHome(currentForumBoard)">‹</button>
                <div class="forum-top-title">帖子详情</div>
                <span style="width:36px"></span>
            </div>
            <div id="forumDetailScroll" class="forum-detail-scroll">
                <div class="forum-loading">加载中...</div>
            </div>
            <div class="forum-comment-bar">
                <input id="forumCommentInput" placeholder="说点什么...">
                <button onclick="sendForumComment()">发送</button>
            </div>
        </div>
    `

    await loadForumDetail()
}

async function loadForumDetail() {
    const box = document.getElementById("forumDetailScroll")
    if (!box) return

    const [posts, comments] = await Promise.all([
        getAllStoreData("forumPosts"),
        getAllStoreData("forumComments")
    ])

    const post = posts.find(p => p.id === currentForumPostId)
    if (!post) {
        box.innerHTML = `<div class="forum-empty">帖子不存在。</div>`
        return
    }

    let postComments = comments
        .filter(c => c.postId === currentForumPostId)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))

    if (postComments.length < 5) {
        box.innerHTML = `<div class="forum-loading">正在加载评论区...</div>`
        await generateForumComments(post, 5 - postComments.length)
        const fresh = await getAllStoreData("forumComments")
        postComments = fresh
            .filter(c => c.postId === currentForumPostId)
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    }

    renderForumDetail(post, postComments)
}

function renderForumDetail(post, comments) {
    const box = document.getElementById("forumDetailScroll")
    if (!box) return

    const likedKey = "MJI_FORUM_LIKED_" + post.id
    const liked = localStorage.getItem(likedKey) === "1"

    box.innerHTML = `
        <div class="forum-post-main">
            <div class="forum-author">🙂 ${escapeHtml(post.authorName || "匿名网友")} · ${forumTime(post.createdAt)}</div>
            <div class="forum-title">${escapeHtml(post.title || "无标题")}</div>
            <div class="forum-content">${escapeHtml(post.content || "")}</div>
            <div id="forumPostLike" class="forum-like-line ${liked ? "liked" : ""}" onclick="likeForumPost('${post.id}')">
                👍 ${Number(post.likeCount || 0)} ${liked ? "已点赞" : "点个赞"}
            </div>
        </div>
        <div class="forum-section-title">评论</div>
        <div id="forumCommentList">
            ${comments.length ? comments.map(renderForumComment).join("") : `<div class="forum-empty">暂无评论。</div>`}
        </div>
    `
}

function renderForumComment(comment) {
    return `
        <div class="forum-comment">
            <div class="forum-comment-name">🙂 ${escapeHtml(comment.authorName || "匿名")}</div>
            <div class="forum-comment-content">${escapeHtml(comment.content || "")}</div>
            <div class="forum-comment-time">👍 ${Number(comment.likeCount || 0)} · ${forumTime(comment.createdAt)}</div>
        </div>
    `
}

async function likeForumPost(postId) {
    const likedKey = "MJI_FORUM_LIKED_" + postId
    if (localStorage.getItem(likedKey) === "1") return

    const posts = await getAllStoreData("forumPosts")
    const post = posts.find(p => p.id === postId)
    if (!post) return

    post.likeCount = Number(post.likeCount || 0) + 1
    post.updatedAt = Date.now()

    await putForumStore("forumPosts", post)
    localStorage.setItem(likedKey, "1")
    loadForumDetail()
}

function putForumStore(storeName, item) {
    return new Promise(resolve => {
        const tx = db.transaction(storeName, "readwrite")
        tx.objectStore(storeName).put(item)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}

async function generateForumComments(post, count) {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"

    if (!apiBase || !apiKey) {
        await saveFallbackForumComments(post, count)
        return
    }

    try {
        const contacts = await getAllStoreData("contacts")
        const contactsInfo = contacts
            .slice(0, 80)
            .map(c => `- ${c.name || "未知"}：${String(c.profile || c.prompt || c.personality || c.identity || "").slice(0, 50)}`)
            .join("\n")

        const prompt = `
你正在模拟真实社区论坛的评论区。
帖子标题：${post.title}
帖子内容：${post.content}

【已知角色（绝对保密，禁止在评论里直接使用这些真实名字）】：
${contactsInfo || "暂无"}

请生成 ${count} 条真实感极强的评论。
评论人网名要像真实网友，严禁直接使用角色真实名字。
语气要生活化、口语化，可以附和、反驳、调侃、共情、提问、分享经历。
禁止任何角色配对、CP内容。

严格按JSON数组输出，只输出JSON：
[
  {"authorName":"真实感网名","authorId":"virtual_xxx","content":"评论内容","likeCount":数字}
]
        `.trim()

        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.9,
                messages: [{ role: "user", content: prompt }]
            })
        })

        const json = await response.json()
        const raw = json?.choices?.[0]?.message?.content || ""
        const arr = parseForumJsonArray(raw)

        if (!Array.isArray(arr) || arr.length === 0) {
            await saveFallbackForumComments(post, count)
            return
        }

        await saveGeneratedForumComments(post.id, arr.slice(0, count))
    } catch (e) {
        console.warn("论坛评论生成失败", e)
        await saveFallbackForumComments(post, count)
    }
}

function saveGeneratedForumComments(postId, arr) {
    return new Promise(resolve => {
        const tx = db.transaction("forumComments", "readwrite")
        const store = tx.objectStore("forumComments")
        arr.forEach(function(item, i) {
            store.put({
                id: forumId("comment"),
                postId,
                authorId: String(item.authorId || "virtual_anon"),
                authorName: String(item.authorName || "匿名网友"),
                content: String(item.content || "蹲一个后续。").slice(0, 500),
                likeCount: Number(item.likeCount || Math.floor(Math.random() * 50)),
                createdAt: Date.now() - Math.floor(Math.random() * 3600000) + i
            })
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}

async function saveFallbackForumComments(post, count) {
    const names = ["路过的小透明", "不想上班的打工人", "深夜emo中", "摸鱼达人", "just_a_lurker"]
    const texts = [
        "说实话我还挺懂这种感觉的，很多事当下看着很小，过后越想越不是滋味。",
        "哈哈哈哈这个画面感太强了，感觉我昨天刚经历过类似的。",
        "蹲一个后续，楼主别发一半就跑啊。",
        "有一说一，这种事换我也会在意，只是嘴上不一定说。",
        "评论区怎么突然认真起来了，我本来只是进来摸鱼的。"
    ]
    const arr = []
    for (let i = 0; i < count; i++) {
        arr.push({
            authorName: names[i % names.length],
            authorId: "virtual_comment_" + i,
            content: texts[(Date.now() + i) % texts.length],
            likeCount: Math.floor(Math.random() * 80)
        })
    }
    await saveGeneratedForumComments(post.id, arr)
}

async function sendForumComment() {
    const input = document.getElementById("forumCommentInput")
    const text = input?.value?.trim() || ""
    if (!text) return

    const my = getForumMyProfile()
    const comment = {
        id: forumId("comment"),
        postId: currentForumPostId,
        authorId: my.id,
        authorName: my.name,
        content: text,
        likeCount: 0,
        createdAt: Date.now()
    }

    await putForumStore("forumComments", comment)
    input.value = ""
    await loadForumDetail()
    triggerForumAiReplyToComment(text)
}

async function triggerForumAiReplyToComment(userComment) {
    const posts = await getAllStoreData("forumPosts")
    const post = posts.find(p => p.id === currentForumPostId)
    if (!post) return

    setTimeout(async function() {
        await generateForumCommentReplies(post, userComment)
        if (currentPage === "forumDetail" && currentForumPostId === post.id) {
            loadForumDetail()
        }
    }, 600)
}

async function generateForumCommentReplies(post, userComment) {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"
    const count = 1 + Math.floor(Math.random() * 2)

    if (!apiBase || !apiKey) {
        await saveGeneratedForumComments(post.id, [{
            authorName: "围观群众A",
            authorId: "virtual_reply",
            content: "你这句我赞同，感觉楼主说的点就在这里。",
            likeCount: Math.floor(Math.random() * 30)
        }])
        return
    }

    try {
        const prompt = `
论坛帖子标题：${post.title}
帖子内容：${post.content}
用户刚刚发了评论：「${userComment}」

请以真实网友身份生成 ${count} 条回复这条评论的评论。
网名要像真实网友，口语化，有生活气息。
严格按JSON数组输出：
[{"authorName":"网名","authorId":"virtual_xxx","content":"评论内容","likeCount":数字}]
        `.trim()

        const response = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model: apiModel,
                temperature: 0.9,
                messages: [{ role: "user", content: prompt }]
            })
        })

        const json = await response.json()
        const raw = json?.choices?.[0]?.message?.content || ""
        const arr = parseForumJsonArray(raw)

        if (arr.length) {
            await saveGeneratedForumComments(post.id, arr.slice(0, count))
        }
    } catch (e) {}
}

async function showForumEditor() {
    ensureForumStyle()
    currentPage = "forumEditor"
    if (!forumEditorBoard || forumEditorBoard === "hot") {
        forumEditorBoard = currentForumBoard === "hot" ? "daily" : currentForumBoard
    }
    forumEditorUseAlias = false
    forumEditorAliasName = ""

    const title = document.getElementById("appTitle")
    if (title) title.innerText = "发帖"

    const root = document.getElementById("appContent")
    if (!root) return

    root.innerHTML = `
        <div class="forum-detail">
            <div class="forum-top">
                <button class="forum-icon-btn" onclick="showForumHome(currentForumBoard)">‹</button>
                <div class="forum-top-title">发帖</div>
                <button class="forum-submit" onclick="submitForumPost()">发布</button>
            </div>
            <div class="forum-form">
                <label>选择板块</label>
                <div class="forum-chip-row" id="forumEditorBoards">
                    ${FORUM_BOARDS.filter(b => b.id !== "hot").map(b => `
                        <button class="forum-chip ${b.id === forumEditorBoard ? "active" : ""}"
                                onclick="selectForumEditorBoard('${b.id}')">
                            ${escapeHtml(b.name)}
                        </button>
                    `).join("")}
                </div>

                <label>发帖身份</label>
                <div class="forum-small-note" id="forumIdentityText">
                    当前身份：${escapeHtml(getForumMyProfile().name)}（真实账号）
                </div>
                <div class="forum-chip-row">
                    <button id="forumRealBtn" class="forum-chip active" onclick="selectForumRealIdentity()">真实账号</button>
                    <button id="forumAliasBtn" class="forum-chip" onclick="toggleForumAliasBox()">+ 使用马甲</button>
                </div>
                <div id="forumAliasBox"></div>

                <input id="forumPostTitle" placeholder="输入标题（建议20字以内）" maxlength="50">
                <textarea id="forumPostContent" placeholder="分享你想说的..."></textarea>
            </div>
        </div>
    `
}

function selectForumEditorBoard(boardId) {
    forumEditorBoard = boardId
    showForumEditor()
}

function selectForumRealIdentity() {
    forumEditorUseAlias = false
    forumEditorAliasName = ""
    const my = getForumMyProfile()
    document.getElementById("forumIdentityText").textContent = `当前身份：${my.name}（真实账号）`
    document.getElementById("forumRealBtn")?.classList.add("active")
    const aliasBtn = document.getElementById("forumAliasBtn")
    aliasBtn?.classList.remove("alias-active")
    aliasBtn?.classList.remove("active")
    document.getElementById("forumAliasBox").innerHTML = ""
}

async function toggleForumAliasBox() {
    const box = document.getElementById("forumAliasBox")
    if (!box) return

    const aliases = await getAllStoreData("forumAliases")
    box.innerHTML = `
        <div class="forum-alias-box">
            <div class="forum-small-note">选择已有马甲，或创建一个新马甲。</div>
            <div class="forum-alias-list">
                ${aliases
                    .slice()
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .map(a => `<button class="forum-chip" onclick="selectForumAlias('${escapeHtml(a.aliasName)}')">🎭 ${escapeHtml(a.aliasName)}</button>`)
                    .join("")}
            </div>
            <input id="forumNewAlias" placeholder="输入新马甲名...">
            <button class="forum-chip alias-active" onclick="createAndSelectForumAlias()">创建并使用</button>
        </div>
    `
}

function selectForumAlias(name) {
    forumEditorUseAlias = true
    forumEditorAliasName = name
    document.getElementById("forumIdentityText").textContent = `当前身份：${name}（马甲）`
    document.getElementById("forumRealBtn")?.classList.remove("active")
    const aliasBtn = document.getElementById("forumAliasBtn")
    aliasBtn?.classList.add("alias-active")
    aliasBtn.textContent = "🎭 " + name
}

async function createAndSelectForumAlias() {
    const input = document.getElementById("forumNewAlias")
    const name = input?.value?.trim() || ""
    if (!name) {
        alert("请输入马甲名")
        return
    }

    const aliases = await getAllStoreData("forumAliases")
    if (aliases.some(a => a.aliasName === name)) {
        alert("马甲已存在")
        return
    }

    await putForumStore("forumAliases", {
        id: forumId("alias"),
        aliasName: name,
        avatarColor: "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"),
        createdAt: Date.now()
    })

    selectForumAlias(name)
    toggleForumAliasBox()
}

async function submitForumPost() {
    const title = document.getElementById("forumPostTitle")?.value?.trim() || ""
    const content = document.getElementById("forumPostContent")?.value?.trim() || ""

    if (!title) {
        alert("请输入标题")
        return
    }

    if (!content) {
        alert("请输入正文")
        return
    }

    const my = getForumMyProfile()
    const authorName = forumEditorUseAlias && forumEditorAliasName ? forumEditorAliasName : my.name
    const authorId = forumEditorUseAlias && forumEditorAliasName ? "alias_" + forumEditorAliasName : my.id
    const post = {
        id: forumId("post"),
        boardId: forumEditorBoard,
        title: title.slice(0, 50),
        content: content.slice(0, 2000),
        authorId,
        authorName,
        isAlias: forumEditorUseAlias,
        likeCount: Math.floor(Math.random() * 31),
        createdAt: Date.now()
    }

    await putForumStore("forumPosts", post)
    await injectForumPostToWorldBook(post)

    alert("发布成功")
    currentForumBoard = forumEditorBoard
    showForumHome(forumEditorBoard)
}

async function injectForumPostToWorldBook(post) {
    try {
        const contacts = await getAllStoreData("contacts")
        const books = await getAllStoreData("worldbooks")
        const boardName = getForumBoardName(post.boardId)
        const date = forumTime(post.createdAt)
        const summary = `【${date} 论坛动态】用户在论坛【${boardName}】发了帖子，标题：「${post.title}」，内容：「${String(post.content || "").slice(0, 120)}」，发帖身份：${post.isAlias ? "匿名马甲（" + post.authorName + "）" : "真实账号"}。如果对话中涉及论坛或这个话题，可以自然地提起，但不要主动透露你知道这是用户发的。`

        const tx = db.transaction("worldbooks", "readwrite")
        const store = tx.objectStore("worldbooks")

        contacts.forEach(function(contact) {
            const old = books.find(wb =>
                (wb.autoTag === "forumDynamic" || wb.title === "论坛动态") &&
                (wb.targetAiId || wb.aiId || "global") === contact.id
            )

            const oldContent = old?.content || ""
            const merged = (oldContent + "\n" + summary).trim().slice(-4000)

            store.put({
                ...(old || {}),
                id: old?.id || forumId("wb_forum"),
                title: "论坛动态",
                type: "keyword",
                priority: "keyword",
                keywords: "论坛,帖子,发帖,社区,评论",
                content: merged,
                targetAiId: contact.id,
                aiId: contact.id,
                isAdmin: false,
                enabled: true,
                autoTag: "forumDynamic",
                createdAt: old?.createdAt || Date.now(),
                updatedAt: Date.now()
            })
        })
    } catch (e) {}
}
