import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, Loader2, FolderTree, Layers } from 'lucide-react'
import { useCalendar } from '../../hooks/api/useCalendar'
import { useCategories, useAssignedCategories } from '../../hooks/api/useCategories'
import { usePhases, useAssignedPhases } from '../../hooks/api/usePhases'
import { useAuth } from '../../context/AuthContext'
import TaskDetailPanel from '../../components/TaskDetailPanel'

export default function Calendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  
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

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const { data: calendarData, isLoading } = useCalendar(month, year, selectedCategory, selectedPhase)
  
  const handleClearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedPhase(undefined)
  }
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId || undefined)
    setSelectedPhase(undefined) // Reset phase when category changes
  }

  const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
  const goToPrevMonth = () => { setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1)); setSelectedDate(null); setSelectedWeek(0) }
  const goToNextMonth = () => { setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1)); setSelectedDate(null); setSelectedWeek(0) }
  const goToToday = () => { setCurrentDate(new Date()); setSelectedDate(null); setSelectedWeek(0) }

  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && year === today.getFullYear()
  const firstDay = new Date(year, currentDate.getMonth(), 1)
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate()
  const startDow = firstDay.getDay()
  const prevMonthLastDay = new Date(year, currentDate.getMonth(), 0).getDate()

  // Build calendar grid
  const calendarDays: Array<{ date: number; isCurrentMonth: boolean; isToday: boolean; dateKey: string }> = []
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const m = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth()
    const y = currentDate.getMonth() === 0 ? year - 1 : year
    calendarDays.push({ date: d, isCurrentMonth: false, isToday: false, dateKey: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}` })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateKey = `${year}-${String(month).padStart(2,'0')}-${String(i).padStart(2,'0')}`
    calendarDays.push({ date: i, isCurrentMonth: true, isToday: isCurrentMonth && i === today.getDate(), dateKey })
  }
  const remaining = 42 - calendarDays.length
  for (let i = 1; i <= remaining; i++) {
    const m = currentDate.getMonth() + 2 > 12 ? 1 : currentDate.getMonth() + 2
    const y = currentDate.getMonth() + 2 > 12 ? year + 1 : year
    calendarDays.push({ date: i, isCurrentMonth: false, isToday: false, dateKey: `${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}` })
  }

  const getDataForDate = (dateKey: string) => {
    const dayData = calendarData?.[dateKey]
    return { tasks: dayData?.tasks || [] }
  }

  const weeks: typeof calendarDays[] = []
  for (let i = 0; i < calendarDays.length; i += 7) weeks.push(calendarDays.slice(i, i + 7))
  const currentWeekDays = weeks[selectedWeek] || weeks[0]
  const selectedDayKey = selectedDate ? `${year}-${String(month).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}` : null
  const selectedDayData = selectedDayKey ? getDataForDate(selectedDayKey) : { tasks: [] }

  const formatStatus = (s: string) => { if (s === 'in-progress') return 'In Progress'; if (s === 'todo') return 'To Do'; return s.charAt(0).toUpperCase() + s.slice(1) }

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="flex flex-col gap-3 h-full">
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

      <div className="flex gap-3 flex-1 overflow-hidden">
        {/* Task Detail Panel */}
        <TaskDetailPanel isOpen={selectedTaskId !== null} onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId} />

      <div className={`transition-all duration-300 ${selectedDate ? 'flex-1' : 'w-full'}`}>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft className="w-3.5 h-3.5 text-gray-600" /></button>
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white min-w-[140px] text-center">
                {activeView === 'month' && `${currentMonth} ${year}`}
                {activeView === 'week' && `${currentMonth} ${year} - Week ${selectedWeek + 1}`}
                {activeView === 'day' && `${currentMonth} ${selectedDate || 1}, ${year}`}
              </h2>
              <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronRight className="w-3.5 h-3.5 text-gray-600" /></button>
              <button onClick={goToToday} className="px-1.5 py-0.5 text-xs text-[#b23a48] border border-[#b23a48] rounded-lg hover:bg-[#b23a48]/5">Today</button>
            </div>
            <div className="flex items-center gap-1">
              {(['month','week','day'] as const).map(v => (
                <button key={v} onClick={() => { setActiveView(v); if (v === 'day' && !selectedDate) setSelectedDate(isCurrentMonth ? today.getDate() : 1) }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${activeView === v ? 'bg-[#b23a48] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-2 pb-1.5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-[11px] text-gray-500">Task Deadline</span></div>
          </div>

          {/* Month View */}
          {activeView === 'month' && (
            <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-5xl">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="bg-gray-50 dark:bg-gray-900 py-1 text-center text-[11px] font-semibold text-gray-700 dark:text-gray-300 border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const { tasks } = getDataForDate(day.dateKey)
                const hasItems = tasks.length > 0
                return (
                  <div key={i} onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                    className={`bg-white dark:bg-gray-800 p-1.5 min-h-[75px] transition-all cursor-pointer relative flex flex-col border-b border-r border-gray-200 dark:border-gray-700 ${(i+1)%7===0?'border-r-0':''} ${i>=35?'border-b-0':''} ${day.isToday?'bg-blue-50 dark:bg-blue-900/20':''} ${!day.isCurrentMonth?'bg-gray-50 dark:bg-gray-900 opacity-40':''} ${selectedDate===day.date&&day.isCurrentMonth?'ring-2 ring-[#b23a48] ring-inset':''} ${day.isCurrentMonth&&hasItems?'hover:bg-gray-50 dark:hover:bg-gray-700':''}`}>
                    <div className={`text-center text-[11px] font-medium mb-1 ${day.isToday?'bg-[#b23a48] text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto':!day.isCurrentMonth?'text-gray-400':'text-gray-700 dark:text-gray-300'}`}>{day.date}</div>
                    {day.isCurrentMonth && (
                      <div className="space-y-0.5 flex-1 overflow-hidden">
                        {tasks.slice(0,2).map((t: any) => (
                          <div key={t.id} onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.id) }}
                            className={`rounded px-1 py-0.5 text-[11px] truncate flex items-center gap-0.5 cursor-pointer hover:opacity-80 ${t.is_overdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            <span className="truncate">{t.title}</span>
                          </div>
                        ))}
                        {tasks.length > 2 && <div className="text-[11px] text-gray-500 text-center">+{tasks.length - 2} more</div>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Week View */}
          {activeView === 'week' && (
            <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-5xl">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="bg-gray-50 dark:bg-gray-900 py-1 text-center text-[11px] font-semibold text-gray-700 border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0">{d}</div>
              ))}
              {currentWeekDays.map((day, i) => {
                const { tasks } = getDataForDate(day.dateKey)
                return (
                  <div key={i} onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                    className={`bg-white dark:bg-gray-800 p-2 min-h-[100px] cursor-pointer flex flex-col border-b border-r border-gray-200 dark:border-gray-700 ${(i+1)%7===0?'border-r-0':''} ${day.isToday?'bg-blue-50':''} ${!day.isCurrentMonth?'opacity-40':''} ${selectedDate===day.date&&day.isCurrentMonth?'ring-2 ring-[#b23a48] ring-inset':''}`}>
                    <div className={`text-center text-[11px] font-semibold mb-1.5 ${day.isToday?'bg-[#b23a48] text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto':'text-gray-700'}`}>{day.date}</div>
                    {tasks.map((t: any) => (
                      <div key={t.id} onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.id) }}
                        className={`rounded px-1.5 py-1 text-xs mb-1 cursor-pointer hover:opacity-80 ${t.is_overdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        <div className="truncate font-medium">{t.title}</div>
                        <div className="text-[11px] opacity-70">{t.priority}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Day View */}
          {activeView === 'day' && selectedDate && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h3 className="text-[11px] font-bold text-gray-900 dark:text-white mb-1">{isCurrentMonth && selectedDate === today.getDate() ? 'Today' : `${currentMonth} ${selectedDate}, ${year}`}</h3>
              <p className="text-[11px] text-gray-500 mb-3">{selectedDayData.tasks.length} tasks</p>
              {selectedDayData.tasks.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Task Deadlines</h4>
                  <div className="space-y-2">
                    {selectedDayData.tasks.map((t: any) => (
                      <div key={t.id} onClick={() => setSelectedTaskId(t.id)}
                        className={`border rounded-lg p-2.5 cursor-pointer hover:shadow-md transition-shadow ${t.is_overdue ? 'border-red-300 bg-red-50/50' : 'border-blue-200 bg-blue-50/50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[11px] font-semibold text-gray-900">{t.title}</h4>
                          {t.is_overdue && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Overdue</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${t.status === 'completed' ? 'bg-green-100 text-green-700' : t.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{formatStatus(t.status)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${t.priority === 'high' ? 'bg-red-100 text-red-700' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{t.priority}</span>
                          {t.department_name && <span>{t.department_name}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedDayData.tasks.length === 0 && (
                <div className="text-center py-8"><p className="text-[11px] text-gray-400">Nothing scheduled</p></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Side panel for selected date (month view) */}
      {selectedDate && activeView === 'month' && (
        <div className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-white">{currentMonth} {selectedDate}</h3>
            <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          {selectedDayData.tasks.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase mb-1.5">Tasks ({selectedDayData.tasks.length})</p>
              {selectedDayData.tasks.map((t: any) => (
                <div key={t.id} onClick={() => setSelectedTaskId(t.id)}
                  className={`p-2 rounded-lg mb-1.5 cursor-pointer hover:opacity-80 ${t.is_overdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                  <p className={`text-xs font-medium ${t.is_overdue ? 'text-red-700' : 'text-blue-700'}`}>{t.title}</p>
                  <p className="text-[11px] text-gray-500">{formatStatus(t.status)} · {t.priority}</p>
                </div>
              ))}
            </div>
          )}
          {selectedDayData.tasks.length === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-4">Nothing scheduled</p>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
