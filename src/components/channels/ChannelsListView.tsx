import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Video, Search, Loader2 } from 'lucide-react'
import { useChannels } from '../../hooks/api'

export default function ChannelsListView() {
  const { data: channels, isLoading } = useChannels()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')

  const basePath = location.pathname.startsWith('/manager') ? '/manager/channels' : '/dashboard/channels'

  const handleChannelClick = (channelId: string) => {
    navigate(`${basePath}?channel=${channelId}`)
  }

  const filteredChannels = channels?.filter(
    (ch) =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[11px] font-bold text-gray-900 dark:text-white mb-1">Channel & Platform</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Select a channel to view subcategories and tasks</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-[11px] font-bold text-gray-900 dark:text-white mb-1">Channel & Platform</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Select a channel to view subcategories and tasks</p>
      </div>

      {/* Search */}
      {channels && channels.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-800"
          />
        </div>
      )}

      {/* Channels Grid */}
      {filteredChannels && filteredChannels.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-1 content-start">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => handleChannelClick(channel.id)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-3 group"
            >
              <div className="flex flex-col items-center text-center space-y-1.5">
                {channel.logo_url ? (
                  <img
                    src={channel.logo_url}
                    alt={channel.name}
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Video className="w-8 h-8 text-[#b23a48] group-hover:scale-110 transition-transform" />
                )}
                <h3 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-[#b23a48] transition-colors leading-tight">
                  {channel.name}
                </h3>
                {channel.description && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                    {channel.description}
                  </p>
                )}
                <div className="text-[10px] text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-gray-700 w-full text-center">
                  <span className="font-medium">
                    {channel.subcategory_count || 0} {(channel.subcategory_count || 0) === 1 ? 'subcategory' : 'subcategories'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">No channels found</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Video className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">No Channels Yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
            Channels help organize content creation across platforms
          </p>
          <button
            onClick={() => navigate(basePath.replace('/channels', '/settings?section=channels'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors"
          >
            Go to Settings
          </button>
        </div>
      )}
    </div>
  )
}
