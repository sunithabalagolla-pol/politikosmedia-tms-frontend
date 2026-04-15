import { Tv, Loader2, Radio, CheckCircle2, BarChart3 } from 'lucide-react'
import { useShowStats } from '../../hooks/api/useDashboard'

export default function ShowsOverview() {
  const { data: stats, isLoading } = useShowStats()

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const statusItems = [
    { label: 'Production', value: stats?.production ?? 0, color: 'bg-amber-500' },
    { label: 'Approved', value: stats?.approved ?? 0, color: 'bg-teal-500' },
    { label: 'Ready for Broadcast', value: stats?.readyForBroadcast ?? 0, color: 'bg-yellow-500' },
    { label: 'Broadcasted', value: stats?.broadcasted ?? 0, color: 'bg-green-500' },
  ]
  const maxStatus = Math.max(...statusItems.map((s) => s.value), 1)

  return (
    <div className="space-y-3">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Shows</p>
            <div className="w-6 h-6 rounded-lg bg-[#b23a48]/10 flex items-center justify-center"><Tv className="w-3.5 h-3.5 text-[#b23a48]" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalShows ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Total Episodes</p>
            <div className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center"><Radio className="w-3.5 h-3.5 text-teal-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalEpisodes ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">In Production</p>
            <div className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center"><Tv className="w-3.5 h-3.5 text-orange-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.production ?? 0}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Broadcasted</p>
            <div className="w-6 h-6 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /></div>
          </div>
          <div className="mt-2"><p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.broadcasted ?? 0}</p></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Episodes by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Episodes by Status</h2>
          <div className="space-y-3">
            {statusItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-36 text-xs font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${(item.value / maxStatus) * 100}%` }} />
                </div>
                <span className="text-xs font-bold w-6 text-right text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white mb-4">Impact Tasks Summary</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalImpactTasks ?? 0}</p>
                <p className="text-xs text-gray-500 font-medium">Total</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-700 dark:text-green-400">{stats?.completedImpact ?? 0}</p>
                <p className="text-xs text-green-600 font-medium">Completed</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-orange-700 dark:text-orange-400">{stats?.pendingImpact ?? 0}</p>
                <p className="text-xs text-orange-600 font-medium">Pending</p>
              </div>
            </div>
            {(stats?.totalImpactTasks ?? 0) > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Completion</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {Math.round(((stats?.completedImpact ?? 0) / (stats?.totalImpactTasks ?? 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${((stats?.completedImpact ?? 0) / (stats?.totalImpactTasks ?? 1)) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
