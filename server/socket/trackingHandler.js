import Bus from '../models/Bus.js';
import Trip from '../models/Trip.js';

// Store active connections by bus ID
const busConnections = new Map();

export const setupTrackingHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Driver sends location update
        socket.on('driver:location-update', async (data) => {
            try {
                const { busId, lat, lng, speed } = data;

                // Update bus location in database
                const bus = await Bus.findByIdAndUpdate(
                    busId,
                    {
                        currentLocation: {
                            coordinates: { lat, lng },
                            timestamp: new Date(),
                            speed: speed || 0
                        }
                    },
                    { new: true }
                );

                if (!bus) {
                    socket.emit('error', { message: 'Bus not found' });
                    return;
                }

                // Update trip location history if bus is on trip
                if (bus.isOnTrip && bus.currentTripId) {
                    await Trip.findByIdAndUpdate(bus.currentTripId, {
                        $push: {
                            locationHistory: {
                                coordinates: { lat, lng },
                                timestamp: new Date(),
                                speed: speed || 0
                            }
                        }
                    });
                }

                // Broadcast location update to all clients tracking this bus
                io.emit('bus:location-updated', {
                    busId,
                    busNumber: bus.busNumber,
                    location: {
                        lat,
                        lng,
                        speed,
                        timestamp: new Date()
                    }
                });

                // Auto-advance Stage Tracking if GPS Mode is active
                if (bus.isOnTrip && bus.currentTripId) {
                    const trip = await Trip.findById(bus.currentTripId).populate('routeId');
                    if (trip && trip.trackingMode === 'gps' && trip.routeId?.stops?.length > 0) {
                        const routeStages = trip.routeId.stops;
                        // Determine current stage index based on id or name
                        let currentIdx = routeStages.findIndex(s => s.stageName === trip.currentStageName);
                        if (currentIdx === -1) currentIdx = 0; // Default if not found

                        // Only proceed if not at the very last stage
                        if (currentIdx < routeStages.length - 1) {
                            const nextStage = routeStages[currentIdx + 1];
                            const nextLat = nextStage.coordinates?.lat || nextStage.latitude;
                            const nextLng = nextStage.coordinates?.lng || nextStage.longitude;

                            if (nextLat && nextLng) {
                                // Haversine formula for distance in meters
                                const R = 6371000; 
                                const dLat = (nextLat - lat) * Math.PI / 180;
                                const dLng = (nextLng - lng) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                                          Math.cos(lat * Math.PI / 180) * Math.cos(nextLat * Math.PI / 180) *
                                          Math.sin(dLng / 2) * Math.sin(dLng / 2);
                                const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                                // If bus is within 300 meters of the next stage
                                if (distance <= 300) {
                                    trip.currentStageId = nextStage._id;
                                    trip.currentStageName = nextStage.stageName;
                                    trip.currentStageCoords = { lat: nextLat, lng: nextLng };

                                    // Process drop-offs
                                    let dropoffCount = 0;
                                    trip.passengerDropoffs = trip.passengerDropoffs.filter(dropInfo => {
                                        // Assume index as stageOrder for fallback
                                        if (dropInfo.stageName === nextStage.stageName || dropInfo.stageOrder <= (currentIdx + 1)) {
                                            dropoffCount += dropInfo.count;
                                            return false;
                                        }
                                        return true;
                                    });

                                    if (dropoffCount > 0) {
                                        trip.currentPassengers = Math.max(0, (trip.currentPassengers || 0) - dropoffCount);
                                    }

                                    await trip.save();

                                    io.emit('bus:stage-updated', {
                                        tripId: trip._id,
                                        busId: trip.busId,
                                        stageName: nextStage.stageName,
                                        stageOrder: currentIdx + 1,
                                        lat: nextLat,
                                        lng: nextLng,
                                        currentPassengers: trip.currentPassengers,
                                        passengerDropoffs: trip.passengerDropoffs,
                                        timestamp: new Date()
                                    });
                                    console.log(`[Auto-Advance] Bus ${bus.busNumber} arrived at ${nextStage.stageName}`);
                                }
                            }
                        }
                    }
                }

                console.log(`Location updated for bus ${bus.busNumber}: ${lat}, ${lng}`);
            } catch (error) {
                console.error('Location update error:', error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });

        // Driver starts trip
        socket.on('driver:trip-start', async (data) => {
            try {
                const { tripId, busId } = data;

                // Broadcast trip start
                io.emit('trip:started', {
                    tripId,
                    busId,
                    timestamp: new Date()
                });

                console.log(`Trip started: ${tripId}`);
            } catch (error) {
                console.error('Trip start error:', error);
            }
        });

        // Driver ends trip
        socket.on('driver:trip-end', async (data) => {
            try {
                const { tripId, busId } = data;

                // Broadcast trip end
                io.emit('trip:ended', {
                    tripId,
                    busId,
                    timestamp: new Date()
                });

                console.log(`Trip ended: ${tripId}`);
            } catch (error) {
                console.error('Trip end error:', error);
            }
        });

        // Driver reports a delay via socket
        socket.on('driver:report-delay', async (data) => {
            try {
                const { tripId, busId, busNumber, routeName, delayMinutes, delayReason } = data;

                // Update trip delay in DB
                await Trip.findByIdAndUpdate(tripId, { delayMinutes, delayReason });

                // Broadcast delay to all clients
                io.emit('trip:delay', {
                    tripId,
                    busId,
                    busNumber,
                    routeName,
                    delayMinutes,
                    delayReason: delayReason || '',
                    timestamp: new Date()
                });

                console.log(`🚨 Driver reported delay for trip ${tripId}: ${delayMinutes} min`);
            } catch (error) {
                console.error('Report delay (socket) error:', error);
            }
        });

        // Client subscribes to track a specific bus
        socket.on('track:bus', (data) => {
            const { busId } = data;
            socket.join(`bus-${busId}`);

            // Store connection
            if (!busConnections.has(busId)) {
                busConnections.set(busId, new Set());
            }
            busConnections.get(busId).add(socket.id);

            console.log(`Client ${socket.id} tracking bus ${busId}`);
        });

        // Client unsubscribes from tracking a bus
        socket.on('untrack:bus', (data) => {
            const { busId } = data;
            socket.leave(`bus-${busId}`);

            // Remove connection
            if (busConnections.has(busId)) {
                busConnections.get(busId).delete(socket.id);
                if (busConnections.get(busId).size === 0) {
                    busConnections.delete(busId);
                }
            }

            console.log(`Client ${socket.id} stopped tracking bus ${busId}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            // Clean up all bus connections for this socket
            busConnections.forEach((connections, busId) => {
                connections.delete(socket.id);
                if (connections.size === 0) {
                    busConnections.delete(busId);
                }
            });

            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    // Periodic ETA calculation (every 30 seconds)
    setInterval(async () => {
        try {
            const activeTrips = await Trip.find({ status: 'in-progress' })
                .populate('busId')
                .populate('routeId');

            for (const trip of activeTrips) {
                if (trip.busId && trip.busId.currentLocation) {
                    // Simple ETA calculation (can be enhanced with real routing APIs)
                    const currentLoc = trip.busId.currentLocation.coordinates;
                    const speed = trip.busId.currentLocation.speed || 30; // Default 30 km/h

                    // Broadcast ETA update
                    io.emit('bus:eta-updated', {
                        busId: trip.busId._id,
                        tripId: trip._id,
                        currentLocation: currentLoc,
                        speed,
                        timestamp: new Date()
                    });
                }
            }
        } catch (error) {
            console.warn('⚠️ ETA calculation skipped — DB unreachable:', error.message);
        }
    }, 30000); // Every 30 seconds
};
