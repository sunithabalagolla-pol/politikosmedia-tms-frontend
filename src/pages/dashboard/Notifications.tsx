import { useState } from 'react'
import { Bell, CheckCheck, Filter, MoreVertical, X, MessageCircle, UserPlus, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/api/useNotifications'

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
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_ICONS: Record<string, any> = {
  mention: MessageCircle, assignment: UserPlus, comment: MessageCircle, update: AlertCircle
}
const TYPE_COLORS: Record<string, string> = {
  mention: 'bg-teal-50 text-teal-600', assignment: 'bg-[#b23a48]/10 text-[#b23a48]',
  comment: 'bg-green-50 text-green-600', update: 'bg-orange-50 text-orange-600'
}

export default function Notifications() {
  const navigate = useNavigate()
  const location = useLocation()
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useNotifications(filterMode)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const notifications = data?.notifications || []
  const unreadCount = data?.unreadCount || 0

  // Determine the tasks route based on current dashboard
  const getTaskRoute = (refId: string) => {
    if (location.pathname.startsWith('/manager')) return `/manager/tasks?taskId=${refId}`
    if (location.pathname.startsWith('/user')) return `/user/my-tasks?taskId=${refId}`
    return `/dashboard/tasks?taskId=${refId}`
  }

  const handleClick = (n: any) => {
    setSelectedId(n.id)
    if (!n.is_read) markAsRead.mutate(n.id)
    if (n.reference_type === 'task' && n.reference_id) {
      navigate(getTaskRoute(n.reference_id))
    }
  }

  const selected = notifications.find((n: any) => n.id === selectedId)

  const getIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || Bell
    return <Icon className="w-3.5 h-3.5" />
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 z-10 shrink-0 shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Notifications</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Stay updated with your team's activities</p>
        </div>
        {unreadCount > 0 && (
          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-200">{unreadCount} New</span>
        )}
      </header>

      {/* Controls */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setFilterMode('all')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterMode === 'all' ? 'bg-[#b23a48] text-white' : 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 hover:bg-gray-100'}`}>
            <Filter className="w-3 h-3" /> All
          </button>
          <button onClick={() => setFilterMode('unread')}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterMode === 'unread' ? 'bg-[#b23a48] text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            Unread ({unreadCount})
          </button>
        </div>
        <button onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending || unreadCount === 0}
          className="flex items-center gap-2 text-xs text-[#b23a48] hover:text-[#8f2e3a] font-semibold transition-colors disabled:opacity-50">
          <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 mb-3"><Bell className="w-6 h-6" /></div>
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">{filterMode === 'unread' ? 'No unread notifications' : 'No notifications'}</h3>
              <p className="text-xs text-gray-500 max-w-sm">{filterMode === 'unread' ? "You've read all your notifications." : "You're all caught up!"}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((n: any) => (
                <div key={n.id} onClick={() => handleClick(n)}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/30 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'} ${selectedId === n.id ? 'border-l-4 border-[#b23a48]' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type] || 'bg-gray-50 text-gray-600'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-0.5">
                        <p className="text-xs text-gray-900 dark:text-white leading-snug font-medium">{n.title}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">{timeAgo(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{n.message}</p>
                    </div>
                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-[#b23a48] shrink-0 mt-1.5"></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-full md:w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="h-14 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white">Details</h2>
              <button onClick={() => setSelectedId(null)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${TYPE_COLORS[selected.type] || 'bg-gray-50 text-gray-600'}`}>
                  {getIcon(selected.type)}
                </div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1">{selected.title}</h3>
                <p className="text-xs text-gray-500">{timeAgo(selected.created_at)}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{selected.message}</p>
              </div>
              {selected.reference_type === 'task' && selected.reference_id && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1.5"><FileText className="w-3.5 h-3.5 text-gray-500" /><span className="text-xs font-semibold text-gray-500 uppercase">Related Task</span></div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">Task ID: {selected.reference_id.slice(0, 8)}...</p>
                </div>
              )}
              {selected.reference_type === 'task' && selected.reference_id && (
                <button onClick={() => navigate(getTaskRoute(selected.reference_id))}
                  className="w-full px-3 py-2 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-lg text-xs font-medium transition-colors">
                  View Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
