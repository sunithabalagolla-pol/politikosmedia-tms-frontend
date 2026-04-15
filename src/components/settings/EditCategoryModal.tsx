import { useState, useEffect } from 'react'
import { X, Loader2, Save, Upload, Image as ImageIcon } from 'lucide-react'
import { useUpdateCategory, useUploadCategoryLogo } from '../../hooks/api/useCategories'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: {
    id: string
    name: string
    description: string
    logo_url?: string | null
  }
}

export default function EditCategoryModal({ isOpen, onClose, category }: EditCategoryModalProps) {
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(category.logo_url || null)
  const [error, setError] = useState('')
  const updateCategory = useUpdateCategory()
  const uploadLogo = useUploadCategoryLogo()

  useEffect(() => {
    if (isOpen) {
      setName(category.name)
      setDescription(category.description || '')
      setLogoPreview(category.logo_url || null)
      setLogoFile(null)
      setError('')
    }
  }, [isOpen, category])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      setLogoFile(file)
      setError('')
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      // Step 1: Update category details
      await updateCategory.mutateAsync({
        id: category.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      })

      // Step 2: Upload new logo if changed
      if (logoFile) {
        await uploadLogo.mutateAsync({
          categoryId: category.id,
          file: logoFile,
        })
      }

      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update category')
    }
  }

  const handleClose = () => {
    if (!updateCategory.isPending && !uploadLogo.isPending) {
      onClose()
    }
  }

  if (!isOpen) return null

  const isLoading = updateCategory.isPending || uploadLogo.isPending

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 z-50 transition-opacity" 
        onClick={handleClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[60] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Edit Category</h3>
          <button
            onClick={handleClose}
            disabled={updateCategory.isPending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Politikos Works"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700"
              disabled={updateCategory.isPending}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
              Description <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this category"
              maxLength={1000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] resize-none dark:bg-gray-700"
              disabled={isLoading}
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
              Logo <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            
            {logoPreview ? (
              <div className="relative inline-block">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-32 h-32 object-contain border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isLoading}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
                {!logoFile && category.logo_url && (
                  <p className="text-xs text-gray-500 mt-2">Current logo • Upload new to replace</p>
                )}
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#b23a48] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Click to upload logo
                  </div>
                  <div className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </div>
                </div>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {uploadLogo.isPending ? 'Uploading logo...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
