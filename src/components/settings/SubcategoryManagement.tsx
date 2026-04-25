import { useState } from 'react'
import { ArrowLeft, Plus, Edit2, Trash2, Layers } from 'lucide-react'
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

  const handleDelete = async (e: React.MouseEvent, id: string, taskCount: number) => {
    e.stopPropagation()
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
              {channel?.name} — Subcategories
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

      {/* Subcategories Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading subcategories...</div>
      ) : subcategories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Subcategories Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            {canCreate ? 'Create your first subcategory!' : 'No subcategories have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                {/* Icon */}
                <Layers className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />

                {/* Name */}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {subcategory.name}
                </h3>

                {/* Description */}
                {subcategory.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {subcategory.description}
                  </p>
                )}

                {/* Task count */}
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {subcategory.task_count || 0} {(subcategory.task_count || 0) === 1 ? 'task' : 'tasks'}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  {canEdit && (
                    <button
                      onClick={() => setEditingSubcategoryId(subcategory.id)}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(e, subcategory.id, subcategory.task_count || 0)}
                      disabled={deleteSubcategory.isPending}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
