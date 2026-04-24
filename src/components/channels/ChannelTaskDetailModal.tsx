import { useState } from 'react'
import { X, MessageSquare, TrendingUp } from 'lucide-react'
import { useChannelTask, useUpdateProgress, useAddChannelComment } from '../../hooks/api'
import { useUserPermissions } from '../../hooks/usePermission'
import { formatDistanceToNow, format } from 'date-fns'
import UpdateProgressModal from './UpdateProgressModal'

interface ChannelTaskDetailModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
}

export default function ChannelTaskDetailModal({ taskId, isOpen, onClose }: ChannelTaskDetailModalProps) {
  const [showUpdateProgress, setShowUpdateProgress] = useState(false)
  const [comment, setComment] = useState('')

  const { data: task, isLoading } = useChannelTask(taskId)
  const { data: authData } = useUserPermissions()
  const addComment = useAddChannelComment()

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      await addComment.mutateAsync({ taskId, content: comment })
      setComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment')
    }
  }

  const isAssigned = task?.assignees.some((a) => a.id === authData?.user.id)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {task?.name || 'Loading...'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : !task ? (
            <div className="p-6 text-center text-gray-500">Task not found</div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Task Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Type: <span className="font-medium text-gray-900 dark:text-white">{task.type}</span></span>
                  <span>•</span>
                  <span>Target: <span className="font-medium text-gray-900 dark:text-white">{task.target_count}</span></span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Channel: <span className="font-medium text-gray-900 dark:text-white">{task.channel_name}</span> &gt; <span className="font-medium text-gray-900 dark:text-white">{task.subcategory_name}</span>
                </div>
                {task.description && (
                  <p className="text-xs text-gray-700 dark:text-gray-300">{task.description}</p>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created by {task.created_by_name} on {format(new Date(task.created_at), 'MMM d, yyyy')}
                </div>
              </div>

              {/* Overall Progress */}
              <div className="bg-[#b23a48]/10 dark:bg-[#b23a48]/20 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Overall Progress</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completed</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {task.total_completed}/{task.target_count} ({task.progress_percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#b23a48] to-[#d4515f] h-full rounded-full transition-all duration-300 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${Math.min(task.progress_percentage, 100)}%` }}
                    >
                      {task.progress_percentage > 10 && `${task.progress_percentage}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignee Progress */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Assignee Progress</h3>
                <div className="space-y-3">
                  {task.assignees.map((assignee) => {
                    const effectiveTarget = assignee.individual_target ?? task.target_count
                    return (
                    <div
                      key={assignee.id}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {assignee.avatar_url ? (
                          <img
                            src={assignee.avatar_url}
                            alt={assignee.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                            {assignee.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{assignee.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated: {formatDistanceToNow(new Date(assignee.last_updated), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {assignee.completed_count}/{effectiveTarget}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {effectiveTarget > 0 ? Math.round((assignee.completed_count / effectiveTarget) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Activity Timeline</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          {comment.user_avatar ? (
                            <img
                              src={comment.user_avatar}
                              alt={comment.user_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
                              {comment.user_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {comment.user_name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            {comment.extracted_number !== null && (
                              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">
                                Updated progress: +{comment.extracted_number}
                              </p>
                            )}
                            <p className="text-xs text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                      No activity yet
                    </p>
                  )}
                </div>
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
                />
                <div className="flex items-center justify-end gap-3">
                  {isAssigned && (
                    <button
                      type="button"
                      onClick={() => setShowUpdateProgress(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-xs font-medium"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Update My Progress
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!comment.trim() || addComment.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors disabled:opacity-50 text-xs font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Update Progress Modal */}
      {showUpdateProgress && task && (
        <UpdateProgressModal
          taskId={task.id}
          isOpen={showUpdateProgress}
          onClose={() => setShowUpdateProgress(false)}
          currentCount={task.assignees.find((a) => a.id === authData?.user.id)?.completed_count ?? 0}
          targetCount={task.target_count}
        />
      )}
    </>
  )
}
