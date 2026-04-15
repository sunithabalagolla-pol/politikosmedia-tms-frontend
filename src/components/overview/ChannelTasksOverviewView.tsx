import { useState } from 'react'
import { Video, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useMyChannelTasks } from '../../hooks/api'
import { usePersonalChannelStats } from '../../hooks/api/useDashboard'
import { formatDistanceToNow } from 'date-fns'
import ChannelTaskDetailPanel from '../channels/ChannelTaskDetailPanel'

export default function ChannelTasksOverviewView() {
  const { data: stats, isLoading: statsLoading } = usePersonalChannelStats()
  const { data: tasks = [], isLoading: tasksLoading } = useMyChannelTasks()
  const [viewTaskId, setViewTaskId] = useState<string | null>(null)

  if (statsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Total Channel Tasks</p>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.totalTasks ?? 0}</p>
              </div>
              <div className="bg-[#b23a48] p-3 rounded-lg"><Video className="w-4 h-4 text-white" /></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">In Progress</p>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.inProgress ?? 0}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg"><Clock className="w-4 h-4 text-white" /></div>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Not Started</p>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stats?.notStarted ?? 0}</p>
              </div>
              <div className="bg-gray-500 p-3 rounded-lg"><Video className="w-4 h-4 text-white" /></div>
            </div>
          </div>
        </div>

        {/* Task List - Read Only, clickable cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white">My Channel Tasks</h2>
          </div>
          <div className="p-4">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task: any) => {
                  const pct = Math.round((task.my_completed_count / task.target_count) * 100)
                  const myStatus = task.my_status || 'not_started'
                  const statusLabel = { not_started: 'Not Started', in_progress: 'In Progress', completed: 'Completed' }[myStatus]
                  const statusBadge = { not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' }[myStatus]
                  const barColor = { not_started: 'bg-gray-400', in_progress: 'bg-blue-500', completed: 'bg-green-500' }[myStatus]
                  return (
                    <div key={task.id} onClick={() => setViewTaskId(task.id)}
                      className={`p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative overflow-hidden ${viewTaskId === task.id ? 'bg-red-50/30 dark:bg-red-900/10 border-l-[3px] border-l-[#b23a48]' : 'bg-gray-50 dark:bg-gray-900'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-[11px] font-medium text-gray-900 dark:text-white">{task.name}</h3>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadge}`}>{statusLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                            <span>{task.channel_name} → {task.subcategory_name}</span>
                            <span>•</span>
                            <span>Type: {task.type}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white">{task.my_completed_count}/{task.target_count}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{pct}%</p>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      {task.my_last_updated && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Last updated: {formatDistanceToNow(new Date(task.my_last_updated), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8"><p className="text-[11px] text-gray-400">No channel tasks assigned</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel - Read Only (no Update Progress) */}
      <ChannelTaskDetailPanel
        isOpen={viewTaskId !== null}
        onClose={() => setViewTaskId(null)}
        taskId={viewTaskId}
        readOnly
      />
    </>
  )
}
