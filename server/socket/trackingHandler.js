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
