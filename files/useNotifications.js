import { useState, useEffect, useCallback } from 'react';
import socket from '../config/socket';
import { useAuthStore } from '../store/authStore';

/**
 * Global hook that manages delay notifications.
 * FIX: socket only connects when the user is authenticated.
 */
export const useNotifications = () => {
    const { isAuthenticated } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Request browser notification permission once on mount
    useEffect(() => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                setPermissionGranted(true);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                    setPermissionGranted(permission === 'granted');
                });
            }
        }
    }, []);

    // FIX: only connect socket for authenticated users
    useEffect(() => {
        if (!isAuthenticated) {
            // Disconnect if previously connected and user logged out
            if (socket.connected) socket.disconnect();
            return;
        }

        if (!socket.connected) socket.connect();

        const handleDelay = (data) => {
            const newNotif = {
                id: `${data.tripId}-${Date.now()}`,
                tripId: data.tripId,
                busId: data.busId,
                busNumber: data.busNumber,
                routeName: data.routeName,
                delayMinutes: data.delayMinutes,
                delayReason: data.delayReason,
                timestamp: new Date(data.timestamp),
                read: false
            };

            setNotifications((prev) => [newNotif, ...prev]);

            if (permissionGranted && 'Notification' in window) {
                try {
                    const title = `🚨 Bus Delay — ${data.busNumber}`;
                    const body = `Delayed by ${data.delayMinutes} min${data.delayReason ? `: ${data.delayReason}` : ''}`;
                    const notif = new Notification(title, {
                        body,
                        icon: '/bus-icon.png',
                        tag: data.tripId,
                        renotify: true
                    });
                    setTimeout(() => notif.close(), 8000);
                } catch (_) {}
            }
        };

        socket.on('trip:delay', handleDelay);

        return () => {
            socket.off('trip:delay', handleDelay);
        };
    }, [isAuthenticated, permissionGranted]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return { notifications, unreadCount, markAllRead, clearAll, removeNotification };
};
