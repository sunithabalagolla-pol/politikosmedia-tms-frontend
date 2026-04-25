import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, TrendingUp, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import {
  useProgressCategories, useAllProgressSkills,
  useCreateProgressCategory, useUpdateProgressCategory, useDeleteProgressCategory,
  useCreateProgressSkill, useUpdateProgressSkill, useDeleteProgressSkill,
} from '../../hooks/api/useProgress'

export default function ProgressSettings() {
  const { data: categories = [], isLoading } = useProgressCategories()
  const { data: allSkills = [] } = useAllProgressSkills()

  const safeCategories = Array.isArray(categories) ? categories.filter(Boolean) : []
  const safeAllSkills = Array.isArray(allSkills) ? allSkills.filter(Boolean) : []

  const createCategory = useCreateProgressCategory()
  const updateCategory = useUpdateProgressCategory()
  const deleteCategory = useDeleteProgressCategory()

  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getSkillsForCategory = (categoryId: string) =>
    safeAllSkills.filter(s => s.category_id === categoryId)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createCategory.mutateAsync({ name: newCategoryName.trim() })
    setNewCategoryName('')
    setShowNewCategory(false)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return
    await updateCategory.mutateAsync({ id: editingCategory.id, name: editingCategory.name.trim() })
    setEditingCategory(null)
  }

  const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setError(null)
    try {
      await deleteCategory.mutateAsync(id)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cannot delete — scores exist. Deactivate instead.')
    }
  }

  const handleToggleCategoryActive = async (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation()
    await updateCategory.mutateAsync({ id, is_active: !current })
  }

  // Skills sub-view
  if (selectedCategoryId) {
    const cat = safeCategories.find(c => c.id === selectedCategoryId)
    return (
      <SkillManagement
        categoryId={selectedCategoryId}
        categoryName={cat?.name || ''}
        onBack={() => setSelectedCategoryId(null)}
        allSkills={safeAllSkills}
      />
    )
  }

  if (isLoading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Progress Skill Definitions</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Manage categories and skills used for employee progress tracking</p>
        </div>
        <button onClick={() => setShowNewCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg text-xs font-medium transition-colors">
          <Plus className="w-4 h-4" />Add Category
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Inline create */}
      {showNewCategory && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
          <input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); if (e.key === 'Escape') { setShowNewCategory(false); setNewCategoryName('') } }}
            placeholder="Category name..."
            className="flex-1 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]" />
          <button onClick={handleCreateCategory} disabled={createCategory.isPending || !newCategoryName.trim()}
            className="p-1.5 bg-[#b23a48] text-white rounded-lg disabled:opacity-50 hover:bg-[#8e2e39]">
            {createCategory.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => { setShowNewCategory(false); setNewCategoryName('') }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      {safeCategories.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Categories Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add a category above to start defining skills.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {safeCategories.map(cat => {
            if (!cat) return null
            const skills = getSkillsForCategory(cat.id)
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group ${!cat.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col items-center text-center space-y-1.5">
                  {/* Icon */}
                  <TrendingUp className={`w-8 h-8 group-hover:scale-110 transition-transform ${cat.is_active ? 'text-[#b23a48]' : 'text-gray-400'}`} />

                  {/* Name */}
                  {editingCategory?.id === cat.id ? (
                    <input
                      autoFocus
                      value={editingCategory.name}
                      onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleUpdateCategory(); if (e.key === 'Escape') setEditingCategory(null) }}
                      onClick={e => e.stopPropagation()}
                      className="w-full px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-[11px] text-center text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/30"
                    />
                  ) : (
                    <h3 className={`text-[11px] font-bold group-hover:text-[#b23a48] transition-colors leading-tight ${cat.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                      {cat.name}
                    </h3>
                  )}

                  {/* Skill count + active status */}
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                  </p>

                  {/* Actions row */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedCategoryId(cat.id) }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      Skills
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleToggleCategoryActive(e, cat.id, cat.is_active)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={cat.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {cat.is_active ? <ToggleRight className="w-3.5 h-3.5 text-[#b23a48]" /> : <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingCategory({ id: cat.id, name: cat.name }) }}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCategory(e, cat.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Skill Management Sub-View ── */
function SkillManagement({ categoryId, categoryName, onBack, allSkills }: {
  categoryId: string
  categoryName: string
  onBack: () => void
  allSkills: any[]
}) {
  const createSkill = useCreateProgressSkill()
  const updateSkill = useUpdateProgressSkill()
  const deleteSkill = useDeleteProgressSkill()

  const [newSkillName, setNewSkillName] = useState('')
  const [editingSkill, setEditingSkill] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const skills = allSkills.filter(s => s.category_id === categoryId)

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return
    await createSkill.mutateAsync({ categoryId, name: newSkillName.trim() })
    setNewSkillName('')
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill || !editingSkill.name.trim()) return
    await updateSkill.mutateAsync({ id: editingSkill.id, name: editingSkill.name.trim() })
    setEditingSkill(null)
  }

  const handleDeleteSkill = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setError(null)
    try {
      await deleteSkill.mutateAsync(id)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cannot delete — scores exist. Deactivate instead.')
    }
  }

  const handleToggleSkillActive = async (e: React.MouseEvent, id: string, current: boolean) => {
    e.stopPropagation()
    await updateSkill.mutateAsync({ id, is_active: !current })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{categoryName} — Skills</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manage skills for this progress category</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Add skill inline */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
        <input
          value={newSkillName}
          onChange={e => setNewSkillName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleCreateSkill() }}
          placeholder="New skill name..."
          className="flex-1 px-2.5 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]"
        />
        <button onClick={handleCreateSkill} disabled={createSkill.isPending || !newSkillName.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
          {createSkill.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Skill
        </button>
      </div>

      {/* Skills Grid */}
      {skills.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Skills Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add a skill above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {skills.filter(Boolean).map(skill => {
            if (!skill) return null
            return (
              <div
                key={skill.id}
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all p-3 group ${!skill.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col items-center text-center space-y-1.5">
                  {/* Icon */}
                  <TrendingUp className={`w-8 h-8 group-hover:scale-110 transition-transform ${skill.is_active ? 'text-purple-500' : 'text-gray-400'}`} />

                  {/* Name */}
                  {editingSkill?.id === skill.id ? (
                    <input
                      autoFocus
                      value={editingSkill.name}
                      onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateSkill(); if (e.key === 'Escape') setEditingSkill(null) }}
                      className="w-full px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-[11px] text-center text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/30"
                    />
                  ) : (
                    <h3 className={`text-[11px] font-bold group-hover:text-[#b23a48] transition-colors leading-tight ${skill.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                      {skill.name}
                    </h3>
                  )}

                  {/* Status */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${skill.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {skill.is_active ? 'Active' : 'Inactive'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full justify-center">
                    <button
                      onClick={(e) => handleToggleSkillActive(e, skill.id, skill.is_active)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={skill.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {skill.is_active ? <ToggleRight className="w-3.5 h-3.5 text-[#b23a48]" /> : <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />}
                    </button>
                    {editingSkill?.id === skill.id ? (
                      <>
                        <button onClick={handleUpdateSkill} disabled={updateSkill.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          {updateSkill.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </button>
                        <button onClick={() => setEditingSkill(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingSkill({ id: skill.id, name: skill.name }) }}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSkill(e, skill.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
