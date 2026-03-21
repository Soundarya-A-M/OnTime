/**
 * Calculate ETA from current GPS location to destination.
 *
 * @param {object} currentLocation  – { lat, lng }  (from bus.currentLocation.coordinates)
 * @param {object} destination      – { lat, lng }
 * @param {number} currentSpeed     – speed in m/s as reported by navigator.geolocation
 *                                    (converted to km/h internally)
 */
export const calculateETA = (currentLocation, destination, currentSpeed) => {
  if (!currentLocation || !destination) return null;

  const distance = calculateDistance(
    currentLocation.lat, currentLocation.lng,
    destination.lat,     destination.lng,
  );

  // navigator.geolocation gives speed in m/s → convert to km/h
  const speedKmh = currentSpeed != null ? currentSpeed * 3.6 : 0;

  // Bus is stationary or GPS speed not yet available
  if (speedKmh < 1) {
    return {
      distance: distance.toFixed(2),
      eta: null,
      etaText: 'Stationary',
      speed: 0,
    };
  }

  const timeInHours = distance / speedKmh;
  const timeInMinutes = Math.round(timeInHours * 60);

  return {
    distance: distance.toFixed(2),
    eta: timeInMinutes,
    etaText: formatETA(timeInMinutes),
    speed: Math.round(speedKmh),
  };
};

// Haversine great-circle distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

const formatETA = (minutes) => {
  if (minutes == null) return 'Stationary';
  if (minutes < 1)     return 'Arriving now';
  if (minutes < 60)    return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins  = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
};
