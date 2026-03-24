import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'

function ParentDashboardPage() {
  const authRaw = localStorage.getItem('razvitime_auth')
  const auth = authRaw ? JSON.parse(authRaw) : null

  return (
    <>
      <Header />
      <main>
        <section className="section">
          <PageContainer>
            <h1 className="section-title">Кабинет родителя</h1>
            <p className="section-subtitle">
              Добро пожаловать{auth?.user?.name ? `, ${auth.user.name}` : ''}.
            </p>
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default ParentDashboardPage