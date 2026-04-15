import { useState } from 'react'
import { Tv, Loader2, Save, CheckCircle2 } from 'lucide-react'
import { useMyShowTasks, useUpdateImpactNotes, ShowImpactTask } from '../../hooks/api/useShows'

export default function ShowTasksView() {
  const { data: tasks = [], isLoading } = useMyShowTasks()

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const pending = tasks.filter((t) => !t.notes).length
  const completed = tasks.filter((t) => !!t.notes).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Show Tasks</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{tasks.length}</p>
            </div>
            <div className="bg-[#b23a48] p-3 rounded-lg"><Tv className="w-4 h-4 text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Pending</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{pending}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg"><Tv className="w-4 h-4 text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Completed</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{completed}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg"><CheckCircle2 className="w-4 h-4 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white">My Show Tasks</h2>
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Tv className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1">No show tasks assigned</h3>
            <p className="text-[11px] text-gray-500">Impact tasks assigned to you will appear here.</p>
          </div>
        ) : (
          tasks.map((task) => <ShowTaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  )
}

function ShowTaskCard({ task }: { task: ShowImpactTask }) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">
            {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Assigned by: {task.created_by_name} • Status: {task.episode_status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </p>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${task.notes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {task.notes ? 'Completed' : 'Pending'}
        </span>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-gray-700 dark:text-gray-300 mb-1">Impact Notes</label>
        <textarea value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false) }} rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none"
          placeholder="Enter impact data for this episode...&#10;e.g., Views: 12.4K, Reach: 45.2K" />
      </div>

      <div className="flex justify-end mt-3">
        {saved ? (
          <span className="flex items-center gap-1.5 text-green-600 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
          </span>
        ) : (
          <button onClick={handleSave} disabled={updateNotes.isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-white bg-[#b23a48] hover:bg-[#8e2e39] rounded-lg disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" />{updateNotes.isPending ? 'Saving...' : 'Save Notes'}
          </button>
        )}
      </div>
    </div>
  )
}
