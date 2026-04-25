import { useState } from 'react'
import { Plus, Folder, Pencil, Trash2, Loader2, ChevronRight, FolderTree } from 'lucide-react'
import { useCategories, useDeleteCategory } from '../../hooks/api/useCategories'
import AddCategoryModal from './AddCategoryModal'
import EditCategoryModal from './EditCategoryModal'
import ConfirmDeleteModal from '../ConfirmDeleteModal'
import PhaseManagement from './PhaseManagement'

export default function CategoriesPhasesSettings() {
  const { data: categories, isLoading } = useCategories()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const deleteCategory = useDeleteCategory()

  const handleDelete = async () => {
    if (!deletingCategory) return
    try {
      await deleteCategory.mutateAsync(deletingCategory.id)
      setDeletingCategory(null)
    } catch (error: any) {
      console.error('Delete category error:', error)
    }
  }

  // Phase management sub-view
  if (selectedCategoryId) {
    const category = categories?.find((c) => c.id === selectedCategoryId)
    return (
      <PhaseManagement
        categoryId={selectedCategoryId}
        categoryName={category?.name || ''}
        onBack={() => setSelectedCategoryId(null)}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-3">Loading categories...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Categories & Phases</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage project categories and their phases
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories && categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
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

                {/* Name */}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {category.name}
                </h3>

                {/* Description */}
                {category.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {category.description}
                  </p>
                )}

                {/* Phase count */}
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {category.phase_count} {category.phase_count === 1 ? 'phase' : 'phases'}
                </p>

                {/* Actions row */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCategoryId(category.id) }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                  >
                    Phases
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(category) }}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingCategory(category) }}
                    disabled={deleteCategory.isPending}
                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FolderTree className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Categories Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
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

      {/* Modals */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {editingCategory && (
        <EditCategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          category={editingCategory}
        />
      )}

      {deletingCategory && (
        <ConfirmDeleteModal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${deletingCategory.name}"? This will fail if the category has any phases.`}
          isDeleting={deleteCategory.isPending}
        />
      )}
    </div>
  )
}
