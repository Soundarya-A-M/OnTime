import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Bus, Navigation, Clock } from 'lucide-react';
import L from 'leaflet';
import socket from '../../config/socket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus icon with vibrant purple/blue color
const busIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImJ1c0dyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojOGI1Y2Y2O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzM4ODBmZjtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTTEyIDJDOCAyIDQgNCA0IDh2OGgydjJhMiAyIDAgMCAwIDIgMmgxYTIgMiAwIDAgMCAyLTJ2LTFoMnYxYTIgMiAwIDAgMCAyIDJoMWEyIDIgMCAwIDAgMi0ydi0yaDJWOEMyMCA0IDE2IDIgMTIgMm0tNiA2aDEydjRINlY4bTIgNmEyIDIgMCAwIDEgMiAyIDIgMiAwIDAgMS0yIDIgMiAyIDAgMCAxLTItMiAyIDIgMCAwIDEgMi0ybTggMGEyIDIgMCAwIDEgMiAyIDIgMiAwIDAgMS0yIDIgMiAyIDAgMCAxLTItMiAyIDIgMCAwIDEgMi0yWiIgZmlsbD0idXJsKCNidXNHcmFkaWVudCkiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// Component to handle map view changes
function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.5
            });
        }
    }, [center, zoom, map]);
    return null;
}

const TrackBus = () => {
    const [center, setCenter] = useState([12.9716, 77.5946]); // Bangalore coordinates
    const [zoom, setZoom] = useState(13);
    const [buses, setBuses] = useState([]);
    const [selectedBus, setSelectedBus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState([]);

    useEffect(() => {
        fetchActiveBuses();
        setupSocketListeners();

        return () => {
            socket.off('bus:location-updated');
        };
    }, []);

    const fetchActiveBuses = async () => {
        try {
            const response = await api.get('/buses?status=active');
            if (response.success) {
                setBuses(response.data.buses);
            }
        } catch (error) {
            toast.error('Failed to fetch buses');
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners = () => {
        if (!socket.connected) {
            socket.connect();
        }

        socket.on('bus:location-updated', (data) => {
            setBuses(prevBuses =>
                prevBuses.map(bus =>
                    bus._id === data.busId
                        ? {
                            ...bus,
                            currentLocation: {
                                coordinates: { lat: data.lat, lng: data.lng },
                                lastUpdated: new Date()
                            }
                        }
                        : bus
                )
            );

            if (selectedBus?._id === data.busId) {
                setSelectedBus(prev => ({
                    ...prev,
                    currentLocation: {
                        coordinates: { lat: data.lat, lng: data.lng },
                        lastUpdated: new Date()
                    }
                }));
            }
        });
    };

    const handleBusClick = (bus) => {
        setSelectedBus(bus);
        if (bus.currentLocation?.coordinates) {
            setCenter([bus.currentLocation.coordinates.lat, bus.currentLocation.coordinates.lng]);
            setZoom(16); // Zoom in closer when selecting a bus
        }

        // Get route coordinates if available
        if (bus.routeId?.stops) {
            const coords = bus.routeId.stops.map(stop => [
                stop.coordinates.lat,
                stop.coordinates.lng
            ]);
            setRouteCoordinates(coords);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
            <div className="h-[calc(100vh-5rem)] flex">
                {/* Sidebar */}
                <div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Active Buses</h2>

                    {loading ? (
                        <div className="text-gray-300">Loading buses...</div>
                    ) : buses.length === 0 ? (
                        <div className="text-gray-300">No active buses</div>
                    ) : (
                        <div className="space-y-3">
                            {buses.map((bus) => (
                                <div
                                    key={bus._id}
                                    onClick={() => handleBusClick(bus)}
                                    className={`bg-white/10 border rounded-lg p-4 cursor-pointer hover:bg-white/20 transition ${selectedBus?._id === bus._id ? 'border-purple-500' : 'border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <Bus className="w-5 h-5 text-purple-400" />
                                                <span className="font-semibold text-white">{bus.busNumber}</span>
                                            </div>
                                            <p className="text-sm text-gray-300">{bus.routeId?.routeName || 'No route assigned'}</p>
                                            {bus.currentLocation?.lastUpdated && (
                                                <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Updated {new Date(bus.currentLocation.lastUpdated).toLocaleTimeString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                                            }`}>
                                            {bus.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    <MapContainer
                        center={center}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                    >
                        <ChangeView center={center} zoom={zoom} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Route polyline */}
                        {routeCoordinates.length > 0 && (
                            <Polyline
                                positions={routeCoordinates}
                                color="#8b5cf6"
                                weight={3}
                                opacity={0.7}
                            />
                        )}

                        {/* Bus markers */}
                        {buses.map((bus) => {
                            if (!bus.currentLocation?.coordinates) return null;

                            return (
                                <Marker
                                    key={bus._id}
                                    position={[bus.currentLocation.coordinates.lat, bus.currentLocation.coordinates.lng]}
                                    icon={busIcon}
                                    eventHandlers={{
                                        click: () => handleBusClick(bus)
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <div className="font-bold text-lg mb-1">{bus.busNumber}</div>
                                            <div className="text-sm text-gray-600 mb-2">{bus.routeId?.routeName}</div>
                                            <div className="text-xs text-gray-500">
                                                Driver: {bus.driverId?.name || 'Not assigned'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Capacity: {bus.capacity} seats
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Route stop markers */}
                        {selectedBus?.routeId?.stops?.map((stop, index) => (
                            <Marker
                                key={index}
                                position={[stop.coordinates.lat, stop.coordinates.lng]}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <div className="font-bold">{stop.name}</div>
                                        <div className="text-xs text-gray-500">Stop {index + 1}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Selected Bus Info Overlay */}
                    {selectedBus && (
                        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-6 max-w-sm z-10 shadow-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Bus Details</h3>
                                <button
                                    onClick={() => setSelectedBus(null)}
                                    className="text-gray-300 hover:text-white text-2xl font-bold leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-300 text-sm font-medium">Bus Number:</span>
                                    <p className="font-bold text-white text-lg">{selectedBus.busNumber}</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 text-sm font-medium">Route:</span>
                                    <p className="font-semibold text-white">{selectedBus.routeId?.routeName || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 text-sm font-medium">Driver:</span>
                                    <p className="font-semibold text-white">{selectedBus.driverId?.name || 'Not assigned'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 text-sm font-medium">Capacity:</span>
                                    <p className="font-semibold text-white">{selectedBus.capacity} seats</p>
                                </div>
                                <div>
                                    <span className="text-gray-300 text-sm font-medium">Status:</span>
                                    <p className={`font-bold text-lg ${selectedBus.status === 'active' ? 'text-green-400' : 'text-gray-300'
                                        }`}>
                                        {selectedBus.status.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackBus;
