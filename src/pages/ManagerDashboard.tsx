import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChartLine, ListChecks, LayoutGrid, Users, FileText, ClipboardCheck,
  Bell, Settings, HelpCircle, User, LogOut, ChevronsLeft, Menu, X, Search, Plus, Calendar, Sun, Moon, Building2, ArrowLeftRight, Video, Tv, TrendingUp
} from 'lucide-react'
import CreateTaskModal from '../components/CreateTaskModal'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { usePublicSettings } from '../hooks/api/useSettings'
import { useRole } from '../hooks/useRole'
import SearchBar from '../components/SearchBar'

export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, switchView } = useAuth()
  
  // Permission check for departments
  const canViewDepartments = usePermission('dept:view')
  const canViewChannels = usePermission('channel:view')
  
  // Global settings
  const { data: publicSettings } = usePublicSettings()
  const { role } = useRole()
  const showDepartmentsMenuManager = role === 'admin'
    ? publicSettings?.show_departments_menu_admin ?? true
    : publicSettings?.show_departments_menu_manager ?? true
  
  // Combined check: user has permission AND global setting is enabled
  const shouldShowDepartments = canViewDepartments && showDepartmentsMenuManager
  const shouldShowChannels = canViewChannels

  const handleLogout = () => { logout() }

  const handleSwitchToEmployee = () => {
    switchView('employee')
    navigate('/user/overview')
  }

  const isActive = (path: string) => location.pathname === path

  const baseMenuItems = [
    { path: '/manager/overview', icon: ChartLine, label: 'Overview' },
    { path: '/manager/tasks', icon: ListChecks, label: 'Tasks' },
    ...(shouldShowChannels ? [{ path: '/manager/channels', icon: Video, label: 'Channels' }] : []),
    { path: '/manager/shows', icon: Tv, label: 'Shows' },
    { path: '/manager/kanban', icon: LayoutGrid, label: 'Task Board' },
    { path: '/manager/team', icon: Users, label: 'Workforce' },
  ]
  
  const menuItems = [
    ...baseMenuItems,
    ...(shouldShowDepartments ? [{ path: '/manager/departments', icon: Building2, label: 'Departments' }] : []),
    { path: '/manager/reports', icon: FileText, label: 'Reports' },
    { path: '/manager/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/manager/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/manager/settings', icon: Settings, label: 'Settings' },
  ]

  const getPageTitle = () => {
    if (location.pathname === '/manager/notifications') return 'Notifications'
    const currentItem = menuItems.find(item => item.path === location.pathname)
    return currentItem?.label || 'Overview'
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-screen flex overflow-hidden transition-colors duration-300">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-[#b23a48] dark:bg-gray-800 text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static z-30 h-full ${collapsed ? 'lg:w-20' : 'lg:w-[200px]'} w-[200px] shadow-xl`}>
        {/* Header */}
        <div className={`bg-[#8e2e39] dark:bg-gray-900 flex items-center shrink-0 transition-all duration-300 ${collapsed ? 'lg:px-4 lg:py-2.5 lg:justify-center' : 'px-4 py-2.5 justify-center'}`}>
          <div className={`transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>
            <span className="font-bold text-lg whitespace-nowrap" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>WORKHUB</span>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button className="text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 overflow-y-auto space-y-0.5 scrollbar-hide ${collapsed ? 'lg:px-2' : 'px-3'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path}
              className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${isActive(item.path) ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'} ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
              title={collapsed ? item.label : ''}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>{item.label}</span>
              {collapsed && (
                <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={`py-1 border-t border-white/10 dark:border-gray-700 shrink-0 transition-all duration-300 ${collapsed ? 'lg:px-2' : 'px-4'}`}>
          <div className="space-y-0.5">
            {/* Switch to Employee View */}
            <button onClick={handleSwitchToEmployee}
              className={`group flex items-center gap-3 rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-4 py-2'}`}
              title={collapsed ? 'Switch to Employee View' : ''}>
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Employee View</span>
              {collapsed && (
                <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">Switch to Employee View</span>
              )}
            </button>
            <button className={`hidden lg:flex items-center rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-4 py-2 justify-end'}`}
              onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <ChevronsLeft className={`w-4 h-4 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={handleLogout}
              className={`group flex items-center gap-3 rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-4 py-2'}`}
              title={collapsed ? 'Logout' : ''}>
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 lg:px-6 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button className="lg:hidden text-gray-500 hover:text-gray-900 focus:outline-none" onClick={() => setSidebarOpen(true)}><Menu className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">Manager</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">/</span>
              <h1 className="text-xs font-bold text-gray-900 dark:text-white truncate">{getPageTitle()}</h1>
            </div>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Link
              to="/manager/help"
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <button onClick={toggleTheme} className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link to="/manager/notifications" className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              <Bell className="w-4 h-4" />
            </Link>
            <Link to="/manager/profile" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Profile">
              <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" alt="User" className="w-7 h-7 rounded-full border-2 border-gray-200 hover:border-[#b23a48] transition-colors" />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 lg:p-4 transition-colors duration-300">
          <div className="mx-auto h-full"><Outlet /></div>
        </div>
      </main>

      <CreateTaskModal isOpen={showCreateTaskModal} onClose={() => { setShowCreateTaskModal(false); setEditingTask(null) }} editTask={editingTask} />
    </div>
  )
}
