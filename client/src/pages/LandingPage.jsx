import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Search, Calendar, Loader2, Zap, Shield, ChevronDown, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../config/api';

// ─── Stage Dropdown Component ─────────────────────────────────────────────────
const StageDropdown = ({ id, placeholder, value, onChange, options, disabled }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Sync query with external value changes
    useEffect(() => { if (!open) setQuery(value); }, [value, open]);

    const filtered = options.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 60); // cap at 60 for performance

    const handleSelect = (name) => {
        onChange(name);
        setQuery(name);
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        if (!disabled) {
            setQuery('');
            setOpen(true);
        }
    };

    return (
        <div ref={ref} className="relative w-full md:w-64" id={id}>
            <div className={`flex items-center bg-white/5 border ${open ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-white/10'} rounded-lg overflow-hidden transition-all duration-200`}>
                <MapPin className="w-4 h-4 text-blue-400 ml-3 flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={disabled ? 'Select From first' : placeholder}
                    value={open ? query : value}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={handleFocus}
                    disabled={disabled}
                    className="flex-1 px-3 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {value ? (
                    <button onClick={handleClear} className="p-2 text-gray-400 hover:text-white transition">
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <ChevronDown className={`w-4 h-4 text-gray-400 mr-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                )}
            </div>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-800/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-in">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                            {options.length === 0 ? 'No stages available' : 'No matches found'}
                        </div>
                    ) : (
                        <div className="max-h-60 overflow-y-auto custom-scroll">
                            {filtered.map((name, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={() => handleSelect(name)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-blue-500/20 transition flex items-center gap-2 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition" />
                                    {name}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-500">
                        {filtered.length} stop{filtered.length !== 1 ? 's' : ''} {options.length > 60 && filtered.length === 60 ? '(showing top 60)' : ''}
                    </div>
                </div>
            )}
        </div>
    );
};

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

    // ── Derive all unique stop names from embedded route stops ────────────────
    const fromOptions = useMemo(() => {
        const names = new Set();
        allRoutes.forEach(route => {
            (route.stops || []).forEach(s => { if (s.name) names.add(s.name); });
        });
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [allRoutes]);

    // ── "To" options: stops in routes that pass through the selected "From" ───
    const toOptions = useMemo(() => {
        if (!fromPlace) return [];
        const names = new Set();
        allRoutes.forEach(route => {
            const stops = route.stops || [];
            const hasFrom = stops.some(s => s.name?.toLowerCase() === fromPlace.toLowerCase());
            if (hasFrom) {
                stops.forEach(s => { if (s.name && s.name.toLowerCase() !== fromPlace.toLowerCase()) names.add(s.name); });
            }
        });
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [allRoutes, fromPlace]);

    // Reset 'To' when 'From' changes
    const handleFromChange = (val) => {
        setFromPlace(val);
        if (toPlace) setToPlace('');
        setShowRoutes(false);
    };

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
        if (!fromPlace.trim()) { toast.error('Please select a starting stop'); return; }

        setSearching(true);
        try {
            const from = fromPlace.trim().toLowerCase();
            const to = toPlace.trim().toLowerCase();

            // Match routes whose stops[] contain the selected From (and optionally To)
            const results = allRoutes.filter(route => {
                const stops = (route.stops || []).map(s => (s.name || '').toLowerCase());
                const routeName = (route.routeName || '').toLowerCase();
                const matchFrom = stops.some(s => s.includes(from)) || routeName.includes(from);
                const matchTo = !to || stops.some(s => s.includes(to)) || routeName.includes(to);
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
            {/* Hero — using bus-hero.jpeg from public folder */}
            <section className="relative pt-16">
                <div className="relative w-full h-64 md:h-96 overflow-hidden">
                    {/* Hero background image */}
                    <img
                        src="/bus-hero.jpeg"
                        alt="Bus hero"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
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
                            <StageDropdown
                                id="from-stop-dropdown"
                                placeholder="From — select a stop"
                                value={fromPlace}
                                onChange={handleFromChange}
                                options={fromOptions}
                            />
                            <span className="text-white text-2xl hidden md:block font-thin opacity-60">→</span>
                            <StageDropdown
                                id="to-stop-dropdown"
                                placeholder="To — select a stop"
                                value={toPlace}
                                onChange={(val) => { setToPlace(val); setShowRoutes(false); }}
                                options={toOptions}
                                disabled={!fromPlace}
                            />
                            <button onClick={handleSearch} disabled={searching}
                                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition flex items-center justify-center gap-2 disabled:opacity-70">
                                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                {searching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {/* Helper hint for unauthenticated users */}
                        {!isAuthenticated && (fromPlace || toPlace) && (
                            <p className="text-center text-sm text-blue-300/70 -mt-2 mb-4">
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <Link to="/login" className="underline hover:text-blue-300 transition">Log in</Link> to search and view available buses
                                </span>
                            </p>
                        )}

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
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Buses</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Status</th>
                                            <th className="text-left py-3 px-3 text-gray-300 font-medium">Action</th>
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
                                                <td className="py-3 px-3">
                                                    {isAuthenticated ? (
                                                        <Link
                                                            to={`/book?routeId=${route._id}`}
                                                            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-lg hover:from-blue-600 hover:to-cyan-600 transition font-medium"
                                                        >
                                                            Book Now
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to="/login"
                                                            className="px-3 py-1.5 bg-white/10 border border-white/20 text-white text-xs rounded-lg hover:bg-white/20 transition font-medium"
                                                        >
                                                            Login to Book
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                                    <p className="text-gray-400 text-xs">{routes.length} route(s) found</p>
                                    <div className="flex gap-3">
                                        <Link to="/track" className="text-blue-400 underline text-xs hover:text-blue-300 transition">Track live buses →</Link>
                                        {!isAuthenticated && (
                                            <Link to="/login" className="text-cyan-400 underline text-xs hover:text-cyan-300 transition">Login to book tickets →</Link>
                                        )}
                                    </div>
                                </div>
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
