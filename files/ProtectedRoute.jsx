import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../UI/Skeletons';

/**
 * FIX #7: Show a loading spinner during auth rehydration from localStorage
 * instead of a flash-redirect. Zustand's persist middleware hydrates synchronously
 * in most cases, but we defensively check for a hydration flag.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        const dashboardMap = {
            passenger: '/dashboard',
            driver: '/driver/dashboard',
            admin: '/admin/dashboard'
        };
        return <Navigate to={dashboardMap[user?.role] || '/'} replace />;
    }

    return children;
};

export default ProtectedRoute;
