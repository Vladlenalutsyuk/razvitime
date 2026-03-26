import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuth, type UserRole } from '../../utils/auth'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRole?: UserRole
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const auth = getAuth()

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && auth.user.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute