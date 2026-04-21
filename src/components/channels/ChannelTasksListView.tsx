import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, Trash2 } from 'lucide-react'
import { useChannel, useSubcategories, useChannelTasks, useDeleteChannelTask } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import { Breadcrumb } from '../tasks/Breadcrumb'
import CreateChannelTaskModal from './CreateChannelTaskModal'
import ChannelTaskDetailPanel from './ChannelTaskDetailPanel'
import { resolveFileUrl } from '../../lib/fileUrl'

export default function ChannelTasksListView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const channelId = searchParams.get('channel') || ''
  const subcategoryId = searchParams.get('subcategory') || ''

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const { data: channel } = useChannel(channelId)
  const { data: subcategories } = useSubcategories(channelId)
  const { data: tasks, isLoading } = useChannelTasks(channelId, subcategoryId)
  const deleteTask = useDeleteChannelTask()

  const canCreate = usePermission('channel:create')
  const canDelete = usePermission('channel:delete')

  const basePath = location.pathname.startsWith('/manager') ? '/manager/channels' : '/dashboard/channels'
  const subcategory = subcategories?.find((s) => s.id === subcategoryId)

  const handleBack = () => {
    navigate(`${basePath}?channel=${channelId}`)
  }

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await deleteTask.mutateAsync(taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task')
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back Button */}
        <button onClick={handleBack} className="flex items-center gap-2 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to {channel?.name || 'Subcategories'}
        </button>

        {/* Breadcrumb & Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb items={[
              { label: 'Channels', href: basePath },
              { label: channel?.name || '...', href: `${basePath}?channel=${channelId}` },
              { label: subcategory?.name || '...' },
            ]} />
            <h1 className="text-[11px] font-bold text-gray-900 dark:text-white mb-1">
              {subcategory?.name || 'Tasks'}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {tasks?.length || 0} {(tasks?.length || 0) === 1 ? 'task' : 'tasks'} in this subcategory
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors text-[11px] font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Task
            </button>
          )}
        </div>

        {/* Tasks List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-2">No Tasks Yet</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">
              {canCreate ? 'Create your first task!' : 'No tasks have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const progressPct = Math.min(task.progress_percentage, 100)
              const taskStatus = task.status || 'not_started'
              const statusLabel = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' }[taskStatus]
              const statusBadge = { not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }[taskStatus]
              const borderColor = { not_started: 'bg-gray-300', in_progress: 'bg-blue-500', completed: 'bg-green-500' }[taskStatus]
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors">
                          {task.name}
                        </h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded font-medium">
                          {task.type}
                        </span>
                        <span>Target: {task.target_count}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                        {task.total_completed}/{task.target_count}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{task.progress_percentage}%</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          taskStatus === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Assignees */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {task.assignees.slice(0, 4).map((a) =>
                        a.avatar_url ? (
                          <img key={a.id} src={resolveFileUrl(a.avatar_url)} alt={a.name} className="w-5 h-5 rounded-full border border-white dark:border-gray-800" />
                        ) : (
                          <div key={a.id} className="w-5 h-5 rounded-full bg-[#b23a48] flex items-center justify-center border border-white dark:border-gray-800">
                            <span className="text-[11px] font-bold text-white">{a.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )
                      )}
                      {task.assignees.length > 4 && (
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center border border-white text-[11px] font-medium text-gray-600">
                          +{task.assignees.length - 4}
                        </div>
                      )}
                      {task.assignees.length === 0 && <span className="text-[11px] text-gray-400">Unassigned</span>}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(e, task.id)}
                          disabled={deleteTask.isPending}
                          className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateChannelTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          defaultChannelId={channelId}
          defaultSubcategoryId={subcategoryId}
        />
      )}

      {/* Task Detail Side Panel */}
      <ChannelTaskDetailPanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        readOnly
      />
    </>
  )
}
