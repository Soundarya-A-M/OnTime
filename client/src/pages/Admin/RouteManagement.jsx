import { useState, useEffect, useRef } from 'react';
import { BusFront, MapPin, Search, Save, Navigation } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const RouteManagement = () => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const sourceMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);
    const polylineRef = useRef(null);
    const sourceSearchDebounceRef = useRef(null);
    const destSearchDebounceRef = useRef(null);
    const sourceSearchRequestRef = useRef(0);
    const destSearchRequestRef = useRef(0);
    const skipNextSourceSearchRef = useRef(false);
    const skipNextDestSearchRef = useRef(false);

    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        routeNumber: '',
        routeName: '',
        sourceCity: '',
        destinationCity: ''
    });

    const [sourceResult, setSourceResult] = useState(null);
    const [destResult, setDestResult] = useState(null);
    const [sourceSearch, setSourceSearch] = useState('');
    const [destSearch, setDestSearch] = useState('');
    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

    useEffect(() => {
        fetchRoutes();
        initMap();
    }, []);

    useEffect(() => {
        if (skipNextSourceSearchRef.current) {
            skipNextSourceSearchRef.current = false;
            return;
        }

        if (sourceSearchDebounceRef.current) clearTimeout(sourceSearchDebounceRef.current);

        if (!sourceSearch || sourceSearch.trim().length < 3) {
            setSourceSuggestions([]);
            return;
        }

        sourceSearchDebounceRef.current = setTimeout(() => {
            const requestId = ++sourceSearchRequestRef.current;
            searchLocation(sourceSearch, requestId, setSourceSuggestions, sourceSearchRequestRef);
        }, 500);

        return () => {
            if (sourceSearchDebounceRef.current) clearTimeout(sourceSearchDebounceRef.current);
        };
    }, [sourceSearch]);

    useEffect(() => {
        if (skipNextDestSearchRef.current) {
            skipNextDestSearchRef.current = false;
            return;
        }

        if (destSearchDebounceRef.current) clearTimeout(destSearchDebounceRef.current);

        if (!destSearch || destSearch.trim().length < 3) {
            setDestSuggestions([]);
            return;
        }

        destSearchDebounceRef.current = setTimeout(() => {
            const requestId = ++destSearchRequestRef.current;
            searchLocation(destSearch, requestId, setDestSuggestions, destSearchRequestRef);
        }, 500);

        return () => {
            if (destSearchDebounceRef.current) clearTimeout(destSearchDebounceRef.current);
        };
    }, [destSearch]);

    const initMap = () => {
        // Only use the env variable, no hardcoded fallback token to prevent secret leaks
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

        if (mapRef.current && !leafletMapRef.current) {
            leafletMapRef.current = new mapboxgl.Map({
                container: mapRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [77.5946, 12.9716], // [lng, lat] for Mapbox
                zoom: 7
            });
            leafletMapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
        }
    };

    const fetchRoutes = async () => {
        try {
            const res = await api.get('/routes');
            if (res.success) setRoutes(res.data.routes);
        } catch {
            // ignore
        }
    };

    const searchMapboxPlaces = async (query) => {
        const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
        // Limit search to Karnataka region using bounding box
        const bbox = '74.054,11.583,78.583,18.450'; // Rough bounding box for Karnataka
        
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=IN&bbox=${bbox}&limit=8`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Mapbox search failed');

        const data = await res.json();
        return data.features.map(feature => ({
            id: feature.id,
            name: feature.text,
            latitude: feature.center[1],
            longitude: feature.center[0],
            displayName: feature.place_name,
            type: feature.place_type.includes('poi') ? 'bus_stop' : 'city'
        }));
    };

    const searchLocation = async (query, requestId, setSuggestions, requestRef) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        try {
            const results = await searchMapboxPlaces(query);

            if (requestId === requestRef.current) {
                setSuggestions(results);
            }
        } catch (error) {
            console.error("Search integration failed:", error);
            if (requestId === requestRef.current) {
                setSuggestions([]);
            }
        }
    };

    const getSuggestionMeta = (place) => ({
        Icon: place.type === 'city' ? MapPin : BusFront,
        iconClass: place.type === 'city' ? 'text-emerald-400' : 'text-amber-400'
    });

    const selectSource = (place) => {
        setSourceResult(place);
        skipNextSourceSearchRef.current = true;
        setSourceSearch(place.name);
        setSourceSuggestions([]);
        setForm((f) => ({
            ...f,
            sourceCity: place.name,
            _srcCoords: { lat: place.latitude, lng: place.longitude },
            _sourceDisplayName: place.displayName
        }));

        if (leafletMapRef.current) {
            const lat = place.latitude;
            const lng = place.longitude;

            if (sourceMarkerRef.current) sourceMarkerRef.current.remove();
            
            const el = document.createElement('div');
            el.className = 'w-4 h-4 rounded-full bg-blue-500 border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.5)]';

            const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`<b>Source:</b> ${place.displayName}`);

            sourceMarkerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(leafletMapRef.current);
                
            sourceMarkerRef.current.togglePopup();
            leafletMapRef.current.flyTo({ center: [lng, lat], zoom: 14 });

            if (destResult) drawRoute(place, destResult);
        }
    };

    const selectDest = (place) => {
        setDestResult(place);
        skipNextDestSearchRef.current = true;
        setDestSearch(place.name);
        setDestSuggestions([]);
        setForm((f) => ({
            ...f,
            destinationCity: place.name,
            _dstCoords: { lat: place.latitude, lng: place.longitude },
            _destinationDisplayName: place.displayName
        }));

        if (leafletMapRef.current) {
            const lat = place.latitude;
            const lng = place.longitude;

            if (destMarkerRef.current) destMarkerRef.current.remove();

            const el = document.createElement('div');
            el.className = 'w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.5)]';
            
            const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`<b>Destination:</b> ${place.displayName}`);

            destMarkerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(leafletMapRef.current);
                
            destMarkerRef.current.togglePopup();
            leafletMapRef.current.flyTo({ center: [lng, lat], zoom: 14 });

            if (sourceResult) drawRoute(sourceResult, place);
        }
    };

    const applyRouteSelection = (route, src, dst, allRoutes) => {
        const geojson = route.geometry;
        const distKm = Math.round(route.distance / 100) / 10;
        const durMin = Math.round(route.duration / 60);

        const map = leafletMapRef.current;
        
        // Remove existing old layers up to a somewhat safe upper bound if they exist
        for (let i = 0; i < 5; i++) {
            if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
            if (map.getSource(`route-${i}`)) map.removeSource(`route-${i}`);
        }
        if (map.getLayer('route')) map.removeLayer('route');
        if (map.getSource('route')) map.removeSource('route');

        // Draw multiple routes
        allRoutes.forEach((altRoute, index) => {
            const isSelected = altRoute.geometry === geojson;
            map.addSource(`route-${index}`, {
                type: 'geojson',
                data: altRoute.geometry
            });
            map.addLayer({
                id: `route-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': isSelected ? '#3b82f6' : '#94a3b8',
                    'line-width': isSelected ? 5 : 3,
                    'line-opacity': isSelected ? 1 : 0.6
                }
            });

            // If selected, move it to the top so it renders above gray lines
            if (isSelected) {
                map.moveLayer(`route-${index}`); 
            }
        });

        // Mapbox bounding box requires [minLng, minLat], [maxLng, maxLat]
        const coords = geojson.coordinates;
        const bounds = coords.reduce((acc, curr) => {
            return [
                [Math.min(acc[0][0], curr[0]), Math.min(acc[0][1], curr[1])],
                [Math.max(acc[1][0], curr[0]), Math.max(acc[1][1], curr[1])]
            ];
        }, [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]);

        map.fitBounds(bounds, { padding: 80 });

        setForm((f) => ({
            ...f,
            routeName: f.routeName || `${src.name} -> ${dst.name}`,
            _distance: distKm,
            _duration: durMin,
            _polyline: JSON.stringify(route.geometry),
            _srcCoords: { lat: src.latitude, lng: src.longitude },
            _dstCoords: { lat: dst.latitude, lng: dst.longitude }
        }));
    };

    const drawRoute = async (src, dst) => {
        const srcLng = src.longitude;
        const srcLat = src.latitude;
        const dstLng = dst.longitude;
        const dstLat = dst.latitude;

        try {
            const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
            // Added &alternatives=true to fetch multiple possible paths
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${srcLng},${srcLat};${dstLng},${dstLat}?geometries=geojson&overview=full&alternatives=true&access_token=${token}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                setAvailableRoutes(data.routes);
                setSelectedRouteIndex(0);
                applyRouteSelection(data.routes[0], src, dst, data.routes);

                const distKm = Math.round(data.routes[0].distance / 100) / 10;
                const durMin = Math.round(data.routes[0].duration / 60);
                toast.success(`Found ${data.routes.length} route options! Default drawn: ${distKm} km`);
            }
        } catch (err) {
            toast.error('Failed to fetch route from Mapbox Directions', err);
        }
    };

    const handleSelectRoute = (index) => {
        setSelectedRouteIndex(index);
        applyRouteSelection(availableRoutes[index], sourceResult, destResult, availableRoutes);
    };

    const handleSave = async () => {
        if (!form.routeNumber || !form.routeName) {
            toast.error('Please provide a Route Number and Route Name.');
            return;
        }
        if (!sourceResult || !destResult) {
            toast.error('Please search and select a source & destination from the dropdown list.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                routeNumber: form.routeNumber,
                routeName: form.routeName,
                sourceCity: form.sourceCity,
                destinationCity: form.destinationCity,
                sourceCoordinates: form._srcCoords || { lat: sourceResult.latitude, lng: sourceResult.longitude },
                destinationCoordinates: form._dstCoords || { lat: destResult.latitude, lng: destResult.longitude },
                polyline: form._polyline || null,
                distance: form._distance || 0,
                estimatedDuration: form._duration || 0
            };

            const res = await api.post('/routes', payload);
            if (res.success) {
                toast.success('Route saved successfully!');
                fetchRoutes();
                setForm({ routeNumber: '', routeName: '', sourceCity: '', destinationCity: '' });
                setSourceResult(null);
                setDestResult(null);
                setSourceSearch('');
                setDestSearch('');
                setSourceSuggestions([]);
                setDestSuggestions([]);
                setAvailableRoutes([]);
                setSelectedRouteIndex(0);
                if (leafletMapRef.current) {
                    for (let i = 0; i < 5; i++) {
                        if (leafletMapRef.current.getLayer(`route-${i}`)) leafletMapRef.current.removeLayer(`route-${i}`);
                        if (leafletMapRef.current.getSource(`route-${i}`)) leafletMapRef.current.removeSource(`route-${i}`);
                    }
                    if (leafletMapRef.current.getLayer('route')) leafletMapRef.current.removeLayer('route');
                    if (leafletMapRef.current.getSource('route')) leafletMapRef.current.removeSource('route');
                }
            }
        } catch (e) {
            toast.error(e.message || 'Failed to save route');
        } finally {
            setLoading(false);
        }
    };

    const renderSuggestion = (suggestion, onSelect) => {
        const { Icon, iconClass } = getSuggestionMeta(suggestion);

        return (
            <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion)}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 border-b border-white/5 last:border-0"
            >
                <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
                    <div className="min-w-0">
                        <div className="font-medium text-white truncate">{suggestion.name}</div>
                        <div className="text-xs text-gray-400 truncate">{suggestion.displayName}</div>
                    </div>
                </div>
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <Navigation className="w-9 h-9 text-purple-400" /> Route Management
                    </h1>
                    <p className="text-gray-300">Create bus routes using OpenStreetMap and OSRM routing</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white mb-4">Create New Route</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Route Number *</label>
                                <input
                                    type="text"
                                    value={form.routeNumber}
                                    onChange={e => setForm(f => ({ ...f, routeNumber: e.target.value }))}
                                    placeholder="e.g. RT-001"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-300 text-sm mb-1">Route Name *</label>
                                <input
                                    type="text"
                                    value={form.routeName}
                                    onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))}
                                    placeholder="e.g. Mysuru -> Mangaluru"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-gray-300 text-sm mb-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                Source City *
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={sourceSearch}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setSourceSearch(value);
                                        setSourceResult(null);
                                        setForm(f => ({ ...f, sourceCity: '', _srcCoords: null, _sourceDisplayName: '' }));
                                    }}
                                    placeholder="e.g. Mysuru Bus Stand..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            {sourceSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-slate-800 border border-white/20 rounded-lg mt-1 overflow-hidden shadow-2xl">
                                    {sourceSuggestions.map((suggestion) => renderSuggestion(suggestion, selectSource))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <label className="block text-gray-300 text-sm mb-1">
                                <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                Destination City *
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={destSearch}
                                    onChange={e => {
                                        const value = e.target.value;
                                        setDestSearch(value);
                                        setDestResult(null);
                                        setForm(f => ({ ...f, destinationCity: '', _dstCoords: null, _destinationDisplayName: '' }));
                                    }}
                                    placeholder="e.g. Bengaluru Majestic Bus Station..."
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                                />
                            </div>
                            {destSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full bg-slate-800 border border-white/20 rounded-lg mt-1 overflow-hidden shadow-2xl">
                                    {destSuggestions.map((suggestion) => renderSuggestion(suggestion, selectDest))}
                                </div>
                            )}
                        </div>

                        {availableRoutes.length > 1 && (
                            <div className="space-y-2 mt-2">
                                <label className="block text-gray-300 text-sm mb-1">Select Route Path</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableRoutes.map((route, idx) => {
                                        const distKm = Math.round(route.distance / 100) / 10;
                                        const durMin = Math.round(route.duration / 60);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleSelectRoute(idx)}
                                                className={`p-3 text-left rounded-lg border transition ${
                                                    selectedRouteIndex === idx 
                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-100' 
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">Option {idx + 1}</span>
                                                    <span className="text-sm font-semibold">{distKm} km</span>
                                                </div>
                                                <div className="text-sm opacity-80 mt-1">
                                                    ETA: ~{durMin} mins
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {form._distance && availableRoutes.length <= 1 && (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
                                Distance <strong>{form._distance} km</strong> | ETA <strong>~{form._duration} min</strong>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Saving...' : 'Save Route'}
                        </button>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-3 overflow-hidden" style={{ height: '500px' }}>
                        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }}></div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Saved Routes</h2>
                    {routes.length === 0 ? (
                        <p className="text-gray-400">No routes yet. Create your first route above.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Number</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Source</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Destination</th>
                                        <th className="text-left py-3 px-4 text-gray-300 font-medium">Distance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {routes.map(r => (
                                        <tr key={r._id} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3 px-4 text-purple-300 font-mono text-sm">{r.routeNumber}</td>
                                            <td className="py-3 px-4 text-white font-medium">{r.routeName}</td>
                                            <td className="py-3 px-4 text-gray-300">{r.sourceCity || '-'}</td>
                                            <td className="py-3 px-4 text-gray-300">{r.destinationCity || '-'}</td>
                                            <td className="py-3 px-4 text-gray-300">{r.distance ? `${r.distance} km` : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RouteManagement;
