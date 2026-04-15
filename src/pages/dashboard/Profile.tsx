import { useState, useEffect, useRef } from 'react'
import { Upload, Save, Clock, Mail, Briefcase, MapPin, Building2, User, Loader2, CheckCircle2, Shield, AlertCircle } from 'lucide-react'
import { useProfile, useUpdateProfile, useUploadAvatar, useProfileActivity } from '../../hooks/api/useProfile'
import { useQuery } from '@tanstack/react-query'
import axiosInstance from '../../api/axiosInstance'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  const weeks = Math.floor(days / 7)
  return `${weeks} week${weeks > 1 ? 's' : ''} ago`
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-50 text-green-600',
  updated: 'bg-blue-50 text-blue-600',
  deleted: 'bg-red-50 text-red-600',
  completed: 'bg-green-50 text-green-600',
  login: 'bg-teal-50 text-teal-600',
}

export default function Profile() {
  const { data: profile, isLoading, isError } = useProfile()
  const { data: activities, isLoading: activitiesLoading } = useProfileActivity(10)
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Check if R2 storage is verified
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/api/settings/public')
      return data.data || data
    },
    staleTime: 5 * 60 * 1000,
  })
  const r2Verified = publicSettings?.r2_verified === true

  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [saved, setSaved] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Only JPG, PNG, and WebP files are allowed')
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError('File size must be under 2MB')
      return
    }

    try {
      await uploadAvatar.mutateAsync(file)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error
      setAvatarError(msg || 'Failed to upload avatar. Please try again.')
    }
    // Reset input so same file can be re-selected
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setJobTitle(profile.job_title || '')
      setLocation(profile.location || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile.mutateAsync({ name, job_title: jobTitle, location, bio })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#b23a48] animate-spin" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-red-500">Failed to load profile. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-900 p-3 lg:p-4">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Profile Information Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Profile Information</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Update your personal details</p>
          </div>

          {/* Avatar */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              {uploadAvatar.isPending ? (
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
                  <Loader2 className="w-5 h-5 text-[#b23a48] animate-spin" />
                </div>
              ) : profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-4 border-gray-100 dark:border-gray-700" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#b23a48] flex items-center justify-center border-4 border-gray-100 dark:border-gray-700">
                  <span className="text-white font-bold text-lg">{profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}</span>
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatar.isPending || !r2Verified}
                className="absolute bottom-0 right-0 w-6 h-6 bg-[#b23a48] hover:bg-[#8f2e3a] text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                title={!r2Verified ? 'Storage not configured. Admin must verify R2 credentials in Settings.' : 'Upload avatar'}
              >
                <Upload className="w-3 h-3" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-0.5">Profile Photo</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">JPG, PNG or WebP. Max size 2MB</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadAvatar.isPending || !r2Verified}
                className="text-xs font-medium text-[#b23a48] hover:text-[#8f2e3a] transition-colors disabled:opacity-50"
              >
                {uploadAvatar.isPending ? 'Uploading...' : !r2Verified ? 'Storage not configured' : 'Upload New'}
              </button>
              {!r2Verified && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Admin must verify R2 credentials in Settings.</p>
              )}
              {avatarError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {avatarError}
                </p>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name — editable */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-shadow dark:bg-gray-700" />
              </div>
            </div>

            {/* Email — read-only */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="email" value={profile.email} disabled
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Email is managed by your organization</p>
            </div>

            {/* Role — read-only */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Role</label>
              <div className="relative">
                <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} disabled
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed" />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Role is assigned by your administrator</p>
            </div>

            {/* Department — read-only */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Department</label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" value={profile.department || 'Not assigned'} disabled
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed" />
              </div>
            </div>

            {/* Job Title — editable */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Job Title</label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Product Manager"
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-shadow dark:bg-gray-700 placeholder-gray-400" />
              </div>
            </div>

            {/* Location — editable */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Location</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Hyderabad, India"
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-shadow dark:bg-gray-700 placeholder-gray-400" />
              </div>
            </div>

            {/* Bio — editable */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-900 dark:text-white">Bio</label>
              <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..."
                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b23a48]/20 focus:border-[#b23a48] transition-shadow resize-y dark:bg-gray-700 placeholder-gray-400" />
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={updateProfile.isPending}
                className={`flex items-center gap-2 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm ${saved ? 'bg-green-500 hover:bg-green-600' : 'bg-[#b23a48] hover:bg-[#8f2e3a]'} disabled:opacity-70`}>
                {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Activity Log Section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">Activity Log</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your recent actions and login history</p>
          </div>

          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
              {activities.map((activity) => (
                <div key={activity.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium tracking-wide uppercase ${ACTION_COLORS[activity.action_type] || 'bg-gray-100 text-gray-600'}`}>
                      {activity.action_type}
                    </span>
                    <span className="text-xs text-gray-900 dark:text-white">{activity.description}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 shrink-0 ml-2">
                    <Clock className="w-3 h-3" /> {timeAgo(activity.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-gray-400 dark:text-gray-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
