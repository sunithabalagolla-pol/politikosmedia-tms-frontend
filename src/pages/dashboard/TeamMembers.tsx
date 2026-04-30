import { useState } from 'react'
import { Filter, List, LayoutGrid, UserPlus, X, Pen, UserX, ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react'
import { useTeam, useAddTeamMember, useUpdateTeamMember, useUpdateMemberStatus } from '../../hooks/api/useTeam'
import { useLookupDepartments } from '../../hooks/api/useLookups'
import { useAuth } from '../../context/AuthContext'
import { usePermission } from '../../hooks/usePermission'
import { useRole } from '../../hooks/useRole'
import { usePublicSettings } from '../../hooks/api/useSettings'
import { resolveFileUrl } from '../../lib/fileUrl'

export default function TeamMembers() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [page, setPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'employee', department_id: '', job_title: '', location: '' })

  const { data: teamData, isLoading } = useTeam({ page, limit: 20 })
  const { data: lookupDepts } = useLookupDepartments()
  const addMember = useAddTeamMember()
  const updateMember = useUpdateTeamMember()
  const updateStatus = useUpdateMemberStatus()
  const { user } = useAuth()
  const [statusError, setStatusError] = useState<string | null>(null)

  // Permission checks
  const { isAdmin } = useRole()
  const { data: settings } = usePublicSettings()
  const userRole = user?.role
  
  const canAddMember = isAdmin() || usePermission('team:add_member')
  const showAddForRole = userRole === 'admin' ? settings?.show_team_add_admin ?? true : userRole === 'manager' ? settings?.show_team_add_manager : settings?.show_team_add_employee
  const shouldShowAddButton = canAddMember && showAddForRole
  
  const canEditMember = isAdmin() || usePermission('team:edit_member')
  const showEditForRole = userRole === 'admin' ? settings?.show_team_edit_admin ?? true : userRole === 'manager' ? settings?.show_team_edit_manager : settings?.show_team_edit_employee
  const shouldShowEditButton = canEditMember && showEditForRole
  
  const canDeactivateMember = isAdmin() || usePermission('team:deactivate')
  const showDeactivateForRole = userRole === 'admin' ? settings?.show_team_deactivate_admin ?? true : userRole === 'manager' ? settings?.show_team_deactivate_manager : settings?.show_team_deactivate_employee
  const shouldShowDeactivateButton = canDeactivateMember && showDeactivateForRole

  // Admin can toggle anyone except themselves
  const canToggleStatus = (member: any) => member.email !== user?.email

  const handleToggleStatus = async (member: any, newStatus: string) => {
    setStatusError(null)
    try {
      await updateStatus.mutateAsync({ id: member.id, status: newStatus })
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to update status')
      setTimeout(() => setStatusError(null), 4000)
    }
  }

  const members = teamData?.members || []
  const pagination = teamData?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 }

  const getStatusColor = (status: string) => {
    switch (status) { case 'active': return 'bg-green-500'; case 'away': return 'bg-orange-500'; default: return 'bg-gray-300' }
  }
  const getWorkloadColor = (workload: number) => {
    if (workload >= 8) return 'bg-orange-500'; if (workload >= 4) return 'bg-yellow-500'; return 'bg-green-500'
  }
  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin') return 'bg-red-50 text-red-600 border-red-200'
    if (role === 'manager') return 'bg-amber-50 text-amber-600 border-amber-200'
    return 'bg-teal-50 text-teal-600 border-teal-200'
  }

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) return
    const body: any = { name: newMember.name, email: newMember.email, role: newMember.role }
    if (newMember.department_id) body.department_id = newMember.department_id
    if (newMember.job_title) body.job_title = newMember.job_title
    if (newMember.location) body.location = newMember.location
    await addMember.mutateAsync(body)
    setShowAddModal(false)
    setNewMember({ name: '', email: '', role: 'employee', department_id: '', job_title: '', location: '' })
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return
    await updateMember.mutateAsync({ id: editingMember.id, name: editingMember.name, role: editingMember.role, department_id: editingMember.department_id || undefined, job_title: editingMember.job_title || undefined, location: editingMember.location || undefined })
    setEditingMember(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
          <button onClick={() => setViewMode('list')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><List className="w-3.5 h-3.5 mr-1" />List</button>
          <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}><LayoutGrid className="w-3.5 h-3.5 mr-1" />Grid</button>
        </div>
        {shouldShowAddButton && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg px-3 py-1 text-[11px] font-medium transition-colors shadow-sm">
            <UserPlus className="w-3 h-3" />Add Member
          </button>
        )}
      </div>

      {/* Content */}
      {statusError && (
        <div className="mx-4 mb-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-[11px] text-red-700 dark:text-red-400 font-medium">
          {statusError}
        </div>
      )}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="w-10 h-10 text-gray-300 mb-3" />
            <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1">No team members yet</h3>
            <p className="text-[11px] text-gray-500">Click "Add Member" to add your first team member.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-1/3">Member</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Department / Role</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Workload</th>
                  <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {members.map((member: any) => (
                  <tr key={member.id} className={`hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group ${member.status === 'deactivated' ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {member.avatar_url ? <img src={resolveFileUrl(member.avatar_url)} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                            : <div className="w-10 h-10 rounded-full bg-[#b23a48] flex items-center justify-center border-2 border-gray-200"><span className="text-white font-semibold text-[11px]">{member.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}</span></div>}
                          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${getStatusColor(member.status)} border-2 border-white rounded-full`}></div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white mb-0.5">{member.name}</p>
                          <p className="text-[11px] text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-gray-900 dark:text-white mb-1">{member.department_name || 'No department'}</p>
                      <span className={`inline-block px-2 py-0.5 text-[11px] rounded-md font-semibold border ${getRoleBadgeColor(member.role)}`}>{member.role?.charAt(0).toUpperCase() + member.role?.slice(1)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${member.status === 'active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {member.status?.charAt(0).toUpperCase() + member.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.status !== 'deactivated' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
                              <div className={`h-full ${getWorkloadColor(member.workload || 0)} rounded-full`} style={{ width: `${Math.min((member.workload || 0) * 10, 100)}%` }}></div>
                            </div>
                            <span className="text-[11px] font-semibold text-gray-600">{member.workload || 0}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">{member.workload || 0} Active Tasks</p>
                        </>
                      ) : <span className="text-[11px] text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.status !== 'deactivated' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {shouldShowEditButton && (
                            <button onClick={() => setEditingMember({ ...member })} title="Edit" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-colors"><Pen className="w-3.5 h-3.5" /></button>
                          )}
                          {shouldShowDeactivateButton && canToggleStatus(member) && (
                            <button onClick={() => handleToggleStatus(member, 'deactivated')} title="Deactivate" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"><UserX className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {shouldShowDeactivateButton && canToggleStatus(member) && (
                            <button onClick={() => handleToggleStatus(member, 'active')} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-900 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors text-[11px] font-semibold shadow-sm">Reactivate</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-slate-50">
                <p className="text-[11px] text-gray-500">Showing {(pagination.page-1)*pagination.limit+1} to {Math.min(pagination.page*pagination.limit, pagination.total)} of {pagination.total}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50"><ChevronLeft className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page >= pagination.totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Add Team Member</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Name <span className="text-red-500">*</span></label>
                <input type="text" value={newMember.name} onChange={e => setNewMember(p => ({...p, name: e.target.value}))} placeholder="Full name" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={newMember.email} onChange={e => setNewMember(p => ({...p, email: e.target.value}))} placeholder="email@politikos.in" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={newMember.role} onChange={e => setNewMember(p => ({...p, role: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20">
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
                </select></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select value={newMember.department_id} onChange={e => setNewMember(p => ({...p, department_id: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20">
                  <option value="">Select department</option>
                  {(lookupDepts || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                <input type="text" value={newMember.job_title} onChange={e => setNewMember(p => ({...p, job_title: e.target.value}))} placeholder="e.g. Frontend Developer" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20" /></div>
              <button onClick={handleAddMember} disabled={addMember.isPending} className="w-full bg-[#b23a48] hover:bg-[#8f2e3a] text-white py-2.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-70">
                {addMember.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Edit Member</h2>
              <button onClick={() => setEditingMember(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" value={editingMember.name} onChange={e => setEditingMember((p: any) => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]" /></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select value={editingMember.role} onChange={e => setEditingMember((p: any) => ({...p, role: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20">
                  <option value="employee">Employee</option><option value="manager">Manager</option><option value="admin">Admin</option>
                </select></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <select value={editingMember.department_id || ''} onChange={e => setEditingMember((p: any) => ({...p, department_id: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20">
                  <option value="">No department</option>
                  {(lookupDepts || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select></div>
              <div><label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
                <input type="text" value={editingMember.job_title || ''} onChange={e => setEditingMember((p: any) => ({...p, job_title: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20" /></div>
              <button onClick={handleUpdateMember} disabled={updateMember.isPending} className="w-full bg-[#b23a48] hover:bg-[#8f2e3a] text-white py-2.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-70">
                {updateMember.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
