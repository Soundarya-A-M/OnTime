import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Search, Calendar, Loader2, Bus, Zap, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../config/api';

const LandingPage = () => {
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [fromPlace, setFromPlace] = useState('');
    const [toPlace, setToPlace] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showRoutes, setShowRoutes] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        api.get('/routes').then(res => {
            if (res.success) setAllRoutes(res.data.routes);
        }).catch(() => {});
    }, []);

    const getNextDays = () => {
        const days = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const handleSearch = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to search routes');
            navigate('/login');
            return;
        }
        if (!fromPlace.trim()) { toast.error('Please enter starting location'); return; }

        setSearching(true);
        try {
            const from = fromPlace.trim().toLowerCase();
            const to = toPlace.trim().toLowerCase();

            const results = allRoutes.filter(route => {
                const sourceName = (route.sourceCity || route.routeName || '').toLowerCase();
                const destName = (route.destinationCity || route.routeName || '').toLowerCase();
                const routeName = (route.routeName || '').toLowerCase();
                const matchFrom = sourceName.includes(from) || routeName.includes(from);
                const matchTo = !to || destName.includes(to) || routeName.includes(to);
                return matchFrom && matchTo;
            });

            const enriched = await Promise.all(results.map(async (route) => {
                try {
                    const busRes = await api.get(`/buses?routeId=${route._id}&status=active`);
                    const activeBuses = busRes.success ? busRes.data.buses : [];
                    return { ...route, activeBuses, hasLiveTrip: activeBuses.some(b => b.isOnTrip) };
                } catch {
                    return { ...route, activeBuses: [], hasLiveTrip: false };
                }
            }));

            if (enriched.length === 0) {
                toast.error('No routes found for this search');
                setShowRoutes(false);
            } else {
                setRoutes(enriched);
                setShowRoutes(true);
                toast.success(`Found ${enriched.length} route(s)`);
            }
        } catch {
            toast.error('Search failed. Please try again.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Hero — FIX #4: CSS gradient instead of broken image references */}
            <section className="relative pt-16">
                <div className="relative w-full h-64 md:h-96 overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-purple-900">
                    {/* Decorative background elements */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                        {/* Animated road lines */}
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute bottom-8 left-0 right-0 flex gap-8 justify-center opacity-20">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="w-12 h-1.5 bg-white rounded-full" />
                            ))}
                        </div>
                    </div>

                    {/* Hero bus icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <Bus className="w-64 h-64 text-white" />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">Where Is My Bus?</h1>
                        <p className="text-blue-300 mt-2 text-lg font-medium">Live GPS tracking across Karnataka</p>
                    </div>
                </div>
            </section>

            {/* Search */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-white text-center mb-2">Your Bus is On Time</h2>
                        <p className="text-gray-300 text-center mb-8">Search live routes powered by real-time data</p>

                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
                            <input type="text" placeholder="From (city or stop)" value={fromPlace}
                                onChange={(e) => setFromPlace(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <span className="text-white text-2xl hidden md:block">→</span>
                            <input type="text" placeholder="To (optional)" value={toPlace}
                                onChange={(e) => setToPlace(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={handleSearch} disabled={searching}
                                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition flex items-center justify-center gap-2 disabled:opacity-70">
                                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {/* Date Selector */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-6 h-6 text-blue-400" />
                                <div>
                                    <p className="text-gray-400 text-sm">Date of Departure</p>
                                    <p className="text-white font-semibold">{selectedDate.toDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {getNextDays().map((date, index) => (
                                    <button key={index} onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 px-6 py-3 rounded-lg border transition ${selectedDate.toDateString() === date.toDateString() ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}`}>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{date.getDate()}</div>
                                            <div className="text-xs">{index === 0 ? 'TODAY' : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results */}
                        {showRoutes && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-white text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Route #</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Route Name</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Distance</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Active Buses</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map((route, index) => (
                                            <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-3 font-mono text-purple-300">{route.routeNumber}</td>
                                                <td className="py-3 px-3">{route.routeName}</td>
                                                <td className="py-3 px-3 text-gray-300">{route.distance ? `${route.distance} km` : '-'}</td>
                                                <td className="py-3 px-3 text-gray-300">{route.activeBuses?.length || 0}</td>
                                                <td className="py-3 px-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${route.hasLiveTrip ? 'bg-green-500/20 text-green-300' : route.activeBuses?.length > 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                                        {route.hasLiveTrip ? '🟢 Live' : route.activeBuses?.length > 0 ? 'Scheduled' : 'No buses'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-gray-400 text-xs mt-3 text-center">
                                    {routes.length} route(s) found. <Link to="/track" className="text-blue-400 underline">Track live buses →</Link>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">Why Choose <span className="text-blue-400">OnTime</span>?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: MapPin, title: 'Live GPS Tracking', description: 'Track buses in real-time with accurate GPS updates every 3–5 seconds.', gradient: 'from-blue-500 to-cyan-500' },
                            { icon: Zap, title: 'Accurate ETA', description: 'Dynamic arrival time calculation based on live speed and GPS data.', gradient: 'from-purple-500 to-pink-500' },
                            { icon: Shield, title: 'Secure Booking', description: 'Book tickets with e-ticket generation and QR code verification.', gradient: 'from-green-500 to-emerald-500' },
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition transform hover:scale-105">
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-300">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats band — replaces the broken promo image */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 rounded-2xl p-8 grid grid-cols-3 gap-4 text-center">
                        {[
                            { value: '50+', label: 'Routes Covered' },
                            { value: '200+', label: 'Buses Tracked' },
                            { value: '99.9%', label: 'Uptime' },
                        ].map(({ value, label }) => (
                            <div key={label}>
                                <div className="text-4xl font-black text-white mb-1">{value}</div>
                                <div className="text-blue-300 text-sm font-medium">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-white/10 rounded-3xl p-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Commute?</h2>
                    <p className="text-xl text-gray-300 mb-8">Join thousands of commuters who never miss their bus with OnTime.</p>
                    <Link to="/register" className="inline-block px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg rounded-lg hover:from-blue-600 hover:to-cyan-600 transition transform hover:scale-105 shadow-2xl">
                        Get Started for Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-blue-900/50 backdrop-blur-lg border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-300 mb-4">
                        <Link to="#" className="hover:text-white transition mx-2">About</Link> |
                        <Link to="#" className="hover:text-white transition mx-2">Contact</Link> |
                        <Link to="#" className="hover:text-white transition mx-2">Help</Link>
                    </p>
                    <p className="text-gray-400 text-sm">© 2026 OnTime Bus Tracking & Booking. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
