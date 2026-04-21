import { useState } from 'react'
import { Video, Layers, TrendingUp, CheckCircle2, ListChecks, X, Loader2 } from 'lucide-react'
import { useChannels, useSubcategories } from '../../hooks/api'
import {
  useChannelStats, useTasksByChannel, useTasksBySubcategory,
  useChannelProgressByEmployee, useChannelRecentActivity
} from '../../hooks/api/useDashboard'
import { formatDistanceToNow } from 'date-fns'
import { resolveFileUrl } from '../../lib/fileUrl'

export default function ChannelsOverview() {
  const [selectedChannel, setSelectedChannel] = useState<string>()
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>()

  const { data: channels = [] } = useChannels()
  const { data: subcategories = [] } = useSubcategories(selectedChannel || '')

  const { data: stats, isLoading: statsLoading } = useChannelStats(selectedChannel, selectedSubcategory)
  const { data: channelBreakdown = [] } = useTasksByChannel()
  const { data: subcategoryBreakdown = [] } = useTasksBySubcategory(selectedChannel)
  const { data: employeeProgress = [] } = useChannelProgressByEmployee(selectedChannel, selectedSubcategory)
  const { data: recentActivity = [] } = useChannelRecentActivity(selectedChannel, selectedSubcategory)

  const handleChannelChange = (channelId: string) => {
    setSelectedChannel(channelId || undefined)
    setSelectedSubcategory(undefined)
  }

  const handleClearFilters = () => {
    setSelectedChannel(undefined)
    setSelectedSubcategory(undefined)
  }

  if (statsLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-gray-400" />
            <select
              value={selectedChannel || ''}
              onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
            >
              <option value="">All Channels</option>
              {channels.map((ch) => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          {selectedChannel && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSubcategory || ''}
                onChange={(e) => setSelectedSubcategory(e.target.value || undefined)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
              >
                <option value="">All Subcategories</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {(selectedChannel || selectedSubcategory) && (
            <button onClick={handleClearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-3 h-3" />Clear Filters
            </button>
          )}

          {(selectedChannel || selectedSubcategory) && (
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Filtered:</span>
              {selectedChannel && (
                <span className="px-2 py-0.5 bg-[#b23a48]/10 text-[#b23a48] rounded-full font-medium">
                  {channels.find((c) => c.id === selectedChannel)?.name}
                </span>
              )}
              {selectedSubcategory && (
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                  {subcategories.find((s) => s.id === selectedSubcategory)?.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Channel Tasks</p>
            <div className="w-6 h-6 rounded-lg bg-[#b23a48]/10 flex items-center justify-center"><Video className="w-3.5 h-3.5 text-[#b23a48]" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalTasks ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">In Progress</p>
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center"><ListChecks className="w-3.5 h-3.5 text-amber-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.inProgressTasks ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Completed</p>
            <div className="w-6 h-6 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.completedTasks ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Avg Progress</p>
            <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-orange-600" /></div>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.avgProgress ?? 0}%</p>
            <p className="text-xs text-gray-500">{stats?.totalCompleted ?? 0}/{stats?.totalTarget ?? 0} items</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Tasks by Channel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Tasks by Channel (All)</h2>
          {channelBreakdown.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(...channelBreakdown.map((d: any) => d.task_count), 1)
                return channelBreakdown.map((item: any) => {
                  const isSelected = channels.find((c) => c.name === item.channel_name)?.id === selectedChannel
                  const pct = (item.task_count / maxCount) * 100
                  return (
                    <div key={item.channel_name} className="flex items-center gap-3">
                      <span className={`w-32 text-xs font-medium truncate ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.channel_name}
                      </span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-[#b23a48]' : 'bg-teal-500 dark:bg-teal-600'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${isSelected ? 'text-[#b23a48]' : 'text-gray-900 dark:text-white'}`}>
                        {item.task_count}
                      </span>
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-xs text-gray-400">No channel data yet</p>
            </div>
          )}
        </div>

        {/* Tasks by Subcategory */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
            {selectedChannel ? `Tasks by Subcategory (${channels.find((c) => c.id === selectedChannel)?.name || ''})` : 'Tasks by Subcategory'}
          </h2>
          {selectedChannel ? (
            subcategoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const maxCount = Math.max(...subcategoryBreakdown.map((d: any) => d.task_count), 1)
                  return subcategoryBreakdown.map((item: any) => {
                    const isSelected = subcategories.find((s) => s.name === item.subcategory_name)?.id === selectedSubcategory
                    const pct = (item.task_count / maxCount) * 100
                    return (
                      <div key={item.subcategory_name} className="flex items-center gap-3">
                        <span className={`w-32 text-xs font-medium truncate ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.subcategory_name}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-[#b23a48]' : 'bg-green-400 dark:bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${isSelected ? 'text-[#b23a48]' : 'text-gray-900 dark:text-white'}`}>
                          {item.task_count}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-gray-400">No subcategories in this channel yet</p>
              </div>
            )
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Select a channel to see subcategory breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Progress + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Employee Progress */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Employee Progress</h2>
          {employeeProgress.length > 0 ? (
            <div className="space-y-4">
              {employeeProgress.map((emp: any) => (
                <div key={emp.user_id}>
                  <div className="flex items-center gap-3 mb-2">
                    {emp.avatar_url ? (
                      <img src={resolveFileUrl(emp.avatar_url)} alt={emp.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#b23a48] flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{emp.name?.split(' ').map((n: string) => n[0]).join('')}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.task_count} task{emp.task_count !== 1 ? 's' : ''} assigned</p>
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{emp.total_completed}/{emp.total_target} ({emp.progress}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${emp.progress >= 100 ? 'bg-green-500' : emp.progress > 0 ? 'bg-[#b23a48]' : 'bg-gray-300'}`}
                      style={{ width: `${Math.min(emp.progress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-xs text-gray-400">No employee progress data yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]" style={{ scrollbarWidth: 'thin' }}>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    {item.user_avatar ? (
                      <img src={resolveFileUrl(item.user_avatar)} alt={item.user_name} className="w-7 h-7 rounded-full shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-teal-600">{item.user_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{item.user_name}</p>
                      {item.extracted_number !== null && item.extracted_number !== undefined ? (
                        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                          Updated progress: +{item.extracted_number} on "{item.task_name}"
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.content}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {item.channel_name} → {item.subcategory_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <p className="text-xs text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
