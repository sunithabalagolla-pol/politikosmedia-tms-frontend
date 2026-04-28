import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Save, Loader2, CheckCircle2, Shield, X, Check, Wrench, Lock, FolderTree, Bell, User, Video, TrendingUp } from 'lucide-react'
import { useSettings, useUpdateSettings, usePublicSettings, useUpdateDepartmentsMenuManagerSetting, useUpdateDepartmentsMenuEmployeeSetting, useUpdateTicketsCreateManagerSetting, useUpdateTicketsCreateEmployeeSetting, useUpdateTicketsUpdateManagerSetting, useUpdateTicketsUpdateEmployeeSetting, useUpdateTicketsViewManagerSetting, useUpdateTicketsViewEmployeeSetting, useUpdateTicketsDeleteManagerSetting, useUpdateTicketsDeleteEmployeeSetting, useUpdateTeamAddManagerSetting, useUpdateTeamAddEmployeeSetting, useUpdateTeamEditManagerSetting, useUpdateTeamEditEmployeeSetting, useUpdateTeamDeactivateManagerSetting, useUpdateTeamDeactivateEmployeeSetting } from '../../hooks/api/useSettings'
import { usePermissions, useUpdatePermissions } from '../../hooks/api/usePermissions'
import { useRole } from '../../hooks/useRole'
import axiosInstance from '../../api/axiosInstance'
import CategoriesPhasesSettings from '../../components/settings/CategoriesPhasesSettings'
import ChannelSettings from '../../components/settings/ChannelSettings'
import ProgressSettings from '../../components/settings/ProgressSettings'

export default function Settings() {
  const { isAdmin, isAdminOrManager } = useRole()
  const qc = useQueryClient()
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: publicSettings } = usePublicSettings()
  const updateDepartmentsMenuManager = useUpdateDepartmentsMenuManagerSetting()
  const updateDepartmentsMenuEmployee = useUpdateDepartmentsMenuEmployeeSetting()
  const updateTicketsCreateManager = useUpdateTicketsCreateManagerSetting()
  const updateTicketsCreateEmployee = useUpdateTicketsCreateEmployeeSetting()
  const updateTicketsUpdateManager = useUpdateTicketsUpdateManagerSetting()
  const updateTicketsUpdateEmployee = useUpdateTicketsUpdateEmployeeSetting()
  const updateTicketsViewManager = useUpdateTicketsViewManagerSetting()
  const updateTicketsViewEmployee = useUpdateTicketsViewEmployeeSetting()
  const updateTicketsDeleteManager = useUpdateTicketsDeleteManagerSetting()
  const updateTicketsDeleteEmployee = useUpdateTicketsDeleteEmployeeSetting()
  const updateTeamAddManager = useUpdateTeamAddManagerSetting()
  const updateTeamAddEmployee = useUpdateTeamAddEmployeeSetting()
  const updateTeamEditManager = useUpdateTeamEditManagerSetting()
  const updateTeamEditEmployee = useUpdateTeamEditEmployeeSetting()
  const updateTeamDeactivateManager = useUpdateTeamDeactivateManagerSetting()
  const updateTeamDeactivateEmployee = useUpdateTeamDeactivateEmployeeSetting()
  const [activeTab, setActiveTab] = useState<'notifications' | 'app' | 'permissions' | 'categories' | 'channels' | 'progress'>('notifications')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [saved, setSaved] = useState(false)
  const [showDepartmentsMenuManager, setShowDepartmentsMenuManager] = useState(true)
  const [showDepartmentsMenuEmployee, setShowDepartmentsMenuEmployee] = useState(true)
  const [showTicketsCreateManager, setShowTicketsCreateManager] = useState(true)
  const [showTicketsCreateEmployee, setShowTicketsCreateEmployee] = useState(true)
  const [showTicketsUpdateManager, setShowTicketsUpdateManager] = useState(true)
  const [showTicketsUpdateEmployee, setShowTicketsUpdateEmployee] = useState(true)
  const [showTicketsViewManager, setShowTicketsViewManager] = useState(true)
  const [showTicketsViewEmployee, setShowTicketsViewEmployee] = useState(true)
  const [showTicketsDeleteManager, setShowTicketsDeleteManager] = useState(true)
  const [showTicketsDeleteEmployee, setShowTicketsDeleteEmployee] = useState(true)
  const [showTeamAddManager, setShowTeamAddManager] = useState(true)
  const [showTeamAddEmployee, setShowTeamAddEmployee] = useState(true)
  const [showTeamEditManager, setShowTeamEditManager] = useState(true)
  const [showTeamEditEmployee, setShowTeamEditEmployee] = useState(true)
  const [showTeamDeactivateManager, setShowTeamDeactivateManager] = useState(true)
  const [showTeamDeactivateEmployee, setShowTeamDeactivateEmployee] = useState(true)

  // Azure AD state (admin only)
  const [azureClientId, setAzureClientId] = useState('')
  const [azureTenantId, setAzureTenantId] = useState('')
  const [azureSaving, setAzureSaving] = useState(false)
  const [azureSaved, setAzureSaved] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [azureSettingsLoading, setAzureSettingsLoading] = useState(false)
  const [azureVerified, setAzureVerified] = useState(false)

  // R2 Storage state (admin only)
  const [r2AccountId, setR2AccountId] = useState('')
  const [r2AccessKeyId, setR2AccessKeyId] = useState('')
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState('')
  const [r2BucketName, setR2BucketName] = useState('')
  const [r2PublicUrl, setR2PublicUrl] = useState('')
  const [r2Saving, setR2Saving] = useState(false)
  const [r2Saved, setR2Saved] = useState(false)
  const [r2TestStatus, setR2TestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [r2TestMessage, setR2TestMessage] = useState('')
  const [r2Verified, setR2Verified] = useState(false)
  const [r2AccessKeyChanged, setR2AccessKeyChanged] = useState(false)
  const [r2SecretKeyChanged, setR2SecretKeyChanged] = useState(false)

  // Permissions state (admin only)
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const updatePermissions = useUpdatePermissions()
  const [permissions, setPermissions] = useState<any[]>([])
  const [originalPermissions, setOriginalPermissions] = useState<any[]>([])
  const [permissionsSaved, setPermissionsSaved] = useState(false)

  // URL-based section navigation
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && ['notifications', 'categories', 'channels', 'app', 'permissions', 'progress'].includes(section)) {
      setActiveTab(section as any)
    }
  }, [])

  const handleSectionChange = (section: string) => {
    setActiveTab(section as any)
    if (section === 'notifications') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ section }, { replace: true })
    }
  }

  // Debug logging
  useEffect(() => {
    console.log('🔍 Permissions Debug:', {
      isAdmin: isAdmin(),
      permissionsData,
      permissionsLoading,
      permissionsState: permissions,
      permissionsLength: permissions.length,
      groupedPermissions: permissions.length > 0 ? permissions.reduce((acc: any, perm: any) => {
        if (!acc[perm.group_name]) acc[perm.group_name] = []
        acc[perm.group_name].push(perm)
        return acc
      }, {}) : {}
    })
  }, [permissionsData, permissionsLoading, permissions])

  useEffect(() => {
    if (permissionsData) {
      console.log('✅ Setting permissions from data:', permissionsData)
      setPermissions(permissionsData)
      setOriginalPermissions(JSON.parse(JSON.stringify(permissionsData)))
    }
  }, [permissionsData])

  const fetchAdminSettings = async () => {
    try {
      const res = await axiosInstance.get('/api/settings')
      const data: any[] = res.data?.data || []
      const find = (key: string) => data.find((s: any) => s.key === key)
      setAzureClientId(find('azure_client_id')?.value || '')
      setAzureTenantId(find('azure_tenant_id')?.value || '')
      setAzureVerified(find('azure_client_id')?.is_verified === true || find('azure_tenant_id')?.is_verified === true)
      const r2AccKey = find('r2_access_key_id')
      const r2SecKey = find('r2_secret_access_key')
      setR2AccountId(find('r2_account_id')?.value || '')
      setR2AccessKeyId(r2AccKey?.value ? '••••••••' : '')
      setR2SecretAccessKey(r2SecKey?.value ? '••••••••' : '')
      setR2BucketName(find('r2_bucket_name')?.value || '')
      setR2PublicUrl(find('r2_public_url')?.value || '')
      setR2Verified(find('r2_account_id')?.is_verified === true)
      // Reset change flags — fields are now showing masked placeholders, not real values
      setR2AccessKeyChanged(false)
      setR2SecretKeyChanged(false)
    } catch {}
  }

  useEffect(() => {
    if (!isAdmin()) return
    setAzureSettingsLoading(true)
    fetchAdminSettings().finally(() => setAzureSettingsLoading(false))
  }, [])

  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications ?? true)
      setPushNotifications(settings.push_notifications ?? true)
    }
  }, [settings])

  // Load show_departments_menu and ticket settings from public settings
  useEffect(() => {
    if (publicSettings) {
      console.log('📦 Loading public settings:', publicSettings)
      setShowDepartmentsMenuManager(publicSettings.show_departments_menu_manager ?? true)
      setShowDepartmentsMenuEmployee(publicSettings.show_departments_menu_employee ?? true)
      setShowTicketsCreateManager(publicSettings.show_tickets_create_manager ?? true)
      setShowTicketsCreateEmployee(publicSettings.show_tickets_create_employee ?? true)
      setShowTicketsUpdateManager(publicSettings.show_tickets_update_manager ?? true)
      setShowTicketsUpdateEmployee(publicSettings.show_tickets_update_employee ?? true)
      setShowTicketsViewManager(publicSettings.show_tickets_view_manager ?? true)
      setShowTicketsViewEmployee(publicSettings.show_tickets_view_employee ?? true)
      setShowTicketsDeleteManager(publicSettings.show_tickets_delete_manager ?? true)
      setShowTicketsDeleteEmployee(publicSettings.show_tickets_delete_employee ?? true)
      setShowTeamAddManager(publicSettings.show_team_add_manager ?? true)
      setShowTeamAddEmployee(publicSettings.show_team_add_employee ?? true)
      setShowTeamEditManager(publicSettings.show_team_edit_manager ?? true)
      setShowTeamEditEmployee(publicSettings.show_team_edit_employee ?? true)
      setShowTeamDeactivateManager(publicSettings.show_team_deactivate_manager ?? true)
      setShowTeamDeactivateEmployee(publicSettings.show_team_deactivate_employee ?? true)
      console.log('✅ Team settings loaded:', {
        show_team_add_manager: publicSettings.show_team_add_manager,
        show_team_add_employee: publicSettings.show_team_add_employee,
        show_team_edit_manager: publicSettings.show_team_edit_manager,
        show_team_edit_employee: publicSettings.show_team_edit_employee,
        show_team_deactivate_manager: publicSettings.show_team_deactivate_manager,
        show_team_deactivate_employee: publicSettings.show_team_deactivate_employee,
      })
    }
  }, [publicSettings])

  const handleSave = async () => {
    await updateSettings.mutateAsync({ email_notifications: emailNotifications, push_notifications: pushNotifications })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDepartmentsMenuManagerToggle = async (value: boolean) => {
    try {
      await updateDepartmentsMenuManager.mutateAsync(value)
      setShowDepartmentsMenuManager(value)
    } catch (err) {
      console.error('Failed to update departments menu manager setting:', err)
    }
  }

  const handleDepartmentsMenuEmployeeToggle = async (value: boolean) => {
    try {
      await updateDepartmentsMenuEmployee.mutateAsync(value)
      setShowDepartmentsMenuEmployee(value)
    } catch (err) {
      console.error('Failed to update departments menu employee setting:', err)
    }
  }

  const handleTicketsCreateManagerToggle = async (value: boolean) => {
    try {
      await updateTicketsCreateManager.mutateAsync(value)
      setShowTicketsCreateManager(value)
    } catch (err) {
      console.error('Failed to update tickets create manager setting:', err)
    }
  }

  const handleTicketsCreateEmployeeToggle = async (value: boolean) => {
    try {
      await updateTicketsCreateEmployee.mutateAsync(value)
      setShowTicketsCreateEmployee(value)
    } catch (err) {
      console.error('Failed to update tickets create employee setting:', err)
    }
  }

  const handleTicketsUpdateManagerToggle = async (value: boolean) => {
    try {
      await updateTicketsUpdateManager.mutateAsync(value)
      setShowTicketsUpdateManager(value)
    } catch (err) {
      console.error('Failed to update tickets update manager setting:', err)
    }
  }

  const handleTicketsUpdateEmployeeToggle = async (value: boolean) => {
    try {
      await updateTicketsUpdateEmployee.mutateAsync(value)
      setShowTicketsUpdateEmployee(value)
    } catch (err) {
      console.error('Failed to update tickets update employee setting:', err)
    }
  }

  const handleTicketsViewManagerToggle = async (value: boolean) => {
    try {
      await updateTicketsViewManager.mutateAsync(value)
      setShowTicketsViewManager(value)
    } catch (err) {
      console.error('Failed to update tickets view manager setting:', err)
    }
  }

  const handleTicketsViewEmployeeToggle = async (value: boolean) => {
    try {
      await updateTicketsViewEmployee.mutateAsync(value)
      setShowTicketsViewEmployee(value)
    } catch (err) {
      console.error('Failed to update tickets view employee setting:', err)
    }
  }

  const handleTicketsDeleteManagerToggle = async (value: boolean) => {
    try {
      await updateTicketsDeleteManager.mutateAsync(value)
      setShowTicketsDeleteManager(value)
    } catch (err) {
      console.error('Failed to update tickets delete manager setting:', err)
    }
  }

  const handleTicketsDeleteEmployeeToggle = async (value: boolean) => {
    try {
      await updateTicketsDeleteEmployee.mutateAsync(value)
      setShowTicketsDeleteEmployee(value)
    } catch (err) {
      console.error('Failed to update tickets delete employee setting:', err)
    }
  }

  // Team Management toggle handlers
  const handleTeamAddManagerToggle = async (value: boolean) => {
    try {
      await updateTeamAddManager.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team add manager setting:', err)
    }
  }

  const handleTeamAddEmployeeToggle = async (value: boolean) => {
    try {
      await updateTeamAddEmployee.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team add employee setting:', err)
    }
  }

  const handleTeamEditManagerToggle = async (value: boolean) => {
    try {
      await updateTeamEditManager.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team edit manager setting:', err)
    }
  }

  const handleTeamEditEmployeeToggle = async (value: boolean) => {
    try {
      await updateTeamEditEmployee.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team edit employee setting:', err)
    }
  }

  const handleTeamDeactivateManagerToggle = async (value: boolean) => {
    try {
      await updateTeamDeactivateManager.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team deactivate manager setting:', err)
    }
  }

  const handleTeamDeactivateEmployeeToggle = async (value: boolean) => {
    try {
      await updateTeamDeactivateEmployee.mutateAsync(value)
    } catch (err) {
      console.error('Failed to update team deactivate employee setting:', err)
    }
  }

  const handleTestConnection = async () => {
    setTestStatus('loading')
    setTestMessage('')
    try {
      const res = await axiosInstance.post('/api/settings/azure/test')
      setTestStatus('success')
      setTestMessage(res.data?.message || 'Azure connection successful')
      await fetchAdminSettings()
    } catch (err: any) {
      setTestStatus('error')
      setTestMessage(err.response?.data?.message || 'Connection failed. Check your credentials.')
      await fetchAdminSettings()
    }
  }

  const handleSaveAzure = async () => {
    setAzureSaving(true)
    setTestStatus('idle')
    setTestMessage('')
    setAzureVerified(false)
    try {
      await axiosInstance.put('/api/settings/azure/bulk', { azure_client_id: azureClientId, azure_tenant_id: azureTenantId })
      setTestStatus('loading')
      setTestMessage('Saved. Verifying connection...')
      try {
        const res = await axiosInstance.post('/api/settings/azure/test')
        setTestStatus('success')
        setTestMessage(res.data?.message || 'Credentials saved and verified ✅')
      } catch {
        setTestStatus('error')
        setTestMessage('Credentials saved but connection test failed. Please verify your Client ID and Tenant ID.')
      }
      await fetchAdminSettings()
      setAzureSaved(true)
      setTimeout(() => setAzureSaved(false), 2000)
    } catch (err: any) {
      setTestStatus('error')
      setTestMessage(err.response?.data?.message || 'Failed to save credentials. Please try again.')
    } finally {
      setAzureSaving(false)
    }
  }

  const handleSaveR2 = async () => {
    setR2Saving(true)
    setR2TestStatus('idle')
    setR2TestMessage('')
    setR2Verified(false)
    try {
      const body: Record<string, string> = { r2_account_id: r2AccountId, r2_bucket_name: r2BucketName, r2_public_url: r2PublicUrl }
      // Only include key fields if they were explicitly changed AND are not the masked placeholder
      if (r2AccessKeyChanged && r2AccessKeyId !== '••••••••') body.r2_access_key_id = r2AccessKeyId
      if (r2SecretKeyChanged && r2SecretAccessKey !== '••••••••') body.r2_secret_access_key = r2SecretAccessKey
      await axiosInstance.put('/api/settings/r2/bulk', body)
      setR2TestStatus('loading')
      setR2TestMessage('Saved. Verifying connection...')
      try {
        const res = await axiosInstance.post('/api/settings/r2/test')
        setR2TestStatus('success')
        setR2TestMessage(res.data?.message || 'R2 credentials saved and verified ✅')
        // Invalidate public-settings cache so r2_verified propagates immediately
        // to TaskDetailPanel, Profile, and CreateTaskModal without waiting 5 min
        qc.invalidateQueries({ queryKey: ['public-settings'] })
      } catch {
        setR2TestStatus('error')
        setR2TestMessage('Credentials saved but R2 connection test failed. Please verify your Account ID and Access Keys.')
      }
      await fetchAdminSettings()
      setR2Saved(true)
      setTimeout(() => setR2Saved(false), 2000)
    } catch (err: any) {
      setR2TestStatus('error')
      setR2TestMessage(err.response?.data?.message || 'Failed to save R2 credentials.')
    } finally {
      setR2Saving(false)
    }
  }

  const handleTestR2 = async () => {
    setR2TestStatus('loading')
    setR2TestMessage('')
    try {
      const res = await axiosInstance.post('/api/settings/r2/test')
      setR2TestStatus('success')
      setR2TestMessage(res.data?.message || 'R2 endpoint is reachable')
      await fetchAdminSettings()
      qc.invalidateQueries({ queryKey: ['public-settings'] })
    } catch (err: any) {
      setR2TestStatus('error')
      setR2TestMessage(err.response?.data?.message || 'R2 connection failed. Check your credentials.')
      await fetchAdminSettings()
    }
  }

  const togglePermission = (permissionKey: string, role: 'manager' | 'employee') => {
    setPermissions(prev => prev.map(p => 
      p.permission_key === permissionKey 
        ? { ...p, [role]: !p[role] }
        : p
    ))
  }

  const handleSavePermissions = async () => {
    const changes = permissions.filter((p, idx) => {
      const orig = originalPermissions[idx]
      return p.manager !== orig.manager || p.employee !== orig.employee
    }).map(p => ({
      permission_key: p.permission_key,
      manager: p.manager,
      employee: p.employee,
    }))

    if (changes.length === 0) return

    try {
      await updatePermissions.mutateAsync(changes)
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)))
      setPermissionsSaved(true)
      setTimeout(() => setPermissionsSaved(false), 2000)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update permissions')
    }
  }

  const handleResetPermissions = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)))
  }

  const changesCount = Array.isArray(permissions) ? permissions.filter((p, idx) => {
    const orig = originalPermissions[idx]
    return p.manager !== orig.manager || p.employee !== orig.employee
  }).length : 0

  // Group permissions by group_name
  const groupedPermissions = Array.isArray(permissions) ? permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.group_name]) acc[perm.group_name] = []
    acc[perm.group_name].push(perm)
    return acc
  }, {}) : {}

  if (isLoading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" /></div>

  return (
    <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <aside className="w-56 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 space-y-6">
        {/* Personal Section */}
        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
            <User className="w-3 h-3" /> Personal
          </p>
          <nav className="space-y-0.5">
            <button onClick={() => handleSectionChange('notifications')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'notifications' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <Bell className="w-3.5 h-3.5" /> Notifications
            </button>
          </nav>
        </div>

        {/* Workspace Section */}
        {isAdminOrManager() && (
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
              <FolderTree className="w-3 h-3" /> Workspace
            </p>
            <nav className="space-y-0.5">
              <button onClick={() => handleSectionChange('categories')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'categories' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <FolderTree className="w-3.5 h-3.5" /> Categories & Phases
              </button>
              <button onClick={() => handleSectionChange('channels')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'channels' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <Video className="w-3.5 h-3.5" /> Channels
              </button>
              <button onClick={() => handleSectionChange('progress')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'progress' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <TrendingUp className="w-3.5 h-3.5" /> Progress
              </button>
            </nav>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin() && (
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-3 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Admin
            </p>
            <nav className="space-y-0.5">
              <button onClick={() => handleSectionChange('app')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'app' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <Wrench className="w-3.5 h-3.5" /> App Configuration
              </button>
              <button onClick={() => handleSectionChange('permissions')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'permissions' ? 'bg-[#b23a48]/10 text-[#b23a48]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                <Shield className="w-3.5 h-3.5" /> Permissions
              </button>
            </nav>
          </div>
        )}
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div>

          {/* ═══════ TAB: Notifications ═══════ */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Notifications</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage how you receive notifications</p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white">Email Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates via email</p>
                    </div>
                    <button onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? 'bg-[#b23a48]' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white">Push Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive browser notifications</p>
                    </div>
                    <button onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-[#b23a48]' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} disabled={updateSettings.isPending}
                  className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-70 ${saved ? 'bg-green-500 hover:bg-green-600' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'}`}>
                  {updateSettings.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ═══════ TAB: App Configuration (Admin only) ═══════ */}
          {activeTab === 'app' && isAdmin() && (
            <div className="space-y-6">
              {/* Azure AD Configuration */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="mb-6 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#b23a48] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Azure AD Configuration</h2>
                      {azureVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">🟢 Verified</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">🔴 Unverified</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Configure Microsoft SSO credentials. Changes take effect within 60 seconds — no server restart needed.</p>
                  </div>
                </div>

                {azureSettingsLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Azure Client ID</label>
                      <input type="text" value={azureClientId} onChange={e => { setAzureClientId(e.target.value); setTestStatus('idle'); setAzureVerified(false) }}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Azure Tenant ID</label>
                      <input type="text" value={azureTenantId} onChange={e => { setAzureTenantId(e.target.value); setTestStatus('idle'); setAzureVerified(false) }}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    {testStatus !== 'idle' && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium ${testStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : testStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        {testStatus === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        {testStatus === 'success' && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {testStatus === 'error' && <X className="w-3.5 h-3.5 shrink-0" />}
                        {testStatus === 'loading' ? 'Testing connection...' : testMessage}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={handleSaveAzure} disabled={azureSaving || !azureClientId || !azureTenantId}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${azureSaved ? 'bg-green-500' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'}`}>
                        {azureSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : azureSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {azureSaved ? 'Saved!' : 'Save'}
                      </button>
                      <button onClick={handleTestConnection} disabled={testStatus === 'loading' || !azureClientId || !azureTenantId}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {testStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Test Connection'}
                      </button>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Auto-tests after save</p>
                    </div>
                  </div>
                )}
              </div>

              {/* R2 Storage Configuration */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="mb-6 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#b23a48] mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">R2 Storage Configuration</h2>
                      {r2Verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">🟢 Verified</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">🔴 Unverified</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Configure Cloudflare R2 for file uploads (avatars, attachments). Uploads won't work until this is configured.</p>
                  </div>
                </div>

                {azureSettingsLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Account ID</label>
                      <input type="text" value={r2AccountId} onChange={e => { setR2AccountId(e.target.value); setR2TestStatus('idle'); setR2Verified(false) }}
                        placeholder="Cloudflare Account ID"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Access Key ID</label>
                      <input type="password" value={r2AccessKeyId}
                        onChange={e => {
                          const val = e.target.value
                          if (r2AccessKeyId === '••••••••') { setR2AccessKeyId(val.slice(-1)); setR2AccessKeyChanged(true) }
                          else { setR2AccessKeyId(val); setR2AccessKeyChanged(true) }
                          setR2TestStatus('idle'); setR2Verified(false)
                        }}
                        placeholder="R2 Access Key ID"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Secret Access Key</label>
                      <input type="password" value={r2SecretAccessKey}
                        onChange={e => {
                          const val = e.target.value
                          if (r2SecretAccessKey === '••••••••') { setR2SecretAccessKey(val.slice(-1)); setR2SecretKeyChanged(true) }
                          else { setR2SecretAccessKey(val); setR2SecretKeyChanged(true) }
                          setR2TestStatus('idle'); setR2Verified(false)
                        }}
                        placeholder="R2 Secret Access Key"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Bucket Name <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={r2BucketName} onChange={e => { setR2BucketName(e.target.value); setR2TestStatus('idle'); setR2Verified(false) }}
                        placeholder="workhub-uploads"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">Public URL <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="text" value={r2PublicUrl} onChange={e => { setR2PublicUrl(e.target.value); setR2TestStatus('idle'); setR2Verified(false) }}
                        placeholder="https://cdn.yourdomain.com"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] dark:bg-gray-700" />
                    </div>
                    {r2TestStatus !== 'idle' && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium ${r2TestStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : r2TestStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        {r2TestStatus === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                        {r2TestStatus === 'success' && <Check className="w-3.5 h-3.5 shrink-0" />}
                        {r2TestStatus === 'error' && <X className="w-3.5 h-3.5 shrink-0" />}
                        {r2TestStatus === 'loading' ? 'Testing R2 connection...' : r2TestMessage}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={handleSaveR2} disabled={r2Saving || !r2AccountId}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${r2Saved ? 'bg-green-500' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'}`}>
                        {r2Saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : r2Saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {r2Saved ? 'Saved!' : 'Save R2 Settings'}
                      </button>
                      <button onClick={handleTestR2} disabled={r2TestStatus === 'loading'}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {r2TestStatus === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Test Connection'}
                      </button>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Auto-tests after save</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB: Permissions (Admin only) ═══════ */}
          {activeTab === 'permissions' && isAdmin() && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Permission Matrix</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Control what each role can do in WorkHub</p>
                </div>

                {permissionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Permission Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">Permission</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Admin</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Manager</th>
                            <th className="text-center py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Employee</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(groupedPermissions).map(([groupName, perms]: [string, any]) => (
                            <>
                              {/* Group Header */}
                              <tr key={`group-${groupName}`} className="bg-gray-50 dark:bg-gray-700/50">
                                <td colSpan={4} className="py-2 px-4 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                  {groupName}
                                </td>
                              </tr>
                              {/* Permissions in Group */}
                              {perms.map((perm: any) => {
                                // Check if this is a Support Tickets permission that needs visibility controls
                                const isTicketPermission = groupName.toLowerCase().includes('support')
                                
                                return (
                                  <tr key={perm.permission_key} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="py-3 px-4 text-xs text-gray-900 dark:text-white">
                                      {perm.label}
                                    </td>
                                    {/* Admin - Always Locked */}
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center justify-center" title="Admin always has full access">
                                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                                      </div>
                                    </td>
                                    {/* Manager - Clickable (with visibility control for tickets/team) */}
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={async () => {
                                          togglePermission(perm.permission_key, 'manager')
                                          // Also toggle visibility setting for ticket permissions
                                          if (isTicketPermission) {
                                            const newValue = !perm.manager
                                            if (perm.permission_key === 'ticket:create') await handleTicketsCreateManagerToggle(newValue)
                                            else if (perm.permission_key === 'ticket:update') await handleTicketsUpdateManagerToggle(newValue)
                                            else if (perm.permission_key === 'ticket:view') await handleTicketsViewManagerToggle(newValue)
                                            else if (perm.permission_key === 'ticket:delete') await handleTicketsDeleteManagerToggle(newValue)
                                          }
                                          // Also toggle visibility setting for team permissions
                                          const isTeamPermission = groupName.toLowerCase().includes('team')
                                          if (isTeamPermission) {
                                            const newValue = !perm.manager
                                            if (perm.permission_key === 'team:add_member') await handleTeamAddManagerToggle(newValue)
                                            else if (perm.permission_key === 'team:edit_member') await handleTeamEditManagerToggle(newValue)
                                            else if (perm.permission_key === 'team:deactivate') await handleTeamDeactivateManagerToggle(newValue)
                                          }
                                        }}
                                        className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors hover:border-[#b23a48] focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20"
                                        style={{
                                          borderColor: perm.manager ? '#b23a48' : '#d1d5db',
                                          backgroundColor: perm.manager ? '#b23a48' : 'transparent',
                                        }}
                                      >
                                        {perm.manager && <Check className="w-3 h-3 text-white" />}
                                      </button>
                                    </td>
                                    {/* Employee - Clickable (with visibility control for tickets/team) */}
                                    <td className="py-3 px-4 text-center">
                                      <button
                                        onClick={async () => {
                                          togglePermission(perm.permission_key, 'employee')
                                          // Also toggle visibility setting for ticket permissions
                                          if (isTicketPermission) {
                                            const newValue = !perm.employee
                                            if (perm.permission_key === 'ticket:create') await handleTicketsCreateEmployeeToggle(newValue)
                                            else if (perm.permission_key === 'ticket:update') await handleTicketsUpdateEmployeeToggle(newValue)
                                            else if (perm.permission_key === 'ticket:view') await handleTicketsViewEmployeeToggle(newValue)
                                            else if (perm.permission_key === 'ticket:delete') await handleTicketsDeleteEmployeeToggle(newValue)
                                          }
                                          // Also toggle visibility setting for team permissions
                                          const isTeamPermission = groupName.toLowerCase().includes('team')
                                          if (isTeamPermission) {
                                            const newValue = !perm.employee
                                            if (perm.permission_key === 'team:add_member') await handleTeamAddEmployeeToggle(newValue)
                                            else if (perm.permission_key === 'team:edit_member') await handleTeamEditEmployeeToggle(newValue)
                                            else if (perm.permission_key === 'team:deactivate') await handleTeamDeactivateEmployeeToggle(newValue)
                                          }
                                        }}
                                        className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors hover:border-[#b23a48] focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20"
                                        style={{
                                          borderColor: perm.employee ? '#b23a48' : '#d1d5db',
                                          backgroundColor: perm.employee ? '#b23a48' : 'transparent',
                                        }}
                                      >
                                        {perm.employee && <Check className="w-3 h-3 text-white" />}
                                      </button>
                                    </td>
                                  </tr>
                                )
                              })}
                              {/* Show Departments Menu Row - Only after Department Management group */}
                              {groupName.toLowerCase().includes('department') && (
                                <tr className="border-b border-gray-100 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-900/10">
                                  <td className="py-3 px-4 text-xs text-gray-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                      <span>Show Departments Menu</span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 italic">(UI visibility control)</span>
                                    </div>
                                  </td>
                                  {/* Admin - Always Visible */}
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center" title="Admin always sees departments menu">
                                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                                    </div>
                                  </td>
                                  {/* Manager - Toggle */}
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => handleDepartmentsMenuManagerToggle(!showDepartmentsMenuManager)}
                                      disabled={updateDepartmentsMenuManager.isPending}
                                      className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors hover:border-[#b23a48] focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 disabled:opacity-50"
                                      style={{
                                        borderColor: showDepartmentsMenuManager ? '#b23a48' : '#d1d5db',
                                        backgroundColor: showDepartmentsMenuManager ? '#b23a48' : 'transparent',
                                      }}
                                    >
                                      {showDepartmentsMenuManager && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                  </td>
                                  {/* Employee - Toggle */}
                                  <td className="py-3 px-4 text-center">
                                    <button
                                      onClick={() => handleDepartmentsMenuEmployeeToggle(!showDepartmentsMenuEmployee)}
                                      disabled={updateDepartmentsMenuEmployee.isPending}
                                      className="inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors hover:border-[#b23a48] focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 disabled:opacity-50"
                                      style={{
                                        borderColor: showDepartmentsMenuEmployee ? '#b23a48' : '#d1d5db',
                                        backgroundColor: showDepartmentsMenuEmployee ? '#b23a48' : 'transparent',
                                      }}
                                    >
                                      {showDepartmentsMenuEmployee && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                  </td>
                                </tr>
                              )}

                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Save/Reset Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        {changesCount > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {changesCount} change{changesCount !== 1 ? 's' : ''} pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {changesCount > 0 && (
                          <button
                            onClick={handleResetPermissions}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={handleSavePermissions}
                          disabled={changesCount === 0 || updatePermissions.isPending}
                          className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            permissionsSaved ? 'bg-green-500 hover:bg-green-600' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'
                          }`}
                        >
                          {updatePermissions.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : permissionsSaved ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {permissionsSaved ? 'Saved!' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB: Categories & Phases (Admin & Manager) ═══════ */}
          {activeTab === 'categories' && isAdminOrManager() && (
            <CategoriesPhasesSettings />
          )}

          {/* ═══════ TAB: Channels (Admin & Manager) ═══════ */}
          {activeTab === 'channels' && isAdminOrManager() && (
            <ChannelSettings />
          )}

          {/* ═══════ TAB: Progress (Admin & Manager) ═══════ */}
          {activeTab === 'progress' && isAdminOrManager() && (
            <ProgressSettings />
          )}

        </div>
      </main>
    </div>
  )
}
