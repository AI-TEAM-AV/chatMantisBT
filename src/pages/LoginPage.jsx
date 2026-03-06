import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { Eye, EyeOff, MessageSquare, AlertCircle, Moon, Sun } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Completá todos los campos.')
      return
    }
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (result.ok) {
      navigate('/', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">

      <button
        onClick={toggle}
        title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full
          bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
          text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
          hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4 shadow-lg">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Mesa de Ayuda: GDE Entre Ríos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ingresá con tu cuenta</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <form onSubmit={handleSubmit} noValidate>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={form.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors outline-none
                    text-slate-800 dark:text-slate-200
                    ${error
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30'
                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30'
                    }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm transition-colors outline-none
                      text-slate-800 dark:text-slate-200
                      ${error
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900/30'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-3.5 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                <span className="text-xs">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800
                text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>


      </div>
    </div>
  )
}
