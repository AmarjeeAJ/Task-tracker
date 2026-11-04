import { useEffect, useState } from 'react'
import { DeleteConfirmation } from './components/DeleteConfirmation'
import { TaskFilters, type StatusFilter } from './components/TaskFilters'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import * as taskApi from './services/taskApi'
import { STATUS_LABELS, type CreateTaskInput, type Task, type TaskStatus } from './types/task'

interface Notice {
  kind: 'success' | 'error'
  text: string
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}

function matchesFilter(task: Task, filter: StatusFilter): boolean {
  return filter === 'all' || task.status === filter
}

export default function App() {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [reloadKey, setReloadKey] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set())
  const [notice, setNotice] = useState<Notice | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let ignore = false
    taskApi
      .fetchTasks(filter === 'all' ? undefined : filter)
      .then((data) => {
        if (ignore) return
        setTasks(data)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (!ignore) setLoadError(errorMessage(err, 'Could not load tasks.'))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [filter, reloadKey])

  function startLoading() {
    setLoading(true)
    setLoadError(null)
  }

  function changeFilter(next: StatusFilter) {
    if (next === filter) return
    startLoading()
    setFilter(next)
  }

  function retryLoad() {
    startLoading()
    setReloadKey((k) => k + 1)
  }

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev)
      if (pending) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleCreate(input: CreateTaskInput) {
    const created = await taskApi.createTask(input)
    if (matchesFilter(created, filter)) {
      setTasks((prev) => [created, ...prev])
      setNotice({ kind: 'success', text: 'Task created.' })
    } else {
      setNotice({ kind: 'success', text: `Task created with status “${STATUS_LABELS[created.status]}”. Change the filter to see it.` })
    }
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    setNotice(null)
    setPending(task.id, true)
    try {
      const updated = await taskApi.updateTaskStatus(task.id, status)
      setTasks((prev) =>
        matchesFilter(updated, filter)
          ? prev.map((t) => (t.id === updated.id ? updated : t))
          : prev.filter((t) => t.id !== updated.id),
      )
    } catch (err) {
      setNotice({ kind: 'error', text: `Could not update “${task.title}”: ${errorMessage(err, 'unknown error')}` })
    } finally {
      setPending(task.id, false)
    }
  }

  async function confirmDelete() {
    if (!taskToDelete) return
    const task = taskToDelete
    setNotice(null)
    setDeleting(true)
    setPending(task.id, true)
    try {
      await taskApi.deleteTask(task.id)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
      setNotice({ kind: 'success', text: 'Task deleted.' })
    } catch (err) {
      setNotice({ kind: 'error', text: `Could not delete “${task.title}”: ${errorMessage(err, 'unknown error')}` })
    } finally {
      setDeleting(false)
      setPending(task.id, false)
      setTaskToDelete(null)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-xl font-semibold tracking-tight">Mini Task Tracker</h1>
          <p className="mt-1 text-sm text-slate-600">Create tasks, track their progress, and filter by status.</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <TaskForm onCreate={handleCreate} />

        <section aria-labelledby="tasks-heading" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="tasks-heading" className="text-base font-semibold">
              Tasks
            </h2>
            <TaskFilters value={filter} onChange={changeFilter} />
          </div>

          {notice && (
            <div
              role={notice.kind === 'error' ? 'alert' : 'status'}
              className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                notice.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'
              }`}
            >
              <span>{notice.text}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
                className="font-medium opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          <TaskListContent
            loading={loading}
            loadError={loadError}
            filter={filter}
            tasks={tasks}
            pendingIds={pendingIds}
            onRetry={retryLoad}
            onStatusChange={handleStatusChange}
            onDelete={setTaskToDelete}
          />
        </section>
      </main>

      <DeleteConfirmation
        task={taskToDelete}
        deleting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  )
}

interface TaskListContentProps {
  loading: boolean
  loadError: string | null
  filter: StatusFilter
  tasks: Task[]
  pendingIds: ReadonlySet<string>
  onRetry: () => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDelete: (task: Task) => void
}

function TaskListContent({ loading, loadError, filter, tasks, pendingIds, onRetry, onStatusChange, onDelete }: TaskListContentProps) {
  const panelClass = 'rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm'

  if (loading) {
    return (
      <p role="status" className={`${panelClass} text-slate-500`}>
        Loading tasks…
      </p>
    )
  }

  if (loadError) {
    return (
      <div role="alert" className={`${panelClass} border-red-200 text-red-700`}>
        <p>{loadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          Retry
        </button>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <p className={`${panelClass} text-slate-500`}>
        {filter === 'all'
          ? 'No tasks yet. Create your first task using the form.'
          : `No tasks with status “${STATUS_LABELS[filter]}”.`}
      </p>
    )
  }

  return <TaskList tasks={tasks} pendingIds={pendingIds} onStatusChange={onStatusChange} onDelete={onDelete} />
}
