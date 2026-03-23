# OnTime — Real-Time Bus Tracking & Booking System
## Project Requirements Document
**Version:** 1.0.0 | **Date:** March 2026 | **Status:** Production

---

## 1. Project Overview

**OnTime** is a full-stack web application for real-time bus tracking, e-ticket booking, and fleet management targeted at Karnataka state bus operators and commuters. It provides live GPS tracking via Socket.IO, dynamic fare calculation, QR-coded e-tickets, and role-separated dashboards for passengers, drivers, and administrators.

---

## 2. Technology Stack

### Frontend
| Concern | Technology | Version |
|---|---|---|
| Framework | React | 19.x |
| Build Tool | Vite | 7.x |
| Styling | Tailwind CSS | 3.4.x |
| Routing | React Router DOM | 6.x |
| State Management | Zustand (with persist) | 4.5.x |
| Real-time Client | Socket.IO Client | 4.8.x |
| HTTP Client | Axios | 1.x |
| Map (Track) | Leaflet + React-Leaflet | 1.9.x / 5.x |
| Map (Admin Routes) | Mapbox GL JS | 3.x |
| QR Codes | qrcode | 1.5.x |
| Notifications | react-hot-toast | 2.x |
| Icons | lucide-react | 0.563.x |

### Backend
| Concern | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18 |
| Framework | Express | 4.x |
| Database | MongoDB (Atlas) via Mongoose | 8.x |
| Real-time | Socket.IO Server | 4.8.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Password Hashing | bcryptjs | 2.4.x |
| Rate Limiting | express-rate-limit | 7.x |
| Validation | express-validator | 7.x |
| Environment | dotenv | 16.x |

### External Services
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database hosting |
| Mapbox Geocoding API | Route source/destination search |
| Mapbox Directions API | Route polyline generation + alternates |
| OSRM (router.project-osrm.org) | Stage-to-origin distance calculation |
| OpenStreetMap / Nominatim | Stage map search zoom |

---

## 3. User Roles & Permissions

### 3.1 Passenger
- Self-register (public endpoint, role: `passenger` only)
- Search bus routes by source/destination city
- View active buses on live map
- Book tickets (multi-seat, stage-to-stage fare)
- View booking history with e-ticket download/print
- Receive delay notifications (in-app bell + browser push)
- Update profile (name, phone, password)

### 3.2 Driver
- Self-register (public endpoint, role: `driver` only)
- View assigned bus details
- Start / End trip
- Share live GPS location via browser geolocation (auto on trip start)
- Report delay with minutes + optional reason
- View trip status

### 3.3 Admin
- Created by system administrator only — **cannot self-register**
- Manage routes (create with Mapbox routing, edit name/number, delete)
- Manage stages / bus stops (pin on Leaflet map, OSRM distance auto-calc)
- Add buses (assign route, driver, type, capacity)
- Configure bus type fare rates (₹ per km: Ordinary / Express / AC)
- View full fleet overview with pagination and search
- View active buses and active trips dashboard

---

## 4. Functional Requirements

### 4.1 Authentication & Security
- FR-AUTH-01: Public registration for `passenger` and `driver` roles only
- FR-AUTH-02: Admin role assignment via database/seed only — blocked at both API and UI
- FR-AUTH-03: JWT-based auth, 7-day expiry, stored in localStorage
- FR-AUTH-04: Protected routes redirect unauthenticated users to `/login`
- FR-AUTH-05: Role-based route guards redirect wrong roles to their dashboard
- FR-AUTH-06: Stricter rate limit on `/auth/login` and `/auth/register` (20 req/15 min/IP)
- FR-AUTH-07: Password change requires current password verification; logs user out after change
- FR-AUTH-08: Token expiry triggers auto-logout and redirect to `/login`

### 4.2 Live Bus Tracking
- FR-TRACK-01: TrackBus page shows all `status: active` buses on Leaflet map
- FR-TRACK-02: Bus markers update in real-time via `bus:location-updated` Socket.IO event
- FR-TRACK-03: Selecting a bus flies the map to its current coordinates
- FR-TRACK-04: Route polyline drawn on map (Mapbox GeoJSON preferred, fallback to stops array)
- FR-TRACK-05: ETA calculated client-side using Haversine distance + live GPS speed (m/s → km/h)
- FR-TRACK-06: Buses with no active trip show "No live location yet" indicator
- FR-TRACK-07: Socket disconnect shows persistent toast; reconnect dismisses it and shows success
- FR-TRACK-08: Mobile responsive — sidebar collapses into hamburger drawer overlay
- FR-TRACK-09: Delay banner shown when `trip:delay` event received for selected bus (fixed positioning, above Leaflet z-index)

### 4.3 Trip Management (Driver)
- FR-TRIP-01: Driver can start a trip only when a bus is assigned to their account
- FR-TRIP-02: Starting a trip activates browser geolocation watch, emits `driver:location-update` every position change
- FR-TRIP-03: Location sharing starts only after bus data is confirmed loaded (no null crash)
- FR-TRIP-04: Driver can report delay (1–120 min + optional reason) during active trip
- FR-TRIP-05: Delay persisted to Trip document in DB + broadcast via `trip:delay` Socket.IO to all clients
- FR-TRIP-06: Ending a trip stops geolocation watch, resets trip state, emits `driver:trip-end`
- FR-TRIP-07: Only one active trip per bus at a time (enforced server-side)

### 4.4 Ticket Booking (Passenger)
- FR-BOOK-01: 5-step booking wizard: Route → Bus → Stages → Seats → Confirm
- FR-BOOK-02: Bus list in step 2 filtered by selected `routeId` (server-side filter)
- FR-BOOK-03: Stage list fetched per route; boarding and destination selected independently
- FR-BOOK-04: Fare calculated via API: `distance × pricePerKM` for bus type, rounded to ₹
- FR-BOOK-05: Fare required before seat selection — zero-fare or API error blocks progression
- FR-BOOK-06: Seat grid (47 seats) shows available / booked (from active trip) / selected states
- FR-BOOK-07: Booked seats fetched from active trip via `/bookings/seats/:tripId`
- FR-BOOK-08: Multiple seats bookable in a single transaction
- FR-BOOK-09: Booking created with unique `ticketId` (TKT + timestamp + random suffix)
- FR-BOOK-10: E-ticket displayed on success with real scannable QR code (qrcode library)
- FR-BOOK-11: E-ticket printable via native `window.print()` (no popup-blocked window.open)

### 4.5 Route Management (Admin)
- FR-ROUTE-01: Routes created with Mapbox geocoding search for source and destination
- FR-ROUTE-02: Mapbox Directions API fetches up to 3 route path alternatives; admin selects one
- FR-ROUTE-03: Route polyline stored as GeoJSON string in DB
- FR-ROUTE-04: Route list shows only `isActive: true` routes by default
- FR-ROUTE-05: Route deletion is a hard delete (not soft-delete)
- FR-ROUTE-06: Inline row editing for route name and number in routes table
- FR-ROUTE-07: Delete requires confirmation step in-row

### 4.6 Stage Management (Admin)
- FR-STAGE-01: Stages pinned on Leaflet map by clicking in "pin mode"
- FR-STAGE-02: Each stage has name, order, coordinates, and distance from origin
- FR-STAGE-03: Distance from origin auto-calculated via OSRM routing from route source coordinates
- FR-STAGE-04: Route polyline drawn on Leaflet map when route is selected
- FR-STAGE-05: Nominatim search zooms map to location for easier pinning
- FR-STAGE-06: Stages displayed in order list with delete option

### 4.7 Fleet Management (Admin)
- FR-BUS-01: Buses created with bus number (KA XX F XXXX format), type, capacity, optional route + driver
- FR-BUS-02: Driver search with live filter by name/email
- FR-BUS-03: Route search with live filter by name/number
- FR-BUS-04: Bus list searchable and paginated (10 per page)
- FR-BUS-05: Bus types: Ordinary / Express / AC (matches fare config)

### 4.8 Fare Configuration (Admin)
- FR-FARE-01: Per-km price configurable per bus type (Ordinary, Express, AC)
- FR-FARE-02: Default fares seeded if none exist: Ordinary ₹1.2/km, Express ₹1.5/km, AC ₹2.5/km
- FR-FARE-03: Fare summary table shows sample fares at 40 km, 130 km, 250 km
- FR-FARE-04: Custom bus types addable beyond the 3 defaults
- FR-FARE-05: Fare API rate-limited (30 req/min) and requires authentication

### 4.9 Notifications
- FR-NOTIF-01: Socket.IO connects only when user is authenticated
- FR-NOTIF-02: `trip:delay` events accumulate in notification bell (unread count badge)
- FR-NOTIF-03: Browser push notification fired when tab not focused (Notification API)
- FR-NOTIF-04: Individual notifications dismissible; all-read and clear-all supported
- FR-NOTIF-05: Socket disconnect triggers toast on TrackBus and Admin pages

### 4.10 Profile Management
- FR-PROF-01: All authenticated users can edit name and phone
- FR-PROF-02: Email field is read-only (immutable after registration)
- FR-PROF-03: Password change requires current password, min 6 chars, match confirmation
- FR-PROF-04: Password change logs user out immediately after success

---

## 5. Non-Functional Requirements

### 5.1 Performance
- NFR-PERF-01: GPS location emitted per `watchPosition` callback (browser-controlled, ~3–5s)
- NFR-PERF-02: ETA recalculated on every location update (client-side only, no extra API calls)
- NFR-PERF-03: Mapbox geocoding debounced 500ms to avoid excessive API calls
- NFR-PERF-04: Route list and bus list paginated server-side-friendly (client pagination in v1)
- NFR-PERF-05: MongoDB indexes on: `busNumber`, `status/isOnTrip`, `email`, `routeId/stageOrder`, `status/busId`, `ticketId`

### 5.2 Security
- NFR-SEC-01: Admin role creation blocked at both API and UI layers
- NFR-SEC-02: All booking endpoints require authentication
- NFR-SEC-03: Seat availability endpoint requires authentication
- NFR-SEC-04: Fare calculation requires authentication + per-IP rate limiting
- NFR-SEC-05: Auth endpoints rate-limited (20 req/15 min)
- NFR-SEC-06: Global API rate limit: 200 req/15 min per IP
- NFR-SEC-07: CORS restricted to `CLIENT_URL` environment variable (supports comma-separated list)
- NFR-SEC-08: JWT secret from environment variable, never hardcoded

### 5.3 Reliability
- NFR-REL-01: Socket.IO reconnection: 5 attempts, 1s delay between attempts
- NFR-REL-02: Server graceful shutdown on SIGTERM (closes HTTP + MongoDB connections cleanly)
- NFR-REL-03: MongoDB connection timeout: 5000ms; exits process on failure at startup

### 5.4 Usability
- NFR-USE-01: Mobile responsive — all pages functional on screens ≥ 320px wide
- NFR-USE-02: TrackBus sidebar collapses to hamburger drawer on mobile
- NFR-USE-03: Loading skeleton animations on all data-fetching pages
- NFR-USE-04: EmptyState components with contextual CTAs replace raw "No data" text
- NFR-USE-05: 404 page ("This bus doesn't stop here") for all unmatched routes
- NFR-USE-06: Proper `<title>` and meta description on all pages
- NFR-USE-07: Toast notifications for all async actions (success, error, info)

### 5.5 Maintainability
- NFR-MAINT-01: Tailwind safelist covers all dynamic class patterns used in production builds
- NFR-MAINT-02: Dead code removed (`trackingStore.js` stub documented)
- NFR-MAINT-03: Environment variables documented in `.env.example` for both client and server
- NFR-MAINT-04: `vercel.json` SPA rewrite config included for frontend deployment

---

## 6. API Endpoints Summary

### Auth `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register passenger or driver (admin blocked) |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/profile` | JWT | Get own profile |
| PUT | `/profile` | JWT | Update name, phone |
| PUT | `/profile/password` | JWT | Change password (requires current) |
| GET | `/users?role=` | JWT | List users by role (admin use) |

### Routes `/api/routes`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All active routes |
| GET | `/:id` | Public | Single route |
| POST | `/` | Admin | Create route |
| PUT | `/:id` | Admin | Update route |
| DELETE | `/:id` | Admin | Hard delete route |

### Buses `/api/buses`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/?status=&routeId=` | Public | All buses (filterable) |
| GET | `/:id` | Public | Single bus |
| POST | `/` | Admin | Create bus |
| PUT | `/:id` | Admin | Update bus |
| PUT | `/:id/driver` | Admin | Assign driver |
| PUT | `/:id/location` | Driver | Update location (REST fallback) |

### Trips `/api/trips`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/active` | Public | All in-progress trips |
| POST | `/start` | Driver | Start trip |
| PUT | `/:id/end` | Driver | End trip |
| GET | `/my-current` | Driver | Own current trip |
| POST | `/:id/delay` | Driver | Report delay (broadcasts Socket.IO) |
| GET | `/:id/delay` | JWT | Get trip delay info |
| GET | `/history` | Admin | Trip history |

### Bookings `/api/bookings`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create booking |
| GET | `/my` | JWT | Own bookings |
| GET | `/seats/:tripId` | JWT | Booked seats for a trip |
| GET | `/:id` | JWT | Single booking |
| PUT | `/:id/cancel` | JWT | Cancel booking |

### Stages `/api/stages`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:routeId` | Public | Stages for a route |
| POST | `/` | Admin | Create stage (OSRM distance auto-calc) |
| PUT | `/:id` | Admin | Update stage |
| DELETE | `/:id` | Admin | Delete stage |

### Fares `/api/fare`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/calculate?fromStageId=&toStageId=&busId=` | JWT | Calculate fare |

### Bus Type Fares `/api/bus-types`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All bus type fare rates |
| POST | `/` | Admin | Create fare rate |
| PUT | `/:id` | Admin | Update fare rate |

---

## 7. Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `driver:location-update` | `{ busId, lat, lng, speed }` | Driver GPS update |
| `driver:trip-start` | `{ tripId, busId }` | Trip started notification |
| `driver:trip-end` | `{ tripId, busId }` | Trip ended notification |
| `driver:report-delay` | `{ tripId, busId, delayMinutes, delayReason }` | Delay via socket |
| `track:bus` | `{ busId }` | Subscribe to bus room |
| `untrack:bus` | `{ busId }` | Unsubscribe from bus room |

### Server → Client (broadcast)
| Event | Payload | Description |
|---|---|---|
| `bus:location-updated` | `{ busId, busNumber, location }` | Real-time location update |
| `trip:started` | `{ tripId, busId, timestamp }` | Trip started |
| `trip:ended` | `{ tripId, busId, timestamp }` | Trip ended |
| `trip:delay` | `{ tripId, busId, busNumber, routeName, delayMinutes, delayReason, timestamp }` | Delay alert |
| `bus:eta-updated` | `{ busId, tripId, currentLocation, speed }` | Periodic ETA broadcast (30s) |

---

## 8. Data Models

### User
```
_id, name, email (unique), password (hashed), phone, role (passenger|driver|admin),
isActive, bookingHistory[]
```

### Bus
```
_id, busNumber (unique), routeId → Route, driverId → User,
capacity, currentLocation { coordinates {lat,lng}, timestamp, speed },
status (active|inactive|maintenance), isOnTrip, currentTripId → Trip, busType
```

### Route
```
_id, routeName, routeNumber (unique), sourceCity, destinationCity,
sourceCoordinates {lat,lng}, destinationCoordinates {lat,lng},
polyline (GeoJSON string), stops[], distance, estimatedDuration, isActive
```

### Stage
```
_id, routeId → Route, stageName, latitude, longitude, stageOrder, distanceFromOrigin
```

### Trip
```
_id, busId → Bus, routeId → Route, driverId → User,
startTime, endTime, status (scheduled|in-progress|completed|cancelled),
bookedSeats[], locationHistory[], delayMinutes, delayReason
```

### Booking
```
_id, userId → User, busId → Bus, routeId → Route, tripId → Trip (optional),
seatNumber, seatNumbers[], fromStop, toStop,
bookingDate, travelDate, status (confirmed|cancelled|completed),
paymentStatus (pending|paid|refunded), amount, ticketId (unique), passengerDetails {name, phone}
```

### BusTypeFare
```
_id, busType (unique string), pricePerKM
```

---

## 9. Environment Variables

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=<mapbox_access_token>
```

### Server (`server/.env`)
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/ontime?retryWrites=true&w=majority
JWT_SECRET=<random_secret_min_32_chars>
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 10. Deployment

### Frontend (Vercel)
- Build command: `vite build`
- `vercel.json` SPA rewrite: all routes → `/index.html`
- Environment variables set in Vercel dashboard

### Backend (Railway)
- Start command: `node server.js`
- Health check: `GET /api/health`
- `railway.toml` configured with restart on failure (max 3 retries)
- `CLIENT_URL` set to deployed Vercel URL (comma-separated for staging + production)

---

## 11. Known Limitations (v1.0)

- Payment gateway is simulated — no real payment processing
- Seat booking without an active trip is allowed (booking saved, seat not locked to trip)
- ETA uses straight-line Haversine distance, not road-network routing
- No SMS/email notification delivery — push only works when browser tab is open
- Admin route deletion does not cascade-update buses assigned to that route
- No real-time occupancy pushed to passengers — must refresh seat map
