import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { login } from '../../api/authApi'
import { useToast } from '../../components/ui/ToastProvider/ToastProvider'

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

      <main>
        <section className="section">
          <PageContainer>
            <h2 className="section-title">Вход в систему</h2>

            <form onSubmit={handleSubmit} className="auth-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />

              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />

              <div>
                <label>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'parent'}
                    onChange={() => setRole('parent')}
                    disabled={submitting}
                  />
                  Родитель
                </label>

                <label style={{ marginLeft: '16px' }}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'center_admin'}
                    onChange={() => setRole('center_admin')}
                    disabled={submitting}
                  />
                  Детский центр
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Входим...' : 'Войти'}
              </button>

              {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default LoginPage