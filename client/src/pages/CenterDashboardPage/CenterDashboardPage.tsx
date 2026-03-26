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
  deleteCenterActivity,
  type CenterActivity,
} from '../../api/centerActivitiesApi'

import {
  getCenterEnrollments,
  updateCenterEnrollmentStatus,
  type CenterEnrollment,
} from '../../api/centerEnrollmentsApi'

type Section =
  | 'dashboard'
  | 'profile'
  | 'activities'
  | 'enrollments'
  | 'help'

const enrollmentStatusMap: Record<CenterEnrollment['status'], string> = {
  pending: 'Ожидание',
  approved: 'Подтверждено',
  declined: 'Отклонено',
  cancelled: 'Отменено',
}

function CenterDashboardPage() {
  const auth = getAuth()
  const userId = auth?.user?.id

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

  const [enrollments, setEnrollments] = useState<CenterEnrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')

  const centerName =
    dashboard?.center?.name ||
    profile?.name ||
    auth?.user?.name ||
    'Центр'

  useEffect(() => {
    if (typeof userId !== 'number') {
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
      } finally {
        setDashboardLoading(false)
      }
    }

    loadDashboard()
  }, [userId])

  useEffect(() => {
    if (typeof userId !== 'number') {
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
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  useEffect(() => {
    if (typeof userId !== 'number') {
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
  }, [userId, activeSection])

  useEffect(() => {
    if (typeof userId !== 'number') {
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
  }, [userId, activeSection, statusFilter, activityFilter])

  const activityOptions = useMemo(() => {
    return activities.map((activity) => ({
      id: activity.id,
      title: activity.title,
    }))
  }, [activities])

  function handleProfileChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      alert('Профиль центра не найден')
      return
    }

    if (!profile.name.trim() || !profile.city.trim() || !profile.address.trim()) {
      alert('Заполните обязательные поля: название, город и адрес')
      return
    }

    try {
      setProfileSaving(true)

      const updated = await updateCenterProfile({
        userId,
        name: profile.name,
        short_description: profile.short_description,
        full_description: profile.full_description,
        city: profile.city,
        address: profile.address,
        landmark: profile.landmark,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        telegram: profile.telegram,
        whatsapp: profile.whatsapp,
        vk: profile.vk,
        logo_url: profile.logo_url,
        photo_url: profile.photo_url,
      })

      setProfile(updated)
      alert('Профиль центра сохранён')
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить профиль центра'
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

  async function handleCreateActivity() {
    if (typeof userId !== 'number') {
      alert('Пользователь центра не найден')
      return
    }

    if (
      !newActivity.title.trim() ||
      !newActivity.category.trim() ||
      !newActivity.age_min.trim() ||
      !newActivity.age_max.trim()
    ) {
      alert('Заполните обязательные поля кружка')
      return
    }

    try {
      setActivitySubmitting(true)

      const created = await createCenterActivity({
        userId,
        title: newActivity.title.trim(),
        category: newActivity.category.trim(),
        age_min: Number(newActivity.age_min),
        age_max: Number(newActivity.age_max),
        short_description: newActivity.short_description || null,
        description: newActivity.description || null,
        price: newActivity.price ? Number(newActivity.price) : 0,
        payment_type: newActivity.payment_type,
        capacity: newActivity.capacity ? Number(newActivity.capacity) : null,
        sessions: [],
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

      alert('Кружок создан')
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error ? error.message : 'Не удалось создать кружок'
      )
    } finally {
      setActivitySubmitting(false)
    }
  }

  async function handleDeleteActivity(activityId: number) {
    try {
      await deleteCenterActivity(activityId)
      setActivities((prev) => prev.filter((item) => item.id !== activityId))
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error ? error.message : 'Не удалось удалить кружок'
      )
    }
  }

  async function handleUpdateEnrollmentStatus(
    enrollmentId: number,
    status: CenterEnrollment['status']
  ) {
    try {
      const updated = await updateCenterEnrollmentStatus(enrollmentId, {
        status,
      })

      setEnrollments((prev) =>
        prev.map((item) => (item.id === enrollmentId ? updated : item))
      )
    } catch (error) {
      console.error(error)
      alert(
        error instanceof Error
          ? error.message
          : 'Не удалось обновить статус заявки'
      )
    }
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
                      Добавляйте и удаляйте кружки центра
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

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateActivity}
                      disabled={activitySubmitting}
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

                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleDeleteActivity(activity.id)}
                      >
                        Удалить
                      </button>
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

                  {enrollments.map((item) => (
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
                        >
                          Подтвердить
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            handleUpdateEnrollmentStatus(item.id, 'declined')
                          }
                        >
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
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
                      <li>Добавьте кружки во вкладке «Мои кружки».</li>
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
    </>
  )
}

export default CenterDashboardPage