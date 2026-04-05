# PROJECT REPORT: WHERE IS MY BUS

---

## 1. INTRODUCTION

### 1.1 Overview Of The System
Public transportation, particularly buses, plays a vital role in daily commuting. However, uncertainty regarding bus arrival times causes significant distress and wastes valuable time for passengers. With the rapid growth of urbanization, traffic congestion and unpredictable delays have become common, making predefined schedules unreliable. The "Where is my bus" project is an advanced real-time bus tracking system designed to eliminate this uncertainty. By leveraging modern GPS and web development technologies, it provides users with accurate, live location updates of their buses directly on an interactive map. This project transitions traditional static schedules into dynamic, location-aware travel solutions.

### 1.2 Purpose
The main purpose of the "Where is my bus" project is to provide a seamless, real-time tracking mechanism for public transport buses. It aims to empower passengers by giving them live insights into bus coordinates, thereby reducing wait times and improving the overall public transit experience.

### 1.3 Scope Of The Project
When it comes to project planning, defining the project scope is the most critical step. The scope of "Where is my bus" focuses on developing a comprehensive web application featuring:
- A user dashboard for passengers to find routes, track bus locations on live maps, and purchase/manage QR tickets.
- An admin and crew (driver) module to manage bus fleets, routes, stages, and broadcast live GPS locations.
- Real-time communication protocols to ensure tracking data is transmitted with sub-second latency.

*Out of Scope:* Native mobile app development (iOS/Android) and integration with external payment gateways beyond the current scope are excluded in this phase, focusing entirely on a responsive web-based MERN stack implementation.

---

## 2. TECHNOLOGY OVERVIEW

### 2.1 Front-End Technologies
- **HTML, CSS, and JAVASCRIPT**: The core pillars of the web interface. We utilize modern HTML5 for semantic structure, CSS3 with TailwindCSS for rapid, responsive styling, and modern ES6+ JavaScript.
- **React.js & Vite**: The front-end is built using React.js for building modular user interfaces. Vite is used as the build tool, offering incredibly fast Hot Module Replacement (HMR) and optimized production builds.
- **Mapbox & Leaflet**: These libraries are integrated to render interactive, high-performance web maps that visually display the live locations of the transit vehicles.
- **Zustand**: Used for lightweight, fast global state management across the client application.

### 2.2 Back-End Framework
- **Node.js & Express.js**: Node.js is the runtime environment, and Express.js provides a robust, lightweight framework to build the RESTful API network. It handles user authentication, CRUD operations for buses, routes, and bookings.
- **Socket.IO**: A critical component for this system, Socket.IO enables bi-directional, real-time event-based communication. It is utilized to instantly push GPS coordinates from the driver's device to the passengers' screens.

### 2.3 Database Management
- **MongoDB (NoSQL)**: A document-based database used to store flexible JSON-like structures. MongoDB is highly scalable and perfect for handling high-throughput geo-spatial data.
- **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js that provides rigorous schema validation (e.g., Users, Buses, Routes, Trips, Bookings).

---

## 3. SYSTEM ANALYSIS

### 3.1 Existing System
Traditional transit systems rely on static printed schedules or non-interactive digital timetables. 
- **Disadvantages:** Frequent delays due to traffic are not reflected in schedules, leading to frustration and wasted time. There is no transparency between the transit operator's vehicle location and the waiting passenger.

### 3.2 Proposed System
The "Where is my bus" system replaces the static model with a dynamic, real-time tracking interface. Drivers broadcast their location via their devices, which is processed by our WebSockets server and pushed to user maps instantly.
- **Advantages:** Less wait times. Users can plan their departure exactly when the bus is approaching. Administrators possess an eagle-eye view of all operating vehicles to manage fleet efficiency.

### 3.3 Feasibility Study
- **Economical Feasibility:** The project operates on open-source web technologies (MERN stack, Leaflet maps), drastically reducing licensing costs. Hosting can be done on affordable cloud servers. 
- **Technical Feasibility:** Modern browsers fully support WebSockets and Geolocation APIs. The technical complexity is manageable with standard hardware.
- **Social Feasibility:** The system vastly improves commuter lifestyle and peace of mind. The user interface is built to be intuitive, ensuring high adoption rates among diverse age groups.

---

## 4. SOFTWARE & HARDWARE SPECIFICATION

### 4.1 Server Side
- **OS:** Linux/Unix/Windows Server
- **Web Server:** Node.js environment
- **Database:** MongoDB
- **Processor:** Intel Core i3 or equivalent
- **RAM:** 2 GB+
- **Hard Disk:** 20 GB+

### 4.2 Client Side
- **OS:** Windows, macOS, Android, iOS (via browser)
- **Web Browser:** Modern browsers (Chrome, Firefox, Safari, Edge)
- **Internet Connection:** Stable 3G/4G/WiFi is required for live map tracking.
- **Processor:** Intel Core i3 or equivalent (Desktop), Modern ARM Processor (Mobile)
- **RAM:** 2 GB

---

## 5. SOFTWARE REQUIREMENT SPECIFICATION

### 5.1 Introduction
The Software Requirement Specification (SRS) is the starting point of the software development activity. For "Where is my bus", it establishes the expected behavior of the tracking system, minimizing development errors.

### 5.2 Functional Requirements
- **User Module:** Register, Login, Search Source/Destination, View Bus Route, Track Bus Location on Map, View Ticketing QR.
- **Driver (Crew) Module:** Login, Select Assigned Trip, Start Trip, Stream Live GPS Coordinates, End Trip.
- **Admin Module:** Manage Users, Manage Buses, Manage Routes/Stages, Overview all Active Trips.

### 5.3 Non-Functional Requirements
- **Performance:** WebSocket latency should be under 500ms to mimic near-real-time tracking.
- **Security:** Passwords must be hashed using bcrypt. API routes and WebSocket connections must be secured using JSON Web Tokens (JWT).
- **Usability:** The interface must be responsive (mobile-friendly) since most tracking will naturally occur on mobile devices.

---

## 6. SYSTEM DESIGN

### 6.1 Architecture Design
The architecture is divided into three tiers:
1. **Data Layer:** MongoDB stores historical and operational data (Buses, Users, Bookings).
2. **Application Layer:** Express/Node.js processes business logic, and the Socket.IO server manages active live connections.
3. **Front-End Layer:** React.js renders the map (Leaflet) and the UI, receiving states dynamically.

### 6.2 Data Base Design Structure
The system identifies several key entities to organize transit data:
1. **User Table:** User ID, Name, Email, Password (Hashed), Role (Admin/Crew/Passenger).
2. **Bus Table:** Bus Number, Capacity, Bus Type.
3. **Route & Stage Table:** Route Name, Initial Point, Final Point, Intermediary Stages, Distance Offsets.
4. **Trip Table:** Trip ID, Bus ID, Driver ID, Route ID, Start Time, Status (Active/Completed).
5. **Booking Table:** Booking ID, User ID, Trip ID, Source, Destination, Fare, QR Code String.

### 6.3 Diagrams Summary
- **Use Case:** Shows actors (Passenger, Driver, Admin) and their interactions with the system boundary (e.g., Driver -> Broacast GPS; Passenger -> View Map).
- **Entity-Relationship:** Defines 1-to-many relationships (e.g., One Route has Many Trips; One Trip has Many Bookings).
- **Sequence:** Details the real-time flow: Driver Location API -> Server -> WebSocket Emission -> Passenger React Map State Update.

---

## 7. SYSTEM IMPLEMENTATION

### 7.1 Implementation Steps
The project uses a phase-in approach. Initially, core components (User Authentication and CRUD APIs) were developed. Subsequently, the map rendering (Leaflet) and WebSocket integration were phased in. Finally, testing on live devices was conducted to verify location accuracy.

### 7.2 Pseudo Code (Live Tracking)
```text
Driver Starts Trip:
1. Authenticate Driver.
2. Initialize Geolocation.watchPosition().
3. On New Location Event:
   a. Send { lat, lng, tripId } to Server via socket.emit('updateLocation').
4. END

Server Processing:
1. Listen on socket 'updateLocation'.
2. Receive { lat, lng, tripId }.
3. Broadcast to 'room_tripId': socket.to(tripId).emit('locationChanged', { lat, lng }).
4. END

Passenger Viewing Map:
1. Passenger joins socket 'room_tripId'.
2. Listen for 'locationChanged'.
3. On event fired: Update React State (Map Marker Position).
4. END
```

---

## 8. SYSTEM TESTING

### 8.1 Testing Methodologies
- **Unit Testing:** Ensuring individual modules (like JWT token generation and password hashing) function properly.
- **Integration Testing:** Ensuring the React front-end connects correctly with the Express API for data fetching.
- **System Testing:** The entire WebSockets infrastructure was tested with mock driver data to ensure the map marker updates seamlessly without crashing the browser.

### 8.2 Test Cases
| Test No | Testing Scenario | Expected Result | Status |
|---|---|---|---|
| TC-01 | Click Register without details | Alert "Please fill all details" | Pass |
| TC-02 | Login with Invalid Credentials | Prompt "Invalid username or password" | Pass |
| TC-03 | Search Route without Selecting Cities | Error highlighting dropdown inputs | Pass |
| TC-04 | Driver streams location on Map | Bus indicator dynamically moves on map | Pass |
| TC-05 | Passenger views non-active trip | Alert "Trip has ended or not yet started" | Pass |

---

## 9. CONCLUSION
In conclusion, the "Where is my bus" system delivers an elegant and practical solution for the everyday challenges of public transportation. By amalgamating a robust Node/Express backend with a reactive React frontend and real-time Socket.IO streams, we successfully bridge the information gap between transit operators and passengers. This eliminates waiting anxiety and introduces modern transparency into public commuting.

---

## 10. FUTURE ENHANCEMENT
The system lays a strong foundation for future upgrades. Potential enhancements include:
- Native mobile application rollout (Android / iOS) for better push notifications and native GPS utilization.
- Integration of predictive Machine Learning models to estimate time of arrival (ETA) based on historic traffic patterns rather than just live location.
- Multi-lingual support and integration with digital wallets for seamless one-click ticketing.

---

## 11. BIBLIOGRAPHY / REFERENCES
- React JS Documentation: https://react.dev/
- Node.js Official Documentation: https://nodejs.org/
- WebSockets & Socket.IO: https://socket.io/
- Leaflet JS Interactive Maps: https://leafletjs.com/
- MongoDB & Mongoose Modeling: https://mongoosejs.com/
