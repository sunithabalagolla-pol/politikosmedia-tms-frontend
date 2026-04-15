import { useState } from 'react'
import { X } from 'lucide-react'
import { useCreateSubcategory } from '../../hooks/api'

interface CreateSubcategoryModalProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
}

export default function CreateSubcategoryModal({ channelId, isOpen, onClose }: CreateSubcategoryModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('')

  const createSubcategory = useCreateSubcategory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      alert('Please enter a subcategory name')
      return
    }

    try {
      await createSubcategory.mutateAsync({
        channelId,
        input: {
          name,
          description: description || undefined,
          sort_order: sortOrder ? parseInt(sortOrder) : undefined,
        },
      })
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to create subcategory:', error)
      alert('Failed to create subcategory')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setSortOrder('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Subcategory</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="e.g., Shorts, Reels"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="Optional description..."
            />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="Optional sort order"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubcategory.isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
            >
              {createSubcategory.isPending ? 'Creating...' : 'Create Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
