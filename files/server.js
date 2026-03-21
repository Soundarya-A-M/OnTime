import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import routeRoutes from './routes/routes.js';
import busRoutes from './routes/buses.js';
import tripRoutes from './routes/trips.js';
import bookingRoutes from './routes/bookings.js';
import stageRoutes from './routes/stages.js';
import busTypeFareRoutes from './routes/busTypeFares.js';
import fareRoutes from './routes/fare.js';

// Import Socket.IO handler
import { setupTrackingHandlers } from './socket/trackingHandler.js';
import { setIO } from './socket/ioInstance.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Parse allowed origins (supports comma-separated CLIENT_URL for multi-env deploys)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

setIO(io);

// Middleware
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting — generous limit, per-route limits applied where needed
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 login/register attempts per 15 min per IP
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/bus-types', busTypeFareRoutes);
app.use('/api/fare', fareRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'OnTime API is running',
        timestamp: new Date(),
        uptime: process.uptime(),
        mongoState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Setup Socket.IO handlers
setupTrackingHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready for real-time tracking`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown — avoids MongoDB connection leak on restart
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Closing HTTP server and MongoDB connection...');
    httpServer.close(async () => {
        await mongoose.connection.close();
        console.log('Server and DB connections closed.');
        process.exit(0);
    });
});

export default app;
