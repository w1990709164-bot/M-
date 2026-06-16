// PWA 生图管理器：兼容 OpenAI images、Gemini image、Replicate predictions
function imageGenConfig() {
    return {
        apiBase: (localStorage.getItem("MJI_IMG_API_BASE") || "").trim(),
        apiKey: (localStorage.getItem("MJI_IMG_API_KEY") || "").trim(),
        model: (localStorage.getItem("MJI_IMG_MODEL") || "gpt-image-1").trim(),
        positive: (localStorage.getItem("MJI_IMG_POSITIVE") || "").trim(),
        negative: (localStorage.getItem("MJI_IMG_NEGATIVE") || "").trim()
    }
}

function imageGenEndpoint(apiBase, model) {
    const base = apiBase.replace(/\/$/, "")
    const lower = (base + " " + model).toLowerCase()
    const isGemini = lower.includes("gemini") || base.includes("generativelanguage.googleapis.com")
    const isReplicate = base.toLowerCase().includes("replicate")

    if (isGemini) {
        if (base.includes(":generateContent")) return base
        if (base.includes("/models/")) return base + ":generateContent"
        if (base.endsWith("/v1") || base.endsWith("/v1beta")) return base + "/models/" + encodeURIComponent(model) + ":generateContent"
        return base + "/v1beta/models/" + encodeURIComponent(model) + ":generateContent"
    }

    if (isReplicate) {
        return base.endsWith("/predictions") ? base : base + "/predictions"
    }

    if (base.endsWith("/images/generations")) return base
    if (base.includes("/images/generations")) return base.split("/images/generations")[0] + "/images/generations"
    if (base.endsWith("/chat/completions")) return base.replace("/chat/completions", "/images/generations")
    if (base.endsWith("/v1")) return base + "/images/generations"
    return base + "/v1/images/generations"
}

function imageGenBody(prompt, cfg) {
    const lower = (cfg.apiBase + " " + cfg.model).toLowerCase()
    const finalPrompt = [prompt, cfg.positive].filter(Boolean).join(", ")
    const isGemini = lower.includes("gemini") || cfg.apiBase.includes("generativelanguage.googleapis.com")
    const isReplicate = lower.includes("replicate")

    if (isGemini) {
        return {
            contents: [{ parts: [{ text: finalPrompt }] }],
            generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        }
    }

    if (isReplicate) {
        const input = { prompt: finalPrompt, width: 1024, height: 1024 }
        if (cfg.negative) input.negative_prompt = cfg.negative
        return { version: cfg.model, input }
    }

    const body = {
        model: cfg.model,
        prompt: finalPrompt,
        n: 1,
        size: "1024x1024"
    }
    if (cfg.negative) body.negative_prompt = cfg.negative
    if (/dall-e/i.test(cfg.model)) body.response_format = "b64_json"
    return body
}

async function generateImageByConfig(prompt) {
    const cfg = imageGenConfig()
    if (!cfg.apiBase || !cfg.apiKey || !cfg.model) {
        throw new Error("请先在设置里配置生图API")
    }

    const endpoint = imageGenEndpoint(cfg.apiBase, cfg.model)
    const body = imageGenBody(prompt, cfg)
    const headers = { "Content-Type": "application/json" }
    if ((cfg.apiBase + cfg.model).toLowerCase().includes("gemini") && cfg.apiBase.includes("generativelanguage.googleapis.com")) {
        headers["x-goog-api-key"] = cfg.apiKey
    } else {
        headers["Authorization"] = "Bearer " + cfg.apiKey
    }

    const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
    })
    const raw = await resp.text()
    if (!resp.ok || !raw) throw new Error("生图失败 HTTP " + resp.status + " " + raw.slice(0, 160))
    const json = JSON.parse(raw)
    const parsed = await parseImageGenResponse(json, cfg)

    try {
        if (db && parsed) {
            const tx = db.transaction("imageGenHistory", "readwrite")
            tx.objectStore("imageGenHistory").put({
                id: "img_" + Date.now() + "_" + Math.random().toString(16).slice(2),
                prompt,
                imageData: parsed.imageData || "",
                imageUrl: parsed.imageUrl || "",
                model: cfg.model,
                createdAt: Date.now()
            })
        }
    } catch (e) {}

    return parsed
}

async function parseImageGenResponse(json, cfg) {
    if (json.candidates) {
        const parts = json.candidates?.[0]?.content?.parts || []
        for (const part of parts) {
            const inline = part.inlineData || part.inline_data
            if (inline && inline.data) {
                const mime = inline.mimeType || inline.mime_type || "image/png"
                return { imageData: "data:" + mime + ";base64," + inline.data, imageUrl: "" }
            }
        }
        throw new Error("Gemini返回里没有图片数据")
    }

    if (json.urls && json.urls.get) {
        return await pollReplicateImage(json.urls.get, cfg.apiKey)
    }

    if (json.data && json.data.length) {
        const first = json.data[0]
        if (first.b64_json) return { imageData: "data:image/png;base64," + first.b64_json, imageUrl: "" }
        if (first.url) return { imageData: "", imageUrl: first.url }
    }

    if (json.image) return { imageData: "data:image/png;base64," + json.image, imageUrl: "" }
    if (json.url) return { imageData: "", imageUrl: json.url }

    if (json.output) {
        const out = Array.isArray(json.output) ? json.output[0] : json.output
        if (typeof out === "string" && out) return { imageData: "", imageUrl: out }
    }

    throw new Error("未知生图返回格式")
}

async function pollReplicateImage(getUrl, apiKey) {
    for (let i = 0; i < 60; i++) {
        await sleep(5000)
        const resp = await fetch(getUrl, { headers: { "Authorization": "Bearer " + apiKey } })
        const json = await resp.json()
        if (json.status === "succeeded") {
            const out = Array.isArray(json.output) ? json.output[0] : json.output
            if (!out) throw new Error("Replicate输出为空")
            return { imageData: "", imageUrl: out }
        }
        if (json.status === "failed" || json.status === "canceled") {
            throw new Error("Replicate生成失败")
        }
    }
    throw new Error("Replicate等待超时")
}

function imageTagFromPost(post) {
    const src = post.imageData || post.imageUrl || ""
    if (!src) return ""
    return `<img class="dream-real-img" src="${escapeHtml(src)}" alt="同人图">`
}
