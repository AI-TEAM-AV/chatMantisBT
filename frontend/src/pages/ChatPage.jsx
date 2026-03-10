import { useState } from 'react'
import ConversationList from '../components/ConversationList.jsx'
import ChatWindow from '../components/ChatWindow.jsx'

export default function ChatPage() {
  const [statusFilter, setStatusFilter] = useState('all')

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200">
      <ConversationList statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <ChatWindow />
    </div>
  )
}
