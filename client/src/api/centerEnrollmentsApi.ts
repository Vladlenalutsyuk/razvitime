import { API_BASE } from './config'

export type CenterEnrollment = {
  id: number
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  parent_comment: string | null
  center_comment: string | null
  created_at: string
  updated_at?: string

  child_id: number
  child_name: string
  birthdate: string

  parent_profile_id: number
  parent_name: string
  parent_telegram: string | null
  parent_whatsapp: string | null
  parent_email: string | null
  parent_phone: string | null

  activity_id: number
  activity_title: string
}

export async function getCenterEnrollments(params: {
  userId: number
  status?: string
  activityId?: number | string
}): Promise<CenterEnrollment[]> {
  const query = new URLSearchParams()

  query.set('userId', String(params.userId))

  if (params.status) {
    query.set('status', params.status)
  }

  if (params.activityId) {
    query.set('activityId', String(params.activityId))
  }

  const response = await fetch(
    `${API_BASE}/api/center/enrollments?${query.toString()}`
  )
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки заявок центра')
  }

  return data
}

export async function updateCenterEnrollmentStatus(
  enrollmentId: number,
  params: {
    status: 'pending' | 'approved' | 'declined' | 'cancelled'
    center_comment?: string | null
  }
): Promise<CenterEnrollment> {
  const response = await fetch(
    `${API_BASE}/api/center/enrollments/${enrollmentId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка обновления статуса заявки')
  }

  return data
}