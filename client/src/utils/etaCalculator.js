// Calculate ETA based on current location, destination, and speed
export const calculateETA = (currentLocation, destinationLocation, currentSpeed) => {
    if (!currentLocation || !destinationLocation) return null;

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        destinationLocation.lat,
        destinationLocation.lng
    );

    // Use current speed or default to 30 km/h
    const speed = currentSpeed || 30;

    // Calculate time in minutes
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    return {
        distance: distance.toFixed(2),
        eta: timeInMinutes,
        etaText: formatETA(timeInMinutes)
    };
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
};

const toRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

const formatETA = (minutes) => {
    if (minutes < 1) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
};
