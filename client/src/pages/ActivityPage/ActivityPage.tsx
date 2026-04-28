//D:\Data USER\Desktop\razvitime\client\src\pages\ActivityPage\ActivityPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getAuth } from '../../utils/auth'
import { getChildren, type Child } from '../../api/childrenApi'
import {
  getActivityById,
  type Activity,
  type ActivitySession,
} from '../../api/activitiesApi'
import {
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  type Enrollment,
} from '../../api/enrollmentsApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'
import './ActivityPage.css'

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

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatSession(session: ActivitySession) {
  return `${weekdayMap[session.weekday] || `День ${session.weekday}`}, ${formatTime(
    session.start_time
  )}–${formatTime(session.end_time)}`
}

function formatPrice(price: number, paymentType?: string) {
  if (paymentType === 'free') return 'Бесплатно'
  if (paymentType === 'per_lesson') return `${price} ₽ за занятие`
  return `${price} ₽ в месяц`
}

function ActivityPage() {
  const { id } = useParams()
  const auth = getAuth()
  const { showToast } = useToast()

  const activityId = Number(id)
  const userId = auth?.user?.id
  const isParent = auth?.user?.role === 'parent'

  const [activity, setActivity] = useState<Activity | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)

  const [kids, setKids] = useState<Child[]>([])
  const [kidsLoading, setKidsLoading] = useState(false)

  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)

  const [selectedKidId, setSelectedKidId] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
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

        if (data.sessions?.length) {
          setSelectedSessionId(String(data.sessions[0].id))
        }
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

  const activityEnrollments = useMemo(() => {
    return enrollments.filter(
      (item) =>
        item.activity_id === activityId &&
        (item.status === 'pending' || item.status === 'approved')
    )
  }, [enrollments, activityId])

  const selectedKidEnrollment = useMemo(() => {
    if (!selectedKidId) return null

    return (
      activityEnrollments.find(
        (item) => item.child_id === Number(selectedKidId)
      ) || null
    )
  }, [activityEnrollments, selectedKidId])

  const selectedKid = useMemo(() => {
    if (!selectedKidId) return null
    return kids.find((kid) => kid.id === Number(selectedKidId)) || null
  }, [kids, selectedKidId])

  const selectedSession = useMemo(() => {
    if (!activity || !selectedSessionId) return null

    return (
      activity.sessions?.find(
        (session) => session.id === Number(selectedSessionId)
      ) || null
    )
  }, [activity, selectedSessionId])

  async function handleEnroll() {
    if (!auth) {
      showToast('Чтобы записать ребёнка, сначала войдите в аккаунт', {
        type: 'info',
      })
      return
    }

    if (!isParent) {
      showToast('Запись доступна только родителю', { type: 'error' })
      return
    }

    if (!activity) {
      showToast('Кружок не найден', { type: 'error' })
      return
    }

    if (!selectedKidId) {
      showToast('Выберите ребёнка', { type: 'error' })
      return
    }

    if (activity.sessions?.length && !selectedSessionId) {
      showToast('Выберите время занятия', { type: 'error' })
      return
    }

    if (selectedKidEnrollment) {
      showToast('Этот ребёнок уже записан на кружок', { type: 'info' })
      return
    }

    try {
      setActionLoading(true)

      const createdEnrollment = await createEnrollment({
        child_id: Number(selectedKidId),
        activity_id: activity.id,
        activity_session_id: selectedSessionId ? Number(selectedSessionId) : null,
        parent_comment: null,
      })

      setEnrollments((prev) => [createdEnrollment, ...prev])

      showToast('Заявка на запись отправлена', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast(
        error instanceof Error ? error.message : 'Не удалось записать ребёнка',
        { type: 'error' }
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnenroll(enrollmentId: number) {
    try {
      setActionLoading(true)

      await deleteEnrollment(enrollmentId)

      setEnrollments((prev) =>
        prev.filter((item) => item.id !== enrollmentId)
      )

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
        <main className="activity-page">
          <PageContainer>
            <div className="activity-state-card">Загрузка занятия...</div>
          </PageContainer>
        </main>
      </>
    )
  }

  if (!activity) {
    return (
      <>
        <Header />
        <main className="activity-page">
          <PageContainer>
            <div className="activity-state-card">
              <h1>Занятие не найдено</h1>
              <Link to="/parent" className="btn btn-secondary">
                Назад в кабинет
              </Link>
            </div>
          </PageContainer>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="activity-page">
        <PageContainer>
          <div className="activity-back-row">
            <Link to="/parent" className="btn btn-secondary btn-sm">
              ← Назад в кабинет
            </Link>
          </div>
          <section className="activity-hero-card">
            <div>
              <div className="activity-kicker">{activity.category}</div>
              <h1>{activity.title}</h1>

              {activity.short_description && (
                <p className="activity-hero-text">
                  {activity.short_description}
                </p>
              )}

              <div className="activity-tags">
                <span>{activity.age_min}–{activity.age_max} лет</span>
                <span>{formatPrice(activity.price, activity.payment_type)}</span>
                <span>{activity.city}</span>
              </div>
            </div>

            <div className="activity-price-card">
              <span>Стоимость</span>
              <b>{formatPrice(activity.price, activity.payment_type)}</b>
            </div>
          </section>

          <section className="activity-layout">
            <div className="activity-main-column">
              <article className="activity-card">
                <h2>Описание занятия</h2>
                <p>
                  {activity.description ||
                    activity.short_description ||
                    'Подробное описание пока не добавлено.'}
                </p>
              </article>

              <article className="activity-card">
                <h2>Расписание</h2>

                {!activity.sessions?.length && (
                  <p>Расписание пока уточняется.</p>
                )}

                {activity.sessions && activity.sessions.length > 0 && (
                  <div className="activity-session-list">
                    {activity.sessions.map((session) => (
                      <div key={session.id} className="activity-session-card">
                        <b>
                          {weekdayMap[session.weekday] ||
                            `День ${session.weekday}`}
                        </b>
                        <span>
                          {formatTime(session.start_time)}–
                          {formatTime(session.end_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="activity-card">
                <h2>Центр, который проводит занятие</h2>

                <div className="activity-center-card">
                  <div className="activity-center-logo">
                    {activity.logo_url ? (
                      <img src={activity.logo_url} alt={activity.center_name} />
                    ) : (
                      activity.center_name.slice(0, 1)
                    )}
                  </div>

                  <div className="activity-center-content">
                    <h3>{activity.center_name}</h3>

                    <p>
                      {activity.center_short_description ||
                        'Детский развивающий центр'}
                    </p>

                    <div className="activity-center-info">
                      <span>📍 {activity.city}, {activity.address}</span>

                      {activity.phone && <span>☎ {activity.phone}</span>}
                      {activity.email && <span>✉ {activity.email}</span>}
                    </div>
                    {activity.center_id && (
                    <Link
                      to={`/centers/${activity.center_id}`}
                      className="btn btn-secondary btn-sm activity-center-action"
                    >
                      Смотреть страницу центра
                    </Link>
                  )}
                  </div>

                  
                </div>
              </article>
            </div>

            <aside className="activity-sidebar">
              <div className="activity-enroll-card">
                <h2>Запись на занятие</h2>

                {!auth && (
                  <>
                    <p>
                      Войдите как родитель, чтобы выбрать ребёнка и отправить
                      заявку.
                    </p>

                    <Link to="/login" className="btn btn-primary">
                      Войти
                    </Link>
                  </>
                )}

                {auth && !isParent && (
                  <p>Запись доступна только из аккаунта родителя.</p>
                )}

                {isParent && (
                  <>
                    {kidsLoading || enrollmentsLoading ? (
                      <p>Загрузка данных...</p>
                    ) : (
                      <>
                        <div className="activity-field">
                          <label>Ребёнок</label>
                          <select
                            value={selectedKidId}
                            onChange={(e) => setSelectedKidId(e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="">Выберите ребёнка</option>
                            {kids.map((kid) => (
                              <option key={kid.id} value={kid.id}>
                                {kid.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {activity.sessions && activity.sessions.length > 0 && (
                          <div className="activity-field">
                            <label>Время занятия</label>
                            <select
                              value={selectedSessionId}
                              onChange={(e) =>
                                setSelectedSessionId(e.target.value)
                              }
                              disabled={actionLoading || !!selectedKidEnrollment}
                            >
                              {activity.sessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                  {formatSession(session)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {selectedKidEnrollment && (
                          <div className="activity-enrolled-box">
                            <b>Ребёнок уже записан</b>
                            <span>
                              Статус:{' '}
                              {
                                enrollmentStatusMap[
                                selectedKidEnrollment.status
                                ]
                              }
                            </span>

                            {selectedKidEnrollment.weekday &&
                              selectedKidEnrollment.start_time &&
                              selectedKidEnrollment.end_time && (
                                <span>
                                  {weekdayMap[selectedKidEnrollment.weekday]} ·{' '}
                                  {formatTime(
                                    selectedKidEnrollment.start_time
                                  )}
                                  –
                                  {formatTime(selectedKidEnrollment.end_time)}
                                </span>
                              )}
                          </div>
                        )}

                        {selectedKid && !selectedKidEnrollment && (
                          <p className="activity-small-text">
                            Вы записываете: <b>{selectedKid.name}</b>
                            {selectedSession ? ` · ${formatSession(selectedSession)}` : ''}
                          </p>
                        )}

                        <div className="activity-actions">
                          {!selectedKidEnrollment ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={handleEnroll}
                              disabled={
                                actionLoading ||
                                kids.length === 0 ||
                                !selectedKidId
                              }
                            >
                              {actionLoading ? 'Отправляем...' : 'Записаться'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() =>
                                handleUnenroll(selectedKidEnrollment.id)
                              }
                              disabled={actionLoading}
                            >
                              {actionLoading
                                ? 'Отменяем...'
                                : 'Отменить запись'}
                            </button>
                          )}

                          <Link to="/parent" className="btn btn-secondary">
                            В кабинет
                          </Link>
                        </div>

                        {kids.length === 0 && (
                          <p className="activity-small-text">
                            Сначала добавьте ребёнка в кабинете родителя.
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                {activityEnrollments.length > 0 && (
                  <div className="activity-enrolled-list">
                    <h3>Ваши записи</h3>

                    {activityEnrollments.map((item) => (
                      <div key={item.id} className="activity-enrolled-row">
                        <b>{item.child_name}</b>
                        <span>{enrollmentStatusMap[item.status]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default ActivityPage