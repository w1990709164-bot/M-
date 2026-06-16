function saveMessage(contactId, role, content, createdAt = Date.now(), extra = {}) {
    const tx = db.transaction("messages", "readwrite")
    const store = tx.objectStore("messages")

    store.put({
        id: extra.id || ("msg_" + createdAt + "_" + Math.random().toString(16).slice(2)),
        contactId,
        role,
        content,
        createdAt,
        ...extra
    })
}

function getAllStoreData(storeName){

    return new Promise(resolve=>{

        const tx = db.transaction(storeName, "readonly")
        const store = tx.objectStore(storeName)
        const req = store.getAll()

        req.onsuccess = ()=>resolve(req.result)
        req.onerror = ()=>resolve([])
    })
}

function restoreStore(storeName, data) {
    return new Promise(resolve => {
        const tx = db.transaction(storeName, "readwrite")
        const store = tx.objectStore(storeName)

        data.forEach(item => {
            store.put(item)
        })

        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
    })
}
