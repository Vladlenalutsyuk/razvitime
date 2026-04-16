import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getStats, type StatsResponse } from '../../api/statsApi'
import {
  getPartnerCenters,
  getPublishedReviews,
  type PartnerCenter,
  type PublicReview,
} from '../../api/homeApi'

type ReviewTab = 'parent' | 'center'

function HomePage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [statsError, setStatsError] = useState('')
  const [statsLoading, setStatsLoading] = useState(false)

  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsError, setReviewsError] = useState('')
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTab>('parent')

  const [partners, setPartners] = useState<PartnerCenter[]>([])
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [partnersError, setPartnersError] = useState('')

  useEffect(() => {
    async function loadStats() {
      try {
        setStatsLoading(true)
        setStatsError('')

        const data = await getStats()
        setStats(data)
      } catch (error) {
        console.error(error)
        setStatsError('Не удалось загрузить статистику')
        setStats(null)
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [])

  useEffect(() => {
    async function loadReviews() {
      try {
        setReviewsLoading(true)
        setReviewsError('')

        const data = await getPublishedReviews()
        setReviews(data)
      } catch (error) {
        console.error(error)
        setReviewsError('Не удалось загрузить отзывы')
        setReviews([])
      } finally {
        setReviewsLoading(false)
      }
    }

    loadReviews()
  }, [])

  useEffect(() => {
    async function loadPartners() {
      try {
        setPartnersLoading(true)
        setPartnersError('')

        const data = await getPartnerCenters()
        setPartners(data)
      } catch (error) {
        console.error(error)
        setPartnersError('Не удалось загрузить список центров')
        setPartners([])
      } finally {
        setPartnersLoading(false)
      }
    }

    loadPartners()
  }, [])

  const visibleReviews = useMemo(() => {
    return reviews.filter((review) => review.type === activeReviewTab)
  }, [reviews, activeReviewTab])

  return (
    <>
      <Header />

      <main>
        <section className="hero">
          <PageContainer>
            <div className="hero-inner">
              <div>
                <h1 className="hero-title">
                  РазвиТайм — это удобный онлайн-помощник для родителей
                </h1>

                <p className="hero-tagline">
                  Все занятия ваших детей — в одном расписании.
                </p>

                <p
                  style={{
                    fontSize: '18px',
                    lineHeight: 1.6,
                    marginTop: '16px',
                    marginBottom: '20px',
                    maxWidth: '720px',
                  }}
                >
                  Платформа помогает родителям быстро находить кружки для детей,
                  собирать школьные уроки и занятия в одном месте, а детским
                  центрам — получать больше заявок и снижать затраты на рекламу.
                </p>

                <div className="hero-badges">
                  <span className="badge">единое расписание семьи</span>
                  <span className="badge">можно добавить школьное расписание</span>
                  <span className="badge">личный кабинет родителей</span>
                  <span className="badge">фильтр по поиску занятий</span>
                  <span className="badge">для центров — больше охватов и клиентов</span>
                  <span className="badge">меньше затрат на рекламу</span>
                </div>

                <div className="hero-actions">
                  <Link to="/login" className="btn btn-primary">
                    Я родитель
                  </Link>

                  <Link to="/login" className="btn btn-secondary">
                    Я детский центр
                  </Link>
                </div>

                <p className="hero-caption">
                  Подходит для родителей детей 3–17 лет и для детских центров,
                  которым нужен удобный цифровой кабинет и стабильный поток заявок.
                </p>
              </div>

              <div className="hero-schedule-card">
                <div className="hero-schedule-header">
                  <div>
                    <div className="hero-schedule-title">
                      Демо-расписание Марии, 8 лет
                    </div>
                    <div className="hero-schedule-sub">
                      как выглядит неделя без пересечений
                    </div>
                  </div>

                  <span className="hero-chip">демо-режим</span>
                </div>

                <div className="schedule-grid">
                  <div>
                    <div className="schedule-day">Пн</div>
                    <div className="schedule-slot slot-school">Школа 8:30–13:30</div>
                    <div className="schedule-slot slot-creative">Рисование 16:00</div>
                  </div>

                  <div>
                    <div className="schedule-day">Вт</div>
                    <div className="schedule-slot slot-school">Школа 8:30–13:30</div>
                    <div className="schedule-slot slot-sport">Плавание 18:00</div>
                  </div>

                  <div>
                    <div className="schedule-day">Ср</div>
                    <div className="schedule-slot slot-school">Школа 8:30–13:30</div>
                    <div className="schedule-slot slot-creative">Английский 17:00</div>
                  </div>

                  <div>
                    <div className="schedule-day">Чт</div>
                    <div className="schedule-slot slot-school">Школа 8:30–13:30</div>
                    <div className="schedule-slot slot-sport">Гимнастика 17:30</div>
                  </div>

                  <div>
                    <div className="schedule-day">Пт</div>
                    <div className="schedule-slot slot-school">Школа 8:30–12:30</div>
                    <div className="schedule-slot slot-creative">Робототехника 16:30</div>
                  </div>
                </div>

                <div className="hero-legend">
                  <span className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: '#f0f0f3' }}
                    ></span>{' '}
                    школа
                  </span>

                  <span className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: '#e4f6e4' }}
                    ></span>{' '}
                    спорт
                  </span>

                  <span className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: '#ffe1c8' }}
                    ></span>{' '}
                    творчество и языки
                  </span>
                </div>
              </div>
            </div>
          </PageContainer>
        </section>

        <section className="section" id="about">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">О платформе РазвиТайм</h2>
              <p className="section-subtitle">
                Мы объединяем родителей, детей и детские центры в одном удобном
                онлайн-пространстве.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <h3>Все кружки в одном месте</h3>
                <p>
                  Родителям не нужно искать занятия по десяткам сайтов и чатов —
                  каталог кружков собран в одном сервисе.
                </p>
              </article>

              <article className="feature-card">
                <h3>Умное расписание без пересечений</h3>
                <p>
                  Можно добавить школьные уроки ребёнка и подбирать занятия так,
                  чтобы они не конфликтовали с учебной неделей.
                </p>
              </article>

              <article className="feature-card">
                <h3>Напоминания и удобное планирование</h3>
                <p>
                  Все занятия детей, статусы записей и важные события собраны в
                  одном кабинете и одном понятном расписании.
                </p>
              </article>

              <article className="feature-card">
                <h3>Простая работа для детских центров</h3>
                <p>
                  Центры размещают кружки, управляют расписанием и получают заявки
                  от родителей без лишней рекламной нагрузки.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>

        <section className="section" id="parents">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">Инструкция для родителей</h2>
              <p className="section-subtitle">
                Начать пользоваться платформой можно за несколько шагов.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <h3>1. Зарегистрируйтесь</h3>
                <p>
                  Войдите в систему как родитель и получите доступ к личному кабинету.
                </p>
              </article>

              <article className="feature-card">
                <h3>2. Добавьте детей и школьное расписание</h3>
                <p>
                  Создайте профили детей, укажите возраст и соберите для них удобную
                  учебную неделю.
                </p>
              </article>

              <article className="feature-card">
                <h3>3. Подберите кружки</h3>
                <p>
                  Используйте фильтры по городу, возрасту и категории и записывайте
                  ребёнка в пару кликов.
                </p>
              </article>
            </div>

            <div style={{ marginTop: '20px' }}>
              <Link to="/login" className="btn btn-primary">
                Начать как родитель
              </Link>
            </div>
          </PageContainer>
        </section>

        <section className="section" id="centers">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">Инструкция для центров</h2>
              <p className="section-subtitle">
                РазвиТайм помогает центрам расти и работать с заявками удобнее.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <h3>0. Подключите центр</h3>
                <p>
                  Оплатите подписку и получите логин и пароль для доступа в кабинет центра.
                </p>
              </article>

              <article className="feature-card">
                <h3>1. Заполните профиль и кружки</h3>
                <p>
                  Добавьте информацию о центре, описание направлений, возраст,
                  цены и расписание занятий.
                </p>
              </article>

              <article className="feature-card">
                <h3>2. Получайте заявки</h3>
                <p>
                  Родители будут видеть ваши кружки в каталоге, а вы сможете
                  обрабатывать записи и управлять занятостью.
                </p>
              </article>
            </div>

            <div
              style={{
                marginTop: '20px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <Link to="/login" className="btn btn-secondary">
                Начать как центр
              </Link>
              <Link to="/login" className="btn btn-primary">
                Оставить заявку центру
              </Link>
            </div>
          </PageContainer>
        </section>

        <section className="section stats-section">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">Цифры и статистика</h2>
              <p className="section-subtitle">
                Данные подгружаются из базы РазвиТайм.
              </p>
            </div>

            {statsLoading && <p>Загрузка статистики...</p>}
            {statsError && <p>{statsError}</p>}

            {stats && !statsLoading && (
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-number">{stats.parents}</div>
                  <div className="stat-label">Родителей</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number">{stats.kids}</div>
                  <div className="stat-label">Детей</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number">{stats.activities}</div>
                  <div className="stat-label">Активных кружков</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number">{stats.centers}</div>
                  <div className="stat-label">Центров</div>
                </article>
              </div>
            )}
          </PageContainer>
        </section>

        <section className="section" id="reviews">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">Отзывы</h2>
              <p className="section-subtitle">
                Что говорят родители и представители центров о платформе.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className={`btn ${
                  activeReviewTab === 'parent' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setActiveReviewTab('parent')}
              >
                Отзывы родителей
              </button>

              <button
                type="button"
                className={`btn ${
                  activeReviewTab === 'center' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setActiveReviewTab('center')}
              >
                Отзывы центров
              </button>
            </div>

            {reviewsLoading && <p>Загрузка отзывов...</p>}
            {reviewsError && <p>{reviewsError}</p>}

            {!reviewsLoading && visibleReviews.length === 0 && (
              <p>Пока отзывов в этом разделе нет.</p>
            )}

            {visibleReviews.length > 0 && (
              <div className="feature-grid">
                {visibleReviews.map((review) => (
                  <article key={review.id} className="feature-card">
                    <h3>{review.author_name}</h3>
                    <p style={{ marginBottom: '10px', color: '#666' }}>
                      {review.role ||
                        (review.type === 'parent' ? 'Родитель' : 'Центр')}
                      {review.center_name ? ` • ${review.center_name}` : ''}
                    </p>
                    <p>{review.text}</p>
                  </article>
                ))}
              </div>
            )}
          </PageContainer>
        </section>

        <section className="section" id="partners">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">С нами сотрудничают</h2>
              <p className="section-subtitle">
                Детские центры, которые уже размещают свои кружки на платформе.
              </p>
            </div>

            {partnersLoading && <p>Загрузка центров...</p>}
            {partnersError && <p>{partnersError}</p>}

            {!partnersLoading && partners.length === 0 && (
              <p>Пока список центров пуст.</p>
            )}

            {partners.length > 0 && (
              <div className="feature-grid">
                {partners.map((center) => (
                  <article key={center.id} className="feature-card">
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: '#f4f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        marginBottom: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      {center.logo_url ? (
                        <img
                          src={center.logo_url}
                          alt={center.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        center.name.slice(0, 1)
                      )}
                    </div>

                    <h3>{center.name}</h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>{center.city}</p>
                    <p>
                      {center.short_description ||
                        'Детский центр партнёр платформы РазвиТайм.'}
                    </p>

                    <div style={{ marginTop: '14px' }}>
                      <Link
                        to={`/centers/${center.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        Подробнее о центре
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </PageContainer>
        </section>

        <footer className="section" style={{ paddingTop: 0 }}>
          <PageContainer>
            <div className="feature-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '20px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ marginBottom: '8px' }}>РазвиТайм</h3>
                  <p style={{ margin: 0 }}>
                    Удобный онлайн-помощник для родителей и детских центров.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <a href="#about">О платформе</a>
                  <a href="#parents">Для родителей</a>
                  <a href="#centers">Для центров</a>
                  <a href="#partners">Контакты</a>
                  <a href="#about">Политика конфиденциальности</a>
                  <a href="#about">Пользовательское соглашение</a>
                </div>
              </div>
            </div>
          </PageContainer>
        </footer>
      </main>
    </>
  )
}

export default HomePage