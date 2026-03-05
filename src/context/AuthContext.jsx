import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authStorage, operatorListStorage } from '../services/storage.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = authStorage.getOperator()
    if (saved) {
      const stillExists = operatorListStorage.getAll().find(op => op.id === saved.id)
      if (stillExists) {
        setOperator({ ...saved, role: stillExists.role })
      } else {
        authStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  function login(email, password) {
    const found = operatorListStorage.findByEmail(email)
    if (!found || found.password !== password) {
      return { ok: false, error: 'Email o contraseña incorrectos.' }
    }
    const { password: _p, ...safe } = found
    authStorage.setOperator(safe)
    setOperator(safe)
    return { ok: true }
  }

  function logout() {
    authStorage.clear()
    setOperator(null)
  }

  const refreshOperator = useCallback(() => {
    const saved = authStorage.getOperator()
    if (saved) {
      const fresh = operatorListStorage.getAll().find(op => op.id === saved.id)
      if (fresh) {
        const { password: _p, ...safe } = fresh
        authStorage.setOperator(safe)
        setOperator(safe)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ operator, loading, login, logout, refreshOperator }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
