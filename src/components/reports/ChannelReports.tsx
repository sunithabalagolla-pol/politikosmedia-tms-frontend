import { useState } from 'react'
import { Video, Layers, X, Loader2, ChevronLeft, ChevronRight, Download, Calendar } from 'lucide-react'
import { useChannels, useSubcategories } from '../../hooks/api'
import {
  useChannelReportStats, useChannelByChannel, useChannelBySubcategory,
  useChannelByEmployee, useChannelCompletionTrend
} from '../../hooks/api/useReports'
import { useRole } from '../../hooks/useRole'
import { resolveFileUrl } from '../../lib/fileUrl'
import axiosInstance from '../../api/axiosInstance'

export default function ChannelReports() {
  const [selectedChannel, setSelectedChannel] = useState<string>()
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>()
  const [trendFilter, setTrendFilter] = useState('monthly')
  const [trendOffset, setTrendOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [downloading, setDownloading] = useState<string | null>(null)

  const { isAdmin, isAdminOrManager } = useRole()
  const { data: channels = [] } = useChannels()
  const { data: subcategories = [] } = useSubcategories(selectedChannel || '')

  const { data: stats, isLoading: statsLoading } = useChannelReportStats(selectedChannel, selectedSubcategory)
  const { data: byChannel = [] } = useChannelByChannel()
  const { data: bySubcategory = [] } = useChannelBySubcategory(selectedChannel)
  const { data: byEmployee = [] } = useChannelByEmployee(
    isAdminOrManager() ? selectedChannel : undefined,
    isAdminOrManager() ? selectedSubcategory : undefined
  )
  const { data: trendData = [] } = useChannelCompletionTrend(trendFilter, trendOffset, selectedChannel, selectedSubcategory)

  const handleChannelChange = (id: string) => {
    setSelectedChannel(id || undefined)
    setSelectedSubcategory(undefined)
  }

  const handleClearFilters = () => {
    setSelectedChannel(undefined)
    setSelectedSubcategory(undefined)
  }

  const handleDownload = async (format: 'excel' | 'pdf') => {
    setDownloading(format)
    try {
      const params = new URLSearchParams({ date: selectedDate, format })
      if (selectedChannel) params.append('channel_id', selectedChannel)
      if (selectedSubcategory) params.append('subcategory_id', selectedSubcategory)
      const response = await axiosInstance.get(`/api/v1/reports/channel-daily?${params}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `channel-report-${selectedDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`Failed to download ${format}:`, error)
      alert(`Failed to download ${format} report`)
    } finally {
      setDownloading(null)
    }
  }

  if (statsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-gray-400" />
            <select value={selectedChannel || ''} onChange={(e) => handleChannelChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]">
              <option value="">All Channels</option>
              {channels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
            </select>
          </div>
          {selectedChannel && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <select value={selectedSubcategory || ''} onChange={(e) => setSelectedSubcategory(e.target.value || undefined)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]">
                <option value="">All Subcategories</option>
                {subcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          {(selectedChannel || selectedSubcategory) && (
            <button onClick={handleClearFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>
      </div>

      {/* Download Section - Admin/Manager only */}
      {isAdminOrManager() && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Channel Report</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20" />
            </div>
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
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Not Started', value: stats?.not_started ?? 0, color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500' },
          { label: 'In Progress', value: stats?.in_progress ?? 0, color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' },
          { label: 'Completed', value: stats?.completed ?? 0, color: 'bg-green-100 text-green-600', dot: 'bg-green-500' },
          { label: 'Total Progress', value: `${stats?.total_completed ?? 0}/${stats?.total_target ?? 0}`, color: 'bg-teal-100 text-teal-600', dot: 'bg-teal-500' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${card.dot}`} />
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
            <p className="text-[11px] font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Completion Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white">Completion Trend</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setTrendOffset((o) => o + 1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><ChevronLeft className="w-3.5 h-3.5 text-gray-500" /></button>
            <button onClick={() => setTrendOffset((o) => Math.max(0, o - 1))} disabled={trendOffset === 0} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"><ChevronRight className="w-3.5 h-3.5 text-gray-500" /></button>
            <select value={trendFilter} onChange={(e) => { setTrendFilter(e.target.value); setTrendOffset(0) }}
              className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        {trendData.length > 0 ? (
          <div className="relative h-32">
            <svg viewBox="0 0 280 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {(() => {
                const maxVal = Math.max(...trendData.map((d: any) => d.total_progress), 1)
                const pts = trendData.map((d: any, i: number) => ({
                  x: (280 / Math.max(trendData.length - 1, 1)) * i,
                  y: 80 - (d.total_progress / maxVal) * 65,
                  label: d.label?.split('-').slice(1).join('/') || d.label,
                  value: d.total_progress,
                  updates: d.updates,
                }))
                const line = pts.map((p: any) => `${p.x},${p.y}`).join(' ')
                return (
                  <>
                    <line x1="0" y1="80" x2="280" y2="80" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="0" y1="50" x2="280" y2="50" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="0" y1="20" x2="280" y2="20" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2" />
                    <polyline fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={line} />
                    {pts.map((p: any, i: number) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3.5" fill="#0d9488" stroke="white" strokeWidth="1.5">
                          <title>{p.label}: {p.value} progress ({p.updates} updates)</title>
                        </circle>
                        <text x={p.x} y="95" textAnchor="middle" className="fill-gray-500" style={{ fontSize: '8px' }}>{p.label}</text>
                      </g>
                    ))}
                  </>
                )
              })()}
            </svg>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center"><p className="text-[11px] text-gray-400">No trend data yet</p></div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Progress by Channel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-4">Progress by Channel</h2>
          {byChannel.length > 0 ? (
            <div className="space-y-3">
              {byChannel.map((ch: any) => {
                const isSelected = channels.find((c) => c.name === ch.channel_name)?.id === selectedChannel
                return (
                  <div key={ch.channel_id}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-medium ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>{ch.channel_name}</span>
                      <span className={`font-bold ${isSelected ? 'text-[#b23a48]' : 'text-gray-900 dark:text-white'}`}>{ch.total_completed}/{ch.total_target} ({ch.progress}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-[#b23a48]' : 'bg-teal-500 dark:bg-teal-600'}`}
                        style={{ width: `${ch.progress}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{ch.task_count} task{ch.task_count !== 1 ? 's' : ''}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center"><p className="text-[11px] text-gray-400">No channel data</p></div>
          )}
        </div>

        {/* Progress by Subcategory */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-4">
            {selectedChannel ? `Progress by Subcategory (${channels.find((c) => c.id === selectedChannel)?.name || ''})` : 'Progress by Subcategory'}
          </h2>
          {selectedChannel ? (
            bySubcategory.length > 0 ? (
              <div className="space-y-3">
                {bySubcategory.map((sub: any) => {
                  const isSelected = subcategories.find((s) => s.name === sub.subcategory_name)?.id === selectedSubcategory
                  return (
                    <div key={sub.subcategory_id}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-medium ${isSelected ? 'text-[#b23a48]' : 'text-gray-700 dark:text-gray-300'}`}>{sub.subcategory_name}</span>
                        <span className={`font-bold ${isSelected ? 'text-[#b23a48]' : 'text-gray-900 dark:text-white'}`}>{sub.total_completed}/{sub.total_target} ({sub.progress}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-[#b23a48]' : 'bg-green-400 dark:bg-green-500'}`}
                          style={{ width: `${sub.progress}%` }} />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{sub.task_count} task{sub.task_count !== 1 ? 's' : ''}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center"><p className="text-[11px] text-gray-400">No subcategories in this channel</p></div>
            )
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <Layers className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Select a channel to see subcategory breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress by Employee - Admin/Manager only */}
      {isAdminOrManager() && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
          <h2 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-4">Progress by Employee</h2>
          {byEmployee.length > 0 ? (
            <div className="space-y-4">
              {byEmployee.map((emp: any) => {
                const pct = emp.total_target > 0 ? Math.round((emp.total_completed / emp.total_target) * 100) : 0
                return (
                  <div key={emp.employee_id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {emp.avatar_url ? (
                        <img src={resolveFileUrl(emp.avatar_url)} alt={emp.employee_name} className="w-9 h-9 rounded-full" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#b23a48] flex items-center justify-center">
                          <span className="text-[11px] font-bold text-white">{emp.employee_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{emp.employee_name}</p>
                        <p className="text-[11px] text-gray-500">{emp.task_count} task{emp.task_count !== 1 ? 's' : ''} assigned</p>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">{emp.total_completed}/{emp.total_target} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-[#b23a48]' : 'bg-gray-300'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-gray-500">Not Started: <span className="font-medium text-gray-700 dark:text-gray-300">{emp.not_started}</span></span>
                      <span className="text-gray-500">In Progress: <span className="font-medium text-amber-600">{emp.in_progress}</span></span>
                      <span className="text-gray-500">Done: <span className="font-medium text-green-600">{emp.completed_tasks}</span></span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center"><p className="text-[11px] text-gray-400">No employee data</p></div>
          )}
        </div>
      )}
    </div>
  )
}
