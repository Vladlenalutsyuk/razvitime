import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { register, type RegisterRole } from '../../api/authApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'
import './RegisterPage.css'

function RegisterPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [role, setRole] = useState<RegisterRole>('parent')
  const [fullName, setFullName] = useState('')
  const [centerName, setCenterName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !phone.trim() || !password.trim()) {
      setError('Заполните email, телефон и пароль')
      showToast('Заполните email, телефон и пароль', { type: 'error' })
      return
    }

    if (role === 'parent' && !fullName.trim()) {
      setError('Введите ФИО родителя')
      showToast('Введите ФИО родителя', { type: 'error' })
      return
    }

    if (role === 'center_admin' && (!centerName.trim() || !city.trim())) {
      setError('Введите название центра и город')
      showToast('Введите название центра и город', { type: 'error' })
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      showToast('Пароль должен быть не короче 6 символов', { type: 'error' })
      return
    }

    if (password !== passwordRepeat) {
      setError('Пароли не совпадают')
      showToast('Пароли не совпадают', { type: 'error' })
      return
    }

    try {
      setSubmitting(true)

      const data = await register({
        role,
        email: email.trim(),
        phone: phone.trim(),
        password,
        full_name: fullName.trim(),
        center_name: centerName.trim(),
        city: city.trim(),
        address: address.trim(),
      })

      localStorage.setItem('razvitime_auth', JSON.stringify(data))
      showToast('Аккаунт создан', { type: 'success' })

      if (data.user.role === 'parent') {
        navigate('/parent', { replace: true })
        return
      }

      if (data.user.role === 'center_admin') {
        navigate('/center', { replace: true })
        return
      }

      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        showToast(err.message, { type: 'error' })
      } else {
        setError('Ошибка регистрации')
        showToast('Ошибка регистрации', { type: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <main className="register-page">
        <PageContainer>
          <section className="register-section">
            <div className="register-card">
              <div className="register-header">
                <p className="register-kicker">Создание аккаунта</p>
                <h1>Присоединиться к РазвиТайм</h1>
                <p>
                  Выберите тип аккаунта и заполните данные. После регистрации вы
                  попадёте в личный кабинет.
                </p>
              </div>

              <form className="register-form" onSubmit={handleSubmit}>
                <div className="register-role-tabs">
                  <button
                    type="button"
                    className={role === 'parent' ? 'active' : ''}
                    onClick={() => setRole('parent')}
                    disabled={submitting}
                  >
                    Родитель
                  </button>

                  <button
                    type="button"
                    className={role === 'center_admin' ? 'active' : ''}
                    onClick={() => setRole('center_admin')}
                    disabled={submitting}
                  >
                    Детский центр
                  </button>
                </div>

                {role === 'parent' && (
                  <label className="register-field">
                    <span>ФИО родителя</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Например, Екатерина Иванова"
                      disabled={submitting}
                    />
                  </label>
                )}

                {role === 'center_admin' && (
                  <>
                    <label className="register-field">
                      <span>Название центра</span>
                      <input
                        type="text"
                        value={centerName}
                        onChange={(e) => setCenterName(e.target.value)}
                        placeholder="Например, Демо Центр развития детей"
                        disabled={submitting}
                      />
                    </label>

                    <label className="register-field">
                      <span>Город</span>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Например, Симферополь"
                        disabled={submitting}
                      />
                    </label>

                    <label className="register-field">
                      <span>Адрес</span>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Например, ул. Кирова, 15"
                        disabled={submitting}
                      />
                    </label>
                  </>
                )}

                <label className="register-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.ru"
                    disabled={submitting}
                  />
                </label>

                <label className="register-field">
                  <span>Телефон</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 999 000 00 00"
                    disabled={submitting}
                  />
                </label>

                <div className="register-fields-row">
                  <label className="register-field">
                    <span>Пароль</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      disabled={submitting}
                    />
                  </label>

                  <label className="register-field">
                    <span>Повторите пароль</span>
                    <input
                      type="password"
                      value={passwordRepeat}
                      onChange={(e) => setPasswordRepeat(e.target.value)}
                      placeholder="Повторите пароль"
                      disabled={submitting}
                    />
                  </label>
                </div>

                {error && <p className="register-error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-primary register-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
                </button>

                <p className="register-login-link">
                  Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
              </form>
            </div>
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default RegisterPage