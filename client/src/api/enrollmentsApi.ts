import { API_BASE } from './config'

export type EnrollmentStatus = 'pending' | 'approved' | 'declined' | 'cancelled'

export type Enrollment = {
  id: number
  status: EnrollmentStatus
  created_at: string

  child_id: number
  child_name: string

  activity_id: number
  activity_session_id: number | null

  title: string
  category: string
  price?: number | null

  center_id?: number
  center_name: string
  city?: string
  address?: string

  weekday?: number | null
  start_time?: string | null
  end_time?: string | null
}

export type CreateEnrollmentPayload = {
  child_id: number
  activity_id: number
  activity_session_id?: number | null
  parent_comment?: string | null
}

export async function getEnrollments(userId: number): Promise<Enrollment[]> {
  const response = await fetch(`${API_BASE}/api/enrollments?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки записей')
  }

  return data
}

export async function createEnrollment(
  payload: CreateEnrollmentPayload
): Promise<Enrollment> {
  const response = await fetch(`${API_BASE}/api/enrollments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка создания записи')
  }

  return data
}

export async function deleteEnrollment(enrollmentId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/enrollments/${enrollmentId}`, {
    method: 'DELETE',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || 'Ошибка отмены записи')
  }
}