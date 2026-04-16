import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../../pages/HomePage/HomePage'
import LoginPage from '../../pages/LoginPage/LoginPage'
import ParentDashboardPage from '../../pages/ParentDashboardPage/ParentDashboardPage'
import CenterDashboardPage from '../../pages/CenterDashboardPage/CenterDashboardPage'
import ActivityPage from '../../pages/ActivityPage/ActivityPage'
import PublicCenterPage from '../../pages/PublicCenterPage/PublicCenterPage'
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute'
import ToastProvider from '../../components/ui/ToastProvider/ToastProvider'

function AppRouter() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/centers/:id" element={<PublicCenterPage />} />
          <Route path="/activity/:id" element={<ActivityPage />} />

          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRole="parent">
                <ParentDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/center"
            element={
              <ProtectedRoute allowedRole="center_admin">
                <CenterDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default AppRouter