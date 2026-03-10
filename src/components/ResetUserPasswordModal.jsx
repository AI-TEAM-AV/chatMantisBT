import { useState, useEffect, useRef } from 'react'
import { X, KeyRound, Eye, EyeOff, Loader } from 'lucide-react'
import { usersApi } from '../services/api.js'
import PasswordStrengthHint from './PasswordStrengthHint.jsx'

export default function ResetUserPasswordModal({ isOpen, onClose, user, onSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const firstRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setNewPassword('')
      setConfirmPassword('')
      setShowNew(false)
      setError('')
      setTimeout(() => firstRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      await usersApi.adminChangePassword(user.id, { newPassword })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <KeyRound size={15} className="text-primary-500" />
            <div className="flex flex-col">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Restablecer contraseña</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user.name} &lt;{user.email}&gt;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            Esta acción no requiere la contraseña actual del usuario. Después de guardar, el usuario deberá iniciar sesión con la nueva contraseña.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                ref={firstRef}
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2.5 pr-9 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                  bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200
                  focus:bg-white dark:focus:bg-slate-600 focus:border-primary-300 dark:focus:border-primary-500
                  focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none transition-all
                  placeholder-slate-400 dark:placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <PasswordStrengthHint password={newPassword} minLength={8} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repetí la nueva contraseña"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600
                bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200
                focus:bg-white dark:focus:bg-slate-600 focus:border-primary-300 dark:focus:border-primary-500
                focus:ring-1 focus:ring-primary-100 dark:focus:ring-primary-900 outline-none transition-all
                placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium rounded-lg
                bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600
                text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg
                bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader size={12} className="animate-spin" /> : <KeyRound size={12} />}
              {loading ? 'Guardando…' : 'Restablecer contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

