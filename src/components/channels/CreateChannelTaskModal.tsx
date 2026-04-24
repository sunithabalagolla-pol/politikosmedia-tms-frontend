import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  useChannels,
  useSubcategories,
  useCreateChannelTask,
  useUpdateChannelTask,
  useChannelTask,
  useLookupEmployees,
  type ChannelTask,
  type AssignedToEntry,
} from '../../hooks/api'

interface IndividualTarget {
  userId: string
  target: string // keep as string for controlled input; empty means inherit
}

interface CreateChannelTaskModalProps {
  isOpen: boolean
  onClose: () => void
  defaultChannelId?: string
  defaultSubcategoryId?: string
  /** When provided the modal opens in edit mode */
  editTaskId?: string
}

export default function CreateChannelTaskModal({
  isOpen,
  onClose,
  defaultChannelId = '',
  defaultSubcategoryId = '',
  editTaskId,
}: CreateChannelTaskModalProps) {
  const isEditMode = !!editTaskId

  const [channelId, setChannelId] = useState(defaultChannelId)
  const [subcategoryId, setSubcategoryId] = useState(defaultSubcategoryId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetCount, setTargetCount] = useState('')
  const [type, setType] = useState('')
  const [assignedTo, setAssignedTo] = useState<string[]>([])
  const [individualTargets, setIndividualTargets] = useState<IndividualTarget[]>([])
  const [prefilled, setPrefilled] = useState(false)

  const { data: channels = [] } = useChannels()
  const { data: subcategories = [] } = useSubcategories(channelId)
  const { data: employees = [] } = useLookupEmployees()
  const { data: existingTask, isLoading: isLoadingTask } = useChannelTask(editTaskId || '')

  const createTask = useCreateChannelTask()
  const updateTask = useUpdateChannelTask()

  // In edit mode, channel/subcategory are always frozen
  // In create mode, they are frozen when defaults are provided
  const isChannelFrozen = isEditMode || !!defaultChannelId
  const isSubcategoryFrozen = isEditMode || !!defaultSubcategoryId

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && existingTask && !prefilled) {
      setChannelId(existingTask.channel_id)
      setSubcategoryId(existingTask.channel_subcategory_id)
      setName(existingTask.name)
      setDescription(existingTask.description || '')
      setTargetCount(existingTask.target_count.toString())
      setType(existingTask.type)

      const ids = existingTask.assignees.map((a) => a.id)
      setAssignedTo(ids)

      const targets: IndividualTarget[] = existingTask.assignees.map((a) => ({
        userId: a.id,
        target: a.individual_target != null ? a.individual_target.toString() : '',
      }))
      setIndividualTargets(targets)
      setPrefilled(true)
    }
  }, [isEditMode, existingTask, prefilled])

  // Set defaults for create mode
  useEffect(() => {
    if (!isEditMode) {
      setChannelId(defaultChannelId)
      setSubcategoryId(defaultSubcategoryId)
    }
  }, [defaultChannelId, defaultSubcategoryId, isEditMode])

  // Keep individualTargets in sync when assignees change
  const handleAddAssignee = (userId: string) => {
    if (!userId || assignedTo.includes(userId)) return
    setAssignedTo([...assignedTo, userId])
    setIndividualTargets([...individualTargets, { userId, target: '' }])
  }

  const handleRemoveAssignee = (userId: string) => {
    setAssignedTo(assignedTo.filter((id) => id !== userId))
    setIndividualTargets(individualTargets.filter((t) => t.userId !== userId))
  }

  const handleIndividualTargetChange = (userId: string, value: string) => {
    setIndividualTargets(
      individualTargets.map((t) => (t.userId === userId ? { ...t, target: value } : t))
    )
  }

  const buildAssignedToPayload = (): AssignedToEntry[] => {
    return assignedTo.map((userId) => {
      const entry = individualTargets.find((t) => t.userId === userId)
      const val = entry?.target ? parseInt(entry.target) : NaN
      if (!isNaN(val) && val > 0) {
        return { user_id: userId, individual_target: val }
      }
      return userId // plain string = inherit task-level target
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!channelId || !subcategoryId || !name || !targetCount || !type || assignedTo.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    const payload = buildAssignedToPayload()

    try {
      if (isEditMode && editTaskId) {
        await updateTask.mutateAsync({
          id: editTaskId,
          input: {
            name,
            description: description || undefined,
            target_count: parseInt(targetCount),
            type,
            assigned_to: payload,
          },
        })
      } else {
        await createTask.mutateAsync({
          channel_id: channelId,
          channel_subcategory_id: subcategoryId,
          name,
          description: description || undefined,
          target_count: parseInt(targetCount),
          type,
          assigned_to: payload,
        })
      }
      onClose()
      resetForm()
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} task:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} task`)
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
    setIndividualTargets([])
    setPrefilled(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const isPending = createTask.isPending || updateTask.isPending

  // Get display names for frozen fields
  const channelName = channels.find((c) => c.id === channelId)?.name || channelId
  const subcategoryName = subcategories.find((s) => s.id === subcategoryId)?.name || subcategoryId

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Channel Task' : 'Create Channel Task'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loading state for edit mode */}
        {isEditMode && isLoadingTask ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#b23a48] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          /* Form */
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

              {/* Target Count + Type row */}
              <div className="grid grid-cols-2 gap-2">
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
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                  Assign To <span className="text-red-500">*</span>{' '}
                  {assignedTo.length > 0 && <span className="font-normal text-gray-400">({assignedTo.length})</span>}
                </label>
                <select
                  value=""
                  onChange={(e) => handleAddAssignee(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                >
                  <option value="">Select assignee</option>
                  {employees.filter((emp) => !assignedTo.includes(emp.id)).map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>

                {/* Assignee chips with individual target inputs */}
                {assignedTo.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    {assignedTo.map((id) => {
                      const person = employees.find((e) => e.id === id)
                      const itEntry = individualTargets.find((t) => t.userId === id)
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800"
                        >
                          <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 flex-1 truncate">
                            {person?.name || id}
                          </span>
                          <div className="flex items-center gap-1">
                            <label className="text-[9px] text-gray-500 dark:text-gray-400 whitespace-nowrap">Target:</label>
                            <input
                              type="number"
                              min="1"
                              value={itEntry?.target || ''}
                              onChange={(e) => handleIndividualTargetChange(id, e.target.value)}
                              placeholder={targetCount || '—'}
                              className="w-14 px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-[10px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAssignee(id)}
                            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">
                      Leave target empty to use the task-level Target Count as default.
                    </p>
                  </div>
                )}
                {assignedTo.length === 0 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Select at least one</p>
                )}
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
                disabled={isPending}
                className="px-3 py-1 text-[11px] font-semibold text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending
                  ? isEditMode ? 'Updating...' : 'Creating...'
                  : isEditMode ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
