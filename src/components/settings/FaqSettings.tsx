import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, AlertTriangle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { useAllFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '../../hooks/api/useHelp'

// ── FAQ Form Modal ──
interface FaqFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { question: string; answer: string; is_active: boolean }) => void
  isPending: boolean
  initialData?: { question: string; answer: string; is_active: boolean }
  title: string
}

function FaqFormModal({ isOpen, onClose, onSubmit, isPending, initialData, title }: FaqFormModalProps) {
  const [question, setQuestion] = useState(initialData?.question || '')
  const [answer, setAnswer] = useState(initialData?.answer || '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) { setError('Question and answer are required.'); return }
    if (question.trim().length > 500) { setError('Question must be 500 characters or less.'); return }
    if (answer.trim().length > 5000) { setError('Answer must be 5000 characters or less.'); return }
    setError('')
    onSubmit({ question: question.trim(), answer: answer.trim(), is_active: isActive })
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[60] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-xs text-red-600 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={500}
              placeholder="Enter the FAQ question..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{question.length}/500</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              maxLength={5000}
              placeholder="Enter the FAQ answer..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none dark:bg-gray-700"
            />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{answer.length}/5000</p>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-900 dark:text-white">Active</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-[#b23a48]' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
              {isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save FAQ'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// ── Delete Confirmation Modal ──
function DeleteFaqModal({ isOpen, onClose, onConfirm, isDeleting, faqQuestion }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; isDeleting: boolean; faqQuestion: string
}) {
  if (!isOpen) return null
  return (
    <>
      <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[60] p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Delete FAQ</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          Are you sure you want to permanently delete this FAQ?
          <span className="block mt-1 font-medium text-gray-900 dark:text-white">"{faqQuestion}"</span>
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onClose} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
            {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</> : <><Trash2 className="w-4 h-4" /> Delete</>}
          </button>
        </div>
      </div>
    </>
  )
}


// ── Main FAQ Settings Component ──
export default function FaqSettings() {
  const { data: faqs, isLoading } = useAllFaqs()
  const createFaq = useCreateFaq()
  const updateFaq = useUpdateFaq()
  const deleteFaq = useDeleteFaq()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<any>(null)
  const [deletingFaq, setDeletingFaq] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleCreate = async (data: { question: string; answer: string; is_active: boolean }) => {
    await createFaq.mutateAsync(data)
    setShowCreateModal(false)
  }

  const handleEdit = async (data: { question: string; answer: string; is_active: boolean }) => {
    if (!editingFaq) return
    await updateFaq.mutateAsync({ id: editingFaq.id, ...data })
    setEditingFaq(null)
  }

  const handleDelete = async () => {
    if (!deletingFaq) return
    await deleteFaq.mutateAsync(deletingFaq.id)
    setDeletingFaq(null)
  }

  const handleToggleActive = (faq: any) => {
    updateFaq.mutate({ id: faq.id, is_active: !faq.is_active })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">FAQ Management</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create and manage frequently asked questions visible on the Help & Support page</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" />
          </div>
        ) : !faqs || faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <HelpCircle className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            <p className="text-xs text-gray-400">No FAQs yet. Click "Add FAQ" to create your first one.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {faqs.map((faq: any) => {
              const isInactive = faq.is_active === false
              const isExpanded = expandedId === faq.id
              return (
                <div key={faq.id} className={`${isInactive ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    {/* Expand/collapse toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Question text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isInactive ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {faq.question}
                      </p>
                      {isInactive && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                          Inactive — hidden from employees
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleActive(faq)}
                        title={faq.is_active ? 'Deactivate — hide from employees' : 'Activate — show to employees'}
                        className={`p-1.5 rounded-lg transition-colors ${faq.is_active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {faq.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setEditingFaq(faq)}
                        title="Edit"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingFaq(faq)}
                        title="Delete"
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded answer */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pl-12">
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <FaqFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isPending={createFaq.isPending}
        title="Add New FAQ"
      />

      {editingFaq && (
        <FaqFormModal
          key={editingFaq.id}
          isOpen={true}
          onClose={() => setEditingFaq(null)}
          onSubmit={handleEdit}
          isPending={updateFaq.isPending}
          initialData={{ question: editingFaq.question, answer: editingFaq.answer, is_active: editingFaq.is_active }}
          title="Edit FAQ"
        />
      )}

      <DeleteFaqModal
        isOpen={!!deletingFaq}
        onClose={() => setDeletingFaq(null)}
        onConfirm={handleDelete}
        isDeleting={deleteFaq.isPending}
        faqQuestion={deletingFaq?.question || ''}
      />
    </div>
  )
}
