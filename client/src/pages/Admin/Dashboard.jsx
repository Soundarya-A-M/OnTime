import { useEffect, useState } from 'react';
import { Bus, Route, Users, Activity, Map, MapPin, DollarSign, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalBuses: 0,
        activeBuses: 0,
        totalRoutes: 0,
        activeTrips: 0
    });
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busSearch, setBusSearch] = useState('');
    const [routeSearch, setRouteSearch] = useState('');
    const [activeModal, setActiveModal] = useState(null); // 'activeBuses' | 'activeTrips' | null

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [busesRes, routesRes, tripsRes] = await Promise.all([
                api.get('/buses'),
                api.get('/routes'),
                api.get('/trips/active')
            ]);

            if (busesRes.success) {
                setBuses(busesRes.data.buses);
                setStats(prev => ({
                    ...prev,
                    totalBuses: busesRes.data.count,
                    activeBuses: busesRes.data.buses.filter(b => b.status === 'active').length
                }));
            }

            if (routesRes.success) {
                setRoutes(routesRes.data.routes);
                setStats(prev => ({ ...prev, totalRoutes: routesRes.data.count }));
            }

            if (tripsRes.success) {
                setStats(prev => ({ ...prev, activeTrips: tripsRes.data.count }));
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Manage buses, routes, and monitor operations</p>
                </div>

                {/* Quick Access Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    <Link to="/admin/add-bus" className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6 hover:from-indigo-500/30 hover:to-purple-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Add Bus</h3>
                        <p className="text-indigo-300 text-sm mt-1">Register new bus & crew</p>
                    </Link>
                    <Link to="/admin/routes" className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 hover:from-blue-500/30 hover:to-cyan-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Route Management</h3>
                        <p className="text-blue-300 text-sm mt-1">Create routes with Leaflet map & OSRM</p>
                    </Link>
                    <Link to="/admin/stages" className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 hover:from-purple-500/30 hover:to-pink-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Stage Editor</h3>
                        <p className="text-purple-300 text-sm mt-1">Pin bus stops with distance calculation</p>
                    </Link>
                    <Link to="/admin/bus-fares" className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 hover:from-green-500/30 hover:to-emerald-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Bus Type Fares</h3>
                        <p className="text-green-300 text-sm mt-1">Configure price per KM per type</p>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: Bus, label: 'Total Buses', value: stats.totalBuses, gradient: 'from-purple-500 to-pink-500', onClick: null },
                        { 
                            icon: Activity, 
                            label: 'Active Buses', 
                            value: stats.activeBuses, 
                            gradient: `from-green-500 to-emerald-500 cursor-pointer hover:scale-105 transition-all text-left`, 
                            onClick: () => setActiveModal('activeBuses') 
                        },
                        { icon: Route, label: 'Total Routes', value: stats.totalRoutes, gradient: 'from-blue-500 to-cyan-500', onClick: null },
                        { 
                            icon: Users, 
                            label: 'Active Trips', 
                            value: stats.activeTrips, 
                            gradient: `from-orange-500 to-red-500 cursor-pointer hover:scale-105 transition-all text-left`, 
                            onClick: () => setActiveModal('activeTrips') 
                        }
                    ].map((stat, idx) => {
                        const CardWrapper = stat.onClick ? 'button' : 'div';
                        return (
                            <CardWrapper 
                                key={idx} 
                                onClick={stat.onClick}
                                className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 ${stat.onClick ? 'hover:bg-white/20 transition-colors w-full text-left' : ''}`}
                            >
                                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient.replace(/cursor-.*|hover:.*|transition-.*|text-left.*/g, '')} rounded-lg flex items-center justify-center mb-4`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-gray-300 text-sm">{stat.label}</p>
                                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                            </CardWrapper>
                        );
                    })}
                </div>

                {/* Buses Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-white">Buses</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search buses..."
                                value={busSearch}
                                onChange={(e) => setBusSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="text-gray-300">Loading...</div>
                    ) : buses.length === 0 ? (
                        <div className="text-gray-300">No buses found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Bus Number</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Route</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Driver</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buses
                                        .filter(bus => 
                                            bus.busNumber?.toLowerCase().includes(busSearch.toLowerCase()) ||
                                            bus.routeId?.routeName?.toLowerCase().includes(busSearch.toLowerCase()) ||
                                            bus.driverId?.name?.toLowerCase().includes(busSearch.toLowerCase()) ||
                                            bus.status?.toLowerCase().includes(busSearch.toLowerCase())
                                        )
                                        .map((bus) => (
                                        <tr key={bus._id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-white font-medium">{bus.busNumber}</td>
                                            <td className="py-3 px-4 text-gray-300">{bus.routeId?.routeName || 'Not assigned'}</td>
                                            <td className="py-3 px-4 text-gray-300">{bus.driverId?.name || 'Not assigned'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                                        bus.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {bus.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Routes Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold text-white">Routes</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search routes..."
                                value={routeSearch}
                                onChange={(e) => setRouteSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                            />
                        </div>
                    </div>
                    {routes.length === 0 ? (
                        <div className="text-gray-300">No routes found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Route Number</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Route Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Stops</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Distance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes
                                        .filter(route => 
                                            route.routeNumber?.toLowerCase().includes(routeSearch.toLowerCase()) ||
                                            route.routeName?.toLowerCase().includes(routeSearch.toLowerCase())
                                        )
                                        .map((route) => (
                                        <tr key={route._id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-white font-medium">{route.routeNumber}</td>
                                            <td className="py-3 px-4 text-gray-300">{route.routeName}</td>
                                            <td className="py-3 px-4 text-gray-300">{route.stops?.length || 0} stops</td>
                                            <td className="py-3 px-4 text-gray-300">{route.distance} km</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Overlay */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden shadow-purple-900/50">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                {activeModal === 'activeBuses' && <><Activity className="w-6 h-6 text-emerald-400" /> Active Buses ({stats.activeBuses})</>}
                                {activeModal === 'activeTrips' && <><Users className="w-6 h-6 text-orange-400" /> Active Trips ({stats.activeTrips})</>}
                            </h2>
                            <button 
                                onClick={() => setActiveModal(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {activeModal === 'activeBuses' && (
                                <div className="space-y-4">
                                    {buses.filter(b => b.status === 'active').length === 0 ? (
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
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeModal === 'activeTrips' && (
                                <div className="space-y-4">
                                    <p className="text-gray-400 text-center py-8">
                                        Active Trips feature is currently mapping directly to the number of ongoing tracked journeys. 
                                        Detailed lists for strictly Active Trips can be added as the Trips API matures.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
