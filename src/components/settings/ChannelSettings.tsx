import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react'
import { useChannels, useDeleteChannel } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import CreateChannelModal from './CreateChannelModal'
import EditChannelModal from './EditChannelModal'
import SubcategoryManagement from './SubcategoryManagement'
import { resolveFileUrl } from '../../lib/fileUrl'

export default function ChannelSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  const { data: channels = [], isLoading, error } = useChannels()
  const deleteChannel = useDeleteChannel()

  const canCreate = usePermission('channel:create')
  const canEdit = usePermission('channel:edit')
  const canDelete = usePermission('channel:delete')

  const handleDelete = async (id: string, subcategoryCount: number) => {
    if (subcategoryCount > 0) {
      alert('Cannot delete channel with subcategories. Please delete all subcategories first.')
      return
    }

    if (!confirm('Are you sure you want to delete this channel?')) return

    try {
      await deleteChannel.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete channel:', error)
      alert('Failed to delete channel')
    }
  }

  if (selectedChannelId) {
    return (
      <SubcategoryManagement
        channelId={selectedChannelId}
        onBack={() => setSelectedChannelId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Channels & Platforms</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manage content channels and platforms</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Channel
          </button>
        )}
      </div>

      {/* Channels Grid */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
            Failed to load channels
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            The backend channel API endpoints may not be implemented yet. Please ensure:
          </p>
          <ul className="text-xs text-red-600 dark:text-red-500 list-disc list-inside mt-2 space-y-1">
            <li>Backend server is running at http://localhost:5000</li>
            <li>Channel endpoints are implemented at /api/v1/channels</li>
            <li>Database migrations for channels table are complete</li>
            <li>Check backend console for error details</li>
          </ul>
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading channels...</div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No channels yet. {canCreate && 'Create your first channel!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              {/* Logo */}
              {channel.logo_url && (
                <div className="mb-3">
                  <img
                    src={resolveFileUrl(channel.logo_url)}
                    alt={channel.name}
                    className="w-16 h-16 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Name & Description */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {channel.name}
              </h3>
              {channel.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {channel.description}
                </p>
              )}

              {/* Subcategory Count */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {channel.subcategory_count || 0} subcategories
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedChannelId(channel.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                >
                  <span>Subcategories</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => setEditingChannel(channel.id)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDelete(channel.id, channel.subcategory_count || 0)}
                    disabled={deleteChannel.isPending}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateChannelModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingChannel && (
        <EditChannelModal
          channelId={editingChannel}
          isOpen={!!editingChannel}
          onClose={() => setEditingChannel(null)}
        />
      )}
    </div>
  )
}
