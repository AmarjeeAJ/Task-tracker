import { useState, type FormEvent } from 'react'
import { ApiError } from '../services/taskApi'
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TITLE_MAX_LENGTH,
  type CreateTaskInput,
  type TaskPriority,
  type TaskStatus,
} from '../types/task'

interface TaskFormProps {
  onCreate: (input: CreateTaskInput) => Promise<void>
}

type FieldErrors = Partial<Record<string, string>>

const INLINE_ERROR_FIELDS = ['title', 'description']

const inputClass =
  'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 aria-invalid:border-red-500'

export function TaskForm({ onCreate }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setFieldErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await onCreate({ title, description: description || undefined, status, priority })
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
    } catch (err) {
      if (err instanceof ApiError && err.details.length > 0) {
        setFieldErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])))
        const otherErrors = err.details.filter((d) => !INLINE_ERROR_FIELDS.includes(d.field))
        if (otherErrors.length > 0) setFormError(otherErrors.map((d) => d.message).join(' '))
      } else {
        setFormError(err instanceof Error ? err.message : 'Could not create the task.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="new-task-heading"
    >
      <h2 id="new-task-heading" className="text-base font-semibold">
        New task
      </h2>

      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="task-title" className="text-sm font-medium">
            Title <span className="text-red-600">*</span>
          </label>
          <span className="text-xs text-slate-500">
            {title.length}/{TITLE_MAX_LENGTH}
          </span>
        </div>
        <input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? 'task-title-error' : undefined}
          className={inputClass}
          placeholder="What needs to be done?"
        />
        {fieldErrors.title && (
          <p id="task-title-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="task-description" className="text-sm font-medium">
          Description <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? 'task-description-error' : undefined}
          className={inputClass}
        />
        {fieldErrors.description && (
          <p id="task-description-error" className="mt-1 text-sm text-red-600">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className={inputClass}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="task-priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={inputClass}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create Task'}
      </button>
    </form>
  )
}
