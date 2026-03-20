import { useState, useEffect, useCallback } from 'react';
import socket from '../config/socket';

/**
 * Global hook that manages delay notifications.
 * - Listens to `trip:delay` Socket.IO events
 * - Fires native browser Notification when permitted
 * - Accumulates notifications in local state with read/unread tracking
 */
export const useNotifications = () => {
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

    // Subscribe to Socket.IO trip:delay events
    useEffect(() => {
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

            // Fire native browser notification (works even when tab is in background)
            if (permissionGranted && 'Notification' in window) {
                try {
                    const title = `🚨 Bus Delay — ${data.busNumber}`;
                    const body = `Delayed by ${data.delayMinutes} min${data.delayReason ? `: ${data.delayReason}` : ''
                        }`;
                    const notif = new Notification(title, {
                        body,
                        icon: '/bus-icon.png',
                        tag: data.tripId, // Prevents duplicate notifications for same trip
                        renotify: true
                    });
                    // Auto-close after 8 seconds
                    setTimeout(() => notif.close(), 8000);
                } catch (_) {
                    // Notification API not available (e.g., secure context required)
                }
            }
        };

        socket.on('trip:delay', handleDelay);

        return () => {
            socket.off('trip:delay', handleDelay);
        };
    }, [permissionGranted]);

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
