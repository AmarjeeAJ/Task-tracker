import type { Task, TaskStatus } from '../types/task'
import { TaskCard } from './TaskCard'

interface TaskListProps {
  tasks: Task[]
  pendingIds: ReadonlySet<string>
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDelete: (task: Task) => void
}

export function TaskList({ tasks, pendingIds, onStatusChange, onDelete }: TaskListProps) {
  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          pending={pendingIds.has(task.id)}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
