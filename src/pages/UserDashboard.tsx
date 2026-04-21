import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  ChartLine, LayoutGrid, FileText, ClipboardCheck, Calendar, Building2,
  Settings, HelpCircle, User, Bell, ChevronsLeft, LogOut, Sun, Moon, ArrowLeftRight, Plus
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { usePublicSettings } from '../hooks/api/useSettings'
import CreateTaskModal from '../components/CreateTaskModal'
import SearchBar from '../components/SearchBar'

export default function UserDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, canSwitchView, switchView, user } = useAuth()
  
  // Permission checks
  const canViewDepartments = usePermission('dept:view')
  const canCreateTask = usePermission('task:create')
  
  // Global settings
  const { data: publicSettings } = usePublicSettings()
  const showDepartmentsMenuEmployee = user?.role === 'admin'
    ? publicSettings?.show_departments_menu_admin ?? true
    : publicSettings?.show_departments_menu_employee ?? true
  
  // Combined check: user has permission AND global setting is enabled
  const shouldShowDepartments = canViewDepartments && showDepartmentsMenuEmployee

  const handleLogout = () => { logout() }

  const handleSwitchToManager = () => {
    switchView('manager')
    navigate('/manager/overview')
  }

  // Build menu items dynamically based on permissions
  const baseMenuItems = [
    { path: '/user/overview', icon: ChartLine, label: 'Overview' },
    { path: '/user/my-tasks', icon: ClipboardCheck, label: 'My Tasks' },
    { path: '/user/board', icon: LayoutGrid, label: 'Board' },
    { path: '/user/reports', icon: FileText, label: 'Reports' },
    { path: '/user/calendar', icon: Calendar, label: 'Calendar' },
  ]
  
  // Add Departments if user has permission AND global setting is enabled
  const menuItems = [
    ...baseMenuItems,
    ...(shouldShowDepartments ? [{ path: '/user/departments', icon: Building2, label: 'Departments' }] : []),
    { path: '/user/settings', icon: Settings, label: 'Settings' },
    { path: '/user/help', icon: HelpCircle, label: 'Help' },
    { path: '/user/profile', icon: User, label: 'Profile' }
  ]

  const isActive = (path: string) => location.pathname === path

  const getPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname)
    return currentItem?.label || 'Dashboard'
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`bg-[#b23a48] dark:bg-gray-800 text-white transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-20' : 'w-[200px]'
        } shadow-xl`}
      >
        {/* Sidebar Header */}
        <div className={`bg-[#8e2e39] dark:bg-gray-900 flex items-center shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'px-4 py-2.5 justify-center' : 'px-4 py-2.5 justify-center'}`}>
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            <span className="font-bold text-lg whitespace-nowrap" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.08em' }}>WORKHUB</span>
            <p className="text-xs text-white/60 mt-0 tracking-wider text-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>Employee Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-3 overflow-y-auto space-y-1 scrollbar-hide ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className={`transition-all duration-300 ${sidebarCollapsed ? 'p-0' : 'p-0'}`}>
            <ul className="space-y-0.5">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`group flex items-center gap-3 rounded-lg transition-all duration-200 relative ${
                      isActive(item.path) ? 'bg-[#d4515f] shadow-lg' : 'hover:bg-white/10'
                    } ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-4 py-2'}`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>{item.label}</span>
                    {sidebarCollapsed && (
                      <span className="absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className={`py-1 border-t border-white/10 dark:border-gray-700 shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="space-y-0.5">
            {/* Switch back to Manager View — only for managers/admins */}
            {canSwitchView && (
              <button onClick={handleSwitchToManager}
                className={`group flex items-center gap-3 rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'}`}
                title={sidebarCollapsed ? 'Switch to Manager View' : ''}>
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Manager View</span>
                {sidebarCollapsed && (
                  <span className="absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">Switch to Manager View</span>
                )}
              </button>
            )}
            <button
              className={`flex items-center rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2 justify-end'}`}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <ChevronsLeft className={`w-4 h-4 shrink-0 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={handleLogout}
              className={`group flex items-center gap-3 rounded-lg hover:bg-white/10 transition-all duration-200 w-full relative ${sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-2'}`}
              title={sidebarCollapsed ? 'Logout' : ''}>
              <LogOut className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap font-medium text-xs ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>Logout</span>
              {sidebarCollapsed && (
                <span className="absolute left-full ml-6 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">Logout</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-300">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Dashboard</span>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{getPageTitle()}</span>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">

            {/* Search */}
            <div className="relative hidden md:block w-64">
              <SearchBar />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <Link
              to="/user/notifications"
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* User Avatar */}
            <Link to="/user/profile" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 transition-colors">
              <img
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                alt="User"
                className="w-7 h-7 rounded-full object-cover"
              />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Outlet />
        </main>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={showCreateTaskModal} 
        onClose={() => setShowCreateTaskModal(false)} 
      />
    </div>
  )
}
