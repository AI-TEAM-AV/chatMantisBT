import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authStorage } from '../services/storage.js'
import { usersApi } from '../services/api.js'

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function mapUserResponse(data) {
  const fullName = [data.name, data.surname].filter(Boolean).join(' ')
  return {
    id: data.id,
    email: data.email,
    name: fullName,
    avatar: getInitials(fullName),
    role: data.role.toLowerCase(),
  }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [operator, setOperator] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = authStorage.getOperator()
    const savedToken = authStorage.getToken()
    if (saved) setOperator(saved)
    if (savedToken) setToken(savedToken)
    setLoading(false)
  }, [])

  async function login(email, password) {
    try {
      const data = await usersApi.login(email, password)
      const safe = mapUserResponse(data)
      authStorage.setOperator(safe)
      authStorage.setToken(data.token)
      setOperator(safe)
      setToken(data.token)
      return { ok: true }
    } catch (err) {
      return { ok: false, error: 'Email o contraseña incorrectos.' }
    }
  }

  function logout() {
    authStorage.clear()
    setOperator(null)
    setToken(null)
  }

  const refreshOperator = useCallback(async () => {
    const saved = authStorage.getOperator()
    if (!saved) return
    try {
      const data = await usersApi.getById(saved.id)
      const fresh = mapUserResponse(data)
      authStorage.setOperator(fresh)
      setOperator(fresh)
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ operator, token, loading, login, logout, refreshOperator }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
