import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '../lib/mockDb';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { currentUser, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser) {
    // Has auth but no user document yet (probably currently registering)
    return <Navigate to="/register" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(appUser.role)) {
    if (appUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/nasabah" replace />;
    }
  }

  if (!appUser.isActive) {
    // Return to login with unapproved or revoked state
    return <Navigate to="/login?reason=revoked" replace />;
  }

  return <Outlet />;
}
