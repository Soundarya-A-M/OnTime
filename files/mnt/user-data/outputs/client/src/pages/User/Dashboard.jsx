import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Ticket, Clock, TrendingUp, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/api';
import toast from 'react-hot-toast';
import ETicket from '../../components/Tickets/ETicket';
import { SkeletonCard, SkeletonTableRow, EmptyState } from '../../components/UI/Skeletons';

const PAGE_SIZE = 5;

const UserDashboard = () => {
    const { user } = useAuthStore();
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingTicket, setViewingTicket] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings/my');
            if (response.success) setAllBookings(response.data.bookings);
        } catch {
            toast.error('Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const filtered = statusFilter === 'all' ? allBookings : allBookings.filter(b => b.status === statusFilter);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (f) => { setStatusFilter(f); setPage(1); };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            {viewingTicket && <ETicket booking={viewingTicket} onClose={() => setViewingTicket(null)} />}

            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-gray-300">Track buses, book tickets, and manage your journeys</p>
                </div>

                {/* Quick Actions — skeleton while loading */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        [1, 2, 3].map(i => <SkeletonCard key={i} />)
                    ) : (
                        [
                            { to: '/track', icon: MapPin, title: 'Track Bus', sub: 'View live bus locations in real-time', grad: 'from-purple-500 to-pink-500' },
                            { to: '/book-ticket', icon: Ticket, title: 'Book Ticket', sub: 'Reserve your seat for upcoming trips', grad: 'from-blue-500 to-cyan-500' },
                            { to: '/track', icon: Clock, title: 'View Schedule', sub: 'Check bus timings and live ETAs', grad: 'from-green-500 to-emerald-500' },
                        ].map(c => (
                            <Link key={c.title} to={c.to}
                                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition group">
                                <div className={`w-14 h-14 bg-gradient-to-br ${c.grad} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                                    <c.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
                                <p className="text-gray-300">{c.sub}</p>
                            </Link>
                        ))
                    )}
                </div>

                {/* Stats row */}
                {!loading && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Total Bookings', value: allBookings.length, color: 'text-white' },
                            { label: 'Confirmed', value: allBookings.filter(b => b.status === 'confirmed').length, color: 'text-green-300' },
                            { label: 'Completed', value: allBookings.filter(b => b.status === 'completed').length, color: 'text-blue-300' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                                <div className="text-gray-400 text-xs mt-1">{label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Booking History */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-white">Booking History</h2>
                            <TrendingUp className="w-6 h-6 text-purple-400" />
                            {!loading && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                    {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                                {['all', 'confirmed', 'completed', 'cancelled'].map(f => (
                                    <button key={f} onClick={() => handleFilterChange(f)}
                                        className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${statusFilter === f ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        // Skeleton rows while loading
                        <div>
                            <table className="w-full">
                                <tbody>
                                    {[1, 2, 3].map(i => <SkeletonTableRow key={i} cols={4} />)}
                                </tbody>
                            </table>
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={Ticket}
                            title={statusFilter === 'all' ? 'No bookings yet' : `No ${statusFilter} bookings`}
                            description={statusFilter === 'all' ? 'Book your first trip and your tickets will appear here.' : `You have no ${statusFilter} bookings right now.`}
                            action={
                                statusFilter === 'all' ? (
                                    <Link to="/book-ticket"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition text-sm font-medium">
                                        <Ticket className="w-4 h-4" /> Book Your First Trip
                                    </Link>
                                ) : null
                            }
                        />
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginated.map(booking => (
                                    <div key={booking._id}
                                        className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    <p className="text-white font-semibold">{booking.busId?.busNumber || 'N/A'}</p>
                                                    <span className="text-gray-500 text-xs font-mono">{booking.ticketId}</span>
                                                </div>
                                                {(booking.fromStop || booking.toStop) && (
                                                    <p className="text-gray-300 text-sm mb-1">
                                                        {booking.fromStop} → {booking.toStop}
                                                    </p>
                                                )}
                                                <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400">
                                                    {booking.seatNumbers?.length > 0 && (
                                                        <span>Seats: {booking.seatNumbers.join(', ')}</span>
                                                    )}
                                                    {booking.amount > 0 && (
                                                        <span className="text-purple-300 font-semibold">₹{booking.amount}</span>
                                                    )}
                                                    <span>
                                                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    {booking.routeId?.routeName && (
                                                        <span className="text-gray-500 truncate max-w-[160px]">{booking.routeId.routeName}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                                    booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                                                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                                <button
                                                    onClick={() => setViewingTicket(booking)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full text-xs font-medium transition whitespace-nowrap"
                                                    title="View e-ticket"
                                                >
                                                    <Eye className="w-3 h-3" /> Ticket
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-sm">
                                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                            <button key={n} onClick={() => setPage(n)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === n ? 'bg-purple-500 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                                {n}
                                            </button>
                                        ))}
                                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
