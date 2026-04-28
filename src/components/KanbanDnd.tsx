import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Loader2, Pencil, Trash2, FolderTree, Layers, X, AlertCircle } from 'lucide-react'
import TaskDetailPanel from './TaskDetailPanel'
import CreateTaskModal from './CreateTaskModal'
import { useKanban, useKanbanReorder } from '../hooks/api/useKanban'
import { useDeleteTask } from '../hooks/api/useTasks'
import { usePermission } from '../hooks/usePermission'
import { useRole } from '../hooks/useRole'
import { useAuth } from '../context/AuthContext'
import { formatDate as fmtDate } from '../lib/dateUtils'
import axiosInstance from '../api/axiosInstance'
import { useCategories, useAssignedCategories } from '../hooks/api/useCategories'
import { usePhases, useAssignedPhases } from '../hooks/api/usePhases'

interface KanbanTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date: string | null
  is_overdue: boolean
  sort_order: number | null
  assignee_name: string | null
  assignee_avatar: string | null
  assignees?: Array<{ id: string; name: string; avatar_url: string | null }>
}

const COLUMN_CONFIG: Record<string, { title: string; color: string; bg: string; text: string }> = {
  'todo': { title: 'To Do', color: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-700' },
  'in-progress': { title: 'In Progress', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' },
  'hold': { title: 'Hold', color: '#94A3B8', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
  'completed': { title: 'Completed', color: '#22C55E', bg: 'bg-green-50', text: 'text-green-700' },
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const COLUMN_ORDER = ['todo', 'in-progress', 'hold', 'completed']

export default function KanbanDnd() {
  const { isAdminOrManager } = useRole()
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>()
  const [selectedPhase, setSelectedPhase] = useState<string>()
  
  const { data: kanbanData, isLoading } = useKanban({
    category_id: selectedCategory,
    phase_id: selectedPhase,
  })
  
  // Categories: Admin/Manager see all, Employee sees only assigned
  const { data: allCategories, isLoading: allCategoriesLoading } = useCategories()
  const { data: assignedCategories, isLoading: assignedCategoriesLoading } = useAssignedCategories()
  
  // Note: Backend returns 'employee' but frontend maps it to 'user' for routing
  const categories = user?.role === 'user' ? assignedCategories : allCategories
  
  // Phases: Admin/Manager see all for category, Employee sees only assigned
  const { data: allPhases } = usePhases(selectedCategory || null)
  const { data: assignedPhases } = useAssignedPhases(selectedCategory)
  const phases = user?.role === 'user' ? assignedPhases : allPhases
  
  const reorder = useKanbanReorder()
  const deleteTask = useDeleteTask()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdNote, setHoldNote] = useState('')
  const [pendingHoldDrop, setPendingHoldDrop] = useState<{ taskId: string; fromColumn: string; newIndex: number } | null>(null)

  // Permission checks
  const canEditTask = usePermission('task:edit')
  const canDeleteTask = usePermission('task:delete')

  const handleClearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedPhase(undefined)
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId || undefined)
    setSelectedPhase(undefined) // Reset phase when category changes
  }

  // 4 columns only — no overdue column
  const columns: Record<string, KanbanTask[]> = {
    'todo': kanbanData?.todo || [],
    'in-progress': kanbanData?.['in-progress'] || [],
    'hold': kanbanData?.hold || [],
    'completed': kanbanData?.completed || [],
  }

  const getFirstAssigneeName = (task: KanbanTask): string => {
    if (task.assignees && task.assignees.length > 0) return task.assignees[0].name.split(' ')[0]
    return task.assignee_name?.split(' ')[0] || '?'
  }

  const getAssigneeInitials = (task: KanbanTask): string => {
    if (task.assignees && task.assignees.length > 0) return getInitials(task.assignees[0].name)
    return task.assignee_name ? getInitials(task.assignee_name) : '?'
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return
    setReorderError(null)

    // Intercept drag to "hold" column — show hold note modal
    if (destination.droppableId === 'hold' && source.droppableId !== 'hold') {
      setPendingHoldDrop({ taskId: draggableId, fromColumn: source.droppableId, newIndex: destination.index })
      setHoldNote('')
      setShowHoldModal(true)
      return
    }

    reorder.mutate(
      {
        taskId: draggableId,
        fromColumn: source.droppableId,
        toColumn: destination.droppableId,
        newIndex: destination.index,
      },
      {
        onError: (err: any) => {
          const message = err?.response?.data?.message || 'Failed to move task'
          setReorderError(message)
          setTimeout(() => setReorderError(null), 5000)
        },
      }
    )
  }

  const handleHoldConfirm = () => {
    if (!pendingHoldDrop || !holdNote.trim()) return
    setShowHoldModal(false)
    reorder.mutate(
      {
        taskId: pendingHoldDrop.taskId,
        fromColumn: pendingHoldDrop.fromColumn,
        toColumn: 'hold',
        newIndex: pendingHoldDrop.newIndex,
        hold_note: holdNote.trim(),
      } as any,
      {
        onError: (err: any) => {
          const message = err?.response?.data?.message || 'Failed to move task'
          setReorderError(message)
          setTimeout(() => setReorderError(null), 5000)
        },
      }
    )
    setHoldNote('')
    setPendingHoldDrop(null)
  }

  const handleHoldCancel = () => {
    setShowHoldModal(false)
    setHoldNote('')
    setPendingHoldDrop(null)
  }

  const formatStatus = (s: string) => {
    if (s === 'in-progress') return 'In Progress'
    if (s === 'todo') return 'To Do'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
  }

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPhase || ''}
              onChange={(e) => setSelectedPhase(e.target.value || undefined)}
              disabled={!selectedCategory}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
            >
              <option value="">All Phases</option>
              {phases?.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || selectedPhase) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}

          {/* Active Filter Indicator */}
          {(selectedCategory || selectedPhase) && (
            <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="font-medium">Filtered:</span>
              {selectedCategory && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
                  {categories?.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedPhase && (
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                  {phases?.find(p => p.id === selectedPhase)?.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <TaskDetailPanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        hideStatusDropdown={true}
        hidePriorityDropdown={true}
      />

      {/* Reorder Error Toast */}
      {reorderError && (
        <div className="mx-4 mb-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] font-medium text-red-700 dark:text-red-400 flex-1">{reorderError}</p>
          <button onClick={() => setReorderError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4 h-full p-4 overflow-hidden">
          {COLUMN_ORDER.map(colKey => {
            const config = COLUMN_CONFIG[colKey]
            const tasks = columns[colKey] || []
            return (
              <div key={colKey} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
                <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-[11px] font-semibold text-gray-900 dark:text-white">{config.title}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${config.bg} ${config.text}`}>{tasks.length}</span>
                </div>
                <Droppable droppableId={colKey}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}>
                      {tasks.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex items-center justify-center">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">No tasks here</span>
                        </div>
                      ) : (
                        tasks.map((task: KanbanTask, index: number) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`bg-white dark:bg-gray-800 rounded-lg border p-2 transition-shadow cursor-pointer ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-[#b23a48]/20' : 'shadow-sm hover:shadow-md'
                                } ${task.is_overdue ? 'border-l-[3px] border-l-red-500' : ''} ${
                                  selectedTaskId === task.id ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/20' : task.is_overdue ? '' : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                {/* Title + overdue */}
                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                  <h4 className="text-[11px] font-medium text-gray-900 dark:text-white leading-snug">{task.title}</h4>
                                  {task.is_overdue && (
                                    <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-red-100 text-red-600 whitespace-nowrap shrink-0">Overdue</span>
                                  )}
                                </div>
                                {/* Priority dot + label */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                      task.priority === 'high' || task.priority === 'urgent' ? 'bg-orange-500' :
                                      task.priority === 'medium' ? 'bg-blue-400' : 'bg-green-500'
                                    }`} />
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] ${task.is_overdue ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                                      {fmtDate(task.due_date)}
                                    </span>
                                    <div className="w-4 h-4 rounded-full bg-[#b23a48] flex items-center justify-center shrink-0">
                                      <span className="text-[9px] font-bold text-white">{getAssigneeInitials(task)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Hold Note Modal */}
      {showHoldModal && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-[60]" onClick={handleHoldCancel} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[70] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Hold Reason</h3>
                <p className="text-xs text-gray-500">Required before setting task on hold</p>
              </div>
            </div>
            <textarea
              value={holdNote}
              onChange={(e) => setHoldNote(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Explain why this task is being put on hold..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 mb-1"
            />
            <p className="text-xs text-gray-400 text-right mb-4">{holdNote.length} / 1000</p>
            <div className="flex items-center gap-3">
              <button onClick={handleHoldCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleHoldConfirm} disabled={!holdNote.trim() || reorder.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {reorder.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Hold'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
