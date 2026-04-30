import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronRight, Video } from 'lucide-react'
import { useChannels, useDeleteChannel } from '../../hooks/api'
import { usePermission } from '../../hooks/usePermission'
import CreateChannelModal from './CreateChannelModal'
import EditChannelModal from './EditChannelModal'
import SubcategoryManagement from './SubcategoryManagement'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

export default function ChannelSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null)

  const { data: channels = [], isLoading, error } = useChannels()
  const deleteChannel = useDeleteChannel()

  const canCreate = usePermission('channel:create')
  const canEdit = usePermission('channel:edit')
  const canDelete = usePermission('channel:delete')

  const handleDelete = async (e: React.MouseEvent, id: string, subcategoryCount: number) => {
    e.stopPropagation()
    if (subcategoryCount > 0) {
      alert('Cannot delete channel with subcategories. Please delete all subcategories first.')
      return
    }

    setDeleteChannelId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteChannelId) return
    try {
      await deleteChannel.mutateAsync(deleteChannelId)
      setDeleteChannelId(null)
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

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
            Failed to load channels
          </p>
          <p className="text-xs text-red-600 dark:text-red-500">
            The backend channel API endpoints may not be implemented yet. Please ensure:
          </p>
          <ul className="text-xs text-red-600 dark:text-red-500 list-disc list-inside mt-2 space-y-1">
            <li>Backend server is running and accessible</li>
            <li>Channel endpoints are implemented at /api/v1/channels</li>
            <li>Database migrations for channels table are complete</li>
            <li>Check backend console for error details</li>
          </ul>
        </div>
      )}

      {/* Channels Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading channels...</div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Channels Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            {canCreate ? 'Create your first channel!' : 'No channels have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setSelectedChannelId(channel.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                {/* Channel Logo or Fallback Icon */}
                {channel.logo_url ? (
                  <img
                    src={channel.logo_url}
                    alt={channel.name}
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Video className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />
                )}

                {/* Name */}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {channel.name}
                </h3>

                {/* Subcategory count */}
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {channel.subcategory_count || 0} subcategories
                </p>

                {/* Actions row */}
                <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedChannelId(channel.id) }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                  >
                    Subcategories
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingChannel(channel.id) }}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDelete(e, channel.id, channel.subcategory_count || 0)}
                      disabled={deleteChannel.isPending}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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

      <ConfirmDeleteModal
        isOpen={!!deleteChannelId}
        onClose={() => setDeleteChannelId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Channel"
        message="Are you sure you want to permanently delete this channel? This action cannot be undone."
        isDeleting={deleteChannel.isPending}
      />
    </div>
  )
}
