import { useState } from 'react'
import { ChevronDown, ChevronUp, Send, MessageCircle, Loader2, CheckCircle2, FolderTree, Layers, X } from 'lucide-react'
import { useFaqs, useSubmitTicket, useTickets, useUpdateTicketStatus, useDeleteTicket } from '../../hooks/api/useHelp'
import { useCategories, useAssignedCategories } from '../../hooks/api/useCategories'
import { usePhases, useAssignedPhases } from '../../hooks/api/usePhases'
import { useRole } from '../../hooks/useRole'
import { usePermission, useUserPermissions } from '../../hooks/usePermission'
import { usePublicSettings } from '../../hooks/api/useSettings'
import { useAuth } from '../../context/AuthContext'
import { formatDate } from '../../lib/dateUtils'
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
}
const STATUS_DOTS: Record<string, string> = { open: '🔴', 'in-progress': '🟡', closed: '🟢' }

export default function Help() {
  const { user } = useAuth()
  const { isAdminOrManager, isAdmin } = useRole()
  const { data: faqs, isLoading: faqsLoading } = useFaqs()
  const submitTicket = useSubmitTicket()
  const updateTicketStatus = useUpdateTicketStatus()
  const deleteTicket = useDeleteTicket()
  
  // Permission checks
  const canCreateTicket = usePermission('ticket:create')
  const canUpdateTicket = usePermission('ticket:update')
  const canViewTickets = usePermission('ticket:view')
  const canDeleteTicket = usePermission('ticket:delete')
  
  // Get user role and ID for UI visibility settings and ownership checks
  const { data: authData } = useUserPermissions()
  const userRole = authData?.user?.role
  const currentUserId = authData?.user?.id
  const { data: publicSettings } = usePublicSettings()
  
  // Determine visibility based on permissions AND UI settings
  const showCreateForRole = userRole === 'admin'
    ? publicSettings?.show_tickets_create_admin ?? true
    : userRole === 'manager' 
      ? publicSettings?.show_tickets_create_manager 
      : userRole === 'employee' 
        ? publicSettings?.show_tickets_create_employee 
        : true // fallback
  const shouldShowCreateButton = canCreateTicket && (isAdmin() || showCreateForRole)
  
  const showUpdateForRole = userRole === 'admin'
    ? publicSettings?.show_tickets_update_admin ?? true
    : userRole === 'manager'
      ? publicSettings?.show_tickets_update_manager
      : userRole === 'employee'
        ? publicSettings?.show_tickets_update_employee
        : true // fallback
  const shouldShowUpdateButton = canUpdateTicket && (isAdmin() || showUpdateForRole)
  
  const showViewForRole = userRole === 'admin'
    ? publicSettings?.show_tickets_view_admin ?? true
    : userRole === 'manager'
      ? publicSettings?.show_tickets_view_manager
      : userRole === 'employee'
        ? publicSettings?.show_tickets_view_employee
        : true // fallback
  const shouldShowTickets = canViewTickets && (isAdmin() || showViewForRole)
  
  const showDeleteForRole = userRole === 'admin'
    ? publicSettings?.show_tickets_delete_admin ?? true
    : userRole === 'manager'
      ? publicSettings?.show_tickets_delete_manager
      : userRole === 'employee'
        ? publicSettings?.show_tickets_delete_employee
        : true // fallback

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

  const [openId, setOpenId] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [ticketCategory, setTicketCategory] = useState<string>()
  const [ticketPhase, setTicketPhase] = useState<string>()
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [ticketFilter, setTicketFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updateForm, setUpdateForm] = useState({ status: 'open', admin_note: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null)

  const { data: ticketsData, isLoading: ticketsLoading } = useTickets({
    status: ticketFilter || undefined,
    category_id: selectedCategory,
    phase_id: selectedPhase,
  })
  const tickets = Array.isArray(ticketsData) ? ticketsData : ticketsData?.tickets || ticketsData?.data || []
  
  const handleClearFilters = () => {
    setSelectedCategory(undefined)
    setSelectedPhase(undefined)
    setTicketFilter('')
  }
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId || undefined)
    setSelectedPhase(undefined) // Reset phase when category changes
  }
  
  const handleTicketCategoryChange = (categoryId: string) => {
    setTicketCategory(categoryId || undefined)
    setTicketPhase(undefined) // Reset phase when category changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) { setFormError('Subject and description are required.'); return }
    setFormError('')
    await submitTicket.mutateAsync({ 
      subject, 
      description,
      category_id: ticketCategory,
      phase_id: ticketPhase,
    })
    setSubmitted(true)
    setSubject('')
    setDescription('')
    setTicketCategory(undefined)
    setTicketPhase(undefined)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const handleUpdateTicket = async (id: string) => {
    await updateTicketStatus.mutateAsync({ id, status: updateForm.status, admin_note: updateForm.admin_note || undefined })
    setUpdatingId(null)
    setUpdateForm({ status: 'open', admin_note: '' })
  }

  const handleDeleteTicket = async (id: string) => {
    setDeleteTicketId(id)
  }

  const handleDeleteTicketConfirm = async () => {
    if (!deleteTicketId) return
    try {
      await deleteTicket.mutateAsync(deleteTicketId)
      setDeletingId(null)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete ticket')
    } finally {
      setDeleteTicketId(null)
    }
  }

  const openUpdateForm = (ticket: any) => {
    setUpdatingId(ticket.id)
    setUpdateForm({ status: ticket.status, admin_note: '' })
  }

  const getStatusLabel = (status: string) => {
    if (status === 'in-progress') return 'In Progress'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4 mb-6">
              <svg className="w-6 h-6 text-gray-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div><h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Frequently Asked Questions</h2><p className="text-xs text-gray-500">Find answers to common questions</p></div>
            </div>
            {faqsLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
            : faqs && faqs.length > 0 ? (
              <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
                {faqs.map((faq: any) => (
                  <div key={faq.id} className="py-4">
                    <button onClick={() => setOpenId(openId === faq.id ? null : faq.id)} className="w-full flex items-center justify-between text-left focus:outline-none group">
                      <span className="text-xs font-medium text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors pr-4">{faq.question}</span>
                      {openId === faq.id ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                    </button>
                    {openId === faq.id && <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</div>}
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8"><p className="text-xs text-gray-400">No FAQs available yet.</p></div>}
          </div>

          {/* Submit Ticket */}
          {shouldShowCreateButton && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              <div className="flex items-start gap-4 mb-6">
                <MessageCircle className="w-6 h-6 text-gray-500 mt-1" />
                <div><h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Contact Support</h2><p className="text-xs text-gray-500">Submit a ticket and we'll respond within 24 hours</p></div>
              </div>
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Ticket submitted!</p>
                  <p className="text-xs text-gray-500">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {formError && <p className="text-xs text-red-600 p-2 bg-red-50 rounded-lg">{formError}</p>}
                  <div><label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Subject <span className="text-red-500">*</span></label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" /></div>
                  
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Category (Optional)</label>
                    <select
                      value={ticketCategory || ''}
                      onChange={(e) => handleTicketCategoryChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700"
                    >
                      <option value="">Select a category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Phase Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Phase (Optional)</label>
                    <select
                      value={ticketPhase || ''}
                      onChange={(e) => setTicketPhase(e.target.value || undefined)}
                      disabled={!ticketCategory}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700"
                    >
                      <option value="">Select a phase</option>
                      {phases?.map((phase) => (
                        <option key={phase.id} value={phase.id}>
                          {phase.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div><label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Description <span className="text-red-500">*</span></label>
                    <textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your issue in detail..."
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none dark:bg-gray-700" /></div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={submitTicket.isPending} className="flex items-center gap-2 px-6 py-2.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-70">
                      {submitTicket.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}Submit Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Tickets Section */}
          {shouldShowTickets && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
              {/* Header with Filters */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{isAdminOrManager() ? 'All Tickets' : 'My Tickets'}</h2>
                    <p className="text-xs text-gray-500">{isAdminOrManager() ? 'Support tickets from all users' : 'Your submitted support tickets'}</p>
                  </div>
                </div>
                
                {/* Filters Row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Filter */}
                  {isAdminOrManager() && (
                    <select value={ticketFilter} onChange={e => setTicketFilter(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[120px]">
                      <option value="">All Status</option>
                      <option value="open">🔴 Open</option>
                      <option value="in-progress">🟡 In Progress</option>
                      <option value="closed">🟢 Closed</option>
                    </select>
                  )}
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-gray-400" />
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] min-w-[150px]"
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
                      className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
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
                  {(selectedCategory || selectedPhase || ticketFilter) && (
                    <button
                      onClick={handleClearFilters}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                      Clear Filters
                    </button>
                  )}

                  {/* Active Filter Indicator */}
                  {(selectedCategory || selectedPhase) && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
              {ticketsLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
              : !tickets || tickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">{isAdminOrManager() ? 'No tickets found.' : "You haven't submitted any tickets yet."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Excel-like Table */}
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Subject</th>
                        <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</th>
                        <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Phase</th>
                        <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Status</th>
                        {isAdminOrManager() && (
                          <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Submitted By</th>
                        )}
                        <th className="px-4 py-2 text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Created</th>
                        <th className="px-4 py-2 text-center text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((ticket: any) => {
                        const isOwnTicket = ticket.user_id === currentUserId
                        const shouldShowDeleteButton = canDeleteTicket && (isAdmin() || showDeleteForRole) && (userRole !== 'employee' || isOwnTicket)
                        
                        return (
                          <tr 
                            key={ticket.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="px-4 py-2 text-[11px] text-gray-900 dark:text-white font-medium max-w-xs">
                              <div className="truncate">{ticket.subject}</div>
                            </td>
                            <td className="px-4 py-3 text-[11px]">
                              {ticket.category_name ? (
                                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[11px] font-medium">
                                  {ticket.category_name}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[11px]">
                              {ticket.phase_name ? (
                                <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded text-[11px] font-medium">
                                  {ticket.phase_name}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[11px]">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                                {STATUS_DOTS[ticket.status]} {getStatusLabel(ticket.status)}
                              </span>
                            </td>
                            {isAdminOrManager() && (
                              <td className="px-4 py-2 text-[11px] text-gray-600 dark:text-gray-400">
                                <div className="truncate max-w-[150px]">{ticket.submitted_by || '—'}</div>
                              </td>
                            )}
                            <td className="px-4 py-2 text-[11px] text-gray-600 dark:text-gray-400">
                              {formatDate(ticket.created_at?.split('T')[0] || '')}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setSelectedTicketId(ticket.id)}
                                  className="px-1.5 py-0.5 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                >
                                  View
                                </button>
                                {shouldShowDeleteButton && (
                                  <button
                                    onClick={() => handleDeleteTicket(ticket.id)}
                                    disabled={deletingId === ticket.id}
                                    className="px-1.5 py-0.5 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                                  >
                                    {deletingId === ticket.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      'Delete'
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Modal Popup - Fixed Overlay */}
              {selectedTicketId && tickets.find((t: any) => t.id === selectedTicketId) && (() => {
                const ticket = tickets.find((t: any) => t.id === selectedTicketId)
                const isOwnTicket = ticket.user_id === currentUserId
                const shouldShowDeleteButton = canDeleteTicket && (isAdmin() || showDeleteForRole) && (userRole !== 'employee' || isOwnTicket)
                
                return (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTicketId(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

                      {/* Header */}
                      <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Support Ticket</p>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{ticket.subject}</h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[ticket.status] || 'bg-gray-100 text-gray-700'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                            {getStatusLabel(ticket.status)}
                          </span>
                          <button onClick={() => setSelectedTicketId(null)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable body */}
                      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                        {/* Description */}
                        {ticket.description && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{ticket.description}</p>
                        )}

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Category</p>
                            <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{ticket.category_name || '—'}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Phase</p>
                            <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{ticket.phase_name || '—'}</p>
                          </div>
                          {isAdminOrManager() && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Submitted By</p>
                              <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{ticket.submitted_by}</p>
                              {ticket.submitted_email && <p className="text-[10px] text-gray-400 mt-0.5">{ticket.submitted_email}</p>}
                            </div>
                          )}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Created</p>
                            <p className="text-[11px] font-semibold text-gray-900 dark:text-white">{formatDate(ticket.created_at?.split('T')[0] || '')}</p>
                          </div>
                        </div>

                        {/* Timeline */}
                        {ticket.status_history && ticket.status_history.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Activity</p>
                            <div className="space-y-2">
                              {ticket.status_history.map((entry: any, idx: number) => (
                                <div key={entry.id} className="flex gap-3">
                                  {/* Timeline dot + line */}
                                  <div className="flex flex-col items-center">
                                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                      entry.status === 'closed' ? 'bg-green-500' :
                                      entry.status === 'in-progress' ? 'bg-amber-500' : 'bg-red-400'
                                    }`} />
                                    {idx < ticket.status_history.length - 1 && (
                                      <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="pb-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className={`text-[11px] font-semibold ${
                                        entry.status === 'closed' ? 'text-green-600 dark:text-green-400' :
                                        entry.status === 'in-progress' ? 'text-amber-600 dark:text-amber-400' :
                                        'text-red-600 dark:text-red-400'
                                      }`}>{getStatusLabel(entry.status)}</span>
                                      <span className="text-[10px] text-gray-400">{formatDate(entry.changed_at?.split('T')[0] || '')}</span>
                                    </div>
                                    {entry.note && (
                                      <p className="text-[11px] text-gray-600 dark:text-gray-400 italic mb-0.5">"{entry.note}"</p>
                                    )}
                                    <p className="text-[10px] text-gray-400">by {entry.changed_by_name} · {entry.changed_by_role}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Update Status */}
                        {shouldShowUpdateButton && isAdminOrManager() && (
                          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                            {updatingId === ticket.id ? (
                              <div className="space-y-2.5">
                                <select value={updateForm.status} onChange={e => setUpdateForm(p => ({...p, status: e.target.value}))}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48]">
                                  <option value="open">Open</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="closed">Closed</option>
                                </select>
                                <textarea value={updateForm.admin_note} onChange={e => setUpdateForm(p => ({...p, admin_note: e.target.value}))}
                                  placeholder="Add a note about this status change..." rows={2}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none placeholder-gray-400" />
                                <div className="flex gap-2">
                                  <button onClick={() => handleUpdateTicket(ticket.id)} disabled={updateTicketStatus.isPending}
                                    className="flex-1 px-4 py-2 bg-[#b23a48] text-white rounded-xl text-[11px] font-medium hover:bg-[#8f2e3a] disabled:opacity-70 transition-colors">
                                    {updateTicketStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Save Changes'}
                                  </button>
                                  <button onClick={() => setUpdatingId(null)}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <button onClick={() => openUpdateForm(ticket)}
                                  className="px-4 py-1.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-[11px] font-medium transition-colors">
                                  Update Status
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="#" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-[#b23a48] hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Documentation</h3>
              <p className="text-xs text-gray-500">Browse our complete guides</p>
            </a>
            <a href="#" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-[#b23a48] hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 mb-3 group-hover:bg-teal-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">Video Tutorials</h3>
              <p className="text-xs text-gray-500">Watch step-by-step guides</p>
            </a>
          </div>
        </div>
      </main>

      {/* Delete Ticket Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTicketId}
        onClose={() => setDeleteTicketId(null)}
        onConfirm={handleDeleteTicketConfirm}
        title="Delete Ticket"
        message="Are you sure you want to permanently delete this ticket? This action cannot be undone."
        isDeleting={deleteTicket.isPending}
      />
    </div>
  )
}
