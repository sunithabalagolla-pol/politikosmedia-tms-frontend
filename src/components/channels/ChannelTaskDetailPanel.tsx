import { X, Loader2, TrendingUp } from 'lucide-react'
import { useChannelTask, useUpdateProgress, ChannelTaskStatus } from '../../hooks/api'
import { useUserPermissions } from '../../hooks/usePermission'
import { formatDistanceToNow, format } from 'date-fns'
import { useState, useEffect } from 'react'

const STATUS_LABEL: Record<ChannelTaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_BADGE: Record<ChannelTaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const STATUS_BAR_COLOR: Record<ChannelTaskStatus, string> = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
}

interface ChannelTaskDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  taskId: string | null
  readOnly?: boolean
}

export default function ChannelTaskDetailPanel({ isOpen, onClose, taskId, readOnly = false }: ChannelTaskDetailPanelProps) {
  const { data: task, isLoading } = useChannelTask(taskId || '')
  const { data: authData } = useUserPermissions()
  const updateProgress = useUpdateProgress()

  const [completedCount, setCompletedCount] = useState('')
  const [note, setNote] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const myAssignment = task?.assignees.find((a) => a.id === authData?.user.id)
  const isAssigned = !!myAssignment

  // Pre-fill when task loads or changes
  useEffect(() => {
    if (myAssignment) {
      setCompletedCount(myAssignment.completed_count.toString())
    }
    setNote('')
    setShowSuccess(false)
  }, [myAssignment?.completed_count, taskId])

  const handleSaveProgress = async () => {
    if (!taskId) return
    const count = parseInt(completedCount)
    if (isNaN(count) || count < 0) return

    const myEffectiveTarget = myAssignment?.individual_target ?? task?.target_count
    if (myEffectiveTarget && count > myEffectiveTarget) {
      alert(`Cannot exceed your target of ${myEffectiveTarget}`)
      return
    }

    try {
      await updateProgress.mutateAsync({
        taskId,
        input: {
          completed_count: count,
          comment: note || undefined,
        },
      })
      setNote('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error: any) {
      console.error('Failed to update progress:', error)
      const message = error?.response?.data?.message || 'Failed to update progress. Please try again.'
      alert(message)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full max-w-[380px] bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Task Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
            ) : !task ? (
              <div className="text-center py-8 text-[10px] text-gray-500">Task not found</div>
            ) : (
              <>
                {/* Title */}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white">{task.name}</h3>

                {/* Description */}
                {task.description && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Description</p>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.description}</p>
                  </div>
                )}

                {/* Info Grid - 3 cols for top row */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Channel</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.channel_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Subcategory</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.subcategory_name || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Type</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Target</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.target_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Created By</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 truncate">{task.created_by_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Created</p>
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                {/* My Progress (employee's own) */}
                {myAssignment && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">My Progress</p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                      {(() => {
                        const myTarget = myAssignment.individual_target ?? task.target_count
                        const myPct = myTarget > 0 ? Math.round((myAssignment.completed_count / myTarget) * 100) : 0
                        return (
                          <>
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className={`px-1.5 py-0.5 rounded-full font-medium text-[10px] ${STATUS_BADGE[myAssignment.status || 'not_started']}`}>
                                {STATUS_LABEL[myAssignment.status || 'not_started']}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-white">
                                {myAssignment.completed_count}/{myTarget} ({myPct}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR_COLOR[myAssignment.status || 'not_started']}`}
                                style={{ width: `${Math.min(myPct, 100)}%` }}
                              />
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Overall Progress */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Overall Progress</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className={`px-1.5 py-0.5 rounded-full font-medium text-[10px] ${STATUS_BADGE[task.status || 'not_started']}`}>
                        {STATUS_LABEL[task.status || 'not_started']}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">{task.total_completed}/{task.target_count} ({task.progress_percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR_COLOR[task.status || 'not_started']}`}
                        style={{ width: `${Math.min(task.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Assignees */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Assignees</p>
                  <div className="space-y-1">
                    {task.assignees.map((a) => {
                      const effectiveTarget = a.individual_target ?? task.target_count
                      return (
                        <div key={a.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1.5">
                            {a.avatar_url ? (
                              <img src={a.avatar_url} alt={a.name} className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#b23a48] flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white">{a.name?.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] font-medium text-gray-900 dark:text-white">{a.name}</p>
                              <p className="text-[9px] text-gray-500">{formatDistanceToNow(new Date(a.last_updated), { addSuffix: true })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-900 dark:text-white">{a.completed_count}/{effectiveTarget}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status || 'not_started']}`}>
                              {STATUS_LABEL[a.status || 'not_started']}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Update Progress - Only for assigned employees, not read-only */}
                {!readOnly && isAssigned && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                      <TrendingUp className="w-2.5 h-2.5" /> Update Progress
                    </p>
                    {(() => {
                      const myEffectiveTarget = myAssignment?.individual_target ?? task.target_count
                      return (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 space-y-1.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                                Completed <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={completedCount}
                                onChange={(e) => setCompletedCount(e.target.value)}
                                min="0"
                                max={myEffectiveTarget}
                                className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
                                placeholder={`out of ${myEffectiveTarget}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                                Note (optional)
                              </label>
                              <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={2000}
                                className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
                                placeholder="e.g., Done 5 today"
                              />
                            </div>
                          </div>
                          {showSuccess ? (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Updated!
                            </div>
                          ) : (
                            <button
                              onClick={handleSaveProgress}
                              disabled={updateProgress.isPending || completedCount === ''}
                              className="w-full px-2 py-1 text-[10px] font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition-colors disabled:opacity-50"
                            >
                              {updateProgress.isPending ? 'Saving...' : 'Save Progress'}
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Activity / Progress History */}
                {task.comments && task.comments.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Activity</p>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {task.comments.map((c) => (
                        <div key={c.id} className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-medium text-gray-900 dark:text-white">{c.user_name}</span>
                            <span className="text-[9px] text-gray-400">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                          </div>
                          {c.extracted_number !== null && (
                            <p className="text-[10px] font-medium text-teal-600 dark:text-teal-400">Progress: +{c.extracted_number}</p>
                          )}
                          {c.content && <p className="text-[10px] text-gray-600 dark:text-gray-400">{c.content}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
