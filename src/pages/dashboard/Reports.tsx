import { useState, useEffect, useRef } from 'react'
import { ListChecks, Clock, CheckCircle2, PauseCircle, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, Loader2, TrendingUp, TrendingDown, FileSpreadsheet, FileText, Calendar as CalendarIcon, Download, FolderTree, Layers, X, Video, Tv } from 'lucide-react'
import { useCompletionTrend, useDepartmentThroughput, useTasksByPriority, useTasksDueSoon, useReportStats } from '../../hooks/api/useReports'
import { useLookupDepartments } from '../../hooks/api/useLookups'
import { useCategories, useAssignedCategories } from '../../hooks/api/useCategories'
import { usePhases, useAssignedPhases } from '../../hooks/api/usePhases'
import { useRole } from '../../hooks/useRole'
import { usePermission } from '../../hooks/usePermission'
import { useAuth } from '../../context/AuthContext'
import axiosInstance from '../../api/axiosInstance'
import ChannelReports from '../../components/reports/ChannelReports'
import ShowReports from '../../components/reports/ShowReports'

type TrendFilter = 'weekly' | 'monthly' | 'quarterly' | 'yearly'
const FILTER_LABELS: Record<TrendFilter, string> = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

export default function Reports() {
  const { user } = useAuth()
  const { isAdmin, isManager, isEmployee, isAdminOrManager } = useRole()
  const [reportMode, setReportMode] = useState<'tasks' | 'channels' | 'shows'>('tasks')
  const [trendFilter, setTrendFilter] = useState<TrendFilter>('monthly')
  const [trendOffset, setTrendOffset] = useState(0)
  const [dtFilter, setDtFilter] = useState<TrendFilter>('monthly')
  const [dtOffset, setDtOffset] = useState(0)
  
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

  // Permission checks - these control visibility directly
  const canDownloadReports = usePermission('report:download')
  const canViewReports = usePermission('report:view')
  
  // Show download section if user has download permission
  const showDownloadSection = isAdmin() || canDownloadReports
  
  // Show department throughput if user has view permission
  const showDepartmentThroughput = isAdmin() || canViewReports

  // Daily Report state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [downloadingFormat, setDownloadingFormat] = useState<'excel' | 'pdf' | null>(null)
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const deptDropdownRef = useRef<HTMLDivElement>(null)

  const { data: stats, isLoading: statsLoading } = useReportStats(filters)
  const { data: trendData } = useCompletionTrend(trendFilter, 'all', trendOffset, filters)
  const { data: throughputData } = useDepartmentThroughput(dtFilter, dtOffset, showDepartmentThroughput, filters)
  const { data: priorityData } = useTasksByPriority(filters)
  const { data: dueSoonData } = useTasksDueSoon(filters)
  const { data: departments } = useLookupDepartments()
  
  const handleClearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedPhase(undefined)
  }
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId || undefined)
    setSelectedPhase(undefined) // Reset phase when category changes
  }

  const trendPoints = Array.isArray(trendData) ? trendData : []
  const throughputDepts = Array.isArray(throughputData) ? throughputData : []
  const deptList = Array.isArray(departments) ? departments : []

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setDeptDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const downloadReport = async (format: 'excel' | 'pdf') => {
    setDownloadingFormat(format)
    try {
      const params: any = { date: selectedDate, format }
      if (selectedDept) params.department = selectedDept
      if (selectedCategory) params.category_id = selectedCategory
      if (selectedPhase) params.phase_id = selectedPhase

      const response = await axiosInstance.get('/api/v1/reports/daily', {
        params,
        responseType: 'blob',
      })

      const url = URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `WorkHub-Daily-Report-${selectedDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to generate report. Please try again.'
      alert(msg)
    } finally {
      setDownloadingFormat(null)
    }
  }

  const selectedDeptName = selectedDept ? deptList.find((d: any) => String(d.id) === selectedDept)?.name || 'Unknown' : 'All Departments'

  if (statsLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-auto px-4 pt-2 pb-4 space-y-2.5">
        {/* Report Mode Toggle */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 w-fit shadow-sm">
          <button onClick={() => setReportMode('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${reportMode === 'tasks' ? 'bg-[#b23a48] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <FolderTree className="w-3 h-3" />Regular Tasks
          </button>
          <button onClick={() => setReportMode('channels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${reportMode === 'channels' ? 'bg-[#b23a48] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <Video className="w-3 h-3" />Channel Tasks
          </button>
          {isAdminOrManager() && (
            <button onClick={() => setReportMode('shows')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${reportMode === 'shows' ? 'bg-[#b23a48] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <Tv className="w-3 h-3" />Shows
            </button>
          )}
        </div>

        {/* Channel Reports */}
        {reportMode === 'channels' && <ChannelReports />}

        {/* Show Reports */}
        {reportMode === 'shows' && <ShowReports />}

        {/* Regular Task Reports */}
        {reportMode === 'tasks' && (
        <>
        {/* Category/Phase Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
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
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}

            {/* Active Filter Indicator */}
            {(selectedCategory || selectedPhase) && (
              <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="font-medium">Filtered:</span>
                {selectedCategory && (
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-medium">
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

        {/* Daily Report Section */}
        {showDownloadSection && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-[#b23a48]" />
                <span className="text-[11px] font-semibold text-gray-900 dark:text-white">Daily Report</span>
              </div>

              {/* Date */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-2.5 pr-7 py-1.5 text-[11px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
                />
                <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Department */}
              <div className="relative" ref={deptDropdownRef}>
                <button
                  onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                  className="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-[11px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none min-w-[140px] justify-between"
                >
                  <span>{selectedDeptName}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${deptDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {deptDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    <button onClick={() => { setSelectedDept(''); setDeptDropdownOpen(false) }}
                      className={`w-full px-3 py-1.5 text-[11px] text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${!selectedDept ? 'bg-[#b23a48]/10 text-[#b23a48] font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                      All Departments
                    </button>
                    {deptList.map((dept: any) => (
                      <button key={dept.id} onClick={() => { setSelectedDept(String(dept.id)); setDeptDropdownOpen(false) }}
                        className={`w-full px-3 py-1.5 text-[11px] text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedDept === String(dept.id) ? 'bg-[#b23a48]/10 text-[#b23a48] font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {dept.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => downloadReport('excel')} disabled={downloadingFormat !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50">
                  {downloadingFormat === 'excel' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
                  Excel
                </button>
                <button onClick={() => downloadReport('pdf')} disabled={downloadingFormat !== null}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50">
                  {downloadingFormat === 'pdf' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'To Do', value: stats?.todo ?? 0, icon: ListChecks, bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600' },
            { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600' },
            { label: 'Completed', value: stats?.completed ?? 0, icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-500/10', text: 'text-green-600' },
            { label: 'Hold', value: stats?.hold ?? 0, icon: PauseCircle, bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600' },
            { label: 'Overdue', value: stats?.overdue ?? 0, icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center ${s.text} shrink-0`}>
                <s.icon className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>

        {/* Completion Trend Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">Task Completion Trend</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button onClick={() => setTrendOffset(p => p - 1)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft className="w-3 h-3 text-gray-500" /></button>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">{trendOffset === 0 ? 'Current' : `${Math.abs(trendOffset)} ago`}</span>
                <button onClick={() => setTrendOffset(p => Math.min(0, p + 1))} disabled={trendOffset >= 0} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30"><ChevronRight className="w-3 h-3 text-gray-500" /></button>
              </div>
              <select value={trendFilter} onChange={e => { setTrendFilter(e.target.value as TrendFilter); setTrendOffset(0) }}
                className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 focus:outline-none">
                {Object.entries(FILTER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {trendPoints.length > 0 ? (
            <div className="relative h-[250px]">
              <svg viewBox="0 0 700 250" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const maxVal = Math.max(...trendPoints.map((d: any) => Math.max(d.created || 0, d.completed || 0)), 1)
                  const max = Math.ceil(maxVal / 5) * 5 + 5
                  const padL = 40, padR = 20, padT = 10, padB = 30
                  const w = 700 - padL - padR, h = 250 - padT - padB
                  const n = Math.max(trendPoints.length - 1, 1)
                  const pts = trendPoints.map((d: any, i: number) => ({
                    x: padL + (w / n) * i,
                    cy: padT + h - ((d.created || 0) / max) * h,
                    coy: padT + h - ((d.completed || 0) / max) * h,
                    label: d.label?.split('T')[0]?.slice(-5) || d.label,
                  }))
                  return (
                    <>
                      {[0, 1, 2, 3, 4].map(i => { const y = padT + (h / 4) * i; return <line key={i} x1={padL} y1={y} x2={700-padR} y2={y} stroke="#e5e7eb" strokeWidth="1" /> })}
                      <polyline fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts.map((p: any) => `${p.x},${p.cy}`).join(' ')} />
                      <polyline fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts.map((p: any) => `${p.x},${p.coy}`).join(' ')} />
                      {pts.map((p: any, i: number) => <g key={`pt${i}`}><circle cx={p.x} cy={p.cy} r="3" fill="#0d9488" /><circle cx={p.x} cy={p.coy} r="3" fill="#22C55E" /></g>)}
                      {pts.map((p: any, i: number) => <text key={`l${i}`} x={p.x} y={250 - 5} textAnchor="middle" className="fill-gray-400" style={{ fontSize: '9px' }}>{p.label}</text>)}
                    </>
                  )
                })()}
              </svg>
            </div>
          ) : <div className="h-[250px] flex items-center justify-center"><p className="text-[11px] text-gray-400">No data for this period</p></div>}
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-teal-500"></div><span className="text-[11px] text-gray-500">Created</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[11px] text-gray-500">Completed</span></div>
          </div>
        </div>

        {/* Department Throughput — show if user has view permission */}
        {showDepartmentThroughput && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">Department Throughput</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setDtOffset(p => p - 1)} className="p-0.5 rounded hover:bg-gray-100"><ChevronLeft className="w-3 h-3 text-gray-500" /></button>
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 min-w-[60px] text-center">{dtOffset === 0 ? 'Current' : `${Math.abs(dtOffset)} ago`}</span>
                <button onClick={() => setDtOffset(p => Math.min(0, p + 1))} disabled={dtOffset >= 0} className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-3 h-3 text-gray-500" /></button>
                <select value={dtFilter} onChange={e => { setDtFilter(e.target.value as TrendFilter); setDtOffset(0) }}
                  className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-1.5 py-0.5 focus:outline-none">
                  {Object.entries(FILTER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3 text-[11px]">
              {[{l:'To Do',c:'bg-teal-500'},{l:'In Progress',c:'bg-amber-500'},{l:'Completed',c:'bg-green-500'},{l:'Hold',c:'bg-orange-500'},{l:'Overdue',c:'bg-red-500'}].map(i => (
                <div key={i.l} className="flex items-center gap-1"><div className={`w-2.5 h-2.5 rounded-sm ${i.c}`} /><span className="text-gray-500">{i.l}</span></div>
              ))}
            </div>
            {throughputDepts.length > 0 ? (
              <div className="space-y-4">
                {throughputDepts.map((dept: any) => {
                  const total = dept.total || 1
                  return (
                    <div key={dept.id || dept.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-medium text-gray-900 dark:text-white">{dept.name}</span>
                        <span className="text-[11px] text-gray-500">{dept.total} tasks</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {dept.todo > 0 && <div className="bg-teal-500" style={{ width: `${(dept.todo/total)*100}%` }} title={`To Do: ${dept.todo}`}></div>}
                        {dept.inProgress > 0 && <div className="bg-amber-500" style={{ width: `${(dept.inProgress/total)*100}%` }} title={`In Progress: ${dept.inProgress}`}></div>}
                        {dept.completed > 0 && <div className="bg-green-500" style={{ width: `${(dept.completed/total)*100}%` }} title={`Completed: ${dept.completed}`}></div>}
                        {dept.hold > 0 && <div className="bg-orange-500" style={{ width: `${(dept.hold/total)*100}%` }} title={`Hold: ${dept.hold}`}></div>}
                        {dept.overdue > 0 && <div className="bg-red-500" style={{ width: `${(dept.overdue/total)*100}%` }} title={`Overdue: ${dept.overdue}`}></div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <div className="h-[150px] flex items-center justify-center"><p className="text-[11px] text-gray-400">No department data</p></div>}
          </div>
        )}

        {/* Bottom Row: Priority + Due Soon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks by Priority */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">Tasks by Priority</h3>
            {priorityData ? (
              <div className="space-y-5">
                {[
                  { key: 'high', label: 'High Priority', color: 'bg-red-500', data: priorityData.high },
                  { key: 'medium', label: 'Medium Priority', color: 'bg-yellow-500', data: priorityData.medium },
                  { key: 'low', label: 'Low Priority', color: 'bg-gray-500', data: priorityData.low },
                ].map(p => p.data && (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{p.label}</span>
                      <span className="text-[11px] font-semibold text-gray-900 dark:text-white">{p.data.completed}/{p.data.total} <span className="text-gray-400 font-normal">({p.data.percentage}%)</span></span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.data.percentage}%` }}></div>
                    </div>
                    {p.data.overdue > 0 && <span className="text-[11px] text-red-500 font-medium mt-1 inline-block">{p.data.overdue} overdue</span>}
                  </div>
                ))}
              </div>
            ) : <div className="h-[150px] flex items-center justify-center"><p className="text-[11px] text-gray-400">No data</p></div>}
          </div>

          {/* Tasks Due Soon */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">Tasks Due Soon</h3>
            {dueSoonData ? (
              <div className="space-y-5">
                {[
                  { label: 'Due Today', value: dueSoonData.dueToday, color: 'bg-red-500', dot: 'bg-red-500' },
                  { label: 'Due Tomorrow', value: dueSoonData.dueTomorrow, color: 'bg-yellow-500', dot: 'bg-yellow-500' },
                  { label: 'Due This Week', value: dueSoonData.dueThisWeek, color: 'bg-green-500', dot: 'bg-green-500' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${d.dot}`} /><span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">{d.label}</span></div>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">{d.value} tasks</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${Math.min((d.value / Math.max(dueSoonData.dueThisWeek, 1)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="h-[150px] flex items-center justify-center"><p className="text-[11px] text-gray-400">No data</p></div>}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
