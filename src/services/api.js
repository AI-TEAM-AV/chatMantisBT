const BASE_URL = import.meta.env.VITE_API_URL || ''

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, opts)

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const json = await res.json()
      message = json.message || json.error || message
    } catch {}
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const usersApi = {
  /** POST /api/v1/users/login */
  login: (email, password) =>
    request('POST', '/api/v1/users/login', { email, password }),

  /** GET /api/v1/users */
  getAll: () =>
    request('GET', '/api/v1/users'),

  /** GET /api/v1/users/:id */
  getById: (userId) =>
    request('GET', `/api/v1/users/${userId}`),

  /** POST /api/v1/users */
  create: (data) =>
    request('POST', '/api/v1/users', data),

  /** PATCH /api/v1/users/:id/password */
  changePassword: (userId, data) =>
    request('PATCH', `/api/v1/users/${userId}/password`, data),

  /** DELETE /api/v1/users/:id */
  delete: (userId) =>
    request('DELETE', `/api/v1/users/${userId}`),
}

export const chatsApi = {
  /** GET /api/v1/chats/waiting */
  getWaiting: () =>
    request('GET', '/api/v1/chats/waiting'),

  /** PATCH /api/v1/chats/:personNumber/start */
  startChat: (personNumber) =>
    request('PATCH', `/api/v1/chats/${personNumber}/start`),

  /** DELETE /api/v1/chats/:personNumber */
  closeChat: (personNumber) =>
    request('DELETE', `/api/v1/chats/${personNumber}`),

  /** POST /api/v1/chats */
  createChat: (data) =>
    request('POST', '/api/v1/chats', data),
}
