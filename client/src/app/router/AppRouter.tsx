import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../../pages/HomePage/HomePage'
import LoginPage from '../../pages/LoginPage/LoginPage'
import ParentDashboardPage from '../../pages/ParentDashboardPage/ParentDashboardPage'
import CenterDashboardPage from '../../pages/CenterDashboardPage/CenterDashboardPage'
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute'

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
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
        </BrowserRouter>
    )
}

export default AppRouter