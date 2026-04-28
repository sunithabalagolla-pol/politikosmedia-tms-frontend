import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, Calendar, Check, X, Pencil, Trash2, CircleDot, Flag, Loader2, AlertCircle } from 'lucide-react'
import CreateTaskModal from '../../components/CreateTaskModal'
import TaskDetailPanel from '../../components/TaskDetailPanel'
import { useDeleteTask, useUpdateTaskStatus } from '../../hooks/api/useTasks'
import { usePhaseTasks } from '../../hooks/api/usePhases'
import { formatDate as fmtDate } from '../../lib/dateUtils'
import { usePermission } from '../../hooks/usePermission'
import { useRole } from '../../hooks/useRole'
import axiosInstance from '../../api/axiosInstance'
import CategoriesView from '../../components/tasks/CategoriesView'
import PhasesView from '../../components/tasks/PhasesView'
import TasksView from '../../components/tasks/TasksView'

export default function Tasks() {
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  const phaseId = searchParams.get('phase')

  // Level 3: Tasks View (has both category and phase)
  if (categoryId && phaseId) {
    return <TasksView renderTaskList={(phaseId) => <TaskListContent phaseId={phaseId} />} />
  }

  // Level 2: Phases View (has category only)
  if (categoryId) {
    return <PhasesView />
  }

  // Level 1: Categories View (default)
  return <CategoriesView />
}

// Extracted task list content component
function TaskListContent({ phaseId }: { phaseId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdNote, setHoldNote] = useState('')
  const [pendingHoldTaskId, setPendingHoldTaskId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [statusError, setStatusError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const filterRef = useRef<HTMLDivElement>(null)

  // Filter states
  const [activeFilters, setActiveFilters] = useState<{
    status?: string; priority?: string; search?: string
  }>({})

  const [filters, setFilters] = useState({
    status: { 'todo': false, 'in-progress': false, 'completed': false, 'hold': false },
    priority: { 'high': false, 'medium': false, 'low': false },
    dueDate: { 'today': false, 'this-week': false, 'this-month': false, 'overdue': false }
  })

  // API hooks - use usePhaseTasks when phaseId is provided
  const { data: tasksData, isLoading } = usePhaseTasks(phaseId, { ...activeFilters, page, limit: 12 })
  const deleteTask = useDeleteTask()
  const updateStatus = useUpdateTaskStatus()

  // Permission checks
  const { isAdmin } = useRole()
  const canEditTask = isAdmin() || usePermission('task:edit_any')
  const canDeleteTask = isAdmin() || usePermission('task:delete')

  const tasks = tasksData?.tasks || []
  const pagination = tasksData?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 }

  // Close filter panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        if (!(event.target as HTMLElement).closest('[data-filter-button]')) setShowFilterPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Deep link from notifications
  useEffect(() => {
    const taskId = searchParams.get('taskId')
    if (taskId) {
      setSelectedTaskId(taskId)
      searchParams.delete('taskId')
      setSearchParams(searchParams, { replace: true })
    }
  }, [])

  const handleEdit = async (task: any) => {
    // Fetch full task detail to get subtasks
    try {
      const { data } = await axiosInstance.get(`/api/v1/tasks/${task.id}`)
      const fullTask = data.data || data
      console.log('📋 Full task data:', fullTask)
      console.log('📋 Subtasks:', fullTask.subtasks)
      
      // Check if user can edit this task (backend provides can_edit flag)
      if (fullTask.can_edit === false) {
        setErrorMessage('You do not have permission to edit this task.')
        setShowErrorModal(true)
        return
      }
      
      setEditingTask({
        id: fullTask.id, title: fullTask.title, description: fullTask.description || '',
        status: fullTask.status, priority: fullTask.priority,
        department: fullTask.department_id || '', assigned: (fullTask.assignees || []).map((a: any) => a.id),
        startDate: fullTask.start_date || '', dueDate: fullTask.due_date || '',
        subtasks: (fullTask.subtasks || []).map((st: any) => ({ id: st.id, title: st.title }))
      })
      setShowEditModal(true)
    } catch (err: any) {
      console.error('❌ Error fetching task details:', err)
      // Show error message if user cannot edit this task
      const message = err?.response?.data?.message || err?.message || 'Failed to load task details'
      setErrorMessage(message)
      setShowErrorModal(true)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTaskId(id)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTaskId) return
    
    try {
      await deleteTask.mutateAsync(deleteTaskId)
      setShowDeleteConfirm(false)
      setDeleteTaskId(null)
    } catch (error: any) {
      // Show error message to user
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete task'
      alert(errorMessage)
      console.error('Delete task error:', error)
    }
  }

  const handleFilterChange = (category: 'status' | 'priority' | 'dueDate', value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: { ...prev[category], [value]: !prev[category][value as keyof typeof prev[typeof category]] }
    }))
  }

  const handleApplyFilters = () => {
    const newFilters: any = {}
    const activeStatuses = Object.entries(filters.status).filter(([, v]) => v).map(([k]) => k)
    const activePriorities = Object.entries(filters.priority).filter(([, v]) => v).map(([k]) => k)
    if (activeStatuses.length) newFilters.status = activeStatuses.join(',')
    if (activePriorities.length) newFilters.priority = activePriorities.join(',')
    setActiveFilters(newFilters)
    setPage(1)
    setShowFilterPanel(false)
  }

  const handleClearAll = () => {
    setFilters({
      status: { 'todo': false, 'in-progress': false, 'completed': false, 'hold': false },
      priority: { 'high': false, 'medium': false, 'low': false },
      dueDate: { 'today': false, 'this-week': false, 'this-month': false, 'overdue': false }
    })
    setActiveFilters({})
    setPage(1)
  }

  const getActiveFilterCount = () => {
    let count = 0
    Object.values(filters).forEach(cat => { Object.values(cat).forEach(v => { if (v) count++ }) })
    return count
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-blue-100 text-blue-700'
      case 'in-progress': return 'bg-yellow-100 text-yellow-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'hold': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatStatus = (s: string) => {
    if (s === 'in-progress') return 'In Progress'
    if (s === 'todo') return 'To Do'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  const getBorderColor = (priority: string) => {
    switch (priority) { case 'high': return 'bg-red-500'; case 'medium': return 'bg-yellow-500'; default: return 'bg-green-500' }
  }


  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (newStatus === 'hold') {
      setPendingHoldTaskId(taskId)
      setShowHoldModal(true)
    } else {
      setStatusError(null)
      try {
        await updateStatus.mutateAsync({ id: taskId, status: newStatus })
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to update status'
        setStatusError(message)
        setTimeout(() => setStatusError(null), 5000)
      }
    }
  }

  const handleHoldSubmit = async () => {
    if (!pendingHoldTaskId || !holdNote.trim()) return
    setStatusError(null)
    try {
      await updateStatus.mutateAsync({ id: pendingHoldTaskId, status: 'hold', hold_note: holdNote.trim() })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update status'
      setStatusError(message)
      setTimeout(() => setStatusError(null), 5000)
    }
    setShowHoldModal(false)
    setHoldNote('')
    setPendingHoldTaskId(null)
  }
 
const handleHoldCancel = () => {
  setShowHoldModal(false)
  setHoldNote('')
  setPendingHoldTaskId(null)
}

  return (
    <>
      <div className="h-full flex flex-col">
        {/* View Toggle and Filters */}
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg w-max border border-gray-200 dark:border-gray-700">
            <button onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>Grid
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>List
            </button>
          </div>
          <div className="relative">
            <button data-filter-button onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 transition-colors">
              <Filter className="w-3 h-3 mr-1 text-gray-500" />Filters
              {getActiveFilterCount() > 0 && <span className="ml-1 bg-[#b23a48] text-white text-xs font-semibold px-1 py-0.5 rounded-full">{getActiveFilterCount()}</span>}
            </button>
            {showFilterPanel && (
              <div ref={filterRef} className="absolute right-0 mt-2 w-[280px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">Filters</h3>
                    <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="mb-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5"><CircleDot className="w-3 h-3 text-gray-600" /><span className="text-xs font-semibold text-gray-900 dark:text-white">Status</span></div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {[['todo','To Do'],['in-progress','In Progress'],['completed','Completed'],['hold','Hold']].map(([val,label]) => (
                          <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={filters.status[val as keyof typeof filters.status]} onChange={() => handleFilterChange('status', val)} className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mb-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5"><Flag className="w-3 h-3 text-gray-600" /><span className="text-xs font-semibold text-gray-900 dark:text-white">Priority</span></div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                        {[['high','High'],['medium','Medium'],['low','Low']].map(([val,label]) => (
                          <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={filters.priority[val as keyof typeof filters.priority]} onChange={() => handleFilterChange('priority', val)} className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded" />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={handleClearAll} className="text-xs text-gray-600 hover:text-gray-900 font-medium">Clear All</button>
                    <button onClick={handleApplyFilters} className="px-4 py-1.5 bg-[#b23a48] text-white rounded-lg text-xs font-semibold hover:bg-[#8f2e3a]">Apply ({getActiveFilterCount()})</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Error Toast */}
        {statusError && (
          <div className="mb-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-[11px] font-medium text-red-700 dark:text-red-400 flex-1">{statusError}</p>
            <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
        ) : tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3"><Flag className="w-6 h-6" /></div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">No tasks yet</h3>
            <p className="text-xs text-gray-500 max-w-sm">Create your first task by navigating to the Tasks page.</p>
          </div>
        ) : (
          <>

            {/* Task Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4' : 'flex flex-col gap-2 mb-4'}>
              {tasks.map((task: any) => (
                viewMode === 'grid' ? (
                  <div key={task.id} onClick={() => setSelectedTaskId(task.id)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden flex flex-col h-full">
                    <div className={`absolute top-0 left-0 w-1 h-full ${getBorderColor(task.priority)}`}></div>
                    <div className="p-2.5 pl-3 flex-1 flex flex-col gap-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1">
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); handleStatusChange(task.id, e.target.value) }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${getStatusColor(task.status)}`}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="hold">Hold</option>
                          </select>
                          {task.is_overdue && <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">Overdue</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {canEditTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(task) }} className="text-gray-400 hover:text-blue-600 p-0.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Edit"><Pencil className="w-3 h-3" /></button>
                          )}
                          {canDeleteTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id) }} className="text-gray-400 hover:text-red-600 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      </div>
                      <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight line-clamp-2">{task.title}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{task.description || 'No description'}</p>
                      <div className="mt-auto space-y-1.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {task.department_name && <span className="inline-flex items-center px-1 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold truncate max-w-[80px]">{task.department_name}</span>}
                          <span className="inline-flex items-center px-1 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-semibold"><Flag className="w-2 h-2 mr-0.5" />{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex -space-x-1">
                            {(task.assignees || []).slice(0, 2).map((a: any) => (
                              a.avatar_url ? <img key={a.id} src={a.avatar_url} alt="" className="w-4 h-4 rounded-full border border-white dark:border-gray-800" /> :
                              <div key={a.id} className="w-4 h-4 rounded-full bg-[#b23a48] flex items-center justify-center border border-white dark:border-gray-800"><span className="text-[8px] font-bold text-white">{a.name?.split(' ').map((n: string) => n[0]).join('')}</span></div>
                            ))}
                            {(task.assignees || []).length > 2 && <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center border border-white text-[8px] font-medium text-gray-600">+{task.assignees.length - 2}</div>}
                            {(task.assignees || []).length === 0 && <span className="text-[10px] text-gray-400">Unassigned</span>}
                          </div>
                          <div className="flex items-center text-[10px] text-gray-500 font-medium">
                            {task.status === 'completed' ? <Check className="w-2.5 h-2.5 mr-0.5 text-green-500" /> : <Calendar className="w-2.5 h-2.5 mr-0.5" />}
                            {task.due_date ? fmtDate(task.due_date) : 'No date'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={task.id} onClick={() => setSelectedTaskId(task.id)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${getBorderColor(task.priority)}`}></div>
                    <div className="p-2.5 flex items-start gap-3">
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); handleStatusChange(task.id, e.target.value) }}
                        className={`px-2 py-0.5 rounded text-xs font-medium border-0 cursor-pointer focus:outline-none focus:ring-1 flex-shrink-0 ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="hold">Hold</option>
                      </select>
                      {task.is_overdue && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600 shrink-0">Overdue</span>}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] mb-0.5">{task.title}</h3>
                        <p className="text-[11px] text-gray-500 mb-1.5 line-clamp-1">{task.description || 'No description'}</p>
                        <div className="flex items-center gap-2">
                          {task.department_name && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{task.department_name}</span>}
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs font-semibold"><Flag className="w-2.5 h-2.5 mr-0.5 inline" />{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium shrink-0">{(task.assignees || []).map((a: any) => a.name).join(', ') || 'Unassigned'}</span>
                      <span className="text-xs text-gray-500 font-medium shrink-0 flex items-center"><Calendar className="w-2.5 h-2.5 mr-0.5" />{task.due_date ? fmtDate(task.due_date) : '—'}</span>
                      {(canEditTask || canDeleteTask) && (
                        <div className="flex items-center gap-1 shrink-0">
                          {canEditTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(task) }} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                          )}
                          {canDeleteTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id) }} className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium text-gray-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> results
              </p>
              <div className="flex items-center space-x-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Task</h3><p className="text-xs text-gray-500">This action cannot be undone.</p></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to permanently delete this task? All subtasks, attachments, and comments will be removed.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteTaskId(null) }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteTask.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-70">
                {deleteTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <CreateTaskModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingTask(null) }} editTask={editingTask} />

      {/* Hold Reason Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
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
              <button onClick={handleHoldSubmit} disabled={!holdNote.trim() || updateStatus.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Hold'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Permission Denied</h3>
                <p className="text-xs text-gray-500">You don't have access to perform this action</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">{errorMessage}</p>
            <button onClick={() => { setShowErrorModal(false); setErrorMessage('') }}
              className="w-full px-4 py-2 bg-[#b23a48] text-white rounded-lg text-xs font-semibold hover:bg-[#8f2e3a]">
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  )
}
