import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getAuth } from '../../utils/auth'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'

import {
  extendAdminCenterSubscription,
  getAdminAnalytics,
  getAdminApplications,
  getAdminCenterSubscriptions,
  getAdminCenters,
  getAdminDashboard,
  getAdminLogs,
  getAdminSubscriptions,
  resetAdminCenterPassword,
  updateAdminApplicationStatus,
  updateAdminCenterStatus,
  type AdminAnalyticsResponse,
  type AdminApplication,
  type AdminCenter,
  type AdminCenterSubscription,
  type AdminDashboardResponse,
  type AdminLog,
  type AdminSubscription,
} from '../../api/adminApi'

import './AdminDashboardPage.css'

type Section =
  | 'dashboard'
  | 'centers'
  | 'subscriptions'
  | 'applications'
  | 'analytics'
  | 'logs'

const centerStatusMap: Record<string, string> = {
  draft: 'Черновик',
  pending: 'На модерации',
  approved: 'Одобрен',
  rejected: 'Отклонён',
}

const applicationStatusMap: Record<AdminApplication['status'], string> = {
  new: 'Новая',
  in_review: 'В работе',
  approved: 'Одобрена',
  rejected: 'Отклонена',
}

const subscriptionStatusMap: Record<AdminCenterSubscription['status'], string> = {
  active: 'Активна',
  expired: 'Истекла',
  cancelled: 'Отменена',
}

function formatDate(value?: string | null) {
  if (!value) return 'Нет данных'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('ru-RU')
}

function formatMoney(value?: number | string | null) {
  const amount = Number(value || 0)

  return amount.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  })
}

function getMaxValue(items: { total: number }[]) {
  const max = Math.max(...items.map((item) => Number(item.total)), 0)
  return max > 0 ? max : 1
}

function AdminDashboardPage() {
  const auth = getAuth()
  const isAdmin = auth?.user?.role === 'admin'
  const { showToast } = useToast()

  const [activeSection, setActiveSection] = useState<Section>('dashboard')

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)

  const [centers, setCenters] = useState<AdminCenter[]>([])
  const [centersLoading, setCentersLoading] = useState(false)

  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [centerSubscriptions, setCenterSubscriptions] = useState<
    AdminCenterSubscription[]
  >([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)

  const [applications, setApplications] = useState<AdminApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const [logs, setLogs] = useState<AdminLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const [centerFilters, setCenterFilters] = useState({
    search: '',
    city: '',
    status: '',
  })

  const [applicationFilters, setApplicationFilters] = useState({
    search: '',
    status: '',
  })

  const [analyticsFilters, setAnalyticsFilters] = useState({
    city: '',
  })

  const [subscriptionForm, setSubscriptionForm] = useState({
    centerId: '',
    subscriptionId: '',
    periodDays: '30',
  })

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const adminName = auth?.user?.name || 'Администратор'

  const pendingCentersCount = centers.filter(
    (center) => center.moderation_status === 'pending'
  ).length

  const newApplicationsCount = applications.filter(
    (application) => application.status === 'new'
  ).length

  const latestLogs = useMemo(() => logs.slice(0, 4), [logs])

  async function loadDashboard() {
    try {
      setDashboardLoading(true)
      const data = await getAdminDashboard()
      setDashboard(data)
    } catch (error) {
      console.error(error)
      setDashboard(null)
    } finally {
      setDashboardLoading(false)
    }
  }

  async function loadCenters() {
    try {
      setCentersLoading(true)
      const data = await getAdminCenters({
        search: centerFilters.search.trim() || undefined,
        city: centerFilters.city.trim() || undefined,
        status: centerFilters.status || undefined,
      })
      setCenters(data)
    } catch (error) {
      console.error(error)
      setCenters([])
    } finally {
      setCentersLoading(false)
    }
  }

  async function loadSubscriptions() {
    try {
      setSubscriptionsLoading(true)

      const [tariffsData, centerSubscriptionsData] = await Promise.all([
        getAdminSubscriptions(),
        getAdminCenterSubscriptions(),
      ])

      setSubscriptions(tariffsData)
      setCenterSubscriptions(centerSubscriptionsData)
    } catch (error) {
      console.error(error)
      setSubscriptions([])
      setCenterSubscriptions([])
    } finally {
      setSubscriptionsLoading(false)
    }
  }

  async function loadApplications() {
    try {
      setApplicationsLoading(true)

      const data = await getAdminApplications({
        search: applicationFilters.search.trim() || undefined,
        status: applicationFilters.status || undefined,
      })

      setApplications(data)
    } catch (error) {
      console.error(error)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  async function loadAnalytics() {
    try {
      setAnalyticsLoading(true)

      const data = await getAdminAnalytics({
        city: analyticsFilters.city.trim() || undefined,
      })

      setAnalytics(data)
    } catch (error) {
      console.error(error)
      setAnalytics(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  async function loadLogs() {
    try {
      setLogsLoading(true)
      const data = await getAdminLogs()
      setLogs(data)
    } catch (error) {
      console.error(error)
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setDashboard(null)
      return
    }

    loadDashboard()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setCenters([])
      return
    }

    loadCenters()
  }, [isAdmin, centerFilters.search, centerFilters.city, centerFilters.status])

  useEffect(() => {
    if (!isAdmin) {
      setSubscriptions([])
      setCenterSubscriptions([])
      return
    }

    loadSubscriptions()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setApplications([])
      return
    }

    loadApplications()
  }, [isAdmin, applicationFilters.search, applicationFilters.status])

  useEffect(() => {
    if (!isAdmin) {
      setAnalytics(null)
      return
    }

    loadAnalytics()
  }, [isAdmin, analyticsFilters.city])

  useEffect(() => {
    if (!isAdmin) {
      setLogs([])
      return
    }

    loadLogs()
  }, [isAdmin])

  function handleCenterFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setCenterFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleApplicationFilterChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setApplicationFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleAnalyticsFilterChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setAnalyticsFilters((prev) => ({ ...prev, [name]: value }))
  }

  async function handleToggleCenter(center: AdminCenter) {
    try {
      setActionLoadingId(center.id)

      const updated = await updateAdminCenterStatus(center.id, {
        is_active: !center.is_active,
        moderation_status: center.moderation_status,
      })

      setCenters((prev) =>
        prev.map((item) => (item.id === center.id ? updated : item))
      )

      await Promise.all([loadDashboard(), loadAnalytics(), loadLogs()])

      showToast(updated.is_active ? 'Центр активирован' : 'Центр заблокирован', {
        type: 'success',
      })
    } catch (error) {
      console.error(error)
      showToast('Не удалось изменить статус центра', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleApproveCenter(center: AdminCenter) {
    try {
      setActionLoadingId(center.id)

      const updated = await updateAdminCenterStatus(center.id, {
        is_active: true,
        moderation_status: 'approved',
      })

      setCenters((prev) =>
        prev.map((item) => (item.id === center.id ? updated : item))
      )

      await Promise.all([loadDashboard(), loadAnalytics(), loadLogs()])

      showToast('Центр одобрен', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast('Не удалось одобрить центр', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRejectCenter(center: AdminCenter) {
    try {
      setActionLoadingId(center.id)

      const updated = await updateAdminCenterStatus(center.id, {
        is_active: false,
        moderation_status: 'rejected',
      })

      setCenters((prev) =>
        prev.map((item) => (item.id === center.id ? updated : item))
      )

      await Promise.all([loadDashboard(), loadAnalytics(), loadLogs()])

      showToast('Центр отклонён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast('Не удалось отклонить центр', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleResetPassword(center: AdminCenter) {
    const isConfirmed = window.confirm(
      `Сбросить пароль для центра "${center.name}"?`
    )

    if (!isConfirmed) return

    try {
      setActionLoadingId(center.id)

      const data = await resetAdminCenterPassword(center.id)

      await navigator.clipboard.writeText(data.temporaryPassword)

      await loadLogs()

      showToast(`Временный пароль: ${data.temporaryPassword}`, {
        type: 'success',
      })
    } catch (error) {
      console.error(error)
      showToast('Не удалось сбросить пароль', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleExtendSubscription() {
    const centerId = Number(subscriptionForm.centerId)
    const subscriptionId = Number(subscriptionForm.subscriptionId)
    const periodDays = Number(subscriptionForm.periodDays)

    if (!centerId || !subscriptionId || !periodDays) {
      showToast('Выберите центр, тариф и срок', { type: 'error' })
      return
    }

    try {
      setActionLoadingId(centerId)

      const updated = await extendAdminCenterSubscription(centerId, {
        subscription_id: subscriptionId,
        period_days: periodDays,
      })

      setCenters((prev) =>
        prev.map((center) => (center.id === centerId ? updated : center))
      )

      setSubscriptionForm({
        centerId: '',
        subscriptionId: '',
        periodDays: '30',
      })

      await Promise.all([
        loadDashboard(),
        loadSubscriptions(),
        loadAnalytics(),
        loadLogs(),
      ])

      showToast('Подписка обновлена', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast('Не удалось обновить подписку', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleApplicationStatus(
    application: AdminApplication,
    status: AdminApplication['status']
  ) {
    try {
      setActionLoadingId(application.id)

      const updated = await updateAdminApplicationStatus(application.id, {
        status,
      })

      setApplications((prev) =>
        prev.map((item) => (item.id === application.id ? updated : item))
      )

      await loadLogs()

      showToast('Статус заявки обновлён', { type: 'success' })
    } catch (error) {
      console.error(error)
      showToast('Не удалось обновить заявку', { type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  if (!auth || !isAdmin) {
    return (
      <>
        <Header />

        <main className="page-admin">
          <PageContainer>
            <section className="admin-section-card">
              <div className="admin-section-header">
                <h1>Админ-панель недоступна</h1>
                <p>Войдите под аккаунтом администратора платформы.</p>
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

      <main className="page-admin">
        <div className="admin-tabs-bar">
          <PageContainer>
            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'dashboard' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('dashboard')}
              >
                Главная
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'centers' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('centers')}
              >
                Центры
                {pendingCentersCount > 0 && <span>{pendingCentersCount}</span>}
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'subscriptions' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('subscriptions')}
              >
                Подписки
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'applications' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('applications')}
              >
                Заявки
                {newApplicationsCount > 0 && <span>{newApplicationsCount}</span>}
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'analytics' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('analytics')}
              >
                Аналитика
              </button>

              <button
                type="button"
                className={`admin-tab-btn ${
                  activeSection === 'logs' ? 'active' : ''
                }`}
                onClick={() => setActiveSection('logs')}
              >
                Логи
              </button>
            </div>
          </PageContainer>
        </div>

        <PageContainer>
          <section className="admin-hero">
            <p className="admin-subtitle">Добро пожаловать, {adminName}</p>
          </section>

          <section className="admin-main">
            {activeSection === 'dashboard' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Админ-панель платформы</h1>
                  <p>Контроль центров, подписок, заявок и общей статистики.</p>
                </div>

                {dashboardLoading && <p>Загрузка дашборда...</p>}

                {!dashboardLoading && dashboard && (
                  <>
                    <div className="admin-stats-grid">
                      <article className="admin-stat-card">
                        <span>Всего центров</span>
                        <b>{dashboard.stats.centersCount}</b>
                      </article>

                      <article className="admin-stat-card">
                        <span>Активных центров</span>
                        <b>{dashboard.stats.activeCentersCount}</b>
                      </article>

                      <article className="admin-stat-card">
                        <span>На модерации</span>
                        <b>{dashboard.stats.pendingCentersCount}</b>
                      </article>

                      <article className="admin-stat-card">
                        <span>Активных подписок</span>
                        <b>{dashboard.stats.activeSubscriptionsCount}</b>
                      </article>

                      <article className="admin-stat-card">
                        <span>Доход подписок</span>
                        <b>{formatMoney(dashboard.stats.subscriptionRevenue)}</b>
                      </article>

                      <article className="admin-stat-card">
                        <span>Кружков</span>
                        <b>{dashboard.stats.activitiesCount}</b>
                      </article>

                      <article className="admin-stat-card muted">
                        <span>Родителей</span>
                        <b>{dashboard.stats.parentsCount}</b>
                      </article>

                      <article className="admin-stat-card muted">
                        <span>Детей</span>
                        <b>{dashboard.stats.childrenCount}</b>
                      </article>
                    </div>

                    <div className="admin-dashboard-grid">
                      <div className="admin-card">
                        <div className="admin-card-header">
                          <h2>Подключение центров</h2>
                          <p>Динамика по месяцам</p>
                        </div>

                        <div className="admin-chart">
                          {dashboard.centerGrowth.map((item) => {
                            const max = getMaxValue(dashboard.centerGrowth)

                            return (
                              <div key={item.month} className="admin-chart-row">
                                <span>{item.month}</span>
                                <div>
                                  <i
                                    style={{
                                      width: `${(item.total / max) * 100}%`,
                                    }}
                                  />
                                </div>
                                <b>{item.total}</b>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="admin-card">
                        <div className="admin-card-header">
                          <h2>Доход по подпискам</h2>
                          <p>По месяцам</p>
                        </div>

                        <div className="admin-chart">
                          {dashboard.subscriptionRevenueGrowth.map((item) => {
                            const max = getMaxValue(
                              dashboard.subscriptionRevenueGrowth
                            )

                            return (
                              <div key={item.month} className="admin-chart-row">
                                <span>{item.month}</span>
                                <div>
                                  <i
                                    style={{
                                      width: `${(item.total / max) * 100}%`,
                                    }}
                                  />
                                </div>
                                <b>{formatMoney(item.total)}</b>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="admin-quick-grid">
                      <button
                        type="button"
                        className="admin-quick-card"
                        onClick={() => setActiveSection('centers')}
                      >
                        <b>Центры</b>
                        <span>Модерация, блокировки, доступы</span>
                      </button>

                      <button
                        type="button"
                        className="admin-quick-card"
                        onClick={() => setActiveSection('subscriptions')}
                      >
                        <b>Подписки</b>
                        <span>Тарифы и сроки оплаты центров</span>
                      </button>

                      <button
                        type="button"
                        className="admin-quick-card"
                        onClick={() => setActiveSection('applications')}
                      >
                        <b>Заявки</b>
                        <span>Подключение новых центров</span>
                      </button>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Последние события</h2>
                        <p>Краткий журнал активности</p>
                      </div>

                      <div className="admin-log-list">
                        {latestLogs.length === 0 && <p>Логов пока нет.</p>}

                        {latestLogs.map((log) => (
                          <article key={log.id} className="admin-mini-card">
                            <b>{log.title}</b>
                            <p>{log.message}</p>
                            <small>{formatDate(log.created_at)}</small>
                          </article>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeSection === 'centers' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Подключённые центры</h1>
                  <p>Модерация, блокировка, пароль и информация о подписке.</p>
                </div>

                <div className="admin-management-layout">
                  <aside className="admin-filters-card">
                    <h3>Фильтры</h3>

                    <div className="admin-field">
                      <label>Поиск</label>
                      <input
                        className="admin-input"
                        type="text"
                        name="search"
                        placeholder="Название центра"
                        value={centerFilters.search}
                        onChange={handleCenterFilterChange}
                      />
                    </div>

                    <div className="admin-field">
                      <label>Город</label>
                      <input
                        className="admin-input"
                        type="text"
                        name="city"
                        value={centerFilters.city}
                        onChange={handleCenterFilterChange}
                      />
                    </div>

                    <div className="admin-field">
                      <label>Статус</label>
                      <select
                        className="admin-select"
                        name="status"
                        value={centerFilters.status}
                        onChange={handleCenterFilterChange}
                      >
                        <option value="">Все</option>
                        <option value="active">Активные</option>
                        <option value="blocked">Заблокированные</option>
                        <option value="pending">На модерации</option>
                        <option value="approved">Одобренные</option>
                        <option value="rejected">Отклонённые</option>
                      </select>
                    </div>
                  </aside>

                  <section>
                    {centersLoading && <p>Загрузка центров...</p>}

                    {!centersLoading && centers.length === 0 && (
                      <p>Центров пока нет.</p>
                    )}

                    <div className="admin-table-card">
                      <div className="admin-table-scroll">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Центр</th>
                              <th>Город</th>
                              <th>Контакты</th>
                              <th>Статус</th>
                              <th>Подписка</th>
                              <th>Кружки</th>
                              <th>Действия</th>
                            </tr>
                          </thead>

                          <tbody>
                            {centers.map((center) => {
                              const isLoading = actionLoadingId === center.id

                              return (
                                <tr key={center.id}>
                                  <td>
                                    <b>{center.name}</b>
                                    <br />
                                    <small>{center.address}</small>
                                  </td>

                                  <td>{center.city}</td>

                                  <td>
                                    {center.phone || '—'}
                                    <br />
                                    <small>{center.email || '—'}</small>
                                  </td>

                                  <td>
                                    <span
                                      className={`admin-status ${
                                        center.is_active ? 'active' : 'blocked'
                                      }`}
                                    >
                                      {center.is_active
                                        ? centerStatusMap[
                                            center.moderation_status
                                          ] || 'Активен'
                                        : 'Заблокирован'}
                                    </span>
                                  </td>

                                  <td>
                                    {center.subscription_name || 'Нет тарифа'}
                                    <br />
                                    <small>
                                      до {formatDate(center.subscription_until)}
                                    </small>
                                  </td>

                                  <td>{center.activities_count}</td>

                                  <td>
                                    <div className="admin-actions">
                                      {center.moderation_status ===
                                        'pending' && (
                                        <>
                                          <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            disabled={isLoading}
                                            onClick={() =>
                                              handleApproveCenter(center)
                                            }
                                          >
                                            Одобрить
                                          </button>

                                          <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            disabled={isLoading}
                                            onClick={() =>
                                              handleRejectCenter(center)
                                            }
                                          >
                                            Отклонить
                                          </button>
                                        </>
                                      )}

                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleToggleCenter(center)
                                        }
                                      >
                                        {center.is_active
                                          ? 'Заблокировать'
                                          : 'Активировать'}
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleResetPassword(center)
                                        }
                                      >
                                        Сбросить пароль
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeSection === 'subscriptions' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Подписки центров</h1>
                  <p>Тарифы платформы и активные подписки подключённых центров.</p>
                </div>

                <div className="admin-form-card">
                  <h3>Продлить или изменить подписку</h3>

                  <div className="admin-subscription-grid">
                    <div className="admin-field">
                      <label>Центр</label>
                      <select
                        className="admin-select"
                        value={subscriptionForm.centerId}
                        onChange={(e) =>
                          setSubscriptionForm((prev) => ({
                            ...prev,
                            centerId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Выберите центр</option>
                        {centers.map((center) => (
                          <option key={center.id} value={center.id}>
                            {center.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-field">
                      <label>Тариф</label>
                      <select
                        className="admin-select"
                        value={subscriptionForm.subscriptionId}
                        onChange={(e) =>
                          setSubscriptionForm((prev) => ({
                            ...prev,
                            subscriptionId: e.target.value,
                          }))
                        }
                      >
                        <option value="">Выберите тариф</option>
                        {subscriptions.map((subscription) => (
                          <option key={subscription.id} value={subscription.id}>
                            {subscription.name} —{' '}
                            {formatMoney(subscription.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-field">
                      <label>Дней</label>
                      <input
                        className="admin-input"
                        type="number"
                        value={subscriptionForm.periodDays}
                        onChange={(e) =>
                          setSubscriptionForm((prev) => ({
                            ...prev,
                            periodDays: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm admin-form-btn"
                      onClick={handleExtendSubscription}
                    >
                      Обновить
                    </button>
                  </div>
                </div>

                {subscriptionsLoading && <p>Загрузка подписок...</p>}

                <div className="admin-dashboard-grid">
                  {subscriptions.map((subscription) => (
                    <article key={subscription.id} className="admin-card">
                      <div className="admin-card-header">
                        <h2>{subscription.name}</h2>
                        <p>{subscription.description || 'Тариф платформы'}</p>
                      </div>

                      <div className="admin-tariff-price">
                        {formatMoney(subscription.price)}
                      </div>

                      <p className="admin-muted">
                        Срок: {subscription.period_days} дней
                      </p>
                    </article>
                  ))}
                </div>

                <div className="admin-table-card">
                  <div className="admin-card-header">
                    <h2>Подписки центров</h2>
                    <p>Все текущие и завершённые подписки.</p>
                  </div>

                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Центр</th>
                          <th>Город</th>
                          <th>Тариф</th>
                          <th>Стоимость</th>
                          <th>Начало</th>
                          <th>Окончание</th>
                          <th>Статус</th>
                        </tr>
                      </thead>

                      <tbody>
                        {centerSubscriptions.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <b>{item.center_name}</b>
                            </td>
                            <td>{item.city}</td>
                            <td>{item.subscription_name}</td>
                            <td>{formatMoney(item.price)}</td>
                            <td>{formatDate(item.start_date)}</td>
                            <td>{formatDate(item.end_date)}</td>
                            <td>
                              <span className={`admin-status ${item.status}`}>
                                {subscriptionStatusMap[item.status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'applications' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Заявки от центров</h1>
                  <p>Центры, которые хотят подключиться к платформе.</p>
                </div>

                <div className="admin-management-layout">
                  <aside className="admin-filters-card">
                    <h3>Фильтры</h3>

                    <div className="admin-field">
                      <label>Поиск</label>
                      <input
                        className="admin-input"
                        type="text"
                        name="search"
                        placeholder="Центр, город, контакт"
                        value={applicationFilters.search}
                        onChange={handleApplicationFilterChange}
                      />
                    </div>

                    <div className="admin-field">
                      <label>Статус</label>
                      <select
                        className="admin-select"
                        name="status"
                        value={applicationFilters.status}
                        onChange={handleApplicationFilterChange}
                      >
                        <option value="">Все</option>
                        <option value="new">Новые</option>
                        <option value="in_review">В работе</option>
                        <option value="approved">Одобренные</option>
                        <option value="rejected">Отклонённые</option>
                      </select>
                    </div>
                  </aside>

                  <section>
                    {applicationsLoading && <p>Загрузка заявок...</p>}

                    {!applicationsLoading && applications.length === 0 && (
                      <p>Заявок пока нет.</p>
                    )}

                    <div className="admin-table-card">
                      <div className="admin-table-scroll">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Центр</th>
                              <th>Контактное лицо</th>
                              <th>Контакты</th>
                              <th>Город</th>
                              <th>Комментарий</th>
                              <th>Статус</th>
                              <th>Дата</th>
                              <th>Действия</th>
                            </tr>
                          </thead>

                          <tbody>
                            {applications.map((application) => {
                              const isLoading =
                                actionLoadingId === application.id

                              return (
                                <tr key={application.id}>
                                  <td>
                                    <b>{application.center_name}</b>
                                  </td>
                                  <td>{application.contact_person}</td>
                                  <td>
                                    {application.phone || '—'}
                                    <br />
                                    <small>{application.email || '—'}</small>
                                  </td>
                                  <td>{application.city || '—'}</td>
                                  <td>{application.comment || '—'}</td>
                                  <td>
                                    <span
                                      className={`admin-status ${application.status}`}
                                    >
                                      {applicationStatusMap[application.status]}
                                    </span>
                                  </td>
                                  <td>{formatDate(application.created_at)}</td>
                                  <td>
                                    <div className="admin-actions">
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleApplicationStatus(
                                            application,
                                            'in_review'
                                          )
                                        }
                                      >
                                        В работу
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleApplicationStatus(
                                            application,
                                            'approved'
                                          )
                                        }
                                      >
                                        Одобрить
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        disabled={isLoading}
                                        onClick={() =>
                                          handleApplicationStatus(
                                            application,
                                            'rejected'
                                          )
                                        }
                                      >
                                        Отклонить
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeSection === 'analytics' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Аналитика платформы</h1>
                  <p>Центры, подписки и популярные направления.</p>
                </div>

                <div className="admin-analytics-filters">
                  <div className="admin-field">
                    <label>Город</label>
                    <input
                      className="admin-input"
                      type="text"
                      name="city"
                      value={analyticsFilters.city}
                      onChange={handleAnalyticsFilterChange}
                    />
                  </div>
                </div>

                {analyticsLoading && <p>Загрузка аналитики...</p>}

                {!analyticsLoading && analytics && (
                  <div className="admin-dashboard-grid">
                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Центры по городам</h2>
                        <p>Где подключены центры</p>
                      </div>

                      <div className="admin-chart">
                        {analytics.centersByCity.map((item) => {
                          const max = getMaxValue(analytics.centersByCity)

                          return (
                            <div key={item.city} className="admin-chart-row">
                              <span>{item.city}</span>
                              <div>
                                <i
                                  style={{
                                    width: `${(item.total / max) * 100}%`,
                                  }}
                                />
                              </div>
                              <b>{item.total}</b>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Статусы центров</h2>
                        <p>Активность и модерация</p>
                      </div>

                      <div className="admin-chart">
                        {analytics.centersByStatus.map((item) => {
                          const max = getMaxValue(analytics.centersByStatus)

                          return (
                            <div key={item.label} className="admin-chart-row">
                              <span>{item.label}</span>
                              <div>
                                <i
                                  style={{
                                    width: `${(item.total / max) * 100}%`,
                                  }}
                                />
                              </div>
                              <b>{item.total}</b>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Популярные категории</h2>
                        <p>По количеству кружков</p>
                      </div>

                      <div className="admin-chart">
                        {analytics.popularCategories.map((item) => {
                          const max = getMaxValue(analytics.popularCategories)

                          return (
                            <div key={item.category} className="admin-chart-row">
                              <span>{item.category}</span>
                              <div>
                                <i
                                  style={{
                                    width: `${(item.total / max) * 100}%`,
                                  }}
                                />
                              </div>
                              <b>{item.total}</b>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="admin-card">
                      <div className="admin-card-header">
                        <h2>Подписки по тарифам</h2>
                        <p>Распределение активных подписок</p>
                      </div>

                      <div className="admin-chart">
                        {analytics.subscriptionsByTariff.map((item) => {
                          const max = getMaxValue(
                            analytics.subscriptionsByTariff
                          )

                          return (
                            <div key={item.name} className="admin-chart-row">
                              <span>{item.name}</span>
                              <div>
                                <i
                                  style={{
                                    width: `${(item.total / max) * 100}%`,
                                  }}
                                />
                              </div>
                              <b>{item.total}</b>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'logs' && (
              <div className="admin-section-card">
                <div className="admin-section-header">
                  <h1>Логи платформы</h1>
                  <p>Системные события и важные действия администратора.</p>
                </div>

                {logsLoading && <p>Загрузка логов...</p>}

                {!logsLoading && logs.length === 0 && <p>Логов пока нет.</p>}

                <div className="admin-log-list">
                  {logs.map((log) => (
                    <article key={log.id} className="admin-log-card">
                      <div>
                        <h3>{log.title}</h3>
                        <p>{log.message}</p>
                      </div>

                      <div className="admin-log-meta">
                        <span>{log.type}</span>
                        <small>{formatDate(log.created_at)}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default AdminDashboardPage