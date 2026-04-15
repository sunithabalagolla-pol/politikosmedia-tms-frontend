import { useState } from 'react'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { useDeletePhase } from '../../hooks/api/usePhases'
import EditPhaseModal from './EditPhaseModal'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

interface PhaseItemProps {
  phase: {
    id: string
    name: string
    description: string
    order_index: number
  }
}

export default function PhaseItem({ phase }: PhaseItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deletePhase = useDeletePhase()

  const handleDelete = async () => {
    try {
      await deletePhase.mutateAsync(phase.id)
      setIsDeleteModalOpen(false)
    } catch (error: any) {
      // Error will be shown in the modal via the mutation state
      console.error('Delete phase error:', error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">{phase.name}</p>
          {phase.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {phase.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-1.5 text-gray-400 hover:text-[#b23a48] hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Edit phase"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={deletePhase.isPending}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Delete phase"
          >
            {deletePhase.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <EditPhaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        phase={phase}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Phase"
        message={`Are you sure you want to delete "${phase.name}"? This will fail if the phase has any tasks.`}
        isDeleting={deletePhase.isPending}
      />
    </>
  )
}
