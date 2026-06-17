let desktopPageIndex = 0
let desktopLongPressTimer = null
let desktopClockTimer = null
let fakeMusicPlaying = false

function initDesktop() {
    loadDesktopWallpaper()
    renderDesktopTime()
    renderDesktopCalendar()
    renderDesktopWeather()
    renderMusicWidget()
    bindDesktopWallpaperPicker()

    if (desktopClockTimer) {
        clearInterval(desktopClockTimer)
    }

    desktopClockTimer = setInterval(function() {
        renderDesktopTime()
    }, 1000)
}

function bindDesktopWallpaperPicker() {
    const root = document.getElementById("desktopRoot")
    const file = document.getElementById("desktopWallpaperFile")
    const musicFile = document.getElementById("musicCoverFile")

    if (file) {
        file.onchange = async function() {
            const picked = file.files?.[0]
            if (!picked) return

            const base64 = await fileToBase64(picked)
            localStorage.setItem("MJI_DESKTOP_WALLPAPER", base64)
            loadDesktopWallpaper()
            file.value = ""
        }
    }

    if (musicFile) {
        musicFile.onchange = async function() {
            const picked = musicFile.files?.[0]
            if (!picked) return

            const base64 = await fileToBase64(picked)
            localStorage.setItem("MJI_CURRENT_SONG_COVER", base64)
            renderMusicWidget()
            musicFile.value = ""
        }
    }

    if (!root || root.dataset.wallpaperBound === "1") return

    root.dataset.wallpaperBound = "1"

    root.addEventListener("pointerdown", function(e) {
        if (e.target.closest("button") || e.target.closest(".screen") || e.target.closest(".music-widget") || e.target.closest(".calendar-card")) {
            return
        }

        desktopLongPressTimer = setTimeout(function() {
            const picker = document.getElementById("desktopWallpaperFile")
            if (picker) picker.click()
        }, 650)
    })

    root.addEventListener("pointerup", function() {
        clearTimeout(desktopLongPressTimer)
    })

    root.addEventListener("pointerleave", function() {
        clearTimeout(desktopLongPressTimer)
    })
}

function loadDesktopWallpaper() {
    const bg = document.getElementById("desktopBg")
    if (!bg) return

    const saved = localStorage.getItem("MJI_DESKTOP_WALLPAPER") || ""

    if (saved) {
        bg.style.backgroundImage = `url(${saved})`
    } else {
        bg.style.backgroundImage = "radial-gradient(circle at 18% 10%, rgba(255,255,255,.12), transparent 24%), radial-gradient(circle at 84% 82%, rgba(196,208,236,.20), transparent 30%), linear-gradient(180deg,#747479 0%,#69696e 100%)"
    }
}

function renderDesktopTime() {
    const el = document.getElementById("desktopTime")
    if (!el) return

    const d = new Date()
    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")
    el.textContent = h + ":" + m
}

function renderDesktopWeather() {
    const el = document.getElementById("desktopWeather")
    if (!el) return

    const weather = localStorage.getItem("MJI_DESKTOP_WEATHER") || "☁️ 22°C 多云"
    el.textContent = weather
}

function renderDesktopCalendar() {
    const title = document.getElementById("calendarTitle")
    const days = document.getElementById("calendarDays")
    if (!title || !days) return

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()

    title.textContent = `${year}年${month + 1}月`

    const start = new Date(year, month, today)
    start.setDate(today - start.getDay())

    let html = ""

    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const isToday = d.getFullYear() === year && d.getMonth() === month && d.getDate() === today

        html += `<span class="${isToday ? "today" : ""}">${d.getDate()}</span>`
    }

    days.innerHTML = html
}

function renderMusicWidget() {
    const title = document.getElementById("musicTitle")
    const artist = document.getElementById("musicArtist")
    const cover = document.getElementById("musicCover")
    const bar = document.getElementById("musicBar")

    if (!title || !artist || !cover || !bar) return

    const song = localStorage.getItem("MJI_CURRENT_SONG") || "点击打开电台"
    const singer = localStorage.getItem("MJI_CURRENT_SONG_ARTIST") || "—"
    const coverImg = localStorage.getItem("MJI_CURRENT_SONG_COVER") || ""
    const progress = Number(localStorage.getItem("MJI_CURRENT_SONG_PROGRESS") || "0")

    title.textContent = song
    artist.textContent = singer
    bar.style.width = Math.max(0, Math.min(100, progress)) + "%"

    if (coverImg) {
        cover.style.backgroundImage = `url(${coverImg})`
        cover.textContent = ""
    } else {
        cover.style.backgroundImage = ""
        cover.textContent = "♪"
    }
}

function pickMusicCover() {
    const picker = document.getElementById("musicCoverFile")
    if (picker) picker.click()
}

function toggleFakeMusicPlay() {
    fakeMusicPlaying = !fakeMusicPlaying
    const btn = document.getElementById("musicPlayBtn")
    if (btn) btn.textContent = fakeMusicPlaying ? "⏸" : "▶"
}

function setDesktopPage(index) {
    desktopPageIndex = index

    const pages = document.getElementById("desktopPages")
    const dot0 = document.getElementById("dot0")
    const dot1 = document.getElementById("dot1")

    if (pages) {
        pages.style.transform = `translateX(-${index * 50}%)`
    }

    if (dot0 && dot1) {
        dot0.classList.toggle("active", index === 0)
        dot1.classList.toggle("active", index === 1)
    }
}

function openDesktopPlaceholder(title, text) {
    currentPage = "desktopPlaceholder"

    document
        .getElementById("screen")
        .classList
        .remove("hidden")

    document.getElementById("appTitle").innerText = title

    document.getElementById("appContent").innerHTML = `
        <div class="desktop-placeholder">
            <div class="desktop-placeholder-icon">✦</div>
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(text || "这个功能后面迁移。")}</p>
        </div>
    `
}

document.addEventListener("DOMContentLoaded", initDesktop)
