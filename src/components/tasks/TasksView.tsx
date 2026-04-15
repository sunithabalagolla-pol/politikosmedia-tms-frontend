import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useCategory } from '../../hooks/api/useCategories'
import { usePhase } from '../../hooks/api/usePhases'
import CreateTaskModal from '../CreateTaskModal'
import { Breadcrumb } from './Breadcrumb'

// This component wraps the existing task list and adds navigation
interface TasksViewProps {
  renderTaskList: (phaseId: string) => React.ReactNode
}

export default function TasksView({ renderTaskList }: TasksViewProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const categoryId = searchParams.get('category') || ''
  const phaseId = searchParams.get('phase') || ''

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Determine the base path based on current route
  const basePath = location.pathname.startsWith('/manager') ? '/manager/tasks' : '/dashboard/tasks'

  // ALL HOOKS MUST BE AT THE TOP - before any returns or conditions
  const { data: category, isLoading: categoryLoading } = useCategory(categoryId)
  const { data: phase, isLoading: phaseLoading } = usePhase(phaseId)

  // Keyboard shortcuts - must be declared before any early returns
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // ESC to go back
      if (e.key === 'Escape' && !isCreateModalOpen) {
        navigate(`${basePath}?category=${categoryId}`)
      }

      // N to create new task
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !isCreateModalOpen) {
        e.preventDefault()
        setIsCreateModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCreateModalOpen, categoryId, phaseId, navigate, basePath])

  const handleBack = () => {
    navigate(`${basePath}?category=${categoryId}`)
  }

  // Loading state
  if (categoryLoading || phaseLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#b23a48] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading phase...</p>
        </div>
      </div>
    )
  }

  // Error state - Phase not found
  if (!phase || !category) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {!phase ? 'Phase Not Found' : 'Category Not Found'}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
          {!phase 
            ? 'The phase you\'re looking for doesn\'t exist or has been deleted.'
            : 'The category for this phase doesn\'t exist or has been deleted.'}
        </p>
        <button
          onClick={() => navigate(basePath)}
          className="px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
        >
          Back to Categories
        </button>
      </div>
    )
  }

  // Main render starts here
  return (
    <div className="h-full flex flex-col">
      {/* Back Button & Header */}
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Phases
        </button>

        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb
              items={[
                { label: 'Tasks', href: basePath },
                { label: category?.name || '', href: `${basePath}?category=${categoryId}` },
                { label: phase?.name || '' },
              ]}
            />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{phase?.name}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">N</kbd> to create task,{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">ESC</kbd> to go back
            </p>
          </div>

          {/* Create Task Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Task
          </button>
        </div>
      </div>

      {/* Existing Task List UI */}
      <div className="flex-1 overflow-hidden">
        {renderTaskList(phaseId)}
      </div>

      {/* Create Task Modal (with pre-filled category & phase) */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          prefilledCategory={categoryId}
          prefilledPhase={phaseId}
          categoryName={category?.name}
          phaseName={phase?.name}
        />
      )}
    </div>
  )
}
