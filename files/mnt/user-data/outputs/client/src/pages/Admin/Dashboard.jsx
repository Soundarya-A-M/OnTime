import { useEffect, useState } from 'react';
import { Bus, Users, Activity, Map, MapPin, DollarSign, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';
import socket from '../../config/socket';

const BUS_PAGE_SIZE = 10;
const ROUTE_PAGE_SIZE = 10;

const StatCard = ({ icon: Icon, label, value, gradient, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 ${onClick ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''}`}
    >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${gradient}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {onClick && <p className="text-xs text-gray-500 mt-1">Click to view details</p>}
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalBuses: 0, activeBuses: 0, totalRoutes: 0, activeTrips: 0 });
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busSearch, setBusSearch] = useState('');
    const [routeSearch, setRouteSearch] = useState('');
    const [activeModal, setActiveModal] = useState(null);
    const [busPage, setBusPage] = useState(1);
    const [routePage, setRoutePage] = useState(1);

    // FIX #23: socket disconnect toast
    useEffect(() => {
        const handleDisconnect = () => {
            toast.error('Lost connection to server. Tracking may be delayed.', { id: 'socket-disconnect', duration: 5000 });
        };
        const handleReconnect = () => {
            toast.success('Reconnected to server.', { id: 'socket-reconnect', duration: 3000 });
        };
        socket.on('disconnect', handleDisconnect);
        socket.on('connect', handleReconnect);
        return () => {
            socket.off('disconnect', handleDisconnect);
            socket.off('connect', handleReconnect);
        };
    }, []);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [busesResult, routesResult, tripsResult] = await Promise.allSettled([
                api.get('/buses'),
                api.get('/routes'),
                api.get('/trips/active')
            ]);

            if (busesResult.status === 'fulfilled' && busesResult.value.success) {
                const b = busesResult.value.data.buses;
                setBuses(b);
                setStats(prev => ({ ...prev, totalBuses: busesResult.value.data.count, activeBuses: b.filter(x => x.status === 'active').length }));
            }
            if (routesResult.status === 'fulfilled' && routesResult.value.success) {
                setRoutes(routesResult.value.data.routes);
                setStats(prev => ({ ...prev, totalRoutes: routesResult.value.data.count }));
            }
            if (tripsResult.status === 'fulfilled' && tripsResult.value.success) {
                setStats(prev => ({ ...prev, activeTrips: tripsResult.value.data.count }));
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // Filtered + paginated data
    const filteredBuses = buses.filter(bus =>
        bus.busNumber?.toLowerCase().includes(busSearch.toLowerCase()) ||
        bus.routeId?.routeName?.toLowerCase().includes(busSearch.toLowerCase()) ||
        bus.driverId?.name?.toLowerCase().includes(busSearch.toLowerCase()) ||
        bus.status?.toLowerCase().includes(busSearch.toLowerCase())
    );
    const filteredRoutes = routes.filter(route =>
        route.routeNumber?.toLowerCase().includes(routeSearch.toLowerCase()) ||
        route.routeName?.toLowerCase().includes(routeSearch.toLowerCase())
    );

    const busTotalPages = Math.max(1, Math.ceil(filteredBuses.length / BUS_PAGE_SIZE));
    const routeTotalPages = Math.max(1, Math.ceil(filteredRoutes.length / ROUTE_PAGE_SIZE));
    const paginatedBuses = filteredBuses.slice((busPage - 1) * BUS_PAGE_SIZE, busPage * BUS_PAGE_SIZE);
    const paginatedRoutes = filteredRoutes.slice((routePage - 1) * ROUTE_PAGE_SIZE, routePage * ROUTE_PAGE_SIZE);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Manage buses, routes, and monitor operations</p>
                </div>

                {/* Quick Access Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    {[
                        { to: '/admin/add-bus', icon: Bus, title: 'Add Bus', sub: 'Register new bus & crew', from: 'from-indigo-500', to2: 'to-purple-500', border: 'border-indigo-500/30', text: 'text-indigo-300', bg: 'from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30' },
                        { to: '/admin/routes', icon: Map, title: 'Route Management', sub: 'Create routes with map', from: 'from-blue-500', to2: 'to-cyan-500', border: 'border-blue-500/30', text: 'text-blue-300', bg: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30' },
                        { to: '/admin/stages', icon: MapPin, title: 'Stage Editor', sub: 'Pin bus stops on map', from: 'from-purple-500', to2: 'to-pink-500', border: 'border-purple-500/30', text: 'text-purple-300', bg: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30' },
                        { to: '/admin/bus-fares', icon: DollarSign, title: 'Bus Type Fares', sub: 'Configure price per KM', from: 'from-green-500', to2: 'to-emerald-500', border: 'border-green-500/30', text: 'text-green-300', bg: 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30' },
                    ].map(c => (
                        <Link key={c.to} to={c.to} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-6 transition group`}>
                            <div className={`w-12 h-12 bg-gradient-to-br ${c.from} ${c.to2} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                                <c.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-white font-bold text-lg">{c.title}</h3>
                            <p className={`${c.text} text-sm mt-1`}>{c.sub}</p>
                        </Link>
                    ))}
                </div>

                {/* FIX: clean stat cards — no class string hacks */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <StatCard icon={Bus} label="Total Buses" value={stats.totalBuses} gradient="from-purple-500 to-pink-500" />
                    <StatCard icon={Activity} label="Active Buses" value={stats.activeBuses} gradient="from-green-500 to-emerald-500" onClick={() => setActiveModal('activeBuses')} />
                    <StatCard icon={Map} label="Total Routes" value={stats.totalRoutes} gradient="from-blue-500 to-cyan-500" />
                    <StatCard icon={Users} label="Active Trips" value={stats.activeTrips} gradient="from-orange-500 to-red-500" onClick={() => setActiveModal('activeTrips')} />
                </div>

                {/* Buses Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-white">Buses <span className="text-gray-500 text-lg font-normal">({filteredBuses.length})</span></h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search buses..." value={busSearch}
                                onChange={(e) => { setBusSearch(e.target.value); setBusPage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> Loading...
                        </div>
                    ) : paginatedBuses.length === 0 ? (
                        <div className="text-gray-400 py-8 text-center">No buses found</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Bus Number</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Route</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Driver</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedBuses.map(bus => (
                                            <tr key={bus._id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4 text-white font-medium">{bus.busNumber}</td>
                                                <td className="py-3 px-4 text-gray-300">{bus.routeId?.routeName || 'Not assigned'}</td>
                                                <td className="py-3 px-4 text-gray-300">{bus.driverId?.name || 'Not assigned'}</td>
                                                <td className="py-3 px-4 text-gray-400 text-sm">{bus.busType || 'Ordinary'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        bus.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                                        bus.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        'bg-gray-500/20 text-gray-300'}`}>
                                                        {bus.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {busTotalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                    <span className="text-gray-400 text-sm">Page {busPage} of {busTotalPages}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setBusPage(p => Math.max(1, p - 1))} disabled={busPage === 1}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setBusPage(p => Math.min(busTotalPages, p + 1))} disabled={busPage === busTotalPages}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Routes Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-white">Routes <span className="text-gray-500 text-lg font-normal">({filteredRoutes.length})</span></h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search routes..." value={routeSearch}
                                onChange={(e) => { setRouteSearch(e.target.value); setRoutePage(1); }}
                                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm" />
                        </div>
                    </div>
                    {paginatedRoutes.length === 0 ? (
                        <div className="text-gray-400 py-8 text-center">No routes found</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Route Number</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Route Name</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">From → To</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Distance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRoutes.map(route => (
                                            <tr key={route._id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4 text-purple-300 font-mono text-sm">{route.routeNumber}</td>
                                                <td className="py-3 px-4 text-white font-medium">{route.routeName}</td>
                                                <td className="py-3 px-4 text-gray-400 text-sm">{route.sourceCity || '—'} → {route.destinationCity || '—'}</td>
                                                <td className="py-3 px-4 text-gray-300">{route.distance ? `${route.distance} km` : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {routeTotalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                    <span className="text-gray-400 text-sm">Page {routePage} of {routeTotalPages}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setRoutePage(p => Math.max(1, p - 1))} disabled={routePage === 1}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setRoutePage(p => Math.min(routeTotalPages, p + 1))} disabled={routePage === routeTotalPages}
                                            className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 transition">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {activeModal === 'activeBuses' && <><Activity className="w-6 h-6 text-emerald-400" /> Active Buses ({stats.activeBuses})</>}
                                {activeModal === 'activeTrips' && <><Users className="w-6 h-6 text-orange-400" /> Active Trips ({stats.activeTrips})</>}
                            </h2>
                            <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {activeModal === 'activeBuses' && (
                                buses.filter(b => b.status === 'active').length === 0 ? (
                                    <p className="text-gray-400 text-center py-8">No active buses at the moment.</p>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {buses.filter(b => b.status === 'active').map(bus => (
                                            <div key={bus._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-lg text-white">{bus.busNumber}</span>
                                                    <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">{bus.status}</span>
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    <span className="block"><strong className="text-gray-300">Route:</strong> {bus.routeId?.routeName || 'Unassigned'}</span>
                                                    <span className="block"><strong className="text-gray-300">Driver:</strong> {bus.driverId?.name || 'Unassigned'}</span>
                                                    <span className="block"><strong className="text-gray-300">Type:</strong> {bus.busType || 'Ordinary'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                            {activeModal === 'activeTrips' && (
                                <p className="text-gray-400 text-center py-8">
                                    {stats.activeTrips > 0
                                        ? `${stats.activeTrips} trip${stats.activeTrips > 1 ? 's' : ''} currently in progress. Visit the Track Bus page to see live locations.`
                                        : 'No active trips at the moment.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
