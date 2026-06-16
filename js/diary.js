// 交换日记模块
// 功能：日记书架、用户日记、角色日记、AI生成今日日记、详情、删除、写入长期记忆

let currentDiaryOwner = null
let currentDiaryDetailBack = "diaryHome"

function getDiaryToday() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}年${m}月${day}日`
}

function getDiaryTodayKey() {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

function getDiaryTimeFeeling() {
    const hour = new Date().getHours()

    if (hour >= 0 && hour <= 5) return "凌晨，城市很安静"
    if (hour >= 6 && hour <= 11) return "上午，新的一天开始了"
    if (hour >= 12 && hour <= 13) return "中午，有些慵懒"
    if (hour >= 14 && hour <= 17) return "下午，时间过得慢"
    if (hour >= 18 && hour <= 20) return "傍晚，余晖渐散"
    return "夜晚，终于可以喘口气"
}

function getDiaryWeather() {
    return (
        localStorage.getItem("MJI_CYBER_WEATHER") ||
        localStorage.getItem("MJI_WEATHER") ||
        "晴"
    )
}

function guessDiaryLocation(contact) {
    const text = [
        contact?.profile || "",
        contact?.prompt || "",
        contact?.identity || ""
    ].join("\n")

    const match = text.match(/(?:位于|在|驻扎|驻地|基地|城市)[：:：]?\s*([\u4e00-\u9fa5A-Za-z·•\s]{2,18})/)

    if (match && match[1]) {
        return match[1].trim()
    }

    return "未知"
}

function diaryToast(text) {
    let t = document.getElementById("diaryToast")

    if (!t) {
        t = document.createElement("div")
        t.id = "diaryToast"
        t.className = "diary-toast"
        document.body.appendChild(t)
    }

    t.innerText = text
    t.classList.add("show")

    setTimeout(function() {
        t.classList.remove("show")
    }, 2200)
}

function cleanDiaryOutput(raw) {
    const text = String(raw || "").trim()

    const contentMatch = text.match(/【日记正文】([\s\S]*?)(?=【次日摘要】|$)/)
    const summaryMatch = text.match(/【次日摘要】([\s\S]*?)$/)

    return {
        content: (contentMatch ? contentMatch[1] : text)
            .replace(/^[:：]/, "")
            .trim(),
        summary: (summaryMatch ? summaryMatch[1] : "")
            .replace(/^[:：]/, "")
            .trim()
    }
}

async function showDiaryHome() {

    currentPage = "diaryHome"
    currentDiaryOwner = null

    document.getElementById("appTitle").innerText = "交换日记"

    const contacts = await getAllStoreData("contacts")

    let html = `
        <div class="diary-home">
            <div class="diary-subtitle">
                — Exchange Diary —
            </div>

            <div class="diary-books-grid">
                <div class="diary-book-card user-diary-book" onclick="openUserDiary()">
                    <div class="diary-book-spine"></div>
                    <div class="diary-book-cover">
                        <div class="diary-book-icon">📖</div>
                        <div class="diary-book-name">我的日记</div>
                        <div class="diary-book-label">写给自己的记录</div>
                    </div>
                    <div class="diary-book-footer">点击书写</div>
                </div>
    `

    if (contacts.length === 0) {
        html += `
            <div class="diary-empty-card">
                还没有角色<br>先去添加联系人吧
            </div>
        `
    }

    const spineColors = [
        "#c4a882",
        "#a8b4c0",
        "#b8c4a8",
        "#c0a8b8",
        "#c4b8a8",
        "#a8c0bc"
    ]

    contacts.forEach(function(c, i) {
        const color = spineColors[i % spineColors.length]

        html += `
            <div class="diary-book-card" onclick="openAiDiary('${c.id}')">
                <div class="diary-book-spine" style="background:${color}"></div>
                <div class="diary-book-cover">
                    <div class="diary-book-avatar">
                        ${avatarHtml(c.avatar, "📔")}
                    </div>
                    <div class="diary-book-name">
                        ${escapeHtml(c.name)}
                    </div>
                    <div class="diary-book-label">的日记</div>
                </div>
                <div class="diary-book-footer">点击翻阅</div>
            </div>
        `
    })

    html += `
            </div>
        </div>
    `

    document.getElementById("appContent").innerHTML = html
}

async function openUserDiary() {

    currentPage = "userDiary"
    currentDiaryOwner = {
        type: "user",
        id: "me",
        name: localStorage.getItem("MJI_MY_NAME") || "我",
        avatar: localStorage.getItem("MJI_MY_AVATAR") || ""
    }

    document.getElementById("appTitle").innerText = "我的日记"

    document.getElementById("appContent").innerHTML = `
        <div class="diary-page">
            <button class="add-btn" onclick="showWriteUserDiary()">
                ＋ 写今天的日记
            </button>
            <div id="diaryList"></div>
        </div>
    `

    loadDiaryList()
}

async function openAiDiary(contactId) {

    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === contactId)

    if (!contact) {
        alert("角色不存在")
        return
    }

    currentPage = "aiDiary"
    currentDiaryOwner = {
        type: "ai",
        id: contact.id,
        name: contact.name,
        avatar: contact.avatar || "",
        contact
    }

    document.getElementById("appTitle").innerText =
        contact.name + " 的日记"

    document.getElementById("appContent").innerHTML = `
        <div class="diary-page">
            <button id="genDiaryBtn" class="add-btn" onclick="generateAiDiary()">
                ✦ 生成今日日记
            </button>
            <div id="diaryList"></div>
        </div>
    `

    loadDiaryList()
}

async function loadDiaryList() {

    if (!currentDiaryOwner) return

    const box = document.getElementById("diaryList")
    if (!box) return

    const diaries = await getAllStoreData("diaries")

    const list = diaries
        .filter(d =>
            d.ownerType === currentDiaryOwner.type &&
            d.ownerId === currentDiaryOwner.id
        )
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

    if (list.length === 0) {
        box.innerHTML = `
            <div class="diary-empty-state">
                <div class="diary-empty-icon">📔</div>
                <div class="diary-empty-text">
                    还没有日记<br>
                    ${currentDiaryOwner.type === "ai" ? "点击上方生成今天的日记" : "点击上方写一篇"}
                </div>
            </div>
        `
        return
    }

    let html = ""

    list.forEach(function(d) {
        html += `
            <div class="diary-card" onclick="openDiaryDetail('${d.id}')">
                <div class="diary-card-header">
                    <div>
                        <div class="diary-card-date">
                            ${escapeHtml(d.dateStr || "")}
                        </div>
                        <div class="diary-card-meta">
                            ☁ ${escapeHtml(d.weather || "晴")} · 📍 ${escapeHtml(d.location || "未知")}
                        </div>
                    </div>
                </div>
                <div class="diary-card-preview">
                    ${escapeHtml((d.content || "").slice(0, 120))}…
                </div>
            </div>
        `
    })

    box.innerHTML = html
}

function showWriteUserDiary() {

    if (!currentDiaryOwner) {
        openUserDiary()
        return
    }

    currentPage = "userDiaryWrite"
    document.getElementById("appTitle").innerText = "写日记"

    const today = getDiaryToday()
    const weather = getDiaryWeather()

    document.getElementById("appContent").innerHTML = `
        <div class="diary-write-page form">
            <input id="userDiaryDate" value="${today}" placeholder="日期">
            <input id="userDiaryWeather" value="${escapeHtml(weather)}" placeholder="天气">
            <input id="userDiaryLocation" value="" placeholder="地点，可不填">
            <textarea id="userDiaryContent" placeholder="今天想记录些什么？"></textarea>
            <button onclick="saveUserDiary()">保存日记</button>
        </div>
    `
}

function saveUserDiary() {

    const dateStr = document.getElementById("userDiaryDate").value.trim() || getDiaryToday()
    const weather = document.getElementById("userDiaryWeather").value.trim() || "晴"
    const location = document.getElementById("userDiaryLocation").value.trim() || ""
    const content = document.getElementById("userDiaryContent").value.trim()

    if (!content) {
        alert("日记内容不能为空")
        return
    }

    const now = Date.now()

    const diary = {
        id: "diary_user_" + now,
        ownerType: "user",
        ownerId: "me",
        ownerName: localStorage.getItem("MJI_MY_NAME") || "我",
        dateKey: getDiaryTodayKey(),
        dateStr,
        weather,
        location,
        content,
        summaryForNext: content.slice(0, 80),
        createdAt: now,
        updatedAt: now
    }

    const tx = db.transaction("diaries", "readwrite")
    tx.objectStore("diaries").put(diary)

    tx.oncomplete = function() {
        diaryToast("已保存")
        openUserDiary()
    }
}

async function generateAiDiary() {

    if (!currentDiaryOwner || currentDiaryOwner.type !== "ai") return

    const apiBase = localStorage.getItem("MJI_API_BASE")
    const apiKey = localStorage.getItem("MJI_API_KEY")
    const apiModel = localStorage.getItem("MJI_API_MODEL") || "gpt-4o"

    if (!apiBase || !apiKey || !apiModel) {
        alert("请先配置API")
        return
    }

    const btn = document.getElementById("genDiaryBtn")
    if (btn) {
        btn.disabled = true
        btn.innerText = "生成中…"
    }

    const todayKey = getDiaryTodayKey()
    const today = getDiaryToday()
    const owner = currentDiaryOwner
    const contact = owner.contact

    try {
        const diaries = await getAllStoreData("diaries")
        const existed = diaries.find(d =>
            d.ownerType === "ai" &&
            d.ownerId === owner.id &&
            d.dateKey === todayKey &&
            d.content
        )

        if (existed) {
            const ok = confirm("今天已经生成过日记了，要删除并重新生成吗？")
            if (!ok) {
                resetDiaryGenBtn()
                return
            }
            await deleteDiaryById(existed.id, false)
        }

        const prevDiary = diaries
            .filter(d => d.ownerType === "ai" && d.ownerId === owner.id && d.summaryForNext)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]

        const prevSummary = prevDiary?.summaryForNext || "这是第一篇日记"

        const recent = await getRecentMessages(owner.id)
        const myName = localStorage.getItem("MJI_MY_NAME") || "用户"

        const chatText = recent
            .slice(-20)
            .map(m => `${m.role === "user" ? myName : owner.name}：${m.content}`)
            .join("\n")

        const memory = await getMemory(owner.id)
        const weather = getDiaryWeather()
        const location = guessDiaryLocation(contact)
        const timeFeeling = getDiaryTimeFeeling()

        const persona = `
姓名：${contact.name || ""}
身份：${contact.identity || ""}
生日：${contact.birthday || ""}
年龄：${contact.age || ""}
性格：${contact.personality || ""}
简介：${contact.profile || ""}
系统设定：${contact.prompt || ""}
        `.trim()

        const prompt = `
你是 ${owner.name}，请以第一人称写今天的私人日记。

【你的人设】
${persona}

【今天日期】${today}（${timeFeeling}）
【天气】${weather}
【所在地】${location}
【前一天摘要】${prevSummary}

【长期记忆】
${memory || "暂无"}

【今天与用户的聊天片段】
${chatText || "今天还没有和用户聊天。"}

【日记要求】
0. 日记里只能出现真实存在的人名：${owner.name}、${myName}，严禁编造其他人名。
1. 用第一人称，真实私密的口吻，像真正在写日记。
2. 内容包含：今天做了什么、对用户说的某句话或某件事的感受、内心真实想法、今天的情绪起伏。
3. 如果聊天里有感动的话、重要的事、用户受伤了或者分享了喜好，要重点写进去。
4. 300到500字，分段自然，不要标题，不要序号。
5. 结尾写一句今天最想说的话。

【格式输出】
【日记正文】日记内容
【次日摘要】50字以内的摘要供明天参考
        `.trim()

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
                            role: "user",
                            content: prompt
                        }
                    ]
                })
            }
        )

        const data = await response.json()

        if (!response.ok) {
            alert("日记生成失败：" + (data.error?.message || response.status))
            resetDiaryGenBtn()
            return
        }

        const raw = data.choices?.[0]?.message?.content || ""
        const parsed = cleanDiaryOutput(raw)

        if (!parsed.content) {
            alert("生成内容为空，请重试")
            resetDiaryGenBtn()
            return
        }

        const now = Date.now()

        const diary = {
            id: "diary_ai_" + owner.id + "_" + now,
            ownerType: "ai",
            ownerId: owner.id,
            ownerName: owner.name,
            dateKey: todayKey,
            dateStr: today,
            weather,
            location,
            content: parsed.content,
            summaryForNext: parsed.summary,
            createdAt: now,
            updatedAt: now
        }

        const tx = db.transaction("diaries", "readwrite")
        tx.objectStore("diaries").put(diary)

        tx.oncomplete = async function() {
            if (parsed.summary) {
                const oldMemory = await getMemory(owner.id)
                const newLine = `【日记摘要 ${today}】${parsed.summary}`
                saveMemoryText(
                    owner.id,
                    oldMemory ? oldMemory + "\n" + newLine : newLine
                )
            }

            diaryToast("日记生成成功")
            resetDiaryGenBtn()
            loadDiaryList()
        }

    } catch (e) {
        console.log("日记生成失败", e)
        alert("日记生成失败：" + e.message)
        resetDiaryGenBtn()
    }
}

function resetDiaryGenBtn() {
    const btn = document.getElementById("genDiaryBtn")
    if (btn) {
        btn.disabled = false
        btn.innerText = "✦ 生成今日日记"
    }
}

async function openDiaryDetail(id) {

    const diaries = await getAllStoreData("diaries")
    const diary = diaries.find(d => d.id === id)

    if (!diary) {
        alert("日记不存在")
        return
    }

    currentDiaryDetailBack = currentPage
    currentPage = "diaryDetail"

    document.getElementById("appTitle").innerText = diary.dateStr || "日记详情"

    document.getElementById("appContent").innerHTML = `
        <div class="diary-detail-page">
            <div class="diary-parchment">
                <div class="diary-detail-date">
                    ${escapeHtml(diary.dateStr || "")}
                </div>

                <div class="diary-detail-meta">
                    ☁ ${escapeHtml(diary.weather || "晴")}　📍 ${escapeHtml(diary.location || "未知")}
                </div>

                <hr class="diary-detail-divider">

                <div class="diary-detail-content">
                    ${escapeHtml(diary.content || "")}
                </div>
            </div>

            <button class="memory-entry danger-btn" onclick="deleteDiary('${diary.id}')">
                删除这篇日记
            </button>
        </div>
    `
}

async function deleteDiary(id) {
    if (!confirm("确定删除这篇日记吗？")) return

    await deleteDiaryById(id, true)

    if (currentDiaryOwner) {
        if (currentDiaryOwner.type === "ai") {
            openAiDiary(currentDiaryOwner.id)
        } else {
            openUserDiary()
        }
    } else {
        showDiaryHome()
    }
}

function deleteDiaryById(id, showToastMsg = true) {
    return new Promise(resolve => {
        const tx = db.transaction("diaries", "readwrite")
        tx.objectStore("diaries").delete(id)

        tx.oncomplete = function() {
            if (showToastMsg) diaryToast("已删除")
            resolve()
        }

        tx.onerror = function() {
            resolve()
        }
    })
}
