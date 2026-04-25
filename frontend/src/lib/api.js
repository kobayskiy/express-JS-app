export const API_BASE_URL = 'http://localhost:3000'
const API_URL = `${API_BASE_URL}/api`
const TOKEN_KEY = 'auth_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.error ?? 'Request failed')
  }

  return data
}

export const endpoints = {
  auth: {
    register: () => `/auth/register`,
    login: () => `/auth/login`,
    me: () => `/auth/me`,
  },
  posts: {
    list: () => `/posts`,
    byId: (id) => `/posts/${id}`,
  },
}

export const api = {
  auth: {
    async register({ username, email, password }) {
      return apiRequest(endpoints.auth.register(), {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      })
    },
    async login({ email, password }) {
      return apiRequest(endpoints.auth.login(), {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    },
    async me() {
      return apiRequest(endpoints.auth.me(), { method: 'GET' })
    },
  },
  posts: {
    async list() {
      return apiRequest(endpoints.posts.list(), { method: 'GET' })
    },
    async get(id) {
      return apiRequest(endpoints.posts.byId(id), { method: 'GET' })
    },
    async create({ title, content }) {
      return apiRequest(endpoints.posts.list(), {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      })
    },
    async update(id, patch) {
      return apiRequest(endpoints.posts.byId(id), {
        method: 'PUT',
        body: JSON.stringify(patch),
      })
    },
    async remove(id) {
      return apiRequest(endpoints.posts.byId(id), { method: 'DELETE' })
    },
  },
}

