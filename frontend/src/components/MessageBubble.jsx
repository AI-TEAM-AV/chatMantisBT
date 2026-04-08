import { formatFullTime } from '../utils/helpers.js'
import { getInitials } from '../utils/helpers.js'

function toDataUrl(base64, fallbackMime = 'application/octet-stream') {
  if (!base64) return null
  if (base64.startsWith('data:')) return base64
  return `data:${fallbackMime};base64,${base64}`
}

export default function MessageBubble({ message, isOperator, showAvatar, operatorName, userName }) {
  const { text, createdAt, senderName, imageBase64, fileName, mimeType, documentBase64 } = message
  const name = isOperator ? (senderName || operatorName) : (senderName || userName)
  const imageSrc = toDataUrl(imageBase64, mimeType || 'image/jpeg')
  const documentHref = toDataUrl(documentBase64, mimeType || 'application/octet-stream')
  const hasText = Boolean(text && text.trim())

  const attachmentContent = (
    <>
      {imageSrc && (
        <div className="mt-2.5 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <img
            src={imageSrc}
            alt="Imagen adjunta"
            className="max-h-64 w-full object-contain"
            loading="lazy"
          />
        </div>
      )}

      {documentHref && (
        <a
          href={documentHref}
          download={fileName || 'archivo-adjunto'}
          className="mt-2.5 inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-2 text-xs font-medium underline-offset-2 hover:underline"
        >
          Descargar {fileName || 'archivo adjunto'}
        </a>
      )}
    </>
  )

  if (isOperator) {
    return (
      <div className="flex justify-end gap-2 group">
        <div className="max-w-[70%]">
          <div className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm">
            {hasText && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
            )}
            {attachmentContent}
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
          {hasText && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
          )}
          {attachmentContent}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatFullTime(createdAt)}
        </p>
      </div>
    </div>
  )
}
