import { useEffect, useState, useRef } from 'react';
import ETMPanel from '../../components/ETM/ETMPanel';
import { Play, Square, MapPin, Clock, AlertTriangle, Send, RefreshCw, ArrowLeftRight, Users, Navigation } from 'lucide-react';
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
    const [trackingMode, setTrackingMode] = useState('manual');
    const [delayMinutes, setDelayMinutes] = useState('');
    const [delayReason, setDelayReason] = useState('');
    const [reportingDelay, setReportingDelay] = useState(false);
    const [busLoading, setBusLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('trip'); // 'trip' | 'etm'
    const [isReversed, setIsReversed] = useState(false);
    const [routeStages, setRouteStages] = useState([]);

    // FIX: keep a ref to myBus so startLocationSharing closure always has current value
    const myBusRef = useRef(null);
    useEffect(() => { myBusRef.current = myBus; }, [myBus]);

    useEffect(() => {
        fetchMyBus();
    }, []);

    const fetchMyBus = async () => {
        try {
            const response = await api.get('/buses');
            if (response.success) {
                const assignedBus = response.data.buses.find(b => b.driverId?._id === user.id);
                setMyBus(assignedBus || null);
                myBusRef.current = assignedBus || null;
                // FIX: only fetch current trip AFTER we know the bus, passing it directly
                await fetchCurrentTrip(assignedBus);
                // Fetch stages for route direction display
                const routeId = assignedBus?.routeId?._id || assignedBus?.routeId;
                if (routeId) {
                    try {
                        const stagesRes = await api.get(`/stages/${routeId}`);
                        if (stagesRes.success) setRouteStages(stagesRes.data.stages || []);
                    } catch (_) {}
                }
            }
        } catch (error) {
            toast.error('Failed to fetch bus info');
        } finally {
            setBusLoading(false);
        }
    };

    // FIX: accept bus as param so we don't depend on state timing
    const fetchCurrentTrip = async (bus) => {
        try {
            const response = await api.get('/trips/my-current');
            if (response.success && response.data.trip) {
                const trip = response.data.trip;

                // Backend is now fully responsible for stale trip validation and cleanup.
                setCurrentTrip(trip);
                if (bus) startLocationSharing(bus);
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
                routeId: myBus.routeId?._id,
                busId: myBus._id,
                trackingMode
            });

            if (response.success) {
                setCurrentTrip(response.data.trip);
                setMyBus(prev => prev ? { ...prev, status: 'active', isOnTrip: true } : prev);
                toast.success('Trip started!');
                startLocationSharing(myBus);

                // FIX: guard socket connection before emitting
                if (!socket.connected) socket.connect();
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
                const tripId = currentTrip._id;
                const busId = myBus?._id;
                setCurrentTrip(null);
                setMyBus(prev => prev ? { ...prev, status: 'inactive', isOnTrip: false } : prev);
                stopLocationSharing();
                setDelayMinutes('');
                setDelayReason('');

                if (!socket.connected) socket.connect();
                socket.emit('driver:trip-end', { tripId, busId });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to end trip');
        }
    };

    const handleAdvanceStage = async () => {
        if (!currentTrip || !myBus) return;
        
        try {
            const currentIdx = routeStages.findIndex(s => s._id === currentTrip.currentStageId || s.stageName === currentTrip.currentStageName);
            let nextStage = null;

            if (currentIdx === -1) {
                // If not found, assume first stage
                nextStage = routeStages[0];
            } else if (currentIdx < routeStages.length - 1) {
                nextStage = routeStages[currentIdx + 1];
            } else {
                toast.success('Route completed');
                return;
            }

            if (nextStage) {
                const response = await api.post(`/trips/${currentTrip._id}/advance-stage`, {
                    stageId: nextStage._id
                });
                
                if (response.success) {
                    toast.success(`Arrived at ${nextStage.stageName}`);
                    await fetchCurrentTrip(myBus);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to advance stage');
        }
    };

    const handleReportDelay = async (e) => {
        e.preventDefault();
        if (!currentTrip) return;

        const mins = parseInt(delayMinutes, 10);
        if (!mins || mins <= 0) {
            toast.error('Enter a valid delay in minutes');
            return;
        }

        setReportingDelay(true);
        try {
            const response = await api.post(`/trips/${currentTrip._id}/delay`, {
                delayMinutes: mins,
                delayReason: delayReason.trim()
            });

            if (response.success) {
                toast.success(`⚠️ Delay of ${mins} min reported to all passengers!`);
                setDelayMinutes('');
                setDelayReason('');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to report delay');
        } finally {
            setReportingDelay(false);
        }
    };

    // FIX: accept bus as param so this never reads stale null state
    const startLocationSharing = (bus) => {
        if (!bus) {
            toast.error('No bus assigned — cannot share location');
            return;
        }
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            return;
        }

        const id = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;

                if (!socket.connected) socket.connect();
                socket.emit('driver:location-update', {
                    busId: bus._id,
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
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
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
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-white mb-2">Driver Dashboard</h1>
                    <p className="text-gray-300">Manage your trips and share live location</p>
                </div>

                {/* Tab switcher */}
                <div className="flex gap-2 mb-6 bg-white/5 border border-white/10 rounded-xl p-1">
                    {[['trip', 'Trip Control'], ['etm', 'ETM — Issue Tickets']].map(([id, label]) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${activeTab === id ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* ETM Tab */}
                {activeTab === 'etm' && (
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Electronic Ticket Machine</h2>
                        <ETMPanel currentTrip={currentTrip} myBus={myBus} />
                    </div>
                )}

                {/* Bus Info Card */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-white">My Bus</h2>
                        <button
                            onClick={() => { setBusLoading(true); fetchMyBus(); }}
                            title="Refresh bus & trip data"
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                    {busLoading ? (
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            Loading bus info...
                        </div>
                    ) : myBus ? (
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
                                <span className="text-gray-300">Type:</span>
                                <span className="text-white font-semibold">{myBus.busType || 'Ordinary'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Capacity:</span>
                                <span className="text-white font-semibold">{myBus.capacity} seats</span>
                            </div>
                            {currentTrip && (
                                <div className="flex justify-between bg-black/20 p-2 rounded border border-white/5">
                                    <span className="text-gray-300 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Passengers:</span>
                                    {currentTrip.currentPassengers > myBus.capacity ? (
                                        <span className="text-red-400 font-bold">{currentTrip.currentPassengers} / {myBus.capacity} <span className="text-xs font-normal">({currentTrip.currentPassengers - myBus.capacity} standing)</span></span>
                                    ) : (
                                        <span className="text-green-400 font-bold">{currentTrip.currentPassengers} / {myBus.capacity} <span className="text-xs font-normal">({myBus.capacity - currentTrip.currentPassengers} available)</span></span>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-300">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    myBus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                                }`}>
                                    {myBus.status}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-300 text-sm">
                            ⚠️ No bus is assigned to your account. Contact an admin to get assigned to a bus before starting a trip.
                        </div>
                    )}
                </div>

                {/* Trip Control — only shown on trip tab */}
                {activeTab === 'trip' && (<>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Trip Control</h2>

                    {/* Route Direction Display */}
                    {myBus?.routeId && routeStages.length > 0 && (
                        <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-4">
                            {/* Source → Destination header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="flex flex-col items-center">
                                        <span className="inline-block w-3 h-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">From</p>
                                        <p className="text-white font-bold text-sm truncate">
                                            {isReversed
                                                ? routeStages[routeStages.length - 1]?.stageName
                                                : routeStages[0]?.stageName}
                                        </p>
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <button
                                    onClick={() => setIsReversed(v => !v)}
                                    title="Swap direction (return journey)"
                                    className="mx-3 flex-shrink-0 group flex flex-col items-center gap-0.5"
                                >
                                    <span className={`text-[11px] font-mono tracking-tighter transition-all duration-300 ${
                                        isReversed ? 'text-blue-400' : 'text-purple-400'
                                    }`}>
                                        {isReversed ? '←————' : '————→'}
                                    </span>
                                    <div className={`p-1.5 rounded-full border transition-all duration-300 group-hover:scale-110 ${
                                        isReversed
                                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                            : 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                    }`}>
                                        <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </div>
                                    <span className={`text-[11px] font-mono tracking-tighter transition-all duration-300 ${
                                        isReversed ? 'text-purple-400' : 'text-blue-400'
                                    }`}>
                                        {isReversed ? '————→' : '←————'}
                                    </span>
                                </button>

                                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                    <div className="min-w-0 text-right">
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">To</p>
                                        <p className="text-white font-bold text-sm truncate">
                                            {isReversed
                                                ? routeStages[0]?.stageName
                                                : routeStages[routeStages.length - 1]?.stageName}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="inline-block w-3 h-3 rounded-full bg-red-400 shadow-lg shadow-red-400/50"></span>
                                    </div>
                                </div>
                            </div>

                            {/* Stage list */}
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                    {isReversed ? 'Return route' : 'Forward route'} — {routeStages.length} stops
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(isReversed ? [...routeStages].reverse() : routeStages).map((s, i, arr) => (
                                        <div key={s._id} className="flex items-center gap-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                                i === 0
                                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                    : i === arr.length - 1
                                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                    : 'bg-white/5 text-gray-400 border border-white/10'
                                            }`}>{s.stageName}</span>
                                            {i < arr.length - 1 && (
                                                <span className={`text-[10px] font-mono ${
                                                    isReversed ? 'text-blue-500' : 'text-purple-500'
                                                }`}>›</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

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

                            {currentTrip.trackingMode === 'manual' && (
                                <button
                                    onClick={handleAdvanceStage}
                                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition flex items-center justify-center space-x-2"
                                >
                                    <MapPin className="w-5 h-5" />
                                    <span>Arrived at Next Stage</span>
                                </button>
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
                            
                            <div className="bg-black/20 border border-white/5 p-4 rounded-xl">
                                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-purple-400" />
                                    Stage Tracking Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setTrackingMode('manual')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition ${trackingMode === 'manual' ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        Manual (Driver Panel)
                                    </button>
                                    <button 
                                        onClick={() => setTrackingMode('gps')}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition ${trackingMode === 'gps' ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                                    >
                                        Auto (GPS Based)
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                onClick={startTrip}
                                disabled={!myBus || busLoading}
                                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="w-5 h-5" />
                                <span>{busLoading ? 'Loading...' : 'Start Trip'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Report Delay — only visible during an active trip */}
                {currentTrip && (
                    <div className="bg-amber-950/40 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Report Delay</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Alert all passengers instantly about a service delay.</p>

                        <form onSubmit={handleReportDelay} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Delay (minutes)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={delayMinutes}
                                    onChange={(e) => setDelayMinutes(e.target.value)}
                                    placeholder="e.g. 15"
                                    className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Reason <span className="text-gray-500">(optional)</span></label>
                                <input
                                    type="text"
                                    value={delayReason}
                                    onChange={(e) => setDelayReason(e.target.value)}
                                    placeholder="e.g. Heavy traffic, Road block..."
                                    className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 transition"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={reportingDelay}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                <span>{reportingDelay ? 'Sending...' : 'Send Delay Alert'}</span>
                            </button>
                        </form>
                    </div>
                )}
                </>)}

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
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                            <span>Use <strong className="text-amber-300">Report Delay</strong> to instantly alert passengers of any delays</span>
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
