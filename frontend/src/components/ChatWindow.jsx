import { useState, useEffect, useRef } from 'react'
import {
  Send, ChevronDown, CheckCircle, Clock, Circle,
  PlayCircle, XCircle, LockKeyhole,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useChat } from '../context/ChatContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { chatsApi } from '../services/api.js'
import MessageBubble from './MessageBubble.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import {
  getInitials,
  STATUS_LABELS,
  STATUS_STYLES,
  PRIORITY_LABELS,
  PRIORITY_STYLES,
  formatRelativeTime,
} from '../utils/helpers.js'

const STATUS_ICONS = {
  open: Circle,
  pending: Clock,
  resolved: CheckCircle,
}

export default function ChatWindow() {
  const { operator } = useAuth()
  const { activeConversation, getMessages, sendMessage, updateStatus, deleteConversation } = useChat()
  const { showToast } = useToast()
  const [input, setInput] = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const statusMenuRef = useRef(null)

  const messages = activeConversation ? getMessages(activeConversation.id) : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeConversation?.status === 'open') {
      inputRef.current?.focus()
    }
    setConfirmDelete(false)
  }, [activeConversation?.id])

  useEffect(() => {
    function handleClick(e) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSend(e) {
    e?.preventDefault()
    if (!input.trim() || !activeConversation) return
    await sendMessage(activeConversation.id, input, operator.name)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleStart() {
    try {
      await chatsApi.startChat(activeConversation.id)
      updateStatus(activeConversation.id, 'open')
      setTimeout(() => inputRef.current?.focus(), 50)
    } catch {
      showToast('Error al iniciar la conversación. Intentá de nuevo.', 'error')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await chatsApi.closeChat(activeConversation.id)
      deleteConversation(activeConversation.id)
    } catch {
      showToast('Error al cerrar la conversación. Intentá de nuevo.', 'error')
      setConfirmDelete(false)
    }
  }

  async function handleResolveConfirm() {
    const name = activeConversation.userName
    try {
      await chatsApi.closeChat(activeConversation.id)
      deleteConversation(activeConversation.id)
      setShowResolveModal(false)
      showToast(`La consulta de ${name} fue resuelta y eliminada correctamente.`, 'success')
    } catch {
      showToast('Error al resolver la consulta. Intentá de nuevo.', 'error')
    }
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Send size={28} className="text-slate-300 dark:text-slate-600" />
        </div>
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300 font-medium">Seleccioná una consulta</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Elegí una conversación de la lista para responder</p>
        </div>
      </div>
    )
  }

  const { userName, subject, status, priority, createdAt } = activeConversation
  const StatusIcon = STATUS_ICONS[status] || Circle
  const isPending = status === 'pending'
  const isInputDisabled = isPending

  const renderMessages = () => {
    const items = []

    // If no messages but pending status with lastMessage, show it as initial message
    if (messages.length === 0 && isPending && activeConversation?.lastMessage) {
      const initialMessage = {
        id: `initial-${activeConversation.id}`,
        sender: 'user',
        senderName: userName,
        text: activeConversation.lastMessage,
        createdAt: activeConversation.createdAt,
      }

      items.push(
        <MessageBubble
          key={initialMessage.id}
          message={initialMessage}
          isOperator={false}
          showAvatar={true}
          operatorName={operator.name}
          userName={userName}
        />
      )
      return items
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      const isOperator = msg.sender === 'operator'
      const prev = messages[i - 1]
      const showAvatar = !prev || prev.sender !== msg.sender

      const sameDayAsPrev = prev &&
        new Date(prev.createdAt).toDateString() === new Date(msg.createdAt).toDateString()

      if (!sameDayAsPrev) {
        const dateLabel = new Date(msg.createdAt).toLocaleDateString('es-AR', {
          weekday: 'long', day: 'numeric', month: 'long'
        })
        items.push(
          <div key={`date-${msg.id}`} className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize">{dateLabel}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>
        )
      }

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOperator={isOperator}
          showAvatar={showAvatar}
          operatorName={operator.name}
          userName={userName}
        />
      )
    }
    return items
  }

  return (
    <>
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{userName}</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_STYLES[priority]}`}>
                {PRIORITY_LABELS[priority]}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subject}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{formatRelativeTime(createdAt)}</span>

          {!isPending && (
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu(s => !s)}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${STATUS_STYLES[status]}`}
              >
                <StatusIcon size={11} />
                {STATUS_LABELS[status]}
                <ChevronDown size={11} />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden z-10">
                  {Object.entries(STATUS_LABELS).filter(([key]) => key !== 'pending').map(([key, label]) => {
                    const Icon = STATUS_ICONS[key] || Circle
                    const isResolve = key === 'resolved'
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setShowStatusMenu(false)
                          if (isResolve) {
                            setShowResolveModal(true)
                          } else {
                            updateStatus(activeConversation.id, key)
                          }
                        }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors
                          ${status === key
                            ? 'bg-slate-50 dark:bg-slate-600/50 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-600'
                          }
                          ${isResolve ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        <Icon size={12} className={
                          isResolve ? 'text-emerald-500 dark:text-emerald-400'
                          : status === key ? 'text-primary-500' : 'text-slate-400 dark:text-slate-500'
                        } />
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isPending && (
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium ${STATUS_STYLES.pending}`}>
              <Clock size={11} />
              {STATUS_LABELS.pending}
            </span>
          )}
        </div>
      </div>

      {/* Pending action banner */}
      {isPending && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/30 px-5 py-3 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <LockKeyhole size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Esta consulta está pendiente de atención. Iniciá la conversación para poder responder.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium
                bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white transition-colors"
            >
              <PlayCircle size={13} />
              Iniciar
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">¿Confirmar?</span>
                <button
                  onClick={handleDelete}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium
                  bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20
                  border border-red-200 dark:border-red-800/50
                  text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
              >
                <XCircle size={13} />
                Finalizar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-2">
        {messages.length === 0 && !(isPending && activeConversation?.lastMessage) ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <p className="text-xs text-slate-500 dark:text-slate-400">No hay mensajes aún</p>
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {isPending ? (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-4 shrink-0 flex items-center justify-center gap-2">
          <LockKeyhole size={14} className="text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-400 dark:text-slate-500">Iniciá la conversación para poder responder</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              placeholder="Escribí tu respuesta… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600
                bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200
                focus:bg-white dark:focus:bg-slate-600 focus:border-primary-300 dark:focus:border-primary-500
                focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none
                transition-all placeholder-slate-400 dark:placeholder-slate-500 max-h-32 disabled:cursor-not-allowed text-sm"
              style={{ minHeight: '42px' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isInputDisabled}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary-600 text-white
                hover:bg-primary-700 active:bg-primary-800 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 pl-1">Shift + Enter para nueva línea</p>
        </div>
      )}

    </div>

    <ConfirmModal
      isOpen={showResolveModal}
      title="Resolver y cerrar consulta"
      description={`¿Estás seguro que querés marcar como resuelta la consulta de ${activeConversation?.userName}? La conversación y todos sus mensajes serán eliminados permanentemente.`}
      confirmLabel="Sí, resolver y eliminar"
      cancelLabel="Cancelar"
      variant="danger"
      onConfirm={handleResolveConfirm}
      onCancel={() => setShowResolveModal(false)}
    />
    </>
  )
}
