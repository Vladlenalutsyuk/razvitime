import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { createCenterApplication } from '../../api/centerApplicationsApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'
import './CenterApplicationPage.css'

function CenterApplicationPage() {
  const { showToast } = useToast()

  const [centerName, setCenterName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!centerName.trim() || !contactPerson.trim() || !phone.trim()) {
      setError('Заполните название центра, контактное лицо и телефон')
      showToast('Заполните обязательные поля', { type: 'error' })
      return
    }

    try {
      setSubmitting(true)

      await createCenterApplication({
        center_name: centerName.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        comment: comment.trim(),
      })

      setSuccess(true)
      showToast('Заявка отправлена', { type: 'success' })

      setCenterName('')
      setContactPerson('')
      setPhone('')
      setEmail('')
      setCity('')
      setComment('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось отправить заявку'

      setError(message)
      showToast(message, { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <main className="center-application-page">
        <PageContainer>
          <section className="center-application-section">
            <div className="center-application-card">
              <div className="center-application-header">
                <p className="center-application-kicker">Для детских центров</p>
                <h1>Оставить заявку на подключение</h1>
                <p>
                  Заполните короткую форму. Мы проверим данные, свяжемся с вами и
                  поможем подключить центр к платформе.
                </p>
              </div>

              <form className="center-application-form" onSubmit={handleSubmit}>
                <label className="center-application-field">
                  <span>Название центра *</span>
                  <input
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="Например, Центр развития детей"
                    disabled={submitting}
                  />
                </label>

                <label className="center-application-field">
                  <span>Контактное лицо *</span>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Имя человека для связи"
                    disabled={submitting}
                  />
                </label>

                <div className="center-application-row">
                  <label className="center-application-field">
                    <span>Телефон *</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 999 000 00 00"
                      disabled={submitting}
                    />
                  </label>

                  <label className="center-application-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="center@mail.ru"
                      disabled={submitting}
                    />
                  </label>
                </div>

                <label className="center-application-field">
                  <span>Город</span>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Например, Симферополь"
                    disabled={submitting}
                  />
                </label>

                <label className="center-application-field">
                  <span>Комментарий</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Расскажите кратко о центре, направлениях и удобном времени для связи"
                    disabled={submitting}
                  />
                </label>

                {error && <p className="center-application-error">{error}</p>}

                {success && (
                  <p className="center-application-success">
                    Заявка отправлена. Мы свяжемся с вами после проверки.
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary center-application-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Отправляем...' : 'Отправить заявку'}
                </button>

                <p className="center-application-login">
                  Уже подключены? <Link to="/login">Войти в кабинет</Link>
                </p>
              </form>
            </div>
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default CenterApplicationPage