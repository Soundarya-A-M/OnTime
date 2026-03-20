import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Trash2, Clock, Bus } from 'lucide-react';

const NotificationBell = ({ notifications, unreadCount, markAllRead, clearAll, removeNotification }) => {
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (date) => {
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    setOpen((prev) => !prev);
                    if (!open && unreadCount > 0) markAllRead();
                }}
                className="relative p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="Notifications"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse text-amber-400' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-amber-400" />
                            <h3 className="text-white font-semibold text-sm">Delay Alerts</h3>
                            {notifications.length > 0 && (
                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full">
                                    {notifications.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllRead}
                                        className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-white/10 rounded-lg transition"
                                        title="Mark all read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                                        title="Clear all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <Bell className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">No delay alerts yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-amber-500/5' : ''
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center mt-0.5">
                                            <Bus className="w-4 h-4 text-amber-400" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-white text-sm font-semibold truncate">
                                                    {notif.busNumber}
                                                    {notif.routeName && (
                                                        <span className="text-gray-400 font-normal"> · {notif.routeName}</span>
                                                    )}
                                                </p>
                                                <button
                                                    onClick={() => removeNotification(notif.id)}
                                                    className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-amber-300 text-xs font-medium mt-0.5">
                                                ⚠️ Delayed by {notif.delayMinutes} min
                                            </p>
                                            {notif.delayReason && (
                                                <p className="text-gray-400 text-xs mt-0.5 truncate">
                                                    {notif.delayReason}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
                                                <Clock className="w-3 h-3" />
                                                <span>{formatTimeAgo(notif.timestamp)}</span>
                                            </div>
                                        </div>

                                        {/* Unread dot */}
                                        {!notif.read && (
                                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 mt-1.5" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-white/10 bg-black/20">
                            <p className="text-gray-500 text-xs text-center">
                                Showing {notifications.length} recent alert{notifications.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
