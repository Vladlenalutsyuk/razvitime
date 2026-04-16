import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import {
  getPublicCenterById,
  type PublicCenterDetails,
} from '../../api/homeApi'

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
  if (paymentType === 'free') {
    return 'Бесплатно'
  }

  if (paymentType === 'per_lesson') {
    return `${price} ₽ за занятие`
  }

  return `${price} ₽ в месяц`
}

function PublicCenterPage() {
  const { id } = useParams()
  const centerId = Number(id)

  const [center, setCenter] = useState<PublicCenterDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!Number.isFinite(centerId) || centerId <= 0) {
      setCenter(null)
      setError('Центр не найден')
      return
    }

    async function loadCenter() {
      try {
        setLoading(true)
        setError('')

        const data = await getPublicCenterById(centerId)
        setCenter(data)
      } catch (err) {
        console.error(err)
        setCenter(null)
        setError(
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить страницу центра'
        )
      } finally {
        setLoading(false)
      }
    }

    loadCenter()
  }, [centerId])

  return (
    <>
      <Header />

      <main>
        <section className="section">
          <PageContainer>
            {loading && <h1 className="section-title">Загрузка центра...</h1>}

            {!loading && error && (
              <div>
                <h1 className="section-title">Центр не найден</h1>
                <p style={{ marginTop: '12px' }}>{error}</p>

                <div style={{ marginTop: '16px' }}>
                  <Link to="/" className="btn btn-secondary">
                    На главную
                  </Link>
                </div>
              </div>
            )}

            {!loading && center && (
              <>
                <div className="section-header">
                  <h1 className="section-title">{center.name}</h1>
                  <p className="section-subtitle">
                    Открытая страница детского центра для родителей
                  </p>
                </div>

                <div className="feature-grid" style={{ marginBottom: '24px' }}>
                  <article className="feature-card">
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '18px',
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

                    {center.short_description && (
                      <p style={{ marginTop: '10px' }}>{center.short_description}</p>
                    )}

                    {center.full_description && (
                      <p style={{ marginTop: '10px' }}>{center.full_description}</p>
                    )}
                  </article>

                  <article className="feature-card">
                    <h3>Контакты и адрес</h3>
                    <p>
                      <b>Город:</b> {center.city}
                    </p>
                    <p>
                      <b>Адрес:</b> {center.address}
                    </p>

                    {center.landmark && (
                      <p>
                        <b>Ориентир:</b> {center.landmark}
                      </p>
                    )}

                    {center.phone && (
                      <p>
                        <b>Телефон:</b> {center.phone}
                      </p>
                    )}

                    {center.email && (
                      <p>
                        <b>Email:</b> {center.email}
                      </p>
                    )}

                    {center.website && (
                      <p>
                        <b>Сайт:</b> {center.website}
                      </p>
                    )}

                    {center.telegram && (
                      <p>
                        <b>Telegram:</b> {center.telegram}
                      </p>
                    )}

                    {center.whatsapp && (
                      <p>
                        <b>WhatsApp:</b> {center.whatsapp}
                      </p>
                    )}

                    {center.vk && (
                      <p>
                        <b>VK:</b> {center.vk}
                      </p>
                    )}
                  </article>
                </div>

                <div className="section-header">
                  <h2 className="section-title">Кружки центра</h2>
                  <p className="section-subtitle">
                    Выберите интересующее направление и перейдите к записи
                  </p>
                </div>

                {center.activities.length === 0 ? (
                  <p>У этого центра пока нет доступных кружков.</p>
                ) : (
                  <div className="activities-list">
                    {center.activities.map((activity) => (
                      <article
                        key={activity.id}
                        className="feature-card"
                        style={{ marginBottom: '12px' }}
                      >
                        <h3>{activity.title}</h3>
                        <p>
                          <b>Категория:</b> {activity.category}
                        </p>
                        <p>
                          <b>Возраст:</b> {activity.age_min}–{activity.age_max}
                        </p>
                        <p>
                          <b>Стоимость:</b>{' '}
                          {formatPrice(activity.price, activity.payment_type)}
                        </p>

                        {activity.short_description && (
                          <p>{activity.short_description}</p>
                        )}

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

                        <div style={{ marginTop: '14px' }}>
                          <Link
                            to={`/activity/${activity.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            Перейти к кружку
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default PublicCenterPage