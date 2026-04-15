import { useState } from 'react'
import { X, Loader2, Plus } from 'lucide-react'
import { useCreatePhase } from '../../hooks/api/usePhases'

interface AddPhaseModalProps {
  isOpen: boolean
  onClose: () => void
  categoryId: string
  categoryName: string
}

export default function AddPhaseModal({ isOpen, onClose, categoryId, categoryName }: AddPhaseModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const createPhase = useCreatePhase(categoryId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Phase name is required')
      return
    }

    try {
      await createPhase.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      setName('')
      setDescription('')
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create phase')
    }
  }

  const handleClose = () => {
    if (!createPhase.isPending) {
      setName('')
      setDescription('')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-50 transition-opacity" 
        onClick={handleClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[60] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Add New Phase</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Adding phase to: <span className="font-semibold">{categoryName}</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={createPhase.isPending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
              Phase Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Phase 1"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700"
              disabled={createPhase.isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this phase"
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none dark:bg-gray-700"
              disabled={createPhase.isPending}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={createPhase.isPending}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPhase.isPending || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createPhase.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Create Phase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
