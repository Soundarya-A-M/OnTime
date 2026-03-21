import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Bus, Navigation, Clock, Zap } from 'lucide-react';
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

// Parse a saved Mapbox GeoJSON polyline string into Leaflet [[lat,lng]] array
const parsePolyline = (polylineStr) => {
    if (!polylineStr) return [];
    try {
        const geojson = JSON.parse(polylineStr);
        if (geojson.coordinates) {
            return geojson.coordinates.map(([lng, lat]) => [lat, lng]);
        }
    } catch { /* ignore */ }
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
    const [etaInfo, setEtaInfo] = useState(null); // { distance, eta, etaText }
    const selectedBusRef = useRef(null);

    useEffect(() => { selectedBusRef.current = selectedBus; }, [selectedBus]);

    // Recalculate ETA whenever selected bus location or speed changes
    const recalculateETA = useCallback((bus) => {
        if (!bus) { setEtaInfo(null); return; }
        const currentLoc = bus.currentLocation?.coordinates;
        const route = bus.routeId;
        if (!currentLoc || !route) { setEtaInfo(null); return; }

        // Use destination as ETA target (last stop or destinationCoordinates)
        let dest = null;
        if (route.destinationCoordinates?.lat) {
            dest = { lat: route.destinationCoordinates.lat, lng: route.destinationCoordinates.lng };
        } else if (route.stops?.length > 0) {
            const last = route.stops[route.stops.length - 1];
            dest = { lat: last.coordinates.lat, lng: last.coordinates.lng };
        }

        if (!dest) { setEtaInfo(null); return; }

        const speed = bus.currentLocation?.speed || 0;
        const eta = calculateETA(currentLoc, dest, speed);
        setEtaInfo(eta);
    }, []);

    useEffect(() => {
        fetchActiveBuses();
        setupSocketListeners();
        return () => {
            socket.off('bus:location-updated');
            socket.off('trip:delay');
        };
    }, []);

    const fetchActiveBuses = async () => {
        try {
            const response = await api.get('/buses?status=active');
            if (response.success) setBuses(response.data.buses);
        } catch { toast.error('Failed to fetch buses'); }
        finally { setLoading(false); }
    };

    const setupSocketListeners = () => {
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
                    const updated = {
                        ...prev,
                        currentLocation: { coordinates: { lat: data.lat, lng: data.lng }, lastUpdated: new Date(), speed: data.location?.speed || 0 }
                    };
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
    };

    const handleBusClick = (bus) => {
        setSelectedBus(bus);
        setDelayInfo(null);

        if (bus.currentLocation?.coordinates) {
            setCenter([bus.currentLocation.coordinates.lat, bus.currentLocation.coordinates.lng]);
            setZoom(16);
        }

        // Draw route: prefer saved polyline, fall back to stops
        const route = bus.routeId;
        if (route) {
            const poly = parsePolyline(route.polyline);
            if (poly.length > 0) {
                setRouteCoordinates(poly);
            } else if (route.stops?.length > 0) {
                setRouteCoordinates(route.stops.map(s => [s.coordinates.lat, s.coordinates.lng]));
            } else {
                setRouteCoordinates([]);
            }
        } else {
            setRouteCoordinates([]);
        }

        recalculateETA(bus);
    };

    const formatSpeed = (speed) => {
        if (!speed || speed === 0) return 'Stationary';
        return `${Math.round(speed * 3.6)} km/h`; // m/s to km/h
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
            <div className="h-[calc(100vh-5rem)] flex">
                {/* Sidebar */}
                <div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-4 overflow-y-auto flex flex-col gap-3">
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
                                <p className="text-gray-400 text-xs">Location data needed for ETA calculation. Driver must start trip.</p>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-gray-300 text-sm">Loading buses...</div>
                    ) : buses.length === 0 ? (
                        <div className="text-gray-300 text-sm">No active buses</div>
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
                                            {bus.currentLocation?.lastUpdated && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(bus.currentLocation.lastUpdated).toLocaleTimeString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                                            {bus.status}
                                        </span>
                                    </div>
                                    {/* Mini ETA for each bus in list */}
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
                            if (!bus.currentLocation?.coordinates) return null;
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
