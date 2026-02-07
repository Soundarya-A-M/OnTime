import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        // Redirect to appropriate dashboard based on role
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
