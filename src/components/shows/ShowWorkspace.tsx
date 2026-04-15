import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, X, Trash2, Check, Lock, Loader2, FileText, Image, Mic, Video, Pencil } from 'lucide-react'
import {
  useShow, useShowEpisodes, useCreateEpisode, useUpdateShow, useDeleteShow,
  useAddAsset, useRemoveAsset, useToggleAsset, useApproveEpisode, useDeleteEpisode, ShowEpisode
} from '../../hooks/api/useShows'

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
    if (!confirm('Delete this episode?')) return
    try {
      await deleteEpisode.mutateAsync(epId)
      if (selectedEpisodeId === epId) setSelectedEpisodeId(null)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete') }
  }

  const showName = show?.name || episodes[0]?.show_name || 'Show'
  const showDescription = show?.description || ''

  const handleOpenEditShow = () => {
    setEditName(show?.name || '')
    setEditDesc(show?.description || '')
    setShowEditModal(true)
  }

  const handleSaveEditShow = async () => {
    if (!editName.trim()) return
    try {
      await updateShow.mutateAsync({ showId, input: { name: editName, description: editDesc || undefined } })
      setShowEditModal(false)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to update show') }
  }

  const handleDeleteShowAction = async () => {
    if (!confirm(`Are you sure you want to delete "${showName}"?\n\nThis action cannot be undone.`)) return
    try {
      await deleteShowMut.mutateAsync(showId)
      navigate(basePath)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete show') }
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
                  {ep.status === 'production' && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteEpisode(ep.id) }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  )}
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
                {selectedEpisode.status === 'production' && (
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

                {/* Asset Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {(selectedEpisode.assets || []).map((asset) => {
                    const Icon = ASSET_ICONS[asset.name] || FileText
                    return (
                      <div key={asset.id}
                        className={`relative rounded-xl border-2 p-4 text-center transition-all ${
                          asset.is_checked
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                        }`}>
                        {/* Remove button */}
                        {selectedEpisode.status === 'production' && (
                          <button onClick={() => removeAsset.mutateAsync(asset.id)}
                            className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-red-500 opacity-0 hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                        <Icon className={`w-8 h-8 mx-auto mb-2 ${asset.is_checked ? 'text-green-600' : 'text-gray-400'}`} />
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1">{asset.name}</p>
                        {/* Toggle */}
                        {selectedEpisode.status === 'production' ? (
                          <button onClick={() => toggleAsset.mutateAsync(asset.id)}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              asset.is_checked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}>
                            {asset.is_checked ? 'READY ✅' : 'PENDING'}
                          </button>
                        ) : (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${asset.is_checked ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {asset.is_checked ? 'READY ✅' : 'PENDING'}
                          </span>
                        )}
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

      {/* Edit Show Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Edit Show</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Show Title <span className="text-red-500">*</span></label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={2000} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleSaveEditShow} disabled={updateShow.isPending || !editName.trim()}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {updateShow.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
