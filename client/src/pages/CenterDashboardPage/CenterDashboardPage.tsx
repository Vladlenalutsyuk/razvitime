import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getAuth } from '../../utils/auth'

import {
  getCenterDashboard,
  getCenterProfile,
  updateCenterProfile,
  type CenterDashboardResponse,
  type CenterProfile,
} from '../../api/centerApi'

import {
  getCenterActivities,
  createCenterActivity,
  updateCenterActivity,
  deleteCenterActivity,
  type CenterActivity,
} from '../../api/centerActivitiesApi'

import {
  getCenterEnrollments,
  updateCenterEnrollmentStatus,
  type CenterEnrollment,
} from '../../api/centerEnrollmentsApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'

type Section =
  | 'dashboard'
  | 'profile'
  | 'activities'
  | 'enrollments'
  | 'help'

type EditableSession = {
  weekday: string
  start_time: string
  end_time: string
}

type EditActivityForm = {
  title: string
  category: string
  age_min: string
  age_max: string
  short_description: string
  description: string
  price: string
  payment_type: 'monthly' | 'per_lesson' | 'free'
  capacity: string
  is_active: boolean
  sessions: EditableSession[]
}

const enrollmentStatusMap: Record<CenterEnrollment['status'], string> = {
  pending: 'Ожидание',
  approved: 'Подтверждено',
  declined: 'Отклонено',
  cancelled: 'Отменено',
}

const weekdayOptions = [
  { value: '1', label: 'Понедельник' },
  { value: '2', label: 'Вторник' },
  { value: '3', label: 'Среда' },
  { value: '4', label: 'Четверг' },
  { value: '5', label: 'Пятница' },
  { value: '6', label: 'Суббота' },
  { value: '7', label: 'Воскресенье' },
]

const weekdayMap: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
}

function createEmptySession(): EditableSession {
  return {
    weekday: '1',
    start_time: '',
    end_time: '',
  }
}

function buildEditForm(activity: CenterActivity): EditActivityForm {
  return {
    title: activity.title,
    category: activity.category,
    age_min: String(activity.age_min),
    age_max: String(activity.age_max),
    short_description: activity.short_description || '',
    description: activity.description || '',
    price: String(activity.price ?? 0),
    payment_type: activity.payment_type,
    capacity: activity.capacity != null ? String(activity.capacity) : '',
    is_active: activity.is_active,
    sessions:
      activity.sessions && activity.sessions.length > 0
        ? activity.sessions.map((session) => ({
            weekday: String(session.weekday),
            start_time: session.start_time,
            end_time: session.end_time,
          }))
        : [createEmptySession()],
  }
}

function normalizeSessions(sessions: EditableSession[]) {
  return sessions
    .map((session) => ({
      weekday: Number(session.weekday),
      start_time: session.start_time,
      end_time: session.end_time,
    }))
    .filter(
      (session) =>
        Number.isFinite(session.weekday) &&
        session.weekday >= 1 &&
        session.weekday <= 7 &&
        session.start_time &&
        session.end_time
    )
}

function validateActivityForm(form: {
  title: string
  category: string
  age_min: string
  age_max: string
  price: string
  capacity: string
  sessions: EditableSession[]
}) {
  if (
    !form.title.trim() ||
    !form.category.trim() ||
    !form.age_min.trim() ||
    !form.age_max.trim()
  ) {
    return 'Заполните обязательные поля кружка'
  }

  const ageMin = Number(form.age_min)
  const ageMax = Number(form.age_max)
  const price = form.price.trim() ? Number(form.price) : 0
  const capacity = form.capacity.trim() ? Number(form.capacity) : null

  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax)) {
    return 'Возраст должен быть числом'
  }

  if (ageMin < 0 || ageMax < 0 || ageMin > ageMax) {
    return 'Проверьте возрастной диапазон'
  }

  if (!Number.isFinite(price) || price < 0) {
    return 'Цена указана некорректно'
  }

  if (capacity !== null && (!Number.isFinite(capacity) || capacity <= 0)) {
    return 'Вместимость должна быть положительным числом'
  }

  const normalizedSessions = normalizeSessions(form.sessions)

  if (normalizedSessions.length === 0) {
    return 'Добавьте хотя бы одно занятие в расписание'
  }

  const hasInvalidTime = normalizedSessions.some(
    (session) => session.start_time >= session.end_time
  )

  if (hasInvalidTime) {
    return 'В расписании время начала должно быть раньше времени окончания'
  }

  return null
}

function CenterDashboardPage() {
  const auth = getAuth()
  const userId = auth?.user?.id
  const isCenter = auth?.user?.role === 'center_admin'
  const { showToast } = useToast()

  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  const [dashboard, setDashboard] = useState<CenterDashboardResponse | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [profile, setProfile] = useState<CenterProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const [activities, setActivities] = useState<CenterActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitySubmitting, setActivitySubmitting] = useState(false)

  const [newActivity, setNewActivity] = useState({
    title: '',
    category: '',
    age_min: '',
    age_max: '',
    short_description: '',
    description: '',
    price: '',
    payment_type: 'monthly' as 'monthly' | 'per_lesson' | 'free',
    capacity: '',
  })

  const [newActivitySessions, setNewActivitySessions] = useState<EditableSession[]>([
    createEmptySession(),
  ])

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [editActivityForm, setEditActivityForm] = useState<EditActivityForm | null>(null)
  const [editActivitySaving, setEditActivitySaving] = useState(false)

  const [enrollments, setEnrollments] = useState<CenterEnrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [enrollmentActionLoadingId, setEnrollmentActionLoadingId] = useState<number | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')

  const centerName =
    dashboard?.center?.name ||
    profile?.name ||
    auth?.user?.name ||
    auth?.user?.center_name ||
    'Центр'

  useEffect(() => {
    if (typeof userId !== 'number' || !isCenter) {
      setDashboard(null)
      return
    }

    const safeUserId = userId

    async function loadDashboard() {
      try {
        setDashboardLoading(true)
        const data = await getCenterDashboard(safeUserId)
        setDashboard(data)
      } catch (error) {
        console.error(error)
        setDashboard(null)
      } finally {
        setDashboardLoading(false)
      }
    }

    loadDashboard()
  }, [userId, isCenter])

  useEffect(() => {
    if (typeof userId !== 'number' || !isCenter) {
      setProfile(null)
      return
    }

    const safeUserId = userId

    async function loadProfile() {
      try {
        setProfileLoading(true)
        const data = await getCenterProfile(safeUserId)
        setProfile(data)
      } catch (error) {
        console.error(error)
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [userId, isCenter])

  useEffect(() => {
    if (typeof userId !== 'number' || !isCenter) {
      setActivities([])
      return
    }

    const safeUserId = userId

    async function loadActivities() {
      try {
        setActivitiesLoading(true)
        const data = await getCenterActivities(safeUserId)
        setActivities(data)
      } catch (error) {
        console.error(error)
        setActivities([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    loadActivities()
  }, [userId, isCenter])

  useEffect(() => {
    if (typeof userId !== 'number' || !isCenter) {
      setEnrollments([])
      return
    }

    const safeUserId = userId

    async function loadEnrollments() {
      try {
        setEnrollmentsLoading(true)
        const data = await getCenterEnrollments({
          userId: safeUserId,
          status: statusFilter || undefined,
          activityId: activityFilter || undefined,
        })
        setEnrollments(data)
      } catch (error) {
        console.error(error)
        setEnrollments([])
      } finally {
        setEnrollmentsLoading(false)
      }
    }

    loadEnrollments()
  }, [userId, isCenter, statusFilter, activityFilter])

  const activityOptions = useMemo(() => {
    return activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
    }))
  }, [activities])

  function handleProfileChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target

    setProfile((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        [name]: value,
      }
    })
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()

    if (typeof userId !== 'number' || !profile) {
      showToast('Профиль центра не найден', { type: 'error' })
      return
    }

    if (!profile.name.trim() || !profile.city.trim() || !profile.address.trim()) {
      showToast('Заполните обязательные поля: название, город и адрес', {
        type: 'error',
      })
      return
    }

    try {
      setProfileSaving(true)

      const updated = await updateCenterProfile({
        userId,
        name: profile.name.trim(),
        short_description: profile.short_description?.trim() || null,
        full_description: profile.full_description?.trim() || null,
        city: profile.city.trim(),
        address: profile.address.trim(),
        landmark: profile.landmark?.trim() || null,
        phone: profile.phone?.trim() || null,
        email: profile.email?.trim() || null,
        website: profile.website?.trim() || null,
        telegram: profile.telegram?.trim() || null,
        whatsapp: profile.whatsapp?.trim() || null,
        vk: profile.vk?.trim() || null,
        logo_url: profile.logo_url?.trim() || null,
        photo_url: profile.photo_url?.trim() || null,
      })

      setProfile(updated)
      showToast('Профиль центра сохранён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить профиль центра',
        { type: 'error' }
      )
    } finally {
      setProfileSaving(false)
    }
  }

  function handleNewActivityChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    setNewActivity((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleNewSessionChange(
    index: number,
    field: keyof EditableSession,
    value: string
  ) {
    setNewActivitySessions((prev) =>
      prev.map((session, i) =>
        i === index ? { ...session, [field]: value } : session
      )
    )
  }

  function handleAddNewSession() {
    setNewActivitySessions((prev) => [...prev, createEmptySession()])
  }

  function handleRemoveNewSession(index: number) {
    setNewActivitySessions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateActivity() {
    if (typeof userId !== 'number') {
      showToast('Пользователь центра не найден', { type: 'error' })
      return
    }

    const validationError = validateActivityForm({
      ...newActivity,
      sessions: newActivitySessions,
    })

    if (validationError) {
      showToast(validationError, { type: 'error' })
      return
    }

    const ageMin = Number(newActivity.age_min)
    const ageMax = Number(newActivity.age_max)
    const price = newActivity.price.trim() ? Number(newActivity.price) : 0
    const capacity = newActivity.capacity.trim()
      ? Number(newActivity.capacity)
      : null

    try {
      setActivitySubmitting(true)

      const created = await createCenterActivity({
        userId,
        title: newActivity.title.trim(),
        category: newActivity.category.trim(),
        age_min: ageMin,
        age_max: ageMax,
        short_description: newActivity.short_description.trim() || null,
        description: newActivity.description.trim() || null,
        price,
        payment_type: newActivity.payment_type,
        capacity,
        sessions: normalizeSessions(newActivitySessions),
      })

      setActivities((prev) => [created, ...prev])

      setNewActivity({
        title: '',
        category: '',
        age_min: '',
        age_max: '',
        short_description: '',
        description: '',
        price: '',
        payment_type: 'monthly',
        capacity: '',
      })

      setNewActivitySessions([createEmptySession()])

      setDashboard((prev) => {
        if (!prev) {
          return prev
        }

        return {
          ...prev,
          stats: {
            ...prev.stats,
            activitiesCount: prev.stats.activitiesCount + 1,
          },
        }
      })

      showToast('Кружок создан', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось создать кружок',
        { type: 'error' }
      )
    } finally {
      setActivitySubmitting(false)
    }
  }

  function startEditingActivity(activity: CenterActivity) {
    setEditingActivityId(activity.id)
    setEditActivityForm(buildEditForm(activity))
  }

  function cancelEditingActivity() {
    if (editActivitySaving) {
      return
    }

    setEditingActivityId(null)
    setEditActivityForm(null)
  }

  function handleEditActivityChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement

    setEditActivityForm((prev) => {
      if (!prev) {
        return prev
      }

      if (type === 'checkbox') {
        return {
          ...prev,
          [name]: (e.target as HTMLInputElement).checked,
        }
      }

      return {
        ...prev,
        [name]: value,
      }
    })
  }

  function handleEditSessionChange(
    index: number,
    field: keyof EditableSession,
    value: string
  ) {
    setEditActivityForm((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        sessions: prev.sessions.map((session, i) =>
          i === index ? { ...session, [field]: value } : session
        ),
      }
    })
  }

  function handleAddEditSession() {
    setEditActivityForm((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        sessions: [...prev.sessions, createEmptySession()],
      }
    })
  }

  function handleRemoveEditSession(index: number) {
    setEditActivityForm((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        sessions: prev.sessions.filter((_, i) => i !== index),
      }
    })
  }

  async function handleSaveEditedActivity() {
    if (!editActivityForm || editingActivityId == null) {
      return
    }

    const validationError = validateActivityForm(editActivityForm)

    if (validationError) {
      showToast(validationError, { type: 'error' })
      return
    }

    const ageMin = Number(editActivityForm.age_min)
    const ageMax = Number(editActivityForm.age_max)
    const price = editActivityForm.price.trim()
      ? Number(editActivityForm.price)
      : 0
    const capacity = editActivityForm.capacity.trim()
      ? Number(editActivityForm.capacity)
      : null

    try {
      setEditActivitySaving(true)

      const updated = await updateCenterActivity(editingActivityId, {
        title: editActivityForm.title.trim(),
        category: editActivityForm.category.trim(),
        age_min: ageMin,
        age_max: ageMax,
        short_description: editActivityForm.short_description.trim() || null,
        description: editActivityForm.description.trim() || null,
        price,
        payment_type: editActivityForm.payment_type,
        capacity,
        is_active: editActivityForm.is_active,
        sessions: normalizeSessions(editActivityForm.sessions),
      })

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === editingActivityId ? updated : activity
        )
      )

      setEditingActivityId(null)
      setEditActivityForm(null)

      showToast('Кружок и расписание обновлены', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось обновить кружок',
        { type: 'error' }
      )
    } finally {
      setEditActivitySaving(false)
    }
  }

  async function handleDeleteActivity(activityId: number) {
    try {
      await deleteCenterActivity(activityId)

      setActivities((prev) => prev.filter((item) => item.id !== activityId))

      if (editingActivityId === activityId) {
        setEditingActivityId(null)
        setEditActivityForm(null)
      }

      setDashboard((prev) => {
        if (!prev) {
          return prev
        }

        return {
          ...prev,
          stats: {
            ...prev.stats,
            activitiesCount: Math.max(0, prev.stats.activitiesCount - 1),
          },
        }
      })

      showToast('Кружок удалён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось удалить кружок',
        { type: 'error' }
      )
    }
  }

  async function handleUpdateEnrollmentStatus(
    enrollmentId: number,
    status: CenterEnrollment['status']
  ) {
    try {
      setEnrollmentActionLoadingId(enrollmentId)

      const updated = await updateCenterEnrollmentStatus(enrollmentId, {
        status,
      })

      setEnrollments((prev) =>
        prev.map((item) => (item.id === enrollmentId ? updated : item))
      )

      showToast('Статус заявки обновлён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error
          ? error.message
          : 'Не удалось обновить статус заявки',
        { type: 'error' }
      )
    } finally {
      setEnrollmentActionLoadingId(null)
    }
  }

  if (!auth || !isCenter || typeof userId !== 'number') {
    return (
      <>
        <Header />
        <main className="page-parent">
          <PageContainer>
            <section className="section">
              <div className="section-header">
                <h1 className="section-title">Кабинет центра недоступен</h1>
                <p className="section-subtitle">
                  Войдите под аккаунтом центра, чтобы пользоваться этим разделом.
                </p>
              </div>
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
        <PageContainer>
          <div className="parent-layout">
            <aside className="parent-sidebar">
              <button
                className={`tab-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveSection('dashboard')}
              >
                Главная
              </button>

              <button
                className={`tab-btn ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                Профиль центра
              </button>

              <button
                className={`tab-btn ${activeSection === 'activities' ? 'active' : ''}`}
                onClick={() => setActiveSection('activities')}
              >
                Мои кружки
              </button>

              <button
                className={`tab-btn ${activeSection === 'enrollments' ? 'active' : ''}`}
                onClick={() => setActiveSection('enrollments')}
              >
                Заявки
              </button>

              <button
                className={`tab-btn ${activeSection === 'help' ? 'active' : ''}`}
                onClick={() => setActiveSection('help')}
              >
                Помощь
              </button>
            </aside>

            <section className="parent-main">
              {activeSection === 'dashboard' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Кабинет центра</h1>
                    <p className="section-subtitle">
                      Добро пожаловать, {centerName}
                    </p>
                  </div>

                  {dashboardLoading && <p>Загрузка дашборда...</p>}

                  {!dashboardLoading && dashboard && (
                    <div className="feature-grid">
                      <article className="feature-card">
                        <h3>Кружков размещено</h3>
                        <p>{dashboard.stats.activitiesCount}</p>
                      </article>

                      <article className="feature-card">
                        <h3>Заявок получено</h3>
                        <p>{dashboard.stats.enrollmentsCount}</p>
                      </article>

                      <article className="feature-card">
                        <h3>Тариф</h3>
                        <p>{dashboard.subscription?.subscription_name || 'Нет данных'}</p>
                      </article>

                      <article className="feature-card">
                        <h3>Подписка до</h3>
                        <p>{dashboard.subscription?.end_date || 'Нет данных'}</p>
                      </article>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'profile' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Информация о центре</h1>
                    <p className="section-subtitle">
                      Заполните карточку центра для родителей
                    </p>
                  </div>

                  {profileLoading && <p>Загрузка профиля...</p>}

                  {!profileLoading && profile && (
                    <form className="reminders-card" onSubmit={handleProfileSubmit}>
                      <div className="auth-field">
                        <label>Название центра</label>
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Краткое описание</label>
                        <input
                          type="text"
                          name="short_description"
                          value={profile.short_description || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Полное описание</label>
                        <textarea
                          name="full_description"
                          value={profile.full_description || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Город</label>
                        <input
                          type="text"
                          name="city"
                          value={profile.city}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Адрес</label>
                        <input
                          type="text"
                          name="address"
                          value={profile.address}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Ориентир</label>
                        <input
                          type="text"
                          name="landmark"
                          value={profile.landmark || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Телефон</label>
                        <input
                          type="text"
                          name="phone"
                          value={profile.phone || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Сайт</label>
                        <input
                          type="text"
                          name="website"
                          value={profile.website || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Telegram</label>
                        <input
                          type="text"
                          name="telegram"
                          value={profile.telegram || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>WhatsApp</label>
                        <input
                          type="text"
                          name="whatsapp"
                          value={profile.whatsapp || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>VK</label>
                        <input
                          type="text"
                          name="vk"
                          value={profile.vk || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Логотип (URL)</label>
                        <input
                          type="text"
                          name="logo_url"
                          value={profile.logo_url || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Фото центра (URL)</label>
                        <input
                          type="text"
                          name="photo_url"
                          value={profile.photo_url || ''}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={profileSaving}
                      >
                        {profileSaving ? 'Сохраняем...' : 'Сохранить данные центра'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {activeSection === 'activities' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Мои кружки</h1>
                    <p className="section-subtitle">
                      Добавляйте, редактируйте и удаляйте кружки центра
                    </p>
                  </div>

                  <div className="reminders-card" style={{ marginBottom: '16px' }}>
                    <h3>Добавить кружок</h3>

                    <div className="auth-field">
                      <label>Название</label>
                      <input
                        type="text"
                        name="title"
                        value={newActivity.title}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Категория</label>
                      <input
                        type="text"
                        name="category"
                        value={newActivity.category}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Возраст от</label>
                      <input
                        type="number"
                        name="age_min"
                        value={newActivity.age_min}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Возраст до</label>
                      <input
                        type="number"
                        name="age_max"
                        value={newActivity.age_max}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Краткое описание</label>
                      <input
                        type="text"
                        name="short_description"
                        value={newActivity.short_description}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Описание</label>
                      <textarea
                        name="description"
                        value={newActivity.description}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Цена</label>
                      <input
                        type="number"
                        name="price"
                        value={newActivity.price}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div className="auth-field">
                      <label>Тип оплаты</label>
                      <select
                        name="payment_type"
                        value={newActivity.payment_type}
                        onChange={handleNewActivityChange}
                      >
                        <option value="monthly">Ежемесячно</option>
                        <option value="per_lesson">За занятие</option>
                        <option value="free">Бесплатно</option>
                      </select>
                    </div>

                    <div className="auth-field">
                      <label>Вместимость</label>
                      <input
                        type="number"
                        name="capacity"
                        value={newActivity.capacity}
                        onChange={handleNewActivityChange}
                      />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <h3 style={{ marginBottom: '12px' }}>Расписание занятий</h3>

                      {newActivitySessions.map((session, index) => (
                        <div
                          key={index}
                          className="feature-card"
                          style={{ marginBottom: '12px' }}
                        >
                          <div className="auth-field">
                            <label>День недели</label>
                            <select
                              value={session.weekday}
                              onChange={(e) =>
                                handleNewSessionChange(index, 'weekday', e.target.value)
                              }
                            >
                              {weekdayOptions.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="auth-field">
                            <label>Время начала</label>
                            <input
                              type="time"
                              value={session.start_time}
                              onChange={(e) =>
                                handleNewSessionChange(index, 'start_time', e.target.value)
                              }
                            />
                          </div>

                          <div className="auth-field">
                            <label>Время окончания</label>
                            <input
                              type="time"
                              value={session.end_time}
                              onChange={(e) =>
                                handleNewSessionChange(index, 'end_time', e.target.value)
                              }
                            />
                          </div>

                          {newActivitySessions.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleRemoveNewSession(index)}
                            >
                              Удалить слот
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddNewSession}
                      >
                        + Добавить ещё день
                      </button>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateActivity}
                      disabled={activitySubmitting}
                      style={{ marginTop: '16px' }}
                    >
                      {activitySubmitting ? 'Создаём...' : 'Создать кружок'}
                    </button>
                  </div>

                  {activitiesLoading && <p>Загрузка кружков...</p>}

                  {!activitiesLoading && activities.length === 0 && (
                    <p>У центра пока нет кружков</p>
                  )}

                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="feature-card"
                      style={{ marginBottom: '12px' }}
                    >
                      <h3>{activity.title}</h3>
                      <p><b>Категория:</b> {activity.category}</p>
                      <p><b>Возраст:</b> {activity.age_min}–{activity.age_max}</p>
                      <p><b>Цена:</b> {activity.price} ₽</p>
                      <p><b>Статус:</b> {activity.is_active ? 'Активен' : 'Скрыт'}</p>

                      {activity.sessions && activity.sessions.length > 0 && (
                        <div style={{ marginTop: '12px' }}>
                          <b>Расписание:</b>
                          <div style={{ marginTop: '8px' }}>
                            {activity.sessions.map((session) => (
                              <p key={session.id}>
                                {weekdayMap[session.weekday] ||
                                  `День ${session.weekday}`}{' '}
                                — {session.start_time}–{session.end_time}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginTop: '12px',
                        }}
                      >
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => startEditingActivity(activity)}
                        >
                          Редактировать
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'enrollments' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Заявки</h1>
                    <p className="section-subtitle">
                      Просмотр и обработка заявок от родителей
                    </p>
                  </div>

                  <div className="search-layout" style={{ marginBottom: '16px' }}>
                    <aside className="filters-card">
                      <h3>Фильтры</h3>

                      <div className="filter-group">
                        <label className="filter-label">Статус</label>
                        <select
                          className="filter-select"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="">Все</option>
                          <option value="pending">Ожидание</option>
                          <option value="approved">Подтверждено</option>
                          <option value="declined">Отклонено</option>
                          <option value="cancelled">Отменено</option>
                        </select>
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Кружок</label>
                        <select
                          className="filter-select"
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value)}
                        >
                          <option value="">Все</option>
                          {activityOptions.map((activity) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </aside>
                  </div>

                  {enrollmentsLoading && <p>Загрузка заявок...</p>}

                  {!enrollmentsLoading && enrollments.length === 0 && (
                    <p>Заявок пока нет</p>
                  )}

                  {enrollments.map((item) => {
                    const isActionLoading = enrollmentActionLoadingId === item.id

                    return (
                      <div
                        key={item.id}
                        className="feature-card"
                        style={{ marginBottom: '12px' }}
                      >
                        <h3>{item.activity_title}</h3>
                        <p><b>Ребёнок:</b> {item.child_name}</p>
                        <p><b>Дата рождения:</b> {item.birthdate}</p>
                        <p><b>Родитель:</b> {item.parent_name}</p>
                        <p><b>Телефон:</b> {item.parent_phone || '—'}</p>
                        <p><b>Telegram:</b> {item.parent_telegram || '—'}</p>
                        <p><b>Email:</b> {item.parent_email || '—'}</p>
                        <p><b>Статус:</b> {enrollmentStatusMap[item.status]}</p>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleUpdateEnrollmentStatus(item.id, 'approved')
                            }
                            disabled={isActionLoading || item.status === 'approved'}
                          >
                            {isActionLoading ? 'Сохраняем...' : 'Подтвердить'}
                          </button>

                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() =>
                              handleUpdateEnrollmentStatus(item.id, 'declined')
                            }
                            disabled={isActionLoading || item.status === 'declined'}
                          >
                            {isActionLoading ? 'Сохраняем...' : 'Отклонить'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activeSection === 'help' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Помощь</h1>
                    <p className="section-subtitle">
                      Краткая инструкция для центра
                    </p>
                  </div>

                  <div className="feature-card">
                    <ol style={{ paddingLeft: '18px', margin: 0 }}>
                      <li>Заполните информацию о центре.</li>
                      <li>Добавьте кружки и укажите расписание.</li>
                      <li>Редактируйте кружки через кнопку «Редактировать».</li>
                      <li>Следите за заявками во вкладке «Заявки».</li>
                      <li>Подтверждайте или отклоняйте записи родителей.</li>
                    </ol>
                  </div>
                </div>
              )}
            </section>
          </div>
        </PageContainer>
      </main>

      {editingActivityId !== null && editActivityForm && (
        <div className="modal-overlay" onClick={cancelEditingActivity}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Редактирование кружка</h2>
                <p className="modal-subtitle">
                  Измените данные кружка и его расписание
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={cancelEditingActivity}
                disabled={editActivitySaving}
              >
                Закрыть
              </button>
            </div>

            <div className="auth-field">
              <label>Название</label>
              <input
                type="text"
                name="title"
                value={editActivityForm.title}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Категория</label>
              <input
                type="text"
                name="category"
                value={editActivityForm.category}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Возраст от</label>
              <input
                type="number"
                name="age_min"
                value={editActivityForm.age_min}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Возраст до</label>
              <input
                type="number"
                name="age_max"
                value={editActivityForm.age_max}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Краткое описание</label>
              <input
                type="text"
                name="short_description"
                value={editActivityForm.short_description}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Описание</label>
              <textarea
                name="description"
                value={editActivityForm.description}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Цена</label>
              <input
                type="number"
                name="price"
                value={editActivityForm.price}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label>Тип оплаты</label>
              <select
                name="payment_type"
                value={editActivityForm.payment_type}
                onChange={handleEditActivityChange}
              >
                <option value="monthly">Ежемесячно</option>
                <option value="per_lesson">За занятие</option>
                <option value="free">Бесплатно</option>
              </select>
            </div>

            <div className="auth-field">
              <label>Вместимость</label>
              <input
                type="number"
                name="capacity"
                value={editActivityForm.capacity}
                onChange={handleEditActivityChange}
              />
            </div>

            <div className="auth-field">
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={editActivityForm.is_active}
                  onChange={handleEditActivityChange}
                />
                Кружок активен
              </label>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Расписание занятий</h3>

              {editActivityForm.sessions.map((session, index) => (
                <div
                  key={index}
                  className="feature-card"
                  style={{ marginBottom: '12px' }}
                >
                  <div className="auth-field">
                    <label>День недели</label>
                    <select
                      value={session.weekday}
                      onChange={(e) =>
                        handleEditSessionChange(index, 'weekday', e.target.value)
                      }
                    >
                      {weekdayOptions.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <label>Время начала</label>
                    <input
                      type="time"
                      value={session.start_time}
                      onChange={(e) =>
                        handleEditSessionChange(index, 'start_time', e.target.value)
                      }
                    />
                  </div>

                  <div className="auth-field">
                    <label>Время окончания</label>
                    <input
                      type="time"
                      value={session.end_time}
                      onChange={(e) =>
                        handleEditSessionChange(index, 'end_time', e.target.value)
                      }
                    />
                  </div>

                  {editActivityForm.sessions.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRemoveEditSession(index)}
                    >
                      Удалить слот
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddEditSession}
              >
                + Добавить ещё день
              </button>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveEditedActivity}
                disabled={editActivitySaving}
              >
                {editActivitySaving ? 'Сохраняем...' : 'Сохранить'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={cancelEditingActivity}
                disabled={editActivitySaving}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CenterDashboardPage