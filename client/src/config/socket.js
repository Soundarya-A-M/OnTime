import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create Socket.IO client instance
const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Connection event handlers
socket.on('connect', () => {
    console.log('✅ Connected to Socket.IO server');
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from Socket.IO server');
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

export default socket;
