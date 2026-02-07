# OnTime - Real-Time Bus Tracking System 🚌

A comprehensive full-stack web application for real-time bus tracking with GPS location sharing, route visualization, ETA prediction, booking system, and role-based dashboards.

![Tech Stack](https://img.shields.io/badge/Stack-MERN-green)
![Real-Time](https://img.shields.io/badge/Real--Time-Socket.IO-blue)
![Maps](https://img.shields.io/badge/Maps-Mapbox-orange)

## ✨ Features

### 🎯 Core Features
- **Real-Time GPS Tracking**: Live bus location updates every 3-5 seconds via WebSocket
- **Interactive Map**: Mapbox-powered map with moving bus markers and route visualization
- **ETA Prediction**: Automatic arrival time calculation based on speed and distance
- **Seat Booking**: Complete booking system with seat selection and digital tickets
- **Role-Based Access**: Separate dashboards for Passengers, Drivers, and Admins

### 👥 User Roles

#### Passenger
- Track buses in real-time on interactive map
- Search and view routes
- Book tickets with seat selection
- View booking history and digital tickets
- Get live ETA updates

#### Driver
- Start/End trips with one click
- Automatic GPS location sharing during trips
- View assigned bus and route details
- Real-time trip status

#### Admin
- Manage buses (CRUD operations)
- Create and manage routes with stops
- Assign drivers to buses
- Monitor all active trips
- View system analytics

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Mapbox GL** - Interactive maps
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **Zustand** - State management
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
OnTime/
├── server/
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Route.js
│   │   ├── Bus.js
│   │   ├── Trip.js
│   │   └── Booking.js
│   ├── controllers/      # Business logic
│   │   ├── authController.js
│   │   ├── routeController.js
│   │   ├── busController.js
│   │   ├── tripController.js
│   │   └── bookingController.js
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   ├── socket/          # Socket.IO handlers
│   └── server.js        # Entry point
│
└── client/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Route pages
    │   ├── config/      # API & Socket config
    │   ├── store/       # Zustand stores
    │   └── App.jsx      # Main app
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier)
- Mapbox account (free tier)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd OnTime
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create `.env` file in `server/` directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ontime
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Get MongoDB Atlas URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and database name

Start the backend server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
```

Create `.env` file in `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

**Get Mapbox Token:**
1. Go to [Mapbox](https://www.mapbox.com/)
2. Sign up for free account
3. Go to Account → Access Tokens
4. Copy your default public token

Start the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📱 Usage Guide

### First Time Setup

1. **Register as Admin**
   - Go to `http://localhost:5173/register`
   - Fill in details and select "Admin" role
   - You'll be redirected to Admin Dashboard

2. **Create Routes**
   - As Admin, create routes with stops
   - Add route name, number, distance, and duration

3. **Add Buses**
   - Create buses with bus numbers and capacity
   - Assign routes to buses

4. **Register Drivers**
   - Create driver accounts
   - As Admin, assign drivers to buses

5. **Test the System**
   - Login as Driver → Start a trip
   - Allow location access in browser
   - Login as Passenger → Track the bus in real-time

### Testing Real-Time Tracking

**Method 1: Two Browser Windows**
1. Window 1: Login as Driver, start trip
2. Window 2: Login as Passenger, go to "Track Bus"
3. Watch the bus marker move in real-time

**Method 2: Mobile + Desktop**
1. Desktop: Login as Driver, start trip
2. Mobile: Login as Passenger, track bus
3. Move around with your phone to see location updates

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/profile      - Get user profile
PUT    /api/auth/profile      - Update profile
```

### Routes
```
GET    /api/routes            - Get all routes
GET    /api/routes/:id        - Get route by ID
POST   /api/routes            - Create route (Admin)
PUT    /api/routes/:id        - Update route (Admin)
DELETE /api/routes/:id        - Delete route (Admin)
```

### Buses
```
GET    /api/buses             - Get all buses
GET    /api/buses/:id         - Get bus by ID
POST   /api/buses             - Create bus (Admin)
PUT    /api/buses/:id         - Update bus (Admin)
PUT    /api/buses/:id/driver  - Assign driver (Admin)
```

### Trips
```
POST   /api/trips/start       - Start trip (Driver)
PUT    /api/trips/:id/end     - End trip (Driver)
GET    /api/trips/active      - Get active trips
GET    /api/trips/my-current  - Get driver's current trip
```

### Bookings
```
POST   /api/bookings          - Create booking
GET    /api/bookings/my       - Get user's bookings
GET    /api/bookings/:id      - Get booking details
PUT    /api/bookings/:id/cancel - Cancel booking
GET    /api/bookings/seats/:tripId - Get available seats
```

## 🔄 Socket.IO Events

### Driver → Server
```javascript
'driver:location-update'  // Send GPS coordinates
'driver:trip-start'       // Notify trip start
'driver:trip-end'         // Notify trip end
```

### Server → Clients
```javascript
'bus:location-updated'    // Broadcast location to all clients
'bus:eta-updated'         // Broadcast ETA updates
'trip:started'            // Notify trip started
'trip:ended'              // Notify trip ended
```

### Client → Server
```javascript
'track:bus'               // Subscribe to bus updates
'untrack:bus'             // Unsubscribe from bus
```

## 🎨 UI Design

The application features a modern **smart-city theme** with:
- Dark gradient backgrounds (slate-900 → purple-900)
- Glassmorphism effects with backdrop blur
- Vibrant purple-pink gradients for CTAs
- Smooth animations and transitions
- Fully responsive design

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control
- API rate limiting
- CORS protection
- Input validation

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check your MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for development)
- Verify connection string format
- Ensure database user has proper permissions

### Mapbox Not Loading
- Verify `VITE_MAPBOX_TOKEN` in `.env`
- Check browser console for errors
- Ensure token has proper permissions

### Socket.IO Not Connecting
- Check if backend is running on port 5000
- Verify `VITE_SOCKET_URL` matches backend URL
- Check browser console for connection errors

### Location Not Sharing
- Allow location access in browser
- Use HTTPS in production (required for geolocation)
- Check browser compatibility

## 📦 Deployment

### Backend (Heroku/Railway)
1. Set environment variables
2. Ensure MongoDB Atlas allows connections from anywhere
3. Update `CLIENT_URL` to production frontend URL

### Frontend (Vercel/Netlify)
1. Set environment variables
2. Update API URLs to production backend
3. Build: `npm run build`

## 🚧 Future Enhancements

- [ ] Push notifications for delays
- [ ] Payment gateway integration
- [ ] QR code ticket scanning
- [ ] Route optimization algorithms
- [ ] Analytics dashboard with charts
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Dark/Light theme toggle

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 👨‍💻 Developer

Built with ❤️ using the MERN stack

---

**Happy Tracking! 🚌✨**
