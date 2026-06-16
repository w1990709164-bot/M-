function showSettings() {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""
    const apiKey = localStorage.getItem("MJI_API_KEY") || ""
    const apiModel = localStorage.getItem("MJI_API_MODEL") || ""
    const contextCount = localStorage.getItem("MJI_CONTEXT_COUNT") || "20"
    const npcAutoEnabled = localStorage.getItem("MJI_NPC_AUTO_ENABLED") !== "false"

    const imgBase = localStorage.getItem("MJI_IMG_API_BASE") || ""
    const imgKey = localStorage.getItem("MJI_IMG_API_KEY") || ""
    const imgModel = localStorage.getItem("MJI_IMG_MODEL") || "gpt-image-1"
    const imgPositive = localStorage.getItem("MJI_IMG_POSITIVE") || ""
    const imgNegative = localStorage.getItem("MJI_IMG_NEGATIVE") || ""

    const ttsProvider = localStorage.getItem("MJI_TTS_PROVIDER") || "siliconflow"
    const ttsApiKey = localStorage.getItem("MJI_TTS_API_KEY") || ""
    const siliconVoice = localStorage.getItem("MJI_TTS_SILICON_VOICE") || "FunAudioLLM/CosyVoice2-0.5B"
    const guannanApiKey = localStorage.getItem("MJI_GUANNAN_API_KEY") || ""
    const guannanVoice = localStorage.getItem("MJI_GUANNAN_VOICE") || "krueger"
    const guannanLang = localStorage.getItem("MJI_GUANNAN_LANG") || "en"
    const sttApiBase = localStorage.getItem("MJI_STT_API_BASE") || "https://api.siliconflow.cn/v1"
    const sttApiKey = localStorage.getItem("MJI_STT_API_KEY") || ""
    const sttModel = localStorage.getItem("MJI_STT_MODEL") || "iic/SenseVoiceSmall"

    document.getElementById("appContent").innerHTML = `
        <div class="settings-page">
            <div class="settings-card">
                <div class="settings-title">API 设置</div>

                <input id="apiBase" placeholder="API站子链接，例如 https://api.openai.com/v1" value="${escapeHtml(apiBase)}">
                <input id="apiKey" placeholder="API密钥" value="${escapeHtml(apiKey)}">
                <input id="apiModel" placeholder="模型名，例如 gpt-4o-mini" value="${escapeHtml(apiModel)}">
                <input id="contextCount" placeholder="上下文条数，例如 20" value="${escapeHtml(contextCount)}">

                <select id="npcAutoEnabled">
                    <option value="true" ${npcAutoEnabled ? "selected" : ""}>允许AI主动发消息</option>
                    <option value="false" ${!npcAutoEnabled ? "selected" : ""}>关闭AI主动发消息</option>
                </select>

                <label class="file-label">我的头像</label>
                <input type="file" id="myAvatarFile" accept="image/*">

                <label class="file-label">默认聊天背景</label>
                <input type="file" id="chatBgFile" accept="image/*">

                <button onclick="saveSettings()">保存设置</button>
            </div>

            <div class="settings-card">
                <div class="settings-title">生图 API 设置</div>
                <p class="settings-desc">梦男之家同人图、后续角色发图会用这里。兼容 OpenAI /images/generations、Gemini 图片模型、Replicate predictions。</p>

                <input id="imgBase" placeholder="生图站子链接，例如 https://api.openai.com/v1" value="${escapeHtml(imgBase)}">
                <input id="imgKey" placeholder="生图API密钥" value="${escapeHtml(imgKey)}">
                <input id="imgModel" placeholder="生图模型，例如 gpt-image-1 / dall-e-3 / gemini-2.0-flash-preview-image-generation" value="${escapeHtml(imgModel)}">
                <textarea id="imgPositive" placeholder="固定正向词，可空" style="min-height:70px">${escapeHtml(imgPositive)}</textarea>
                <textarea id="imgNegative" placeholder="固定负向词，可空" style="min-height:70px">${escapeHtml(imgNegative)}</textarea>

                <button onclick="saveImageSettings()">保存生图设置</button>
            </div>

            <div class="settings-card">
                <div class="settings-title">TTS / 通话语音 API 设置</div>
                <p class="settings-desc">角色语音、电话通话、电台朗读会优先读取这里。支持硅基流动和朋友服务器；通话语音识别 STT 也放这里。</p>

                <label class="file-label">TTS 服务商</label>
                <select id="ttsProvider">
                    <option value="siliconflow" ${ttsProvider === "siliconflow" ? "selected" : ""}>硅基流动 SiliconFlow</option>
                    <option value="guannan" ${ttsProvider === "guannan" ? "selected" : ""}>朋友服务器 Guannan</option>
                </select>

                <input id="ttsApiKey" placeholder="硅基流动 TTS API Key" value="${escapeHtml(ttsApiKey)}">
                <input id="siliconVoice" placeholder="硅基默认音色 ID，例如 FunAudioLLM/CosyVoice2-0.5B" value="${escapeHtml(siliconVoice)}">

                <input id="guannanApiKey" placeholder="朋友服务器 API Key" value="${escapeHtml(guannanApiKey)}">
                <select id="guannanVoice">
                    ${["keegan","krueger","ghostNew","ghostOld","konig","nikto"].map(v => `<option value="${v}" ${guannanVoice === v ? "selected" : ""}>${v}</option>`).join("")}
                </select>
                <input id="guannanLang" placeholder="朋友服务器目标语言，例如 en / zh / ja" value="${escapeHtml(guannanLang)}">

                <div class="settings-title" style="font-size:15px;margin-top:16px">通话语音识别 STT</div>
                <input id="sttApiBase" placeholder="STT API 链接，例如 https://api.siliconflow.cn/v1" value="${escapeHtml(sttApiBase)}">
                <input id="sttApiKey" placeholder="STT API Key，可空；空则回退用 TTS Key" value="${escapeHtml(sttApiKey)}">
                <input id="sttModel" placeholder="STT 模型，例如 iic/SenseVoiceSmall" value="${escapeHtml(sttModel)}">

                <button onclick="saveTtsSettings()">保存 TTS / 通话语音设置</button>
            </div>

            <div class="settings-card">
                <div class="settings-title">数据备份</div>
                <p class="settings-desc">会导出联系人、聊天、群聊、朋友圈、日记、世界书、论坛、信箱、盲盒、梦男之家、一起读、番茄钟和生图设置。</p>

                <button onclick="exportBackup()">导出备份</button>

                <input type="file" id="backupFile" accept=".json,application/json">

                <button onclick="importBackup()">导入备份</button>
            </div>
        </div>
    `
}

async function saveSettings(){
    const apiBase = document.getElementById("apiBase").value.trim()
    const apiKey = document.getElementById("apiKey").value.trim()
    const apiModel = document.getElementById("apiModel").value.trim()
    const contextCount = document.getElementById("contextCount").value.trim() || "20"
    const npcAutoEnabled = document.getElementById("npcAutoEnabled").value
    const avatarFile = document.getElementById("myAvatarFile")?.files[0]
    const bgFile = document.getElementById("chatBgFile")?.files[0]

    if (!apiBase || !apiKey || !apiModel) {
        alert("API链接、密钥、模型名都要填")
        return
    }

    localStorage.setItem("MJI_API_BASE", apiBase)
    localStorage.setItem("MJI_API_KEY", apiKey)
    localStorage.setItem("MJI_API_MODEL", apiModel)
    localStorage.setItem("MJI_CONTEXT_COUNT", contextCount)
    localStorage.setItem("MJI_NPC_AUTO_ENABLED", npcAutoEnabled)

    if (avatarFile) {
        const avatarBase64 = await fileToBase64(avatarFile)
        localStorage.setItem("MJI_MY_AVATAR", avatarBase64)
    }

    if (bgFile) {
        const bgBase64 = await fileToBase64(bgFile)
        localStorage.setItem("MJI_CHAT_BG", bgBase64)
    }

    alert("保存成功")
}

function saveImageSettings(){
    const imgBase = document.getElementById("imgBase")?.value.trim() || ""
    const imgKey = document.getElementById("imgKey")?.value.trim() || ""
    const imgModel = document.getElementById("imgModel")?.value.trim() || ""
    const imgPositive = document.getElementById("imgPositive")?.value.trim() || ""
    const imgNegative = document.getElementById("imgNegative")?.value.trim() || ""

    if (!imgBase || !imgKey || !imgModel) {
        alert("生图链接、密钥、模型名都要填")
        return
    }

    localStorage.setItem("MJI_IMG_API_BASE", imgBase)
    localStorage.setItem("MJI_IMG_API_KEY", imgKey)
    localStorage.setItem("MJI_IMG_MODEL", imgModel)
    localStorage.setItem("MJI_IMG_POSITIVE", imgPositive)
    localStorage.setItem("MJI_IMG_NEGATIVE", imgNegative)
    alert("生图设置已保存")
}


function saveTtsSettings(){
    const ttsProvider = document.getElementById("ttsProvider")?.value || "siliconflow"
    const ttsApiKey = document.getElementById("ttsApiKey")?.value.trim() || ""
    const siliconVoice = document.getElementById("siliconVoice")?.value.trim() || "FunAudioLLM/CosyVoice2-0.5B"
    const guannanApiKey = document.getElementById("guannanApiKey")?.value.trim() || ""
    const guannanVoice = document.getElementById("guannanVoice")?.value || "krueger"
    const guannanLang = document.getElementById("guannanLang")?.value.trim() || "en"
    const sttApiBase = document.getElementById("sttApiBase")?.value.trim() || "https://api.siliconflow.cn/v1"
    const sttApiKey = document.getElementById("sttApiKey")?.value.trim() || ""
    const sttModel = document.getElementById("sttModel")?.value.trim() || "iic/SenseVoiceSmall"

    localStorage.setItem("MJI_TTS_PROVIDER", ttsProvider)
    localStorage.setItem("MJI_TTS_API_KEY", ttsApiKey)
    localStorage.setItem("MJI_TTS_SILICON_VOICE", siliconVoice)
    localStorage.setItem("MJI_GUANNAN_API_KEY", guannanApiKey)
    localStorage.setItem("MJI_GUANNAN_VOICE", guannanVoice)
    localStorage.setItem("MJI_GUANNAN_LANG", guannanLang)
    localStorage.setItem("MJI_STT_API_BASE", sttApiBase)
    localStorage.setItem("MJI_STT_API_KEY", sttApiKey)
    localStorage.setItem("MJI_STT_MODEL", sttModel)

    alert("TTS / 通话语音设置已保存")
}



/* ============================================================
   Profile / Model dropdown / Image & Voice settings patch
   2026-06-16
   - 所有模型字段改成：拉取模型 + 下拉选择 + 手填兜底
   - 增加对话生图 / 角色动态生图
   - 增加角色语音消息相关全局设置
============================================================ */

(function(){
    if (window.__mjiProfileModelVoiceImageSettingsPatch) return
    window.__mjiProfileModelVoiceImageSettingsPatch = true

    function safeJsonParse(raw, fallback){
        try { return JSON.parse(raw) } catch(e) { return fallback }
    }

    function getModelCache(key){
        return safeJsonParse(localStorage.getItem("MJI_MODEL_CACHE_" + key) || "[]", [])
    }

    function setModelCache(key, list){
        localStorage.setItem("MJI_MODEL_CACHE_" + key, JSON.stringify((list || []).filter(Boolean)))
    }

    function modelSelectOptions(cacheKey, selected){
        const list = Array.from(new Set([selected, ...getModelCache(cacheKey)]))
            .filter(v => String(v || "").trim())
        return list.map(v => `<option value="${escapeHtml(v)}" ${v === selected ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")
    }

    function modelPickerHtml(title, cacheKey, selectId, manualId, selected, hint){
        return `
            <div class="model-picker">
                <label class="file-label">${escapeHtml(title)}</label>
                <div class="model-picker-row">
                    <select id="${selectId}">
                        <option value="">先拉取模型 / 或下方手填</option>
                        ${modelSelectOptions(cacheKey, selected)}
                    </select>
                    <button type="button" onclick="fetchAndFillModels('${cacheKey}','${selectId}')">拉取模型</button>
                </div>
                <input id="${manualId}" placeholder="${escapeHtml(hint || "拉取失败可在这里手填模型名")}" value="${escapeHtml(selected || "")}">
            </div>
        `
    }

    window.fetchAndFillModels = async function(cacheKey, selectId){
        const map = {
            main: ["apiBase", "apiKey"],
            trans: ["apiBase", "apiKey"],
            image: ["imgBase", "imgKey"],
            tts: ["ttsApiBase", "ttsApiKey"],
            stt: ["sttApiBase", "sttApiKey"]
        }
        const pair = map[cacheKey] || ["apiBase", "apiKey"]
        const base = document.getElementById(pair[0])?.value?.trim() || ""
        const key = document.getElementById(pair[1])?.value?.trim() || ""
        if (!base || !key) {
            alert("先填 API 链接和 Key")
            return
        }

        let url = base.replace(/\/+$/, "")
        if (url.endsWith("/chat/completions")) url = url.replace(/\/chat\/completions$/, "")
        if (url.endsWith("/images/generations")) url = url.replace(/\/images\/generations$/, "")
        if (url.endsWith("/audio/speech")) url = url.replace(/\/audio\/speech$/, "")
        if (url.endsWith("/audio/transcriptions")) url = url.replace(/\/audio\/transcriptions$/, "")
        if (!/\/v\d(?:beta)?$/i.test(url) && !url.includes("/v1")) url += "/v1"
        url += "/models"

        try {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + key,
                    "Content-Type": "application/json"
                }
            })
            const data = await res.json()
            let list = []
            if (Array.isArray(data.data)) {
                list = data.data.map(x => x.id || x.name || x.model).filter(Boolean)
            } else if (Array.isArray(data.models)) {
                list = data.models.map(x => x.id || x.name || x.model || x).filter(Boolean)
            } else if (Array.isArray(data)) {
                list = data.map(x => x.id || x.name || x.model || x).filter(Boolean)
            }

            list = Array.from(new Set(list)).sort()
            if (!list.length) throw new Error("没有识别到模型列表")

            setModelCache(cacheKey, list)

            const select = document.getElementById(selectId)
            if (select) {
                const old = select.value
                select.innerHTML = `<option value="">请选择模型</option>` + list.map(v => `<option value="${escapeHtml(v)}" ${v === old ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")
                if (!select.value && list[0]) select.value = list[0]
            }
            alert("模型列表已拉取")
        } catch (e) {
            alert("拉取失败：" + (e.message || e) + "\n可以继续手填模型名。")
        }
    }

    function modelValue(selectId, manualId){
        const manual = document.getElementById(manualId)?.value?.trim() || ""
        const selected = document.getElementById(selectId)?.value?.trim() || ""
        return manual || selected
    }

    window.showSettings = function() {
        const apiBase = localStorage.getItem("MJI_API_BASE") || ""
        const apiKey = localStorage.getItem("MJI_API_KEY") || ""
        const apiModel = localStorage.getItem("MJI_API_MODEL") || ""
        const transModel = localStorage.getItem("MJI_TRANS_MODEL") || ""
        const contextCount = localStorage.getItem("MJI_CONTEXT_COUNT") || "20"
        const npcAutoEnabled = localStorage.getItem("MJI_NPC_AUTO_ENABLED") !== "false"

        const imgBase = localStorage.getItem("MJI_IMG_API_BASE") || ""
        const imgKey = localStorage.getItem("MJI_IMG_API_KEY") || ""
        const imgModel = localStorage.getItem("MJI_IMG_MODEL") || "gpt-image-1"
        const imgPositive = localStorage.getItem("MJI_IMG_POSITIVE") || ""
        const imgNegative = localStorage.getItem("MJI_IMG_NEGATIVE") || ""
        const chatImageEnabled = localStorage.getItem("MJI_CHAT_IMAGE_ENABLED") === "true"
        const momentImageEnabled = localStorage.getItem("MJI_MOMENT_IMAGE_ENABLED") === "true"
        const autoImageProb = localStorage.getItem("MJI_AUTO_IMAGE_PROB") || "20"
        const imgSize = localStorage.getItem("MJI_IMG_SIZE") || "1024x1024"

        const ttsProvider = localStorage.getItem("MJI_TTS_PROVIDER") || "siliconflow"
        const ttsApiBase = localStorage.getItem("MJI_TTS_API_BASE") || "https://api.siliconflow.cn/v1"
        const ttsApiKey = localStorage.getItem("MJI_TTS_API_KEY") || ""
        const ttsModel = localStorage.getItem("MJI_TTS_MODEL") || "FunAudioLLM/CosyVoice2-0.5B"
        const siliconVoice = localStorage.getItem("MJI_TTS_SILICON_VOICE") || "FunAudioLLM/CosyVoice2-0.5B"
        const guannanApiKey = localStorage.getItem("MJI_GUANNAN_API_KEY") || ""
        const guannanVoice = localStorage.getItem("MJI_GUANNAN_VOICE") || "krueger"
        const guannanLang = localStorage.getItem("MJI_GUANNAN_LANG") || "en"
        const sttApiBase = localStorage.getItem("MJI_STT_API_BASE") || "https://api.siliconflow.cn/v1"
        const sttApiKey = localStorage.getItem("MJI_STT_API_KEY") || ""
        const sttModel = localStorage.getItem("MJI_STT_MODEL") || "iic/SenseVoiceSmall"
        const globalVoiceMsgEnabled = localStorage.getItem("MJI_VOICE_MSG_ENABLED") === "true"
        const globalVoiceMsgProb = localStorage.getItem("MJI_VOICE_MSG_PROB") || "30"

        document.getElementById("appContent").innerHTML = `
            <div class="settings-page">
                <div class="settings-card">
                    <div class="settings-title">API 设置</div>

                    <input id="apiBase" placeholder="API站子链接，例如 https://api.openai.com/v1" value="${escapeHtml(apiBase)}">
                    <input id="apiKey" placeholder="API密钥" value="${escapeHtml(apiKey)}">
                    ${modelPickerHtml("主聊天模型", "main", "apiModelSelect", "apiModelManual", apiModel, "例如 gpt-4o / gemini-2.5-pro")}
                    ${modelPickerHtml("翻译模型", "trans", "transModelSelect", "transModelManual", transModel, "可空，空则使用主聊天模型")}
                    <input id="contextCount" placeholder="上下文条数，例如 20" value="${escapeHtml(contextCount)}">

                    <select id="npcAutoEnabled">
                        <option value="true" ${npcAutoEnabled ? "selected" : ""}>允许AI主动发消息</option>
                        <option value="false" ${!npcAutoEnabled ? "selected" : ""}>关闭AI主动发消息</option>
                    </select>

                    <label class="file-label">我的头像</label>
                    <input type="file" id="myAvatarFile" accept="image/*">

                    <label class="file-label">默认聊天背景</label>
                    <input type="file" id="chatBgFile" accept="image/*">

                    <button onclick="saveSettings()">保存设置</button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">生图 API 设置</div>
                    <p class="settings-desc">私聊发图、群聊发图、角色动态配图、梦男之家同人图都会优先读取这里。</p>

                    <input id="imgBase" placeholder="生图站子链接，例如 https://api.openai.com/v1" value="${escapeHtml(imgBase)}">
                    <input id="imgKey" placeholder="生图API密钥" value="${escapeHtml(imgKey)}">
                    ${modelPickerHtml("生图模型", "image", "imgModelSelect", "imgModelManual", imgModel, "例如 gpt-image-1 / dall-e-3 / gemini 图片模型")}
                    <textarea id="imgPositive" placeholder="固定正向词，可空" style="min-height:70px">${escapeHtml(imgPositive)}</textarea>
                    <textarea id="imgNegative" placeholder="固定负向词，可空" style="min-height:70px">${escapeHtml(imgNegative)}</textarea>

                    <label class="file-label">图片尺寸</label>
                    <select id="imgSize">
                        ${["1024x1024","1024x1536","1536x1024","768x1024","1024x768"].map(v=>`<option value="${v}" ${imgSize===v?"selected":""}>${v}</option>`).join("")}
                    </select>

                    <label class="switch-line"><input type="checkbox" id="chatImageEnabled" ${chatImageEnabled ? "checked" : ""}> 对话生图</label>
                    <label class="switch-line"><input type="checkbox" id="momentImageEnabled" ${momentImageEnabled ? "checked" : ""}> 角色动态生图</label>
                    <input id="autoImageProb" placeholder="自动发图概率 0-100" value="${escapeHtml(autoImageProb)}">

                    <button onclick="saveImageSettings()">保存生图设置</button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">TTS / 通话语音 API 设置</div>
                    <p class="settings-desc">角色语音、语音消息、电话通话、电台朗读会读取这里。角色单独音色在角色设置里配置。</p>

                    <label class="file-label">TTS 服务商</label>
                    <select id="ttsProvider">
                        <option value="siliconflow" ${ttsProvider === "siliconflow" ? "selected" : ""}>硅基流动 SiliconFlow</option>
                        <option value="guannan" ${ttsProvider === "guannan" ? "selected" : ""}>朋友服务器 Guannan</option>
                    </select>

                    <input id="ttsApiBase" placeholder="TTS API 链接，例如 https://api.siliconflow.cn/v1" value="${escapeHtml(ttsApiBase)}">
                    <input id="ttsApiKey" placeholder="硅基流动 TTS API Key" value="${escapeHtml(ttsApiKey)}">
                    ${modelPickerHtml("TTS 模型", "tts", "ttsModelSelect", "ttsModelManual", ttsModel, "例如 FunAudioLLM/CosyVoice2-0.5B")}
                    <input id="siliconVoice" placeholder="硅基默认音色 ID" value="${escapeHtml(siliconVoice)}">

                    <input id="guannanApiKey" placeholder="朋友服务器 API Key" value="${escapeHtml(guannanApiKey)}">
                    <select id="guannanVoice">
                        ${["keegan","krueger","ghostNew","ghostOld","konig","nikto"].map(v => `<option value="${v}" ${guannanVoice === v ? "selected" : ""}>${v}</option>`).join("")}
                    </select>
                    <input id="guannanLang" placeholder="朋友服务器目标语言，例如 en / zh / ja" value="${escapeHtml(guannanLang)}">

                    <label class="switch-line"><input type="checkbox" id="globalVoiceMsgEnabled" ${globalVoiceMsgEnabled ? "checked" : ""}> 允许角色发送语音消息</label>
                    <input id="globalVoiceMsgProb" placeholder="角色语音消息概率 0-100" value="${escapeHtml(globalVoiceMsgProb)}">

                    <div class="settings-title" style="font-size:15px;margin-top:16px">通话语音识别 STT</div>
                    <input id="sttApiBase" placeholder="STT API 链接，例如 https://api.siliconflow.cn/v1" value="${escapeHtml(sttApiBase)}">
                    <input id="sttApiKey" placeholder="STT API Key，可空；空则回退用 TTS Key" value="${escapeHtml(sttApiKey)}">
                    ${modelPickerHtml("STT 模型", "stt", "sttModelSelect", "sttModelManual", sttModel, "例如 iic/SenseVoiceSmall")}

                    <button onclick="saveTtsSettings()">保存 TTS / 通话语音设置</button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">数据备份</div>
                    <p class="settings-desc">导出联系人、聊天、群聊、动态、世界书、个人资料、气泡、心声卡片、TTS、生图等设置。</p>
                    <button onclick="exportBackup()">导出备份</button>
                    <input type="file" id="backupFile" accept=".json,application/json">
                    <button onclick="importBackup()">导入备份</button>
                </div>
            </div>
        `

        const css = document.createElement("style")
        css.textContent = `
            .model-picker-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
            .model-picker-row button{height:42px;margin:0;padding:0 12px;white-space:nowrap}
            .switch-line{display:flex;align-items:center;gap:8px;margin:10px 0;color:#555;font-size:14px}
            .switch-line input{width:auto!important;margin:0!important}
        `
        document.head.appendChild(css)
    }

    window.saveSettings = async function(){
        const apiBase = document.getElementById("apiBase").value.trim()
        const apiKey = document.getElementById("apiKey").value.trim()
        const apiModel = modelValue("apiModelSelect", "apiModelManual")
        const transModel = modelValue("transModelSelect", "transModelManual")
        const contextCount = document.getElementById("contextCount").value.trim() || "20"
        const npcAutoEnabled = document.getElementById("npcAutoEnabled").value
        const avatarFile = document.getElementById("myAvatarFile")?.files[0]
        const bgFile = document.getElementById("chatBgFile")?.files[0]

        if (!apiBase || !apiKey || !apiModel) {
            alert("API链接、密钥、模型名都要填")
            return
        }

        localStorage.setItem("MJI_API_BASE", apiBase)
        localStorage.setItem("MJI_API_KEY", apiKey)
        localStorage.setItem("MJI_API_MODEL", apiModel)
        localStorage.setItem("MJI_TRANS_MODEL", transModel)
        localStorage.setItem("MJI_CONTEXT_COUNT", contextCount)
        localStorage.setItem("MJI_NPC_AUTO_ENABLED", npcAutoEnabled)

        if (avatarFile) {
            const avatarBase64 = await fileToBase64(avatarFile)
            localStorage.setItem("MJI_MY_AVATAR", avatarBase64)
        }

        if (bgFile) {
            const bgBase64 = await fileToBase64(bgFile)
            localStorage.setItem("MJI_CHAT_BG", bgBase64)
        }

        alert("保存成功")
    }

    window.saveImageSettings = function(){
        const imgBase = document.getElementById("imgBase")?.value.trim() || ""
        const imgKey = document.getElementById("imgKey")?.value.trim() || ""
        const imgModel = modelValue("imgModelSelect", "imgModelManual")
        const imgPositive = document.getElementById("imgPositive")?.value.trim() || ""
        const imgNegative = document.getElementById("imgNegative")?.value.trim() || ""
        const imgSize = document.getElementById("imgSize")?.value || "1024x1024"
        const chatImageEnabled = document.getElementById("chatImageEnabled")?.checked ? "true" : "false"
        const momentImageEnabled = document.getElementById("momentImageEnabled")?.checked ? "true" : "false"
        const autoImageProb = (document.getElementById("autoImageProb")?.value.trim() || "20")

        if (!imgBase || !imgKey || !imgModel) {
            alert("生图链接、密钥、模型名都要填")
            return
        }

        localStorage.setItem("MJI_IMG_API_BASE", imgBase)
        localStorage.setItem("MJI_IMG_API_KEY", imgKey)
        localStorage.setItem("MJI_IMG_MODEL", imgModel)
        localStorage.setItem("MJI_IMG_POSITIVE", imgPositive)
        localStorage.setItem("MJI_IMG_NEGATIVE", imgNegative)
        localStorage.setItem("MJI_IMG_SIZE", imgSize)
        localStorage.setItem("MJI_CHAT_IMAGE_ENABLED", chatImageEnabled)
        localStorage.setItem("MJI_MOMENT_IMAGE_ENABLED", momentImageEnabled)
        localStorage.setItem("MJI_AUTO_IMAGE_PROB", autoImageProb)
        alert("生图设置已保存")
    }

    window.saveTtsSettings = function(){
        const ttsProvider = document.getElementById("ttsProvider")?.value || "siliconflow"
        const ttsApiBase = document.getElementById("ttsApiBase")?.value.trim() || "https://api.siliconflow.cn/v1"
        const ttsApiKey = document.getElementById("ttsApiKey")?.value.trim() || ""
        const ttsModel = modelValue("ttsModelSelect", "ttsModelManual") || "FunAudioLLM/CosyVoice2-0.5B"
        const siliconVoice = document.getElementById("siliconVoice")?.value.trim() || "FunAudioLLM/CosyVoice2-0.5B"
        const guannanApiKey = document.getElementById("guannanApiKey")?.value.trim() || ""
        const guannanVoice = document.getElementById("guannanVoice")?.value || "krueger"
        const guannanLang = document.getElementById("guannanLang")?.value.trim() || "en"
        const sttApiBase = document.getElementById("sttApiBase")?.value.trim() || "https://api.siliconflow.cn/v1"
        const sttApiKey = document.getElementById("sttApiKey")?.value.trim() || ""
        const sttModel = modelValue("sttModelSelect", "sttModelManual") || "iic/SenseVoiceSmall"
        const globalVoiceMsgEnabled = document.getElementById("globalVoiceMsgEnabled")?.checked ? "true" : "false"
        const globalVoiceMsgProb = document.getElementById("globalVoiceMsgProb")?.value.trim() || "30"

        localStorage.setItem("MJI_TTS_PROVIDER", ttsProvider)
        localStorage.setItem("MJI_TTS_API_BASE", ttsApiBase)
        localStorage.setItem("MJI_TTS_API_KEY", ttsApiKey)
        localStorage.setItem("MJI_TTS_MODEL", ttsModel)
        localStorage.setItem("MJI_TTS_SILICON_VOICE", siliconVoice)
        localStorage.setItem("MJI_GUANNAN_API_KEY", guannanApiKey)
        localStorage.setItem("MJI_GUANNAN_VOICE", guannanVoice)
        localStorage.setItem("MJI_GUANNAN_LANG", guannanLang)
        localStorage.setItem("MJI_STT_API_BASE", sttApiBase)
        localStorage.setItem("MJI_STT_API_KEY", sttApiKey)
        localStorage.setItem("MJI_STT_MODEL", sttModel)
        localStorage.setItem("MJI_VOICE_MSG_ENABLED", globalVoiceMsgEnabled)
        localStorage.setItem("MJI_VOICE_MSG_PROB", globalVoiceMsgProb)
        alert("TTS / 通话语音设置已保存")
    }
})()
