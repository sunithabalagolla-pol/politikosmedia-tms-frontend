import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Layers, Loader2 } from 'lucide-react'
import { useCategory } from '../../hooks/api/useCategories'
import { useDeletePhase } from '../../hooks/api/usePhases'
import AddPhaseModal from './AddPhaseModal'
import EditPhaseModal from './EditPhaseModal'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

interface PhaseManagementProps {
  categoryId: string
  categoryName: string
  onBack: () => void
}

export default function PhaseManagement({ categoryId, categoryName, onBack }: PhaseManagementProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPhase, setEditingPhase] = useState<any | null>(null)
  const [deletingPhase, setDeletingPhase] = useState<any | null>(null)

  const { data: category, isLoading } = useCategory(categoryId)
  const deletePhase = useDeletePhase()

  const phases = category?.phases || []

  const handleDelete = async () => {
    if (!deletingPhase) return
    try {
      await deletePhase.mutateAsync(deletingPhase.id)
      setDeletingPhase(null)
    } catch (error: any) {
      console.error('Delete phase error:', error)
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
              {categoryName} — Phases
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage phases for this category</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg transition-colors text-xs font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Phase
        </button>
      </div>

      {/* Phases Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
          <span className="text-xs text-gray-500 ml-2">Loading phases...</span>
        </div>
      ) : phases.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Phases Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Create your first phase to start organizing tasks in this category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                {/* Icon */}
                <Layers className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />

                {/* Name */}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {phase.name}
                </h3>

                {/* Description */}
                {phase.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {phase.description}
                  </p>
                )}

                {/* Task count */}
                {phase.task_count !== undefined && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {phase.task_count} {phase.task_count === 1 ? 'task' : 'tasks'}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  <button
                    onClick={() => setEditingPhase(phase)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeletingPhase(phase)}
                    disabled={deletePhase.isPending}
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
      )}

      {/* Modals */}
      <AddPhaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categoryId={categoryId}
        categoryName={categoryName}
      />

      {editingPhase && (
        <EditPhaseModal
          isOpen={!!editingPhase}
          onClose={() => setEditingPhase(null)}
          phase={editingPhase}
        />
      )}

      {deletingPhase && (
        <ConfirmDeleteModal
          isOpen={!!deletingPhase}
          onClose={() => setDeletingPhase(null)}
          onConfirm={handleDelete}
          title="Delete Phase"
          message={`Are you sure you want to delete "${deletingPhase.name}"? This will fail if the phase has any tasks.`}
          isDeleting={deletePhase.isPending}
        />
      )}
    </div>
  )
}
