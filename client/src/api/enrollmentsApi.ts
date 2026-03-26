import { API_BASE } from './config'

export type Enrollment = {
  id: number
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  created_at?: string
  child_id: number
  child_name: string
  activity_id: number
  title: string
  category: string
  price?: number
  center_name: string
  city: string
  address: string
}

export async function getEnrollments(userId: number): Promise<Enrollment[]> {
  const response = await fetch(`${API_BASE}/api/enrollments?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки записей')
  }

  return data
}

export async function createEnrollment(params: {
  child_id: number
  activity_id: number
  parent_comment?: string | null
}): Promise<Enrollment> {
  const response = await fetch(`${API_BASE}/api/enrollments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
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

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка удаления записи')
  }
}