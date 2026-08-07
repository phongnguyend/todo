export type Todo = {
  id: number
  title: string
  description?: string | null
  isCompleted: boolean
  createdAt: string
  attachments?: number
}

export type Filter = 'all' | 'open' | 'completed'

export type PageResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
