import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { login } from '../../api/authApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'
import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'parent' | 'center_admin'>('parent')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль')
      showToast('Введите email и пароль', { type: 'error' })
      return
    }

    try {
      setSubmitting(true)

      const data = await login(email.trim(), password, role)

      localStorage.setItem('razvitime_auth', JSON.stringify(data))

      showToast('Вход выполнен', { type: 'success' })

      if (data.user.role === 'parent') {
        navigate('/parent', { replace: true })
        return
      }

      if (data.user.role === 'center_admin') {
        navigate('/center', { replace: true })
        return
      }

      setError('Неизвестная роль пользователя')
      localStorage.removeItem('razvitime_auth')
      showToast('Неизвестная роль пользователя', { type: 'error' })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        showToast(err.message, { type: 'error' })
      } else {
        setError('Неверные данные для входа')
        showToast('Неверные данные для входа', { type: 'error' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <main className="login-page">
        <PageContainer>
          <section className="login-section">
            <div className="login-card">
              <div className="login-header">
                <p className="login-kicker">Вход в систему</p>
                <h1>Добро пожаловать обратно</h1>
                <p>Войдите в аккаунт родителя или детского центра.</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                <label className="login-field">
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="example@mail.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </label>

                <label className="login-field">
                  <span>Пароль</span>
                  <input
                    type="password"
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </label>

                <div className="login-role-tabs">
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

                <button
                  type="submit"
                  className="btn btn-primary login-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Входим...' : 'Войти'}
                </button>

                {error && <p className="login-error">{error}</p>}

                <p className="login-register-link">
                  Нет аккаунта? <Link to="/register">Создать аккаунт</Link>
                </p>
              </form>
            </div>
          </section>
        </PageContainer>
      </main>
    </>
  )
}

export default LoginPage