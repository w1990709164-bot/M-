let currentScheduleContact = null
let scheduleTimer = null

function scheduleDateKey(offsetDays = 0) {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

function scheduleDateLabel() {
    return new Date().toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long"
    })
}

function getContactDisplayName(contact) {
    return contact?.name || contact?.realName || contact?.aiName || "未命名角色"
}

function getContactPersona(contact) {
    return [
        contact?.prompt,
        contact?.profile,
        contact?.identity,
        contact?.identityInfo,
        contact?.personality,
        contact?.description
    ].filter(Boolean).join("\n")
}

function scheduleAvatar(contact, size = 42) {
    const src = contact?.avatar || contact?.avatarUri || ""
    const name = getContactDisplayName(contact)
    const initial = escapeHtml(name.slice(0, 1) || "？")
    if (src && isImageSrc(src)) {
        return `<div class="schedule-avatar" style="width:${size}px;height:${size}px"><img src="${escapeHtml(src)}" onerror="this.parentNode.innerHTML='${initial}'"></div>`
    }
    return `<div class="schedule-avatar" style="width:${size}px;height:${size}px">${initial}</div>`
}

function ensureScheduleStyles() {
    if (document.getElementById("scheduleStyle")) return
    const style = document.createElement("style")
    style.id = "scheduleStyle"
    style.textContent = `
        .schedule-shell{min-height:100%;background:#f2f2f6;color:#111;padding-bottom:28px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;}
        .schedule-hero{padding:18px 16px 10px;background:#fff;border-bottom:1px solid rgba(0,0,0,.06);}
        .schedule-title{font-size:22px;font-weight:800;letter-spacing:-.3px;}
        .schedule-sub{font-size:12px;color:#888;margin-top:5px;line-height:1.6;}
        .schedule-contact-list{padding:12px;display:flex;flex-direction:column;gap:10px;}
        .schedule-contact-card{display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:13px 14px;box-shadow:0 3px 12px rgba(0,0,0,.04);border:1px solid rgba(0,0,0,.04);}
        .schedule-contact-card:active{transform:scale(.99);}
        .schedule-avatar{border-radius:50%;background:linear-gradient(135deg,#d8d8e8,#f3f3f8);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;font-weight:700;color:#666;}
        .schedule-avatar img{width:100%;height:100%;object-fit:cover;}
        .schedule-contact-main{flex:1;min-width:0;}
        .schedule-contact-name{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .schedule-contact-desc{font-size:12px;color:#888;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .schedule-arrow{font-size:22px;color:#bbb;}
        .schedule-detail-head{position:sticky;top:0;z-index:2;background:rgba(242,242,246,.96);backdrop-filter:blur(14px);padding:12px 14px;border-bottom:1px solid rgba(0,0,0,.05);}
        .schedule-detail-row{display:flex;align-items:center;gap:10px;}
        .schedule-detail-name{font-size:16px;font-weight:800;}
        .schedule-status{font-size:12px;color:#888;margin-top:3px;}
        .schedule-reset{margin-left:auto;border:0;background:#ff3b30;color:#fff;border-radius:14px;padding:7px 12px;font-size:12px;}
        .schedule-body{padding:12px 16px 34px;}
        .schedule-date{font-size:12px;color:#888;margin:2px 0 12px;}
        .schedule-accident{background:#2d2d1a;border-left:3px solid #ffd60a;border-radius:12px;padding:12px 14px;margin-bottom:16px;box-shadow:0 3px 12px rgba(0,0,0,.05);}
        .schedule-accident-k{font-size:11px;color:#ffd60a;font-weight:800;margin-bottom:4px;}
        .schedule-accident-t{font-size:13px;color:#fffde8;line-height:1.65;}
        .schedule-accident-tr{font-size:12px;color:rgba(255,255,220,.72);line-height:1.55;margin-top:4px;font-style:italic;}
        .schedule-timeline-item{display:flex;gap:12px;}
        .schedule-time-col{display:flex;flex-direction:column;align-items:center;width:48px;flex-shrink:0;}
        .schedule-time{font-size:12px;color:#888;margin-bottom:6px;white-space:nowrap;}
        .schedule-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
        .schedule-dot-normal{background:#d0d0d0;border:2px solid #bbb;}
        .schedule-dot-active{background:#fff;border:3px solid #34c759;box-shadow:0 0 0 3px rgba(52,199,89,.2);}
        .schedule-dot-done{background:#34c759;border:2px solid #34c759;}
        .schedule-line{width:2px;flex:1;background:#e0e0e0;min-height:44px;margin-top:4px;}
        .schedule-card{flex:1;background:#fff;border-radius:14px;padding:12px 14px;margin-bottom:10px;box-shadow:0 3px 12px rgba(0,0,0,.035);}
        .schedule-event{font-size:15px;color:#111;font-weight:600;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
        .schedule-trans{font-size:12px;color:#777;margin-top:5px;line-height:1.5;white-space:pre-wrap;word-break:break-word;}
        .schedule-mood{font-size:12px;color:#888;margin-top:7px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}
        .schedule-done .schedule-event{text-decoration:line-through;color:#bbb;}
        .schedule-done .schedule-card{background:#f7f7f7;}
        .schedule-done .schedule-time,.schedule-done .schedule-mood{color:#ccc;}
        .schedule-empty{padding:48px 20px;text-align:center;color:#999;font-size:14px;line-height:2;}
        .schedule-loading{padding:42px 18px;text-align:center;color:#666;font-size:14px;line-height:2;}
        .schedule-spinner{width:28px;height:28px;margin:0 auto 12px;border:3px solid #e6e6ee;border-top-color:#34c759;border-radius:50%;animation:scheduleSpin .9s linear infinite;}
        @keyframes scheduleSpin{to{transform:rotate(360deg)}}
    `
    document.head.appendChild(style)
}

async function showScheduleHome() {
    ensureScheduleStyles()
    currentPage = "scheduleHome"
    clearInterval(scheduleTimer)
    const root = document.getElementById("scheduleRoot") || document.getElementById("appContent")
    if (!root) return

    const contacts = await getAllStoreData("contacts")
    const validContacts = contacts.filter(c => c && c.id)

    root.innerHTML = `
        <div class="schedule-shell">
            <div class="schedule-hero">
                <div class="schedule-title">今日行程</div>
                <div class="schedule-sub">选择角色，查看 TA 今天的时间线。没有行程时会自动生成。</div>
            </div>
            <div class="schedule-contact-list">
                ${validContacts.length ? validContacts.map(c => `
                    <div class="schedule-contact-card" onclick="openScheduleDetail('${escapeHtml(c.id)}')">
                        ${scheduleAvatar(c, 44)}
                        <div class="schedule-contact-main">
                            <div class="schedule-contact-name">${escapeHtml(getContactDisplayName(c))}</div>
                            <div class="schedule-contact-desc">${escapeHtml((getContactPersona(c) || "点击生成今日行程").slice(0, 50))}</div>
                        </div>
                        <div class="schedule-arrow">›</div>
                    </div>
                `).join("") : `<div class="schedule-empty">暂无角色<br>先去联系人里添加角色</div>`}
            </div>
        </div>
    `
}

async function openScheduleDetail(contactId) {
    ensureScheduleStyles()
    currentPage = "scheduleDetail"
    const contacts = await getAllStoreData("contacts")
    const contact = contacts.find(c => c.id === contactId)
    if (!contact) {
        alert("没找到这个角色")
        showScheduleHome()
        return
    }
    currentScheduleContact = contact
    renderScheduleFrame(contact, "正在读取今日行程…")
    await loadScheduleForContact(contact)
    clearInterval(scheduleTimer)
    scheduleTimer = setInterval(() => {
        if (currentPage === "scheduleDetail" && currentScheduleContact) {
            loadScheduleForContact(currentScheduleContact, true)
        }
    }, 60000)
}

function renderScheduleFrame(contact, statusText) {
    const root = document.getElementById("scheduleRoot") || document.getElementById("appContent")
    root.innerHTML = `
        <div class="schedule-shell">
            <div class="schedule-detail-head">
                <div class="schedule-detail-row">
                    ${scheduleAvatar(contact, 34)}
                    <div>
                        <div class="schedule-detail-name">${escapeHtml(getContactDisplayName(contact))}</div>
                        <div class="schedule-status" id="scheduleStatus">${escapeHtml(statusText || "")}</div>
                    </div>
                    <button class="schedule-reset" onclick="resetScheduleToday()">重排</button>
                </div>
            </div>
            <div class="schedule-body" id="scheduleBody">
                <div class="schedule-loading"><div class="schedule-spinner"></div>${escapeHtml(statusText || "角色正在安排今天…")}</div>
            </div>
        </div>
    `
}

async function loadScheduleForContact(contact, silent = false) {
    const dateKey = scheduleDateKey()
    const all = await getAllStoreData("schedules")
    const items = all
        .filter(x => x.contactId === contact.id && x.dateKey === dateKey)
        .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")))

    if (items.length) {
        document.getElementById("scheduleStatus").textContent = "已生成今日行程"
        renderScheduleItems(items)
        return
    }

    if (silent) return
    document.getElementById("scheduleStatus").textContent = "正在生成今日行程…"
    document.getElementById("scheduleBody").innerHTML = `<div class="schedule-loading"><div class="schedule-spinner"></div>角色正在安排今天…</div>`
    await generateScheduleForContact(contact)
}

async function resetScheduleToday() {
    if (!currentScheduleContact) return
    if (!confirm("清空今日行程并重新生成？")) return
    const dateKey = scheduleDateKey()
    const all = await getAllStoreData("schedules")
    const keep = all.filter(x => !(x.contactId === currentScheduleContact.id && x.dateKey === dateKey))
    await restoreStoreClear("schedules", keep)
    await loadScheduleForContact(currentScheduleContact)
}

function restoreStoreClear(storeName, data) {
    return new Promise(resolve => {
        const tx = db.transaction(storeName, "readwrite")
        const store = tx.objectStore(storeName)
        const clearReq = store.clear()
        clearReq.onsuccess = () => data.forEach(item => store.put(item))
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}

function minutesFromTime(t) {
    const m = String(t || "").match(/(\d{1,2}):(\d{2})/)
    if (!m) return 9999
    return Number(m[1]) * 60 + Number(m[2])
}

function renderScheduleItems(items) {
    const body = document.getElementById("scheduleBody")
    if (!body) return
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const accident = items.find(x => x.accident)?.accident || ""
    let accidentMain = ""
    let accidentTrans = ""
    if (accident) {
        const parts = String(accident).split("\n")
        accidentMain = parts[0] || ""
        accidentTrans = parts.slice(1).join("\n")
    }

    const accidentHtml = accidentMain ? `
        <div class="schedule-accident">
            <div class="schedule-accident-k">⚡ 意外</div>
            <div class="schedule-accident-t">${escapeHtml(accidentMain)}</div>
            ${accidentTrans ? `<div class="schedule-accident-tr">${escapeHtml(accidentTrans)}</div>` : ""}
        </div>
    ` : ""

    const html = items.map((item, i) => {
        const itemMinutes = minutesFromTime(item.time)
        const nextMinutes = i < items.length - 1 ? minutesFromTime(items[i + 1].time) : itemMinutes + 60
        const isDone = nowMinutes >= nextMinutes
        const isActive = nowMinutes >= itemMinutes && nowMinutes < nextMinutes
        const doneClass = isDone ? "schedule-done" : ""
        const dotClass = isDone ? "schedule-dot-done" : (isActive ? "schedule-dot-active" : "schedule-dot-normal")
        return `
            <div class="schedule-timeline-item ${doneClass}">
                <div class="schedule-time-col">
                    <div class="schedule-time">${escapeHtml(item.time || "")}</div>
                    <div class="schedule-dot ${dotClass}"></div>
                    ${i < items.length - 1 ? `<div class="schedule-line"></div>` : ""}
                </div>
                <div class="schedule-card">
                    <div class="schedule-event">${escapeHtml(item.event || "")}</div>
                    ${item.transEvent ? `<div class="schedule-trans">${escapeHtml(item.transEvent)}</div>` : ""}
                    ${item.mood ? `<div class="schedule-mood">💭 ${escapeHtml(item.mood)}</div>` : ""}
                </div>
            </div>
        `
    }).join("")

    body.innerHTML = `
        <div class="schedule-date">${escapeHtml(scheduleDateLabel())} · 已生成今日行程</div>
        ${accidentHtml}
        ${html}
    `
}

async function generateScheduleForContact(contact) {
    try {
        const apiBase = localStorage.getItem("MJI_API_BASE") || ""
        const apiKey = localStorage.getItem("MJI_API_KEY") || ""
        const model = localStorage.getItem("MJI_API_MODEL") || ""
        if (!apiBase || !apiKey) {
            document.getElementById("scheduleStatus").textContent = "未配置API"
            document.getElementById("scheduleBody").innerHTML = `<div class="schedule-empty">先去设置里填 API</div>`
            return
        }

        const all = await getAllStoreData("schedules")
        const yesterday = scheduleDateKey(-1)
        const yesterdaySummary = all
            .filter(x => x.contactId === contact.id && x.dateKey === yesterday)
            .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")))
            .map(x => `【${x.time}】${x.event}`)
            .join("\n")

        const myName = localStorage.getItem("MJI_MY_NAME") || "我"
        const weather = localStorage.getItem("MJI_CYBER_WEATHER") || ""
        const persona = getContactPersona(contact)
        const name = getContactDisplayName(contact)
        const prompt = `
你是 ${name}，人设：${persona || "未填写"}。
用户的名字是「${myName}」。行程和心情中如果涉及用户，必须直接用「${myName}」，严禁出现占位符。
请生成你自己今天的完整行程，包含5到7个时间节点。
每条行程必须包含：时间、行程描述、此刻心情（一句话，第一人称内心独白）。
另外生成1条今天遇到的小意外（真实感，不夸张）。
${weather ? `【当前真实天气参考】：${weather}` : ""}
${yesterdaySummary ? `【昨日行程参考】：\n${yesterdaySummary}\n请保持一定连贯性。` : ""}

严格按以下JSON格式输出，只输出JSON不要其他内容：
{
  "accident": "今天遇到的小意外描述",
  "schedule": [
    {"time": "05:30", "event": "行程描述", "mood": "心情独白"},
    {"time": "08:00", "event": "行程描述", "mood": "心情独白"}
  ]
}
        `.trim()

        const resp = await fetch(getChatApiUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + apiKey
            },
            body: JSON.stringify({
                model,
                temperature: 0.6,
                messages: [{ role: "user", content: prompt }]
            })
        })
        if (!resp.ok) throw new Error("HTTP " + resp.status)
        const data = await resp.json()
        const raw = data.choices?.[0]?.message?.content?.trim() || ""
        const jsonText = (raw.match(/\{[\s\S]*\}/) || [raw])[0].replace(/```json|```/g, "").trim()
        const parsed = JSON.parse(jsonText)
        const arr = Array.isArray(parsed.schedule) ? parsed.schedule : []
        if (!arr.length) throw new Error("行程为空")

        const dateKey = scheduleDateKey()
        const keep = all.filter(x => !(x.contactId === contact.id && x.dateKey === dateKey))
        const accidentRaw = String(parsed.accident || "").trim()
        let accidentMain = accidentRaw
        let accidentTrans = ""
        if (accidentRaw.includes("【翻译】")) {
            accidentMain = accidentRaw.split("【翻译】")[0].trim()
            accidentTrans = accidentRaw.split("【翻译】").slice(1).join("【翻译】").trim()
        }

        const newItems = arr.slice(0, 7).map((s, i) => {
            const eventData = splitTranslate(s.event || "")
            const moodData = splitTranslate(s.mood || "")
            return {
                id: `sch_${contact.id}_${dateKey}_${i}_${Date.now()}`,
                contactId: contact.id,
                contactName: name,
                dateKey,
                time: String(s.time || "").trim(),
                event: eventData.main,
                transEvent: eventData.trans,
                mood: moodData.main,
                accident: i === 0 ? (accidentTrans ? `${accidentMain}\n${accidentTrans}` : accidentMain) : "",
                createdAt: Date.now()
            }
        }).filter(x => x.time && x.event)

        await restoreStoreClear("schedules", keep.concat(newItems))
        document.getElementById("scheduleStatus").textContent = "已生成今日行程"
        renderScheduleItems(newItems.sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))))
    } catch (e) {
        console.error(e)
        document.getElementById("scheduleStatus").textContent = "生成失败"
        document.getElementById("scheduleBody").innerHTML = `<div class="schedule-empty">生成失败：${escapeHtml(e.message || "未知错误")}<br><button class="schedule-reset" onclick="resetScheduleToday()">重新生成</button></div>`
    }
}

function splitTranslate(text) {
    let t = String(text || "").trim()
    let main = t
    let trans = ""
    if (t.includes("【翻译】")) {
        main = t.split("【翻译】")[0].trim()
        trans = t.split("【翻译】").slice(1).join("【翻译】").trim()
    } else if (t.includes("|翻译:")) {
        main = t.split("|翻译:")[0].trim()
        trans = t.split("|翻译:").slice(1).join("|翻译:").trim()
    }
    return { main, trans }
}
