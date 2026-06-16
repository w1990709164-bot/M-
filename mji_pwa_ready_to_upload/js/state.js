// 全局状态和常量
let db
let currentContact = null
let currentPage = "home"
let chatBackPage = "contacts"
let currentGroup = null
let npcAutoTimer = null

// 主动消息冷却：3小时内同一个角色不重复主动发
const NPC_MESSAGE_COOLDOWN_MS = 3 * 60 * 60 * 1000

// 每5分钟检查一次有没有角色该主动发消息
const NPC_AUTO_CHECK_MS = 5 * 60 * 1000

// 用户最后一句发完超过30分钟，角色才可能主动发
const NPC_IDLE_TRIGGER_MS = 30 * 60 * 1000

// 每次检查时，符合条件后有 30% 概率主动发
const NPC_AUTO_SEND_CHANCE = 0.3
