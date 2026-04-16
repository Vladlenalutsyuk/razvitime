import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getAuth } from '../../utils/auth'
import { getChildren, type Child } from '../../api/childrenApi'
import {
  getActivityById,
  type Activity as ActivityDetail,
  type ActivitySession,
} from '../../api/activitiesApi'
import {
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  type Enrollment,
} from '../../api/enrollmentsApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'

const weekdayMap: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
}

const enrollmentStatusMap: Record<Enrollment['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Подтверждена',
  declined: 'Отклонена',
  cancelled: 'Отменена',
}

function formatSessionTime(session: ActivitySession) {
  return `${session.start_time}–${session.end_time}`
}

function formatPrice(price: number, paymentType?: string) {
  if (paymentType === 'free') {
    return 'Бесплатно'
  }

  if (paymentType === 'per_lesson') {
    return `${price} ₽ за занятие`
  }

  return `${price} ₽ в месяц`
}

function ActivityPage() {
  const { id } = useParams()
  const auth = getAuth()
  const { showToast } = useToast()

  const userId = auth?.user?.id
  const isParent = auth?.user?.role === 'parent'
  const activityId = Number(id)

  const [activity, setActivity] = useState<ActivityDetail | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)

  const [kids, setKids] = useState<Child[]>([])
  const [kidsLoading, setKidsLoading] = useState(false)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)

  const [selectedKidId, setSelectedKidId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(activityId) || activityId <= 0) {
      setActivity(null)
      return
    }

    async function loadActivity() {
      try {
        setActivityLoading(true)
        const data = await getActivityById(activityId)
        setActivity(data)
      } catch (error) {
        console.error(error)
        setActivity(null)
      } finally {
        setActivityLoading(false)
      }
    }

    loadActivity()
  }, [activityId])

  useEffect(() => {
    if (!isParent || typeof userId !== 'number') {
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
    if (!isParent || typeof userId !== 'number') {
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

  const currentEnrollment = useMemo(() => {
    if (!isParent) {
      return null
    }

    return enrollments.find((item) => item.activity_id === activityId) || null
  }, [enrollments, activityId, isParent])

  const enrolledKid = useMemo(() => {
    if (!currentEnrollment) {
      return null
    }

    return kids.find((kid) => kid.id === currentEnrollment.child_id) || null
  }, [kids, currentEnrollment])

  useEffect(() => {
    if (currentEnrollment) {
      setSelectedKidId(String(currentEnrollment.child_id))
    } else {
      setSelectedKidId('')
    }
  }, [currentEnrollment])

  async function handleEnroll() {
    if (!auth) {
      showToast('Чтобы записать ребёнка, сначала войдите в аккаунт', {
        type: 'info',
      })
      return
    }

    if (auth.user.role !== 'parent') {
      showToast('Запись доступна только родителю', { type: 'error' })
      return
    }

    if (!activity) {
      showToast('Кружок не найден', { type: 'error' })
      return
    }

    if (!selectedKidId) {
      showToast('Сначала выберите ребёнка', { type: 'error' })
      return
    }

    try {
      setActionLoading(true)

      const data = await createEnrollment({
        child_id: Number(selectedKidId),
        activity_id: activity.id,
        parent_comment: null,
      })

      setEnrollments((prev) => [data, ...prev])

      const selectedKid = kids.find((kid) => kid.id === Number(selectedKidId))

      showToast(
        selectedKid
          ? `Вы записали ребёнка "${selectedKid.name}" на занятие`
          : 'Запись создана',
        { type: 'success' }
      )
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error
          ? error.message
          : 'Не удалось записать ребёнка на кружок',
        { type: 'error' }
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnenroll() {
    if (!currentEnrollment) {
      return
    }

    try {
      setActionLoading(true)

      await deleteEnrollment(currentEnrollment.id)

      setEnrollments((prev) =>
        prev.filter((item) => item.id !== currentEnrollment.id)
      )

      setSelectedKidId('')
      showToast('Запись отменена', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось отменить запись',
        { type: 'error' }
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (activityLoading) {
    return (
      <>
        <Header />
        <main>
          <section className="section">
            <PageContainer>
              <h1 className="section-title">Загрузка кружка...</h1>
            </PageContainer>
          </section>
        </main>
      </>
    )
  }

  if (!activity) {
    return (
      <>
        <Header />
        <main>
          <section className="section">
            <PageContainer>
              <h1 className="section-title">Занятие не найдено</h1>

              <div style={{ marginTop: '16px' }}>
                <Link to="/" className="btn btn-secondary">
                  На главную
                </Link>
              </div>
            </PageContainer>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main>
        <section className="section">
          <PageContainer>
            <div className="section-header">
              <h1 className="section-title">{activity.title}</h1>
              <p className="section-subtitle">
                Подробная информация о занятии
              </p>
            </div>

            <div className="feature-card">
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
                <p>
                  <b>Кратко:</b> {activity.short_description}
                </p>
              )}

              {activity.description && (
                <p>
                  <b>Описание:</b> {activity.description}
                </p>
              )}

              <p>
                <b>Цена:</b> {formatPrice(activity.price, activity.payment_type)}
              </p>

              {activity.sessions && activity.sessions.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Расписание занятий</h3>

                  {activity.sessions.map((session) => (
                    <p key={session.id}>
                      {weekdayMap[session.weekday] ||
                        `День ${session.weekday}`}{' '}
                      — {formatSessionTime(session)}
                    </p>
                  ))}
                </div>
              )}

              {!auth && (
                <div
                  className="feature-card"
                  style={{ marginTop: '18px', background: '#faf8ff' }}
                >
                  <h3 style={{ marginBottom: '8px' }}>
                    Хотите записать ребёнка?
                  </h3>
                  <p style={{ marginBottom: '12px' }}>
                    Войдите как родитель, чтобы выбрать ребёнка и оформить запись
                    на кружок.
                  </p>

                  <Link to="/login" className="btn btn-primary">
                    Войти как родитель
                  </Link>
                </div>
              )}

              {auth && auth.user.role !== 'parent' && (
                <div
                  className="feature-card"
                  style={{ marginTop: '18px', background: '#faf8ff' }}
                >
                  <h3 style={{ marginBottom: '8px' }}>
                    Запись доступна только родителю
                  </h3>
                  <p>
                    Вы можете просматривать информацию о кружке, но оформление
                    записи доступно из аккаунта родителя.
                  </p>
                </div>
              )}

              {isParent && (
                <>
                  <div className="auth-field" style={{ marginTop: '16px' }}>
                    <label>Выберите ребёнка</label>

                    {kidsLoading ? (
                      <p>Загрузка детей...</p>
                    ) : (
                      <select
                        value={selectedKidId}
                        onChange={(e) => setSelectedKidId(e.target.value)}
                        disabled={
                          !!currentEnrollment ||
                          kids.length === 0 ||
                          actionLoading
                        }
                      >
                        <option value="">Выберите ребёнка</option>

                        {kids.map((kid) => (
                          <option key={kid.id} value={kid.id}>
                            {kid.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {!kidsLoading && kids.length === 0 && (
                    <p style={{ marginTop: '12px' }}>
                      Сначала добавьте ребёнка в кабинете родителя.
                    </p>
                  )}

                  {enrollmentsLoading && (
                    <p style={{ marginTop: '12px' }}>Проверяем записи...</p>
                  )}

                  {enrolledKid && (
                    <p style={{ marginTop: '12px' }}>
                      <b>Сейчас записан:</b> {enrolledKid.name}
                    </p>
                  )}

                  {currentEnrollment && (
                    <p style={{ marginTop: '12px' }}>
                      <b>Статус записи:</b>{' '}
                      {enrollmentStatusMap[currentEnrollment.status]}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {!currentEnrollment ? (
                      <button
                        className="btn btn-primary"
                        onClick={handleEnroll}
                        disabled={
                          kids.length === 0 || actionLoading || kidsLoading
                        }
                      >
                        {actionLoading ? 'Сохраняем...' : 'Записаться'}
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={handleUnenroll}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Отменяем...' : 'Отменить запись'}
                      </button>
                    )}

                    <Link to="/parent" className="btn btn-secondary">
                      Назад в кабинет
                    </Link>
                  </div>
                </>
              )}

              {!isParent && (
                <div
                  style={{
                    marginTop: '16px',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Link to="/" className="btn btn-secondary">
                    На главную
                  </Link>
                </div>
              )}
            </div>
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default ActivityPage