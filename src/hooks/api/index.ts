// Dashboard
export { useDashboardStats, usePersonalStats, useTasksByStatus, useCreatedVsCompleted, useActivityTimeline, useRecentActivity, useDepartmentProgress, useUpcomingDeadlines, useRecentTasks, usePersonalDeadlines } from './useDashboard'

// Tasks
export { useTasks, useTask, useCreateTask, useUpdateTask, useUpdateTaskStatus, useUpdateTaskPriority, useDeleteTask, useAddComment, useMyTasks, useMyTasksStats } from './useTasks'

// Kanban
export { useKanban, useKanbanReorder } from './useKanban'

// Team
export { useTeam, useAddTeamMember, useUpdateTeamMember, useUpdateMemberStatus } from './useTeam'

// Departments
export { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from './useDepartments'

// Reports
export { useCompletionTrend, useDepartmentThroughput, useTasksByPriority, useTasksDueSoon, useReportStats } from './useReports'

// Calendar
export { useCalendar } from './useCalendar'

// Notifications
export { useNotifications, useMarkAsRead, useMarkAllAsRead } from './useNotifications'

// Settings
export { useSettings, useUpdateSettings } from './useSettings'

// Profile
export { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar, useProfileActivity, type ProfileData, type ActivityItem } from './useProfile'

// Help
export { useFaqs, useSubmitTicket } from './useHelp'

// Search
export { useSearch } from './useSearch'

// Lookups
export { useLookupDepartments, useLookupEmployees } from './useLookups'

// Subtasks
export { useToggleSubtask, useUpdateSubtask, useAddSubtask, useDeleteSubtask } from './useSubtasks'

// Attachments
export { useUploadAttachment, useDeleteAttachment } from './useAttachments'

// Categories
export { useCategories, useAssignedCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category, type CategoryWithPhases, type CreateCategoryInput, type UpdateCategoryInput } from './useCategories'

// Phases
export { usePhases, useAllPhases, useAssignedPhases, usePhase, useCreatePhase, useUpdatePhase, useDeletePhase, usePhaseTasks, type Phase, type PhaseWithDetails, type CreatePhaseInput, type UpdatePhaseInput } from './usePhases'

// Channels
export { useChannels, useChannel, useCreateChannel, useUpdateChannel, useDeleteChannel, useUploadChannelLogo, useSubcategories, useCreateSubcategory, useUpdateSubcategory, useDeleteSubcategory, useChannelTasks, useChannelTask, useCreateChannelTask, useDeleteChannelTask, useUpdateProgress, useAddChannelComment, useMyChannelTasks, type Channel, type ChannelSubcategory, type ChannelTask, type ChannelTaskStatus, type ChannelTaskAssignee, type ChannelTaskComment, type CreateChannelInput, type UpdateChannelInput, type CreateSubcategoryInput, type UpdateSubcategoryInput, type CreateChannelTaskInput, type UpdateProgressInput } from './useChannels'
