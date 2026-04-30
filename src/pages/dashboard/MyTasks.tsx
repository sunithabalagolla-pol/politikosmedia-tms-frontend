import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import TaskDetailPanel from '../../components/TaskDetailPanel'
import {
  Filter, ListChecks, Clock, CheckCircle2, AlertTriangle, List, LayoutGrid,
  X, Circle, Calendar, Flag, CircleDot, Loader2, Check, Pencil, Trash2, AlertCircle, Video, Tv
} from 'lucide-react'
import { useMyTasks, useMyTasksStats, useDeleteTask } from '../../hooks/api/useTasks'
import { useMyChannelTasks } from '../../hooks/api'
import { useMyShowTasks } from '../../hooks/api/useShows'
import { usePermission } from '../../hooks/usePermission'
import { useRole } from '../../hooks/useRole'
import { formatDate as fmtDate } from '../../lib/dateUtils'
import CreateTaskModal from '../../components/CreateTaskModal'
import axiosInstance from '../../api/axiosInstance'
import ChannelTasksView from '../../components/overview/ChannelTasksView'
import ShowTasksView from '../../components/shows/ShowTasksView'

export default function MyTasks() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [taskType, setTaskType] = useState<'regular' | 'channel' | 'show'>('regular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [holdTaskId, setHoldTaskId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const filterRef = useRef<HTMLDivElement>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Permission checks
  const { isAdmin } = useRole()
  const canEditTask = isAdmin() || usePermission('task:edit_any')
  const canDeleteTask = isAdmin() || usePermission('task:delete')

  const [filters, setFilters] = useState({
    status: { 'todo': false, 'in-progress': false, 'completed': false, 'hold': false },
    priority: { 'high': false, 'medium': false, 'low': false },
    dueDate: { 'today': false, 'this-week': false, 'this-month': false, 'overdue': false }
  })
  const [activeFilters, setActiveFilters] = useState<{ status?: string; priority?: string }>({})

  // API hooks
  const { data: tasksData, isLoading } = useMyTasks({ ...activeFilters, page, limit: 20 })
  const { data: stats } = useMyTasksStats()
  const { data: channelTasks, isLoading: channelTasksLoading } = useMyChannelTasks()
  const { data: showTasks = [] } = useMyShowTasks()
  const deleteTask = useDeleteTask()

  const tasks = tasksData?.tasks || []
  const pagination = tasksData?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 }

  // Detect task types using stats total, not current page length
  const hasRegularTasks = (stats?.total ?? 0) > 0
  const hasChannelTasks = channelTasks && channelTasks.length > 0
  const hasShowTasks = showTasks.length > 0
  const taskTypeCount = [hasRegularTasks, hasChannelTasks, hasShowTasks].filter(Boolean).length
  const showTabs = taskTypeCount > 1

  // Auto-set tab if only one type exists
  useEffect(() => {
    if (taskTypeCount === 1) {
      if (hasRegularTasks) setTaskType('regular')
      else if (hasChannelTasks) setTaskType('channel')
      else if (hasShowTasks) setTaskType('show')
    }
  }, [hasRegularTasks, hasChannelTasks, hasShowTasks])

  const handleEdit = async (task: any) => {
    try {
      const { data } = await axiosInstance.get(`/api/v1/tasks/${task.id}`)
      const fullTask = data.data || data
      
      // Check if user can edit this task (backend provides can_edit flag)
      if (fullTask.can_edit === false) {
        setErrorMessage('You cannot edit tasks created by a manager or admin.')
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
      console.error('Error fetching task details:', err)
      // Show error if backend blocks access
      const message = err?.response?.data?.message || 'Failed to load task details'
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
      // Show error message in modal
      const message = error?.response?.data?.message || error?.message || 'Failed to delete task'
      setErrorMessage(message)
      setShowErrorModal(true)
      setShowDeleteConfirm(false)
      console.error('Delete task error:', error)
    }
  }

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

  const getPriorityColor = (p: string) => {
    switch (p) { case 'high': return 'bg-red-500/10 text-red-500'; case 'medium': return 'bg-yellow-500/10 text-yellow-500'; default: return 'bg-green-500/10 text-green-500' }
  }

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: ListChecks, color: 'bg-[#b23a48]/10 text-[#b23a48]' },
    { label: 'To Do', value: stats?.todo ?? 0, icon: Circle, color: 'bg-teal-500/10 text-teal-600' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
    { label: 'On Hold', value: stats?.hold ?? 0, icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-500' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertTriangle, color: 'bg-rose-500/10 text-rose-500' },
  ]

  const handleHoldConfirm = () => {
    if (holdTaskId) {
      updateStatus.mutate({ id: holdTaskId, status: 'hold', holdReason })
    }
    setShowHoldModal(false)
    setHoldReason('')
    setHoldTaskId(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Task Detail Panel */}
      <TaskDetailPanel
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />

      {/* Hold Modal */}
      {showHoldModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Reason for Hold</h3>
            <textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Add a reason…" rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b23a48] resize-none text-sm dark:bg-gray-900 dark:text-white" />
            <div className="flex items-center justify-end gap-4 mt-4">
              <button onClick={() => { setShowHoldModal(false); setHoldReason('') }}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleHoldConfirm}
                className="px-4 py-2 text-xs font-medium text-white bg-[#f39c12] hover:bg-[#e67e22] rounded-lg">Confirm Hold</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Type Tabs */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        {showTabs && (
        <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setTaskType('regular')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                taskType === 'regular'
                  ? 'bg-[#b23a48] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Regular Tasks
            </button>
            <button
              onClick={() => setTaskType('channel')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                taskType === 'channel'
                  ? 'bg-[#b23a48] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Channel Tasks
            </button>
            {hasShowTasks && (
              <button
                onClick={() => setTaskType('show')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  taskType === 'show'
                    ? 'bg-[#b23a48] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                Show Tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* Show Channel Tasks View */}
      {taskType === 'channel' && (
        <ChannelTasksView tasks={channelTasks || []} isLoading={channelTasksLoading} />
      )}

      {/* Show Tasks View */}
      {taskType === 'show' && (
        <ShowTasksView />
      )}

      {/* Show Regular Tasks View */}
      {taskType === 'regular' && (
        <>
          {/* View Toggle & Filters */}
          <div className="flex items-center justify-between mb-3">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-6 gap-2 mb-3">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium">{stat.label}</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
            <div className={`p-1.5 rounded-lg ${stat.color}`}>
              <stat.icon className="w-2.5 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3"><ListChecks className="w-6 h-6" /></div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">No tasks assigned to you</h3>
          <p className="text-xs text-gray-500 max-w-sm">Tasks assigned to you will appear here.</p>
        </div>
      ) : (
        <>
          {/* Task List / Grid */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
              {tasks.map((task: any) => {
                const borderColor = task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                return (
                  <div key={task.id} onClick={() => setSelectedTaskId(String(task.id))}
                    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden flex flex-col ${
                      selectedTaskId === String(task.id) ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : ''
                    }`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`}></div>
                    <div className="p-2.5 pl-3 flex-1 flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'completed' && <Check className="w-2 h-2 mr-0.5" />}{formatStatus(task.status)}
                        </span>
                        {task.is_overdue && <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-600">Overdue</span>}
                      </div>
                      <h3 className={`text-[11px] font-semibold group-hover:text-[#b23a48] transition-colors leading-tight line-clamp-2 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{task.description || 'No description'}</p>
                      <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <span className="text-[10px] text-gray-500">{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] flex items-center gap-0.5 ${task.is_overdue ? 'text-rose-500' : 'text-gray-400'}`}>
                            <Calendar className="w-2.5 h-2.5" />{task.due_date ? fmtDate(task.due_date) : 'No date'}
                          </span>
                          {canEditTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(task) }} className="text-gray-400 hover:text-blue-600 p-0.5 rounded">
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {canDeleteTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id) }} className="text-gray-400 hover:text-red-600 p-0.5 rounded">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {tasks.map((task: any) => (
                <div key={task.id} onClick={() => setSelectedTaskId(String(task.id))}
                  className={`bg-white dark:bg-gray-800 border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedTaskId === String(task.id) ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'
                  }`}>
                  <div className="flex items-start gap-4">
                    <button onClick={(e) => e.stopPropagation()} className="mt-1 text-gray-400 hover:text-[#b23a48] transition-colors">
                      {task.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Circle className="w-3.5 h-3.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className={`text-[11px] font-medium hover:text-[#b23a48] cursor-pointer ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'completed' && <Check className="w-3 h-3 mr-1" />}{formatStatus(task.status)}
                        </span>
                        {task.is_overdue && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600">Overdue</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">{task.description || 'No description'}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className={`w-3 h-3 ${task.is_overdue ? 'text-rose-500' : ''}`} />
                          <span className={task.is_overdue ? 'text-rose-500' : ''}>{task.due_date ? fmtDate(task.due_date) : 'No date'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {canEditTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(task) }} className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteTask && (
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(task.id) }} className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium text-gray-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span>
              </p>
              <div className="flex items-center space-x-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </>
      )}
      </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Task</h3><p className="text-xs text-gray-500">This action cannot be undone.</p></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to permanently delete this task?</p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteTaskId(null) }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleteTask.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-70">
                {deleteTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Permission Denied</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">You don't have access to perform this action</p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => { setShowErrorModal(false); setErrorMessage('') }}
                className="px-6 py-2.5 bg-[#b23a48] text-white rounded-lg text-xs font-semibold hover:bg-[#8f2e3a] transition-colors shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      <CreateTaskModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingTask(null) }} editTask={editingTask} />
    </div>
  )
}
