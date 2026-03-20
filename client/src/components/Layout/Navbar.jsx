import { Link, useNavigate } from 'react-router-dom';
import { MapPin, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../Notifications/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, clearAll, removeNotification } = useNotifications();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        const dashboardMap = {
            passenger: '/dashboard',
            driver: '/driver/dashboard',
            admin: '/admin/dashboard'
        };
        return dashboardMap[user.role] || '/';
    };

    return (
        <nav className="fixed w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center space-x-2">
                        <MapPin className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold text-white">OnTime</span>
                    </Link>

                    {isAuthenticated ? (
                        <div className="flex items-center space-x-6">
                            <Link
                                to={getDashboardLink()}
                                className="text-gray-300 hover:text-white transition"
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/track"
                                className="text-gray-300 hover:text-white transition"
                            >
                                Track Bus
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 text-gray-300">
                                    <User className="w-5 h-5" />
                                    <span>{user?.name}</span>
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        {user?.role}
                                    </span>
                                </div>
                                <NotificationBell
                                    notifications={notifications}
                                    unreadCount={unreadCount}
                                    markAllRead={markAllRead}
                                    clearAll={clearAll}
                                    removeNotification={removeNotification}
                                />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-1 px-4 py-2 text-white hover:text-red-300 transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex space-x-4">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-white hover:text-purple-300 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105"
                            >
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
