import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Map, Users, ArrowLeft, Save, Search, CheckCircle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const AddBus = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [busNumPart1, setBusNumPart1] = useState(''); // E.g., 09
    const [busNumPart2, setBusNumPart2] = useState(''); // E.g., 7777
    const [routeId, setRouteId] = useState('');
    const [busType, setBusType] = useState('Ordinary');
    const [capacity, setCapacity] = useState(40);
    const [selectedDriver, setSelectedDriver] = useState(null);

    // Data State
    const [routes, setRoutes] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [busTypes, setBusTypes] = useState(['Ordinary', 'Express', 'AC']);
    const [searchDriver, setSearchDriver] = useState('');
    const [searchRoute, setSearchRoute] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [routesResult, driversResult, busTypesResult, busesResult] = await Promise.allSettled([
                api.get('/routes'),
                api.get('/auth/users?role=driver'),
                api.get('/bus-types'),
                api.get('/buses')
            ]);

            if (routesResult.status === 'fulfilled' && routesResult.value.success) {
                setRoutes(routesResult.value.data.routes);
            }
            if (driversResult.status === 'fulfilled' && driversResult.value.success) {
                let allDrivers = driversResult.value.data.users;
                
                // Exclude drivers who are already assigned to another bus
                if (busesResult.status === 'fulfilled' && busesResult.value.success) {
                    const activeDriverIds = busesResult.value.data.buses
                        .filter(b => b.driverId)
                        .map(b => b.driverId._id || b.driverId);
                    allDrivers = allDrivers.filter(d => !activeDriverIds.includes(d._id));
                }
                setDrivers(allDrivers);
            }
            if (busTypesResult.status === 'fulfilled' && busTypesResult.value.success && busTypesResult.value.data.fares.length > 0) {
                const uniqueTypes = [...new Set(busTypesResult.value.data.fares.map(f => f.busType))];
                setBusTypes(uniqueTypes);
                setBusType(uniqueTypes[0]);
            }
        } catch (error) {
            toast.error('Failed to load initial data');
        }
    };

    const filteredDrivers = drivers.filter(d => 
        (d.name?.toLowerCase().includes(searchDriver.toLowerCase()) || 
        d.email?.toLowerCase().includes(searchDriver.toLowerCase()))
    );

    const filteredRoutes = routes.filter(r => 
        (r.routeName && r.routeName.toLowerCase().includes(searchRoute.toLowerCase())) ||
        (r.routeNumber && r.routeNumber.toLowerCase().includes(searchRoute.toLowerCase()))
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!busNumPart1 || !busNumPart2) {
            return toast.error('Please complete the bus number');
        }

        const formattedBusNumber = `KA ${busNumPart1.toUpperCase().trim()} F ${busNumPart2.toUpperCase().trim()}`;
        
        try {
            setLoading(true);
            const response = await api.post('/buses', {
                busNumber: formattedBusNumber,
                routeId: selectedRoute?._id || null,
                driverId: selectedDriver?._id || null,
                busType,
                capacity
            });

            if (response.success) {
                toast.success('Bus created successfully!');
                navigate('/admin/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create bus');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center text-gray-300 hover:text-white mb-6 transition"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Add New Bus</h1>
                    <p className="text-gray-300 mb-8">Register a new bus to the fleet and assign a crew member</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bus Number Section */}
                        <div className="bg-black/20 p-6 rounded-xl border border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                                <Bus className="w-4 h-4 mr-2 text-purple-400" />
                                Bus Number Frame
                            </label>
                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <div className="bg-gray-800 text-white font-bold px-4 py-3 rounded-lg border border-gray-600 shadow-inner">
                                    KA
                                </div>
                                <input
                                    type="text"
                                    maxLength="2"
                                    value={busNumPart1}
                                    onChange={(e) => setBusNumPart1(e.target.value)}
                                        className="w-16 sm:w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-center font-bold focus:outline-none focus:border-purple-500 transition"
                                    required
                                />
                                <div className="bg-gray-800 text-white font-bold px-4 py-3 rounded-lg border border-gray-600 shadow-inner">
                                    F
                                </div>
                                <input
                                    type="text"
                                    maxLength="4"
                                    value={busNumPart2}
                                    onChange={(e) => setBusNumPart2(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-center font-bold focus:outline-none focus:border-purple-500 transition"
                                    required
                                />
                            </div>
                        </div>

                        {/* Bus Details */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Bus Type</label>
                                <select
                                    value={busType}
                                    onChange={(e) => setBusType(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition appearance-none"
                                >
                                    {busTypes.map(type => (
                                        <option key={type} value={type} className="bg-slate-800">{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Capacity (Seats)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                                    required
                                />
                            </div>
                        </div>

                        {/* Route / Destination Selection */}
                        <div className="bg-black/20 p-6 rounded-xl border border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                                <Map className="w-4 h-4 mr-2 text-blue-400" />
                                Assign Destination (Route)
                            </label>

                            {selectedRoute ? (
                                <div className="flex items-center justify-between bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                                    <div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 text-blue-400 mr-2" />
                                            <span className="text-white font-medium">{selectedRoute.routeNumber}</span>
                                        </div>
                                        <p className="text-sm text-blue-300 mt-1 ml-7">{selectedRoute.routeName}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRoute(null)}
                                        className="text-sm text-red-400 hover:text-red-300 transition px-3 py-1 rounded-lg bg-red-400/10 hover:bg-red-400/20"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchRoute}
                                            onChange={(e) => setSearchRoute(e.target.value)}
                                            placeholder="Search route by number or name..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {filteredRoutes.length === 0 ? (
                                            <div className="text-gray-400 text-sm py-2 text-center">No routes found</div>
                                        ) : (
                                            filteredRoutes.map(route => (
                                                <div
                                                    key={route._id}
                                                    onClick={() => setSelectedRoute(route)}
                                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer transition border border-transparent hover:border-white/10"
                                                >
                                                    <div>
                                                        <div className="text-white font-medium">{route.routeNumber}</div>
                                                        <div className="text-gray-400 text-sm">{route.routeName}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Crew / Driver Assignment */}
                        <div className="bg-black/20 p-6 rounded-xl border border-white/10">
                            <label className="block text-sm font-medium text-gray-300 mb-4 flex items-center">
                                <Users className="w-4 h-4 mr-2 text-green-400" />
                                Assign Crew Member (Driver)
                            </label>
                            
                            {selectedDriver ? (
                                <div className="flex items-center justify-between bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                                    <div>
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                                            <span className="text-white font-medium">{selectedDriver.name}</span>
                                        </div>
                                        <p className="text-sm text-green-300 mt-1 ml-7">{selectedDriver.email}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDriver(null)}
                                        className="text-sm text-red-400 hover:text-red-300 transition px-3 py-1 rounded-lg bg-red-400/10 hover:bg-red-400/20"
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchDriver}
                                            onChange={(e) => setSearchDriver(e.target.value)}
                                            placeholder="Search driver by name or email..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-green-500 transition"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {filteredDrivers.length === 0 ? (
                                            <div className="text-gray-400 text-sm py-2 text-center">No drivers found</div>
                                        ) : (
                                            filteredDrivers.map(driver => (
                                                <div
                                                    key={driver._id}
                                                    onClick={() => setSelectedDriver(driver)}
                                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 cursor-pointer transition border border-transparent hover:border-white/10"
                                                >
                                                    <div>
                                                        <div className="text-white font-medium">{driver.name}</div>
                                                        <div className="text-gray-400 text-sm">{driver.email}</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="text-green-400 hover:text-green-300 text-sm font-medium"
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center py-4 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Bus...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Save className="w-5 h-5 mr-2" />
                                        Add Bus
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Minimal inline styles for scrollbar customization to keep it clean */}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
            `}} />
        </div>
    );
};

export default AddBus;
