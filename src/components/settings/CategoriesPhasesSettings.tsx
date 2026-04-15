import { useState } from 'react'
import { Plus, Loader2, FolderTree } from 'lucide-react'
import { useCategories } from '../../hooks/api/useCategories'
import CategoryCard from './CategoryCard'
import AddCategoryModal from './AddCategoryModal'

export default function CategoriesPhasesSettings() {
  const { data: categories, isLoading } = useCategories()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-3">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <FolderTree className="w-6 h-6 text-gray-500 mt-1 shrink-0" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Categories & Phases Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Configure project categories and their phases. Tasks must be assigned to a category and phase.
          </p>
        </div>
      </div>

      {/* Add Category Button */}
      <div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      {categories && categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <FolderTree className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">No categories yet</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Create your first category to start organizing tasks
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Category
          </button>
        </div>
      )}

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  )
}
