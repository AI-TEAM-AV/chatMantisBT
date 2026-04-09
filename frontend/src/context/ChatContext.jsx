import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { messageStorage } from '../services/storage.js'
import { chatsApi } from '../services/api.js'
import websocketService from '../services/websocket.js'

function isBlank(value) {
  return value == null || String(value).trim() === ''
}

function buildFallbackText({ text, imageBase64, documentBase64, fileName }) {
  if (!isBlank(text)) return text
  if (!isBlank(imageBase64)) return 'Imagen adjunta'
  if (!isBlank(documentBase64)) return `Archivo adjunto: ${fileName || 'documento'}`
  return ''
}

/**
 * Maps a PendingUserResponse from the backend to a frontend conversation object.
 *   Backend state: "waiting" → frontend status: "pending"
 *   Backend state: "operator" → frontend status: "open"
 */
function mapPendingToConversation(pending) {
  const hasImage = Boolean(pending.images)
  const hasDocument = Boolean(pending.document)
  const fallbackLastMessage = hasImage
    ? 'Imagen adjunta'
    : hasDocument
      ? `Archivo adjunto: ${pending.fileName || 'documento'}`
      : ''

  return {
    id: String(pending.personNumber),
    userId: String(pending.personNumber),
    userName: pending.name || `Usuario ${pending.personNumber}`,
    subject: pending.problematic || 'Sin asunto',
    status: pending.state === 'waiting' ? 'pending' : 'open',
    priority: 'medium',
    lastMessage: pending.problematic || fallbackLastMessage,
    lastMessageAt: Date.now(),
    unread: 0,
    createdAt: Date.now(),
    imageBase64: pending.images || null,
    fileName: pending.fileName || null,
    mimeType: pending.mimetype || null,
    documentBase64: pending.document || null,
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
    text: buildFallbackText({
      text: msg.content,
      imageBase64: msg.images,
      documentBase64: msg.document,
      fileName: msg.fileName,
    }),
    createdAt: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now(),
    imageBase64: msg.images || null,
    fileName: msg.fileName || null,
    mimeType: msg.mimetype || null,
    documentBase64: msg.document || null,
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

  const loadChats = useCallback(async () => {
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
  }, [])

  const receiveSocketMessage = useCallback((payload) => {
    if (!payload || !payload.personNumber) return

    const conversationId = String(payload.personNumber)
    const message = {
      id: uuidv4(),
      conversationId,
      sender: payload.sender === 'operator' ? 'operator' : 'user',
      senderName: payload.sender,
      text: buildFallbackText({
        text: payload.content,
        imageBase64: payload.images,
        documentBase64: payload.document,
        fileName: payload.fileName,
      }),
      createdAt: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      imageBase64: payload.images || null,
      fileName: payload.fileName || null,
      mimeType: payload.mimetype || null,
      documentBase64: payload.document || null,
    }

    messageStorage.add(conversationId, message)
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }))

    setConversations(prev => {
      const existing = prev.find(c => c.id === conversationId)
      const nextLastMessage = message.text || existing?.lastMessage || ''

      if (!existing) {
        return [
          {
            id: conversationId,
            userId: conversationId,
            userName: payload.sender === 'operator' ? `Usuario ${conversationId}` : (payload.sender || `Usuario ${conversationId}`),
            subject: nextLastMessage || 'Sin asunto',
            status: 'open',
            priority: 'medium',
            lastMessage: nextLastMessage,
            lastMessageAt: message.createdAt,
            unread: activeIdRef.current === conversationId ? 0 : 1,
            createdAt: message.createdAt,
            imageBase64: message.imageBase64,
            fileName: message.fileName,
            mimeType: message.mimeType,
            documentBase64: message.documentBase64,
          },
          ...prev,
        ]
      }

      return prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: nextLastMessage,
              lastMessageAt: message.createdAt,
              unread: activeIdRef.current === conversationId ? 0 : (c.unread || 0) + 1,
            }
          : c
      )
    })
  }, [])

  // WebSocket: handle incoming messages and state updates.
  useEffect(() => {
    websocketService.connect()

    websocketService.subscribe('/topic/chats/messages', (payload) => {
      receiveSocketMessage(payload)
    })

    websocketService.subscribe('/topic/chats', (payload) => {
      if (payload?.state === 'closed' && payload?.personNumber) {
        const convId = String(payload.personNumber)
        setConversations(prev => prev.filter(c => c.id !== convId))
        setMessages(prev => {
          const { [convId]: _removed, ...rest } = prev
          messageStorage.deleteByConversation(convId)
          return rest
        })
        setActiveId(prev => (prev === convId ? null : prev))
        return
      }

      // For updates like startChat/new chat metadata, refresh from source of truth.
      if (payload?.personNumber) {
        loadChats()
      }
    })

    return () => websocketService.disconnect()
  }, [loadChats, receiveSocketMessage])

  useEffect(() => {
    loadChats()
    const interval = setInterval(loadChats, 5000)
    return () => clearInterval(interval)
  }, [loadChats])

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
   * Sends an operator message (text and/or attachment) and persists it to backend.
   * Delivery to UI happens through websocket broadcast and periodic sync.
   */
  const sendMessage = useCallback(async (conversationId, payload) => {
    const trimmed = payload?.text?.trim() || ''
    const imageBase64 = payload?.imageBase64 || null
    const documentBase64 = payload?.documentBase64 || null
    const fileName = payload?.fileName || null
    const mimeType = payload?.mimeType || null
    const hasAttachment = Boolean(imageBase64 || documentBase64)

    if (!trimmed && !hasAttachment) return

    try {
      await chatsApi.sendMessage(conversationId, {
        sender: 'operator',
        content: trimmed,
        images: imageBase64,
        fileName,
        mimetype: mimeType,
        document: documentBase64,
      })
    } catch {
      console.warn('No se pudo guardar el mensaje en el servidor.')
    }
  }, [])

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
