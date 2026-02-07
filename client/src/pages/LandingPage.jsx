import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Search, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const LandingPage=() => {
    const { isAuthenticated }=useAuthStore();
    const navigate=useNavigate();
    const [fromPlace, setFromPlace]=useState('');
    const [toPlace, setToPlace]=useState('');
    const [selectedDate, setSelectedDate]=useState(new Date());
    const [showRoutes, setShowRoutes]=useState(false);
    const [routes, setRoutes]=useState([]);

    // Sample route data (will be replaced with API call)
    const availableRoutes=[
        {
            busNumber: 'TN-01-A123',
            from: 'mysore',
            to: 'chennai',
            route: 'Mysore → Salem → Chennai',
            time: '06:30 AM',
            status: 'On Time'
        },
        {
            busNumber: 'KA-09-B456',
            from: 'mysore',
            to: 'ooty',
            route: 'Mysore → Gundlupet → Ooty',
            time: '09:15 AM',
            status: 'Delayed'
        },
        {
            busNumber: 'KA-05-C789',
            from: 'bangalore',
            to: 'mysore',
            route: 'Bangalore → Mandya → Mysore',
            time: '07:00 AM',
            status: 'On Time'
        }
    ];

    // Generate next 5 days for date selector
    const getNextDays=() => {
        const days=[];
        for (let i=0; i < 5; i++) {
            const date=new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const handleSearch=() => {
        if (!isAuthenticated) {
            toast.error('Please login to search routes');
            navigate('/login');
            return;
        }

        if (!fromPlace.trim()) {
            toast.error('Please enter starting location');
            return;
        }

        const from=fromPlace.trim().toLowerCase();
        const to=toPlace.trim().toLowerCase();

        const results=availableRoutes.filter(r => {
            if (!to) {
                return r.from === from;
            }
            return r.from === from && r.to.includes(to);
        });

        if (results.length === 0) {
            toast.error('No routes found');
            setShowRoutes(false);
        } else {
            setRoutes(results);
            setShowRoutes(true);
            toast.success(`Found ${results.length} route(s)`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Hero Section with Bus Image */}
            <section className="relative pt-16">
                <div className="relative w-full h-64 md:h-96 overflow-hidden">
                    <img
                        src="/bus-hero.jpeg"
                        alt="Bus"
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">
                            Where Is My Bus?
                        </h1>
                    </div>
                </div>
            </section>

            {/* Search Section */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
                        <h2 className="text-3xl font-bold text-white text-center mb-2">
                            Your Bus is On Time
                        </h2>
                        <p className="text-gray-300 text-center mb-8">
                            Enter route to get live updates
                        </p>

                        {/* Route Search */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-6">
                            <input
                                type="text"
                                placeholder="From"
                                value={fromPlace}
                                onChange={(e) => setFromPlace(e.target.value)}
                                className="w-full md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-white text-2xl hidden md:block">→</span>
                            <input
                                type="text"
                                placeholder="To"
                                value={toPlace}
                                onChange={(e) => setToPlace(e.target.value)}
                                className="w-full md:w-64 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSearch}
                                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition flex items-center justify-center space-x-2"
                            >
                                <Search className="w-5 h-5" />
                                <span>Search</span>
                            </button>
                        </div>

                        {/* Date Selector */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <p className="text-gray-400 text-sm">Date of Departure</p>
                                        <p className="text-white font-semibold">
                                            {selectedDate.toDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {getNextDays().map((date, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 px-6 py-3 rounded-lg border transition ${selectedDate.toDateString() === date.toDateString()
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{date.getDate()}</div>
                                            <div className="text-xs">
                                                {index === 0
                                                    ? 'TODAY'
                                                    : date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Routes Table */}
                        {showRoutes && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-white">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Bus No</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">From</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">To</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Route</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Time</th>
                                            <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {routes.map((route, index) => (
                                            <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="py-3 px-4 font-medium">{route.busNumber}</td>
                                                <td className="py-3 px-4">{route.from.toUpperCase()}</td>
                                                <td className="py-3 px-4">{route.to.toUpperCase()}</td>
                                                <td className="py-3 px-4">{route.route}</td>
                                                <td className="py-3 px-4">{route.time}</td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${route.status === 'On Time'
                                                                ? 'bg-green-500/20 text-green-300'
                                                                : 'bg-yellow-500/20 text-yellow-300'
                                                            }`}
                                                    >
                                                        {route.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">
                        Why Choose <span className="text-blue-400">OnTime</span>?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: MapPin,
                                title: 'Live GPS Tracking',
                                description: 'Track buses in real-time with accurate GPS location updates.',
                                gradient: 'from-blue-500 to-cyan-500'
                            },
                            {
                                icon: Clock,
                                title: 'Accurate ETA',
                                description: 'Get precise arrival time predictions based on real-time data.',
                                gradient: 'from-purple-500 to-pink-500'
                            },
                            {
                                icon: Search,
                                title: 'Easy Route Search',
                                description: 'Find your bus routes quickly and book tickets instantly.',
                                gradient: 'from-green-500 to-emerald-500'
                            }
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition transform hover:scale-105"
                            >
                                <div
                                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6`}
                                >
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-300">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Promo Section */}
            <section className="py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <img
                        src="/bus-offer.jpeg"
                        alt="Bus Ticket Booking Offer"
                        className="w-full rounded-2xl shadow-2xl"
                    />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-white/10 rounded-3xl p-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Commute?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of commuters who never miss their bus with OnTime.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-10 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-lg rounded-lg hover:from-blue-600 hover:to-cyan-600 transition transform hover:scale-105 shadow-2xl"
                    >
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
                    <p className="text-gray-400 text-sm">
                        © 2026 OnTime Bus Tracking & Booking. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
