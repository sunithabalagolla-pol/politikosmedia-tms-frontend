import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, ListChecks, AlertTriangle, Clock, CalendarClock,
  FileText, UserPlus, Loader2, Plus, FolderTree, X, Video, Tv
} from 'lucide-react'
import {
  useDashboardStats, useTasksByStatus,
  useActivityTimeline, useRecentActivity, useDepartmentProgress, useUpcomingDeadlines,
  useTasksByCategory, useTasksByPhase, useShowStats
} from '../../hooks/api/useDashboard'
import { useCategories, useAssignedCategories } from '../../hooks/api/useCategories'
import { usePhases, useAssignedPhases } from '../../hooks/api/usePhases'
import { useAuth } from '../../context/AuthContext'
import { formatDate as fmtDate } from '../../lib/dateUtils'
import ChannelsOverview from '../../components/overview/ChannelsOverview'
import ShowsOverview from '../../components/overview/ShowsOverview'

type TimelineTab = 'today' | 'week' | 'month'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const DOT_COLORS: Record<string, string> = {
  completed: 'bg-green-500', created: 'bg-teal-600', updated: 'bg-amber-600',
  deleted: 'bg-red-500', inProgress: 'bg-amber-600', overdue: 'bg-red-500', new: 'bg-teal-600',
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-teal-50 text-teal-600', updated: 'bg-amber-50 text-amber-600',
  completed: 'bg-green-50 text-green-600', deleted: 'bg-red-50 text-red-600',
}

export default function Overview() {
  const { user } = useAuth()
  const [overviewMode, setOverviewMode] = useState<'tasks' | 'channels' | 'shows'>('tasks')
  const [activeTab, setActiveTab] = useState<TimelineTab>('week')
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null)
  const [statusTimeline, setStatusTimeline] = useState<'week' | 'month' | 'quarter' | 'alltime'>('month')
  
  // Category/Phase filters
  const [selectedCategory, setSelectedCategory] = useState<string>()
  const [selectedPhase, setSelectedPhase] = useState<string>()
  
  // Categories: Admin/Manager see all, Employee sees only assigned
  const { data: allCategories } = useCategories()
  const { data: assignedCategories } = useAssignedCategories()
  const categories = user?.role === 'user' ? assignedCategories : allCategories
  
  // Phases: Admin/Manager see all for category, Employee sees only assigned
  const { data: allPhases } = usePhases(selectedCategory || null)
  const { data: assignedPhases } = useAssignedPhases(selectedCategory)
  const phases = user?.role === 'user' ? assignedPhases : allPhases
  
  const filters = {
    category_id: selectedCategory,
    phase_id: selectedPhase,
  }

  // API calls with filters
  const { data: stats, isLoading: statsLoading } = useDashboardStats(filters)
  const { data: statusData } = useTasksByStatus(statusTimeline, 'all', filters)
  const { data: timeline } = useActivityTimeline(activeTab, filters)
  const { data: recentActivity } = useRecentActivity(5, filters)
  const { data: deptProgress } = useDepartmentProgress('all', filters)
  const { data: deadlines } = useUpcomingDeadlines(4, filters)
  
  // New charts - Tasks by Category & Phase
  const { data: categoryBreakdown } = useTasksByCategory()
  const { data: phaseBreakdown } = useTasksByPhase(selectedCategory)
  
  // Show stats for toggle visibility
  const { data: showStats } = useShowStats()
  const hasShows = (showStats?.totalShows ?? 0) > 0 || (showStats?.totalEpisodes ?? 0) > 0
  const handleClearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedPhase(undefined)
  }
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId || undefined)
    setSelectedPhase(undefined) // Reset phase when category changes
  }

  // Donut chart calculations
  const statusItems = [
    { key: 'todo', label: 'To Do', count: statusData?.todo ?? 0, color: '#0d9488' },
    { key: 'inProgress', label: 'In Progress', count: statusData?.inProgress ?? 0, color: '#d97706' },
    { key: 'completed', label: 'Completed', count: statusData?.completed ?? 0, color: '#22C55E' },
    { key: 'hold', label: 'On Hold', count: statusData?.hold ?? 0, color: '#b23a48' },
    { key: 'overdue', label: 'Overdue', count: statusData?.overdue ?? 0, color: '#EF4444' },
  ]
  const statusTotal = statusItems.reduce((s, i) => s + i.count, 0)
  const C = 88
  let donutOffset = 0
  const donutSegments = statusItems.map(s => {
    const frac = statusTotal > 0 ? s.count / statusTotal : 0
    const dash = frac * C
    const seg = { ...s, dash, gap: C - dash, offset: -donutOffset, frac }
    donutOffset += dash
    return seg
  })

  if (statsLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Tasks / Channels / Shows Tab Switcher */}
      <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 w-fit shadow-sm">
        <button
          onClick={() => setOverviewMode('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            overviewMode === 'tasks'
              ? 'bg-[#b23a48] text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Tasks
        </button>
        <button
          onClick={() => setOverviewMode('channels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
            overviewMode === 'channels'
              ? 'bg-[#b23a48] text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Channels
        </button>
        {hasShows && (
          <button
            onClick={() => setOverviewMode('shows')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              overviewMode === 'shows'
                ? 'bg-[#b23a48] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            Shows
          </button>
        )}
      </div>

      {/* Channels Overview */}
      {overviewMode === 'channels' && <ChannelsOverview />}

      {/* Shows Overview */}
      {overviewMode === 'shows' && <ShowsOverview />}

      {/* Tasks Overview */}
      {overviewMode === 'tasks' && (
      <>
      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPhase || ''}
              onChange={(e) => setSelectedPhase(e.target.value || undefined)}
              disabled={!selectedCategory}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
            >
              <option value="">All Phases</option>
              {phases?.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedCategory || selectedPhase) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}

          {/* Active Filter Indicator */}
          {(selectedCategory || selectedPhase) && (
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Filtered:</span>
              {selectedCategory && (
                <span className="px-2 py-0.5 bg-[#b23a48]/10 text-[#b23a48] rounded-full font-medium">
                  {categories?.find(c => c.id === selectedCategory)?.name}
                </span>
              )}
              {selectedPhase && (
                <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full font-medium">
                  {phases?.find(p => p.id === selectedPhase)?.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Tasks</p>
            <div className="w-6 h-6 rounded-lg bg-[#b23a48]/10 flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-[#b23a48]" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalTasks ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Active Tasks</p>
            <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center"><ListChecks className="w-3.5 h-3.5 text-teal-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.activeTasks ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Overdue</p>
            <div className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.overdueTasks ?? 0}</p></div>
        </div>
      </div>

      {/* Tasks by Category & Phase Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Chart - Tasks by Category (All) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Tasks by Category (All)</h2>
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxCount = Math.max(...categoryBreakdown.map((d: any) => d.task_count), 1)
                return categoryBreakdown.map((item: any) => {
                  const isSelected = categories?.find(c => c.name === item.category_name)?.id === selectedCategory
                  const percentage = (item.task_count / maxCount) * 100
                  return (
                    <div key={item.category_name} className="flex items-center gap-3">
                      <span className={`w-32 text-xs font-medium truncate ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.category_name}
                      </span>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? 'bg-[#b23a48]' : 'bg-teal-500 dark:bg-teal-600'
                          }`}
                          style={{ width: `${percentage}%` }}
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
              <p className="text-xs text-gray-400">No category data yet</p>
            </div>
          )}
        </div>

        {/* Right Chart - Tasks by Phase */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">
            {selectedCategory ? `Tasks by Phase (${categories?.find(c => c.id === selectedCategory)?.name || 'Selected Category'})` : 'Tasks by Phase'}
          </h2>
          {selectedCategory ? (
            phaseBreakdown && phaseBreakdown.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  const maxCount = Math.max(...phaseBreakdown.map((d: any) => d.task_count), 1)
                  return phaseBreakdown.map((item: any) => {
                    const isSelected = phases?.find(p => p.name === item.phase_name)?.id === selectedPhase
                    const percentage = (item.task_count / maxCount) * 100
                    return (
                      <div key={item.phase_name} className="flex items-center gap-3">
                        <span className={`w-32 text-xs font-medium truncate ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.phase_name}
                        </span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected ? 'bg-[#b23a48]' : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentage}%` }}
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
                <p className="text-xs text-gray-400">No phases in this category yet</p>
              </div>
            )
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Select a category to see phase breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-3">

          {/* Tasks by Status Donut - unchanged */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Tasks by Status</h2>
              <select value={statusTimeline} onChange={(e) => setStatusTimeline(e.target.value as any)}
                className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 focus:outline-none">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="alltime">All Time</option>
              </select>
            </div>
            {statusTotal > 0 ? (
              <div className="flex items-center gap-6">
                <div className="relative w-48 h-48 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {donutSegments.map(seg => (
                      <circle key={seg.key} cx="18" cy="18" r="14" fill="none" stroke={seg.color} strokeWidth="4"
                        strokeDasharray={`${seg.dash} ${seg.gap}`} strokeDashoffset={seg.offset}
                        className={`transition-all duration-500 cursor-pointer ${hoveredStatus && hoveredStatus !== seg.key ? 'opacity-40' : 'opacity-100'}`}
                        onMouseEnter={() => setHoveredStatus(seg.key)} onMouseLeave={() => setHoveredStatus(null)} />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {donutSegments.map(seg => hoveredStatus === seg.key && (
                      <div key={seg.key} className="flex flex-col items-center">
                        <span className="text-lg font-bold" style={{ color: seg.color }}>{seg.count}</span>
                        <span className="text-xs text-gray-500">{seg.label} · {Math.round(seg.frac * 100)}%</span>
                      </div>
                    ))}
                    {!hoveredStatus && (
                      <><span className="text-lg font-bold text-gray-900 dark:text-white">{statusTotal}</span><span className="text-xs text-gray-500">Total Tasks</span></>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
                  {donutSegments.map(seg => (
                    <div key={seg.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer"
                      onMouseEnter={() => setHoveredStatus(seg.key)} onMouseLeave={() => setHoveredStatus(null)}>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></div>
                      <div><p className="text-xs font-medium text-gray-900 dark:text-white">{seg.label}</p><p className="text-xs text-gray-500">{seg.count} tasks · {Math.round(seg.frac * 100)}%</p></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center"><p className="text-xs text-gray-400">No task data yet</p></div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                {(['today', 'week', 'month'] as TimelineTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'today' ? 'Today' : tab === 'week' ? 'This Week' : 'This Month'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {timeline && timeline.length > 0 ? (
                <div className="relative pl-5">
                  <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200 dark:bg-gray-600" />
                  <div className="space-y-0.5">
                    {timeline.map((entry: any, i: number) => (
                      <div key={i} className="relative flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className={`absolute left-[-13px] top-[12px] w-2.5 h-2.5 rounded-full border-2 border-white ${DOT_COLORS[entry.type] || 'bg-blue-500'} shrink-0 z-10`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{entry.title}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-500">{entry.employee}</span>
                            {entry.department && <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">{entry.department}</span>}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">{timeAgo(entry.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center"><p className="text-xs text-gray-400">No activity yet</p></div>
              )}
            </div>
          </div>

          {/* Department Progress - below Activity Timeline, scrollable */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Department Progress</h2>
            {deptProgress && deptProgress.length > 0 ? (
              <div className="h-[200px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                <div className="space-y-4">
                  {deptProgress.map((dept: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{dept.name}</span>
                        <span className="text-gray-500">{dept.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${dept.progress}%`, backgroundColor: dept.color || '#b23a48' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4"><p className="text-xs text-gray-400">No departments yet</p></div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              <Link to="/dashboard/notifications" className="text-xs text-[#b23a48] hover:text-[#8f2e3a] font-medium">View All</Link>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {recentActivity && recentActivity.length > 0 ? (
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-3 w-px bg-gray-200 dark:bg-gray-700"></div>
                  <div className="space-y-4 relative">
                    {recentActivity.map((item: any) => (
                      <div key={item.id} className="flex items-start">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 shrink-0 ${ACTION_COLORS[item.action_type] || 'bg-gray-50 text-gray-600'}`}>
                          {item.user_avatar ? (
                            <img src={item.user_avatar} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <span className="text-xs font-bold">{item.user_name?.split(' ').map((n: string) => n[0]).join('') || '?'}</span>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-xs text-gray-900 dark:text-white"><span className="font-medium">{item.user_name}</span> {item.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{timeAgo(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8"><p className="text-xs text-gray-400">No recent activity</p></div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
              <CalendarClock className="w-4 h-4 text-gray-400" />
            </div>
            {deadlines && deadlines.length > 0 ? (
              <div className="h-[200px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                <div className="space-y-2.5">
                {deadlines.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.priority === 'high' ? 'bg-red-50 dark:bg-red-900/30' : item.priority === 'medium' ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/30'
                    }`}>
                      <Clock className={`w-3.5 h-3.5 ${item.priority === 'high' ? 'text-red-500' : item.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.assignee_name || (item.assignees || []).map((a: any) => a.name).join(', ') || 'Unassigned'}</p>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {item.due_date ? fmtDate(item.due_date) : '—'}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4"><p className="text-xs text-gray-400">No upcoming deadlines</p></div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/dashboard/tasks" className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#b23a48] hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[#b23a48]/10 flex items-center justify-center shrink-0"><Plus className="w-3.5 h-3.5 text-[#b23a48]" /></div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">New Task</span>
              </Link>
              <Link to="/dashboard/reports" className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-400 hover:bg-teal-50/50 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0"><FileText className="w-3.5 h-3.5 text-teal-600" /></div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">Reports</span>
              </Link>
              <Link to="/dashboard/team" className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-400 hover:bg-amber-50/50 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0"><UserPlus className="w-3.5 h-3.5 text-amber-600" /></div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">Add Member</span>
              </Link>
              <Link to="/dashboard/calendar" className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-400 hover:bg-green-50/50 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0"><CalendarClock className="w-3.5 h-3.5 text-green-600" /></div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">Calendar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom spacer */}
      <div className="pb-6" />
      </>
      )}
    </div>
  )
}
