// IndexedDB 初始化
const request = indexedDB.open("MJI_DB", 17)

request.onupgradeneeded = function(e) {
    db = e.target.result

    if (!db.objectStoreNames.contains("contacts")) {
        const store = db.createObjectStore("contacts", { keyPath: "id" })
        store.createIndex("name", "name")
    }

    if (!db.objectStoreNames.contains("messages")) {
        const msgStore = db.createObjectStore("messages", { keyPath: "id" })
        msgStore.createIndex("contactId", "contactId")
        msgStore.createIndex("createdAt", "createdAt")
    }

    let memoryStore
    if (!db.objectStoreNames.contains("memories")) {
        memoryStore = db.createObjectStore("memories", { keyPath: "id" })
    } else {
        memoryStore = e.target.transaction.objectStore("memories")
    }
    if (!memoryStore.indexNames.contains("contactId")) memoryStore.createIndex("contactId", "contactId")
    if (!memoryStore.indexNames.contains("category")) memoryStore.createIndex("category", "category")
    if (!memoryStore.indexNames.contains("insertTime")) memoryStore.createIndex("insertTime", "insertTime")

    if (!db.objectStoreNames.contains("worldbooks")) {
        const worldStore = db.createObjectStore("worldbooks", { keyPath: "id" })
        worldStore.createIndex("type", "type")
        worldStore.createIndex("enabled", "enabled")
    }

    if (!db.objectStoreNames.contains("groups")) {
        const groupStore = db.createObjectStore("groups", { keyPath: "id" })
        groupStore.createIndex("name", "name")
        groupStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("moments")) {
        const momentStore = db.createObjectStore("moments", { keyPath: "id" })
        momentStore.createIndex("authorId", "authorId")
        momentStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("momentLikes")) {
        const likeStore = db.createObjectStore("momentLikes", { keyPath: "id" })
        likeStore.createIndex("momentId", "momentId")
        likeStore.createIndex("userId", "userId")
    }

    if (!db.objectStoreNames.contains("momentComments")) {
        const commentStore = db.createObjectStore("momentComments", { keyPath: "id" })
        commentStore.createIndex("momentId", "momentId")
        commentStore.createIndex("userId", "userId")
        commentStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("diaries")) {
        const diaryStore = db.createObjectStore("diaries", { keyPath: "id" })
        diaryStore.createIndex("ownerType", "ownerType")
        diaryStore.createIndex("ownerId", "ownerId")
        diaryStore.createIndex("dateKey", "dateKey")
        diaryStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("offlineMessages")) {
        const offlineStore = db.createObjectStore("offlineMessages", { keyPath: "id" })
        offlineStore.createIndex("contactId", "contactId")
        offlineStore.createIndex("createdAt", "createdAt")
    }


    if (!db.objectStoreNames.contains("forumPosts")) {
        const forumPostStore = db.createObjectStore("forumPosts", { keyPath: "id" })
        forumPostStore.createIndex("boardId", "boardId")
        forumPostStore.createIndex("createdAt", "createdAt")
        forumPostStore.createIndex("likeCount", "likeCount")
    }

    if (!db.objectStoreNames.contains("forumComments")) {
        const forumCommentStore = db.createObjectStore("forumComments", { keyPath: "id" })
        forumCommentStore.createIndex("postId", "postId")
        forumCommentStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("forumAliases")) {
        const forumAliasStore = db.createObjectStore("forumAliases", { keyPath: "id" })
        forumAliasStore.createIndex("aliasName", "aliasName")
        forumAliasStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("mailboxCharLetters")) {
        const mailboxCharStore = db.createObjectStore("mailboxCharLetters", { keyPath: "id" })
        mailboxCharStore.createIndex("contactId", "contactId")
        mailboxCharStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("mailboxUserLetters")) {
        const mailboxUserStore = db.createObjectStore("mailboxUserLetters", { keyPath: "id" })
        mailboxUserStore.createIndex("fromId", "fromId")
        mailboxUserStore.createIndex("createdAt", "createdAt")
    }


    if (!db.objectStoreNames.contains("dreamHousePosts")) {
        const dreamPostStore = db.createObjectStore("dreamHousePosts", { keyPath: "id" })
        dreamPostStore.createIndex("boardId", "boardId")
        dreamPostStore.createIndex("authorId", "authorId")
        dreamPostStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("dreamHouseReactions")) {
        const dreamReactionStore = db.createObjectStore("dreamHouseReactions", { keyPath: "id" })
        dreamReactionStore.createIndex("postId", "postId")
        dreamReactionStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("dreamHouseAliases")) {
        const dreamAliasStore = db.createObjectStore("dreamHouseAliases", { keyPath: "id" })
        dreamAliasStore.createIndex("contactId", "contactId", { unique: true })
    }


    if (!db.objectStoreNames.contains("books")) {
        const bookStore = db.createObjectStore("books", { keyPath: "id" })
        bookStore.createIndex("updatedAt", "updatedAt")
        bookStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("bookComments")) {
        const bookCommentStore = db.createObjectStore("bookComments", { keyPath: "id" })
        bookCommentStore.createIndex("bookId", "bookId")
        bookCommentStore.createIndex("contactId", "contactId")
        bookCommentStore.createIndex("chunkIndex", "chunkIndex")
        bookCommentStore.createIndex("createdAt", "createdAt")
    }


    if (!db.objectStoreNames.contains("pomodoroStats")) {
        const pomoStatsStore = db.createObjectStore("pomodoroStats", { keyPath: "id" })
        pomoStatsStore.createIndex("contactId", "contactId")
        pomoStatsStore.createIndex("dateKey", "dateKey")
    }

    if (!db.objectStoreNames.contains("pomodoroSessions")) {
        const pomoSessionStore = db.createObjectStore("pomodoroSessions", { keyPath: "id" })
        pomoSessionStore.createIndex("contactId", "contactId")
        pomoSessionStore.createIndex("dateKey", "dateKey")
        pomoSessionStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("imageGenHistory")) {
        const imgStore = db.createObjectStore("imageGenHistory", { keyPath: "id" })
        imgStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("schedules")) {
        const scheduleStore = db.createObjectStore("schedules", { keyPath: "id" })
        scheduleStore.createIndex("contactId", "contactId")
        scheduleStore.createIndex("dateKey", "dateKey")
        scheduleStore.createIndex("time", "time")
        scheduleStore.createIndex("createdAt", "createdAt")
    }

    if (!db.objectStoreNames.contains("radioStations")) {
        const radioStore = db.createObjectStore("radioStations", { keyPath: "id" })
        radioStore.createIndex("playCount", "playCount")
        radioStore.createIndex("updatedAt", "updatedAt")
    }

}

request.onsuccess = function(e) {
    db = e.target.result
    console.log("数据库已启动")

    startNpcAutoCheck()
    updateDesktopUnreadBadge()
}

request.onerror = function() {
    alert("数据库启动失败")
}
