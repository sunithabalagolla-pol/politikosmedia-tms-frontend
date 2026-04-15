import { useState } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react'
import { useChannel, useSubcategories, useDeleteSubcategory } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import CreateSubcategoryModal from './CreateSubcategoryModal'
import EditSubcategoryModal from './EditSubcategoryModal'

interface SubcategoryManagementProps {
  channelId: string
  onBack: () => void
}

export default function SubcategoryManagement({ channelId, onBack }: SubcategoryManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null)

  const { data: channel } = useChannel(channelId)
  const { data: subcategories = [], isLoading } = useSubcategories(channelId)
  const deleteSubcategory = useDeleteSubcategory()

  const canCreate = usePermission('channel:create')
  const canEdit = usePermission('channel:edit')
  const canDelete = usePermission('channel:delete')

  const handleDelete = async (id: string, taskCount: number) => {
    if (taskCount > 0) {
      alert('Cannot delete subcategory with tasks. Please delete all tasks first.')
      return
    }

    if (!confirm('Are you sure you want to delete this subcategory?')) return

    try {
      await deleteSubcategory.mutateAsync({ id, channelId })
    } catch (error) {
      console.error('Failed to delete subcategory:', error)
      alert('Failed to delete subcategory')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {channel?.name} - Subcategories
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage subcategories for this channel</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Subcategory
          </button>
        )}
      </div>

      {/* Subcategories List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading subcategories...</div>
      ) : subcategories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No subcategories yet. {canCreate && 'Create your first subcategory!'}
        </div>
      ) : (
        <div className="space-y-2">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {subcategory.name}
                </h3>
                {subcategory.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {subcategory.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subcategory.task_count || 0} tasks
                </p>
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    onClick={() => setEditingSubcategoryId(subcategory.id)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(subcategory.id, subcategory.task_count || 0)}
                    disabled={deleteSubcategory.isPending}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateSubcategoryModal
          channelId={channelId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingSubcategoryId && (
        <EditSubcategoryModal
          subcategoryId={editingSubcategoryId}
          channelId={channelId}
          isOpen={!!editingSubcategoryId}
          onClose={() => setEditingSubcategoryId(null)}
        />
      )}
    </div>
  )
}
