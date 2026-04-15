import { useState } from 'react'
import { Folder, ChevronDown, ChevronRight, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { useCategory, useDeleteCategory } from '../../hooks/api/useCategories'
import PhaseItem from './PhaseItem'
import EditCategoryModal from './EditCategoryModal'
import AddPhaseModal from './AddPhaseModal'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    description: string
    logo_url?: string | null
    phase_count: number
  }
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: categoryDetail, isLoading: loadingPhases } = useCategory(
    isExpanded ? category.id : null
  )
  const deleteCategory = useDeleteCategory()

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id)
      setIsDeleteModalOpen(false)
    } catch (error: any) {
      // Error will be shown in the modal via the mutation state
      console.error('Delete category error:', error)
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
        {/* Category Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors shrink-0"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Category Logo & Info */}
            {category.logo_url ? (
              <img 
                src={category.logo_url} 
                alt={category.name}
                className="w-10 h-10 object-contain rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-white dark:bg-gray-700 shrink-0"
              />
            ) : (
              <Folder className="w-5 h-5 text-blue-500 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {category.phase_count} {category.phase_count === 1 ? 'phase' : 'phases'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 text-gray-400 hover:text-[#b23a48] hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit category"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={deleteCategory.isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
              title="Delete category"
            >
              {deleteCategory.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Phases List (when expanded) */}
        {isExpanded && (
          <div className="mt-4 ml-8 space-y-2">
            {loadingPhases ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 text-[#b23a48] animate-spin" />
                <span className="text-xs text-gray-500 ml-2">Loading phases...</span>
              </div>
            ) : categoryDetail?.phases && categoryDetail.phases.length > 0 ? (
              <>
                {categoryDetail.phases.map((phase) => (
                  <PhaseItem key={phase.id} phase={phase} />
                ))}
              </>
            ) : (
              <div className="text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">No phases yet</p>
              </div>
            )}

            {/* Add Phase Button */}
            <button
              onClick={() => setIsAddPhaseModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Phase
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditCategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={category}
      />

      <AddPhaseModal
        isOpen={isAddPhaseModalOpen}
        onClose={() => setIsAddPhaseModalOpen(false)}
        categoryId={category.id}
        categoryName={category.name}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${category.name}"? This will fail if the category has any phases.`}
        isDeleting={deleteCategory.isPending}
      />
    </>
  )
}
