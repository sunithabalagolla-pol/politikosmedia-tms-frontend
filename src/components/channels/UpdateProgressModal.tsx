import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUpdateProgress } from '../../hooks/api'

interface UpdateProgressModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  currentCount?: number
  targetCount?: number
}

export default function UpdateProgressModal({ taskId, isOpen, onClose, currentCount = 0, targetCount }: UpdateProgressModalProps) {
  const [completedCount, setCompletedCount] = useState(currentCount.toString())
  const [comment, setComment] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [validationError, setValidationError] = useState('')

  const updateProgress = useUpdateProgress()

  // Pre-fill with current count when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompletedCount(currentCount.toString())
      setComment('')
      setShowSuccess(false)
      setValidationError('')
    }
  }, [isOpen, currentCount])

  const handleCountChange = (value: string) => {
    setCompletedCount(value)
    const count = parseInt(value)
    if (!isNaN(count) && targetCount && count > targetCount) {
      setValidationError(`Cannot exceed your target of ${targetCount}`)
    } else {
      setValidationError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const count = parseInt(completedCount)
    if (isNaN(count) || count < 0) {
      alert('Please enter a valid number (0 or more)')
      return
    }

    if (targetCount && count > targetCount) {
      setValidationError(`Cannot exceed your target of ${targetCount}`)
      return
    }

    try {
      await updateProgress.mutateAsync({
        taskId,
        input: {
          completed_count: count,
          comment: comment || undefined,
        },
      })
      
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 1000)
    } catch (error: any) {
      console.error('Failed to update progress:', error)
      const message = error?.response?.data?.message || 'Failed to update progress. Please try again.'
      alert(message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Update Progress</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Completed Count */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Total completed so far <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={completedCount}
              onChange={(e) => handleCountChange(e.target.value)}
              min="0"
              max={targetCount}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent ${validationError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="Enter your total (e.g., 5)"
              required
              autoFocus
            />
            {validationError ? (
              <p className="text-xs text-red-500 mt-1">{validationError}</p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {targetCount
                  ? `Enter your total completed count out of ${targetCount}`
                  : 'Enter your total completed count'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add a note (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="e.g., Completed 5 shorts today!"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {showSuccess ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Progress updated successfully!
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProgress.isPending || !!validationError}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {updateProgress.isPending ? 'Updating...' : 'Update Progress'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
