import type { CreateTaskInput, Task, TaskStatus } from '../types/task'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export interface FieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly details: FieldError[]

  constructor(status: number, message: string, details: FieldError[] = []) {
    super(message)
    this.status = status
    this.details = details
  }
}

interface ErrorResponse {
  error?: { message?: string; details?: FieldError[] }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running and try again.')
  }

  if (res.status === 204) return undefined as T

  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const error = (body as ErrorResponse | null)?.error
    throw new ApiError(res.status, error?.message ?? `Request failed (${res.status})`, error?.details)
  }

  return body as T
}

export function fetchTasks(status?: TaskStatus): Promise<Task[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<Task[]>(`/tasks${query}`)
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>('/tasks', { method: 'POST', body: JSON.stringify(input) })
}

export function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function deleteTask(id: string): Promise<void> {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' })
}
