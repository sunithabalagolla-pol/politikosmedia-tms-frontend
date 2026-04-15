import { Tv, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useMyShowTasks } from '../../hooks/api/useShows'
import { usePersonalShowStats } from '../../hooks/api/useDashboard'

export default function ShowTasksOverviewView() {
  const { data: stats, isLoading: statsLoading } = usePersonalShowStats()
  const { data: tasks = [], isLoading: tasksLoading } = useMyShowTasks()

  if (statsLoading || tasksLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Show Tasks</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.totalTasks ?? 0}</p>
            </div>
            <div className="bg-[#b23a48] p-3 rounded-lg"><Tv className="w-4 h-4 text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Pending</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.pending ?? 0}</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Completed</p>
              <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.completed ?? 0}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg"><CheckCircle2 className="w-4 h-4 text-white" /></div>
          </div>
        </div>
      </div>

      {/* Task List - Read Only */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white">My Show Tasks</h2>
        </div>
        <div className="p-4">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">
                        {task.show_name} - Ep {String(task.episode_number).padStart(2, '0')}: {task.episode_title}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Assigned by: {task.created_by_name}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${task.notes ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {task.notes ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                  {task.notes && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 mt-2">
                      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Notes:</p>
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-line">{task.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8"><p className="text-[11px] text-gray-400">No show tasks assigned</p></div>
          )}
        </div>
      </div>
    </div>
  )
}
