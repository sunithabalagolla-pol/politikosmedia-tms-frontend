import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  ChartLine,
  ListChecks,
  LayoutGrid,
  Users,
  Building2,
  FileText,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronsLeft,
  Menu,
  X,
  Calendar,
  Sun,
  Moon,
  Video,
  Tv,
  TrendingUp
} from 'lucide-react'
import CreateTaskModal from '../components/CreateTaskModal'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import SearchBar from '../components/SearchBar'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { logout } = useAuth()
  
  // Permission checks
  const canViewDepartments = usePermission('dept:view')
  const canViewChannels = usePermission('channel:view')
  
  // Admin always sees departments menu if they have permission (not affected by role toggles)
  const shouldShowDepartments = canViewDepartments
  const shouldShowChannels = canViewChannels

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 h-screen flex overflow-hidden transition-colors duration-300">
      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-[#b23a48] dark:bg-gray-800 text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static z-30 h-full ${
          collapsed ? 'lg:w-20' : 'lg:w-[200px]'
        } w-[200px] shadow-xl`}
      >
        {/* Sidebar Header */}
        <div className={`bg-[#8e2e39] dark:bg-gray-900 flex items-center shrink-0 transition-all duration-300 ${collapsed ? 'lg:px-4 lg:py-2.5 lg:justify-center' : 'px-4 py-2.5 justify-center'}`}>
          <div className={`transition-all duration-300 ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>
            <span className="font-bold text-lg whitespace-nowrap" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>WORKHUB</span>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button
              className="text-white/70 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 overflow-y-auto space-y-1 scrollbar-hide ${collapsed ? 'lg:px-2' : 'px-3'}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Overview Section */}
          <div className={`transition-all duration-300 ${collapsed ? 'lg:p-0' : 'p-0'}`}>
            <ul className="space-y-0.5">
              <li>
                <Link
                  to="/dashboard/overview"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/overview') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Overview' : ''}
                >
                  <ChartLine className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Overview</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Overview
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/tasks"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/tasks') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Tasks' : ''}
                >
                  <ListChecks className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Tasks</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Tasks
                    </span>
                  )}
                </Link>
              </li>
              {shouldShowChannels && (
                <li>
                  <Link
                    to="/dashboard/channels"
                    className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                      isActive('/dashboard/channels') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                    } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                    title={collapsed ? 'Channel & Platform' : ''}
                  >
                    <Video className="w-4 h-4 shrink-0" />
                    <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Channels</span>
                    {collapsed && (
                      <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        Channel & Platform
                      </span>
                    )}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/dashboard/shows"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/shows') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Shows' : ''}
                >
                  <Tv className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Shows</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Shows
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/kanban"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/kanban') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Board' : ''}
                >
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Task Board</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Task Board
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          {/* Management Section */}
          <div className={`transition-all duration-300 ${collapsed ? 'lg:p-0' : 'p-0'}`}>
            <ul className="space-y-0.5">
              <li>
                <Link
                  to="/dashboard/team"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/team') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Workforce' : ''}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Workforce</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Workforce
                    </span>
                  )}
                </Link>
              </li>
              {shouldShowDepartments && (
                <li>
                  <Link
                    to="/dashboard/departments"
                    className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                      isActive('/dashboard/departments') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                    } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                    title={collapsed ? 'Departments' : ''}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Departments</span>
                    {collapsed && (
                      <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        Departments
                      </span>
                    )}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/dashboard/reports"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/reports') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Reports' : ''}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Reports</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Reports
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/progress"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/progress') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Progress' : ''}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Progress</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Progress
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          {/* Personal Section */}
          <div className={`transition-all duration-300 ${collapsed ? 'lg:p-0' : 'p-0'}`}>
            <ul className="space-y-0.5">
              <li>
                <Link
                  to="/dashboard/calendar"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/calendar') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Calendar' : ''}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Calendar</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Calendar
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>

          {/* System Section */}
          <div className={`transition-all duration-300 ${collapsed ? 'lg:p-0' : 'p-0'}`}>
            <ul className="space-y-0.5">
              <li>
                <Link
                  to="/dashboard/settings"
                  className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                    isActive('/dashboard/settings') ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                  } ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : 'px-4 py-2'}`}
                  title={collapsed ? 'Settings' : ''}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Settings</span>
                  {collapsed && (
                    <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                      Settings
                    </span>
                  )}
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`py-1 border-t border-white/10 dark:border-gray-700 shrink-0 transition-all duration-300 ${collapsed ? 'lg:px-2' : 'px-4'}`}>
          <div className="space-y-0.5">
            <button
              className={`hidden lg:flex items-center rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-4 py-2 justify-end'}`}
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronsLeft className={`w-4 h-4 shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
              {collapsed && (
                <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Expand
                </span>
              )}
            </button>
            <button
              onClick={handleLogout}
              className={`group flex items-center gap-3 rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${collapsed ? 'lg:justify-center lg:px-2 lg:py-2' : 'px-4 py-2'}`}
              title={collapsed ? 'Logout' : ''}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${collapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Logout</span>
              {collapsed && (
                <span className="hidden lg:block absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Header */}
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-3 lg:px-6 z-10 transition-colors duration-300">
          {/* Left: Page Title & Breadcrumb */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-900 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden sm:block">Dashboard</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">/</span>
              <h1 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {location.pathname === '/dashboard/overview' && 'Overview'}
                {location.pathname === '/dashboard/tasks' && 'Tasks'}
                {location.pathname === '/dashboard/kanban' && 'Task Board'}
                {location.pathname === '/dashboard/team' && 'Workforce'}
                {location.pathname === '/dashboard/departments' && 'Departments'}
                {location.pathname === '/dashboard/reports' && 'Reports'}
                {location.pathname === '/dashboard/calendar' && 'Calendar'}
                {location.pathname === '/dashboard/channels' && 'Channel & Platform'}
                {location.pathname === '/dashboard/shows' && 'Shows'}
                {location.pathname === '/dashboard/settings' && 'Settings'}
                {location.pathname === '/dashboard/help' && 'Help & Support'}
                {location.pathname === '/dashboard/profile' && 'Profile'}
                {location.pathname === '/dashboard/notifications' && 'Notifications'}
                {location.pathname === '/dashboard' && 'Overview'}
              </h1>
            </div>
          </div>

          {/* Center: Global Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchBar />
          </div>

          {/* Right: Actions & User */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Link
              to="/dashboard/help"
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Help & Support"
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              to="/dashboard/notifications"
              className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-white focus:outline-none rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              <Bell className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard/profile"
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Profile"
            >
              <img 
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" 
                alt="User" 
                className="w-7 h-7 rounded-full border-2 border-gray-200 hover:border-[#b23a48] transition-colors"
              />
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 lg:p-4 transition-colors duration-300">
          <div className="mx-auto h-full">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={showCreateTaskModal} 
        onClose={() => {
          setShowCreateTaskModal(false)
          setEditingTask(null)
        }}
        editTask={editingTask}
      />
    </div>
  )
}
