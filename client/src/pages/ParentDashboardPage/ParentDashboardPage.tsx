import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
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
  deleteChild,
  type Child,
} from '../../api/childrenApi'

import { getActivities, type Activity } from '../../api/activitiesApi'

import {
  getEnrollments,
  deleteEnrollment,
  type Enrollment,
} from '../../api/enrollmentsApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'

type Section = 'search' | 'kids' | 'schedule' | 'profile' | 'help'

const enrollmentStatusMap: Record<Enrollment['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Подтверждена',
  declined: 'Отклонена',
  cancelled: 'Отменена',
}

function ParentDashboardPage() {
  const auth = getAuth()
  const userId = auth?.user?.id
  const isParent = auth?.user?.role === 'parent'
  const { showToast } = useToast()

  const [activeSection, setActiveSection] = useState<Section>('search')

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

  const [newKid, setNewKid] = useState({
    name: '',
    birthdate: '',
    gender: '',
    photo_url: '',
  })

  const [filters, setFilters] = useState({
    text: '',
    city: '',
    age: '',
    category: '',
  })

  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)

  const userName =
    auth?.user?.name ||
    auth?.user?.parent_name ||
    profile.full_name ||
    'Родитель'

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      setProfile({
        city: '',
        telegram: '',
        whatsapp: '',
        email: '',
        avatar_url: '',
        full_name: '',
        preferred_contact: null,
        notifications_enabled: true,
      })
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
        const data = await getChildren(safeUserId)
        setKids(data)
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
  }, [filters])

  useEffect(() => {
    if (typeof userId !== 'number' || !isParent) {
      setEnrollments([])
      return
    }

    const safeUserId = userId

    async function loadEnrollments() {
      try {
        setEnrollmentsLoading(true)
        const data = await getEnrollments(safeUserId)
        setEnrollments(data)
      } catch (error) {
        console.error(error)
        setEnrollments([])
      } finally {
        setEnrollmentsLoading(false)
      }
    }

    loadEnrollments()
  }, [userId, isParent])

  function handleFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleKidChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    setNewKid((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleAddKid() {
    if (typeof userId !== 'number') {
      showToast('Пользователь не найден', { type: 'error' })
      return
    }

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
        userId,
        name: newKid.name.trim(),
        birthdate: newKid.birthdate,
        gender: newKid.gender || null,
        photo_url: newKid.photo_url.trim() || null,
      })

      setKids((prev) => [createdChild, ...prev])

      setNewKid({
        name: '',
        birthdate: '',
        gender: '',
        photo_url: '',
      })

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

  async function handleDeleteKid(id: number) {
    try {
      await deleteChild(id)

      setKids((prev) => prev.filter((kid) => kid.id !== id))
      setEnrollments((prev) => prev.filter((item) => item.child_id !== id))
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

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()

    if (typeof userId !== 'number') {
      showToast('Пользователь не найден', { type: 'error' })
      return
    }

    try {
      setProfileSaving(true)

      const data = await updateParentProfile({
        userId,
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
            <section className="section">
              <div className="section-header">
                <h1 className="section-title">Кабинет родителя недоступен</h1>
                <p className="section-subtitle">
                  Войдите как родитель, чтобы пользоваться этим разделом.
                </p>
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
        <PageContainer>
          <div className="parent-layout">
            <aside className="parent-sidebar">
              <button
                className={`tab-btn ${activeSection === 'search' ? 'active' : ''}`}
                onClick={() => setActiveSection('search')}
              >
                Найти занятия
              </button>

              <button
                className={`tab-btn ${activeSection === 'kids' ? 'active' : ''}`}
                onClick={() => setActiveSection('kids')}
              >
                Мои дети
              </button>

              <button
                className={`tab-btn ${activeSection === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveSection('schedule')}
              >
                Расписание
              </button>

              <button
                className={`tab-btn ${activeSection === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveSection('profile')}
              >
                Мой профиль
              </button>

              <button
                className={`tab-btn ${activeSection === 'help' ? 'active' : ''}`}
                onClick={() => setActiveSection('help')}
              >
                Помощь
              </button>
            </aside>

            <section className="parent-main">
              {activeSection === 'search' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Найти занятия</h1>
                    <p className="section-subtitle">
                      Посмотрите доступные кружки и уточните поиск через фильтры.
                    </p>
                  </div>

                  <div className="search-layout">
                    <aside className="filters-card">
                      <h3>Фильтры</h3>

                      <div className="filter-group">
                        <label className="filter-label">Обычный поиск</label>
                        <input
                          className="filter-input"
                          type="text"
                          name="text"
                          placeholder="Название, центр или адрес"
                          value={filters.text}
                          onChange={handleFilterChange}
                        />
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Город</label>
                        <input
                          className="filter-input"
                          type="text"
                          name="city"
                          placeholder="Например, Симферополь"
                          value={filters.city}
                          onChange={handleFilterChange}
                        />
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Возраст ребёнка</label>
                        <input
                          className="filter-input"
                          type="number"
                          name="age"
                          placeholder="Например, 8"
                          value={filters.age}
                          onChange={handleFilterChange}
                        />
                      </div>

                      <div className="filter-group">
                        <label className="filter-label">Категория</label>
                        <select
                          className="filter-select"
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
                    </aside>

                    <section>
                      <div className="search-header-line">
                        <div>
                          <h2>Доступные занятия</h2>
                          <p>Найдено: {activities.length}</p>
                        </div>
                      </div>

                      {activitiesLoading && <p>Загрузка кружков...</p>}

                      <div className="activities-list">
                        {!activitiesLoading && activities.length === 0 && (
                          <p>По вашему запросу ничего не найдено.</p>
                        )}

                        {activities.map((activity) => (
                          <article
                            key={activity.id}
                            className="feature-card"
                            style={{ marginBottom: '12px' }}
                          >
                            <h3>{activity.title}</h3>
                            <p>
                              <b>Центр:</b> {activity.center_name}
                            </p>
                            <p>
                              <b>Город:</b> {activity.city}
                            </p>
                            <p>
                              <b>Возраст:</b> {activity.age_min}–{activity.age_max}
                            </p>
                            <p>
                              <b>Категория:</b> {activity.category}
                            </p>
                            <p>
                              <b>Адрес:</b> {activity.address}
                            </p>

                            {activity.short_description && (
                              <p>{activity.short_description}</p>
                            )}

                            <p>
                              <b>Цена:</b> {activity.price} ₽
                            </p>

                            <div style={{ marginTop: '12px' }}>
                              <Link
                                to={`/activity/${activity.id}`}
                                className="btn btn-primary btn-sm"
                              >
                                Подробнее
                              </Link>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {activeSection === 'kids' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Мои дети</h1>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsAddingKid(true)}
                    >
                      + Добавить ребёнка
                    </button>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    {kidsLoading && <p>Загрузка детей...</p>}

                    {!kidsLoading && kids.length === 0 && (
                      <p>Пока нет добавленных детей</p>
                    )}

                    {kids.map((kid) => (
                      <div
                        key={kid.id}
                        className="feature-card"
                        style={{ marginBottom: '8px' }}
                      >
                        <b>{kid.name}</b>

                        {kid.birthdate && <p>Дата рождения: {kid.birthdate}</p>}
                        {kid.gender && <p>Пол: {kid.gender}</p>}

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeleteKid(kid.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>

                  {isAddingKid && (
                    <div className="reminders-card" style={{ marginTop: '16px' }}>
                      <h3>Добавить ребёнка</h3>

                      <div className="auth-field">
                        <label>Имя</label>
                        <input
                          type="text"
                          name="name"
                          value={newKid.name}
                          onChange={handleKidChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Дата рождения</label>
                        <input
                          type="date"
                          name="birthdate"
                          value={newKid.birthdate}
                          onChange={handleKidChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Пол</label>
                        <select
                          name="gender"
                          value={newKid.gender}
                          onChange={handleKidChange}
                        >
                          <option value="">Не указано</option>
                          <option value="girl">Девочка</option>
                          <option value="boy">Мальчик</option>
                        </select>
                      </div>

                      <div className="auth-field">
                        <label>Фото (URL)</label>
                        <input
                          type="text"
                          name="photo_url"
                          value={newKid.photo_url}
                          onChange={handleKidChange}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleAddKid}
                          disabled={kidSubmitting}
                        >
                          {kidSubmitting ? 'Сохраняем...' : 'Сохранить'}
                        </button>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setIsAddingKid(false)}
                          disabled={kidSubmitting}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'schedule' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Расписание</h1>
                    <p className="section-subtitle">
                      Здесь отображаются занятия, на которые вы записали детей
                    </p>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    {enrollmentsLoading && <p>Загрузка записей...</p>}

                    {!enrollmentsLoading && enrollments.length === 0 && (
                      <p>Вы пока не записали детей ни на одно занятие</p>
                    )}

                    {enrollments.map((item) => (
                      <div
                        key={item.id}
                        className="feature-card"
                        style={{ marginBottom: '12px' }}
                      >
                        <h3>{item.title}</h3>

                        <p>
                          <b>Ребёнок:</b> {item.child_name}
                        </p>
                        <p>
                          <b>Центр:</b> {item.center_name}
                        </p>
                        <p>
                          <b>Город:</b> {item.city}
                        </p>
                        <p>
                          <b>Категория:</b> {item.category}
                        </p>
                        {item.price != null && (
                          <p>
                            <b>Цена:</b> {item.price} ₽
                          </p>
                        )}
                        <p>
                          <b>Статус:</b> {enrollmentStatusMap[item.status]}
                        </p>

                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleUnenroll(item.id)}
                        >
                          Отменить запись
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'profile' && (
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Мой профиль</h1>
                    <p className="section-subtitle">
                      Добро пожаловать, {userName}. Здесь можно хранить контактные
                      данные родителя.
                    </p>
                  </div>

                  {profileLoading && <p>Загрузка профиля...</p>}

                  {!profileLoading && (
                    <form className="reminders-card" onSubmit={handleProfileSubmit}>
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
                        <label>Telegram</label>
                        <input
                          type="text"
                          name="telegram"
                          value={profile.telegram}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>WhatsApp</label>
                        <input
                          type="text"
                          name="whatsapp"
                          value={profile.whatsapp}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="auth-field">
                        <label>Аватар (URL)</label>
                        <input
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
                <div>
                  <div className="section-header">
                    <h1 className="section-title">Помощь</h1>
                    <p className="section-subtitle">
                      Короткая инструкция по использованию кабинета родителя.
                    </p>
                  </div>

                  <div className="feature-card">
                    <ol style={{ paddingLeft: '18px', margin: 0 }}>
                      <li>Добавьте детей во вкладке «Мои дети».</li>
                      <li>Перейдите в «Найти занятия» и подберите кружок.</li>
                      <li>Откройте карточку занятия и запишите ребёнка.</li>
                      <li>Проверьте активные записи во вкладке «Расписание».</li>
                      <li>Заполните контактные данные во вкладке «Мой профиль».</li>
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

export default ParentDashboardPage