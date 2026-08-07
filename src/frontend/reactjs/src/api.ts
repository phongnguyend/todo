import type { PageResponse, Todo } from './types'

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')

type ApiTodo = {
  id: number
  title: string
  description?: string | null
  is_completed?: boolean
  isCompleted?: boolean
  created_at?: string
  createdAt?: string
}

export type UserProfile = {
  id?: number
  username: string
  email: string
  isActive: boolean
  createdAt?: string
}

const normalize = (item: ApiTodo): Todo => ({
  id: item.id,
  title: item.title,
  description: item.description,
  isCompleted: item.isCompleted ?? item.is_completed ?? false,
  createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
})

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('todo_access_token') ?? sessionStorage.getItem('todo_access_token')
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const fromPage = (data: Record<string, unknown>): PageResponse<Todo> => ({
  items: ((data.items as ApiTodo[]) ?? []).map(normalize),
  total: Number(data.total ?? 0),
  page: Number(data.page ?? 1),
  pageSize: Number(data.pageSize ?? data.page_size ?? 20),
  totalPages: Number(data.totalPages ?? data.total_pages ?? 1),
})

export const api = {
  enabled: Boolean(baseUrl),
  async login(email: string, password: string) {
    const result = await request<{ access_token?: string; accessToken?: string }>('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const token = result.access_token ?? result.accessToken
    if (!token) throw new Error('The API did not return an access token.')
    return token
  },
  async signup(username: string, email: string, password: string) {
    return request('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
    })
  },
  async requestPasswordReset(email: string) {
    return request('/api/users/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim() }),
    })
  },
  async getProfile(): Promise<UserProfile> {
    const data = await request<Record<string, unknown>>('/api/users/me/profile')
    return {
      id: data.id == null ? undefined : Number(data.id),
      username: String(data.username ?? ''),
      email: String(data.email ?? ''),
      isActive: Boolean(data.isActive ?? data.is_active ?? true),
      createdAt: String(data.createdAt ?? data.created_at ?? ''),
    }
  },
  async list(incomplete = false) {
    const path = `/api/todo-items${incomplete ? '/incomplete' : ''}?page=1&page_size=100&pageSize=100`
    return fromPage(await request<Record<string, unknown>>(path))
  },
  async create(input: Pick<Todo, 'title' | 'description'>) {
    return normalize(await request<ApiTodo>('/api/todo-items', { method: 'POST', body: JSON.stringify(input) }))
  },
  async update(id: number, input: Pick<Todo, 'title' | 'description'>) {
    return normalize(await request<ApiTodo>(`/api/todo-items/${id}`, { method: 'PUT', body: JSON.stringify(input) }))
  },
  async complete(id: number) {
    return normalize(await request<ApiTodo>(`/api/todo-items/${id}/complete`, { method: 'PATCH' }))
  },
  async remove(id: number) {
    return request<void>(`/api/todo-items/${id}`, { method: 'DELETE' })
  },
  async importFile(file: File) {
    const format = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel'
    const body = new FormData()
    body.append('file', file)
    return request(`/api/todo-items/import/${format}`, { method: 'POST', body })
  },
  exportUrl(format: 'csv' | 'excel') {
    return `${baseUrl}/api/todo-items/export/${format}`
  },
}
