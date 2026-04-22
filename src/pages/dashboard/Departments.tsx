import { Plus, Users, Clipboard, UserCircle, X, Trash2, Pen, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from '../../hooks/api/useDepartments'
import { usePermission } from '../../hooks/usePermission'

export default function Departments() {
  // Permission checks
  const canView = usePermission('dept:view')
  const canCreate = usePermission('dept:create')
  const canEdit = usePermission('dept:edit')
  const canDelete = usePermission('dept:delete')
  
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [createError, setCreateError] = useState('')

  const { data: deptData, isLoading } = useDepartments()
  const createDept = useCreateDepartment()
  const updateDept = useUpdateDepartment()
  const deleteDept = useDeleteDepartment()
  const [deleteError, setDeleteError] = useState('')

  const departments = deptData?.departments || []
  const stats = deptData?.stats || { totalDepartments: 0, totalTasks: 0, totalMembers: 0 }
  
  // Redirect if user doesn't have view permission
  if (!canView) {
    return <Navigate to="/dashboard" replace />
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreateError('')
    try {
      const body: any = { name: form.name }
      if (form.description) body.description = form.description
      await createDept.mutateAsync(body)
      setShowModal(false)
      setForm({ name: '', description: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create department'
      setCreateError(msg)
      console.error('Create department error:', err)
    }
  }

  const handleUpdate = async () => {
    if (!editingDept || !form.name.trim()) return
    setCreateError('')
    try {
      await updateDept.mutateAsync({ id: editingDept.id, name: form.name, description: form.description || undefined })
      setEditingDept(null)
      setForm({ name: '', description: '' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update department'
      setCreateError(msg)
      console.error('Update department error:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeleteError('')
      await deleteDept.mutateAsync(id)
      setShowDeleteConfirm(null)
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Cannot delete this department')
    }
  }

  const openEdit = (dept: any) => {
    setEditingDept(dept)
    setForm({ name: dept.name, description: dept.description || '' })
    setCreateError('')
  }

  return (
    <>
      {/* Create/Edit Modal */}
      {(showModal || editingDept) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{editingDept ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => { setShowModal(false); setEditingDept(null); setForm({ name: '', description: '' }); setCreateError('') }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
                </div>
              )}
              <div><label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">Department Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="e.g. Engineering" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#b23a48] focus:ring-2 focus:ring-[#b23a48]/20" /></div>
              <div><label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Brief description" rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs dark:bg-gray-700 dark:text-white focus:outline-none focus:border-[#b23a48] focus:ring-2 focus:ring-[#b23a48]/20 resize-none" /></div>
              <button onClick={editingDept ? handleUpdate : handleCreate} disabled={createDept.isPending || updateDept.isPending}
                className="w-full bg-[#b23a48] hover:bg-[#8f2e3a] text-white py-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-70">
                {(createDept.isPending || updateDept.isPending) ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingDept ? 'Update Department' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Department</h3><p className="text-xs text-gray-500">This cannot be undone.</p></div>
            </div>
            {deleteError && <p className="text-xs text-red-600 mb-3 p-2 bg-red-50 rounded-lg">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(null); setDeleteError('') }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={deleteDept.isPending} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-70">
                {deleteDept.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="h-full flex flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-end mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            {canCreate && (
              <button onClick={() => setShowModal(true)} className="bg-[#b23a48] hover:bg-[#8f2e3a] text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm">
                <Plus className="w-3 h-3" /> Add Department
              </button>
            )}
          </div>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-[#b23a48]/10 to-[#b23a48]/5 dark:from-[#b23a48]/20 dark:to-gray-800 border border-[#b23a48]/20 dark:border-[#b23a48]/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#b23a48]/15 flex items-center justify-center text-[#b23a48]"><Users className="w-4 h-4" /></div>
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalDepartments}</h3><p className="text-[#b23a48] text-xs font-medium">Departments</p></div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-50/30 dark:from-blue-900/20 dark:to-gray-800 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600"><Clipboard className="w-4 h-4" /></div>
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalTasks}</h3><p className="text-blue-600 text-xs font-medium">Total Tasks</p></div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-gray-800 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600"><UserCircle className="w-4 h-4" /></div>
              <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalMembers}</h3><p className="text-emerald-600 text-xs font-medium">Team Members</p></div>
            </div>
          </div>
          {/* Department List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
          ) : departments.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <Users className="w-12 h-12 text-gray-300 mb-4 opacity-80" />
              <h2 className="text-xs font-medium text-gray-500 mb-2">No departments yet</h2>
              <p className="text-gray-500 text-xs">Click "Add Department" to create your first department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {departments.map((dept: any) => (
                <div key={dept.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 border-l-[#b23a48] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">{dept.name}</h3>
                    {(canEdit || canDelete) && (
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        {canEdit && (
                          <button onClick={() => openEdit(dept)} className="text-gray-400 hover:text-blue-600 p-0.5 hover:bg-blue-50 rounded" title="Edit">
                            <Pen className="w-3 h-3" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setShowDeleteConfirm(dept.id)} className="text-gray-400 hover:text-red-600 p-0.5 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {dept.description && <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">{dept.description}</p>}
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{dept.member_count || 0} members</span>
                    <span className="flex items-center gap-0.5"><Clipboard className="w-2.5 h-2.5" />{dept.task_count || 0} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
