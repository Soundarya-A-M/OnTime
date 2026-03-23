import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, LogOut, User, Menu, X, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationBell from '../Notifications/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, clearAll, removeNotification } = useNotifications();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setMobileOpen(false);
        navigate('/login');
    };

    const getDashboardLink = () => {
        if (!user) return '/';
        return { passenger: '/dashboard', driver: '/driver/dashboard', admin: '/admin/dashboard' }[user.role] || '/';
    };

    const navLinks = isAuthenticated ? [
        { to: getDashboardLink(), label: 'Dashboard' },
        { to: '/track', label: 'Track Bus' },
        ...(user?.role === 'passenger' ? [{ to: '/book-ticket', label: 'Book Ticket' }] : []),
        ...(user?.role === 'admin' ? [
            { to: '/admin/routes', label: 'Routes' },
            { to: '/admin/add-bus', label: 'Add Bus' },
            { to: '/admin/crew', label: 'Crew' },
        ] : []),
    ] : [];

    return (
        <nav className="fixed w-full bg-black/20 backdrop-blur-lg border-b border-white/10 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 flex-shrink-0" onClick={() => setMobileOpen(false)}>
                        <MapPin className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold text-white">OnTime</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.map(link => (
                            <Link key={link.to + link.label} to={link.to}
                                className="text-gray-300 hover:text-white transition text-sm">
                                {link.label}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 text-gray-300">
                                    <User className="w-5 h-5" />
                                    <span className="text-sm max-w-[100px] truncate">{user?.name}</span>
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full capitalize">
                                        {user?.role}
                                    </span>
                                </div>
                                <NotificationBell notifications={notifications} unreadCount={unreadCount}
                                    markAllRead={markAllRead} clearAll={clearAll} removeNotification={removeNotification} />
                                {/* FIX #5: Profile link */}
                                <Link to="/profile"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                                    title="Profile & Settings">
                                    <Settings className="w-4 h-4" />
                                </Link>
                                <button onClick={handleLogout}
                                    className="flex items-center space-x-1 px-4 py-2 text-white hover:text-red-300 transition text-sm">
                                    <LogOut className="w-4 h-4" /><span>Logout</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link to="/login" className="px-4 py-2 text-white hover:text-purple-300 transition text-sm">Login</Link>
                                <Link to="/register"
                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105 text-sm">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile right side */}
                    <div className="flex md:hidden items-center gap-2">
                        {isAuthenticated && (
                            <NotificationBell notifications={notifications} unreadCount={unreadCount}
                                markAllRead={markAllRead} clearAll={clearAll} removeNotification={removeNotification} />
                        )}
                        <button onClick={() => setMobileOpen(o => !o)}
                            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden bg-black/40 backdrop-blur-xl border-t border-white/10">
                    <div className="px-4 pt-3 pb-5 space-y-1">
                        {navLinks.map(link => (
                            <Link key={link.to + link.label} to={link.to} onClick={() => setMobileOpen(false)}
                                className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                                {link.label}
                            </Link>
                        ))}

                        {isAuthenticated ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 border-t border-white/10 mt-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-white text-sm font-medium">{user?.name}</p>
                                        <p className="text-purple-300 text-xs capitalize">{user?.role}</p>
                                    </div>
                                </div>
                                {/* FIX #5: Profile link in mobile */}
                                <Link to="/profile" onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:bg-white/5 rounded-lg transition text-sm">
                                    <Settings className="w-4 h-4" /> Profile & Settings
                                </Link>
                                <button onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/5 rounded-lg transition text-sm">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </>
                        ) : (
                            <div className="border-t border-white/10 pt-3 mt-2 space-y-2">
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-center font-medium">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
