import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useChannels, useSubcategories, useCreateChannelTask } from '../../hooks/api'
import { useLookupEmployees } from '../../hooks/api'

interface CreateChannelTaskModalProps {
  isOpen: boolean
  onClose: () => void
  defaultChannelId?: string
  defaultSubcategoryId?: string
}

export default function CreateChannelTaskModal({
  isOpen,
  onClose,
  defaultChannelId = '',
  defaultSubcategoryId = '',
}: CreateChannelTaskModalProps) {
  const [channelId, setChannelId] = useState(defaultChannelId)
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetCount, setTargetCount] = useState('')
  const [type, setType] = useState('')
  const [assignedTo, setAssignedTo] = useState<string[]>([])

  const { data: channels = [] } = useChannels()
  const { data: subcategories = [] } = useSubcategories(channelId)
  const { data: employees = [] } = useLookupEmployees()
  const createTask = useCreateChannelTask()

  useEffect(() => {
    setChannelId(defaultChannelId)
    setSubcategoryId(defaultSubcategoryId)
  }, [defaultChannelId, defaultSubcategoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!channelId || !subcategoryId || !name || !targetCount || !type || assignedTo.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await createTask.mutateAsync({
        channel_id: channelId,
        channel_subcategory_id: subcategoryId,
        name,
        description: description || undefined,
        target_count: parseInt(targetCount),
        type,
        assigned_to: assignedTo,
      })
      onClose()
      resetForm()
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task')
    }
  }

  const resetForm = () => {
    setChannelId(defaultChannelId)
    setSubcategoryId(defaultSubcategoryId)
    setName('')
    setDescription('')
    setTargetCount('')
    setType('')
    setAssignedTo([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleAssignee = (userId: string) => {
    setAssignedTo((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Channel Task</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Channel <span className="text-red-500">*</span>
            </label>
            <select
              value={channelId}
              onChange={(e) => {
                setChannelId(e.target.value)
                setSubcategoryId('')
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              required
            >
              <option value="">Select a channel...</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              disabled={!channelId}
              required
            >
              <option value="">Select a subcategory...</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="e.g., Create 50 YouTube Shorts"
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

          {/* Target Count */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Count <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="e.g., 50"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent"
              placeholder="e.g., Video, Image, Post, Story"
              required
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
              {employees.map((employee: { id: string; name: string }) => (
                <label key={employee.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedTo.includes(employee.id)}
                    onChange={() => toggleAssignee(employee.id)}
                    className="w-4 h-4 text-[#b23a48] border-gray-300 rounded focus:ring-[#b23a48]"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">{employee.name}</span>
                </label>
              ))}
            </div>
            {assignedTo.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Select at least one assignee</p>
            )}
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
              disabled={createTask.isPending}
              className="px-4 py-2 text-xs font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
