import { useCategories, useCreateCategory } from '../hooks/api/useCategories'
import { Loader2 } from 'lucide-react'

/**
 * Test component to verify Categories hooks are working
 * This can be temporarily added to any page to test the API integration
 */
export default function TestCategoriesHooks() {
  const { data: categories, isLoading, error } = useCategories()
  const createCategory = useCreateCategory()

  const handleTestCreate = async () => {
    try {
      await createCategory.mutateAsync({
        name: 'Test Category',
        description: 'This is a test category',
        sort_order: 1,
      })
      alert('Category created successfully!')
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || err.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-5 h-5 animate-spin text-[#b23a48]" />
        <p className="text-xs text-gray-600 mt-2">Loading categories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600">Error: {(error as any).message}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-xs font-semibold mb-3">Categories Hook Test</h3>
      
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">
          Found {categories?.length || 0} categories
        </p>
        {categories && categories.length > 0 && (
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id} className="text-xs text-gray-700">
                • {cat.name} ({cat.phase_count} phases)
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={handleTestCreate}
        disabled={createCategory.isPending}
        className="px-3 py-1.5 bg-[#b23a48] text-white text-xs rounded hover:bg-[#8f2e3a] disabled:opacity-50"
      >
        {createCategory.isPending ? 'Creating...' : 'Test Create Category'}
      </button>
    </div>
  )
}
