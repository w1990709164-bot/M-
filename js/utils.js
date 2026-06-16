function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}
function fileToBase64(file) {

    return new Promise((resolve,reject)=>{

        const reader = new FileReader()

        reader.onload = ()=>{
            resolve(reader.result)
        }

        reader.onerror = reject

        reader.readAsDataURL(file)

    })
}
function safeMemory(memory, maxLength = 3000) {

    if (!memory) return ""

    if (memory.length <= maxLength) {
        return memory
    }

    return (
        memory.substring(0, maxLength) +
        "\n\n【部分较旧记忆已折叠】"
    )
}
function safeWorldBook(text, maxLength = 3000) {

    if (!text) return ""

    if (text.length <= maxLength) {
        return text
    }

    return text.substring(0, maxLength)
}
function getChatApiUrl() {
    const apiBase = localStorage.getItem("MJI_API_BASE") || ""

    if (apiBase.endsWith("/chat/completions")) {
        return apiBase
    }

    return apiBase.replace(/\/$/, "") + "/chat/completions"
}
function splitAiMessages(text) {

    if (!text) return []

    let raw =
        String(text)
            .trim()
            .replaceAll("[MSG]", "\n")
            .replaceAll("【MSG】", "\n")

    raw =
        raw
            .replace(/([。！？!?])\s*/g, "$1\n")
            .replace(/([；;])\s*/g, "$1\n")

    let parts =
        raw
            .split(/\n+/)
            .map(t =>
                t
                    .replace(/^\s*[-•\d.、]+/, "")
                    .replace(/^["“”]+|["“”]+$/g, "")
                    .trim()
            )
            .filter(Boolean)

    const result = []

    parts.forEach(function(item) {

        const key =
            item.replace(/[，。！？!?、,.；;：:\s]/g, "")

        const exists =
            result.some(function(old) {
                const oldKey =
                    old.replace(/[，。！？!?、,.；;：:\s]/g, "")

                return key === oldKey
            })

        if (!exists) {
            result.push(item)
        }
    })

    return result.slice(0, 3)
}
function isImageSrc(src) {
    if (!src) return false

    return (
        src.startsWith("data:image/") ||
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("./") ||
        src.startsWith("/") ||
        src.startsWith("icons/") ||
        src.endsWith(".png") ||
        src.endsWith(".jpg") ||
        src.endsWith(".jpeg") ||
        src.endsWith(".webp") ||
        src.endsWith(".gif")
    )
}
function avatarHtml(src, fallback = "🙂") {
    if (isImageSrc(src)) {
        return `<img src="${src}" class="avatar-img">`
    }

    return fallback
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
function formatMsgTime(time) {
    if (!time) return ""

    const d = new Date(time)

    const h = String(d.getHours()).padStart(2, "0")
    const m = String(d.getMinutes()).padStart(2, "0")

    return h + ":" + m
}
