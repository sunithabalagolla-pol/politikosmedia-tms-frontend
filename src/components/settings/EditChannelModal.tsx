import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { useChannel, useUpdateChannel, useUploadChannelLogo } from '../../hooks/api'

interface EditChannelModalProps {
  channelId: string
  isOpen: boolean
  onClose: () => void
}

export default function EditChannelModal({ channelId, isOpen, onClose }: EditChannelModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const { data: channel, isLoading } = useChannel(channelId)
  const updateChannel = useUpdateChannel()
  const uploadLogo = useUploadChannelLogo()

  useEffect(() => {
    if (channel) {
      setName(channel.name)
      setDescription(channel.description || '')
      setSortOrder(channel.sort_order?.toString() || '')
    }
  }, [channel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      alert('Please enter a channel name')
      return
    }

    try {
      await updateChannel.mutateAsync({
        id: channelId,
        input: {
          name,
          description: description || undefined,
          sort_order: sortOrder ? parseInt(sortOrder) : undefined,
        },
      })

      // Upload logo if provided
      if (logoFile) {
        await uploadLogo.mutateAsync({ id: channelId, file: logoFile })
      }

      onClose()
    } catch (error) {
      console.error('Failed to update channel:', error)
      alert('Failed to update channel')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Channel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Current Logo */}
            {channel?.logo_url && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Logo
                </label>
                <img
                  src={channel.logo_url}
                  alt={channel.name}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}

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
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Update Logo
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {logoFile && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{logoFile.name}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateChannel.isPending || uploadLogo.isPending}
                className="px-4 py-2 text-xs font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
              >
                {updateChannel.isPending || uploadLogo.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
