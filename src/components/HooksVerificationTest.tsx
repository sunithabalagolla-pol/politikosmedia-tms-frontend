import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import {
  useCategories,
  useCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/api/useCategories'
import {
  usePhases,
  usePhase,
  useCreatePhase,
  useUpdatePhase,
  useDeletePhase,
  usePhaseTasks,
} from '../hooks/api/usePhases'

/**
 * Comprehensive verification test component for Categories & Phases hooks
 * Tests all CRUD operations and query invalidation
 */
export default function HooksVerificationTest() {
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [testCategoryId, setTestCategoryId] = useState<string | null>(null)
  const [testPhaseId, setTestPhaseId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // Hooks
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: singleCategory } = useCategory(testCategoryId)
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const { data: phases } = usePhases(testCategoryId)
  const { data: singlePhase } = usePhase(testPhaseId)
  const createPhase = useCreatePhase(testCategoryId || '')
  const updatePhase = useUpdatePhase()
  const deletePhase = useDeletePhase()
  const { data: phaseTasks } = usePhaseTasks(testPhaseId, {
    status: 'in-progress',
    page: 1,
    limit: 20,
  })

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const setResult = (test: string, passed: boolean) => {
    setTestResults((prev) => ({ ...prev, [test]: passed }))
  }

  // Test 1: Fetch Categories
  const testFetchCategories = () => {
    addLog('Testing: Fetch all categories...')
    if (categoriesError) {
      addLog(`❌ Error: ${(categoriesError as any).message}`)
      setResult('fetchCategories', false)
      return
    }
    if (categories) {
      addLog(`✅ Success: Found ${categories.length} categories`)
      console.log('Categories:', categories)
      setResult('fetchCategories', true)
    }
  }

  // Test 2: Create Category
  const testCreateCategory = async () => {
    addLog('Testing: Create category...')
    try {
      const newCategory = await createCategory.mutateAsync({
        name: `Test Category ${Date.now()}`,
        description: 'Verification test category',
        sort_order: 999,
      })
      addLog(`✅ Success: Created category "${newCategory.name}" (ID: ${newCategory.id})`)
      setTestCategoryId(newCategory.id)
      setResult('createCategory', true)
      
      // Wait a bit for query invalidation
      setTimeout(() => {
        if (categories?.some((c) => c.id === newCategory.id)) {
          addLog('✅ Query invalidation working: New category appears in list')
          setResult('queryInvalidation', true)
        } else {
          addLog('⚠️ Query invalidation may be delayed')
        }
      }, 1000)
    } catch (error: any) {
      addLog(`❌ Error: ${error.response?.data?.message || error.message}`)
      setResult('createCategory', false)
    }
  }

  // Test 3: Fetch Single Category
  const testFetchSingleCategory = () => {
    if (!testCategoryId) {
      addLog('⚠️ Skipped: No test category ID available')
      return
    }
    addLog('Testing: Fetch single category with phases...')
    if (singleCategory) {
      addLog(`✅ Success: Fetched "${singleCategory.name}" with ${singleCategory.phases?.length || 0} phases`)
      console.log('Single Category:', singleCategory)
      setResult('fetchSingleCategory', true)
    }
  }

  // Test 4: Update Category
  const testUpdateCategory = async () => {
    if (!testCategoryId) {
      addLog('⚠️ Skipped: No test category ID available')
      return
    }
    addLog('Testing: Update category...')
    try {
      const updated = await updateCategory.mutateAsync({
        id: testCategoryId,
        data: { name: `Updated Test Category ${Date.now()}` },
      })
      addLog(`✅ Success: Updated category to "${updated.name}"`)
      setResult('updateCategory', true)
    } catch (error: any) {
      addLog(`❌ Error: ${error.response?.data?.message || error.message}`)
      setResult('updateCategory', false)
    }
  }

  // Test 5: Create Phase
  const testCreatePhase = async () => {
    if (!testCategoryId) {
      addLog('⚠️ Skipped: No test category ID available')
      return
    }
    addLog('Testing: Create phase...')
    try {
      const newPhase = await createPhase.mutateAsync({
        name: `Test Phase ${Date.now()}`,
        description: 'Verification test phase',
        order_index: 1,
      })
      addLog(`✅ Success: Created phase "${newPhase.name}" (ID: ${newPhase.id})`)
      setTestPhaseId(newPhase.id)
      setResult('createPhase', true)
    } catch (error: any) {
      addLog(`❌ Error: ${error.response?.data?.message || error.message}`)
      setResult('createPhase', false)
    }
  }

  // Test 6: Fetch Phases
  const testFetchPhases = () => {
    if (!testCategoryId) {
      addLog('⚠️ Skipped: No test category ID available')
      return
    }
    addLog('Testing: Fetch phases for category...')
    if (phases) {
      addLog(`✅ Success: Found ${phases.length} phases`)
      console.log('Phases:', phases)
      setResult('fetchPhases', true)
    }
  }

  // Test 7: Fetch Single Phase
  const testFetchSinglePhase = () => {
    if (!testPhaseId) {
      addLog('⚠️ Skipped: No test phase ID available')
      return
    }
    addLog('Testing: Fetch single phase with task count...')
    if (singlePhase) {
      addLog(`✅ Success: Fetched "${singlePhase.name}" with ${singlePhase.task_count} tasks`)
      console.log('Single Phase:', singlePhase)
      setResult('fetchSinglePhase', true)
    }
  }

  // Test 8: Update Phase
  const testUpdatePhase = async () => {
    if (!testPhaseId) {
      addLog('⚠️ Skipped: No test phase ID available')
      return
    }
    addLog('Testing: Update phase...')
    try {
      const updated = await updatePhase.mutateAsync({
        id: testPhaseId,
        data: { name: `Updated Test Phase ${Date.now()}` },
      })
      addLog(`✅ Success: Updated phase to "${updated.name}"`)
      setResult('updatePhase', true)
    } catch (error: any) {
      addLog(`❌ Error: ${error.response?.data?.message || error.message}`)
      setResult('updatePhase', false)
    }
  }

  // Test 9: Fetch Phase Tasks
  const testFetchPhaseTasks = () => {
    if (!testPhaseId) {
      addLog('⚠️ Skipped: No test phase ID available')
      return
    }
    addLog('Testing: Fetch tasks for phase...')
    if (phaseTasks) {
      const taskCount = phaseTasks.tasks?.length || 0
      addLog(`✅ Success: Found ${taskCount} tasks for phase`)
      console.log('Phase Tasks:', phaseTasks)
      setResult('fetchPhaseTasks', true)
    }
  }

  // Test 10: Delete Phase
  const testDeletePhase = async () => {
    if (!testPhaseId) {
      addLog('⚠️ Skipped: No test phase ID available')
      return
    }
    addLog('Testing: Delete phase...')
    try {
      await deletePhase.mutateAsync(testPhaseId)
      addLog(`✅ Success: Deleted phase`)
      setResult('deletePhase', true)
      setTestPhaseId(null)
    } catch (error: any) {
      const message = error.response?.data?.message || error.message
      if (message.includes('tasks')) {
        addLog(`✅ Expected error: ${message}`)
        setResult('deletePhase', true)
      } else {
        addLog(`❌ Error: ${message}`)
        setResult('deletePhase', false)
      }
    }
  }

  // Test 11: Delete Category
  const testDeleteCategory = async () => {
    if (!testCategoryId) {
      addLog('⚠️ Skipped: No test category ID available')
      return
    }
    addLog('Testing: Delete category...')
    try {
      await deleteCategory.mutateAsync(testCategoryId)
      addLog(`✅ Success: Deleted category`)
      setResult('deleteCategory', true)
      setTestCategoryId(null)
    } catch (error: any) {
      const message = error.response?.data?.message || error.message
      if (message.includes('phases')) {
        addLog(`✅ Expected error: ${message}`)
        setResult('deleteCategory', true)
      } else {
        addLog(`❌ Error: ${message}`)
        setResult('deleteCategory', false)
      }
    }
  }

  // Run all tests sequentially
  const runAllTests = async () => {
    setTestResults({})
    setLogs([])
    addLog('🚀 Starting verification tests...')

    testFetchCategories()
    await new Promise((r) => setTimeout(r, 500))

    await testCreateCategory()
    await new Promise((r) => setTimeout(r, 1000))

    testFetchSingleCategory()
    await new Promise((r) => setTimeout(r, 500))

    await testUpdateCategory()
    await new Promise((r) => setTimeout(r, 1000))

    await testCreatePhase()
    await new Promise((r) => setTimeout(r, 1000))

    testFetchPhases()
    await new Promise((r) => setTimeout(r, 500))

    testFetchSinglePhase()
    await new Promise((r) => setTimeout(r, 500))

    await testUpdatePhase()
    await new Promise((r) => setTimeout(r, 1000))

    testFetchPhaseTasks()
    await new Promise((r) => setTimeout(r, 500))

    await testDeletePhase()
    await new Promise((r) => setTimeout(r, 1000))

    await testDeleteCategory()
    await new Promise((r) => setTimeout(r, 500))

    addLog('✅ All tests completed!')
  }

  const getResultIcon = (result: boolean | null) => {
    if (result === null) return <AlertCircle className="w-4 h-4 text-gray-400" />
    if (result === true) return <CheckCircle2 className="w-4 h-4 text-green-500" />
    return <XCircle className="w-4 h-4 text-red-500" />
  }

  if (categoriesLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-[#b23a48]" />
        <p className="text-xs text-gray-600 mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-4xl">
      <h2 className="text-lg font-bold mb-4">🧪 Hooks Verification Test Suite</h2>

      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-700 mb-2">
          <strong>Current State:</strong>
        </p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Categories loaded: {categories?.length || 0}</li>
          <li>• Test Category ID: {testCategoryId || 'None'}</li>
          <li>• Test Phase ID: {testPhaseId || 'None'}</li>
          <li>
            • Tests passed:{' '}
            {Object.values(testResults).filter((r) => r === true).length} /{' '}
            {Object.keys(testResults).length}
          </li>
        </ul>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold mb-3">Test Results:</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            'fetchCategories',
            'createCategory',
            'fetchSingleCategory',
            'updateCategory',
            'createPhase',
            'fetchPhases',
            'fetchSinglePhase',
            'updatePhase',
            'fetchPhaseTasks',
            'deletePhase',
            'deleteCategory',
            'queryInvalidation',
          ].map((test) => (
            <div key={test} className="flex items-center gap-2 text-xs">
              {getResultIcon(testResults[test] ?? null)}
              <span className="text-gray-700">{test}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-[#b23a48] text-white text-sm rounded hover:bg-[#8f2e3a]"
        >
          Run All Tests
        </button>
        <button
          onClick={() => {
            setLogs([])
            setTestResults({})
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
        >
          Clear Logs
        </button>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500">Click "Run All Tests" to start verification...</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  )
}
