import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '../types/task'

export type StatusFilter = TaskStatus | 'all'

interface TaskFiltersProps {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Tasks' },
  ...TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]

export function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <div role="group" aria-label="Filter tasks by status" className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const active = filter.value === value
        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}
