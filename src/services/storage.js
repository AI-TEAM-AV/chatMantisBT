const KEYS = {
  CONVERSATIONS: 'helpdesk_conversations',
  MESSAGES: 'helpdesk_messages',
  OPERATOR: 'helpdesk_operator',
  INITIALIZED: 'helpdesk_initialized',
}

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage error:', e)
    }
  },

  remove(key) {
    localStorage.removeItem(key)
  },
}

export const conversationStorage = {
  getAll() {
    return storage.get(KEYS.CONVERSATIONS) || []
  },

  save(conversations) {
    storage.set(KEYS.CONVERSATIONS, conversations)
  },

  update(id, changes) {
    const list = this.getAll()
    const updated = list.map(c => (c.id === id ? { ...c, ...changes } : c))
    this.save(updated)
    return updated
  },
}

export const messageStorage = {
  getByConversation(conversationId) {
    const all = storage.get(KEYS.MESSAGES) || {}
    return all[conversationId] || []
  },

  add(conversationId, message) {
    const all = storage.get(KEYS.MESSAGES) || {}
    const thread = all[conversationId] || []
    const updated = { ...all, [conversationId]: [...thread, message] }
    storage.set(KEYS.MESSAGES, updated)
    return message
  },

  getAll() {
    return storage.get(KEYS.MESSAGES) || {}
  },

  deleteByConversation(conversationId) {
    const all = storage.get(KEYS.MESSAGES) || {}
    const { [conversationId]: _removed, ...rest } = all
    storage.set(KEYS.MESSAGES, rest)
  },
}

export const authStorage = {
  getOperator() {
    return storage.get(KEYS.OPERATOR)
  },

  setOperator(operator) {
    storage.set(KEYS.OPERATOR, operator)
  },

  clear() {
    storage.remove(KEYS.OPERATOR)
  },
}

export const isInitialized = () => !!storage.get(KEYS.INITIALIZED)
export const markInitialized = () => storage.set(KEYS.INITIALIZED, true)
