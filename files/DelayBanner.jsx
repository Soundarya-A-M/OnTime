import { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';

/**
 * Prominent delay banner shown on the TrackBus page when the selected bus is delayed.
 *
 * FIX #24: Changed from `position: absolute` (inside map container, fought Leaflet z-index)
 * to `position: fixed` so it always renders above the map regardless of stacking context.
 */
const DelayBanner = ({ delayInfo, onDismiss }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (delayInfo) {
            const timer = setTimeout(() => setVisible(true), 50);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [delayInfo]);

    if (!delayInfo) return null;

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
    };

    return (
        // FIX: fixed + high z-index (z-[9998]) so it clears Leaflet's z-[1000] stacking context
        <div
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[9998] transition-all duration-300 ease-out ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
            }`}
            style={{ maxWidth: '90vw', width: '520px' }}
        >
            <div className="bg-amber-950/95 backdrop-blur-xl border border-amber-500/60 rounded-2xl shadow-2xl overflow-hidden">
                {/* Animated accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse" />

                <div className="flex items-start gap-3 px-5 py-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-amber-300 font-bold text-sm uppercase tracking-wide">
                                Service Delay
                            </p>
                            <span className="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs font-bold rounded-full">
                                LIVE
                            </span>
                        </div>
                        <p className="text-white font-semibold mt-0.5">
                            {delayInfo.busNumber && (
                                <span className="text-amber-200">Bus {delayInfo.busNumber}</span>
                            )}{' '}
                            is delayed by{' '}
                            <span className="text-amber-300 font-bold">{delayInfo.delayMinutes} min</span>
                        </p>
                        {delayInfo.delayReason && (
                            <p className="text-amber-200/70 text-sm mt-1">
                                📍 Reason: {delayInfo.delayReason}
                            </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5 text-amber-400/60 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>
                                Reported at{' '}
                                {new Date(delayInfo.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1.5 text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelayBanner;
