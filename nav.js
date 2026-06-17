function ensureWeatherStyles() {
    if (document.getElementById("weatherStyle")) return
    const style = document.createElement("style")
    style.id = "weatherStyle"
    style.textContent = `
        .weather-shell{min-height:100%;background:linear-gradient(180deg,#0f172a,#1e293b);color:#fff;padding:20px 18px 40px;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;}
        .weather-title{font-size:24px;font-weight:800;margin-top:4px;}
        .weather-sub{font-size:13px;color:rgba(255,255,255,.62);margin-top:6px;line-height:1.7;}
        .weather-card{margin-top:20px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);border-radius:22px;padding:18px;box-shadow:0 18px 40px rgba(0,0,0,.16);backdrop-filter:blur(18px);}
        .weather-input-row{display:flex;gap:10px;align-items:center;}
        .weather-input{flex:1;min-width:0;border:0;outline:0;border-radius:16px;padding:13px 14px;background:rgba(255,255,255,.13);color:#fff;font-size:15px;}
        .weather-input::placeholder{color:rgba(255,255,255,.45);}
        .weather-btn{border:0;border-radius:16px;background:#38bdf8;color:#082f49;font-weight:800;padding:13px 15px;font-size:14px;}
        .weather-display{margin-top:18px;min-height:160px;display:flex;align-items:center;justify-content:center;text-align:center;white-space:pre-wrap;line-height:1.9;font-size:16px;color:rgba(255,255,255,.9);}
        .weather-big{font-size:34px;font-weight:900;margin-bottom:6px;}
        .weather-tip{margin-top:16px;font-size:12px;color:rgba(255,255,255,.5);line-height:1.8;}
        .weather-fail{color:#fecaca;}
        .weather-loading{color:#bae6fd;}
    `
    document.head.appendChild(style)
}

function showWeatherHome() {
    ensureWeatherStyles()
    currentPage = "weatherHome"
    const root = document.getElementById("weatherRoot") || document.getElementById("appContent")
    const lastCity = localStorage.getItem("MJI_LAST_CITY") || ""
    const cyberWeather = localStorage.getItem("MJI_CYBER_WEATHER") || "等待接收真实卫星信号..."
    root.innerHTML = `
        <div class="weather-shell">
            <div class="weather-title">天气</div>
            <div class="weather-sub">输入城市名，抓取现实天气。结果会同步到桌面天气卡，也会作为角色行程生成时的天气参考。</div>
            <div class="weather-card">
                <div class="weather-input-row">
                    <input class="weather-input" id="weatherCityInput" placeholder="例如：东京 / 都匀 / 贵阳" value="${escapeHtml(lastCity)}">
                    <button class="weather-btn" onclick="fetchPwaWeather()">抓取</button>
                </div>
                <div class="weather-display" id="weatherDisplay">${escapeHtml(cyberWeather)}</div>
                <div class="weather-tip">数据源：wttr.in。若失败，通常是城市名不对、网络拦截或浏览器跨域限制。</div>
            </div>
        </div>
    `
}

async function fetchPwaWeather() {
    const input = document.getElementById("weatherCityInput")
    const display = document.getElementById("weatherDisplay")
    const city = (input?.value || "").trim()
    if (!city) {
        display.innerHTML = `<span class="weather-fail">填个城市名。</span>`
        return
    }
    localStorage.setItem("MJI_LAST_CITY", city)
    display.innerHTML = `<span class="weather-loading">🛰️ 正在抓取现实天气...</span>`
    try {
        const encoded = encodeURIComponent(city)
        const url = `https://wttr.in/${encoded}?format=%C+%t`
        const resp = await fetch(url, { cache: "no-store" })
        let raw = (await resp.text()).trim().replaceAll("+", "")
        if (!resp.ok || !raw || /Unknown|ERROR|404/i.test(raw)) {
            throw new Error("雷达找不到这个地方")
        }
        const finalWeather = `【当前${city}天气】：${raw}`
        localStorage.setItem("MJI_CYBER_WEATHER", finalWeather)
        display.innerHTML = `<div><div class="weather-big">☁️</div>${escapeHtml(finalWeather)}</div>`
        updateDesktopWeatherCard(finalWeather)
        alert("现实天气已同步")
    } catch (e) {
        display.innerHTML = `<span class="weather-fail">❌ 天气抓取失败：${escapeHtml(e.message || "网络错误")}</span>`
    }
}

function updateDesktopWeatherCard(text) {
    const el = document.getElementById("desktopWeather")
    if (!el) return
    const shortText = String(text || "").replace(/^【当前/, "").replace(/天气】：/, " ")
    el.textContent = shortText.length > 18 ? shortText.slice(0, 18) + "…" : shortText
}

window.addEventListener("load", function(){
    const saved = localStorage.getItem("MJI_CYBER_WEATHER")
    if (saved) updateDesktopWeatherCard(saved)
})
