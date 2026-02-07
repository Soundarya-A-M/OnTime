import { useEffect, useState, useRef } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Bus, Navigation } from 'lucide-react';
import socket from '../../config/socket';
import api from '../../config/api';
import toast from 'react-hot-toast';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN=import.meta.env.VITE_MAPBOX_TOKEN;

const TrackBus=() => {
    const [viewport, setViewport]=useState({
        latitude: 12.9716,
        longitude: 77.5946,
        zoom: 12
    });
    const [buses, setBuses]=useState([]);
    const [selectedBus, setSelectedBus]=useState(null);
    const [loading, setLoading]=useState(true);

    useEffect(() => {
        fetchActiveBuses();
        setupSocketListeners();

        return () => {
            socket.off('bus:location-updated');
        };
    }, []);

    const fetchActiveBuses=async () => {
        try {
            const response=await api.get('/buses?status=active');
            if (response.success) {
                setBuses(response.data.buses);
            }
        } catch (error) {
            toast.error('Failed to fetch buses');
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners=() => {
        // Connect socket
        if (!socket.connected) {
            socket.connect();
        }

        // Listen for location updates
        socket.on('bus:location-updated', (data) => {
            setBuses((prevBuses) =>
                prevBuses.map((bus) =>
                    bus._id === data.busId
                        ? {
                            ...bus,
                            currentLocation: {
                                coordinates: data.location,
                                timestamp: data.location.timestamp
                            }
                        }
                        : bus
                )
            );
        });
    };

    const handleBusClick=(bus) => {
        setSelectedBus(bus);
        setViewport({
            ...viewport,
            latitude: bus.currentLocation?.coordinates?.lat || viewport.latitude,
            longitude: bus.currentLocation?.coordinates?.lng || viewport.longitude,
            zoom: 14
        });
    };

    return (
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
<div className="h-[calc(100vh-5rem)] flex">
{/* Sidebar */ }
<div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 p-6 overflow-y-auto">
<h2 className="text-2xl font-bold text-white mb-6">Active Buses< / h2>

{
    loading ? (
    <div className="text-gray-300">Loading buses...< / div>
          ) : buses.length === 0 ? (
    <div className="text-gray-300">No active buses< / div>
          ) : (
    <div className="space-y-3">
    {
        buses.map((bus) =>(
            <div
                  key={ bus._id }
                  onClick={() => handleBusClick(bus)}
    className={`bg-white/10 border rounded-lg p-4 cursor-pointer hover:bg-white/20 transition ${selectedBus?._id === bus._id ? 'border-purple-500' : 'border-white/10'
        }`
} >
<div className="flex items-start justify-between">
<div>
<div className="flex items-center space-x-2">
<Bus className="w-5 h-5 text-purple-400" />
<h3 className="text-white font-semibold">{ bus.busNumber } < / h3>
< / div>
<p className="text-gray-300 text-sm mt-1">
{ bus.routeId?.routeName || 'No route assigned' }
< / p>
{
    bus.currentLocation?.coordinates && (
    <p className="text-gray-400 text-xs mt-2">
    Speed: { bus.currentLocation.speed || 0 } km / h
    < / p>
                      )
}
< / div>
<span className={`px-2 py-1 rounded-full text-xs ${bus.isOnTrip ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
    }`}>
{ bus.isOnTrip ? 'On Trip' : 'Idle' }
< / span>
< / div>
< / div>
              ))}
< / div>
          )}
< / div>

{/* Map */ }
<div className="flex-1 relative">
{
    MAPBOX_TOKEN ? (
    <Map
    {...viewport }
    onMove={(evt) => setViewport(evt.viewState)
}
mapStyle="mapbox://styles/mapbox/dark-v11"
mapboxAccessToken={ MAPBOX_TOKEN }
style={{ width: '100%', height: '100%' }}>
{
    buses.map((bus) => {
        const coords=bus.currentLocation?.coordinates;
        if(!coords?.lat || !coords?.lng) return null;

    return (
    <Marker
    key={ bus._id }
    latitude={ coords.lat }
    longitude={ coords.lng }
    onClick={() => handleBusClick(bus)
} >
<div className="relative cursor-pointer group">
<div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition">
<Bus className="w-5 h-5 text-white" />
< / div>
{/* Tooltip */ }
<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
{ bus.busNumber }
< / div>
< / div>
< / Marker>
                );
              })}
< / Map>
          ) : (
<div className="flex items-center justify-center h-full bg-slate-800">
<div className="text-center">
<p className="text-white text-xl mb-2">Mapbox Token Required< / p>
<p className="text-gray-400">
                  Please add VITE_MAPBOX_TOKEN to your.env file
< / p>
<a
href="https://www.mapbox.com/"
target="_blank"
rel="noopener noreferrer"
className="inline-block mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
                  Get Free Token
< / a>
< / div>
< / div>
          )}
< / div>
< / div>
< / div>
  );
};

export default TrackBus;
