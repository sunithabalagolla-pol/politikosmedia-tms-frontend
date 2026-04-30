import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, Loader2, Trash2, Pencil, LayoutGrid, List, Calendar, Flag } from 'lucide-react'
import { useChannel, useSubcategories, useChannelTasks, useDeleteChannelTask } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import { Breadcrumb } from '../tasks/Breadcrumb'
import CreateChannelTaskModal from './CreateChannelTaskModal'
import ChannelTaskDetailPanel from './ChannelTaskDetailPanel'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

export default function ChannelTasksListView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const channelId = searchParams.get('channel') || ''
  const subcategoryId = searchParams.get('subcategory') || ''

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)

  const { data: channel } = useChannel(channelId)
  const { data: subcategories } = useSubcategories(channelId)
  const { data: tasks, isLoading } = useChannelTasks(channelId, subcategoryId)
  const deleteTask = useDeleteChannelTask()

  const canCreate = usePermission('channel:create')
  const canDelete = usePermission('channel:delete')
  const canEdit = usePermission('channel:edit')

  const basePath = location.pathname.startsWith('/manager') ? '/manager/channels' : '/dashboard/channels'
  const subcategory = subcategories?.find((s) => s.id === subcategoryId)

  const handleBack = () => {
    navigate(`${basePath}?channel=${channelId}`)
  }

  const handleDelete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    setDeleteTaskId(taskId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTaskId) return
    try {
      await deleteTask.mutateAsync(deleteTaskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
      alert('Failed to delete task')
    } finally {
      setDeleteTaskId(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Completed', badge: 'bg-green-100 text-green-700', border: 'bg-green-500' }
      case 'in_progress': return { label: 'In Progress', badge: 'bg-blue-100 text-blue-700', border: 'bg-blue-500' }
      default: return { label: 'Not Started', badge: 'bg-gray-100 text-gray-700', border: 'bg-gray-300' }
    }
  }

  return (
    <>
      <div className="h-full flex flex-col space-y-4">
        {/* Back Button */}
        <button onClick={handleBack} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
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
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {subcategory?.name || 'Tasks'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tasks?.length || 0} {(tasks?.length || 0) === 1 ? 'task' : 'tasks'} in this subcategory
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              New Task
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg w-max border border-gray-200 dark:border-gray-700">
            <button onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />Grid
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <List className="w-3.5 h-3.5 mr-1" />List
            </button>
          </div>
        </div>

        {/* Tasks Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">No Tasks Yet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {canCreate ? 'Create your first task!' : 'No tasks have been created yet.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-1 content-start">
            {tasks.map((task) => {
              const progressPct = Math.min(task.progress_percentage, 100)
              const { label: statusLabel, badge: statusBadge, border: borderColor } = getStatusConfig(task.status || 'not_started')
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
                  <div className="p-2.5 pl-3 flex-1 flex flex-col gap-1.5">
                    {/* Status + Actions */}
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusBadge}`}>
                        {statusLabel}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {canEdit && (
                          <button onClick={(e) => { e.stopPropagation(); setEditTaskId(task.id) }}
                            className="text-gray-400 hover:text-amber-600 p-0.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded" title="Edit">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={(e) => handleDelete(e, task.id)}
                            disabled={deleteTask.isPending}
                            className="text-gray-400 hover:text-red-600 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50" title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight line-clamp-2">
                      {task.name}
                    </h3>

                    {/* Type badge */}
                    <span className="inline-flex items-center self-start px-1 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded text-[10px] font-medium">
                      {task.type}
                    </span>

                    {/* Progress */}
                    <div className="mt-auto space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">{task.total_completed}/{task.target_count}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{task.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            task.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Assignees */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex -space-x-1">
                        {task.assignees.slice(0, 2).map((a) =>
                          a.avatar_url ? (
                            <img key={a.id} src={a.avatar_url} alt={a.name} className="w-4 h-4 rounded-full border border-white dark:border-gray-800" />
                          ) : (
                            <div key={a.id} className="w-4 h-4 rounded-full bg-[#b23a48] flex items-center justify-center border border-white dark:border-gray-800">
                              <span className="text-[8px] font-bold text-white">{a.name?.charAt(0).toUpperCase()}</span>
                            </div>
                          )
                        )}
                        {task.assignees.length > 2 && (
                          <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center border border-white text-[8px] font-medium text-gray-600">
                            +{task.assignees.length - 2}
                          </div>
                        )}
                        {task.assignees.length === 0 && <span className="text-[10px] text-gray-400">Unassigned</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">Target: {task.target_count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── List View ── */
          <div className="flex flex-col gap-2 flex-1">
            {tasks.map((task) => {
              const progressPct = Math.min(task.progress_percentage, 100)
              const { label: statusLabel, badge: statusBadge, border: borderColor } = getStatusConfig(task.status || 'not_started')
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
                  <div className="p-2.5 pl-4 flex items-center gap-3">
                    {/* Status */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${statusBadge}`}>
                      {statusLabel}
                    </span>

                    {/* Title & Type */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors truncate">
                        {task.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center px-1 py-0.5 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 rounded text-[10px] font-medium">
                          {task.type}
                        </span>
                        <span className="text-[10px] text-gray-400">Target: {task.target_count}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-28 shrink-0">
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500">{task.total_completed}/{task.target_count}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{task.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            task.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-purple-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Assignees */}
                    <div className="flex -space-x-1 shrink-0">
                      {task.assignees.slice(0, 3).map((a) =>
                        a.avatar_url ? (
                          <img key={a.id} src={a.avatar_url} alt={a.name} className="w-5 h-5 rounded-full border border-white dark:border-gray-800" />
                        ) : (
                          <div key={a.id} className="w-5 h-5 rounded-full bg-[#b23a48] flex items-center justify-center border border-white dark:border-gray-800">
                            <span className="text-[9px] font-bold text-white">{a.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )
                      )}
                      {task.assignees.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center border border-white text-[9px] font-medium text-gray-600">
                          +{task.assignees.length - 3}
                        </div>
                      )}
                      {task.assignees.length === 0 && <span className="text-[10px] text-gray-400 shrink-0">Unassigned</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); setEditTaskId(task.id) }}
                          className="text-gray-400 hover:text-amber-600 p-1 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={(e) => handleDelete(e, task.id)}
                          disabled={deleteTask.isPending}
                          className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50" title="Delete">
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

      {/* Create / Edit Task Modal */}
      {(showCreateModal || editTaskId) && (
        <CreateChannelTaskModal
          isOpen={showCreateModal || !!editTaskId}
          onClose={() => { setShowCreateModal(false); setEditTaskId(null) }}
          defaultChannelId={channelId}
          defaultSubcategoryId={subcategoryId}
          editTaskId={editTaskId || undefined}
        />
      )}

      {/* Task Detail Side Panel */}
      <ChannelTaskDetailPanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        readOnly
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        isDeleting={deleteTask.isPending}
      />
    </>
  )
}
