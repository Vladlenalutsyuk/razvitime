import { API_BASE } from './config'

export type CenterApplicationPayload = {
  center_name: string
  contact_person: string
  phone: string
  email: string
  city: string
  comment: string
}

export async function createCenterApplication(
  payload: CenterApplicationPayload
) {
  const response = await fetch(`${API_BASE}/api/center-applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось отправить заявку')
  }

  return data
}