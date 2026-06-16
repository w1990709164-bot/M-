async function exportBackup() {

    const backup = {
        contacts: [],
        messages: [],
        memories: [],
        worldbooks: [],
        groups: [],
        moments: [],
        momentLikes: [],
        momentComments: [],
        diaries: [],
        offlineMessages: [],
        forumPosts: [],
        forumComments: [],
        forumAliases: [],
        mailboxCharLetters: [],
        mailboxUserLetters: [],
        dreamHousePosts: [],
        dreamHouseReactions: [],
        dreamHouseAliases: [],
        books: [],
        bookComments: [],
        pomodoroStats: [],
        pomodoroSessions: [],
        imageGenHistory: [],
        schedules: [],
        radioStations: [],
        settings: {}
    }

    backup.contacts = await getAllStoreData("contacts")
    backup.messages = await getAllStoreData("messages")
    backup.memories = await getAllStoreData("memories")
    backup.worldbooks = await getAllStoreData("worldbooks")
    backup.groups = await getAllStoreData("groups")
    backup.moments = await getAllStoreData("moments")
    backup.momentLikes = await getAllStoreData("momentLikes")
    backup.momentComments = await getAllStoreData("momentComments")
    backup.diaries = await getAllStoreData("diaries")
    backup.offlineMessages = await getAllStoreData("offlineMessages")
    backup.forumPosts = await getAllStoreData("forumPosts")
    backup.forumComments = await getAllStoreData("forumComments")
    backup.forumAliases = await getAllStoreData("forumAliases")
    backup.mailboxCharLetters = await getAllStoreData("mailboxCharLetters")
    backup.mailboxUserLetters = await getAllStoreData("mailboxUserLetters")
    backup.dreamHousePosts = await getAllStoreData("dreamHousePosts")
    backup.dreamHouseReactions = await getAllStoreData("dreamHouseReactions")
    backup.dreamHouseAliases = await getAllStoreData("dreamHouseAliases")
    backup.books = await getAllStoreData("books")
    backup.bookComments = await getAllStoreData("bookComments")
    backup.pomodoroStats = await getAllStoreData("pomodoroStats")
    backup.pomodoroSessions = await getAllStoreData("pomodoroSessions")
    backup.imageGenHistory = await getAllStoreData("imageGenHistory")
    backup.schedules = await getAllStoreData("schedules")
    backup.radioStations = await getAllStoreData("radioStations")

    backup.settings = {
        apiBase:
            localStorage.getItem("MJI_API_BASE"),

        apiModel:
            localStorage.getItem("MJI_API_MODEL"),

        contextCount:
            localStorage.getItem("MJI_CONTEXT_COUNT"),

        myAvatar:
            localStorage.getItem("MJI_MY_AVATAR"),

        chatBg:
            localStorage.getItem("MJI_CHAT_BG"),

        npcAutoEnabled:
            localStorage.getItem("MJI_NPC_AUTO_ENABLED"),

        chatCustomCss:
            localStorage.getItem("MJI_CHAT_CUSTOM_CSS"),

        thoughtsCardTemplate:
            localStorage.getItem("MJI_THOUGHTS_CARD_TEMPLATE"),

        thoughtsCardCss:
            localStorage.getItem("MJI_THOUGHTS_CARD_CSS"),

        blindboxToday:
            localStorage.getItem("MJI_BLINDBOX_TODAY_V1"),

        blindboxTreasury:
            localStorage.getItem("MJI_BLINDBOX_TREASURY_V1"),

        dreamHouseProfile:
            localStorage.getItem("MJI_DREAM_PROFILE"),

        pomodoroSettings:
            localStorage.getItem("MJI_POMODORO_SETTINGS"),

        pomodoroSelectedAi:
            localStorage.getItem("MJI_POMODORO_SELECTED_AI"),

        imageApiBase:
            localStorage.getItem("MJI_IMG_API_BASE"),

        imageApiKey:
            localStorage.getItem("MJI_IMG_API_KEY"),

        imageModel:
            localStorage.getItem("MJI_IMG_MODEL"),

        imagePositivePrompt:
            localStorage.getItem("MJI_IMG_POSITIVE"),

        imageNegativePrompt:
            localStorage.getItem("MJI_IMG_NEGATIVE"),

        lastCity:
            localStorage.getItem("MJI_LAST_CITY"),

        cyberWeather:
            localStorage.getItem("MJI_CYBER_WEATHER"),

        radioSearchType:
            localStorage.getItem("MJI_RADIO_SEARCH_TYPE"),

        radioSearchKey:
            localStorage.getItem("MJI_RADIO_SEARCH_KEY"),

        ttsProvider:
            localStorage.getItem("MJI_TTS_PROVIDER"),

        ttsApiKey:
            localStorage.getItem("MJI_TTS_API_KEY"),

        ttsSiliconVoice:
            localStorage.getItem("MJI_TTS_SILICON_VOICE"),

        guannanApiKey:
            localStorage.getItem("MJI_GUANNAN_API_KEY"),

        guannanVoice:
            localStorage.getItem("MJI_GUANNAN_VOICE"),

        guannanLang:
            localStorage.getItem("MJI_GUANNAN_LANG"),

        sttApiBase:
            localStorage.getItem("MJI_STT_API_BASE"),

        sttApiKey:
            localStorage.getItem("MJI_STT_API_KEY"),

        sttModel:
            localStorage.getItem("MJI_STT_MODEL"),

        transModel:
            localStorage.getItem("MJI_TRANS_MODEL"),

        myName:
            localStorage.getItem("MJI_MY_NAME"),

        myAge:
            localStorage.getItem("MJI_MY_AGE"),

        myBirthday:
            localStorage.getItem("MJI_MY_BIRTHDAY"),

        myGender:
            localStorage.getItem("MJI_MY_GENDER"),

        myIdentity:
            localStorage.getItem("MJI_MY_IDENTITY"),

        myProfile:
            localStorage.getItem("MJI_MY_PROFILE"),

        imageSize:
            localStorage.getItem("MJI_IMG_SIZE"),

        chatImageEnabled:
            localStorage.getItem("MJI_CHAT_IMAGE_ENABLED"),

        momentImageEnabled:
            localStorage.getItem("MJI_MOMENT_IMAGE_ENABLED"),

        autoImageProb:
            localStorage.getItem("MJI_AUTO_IMAGE_PROB"),

        ttsApiBase:
            localStorage.getItem("MJI_TTS_API_BASE"),

        ttsModel:
            localStorage.getItem("MJI_TTS_MODEL"),

        voiceMsgEnabled:
            localStorage.getItem("MJI_VOICE_MSG_ENABLED"),

        voiceMsgProb:
            localStorage.getItem("MJI_VOICE_MSG_PROB")
    }

    const blob = new Blob(
        [JSON.stringify(backup,null,2)],
        {
            type:"application/json"
        }
    )

    const url =
        URL.createObjectURL(blob)

    const a =
        document.createElement("a")

    a.href = url
    a.download = "mji_backup.json"

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(function(){
        URL.revokeObjectURL(url)
    }, 1000)

    alert("备份已导出")
}

async function importBackup() {

    const file =
        document.getElementById("backupFile")
        ?.files?.[0]

    if (!file) {
        alert("请先选择备份文件")
        return
    }

    try {

        const text =
            await file.text()

        const backup =
            JSON.parse(text)

        await restoreBackup(backup)

        alert("导入成功，请刷新页面")

    } catch (e) {

        alert(
            "导入失败：" +
            e.message
        )
    }
}

async function restoreBackup(backup) {

    if (backup.contacts) {
        await restoreStore(
            "contacts",
            backup.contacts
        )
    }

    if (backup.messages) {
        await restoreStore(
            "messages",
            backup.messages
        )
    }

    if (backup.memories) {
        await restoreStore(
            "memories",
            backup.memories
        )
    }

    if (backup.worldbooks) {
        await restoreStore(
            "worldbooks",
            backup.worldbooks
        )
    }

    if (backup.groups) {
        await restoreStore(
            "groups",
            backup.groups
        )
    }

    if (backup.moments) {
        await restoreStore(
            "moments",
            backup.moments
        )
    }

    if (backup.momentLikes) {
        await restoreStore(
            "momentLikes",
            backup.momentLikes
        )
    }

    if (backup.momentComments) {
        await restoreStore(
            "momentComments",
            backup.momentComments
        )
    }

    if (backup.diaries) {
        await restoreStore(
            "diaries",
            backup.diaries
        )
    }

    if (backup.offlineMessages) {
        await restoreStore(
            "offlineMessages",
            backup.offlineMessages
        )
    }

    if (backup.forumPosts) {
        await restoreStore(
            "forumPosts",
            backup.forumPosts
        )
    }

    if (backup.forumComments) {
        await restoreStore(
            "forumComments",
            backup.forumComments
        )
    }

    if (backup.forumAliases) {
        await restoreStore(
            "forumAliases",
            backup.forumAliases
        )
    }

    if (backup.mailboxCharLetters) {
        await restoreStore(
            "mailboxCharLetters",
            backup.mailboxCharLetters
        )
    }

    if (backup.mailboxUserLetters) {
        await restoreStore(
            "mailboxUserLetters",
            backup.mailboxUserLetters
        )
    }

    if (backup.dreamHousePosts) {
        await restoreStore(
            "dreamHousePosts",
            backup.dreamHousePosts
        )
    }

    if (backup.dreamHouseReactions) {
        await restoreStore(
            "dreamHouseReactions",
            backup.dreamHouseReactions
        )
    }

    if (backup.dreamHouseAliases) {
        await restoreStore(
            "dreamHouseAliases",
            backup.dreamHouseAliases
        )
    }

    if (backup.books) {
        await restoreStore(
            "books",
            backup.books
        )
    }

    if (backup.bookComments) {
        await restoreStore(
            "bookComments",
            backup.bookComments
        )
    }

    if (backup.pomodoroStats) {
        await restoreStore(
            "pomodoroStats",
            backup.pomodoroStats
        )
    }

    if (backup.pomodoroSessions) {
        await restoreStore(
            "pomodoroSessions",
            backup.pomodoroSessions
        )
    }

    if (backup.imageGenHistory) {
        await restoreStore(
            "imageGenHistory",
            backup.imageGenHistory
        )
    }

    if (backup.schedules) {
        await restoreStore(
            "schedules",
            backup.schedules
        )
    }

    if (backup.radioStations) {
        await restoreStore(
            "radioStations",
            backup.radioStations
        )
    }

    if (backup.settings) {

        const s =
            backup.settings

        if (s.apiBase)
            localStorage.setItem(
                "MJI_API_BASE",
                s.apiBase
            )

        if (s.apiModel)
            localStorage.setItem(
                "MJI_API_MODEL",
                s.apiModel
            )

        if (s.contextCount)
            localStorage.setItem(
                "MJI_CONTEXT_COUNT",
                s.contextCount
            )

        if (s.myAvatar)
            localStorage.setItem(
                "MJI_MY_AVATAR",
                s.myAvatar
            )

        if (s.chatBg)
            localStorage.setItem(
                "MJI_CHAT_BG",
                s.chatBg
            )

        if (s.npcAutoEnabled)
            localStorage.setItem(
                "MJI_NPC_AUTO_ENABLED",
                s.npcAutoEnabled
            )

        if (s.chatCustomCss)
            localStorage.setItem(
                "MJI_CHAT_CUSTOM_CSS",
                s.chatCustomCss
            )

        if (s.thoughtsCardTemplate)
            localStorage.setItem(
                "MJI_THOUGHTS_CARD_TEMPLATE",
                s.thoughtsCardTemplate
            )

        if (s.thoughtsCardCss)
            localStorage.setItem(
                "MJI_THOUGHTS_CARD_CSS",
                s.thoughtsCardCss
            )

        if (s.blindboxToday)
            localStorage.setItem(
                "MJI_BLINDBOX_TODAY_V1",
                s.blindboxToday
            )

        if (s.blindboxTreasury)
            localStorage.setItem(
                "MJI_BLINDBOX_TREASURY_V1",
                s.blindboxTreasury
            )

        if (s.dreamHouseProfile)
            localStorage.setItem(
                "MJI_DREAM_PROFILE",
                s.dreamHouseProfile
            )

        if (s.pomodoroSettings)
            localStorage.setItem(
                "MJI_POMODORO_SETTINGS",
                s.pomodoroSettings
            )

        if (s.pomodoroSelectedAi)
            localStorage.setItem(
                "MJI_POMODORO_SELECTED_AI",
                s.pomodoroSelectedAi
            )

        if (s.imageApiBase)
            localStorage.setItem(
                "MJI_IMG_API_BASE",
                s.imageApiBase
            )

        if (s.imageApiKey)
            localStorage.setItem(
                "MJI_IMG_API_KEY",
                s.imageApiKey
            )

        if (s.imageModel)
            localStorage.setItem(
                "MJI_IMG_MODEL",
                s.imageModel
            )

        if (s.imagePositivePrompt)
            localStorage.setItem(
                "MJI_IMG_POSITIVE",
                s.imagePositivePrompt
            )

        if (s.imageNegativePrompt)
            localStorage.setItem(
                "MJI_IMG_NEGATIVE",
                s.imageNegativePrompt
            )

        if (s.lastCity)
            localStorage.setItem(
                "MJI_LAST_CITY",
                s.lastCity
            )

        if (s.cyberWeather)
            localStorage.setItem(
                "MJI_CYBER_WEATHER",
                s.cyberWeather
            )

        if (s.radioSearchType)
            localStorage.setItem(
                "MJI_RADIO_SEARCH_TYPE",
                s.radioSearchType
            )

        if (s.radioSearchKey)
            localStorage.setItem(
                "MJI_RADIO_SEARCH_KEY",
                s.radioSearchKey
            )

        if (s.ttsProvider)
            localStorage.setItem("MJI_TTS_PROVIDER", s.ttsProvider)

        if (s.ttsApiKey)
            localStorage.setItem("MJI_TTS_API_KEY", s.ttsApiKey)

        if (s.ttsSiliconVoice)
            localStorage.setItem("MJI_TTS_SILICON_VOICE", s.ttsSiliconVoice)

        if (s.guannanApiKey)
            localStorage.setItem("MJI_GUANNAN_API_KEY", s.guannanApiKey)

        if (s.guannanVoice)
            localStorage.setItem("MJI_GUANNAN_VOICE", s.guannanVoice)

        if (s.guannanLang)
            localStorage.setItem("MJI_GUANNAN_LANG", s.guannanLang)

        if (s.sttApiBase)
            localStorage.setItem("MJI_STT_API_BASE", s.sttApiBase)

        if (s.sttApiKey)
            localStorage.setItem("MJI_STT_API_KEY", s.sttApiKey)

        if (s.sttModel)
            localStorage.setItem("MJI_STT_MODEL", s.sttModel)

        if (s.transModel)
            localStorage.setItem("MJI_TRANS_MODEL", s.transModel)

        if (s.myName)
            localStorage.setItem("MJI_MY_NAME", s.myName)

        if (s.myAge)
            localStorage.setItem("MJI_MY_AGE", s.myAge)

        if (s.myBirthday)
            localStorage.setItem("MJI_MY_BIRTHDAY", s.myBirthday)

        if (s.myGender)
            localStorage.setItem("MJI_MY_GENDER", s.myGender)

        if (s.myIdentity)
            localStorage.setItem("MJI_MY_IDENTITY", s.myIdentity)

        if (s.myProfile)
            localStorage.setItem("MJI_MY_PROFILE", s.myProfile)

        if (s.imageSize)
            localStorage.setItem("MJI_IMG_SIZE", s.imageSize)

        if (s.chatImageEnabled)
            localStorage.setItem("MJI_CHAT_IMAGE_ENABLED", s.chatImageEnabled)

        if (s.momentImageEnabled)
            localStorage.setItem("MJI_MOMENT_IMAGE_ENABLED", s.momentImageEnabled)

        if (s.autoImageProb)
            localStorage.setItem("MJI_AUTO_IMAGE_PROB", s.autoImageProb)

        if (s.ttsApiBase)
            localStorage.setItem("MJI_TTS_API_BASE", s.ttsApiBase)

        if (s.ttsModel)
            localStorage.setItem("MJI_TTS_MODEL", s.ttsModel)

        if (s.voiceMsgEnabled)
            localStorage.setItem("MJI_VOICE_MSG_ENABLED", s.voiceMsgEnabled)

        if (s.voiceMsgProb)
            localStorage.setItem("MJI_VOICE_MSG_PROB", s.voiceMsgProb)
    }
}
