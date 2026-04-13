import { useState, useEffect } from 'react';
import { Ticket, MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const ETMPanel = ({ currentTrip, myBus, onTicketIssued }) => {
    const [stages, setStages] = useState([]);
    const [fromStage, setFromStage] = useState(null);
    const [toStage, setToStage] = useState(null);
    const [fareInfo, setFareInfo] = useState(null);
    const [fareLoading, setFareLoading] = useState(false);
    const [passengerName, setPassengerName] = useState('');
    const [passengerPhone, setPassengerPhone] = useState('');
    const [issuing, setIssuing] = useState(false);
    const [lastTicket, setLastTicket] = useState(null);
    const [currentStageName, setCurrentStageName] = useState('');

    useEffect(() => {
        // Always load stages from the BUS's current assigned route (not the trip's route)
        // The trip's routeId can be stale if the bus was reassigned to a different route
        const routeId = myBus?.routeId?._id || myBus?.routeId;
        if (!routeId) return;

        // Reset stage selections when route changes
        setFromStage(null);
        setToStage(null);
        setFareInfo(null);

        api.get(`/stages/${routeId}`).then(res => {
            if (res.success) setStages(res.data.stages);
        });

        if (currentTrip?._id) {
            api.get(`/trips/${currentTrip._id}/current-stage`).then(res => {
                if (res.success && res.data.currentStageName)
                    setCurrentStageName(res.data.currentStageName);
            });
        }
    }, [currentTrip, myBus]);

    useEffect(() => {
        if (!fromStage || !toStage || !myBus?._id) return;
        setFareLoading(true);
        api.get(`/fare/calculate?fromStageId=${fromStage._id}&toStageId=${toStage._id}&busId=${myBus._id}`)
            .then(res => { if (res.success) setFareInfo(res.data); })
            .catch(() => setFareInfo(null))
            .finally(() => setFareLoading(false));
    }, [fromStage, toStage, myBus]);

    const handleIssue = async () => {
        if (!fromStage || !toStage) { toast.error('Select boarding and destination stages'); return; }
        if (!fareInfo) { toast.error('Fare not calculated yet'); return; }
        setIssuing(true);
        try {
            const res = await api.post(`/trips/${currentTrip._id}/etm-ticket`, {
                fromStageId: fromStage._id,
                toStageId: toStage._id,
                passengerName: passengerName || 'Walk-in',
                passengerPhone,
                amount: fareInfo.fare
            });
            if (res.success) {
                setLastTicket(res.data);
                setCurrentStageName(fromStage.stageName);
                toast.success(`Ticket issued: ${res.data.ticketId}`);
                setFromStage(null); setToStage(null);
                setFareInfo(null); setPassengerName(''); setPassengerPhone('');
                if (onTicketIssued) onTicketIssued();
            }
        } catch (e) {
            toast.error(e.message || 'Failed to issue ticket');
        } finally {
            setIssuing(false);
        }
    };

    if (!currentTrip) {
        // No active trip — show read-only stage preview for the assigned route
        if (!myBus?.routeId) {
            return (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-amber-300 text-sm text-center">
                    Start a trip first to use the ETM
                </div>
            );
        }
        return (
            <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm">
                    ⚠️ Start a trip to issue tickets. Showing stages for your assigned route.
                </div>
                {stages.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-2">Stages on assigned route ({stages.length} stops)</p>
                        <div className="space-y-1">
                            {stages.map((s, i) => (
                                <div key={s._id} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 text-xs w-5">{i + 1}.</span>
                                    <span className="text-white">{s.stageName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Current stage indicator */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                    <p className="text-xs text-gray-400">Bus currently at stage</p>
                    <p className="text-white font-semibold text-sm">
                        {currentStageName || 'Loading...'}
                    </p>
                </div>
            </div>

            {/* Stage selection */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                        Boarding stage
                    </label>
                    <select
                        value={fromStage?._id || ''}
                        onChange={e => {
                            const s = stages.find(st => st._id === e.target.value) || null;
                            setFromStage(s); setToStage(null); setFareInfo(null);
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 transition appearance-none"
                    >
                        <option value="" className="bg-slate-800">— select —</option>
                        {stages.map(s => (
                            <option key={s._id} value={s._id} className="bg-slate-800">{s.stageName}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1.5"></span>
                        Destination stage
                    </label>
                    <select
                        value={toStage?._id || ''}
                        onChange={e => {
                            const s = stages.find(st => st._id === e.target.value) || null;
                            if (s && fromStage && s.stageOrder <= fromStage.stageOrder) {
                                toast.error('Destination must be ahead of boarding');
                                return;
                            }
                            setToStage(s);
                        }}
                        disabled={!fromStage}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition appearance-none disabled:opacity-40"
                    >
                        <option value="" className="bg-slate-800">— select —</option>
                        {stages.filter(s => !fromStage || s.stageOrder > fromStage.stageOrder).map(s => (
                            <option key={s._id} value={s._id} className="bg-slate-800">{s.stageName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Fare display */}
            {(fromStage && toStage) && (
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                        <span className="text-green-300">{fromStage.stageName}</span>
                        <ArrowRight className="inline w-3 h-3 mx-1 text-gray-500" />
                        <span className="text-red-300">{toStage.stageName}</span>
                    </div>
                    {fareLoading ? (
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    ) : fareInfo ? (
                        <span className="text-2xl font-bold text-purple-300">₹{fareInfo.fare}</span>
                    ) : (
                        <span className="text-red-400 text-xs">Fare unavailable</span>
                    )}
                </div>
            )}

            {/* Passenger details */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Passenger name (optional)</label>
                    <input
                        type="text"
                        value={passengerName}
                        onChange={e => setPassengerName(e.target.value)}
                        placeholder="Walk-in"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Phone (optional)</label>
                    <input
                        type="tel"
                        value={passengerPhone}
                        onChange={e => setPassengerPhone(e.target.value)}
                        placeholder="+91 ..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
                    />
                </div>
            </div>

            {/* Issue button */}
            <button
                onClick={handleIssue}
                disabled={issuing || !fromStage || !toStage || !fareInfo}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Ticket className="w-5 h-5" />
                {issuing ? 'Issuing...' : `Issue Ticket${fareInfo ? ` — ₹${fareInfo.fare}` : ''}`}
            </button>

            {/* Last issued ticket */}
            {lastTicket && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 font-semibold text-sm">Ticket Issued</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Ticket ID</span>
                            <span className="text-white font-mono">{lastTicket.ticketId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Journey</span>
                            <span className="text-white">{lastTicket.fromStop} → {lastTicket.toStop}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Amount</span>
                            <span className="text-purple-300 font-bold">₹{lastTicket.amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Time</span>
                            <span className="text-white">{new Date(lastTicket.issuedAt).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ETMPanel;
