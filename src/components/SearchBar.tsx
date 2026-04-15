import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Flag } from 'lucide-react'
import { useSearch } from '../hooks/api/useSearch'
import { useNavigate, useLocation } from 'react-router-dom'
import { formatDate } from '../lib/dateUtils'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Debounce — wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results, isLoading } = useSearch(debouncedQuery)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getTaskRoute = (taskId: string) => {
    if (location.pathname.startsWith('/manager')) return `/manager/tasks?taskId=${taskId}`
    if (location.pathname.startsWith('/user')) return `/user/my-tasks?taskId=${taskId}`
    return `/dashboard/tasks?taskId=${taskId}`
  }

  const handleSelect = (task: any) => {
    navigate(getTaskRoute(task.id))
    setQuery('')
    setShowResults(false)
  }

  const getStatusColor = (s: string) => {
    if (s === 'completed') return 'bg-green-100 text-green-700'
    if (s === 'in-progress') return 'bg-yellow-100 text-yellow-700'
    if (s === 'hold') return 'bg-orange-100 text-orange-700'
    return 'bg-blue-100 text-blue-700'
  }

  const formatStatus = (s: string) => {
    if (s === 'in-progress') return 'In Progress'
    if (s === 'todo') return 'To Do'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  const showDropdown = showResults && debouncedQuery.length >= 1

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading && debouncedQuery ? <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" /> : <Search className="w-3.5 h-3.5 text-gray-400" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true) }}
          onFocus={() => setShowResults(true)}
          placeholder="Search tasks, projects, people..."
          className="block w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] focus:bg-white dark:focus:bg-gray-600 text-xs dark:text-gray-200 transition-colors"
        />
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
          ) : results && results.length > 0 ? (
            <>
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"</span>
              </div>
              {results.map((task: any) => (
                <div key={task.id} onClick={() => handleSelect(task)}
                  className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                      {task.description && <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getStatusColor(task.status)}`}>{formatStatus(task.status)}</span>
                        {task.department_name && <span className="text-xs text-gray-400">{task.department_name}</span>}
                        {task.assignee_name && <span className="text-xs text-gray-400">{task.assignee_name}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {task.is_overdue && <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded block mb-1">Overdue</span>}
                      {task.due_date && <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>}
                      <div className="flex items-center gap-0.5 justify-end mt-0.5">
                        <Flag className={`w-2.5 h-2.5 ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'}`} />
                        <span className="text-xs text-gray-400 capitalize">{task.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : debouncedQuery.length >= 1 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-gray-500">No results for "{debouncedQuery}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
