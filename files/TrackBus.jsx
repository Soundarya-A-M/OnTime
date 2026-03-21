import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Bus, Navigation, Clock, Zap, Menu, X, WifiOff } from 'lucide-react';
import L from 'leaflet';
import socket from '../../config/socket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import DelayBanner from '../../components/Notifications/DelayBanner';
import { calculateETA } from '../../utils/etaCalculator';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImJ1c0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOGI1Y2Y2O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzM4ODBmZjtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTTEyIDJDOCAyIDQgNCA0IDh2OGgydjJhMiAyIDAgMCAwIDIgMmgxYTIgMiAwIDAgMCAyLTJ2LTFoMnYxYTIgMiAwIDAgMCAyIDJoMWEyIDIgMCAwIDAgMi0ydi0yaDJWOEMyMCA0IDE2IDIgMTIgMm0tNiA2aDEydjRINlY4bTIgNmEyIDIgMCAwIDEgMiAyIDIgMiAwIDAgMS0yIDIgMiAyIDAgMCAxLTItMiAyIDIgMCAwIDEgMi0ybTggMGEyIDIgMCAwIDEgMiAyIDIgMiAwIDAgMS0yIDIgMiAyIDAgMCAxLTItMiAyIDIgMCAwIDEgMi0yWiIgZmlsbD0idXJsKCNidXNHcmFkaWVudCkiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=',
    iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40]
});

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.5 });
    }, [center, zoom, map]);
    return null;
}

const parsePolyline = (polylineStr) => {
    if (!polylineStr) return [];
    try {
        const geojson = JSON.parse(polylineStr);
        if (geojson.coordinates) return geojson.coordinates.map(([lng, lat]) => [lat, lng]);
    } catch { }
    return [];
};

const TrackBus = () => {
    const [center, setCenter] = useState([12.9716, 77.5946]);
    const [zoom, setZoom] = useState(13);
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [delayInfo, setDelayInfo] = useState(null);
    const [etaInfo, setEtaInfo] = useState(null);
    // FIX #9: mobile sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(socket.connected);
    const selectedBusRef = useRef(null);

    useEffect(() => { selectedBusRef.current = selectedBus; }, [selectedBus]);

    const recalculateETA = useCallback((bus) => {
        if (!bus) { setEtaInfo(null); return; }
        const currentLoc = bus.currentLocation?.coordinates;
        const route = bus.routeId;
        if (!currentLoc || !route) { setEtaInfo(null); return; }

        let dest = null;
        if (route.destinationCoordinates?.lat) {
            dest = { lat: route.destinationCoordinates.lat, lng: route.destinationCoordinates.lng };
        } else if (route.stops?.length > 0) {
            const last = route.stops[route.stops.length - 1];
            dest = { lat: last.coordinates.lat, lng: last.coordinates.lng };
        }
        if (!dest) { setEtaInfo(null); return; }

        const speed = bus.currentLocation?.speed || 0;
        setEtaInfo(calculateETA(currentLoc, dest, speed));
    }, []);

    useEffect(() => {
        fetchActiveBuses();

        // FIX #23: socket connection status tracking
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => {
            setIsConnected(false);
            toast.error('Lost real-time connection. Locations may be stale.', { id: 'track-disconnect', duration: 0 });
        };
        const handleReconnect = () => {
            setIsConnected(true);
            toast.dismiss('track-disconnect');
            toast.success('Reconnected — live tracking resumed.', { duration: 3000 });
        };

        socket.on('connect', handleConnect);
        socket.on('connect', handleReconnect);
        socket.on('disconnect', handleDisconnect);

        if (!socket.connected) socket.connect();

        socket.on('bus:location-updated', (data) => {
            setBuses(prevBuses =>
                prevBuses.map(bus =>
                    bus._id === data.busId
                        ? { ...bus, currentLocation: { coordinates: { lat: data.lat, lng: data.lng }, lastUpdated: new Date(), speed: data.location?.speed || 0 } }
                        : bus
                )
            );
            if (selectedBusRef.current?._id === data.busId) {
                setSelectedBus(prev => {
                    if (!prev) return prev;
                    const updated = { ...prev, currentLocation: { coordinates: { lat: data.lat, lng: data.lng }, lastUpdated: new Date(), speed: data.location?.speed || 0 } };
                    recalculateETA(updated);
                    return updated;
                });
            }
        });

        socket.on('trip:delay', (data) => {
            if (selectedBusRef.current?._id === data.busId || selectedBusRef.current?.currentTripId === data.tripId) {
                setDelayInfo(data);
            }
        });

        return () => {
            socket.off('bus:location-updated');
            socket.off('trip:delay');
            socket.off('connect', handleConnect);
            socket.off('connect', handleReconnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [recalculateETA]);

    const fetchActiveBuses = async () => {
        try {
            const response = await api.get('/buses?status=active');
            if (response.success) setBuses(response.data.buses);
        } catch { toast.error('Failed to fetch buses'); }
        finally { setLoading(false); }
    };

    const handleBusClick = (bus) => {
        setSelectedBus(bus);
        setDelayInfo(null);
        setSidebarOpen(false); // close mobile drawer on selection

        if (bus.currentLocation?.coordinates) {
            setCenter([bus.currentLocation.coordinates.lat, bus.currentLocation.coordinates.lng]);
            setZoom(16);
        }

        const route = bus.routeId;
        if (route) {
            const poly = parsePolyline(route.polyline);
            setRouteCoordinates(poly.length > 0 ? poly : route.stops?.length > 0 ? route.stops.map(s => [s.coordinates.lat, s.coordinates.lng]) : []);
        } else {
            setRouteCoordinates([]);
        }

        recalculateETA(bus);
    };

    const formatSpeed = (speed) => {
        if (!speed || speed === 0) return 'Stationary';
        return `${Math.round(speed * 3.6)} km/h`;
    };

    const SidebarContent = () => (
        <div className="flex flex-col gap-3 p-4">
            {/* Connection indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isConnected ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                {isConnected ? (
                    <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live tracking active</>
                ) : (
                    <><WifiOff className="w-3.5 h-3.5" /> Reconnecting...</>
                )}
            </div>

            <h2 className="text-xl font-bold text-white">Active Buses</h2>

            {/* ETA panel for selected bus */}
            {selectedBus && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 font-semibold text-sm">Live ETA — {selectedBus.busNumber}</span>
                    </div>
                    {etaInfo ? (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-white font-bold text-lg">{etaInfo.etaText}</div>
                                <div className="text-gray-400 text-xs">to destination</div>
                            </div>
                            <div className="bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-white font-bold text-lg">{etaInfo.distance} km</div>
                                <div className="text-gray-400 text-xs">remaining</div>
                            </div>
                            <div className="col-span-2 bg-black/20 rounded-lg p-2 text-center">
                                <div className="text-green-300 font-medium text-sm">{formatSpeed(selectedBus.currentLocation?.speed)}</div>
                                <div className="text-gray-400 text-xs">current speed</div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-xs">Location data needed for ETA. Driver must start trip.</p>
                    )}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    Loading buses...
                </div>
            ) : buses.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center text-gray-400 text-sm">
                    No active buses right now.
                </div>
            ) : (
                <div className="space-y-2">
                    {buses.map(bus => (
                        <div key={bus._id} onClick={() => handleBusClick(bus)}
                            className={`bg-white/10 border rounded-lg p-3 cursor-pointer hover:bg-white/20 transition ${selectedBus?._id === bus._id ? 'border-purple-500 bg-white/15' : 'border-white/10'}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Bus className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                        <span className="font-semibold text-white text-sm truncate">{bus.busNumber}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 truncate">{bus.routeId?.routeName || 'No route'}</p>
                                    {/* FIX #10: show "no live location" when driver hasn't started trip */}
                                    {bus.currentLocation?.lastUpdated ? (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(bus.currentLocation.lastUpdated).toLocaleTimeString()}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-500/70">
                                            <Clock className="w-3 h-3" />
                                            <span>No live location yet</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                    {bus.status}
                                </span>
                            </div>
                            {selectedBus?._id === bus._id && etaInfo && (
                                <div className="mt-2 pt-2 border-t border-white/10 flex gap-3 text-xs">
                                    <span className="text-purple-300 font-semibold">{etaInfo.etaText}</span>
                                    <span className="text-gray-400">{etaInfo.distance} km left</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
            <div className="h-[calc(100vh-4rem)] flex relative">
                {/* Desktop sidebar */}
                <div className="hidden md:block w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 overflow-y-auto flex-shrink-0">
                    <SidebarContent />
                </div>

                {/* Mobile sidebar toggle button */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-lg border border-white/20 text-white p-2.5 rounded-xl shadow-lg"
                >
                    <Menu className="w-5 h-5" />
                </button>

                {/* Mobile sidebar drawer */}
                {sidebarOpen && (
                    <>
                        <div className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="md:hidden fixed left-0 top-16 bottom-0 z-40 w-80 max-w-[85vw] bg-slate-900 border-r border-white/10 overflow-y-auto">
                            <div className="flex justify-end p-3">
                                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <SidebarContent />
                        </div>
                    </>
                )}

                {/* Map */}
                <div className="flex-1 relative">
                    <DelayBanner delayInfo={delayInfo} onDismiss={() => setDelayInfo(null)} />
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                        <ChangeView center={center} zoom={zoom} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {routeCoordinates.length > 0 && (
                            <Polyline positions={routeCoordinates} color="#8b5cf6" weight={4} opacity={0.75} dashArray="8 4" />
                        )}
                        {buses.map(bus => {
                            if (!bus.currentLocation?.coordinates?.lat) return null;
                            return (
                                <Marker key={bus._id}
                                    position={[bus.currentLocation.coordinates.lat, bus.currentLocation.coordinates.lng]}
                                    icon={busIcon}
                                    eventHandlers={{ click: () => handleBusClick(bus) }}>
                                    <Popup>
                                        <div className="p-2">
                                            <div className="font-bold text-lg mb-1">{bus.busNumber}</div>
                                            <div className="text-sm text-gray-600 mb-1">{bus.routeId?.routeName}</div>
                                            <div className="text-xs text-gray-500">Driver: {bus.driverId?.name || 'Not assigned'}</div>
                                            {selectedBus?._id === bus._id && etaInfo && (
                                                <div className="mt-2 pt-2 border-t text-xs">
                                                    <span className="font-semibold text-purple-600">ETA: {etaInfo.etaText}</span> ({etaInfo.distance} km)
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                        {selectedBus?.routeId?.stops?.map((stop, index) => (
                            <Marker key={index} position={[stop.coordinates.lat, stop.coordinates.lng]}>
                                <Popup><div className="p-2"><div className="font-bold">{stop.name}</div><div className="text-xs text-gray-500">Stop {index + 1}</div></div></Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Bus details overlay */}
                    {selectedBus && (
                        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-5 max-w-xs z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold text-white">Bus Details</h3>
                                <button onClick={() => { setSelectedBus(null); setEtaInfo(null); setRouteCoordinates([]); }}
                                    className="text-gray-300 hover:text-white text-xl font-bold leading-none">✕</button>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-gray-400">Bus:</span> <span className="font-bold text-white">{selectedBus.busNumber}</span></div>
                                <div><span className="text-gray-400">Route:</span> <span className="text-white">{selectedBus.routeId?.routeName || 'N/A'}</span></div>
                                <div><span className="text-gray-400">Driver:</span> <span className="text-white">{selectedBus.driverId?.name || 'Not assigned'}</span></div>
                                <div><span className="text-gray-400">Type:</span> <span className="text-white">{selectedBus.busType || 'Ordinary'}</span></div>
                                <div><span className="text-gray-400">Status:</span> <span className={`font-bold ${selectedBus.status === 'active' ? 'text-green-400' : 'text-gray-300'}`}>{selectedBus.status?.toUpperCase()}</span></div>
                                {!selectedBus.currentLocation?.coordinates?.lat && (
                                    <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs">
                                        ⚠️ No live location. Driver hasn't started a trip yet.
                                    </div>
                                )}
                                {etaInfo && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Navigation className="w-4 h-4 text-purple-400" />
                                            <span className="text-purple-300 font-semibold text-xs uppercase tracking-wide">Live ETA</span>
                                        </div>
                                        <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-white">{etaInfo.etaText}</div>
                                            <div className="text-gray-400 text-xs">{etaInfo.distance} km to destination</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackBus;
