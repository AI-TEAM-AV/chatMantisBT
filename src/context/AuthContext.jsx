import { createContext, useContext, useState, useEffect } from 'react'
import { authStorage } from '../services/storage.js'
import { OPERATORS } from '../services/seed.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = authStorage.getOperator()
    if (saved) setOperator(saved)
    setLoading(false)
  }, [])

  function login(username, password) {
    const found = OPERATORS.find(
      op => op.username === username.trim() && op.password === password
    )
    if (!found) return { ok: false, error: 'Usuario o contraseña incorrectos.' }
    const { password: _p, ...safe } = found
    authStorage.setOperator(safe)
    setOperator(safe)
    return { ok: true }
  }

  function logout() {
    authStorage.clear()
    setOperator(null)
  }

  return (
    <AuthContext.Provider value={{ operator, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
