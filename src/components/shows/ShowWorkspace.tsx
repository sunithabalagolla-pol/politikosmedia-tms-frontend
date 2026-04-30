import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, X, Trash2, Check, Lock, Loader2, FileText, Image, Mic, Video, Pencil } from 'lucide-react'
import {
  useShow, useShowEpisodes, useCreateEpisode, useUpdateShow, useDeleteShow,
  useAddAsset, useRemoveAsset, useToggleAsset, useApproveEpisode, useDeleteEpisode,
  useUpdateEpisode, useRenameAsset, ShowEpisode
} from '../../hooks/api/useShows'
import ConfirmDeleteModal from '../ConfirmDeleteModal'

const ASSET_ICONS: Record<string, any> = { Script: FileText, Visuals: Image, 'Voice Over': Mic, Video: Video }

export default function ShowWorkspace({ showId }: { showId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null)
  const [showEpModal, setShowEpModal] = useState(false)
  const [epTitle, setEpTitle] = useState('')
  const [epNumber, setEpNumber] = useState('')
  const [epDuration, setEpDuration] = useState('')
  const [newAssetName, setNewAssetName] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editEpTitle, setEditEpTitle] = useState('')
  const [editEpNumber, setEditEpNumber] = useState('')
  const [editEpDuration, setEditEpDuration] = useState('')
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null)
  const [renameAssetValue, setRenameAssetValue] = useState('')
  const [deleteEpisodeId, setDeleteEpisodeId] = useState<string | null>(null)
  const [showDeleteShowModal, setShowDeleteShowModal] = useState(false)
  const [deleteAssetTarget, setDeleteAssetTarget] = useState<{ id: string; name: string } | null>(null)

  const { data: show } = useShow(showId)
  const { data: episodes = [], isLoading } = useShowEpisodes(showId)
  const createEpisode = useCreateEpisode()
  const updateShow = useUpdateShow()
  const deleteShowMut = useDeleteShow()
  const addAsset = useAddAsset()
  const removeAsset = useRemoveAsset()
  const toggleAsset = useToggleAsset()
  const approveEpisode = useApproveEpisode()
  const deleteEpisode = useDeleteEpisode()
  const updateEpisode = useUpdateEpisode()
  const renameAsset = useRenameAsset()

  const basePath = location.pathname.startsWith('/manager') ? '/manager/shows' : '/dashboard/shows'
  const selectedEpisode = episodes.find((e) => e.id === selectedEpisodeId) || episodes[0]

  // Auto-select first episode
  if (!selectedEpisodeId && episodes.length > 0 && !selectedEpisode) {
    setSelectedEpisodeId(episodes[0].id)
  }

  const handleCreateEpisode = async () => {
    if (!epTitle.trim() || !epNumber) return
    try {
      await createEpisode.mutateAsync({
        showId,
        input: { title: epTitle, episode_number: parseInt(epNumber), target_duration: epDuration || undefined },
      })
      setShowEpModal(false)
      setEpTitle('')
      setEpNumber('')
      setEpDuration('')
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to create episode') }
  }

  const handleAddAsset = async () => {
    if (!newAssetName.trim() || !selectedEpisode) return
    try {
      await addAsset.mutateAsync({ episodeId: selectedEpisode.id, name: newAssetName })
      setNewAssetName('')
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to add asset') }
  }

  const handleDeleteEpisode = async (epId: string) => {
    setDeleteEpisodeId(epId)
  }

  const handleDeleteEpisodeConfirm = async () => {
    if (!deleteEpisodeId) return
    try {
      await deleteEpisode.mutateAsync(deleteEpisodeId)
      if (selectedEpisodeId === deleteEpisodeId) setSelectedEpisodeId(null)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete') }
    finally { setDeleteEpisodeId(null) }
  }

  const handleStartRenameAsset = (assetId: string, currentName: string) => {
    setRenamingAssetId(assetId)
    setRenameAssetValue(currentName)
  }

  const handleSaveRenameAsset = async () => {
    if (!renamingAssetId || !renameAssetValue.trim()) return
    try {
      await renameAsset.mutateAsync({ assetId: renamingAssetId, name: renameAssetValue.trim() })
      setRenamingAssetId(null)
      setRenameAssetValue('')
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to rename asset') }
  }

  const canEditEpisode = (status: string) => status === 'production'
  const canModifyAssets = (status: string) => status === 'production'

  const showName = show?.name || episodes[0]?.show_name || 'Show'
  const showDescription = show?.description || ''

  const handleOpenEditShow = () => {
    setEditName(show?.name || '')
    setEditDesc(show?.description || '')
    // Pre-fill episode fields if a production episode is selected
    if (selectedEpisode && canEditEpisode(selectedEpisode.status)) {
      setEditEpTitle(selectedEpisode.title)
      setEditEpNumber(String(selectedEpisode.episode_number))
      setEditEpDuration(selectedEpisode.target_duration || '')
    } else {
      setEditEpTitle('')
      setEditEpNumber('')
      setEditEpDuration('')
    }
    setShowEditModal(true)
  }

  const handleOpenEditFromSidebar = (ep: ShowEpisode) => {
    setSelectedEpisodeId(ep.id)
    setEditName(show?.name || '')
    setEditDesc(show?.description || '')
    setEditEpTitle(ep.title)
    setEditEpNumber(String(ep.episode_number))
    setEditEpDuration(ep.target_duration || '')
    setShowEditModal(true)
  }

  const handleSaveUnified = async () => {
    if (!editName.trim()) return
    try {
      // Save show details if changed
      const showChanged = editName !== (show?.name || '') || editDesc !== (show?.description || '')
      if (showChanged) {
        await updateShow.mutateAsync({ showId, input: { name: editName, description: editDesc || undefined } })
      }
      // Save episode details if editable and changed
      if (selectedEpisode && canEditEpisode(selectedEpisode.status) && editEpTitle.trim() && editEpNumber) {
        const epInput: { title?: string; episode_number?: number; target_duration?: string } = {}
        if (editEpTitle !== selectedEpisode.title) epInput.title = editEpTitle
        if (parseInt(editEpNumber) !== selectedEpisode.episode_number) epInput.episode_number = parseInt(editEpNumber)
        if (editEpDuration !== (selectedEpisode.target_duration || '')) epInput.target_duration = editEpDuration || undefined
        if (Object.keys(epInput).length > 0) {
          await updateEpisode.mutateAsync({ episodeId: selectedEpisode.id, input: epInput })
        }
      }
      setShowEditModal(false)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to save changes') }
  }

  const handleDeleteShowAction = async () => {
    setShowDeleteShowModal(true)
  }

  const handleDeleteShowConfirm = async () => {
    try {
      await deleteShowMut.mutateAsync(showId)
      navigate(basePath)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete show') }
    finally { setShowDeleteShowModal(false) }
  }

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <button onClick={() => navigate(basePath)} className="flex items-center gap-2 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Shows
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">{showName}</h1>
            {showDescription && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{showDescription}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleOpenEditShow}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button onClick={handleDeleteShowAction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg transition-colors">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Show Workspace</p>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left: Episodes List */}
        <div className="w-56 shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">Episodes</h3>
            <button onClick={() => setShowEpModal(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Plus className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
            {episodes.map((ep) => (
              <div key={ep.id} onClick={() => setSelectedEpisodeId(ep.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-colors group ${selectedEpisode?.id === ep.id ? 'bg-[#b23a48]/10 border border-[#b23a48]/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-900 dark:text-white">Ep {String(ep.episode_number).padStart(2, '0')}: {ep.title}</p>
                  <div className="flex items-center gap-0.5">
                    {canEditEpisode(ep.status) && (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenEditFromSidebar(ep) }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-blue-500"><Pencil className="w-3 h-3" /></button>
                    )}
                    {canEditEpisode(ep.status) && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteEpisode(ep.id) }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                  ep.status === 'production' ? 'bg-blue-100 text-blue-700' : ep.status === 'approved' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>{ep.status.replace(/_/g, ' ').toUpperCase()}</span>
              </div>
            ))}
            {episodes.length === 0 && <p className="text-[11px] text-gray-400 text-center py-8">No episodes yet</p>}
          </div>
        </div>

        {/* Right: Episode Detail / Assets */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
          {selectedEpisode ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-[11px] font-bold text-gray-900 dark:text-white mb-1">
                  Ep {String(selectedEpisode.episode_number).padStart(2, '0')}: {selectedEpisode.title}
                </h2>
                {selectedEpisode.target_duration && (
                  <p className="text-[11px] text-gray-500">Duration: {selectedEpisode.target_duration} mins</p>
                )}
              </div>

              {/* Assets Section */}
              <div>
                <h3 className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Episode Assets Build</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Verify required components before managerial review</p>

                {/* Add Custom Asset */}
                {canModifyAssets(selectedEpisode.status) && (
                  <div className="flex items-center gap-2 mb-4">
                    <input type="text" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)}
                      placeholder="Asset name (e.g., Script, Poster Art)" maxLength={255}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48]/20"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAsset()} />
                    <button onClick={handleAddAsset} disabled={!newAssetName.trim() || addAsset.isPending}
                      className="px-3 py-2 text-[11px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                      + Add Asset
                    </button>
                  </div>
                )}
                {!canModifyAssets(selectedEpisode.status) && (
                  <p className="text-[10px] text-gray-400 italic mb-4">Assets are locked after episode is marked ready for broadcast</p>
                )}

                {/* Asset Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {(selectedEpisode.assets || []).map((asset) => {
                    const Icon = ASSET_ICONS[asset.name] || FileText
                    return (
                      <div key={asset.id}
                        className={`relative rounded-xl border-2 p-4 text-center transition-all group/card ${
                          asset.is_checked
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                        }`}>
                        {/* Action icons — top-right, visible on card hover */}
                        {canModifyAssets(selectedEpisode.status) && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={() => handleStartRenameAsset(asset.id, asset.name)}
                              className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Rename asset">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => setDeleteAssetTarget({ id: asset.id, name: asset.name })}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete asset">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${asset.is_checked ? 'text-green-600' : 'text-gray-400'}`} />
                        {/* Asset name — inline rename */}
                        {renamingAssetId === asset.id ? (
                          <div className="flex items-center gap-1 mb-1">
                            <input type="text" value={renameAssetValue} onChange={(e) => setRenameAssetValue(e.target.value)}
                              className="w-full px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRenameAsset(); if (e.key === 'Escape') setRenamingAssetId(null) }}
                              autoFocus maxLength={255} />
                            <button onClick={handleSaveRenameAsset} disabled={renameAsset.isPending || !renameAssetValue.trim()}
                              className="p-0.5 text-green-600 hover:text-green-700 disabled:opacity-50"><Check className="w-3 h-3" /></button>
                            <button onClick={() => setRenamingAssetId(null)}
                              className="p-0.5 text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1">{asset.name}</p>
                        )}
                        {/* Toggle — works in all statuses */}
                        <button onClick={() => toggleAsset.mutateAsync(asset.id)}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            asset.is_checked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}>
                          {asset.is_checked ? 'READY ✅' : 'PENDING'}
                        </button>
                      </div>
                    )
                  })}
                </div>

                {(selectedEpisode.assets || []).length === 0 && (
                  <p className="text-[11px] text-gray-400 text-center py-6">No assets added yet. Add custom assets above.</p>
                )}
              </div>

              {/* Approval Section */}
              {selectedEpisode.status === 'production' && (
                <div className={`rounded-xl border-2 p-4 ${selectedEpisode.all_assets_checked ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className={`w-4 h-4 ${selectedEpisode.all_assets_checked ? 'text-green-600' : 'text-gray-400'}`} />
                    <h4 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase">Managerial Approval</h4>
                  </div>
                  {selectedEpisode.all_assets_checked ? (
                    <p className="text-[11px] text-green-700 dark:text-green-400 mb-3">All assets verified. Ready for approval.</p>
                  ) : (
                    <p className="text-[11px] text-gray-500 mb-3">
                      Verification frozen until {(selectedEpisode.total_assets || 0) - (selectedEpisode.checked_assets || 0)} more asset{((selectedEpisode.total_assets || 0) - (selectedEpisode.checked_assets || 0)) !== 1 ? 's' : ''} ready
                    </p>
                  )}
                  <button onClick={() => approveEpisode.mutateAsync(selectedEpisode.id)}
                    disabled={!selectedEpisode.all_assets_checked || approveEpisode.isPending}
                    className="px-4 py-2 text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    {approveEpisode.isPending ? 'Approving...' : 'Approve Build'}
                  </button>
                </div>
              )}

              {selectedEpisode.status === 'approved' && (
                <div className="rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-900/20 p-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <h4 className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase">Verified & Approved</h4>
                  </div>
                  <p className="text-[11px] text-green-600 mt-1">This episode has been approved and moved to Broadcasting.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[11px] text-gray-400">
              {episodes.length === 0 ? 'Create your first episode to get started' : 'Select an episode'}
            </div>
          )}
        </div>
      </div>

      {/* Create Episode Modal */}
      {showEpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Add Episode</h2>
              <button onClick={() => setShowEpModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode Title <span className="text-red-500">*</span></label>
                <input type="text" value={epTitle} onChange={(e) => setEpTitle(e.target.value)} maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., Election Prep 2024" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode # <span className="text-red-500">*</span></label>
                <input type="number" value={epNumber} onChange={(e) => setEpNumber(e.target.value)} min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="1" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Target Duration (mins)</label>
                <input type="text" value={epDuration} onChange={(e) => setEpDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., 22:00" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEpModal(false)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleCreateEpisode} disabled={createEpisode.isPending || !epTitle.trim() || !epNumber}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {createEpisode.isPending ? 'Creating...' : 'Add Episode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Edit Modal — Show Details + Episode Details */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Edit Details</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ scrollbarWidth: 'thin' }}>
              {/* Show Details Section */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Show Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Show Title <span className="text-red-500">*</span></label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={500}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={2000} rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
                  </div>
                </div>
              </div>

              {/* Episode Details Section — only if a production episode is selected */}
              {selectedEpisode && canEditEpisode(selectedEpisode.status) && (
                <div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      Episode Details — Ep {String(selectedEpisode.episode_number).padStart(2, '0')}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode Title <span className="text-red-500">*</span></label>
                        <input type="text" value={editEpTitle} onChange={(e) => setEditEpTitle(e.target.value)} maxLength={500}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode # <span className="text-red-500">*</span></label>
                          <input type="number" value={editEpNumber} onChange={(e) => setEditEpNumber(e.target.value)} min="1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (mins)</label>
                          <input type="text" value={editEpDuration} onChange={(e) => setEditEpDuration(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="e.g., 22:00" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Locked episode notice */}
              {selectedEpisode && !canEditEpisode(selectedEpisode.status) && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Episode Details — Ep {String(selectedEpisode.episode_number).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] text-gray-400 italic">Episode is locked after approval and cannot be edited.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleSaveUnified} disabled={(updateShow.isPending || updateEpisode.isPending) || !editName.trim()}
                className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                {(updateShow.isPending || updateEpisode.isPending) ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Show Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteShowModal}
        onClose={() => setShowDeleteShowModal(false)}
        onConfirm={handleDeleteShowConfirm}
        title="Delete Show"
        message={`Are you sure you want to permanently delete "${showName}"? All episodes and data will be removed.`}
        isDeleting={deleteShowMut.isPending}
      />

      {/* Delete Episode Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteEpisodeId}
        onClose={() => setDeleteEpisodeId(null)}
        onConfirm={handleDeleteEpisodeConfirm}
        title="Delete Episode"
        message="Are you sure you want to permanently delete this episode? This action cannot be undone."
        isDeleting={deleteEpisode.isPending}
      />

      {/* Delete Asset Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteAssetTarget}
        onClose={() => setDeleteAssetTarget(null)}
        onConfirm={async () => {
          if (!deleteAssetTarget) return
          try { await removeAsset.mutateAsync(deleteAssetTarget.id) }
          catch (e: any) { alert(e?.response?.data?.message || 'Failed to remove asset') }
          finally { setDeleteAssetTarget(null) }
        }}
        title="Delete Asset"
        message={`Are you sure you want to remove "${deleteAssetTarget?.name || ''}"? This action cannot be undone.`}
        isDeleting={removeAsset.isPending}
      />
    </div>
  )
}
