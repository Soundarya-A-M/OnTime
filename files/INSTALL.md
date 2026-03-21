# OnTime — Implementation Fixes

## Files to copy

### Client-side

| File in this folder | Copy to project path |
|---|---|
| `ETicket.jsx` | `client/src/components/Tickets/ETicket.jsx` *(create folder)* |
| `BookTicket.jsx` | `client/src/pages/User/BookTicket.jsx` *(replace)* |
| `TrackBus.jsx` | `client/src/pages/User/TrackBus.jsx` *(replace)* |
| `UserDashboard.jsx` | `client/src/pages/User/Dashboard.jsx` *(replace)* |
| `LandingPage.jsx` | `client/src/pages/LandingPage.jsx` *(replace)* |

### Server-side

| File in this folder | Copy to project path |
|---|---|
| `bookingController.js` | `server/controllers/bookingController.js` *(replace)* |
| `Booking.js` | `server/models/Booking.js` *(replace)* |

---

## What was fixed / added

### 1. E-Ticket Generation ✅
- New `ETicket.jsx` component with a full printable/downloadable ticket design
- Includes: route details, seat numbers, QR-like code, passenger name, total amount
- "Download / Print" opens a browser print dialog
- Shown automatically after successful booking
- Also accessible from user dashboard "Ticket" button on each booking

### 2. Live ETA on Track Page ✅
- `TrackBus.jsx` now imports and uses `etaCalculator.js`
- ETA panel added to the sidebar showing: time to destination, km remaining, current speed
- ETA updates live on every Socket.IO `bus:location-updated` event
- ETA also shown inside the bus popup on the map

### 3. Route polyline drawn correctly ✅
- `TrackBus.jsx` now parses the saved Mapbox GeoJSON polyline from `route.polyline`
- Falls back to `route.stops[]` if no polyline is saved

### 4. Booked seats shown on seat map ✅
- `BookTicket.jsx` fetches active trips for selected bus and calls `GET /bookings/seats/:tripId`
- Already-booked seats shown in gray and disabled on the seat map

### 5. Booking works without active trip ✅
- `bookingController.js` makes `tripId` optional
- Booking can be created even when no trip is active (for advance booking)
- Multiple seats stored in `seatNumbers[]` array
- `passengerDetails` saved on booking for e-ticket display

### 6. Landing page live search ✅
- `LandingPage.jsx` fetches real routes from `GET /routes`
- Search filters by sourceCity / destinationCity / routeName
- Shows active bus count and live trip status per route
- Results link to the Track page

---

## Quick steps

```bash
# 1. Create the Tickets component folder
mkdir -p client/src/components/Tickets

# 2. Copy all client files (from this folder)
cp ETicket.jsx client/src/components/Tickets/
cp BookTicket.jsx client/src/pages/User/
cp TrackBus.jsx client/src/pages/User/
cp UserDashboard.jsx client/src/pages/User/Dashboard.jsx
cp LandingPage.jsx client/src/pages/

# 3. Copy server files
cp bookingController.js server/controllers/
cp Booking.js server/models/

# 4. Restart server
cd server && npm run dev

# 5. Start client
cd client && npm run dev
```
