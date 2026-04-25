import { useState } from 'react'
import { Video, Loader2, CheckCircle2, Clock, List, LayoutGrid, Calendar } from 'lucide-react'
import { ChannelTask, ChannelTaskStatus } from '../../hooks/api'
import { usePersonalChannelStats } from '../../hooks/api/useDashboard'
import ChannelTaskDetailPanel from '../channels/ChannelTaskDetailPanel'

const STATUS_LABEL: Record<ChannelTaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_BADGE: Record<ChannelTaskStatus, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const STATUS_BAR: Record<ChannelTaskStatus, string> = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
}

const STATUS_BORDER: Record<ChannelTaskStatus, string> = {
  not_started: 'bg-gray-300',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
}

interface ChannelTasksViewProps {
  tasks: ChannelTask[]
  isLoading?: boolean
}

export default function ChannelTasksView({ tasks, isLoading }: ChannelTasksViewProps) {
  const [viewTaskId, setViewTaskId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { data: stats, isLoading: statsLoading } = usePersonalChannelStats()

  if (isLoading || statsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
  }

  const statCards = [
    { label: 'Total Channel Tasks', value: stats?.totalTasks ?? 0, icon: Video, color: 'bg-[#b23a48]/10 text-[#b23a48]' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'bg-green-500/10 text-green-500' },
    { label: 'Not Started', value: stats?.notStarted ?? 0, icon: Calendar, color: 'bg-gray-500/10 text-gray-500' },
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

        {/* Stats Cards — matching Regular Tasks style */}
        <div className="grid grid-cols-4 gap-2">
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
        {(!tasks || tasks.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3"><Video className="w-6 h-6" /></div>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">No channel tasks assigned</h3>
            <p className="text-xs text-gray-500 max-w-sm">Channel tasks assigned to you will appear here.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View — matching Regular Tasks card style */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tasks.map((task) => {
              const myStatus = task.my_status || 'not_started'
              const pct = Math.round((task.my_completed_count / task.target_count) * 100)
              return (
                <div key={task.id} onClick={() => setViewTaskId(task.id)}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden flex flex-col ${viewTaskId === task.id ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_BORDER[myStatus]}`} />
                  <div className="p-2.5 pl-3 flex-1 flex flex-col gap-1">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-[10px] font-medium ${STATUS_BADGE[myStatus]}`}>
                        {STATUS_LABEL[myStatus]}
                      </span>
                      <span className="text-[10px] font-bold text-gray-900 dark:text-white">{task.my_completed_count}/{task.target_count}</span>
                    </div>
                    <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight line-clamp-2">{task.name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">{task.channel_name} → {task.subcategory_name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Type: {task.type}</p>
                    <div className="mt-auto pt-1.5 border-t border-gray-100 dark:border-gray-700">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR[myStatus]}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{pct}% complete</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List View — matching Regular Tasks list style */
          <div className="space-y-2">
            {tasks.map((task) => {
              const myStatus = task.my_status || 'not_started'
              const pct = Math.round((task.my_completed_count / task.target_count) * 100)
              return (
                <div key={task.id} onClick={() => setViewTaskId(task.id)}
                  className={`bg-white dark:bg-gray-800 border rounded-lg p-2.5 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden ${viewTaskId === task.id ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_BORDER[myStatus]}`} />
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${STATUS_BADGE[myStatus]}`}>
                      {STATUS_LABEL[myStatus]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">{task.name}</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{task.channel_name} → {task.subcategory_name} • Type: {task.type}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${STATUS_BAR[myStatus]}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white w-12 text-right">{task.my_completed_count}/{task.target_count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ChannelTaskDetailPanel isOpen={viewTaskId !== null} onClose={() => setViewTaskId(null)} taskId={viewTaskId} />
    </>
  )
}
