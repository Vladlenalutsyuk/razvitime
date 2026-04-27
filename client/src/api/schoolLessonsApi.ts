import { API_BASE } from './config'

export type SchoolLesson = {
  id: number
  child_id: number
  weekday: number
  lesson_number: number | null
  start_time: string | null
  end_time: string | null
  subject: string
  classroom: string | null
}

export type SchoolLessonPayload = {
  child_id: number
  weekday: number
  lesson_number: number | null
  start_time: string | null
  end_time: string | null
  subject: string
  classroom: string | null
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage)
  }

  return data
}

export async function getSchoolLessons(
  userId: number
): Promise<SchoolLesson[]> {
  const response = await fetch(
    `${API_BASE}/api/parent/school-lessons?userId=${userId}`
  )

  return parseResponse<SchoolLesson[]>(
    response,
    'Ошибка загрузки школьного расписания'
  )
}

export async function createSchoolLesson(
  payload: SchoolLessonPayload
): Promise<SchoolLesson> {
  const response = await fetch(`${API_BASE}/api/school-lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse<SchoolLesson>(
    response,
    'Ошибка добавления школьного урока'
  )
}

export async function updateSchoolLesson(
  id: number,
  payload: SchoolLessonPayload
): Promise<SchoolLesson> {
  const response = await fetch(`${API_BASE}/api/school-lessons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse<SchoolLesson>(
    response,
    'Ошибка обновления школьного урока'
  )
}

export async function deleteSchoolLesson(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/school-lessons/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || 'Ошибка удаления школьного урока')
  }
}