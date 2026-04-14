import { useEffect, useState } from 'react';
import { Bus, Route, Users, Activity, Map, MapPin, DollarSign, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
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

    // Edit Bus State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [currentEditBus, setCurrentEditBus] = useState(null);
    const [editForm, setEditForm] = useState({ routeId: '', driverId: '', capacity: 40, status: 'active', busType: 'Ordinary' });
    const [drivers, setDrivers] = useState([]);
    const [busTypes, setBusTypes] = useState(['Ordinary', 'Express', 'AC']);
    const [savingBus, setSavingBus] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [busesResult, routesResult, tripsResult] = await Promise.allSettled([
                api.get('/buses'),
                api.get('/routes'),
                api.get('/trips/active')
            ]);

            if (busesResult.status === 'fulfilled' && busesResult.value.success) {
                const busesRes = busesResult.value;
                setBuses(busesRes.data.buses);
                setStats(prev => ({
                    ...prev,
                    totalBuses: busesRes.data.count,
                    activeBuses: busesRes.data.buses.filter(b => b.status === 'active').length
                }));
            } else if (busesResult.status === 'rejected') {
                console.warn('Buses fetch failed:', busesResult.reason);
            }

            if (routesResult.status === 'fulfilled' && routesResult.value.success) {
                const routesRes = routesResult.value;
                setRoutes(routesRes.data.routes);
                setStats(prev => ({ ...prev, totalRoutes: routesRes.data.count }));
            } else if (routesResult.status === 'rejected') {
                console.warn('Routes fetch failed:', routesResult.reason);
            }

            if (tripsResult.status === 'fulfilled' && tripsResult.value.success) {
                setStats(prev => ({ ...prev, activeTrips: tripsResult.value.data.count }));
            } else if (tripsResult.status === 'rejected') {
                console.warn('Trips fetch failed:', tripsResult.reason);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const openEditBus = async (bus) => {
        setCurrentEditBus(bus);
        setEditForm({
            routeId: bus.routeId?._id || '',
            driverId: bus.driverId?._id || '',
            capacity: bus.capacity || 40,
            status: bus.status || 'active',
            busType: bus.busType || 'Ordinary'
        });
        setEditModalOpen(true);
        if (drivers.length === 0) {
            try {
                const [driversRes, busTypesRes] = await Promise.all([
                    api.get('/auth/users?role=driver'),
                    api.get('/bus-types')
                ]);
                if (driversRes.success) setDrivers(driversRes.data.users);
                if (busTypesRes.success && busTypesRes.data.fares.length > 0) {
                    setBusTypes([...new Set(busTypesRes.data.fares.map(f => f.busType))]);
                }
            } catch (error) {
                console.error("Failed to load edit dependencies", error);
            }
        }
    };

    const handleSaveBusEdit = async (e) => {
        e.preventDefault();
        setSavingBus(true);
        try {
            const res = await api.put(`/buses/${currentEditBus._id}`, {
               routeId: editForm.routeId || null,
               capacity: editForm.capacity,
               status: editForm.status,
               busType: editForm.busType
            });
            if (res.success) {
                const currentDriverId = currentEditBus.driverId?._id || currentEditBus.driverId || '';
                const newDriverId = editForm.driverId;
                if (currentDriverId !== newDriverId) {
                   await api.put(`/buses/${currentEditBus._id}/driver`, { driverId: newDriverId || null });
                }
                toast.success('Bus updated successfully');
                setEditModalOpen(false);
                fetchData();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update bus');
        } finally {
            setSavingBus(false);
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
                <div className="grid md:grid-cols-5 gap-4 mb-8">
                    <Link to="/admin/add-bus" className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6 hover:from-indigo-500/30 hover:to-purple-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <Bus className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Add Bus</h3>
                        <p className="text-indigo-300 text-sm mt-1">Register new bus</p>
                    </Link>
                    <Link to="/admin/crew" className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6 hover:from-amber-500/30 hover:to-orange-500/30 transition group">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Crew</h3>
                        <p className="text-amber-300 text-sm mt-1">Manage drivers & crew</p>
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
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Current Stage</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
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
                                            <td className="py-3 px-4 text-gray-300">{bus.currentTripId?.currentStageName || '—'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                                        bus.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {bus.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button onClick={() => openEditBus(bus)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition" title="Edit Bus">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
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
                                            <td className="py-3 px-4 text-gray-300">{route.stageCount !== undefined ? route.stageCount : (route.stops?.length || 0)} stops</td>
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
                                                        {bus.currentTripId?.currentStageName && (
                                                            <span className="block"><strong className="text-gray-300">Stage:</strong> {bus.currentTripId.currentStageName}</span>
                                                        )}
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

            {/* Edit Bus Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white">Edit Bus {currentEditBus?.busNumber}</h2>
                            <button 
                                onClick={() => setEditModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveBusEdit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Route</label>
                                    <select
                                        value={editForm.routeId}
                                        onChange={(e) => setEditForm({ ...editForm, routeId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="" className="bg-slate-800">Unassigned</option>
                                        {routes.map(r => (
                                            <option key={r._id} value={r._id} className="bg-slate-800">{r.routeName} ({r.routeNumber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Driver</label>
                                    <select
                                        value={editForm.driverId}
                                        onChange={(e) => setEditForm({ ...editForm, driverId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="" className="bg-slate-800">Unassigned</option>
                                        {drivers.map(d => (
                                            <option key={d._id} value={d._id} className="bg-slate-800">{d.name} ({d.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="active" className="bg-slate-800">Active</option>
                                        <option value="inactive" className="bg-slate-800">Inactive</option>
                                        <option value="maintenance" className="bg-slate-800">Maintenance</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Bus Type</label>
                                    <select
                                        value={editForm.busType}
                                        onChange={(e) => setEditForm({ ...editForm, busType: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    >
                                        {busTypes.map(t => (
                                            <option key={t} value={t} className="bg-slate-800">{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editForm.capacity}
                                        onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditModalOpen(false)}
                                        className="px-4 py-2 text-gray-300 hover:text-white transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={savingBus}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
                                    >
                                        {savingBus ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
