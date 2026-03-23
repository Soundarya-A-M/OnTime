# 🚌 OnTime — Real-Time Bus Tracking & Ticket Booking System

> **A complete digital platform for Karnataka state bus services — track live bus locations, book tickets, and manage entire bus fleet operations from one unified system.**

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [How the System Works](#3-how-the-system-works)
4. [Who Uses OnTime?](#4-who-uses-ontime)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Installation & Setup Guide](#7-installation--setup-guide)
8. [Running the Project](#8-running-the-project)
9. [User Guide](#9-user-guide)
10. [API Reference](#10-api-reference)
11. [Real-Time Features Explained](#11-real-time-features-explained)
12. [Project File Structure](#12-project-file-structure)
13. [Deployment](#13-deployment)
14. [Test Credentials](#14-test-credentials)
15. [Frequently Asked Questions](#15-frequently-asked-questions)

---

## 1. Project Overview

**OnTime** is a full-stack web application built to modernize the Karnataka State Road Transport Corporation (KSRTC) bus experience. It solves a very common daily problem: *"Where is my bus, and when will it arrive?"*

The system provides:

- **Live GPS tracking** of buses on an interactive map
- **Online ticket booking** with digital e-tickets and QR codes
- **Driver tools** including an Electronic Ticket Machine (ETM) and live location sharing
- **Admin control panel** for managing routes, buses, drivers, and fare pricing
- **Instant delay alerts** pushed to passengers the moment a driver reports a delay

The application is designed for **three types of users** — passengers, drivers, and administrators — each with their own dedicated dashboard and tools.

---

## 2. Key Features

### 🗺️ For Passengers

| Feature | Description |
|---|---|
| **Live Bus Tracking** | See exactly where every active bus is on a map, updated every few seconds |
| **ETA Calculation** | Know how many minutes until the bus reaches its destination, based on live speed |
| **Stage-Based Location** | Even when GPS isn't active, see the last confirmed bus stop the bus passed |
| **Online Ticket Booking** | Book seats in 5 easy steps with stage selection and automatic fare calculation |
| **Digital E-Ticket** | Download or print a PDF ticket with a QR code for conductor verification |
| **Delay Notifications** | Receive instant pop-up alerts when a bus on your route is delayed |
| **Booking History** | View all past and upcoming bookings with ticket details |
| **Route Search** | Search for buses between cities from the home page |

### 🚍 For Drivers

| Feature | Description |
|---|---|
| **Trip Control** | Start and end trips with one click; location sharing begins automatically |
| **Live Location Sharing** | GPS coordinates are shared in real-time with all passengers tracking the bus |
| **Delay Reporting** | Report delays with reason — all passengers are notified instantly |
| **Electronic Ticket Machine (ETM)** | Issue walk-in tickets on the bus, select boarding/destination stages, and collect fares |
| **Stage Tracking** | The system tracks which stop the bus is currently at |

### 🛠️ For Administrators

| Feature | Description |
|---|---|
| **Route Management** | Create bus routes visually on a Mapbox map with automatic distance calculation |
| **Stage (Bus Stop) Editor** | Pin bus stops on a Leaflet map; distances from origin are auto-calculated via OSRM |
| **Bus Fleet Management** | Add buses, assign drivers, set bus type (Ordinary / Express / AC) |
| **Crew Management** | Register driver accounts, edit details, activate/deactivate access |
| **Fare Configuration** | Set price per kilometer for each bus type; fares calculate automatically |
| **Live Dashboard** | Monitor total buses, active trips, and fleet status at a glance |

---

## 3. How the System Works

### 🔄 The Journey of a Passenger

```
1. Passenger opens OnTime → Searches for a bus route
2. Logs in → Goes to "Track Bus" → Sees live map with bus positions
3. Clicks "Book Ticket" → Selects route → Selects bus → Picks boarding & destination stop
4. System calculates fare automatically → Selects seat → Confirms booking
5. Digital e-ticket generated with QR code → Can download as PDF
6. If bus is delayed, passenger receives instant notification on screen
```

### 🚌 The Journey of a Driver

```
1. Driver logs in → Goes to Driver Dashboard
2. Clicks "Start Trip" → GPS location sharing begins automatically
3. Passengers can now see the bus moving on the map in real-time
4. Driver can switch to "ETM" tab → Issue tickets to walk-in passengers on the bus
5. If there's a delay → Driver fills in delay minutes + reason → All passengers notified instantly
6. At end of route → Clicks "End Trip" → Location sharing stops
```

### 📡 How Real-Time Works (Simply Explained)

Think of it like a group chat. When the driver's phone sends a GPS location, it's like sending a message to a server. The server immediately forwards that message to everyone who is watching the map. This happens every few seconds using a technology called **Socket.IO** (like WhatsApp, but for location data).

---

## 4. Who Uses OnTime?

### 👤 Passenger (Public User)
- Can **register** freely from the website
- Can track buses, book tickets, view booking history
- Gets delay alerts for buses they're tracking

### 🚗 Driver
- Account is **created by the Admin** (not self-registered, for security)
- Has their own dashboard to manage trips and issue ETM tickets

### 👨‍💼 Admin
- Full control over the entire system
- Creates routes, adds buses, assigns drivers, configures fares
- Cannot be self-registered — created by seeding the database

---

## 5. Technology Stack

### Frontend (What you see in the browser)

| Technology | Purpose |
|---|---|
| **React 19** | Building the user interface |
| **Vite** | Fast development build tool |
| **Tailwind CSS** | Styling and responsive design |
| **React Leaflet** | Interactive map for bus tracking |
| **Mapbox GL JS** | Advanced map for route creation by admins |
| **Socket.IO Client** | Receiving real-time location updates |
| **Zustand** | Storing login/auth state in the browser |
| **Axios** | Making API calls to the backend |
| **jsPDF + html2canvas** | Generating downloadable PDF tickets |
| **QRCode** | Generating QR codes on e-tickets |
| **React Hot Toast** | Showing notification pop-ups |

### Backend (The server that powers everything)

| Technology | Purpose |
|---|---|
| **Node.js + Express** | Web server and REST API |
| **MongoDB + Mongoose** | Database for storing all data |
| **Socket.IO** | Real-time two-way communication |
| **JWT (JSON Web Tokens)** | Secure user authentication |
| **bcryptjs** | Encrypting passwords |
| **OSRM** | Calculating road distances for bus stages |
| **express-rate-limit** | Preventing abuse/spam |

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│   │  Passenger  │  │   Driver    │  │   Admin Dashboard    │  │
│   │  Dashboard  │  │  Dashboard  │  │  Routes / Buses /    │  │
│   │  Map/Track  │  │  ETM Panel  │  │  Crew / Fares        │  │
│   └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘  │
│          │                │                     │              │
│          ▼                ▼                     ▼              │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │              React Frontend (Vite + Tailwind)            │ │
│   │         REST API calls (Axios) + Socket.IO Client        │ │
│   └──────────────────────────┬───────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                               │  HTTP + WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (Node.js)                   │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│   │  REST API    │  │  Socket.IO   │  │   Auth Middleware  │   │
│   │  /api/auth   │  │  Server      │  │   JWT Validation   │   │
│   │  /api/buses  │  │              │  │   Role Checks      │   │
│   │  /api/trips  │  │  Real-time   │  │   Rate Limiting    │   │
│   │  /api/routes │  │  location    │  └───────────────────┘   │
│   │  /api/stages │  │  updates     │                           │
│   │  /api/fare   │  │  delay alerts│                           │
│   │  /api/booking│  └──────────────┘                           │
│   └──────────────┘                                             │
│                               │                                │
└───────────────────────────────┼────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                            │
│                                                                 │
│  Users │ Routes │ Buses │ Trips │ Bookings │ Stages │ Fares    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow for Live Bus Tracking

```
Driver's Phone GPS
       │
       ▼
Socket.IO Event: "driver:location-update"
       │
       ▼
Server receives → Updates bus in MongoDB → Broadcasts to ALL clients
       │
       ▼
Every passenger watching the map gets: "bus:location-updated"
       │
       ▼
Map marker moves in real-time on their screen
```

---

## 7. Installation & Setup Guide

### ✅ Prerequisites (What you need installed first)

Before you start, make sure you have the following installed on your computer:

1. **Node.js** (version 20 or higher)  
   Download from: https://nodejs.org  
   To check: open a terminal and type `node --version`

2. **npm** (comes with Node.js automatically)  
   To check: type `npm --version`

3. **MongoDB Atlas account** (free cloud database)  
   Sign up at: https://www.mongodb.com/cloud/atlas  
   *(You can also use a local MongoDB installation)*

4. **Mapbox Account** (free tier)  
   Sign up at: https://www.mapbox.com  
   You'll need a **Mapbox Access Token** for the route creation map

5. **Git** (to clone the project)  
   Download from: https://git-scm.com

---

### 📥 Step 1: Download the Project

Open your terminal (Command Prompt / Terminal) and run:

```bash
git clone <your-repository-url>
cd ontime
```

You will see two main folders:
- `client/` — the frontend (React app)
- `server/` — the backend (Node.js API)

---

### 🗄️ Step 2: Set Up the Database (MongoDB Atlas)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new **free cluster**
3. Go to **Database Access** → Add a database user (remember the username and password)
4. Go to **Network Access** → Add IP Address → Allow Access from Anywhere (`0.0.0.0/0`)
5. Go to your cluster → **Connect** → **Connect your application**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ontime
   ```
   Replace `<password>` with your actual password.

---

### ⚙️ Step 3: Configure the Backend

Navigate to the server folder:

```bash
cd server
```

Create a file named `.env` (copy from the example):

```bash
cp .env.example .env
```

Open the `.env` file and fill in your values:

```env
# Your MongoDB connection string from Step 2
MONGODB_URI=mongodb+srv://yourUsername:yourPassword@cluster0.xxxxx.mongodb.net/ontime

# A secret key for JWT tokens — make this long and random
JWT_SECRET=my-super-secret-key-change-this-in-production-12345

# Server port
PORT=5000

# The URL where your frontend runs (for CORS)
CLIENT_URL=http://localhost:5173

# Set to development for local testing
NODE_ENV=development
```

---

### 🎨 Step 4: Configure the Frontend

Navigate to the client folder:

```bash
cd ../client
```

Create a file named `.env` (copy from the example):

```bash
cp .env.example .env
```

Open the `.env` file and fill in your values:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Backend Socket.IO URL
VITE_SOCKET_URL=http://localhost:5000

# Your Mapbox token (for route creation in Admin panel)
# Get this from https://www.mapbox.com → Account → Access Tokens
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...
```

> **Note:** The Mapbox token is only needed for the Admin's "Route Management" feature. All other features (tracking, booking, etc.) work without it.

---

### 📦 Step 5: Install Dependencies

**Install backend dependencies:**

```bash
cd server
npm install
```

**Install frontend dependencies:**

```bash
cd ../client
npm install
```

---

### 🌱 Step 6: Seed the Database (Create Initial Data)

This step creates the admin account and some sample data so you can test the system:

```bash
cd server
node seed_admin.js
```

This creates the admin user with:
- **Email:** `admin@ontime.com`
- **Password:** `password`

Alternatively, to create a full set of sample data (routes, buses, drivers):

```bash
node seed.js
```

---

## 8. Running the Project

You need to run **two servers** at the same time — open two terminal windows.

### Terminal 1 — Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📡 Socket.IO ready for real-time tracking
```

### Terminal 2 — Start the Frontend

```bash
cd client
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 🌐 Open the App

Open your browser and go to: **http://localhost:5173**

You should see the OnTime landing page! 🎉

---

## 9. User Guide

### 🔐 Creating Accounts

**Passengers** can register by clicking "Get Started" on the home page.

**Drivers** must be created by an admin:
1. Log in as admin
2. Go to **Crew Management**
3. Click **Add Crew Member**
4. Fill in the driver's name, email, and password

### 🗺️ How to Track a Bus (Passenger)

1. Log in as a passenger
2. Click **Track Bus** in the navigation bar
3. You'll see a map of all active buses
4. Click on any bus in the left sidebar to select it
5. The map will center on that bus and show its route (purple dashed line)
6. The ETA panel shows minutes remaining to destination
7. If the bus is delayed, a yellow banner appears at the top of the screen

### 🎫 How to Book a Ticket (Passenger)

1. Log in as a passenger
2. Click **Book Ticket** in the navigation bar
3. **Step 1 — Select Route:** Choose your route from the list
4. **Step 2 — Select Bus:** Choose from available buses on that route
5. **Step 3 — Select Stages:** Pick your boarding stop and destination stop
   - The fare is automatically calculated based on distance and bus type
6. **Step 4 — Select Seats:** Click on green seats to select them (grey = booked)
7. **Step 5 — Confirm:** Enter your name, phone number, and travel date
8. Click **"Pay & Get Ticket"**
9. Your e-ticket opens with a QR code — click **Download** to save as PDF

### 🚌 How a Driver Starts a Trip

1. Log in as a driver
2. Go to **Driver Dashboard**
3. You'll see your assigned bus details
4. Click the green **"Start Trip"** button
5. Your browser will ask permission to access your location — click **Allow**
6. Your live location is now being shared with all passengers!
7. To report a delay: fill in the minutes and reason → click **"Send Delay Alert"**
8. When done: click the red **"End Trip"** button

### 🎫 How a Driver Issues a Ticket on the Bus (ETM)

1. Log in as a driver and start a trip
2. Click the **"ETM — Issue Tickets"** tab
3. Select the **Boarding Stage** from the dropdown
4. Select the **Destination Stage**
5. The fare appears automatically
6. (Optional) Enter passenger name and phone
7. Click **"Issue Ticket"**
8. A confirmation appears with the ticket ID

### 🛤️ How an Admin Creates a Route

1. Log in as admin
2. Go to **Admin Dashboard** → Click **"Route Management"**
3. Enter a Route Number (e.g., RT-001) and Route Name
4. In the **Source** field, type a city name — suggestions will appear
5. Select the source from the dropdown — a blue pin appears on the map
6. Do the same for the **Destination** — a red pin appears
7. The system automatically draws the route on the map and calculates distance
8. If multiple road options appear, you can choose the preferred one
9. Click **"Save Route"**

### 📍 How an Admin Adds Bus Stops (Stages)

1. Go to **Admin Dashboard** → Click **"Stage Editor"**
2. Select a route from the left panel
3. The route line appears on the map
4. Click **"Enable Pin Mode"**
5. Click anywhere on the map to drop a pin at a bus stop location
6. Enter the stop name and its order number (0 = first stop)
7. Click **"Save Stage"** — distance from origin is automatically calculated

---

## 10. API Reference

All API endpoints begin with `/api/`. Authentication is done via a **Bearer Token** in the request header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new passenger account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT token |
| GET | `/api/auth/profile` | Authenticated | Get current user's profile |
| PUT | `/api/auth/profile` | Authenticated | Update name and phone number |
| PUT | `/api/auth/profile/password` | Authenticated | Change password |
| GET | `/api/auth/crew` | Admin only | List all drivers |
| POST | `/api/auth/crew` | Admin only | Create a new driver account |
| PUT | `/api/auth/crew/:id` | Admin only | Update a driver's details |
| DELETE | `/api/auth/crew/:id` | Admin only | Deactivate a driver |

### Bus Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/buses` | Public | Get all buses (supports `?status=active`, `?routeId=`) |
| GET | `/api/buses/:id` | Public | Get a specific bus by ID |
| POST | `/api/buses` | Admin only | Add a new bus to the fleet |
| PUT | `/api/buses/:id` | Admin only | Update bus details |
| PUT | `/api/buses/:id/driver` | Admin only | Assign a driver to a bus |

### Route Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/routes` | Public | Get all active routes |
| GET | `/api/routes/:id` | Public | Get a specific route |
| POST | `/api/routes` | Admin only | Create a new route |
| PUT | `/api/routes/:id` | Admin only | Update a route |
| DELETE | `/api/routes/:id` | Admin only | Delete a route |

### Stage (Bus Stop) Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/stages/:routeId` | Public | Get all stops for a route |
| POST | `/api/stages` | Admin only | Add a new stop |
| PUT | `/api/stages/:id` | Admin only | Update a stop |
| DELETE | `/api/stages/:id` | Admin only | Delete a stop |

### Trip Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/trips/active` | Public | Get all currently active trips |
| POST | `/api/trips/start` | Driver only | Start a new trip |
| PUT | `/api/trips/:id/end` | Driver only | End a trip |
| GET | `/api/trips/my-current` | Driver only | Get driver's current active trip |
| POST | `/api/trips/:id/delay` | Driver only | Report a delay |
| POST | `/api/trips/:id/etm-ticket` | Driver only | Issue an on-bus ticket |
| GET | `/api/trips/:id/current-stage` | Public | Get bus's current stop |

### Booking Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/bookings` | Passenger | Book a ticket |
| GET | `/api/bookings/my` | Passenger | Get all my bookings |
| GET | `/api/bookings/:id` | Passenger/Admin | Get a specific booking |
| PUT | `/api/bookings/:id/cancel` | Passenger | Cancel a booking |
| GET | `/api/bookings/seats/:tripId` | Authenticated | Get booked seats for a trip |

### Fare Endpoint

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/fare/calculate` | Authenticated | Calculate fare between two stops |

**Query parameters:** `?fromStageId=&toStageId=&busId=`

### Bus Type Fare Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/bus-types` | Public | Get all fare rates (per km per bus type) |
| POST | `/api/bus-types` | Admin only | Add a new bus type fare |
| PUT | `/api/bus-types/:id` | Admin only | Update a fare rate |

---

## 11. Real-Time Features Explained

### How Socket.IO is Used

The application uses **Socket.IO** — a library that enables instant, two-way communication between the browser and the server. Think of it as a permanent phone line that stays open.

### Events the Server Listens For (from drivers)

| Event Name | Who sends it | What it does |
|---|---|---|
| `driver:location-update` | Driver's browser | Receives GPS coordinates, updates database, broadcasts to all |
| `driver:trip-start` | Driver's browser | Notifies all that a trip has started |
| `driver:trip-end` | Driver's browser | Notifies all that a trip has ended |
| `driver:report-delay` | Driver's browser | Alternative way to report delays via socket |

### Events the Server Broadcasts (to passengers)

| Event Name | Who receives it | What happens |
|---|---|---|
| `bus:location-updated` | All connected clients | Map marker moves to new position |
| `trip:started` | All connected clients | Trip is now active |
| `trip:ended` | All connected clients | Trip has concluded |
| `trip:delay` | All connected clients | Delay banner appears on TrackBus page + notification bell |
| `bus:stage-updated` | All connected clients | Stage marker updates on the map |

### Delay Notification System

When a driver clicks "Send Delay Alert":
1. A REST API call is made to `POST /api/trips/:id/delay`
2. The server saves the delay to the database
3. The server broadcasts a `trip:delay` event to ALL connected clients
4. Every passenger's browser receives this event
5. If they're on the TrackBus page, an amber banner appears at the top
6. The notification bell in the navbar shows a new unread notification
7. If browser notifications are enabled, a desktop notification also appears

---

## 12. Project File Structure

```
ontime/
│
├── client/                         # Frontend React Application
│   ├── public/                     # Static assets (images, icons)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ETM/                # Electronic Ticket Machine component
│   │   │   ├── Layout/             # Navbar, ProtectedRoute
│   │   │   ├── Map/                # Bus markers on the map
│   │   │   ├── Notifications/      # Delay banner, notification bell
│   │   │   ├── Tickets/            # E-ticket display component
│   │   │   └── UI/                 # Skeleton loaders, spinners
│   │   │
│   │   ├── config/
│   │   │   ├── api.js              # Axios setup with auth token
│   │   │   └── socket.js           # Socket.IO client setup
│   │   │
│   │   ├── hooks/
│   │   │   ├── useNotifications.js # Manages delay notification state
│   │   │   └── useStageLocation.js # Tracks real-time stage updates
│   │   │
│   │   ├── pages/
│   │   │   ├── Admin/              # Admin dashboard and management pages
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── RouteManagement.jsx   # Mapbox-powered route creator
│   │   │   │   ├── StageManagement.jsx   # Leaflet-based stop editor
│   │   │   │   ├── BusTypeFareManagement.jsx
│   │   │   │   ├── AddBus.jsx
│   │   │   │   └── CrewManagement.jsx
│   │   │   │
│   │   │   ├── Auth/               # Login and Register pages
│   │   │   ├── Driver/             # Driver dashboard + ETM
│   │   │   ├── User/               # Passenger dashboard, track, book
│   │   │   ├── LandingPage.jsx     # Home page with route search
│   │   │   ├── Profile.jsx         # User profile settings
│   │   │   └── NotFound.jsx        # 404 page
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js        # Zustand auth state (persisted)
│   │   │
│   │   └── utils/
│   │       └── etaCalculator.js    # Haversine distance + ETA formula
│   │
│   ├── .env                        # Environment variables (you create this)
│   ├── .env.example                # Template for .env
│   └── package.json
│
│
├── server/                         # Backend Node.js Application
│   ├── controllers/                # Business logic for each feature
│   │   ├── authController.js       # Register, login, profile, crew CRUD
│   │   ├── busController.js        # Bus CRUD, location updates
│   │   ├── bookingController.js    # Ticket booking logic
│   │   ├── tripController.js       # Start/end trips
│   │   ├── routeController.js      # Route CRUD
│   │   ├── stageController.js      # Bus stop CRUD + OSRM distance
│   │   ├── fareController.js       # Fare calculation
│   │   ├── busTypeFareController.js # Fare rates management
│   │   ├── etmController.js        # ETM ticket issuing + stage advance
│   │   └── notificationController.js # Delay reporting + Socket broadcast
│   │
│   ├── middleware/
│   │   ├── auth.js                 # JWT token verification
│   │   └── roleCheck.js            # Admin/Driver/Passenger role guards
│   │
│   ├── models/                     # MongoDB database schemas
│   │   ├── User.js                 # Passengers, drivers, admins
│   │   ├── Bus.js                  # Fleet with GPS location
│   │   ├── Route.js                # Route with polyline + coordinates
│   │   ├── Stage.js                # Bus stops with distances
│   │   ├── Trip.js                 # Active/completed journeys
│   │   ├── Booking.js              # Ticket bookings
│   │   └── BusTypeFare.js          # Price per km per bus type
│   │
│   ├── routes/                     # Express route definitions
│   │   ├── auth.js
│   │   ├── buses.js
│   │   ├── bookings.js
│   │   ├── trips.js
│   │   ├── routes.js
│   │   ├── stages.js
│   │   ├── fare.js
│   │   └── busTypeFares.js
│   │
│   ├── socket/
│   │   ├── trackingHandler.js      # All Socket.IO event handlers
│   │   └── ioInstance.js           # Socket.IO singleton (shared instance)
│   │
│   ├── server.js                   # Main entry point
│   ├── seed.js                     # Full sample data seeder
│   ├── seed_admin.js               # Admin-only seeder
│   ├── drop_all.js                 # Clears all database data (use carefully!)
│   ├── .env                        # Environment variables (you create this)
│   ├── .env.example                # Template for .env
│   └── package.json
│
└── README.md / Documentation.md
```

---

## 13. Deployment

### Deploying the Backend (Railway / Render)

The server is configured for deployment on **Railway** (`server/railway.toml`).

1. Create an account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long, random secret key
   - `CLIENT_URL` — your frontend's deployed URL (e.g., `https://ontime.vercel.app`)
   - `PORT` — Railway sets this automatically
4. Deploy — Railway will run `node server.js` automatically

### Deploying the Frontend (Vercel)

The client includes a `vercel.json` file for easy deployment:

1. Create an account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the **Root Directory** to `client`
4. Set environment variables:
   - `VITE_API_URL` — your Railway backend URL + `/api`
   - `VITE_SOCKET_URL` — your Railway backend URL
   - `VITE_MAPBOX_TOKEN` — your Mapbox access token
5. Deploy!

### Important: Update CORS After Deployment

After deploying, update your backend's `.env` (or Railway environment variable):

```env
CLIENT_URL=https://your-frontend.vercel.app
```

---

## 14. Test Credentials

Use these credentials to test different user roles:

| Role | Email | Password |
|---|---|---|
| **Admin** | admin@ontime.com | password |
| **Passenger** | user@ontime.com | password |
| **Driver (Crew)** | crew@ontime.com | password |

> **To test the full flow:**
> 1. Log in as **Admin** → Create a route → Add bus stops → Add a bus → Create a driver account
> 2. Log in as **Driver** → Start a trip → Enable location sharing
> 3. Log in as **Passenger** (in another browser/tab) → Go to Track Bus → See the driver's location

---

## 15. Frequently Asked Questions

### Q: The map doesn't show any buses. What's wrong?
**A:** Buses only appear on the map when a driver has started an active trip AND is sharing their GPS location. Make sure:
1. A driver is logged in and has clicked "Start Trip"
2. The driver's browser has allowed location permissions
3. Both the client and server are running

### Q: Fare calculation shows "Fare unavailable". What's wrong?
**A:** The admin needs to configure bus type fares first. Log in as admin → Go to **"Bus Type Fares"** → Set prices for Ordinary, Express, and AC bus types.

### Q: I can't create a route — the map shows a blank screen.
**A:** The `VITE_MAPBOX_TOKEN` in your `client/.env` file is either missing or invalid. Make sure you've added a valid token from [mapbox.com](https://www.mapbox.com).

### Q: Socket connection keeps disconnecting.
**A:** Check that:
1. The `VITE_SOCKET_URL` in `client/.env` points to the correct server URL
2. The server is running
3. CORS is configured correctly in `server/.env` (CLIENT_URL must match your frontend URL)

### Q: How do I reset all data and start fresh?
**A:** Run the following from the `server/` directory:
```bash
node drop_all.js
node seed_admin.js
```
This removes everything and recreates only the admin account.

### Q: Can a driver see other drivers' locations?
**A:** Yes. All drivers log in through the same TrackBus page that's accessible to all logged-in users. The distinction is only in the Dashboard — drivers get trip controls, passengers get booking options.

### Q: How are ticket fares calculated?
**A:** The formula is:
```
Fare = Distance between stops (km) × Price per km (for bus type)
```
For example: Boarding at stop A (5 km from origin), alighting at stop B (25 km from origin) in an Ordinary bus at ₹1.2/km:
```
Distance = 25 - 5 = 20 km
Fare = 20 × 1.2 = ₹24
```

### Q: What happens if two drivers try to start a trip on the same bus?
**A:** The system prevents this. Once a bus has `isOnTrip = true` in the database, any attempt to start another trip for that bus returns an error: *"Bus is already on an active trip."*

---

## 📊 Database Schema Summary

### Users Collection
Stores all three types of users. The `role` field determines access level.

```
name, email, password (hashed), phone, role (passenger/driver/admin), isActive, bookingHistory[]
```

### Buses Collection
Stores fleet information including live GPS coordinates.

```
busNumber, routeId, driverId, capacity, busType, currentLocation{lat,lng,speed}, status, isOnTrip, currentTripId
```

### Routes Collection
Stores route information with Mapbox polyline data for drawing on the map.

```
routeName, routeNumber, sourceCity, destinationCity, sourceCoordinates, destinationCoordinates, polyline, distance, stops[]
```

### Stages Collection
Bus stops along a route, with OSRM-calculated distances.

```
routeId, stageName, latitude, longitude, stageOrder, distanceFromOrigin
```

### Trips Collection
Each active or completed journey.

```
busId, routeId, driverId, startTime, endTime, status, bookedSeats[], currentStageId, locationHistory[], delayMinutes, delayReason
```

### Bookings Collection
Individual ticket bookings.

```
userId, busId, routeId, tripId, seatNumbers[], fromStop, toStop, travelDate, amount, ticketId, status, passengerDetails
```

### BusTypeFares Collection
Simple price configuration per bus type.

```
busType (Ordinary/Express/AC), pricePerKM
```

---

## 🏆 Project Highlights (For Jury Presentation)

Here are the most impressive technical aspects of this project:

1. **Real-Time GPS Tracking** — Sub-5-second location updates using Socket.IO WebSockets, updating every map marker live across all connected clients simultaneously.

2. **Automated Fare Engine** — Fares calculate automatically using real road distances (via OSRM API) between stops, not straight-line distances. This mirrors how actual KSRTC fares are calculated.

3. **ETM (Electronic Ticket Machine)** — Drivers can issue physical-style tickets directly from the web app, replacing traditional mechanical ticket machines.

4. **Digital E-Tickets with QR Codes** — Tickets are generated as professional PDFs with scannable QR codes, downloadable and printable from any device.

5. **Delay Broadcast System** — A single button press by a driver instantly notifies every passenger watching the map via WebSocket broadcast — no page refresh required.

6. **Role-Based Architecture** — Three completely separate user experiences (Passenger, Driver, Admin) built into one application with secure JWT authentication and role guards on every API endpoint.

7. **Mapbox + Leaflet Integration** — Two different map technologies used strategically: Mapbox for professional route creation (admin), Leaflet for lightweight live tracking (passengers).

8. **Progressive Fallback Locations** — If GPS isn't available, the system falls back to the last confirmed stage (bus stop) to still show passengers an approximate bus location.

---

*Documentation prepared for OnTime — Real-Time Bus Tracking & Booking System*  
*Version 1.0 | March 2026*
