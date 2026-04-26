import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearAuth, getAuth } from '../../../utils/auth'

function Header() {
  const auth = getAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.hash])

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
        <Link to="/" className="logo-link">
          <div className="logo-block">
            <img src="/logo.png" alt="Логотип РазвиТайм" className="logo-image" />

            <div className="logo-texts">
              <div className="logo-text-main">РазвиТайм</div>
              <div className="logo-text-sub">
                онлайн-помощник для родителей и детских центров
              </div>
            </div>
          </div>
        </Link>

        <button
          type="button"
          className={`header-burger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Открыть меню"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`header-right ${menuOpen ? 'open' : ''}`}>
          <nav className="nav-links nav-links-home">
            <a href="/">Главная</a>
            <a href="/#about">О платформе</a>
            <a href="/#guide">Инструкция</a>
            <a href="/#stats">Статистика</a>
            <a href="/#reviews">Отзывы</a>
            <a href="/#partners">Центры</a>
            <a href="/#support">Поддержка</a>

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
      </div>
    </header>
  )
}

export default Header