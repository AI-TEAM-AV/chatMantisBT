import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { conversationStorage, messageStorage, storage } from '../services/storage.js'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const all = conversationStorage.getAll()
    const resolved = all.filter(c => c.status === 'resolved')
    const active = all.filter(c => c.status !== 'resolved')

    if (resolved.length > 0) {
      resolved.forEach(c => messageStorage.deleteByConversation(c.id))
      conversationStorage.save(active)
    }

    setConversations(active)
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
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, unread: 0 } : c)
      conversationStorage.save(updated)
      return updated
    })
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

    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === conversationId
          ? { ...c, lastMessage: trimmed, lastMessageAt: message.createdAt }
          : c
      )
      conversationStorage.save(updated)
      return updated
    })
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

    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: text,
              lastMessageAt: message.createdAt,
              unread: activeId === conversationId ? 0 : (c.unread || 0) + 1,
            }
          : c
      )
      conversationStorage.save(updated)
      return updated
    })
  }, [activeId])

  const updateStatus = useCallback((conversationId, status) => {
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === conversationId ? { ...c, status } : c
      )
      conversationStorage.save(updated)
      return updated
    })
  }, [])

  const getMessages = useCallback((conversationId) => {
    return messages[conversationId] || []
  }, [messages])

  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== conversationId)
      conversationStorage.save(updated)
      return updated
    })
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
