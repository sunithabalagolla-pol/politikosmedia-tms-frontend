import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Overview from './pages/dashboard/Overview'
import Tasks from './pages/dashboard/Tasks'
import KanbanBoard from './pages/dashboard/KanbanBoard'
import TeamMembers from './pages/dashboard/TeamMembers'
import Departments from './pages/dashboard/Departments'
import Reports from './pages/dashboard/Reports'
import MyTasks from './pages/dashboard/MyTasks'
import Calendar from './pages/dashboard/Calendar'
import Notifications from './pages/dashboard/Notifications'
import Settings from './pages/dashboard/Settings'
import Help from './pages/dashboard/Help'
import Profile from './pages/dashboard/Profile'
import UserDashboard from './pages/UserDashboard'
import UserOverview from './pages/user-dashboard/Overview'
import UserBoard from './pages/user-dashboard/Board'
import UserReports from './pages/user-dashboard/Reports'
import UserMyTasks from './pages/user-dashboard/MyTasks'
import UserCalendar from './pages/user-dashboard/Calendar'
import UserSettings from './pages/user-dashboard/Settings'
import UserHelp from './pages/user-dashboard/Help'
import UserProfile from './pages/user-dashboard/Profile'
import UserNotifications from './pages/user-dashboard/Notifications'
import ManagerDashboard from './pages/ManagerDashboard'
import ManagerTasks from './pages/manager-dashboard/Tasks'
import ManagerTeamMembers from './pages/manager-dashboard/TeamMembers'
import ChannelPlatform from './pages/dashboard/ChannelPlatform'
import Shows from './pages/dashboard/Shows'
import Progress from './pages/dashboard/Progress'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
          {/* Public */}
          <Route path="/" element={<Login />} />

          {/* Admin Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="admin"><Dashboard /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="team" element={<TeamMembers />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="channels" element={<ChannelPlatform />} />
            <Route path="shows" element={<Shows />} />
            <Route path="progress" element={<Progress />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Manager Dashboard */}
          <Route path="/manager" element={<ProtectedRoute allowedRole="manager"><ManagerDashboard /></ProtectedRoute>}>
            <Route index element={<Navigate to="/manager/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="tasks" element={<ManagerTasks />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="team" element={<ManagerTeamMembers />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="my-tasks" element={<MyTasks />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="channels" element={<ChannelPlatform />} />
            <Route path="shows" element={<Shows />} />
            <Route path="progress" element={<Progress />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Employee Dashboard */}
          <Route path="/user" element={<ProtectedRoute allowedRole="user"><UserDashboard /></ProtectedRoute>}>
            <Route index element={<Navigate to="/user/overview" replace />} />
            <Route path="overview" element={<UserOverview />} />
            <Route path="board" element={<UserBoard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="my-tasks" element={<UserMyTasks />} />
            <Route path="calendar" element={<UserCalendar />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="settings" element={<UserSettings />} />
            <Route path="help" element={<UserHelp />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Routes>
      </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default App
