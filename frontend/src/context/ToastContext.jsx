import { createContext, useContext, useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = uuidv4()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const TOAST_BORDER = {
  success: 'border-l-emerald-500',
  error:   'border-l-red-500',
  info:    'border-l-primary-500',
}

const TOAST_ICON = {
  success: { char: '✓', cls: 'text-emerald-500 dark:text-emerald-400' },
  error:   { char: '✕', cls: 'text-red-500 dark:text-red-400' },
  info:    { char: 'i', cls: 'text-primary-500 dark:text-primary-400' },
}

function Toast({ toast, onDismiss }) {
  const border = TOAST_BORDER[toast.type] || TOAST_BORDER.info
  const icon = TOAST_ICON[toast.type] || TOAST_ICON.info

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl min-w-[260px] max-w-sm
        bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700
        border-l-4 ${border} shadow-lg`}
      style={{ animation: 'slideIn 0.2s ease-out' }}
    >
      <span className={`text-sm mt-0.5 shrink-0 font-bold ${icon.cls}`}>{icon.char}</span>
      <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-300 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 transition-colors ml-1 shrink-0 text-lg leading-none mt-0.5"
      >
        ×
      </button>
    </div>
  )
}
