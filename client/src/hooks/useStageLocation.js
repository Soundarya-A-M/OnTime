import { useState, useEffect, useRef } from 'react';
import socket from '../config/socket';
import api from '../config/api';

export const useStageLocation = (buses) => {
    const [stageLocations, setStageLocations] = useState({});
    const fetchedTrips = useRef(new Set());

    // Fetch existing stage for each bus that has an active trip
    useEffect(() => {
        const fetchCurrent = async () => {
            for (const bus of buses) {
                if (!bus.currentTripId || fetchedTrips.current.has(bus._id)) continue;
                fetchedTrips.current.add(bus._id);
                try {
                    const res = await api.get(`/trips/${bus.currentTripId}/current-stage`);
                    if (res.success && res.data.currentStageName) {
                        setStageLocations(prev => ({
                            ...prev,
                            [bus._id]: {
                                stageName: res.data.currentStageName,
                                lat: res.data.currentStageCoords?.lat,
                                lng: res.data.currentStageCoords?.lng,
                            }
                        }));
                    }
                } catch { /* bus has no stage yet */ }
            }
        };
        if (buses.length > 0) fetchCurrent();
    }, [buses]);

    // Real-time updates
    useEffect(() => {
        const handler = (data) => {
            if (!data.busId) return;
            setStageLocations(prev => ({
                ...prev,
                [data.busId]: {
                    stageName: data.stageName,
                    lat: data.lat,
                    lng: data.lng,
                }
            }));
        };
        socket.on('bus:stage-updated', handler);
        return () => socket.off('bus:stage-updated', handler);
    }, []);

    return stageLocations;
};
