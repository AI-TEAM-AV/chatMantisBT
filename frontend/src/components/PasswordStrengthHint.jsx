import { AlertCircle, CheckCircle2 } from 'lucide-react'

function getPasswordStrength(password, minLength) {
  const checks = {
    length: password.length >= minLength,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

export default function PasswordStrengthHint({ password, minLength = 6 }) {
  if (!password) return null

  const { checks, score } = getPasswordStrength(password, minLength)

  const barActive =
    score <= 1 ? 'bg-red-400' :
    score === 2 ? 'bg-orange-400' :
    score === 3 ? 'bg-yellow-400' : 'bg-emerald-400'

  const labelText =
    score <= 1 ? 'Débil' :
    score === 2 ? 'Regular' :
    score === 3 ? 'Buena' : 'Fuerte'

  const labelColor =
    score <= 1 ? 'text-red-500' :
    score === 2 ? 'text-orange-500' :
    score === 3 ? 'text-yellow-500' : 'text-emerald-500'

  const PASSWORD_HINTS = [
    { key: 'length', label: `Mínimo ${minLength} caracteres` },
    { key: 'upper', label: 'Al menos una mayúscula (A-Z)' },
    { key: 'number', label: 'Al menos un número (0-9)' },
    { key: 'special', label: 'Carácter especial (!@#$…)' },
  ]

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
              : <AlertCircle size={10} className="text-slate-300 dark:text-slate-600 shrink-0" />
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

