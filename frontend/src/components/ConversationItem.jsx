import { getInitials, formatMessageTime, STATUS_STYLES, STATUS_LABELS } from '../utils/helpers.js'

const PRIORITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-orange-400',
  low: 'bg-blue-400',
}

export default function ConversationItem({ conversation, isActive, onClick }) {
  const { userName, subject, lastMessage, lastMessageAt, unread, status, priority } = conversation

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-slate-100 dark:border-slate-700/50
        ${isActive
          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-l-primary-500'
          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-l-2 border-l-transparent'
        }`}
    >
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
          ${isActive
            ? 'bg-primary-600 text-white'
            : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
          }`}>
          {getInitials(userName)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${PRIORITY_DOT[priority] || 'bg-slate-300'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-semibold truncate
            ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {userName}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{formatMessageTime(lastMessageAt)}</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">{subject}</p>

        <div className="flex items-center justify-between mt-1 gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{lastMessage}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {unread > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
