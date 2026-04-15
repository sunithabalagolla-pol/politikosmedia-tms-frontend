import { useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Plus, Loader2, X, Tv, ChevronRight, CheckCircle2, Radio, BarChart3, Pencil, Trash2 } from 'lucide-react'
import { useShowBoard, useCreateShow, useUpdateShow, useDeleteShow, useMarkReadyForBroadcast, useMarkBroadcasted, useCreateImpactTask, ShowEpisode } from '../../hooks/api/useShows'
import { useLookupEmployees } from '../../hooks/api/useLookups'
import ShowWorkspace from '../../components/shows/ShowWorkspace'

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

  const { data: board, isLoading } = useShowBoard()
  const createShow = useCreateShow()
  const updateShow = useUpdateShow()
  const deleteShow = useDeleteShow()
  const markReady = useMarkReadyForBroadcast()
  const markBroadcasted = useMarkBroadcasted()
  const createImpact = useCreateImpactTask()
  const { data: employees = [] } = useLookupEmployees()

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
    if (!confirm(`Are you sure you want to delete "${showName}"?\n\nThis action cannot be undone.`)) return
    try {
      await deleteShow.mutateAsync(showId)
    } catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete show') }
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
                  // Show-only card (no episodes yet)
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
                          <span className="text-[10px] text-orange-500 font-medium">No episodes yet</span>
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
    <div onClick={columnKey === 'creation_production' ? onClickCard : undefined}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2.5 shadow-sm hover:shadow-md transition-shadow ${columnKey === 'creation_production' ? 'cursor-pointer' : ''}`}>

      {/* Show name + episode */}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{episode.show_name}</p>
          <p className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug">
            Ep {String(episode.episode_number).padStart(2, '0')}: {episode.title}
          </p>
        </div>
        {columnKey === 'creation_production' && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-1" />}
      </div>

      {/* Status dot + label inline */}
      <div className="flex items-center gap-1 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDots[episode.status] || 'bg-gray-400'}`} />
        <span className={`text-[10px] font-medium ${statusColors[episode.status] || 'text-gray-500'}`}>
          {episode.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </span>
      </div>

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
