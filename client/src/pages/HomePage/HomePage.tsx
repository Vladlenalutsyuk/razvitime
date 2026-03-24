import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { getStats } from '../../api/statsApi'

type Stats = {
  parents: number
  kids: number
  centers: number
  activities: number
}

function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState('')
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getStats()
        setStats(data)
      } catch (error) {
        setStatsError('Не удалось загрузить статистику')
      }
    }

    loadStats()
  }, [])
  return (
    <>
      <Header />

      <main>
        <section className="hero">
          <PageContainer>
            <div className="hero-inner">
              <div>
                <h1 className="hero-title">
                  РазвиТайм — удобный онлайн-помощник для родителей и детских центров
                </h1>

                <p className="hero-tagline">
                  Все занятия ваших детей — в одном расписании: единый каталог кружков, учёт школьных уроков
                  и удобный личный кабинет для родителей и центров.
                </p>

                <div className="hero-badges">
                  <span className="badge">единое расписание семьи</span>
                  <span className="badge">учёт школьного расписания</span>
                  <span className="badge">личный кабинет родителя</span>
                  <span className="badge">фильтры по занятиям и районам</span>
                  <span className="badge">для центров — больше заявок и меньше затрат на рекламу</span>
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
                  Платформа для мам и пап детей 3–17 лет и администраторов детских центров: наводим порядок
                  в расписании и помогаем не упускать важные занятия.
                </p>
              </div>

              <div className="hero-schedule-card">
                <div className="hero-schedule-header">
                  <div>
                    <div className="hero-schedule-title">Демо-расписание Марии, 8 лет</div>
                    <div className="hero-schedule-sub">как выглядит неделя без пересечений</div>
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
                    <span className="legend-dot" style={{ background: '#f0f0f3' }}></span> школа
                  </span>

                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: '#e4f6e4' }}></span> спорт
                  </span>

                  <span className="legend-item">
                    <span className="legend-dot" style={{ background: '#ffe1c8' }}></span> творчество и языки
                  </span>
                </div>
              </div>
            </div>
          </PageContainer>
        </section>
        <section className="section">
          <PageContainer>
            <div className="section-header">
              <h2 className="section-title">О платформе РазвиТайм</h2>
              <p className="section-subtitle">
                Мы объединяем родителей, детей и детские центры в одном удобном онлайн-пространстве.
              </p>
            </div>

            <div className="feature-grid">
              <article className="feature-card">
                <div className="feature-icon"></div>
                <h3>Все кружки в одном месте</h3>
                <p>
                  Собираем каталоги занятий по городу: спорт, творчество, наука, языки и подготовка к школе — в одном интерфейсе.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon"></div>
                <h3>Умное расписание без пересечений</h3>
                <p>
                  Вы указываете школьные уроки детей, а система помогает подбирать кружки так, чтобы ничего не накладывалось друг на друга.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon"></div>
                <h3>Напоминания и удобное планирование</h3>
                <p>
                  Напоминания о занятиях, ближайшие события, экспорт в календарь и единое семейное расписание, понятное всем.
                </p>
              </article>

              <article className="feature-card">
                <div className="feature-icon"></div>
                <h3>Простая работа для детских центров</h3>
                <p>
                  Онлайн-кабинет центра, заявки от родителей, управление расписанием и рост охватов без лишних рекламных затрат.
                </p>
              </article>
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

            {statsError && <p>{statsError}</p>}

            {stats && (
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
                  <div className="stat-number">{stats.centers}</div>
                  <div className="stat-label">Центров</div>
                </article>

                <article className="stat-card">
                  <div className="stat-number">{stats.activities}</div>
                  <div className="stat-label">Занятий</div>
                </article>
              </div>
            )}
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default HomePage