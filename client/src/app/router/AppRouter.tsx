import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../../pages/HomePage/HomePage'
import LoginPage from '../../pages/LoginPage/LoginPage'
import ParentDashboardPage from '../../pages/ParentDashboardPage/ParentDashboardPage'
import CenterDashboardPage from '../../pages/CenterDashboardPage/CenterDashboardPage'

function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/parent" element={<ParentDashboardPage />} />
                <Route path="/center" element={<CenterDashboardPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRouter