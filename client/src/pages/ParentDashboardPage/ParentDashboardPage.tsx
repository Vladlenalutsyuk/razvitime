//D:\Data USER\Desktop\razvitime\client\src\pages\ParentDashboardPage\ParentDashboardPage.tsx
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getAuth } from '../../utils/auth'

import {
  getParentProfile,
  updateParentProfile,
  type ParentProfile,
} from '../../api/parentApi'

import {
  getChildren,
  createChild,
  updateChild,
  deleteChild,
  type Child,
} from '../../api/childrenApi'

import { getActivities, type Activity } from '../../api/activitiesApi'

import {
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  type Enrollment,
} from '../../api/enrollmentsApi'

import {
  getSchoolLessons,
  createSchoolLesson,
  updateSchoolLesson,
  deleteSchoolLesson,
  type SchoolLesson,
} from '../../api/schoolLessonsApi'

import { useToast } from '../../components/ui/ToastProvider/ToastProvider'
import './ParentDashboardPage.css'

type Section = 'schedule' | 'search' | 'kids' | 'profile' | 'help'
type TimeOfDay = '' | 'morning' | 'day' | 'evening'
type ScheduleView = 'day' | 'week' | 'month'
type ScheduleMode = 'all' | 'school' | 'activities'

type KidForm = {
  name: string
  birthdate: string
  gender: string
  photo_url: string
}

const enrollmentStatusMap: Record<Enrollment['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Подтверждена',
  declined: 'Отклонена',
  cancelled: 'Отменена',
}

const weekdays = [
  { value: '', label: 'Любой день' },
  { value: '1', label: 'Понедельник' },
  { value: '2', label: 'Вторник' },
  { value: '3', label: 'Среда' },
  { value: '4', label: 'Четверг' },
  { value: '5', label: 'Пятница' },
  { value: '6', label: 'Суббота' },
  { value: '7', label: 'Воскресенье' },
]

const weekdayMap: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
}

const emptyKidForm: KidForm = {
  name: '',
  birthdate: '',
  gender: '',
  photo_url: '',
}

const emptyLessonForm = {
  child_id: '',
  weekday: '1',
  lesson_number: '',
  start_time: '',
  end_time: '',
  subject: '',
  classroom: '',
}

function getKidAge(birthdate: string) {
  const date = new Date(birthdate)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1
  }

  return age
}

function getGenderLabel(gender: Child['gender'] | string | null) {
  if (gender === 'girl') return 'Девочка'
  if (gender === 'boy') return 'Мальчик'
  if (gender === 'other') return 'Другое'
  return 'Не указано'
}

function getSessionText(activity: Activity) {
  if (!activity.sessions || activity.sessions.length === 0) {
    return 'Расписание уточняется'
  }

  return activity.sessions
    .map((session) => {
      const day = weekdayMap[session.weekday] || `День ${session.weekday}`
      return `${day}, ${session.start_time.slice(0, 5)}–${session.end_time.slice(0, 5)}`
    })
    .join(', ')
}

function isTimeInPeriod(time: string, period: TimeOfDay) {
  if (!period) return true

  const hour = Number(time.slice(0, 2))

  if (period === 'morning') return hour >= 6 && hour < 12
  if (period === 'day') return hour >= 12 && hour < 17
  if (period === 'evening') return hour >= 17 && hour < 23

  return true
}

function hasActivityConflict(activityA?: Activity, activityB?: Activity) {
  if (!activityA?.sessions?.length || !activityB?.sessions?.length) {
    return false
  }

  return activityA.sessions.some((sessionA) =>
    activityB.sessions?.some((sessionB) => {
      if (sessionA.weekday !== sessionB.weekday) return false

      return (
        sessionA.start_time < sessionB.end_time &&
        sessionA.end_time > sessionB.start_time
      )
    })
  )
}

function hasSchoolConflict(activity: Activity, lessons: SchoolLesson[]) {
  if (!activity.sessions?.length || lessons.length === 0) {
    return null
  }

  for (const session of activity.sessions) {
    for (const lesson of lessons) {
      if (session.weekday !== lesson.weekday) continue
      if (!lesson.start_time || !lesson.end_time) continue

      const hasConflict =
        session.start_time < lesson.end_time &&
        session.end_time > lesson.start_time

      if (hasConflict) {
        return lesson
      }
    }
  }

  return null
}

function ParentDashboardPage() {
  const auth = getAuth()
  const userId = auth?.user?.id
  const isParent = auth?.user?.role === 'parent'
  const { showToast } = useToast()

  const [activeSection, setActiveSection] = useState<Section>('schedule')

  const [profile, setProfile] = useState<ParentProfile>({
    city: '',
    telegram: '',
    whatsapp: '',
    email: '',
    avatar_url: '',
    full_name: '',
    preferred_contact: null,
    notifications_enabled: true,
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const [kids, setKids] = useState<Child[]>([])
  const [kidsLoading, setKidsLoading] = useState(false)

  const [isAddingKid, setIsAddingKid] = useState(false)
  const [kidSubmitting, setKidSubmitting] = useState(false)
  const [editingKidId, setEditingKidId] = useState<number | null>(null)

  const [newKid, setNewKid] = useState<KidForm>(emptyKidForm)
  const [editKid, setEditKid] = useState<KidForm>(emptyKidForm)

  const [filters, setFilters] = useState({
    text: '',
    city: '',
    age: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    weekday: '',
    timeOfDay: '' as TimeOfDay,
  })

  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)

  const [schoolLessons, setSchoolLessons] = useState<SchoolLesson[]>([])
  const [schoolLessonsLoading, setSchoolLessonsLoading] = useState(false)

  const [selectedScheduleChildId, setSelectedScheduleChildId] =
    useState<string>('all')
  const [scheduleView, setScheduleView] = useState<ScheduleView>('week')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('all')
  const [selectedScheduleDay, setSelectedScheduleDay] = useState('1')

  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [lessonForm, setLessonForm] = useState(emptyLessonForm)

  const [selectedChildByActivity, setSelectedChildByActivity] = useState<
    Record<number, string>
  >({})

  const [enrollmentSubmittingId, setEnrollmentSubmittingId] = useState<
    number | null
  >(null)

  const userName =
    auth?.user?.name ||
    auth?.user?.parent_name ||
    profile.full_name ||
    'Родитель'

  const activeEnrollments = enrollments.filter(
    (item) => item.status === 'pending' || item.status === 'approved'
  )

  function getActivityEnrollmentForSelectedChild(activityId: number) {
    const selectedChildId = Number(selectedChildByActivity[activityId])

    if (!selectedChildId) {
      return null
    }

    return (
      activeEnrollments.find(
        (item) =>
          item.activity_id === activityId &&
          item.child_id === selectedChildId
      ) || null
    )
  }

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const minPrice = filters.minPrice ? Number(filters.minPrice) : null
      const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null

      if (minPrice !== null && activity.price < minPrice) return false
      if (maxPrice !== null && activity.price > maxPrice) return false

      if (filters.weekday) {
        const weekday = Number(filters.weekday)
        const hasDay = activity.sessions?.some(
          (session) => session.weekday === weekday
        )
        if (!hasDay) return false
      }

      if (filters.timeOfDay) {
        const hasTime = activity.sessions?.some((session) =>
          isTimeInPeriod(session.start_time, filters.timeOfDay)
        )
        if (!hasTime) return false
      }

      return true
    })
  }, [
    activities,
    filters.minPrice,
    filters.maxPrice,
    filters.weekday,
    filters.timeOfDay,
  ])

  const nextLessons = useMemo(() => {
    return activeEnrollments.slice(0, 4)
  }, [activeEnrollments])

  async function reloadChildren(safeUserId: number) {
    const data = await getChildren(safeUserId)
    setKids(data)
  }

  async function reloadEnrollments(safeUserId: number) {
    const data = await getEnrollments(safeUserId)
    setEnrollments(data)
  }

  async function reloadSchoolLessons(safeUserId: number) {
    const data = await getSchoolLessons(safeUserId)
    setSchoolLessons(data)
  }

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      return
    }

    const safeUserId = userId

    async function loadProfile() {
      try {
        setProfileLoading(true)

        const data = await getParentProfile(safeUserId)

        setProfile({
          id: data.id,
          user_id: data.user_id,
          city: data.city || '',
          telegram: data.telegram || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          avatar_url: data.avatar_url || '',
          full_name: data.full_name || '',
          preferred_contact: data.preferred_contact || null,
          notifications_enabled: data.notifications_enabled ?? true,
        })

        setFilters((prev) => ({
          ...prev,
          city: prev.city || data.city || '',
        }))
      } catch (error) {
        console.error(error)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [userId, isParent])

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      setKids([])
      return
    }

    const safeUserId = userId

    async function loadChildren() {
      try {
        setKidsLoading(true)
        await reloadChildren(safeUserId)
      } catch (error) {
        console.error(error)
        setKids([])
      } finally {
        setKidsLoading(false)
      }
    }

    loadChildren()
  }, [userId, isParent])

  useEffect(() => {
    async function loadActivities() {
      try {
        setActivitiesLoading(true)

        const data = await getActivities({
          city: filters.city.trim(),
          age: filters.age.trim(),
          category: filters.category.trim(),
          search: filters.text.trim(),
        })

        setActivities(data)
      } catch (error) {
        console.error(error)
        setActivities([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    loadActivities()
  }, [filters.city, filters.age, filters.category, filters.text])

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      setEnrollments([])
      return
    }

    const safeUserId = userId

    async function loadEnrollments() {
      try {
        setEnrollmentsLoading(true)
        await reloadEnrollments(safeUserId)
      } catch (error) {
        console.error(error)
        setEnrollments([])
      } finally {
        setEnrollmentsLoading(false)
      }
    }

    loadEnrollments()
  }, [userId, isParent])

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      setSchoolLessons([])
      return
    }

    const safeUserId = userId

    async function loadSchoolLessons() {
      try {
        setSchoolLessonsLoading(true)
        await reloadSchoolLessons(safeUserId)
      } catch (error) {
        console.error(error)
        setSchoolLessons([])
      } finally {
        setSchoolLessonsLoading(false)
      }
    }

    loadSchoolLessons()
  }, [userId, isParent])

  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleKidChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setNewKid((prev) => ({ ...prev, [name]: value }))
  }

  function handleEditKidChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setEditKid((prev) => ({ ...prev, [name]: value }))
  }

  function handleLessonChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setLessonForm((prev) => ({ ...prev, [name]: value }))
  }

  function resetLessonForm() {
    setLessonForm(emptyLessonForm)
    setEditingLessonId(null)
  }

  function startEditLesson(lesson: SchoolLesson) {
    setEditingLessonId(lesson.id)
    setSelectedScheduleChildId(String(lesson.child_id))
    setLessonForm({
      child_id: String(lesson.child_id),
      weekday: String(lesson.weekday),
      lesson_number: lesson.lesson_number ? String(lesson.lesson_number) : '',
      start_time: lesson.start_time ? lesson.start_time.slice(0, 5) : '',
      end_time: lesson.end_time ? lesson.end_time.slice(0, 5) : '',
      subject: lesson.subject,
      classroom: lesson.classroom || '',
    })
  }

  async function handleSaveLesson() {
    const childId =
      editingLessonId && lessonForm.child_id
        ? Number(lessonForm.child_id)
        : Number(selectedScheduleChildId)

    if (!childId || selectedScheduleChildId === 'all') {
      showToast('Сначала выберите одного ребёнка в расписании', {
        type: 'error',
      })
      return
    }

    if (!lessonForm.subject.trim()) {
      showToast('Введите предмет', { type: 'error' })
      return
    }

    if (!lessonForm.start_time || !lessonForm.end_time) {
      showToast('Введите время урока', { type: 'error' })
      return
    }

    if (lessonForm.start_time >= lessonForm.end_time) {
      showToast('Время окончания должно быть позже начала', { type: 'error' })
      return
    }

    const payload = {
      child_id: childId,
      weekday: Number(lessonForm.weekday),
      lesson_number: lessonForm.lesson_number
        ? Number(lessonForm.lesson_number)
        : null,
      start_time: lessonForm.start_time,
      end_time: lessonForm.end_time,
      subject: lessonForm.subject.trim(),
      classroom: lessonForm.classroom.trim() || null,
    }

    try {
      if (editingLessonId) {
        const updatedLesson = await updateSchoolLesson(editingLessonId, payload)

        setSchoolLessons((prev) =>
          prev.map((lesson) =>
            lesson.id === editingLessonId ? updatedLesson : lesson
          )
        )

        showToast('Урок обновлён', { type: 'success' })
      } else {
        const createdLesson = await createSchoolLesson(payload)

        setSchoolLessons((prev) => [createdLesson, ...prev])
        showToast('Урок добавлен', { type: 'success' })
      }

      resetLessonForm()
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось сохранить урок',
        { type: 'error' }
      )
    }
  }

  async function handleDeleteLesson(id: number) {
    const isConfirmed = window.confirm('Удалить урок из расписания?')
    if (!isConfirmed) return

    try {
      await deleteSchoolLesson(id)
      setSchoolLessons((prev) => prev.filter((lesson) => lesson.id !== id))
      showToast('Урок удалён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось удалить урок',
        { type: 'error' }
      )
    }
  }

  function handleExportSchedule() {
    const selectedKids = kids.filter((kid) =>
      selectedScheduleChildId === 'all'
        ? true
        : kid.id === Number(selectedScheduleChildId)
    )

    let text = 'Расписание РазвиТайм\n\n'

    selectedKids.forEach((kid) => {
      text += `${kid.name}\n`

      weekdays
        .filter((day) => day.value)
        .forEach((day) => {
          const dayNumber = Number(day.value)

          const lessons = schoolLessons.filter(
            (lesson) =>
              lesson.child_id === kid.id && lesson.weekday === dayNumber
          )

          const childEnrollments = enrollments.filter(
            (item) => item.child_id === kid.id
          )

          text += `\n${day.label}:\n`

          let hasItems = false

          if (scheduleMode !== 'activities') {
            lessons.forEach((lesson) => {
              hasItems = true
              text += `- Школа: ${lesson.subject}, ${lesson.start_time?.slice(
                0,
                5
              )}–${lesson.end_time?.slice(0, 5)}\n`
            })
          }

          if (scheduleMode !== 'school') {
            childEnrollments.forEach((item) => {
              const activity = activities.find(
                (activityItem) => activityItem.id === item.activity_id
              )

              activity?.sessions
                ?.filter((session) => session.weekday === dayNumber)
                .forEach((session) => {
                  hasItems = true
                  text += `- Кружок: ${item.title}, ${session.start_time.slice(
                    0,
                    5
                  )}–${session.end_time.slice(0, 5)}\n`
                })
            })
          }

          if (!hasItems) {
            text += '- Нет занятий\n'
          }
        })

      text += '\n----------------------\n\n'
    })

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'raspisanie-razvitime.txt'
    link.click()

    URL.revokeObjectURL(url)
  }

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText('vladlenalutsyuk@yandex.ru')
      showToast('Почта скопирована', { type: 'success' })
    } catch {
      showToast('Не удалось скопировать почту', { type: 'error' })
    }
  }

  async function handleAddKid() {
    if (typeof userId !== 'number') {
      showToast('Пользователь не найден', { type: 'error' })
      return
    }

    const safeUserId = userId

    if (!newKid.name.trim()) {
      showToast('Введите имя ребёнка', { type: 'error' })
      return
    }

    if (!newKid.birthdate.trim()) {
      showToast('Введите дату рождения', { type: 'error' })
      return
    }

    try {
      setKidSubmitting(true)

      const createdChild = await createChild({
        userId: safeUserId,
        name: newKid.name.trim(),
        birthdate: newKid.birthdate,
        gender: newKid.gender || null,
        photo_url: newKid.photo_url.trim() || null,
      })

      setKids((prev) => [createdChild, ...prev])
      setNewKid(emptyKidForm)
      setIsAddingKid(false)
      showToast('Ребёнок добавлен', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось добавить ребёнка',
        { type: 'error' }
      )
    } finally {
      setKidSubmitting(false)
    }
  }

  function startEditKid(kid: Child) {
    setEditingKidId(kid.id)
    setEditKid({
      name: kid.name,
      birthdate: kid.birthdate,
      gender: kid.gender || '',
      photo_url: kid.photo_url || '',
    })
  }

  async function handleUpdateKid() {
    if (editingKidId === null) return

    if (!editKid.name.trim()) {
      showToast('Введите имя ребёнка', { type: 'error' })
      return
    }

    if (!editKid.birthdate.trim()) {
      showToast('Введите дату рождения', { type: 'error' })
      return
    }

    try {
      setKidSubmitting(true)

      const updatedKid = await updateChild(editingKidId, {
        name: editKid.name.trim(),
        birthdate: editKid.birthdate,
        gender: editKid.gender || null,
        photo_url: editKid.photo_url.trim() || null,
      })

      setKids((prev) =>
        prev.map((kid) => (kid.id === editingKidId ? updatedKid : kid))
      )

      setEditingKidId(null)
      setEditKid(emptyKidForm)
      showToast('Данные ребёнка обновлены', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось обновить ребёнка',
        { type: 'error' }
      )
    } finally {
      setKidSubmitting(false)
    }
  }

  async function handleDeleteKid(id: number) {
    const isConfirmed = window.confirm('Удалить ребёнка и все его записи?')
    if (!isConfirmed) return

    try {
      await deleteChild(id)

      setKids((prev) => prev.filter((kid) => kid.id !== id))
      setEnrollments((prev) => prev.filter((item) => item.child_id !== id))
      setSchoolLessons((prev) => prev.filter((item) => item.child_id !== id))
      showToast('Ребёнок удалён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось удалить ребёнка',
        { type: 'error' }
      )
    }
  }

  function handleProfileChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()

    if (typeof userId !== 'number') {
      showToast('Пользователь не найден', { type: 'error' })
      return
    }

    const safeUserId = userId

    try {
      setProfileSaving(true)

      const data = await updateParentProfile({
        userId: safeUserId,
        city: profile.city,
        telegram: profile.telegram,
        whatsapp: profile.whatsapp,
        email: profile.email,
        avatar_url: profile.avatar_url,
      })

      setProfile((prev) => ({
        ...prev,
        city: data.city || '',
        telegram: data.telegram || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        avatar_url: data.avatar_url || '',
      }))

      showToast('Профиль сохранён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось сохранить профиль',
        { type: 'error' }
      )
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleEnroll(activity: Activity) {
    if (typeof userId !== 'number') {
      showToast('Пользователь не найден', { type: 'error' })
      return
    }

    const safeUserId = userId
    const selectedChildId = Number(selectedChildByActivity[activity.id])

    if (!selectedChildId) {
      showToast('Выберите ребёнка для записи', { type: 'error' })
      return
    }

    const selectedKid = kids.find((kid) => kid.id === selectedChildId)
    const age = selectedKid ? getKidAge(selectedKid.birthdate) : null

    if (age !== null && (age < activity.age_min || age > activity.age_max)) {
      const isConfirmed = window.confirm(
        `Возраст ребёнка не подходит под ограничения кружка (${activity.age_min}–${activity.age_max}). Всё равно отправить заявку?`
      )

      if (!isConfirmed) return
    }

    const selectedChildSchoolLessons = schoolLessons.filter(
      (lesson) => lesson.child_id === selectedChildId
    )

    const schoolConflict = hasSchoolConflict(
      activity,
      selectedChildSchoolLessons
    )

    if (schoolConflict) {
      const day =
        weekdayMap[schoolConflict.weekday] ||
        `День ${schoolConflict.weekday}`

      const isConfirmed = window.confirm(
        `Выбранный кружок пересекается со школьным уроком: ${schoolConflict.subject}, ${day}, ${schoolConflict.start_time?.slice(
          0,
          5
        )}–${schoolConflict.end_time?.slice(0, 5)}. Всё равно записать?`
      )

      if (!isConfirmed) return
    }

    const childEnrollments = activeEnrollments.filter(
      (item) => item.child_id === selectedChildId
    )

    const conflict = childEnrollments.find((item) => {
      const existingActivity = activities.find(
        (activityItem) => activityItem.id === item.activity_id
      )

      return hasActivityConflict(activity, existingActivity)
    })

    if (conflict) {
      const isConfirmed = window.confirm(
        `Выбранный кружок может пересекаться с другим занятием ребёнка: ${conflict.title}. Всё равно записать?`
      )

      if (!isConfirmed) return
    }

    try {
      setEnrollmentSubmittingId(activity.id)

      await createEnrollment({
        child_id: selectedChildId,
        activity_id: activity.id,
      })

      await reloadEnrollments(safeUserId)
      showToast('Заявка на запись отправлена', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось записать ребёнка',
        { type: 'error' }
      )
    } finally {
      setEnrollmentSubmittingId(null)
    }
  }

  async function handleUnenroll(enrollmentId: number) {
    try {
      await deleteEnrollment(enrollmentId)

      setEnrollments((prev) => prev.filter((item) => item.id !== enrollmentId))
      showToast('Запись отменена', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось отменить запись',
        { type: 'error' }
      )
    }
  }

  if (!auth || !isParent || typeof userId !== 'number') {
    return (
      <>
        <Header />

        <main className="page-parent">
          
          <PageContainer>
            <section className="parent-section-card">
              <div className="parent-section-header">
                <h1>Кабинет родителя недоступен</h1>
                <p>Войдите как родитель, чтобы пользоваться этим разделом.</p>
              </div>

              <Link to="/login" className="btn btn-primary">
                Перейти ко входу
              </Link>
            </section>
          </PageContainer>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="page-parent">
         <div className="parent-tabs-bar">
          <PageContainer>
            <div className="parent-tabs">
            <button
              type="button"
              className={`parent-tab-btn ${activeSection === 'schedule' ? 'active' : ''
                }`}
              onClick={() => setActiveSection('schedule')}
            >
              Расписание
            </button>

            <button
              type="button"
              className={`parent-tab-btn ${activeSection === 'search' ? 'active' : ''
                }`}
              onClick={() => setActiveSection('search')}
            >
              Найти занятия
            </button>

            <button
              type="button"
              className={`parent-tab-btn ${activeSection === 'kids' ? 'active' : ''
                }`}
              onClick={() => setActiveSection('kids')}
            >
              Мои дети
            </button>

            <button
              type="button"
              className={`parent-tab-btn ${activeSection === 'profile' ? 'active' : ''
                }`}
              onClick={() => setActiveSection('profile')}
            >
              Мой профиль
            </button>

            <button
              type="button"
              className={`parent-tab-btn ${activeSection === 'help' ? 'active' : ''
                }`}
              onClick={() => setActiveSection('help')}
            >
              Помощь
            </button>
          </div>
          </PageContainer>

           </div>
  

        <PageContainer>
          <section className="parent-hero">
            <p className="parent-subtitle">Добро пожаловать, {userName}</p>
          </section>

       {activeSection === 'schedule' && nextLessons.length > 0 && (
              <section className="parent-card parent-next-lessons">
              <h3>Ближайшие занятия</h3>

              <div className="parent-next-list">
                {nextLessons.map((item) => {
                  const activity = activities.find(
                    (activityItem) => activityItem.id === item.activity_id
                  )

                  return (
                    <div key={item.id} className="parent-card">
                      <b>{item.title}</b>
                      <p>
                        {item.child_name} · {item.center_name}
                      </p>
                      <p>
                        {activity
                          ? getSessionText(activity)
                          : 'Расписание уточняется'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

         

          <section className="parent-main">
            {activeSection === 'schedule' && (
              <div className="parent-section-card">
                <div className="parent-section-header">
                  <h1>Расписание</h1>
                  <p>Школьные уроки и кружки детей в одном месте.</p>
                </div>

                <div className="parent-schedule-controls">
                  <div className="parent-field">
                    <label>Ребёнок</label>
                    <select
                      className="parent-select"
                      value={selectedScheduleChildId}
                      onChange={(e) => {
                        setSelectedScheduleChildId(e.target.value)
                        resetLessonForm()
                      }}
                    >
                      <option value="all">Все дети</option>
                      {kids.map((kid) => (
                        <option key={kid.id} value={kid.id}>
                          {kid.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="parent-field">
                    <label>Период</label>
                    <select
                      className="parent-select"
                      value={scheduleView}
                      onChange={(e) =>
                        setScheduleView(e.target.value as ScheduleView)
                      }
                    >
                      <option value="day">День</option>
                      <option value="week">Неделя</option>
                      <option value="month">Месяц</option>
                    </select>
                  </div>

                  {scheduleView === 'day' && (
                    <div className="parent-field">
                      <label>День</label>
                      <select
                        className="parent-select"
                        value={selectedScheduleDay}
                        onChange={(e) => setSelectedScheduleDay(e.target.value)}
                      >
                        {weekdays
                          .filter((day) => day.value)
                          .map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="parent-field">
                    <label>Что показать</label>
                    <select
                      className="parent-select"
                      value={scheduleMode}
                      onChange={(e) =>
                        setScheduleMode(e.target.value as ScheduleMode)
                      }
                    >
                      <option value="all">Школа + кружки</option>
                      <option value="school">Только школа</option>
                      <option value="activities">Только кружки</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm parent-export-btn"
                    onClick={handleExportSchedule}
                  >
                    Экспортировать
                  </button>
                </div>

                {schoolLessonsLoading || enrollmentsLoading ? (
                  <p>Загрузка расписания...</p>
                ) : (
                  <div className="parent-schedule-list">
                    {kids
                      .filter((kid) =>
                        selectedScheduleChildId === 'all'
                          ? true
                          : kid.id === Number(selectedScheduleChildId)
                      )
                      .map((kid) => {
                        const childLessons = schoolLessons.filter(
                          (lesson) => lesson.child_id === kid.id
                        )

                        const childEnrollments = enrollments.filter(
                          (item) => item.child_id === kid.id
                        )

                        const visibleDays =
                          scheduleView === 'day'
                            ? weekdays.filter(
                              (day) => day.value === selectedScheduleDay
                            )
                            : weekdays.filter((day) => day.value)

                        const monthWeeks = [1, 2, 3, 4]

                        return (
                          <div key={kid.id} className="parent-schedule-child">
                            <h2>{kid.name}</h2>

                            <div
                              className={
                                scheduleView === 'month'
                                  ? 'parent-month-grid'
                                  : 'parent-week-view'
                              }
                            >
                              {(scheduleView === 'month' ? monthWeeks : [1]).map(
                                (weekNumber) => (
                                  <div
                                    key={weekNumber}
                                    className={
                                      scheduleView === 'month'
                                        ? 'parent-month-week'
                                        : 'parent-week-row'
                                    }
                                  >
                                    {scheduleView === 'month' && (
                                      <h3>Неделя {weekNumber}</h3>
                                    )}

                                    <div className="parent-week-grid">
                                      {visibleDays.map((day) => {
                                        const dayNumber = Number(day.value)

                                        const lessonsByDay =
                                          childLessons.filter(
                                            (lesson) =>
                                              lesson.weekday === dayNumber
                                          )

                                        const enrollmentsByDay =
                                          childEnrollments.filter((item) => {
                                            const activity = activities.find(
                                              (activityItem) =>
                                                activityItem.id ===
                                                item.activity_id
                                            )

                                            return activity?.sessions?.some(
                                              (session) =>
                                                session.weekday === dayNumber
                                            )
                                          })

                                        const isEmpty =
                                          (scheduleMode === 'activities' ||
                                            lessonsByDay.length === 0) &&
                                          (scheduleMode === 'school' ||
                                            enrollmentsByDay.length === 0)

                                        return (
                                          <div
                                            key={day.value}
                                            className="parent-day-column"
                                          >
                                            <h3>{day.label}</h3>

                                            {isEmpty && (
                                              <p className="parent-empty-day">
                                                Нет занятий
                                              </p>
                                            )}

                                            {scheduleMode !== 'activities' &&
                                              lessonsByDay.map((lesson) => (
                                                <div
                                                  key={lesson.id}
                                                  className="parent-schedule-item school"
                                                >
                                                  <b>{lesson.subject}</b>
                                                  <span>
                                                    {lesson.start_time?.slice(
                                                      0,
                                                      5
                                                    )}
                                                    –
                                                    {lesson.end_time?.slice(
                                                      0,
                                                      5
                                                    )}
                                                  </span>

                                                  {lesson.lesson_number && (
                                                    <small>
                                                      Урок №
                                                      {lesson.lesson_number}
                                                    </small>
                                                  )}

                                                  {lesson.classroom && (
                                                    <small>
                                                      Кабинет:{' '}
                                                      {lesson.classroom}
                                                    </small>
                                                  )}

                                                  <div className="parent-mini-actions">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        startEditLesson(lesson)
                                                      }
                                                    >
                                                      Изм.
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleDeleteLesson(
                                                          lesson.id
                                                        )
                                                      }
                                                    >
                                                      Удалить
                                                    </button>
                                                  </div>
                                                </div>
                                              ))}

                                            {scheduleMode !== 'school' &&
                                              enrollmentsByDay.map((item) => {
                                                const activity =
                                                  activities.find(
                                                    (activityItem) =>
                                                      activityItem.id ===
                                                      item.activity_id
                                                  )

                                                const sessions =
                                                  activity?.sessions?.filter(
                                                    (session) =>
                                                      session.weekday ===
                                                      dayNumber
                                                  ) || []

                                                return sessions.map(
                                                  (session, sessionIndex) => (
                                                    <div
                                                      key={`${item.id}-${sessionIndex}`}
                                                      className="parent-schedule-item activity"
                                                    >
                                                      <b>{item.title}</b>
                                                      <span>
                                                        {session.start_time.slice(
                                                          0,
                                                          5
                                                        )}
                                                        –
                                                        {session.end_time.slice(
                                                          0,
                                                          5
                                                        )}
                                                      </span>
                                                      <small>
                                                        {item.center_name}
                                                      </small>
                                                      <small>
                                                        {
                                                          enrollmentStatusMap[
                                                          item.status
                                                          ]
                                                        }
                                                      </small>

                                                      <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() =>
                                                          handleUnenroll(
                                                            item.id
                                                          )
                                                        }
                                                      >
                                                        Отменить
                                                      </button>
                                                    </div>
                                                  )
                                                )
                                              })}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                <div className="parent-form-card parent-lesson-form">
                  <h3>
                    {editingLessonId
                      ? 'Редактировать школьный урок'
                      : selectedScheduleChildId === 'all'
                        ? 'Выберите ребёнка, чтобы добавить школьный урок'
                        : 'Добавить школьный урок'}
                  </h3>

                  {selectedScheduleChildId === 'all' && !editingLessonId ? (
                    <p className="parent-muted-text">
                      Для добавления урока выберите одного ребёнка в фильтре
                      выше.
                    </p>
                  ) : (
                    <>
                      <div className="parent-lesson-grid">
                        <div className="parent-field">
                          <label>День недели</label>
                          <select
                            className="parent-select"
                            name="weekday"
                            value={lessonForm.weekday}
                            onChange={handleLessonChange}
                          >
                            {weekdays
                              .filter((day) => day.value)
                              .map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="parent-field">
                          <label>Номер урока</label>
                          <input
                            className="parent-input"
                            type="number"
                            name="lesson_number"
                            value={lessonForm.lesson_number}
                            onChange={handleLessonChange}
                          />
                        </div>

                        <div className="parent-field">
                          <label>Начало</label>
                          <input
                            className="parent-input"
                            type="time"
                            name="start_time"
                            value={lessonForm.start_time}
                            onChange={handleLessonChange}
                          />
                        </div>

                        <div className="parent-field">
                          <label>Конец</label>
                          <input
                            className="parent-input"
                            type="time"
                            name="end_time"
                            value={lessonForm.end_time}
                            onChange={handleLessonChange}
                          />
                        </div>

                        <div className="parent-field">
                          <label>Предмет</label>
                          <input
                            className="parent-input"
                            type="text"
                            name="subject"
                            value={lessonForm.subject}
                            onChange={handleLessonChange}
                          />
                        </div>

                        <div className="parent-field">
                          <label>Кабинет</label>
                          <input
                            className="parent-input"
                            type="text"
                            name="classroom"
                            value={lessonForm.classroom}
                            onChange={handleLessonChange}
                          />
                        </div>
                      </div>

                      <div className="parent-card-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={handleSaveLesson}
                        >
                          {editingLessonId
                            ? 'Сохранить изменения'
                            : 'Добавить урок'}
                        </button>

                        {editingLessonId && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={resetLessonForm}
                          >
                            Отмена
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'search' && (
              <div className="parent-section-card">
                <div className="parent-section-header">
                  <h1>Найти занятия</h1>
                  <p>Посмотрите доступные кружки и запишите ребёнка.</p>
                </div>

                <div className="parent-search-layout">
                  <aside className="parent-filters-card">
                    <h3>Фильтры</h3>

                    <div className="parent-field">
                      <label>Обычный поиск</label>
                      <input
                        className="parent-input"
                        type="text"
                        name="text"
                        placeholder="Название, центр или адрес"
                        value={filters.text}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="parent-field">
                      <label>Город</label>
                      <input
                        className="parent-input"
                        type="text"
                        name="city"
                        placeholder="Например, Симферополь"
                        value={filters.city}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="parent-field">
                      <label>Возраст ребёнка</label>
                      <input
                        className="parent-input"
                        type="number"
                        name="age"
                        placeholder="Например, 8"
                        value={filters.age}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="parent-field">
                      <label>Категория</label>
                      <select
                        className="parent-select"
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                      >
                        <option value="">Любая</option>
                        <option value="спорт">Спорт</option>
                        <option value="творчество">Творчество</option>
                        <option value="IT">IT</option>
                        <option value="языки">Языки</option>
                      </select>
                    </div>

                    <div className="parent-field">
                      <label>Цена от</label>
                      <input
                        className="parent-input"
                        type="number"
                        name="minPrice"
                        placeholder="0"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="parent-field">
                      <label>Цена до</label>
                      <input
                        className="parent-input"
                        type="number"
                        name="maxPrice"
                        placeholder="5000"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="parent-field">
                      <label>День недели</label>
                      <select
                        className="parent-select"
                        name="weekday"
                        value={filters.weekday}
                        onChange={handleFilterChange}
                      >
                        {weekdays.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="parent-field">
                      <label>Время</label>
                      <select
                        className="parent-select"
                        name="timeOfDay"
                        value={filters.timeOfDay}
                        onChange={handleFilterChange}
                      >
                        <option value="">Любое</option>
                        <option value="morning">Утро</option>
                        <option value="day">День</option>
                        <option value="evening">Вечер</option>
                      </select>
                    </div>
                  </aside>

                  <section>
                    <div className="parent-search-header-line">
                      <div>
                        <h2>Доступные занятия</h2>
                        <p>Найдено: {filteredActivities.length}</p>
                      </div>
                    </div>

                    {activitiesLoading && <p>Загрузка кружков...</p>}

                    <div className="parent-activities-list">
                      {!activitiesLoading &&
                        filteredActivities.length === 0 && (
                          <p>По вашему запросу ничего не найдено.</p>
                        )}

                     {filteredActivities.map((activity) => {
  const selectedEnrollment =
    getActivityEnrollmentForSelectedChild(activity.id)

  return (
    <article
      key={activity.id}
      className="parent-activity-card"
    >
      <h3>{activity.title}</h3>

      <p>
        <b>Центр:</b>{' '}
        {activity.center_id ? (
          <Link to={`/centers/${activity.center_id}`}>
            {activity.center_name}
          </Link>
        ) : (
          activity.center_name
        )}
      </p>

      <p><b>Город:</b> {activity.city}</p>
      <p><b>Возраст:</b> {activity.age_min}–{activity.age_max}</p>
      <p><b>Категория:</b> {activity.category}</p>
      <p><b>Адрес:</b> {activity.address}</p>
      <p><b>Расписание:</b> {getSessionText(activity)}</p>

      {activity.short_description && <p>{activity.short_description}</p>}

      <p><b>Цена:</b> {activity.price} ₽</p>

      <div className="parent-card-actions">
        <Link
          to={`/activity/${activity.id}`}
          className="btn btn-outline btn-sm"
        >
          Подробнее
        </Link>

        <select
          className="parent-select"
          value={selectedChildByActivity[activity.id] || ''}
          onChange={(e) =>
            setSelectedChildByActivity((prev) => ({
              ...prev,
              [activity.id]: e.target.value,
            }))
          }
        >
          <option value="">Выберите ребёнка</option>
          {kids.map((kid) => (
            <option key={kid.id} value={kid.id}>
              {kid.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={
            selectedEnrollment
              ? 'btn btn-secondary btn-sm'
              : 'btn btn-primary btn-sm'
          }
          onClick={() => handleEnroll(activity)}
          disabled={
            !!selectedEnrollment ||
            enrollmentSubmittingId === activity.id
          }
        >
          {selectedEnrollment
            ? `Уже записан: ${enrollmentStatusMap[selectedEnrollment.status]}`
            : enrollmentSubmittingId === activity.id
            ? 'Отправляем...'
            : 'Записать'}
        </button>

        {selectedEnrollment && (
          <p className="parent-enrolled-note">
            Ребёнок уже записан на это занятие.
          </p>
        )}
      </div>
    </article>
  )
})}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeSection === 'kids' && (
              <div className="parent-section-card">
                <div className="parent-section-header parent-section-header-row">
                  <div>
                    <h1>Мои дети</h1>
                    <p>Добавляйте и редактируйте профили детей.</p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setIsAddingKid(true)}
                  >
                    + Добавить ребёнка
                  </button>
                </div>

                <div className="parent-kids-list">
                  {kidsLoading && <p>Загрузка детей...</p>}

                  {!kidsLoading && kids.length === 0 && (
                    <p>Пока нет добавленных детей</p>
                  )}

                  {kids.map((kid) => {
                    const age = getKidAge(kid.birthdate)
                    const isEditing = editingKidId === kid.id

                    return (
                      <article key={kid.id} className="parent-kid-card">
                        <h3>{kid.name}</h3>

                        <p>
                          <b>Возраст:</b>{' '}
                          {age !== null ? `${age} лет` : 'не указан'}
                        </p>

                        <div className="parent-card-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => startEditKid(kid)}
                          >
                            Редактировать
                          </button>

                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDeleteKid(kid.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
  <div className="parent-section-card">
    <div className="parent-section-header">
      <h1>Мой профиль</h1>
      <p>Здесь можно хранить контактные данные родителя.</p>
    </div>

    {profileLoading && <p>Загрузка профиля...</p>}

    {!profileLoading && (
      <form className="parent-form-card" onSubmit={handleProfileSubmit}>
        <div className="parent-field">
          <label>Город</label>
          <input
            className="parent-input"
            type="text"
            name="city"
            value={profile.city}
            onChange={handleProfileChange}
          />
        </div>

        <div className="parent-field">
          <label>Telegram</label>
          <input
            className="parent-input"
            type="text"
            name="telegram"
            value={profile.telegram}
            onChange={handleProfileChange}
          />
        </div>

        <div className="parent-field">
          <label>WhatsApp</label>
          <input
            className="parent-input"
            type="text"
            name="whatsapp"
            value={profile.whatsapp}
            onChange={handleProfileChange}
          />
        </div>

        <div className="parent-field">
          <label>Email</label>
          <input
            className="parent-input"
            type="email"
            name="email"
            value={profile.email}
            onChange={handleProfileChange}
          />
        </div>

        <div className="parent-field">
          <label>Аватар URL</label>
          <input
            className="parent-input"
            type="text"
            name="avatar_url"
            value={profile.avatar_url}
            onChange={handleProfileChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={profileSaving}
        >
          {profileSaving ? 'Сохраняем...' : 'Сохранить профиль'}
        </button>
      </form>
    )}
  </div>
)}

            {activeSection === 'help' && (
  <div className="parent-section-card">
    <div className="parent-section-header">
      <h1>Помощь</h1>
      <p>Короткая инструкция и контакты поддержки.</p>
    </div>

    <div className="parent-help-grid">
      <div className="parent-card">
        <h3>Как пользоваться кабинетом</h3>

        <ol className="parent-help-list">
          <li>Сначала откройте вкладку «Расписание».</li>
          <li>Выберите ребёнка и добавьте школьные уроки.</li>
          <li>Перейдите в «Найти занятия» и подберите кружок.</li>
          <li>Выберите ребёнка и нажмите «Записать».</li>
          <li>
            Если кружок пересекается со школой или другим кружком,
            система покажет предупреждение.
          </li>
          <li>Расписание можно экспортировать в текстовый файл.</li>
        </ol>
      </div>

      <div className="parent-support-card">
        <div>
          <div className="support-kicker">📩 Поддержка и связь</div>
          <h2>Нужна помощь?</h2>
          <p>
            Напишите нам — поможем разобраться с расписанием,
            записью на кружки и личным кабинетом.
          </p>
        </div>

        <div className="support-contacts">
          <a
            href="https://vk.com/id535966949"
            className="support-contact-link"
            target="_blank"
            rel="noreferrer"
          >
            <span className="support-contact-icon">VK</span>
            <span>ВКонтакте</span>
          </a>

          <a
            href="https://t.me/vladlena_ll"
            className="support-contact-link"
            target="_blank"
            rel="noreferrer"
          >
            <span className="support-contact-icon">TG</span>
            <span>Telegram</span>
          </a>

          <button
            type="button"
            className="support-contact-link"
            onClick={handleCopyEmail}
          >
            <span className="support-contact-icon">@</span>
            <span>vladlenalutsyuk@yandex.ru</span>
          </button>
        </div>
      </div>
    </div>
  </div>
)}
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default ParentDashboardPage