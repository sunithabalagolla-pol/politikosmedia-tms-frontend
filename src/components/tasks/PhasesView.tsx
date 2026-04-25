import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Layers } from 'lucide-react'
import { useCategory } from '../../hooks/api/useCategories'
import { PhasesLoadingSkeleton } from './LoadingSkeletons'
import { Breadcrumb } from './Breadcrumb'
import { useRole } from '../../hooks/useRole'

export default function PhasesView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const categoryId = searchParams.get('category') || ''
  const { isAdmin } = useRole()

  const { data: category, isLoading } = useCategory(categoryId)

  // Determine the base path based on current route
  const basePath = location.pathname.startsWith('/manager') ? '/manager/tasks' : '/dashboard/tasks'

  const handlePhaseClick = (phaseId: string) => {
    navigate(`${basePath}?category=${categoryId}&phase=${phaseId}`)
  }

  const handleBack = () => {
    navigate(basePath)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Categories
        </button>
        <div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
          <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <PhasesLoadingSkeleton />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Category not found</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 text-xs font-medium text-[#b23a48] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Back to Categories
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Categories
      </button>

      {/* Breadcrumb & Header */}
      <div>
        <Breadcrumb
          items={[
            { label: 'Tasks', href: basePath },
            { label: category.name },
          ]}
        />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{category.name}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Select a phase to view tasks
        </p>
      </div>

      {/* Phases Grid */}
      {category.phases && category.phases.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {category.phases.map((phase) => (
            <div
              key={phase.id}
              onClick={() => handlePhaseClick(phase.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                <Layers className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {phase.name}
                </h3>
                {phase.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {phase.description}
                  </p>
                )}
                {phase.task_count !== undefined && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full text-center">
                    <span className="font-medium">
                      {phase.task_count} {phase.task_count === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Phases Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Phases help break down your category into manageable stages
          </p>
          {isAdmin() && (
            <button
              onClick={() => navigate(basePath.replace('/tasks', '/settings'))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
            >
              Go to Settings
            </button>
          )}
        </div>
      )}
    </div>
  )
}
