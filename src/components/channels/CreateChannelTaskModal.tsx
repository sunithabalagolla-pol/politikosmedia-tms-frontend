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

  // Determine if channel/subcategory should be frozen (pre-filled from context)
  const isChannelFrozen = !!defaultChannelId
  const isSubcategoryFrozen = !!defaultSubcategoryId

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

  if (!isOpen) return null

  // Get display names for frozen fields
  const channelName = channels.find((c) => c.id === channelId)?.name || channelId
  const subcategoryName = subcategories.find((s) => s.id === subcategoryId)?.name || subcategoryId

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Create Channel Task</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {/* Channel & Subcategory row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Channel <span className="text-red-500">*</span>
                </label>
                {isChannelFrozen ? (
                  <input
                    type="text"
                    value={channelName}
                    disabled
                    className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={channelId}
                    onChange={(e) => { setChannelId(e.target.value); setSubcategoryId('') }}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    required
                  >
                    <option value="">Select channel...</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>{channel.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Subcategory <span className="text-red-500">*</span>
                </label>
                {isSubcategoryFrozen ? (
                  <input
                    type="text"
                    value={subcategoryName}
                    disabled
                    className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    disabled={!channelId}
                    required
                  >
                    <option value="">Select subcategory...</option>
                    {subcategories.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Task Name */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                placeholder="e.g., Create 50 YouTube Shorts"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors resize-none"
                placeholder="Optional description..."
              />
            </div>

            {/* Target Count + Type + Assign To row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Target Count <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  min="1"
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                  placeholder="e.g., 50"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  maxLength={100}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                  placeholder="e.g., Video, Image"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Assign To <span className="text-red-500">*</span> {assignedTo.length > 0 && <span className="font-normal text-gray-400">({assignedTo.length})</span>}
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const userId = e.target.value
                    if (!userId) return
                    if (!assignedTo.includes(userId)) {
                      setAssignedTo([...assignedTo, userId])
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                >
                  <option value="">Select assignee</option>
                  {employees.filter((emp) => !assignedTo.includes(emp.id)).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
                {assignedTo.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {assignedTo.map((id) => {
                      const person = employees.find((e) => e.id === id)
                      return (
                        <span key={id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                          {person?.name || id}
                          <button
                            type="button"
                            onClick={() => setAssignedTo(assignedTo.filter((a) => a !== id))}
                            className="text-blue-500 hover:text-blue-700 ml-0.5"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {assignedTo.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Select at least one</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-1 text-[11px] font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-3 py-1 text-[11px] font-semibold text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
