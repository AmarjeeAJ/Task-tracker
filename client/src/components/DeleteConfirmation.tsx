import { useEffect, useRef } from 'react'
import type { Task } from '../types/task'

interface DeleteConfirmationProps {
  task: Task | null
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmation({ task, deleting, onConfirm, onCancel }: DeleteConfirmationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (task && !dialog.open) dialog.showModal()
    if (!task && dialog.open) dialog.close()
  }, [task])

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault()
        if (!deleting) onCancel()
      }}
      aria-labelledby="delete-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-lg"
    >
      <h2 id="delete-dialog-title" className="text-base font-semibold">
        Delete task?
      </h2>
      <p className="mt-2 text-sm break-words text-slate-600">
        “{task?.title}” will be permanently removed. This cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          disabled={deleting}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-60"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </dialog>
  )
}
