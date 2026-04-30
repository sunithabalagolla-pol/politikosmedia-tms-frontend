import { useState, useRef, useEffect } from 'react'
import { X, Calendar, Flag, Upload, Check, ChevronDown, Download, Trash2, Loader2, Eye, Send, MessageSquare, AlertCircle } from 'lucide-react'
import { useDeleteAttachment, useUploadAttachment } from '../hooks/api/useAttachments'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { useAddComment, useTask, useUpdateTaskStatus, useUpdateTaskPriority } from '../hooks/api/useTasks'
import { useToggleSubtask } from '../hooks/api/useSubtasks'
import { usePermission, useUserPermissions } from '../hooks/usePermission'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axiosInstance'
import { formatDate } from '../lib/dateUtils'

function triggerDownload(url: string, filename: string) {
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    })
    .catch(() => window.open(url, '_blank'))
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface TaskDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  taskId: string | null
  hideStatusDropdown?: boolean
  hidePriorityDropdown?: boolean
}

const STATUS_OPTIONS = ['To Do', 'In Progress', 'Completed', 'Hold']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

const STATUS_STYLES: Record<string, string> = {
  'To Do': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Completed': 'bg-green-100 text-green-700',
  'Hold': 'bg-orange-100 text-orange-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'text-green-500',
  Medium: 'text-yellow-500',
  High: 'text-red-500',
  Urgent: 'text-red-700',
}

function formatStatus(s: string) {
  if (s === 'in-progress') return 'In Progress'
  if (s === 'todo') return 'To Do'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function TaskDetailPanel({ isOpen, onClose, taskId, hideStatusDropdown, hidePriorityDropdown }: TaskDetailPanelProps) {
  // ── Live data directly from React Query cache ──
  const { data: raw, isLoading } = useTask(isOpen ? taskId : null)

  // Derived display values from raw cache data
  const task = raw ? {
    id: String(raw.id),
    title: raw.title,
    status: formatStatus(raw.status),
    priority: raw.priority?.charAt(0).toUpperCase() + raw.priority?.slice(1),
    client: (raw.assignees || []).map((a: any) => a.name).join(', ') || raw.assignee_name || 'Unassigned',
    startDate: raw.start_date ? formatDate(raw.start_date, 'medium') : undefined,
    dueDate: raw.due_date ? formatDate(raw.due_date) : 'No date',
    departments: raw.department_name ? [raw.department_name] : [],
    description: raw.description || 'No description',
    subtasks: (raw.subtasks || []) as Array<{ id: number; title: string; completed: boolean; completion_note?: string; completed_at?: string; created_by?: string }>,
    attachments: (raw.attachments || []).map((att: any) => ({
      id: att.id,
      name: att.file_name,
      type: att.file_type?.split('/').pop() || 'file',
      size: att.file_size ? `${(att.file_size / 1024 / 1024).toFixed(1)} MB` : '—',
      url: att.file_url,
      uploadedBy: att.uploaded_by,
      uploaderName: att.uploader_name,
    })),
    comments: (raw.comments || []) as Array<{ id: string | number; user_name: string; content: string; created_at: string }>,
  } : null

  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [showCompletionNoteModal, setShowCompletionNoteModal] = useState(false)
  const [completionNote, setCompletionNote] = useState('')
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<number | null>(null)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdNote, setHoldNote] = useState('')
  const [attachmentToDelete, setAttachmentToDelete] = useState<{ id: any; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const priorityRef = useRef<HTMLDivElement>(null)

  const updateStatus = useUpdateTaskStatus()
  const updatePriority = useUpdateTaskPriority()
  const toggleSubtask = useToggleSubtask()
  const deleteAttachment = useDeleteAttachment()
  const uploadAttachment = useUploadAttachment()
  const addComment = useAddComment()
  
  // Permission-based access control
  const canUploadAttachment = usePermission('attachment:upload')
  const canDeletePermission = usePermission('attachment:delete')
  
  // Get current user info for ownership checks
  const { data: authData } = useUserPermissions()

  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/settings/public')
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
  const r2Verified = publicSettings?.r2_verified === true
  const MAX_FILE_SIZE = 10 * 1024 * 1024

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false)
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!isOpen) return null

  const handleStatusSelect = async (s: string) => {
    if (!task) return
    const statusMap: Record<string, string> = {
      'To Do': 'todo',
      'In Progress': 'in-progress',
      'Completed': 'completed',
      'Hold': 'hold',
    }
    const newStatus = statusMap[s] || s.toLowerCase()
    setStatusOpen(false)

    if (newStatus === 'hold') {
      setHoldNote('')
      setShowHoldModal(true)
      return
    }

    setStatusError(null)
    try {
      await updateStatus.mutateAsync({ id: task.id, status: newStatus })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update status'
      setStatusError(message)
      setTimeout(() => setStatusError(null), 5000)
    }
  }

  const handleHoldSubmit = async () => {
    if (!task || !holdNote.trim()) return
    setStatusError(null)
    setShowHoldModal(false)
    try {
      await updateStatus.mutateAsync({ id: task.id, status: 'hold', hold_note: holdNote.trim() })
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to update status'
      setStatusError(message)
      setTimeout(() => setStatusError(null), 5000)
    }
    setHoldNote('')
  }

  const handleHoldCancel = () => {
    setShowHoldModal(false)
    setHoldNote('')
  }

  const handlePrioritySelect = (p: string) => {
    if (!task) return
    updatePriority.mutate({ id: task.id, priority: p.toLowerCase() })
    setPriorityOpen(false)
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return
    setCommentError(null)
    try {
      await addComment.mutateAsync({ taskId: task.id, content: commentText.trim() })
      setCommentText('')
    } catch (err: any) {
      setCommentError(err?.response?.status === 403
        ? 'You can only comment on tasks assigned to you'
        : err?.response?.data?.message || 'Failed to add comment. Try again.')
    }
  }

  const handleSubtaskToggle = (subtask: any) => {
    if (!subtask.completed) {
      // Marking as complete - show modal for completion note
      setSelectedSubtaskId(subtask.id)
      setShowCompletionNoteModal(true)
    } else {
      // Unmarking - no note needed
      toggleSubtask.mutate({ subtaskId: subtask.id })
    }
  }

  const handleCompletionNoteSubmit = () => {
    if (selectedSubtaskId === null) return
    toggleSubtask.mutate({ 
      subtaskId: selectedSubtaskId, 
      completionNote: completionNote.trim() || undefined 
    })
    setShowCompletionNoteModal(false)
    setCompletionNote('')
    setSelectedSubtaskId(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !task) return
    setUploadError(null)
    if (file.size > MAX_FILE_SIZE) { setUploadError('File too large. Maximum 10MB'); return }
    try {
      await uploadAttachment.mutateAsync({ taskId: task.id, file })
    } catch (err: any) {
      const msg = err?.response?.data?.message || ''
      setUploadError(err?.response?.status === 403
        ? 'You can only upload to tasks assigned to you'
        : msg.toLowerCase().includes('storage') ? 'Storage not configured. Contact your administrator.' : msg || 'Upload failed. Try again.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[380px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between shrink-0">
            <h2 className="text-[11px] font-bold text-gray-900 dark:text-white">Task Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" />
            </div>
          )}

          {/* Content */}
          {task && (
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              <h3 className="text-[11px] font-semibold text-gray-900 dark:text-white">{task.title}</h3>

              {/* Status Error Toast */}
              {statusError && (
                <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-red-700 dark:text-red-400">{statusError}</p>
                  </div>
                  <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Description</h4>
                <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">{task.description}</p>
              </div>

              {/* Category & Phase */}
              {(raw.category_name || raw.phase_name) && (
                <div className="grid grid-cols-2 gap-2">
                  {raw.category_name && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Category</h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-medium text-gray-900 dark:text-white">{raw.category_name}</p>
                      </div>
                    </div>
                  )}
                  {raw.phase_name && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Phase</h4>
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] font-medium text-gray-900 dark:text-white">{raw.phase_name}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtasks */}
              {task.subtasks.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Subtasks</h4>
                  <div className="space-y-0.5 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                    {task.subtasks.map((st) => (
                      <div key={st.id}>
                        <div onClick={() => handleSubtaskToggle(st)}
                          className="flex items-center gap-1.5 text-[10px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-0.5 transition-colors">
                          <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${st.completed ? 'bg-[#b23a48] border-[#b23a48]' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                            {st.completed && <Check className="w-2 h-2 text-white" />}
                          </div>
                          <span className={`text-gray-700 dark:text-gray-300 ${st.completed ? 'line-through text-gray-400' : ''}`}>{st.title}</span>
                        </div>
                        {st.completed && st.completion_note && (
                          <div className="ml-4 pl-1.5 border-l-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 rounded-r px-1.5 py-0.5 mt-0.5">
                            <p className="text-[10px] text-green-700 dark:text-green-400 font-medium">✓ {st.completion_note}</p>
                            {st.completed_at && <p className="text-[10px] text-gray-400">{formatDate(st.completed_at)}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Department & Assigned To */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Department</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex flex-wrap gap-1">
                    {task.departments.length > 0 ? task.departments.map((dept, idx) => (
                      <span key={idx} className={`text-[10px] font-semibold px-1 py-0.5 rounded ${dept === 'Tech' ? 'bg-teal-100 text-teal-700' : dept === 'Media' ? 'bg-amber-100 text-amber-700' : dept === 'SEO' ? 'bg-green-100 text-green-700' : 'bg-[#b23a48]/10 text-[#b23a48]'}`}>{dept}</span>
                    )) : <span className="text-[10px] text-gray-400">—</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Assigned To</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] font-medium text-gray-900 dark:text-white">{task.client}</p>
                  </div>
                </div>
              </div>

              {/* Dates + Priority + Status in one row */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Start</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-gray-500 shrink-0" /><p className="text-[10px] font-medium text-gray-900 dark:text-white truncate">{task.startDate || 'Not set'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Due</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-gray-500 shrink-0" /><p className="text-[10px] font-medium text-gray-900 dark:text-white truncate">{task.dueDate}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Priority</h4>
                  {hidePriorityDropdown ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center gap-1">
                      <Flag className={`w-2.5 h-2.5 ${PRIORITY_COLORS[task.priority] || 'text-gray-400'}`} />
                      <span className="text-[10px] font-medium text-gray-900 dark:text-white">{task.priority}</span>
                    </div>
                  ) : (
                    <div className="relative" ref={priorityRef}>
                      <button onClick={() => setPriorityOpen(!priorityOpen)} className="w-full bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-1"><Flag className={`w-2.5 h-2.5 ${PRIORITY_COLORS[task.priority] || 'text-gray-400'}`} /><span className="text-[10px] font-medium text-gray-900 dark:text-white">{task.priority}</span></div>
                        <ChevronDown className={`w-2.5 h-2.5 text-gray-400 transition-transform ${priorityOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {priorityOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-0.5">
                          {PRIORITY_OPTIONS.map(p => (
                            <button key={p} onClick={() => handlePrioritySelect(p)} className={`w-full flex items-center gap-1.5 px-2 py-1 text-[10px] transition-colors ${task.priority === p ? 'bg-[#b23a48]/10 text-[#b23a48] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                              <Flag className={`w-2.5 h-2.5 ${PRIORITY_COLORS[p]}`} />{p}{task.priority === p && <Check className="w-2.5 h-2.5 ml-auto" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">Status</h4>
                  {hideStatusDropdown ? (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[task.status] || 'bg-red-100 text-red-700'}`}>
                        {task.status === 'Completed' && <Check className="w-2.5 h-2.5 mr-0.5" />}{task.status}
                      </span>
                    </div>
                  ) : (
                    <div className="relative" ref={statusRef}>
                      <button onClick={() => setStatusOpen(!statusOpen)} className="w-full bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between hover:border-gray-300 transition-colors">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_STYLES[task.status] || 'bg-red-100 text-red-700'}`}>
                          {task.status === 'Completed' && <Check className="w-2.5 h-2.5 mr-0.5" />}{task.status}
                        </span>
                        <ChevronDown className={`w-2.5 h-2.5 text-gray-400 transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {statusOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 py-0.5">
                          {STATUS_OPTIONS.map(s => (
                            <button key={s} onClick={() => handleStatusSelect(s)} className={`w-full flex items-center gap-1.5 px-2 py-1 text-[10px] transition-colors ${task.status === s ? 'bg-[#b23a48]/10 text-[#b23a48] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${s === 'To Do' ? 'bg-blue-500' : s === 'In Progress' ? 'bg-yellow-500' : s === 'Completed' ? 'bg-green-500' : 'bg-orange-500'}`} />{s}{task.status === s && <Check className="w-2.5 h-2.5 ml-auto" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Hold Note Display */}
              {raw.status === 'hold' && raw.hold_note && (
                <div className="flex items-start gap-1.5 p-1.5 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <AlertCircle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-orange-700 dark:text-orange-400">On Hold</p>
                    <p className="text-[10px] text-orange-600 dark:text-orange-300">{raw.hold_note}</p>
                  </div>
                </div>
              )}

              {/* File Attachments - Compact */}
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Attachments</h4>
                  {canUploadAttachment && (
                    <label className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${r2Verified ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}>
                      <Upload className="w-2.5 h-2.5" /> {uploadAttachment.isPending ? '...' : 'Upload'}
                      <input ref={fileInputRef} type="file" className="hidden" disabled={!r2Verified || uploadAttachment.isPending} onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
                {uploadError && <p className="text-[10px] text-red-600 flex items-center gap-1 mb-0.5"><AlertCircle className="w-2.5 h-2.5 shrink-0" />{uploadError}</p>}
                {task.attachments.length === 0 ? (
                  <p className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700 text-center">No attachments</p>
                ) : (
                  <div className="space-y-1 bg-gray-50 dark:bg-gray-700/50 rounded p-1.5 border border-gray-200 dark:border-gray-700">
                    {task.attachments.map((att: { id: any; name: string; type: string; size: string; url?: string; uploadedBy?: any; uploaderName?: string }) => {
                      const previewable = /\.(jpg|jpeg|png|gif|webp|pdf|svg)$/i.test(att.name) || ['image', 'pdf'].some(t => att.type?.toLowerCase().includes(t))
                      const canDeleteThisAttachment = canDeletePermission && (
                        authData?.user.role === 'admin' || authData?.user.role === 'manager' || att.uploadedBy === authData?.user.id
                      )
                      return (
                        <div key={att.id} className="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded">
                          <Upload className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                          <span className="flex-1 text-[10px] text-gray-700 dark:text-gray-300 truncate min-w-0">{att.name}</span>
                          <span className="text-[9px] text-gray-500 shrink-0">{att.size}</span>
                          {att.url && previewable && <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0"><Eye className="w-2.5 h-2.5" /></a>}
                          {att.url && <button onClick={() => triggerDownload(att.url!, att.name)} className="text-[#b23a48] hover:text-[#8f2e3a] shrink-0"><Download className="w-2.5 h-2.5" /></button>}
                          {canDeleteThisAttachment && (
                            <button onClick={() => setAttachmentToDelete({ id: att.id, name: att.name })} disabled={deleteAttachment.isPending} className="text-red-500 hover:text-red-700 shrink-0 disabled:opacity-50">
                              {deleteAttachment.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Comments - Input first so admin/manager sees it immediately */}
              <div>
                <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5" /> Comments {task.comments.length > 0 && <span className="text-gray-400">({task.comments.length})</span>}
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Comment input at top */}
                  <div className="p-1.5 border-b border-gray-100 dark:border-gray-700">
                    {commentError && <p className="text-[10px] text-red-600 flex items-center gap-1 mb-1"><AlertCircle className="w-2.5 h-2.5 shrink-0" />{commentError}</p>}
                    <div className="flex gap-1.5">
                      <input value={commentText} onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                        placeholder="Add a comment or progress update..."
                        className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                      />
                      <button onClick={handleAddComment} disabled={!commentText.trim() || addComment.isPending}
                        className="px-2 py-1 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded transition-colors disabled:opacity-50 shrink-0">
                        {addComment.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {task.comments.length > 0 && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-36 overflow-y-auto">
                      {task.comments.map((c) => (
                        <div key={c.id} className="px-2 py-1.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div className="w-4 h-4 rounded-full bg-[#b23a48] flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold text-white">{c.user_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-900 dark:text-white">{c.user_name}</span>
                            <span className="text-[9px] text-gray-400 ml-auto">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed pl-5">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Completion Note Modal */}
      {showCompletionNoteModal && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-[60]" onClick={() => {
            setShowCompletionNoteModal(false)
            setCompletionNote('')
            setSelectedSubtaskId(null)
          }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[70] p-6">
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-white mb-2">Mark Subtask Complete</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-4">Add a note about what you completed (optional)</p>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              placeholder="e.g., Fixed the login bug by updating authentication logic..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCompletionNoteModal(false)
                  setCompletionNote('')
                  setSelectedSubtaskId(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompletionNoteSubmit}
                disabled={toggleSubtask.isPending}
                className="flex-1 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {toggleSubtask.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Marking...</>
                ) : (
                  <><Check className="w-3.5 h-3.5" /> Mark Complete</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
      {/* Hold Note Modal */}
      {showHoldModal && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-[60]" onClick={handleHoldCancel} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[70] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Hold Reason</h3>
                <p className="text-xs text-gray-500">Required before setting task on hold</p>
              </div>
            </div>
            <textarea
              value={holdNote}
              onChange={(e) => setHoldNote(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Explain why this task is being put on hold..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white dark:bg-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400 mb-1"
            />
            <p className="text-xs text-gray-400 text-right mb-4">{holdNote.length} / 1000</p>
            <div className="flex items-center gap-3">
              <button onClick={handleHoldCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleHoldSubmit} disabled={!holdNote.trim() || updateStatus.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Hold'}
              </button>
            </div>
          </div>
        </>
      )}
      {/* Attachment Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!attachmentToDelete}
        onClose={() => setAttachmentToDelete(null)}
        onConfirm={() => {
          if (attachmentToDelete) {
            deleteAttachment.mutate(attachmentToDelete.id, {
              onSettled: () => setAttachmentToDelete(null),
            })
          }
        }}
        title="Delete Attachment"
        message={`Are you sure you want to delete "${attachmentToDelete?.name ?? 'this file'}"? This file will be permanently removed and cannot be recovered.`}
        isDeleting={deleteAttachment.isPending}
      />
    </>
  )
}
