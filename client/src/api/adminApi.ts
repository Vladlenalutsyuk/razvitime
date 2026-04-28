import { API_BASE } from './config'

const API_URL = `${API_BASE}/api`

function getToken() {
  const rawAuth = localStorage.getItem('razvitime_auth')

  if (rawAuth) {
    try {
      const parsed = JSON.parse(rawAuth)
      return parsed?.token || ''
    } catch {
      return ''
    }
  }

  return localStorage.getItem('token') || ''
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Ошибка запроса')
  }

  return data as T
}

export type AdminDashboardResponse = {
  stats: {
    parentsCount: number
    childrenCount: number
    centersCount: number
    activeCentersCount: number
    pendingCentersCount: number
    blockedCentersCount: number
    activitiesCount: number
    activeSubscriptionsCount: number
    subscriptionRevenue: number
  }
  centerGrowth: {
    month: string
    total: number
  }[]
  subscriptionRevenueGrowth: {
    month: string
    total: number
  }[]
}

export type AdminCenter = {
  id: number
  user_id: number
  name: string
  city: string
  address: string
  phone: string | null
  email: string | null
  is_active: boolean
  moderation_status: 'draft' | 'pending' | 'approved' | 'rejected'
  subscription_name: string | null
  subscription_until: string | null
  subscription_status: 'active' | 'expired' | 'cancelled' | null
  activities_count: number
  created_at: string
}

export type AdminSubscription = {
  id: number
  name: string
  description: string | null
  price: number
  period_days: number
  is_active: boolean
}

export type AdminCenterSubscription = {
  id: number
  center_id: number
  center_name: string
  city: string
  subscription_name: string
  price: number
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
}

export type AdminApplication = {
  id: number
  center_name: string
  contact_person: string
  phone: string | null
  email: string | null
  city: string | null
  comment: string | null
  status: 'new' | 'in_review' | 'approved' | 'rejected'
  created_at: string
}

export type AdminAnalyticsResponse = {
  centersByCity: {
    city: string
    total: number
  }[]
  centersByStatus: {
    label: string
    total: number
  }[]
  popularCategories: {
    category: string
    total: number
  }[]
  subscriptionsByTariff: {
    name: string
    total: number
  }[]
}

export type AdminLog = {
  id: number
  title: string
  message: string
  type: string
  created_at: string
}

export function getAdminDashboard() {
  return request<AdminDashboardResponse>('/admin/dashboard')
}

export function getAdminCenters(params?: {
  search?: string
  city?: string
  status?: string
}) {
  const searchParams = new URLSearchParams()

  if (params?.search) searchParams.set('search', params.search)
  if (params?.city) searchParams.set('city', params.city)
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()

  return request<AdminCenter[]>(`/admin/centers${query ? `?${query}` : ''}`)
}

export function updateAdminCenterStatus(
  centerId: number,
  payload: {
    is_active: boolean
    moderation_status?: 'draft' | 'pending' | 'approved' | 'rejected'
  }
) {
  return request<AdminCenter>(`/admin/centers/${centerId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function extendAdminCenterSubscription(
  centerId: number,
  payload: {
    subscription_id: number
    period_days: number
  }
) {
  return request<AdminCenter>(`/admin/centers/${centerId}/subscription`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetAdminCenterPassword(centerId: number) {
  return request<{ temporaryPassword: string }>(
    `/admin/centers/${centerId}/reset-password`,
    {
      method: 'POST',
    }
  )
}

export function getAdminSubscriptions() {
  return request<AdminSubscription[]>('/admin/subscriptions')
}

export function getAdminCenterSubscriptions() {
  return request<AdminCenterSubscription[]>('/admin/center-subscriptions')
}

export function getAdminApplications(params?: {
  search?: string
  status?: string
}) {
  const searchParams = new URLSearchParams()

  if (params?.search) searchParams.set('search', params.search)
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()

  return request<AdminApplication[]>(
    `/admin/applications${query ? `?${query}` : ''}`
  )
}

export function updateAdminApplicationStatus(
  applicationId: number,
  payload: {
    status: 'new' | 'in_review' | 'approved' | 'rejected'
  }
) {
  return request<AdminApplication>(`/admin/applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getAdminAnalytics(params?: {
  city?: string
}) {
  const searchParams = new URLSearchParams()

  if (params?.city) searchParams.set('city', params.city)

  const query = searchParams.toString()

  return request<AdminAnalyticsResponse>(
    `/admin/analytics${query ? `?${query}` : ''}`
  )
}

export function getAdminLogs() {
  return request<AdminLog[]>('/admin/logs')
}