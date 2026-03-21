import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import UserDashboard from './pages/User/Dashboard';
import TrackBus from './pages/User/TrackBus';
import BookTicket from './pages/User/BookTicket';
import DriverDashboard from './pages/Driver/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';
import RouteManagement from './pages/Admin/RouteManagement';
import StageManagement from './pages/Admin/StageManagement';
import BusTypeFareManagement from './pages/Admin/BusTypeFareManagement';
import AddBus from './pages/Admin/AddBus';
import LandingPage from './pages/LandingPage';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { useAuthStore } from './store/authStore';

function App() {
    const { isAuthenticated, user } = useAuthStore();

    const getHomePath = () => {
        if (!isAuthenticated || !user) return '/';
        const dashboardMap = {
            passenger: '/dashboard',
            driver: '/driver/dashboard',
            admin: '/admin/dashboard'
        };
        return dashboardMap[user.role] || '/';
    };

    return (
        <BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                }}
            />

            <Navbar />

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to={getHomePath()} /> : <Login />} />
                <Route path="/register" element={isAuthenticated ? <Navigate to={getHomePath()} /> : <Register />} />

                {/* Profile — any authenticated user */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* User Routes */}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['passenger']}><UserDashboard /></ProtectedRoute>} />
                <Route path="/track" element={<ProtectedRoute><TrackBus /></ProtectedRoute>} />
                <Route path="/book-ticket" element={<ProtectedRoute allowedRoles={['passenger']}><BookTicket /></ProtectedRoute>} />

                {/* Driver Routes */}
                <Route path="/driver/dashboard" element={<ProtectedRoute allowedRoles={['driver']}><DriverDashboard /></ProtectedRoute>} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/routes" element={<ProtectedRoute allowedRoles={['admin']}><RouteManagement /></ProtectedRoute>} />
                <Route path="/admin/stages" element={<ProtectedRoute allowedRoles={['admin']}><StageManagement /></ProtectedRoute>} />
                <Route path="/admin/bus-fares" element={<ProtectedRoute allowedRoles={['admin']}><BusTypeFareManagement /></ProtectedRoute>} />
                <Route path="/admin/add-bus" element={<ProtectedRoute allowedRoles={['admin']}><AddBus /></ProtectedRoute>} />

                {/* FIX #1: proper 404 instead of silent redirect */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
