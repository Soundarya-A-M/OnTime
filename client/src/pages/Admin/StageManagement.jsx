import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Plus, Trash2, Pin } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

let L;

const StageManagement = () => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const stageMarkersRef = useRef([]);
    const pinMarkerRef = useRef(null);

    const [routes, setRoutes] = useState([]);
    const [searchRoute, setSearchRoute] = useState('');
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [stages, setStages] = useState([]);
    const [pinMode, setPinMode] = useState(false);
    
    // Derived state for route filtering
    const filteredRoutes = routes.filter(r => 
        (r.routeName && r.routeName.toLowerCase().includes(searchRoute.toLowerCase())) ||
        (r.routeNumber && r.routeNumber.toLowerCase().includes(searchRoute.toLowerCase()))
    );

    const polylineRef = useRef(null);
    const [pendingPin, setPendingPin] = useState(null); // { lat, lng }
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [stageForm, setStageForm] = useState({ stageName: '', stageOrder: '' });
    const [showStageModal, setShowStageModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRoutes();
        initMap();
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, []);

    const initMap = async () => {
        L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (mapRef.current && !leafletMapRef.current) {
            leafletMapRef.current = L.map(mapRef.current).setView([12.9716, 77.5946], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(leafletMapRef.current);
        }
    };

    const fetchRoutes = async () => {
        const res = await api.get('/routes');
        if (res.success) setRoutes(res.data.routes);
    };

    const fetchStages = async (routeId) => {
        const res = await api.get(`/stages/${routeId}`);
        if (res.success) {
            setStages(res.data.stages);
            renderStageMarkers(res.data.stages);
        }
    };

    const renderStageMarkers = (stageList) => {
        if (!leafletMapRef.current || !L) return;
        // Remove old markers
        stageMarkersRef.current.forEach(m => m.remove());
        stageMarkersRef.current = [];

        stageList.forEach((stage, idx) => {
            const marker = L.marker([stage.latitude, stage.longitude], {
                icon: L.divIcon({
                    html: `<div style="
                        background:linear-gradient(135deg,#7c3aed,#2563eb);
                        color:white;font-size:11px;font-weight:bold;
                        width:28px;height:28px;border-radius:50%;
                        border:3px solid white;
                        display:flex;align-items:center;justify-content:center;
                        box-shadow:0 2px 8px rgba(0,0,0,0.4)
                    ">${stage.stageOrder}</div>`,
                    className: '', iconSize: [28, 28], iconAnchor: [14, 14]
                })
            }).addTo(leafletMapRef.current);

            marker.bindPopup(`
                <div style="font-family:sans-serif;min-width:160px">
                    <div style="font-weight:bold;font-size:14px;margin-bottom:4px">📍 ${stage.stageName}</div>
                    <div style="color:#555;font-size:12px">Order: ${stage.stageOrder}</div>
                    <div style="color:#555;font-size:12px">Distance from origin: <b>${stage.distanceFromOrigin} km</b></div>
                </div>
            `);
            stageMarkersRef.current.push(marker);
        });

        if (stageList.length > 0) {
            const bounds = L.latLngBounds(stageList.map(s => [s.latitude, s.longitude]));
            leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
    };

    const enablePinMode = () => {
        if (!leafletMapRef.current) return;
        setPinMode(true);
        toast('🗺 Click anywhere on the map to drop a stage pin', { duration: 3000 });
        leafletMapRef.current.on('click', onMapClick);
        leafletMapRef.current.getContainer().style.cursor = 'crosshair';
    };

    const disablePinMode = () => {
        if (!leafletMapRef.current) return;
        setPinMode(false);
        leafletMapRef.current.off('click', onMapClick);
        leafletMapRef.current.getContainer().style.cursor = '';
        if (pinMarkerRef.current) { pinMarkerRef.current.remove(); pinMarkerRef.current = null; }
        setPendingPin(null);
    };

    const onMapClick = (e) => {
        const { lat, lng } = e.latlng;
        setPendingPin({ lat, lng });

        if (pinMarkerRef.current) pinMarkerRef.current.remove();
        pinMarkerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '<div style="background:#f59e0b;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5)"></div>',
                className: '', iconSize: [16, 16], iconAnchor: [8, 8]
            })
        }).addTo(leafletMapRef.current).bindPopup('Pin dropped — fill in the form').openPopup();

        setShowStageModal(true);
        // Set suggested order
        setStageForm(f => ({ ...f, stageOrder: stages.length }));
    };

    const searchNominatim = async (q) => {
        if (!q || q.length < 3) { setSuggestions([]); return; }
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=8&countrycodes=in`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        setSuggestions(data);
    };

    const selectSearchResult = (place) => {
        setSuggestions([]);
        setSearchQuery(place.display_name.split(',')[0]);
        const lat = parseFloat(place.lat), lng = parseFloat(place.lon);
        if (leafletMapRef.current) leafletMapRef.current.setView([lat, lng], 12);
    };

    const handleSaveStage = async () => {
        if (!stageForm.stageName || stageForm.stageOrder === '') {
            toast.error('Stage name and order are required');
            return;
        }
        if (!pendingPin) {
            toast.error('Please drop a pin on the map first');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/stages', {
                routeId: selectedRoute._id,
                stageName: stageForm.stageName,
                latitude: pendingPin.lat,
                longitude: pendingPin.lng,
                stageOrder: parseInt(stageForm.stageOrder)
            });

            if (res.success) {
                toast.success(`Stage "${stageForm.stageName}" added! (${res.data.stage.distanceFromOrigin} km from origin)`);
                fetchStages(selectedRoute._id);
                setShowStageModal(false);
                setStageForm({ stageName: '', stageOrder: '' });
                disablePinMode();
            }
        } catch (e) {
            toast.error(e.message || 'Failed to save stage');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStage = async (stageId) => {
        if (!confirm('Delete this stage?')) return;
        try {
            const res = await api.delete(`/stages/${stageId}`);
            if (res.success) {
                toast.success('Stage deleted');
                fetchStages(selectedRoute._id);
            }
        } catch {
            toast.error('Failed to delete stage');
        }
    };

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
        setStages([]);
        fetchStages(route._id);
        disablePinMode();

        // Pan to route if has coords and draw polyline
        if (leafletMapRef.current) {
            // Remove previous polyline
            if (polylineRef.current) {
                polylineRef.current.remove();
                polylineRef.current = null;
            }

            if (route.polyline) {
                try {
                    const geojson = JSON.parse(route.polyline);
                    const coords = geojson.coordinates.map(([lng, lat]) => [lat, lng]);
                    
                    polylineRef.current = L.polyline(coords, { color: '#3b82f6', weight: 4, opacity: 0.8 })
                        .addTo(leafletMapRef.current);

                    // If we have both source and dest, fit bounds to the whole route path
                    if (coords.length > 0) {
                        const bounds = L.latLngBounds(coords);
                        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
                    }
                } catch (e) {
                    console.error("Failed to parse route polyline", e);
                    if (route.sourceCoordinates?.lat) {
                        leafletMapRef.current.setView([route.sourceCoordinates.lat, route.sourceCoordinates.lng], 9);
                    }
                }
            } else if (route.sourceCoordinates?.lat) {
                leafletMapRef.current.setView([route.sourceCoordinates.lat, route.sourceCoordinates.lng], 9);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <MapPin className="w-9 h-9 text-purple-400" /> Stage Management
                    </h1>
                    <p className="text-gray-300">Add bus stops to routes — click the map to pin stages</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left: Route selector + stages list */}
                    <div className="space-y-4">
                        {/* Route selector */}
                        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                            <h2 className="text-lg font-bold text-white mb-3">Select Route</h2>
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchRoute}
                                    onChange={(e) => setSearchRoute(e.target.value)}
                                    placeholder="Search by route name or number..."
                                    className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                                />
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                                {filteredRoutes.length === 0 ? (
                                    <p className="text-gray-400 text-sm">No routes found.</p>
                                ) : filteredRoutes.map(r => (
                                    <button
                                        key={r._id}
                                        onClick={() => handleSelectRoute(r)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${selectedRoute?._id === r._id ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                    >
                                        <div className="font-medium">{r.routeName}</div>
                                        <div className="text-xs opacity-70">{r.routeNumber}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nominatim search for map zoom */}
                        {selectedRoute && (
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                                <h3 className="text-white font-semibold mb-2 text-sm">Search Location</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => { setSearchQuery(e.target.value); searchNominatim(e.target.value); }}
                                        placeholder="Search to zoom map..."
                                        className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                {suggestions.length > 0 && (
                                    <div className="mt-1 bg-slate-800 border border-white/20 rounded-lg overflow-hidden">
                                        {suggestions.map(s => (
                                            <button key={s.place_id} onClick={() => selectSearchResult(s)}
                                                className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-white/10 border-b border-white/5 last:border-0">
                                                {s.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pin mode button */}
                        {selectedRoute && (
                            <button
                                onClick={pinMode ? disablePinMode : enablePinMode}
                                className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition ${pinMode
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                    : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                                    }`}
                            >
                                <Pin className="w-5 h-5" />
                                {pinMode ? '🎯 Pin Mode ON — Click Map' : 'Enable Pin Mode'}
                            </button>
                        )}

                        {/* Stages list */}
                        {stages.length > 0 && (
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4">
                                <h3 className="text-white font-semibold mb-3">Stages ({stages.length})</h3>
                                <div className="space-y-2">
                                    {stages.map(stage => (
                                        <div key={stage._id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                                            <div>
                                                <div className="text-white text-sm font-medium flex items-center gap-2">
                                                    <span className="w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">{stage.stageOrder}</span>
                                                    {stage.stageName}
                                                </div>
                                                <div className="text-gray-400 text-xs mt-0.5">{stage.distanceFromOrigin} km from origin</div>
                                            </div>
                                            <button onClick={() => handleDeleteStage(stage._id)} className="text-red-400 hover:text-red-300 p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden" style={{ height: '600px' }}>
                        {!selectedRoute && (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                Select a route to start adding stages
                            </div>
                        )}
                        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
                    </div>
                </div>

                {/* Stage Modal */}
                {showStageModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-slate-800 border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Pin className="w-5 h-5 text-amber-400" /> Add Stage
                            </h3>
                            {pendingPin && (
                                <p className="text-gray-400 text-sm mb-4">
                                    📍 {pendingPin.lat.toFixed(5)}, {pendingPin.lng.toFixed(5)}
                                </p>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Stage Name *</label>
                                    <input
                                        type="text"
                                        value={stageForm.stageName}
                                        onChange={e => setStageForm(f => ({ ...f, stageName: e.target.value }))}
                                        placeholder="e.g. Hunsur Bus Stand"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-300 text-sm mb-1">Stage Order *</label>
                                    <input
                                        type="number"
                                        value={stageForm.stageOrder}
                                        onChange={e => setStageForm(f => ({ ...f, stageOrder: e.target.value }))}
                                        placeholder="0 = first stop"
                                        min="0"
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleSaveStage} disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition disabled:opacity-50">
                                    {loading ? 'Saving...' : '✓ Save Stage'}
                                </button>
                                <button onClick={() => { setShowStageModal(false); disablePinMode(); }}
                                    className="px-6 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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

export default StageManagement;
