import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import { seedIfNeeded } from './services/seed.js'

seedIfNeeded()

function OperatorRoute({ children }) {
  const { operator, loading } = useAuth()
  if (loading) return null
  if (!operator) return <Navigate to="/login" replace />
  if (operator.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

function AdminRoute({ children }) {
  const { operator, loading } = useAuth()
  if (loading) return null
  if (!operator) return <Navigate to="/login" replace />
  if (operator.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { operator, loading } = useAuth()
  if (loading) return null
  if (!operator) return children
  return <Navigate to={operator.role === 'admin' ? '/admin' : '/'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <OperatorRoute>
            <ChatProvider>
              <ChatPage />
            </ChatProvider>
          </OperatorRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
