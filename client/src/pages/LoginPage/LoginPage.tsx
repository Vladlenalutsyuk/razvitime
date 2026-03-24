import { useState } from 'react'
import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'
import { login } from '../../api/authApi'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'parent' | 'center_admin'>('parent')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

console.log('LOGIN SUBMIT:', { email, password, role })

    try {
      const data = await login(email, password, role)

      console.log('USER:', data)

      localStorage.setItem('razvitime_auth', JSON.stringify(data))

      if (data.user.role === 'parent') {
        window.location.href = '/parent'
      } else {
        window.location.href = '/center'
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Неверные данные для входа')
      }
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
              />

              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div>
                <label>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'parent'}
                    onChange={() => setRole('parent')}
                  />
                  Родитель
                </label>

                <label style={{ marginLeft: '16px' }}>
                  <input
                    type="radio"
                    name="role"
                    checked={role === 'center_admin'}
                    onChange={() => setRole('center_admin')}
                  />
                  Детский центр
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                Войти
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