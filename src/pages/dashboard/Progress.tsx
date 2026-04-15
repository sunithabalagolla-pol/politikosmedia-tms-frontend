import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Save, TrendingUp, User, ChevronDown } from 'lucide-react'
import { useSkillDefinitions, useProgressList, useEmployeeProgress, useProgressHistory, useSaveProgress } from '../../hooks/api/useProgress'

// ── Period helpers ─────────────────────────────────────────────────────────

function generatePeriodOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({ label: `${months[d.getMonth()]} ${d.getFullYear()}`, value: `${months[d.getMonth()]} ${d.getFullYear()}` })
  }
  const currentQ = Math.floor(now.getMonth() / 3) + 1
  for (let i = 0; i < 4; i++) {
    let q = currentQ - i; let y = now.getFullYear()
    while (q <= 0) { q += 4; y-- }
    options.push({ label: `Q${q} ${y}`, value: `Q${q} ${y}` })
  }
  for (let i = 0; i < 3; i++) options.push({ label: String(now.getFullYear() - i), value: String(now.getFullYear() - i) })
  return options
}

const PERIOD_OPTIONS = generatePeriodOptions()

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function Progress() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(searchParams.get('employee') || '')
  const [activeTab, setActiveTab] = useState<'skills' | 'history'>('skills')
  const [period, setPeriod] = useState(PERIOD_OPTIONS[0].value)
  const [isEditing, setIsEditing] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [orgExpects, setOrgExpects] = useState('')
  const [empDelivered, setEmpDelivered] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: employees = [], isLoading: empListLoading } = useProgressList()
  const { data: skillDefs = [], isLoading: defsLoading } = useSkillDefinitions()
  const { data: empData, isLoading: empLoading } = useEmployeeProgress(selectedEmployeeId || null, period)
  const { data: history = [], isLoading: historyLoading } = useProgressHistory(selectedEmployeeId || null)
  const saveProgress = useSaveProgress()

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId)

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployeeId(id)
    setIsEditing(false)
    setScores({})
    setSaveError(null)
    setSaveSuccess(false)
    setActiveTab('skills')
    if (id) setSearchParams({ employee: id }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const handlePeriodChange = (val: string) => {
    setPeriod(val)
    setIsEditing(false)
    setScores({})
    setOrgExpects('')
    setEmpDelivered('')
    setSaveError(null)
  }

  const handleEdit = () => {
    const flat: Record<string, number> = {}
    empData?.categories?.forEach(cat => cat.skills.forEach(s => { flat[s.skill_id] = s.score }))
    setScores(flat)
    setOrgExpects(empData?.organization_expects || '')
    setEmpDelivered(empData?.employee_delivered || '')
    setIsEditing(true)
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setScores({})
    setOrgExpects('')
    setEmpDelivered('')
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaveError(null)
    const skills = Object.entries(scores).map(([skill_id, score]) => ({ skill_id, score }))
    if (skills.length === 0) { setSaveError('Rate at least one skill before saving.'); return }
    try {
      await saveProgress.mutateAsync({
        employeeId: selectedEmployeeId,
        period,
        skills,
        organization_expects: orgExpects || undefined,
        employee_delivered: empDelivered || undefined,
      })
      setIsEditing(false)
      setScores({})
      setOrgExpects('')
      setEmpDelivered('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save. Try again.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-sm font-bold text-gray-900 dark:text-white">Progress Tracking</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Employee-wise skill & performance scores</p>
      </div>

      {/* Employee selector + Period + Actions — all in one bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm flex items-center gap-3 flex-wrap">
        {/* Employee dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">Employee:</label>
          <div className="relative flex-1">
            <select
              value={selectedEmployeeId}
              onChange={e => handleSelectEmployee(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
            >
              <option value="">— Select employee —</option>
              {empListLoading
                ? <option disabled>Loading...</option>
                : employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}{emp.department_name ? ` (${emp.department_name})` : ''}</option>
                ))
              }
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Period dropdown — only when employee selected */}
        {selectedEmployeeId && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">Period:</label>
            <select value={period} onChange={e => handlePeriodChange(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]">
              {PERIOD_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        )}

        {/* Actions — only when employee selected and on skills tab */}
        {selectedEmployeeId && activeTab === 'skills' && (
          <div className="flex items-center gap-2 ml-auto">
            {saveSuccess && <span className="text-xs text-green-600 font-medium">✓ Saved</span>}
            {!isEditing ? (
              <button onClick={handleEdit}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Edit
              </button>
            ) : (
              <>
                <button onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saveProgress.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg transition-colors disabled:opacity-50">
                  {saveProgress.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save Progress
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedEmployeeId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
          <User className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Select an employee to view their progress</p>
        </div>
      )}

      {/* Employee detail */}
      {selectedEmployeeId && (
        <div className="space-y-4">
          {/* Employee info + Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#b23a48] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {selectedEmployee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{selectedEmployee?.name}</p>
                {selectedEmployee?.department_name && <p className="text-xs text-gray-400">{selectedEmployee.department_name}</p>}
              </div>
            </div>

            <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
              <button onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'skills' ? 'bg-[#b23a48] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <User className="w-3.5 h-3.5" />Skills & Performance
              </button>
              <button onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === 'history' ? 'bg-[#b23a48] text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <TrendingUp className="w-3.5 h-3.5" />History
              </button>
            </div>
          </div>

          {/* ── Skills Tab ── */}
          {activeTab === 'skills' && (
            <>
              {saveError && (
                <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{saveError}</p>
              )}

              {empLoading || defsLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
              ) : (
                <div className="flex gap-4 items-start">

                  {/* ── LEFT 60% — Skill Categories ── */}
                  <div className="flex-[3] space-y-3 min-w-0">
                    {skillDefs.map(cat => {
                      const existingCat = empData?.categories?.find(c => c.category_id === cat.category_id)
                      return (
                        <div key={cat.category_id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.category_name}</span>
                          </div>
                          <div className="p-4 space-y-3">
                            {cat.skills.map(skill => {
                              const existing = existingCat?.skills.find(s => s.skill_id === skill.skill_id)
                              const editScore = isEditing
                                ? (scores[skill.skill_id] !== undefined ? scores[skill.skill_id] : (existing?.score ?? ''))
                                : null
                              const viewScore = existing?.score ?? null
                              return (
                                <div key={skill.skill_id} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-700 dark:text-gray-300 w-36 shrink-0">{skill.skill_name}</span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="number" min={0} max={100}
                                        value={editScore}
                                        onChange={e => {
                                          const raw = e.target.value
                                          if (raw === '') { setScores(prev => { const n = { ...prev }; delete n[skill.skill_id]; return n }); return }
                                          const v = Math.min(100, Math.max(0, parseInt(raw)))
                                          if (!isNaN(v)) setScores(prev => ({ ...prev, [skill.skill_id]: v }))
                                        }}
                                        placeholder="0–100"
                                        className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]" />
                                      {scores[skill.skill_id] !== undefined && (
                                        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                          <div className={`h-full rounded-full transition-all ${scoreColor(scores[skill.skill_id])}`}
                                            style={{ width: `${scores[skill.skill_id]}%` }} />
                                        </div>
                                      )}
                                    </div>
                                  ) : viewScore !== null ? (
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreColor(viewScore)}`} style={{ width: `${viewScore}%` }} />
                                      </div>
                                      <span className="text-xs font-medium text-gray-900 dark:text-white w-8 text-right">{viewScore}%</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">Not rated</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {!empData && !empLoading && (
                      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-400">No data for this period. Click <strong>Edit</strong> to add scores.</p>
                      </div>
                    )}

                    {/* Notes section — always visible */}
                    {empData !== undefined && (
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Manager Notes</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Organization Expects */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Organization Expects
                            </label>
                            {isEditing ? (
                              <textarea
                                value={orgExpects}
                                onChange={e => setOrgExpects(e.target.value)}
                                rows={3}
                                placeholder="What was expected from the employee this period..."
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none"
                              />
                            ) : (
                              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700 whitespace-pre-wrap">
                                {empData?.organization_expects || <span className="text-gray-400 italic">No notes added yet</span>}
                              </p>
                            )}
                          </div>

                          {/* Employee Delivered */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Employee Delivered
                            </label>
                            {isEditing ? (
                              <textarea
                                value={empDelivered}
                                onChange={e => setEmpDelivered(e.target.value)}
                                rows={3}
                                placeholder="What the employee actually delivered this period..."
                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none"
                              />
                            ) : (
                              <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700 whitespace-pre-wrap">
                                {empData?.employee_delivered || <span className="text-gray-400 italic">No notes added yet</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT 40% — Overall Score Donut ── */}
                  <div className="flex-[2] sticky top-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 text-center">Overall Score</h3>

                      {empData?.overall_score !== null && empData?.overall_score !== undefined ? (
                        <>
                          {/* Donut chart */}
                          <div className="flex justify-center mb-4">
                            <div className="relative w-36 h-36">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                {/* Background track */}
                                <circle cx="18" cy="18" r="14" fill="none"
                                  stroke="currentColor" strokeWidth="3.5"
                                  className="text-gray-100 dark:text-gray-700" />
                                {/* Score arc */}
                                <circle cx="18" cy="18" r="14" fill="none"
                                  stroke={empData.overall_score >= 80 ? '#22c55e' : empData.overall_score >= 60 ? '#f59e0b' : '#ef4444'}
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeDasharray={`${(empData.overall_score / 100) * 87.96} 87.96`}
                                  className="transition-all duration-700" />
                              </svg>
                              {/* Score in center */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                                  {Math.round(empData.overall_score)}
                                </span>
                                <span className="text-xs text-gray-400 mt-0.5">/ 100</span>
                              </div>
                            </div>
                          </div>

                          {/* Score label */}
                          <div className="text-center mb-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              empData.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                              empData.overall_score >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {empData.overall_score >= 80 ? 'Excellent' : empData.overall_score >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>

                          {/* Category breakdown */}
                          {empData.categories && empData.categories.length > 0 && (
                            <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                              {empData.categories.map(cat => {
                                const catScores = cat.skills.map(s => s.score).filter(s => s !== null && s !== undefined)
                                const avg = catScores.length > 0 ? Math.round(catScores.reduce((a, b) => a + b, 0) / catScores.length) : null
                                if (avg === null) return null
                                return (
                                  <div key={cat.category_id} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0 truncate">{cat.category_name}</span>
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                      <div className={`h-full rounded-full ${scoreColor(avg)}`} style={{ width: `${avg}%` }} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8 text-right shrink-0">{avg}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {empData.updated_by_name && (
                            <p className="text-xs text-gray-400 text-center mt-4">Updated by {empData.updated_by_name}</p>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          {/* Empty donut */}
                          <div className="relative w-36 h-36 mb-3">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                              <circle cx="18" cy="18" r="14" fill="none"
                                stroke="currentColor" strokeWidth="3.5"
                                className="text-gray-100 dark:text-gray-700" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-xs text-gray-400">No data</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">No scores for this period</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

          {/* ── History Tab ── */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Score History</h3>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
              ) : history.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">No history yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Period</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 w-56">Score</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {history.map((entry, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">{entry.period}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${scoreColor(entry.overall_score)}`} style={{ width: `${entry.overall_score}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 dark:text-white w-10 text-right">{entry.overall_score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(entry.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
