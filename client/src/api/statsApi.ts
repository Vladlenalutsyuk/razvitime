import { API_BASE } from './config'

export type StatsResponse = {
  parents: number
  kids: number
  centers: number
  activities: number
}

export async function getStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE}/api/stats`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить статистику')
  }

  return data
}