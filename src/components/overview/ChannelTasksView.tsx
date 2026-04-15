import { useState } from 'react'
import { Video, Loader2, CheckCircle2, Clock, List, LayoutGrid } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const { data: stats, isLoading: statsLoading } = usePersonalChannelStats()

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Channel Tasks', value: stats?.totalTasks ?? 0, icon: Video, color: 'bg-[#b23a48]' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'bg-blue-500' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Not Started', value: stats?.notStarted ?? 0, icon: Video, color: 'bg-gray-500' },
  ]

  if (!tasks || tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">0</p>
                </div>
                <div className={`${s.color} p-3 rounded-lg`}><s.icon className="w-4 h-4 text-white" /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1">No channel tasks assigned</h3>
          <p className="text-[11px] text-gray-500">Channel tasks assigned to you will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-900 p-0.5 rounded-lg w-max border border-gray-200 dark:border-gray-700">
          <button onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <List className="w-3.5 h-3.5 mr-1" />List
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <LayoutGrid className="w-3.5 h-3.5 mr-1" />Grid
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                  <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
                </div>
                <div className={`${s.color} p-3 rounded-lg`}><s.icon className="w-4 h-4 text-white" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* List View */}
        {viewMode === 'list' ? (
          <div className="space-y-3">
            {tasks.map((task) => {
              const myStatus = task.my_status || 'not_started'
              const pct = Math.round((task.my_completed_count / task.target_count) * 100)
              return (
                <div key={task.id} onClick={() => setViewTaskId(task.id)}
                  className={`bg-white dark:bg-gray-800 border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden ${viewTaskId === task.id ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_BORDER[myStatus]}`} />
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[11px] font-medium text-gray-900 dark:text-white">{task.name}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[myStatus]}`}>
                          {STATUS_LABEL[myStatus]}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                        {task.channel_name} → {task.subcategory_name} • Type: {task.type}
                      </p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR[myStatus]}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white">{task.my_completed_count}/{task.target_count}</p>
                      <p className="text-[11px] text-gray-500">{pct}%</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.map((task) => {
              const myStatus = task.my_status || 'not_started'
              const pct = Math.round((task.my_completed_count / task.target_count) * 100)
              return (
                <div key={task.id} onClick={() => setViewTaskId(task.id)}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden flex flex-col ${viewTaskId === task.id ? 'border-l-[3px] border-l-[#b23a48] bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${STATUS_BORDER[myStatus]}`} />
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[myStatus]}`}>
                        {STATUS_LABEL[myStatus]}
                      </span>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">{task.my_completed_count}/{task.target_count}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-gray-900 dark:text-white">{task.name}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{task.channel_name} → {task.subcategory_name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Type: {task.type}</p>
                    <div className="mt-auto pt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-300 ${STATUS_BAR[myStatus]}`}
                          style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{pct}% complete</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Side Panel - with Update Progress */}
      <ChannelTaskDetailPanel
        isOpen={viewTaskId !== null}
        onClose={() => setViewTaskId(null)}
        taskId={viewTaskId}
      />
    </>
  )
}
