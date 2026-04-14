import { useState, useEffect, useRef } from 'react';
import { BusFront, MapPin, Search, Save, Navigation, Pencil, Trash2, X, Check } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const RouteManagement = () => {
  const mapRef = useRef(null);
  const mbMapRef = useRef(null);
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const sourceSearchDebounce = useRef(null);
  const destSearchDebounce = useRef(null);
  const sourceSearchReq = useRef(0);
  const destSearchReq = useRef(0);
  const skipSrc = useRef(false);
  const skipDst = useRef(false);

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ routeNumber:'', routeName:'', sourceCity:'', destinationCity:'' });
  const [sourceResult, setSourceResult] = useState(null);
  const [destResult, setDestResult] = useState(null);
  const [sourceSearch, setSourceSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Edit state
  const [editingRoute, setEditingRoute] = useState(null); // route object being edited
  const [editForm, setEditForm] = useState({ routeName:'', routeNumber:'' });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // route id to confirm delete

  // Map Click state
  const [mapClickMode, setMapClickMode] = useState(null); // 'source' | 'dest' | null
  const handleMapClickRef = useRef(null);

  useEffect(() => {
    handleMapClickRef.current = async (e) => {
        const mode = mapClickMode;
        if (!mode) return;

        const { lng, lat } = e.lngLat;
        try {
            const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&country=IN`;
            const res = await fetch(url);
            const data = await res.json();
            
            let place;
            if (data.features && data.features.length > 0) {
                const f = data.features[0];
                place = {
                    id: f.id, name: f.text, latitude: lat, longitude: lng,
                    displayName: f.place_name, type: f.place_type.includes('poi') ? 'bus_stop' : 'city'
                };
            } else {
                place = { id: `custom-${Date.now()}`, name: `Map Location`, latitude: lat, longitude: lng, displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, type: 'city' };
            }

            if (mode === 'source') {
                selectSource(place);
            } else if (mode === 'dest') {
                selectDest(place);
            }
            setMapClickMode(null);
        } catch (error) {
            toast.error('Failed to get location from map');
        }
    };
  });

  useEffect(() => { fetchRoutes(); initMap(); }, []);

  useEffect(() => {
    if (skipSrc.current) { skipSrc.current = false; return; }
    if (sourceSearchDebounce.current) clearTimeout(sourceSearchDebounce.current);
    if (!sourceSearch || sourceSearch.trim().length < 3) { setSourceSuggestions([]); return; }
    sourceSearchDebounce.current = setTimeout(() => {
      const id = ++sourceSearchReq.current;
      searchLocation(sourceSearch, id, setSourceSuggestions, sourceSearchReq);
    }, 500);
    return () => { if (sourceSearchDebounce.current) clearTimeout(sourceSearchDebounce.current); };
  }, [sourceSearch]);

  useEffect(() => {
    if (skipDst.current) { skipDst.current = false; return; }
    if (destSearchDebounce.current) clearTimeout(destSearchDebounce.current);
    if (!destSearch || destSearch.trim().length < 3) { setDestSuggestions([]); return; }
    destSearchDebounce.current = setTimeout(() => {
      const id = ++destSearchReq.current;
      searchLocation(destSearch, id, setDestSuggestions, destSearchReq);
    }, 500);
    return () => { if (destSearchDebounce.current) clearTimeout(destSearchDebounce.current); };
  }, [destSearch]);

  const initMap = () => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    if (mapRef.current && !mbMapRef.current) {
      mbMapRef.current = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [77.5946, 12.9716], zoom: 7,
      });
      mbMapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

      mbMapRef.current.on('click', (e) => {
        if (handleMapClickRef.current) {
            handleMapClickRef.current(e);
        }
      });
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes');
      if (res.success) setRoutes(res.data.routes);
    } catch { /* ignore */ }
  };

  const searchMapboxPlaces = async (query) => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
    const bbox = '74.054,11.583,78.583,18.450';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=IN&bbox=${bbox}&limit=8`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Mapbox search failed');
    const data = await res.json();
    return data.features.map(f => ({
      id: f.id, name: f.text, latitude: f.center[1], longitude: f.center[0],
      displayName: f.place_name, type: f.place_type.includes('poi') ? 'bus_stop' : 'city',
    }));
  };

  const searchLocation = async (query, requestId, setSuggestions, requestRef) => {
    if (!query || query.trim().length < 3) { setSuggestions([]); return; }
    try {
      const results = await searchMapboxPlaces(query);
      if (requestId === requestRef.current) setSuggestions(results);
    } catch { if (requestId === requestRef.current) setSuggestions([]); }
  };

  const selectSource = (place) => {
    setSourceResult(place); skipSrc.current = true;
    setSourceSearch(place.name); setSourceSuggestions([]);
    setForm(f => ({ ...f, sourceCity: place.name, _srcCoords: { lat: place.latitude, lng: place.longitude } }));
    if (mbMapRef.current) {
      if (sourceMarkerRef.current) sourceMarkerRef.current.remove();
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full bg-blue-500 border-[3px] border-white shadow-lg';
      sourceMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new mapboxgl.Popup({ offset:15 }).setHTML(`<b>Source:</b> ${place.displayName}`))
        .addTo(mbMapRef.current);
      sourceMarkerRef.current.togglePopup();
      mbMapRef.current.flyTo({ center: [place.longitude, place.latitude], zoom: 14 });
      if (destResult) drawRoute(place, destResult);
    }
  };

  const selectDest = (place) => {
    setDestResult(place); skipDst.current = true;
    setDestSearch(place.name); setDestSuggestions([]);
    setForm(f => ({ ...f, destinationCity: place.name, _dstCoords: { lat: place.latitude, lng: place.longitude } }));
    if (mbMapRef.current) {
      if (destMarkerRef.current) destMarkerRef.current.remove();
      const el = document.createElement('div');
      el.className = 'w-4 h-4 rounded-full bg-red-500 border-[3px] border-white shadow-lg';
      destMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(new mapboxgl.Popup({ offset:15 }).setHTML(`<b>Destination:</b> ${place.displayName}`))
        .addTo(mbMapRef.current);
      destMarkerRef.current.togglePopup();
      mbMapRef.current.flyTo({ center: [place.longitude, place.latitude], zoom: 14 });
      if (sourceResult) drawRoute(sourceResult, place);
    }
  };

  const applyRouteSelection = (route, src, dst, all) => {
    const map = mbMapRef.current;
    for (let i = 0; i < 5; i++) {
      if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
      if (map.getSource(`route-${i}`)) map.removeSource(`route-${i}`);
    }
    all.forEach((alt, idx) => {
      const selected = alt.geometry === route.geometry;
      map.addSource(`route-${idx}`, { type:'geojson', data: alt.geometry });
      map.addLayer({ id:`route-${idx}`, type:'line', source:`route-${idx}`,
        layout:{ 'line-join':'round','line-cap':'round' },
        paint:{ 'line-color': selected ? '#3b82f6' : '#94a3b8', 'line-width': selected ? 5 : 3, 'line-opacity': selected ? 1 : 0.6 } });
      if (selected) map.moveLayer(`route-${idx}`);
    });
    const coords = route.geometry.coordinates;
    const bounds = coords.reduce((acc, curr) => [
      [Math.min(acc[0][0], curr[0]), Math.min(acc[0][1], curr[1])],
      [Math.max(acc[1][0], curr[0]), Math.max(acc[1][1], curr[1])],
    ], [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]);
    map.fitBounds(bounds, { padding: 80 });
    const distKm = Math.round(route.distance / 100) / 10;
    const durMin = Math.round(route.duration / 60);
    setForm(f => ({
      ...f, routeName: f.routeName || `${src.name} -> ${dst.name}`,
      _distance: distKm, _duration: durMin,
      _polyline: JSON.stringify(route.geometry),
      _srcCoords: { lat: src.latitude, lng: src.longitude },
      _dstCoords: { lat: dst.latitude, lng: dst.longitude },
    }));
  };

  const drawRoute = async (src, dst) => {
    try {
      const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${src.longitude},${src.latitude};${dst.longitude},${dst.latitude}?geometries=geojson&overview=full&alternatives=true&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.length > 0) {
        setAvailableRoutes(data.routes);
        setSelectedRouteIndex(0);
        applyRouteSelection(data.routes[0], src, dst, data.routes);
        toast.success(`Found ${data.routes.length} route option(s)! ${Math.round(data.routes[0].distance / 100) / 10} km`);
      }
    } catch { toast.error('Failed to fetch route from Mapbox Directions'); }
  };

  const handleSelectRoute = (idx) => {
    setSelectedRouteIndex(idx);
    applyRouteSelection(availableRoutes[idx], sourceResult, destResult, availableRoutes);
  };

  const handleSave = async () => {
    if (!form.routeNumber || !form.routeName) { toast.error('Route Number and Name are required.'); return; }
    if (!sourceResult || !destResult) { toast.error('Select source & destination from the dropdown.'); return; }
    setLoading(true);
    try {
      const payload = {
        routeNumber: form.routeNumber, routeName: form.routeName,
        sourceCity: form.sourceCity, destinationCity: form.destinationCity,
        sourceCoordinates: form._srcCoords || { lat: sourceResult.latitude, lng: sourceResult.longitude },
        destinationCoordinates: form._dstCoords || { lat: destResult.latitude, lng: destResult.longitude },
        polyline: form._polyline || null,
        distance: form._distance || 0, estimatedDuration: form._duration || 0,
      };
      const res = await api.post('/routes', payload);
      if (res.success) {
        toast.success('Route saved!');
        fetchRoutes();
        resetForm();
      }
    } catch (e) { toast.error(e.message || 'Failed to save route'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ routeNumber:'', routeName:'', sourceCity:'', destinationCity:'' });
    setSourceResult(null); setDestResult(null);
    setSourceSearch(''); setDestSearch('');
    setSourceSuggestions([]); setDestSuggestions([]);
    setAvailableRoutes([]); setSelectedRouteIndex(0);
    const map = mbMapRef.current;
    if (map) {
      for (let i = 0; i < 5; i++) {
        if (map.getLayer(`route-${i}`)) map.removeLayer(`route-${i}`);
        if (map.getSource(`route-${i}`)) map.removeSource(`route-${i}`);
      }
    }
  };

  // ── Edit handlers ──
  const startEdit = (route) => {
    setEditingRoute(route);
    setEditForm({ routeName: route.routeName, routeNumber: route.routeNumber });
    setDeleteConfirm(null);
  };

  const cancelEdit = () => setEditingRoute(null);

  const saveEdit = async () => {
    if (!editForm.routeName.trim() || !editForm.routeNumber.trim()) {
      toast.error('Route name and number are required'); return;
    }
    try {
      const res = await api.put(`/routes/${editingRoute._id}`, {
        routeName: editForm.routeName.trim(),
        routeNumber: editForm.routeNumber.trim(),
      });
      if (res.success) {
        toast.success('Route updated!');
        setEditingRoute(null);
        fetchRoutes();
      }
    } catch (e) { toast.error(e.message || 'Failed to update route'); }
  };

  // ── Delete handlers ──
  const confirmDelete = (routeId) => {
    setDeleteConfirm(routeId);
    setEditingRoute(null);
  };

  const executeDelete = async (routeId) => {
    try {
      const res = await api.delete(`/routes/${routeId}`);
      if (res.success) {
        toast.success('Route deleted.');
        setDeleteConfirm(null);
        fetchRoutes();
      }
    } catch (e) { toast.error(e.message || 'Failed to delete route'); }
  };

  const renderSuggestion = (s, onSelect) => {
    const Icon = s.type === 'city' ? MapPin : BusFront;
    const cls  = s.type === 'city' ? 'text-emerald-400' : 'text-amber-400';
    return (
      <button key={s.id} onClick={() => onSelect(s)}
        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 border-b border-white/5 last:border-0">
        <div className="flex items-start gap-3">
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cls}`} />
          <div className="min-w-0">
            <div className="font-medium text-white truncate">{s.name}</div>
            <div className="text-xs text-gray-400 truncate">{s.displayName}</div>
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
          <p className="text-gray-300">Create and manage bus routes using Mapbox routing</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Form */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Route</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Route Number *</label>
                <input type="text" value={form.routeNumber} onChange={e => setForm(f => ({ ...f, routeNumber: e.target.value }))}
                  placeholder="e.g. RT-001"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Route Name *</label>
                <input type="text" value={form.routeName} onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))}
                  placeholder="e.g. Mysuru → Mangaluru"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
              </div>
            </div>

            {/* Source */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-gray-300 text-sm"><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>Source City *</label>
                <button type="button" onClick={() => setMapClickMode(mapClickMode === 'source' ? null : 'source')}
                  className={`text-xs px-2 py-1 rounded-md border transition ${mapClickMode === 'source' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                  {mapClickMode === 'source' ? 'Click on map...' : '📍 Pick on Map'}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input type="text" value={sourceSearch}
                  onChange={e => { setSourceSearch(e.target.value); setSourceResult(null); setForm(f => ({ ...f, sourceCity:'' })); }}
                  placeholder="Search source city or bus stand..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
              </div>
              {sourceSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-slate-800 border border-white/20 rounded-lg mt-1 overflow-hidden shadow-2xl">
                  {sourceSuggestions.map(s => renderSuggestion(s, selectSource))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-gray-300 text-sm"><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Destination City *</label>
                <button type="button" onClick={() => setMapClickMode(mapClickMode === 'dest' ? null : 'dest')}
                  className={`text-xs px-2 py-1 rounded-md border transition ${mapClickMode === 'dest' ? 'bg-red-500 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                  {mapClickMode === 'dest' ? 'Click on map...' : '📍 Pick on Map'}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input type="text" value={destSearch}
                  onChange={e => { setDestSearch(e.target.value); setDestResult(null); setForm(f => ({ ...f, destinationCity:'' })); }}
                  placeholder="Search destination city or bus stand..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500" />
              </div>
              {destSuggestions.length > 0 && (
                <div className="absolute z-50 w-full bg-slate-800 border border-white/20 rounded-lg mt-1 overflow-hidden shadow-2xl">
                  {destSuggestions.map(s => renderSuggestion(s, selectDest))}
                </div>
              )}
            </div>

            {/* Route options */}
            {availableRoutes.length > 1 && (
              <div className="space-y-2">
                <label className="block text-gray-300 text-sm">Select Route Path</label>
                {availableRoutes.map((r, idx) => (
                  <button key={idx} type="button" onClick={() => handleSelectRoute(idx)}
                    className={`w-full p-3 text-left rounded-lg border transition ${selectedRouteIndex === idx ? 'bg-blue-500/20 border-blue-500 text-blue-100' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Option {idx + 1}</span>
                      <span className="text-sm font-semibold">{Math.round(r.distance / 100) / 10} km</span>
                    </div>
                    <div className="text-sm opacity-80 mt-1">ETA: ~{Math.round(r.duration / 60)} mins</div>
                  </button>
                ))}
              </div>
            )}

            {form._distance && availableRoutes.length <= 1 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
                Distance <strong>{form._distance} km</strong> | ETA <strong>~{form._duration} min</strong>
              </div>
            )}

            <button onClick={handleSave} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Route'}
            </button>
          </div>

          {/* Map */}
          <div className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-3 overflow-hidden transition-all ${mapClickMode ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : ''}`} style={{ height:'500px' }}>
            <div ref={mapRef} style={{ width:'100%', height:'100%', borderRadius:'12px', cursor: mapClickMode ? 'crosshair' : 'grab' }}></div>
          </div>
        </div>

        {/* Saved Routes Table */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Saved Routes ({routes.length})</h2>
          {routes.length === 0 ? (
            <p className="text-gray-400">No routes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Number</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Source → Destination</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Distance</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(r => (
                    <tr key={r._id} className="border-b border-white/5 hover:bg-white/5">
                      {/* Inline edit mode */}
                      {editingRoute?._id === r._id ? (
                        <>
                          <td className="py-3 px-4">
                            <input value={editForm.routeNumber} onChange={e => setEditForm(f => ({ ...f, routeNumber: e.target.value }))}
                              className="w-full px-2 py-1 bg-white/10 border border-purple-500 rounded text-white text-sm focus:outline-none" />
                          </td>
                          <td className="py-3 px-4" colSpan={2}>
                            <input value={editForm.routeName} onChange={e => setEditForm(f => ({ ...f, routeName: e.target.value }))}
                              className="w-full px-2 py-1 bg-white/10 border border-purple-500 rounded text-white text-sm focus:outline-none" />
                          </td>
                          <td className="py-3 px-4 text-gray-300">{r.distance ? `${r.distance} km` : '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={saveEdit} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition" title="Save">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1.5 bg-gray-500/20 text-gray-400 rounded hover:bg-gray-500/30 transition" title="Cancel">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : deleteConfirm === r._id ? (
                        <>
                          <td className="py-3 px-4 text-white font-medium">{r.routeNumber}</td>
                          <td className="py-3 px-4" colSpan={2}>
                            <span className="text-red-400 text-sm">Delete "{r.routeName}"? This cannot be undone.</span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{r.distance ? `${r.distance} km` : '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => executeDelete(r._id)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30 transition">
                                Confirm Delete
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-xs hover:bg-gray-500/30 transition">
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-purple-300 font-mono text-sm">{r.routeNumber}</td>
                          <td className="py-3 px-4 text-white font-medium">{r.routeName}</td>
                          <td className="py-3 px-4 text-gray-400 text-sm">{r.sourceCity || '—'} → {r.destinationCity || '—'}</td>
                          <td className="py-3 px-4 text-gray-300">{r.distance ? `${r.distance} km` : '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(r)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition" title="Edit route name / number">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => confirmDelete(r._id)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition" title="Delete route">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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
