import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div className="logo-block">
          <div className="logo-texts">
            <div className="logo-text-main">РазвиТайм</div>
            <div className="logo-text-sub">
              онлайн-помощник для родителей и детских центров
            </div>
          </div>
        </div>

        <nav className="nav-links">
          <Link to="/">Главная</Link>
          <Link to="/search">Найти занятия</Link>
        </nav>

        <div className="nav-auth">
          <Link to="/login" className="btn btn-secondary btn-sm">
            Войти
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            Создать аккаунт
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header