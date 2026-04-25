import { useState } from 'react'
import { Tv, Loader2, Save, CheckCircle2, Clock, List, LayoutGrid, X, Pencil, MessageSquarePlus } from 'lucide-react'
import { useMyShowTasks, useUpdateImpactNotes, ShowImpactTask } from '../../hooks/api/useShows'

export default function ShowTasksView() {
  const { data: tasks = [], isLoading } = useMyShowTasks()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [notesModalTask, setNotesModalTask] = useState<ShowImpactTask | null>(null)

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const pending = tasks.filter((t) => !t.notes).length
  const completed = tasks.filter((t) => !!t.notes).length

  const statCards = [
    { label: 'Total Show Tasks', value: tasks.length, icon: Tv, color: 'bg-[#b23a48]/10 text-[#b23a48]' },
    { label: 'Pending', value: pending, icon: Clock, color: 'bg-orange-500/10 text-orange-500' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
  ]

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg w-max border border-gray-200 dark:border-gray-700">
            <button onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <LayoutGrid className="w-3.5 h-3.5 mr-1" />Grid
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <List className="w-3.5 h-3.5 mr-1" />List
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-medium">{stat.label}</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-1.5 rounded-lg ${stat.color}`}>
                <stat.icon className="w-2.5 h-2.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3"><Tv className="w-6 h-6" /></div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">No show tasks assigned</h3>
            <p className="text-xs text-gray-500 max-w-sm">Impact tasks assigned to you will appear here.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View — 5 per line */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tasks.map((task) => (
              <ShowTaskGridCard key={task.id} task={task} onOpenNotes={() => setNotesModalTask(task)} />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {tasks.map((task) => (
              <ShowTaskListCard key={task.id} task={task} onOpenNotes={() => setNotesModalTask(task)} />
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {notesModalTask && (
        <ImpactNotesModal
          task={notesModalTask}
          onClose={() => setNotesModalTask(null)}
        />
      )}
    </>
  )
}

/* ── Grid Card (read-only, click to open modal) ── */
function ShowTaskGridCard({ task, onOpenNotes }: { task: ShowImpactTask; onOpenNotes: () => void }) {
  const hasNotes = !!task.notes
  const statusBadge = hasNotes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
  const statusLabel = hasNotes ? 'Completed' : 'Pending'
  const borderColor = hasNotes ? 'bg-green-500' : 'bg-orange-500'

  return (
    <div
      onClick={onOpenNotes}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
      <div className="p-2.5 pl-3 flex-1 flex flex-col gap-1">
        {/* Status */}
        <span className={`inline-flex items-center self-start px-1 py-0.5 rounded text-[10px] font-medium ${statusBadge}`}>
          {statusLabel}
        </span>

        {/* Title */}
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight line-clamp-2">
          {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
        </h3>

        {/* Meta */}
        <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
          Assigned by: {task.created_by_name}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Status: {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </p>

        {/* Notes preview or Add Notes button */}
        <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700">
          {hasNotes ? (
            <div className="flex items-start justify-between gap-1">
              <p className="text-[10px] text-gray-600 dark:text-gray-300 line-clamp-2 flex-1">{task.notes}</p>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenNotes() }}
                className="p-0.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded shrink-0"
                title="Edit Notes"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenNotes() }}
              className="flex items-center gap-1 text-[10px] font-medium text-[#b23a48] hover:text-[#8e2e39] transition-colors"
            >
              <MessageSquarePlus className="w-3 h-3" />
              Add Notes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── List Card (read-only, click to open modal) ── */
function ShowTaskListCard({ task, onOpenNotes }: { task: ShowImpactTask; onOpenNotes: () => void }) {
  const hasNotes = !!task.notes
  const statusBadge = hasNotes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
  const statusLabel = hasNotes ? 'Completed' : 'Pending'
  const borderColor = hasNotes ? 'bg-green-500' : 'bg-orange-500'

  return (
    <div
      onClick={onOpenNotes}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
      <div className="flex items-center gap-3 pl-1">
        {/* Status */}
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${statusBadge}`}>
          {statusLabel}
        </span>

        {/* Title & Meta */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white truncate">
            {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Assigned by: {task.created_by_name} • {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </p>
        </div>

        {/* Notes preview */}
        {hasNotes && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[200px] truncate shrink-0">{task.notes}</p>
        )}

        {/* Action */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpenNotes() }}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium shrink-0 transition-colors ${
            hasNotes
              ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
              : 'text-white bg-[#b23a48] hover:bg-[#8e2e39]'
          }`}
        >
          {hasNotes ? <><Pencil className="w-2.5 h-2.5" /> Edit</> : <><MessageSquarePlus className="w-2.5 h-2.5" /> Add Notes</>}
        </button>
      </div>
    </div>
  )
}

/* ── Impact Notes Modal ── */
function ImpactNotesModal({ task, onClose }: { task: ShowImpactTask; onClose: () => void }) {
  const [notes, setNotes] = useState(task.notes || '')
  const [saved, setSaved] = useState(false)
  const updateNotes = useUpdateImpactNotes()

  const hasExistingNotes = !!task.notes

  const handleSave = async () => {
    try {
      await updateNotes.mutateAsync({ taskId: task.id, notes })
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        onClose()
      }, 1000)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save notes')
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[60] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {hasExistingNotes ? 'Edit Impact Notes' : 'Add Impact Notes'}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Details */}
        <div className="px-4 pt-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${task.notes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {task.notes ? 'Completed' : 'Pending'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              Assigned by: {task.created_by_name}
            </span>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            Episode Status: {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </div>
        </div>

        {/* Notes Input */}
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Impact Notes
            </label>
            <textarea
              autoFocus
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
              rows={4}
              placeholder="Enter impact notes, likes, views, comments..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {saved ? (
              <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            ) : (
              <button
                onClick={handleSave}
                disabled={updateNotes.isPending || !notes.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg transition-colors disabled:opacity-50"
              >
                {updateNotes.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {updateNotes.isPending ? 'Saving...' : 'Save Notes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
