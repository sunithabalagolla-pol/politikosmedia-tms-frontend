import { useState } from 'react'
import { Tv, Radio, CheckCircle2, Download, Loader2 } from 'lucide-react'
import { useShowReportStats, useShowByShow } from '../../hooks/api/useReports'
import axiosInstance from '../../api/axiosInstance'

const STATUS_COLORS: Record<string, string> = {
  production: 'bg-blue-500',
  approved: 'bg-orange-500',
  ready_for_broadcast: 'bg-yellow-500',
  broadcasted: 'bg-green-500',
}

export default function ShowReports() {
  const [downloading, setDownloading] = useState<string | null>(null)
  const { data: stats, isLoading: statsLoading } = useShowReportStats()
  const { data: byShow = [] } = useShowByShow()

  const handleDownload = async (format: 'excel' | 'pdf') => {
    setDownloading(format)
    try {
      const response = await axiosInstance.get(`/api/v1/reports/show-daily?format=${format}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `show-report-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to download ${format}:`, error)
      alert(`Failed to download ${format} report`)
    } finally {
      setDownloading(null)
    }
  }

  if (statsLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  const statusItems = [
    { label: 'Production', value: stats?.production ?? 0, color: STATUS_COLORS.production },
    { label: 'Approved', value: stats?.approved ?? 0, color: STATUS_COLORS.approved },
    { label: 'Ready for Broadcast', value: stats?.ready_for_broadcast ?? 0, color: STATUS_COLORS.ready_for_broadcast },
    { label: 'Broadcasted', value: stats?.broadcasted ?? 0, color: STATUS_COLORS.broadcasted },
  ]
  const maxStatus = Math.max(...statusItems.map((s) => s.value), 1)
  const maxShowEps = Math.max(...byShow.map((s: any) => s.total_episodes), 1)
  const totalAssets = stats?.total_assets ?? 0
  const checkedAssets = stats?.checked_assets ?? 0
  const assetPct = totalAssets > 0 ? Math.round((checkedAssets / totalAssets) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Download */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Show Report</span>
          <button onClick={() => handleDownload('excel')} disabled={downloading === 'excel'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
            <Download className="w-3 h-3" />{downloading === 'excel' ? 'Downloading...' : 'Download Excel'}
          </button>
          <button onClick={() => handleDownload('pdf')} disabled={downloading === 'pdf'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
            <Download className="w-3 h-3" />{downloading === 'pdf' ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Shows', value: stats?.total_shows ?? 0, icon: Tv, dot: 'bg-[#b23a48]' },
          { label: 'Total Episodes', value: stats?.total_episodes ?? 0, icon: Radio, dot: 'bg-teal-500' },
          { label: 'In Production', value: stats?.production ?? 0, icon: Tv, dot: 'bg-orange-500' },
          { label: 'Broadcasted', value: stats?.broadcasted ?? 0, icon: CheckCircle2, dot: 'bg-green-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${card.dot}`} />
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                </div>
                <p className="text-[11px] font-bold text-gray-900 dark:text-white">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Episodes by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-4">Episodes by Status</h2>
          <div className="space-y-3">
            {statusItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-36 text-[11px] font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${(item.value / maxStatus) * 100}%` }} />
                </div>
                <span className="text-[11px] font-bold w-6 text-right text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Episodes by Show */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-4">Episodes by Show</h2>
          {byShow.length > 0 ? (
            <div className="space-y-3">
              {byShow.map((show: any) => (
                <div key={show.show_id}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{show.show_name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{show.total_episodes} episodes</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-teal-500 dark:bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${(show.total_episodes / maxShowEps) * 100}%` }} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span>Production: {show.production}</span>
                    <span>•</span>
                    <span>Broadcasted: {show.broadcasted}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center"><p className="text-[11px] text-gray-400">No show data</p></div>
          )}
        </div>
      </div>

      {/* Asset Completion */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-3">Asset Completion</h2>
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-gray-500 dark:text-gray-400">Assets checked across all episodes</span>
          <span className="font-bold text-gray-900 dark:text-white">{checkedAssets}/{totalAssets} ({assetPct}%)</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${assetPct >= 100 ? 'bg-green-500' : assetPct > 0 ? 'bg-[#b23a48]' : 'bg-gray-300'}`}
            style={{ width: `${assetPct}%` }} />
        </div>
      </div>
    </div>
  )
}
