import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { messageStorage } from '../services/storage.js'
import { chatsApi } from '../services/api.js'

/**
 * Maps a PendingUserResponse from the backend to a frontend conversation object.
 *   Backend: { personNumber, state ("waiting"|"operator"), name, problematic }
 *   Frontend status: "pending" = waiting, "open" = operator assigned
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

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingChats, setLoadingChats] = useState(true)
  const [chatError, setChatError] = useState(null)

  async function loadChats() {
    setLoadingChats(true)
    setChatError(null)
    try {
      const data = await chatsApi.getWaiting()
      setConversations(data.map(mapPendingToConversation))
    } catch {
      setChatError('No se pudieron cargar las conversaciones. Verificá que el servidor esté disponible.')
    } finally {
      setLoadingChats(false)
    }
  }

  useEffect(() => {
    loadChats()
    setMessages(messageStorage.getAll())
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

  const sendMessage = useCallback((conversationId, text, operatorName) => {
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
