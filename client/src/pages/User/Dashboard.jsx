import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Ticket, Clock, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/api';
import toast from 'react-hot-toast';

const UserDashboard = () => {
    const { user } = useAuthStore();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings/my');
            if (response.success) {
                setBookings(response.data.bookings.slice(0, 5)); // Show latest 5
            }
        } catch (error) {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-gray-300">Track buses, book tickets, and manage your journeys</p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Link
                        to="/track"
                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition group"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <MapPin className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Track Bus</h3>
                        <p className="text-gray-300">View live bus locations in real-time</p>
                    </Link>

                    <Link
                        to="/book-ticket"
                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition group"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Ticket className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Book Ticket</h3>
                        <p className="text-gray-300">Reserve your seat for upcoming trips</p>
                    </Link>

                    <Link
                        to="/track"
                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition group"
                    >
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <Clock className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">View Schedule</h3>
                        <p className="text-gray-300">Check bus timings and routes</p>
                    </Link>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Recent Bookings</h2>
                        <TrendingUp className="w-6 h-6 text-purple-400" />
                    </div>

                    {loading ? (
                        <div className="text-gray-300">Loading...</div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-8">
                            <Ticket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">No bookings yet</p>
                            <Link
                                to="/track"
                                className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                            >
                                Book Your First Trip
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div
                                    key={booking._id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-white font-semibold">
                                                {booking.busId?.busNumber || 'N/A'}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                Seat: {booking.seatNumber}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed'
                                                ? 'bg-green-500/20 text-green-300'
                                                : booking.status === 'pending'
                                                    ? 'bg-yellow-500/20 text-yellow-300'
                                                    : 'bg-red-500/20 text-red-300'
                                                }`}
                                        >
                                            {booking.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        {new Date(booking.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
