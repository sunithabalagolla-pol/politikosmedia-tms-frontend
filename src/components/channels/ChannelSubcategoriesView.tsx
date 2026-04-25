import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Layers, Loader2 } from 'lucide-react'
import { useChannel, useSubcategories } from '../../hooks/api'
import { Breadcrumb } from '../tasks/Breadcrumb'

export default function ChannelSubcategoriesView() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const channelId = searchParams.get('channel') || ''

  const { data: channel, isLoading: channelLoading } = useChannel(channelId)
  const { data: subcategories, isLoading: subcategoriesLoading } = useSubcategories(channelId)

  const basePath = location.pathname.startsWith('/manager') ? '/manager/channels' : '/dashboard/channels'

  const handleSubcategoryClick = (subcategoryId: string) => {
    navigate(`${basePath}?channel=${channelId}&subcategory=${subcategoryId}`)
  }

  const handleBack = () => {
    navigate(basePath)
  }

  const isLoading = channelLoading || subcategoriesLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button onClick={handleBack} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Channels
        </button>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">Channel not found</p>
        <button onClick={handleBack} className="px-4 py-2 text-xs font-medium text-[#b23a48] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
          Back to Channels
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={handleBack} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />Back to Channels
      </button>

      {/* Breadcrumb & Header */}
      <div>
        <Breadcrumb items={[
          { label: 'Channels', href: basePath },
          { label: channel.name },
        ]} />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{channel.name}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Select a subcategory to view tasks</p>
      </div>

      {/* Subcategories Grid */}
      {subcategories && subcategories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              onClick={() => handleSubcategoryClick(subcategory.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                <Layers className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {subcategory.name}
                </h3>
                {subcategory.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {subcategory.description}
                  </p>
                )}
                {subcategory.task_count !== undefined && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full text-center">
                    <span className="font-medium">
                      {subcategory.task_count} {subcategory.task_count === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Layers className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Subcategories Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Subcategories help organize tasks within this channel
          </p>
          <button
            onClick={() => navigate(basePath.replace('/channels', '/settings'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
          >
            Go to Settings
          </button>
        </div>
      )}
    </div>
  )
}
