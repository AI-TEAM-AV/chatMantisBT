import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { messageStorage } from '../services/storage.js'
import { chatsApi } from '../services/api.js'

/**
 * Maps a PendingUserResponse from the backend to a frontend conversation object.
 *   Backend state: "waiting" → frontend status: "pending"
 *   Backend state: "operator" → frontend status: "open"
 */
function mapPendingToConversation(pending) {
  return {
    id: String(pending.personNumber),
    userId: String(pending.personNumber),
    userName: pending.name || `Usuario ${pending.personNumber}`,
    subject: pending.problematic || 'Sin asunto',
    status: pending.state === 'waiting' ? 'pending' : 'open',
    priority: 'medium',
    lastMessage: pending.problematic || '',
    lastMessageAt: Date.now(),
    unread: 0,
    createdAt: Date.now(),
  }
}

/**
 * Maps a ChatMessage from the backend to the frontend message format.
 *   Backend: { sender: String, content: String, timestamp: "2024-03-06T10:30:45" }
 *   Frontend: { id, conversationId, sender: 'operator'|'user', senderName, text, createdAt }
 *
 * Convention: if the backend sender === "operator", it's displayed as an operator bubble.
 * All other sender values are treated as user messages.
 */
function mapBackendMessage(conversationId, msg) {
  const isOperator = msg.sender === 'operator'
  return {
    id: uuidv4(),
    conversationId,
    sender: isOperator ? 'operator' : 'user',
    senderName: msg.sender,
    text: msg.content,
    createdAt: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
  }
}

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const [chatError, setChatError] = useState(null)

  // Refs used inside loadChats to avoid stale closures
  const prevMessageCounts = useRef({})
  const isFirstLoad = useRef(true)
  const activeIdRef = useRef(activeId)
  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  async function loadChats() {
    setLoadingChats(true)
    setChatError(null)
    try {
      const data = await chatsApi.getAll()

      // Compute how many new messages arrived per conversation since last poll
      const newCounts = {}
      const unreadDeltas = {}
      data.forEach(pending => {
        const convId = String(pending.personNumber)
        const count = (pending.messages || []).length
        newCounts[convId] = count
        if (!isFirstLoad.current && convId !== activeIdRef.current) {
          // For conversations we haven't seen before, treat current count as baseline (no spike)
          const prev = prevMessageCounts.current[convId] ?? count
          const delta = count - prev
          if (delta > 0) unreadDeltas[convId] = delta
        }
      })
      prevMessageCounts.current = newCounts
      isFirstLoad.current = false

      // Update conversations, carrying over existing unread and adding deltas
      setConversations(prev => {
        const prevMap = Object.fromEntries(prev.map(c => [c.id, c]))
        return data.map(pending => {
          const conv = mapPendingToConversation(pending)
          const existing = prevMap[conv.id]
          conv.unread = (existing?.unread || 0) + (unreadDeltas[conv.id] || 0)
          return conv
        })
      })

      // Replace messages for each conversation with the latest from backend
      const backendMessages = {}
      data.forEach(pending => {
        if (pending.messages && pending.messages.length > 0) {
          const convId = String(pending.personNumber)
          backendMessages[convId] = pending.messages.map(msg =>
            mapBackendMessage(convId, msg)
          )
        }
      })
      setMessages(prev => {
        const merged = { ...prev }
        Object.entries(backendMessages).forEach(([convId, msgs]) => {
          merged[convId] = msgs
        })
        return merged
      })
    } catch {
      setChatError('No se pudieron cargar las conversaciones. Verificá que el servidor esté disponible.')
    } finally {
      setLoadingChats(false)
    }
  }

  useEffect(() => {
    loadChats()
    const interval = setInterval(loadChats, 5000)
    return () => clearInterval(interval)
  }, [])

  const activeConversation = conversations.find(c => c.id === activeId) || null

  const filteredConversations = conversations
    .filter(c => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        c.userName.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)

  const selectConversation = useCallback((id) => {
    setActiveId(id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }, [])

  /**
   * Sends an operator message: updates local state optimistically
   * and persists to the backend via POST /api/v1/chats/{personNumber}/messages.
   * sender field sent to backend is literally "operator" so it can be distinguished on reload.
   */
  const sendMessage = useCallback(async (conversationId, text, operatorName) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const message = {
      id: uuidv4(),
      conversationId,
      sender: 'operator',
      senderName: operatorName,
      text: trimmed,
      createdAt: Date.now(),
    }

    // Optimistic local update
    messageStorage.add(conversationId, message)
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }))
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, lastMessage: trimmed, lastMessageAt: message.createdAt }
          : c
      )
    )

    // Persist to backend (fire-and-forget: UI is already updated)
    try {
      await chatsApi.sendMessage(conversationId, { sender: 'operator', content: trimmed })
    } catch {
      console.warn('No se pudo guardar el mensaje en el servidor.')
    }
  }, [])

  const receiveMessage = useCallback((conversationId, text, userName) => {
    const message = {
      id: uuidv4(),
      conversationId,
      sender: 'user',
      senderName: userName,
      text,
      createdAt: Date.now(),
    }

    messageStorage.add(conversationId, message)
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }))

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: text,
              lastMessageAt: message.createdAt,
              unread: activeId === conversationId ? 0 : (c.unread || 0) + 1,
            }
          : c
      )
    )
  }, [activeId])

  const updateStatus = useCallback((conversationId, status) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, status } : c)
    )
  }, [])

  const getMessages = useCallback((conversationId) => {
    return messages[conversationId] || []
  }, [messages])

  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId))
    setMessages(prev => {
      const { [conversationId]: _removed, ...rest } = prev
      messageStorage.deleteByConversation(conversationId)
      return rest
    })
    setActiveId(prev => (prev === conversationId ? null : prev))
  }, [])

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0)

  return (
    <ChatContext.Provider value={{
      conversations: filteredConversations,
      allConversations: conversations,
      activeId,
      activeConversation,
      searchQuery,
      setSearchQuery,
      selectConversation,
      sendMessage,
      receiveMessage,
      updateStatus,
      deleteConversation,
      getMessages,
      totalUnread,
      loadingChats,
      chatError,
      refreshChats: loadChats,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
