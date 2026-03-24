import Header from '../../components/layout/Header/Header'
import PageContainer from '../../components/layout/PageContainer/PageContainer'

function CenterDashboardPage() {
  const authRaw = localStorage.getItem('razvitime_auth')
  const auth = authRaw ? JSON.parse(authRaw) : null

  return (
    <>
      <Header />
      <main>
        <section className="section">
          <PageContainer>
            <h1 className="section-title">Кабинет детского центра</h1>
            <p className="section-subtitle">
              Добро пожаловать{auth?.user?.name ? `, ${auth.user.name}` : ''}.
            </p>
          </PageContainer>
        </section>
      </main>
    </>
  )
}

export default CenterDashboardPage