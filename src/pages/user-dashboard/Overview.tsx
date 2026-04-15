import { useState, useEffect } from 'react'
import { CheckCircle2, Clock, AlertCircle, Calendar, ListChecks, Loader2, Video, Tv } from 'lucide-react'
import { usePersonalStats, useRecentTasks, usePersonalDeadlines, usePersonalChannelStats, usePersonalShowStats } from '../../hooks/api/useDashboard'
import { formatDate as fmtDate, getDateMonth, getDateDay } from '../../lib/dateUtils'
import ChannelTasksOverviewView from '../../components/overview/ChannelTasksOverviewView'
import ShowTasksOverviewView from '../../components/overview/ShowTasksOverviewView'

export default function Overview() {
  const [activeView, setActiveView] = useState<'regular' | 'channel' | 'show'>('regular')

  const { data: stats, isLoading: statsLoading } = usePersonalStats()
  const { data: channelStats, isLoading: channelStatsLoading } = usePersonalChannelStats()
  const { data: showStats, isLoading: showStatsLoading } = usePersonalShowStats()
  const { data: recentTasks, isLoading: tasksLoading } = useRecentTasks(4)
  const { data: deadlines, isLoading: deadlinesLoading } = usePersonalDeadlines(3)

  const hasRegularTasks = (stats?.totalTasks ?? 0) > 0
  const hasChannelTasks = (channelStats?.totalTasks ?? 0) > 0
  const hasShowTasks = (showStats?.totalTasks ?? 0) > 0
  const taskTypes = [hasRegularTasks && 'regular', hasChannelTasks && 'channel', hasShowTasks && 'show'].filter(Boolean) as string[]
  const showToggle = taskTypes.length > 1

  // Auto-set view
  useEffect(() => {
    if (taskTypes.length === 1) setActiveView(taskTypes[0] as any)
    else if (taskTypes.length > 1 && !taskTypes.includes(activeView)) setActiveView(taskTypes[0] as any)
  }, [hasRegularTasks, hasChannelTasks, hasShowTasks])

  const statCards = [
    { label: 'Total Tasks', value: stats?.totalTasks ?? 0, icon: ListChecks, color: 'bg-blue-500' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertCircle, color: 'bg-red-500' },
  ]

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'completed' || s === 'done') return 'bg-green-100 text-green-700'
    if (s === 'in-progress' || s === 'in progress') return 'bg-blue-100 text-blue-700'
    if (s === 'todo' || s === 'to-do' || s === 'to do') return 'bg-gray-100 text-gray-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getPriorityStyle = (priority: string) => {
    const p = priority.toLowerCase()
    if (p === 'high') return 'bg-red-100 text-red-700'
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const formatStatus = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'in-progress') return 'In Progress'
    if (s === 'todo' || s === 'to-do') return 'To Do'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (statsLoading || channelStatsLoading || showStatsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  // No tasks at all
  if (!hasRegularTasks && !hasChannelTasks && !hasShowTasks) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
        <ListChecks className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-2">No tasks assigned yet</h3>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">You'll see your tasks here once they're assigned to you</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toggle - Only if employee has multiple types */}
      {showToggle && (
        <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 w-fit">
          {hasRegularTasks && (
            <button onClick={() => setActiveView('regular')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-medium transition-colors ${activeView === 'regular' ? 'bg-[#b23a48] text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <ListChecks className="w-3.5 h-3.5" />Regular Tasks
            </button>
          )}
          {hasChannelTasks && (
            <button onClick={() => setActiveView('channel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-medium transition-colors ${activeView === 'channel' ? 'bg-[#b23a48] text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Video className="w-3.5 h-3.5" />Channel Tasks
            </button>
          )}
          {hasShowTasks && (
            <button onClick={() => setActiveView('show')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-medium transition-colors ${activeView === 'show' ? 'bg-[#b23a48] text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              <Tv className="w-3.5 h-3.5" />Show Tasks
            </button>
          )}
        </div>
      )}

      {/* Regular Tasks View */}
      {activeView === 'regular' && hasRegularTasks && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Tasks */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white">Recent Tasks</h2>
              </div>
              <div className="p-4">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                ) : recentTasks && recentTasks.length > 0 ? (
                  <div className="space-y-3">
                    {recentTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-medium text-gray-900 dark:text-white truncate">{task.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${getStatusStyle(task.status)}`}>{formatStatus(task.status)}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${getPriorityStyle(task.priority)}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 ml-4">
                          {task.due_date ? fmtDate(task.due_date) : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8"><p className="text-[11px] text-gray-400">No tasks yet</p></div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />Upcoming Deadlines
                </h2>
              </div>
              <div className="p-4">
                {deadlinesLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                ) : deadlines && deadlines.length > 0 ? (
                  <div className="space-y-3">
                    {deadlines.map((item: any, index: number) => (
                      <div key={item.id || index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#b23a48] text-white rounded-lg flex flex-col items-center justify-center">
                          <span className="text-[11px] font-bold">{getDateMonth(item.due_date)}</span>
                          <span className="text-[11px] font-bold">{getDateDay(item.due_date)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[11px] font-medium text-gray-900 dark:text-white">{item.title}</h3>
                          <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full mt-1 ${getPriorityStyle(item.priority)}`}>{item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8"><p className="text-[11px] text-gray-400">No upcoming deadlines</p></div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Channel Tasks View - Read Only */}
      {activeView === 'channel' && hasChannelTasks && (
        <ChannelTasksOverviewView />
      )}

      {/* Show Tasks View - Read Only */}
      {activeView === 'show' && hasShowTasks && (
        <ShowTasksOverviewView />
      )}
    </div>
  )
}
