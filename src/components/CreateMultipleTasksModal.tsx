import { X, Plus, ChevronDown, ChevronUp, Calendar, ClipboardList } from 'lucide-react'
import { useState } from 'react'

interface Task {
  id: number
  title: string
  department: string
  priority: string
  assignee: string
  dueDate: string
  status: string
  isExpanded: boolean
  isFilled: boolean
}

interface CreateMultipleTasksModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateMultipleTasksModal({ isOpen, onClose }: CreateMultipleTasksModalProps) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: '', department: 'Media', priority: 'Medium', assignee: 'Alex Morgan', dueDate: '', status: 'Backlog', isExpanded: false, isFilled: false },
    { id: 2, title: '', department: 'Media', priority: 'Medium', assignee: 'Alex Morgan', dueDate: '', status: 'Backlog', isExpanded: false, isFilled: false },
    { id: 3, title: '', department: 'Media', priority: 'Medium', assignee: 'Alex Morgan', dueDate: '', status: 'Backlog', isExpanded: false, isFilled: false },
    { id: 4, title: '', department: 'Media', priority: 'Medium', assignee: 'Alex Morgan', dueDate: '', status: 'Backlog', isExpanded: false, isFilled: false },
    { id: 5, title: '', department: 'Media', priority: 'Medium', assignee: 'Alex Morgan', dueDate: '', status: 'Backlog', isExpanded: true, isFilled: false },
  ])

  if (!isOpen) return null

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, isExpanded: !task.isExpanded } : task
    ))
  }

  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const addTask = () => {
    const newId = Math.max(...tasks.map(t => t.id)) + 1
    setTasks([...tasks, {
      id: newId,
      title: '',
      department: 'Media',
      priority: 'Medium',
      assignee: 'Alex Morgan',
      dueDate: '',
      status: 'Backlog',
      isExpanded: true,
      isFilled: false
    }])
  }

  const updateTask = (id: number, field: keyof Task, value: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const updated = { ...task, [field]: value }
        updated.isFilled = updated.title.trim() !== ''
        return updated
      }
      return task
    }))
  }

  const filledCount = tasks.filter(t => t.isFilled).length
  const totalCount = tasks.length

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900 dark:bg-black bg-opacity-75 dark:bg-opacity-60 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Create Tasks</h2>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Website Redesign</span>
                <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[#b23a48] font-medium">{totalCount} tasks</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#b23a48] rounded-full text-xs font-medium">
                <ClipboardList className="w-4 h-4" />
                <span>{totalCount} Tasks</span>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id}
                className={`rounded-xl overflow-hidden transition-all ${
                  task.isExpanded 
                    ? 'border-2 border-[#b23a48] bg-red-50/10 dark:bg-red-900/10' 
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Task Header */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer ${
                    task.isExpanded ? 'border-b border-[#b23a48]/20 bg-white/50 dark:bg-gray-800/50' : ''
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                      task.isExpanded 
                        ? 'bg-[#b23a48] text-white shadow-sm' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {task.id}
                    </div>
                    <span className={`text-sm ${
                      task.isExpanded 
                        ? 'text-[#b23a48]/60 italic font-medium' 
                        : 'text-gray-400 dark:text-gray-500 italic'
                    }`}>
                      {task.title || `Task ${task.id} — click to fill in details`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${task.isFilled ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}></div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTask(task.id)
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {task.isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#b23a48]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Form */}
                {task.isExpanded && (
                  <div className="p-5 space-y-5 bg-white dark:bg-gray-800">
                    {/* Task Title */}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Task Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                        placeholder="What needs to be done?"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Row 1: Dept, Priority, Assignee */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Department</label>
                        <div className="relative">
                          <select 
                            value={task.department}
                            onChange={(e) => updateTask(task.id, 'department', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option>Media</option>
                            <option>Tech</option>
                            <option>Design</option>
                            <option>SEO</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Priority</label>
                        <div className="relative">
                          <select 
                            value={task.priority}
                            onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Urgent</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Assignee</label>
                        <div className="relative">
                          <select 
                            value={task.assignee}
                            onChange={(e) => updateTask(task.id, 'assignee', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option>Alex Morgan</option>
                            <option>Sarah J.</option>
                            <option>Unassigned</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Due Date, Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Due Date</label>
                        <div className="relative">
                          <input 
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Calendar className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Initial Status</label>
                        <div className="relative">
                          <select 
                            value={task.status}
                            onChange={(e) => updateTask(task.id, 'status', e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option>Backlog</option>
                            <option>To Do</option>
                            <option>In Progress</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Another Task Button */}
            <button 
              onClick={addTask}
              className="w-full py-4 border-2 border-dashed border-[#b23a48]/30 rounded-xl text-xs font-medium text-[#b23a48] hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-[#b23a48]/50 transition-all flex items-center justify-center gap-2 bg-white dark:bg-gray-800"
            >
              <Plus className="w-4 h-4" /> Add Another Task
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between shrink-0">
            <div className="text-sm">
              <span className="font-bold text-orange-500">{filledCount}/{totalCount}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">tasks filled in</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={filledCount === 0}
                className={`px-5 py-2.5 text-xs font-medium text-white rounded-lg flex items-center gap-2 transition-colors ${
                  filledCount > 0 
                    ? 'bg-[#b23a48] hover:bg-[#8f2e3a] cursor-pointer' 
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                Create {totalCount} Tasks
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
