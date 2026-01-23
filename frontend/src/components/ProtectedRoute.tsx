import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: Role | Role[];
  redirectTo?: string;
};

const normalizeRoles = (input?: Role | Role[]): Role[] | undefined => {
  if (!input) {
    return undefined;
  }
  return Array.isArray(input) ? input : [input];
};

export function ProtectedRoute({ allowedRoles, redirectTo = '/app/overview' }: ProtectedRouteProps = {}) {
  const { user, isAuthenticating, hasRole } = useAuth();
  const normalizedRoles = normalizeRoles(allowedRoles);

  if (isAuthenticating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-blue-500 border-r-transparent"></div>
          <span className="block text-white/80 animate-pulse text-lg font-semibold">Cargando DataPulse…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (normalizedRoles && !hasRole(normalizedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
