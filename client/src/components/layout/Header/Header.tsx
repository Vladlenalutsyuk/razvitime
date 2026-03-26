import { clearAuth, getAuth } from '../../../utils/auth'
import { Link, useLocation } from 'react-router-dom'

function Header() {
  const auth = getAuth()

  function handleLogout() {
    clearAuth()
    window.location.href = '/login'
  }

  const userName =
    auth?.user?.name ||
    auth?.user?.parent_name ||
    auth?.user?.center_name ||
    'Пользователь'
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div className="logo-block">
          <Link
            to="/"
            className="logo-texts"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="logo-text-main">РазвиТайм</div>
            <div className="logo-text-sub">
              онлайн-помощник для родителей и детских центров
            </div>
          </Link>
        </div>

        <nav className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/search">Найти занятия</Link>
        </nav>

        <div className="nav-auth">
          {!auth ? (
            <>
              {!isLoginPage && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    window.location.href = '/login'
                  }}
                >
                  Войти
                </button>
              )}

              <Link to="/login" className="btn btn-primary btn-sm">
                Создать аккаунт
              </Link>
            </>
          ) : (
            <>
              <span style={{ marginRight: '12px' }}>{userName}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header