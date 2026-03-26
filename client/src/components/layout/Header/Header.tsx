import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../../utils/auth'

function Header() {
  const auth = getAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isLoginPage = location.pathname === '/login'
  const userRole = auth?.user?.role

  const userName =
    auth?.user?.name ||
    auth?.user?.parent_name ||
    auth?.user?.center_name ||
    'Пользователь'

  const dashboardPath =
    userRole === 'parent'
      ? '/parent'
      : userRole === 'center_admin'
        ? '/center'
        : '/'

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  function handleLoginClick() {
    navigate('/login')
  }

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
          {auth && <Link to={dashboardPath}>Личный кабинет</Link>}
        </nav>

        <div className="nav-auth">
          {!auth ? (
            <>
              {!isLoginPage && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleLoginClick}
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

              <Link to={dashboardPath} className="btn btn-primary btn-sm">
                Кабинет
              </Link>

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