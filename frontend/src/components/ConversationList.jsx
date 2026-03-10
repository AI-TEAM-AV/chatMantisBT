import { useState, useRef, useEffect } from 'react'
import { Search, MessageSquare, LogOut, X, Moon, Sun, KeyRound, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useChat } from '../context/ChatContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import ConversationItem from './ConversationItem.jsx'
import ChangePasswordModal from './ChangePasswordModal.jsx'

const FILTER_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'open', label: 'Abiertos' },
  { id: 'pending', label: 'Pendientes' },
]

export default function ConversationList({ statusFilter, setStatusFilter }) {
  const { operator, logout } = useAuth()
  const { conversations, activeId, selectConversation, searchQuery, setSearchQuery, totalUnread } = useChat()
  const { dark, toggle } = useTheme()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = statusFilter === 'all'
    ? conversations
    : conversations.filter(c => c.status === statusFilter)

  return (
    <aside className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 w-80 shrink-0 transition-colors duration-200">

      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Mesa de Ayuda</span>
            {totalUnread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                {totalUnread}
              </span>
            )}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(v => !v)}
              className="flex items-center gap-1 rounded-lg px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0">
                {operator?.avatar || '?'}
              </div>
              <ChevronDown size={11} className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden z-20">

                {/* Operator info */}
                <div className="flex items-center gap-2.5 px-3 py-3 border-b border-slate-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold shrink-0">
                    {operator?.avatar || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{operator?.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{operator?.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => { setShowProfileMenu(false); setShowPasswordModal(true) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  <KeyRound size={13} className="text-slate-400 dark:text-slate-400 shrink-0" />
                  Cambiar contraseña
                </button>

                <button
                  onClick={() => { setShowProfileMenu(false); toggle() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  {dark
                    ? <Sun size={13} className="text-slate-400 dark:text-slate-400 shrink-0" />
                    : <Moon size={13} className="text-slate-400 dark:text-slate-400 shrink-0" />
                  }
                  {dark ? 'Modo claro' : 'Modo oscuro'}
                </button>

                <div className="border-t border-slate-100 dark:border-slate-600">
                  <button
                    onClick={() => { setShowProfileMenu(false); logout() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={13} className="shrink-0" />
                    Cerrar sesión
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{operator?.name}</p>
      </div>

      <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar consulta o usuario…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600
              bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200
              focus:bg-white dark:focus:bg-slate-600 focus:border-primary-300 dark:focus:border-primary-500
              focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none transition-all
              placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-100 dark:border-slate-700">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`flex-1 py-2 text-[11px] font-medium transition-colors
              ${statusFilter === tab.id
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500 dark:border-primary-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <MessageSquare size={24} className="text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {searchQuery ? 'Sin resultados' : 'No hay consultas'}
            </p>
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeId}
              onClick={() => selectConversation(conv.id)}
            />
          ))
        )}
      </div>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />

    </aside>
  )
}
