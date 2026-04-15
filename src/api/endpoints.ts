// Central place for all API endpoint URLs
// Update VITE_BACKEND_URL in .env when backend is deployed

const API = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',

  // Dashboard Overview
  DASHBOARD_STATS: '/api/v1/dashboard/stats',
  DASHBOARD_STATS_PERSONAL: '/api/v1/dashboard/stats/personal',
  DASHBOARD_TASKS_BY_STATUS: '/api/v1/dashboard/tasks-by-status',
  DASHBOARD_CREATED_VS_COMPLETED: '/api/v1/dashboard/created-vs-completed',
  DASHBOARD_ACTIVITY_TIMELINE: '/api/v1/dashboard/activity-timeline',
  DASHBOARD_RECENT_ACTIVITY: '/api/v1/dashboard/recent-activity',
  DASHBOARD_DEPARTMENT_PROGRESS: '/api/v1/dashboard/department-progress',
  DASHBOARD_UPCOMING_DEADLINES: '/api/v1/dashboard/upcoming-deadlines',
  DASHBOARD_RECENT_TASKS: '/api/v1/dashboard/recent-tasks',
  DASHBOARD_UPCOMING_DEADLINES_PERSONAL: '/api/v1/dashboard/upcoming-deadlines/personal',

  // Tasks
  TASKS: '/api/v1/tasks',
  TASK_BY_ID: (id: string | number) => `/api/v1/tasks/${id}`,
  TASK_STATUS: (id: string | number) => `/api/v1/tasks/${id}/status`,
  TASK_PRIORITY: (id: string | number) => `/api/v1/tasks/${id}/priority`,

  // Subtasks
  SUBTASK_TOGGLE: (id: string | number) => `/api/v1/subtasks/${id}/toggle`,
  SUBTASK_UPDATE: (id: string | number) => `/api/v1/subtasks/${id}`,
  TASK_SUBTASKS: (taskId: string | number) => `/api/v1/tasks/${taskId}/subtasks`,
  SUBTASK_DELETE: (id: string | number) => `/api/v1/subtasks/${id}`,

  // Comments
  TASK_COMMENTS: (taskId: string | number) => `/api/v1/tasks/${taskId}/comments`,

  // Attachments
  TASK_ATTACHMENTS: (taskId: string | number) => `/api/v1/tasks/${taskId}/attachments`,
  ATTACHMENT_DELETE: (id: string | number) => `/api/v1/attachments/${id}`,

  // My Tasks
  MY_TASKS: '/api/v1/my-tasks',
  MY_TASKS_STATS: '/api/v1/my-tasks/stats',

  // Kanban
  KANBAN: '/api/v1/kanban',
  KANBAN_REORDER: '/api/v1/kanban/reorder',

  // Team Members
  TEAM: '/api/v1/team',
  TEAM_MEMBER: (id: string | number) => `/api/v1/team/${id}`,
  TEAM_MEMBER_STATUS: (id: string | number) => `/api/v1/team/${id}/status`,

  // Departments
  DEPARTMENTS: '/api/v1/departments',
  DEPARTMENT_BY_ID: (id: string | number) => `/api/v1/departments/${id}`,

  // Reports
  REPORTS_COMPLETION_TREND: '/api/v1/reports/completion-trend',
  REPORTS_DEPARTMENT_THROUGHPUT: '/api/v1/reports/department-throughput',
  REPORTS_TASKS_BY_PRIORITY: '/api/v1/reports/tasks-by-priority',
  REPORTS_TASKS_DUE_SOON: '/api/v1/reports/tasks-due-soon',
  REPORTS_STATS: '/api/v1/reports/stats',

  // Calendar
  CALENDAR: '/api/v1/calendar',
  CALENDAR_BY_ID: (id: string | number) => `/api/v1/calendar/${id}`,

  // Notifications
  NOTIFICATIONS: '/api/v1/notifications',
  NOTIFICATION_READ: (id: string | number) => `/api/v1/notifications/${id}/read`,
  NOTIFICATIONS_READ_ALL: '/api/v1/notifications/read-all',

  // Settings
  SETTINGS: '/api/v1/settings',

  // Profile
  PROFILE: '/api/v1/profile',
  PROFILE_AVATAR: '/api/v1/profile/avatar',
  PROFILE_ACTIVITY: '/api/v1/profile/activity',

  // Help
  HELP_FAQS: '/api/v1/help/faqs',
  HELP_TICKETS: '/api/v1/help/tickets',

  // Search
  SEARCH: '/api/v1/search',

  // Progress Tracking
  PROGRESS_LIST: '/api/v1/progress',
  PROGRESS_SKILL_DEFINITIONS: '/api/v1/progress/skill-definitions',
  PROGRESS_SKILLS_ALL: '/api/v1/progress/skills',
  PROGRESS_CATEGORIES: '/api/v1/progress/categories',
  PROGRESS_CATEGORY_CREATE: '/api/v1/progress/categories',
  PROGRESS_CATEGORY_BY_ID: (id: string) => `/api/v1/progress/categories/${id}`,
  PROGRESS_SKILL_IN_CATEGORY: (categoryId: string) => `/api/v1/progress/categories/${categoryId}/skills`,
  PROGRESS_SKILL_BY_ID: (id: string) => `/api/v1/progress/skills/${id}`,
  PROGRESS_BY_EMPLOYEE: (id: string) => `/api/v1/progress/${id}`,
  PROGRESS_HISTORY: (id: string) => `/api/v1/progress/${id}/history`,
  PROGRESS_SAVE_SKILLS: (id: string) => `/api/v1/progress/${id}/skills`,

  // Lookups (for dropdowns)
  LOOKUP_DEPARTMENTS: '/api/v1/lookup/departments',
  LOOKUP_EMPLOYEES: '/api/v1/lookup/employees',
} as const

export default API
