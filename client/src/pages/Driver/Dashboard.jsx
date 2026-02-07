import { useEffect, useState } from 'react';
import { Play, Square, MapPin, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import socket from '../../config/socket';
import api from '../../config/api';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
    const { user } = useAuthStore();
    const [currentTrip, setCurrentTrip] = useState(null);
    const [myBus, setMyBus] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [watchId, setWatchId] = useState(null);

    useEffect(() => {
        fetchMyBus();
        fetchCurrentTrip();
    }, []);

    const fetchMyBus = async () => {
        try {
            const response = await api.get('/buses');
            if (response.success) {
                const assignedBus = response.data.buses.find(b => b.driverId?._id === user.id);
                setMyBus(assignedBus);
            }
        } catch (error) {
            toast.error('Failed to fetch bus info');
        }
    };

    const fetchCurrentTrip = async () => {
        try {
            const response = await api.get('/trips/my-current');
            if (response.success && response.data.trip) {
                setCurrentTrip(response.data.trip);
                startLocationSharing();
            }
        } catch (error) {
            console.error('Failed to fetch current trip');
        }
    };

    const startTrip = async () => {
        if (!myBus) {
            toast.error('No bus assigned to you');
            return;
        }

        try {
            const response = await api.post('/trips/start', {
                routeId: myBus.routeId?._id
            });

            if (response.success) {
                setCurrentTrip(response.data.trip);
                toast.success('Trip started!');
                startLocationSharing();

                // Emit trip start event
                socket.emit('driver:trip-start', {
                    tripId: response.data.trip._id,
                    busId: myBus._id
                });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to start trip');
        }
    };

    const endTrip = async () => {
        if (!currentTrip) return;

        try {
            const response = await api.put(`/trips/${currentTrip._id}/end`);

            if (response.success) {
                toast.success('Trip ended!');
                setCurrentTrip(null);
                stopLocationSharing();

                // Emit trip end event
                socket.emit('driver:trip-end', {
                    tripId: currentTrip._id,
                    busId: myBus._id
                });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to end trip');
        }
    };

    const startLocationSharing = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;

                // Emit location update
                socket.emit('driver:location-update', {
                    busId: myBus._id,
                    lat: latitude,
                    lng: longitude,
                    speed: speed || 0
                });

                setIsSharing(true);
            },
            (error) => {
                console.error('Geolocation error:', error);
                toast.error('Failed to get location');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        setWatchId(id);
    };

    const stopLocationSharing = () => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
            setIsSharing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Driver Dashboard</h1>
                    <p className="text-gray-300">Manage your trips and share live location</p>
                </div>

                {/* Bus Info Card */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">My Bus</h2>
                    {myBus ? (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Bus Number:</span>
                                <span className="text-white font-semibold">{myBus.busNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Route:</span>
                                <span className="text-white font-semibold">{myBus.routeId?.routeName || 'Not assigned'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Capacity:</span>
                                <span className="text-white font-semibold">{myBus.capacity} seats</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${myBus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                                    }`}>
                                    {myBus.status}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400">No bus assigned</p>
                    )}
                </div>

                {/* Trip Control */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Trip Control</h2>

                    {currentTrip ? (
                        <div className="space-y-4">
                            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-green-300 font-semibold">Trip Active</span>
                                </div>
                                <p className="text-gray-300 text-sm">Started: {new Date(currentTrip.startTime).toLocaleString()}</p>
                            </div>

                            {isSharing && (
                                <div className="flex items-center space-x-2 text-blue-300">
                                    <MapPin className="w-5 h-5 animate-pulse" />
                                    <span>Sharing live location...</span>
                                </div>
                            )}

                            <button
                                onClick={endTrip}
                                className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition flex items-center justify-center space-x-2"
                            >
                                <Square className="w-5 h-5" />
                                <span>End Trip</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-400">No active trip</p>
                            <button
                                onClick={startTrip}
                                disabled={!myBus}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="w-5 h-5" />
                                <span>Start Trip</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                        <li className="flex items-start space-x-2">
                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Start your trip when you begin your route</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>Your location will be shared automatically with passengers</span>
                        </li>
                        <li className="flex items-start space-x-2">
                            <Square className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>End the trip when you complete your route</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
