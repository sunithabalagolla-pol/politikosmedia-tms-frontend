import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Folder, Search } from 'lucide-react'
import { useCategories } from '../../hooks/api/useCategories'
import { CategoriesLoadingSkeleton } from './LoadingSkeletons'
import { useRole } from '../../hooks/useRole'

export default function CategoriesView() {
  const { data: categories, isLoading } = useCategories()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin, isAdminOrManager } = useRole()
  const [searchQuery, setSearchQuery] = useState('')

  // Determine the base path based on current route
  const basePath = location.pathname.startsWith('/manager') ? '/manager/tasks' : '/dashboard/tasks'

  const handleCategoryClick = (categoryId: string) => {
    navigate(`${basePath}?category=${categoryId}`)
  }

  const filteredCategories = categories?.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tasks</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Select a category to view phases and tasks
          </p>
        </div>
        <CategoriesLoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tasks</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Select a category to view phases and tasks
        </p>
      </div>

      {/* Search Bar */}
      {categories && categories.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-800"
          />
        </div>
      )}

      {/* Categories Grid */}
      {filteredCategories && filteredCategories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-1 content-start">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                {/* Category Logo or Folder Icon */}
                {category.logo_url ? (
                  <img 
                    src={category.logo_url} 
                    alt={category.name}
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Folder className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                )}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {category.description}
                  </p>
                )}
                <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  <span className="font-medium">
                    {category.phase_count} {category.phase_count === 1 ? 'phase' : 'phases'}
                  </span>
                  {category.task_count !== undefined && (
                    <>
                      <span>•</span>
                      <span className="font-medium">
                        {category.task_count} {category.task_count === 1 ? 'task' : 'tasks'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        /* No Search Results */
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">No categories found</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Folder className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Categories Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Categories help organize your tasks into projects and workflows
          </p>
          {isAdmin() && (
            <button
              onClick={() => navigate(basePath.replace('/tasks', '/settings'))}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
            >
              Go to Settings
            </button>
          )}
          {!isAdminOrManager() && (
            <p className="text-xs text-gray-400 mt-2">
              Contact your admin to create categories
            </p>
          )}
        </div>
      )}
    </div>
  )
}
