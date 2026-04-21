import { Eye, Trash2, TrendingUp } from 'lucide-react'
import { ChannelTask } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import { useDeleteChannelTask } from '../../hooks/api'
import { formatDistanceToNow } from 'date-fns'
import { resolveFileUrl } from '../../lib/fileUrl'

interface ChannelTaskCardProps {
  task: ChannelTask
  onViewDetails: () => void
}

export default function ChannelTaskCard({ task, onViewDetails }: ChannelTaskCardProps) {
  const canDelete = usePermission('channel:delete')
  const deleteTask = useDeleteChannelTask()

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      await deleteTask.mutateAsync(task.id)
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
            {task.name}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Type: {task.type}</span>
            <span>•</span>
            <span>Target: {task.target_count}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {task.total_completed}/{task.target_count} ({task.progress_percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(task.progress_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Assignees:</p>
          {task.assignees.map((assignee) => (
            <div key={assignee.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {assignee.avatar_url ? (
                  <img
                    src={resolveFileUrl(assignee.avatar_url)}
                    alt={assignee.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                    {assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-gray-700 dark:text-gray-300">{assignee.name}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-900 dark:text-white font-medium">
                  {assignee.completed_count}/{task.target_count}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                  {formatDistanceToNow(new Date(assignee.last_updated), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
