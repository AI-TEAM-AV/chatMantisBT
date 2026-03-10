import { formatFullTime } from '../utils/helpers.js'
import { getInitials } from '../utils/helpers.js'

export default function MessageBubble({ message, isOperator, showAvatar, operatorName, userName }) {
  const { text, createdAt, senderName } = message
  const name = isOperator ? (senderName || operatorName) : (senderName || userName)

  if (isOperator) {
    return (
      <div className="flex justify-end gap-2 group">
        <div className="max-w-[70%]">
          <div className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatFullTime(createdAt)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 group">
      {showAvatar ? (
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[11px] font-semibold shrink-0 mb-5">
          {getInitials(name)}
        </div>
      ) : (
        <div className="w-7 shrink-0" />
      )}
      <div className="max-w-[70%]">
        {showAvatar && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1 px-1">{name}</p>
        )}
        <div className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 dark:border-slate-600">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatFullTime(createdAt)}
        </p>
      </div>
    </div>
  )
}
