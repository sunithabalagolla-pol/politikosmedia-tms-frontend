import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
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
  const createSkill = useCreateProgressSkill()
  const updateSkill = useUpdateProgressSkill()
  const deleteSkill = useDeleteProgressSkill()

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({})
  const [editingSkill, setEditingSkill] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

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

  const handleDeleteCategory = async (id: string) => {
    setError(null)
    try {
      await deleteCategory.mutateAsync(id)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cannot delete — scores exist. Deactivate instead.')
    }
  }

  const handleToggleCategoryActive = async (id: string, current: boolean) => {
    await updateCategory.mutateAsync({ id, is_active: !current })
  }

  const handleCreateSkill = async (categoryId: string) => {
    const name = newSkillInputs[categoryId]?.trim()
    if (!name) return
    await createSkill.mutateAsync({ categoryId, name })
    setNewSkillInputs(prev => ({ ...prev, [categoryId]: '' }))
  }

  const handleUpdateSkill = async () => {
    if (!editingSkill || !editingSkill.name.trim()) return
    await updateSkill.mutateAsync({ id: editingSkill.id, name: editingSkill.name.trim() })
    setEditingSkill(null)
  }

  const handleDeleteSkill = async (id: string) => {
    setError(null)
    try {
      await deleteSkill.mutateAsync(id)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cannot delete — scores exist. Deactivate instead.')
    }
  }

  const handleToggleSkillActive = async (id: string, current: boolean) => {
    await updateSkill.mutateAsync({ id, is_active: !current })
  }

  const getSkillsForCategory = (categoryId: string) =>
    safeAllSkills.filter(s => s.category_id === categoryId)

  if (isLoading) return <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Progress Skill Definitions</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage categories and skills used for employee progress tracking</p>
        </div>
        <button onClick={() => setShowNewCategory(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b23a48] hover:bg-[#8e2e39] text-white rounded-lg text-xs font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Category
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <X className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
        </div>
      )}

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

      <div className="space-y-2">
        {safeCategories.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No categories yet. Add one above.</p>
        )}
        {safeCategories.map(cat => {
          if (!cat) return null
          // Backend returns id/name (not category_id/category_name)
          const catId = cat.id
          const catName = cat.name
          const skills = getSkillsForCategory(catId)
          const isExpanded = expandedCategories.has(catId)
          return (
            <div key={catId} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800">
                <button onClick={() => toggleExpand(catId)} className="text-gray-400 hover:text-gray-600">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {editingCategory?.id === catId ? (
                  <input autoFocus value={editingCategory.name}
                    onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdateCategory(); if (e.key === 'Escape') setEditingCategory(null) }}
                    className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20" />
                ) : (
                  <span className={`flex-1 text-xs font-semibold ${cat.is_active ? 'text-gray-900 dark:text-white' : 'text-gray-400 line-through'}`}>
                    {catName}
                    <span className="ml-2 text-xs font-normal text-gray-400">({skills.length} skills)</span>
                  </span>
                )}

                <div className="flex items-center gap-1 ml-auto">
                  {editingCategory?.id === catId ? (
                    <>
                      <button onClick={handleUpdateCategory} disabled={updateCategory.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        {updateCategory.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </button>
                      <button onClick={() => setEditingCategory(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3 h-3" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleToggleCategoryActive(catId, cat.is_active)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={cat.is_active ? 'Deactivate' : 'Activate'}>
                        {cat.is_active ? <ToggleRight className="w-4 h-4 text-[#b23a48]" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                      </button>
                      <button onClick={() => setEditingCategory({ id: catId, name: catName })}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteCategory(catId)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 space-y-2">
                  {skills.length === 0 && <p className="text-xs text-gray-400">No skills yet.</p>}
                  {skills.filter(Boolean).map(skill => {
                    if (!skill) return null
                    // Backend returns id/name (not skill_id/skill_name)
                    const skillId = skill.id
                    const skillName = skill.name
                    return (
                      <div key={skillId} className="flex items-center gap-2">
                        {editingSkill?.id === skillId ? (
                          <input autoFocus value={editingSkill.name}
                            onChange={e => setEditingSkill({ ...editingSkill, name: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') handleUpdateSkill(); if (e.key === 'Escape') setEditingSkill(null) }}
                            className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20" />
                        ) : (
                          <span className={`flex-1 text-xs ${skill.is_active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}`}>
                            {skillName}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {editingSkill?.id === skillId ? (
                            <>
                              <button onClick={handleUpdateSkill} disabled={updateSkill.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                {updateSkill.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </button>
                              <button onClick={() => setEditingSkill(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3 h-3" /></button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleToggleSkillActive(skillId, skill.is_active)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" title={skill.is_active ? 'Deactivate' : 'Activate'}>
                                {skill.is_active ? <ToggleRight className="w-3.5 h-3.5 text-[#b23a48]" /> : <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />}
                              </button>
                              <button onClick={() => setEditingSkill({ id: skillId, name: skillName })}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleDeleteSkill(skillId)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <div className="flex items-center gap-2 pt-1">
                    <input value={newSkillInputs[catId] || ''}
                      onChange={e => setNewSkillInputs(prev => ({ ...prev, [catId]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateSkill(catId) }}
                      placeholder="Add skill..."
                      className="flex-1 px-2.5 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] placeholder-gray-400" />
                    <button onClick={() => handleCreateSkill(catId)}
                      disabled={!newSkillInputs[catId]?.trim() || createSkill.isPending}
                      className="p-1.5 bg-[#b23a48] text-white rounded-lg disabled:opacity-40 hover:bg-[#8e2e39]">
                      {createSkill.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
