import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../../utils/auth'
import './Header.css'

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
    <>
      <aside className="side-menu">
        <img
          src="/logo.png"
          alt="Логотип РазвиТайм"
          className="side-menu-bg-logo"
        />
        <nav className="side-menu-links">
          <a href="/">Главная</a>
          <a href="/#about">О платформе</a>
          <a href="/#guide">Инструкция</a>
          <a href="/#stats">Статистика</a>
          <a href="/#reviews">Отзывы</a>
          <a href="/#partners">Центры</a>
          <a href="/#support">Поддержка</a>

          {auth && <Link to={dashboardPath}>Личный кабинет</Link>}
        </nav>
      </aside>

      <header className="app-header">
        <div className="container app-header-inner">
          <Link to="/" className="header-logo-link">
            <div className="header-logo-block">
              <img src="/logo.png" alt="Логотип РазвиТайм" className="header-logo-image" />

              <div className="header-logo-texts">
                <div className="header-logo-title">РазвиТайм</div>
                <div className="header-logo-subtitle">
                  платформа детских развивающих центров
                </div>
              </div>
            </div>
          </Link>

          <div className="nav-auth">
            {!auth ? (
              <>
                {!isLoginPage && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLoginClick}
                  >
                    Вход
                  </button>
                )}

                <Link to="/register" className="btn btn-primary btn-sm">
                  Создать аккаунт
                </Link>
              </>
            ) : (
              <>
                <span className="header-user-name">{userName}</span>

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
    </>
  )
}

export default Header