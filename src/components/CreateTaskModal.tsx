 import { X, Plus, Trash2, Calendar, Upload, Flag, FileText, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCreateTask, useUpdateTask } from '../hooks/api/useTasks'
import { useUploadAttachment } from '../hooks/api/useAttachments'
import { useLookupDepartments, useLookupEmployees } from '../hooks/api/useLookups'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../api/axiosInstance'
import ConfirmDeleteModal from './ConfirmDeleteModal'

interface Subtask { 
  id: string
  title: string
}

interface TaskForm {
  id: string
  title: string
  description: string
  subtasks: Subtask[]
  department: string
  assigned: string[]
  startDate: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'completed' | 'hold'
  files: File[]
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  editTask?: {
    id: number
    title: string
    description: string
    status: string
    priority: string
    department?: string
    assigned?: string
    startDate?: string
    dueDate?: string
    subtasks?: Array<{ id: number; title: string }>
  } | null
  prefilledCategory?: string
  prefilledPhase?: string
  categoryName?: string
  phaseName?: string
}

export default function CreateTaskModal({ isOpen, onClose, editTask, prefilledCategory, prefilledPhase, categoryName, phaseName }: CreateTaskModalProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedPreview, setExtractedPreview] = useState<any[]>([])
  const [showExtractPreview, setShowExtractPreview] = useState(false)
  const [showDeleteSubtaskConfirm, setShowDeleteSubtaskConfirm] = useState(false)
  const [subtaskToDelete, setSubtaskToDelete] = useState<{ taskId: string; subtaskId: string; title: string } | null>(null)
  const [isDeletingSubtask, setIsDeletingSubtask] = useState(false)
  
  const [taskForms, setTaskForms] = useState<TaskForm[]>([
    {
      id: '1',
      title: '',
      description: '',
      subtasks: [],
      department: '',
      assigned: [],
      startDate: '',
      dueDate: '',
      priority: 'medium',
      status: 'todo',
      files: []
    }
  ])

  // Initialize form with edit data when editTask is provided
  useEffect(() => {
    if (editTask) {
      console.log('🔧 Initializing edit form with task:', editTask)
      console.log('🔧 Subtasks to load:', editTask.subtasks)
      setTaskForms([{
        id: editTask.id.toString(),
        title: editTask.title,
        description: editTask.description,
        subtasks: editTask.subtasks?.map(st => ({ id: st.id.toString(), title: st.title })) || [],
        department: editTask.department || '',
        assigned: Array.isArray(editTask.assigned) ? editTask.assigned : editTask.assigned ? [editTask.assigned] : [],
        startDate: editTask.startDate || '',
        dueDate: editTask.dueDate || '',
        priority: (editTask.priority?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
        status: editTask.status?.toLowerCase().replace(' ', '-') as TaskForm['status'] || 'todo',
        files: []
      }])
    } else {
      setTaskForms([{
        id: '1',
        title: '',
        description: '',
        subtasks: [],
        department: '',
        assigned: [],
        startDate: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo',
        files: []
      }])
    }
  }, [editTask, isOpen])

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const uploadAttachment = useUploadAttachment()
  const { data: lookupDepts } = useLookupDepartments()
  const { data: lookupEmployees } = useLookupEmployees()
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/settings/public')
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
  const r2Verified = publicSettings?.r2_verified === true
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [fileUploadErrors, setFileUploadErrors] = useState<string[]>([])
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdNote, setHoldNote] = useState('')

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  if (!isOpen) return null

  const addTaskForm = () => {
    const newForm: TaskForm = {
      id: Date.now().toString(),
      title: '',
      description: '',
      subtasks: [],
      department: '',
      assigned: [],
      startDate: '',
      dueDate: '',
      priority: 'medium',
      status: 'todo',
      files: []
    }
    setTaskForms([...taskForms, newForm])
  }

  const removeTaskForm = (id: string) => {
    if (taskForms.length > 1) {
      setTaskForms(taskForms.filter(form => form.id !== id))
    }
  }

  const updateTaskForm = (id: string, field: keyof TaskForm, value: any) => {
    setTaskForms(taskForms.map(form => 
      form.id === id ? { ...form, [field]: value } : form
    ))
  }

  const addSubtask = (taskId: string) => {
    setTaskForms(taskForms.map(form => {
      if (form.id === taskId) {
        return {
          ...form,
          subtasks: [...form.subtasks, { id: Date.now().toString(), title: '' }]
        }
      }
      return form
    }))
  }

  const handleDeleteSubtaskClick = (taskId: string, subtaskId: string, title: string) => {
    setSubtaskToDelete({ taskId, subtaskId, title })
    setShowDeleteSubtaskConfirm(true)
  }

  const removeSubtask = async () => {
    if (!subtaskToDelete) return
    
    const { taskId, subtaskId } = subtaskToDelete
    console.log('🗑️ Attempting to delete subtask:', { taskId, subtaskId, editTask })
    
    // Check if this is an existing subtask (UUID from backend) or a new one (timestamp string)
    // Existing subtasks have UUID format, new ones have timestamp IDs like "1234567890"
    const isExistingSubtask = editTask && subtaskId.includes('-') // UUIDs contain dashes
    console.log('🗑️ Is existing subtask?', isExistingSubtask)
    
    if (isExistingSubtask) {
      // Delete from backend
      setIsDeletingSubtask(true)
      try {
        console.log('🗑️ Calling DELETE API for subtask:', subtaskId)
        await axiosInstance.delete(`/api/v1/subtasks/${subtaskId}`)
        console.log('✅ Subtask deleted successfully')
        
        // Remove from local state after successful deletion
        setTaskForms(taskForms.map(form => {
          if (form.id === taskId) {
            return {
              ...form,
              subtasks: form.subtasks.filter(st => st.id !== subtaskId)
            }
          }
          return form
        }))
        
        setShowDeleteSubtaskConfirm(false)
        setSubtaskToDelete(null)
      } catch (err: any) {
        console.error('❌ Failed to delete subtask:', err)
        console.error('❌ Error response:', err?.response?.data)
        if (err?.response?.status === 403) {
          alert(`Cannot delete subtask: ${err?.response?.data?.message || 'Permission denied'}`)
        } else {
          alert('Failed to delete subtask. Please try again.')
        }
      } finally {
        setIsDeletingSubtask(false)
      }
    } else {
      // Just remove from local state (new subtask not yet saved)
      console.log('🗑️ Removing new subtask from local state')
      setTaskForms(taskForms.map(form => {
        if (form.id === taskId) {
          return {
            ...form,
            subtasks: form.subtasks.filter(st => st.id !== subtaskId)
          }
        }
        return form
      }))
      setShowDeleteSubtaskConfirm(false)
      setSubtaskToDelete(null)
    }
  }

  const updateSubtask = (taskId: string, subtaskId: string, value: string) => {
    setTaskForms(taskForms.map(form => {
      if (form.id === taskId) {
        return {
          ...form,
          subtasks: form.subtasks.map(st => 
            st.id === subtaskId ? { ...st, title: value } : st
          )
        }
      }
      return form
    }))
  }

  const handleFileChange = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const tooLarge = filesArray.filter(f => f.size > MAX_FILE_SIZE)
      if (tooLarge.length > 0) {
        setFileUploadErrors(tooLarge.map(f => `${f.name} exceeds 10MB limit`))
        // Still add the valid ones
        const valid = filesArray.filter(f => f.size <= MAX_FILE_SIZE)
        if (valid.length > 0) {
          setTaskForms(taskForms.map(form =>
            form.id === taskId ? { ...form, files: [...form.files, ...valid] } : form
          ))
        }
        return
      }
      setFileUploadErrors([])
      setTaskForms(taskForms.map(form => 
        form.id === taskId ? { ...form, files: [...form.files, ...filesArray] } : form
      ))
    }
  }

  const removeFile = (taskId: string, fileIndex: number) => {
    setTaskForms(taskForms.map(form => {
      if (form.id === taskId) {
        return {
          ...form,
          files: form.files.filter((_, idx) => idx !== fileIndex)
        }
      }
      return form
    }))
  }

  const validateForm = (form: TaskForm): string[] => {
    const errors: string[] = []
    if (!form.title.trim()) errors.push('Title is required')
    if (form.title.length > 255) errors.push('Title must be 255 characters or less')
    if (form.description && form.description.length > 5000) errors.push('Description must be 5000 characters or less')
    return errors
  }

  const handleSubmit = async (overrideHoldNote?: string) => {
    // Validate all forms
    const errors: Record<string, string[]> = {}
    taskForms.forEach(form => {
      const formErrors = validateForm(form)
      if (formErrors.length > 0) errors[form.id] = formErrors
    })

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors({})

    try {
      if (editTask) {
        const form = taskForms[0]

        // If status changed to hold and no hold_note provided yet, show modal
        if (form.status === 'hold' && !overrideHoldNote) {
          setHoldNote('')
          setShowHoldModal(true)
          return
        }

        const body: Record<string, any> = {
          title: form.title,
          description: form.description,
          priority: form.priority,
          status: form.status,
        }
        if (form.status === 'hold' && overrideHoldNote) {
          body.hold_note = overrideHoldNote
        }
        if (form.assigned.length > 0) body.assigned_to = form.assigned
        if (form.department) body.department_id = form.department
        if (form.startDate) body.start_date = form.startDate
        if (form.dueDate) body.due_date = form.dueDate
        await updateTask.mutateAsync({ id: editTask.id, ...body })

        // Handle subtasks: update existing, create new
        const originalIds = (editTask.subtasks || []).map((st: any) => st.id)
        for (const st of form.subtasks) {
          if (!st.title.trim()) continue
          if (originalIds.includes(st.id)) {
            // Existing subtask — check if title changed
            const original = (editTask.subtasks || []).find((o: any) => o.id === st.id)
            if (original && original.title !== st.title) {
              try {
                await axiosInstance.put(`/api/v1/subtasks/${st.id}`, { title: st.title })
              } catch (err: any) {
                console.error('Failed to update subtask:', err)
                // If ownership error, show user-friendly message
                if (err?.response?.status === 403) {
                  alert(`Cannot update subtask "${original.title}": ${err?.response?.data?.message || 'Permission denied'}`)
                }
              }
            }
          } else {
            // New subtask — create it
            try {
              await axiosInstance.post(`/api/v1/tasks/${editTask.id}/subtasks`, { title: st.title })
            } catch (err: any) {
              console.error('Failed to create subtask:', err)
              if (err?.response?.status === 403) {
                alert(`Cannot create subtask: ${err?.response?.data?.message || 'Permission denied'}`)
              }
            }
          }
        }

        // Upload files for edited task
        if (form.files.length > 0) {
          setUploadingFiles(true)
          const errors: string[] = []
          for (const file of form.files) {
            try {
              await uploadAttachment.mutateAsync({ taskId: editTask.id, file })
            } catch (err: any) {
              if (err?.response?.status === 403) {
                errors.push('You can only upload files to your assigned tasks')
              } else {
                const msg = err?.response?.data?.message || err?.response?.data?.error
                errors.push(msg || `${file.name} failed to upload. Try again.`)
              }
            }
          }
          setUploadingFiles(false)
          if (errors.length > 0) {
            setFileUploadErrors(errors)
            return // Keep modal open to show errors
          }
        }
      } else {
        const tasksPayload = taskForms
          .filter(form => form.title.trim())
          .map(form => {
            const task: Record<string, any> = {
              title: form.title,
              description: form.description,
              status: form.status,
              priority: form.priority,
            }
            if (form.assigned.length > 0) task.assigned_to = form.assigned
            if (form.department) task.department_id = form.department
            if (form.startDate) task.start_date = form.startDate
            if (form.dueDate) task.due_date = form.dueDate
            // Add category_id and phase_id if provided
            if (prefilledCategory) task.category_id = prefilledCategory
            if (prefilledPhase) task.phase_id = prefilledPhase
            const subs = form.subtasks.filter(st => st.title.trim())
            if (subs.length) task.subtasks = subs.map(st => ({ title: st.title }))
            return task
          })
        if (tasksPayload.length === 0) return
        const result = await createTask.mutateAsync(tasksPayload)

        // Upload files for each newly created task
        const createdTasks = result?.data || []
        const formsWithFiles = taskForms.filter(f => f.title.trim() && f.files.length > 0)
        if (formsWithFiles.length > 0 && createdTasks.length > 0) {
          setUploadingFiles(true)
          const errors: string[] = []
          for (let i = 0; i < formsWithFiles.length; i++) {
            // Match form index to created task index
            const formIndex = taskForms.filter(f => f.title.trim()).indexOf(formsWithFiles[i])
            const createdTask = createdTasks[formIndex]
            if (!createdTask?.id) continue
            for (const file of formsWithFiles[i].files) {
              try {
                await uploadAttachment.mutateAsync({ taskId: createdTask.id, file })
              } catch (err: any) {
                if (err?.response?.status === 403) {
                  errors.push('You can only upload files to your assigned tasks')
                } else {
                  const msg = err?.response?.data?.message || err?.response?.data?.error
                  errors.push(msg || `${file.name} failed to upload. Try again.`)
                }
              }
            }
          }
          setUploadingFiles(false)
          if (errors.length > 0) {
            setFileUploadErrors(errors)
            return // Keep modal open to show errors
          }
        }
      }
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error
      if (msg?.toLowerCase().includes('storage')) {
        setFileUploadErrors(['Storage not configured. Contact your administrator.'])
      } else {
        console.error('Task save failed:', err)
      }
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    
    // Simulate AI extraction process (replace with actual API call)
    setTimeout(() => {
      const mockExtractedTasks = [
        {
          id: Date.now().toString(),
          title: 'Complete Q3 Financial Report',
          description: 'Prepare and submit the quarterly financial analysis including revenue breakdown and expense tracking.',
          subtasks: [
            { id: '1', title: 'Gather financial data from all departments' },
            { id: '2', title: 'Create revenue analysis charts' },
            { id: '3', title: 'Review with finance team' }
          ],
          department: 'Tech',
          assigned: 'John Doe',
          startDate: '2026-03-15',
          dueDate: '2026-03-30',
          priority: 'high' as const,
          status: 'todo' as const,
          files: [],
          confidence: 0.92
        },
        {
          id: (Date.now() + 1).toString(),
          title: 'Update Marketing Website',
          description: 'Redesign homepage and update product pages with new branding guidelines.',
          subtasks: [
            { id: '3', title: 'Design new homepage mockup' },
            { id: '4', title: 'Update product images' }
          ],
          department: 'Media',
          assigned: 'Sarah Johnson',
          startDate: '2026-03-16',
          dueDate: '2026-04-05',
          priority: 'medium' as const,
          status: 'todo' as const,
          files: [],
          confidence: 0.85
        }
      ]
      
      setExtractedPreview(mockExtractedTasks)
      setShowExtractPreview(true)
      setIsExtracting(false)
    }, 2500)
  }

  const applyExtractedTasks = (selectedTasks: any[]) => {
    setTaskForms(selectedTasks.map(task => ({
      ...task,
      files: []
    })))
    setShowExtractPreview(false)
    setExtractedPreview([])
  }

  const cancelExtraction = () => {
    setShowExtractPreview(false)
    setExtractedPreview([])
  }

  // Dropdown data from API (fallback to empty arrays)
  const departments = (lookupDepts || []).map((d: any) => ({ id: d.id, name: d.name }))
  const assignees = (lookupEmployees || []).map((e: any) => ({ id: e.id, name: e.name }))

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            {editTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Document Extraction Section - Only show in create mode */}
          {!editTask && !showExtractPreview && (
            <div className="border-2 border-dashed border-[#b23a48]/30 rounded-lg p-2.5 bg-gradient-to-br from-[#b23a48]/5 to-purple-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#b23a48]/10 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5 text-[#b23a48]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white">
                    Extract Tasks from Document
                  </h3>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400">
                    Upload a document (PDF, Word, Excel, Image) and let AI automatically extract tasks.
                  </p>
                </div>
                {isExtracting ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 text-[#b23a48] animate-spin" />
                    <span className="text-[10px] text-gray-700 dark:text-gray-300 font-medium">Extracting...</span>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#b23a48] text-white rounded-lg text-[11px] font-semibold hover:bg-[#8f2e3a] transition-colors cursor-pointer shadow-sm shrink-0">
                    <FileText className="w-3 h-3" />
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleDocumentUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Extracted Tasks Preview */}
          {showExtractPreview && extractedPreview.length > 0 && (
            <div className="border-2 border-[#b23a48] rounded-lg p-3 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#b23a48]" />
                  <h3 className="text-[11px] font-bold text-gray-900 dark:text-white">
                    Extracted {extractedPreview.length} Task{extractedPreview.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <button
                  onClick={cancelExtraction}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">
                Review the extracted tasks below. You can edit them after importing.
              </p>

              <div className="space-y-1.5 mb-2 max-h-[200px] overflow-y-auto">
                {extractedPreview.map((task) => (
                  <div key={task.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white">{task.title}</h4>
                      <span className={`text-[10px] px-1 py-0.5 rounded ${
                        task.confidence >= 0.9 ? 'bg-green-100 text-green-700' :
                        task.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {Math.round(task.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">{task.department}</span>
                      <span className={`px-1 py-0.5 rounded font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{task.priority}</span>
                      <span className="text-gray-500 dark:text-gray-400">Due: {task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cancelExtraction}
                  className="flex-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => applyExtractedTasks(extractedPreview)}
                  className="flex-1 px-2.5 py-1 bg-[#b23a48] text-white rounded-lg text-[11px] font-semibold hover:bg-[#8f2e3a] transition-colors shadow-sm"
                >
                  Import {extractedPreview.length} Task{extractedPreview.length > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {taskForms.map((form, formIndex) => (
            <div 
              key={form.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50 relative"
            >
              {/* Remove Task Button */}
              {taskForms.length > 1 && !editTask && (
                <button
                  onClick={() => removeTaskForm(form.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-0.5 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove task"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              <div className="space-y-2">
                {/* Task Number */}
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Task {formIndex + 1}
                </span>

                {/* Validation Errors */}
                {validationErrors[form.id] && (
                  <div className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    {validationErrors[form.id].map((err, i) => (
                      <p key={i} className="text-[10px] text-red-600 dark:text-red-400">{err}</p>
                    ))}
                  </div>
                )}

                {/* Title + Category + Phase in a row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className={prefilledCategory && categoryName ? '' : 'sm:col-span-3'}>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateTaskForm(form.id, 'title', e.target.value)}
                      placeholder="Enter task title"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    />
                  </div>

                  {prefilledCategory && categoryName && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                        Category
                      </label>
                      <input
                        type="text"
                        value={categoryName}
                        disabled
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {prefilledPhase && phaseName && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                        Phase
                      </label>
                      <input
                        type="text"
                        value={phaseName}
                        disabled
                        className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateTaskForm(form.id, 'description', e.target.value)}
                    placeholder="Enter task description"
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors resize-none"
                  />
                </div>

                {/* Subtasks */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subtasks
                  </label>
                  <div className="space-y-1">
                    {form.subtasks.map((subtask, idx) => (
                      <div key={subtask.id} className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium w-3">{idx + 1}.</span>
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => updateSubtask(form.id, subtask.id, e.target.value)}
                          placeholder="Enter subtask"
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                        />
                        <button
                          onClick={() => handleDeleteSubtaskClick(form.id, subtask.id, subtask.title)}
                          className="text-red-500 hover:text-red-700 p-0.5 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addSubtask(form.id)}
                      className="w-full py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Subtask
                    </button>
                  </div>
                </div>

                {/* Department, Assigned, Dates - Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Department */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Department
                    </label>
                    <select
                      value={form.department}
                      onChange={(e) => updateTaskForm(form.id, 'department', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    >
                      <option value="">Select</option>
                      {departments.map((dept: any) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To - Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Assigned To {form.assigned.length > 0 && <span className="font-normal text-gray-400">({form.assigned.length})</span>}
                    </label>
                    <select
                      value=""
                      onChange={(e) => {
                        const personId = e.target.value
                        if (!personId) return
                        const current = form.assigned
                        if (!current.includes(personId)) {
                          updateTaskForm(form.id, 'assigned', [...current, personId])
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    >
                      <option value="">Select assignee</option>
                      {assignees.filter((person: any) => !form.assigned.includes(person.id)).map((person: any) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                    {form.assigned.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {form.assigned.map((id: string) => {
                          const person = assignees.find((a: any) => a.id === id)
                          return (
                            <span key={id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                              {person?.name || id}
                              <button
                                onClick={() => updateTaskForm(form.id, 'assigned', form.assigned.filter((a: string) => a !== id))}
                                className="text-blue-500 hover:text-blue-700 ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => updateTaskForm(form.id, 'startDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Due Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => updateTaskForm(form.id, 'dueDate', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority and Status - Row */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Priority */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Priority
                    </label>
                    <div className="flex gap-1">
                      {(['high', 'medium', 'low'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => updateTaskForm(form.id, 'priority', priority)}
                          className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-0.5 ${
                            form.priority === priority
                              ? priority === 'high' 
                                ? 'bg-red-100 text-red-700 border border-red-500'
                                : priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700 border border-yellow-500'
                                : 'bg-green-100 text-green-700 border border-green-500'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Flag className="w-2.5 h-2.5" />
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-0.5">
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => updateTaskForm(form.id, 'status', e.target.value as TaskForm['status'])}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-[11px] text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-colors"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="hold">Hold</option>
                    </select>
                  </div>
                </div>

                {/* File Attachment - Compact with upload icon */}
                <div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      Attachments
                    </label>
                    <label className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${r2Verified ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'}`}>
                      <Upload className="w-3 h-3" />
                      {r2Verified ? 'Upload' : 'Storage N/A'}
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileChange(form.id, e)}
                        className="hidden"
                        disabled={!r2Verified}
                      />
                    </label>
                    <span className="text-[10px] text-gray-400">(max 10MB)</span>
                  </div>
                  {fileUploadErrors.length > 0 && (
                    <div className="mt-1 p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      {fileUploadErrors.map((err, i) => (
                        <p key={i} className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 shrink-0" /> {err}
                        </p>
                      ))}
                    </div>
                  )}
                  {form.files.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {form.files.map((file, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-700 dark:text-gray-300">
                          <FileText className="w-2.5 h-2.5 text-gray-400" />
                          <span className="truncate max-w-[120px]">{file.name}</span>
                          <button
                            onClick={() => removeFile(form.id, idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {!r2Verified && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Admin must verify R2 credentials in Settings.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Another Task Button - Only show in create mode */}
          {!editTask && (
            <button
              onClick={addTaskForm}
              className="w-full py-1.5 bg-[#b23a48] text-white rounded-lg text-[11px] font-semibold hover:bg-[#8f2e3a] transition-colors flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-3 h-3" /> Add Another Task
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {!editTask && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {taskForms.length} task{taskForms.length !== 1 ? 's' : ''} to create
              </span>
            )}
            <button
              onClick={() => handleSubmit()}
              disabled={createTask.isPending || updateTask.isPending || uploadingFiles}
              className="px-3 py-1 bg-[#b23a48] text-white rounded-lg text-[11px] font-semibold hover:bg-[#8f2e3a] transition-colors shadow-sm disabled:opacity-70"
            >
              {(createTask.isPending || updateTask.isPending) ? (
                <Loader2 className="w-3 h-3 animate-spin mx-auto" />
              ) : uploadingFiles ? (
                <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>
              ) : editTask ? 'Update Task' : `Create Task${taskForms.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Subtask Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteSubtaskConfirm}
        onClose={() => {
          setShowDeleteSubtaskConfirm(false)
          setSubtaskToDelete(null)
        }}
        onConfirm={removeSubtask}
        title="Delete Subtask"
        message={`Are you sure you want to delete "${subtaskToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeletingSubtask}
      />

      {/* Hold Note Modal */}
      {showHoldModal && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-[80]" onClick={() => { setShowHoldModal(false); setHoldNote('') }} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[90] p-6">
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
              <button onClick={() => { setShowHoldModal(false); setHoldNote('') }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={() => { setShowHoldModal(false); handleSubmit(holdNote.trim()) }} disabled={!holdNote.trim() || updateTask.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {updateTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Hold'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
