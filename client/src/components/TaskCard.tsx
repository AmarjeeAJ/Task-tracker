import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_STATUSES,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '../types/task'

interface TaskCardProps {
  task: Task
  pending: boolean
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDelete: (task: Task) => void
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700 ring-slate-300',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  done: 'bg-green-50 text-green-700 ring-green-200',
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'text-slate-500',
  medium: 'text-amber-700',
  high: 'text-red-700',
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export function TaskCard({ task, pending, onStatusChange, onDelete }: TaskCardProps) {
  const statusSelectId = `status-${task.id}`

  return (
    <li
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm aria-busy:opacity-70"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className={`min-w-0 flex-1 font-medium break-words ${task.status === 'done' ? 'text-slate-500 line-through' : ''}`}>
          {task.title}
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 text-sm whitespace-pre-line break-words text-slate-600">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>
          Priority: <span className={`font-semibold ${PRIORITY_STYLES[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
        </span>
        <span>
          Created <time dateTime={task.createdAt}>{dateFormatter.format(new Date(task.createdAt))}</time>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <label htmlFor={statusSelectId} className="text-sm text-slate-600">
            Status
          </label>
          <select
            id={statusSelectId}
            value={task.status}
            disabled={pending}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => onDelete(task)}
          disabled={pending}
          aria-label={`Delete task: ${task.title}`}
          className="rounded-md px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  )
}
