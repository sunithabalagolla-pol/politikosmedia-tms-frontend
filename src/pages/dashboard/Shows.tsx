import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Plus, Loader2, X, Tv, ChevronRight, CheckCircle2, Radio, BarChart3, Pencil, Trash2, Check } from 'lucide-react'
import { useShowBoard, useCreateShow, useUpdateShow, useDeleteShow, useMarkReadyForBroadcast, useMarkBroadcasted, useCreateImpactTask, useShowDetails, useCreateEpisode, useDeleteEpisode, useUpdateEpisode, ShowEpisode, EpisodeStatus } from '../../hooks/api/useShows'
import { useLookupEmployees } from '../../hooks/api/useLookups'
import ShowWorkspace from '../../components/shows/ShowWorkspace'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

export default function Shows() {
  const [searchParams] = useSearchParams()
  const showId = searchParams.get('show')

  if (showId) return <ShowWorkspace showId={showId} />
  return <ShowsBoard />
}

function ShowsBoard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showName, setShowName] = useState('')
  const [showDesc, setShowDesc] = useState('')
  const [assignModal, setAssignModal] = useState<string | null>(null)
  const [assignTo, setAssignTo] = useState('')
  const [editShow, setEditShow] = useState<{ id: string; name: string; description: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [showDetailEpisode, setShowDetailEpisode] = useState<string | null>(null)
  const [showDetailColumn, setShowDetailColumn] = useState<string | null>(null)
  const [addEpShowId, setAddEpShowId] = useState<string | null>(null)
  const [addEpTitle, setAddEpTitle] = useState('')
  const [addEpNumber, setAddEpNumber] = useState('')
  const [addEpDuration, setAddEpDuration] = useState('')
  const [editEpModal, setEditEpModal] = useState<{ id: string; title: string; episode_number: number; target_duration: string | null; status: EpisodeStatus } | null>(null)
  const [editEpTitle, setEditEpTitle] = useState('')
  const [editEpNumber, setEditEpNumber] = useState('')
  const [editEpDuration, setEditEpDuration] = useState('')
  const [deleteShowTarget, setDeleteShowTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteEpisodeId, setDeleteEpisodeId] = useState<string | null>(null)

  const { data: board, isLoading } = useShowBoard()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()
  const markReady = useMarkReadyForBroadcast()
  const markBroadcasted = useMarkBroadcasted()
  const createImpact = useCreateImpactTask()
  const createEpisode = useCreateEpisode()
  const deleteEpisode = useDeleteEpisode()
  const updateEpisode = useUpdateEpisode()
  const { data: employees = [] } = useLookupEmployees()
  const { data: showDetails, isLoading: isLoadingDetails } = useShowDetails(showDetailEpisode || '')

  const basePath = location.pathname.startsWith('/manager') ? '/manager/shows' : '/dashboard/shows'

  const handleCreate = async () => {
    if (!showName.trim()) return
    try {
      const show = await createShow.mutateAsync({ name: showName, description: showDesc || undefined })
      setShowCreateModal(false)
      setShowName('')
      setShowDesc('')
      navigate(`${basePath}?show=${show.id}`)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to create show')
    }
  }

  const handleAssignImpact = async () => {
    if (!assignModal || !assignTo) return
    try {
      await createImpact.mutateAsync({ episodeId: assignModal, assigned_to: assignTo })
      setAssignModal(null)
      setAssignTo('')
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to assign')
    }
  }

  const handleOpenEdit = (id: string, name: string, description: string) => {
    setEditShow({ id, name, description })
    setEditName(name)
    setEditDesc(description)
  }

  const handleSaveEdit = async () => {
    if (!editShow || !editName.trim()) return
    try {
      await updateShow.mutateAsync({ showId: editShow.id, input: { name: editName, description: editDesc || undefined } })
      setEditShow(null)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to update show') }
  }

  const handleDeleteShow = async (showId: string, showName: string) => {
    setDeleteShowTarget({ id: showId, name: showName })
  }

  const handleDeleteShowConfirm = async () => {
    if (!deleteShowTarget) return
    try {
      await deleteShow.mutateAsync(deleteShowTarget.id)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete show') }
    finally { setDeleteShowTarget(null) }
  }

  const handleAddEpisodeFromModal = async () => {
    if (!addEpShowId || !addEpTitle.trim() || !addEpNumber) return
    try {
      await createEpisode.mutateAsync({
        showId: addEpShowId,
        input: { title: addEpTitle, episode_number: parseInt(addEpNumber), target_duration: addEpDuration || undefined },
      })
      setAddEpShowId(null)
      setAddEpTitle('')
      setAddEpNumber('')
      setAddEpDuration('')
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to create episode') }
  }

  const handleDeleteEpisodeFromModal = async (epId: string) => {
    setDeleteEpisodeId(epId)
  }

  const handleDeleteEpisodeConfirm = async () => {
    if (!deleteEpisodeId) return
    try {
      await deleteEpisode.mutateAsync(deleteEpisodeId)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete episode') }
    finally { setDeleteEpisodeId(null) }
  }

  const handleOpenEditEpisode = (ep: { id: string; title: string; episode_number: number; target_duration: string | null; status: EpisodeStatus }) => {
    setEditEpModal(ep)
    setEditEpTitle(ep.title)
    setEditEpNumber(String(ep.episode_number))
    setEditEpDuration(ep.target_duration || '')
  }

  const handleSaveEditEpisode = async () => {
    if (!editEpModal || !editEpTitle.trim() || !editEpNumber) return
    try {
      const input: { title?: string; episode_number?: number; target_duration?: string } = {}
      if (editEpTitle !== editEpModal.title) input.title = editEpTitle
      if (parseInt(editEpNumber) !== editEpModal.episode_number) input.episode_number = parseInt(editEpNumber)
      if (editEpDuration !== (editEpModal.target_duration || '')) input.target_duration = editEpDuration || undefined
      if (Object.keys(input).length > 0) {
        await updateEpisode.mutateAsync({ episodeId: editEpModal.id, input })
      }
      setEditEpModal(null)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to update episode') }
  }

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const columns = [
    { key: 'creation_production', title: 'Creation & Production', icon: Tv, color: 'border-blue-400', items: board?.creation_production || [], showAdd: true },
    { key: 'broadcasting', title: 'Broadcasting', icon: Radio, color: 'border-orange-400', items: board?.broadcasting || [] },
    { key: 'broadcasted', title: 'Broadcasted', icon: CheckCircle2, color: 'border-green-400', items: board?.broadcasted || [] },
    { key: 'impact', title: 'Impact Analysis', icon: BarChart3, color: 'border-purple-400', items: board?.impact || [] },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[11px] font-bold text-gray-900 dark:text-white">Shows</h1>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-4 gap-3 h-full">
          {columns.map((col) => (
            <div key={col.key} className={`flex flex-col bg-gray-100 dark:bg-gray-800/50 rounded-xl border-t-4 ${col.color} min-h-0 overflow-hidden`}>
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <col.icon className="w-4 h-4 text-gray-500" />
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wide">{col.title}</h3>
                  <span className="text-[11px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-medium">{col.items.length}</span>
                </div>
                {(col as any).showAdd && (
                  <button onClick={() => setShowCreateModal(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {col.items.map((ep: any) => {
                  // Show-only card (always visible in creation_production)
                  if (ep.is_show_only && col.key === 'creation_production') {
                    return (
                      <div key={`show-${ep.show_id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-dashed border-orange-300 dark:border-orange-700 p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`${basePath}?show=${ep.show_id}`)}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white truncate flex-1">{ep.show_name}</p>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleOpenEdit(ep.show_id, ep.show_name || '', ep.show_description || '')}
                              className="p-0.5 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteShow(ep.show_id, ep.show_name || '')}
                              className="p-0.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Plus className="w-2.5 h-2.5 text-orange-400" />
                          <span className="text-[10px] text-orange-500 font-medium">Add Episode</span>
                          <ChevronRight className="w-2.5 h-2.5 text-orange-400" />
                        </div>
                      </div>
                    )
                  }

                  // Episode card
                  return (
                    <EpisodeCard
                      key={ep.id || `show-${ep.show_id}`}
                      episode={ep}
                      columnKey={col.key}
                      onClickCard={() => {
                        if (col.key === 'creation_production') navigate(`${basePath}?show=${ep.show_id}`)
                        else { setShowDetailEpisode(ep.show_id); setShowDetailColumn(col.key) }
                      }}
                      onMarkReady={() => markReady.mutateAsync(ep.id)}
                      onMarkBroadcasted={() => markBroadcasted.mutateAsync(ep.id)}
                      onAssignImpact={() => setAssignModal(ep.id)}
                    />
                  )
                })}
                {col.items.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-gray-400">No episodes</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Show Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Create Show</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Show Title <span className="text-red-500">*</span></label>
                <input type="text" value={showName} onChange={(e) => setShowName(e.target.value)} maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="e.g., Political Pulse" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={showDesc} onChange={(e) => setShowDesc(e.target.value)} maxLength={2000} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="Optional description..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleCreate} disabled={createShow.isPending || !showName.trim()}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {createShow.isPending ? 'Creating...' : 'Create Show'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Impact Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Assign Impact Task</h2>
              <button onClick={() => setAssignModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To <span className="text-red-500">*</span></label>
                <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">Select employee...</option>
                  {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setAssignModal(null)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleAssignImpact} disabled={!assignTo || createImpact.isPending}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {createImpact.isPending ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Show Modal */}
      {editShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Edit Show</h2>
              <button onClick={() => setEditShow(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                <button onClick={() => setEditShow(null)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleSaveEdit} disabled={updateShow.isPending || !editName.trim()}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {updateShow.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Detail Modal - Rich Summary Popup */}
      {showDetailEpisode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailEpisode(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Show Details</h2>
              <button onClick={() => setShowDetailEpisode(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" />
              </div>
            ) : !showDetails ? (
              <div className="text-center py-12 text-[11px] text-gray-500">Failed to load show details</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {/* 1. Header Section */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">{showDetails.name}</h3>
                      {showDetails.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{showDetails.description}</p>
                      )}
                    </div>
                    {showDetailColumn === 'creation_production' && (
                      <button
                        onClick={() => { handleOpenEdit(showDetails.id, showDetails.name, showDetails.description || ''); setShowDetailEpisode(null) }}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0 ml-3"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Created by {showDetails.created_by_name} on {new Date(showDetails.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* 2. Status Breakdown Chips */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Episode Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {showDetails.status_breakdown.production > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Production <span className="font-bold">{showDetails.status_breakdown.production}</span>
                      </span>
                    )}
                    {showDetails.status_breakdown.approved > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Approved <span className="font-bold">{showDetails.status_breakdown.approved}</span>
                      </span>
                    )}
                    {showDetails.status_breakdown.ready_for_broadcast > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Ready for Broadcast <span className="font-bold">{showDetails.status_breakdown.ready_for_broadcast}</span>
                      </span>
                    )}
                    {showDetails.status_breakdown.broadcasted > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Broadcasted <span className="font-bold">{showDetails.status_breakdown.broadcasted}</span>
                      </span>
                    )}
                    {showDetails.episode_count === 0 && (
                      <span className="text-[10px] text-gray-400">No episodes yet</span>
                    )}
                  </div>
                </div>

                {/* 3. Asset Progress Bar */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Asset Progress</p>
                  {showDetails.asset_summary.total === 0 ? (
                    <p className="text-[10px] text-gray-400">No assets added yet</p>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {showDetails.asset_summary.checked} of {showDetails.asset_summary.total} assets ready
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">{showDetails.asset_summary.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#b23a48] to-[#d4515f] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(showDetails.asset_summary.completion_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Episodes Table */}
                {showDetails.episodes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Episodes ({showDetails.episode_count})
                      </p>
                      {showDetailColumn !== 'broadcasted' && (
                        <button
                          onClick={() => { setAddEpShowId(showDetails.id) }}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Episode
                        </button>
                      )}
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50">
                            <th className="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1.5">Episode</th>
                            <th className="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1.5">Duration</th>
                            <th className="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1.5">Status</th>
                            <th className="text-left text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1.5">Assets</th>
                            <th className="text-right text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase px-3 py-1.5">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {showDetails.episodes.map((ep) => {
                            const statusBadge: Record<string, string> = {
                              production: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                              approved: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                              ready_for_broadcast: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                              broadcasted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            }
                            const canEdit = ep.status === 'production'
                            return (
                              <tr key={ep.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-3 py-2 text-[11px] font-medium text-gray-900 dark:text-white">
                                  Ep {String(ep.episode_number).padStart(2, '0')}: {ep.title}
                                </td>
                                <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                                  {ep.target_duration || '—'}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge[ep.status] || 'bg-gray-100 text-gray-700'}`}>
                                    {ep.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className={`font-medium ${ep.all_assets_checked ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                      {ep.checked_assets}/{ep.total_assets}
                                    </span>
                                    {ep.all_assets_checked && ep.total_assets > 0 && (
                                      <Check className="w-3 h-3 text-green-500" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {showDetailColumn === 'broadcasted' ? (
                                    <span className="text-[10px] text-gray-400 italic" title="Show is locked in broadcasted stage">Locked</span>
                                  ) : canEdit ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => handleOpenEditEpisode({ id: ep.id, title: ep.title, episode_number: ep.episode_number, target_duration: ep.target_duration, status: ep.status })}
                                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Edit episode">
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => handleDeleteEpisodeFromModal(ep.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Delete episode">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 italic" title="Episode is locked after approval">Locked</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Add Episode button when no episodes exist */}
                {showDetails.episodes.length === 0 && showDetailColumn !== 'broadcasted' && (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-gray-400 mb-3">No episodes yet</p>
                    <button
                      onClick={() => { setAddEpShowId(showDetails.id) }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Episode
                    </button>
                  </div>
                )}

                {/* 5. Impact Analysis Section */}
                {(() => {
                  const episodesWithImpact = showDetails.episodes.filter((ep) => ep.impact_notes && ep.impact_notes.length > 0)
                  if (episodesWithImpact.length === 0) return null
                  return (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Impact Analysis</p>
                      <div className="space-y-2">
                        {episodesWithImpact.map((ep) => (
                          <div key={ep.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                              Ep {String(ep.episode_number).padStart(2, '0')}: {ep.title}
                            </p>
                            <div className="space-y-1.5">
                              {ep.impact_notes.map((note) => (
                                <div key={note.id} className="flex items-start gap-2">
                                  {note.assigned_to_avatar ? (
                                    <img src={note.assigned_to_avatar} alt={note.assigned_to_name} className="w-5 h-5 rounded-full shrink-0 mt-0.5" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-[#b23a48] flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-[9px] font-bold text-white">{note.assigned_to_name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[10px] font-medium text-gray-900 dark:text-white">{note.assigned_to_name}</p>
                                      <p className="text-[9px] text-gray-400">
                                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                    {note.notes && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{note.notes}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* 6. Footer */}
            {showDetails && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
                <button
                  onClick={() => { navigate(`${basePath}?show=${showDetails.id}`); setShowDetailEpisode(null) }}
                  className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors"
                >
                  Open Show Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Episode Modal (from Show Details) */}
      {addEpShowId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Add Episode</h2>
              <button onClick={() => { setAddEpShowId(null); setAddEpTitle(''); setAddEpNumber(''); setAddEpDuration('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode Title <span className="text-red-500">*</span></label>
                <input type="text" value={addEpTitle} onChange={(e) => setAddEpTitle(e.target.value)} maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="e.g., Election Prep 2024" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode # <span className="text-red-500">*</span></label>
                <input type="number" value={addEpNumber} onChange={(e) => setAddEpNumber(e.target.value)} min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="1" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Target Duration (mins)</label>
                <input type="text" value={addEpDuration} onChange={(e) => setAddEpDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="e.g., 22:00" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setAddEpShowId(null); setAddEpTitle(''); setAddEpNumber(''); setAddEpDuration('') }} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleAddEpisodeFromModal} disabled={createEpisode.isPending || !addEpTitle.trim() || !addEpNumber}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {createEpisode.isPending ? 'Creating...' : 'Add Episode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Episode Modal (from Show Details table) */}
      {editEpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Edit Episode</h2>
              <button onClick={() => setEditEpModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode Title <span className="text-red-500">*</span></label>
                <input type="text" value={editEpTitle} onChange={(e) => setEditEpTitle(e.target.value)} maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Episode # <span className="text-red-500">*</span></label>
                <input type="number" value={editEpNumber} onChange={(e) => setEditEpNumber(e.target.value)} min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Target Duration (mins)</label>
                <input type="text" value={editEpDuration} onChange={(e) => setEditEpDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48] focus:border-transparent" placeholder="e.g., 22:00" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditEpModal(null)} className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button onClick={handleSaveEditEpisode} disabled={updateEpisode.isPending || !editEpTitle.trim() || !editEpNumber}
                  className="px-4 py-2 text-[11px] text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50">
                  {updateEpisode.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Show Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteShowTarget}
        onClose={() => setDeleteShowTarget(null)}
        onConfirm={handleDeleteShowConfirm}
        title="Delete Show"
        message={`Are you sure you want to permanently delete "${deleteShowTarget?.name || ''}"? All episodes and data will be removed.`}
        isDeleting={deleteShow.isPending}
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
    </div>
  )
}

// Episode Card Component
function EpisodeCard({ episode, columnKey, onClickCard, onMarkReady, onMarkBroadcasted, onAssignImpact }: {
  episode: ShowEpisode; columnKey: string; onClickCard: () => void;
  onMarkReady: () => void; onMarkBroadcasted: () => void; onAssignImpact: () => void;
}) {
  const statusColors: Record<string, string> = {
    production: 'text-blue-600', approved: 'text-orange-600',
    ready_for_broadcast: 'text-yellow-600', broadcasted: 'text-green-600',
  }
  const statusDots: Record<string, string> = {
    production: 'bg-blue-500', approved: 'bg-orange-500',
    ready_for_broadcast: 'bg-yellow-500', broadcasted: 'bg-green-500',
  }

  return (
    <div onClick={onClickCard}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">

      {/* Status tag at the very top */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDots[episode.status] || 'bg-gray-400'}`} />
        <span className={`text-[10px] font-medium ${statusColors[episode.status] || 'text-gray-500'}`}>
          {episode.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </div>

      {/* Show name */}
      <p className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-wide truncate mb-0.5">{episode.show_name}</p>

      {/* Episode title */}
      <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-snug mb-2">
        Ep {String(episode.episode_number).padStart(2, '0')}: {episode.title}
      </p>

      {/* Broadcasting actions — compact inline buttons */}
      {columnKey === 'broadcasting' && (
        <div className="flex flex-col gap-1">
          {episode.status === 'approved' && (
            <button onClick={(e) => { e.stopPropagation(); onMarkReady() }}
              className="text-[10px] font-medium px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded border border-orange-200 transition-colors text-left">
              Mark Ready for Broadcast
            </button>
          )}
          {episode.status === 'ready_for_broadcast' && (
            <button onClick={(e) => { e.stopPropagation(); onMarkBroadcasted() }}
              className="text-[10px] font-medium px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded border border-green-200 transition-colors text-left">
              Mark as Broadcasted
            </button>
          )}
        </div>
      )}

      {/* Broadcasted — compact assign button */}
      {columnKey === 'broadcasted' && (
        <button onClick={(e) => { e.stopPropagation(); onAssignImpact() }}
          className="text-[10px] font-medium px-2 py-1 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded border border-teal-200 transition-colors">
          Assign Impact Task
        </button>
      )}

      {/* Impact notes — minimal */}
      {columnKey === 'impact' && episode.impact_notes && episode.impact_notes.length > 0 && (
        <div className="space-y-1 mt-1">
          {episode.impact_notes.map((note: any) => (
            <div key={note.id} className="flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-teal-400 shrink-0 mt-1.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate">{note.assigned_to_name}</p>
                {note.notes && <p className="text-[10px] text-gray-400 truncate">{note.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
