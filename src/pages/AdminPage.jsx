import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  MessageSquare, LogOut, Moon, Sun, UserPlus, Trash2,
  Eye, EyeOff, AlertCircle, CheckCircle2, Shield, Users, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { operatorListStorage } from '../services/storage.js'

const ROLE_LABELS = { admin: 'Admin', operator: 'Operario' }
const ROLE_STYLES = {
  admin: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  operator: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '', role: 'operator' }

function inputCls(hasError) {
  return `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors text-slate-800 dark:text-slate-200 ${
    hasError
      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30'
  }`
}

function FieldError({ msg }) {
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-red-600 dark:text-red-400">
      <AlertCircle size={11} className="shrink-0" />
      <span className="text-xs">{msg}</span>
    </div>
  )
}

function getPasswordStrength(password) {
  const checks = {
    length:  password.length >= 6,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

const PASSWORD_HINTS = [
  { key: 'length',  label: 'Mínimo 6 caracteres'         },
  { key: 'upper',   label: 'Al menos una mayúscula (A-Z)' },
  { key: 'number',  label: 'Al menos un número (0-9)'     },
  { key: 'special', label: 'Carácter especial (!@#$…)'    },
]

function PasswordStrengthHint({ password }) {
  if (!password) return null
  const { checks, score } = getPasswordStrength(password)

  const barActive =
    score <= 1 ? 'bg-red-400' :
    score === 2 ? 'bg-orange-400' :
    score === 3 ? 'bg-yellow-400' : 'bg-emerald-400'

  const labelText  =
    score <= 1 ? 'Débil' :
    score === 2 ? 'Regular' :
    score === 3 ? 'Buena' : 'Fuerte'

  const labelColor =
    score <= 1 ? 'text-red-500' :
    score === 2 ? 'text-orange-500' :
    score === 3 ? 'text-yellow-500' : 'text-emerald-500'

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? barActive : 'bg-slate-200 dark:bg-slate-600'}`}
            />
          ))}
        </div>
        <span className={`text-[10px] font-semibold ${labelColor}`}>{labelText}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {PASSWORD_HINTS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            {checks[key]
              ? <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
              : <AlertCircle  size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
            }
            <span className={`text-[10px] ${checks[key] ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { operator, logout } = useAuth()
  const { dark, toggle } = useTheme()

  const [operators, setOperators] = useState([])
  const [view, setView] = useState('list')
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    setOperators(operatorListStorage.getAll())
  }, [])

  function reload() {
    setOperators(operatorListStorage.getAll())
  }

  function showFeedback(type, text) {
    setFeedback({ type, text })
    setTimeout(() => setFeedback(null), 4000)
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Nombre requerido.'
    if (!form.email.trim()) {
      errs.email = 'Email requerido.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Email inválido.'
    } else if (operatorListStorage.findByEmail(form.email)) {
      errs.email = 'Este email ya está registrado.'
    }
    if (!form.password) {
      errs.password = 'Contraseña requerida.'
    } else if (form.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres.'
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden.'
    }
    return errs
  }

  function handleCreate(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const newOp = {
      id: uuidv4(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      avatar: getInitials(form.name.trim()),
      createdAt: Date.now(),
    }
    operatorListStorage.add(newOp)
    setForm(EMPTY_FORM); setErrors({}); setView('list'); reload()
    showFeedback('success', `${newOp.role === 'admin' ? 'Admin' : 'Operario'} "${newOp.name}" creado correctamente.`)
  }

  function handleDelete(op) {
    operatorListStorage.remove(op.id)
    reload(); setConfirmDelete(null)
    showFeedback('success', `Operario "${op.name}" eliminado.`)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const otherOperators = operators.filter(op => op.id !== operator?.id)
  const meOp = operators.find(op => op.id === operator?.id)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">

      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Mesa de Ayuda</span>
            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400">
              Panel Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
              {operator?.avatar || 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{operator?.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{operator?.email}</p>
            </div>
          </div>
          <button
            onClick={toggle}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <Users size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Gestión de Operarios</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {operators.length} cuenta{operators.length !== 1 ? 's' : ''} registrada{operators.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {view === 'list' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setView('create'); setForm({ ...EMPTY_FORM, role: 'operator' }); setErrors({}) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
              >
                <UserPlus size={15} />
                Crear operario
              </button>
              <button
                onClick={() => { setView('create'); setForm({ ...EMPTY_FORM, role: 'admin' }); setErrors({}) }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <Shield size={15} />
                Crear admin
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border
            ${feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400'}`}>
            <CheckCircle2 size={15} className="shrink-0" />
            <span className="text-xs">{feedback.text}</span>
          </div>
        )}

        {/* LIST */}
        {view === 'list' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 shadow-sm overflow-hidden">
            {operators.map(op => (
              <div key={op.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold shrink-0 select-none">
                  {op.avatar || getInitials(op.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{op.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_STYLES[op.role]}`}>
                      {ROLE_LABELS[op.role]}
                    </span>
                    {op.id === operator?.id && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">(tú)</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{op.email}</p>
                </div>
                {op.id !== operator?.id && (
                  <button
                    onClick={() => setConfirmDelete(op)}
                    title="Eliminar operario"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CREATE FORM */}
        {view === 'create' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {form.role === 'admin' ? 'Nuevo admin' : 'Nuevo operario'}
              </h2>
              <button
                onClick={() => { setView('list'); setErrors({}) }}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreate} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre completo</label>
                <input name="name" type="text" autoFocus value={form.name} onChange={handleChange}
                  placeholder="Juan García" className={inputCls(errors.name)} />
                {errors.name && <FieldError msg={errors.name} />}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="juan@empresa.com" className={inputCls(errors.email)} />
                {errors.email && <FieldError msg={errors.email} />}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange}
                    placeholder="Mínimo 6 caracteres" className={inputCls(errors.password) + ' pr-10'} />
                  <button type="button" onClick={() => setShowPass(s => !s)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <PasswordStrengthHint password={form.password} />
                {errors.password && <FieldError msg={errors.password} />}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirmar contraseña</label>
                <div className="relative">
                  <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repetí la contraseña" className={inputCls(errors.confirmPassword) + ' pr-10'} />
                  <button type="button" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.confirmPassword && <FieldError msg={errors.confirmPassword} />}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setView('list'); setErrors({}) }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
                  {form.role === 'admin' ? 'Crear admin' : 'Crear operario'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-6 max-w-xs w-full">
            <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-center">Eliminar operario</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5">
              ¿Eliminás a <strong className="text-slate-700 dark:text-slate-300">{confirmDelete.name}</strong>?
              Ya no podrá acceder al sistema.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
