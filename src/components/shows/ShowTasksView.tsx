import { useState } from 'react'
import { Tv, Loader2, Save, CheckCircle2, Clock, List, LayoutGrid } from 'lucide-react'
import { useMyShowTasks, useUpdateImpactNotes, ShowImpactTask } from '../../hooks/api/useShows'

export default function ShowTasksView() {
  const { data: tasks = [], isLoading } = useMyShowTasks()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const pending = tasks.filter((t) => !t.notes).length
  const completed = tasks.filter((t) => !!t.notes).length

  const statCards = [
    { label: 'Total Show Tasks', value: tasks.length, icon: Tv, color: 'bg-[#b23a48]/10 text-[#b23a48]' },
    { label: 'Pending', value: pending, icon: Clock, color: 'bg-orange-500/10 text-orange-500' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
  ]

  return (
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

      {/* Stats Cards — matching Regular Tasks style */}
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
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {tasks.map((task) => <ShowTaskCard key={task.id} task={task} variant="grid" />)}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {tasks.map((task) => <ShowTaskCard key={task.id} task={task} variant="list" />)}
        </div>
      )}
    </div>
  )
}

function ShowTaskCard({ task, variant }: { task: ShowImpactTask; variant: 'grid' | 'list' }) {
  const [notes, setNotes] = useState(task.notes || '')
  const [saved, setSaved] = useState(false)
  const updateNotes = useUpdateImpactNotes()

  const handleSave = async () => {
    try {
      await updateNotes.mutateAsync({ taskId: task.id, notes })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to save notes')
    }
  }

  const statusBadge = task.notes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
  const statusLabel = task.notes ? 'Completed' : 'Pending'
  const borderColor = task.notes ? 'bg-green-500' : 'bg-orange-500'

  if (variant === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
        <div className="flex items-start gap-3">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${statusBadge}`}>
            {statusLabel}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">
              {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Assigned by: {task.created_by_name} • {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false) }} rows={1}
              className="w-48 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 resize-none"
              placeholder="Impact notes..." />
            {saved ? (
              <span className="text-green-600 text-[10px] font-medium shrink-0">✓ Saved</span>
            ) : (
              <button onClick={handleSave} disabled={updateNotes.isPending}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded disabled:opacity-50 shrink-0">
                <Save className="w-2.5 h-2.5" />{updateNotes.isPending ? '...' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
      <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`} />
      <div className="p-2.5 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge}`}>
            {statusLabel}
          </span>
        </div>
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white leading-snug">
          {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Assigned by: {task.created_by_name}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Status: {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </p>
        <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false) }} rows={2}
            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 resize-none"
            placeholder="Enter impact notes..." />
          <div className="flex justify-end">
            {saved ? (
              <span className="flex items-center gap-1 text-green-600 text-[10px] font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" /> Saved!
              </span>
            ) : (
              <button onClick={handleSave} disabled={updateNotes.isPending}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded disabled:opacity-50 transition-colors">
                <Save className="w-2.5 h-2.5" />{updateNotes.isPending ? 'Saving...' : 'Save Notes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
