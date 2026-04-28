import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import {
  getPublicCenterById,
  type PublicCenterDetails,
} from '../../api/homeApi'
import './PublicCenterPage.css'

const weekdayMap: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
  7: 'Воскресенье',
}

function formatPrice(price: number, paymentType: string) {
  if (paymentType === 'free') return 'Бесплатно'
  if (paymentType === 'per_lesson') return `${price} ₽ за занятие`
  return `${price} ₽ в месяц`
}

function PublicCenterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const centerId = Number(id)

  const [center, setCenter] = useState<PublicCenterDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isFinite(centerId)) return

    async function load() {
      try {
        setLoading(true)
        const data = await getPublicCenterById(centerId)
        setCenter(data)
      } catch (e) {
        console.error(e)
        setError('Ошибка загрузки центра')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [centerId])

  if (loading) {
    return (
      <>
        <Header />
        <main className="center-page">
          <PageContainer>
            <div className="center-state">Загрузка...</div>
          </PageContainer>
        </main>
      </>
    )
  }

  if (!center) {
    return (
      <>
        <Header />
        <main className="center-page">
          <PageContainer>
            <div className="center-state">
              <h1>Центр не найден</h1>
              <Link to="/" className="btn btn-secondary">
                На главную
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

      <main className="center-page">
        <PageContainer>
          <div className="center-back-row">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(-1)}
            >
              ← Назад
            </button>
          </div>
          <section className="center-hero">
            <div className="center-hero-left">
              <div className="center-logo">
                {center.logo_url ? (
                  <img src={center.logo_url} />
                ) : (
                  center.name[0]
                )}
              </div>

              <div>
                <h1>{center.name}</h1>
                <p>{center.short_description}</p>
              </div>
            </div>
          </section>

          <section className="center-layout">
            <div className="center-main">
              <div className="center-card">
                <h2>О центре</h2>
                <p>{center.full_description || 'Описание отсутствует'}</p>
              </div>

              <div className="center-card">
                <h2>Кружки центра</h2>

                {center.activities.length === 0 && (
                  <p>Нет занятий</p>
                )}

                <div className="center-activities">
                  {center.activities.map((a) => (
                    <div key={a.id} className="center-activity-card">
                      <h3>{a.title}</h3>

                      <p>
                        {a.age_min}–{a.age_max} лет
                      </p>

                      <p>{formatPrice(a.price, a.payment_type)}</p>

                      {a.sessions?.map((s) => (
                        <span key={s.id} className="center-session">
                          {weekdayMap[s.weekday]} {s.start_time.slice(0, 5)}–
                          {s.end_time.slice(0, 5)}
                        </span>
                      ))}

                      <Link
                        to={`/activity/${a.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Подробнее
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="center-sidebar">
              <div className="center-card">
                <h3>Контакты</h3>

                <p><b>Город:</b> {center.city}</p>
                <p><b>Адрес:</b> {center.address}</p>

                {center.phone && <p>{center.phone}</p>}
                {center.email && <p>{center.email}</p>}
              </div>
            </aside>
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default PublicCenterPage