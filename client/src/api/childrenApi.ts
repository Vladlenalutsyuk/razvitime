import { API_BASE } from './config'

export type Child = {
  id: number
  parent_id: number
  name: string
  birthdate: string
  gender: 'boy' | 'girl' | 'other' | null
  photo_url: string | null
  created_at?: string
}

export async function getChildren(userId: number): Promise<Child[]> {
  const response = await fetch(`${API_BASE}/api/children?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки детей')
  }

  return data
}

export async function createChild(params: {
  userId: number
  name: string
  birthdate: string
  gender?: string | null
  photo_url?: string | null
}): Promise<Child> {
  const response = await fetch(`${API_BASE}/api/children`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка создания ребёнка')
  }

  return data
}

export async function updateChild(
  childId: number,
  params: {
    name: string
    birthdate: string
    gender?: string | null
    photo_url?: string | null
  }
): Promise<Child> {
  const response = await fetch(`${API_BASE}/api/children/${childId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка обновления ребёнка')
  }

  return data
}

export async function deleteChild(childId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/children/${childId}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка удаления ребёнка')
  }
}