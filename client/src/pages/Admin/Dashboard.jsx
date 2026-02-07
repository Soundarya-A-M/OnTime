import { useEffect, useState } from 'react';
import { Bus, Route, Users, Activity } from 'lucide-react';
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

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: Bus, label: 'Total Buses', value: stats.totalBuses, gradient: 'from-purple-500 to-pink-500' },
                        { icon: Activity, label: 'Active Buses', value: stats.activeBuses, gradient: 'from-green-500 to-emerald-500' },
                        { icon: Route, label: 'Total Routes', value: stats.totalRoutes, gradient: 'from-blue-500 to-cyan-500' },
                        { icon: Users, label: 'Active Trips', value: stats.activeTrips, gradient: 'from-orange-500 to-red-500' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center mb-4`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-gray-300 text-sm">{stat.label}</p>
                            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Buses Table */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Buses</h2>
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
                                    {buses.map((bus) => (
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
                    <h2 className="text-2xl font-bold text-white mb-6">Routes</h2>
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
                                    {routes.map((route) => (
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
        </div>
    );
};

export default AdminDashboard;
