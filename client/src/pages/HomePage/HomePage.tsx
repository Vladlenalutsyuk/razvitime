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

      <main className="home-page">
        <section className="hero home-anchor-section" id="top">
          <PageContainer>
            <div className="hero-inner">
              <div className="hero-copy">
                <div className="hero-kicker">✨ Удобно. Понятно. По-семейному.</div>

                <h1 className="hero-title">
                  РазвиТайм — это удобный онлайн-помощник для родителей
                </h1>

                <p className="hero-tagline hero-tagline-strong">
                  Все занятия ваших детей — в одном расписании.
                </p>

                <p className="hero-description">
                  Платформа помогает родителям быстро находить кружки для детей,
                  собирать школьные уроки и занятия в одном месте, а детским
                  центрам — получать больше заявок, повышать охваты и снижать
                  затраты на рекламу.
                </p>

                <div className="hero-badges">
                  <span className="badge">📅 единое расписание семьи</span>
                  <span className="badge">🏫 школьное расписание</span>
                  <span className="badge">👩‍👧 личный кабинет родителей</span>
                  <span className="badge">🔎 поиск с фильтрами</span>
                  <span className="badge">📈 больше клиентов для центров</span>
                  <span className="badge">💸 меньше затрат на рекламу</span>
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
                      👧 Демо-расписание Марии, 8 лет
                    </div>
                    <div className="hero-schedule-sub">
                      пример недели без пересечений
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
                    <span className="legend-dot hero-legend-school"></span>
                    школа
                  </span>

                  <span className="legend-item">
                    <span className="legend-dot hero-legend-sport"></span>
                    спорт
                  </span>

                  <span className="legend-item">
                    <span className="legend-dot hero-legend-creative"></span>
                    творчество и языки
                  </span>
                </div>
              </div>
            </div>
          </PageContainer>
        </section>

        <section className="section home-anchor-section home-section-alt" id="about">
          <PageContainer>
            <div className="section-header section-header-centered">
              <h2 className="section-title">🌿 О платформе РазвиТайм</h2>
              <p className="section-subtitle">
                Всё важное про кружки, расписание и заявки — в одном удобном
                цифровом пространстве.
              </p>
            </div>

            <div className="feature-grid home-feature-grid">
              <article className="feature-card feature-card-home">
                <div className="feature-emoji">🎯</div>
                <h3>Все кружки в одном месте</h3>
                <p>
                  Родителям не нужно искать занятия по десяткам сайтов и чатов —
                  каталог собран в одном сервисе.
                </p>
              </article>

              <article className="feature-card feature-card-home">
                <div className="feature-emoji">🗓️</div>
                <h3>Умное расписание без пересечений</h3>
                <p>
                  Можно добавить школьные уроки ребёнка и подбирать кружки так,
                  чтобы всё было удобно и без накладок.
                </p>
              </article>

              <article className="feature-card feature-card-home">
                <div className="feature-emoji">🔔</div>
                <h3>Напоминания и удобное планирование</h3>
                <p>
                  Все занятия детей, ближайшие события и статусы записей собраны
                  в одном понятном кабинете.
                </p>
              </article>

              <article className="feature-card feature-card-home">
                <div className="feature-emoji">🏡</div>
                <h3>Простая работа для детских центров</h3>
                <p>
                  Центры размещают кружки, управляют расписанием и получают заявки
                  от родителей без лишней рекламной нагрузки.
                </p>
              </article>
            </div>
          </PageContainer>
        </section>

        <section className="section home-anchor-section" id="guide">
          <PageContainer>
            <div className="section-header section-header-centered">
              <h2 className="section-title">🧭 Инструкция</h2>
              <p className="section-subtitle">
                Два понятных сценария — для родителей и для центров.
              </p>
            </div>

            <div className="guide-grid">
              <article className="guide-card guide-card-parent" id="parents">
                <div className="guide-card-badge">Для родителей</div>
                <h3>👨‍👩‍👧 Начать как родитель</h3>

                <div className="guide-steps">
                  <div className="guide-step">
                    <div className="guide-step-number">1</div>
                    <div>
                      <b>Зарегистрируйтесь</b>
                      <p>Войдите в систему и получите доступ к личному кабинету.</p>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="guide-step-number">2</div>
                    <div>
                      <b>Добавьте детей и школьное расписание</b>
                      <p>
                        Создайте профили детей, укажите возраст и соберите учебную
                        неделю.
                      </p>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="guide-step-number">3</div>
                    <div>
                      <b>Подберите кружки</b>
                      <p>
                        Используйте фильтры по городу, возрасту и категории и
                        записывайте ребёнка в пару кликов.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="guide-card-actions">
                  <Link to="/login" className="btn btn-primary">
                    Начать как родитель
                  </Link>
                </div>
              </article>

              <article className="guide-card guide-card-center" id="centers">
                <div className="guide-card-badge">Для центров</div>
                <h3>🏫 Начать как детский центр</h3>

                <div className="guide-steps">
                  <div className="guide-step">
                    <div className="guide-step-number">0</div>
                    <div>
                      <b>Подключите центр</b>
                      <p>
                        Оплатите подписку и получите логин и пароль для доступа в кабинет.
                      </p>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="guide-step-number">1</div>
                    <div>
                      <b>Заполните профиль и кружки</b>
                      <p>
                        Добавьте информацию о центре, направления, возраст,
                        стоимость и расписание занятий.
                      </p>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="guide-step-number">2</div>
                    <div>
                      <b>Получайте заявки</b>
                      <p>
                        Родители увидят ваши кружки в каталоге, а вы сможете
                        управлять записями и занятостью.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="guide-card-actions">
                  <Link to="/login" className="btn btn-secondary">
                    Начать как центр
                  </Link>

                  <Link to="/login" className="btn btn-primary">
                    Оставить заявку
                  </Link>
                </div>
              </article>
            </div>
          </PageContainer>
        </section>

        <section className="section stats-section home-anchor-section" id="stats">
          <PageContainer>
            <div className="section-header section-header-centered">
              <h2 className="section-title">📊 Цифры и статистика</h2>
              <p className="section-subtitle">
                Живые данные подгружаются из базы РазвиТайм.
              </p>
            </div>

            {statsLoading && <p>Загрузка статистики...</p>}
            {statsError && <p>{statsError}</p>}

            {stats && !statsLoading && (
              <div className="stats-grid">
                <article className="stat-card">
                  <div className="stat-number stat-orange">{stats.parents}</div>
                  <div className="stat-label">Родителей</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number stat-green">{stats.kids}</div>
                  <div className="stat-label">Детей</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number stat-orange">{stats.activities}</div>
                  <div className="stat-label">Активных кружков</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number stat-green">{stats.centers}</div>
                  <div className="stat-label">Центров</div>
                </article>
              </div>
            )}
          </PageContainer>
        </section>

        <section className="section home-anchor-section" id="reviews">
          <PageContainer>
            <div className="section-header section-header-centered">
              <h2 className="section-title">💬 Отзывы</h2>
              <p className="section-subtitle">
                Что говорят родители и представители центров о платформе.
              </p>
            </div>

            <div className="review-tabs">
              <button
                type="button"
                className={`btn ${
                  activeReviewTab === 'parent' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setActiveReviewTab('parent')}
              >
                Родители
              </button>

              <button
                type="button"
                className={`btn ${
                  activeReviewTab === 'center' ? 'btn-primary' : 'btn-secondary'
                }`}
                onClick={() => setActiveReviewTab('center')}
              >
                Центры
              </button>
            </div>

            {reviewsLoading && <p>Загрузка отзывов...</p>}
            {reviewsError && <p>{reviewsError}</p>}

            {!reviewsLoading && visibleReviews.length === 0 && (
              <p>Пока отзывов в этом разделе нет.</p>
            )}

            {visibleReviews.length > 0 && (
              <div className="reviews-grid">
                {visibleReviews.map((review) => (
                  <article key={review.id} className="feature-card review-card-home">
                    <div className="review-card-top">
                      <div className="review-avatar">
                        {review.author_name.slice(0, 1)}
                      </div>

                      <div>
                        <h3>{review.author_name}</h3>
                        <p className="review-role-text">
                          {review.role ||
                            (review.type === 'parent' ? 'Родитель' : 'Центр')}
                          {review.center_name ? ` • ${review.center_name}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="review-main-text">“{review.text}”</p>
                  </article>
                ))}
              </div>
            )}
          </PageContainer>
        </section>

        <section
          className="section home-anchor-section home-section-alt"
          id="partners"
        >
          <PageContainer>
            <div className="section-header section-header-centered">
              <h2 className="section-title">🤝 С нами сотрудничают</h2>
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
              <div className="partners-grid">
                {partners.map((center) => (
                  <article key={center.id} className="feature-card partner-card-home">
                    <div className="partner-top">
                      <div className="partner-logo-box">
                        {center.logo_url ? (
                          <img
                            src={center.logo_url}
                            alt={center.name}
                            className="partner-logo-image"
                          />
                        ) : (
                          center.name.slice(0, 1)
                        )}
                      </div>

                      <div>
                        <h3>{center.name}</h3>
                        <p className="partner-city-text">{center.city}</p>
                      </div>
                    </div>

                    <p className="partner-desc-text">
                      {center.short_description ||
                        'Детский центр-партнёр платформы РазвиТайм.'}
                    </p>

                    <div className="partner-actions">
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

        <section className="section home-anchor-section" id="support">
          <PageContainer>
            <div className="support-card">
              <div className="support-copy">
                <div className="support-kicker">📩 Поддержка и связь</div>
                <h2>Нужна помощь или хотите подключить центр?</h2>
                <p>
                  Напишите нам — поможем разобраться с платформой, регистрацией,
                  размещением кружков и подключением центра.
                </p>
              </div>

              <div className="support-actions">
                <Link to="/login" className="btn btn-primary">
                  Перейти ко входу
                </Link>

                <a href="#top" className="btn btn-secondary">
                  Наверх
                </a>
              </div>
            </div>
          </PageContainer>
        </section>

        <footer className="home-footer">
          <PageContainer>
            <div className="home-footer-inner">
              <div className="home-footer-brand">
                <div className="home-footer-title">РазвиТайм</div>
                <p>
                  Удобный онлайн-помощник для родителей и детских центров.
                </p>
              </div>

              <div className="home-footer-links">
                <a href="/#about">О платформе</a>
                <a href="/#guide">Инструкция</a>
                <a href="/#stats">Статистика</a>
                <a href="/#reviews">Отзывы</a>
                <a href="/#partners">Центры</a>
                <a href="/#support">Поддержка</a>
              </div>
            </div>
          </PageContainer>
        </footer>
      </main>
    </>
  )
}

export default HomePage