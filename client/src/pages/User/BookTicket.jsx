import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Users, CreditCard, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import ETicket from '../../components/Tickets/ETicket';
import { useAuthStore } from '../../store/authStore';

const BookTicket = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedBus, setSelectedBus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: new Date().toISOString().split('T')[0],
        passengerName: user?.name || '',
        passengerPhone: ''
    });
    const [stages, setStages] = useState([]);
    const [fromStage, setFromStage] = useState(null);
    const [toStage, setToStage] = useState(null);
    const [fareInfo, setFareInfo] = useState(null);
    const [fareLoading, setFareLoading] = useState(false);
    const [fareError, setFareError] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);

    useEffect(() => { fetchRoutes(); }, []);

    const fetchRoutes = async () => {
        try {
            const response = await api.get('/routes');
            if (response.success) setRoutes(response.data.routes);
        } catch { toast.error('Failed to fetch routes'); }
        finally { setLoading(false); }
    };

    const fetchBusesForRoute = async (routeId) => {
        try {
            // FIX: routeId filter now works in busController
            const response = await api.get(`/buses?routeId=${routeId}&status=active`);
            if (response.success) setBuses(response.data.buses);
        } catch { toast.error('Failed to fetch buses'); }
    };

    const fetchStagesForRoute = async (routeId) => {
        try {
            const response = await api.get(`/stages/${routeId}`);
            if (response.success) {
                setStages(response.data.stages);
                if (response.data.stages.length === 0)
                    toast('No stages configured for this route yet', { icon: 'ℹ️' });
            }
        } catch { toast.error('Failed to fetch stages'); }
    };

    const fetchBookedSeats = async (busId) => {
        try {
            const tripsRes = await api.get('/trips/active');
            if (tripsRes.success) {
                const trip = tripsRes.data.trips.find(t => t.busId?._id === busId || t.busId === busId);
                if (trip) {
                    // FIX: correct path — /bookings/seats/:tripId (not /seats/:tripId)
                    const seatsRes = await api.get(`/bookings/seats/${trip._id}`);
                    if (seatsRes.success) {
                        setBookedSeats(seatsRes.data.bookedSeats || []);
                        return trip._id;
                    }
                }
            }
        } catch {
            // No active trip or auth error — no booked seats to show
        }
        setBookedSeats([]);
        return null;
    };

    const fetchFare = async (fromId, toId, busId) => {
        if (!fromId || !toId || !busId) return;
        setFareLoading(true);
        setFareError(null);
        setFareInfo(null);
        try {
            const res = await api.get(`/fare/calculate?fromStageId=${fromId}&toStageId=${toId}&busId=${busId}`);
            if (res.success) setFareInfo(res.data);
        } catch (e) {
            const msg = e.message || 'Failed to calculate fare';
            setFareError(msg);
            toast.error(msg);
        } finally { setFareLoading(false); }
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route); setSelectedBus(null);
        setFromStage(null); setToStage(null); setFareInfo(null); setFareError(null); setStages([]);
        fetchBusesForRoute(route._id);
        setBookingStep(2);
    };

    const handleBusSelect = async (bus) => {
        setSelectedBus(bus);
        setFromStage(null); setToStage(null); setFareInfo(null); setFareError(null);
        fetchStagesForRoute(selectedRoute._id);
        setSelectedSeats([]);
        await fetchBookedSeats(bus._id);
        setBookingStep(3);
    };

    const handleFromStageSelect = (stage) => {
        setFromStage(stage);
        setToStage(null); setFareInfo(null); setFareError(null);
    };

    const handleToStageSelect = (stage) => {
        if (fromStage && stage.stageOrder <= fromStage.stageOrder) {
            toast.error('Destination must come after boarding stage');
            return;
        }
        setToStage(stage);
        if (fromStage) fetchFare(fromStage._id, stage._id, selectedBus._id);
    };

    // FIX: block if fareInfo is null (not configured) — don't let ₹0 bookings through
    const proceedToSeats = () => {
        if (!fromStage || !toStage) { toast.error('Select both boarding and destination stages'); return; }
        if (fareLoading) { toast.error('Fare is still calculating, please wait'); return; }
        if (fareError || !fareInfo) {
            toast.error('Fare could not be calculated. Ensure bus type fares are configured by admin.');
            return;
        }
        if (fareInfo.fare <= 0) {
            toast.error('Invalid fare amount. Contact admin to configure bus type fares.');
            return;
        }
        setSelectedSeats([]);
        setBookingStep(4);
    };

    const toggleSeatSelection = (seatNumber) => {
        if (bookedSeats.includes(seatNumber)) { toast.error('This seat is already booked'); return; }
        if (selectedSeats.includes(seatNumber)) {
            setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
        } else {
            setSelectedSeats([...selectedSeats, seatNumber]);
        }
    };

    const handleBooking = async () => {
        if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return; }
        if (!bookingData.passengerName || !bookingData.passengerPhone) { toast.error('Please fill in all passenger details'); return; }
        if (!fareInfo || fareInfo.fare <= 0) { toast.error('Invalid fare. Cannot complete booking.'); return; }

        const totalAmount = fareInfo.fare * selectedSeats.length;

        try {
            let tripId = null;
            try {
                const tripsRes = await api.get('/trips/active');
                if (tripsRes.success) {
                    const trip = tripsRes.data.trips.find(t =>
                        t.busId?._id === selectedBus._id || t.busId === selectedBus._id
                    );
                    if (trip) tripId = trip._id;
                }
            } catch { }

            const payload = {
                busId: selectedBus._id,
                routeId: selectedRoute._id,
                seats: selectedSeats.length,
                seatNumbers: selectedSeats,
                travelDate: bookingData.date,
                fromStop: fromStage?.stageName || '',
                toStop: toStage?.stageName || '',
                amount: totalAmount,
                passengerDetails: { name: bookingData.passengerName, phone: bookingData.passengerPhone }
            };
            if (tripId) payload.tripId = tripId;

            const response = await api.post('/bookings', payload);
            if (response.success) {
                toast.success('Ticket booked successfully!');
                const booking = response.data.booking || {};
                setBookingResult({
                    ...booking,
                    ticketId: booking.ticketId || `TKT${Date.now()}`,
                    busId: { busNumber: selectedBus.busNumber, _id: selectedBus._id },
                    routeId: { routeName: selectedRoute.routeName, _id: selectedRoute._id },
                    fromStop: fromStage?.stageName || '',
                    toStop: toStage?.stageName || '',
                    travelDate: bookingData.date,
                    seatNumbers: selectedSeats,
                    amount: totalAmount,
                    status: 'confirmed',
                    passengerDetails: { name: bookingData.passengerName, phone: bookingData.passengerPhone },
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            toast.error(error.message || 'Failed to book ticket');
        }
    };

    const totalFare = fareInfo ? fareInfo.fare * selectedSeats.length : 0;

    const renderSeat = (seatNum) => {
        if (seatNum === null) return <div key={`gap-${Math.random()}`} style={{ width: 40 }} />;
        const isBooked = bookedSeats.includes(seatNum);
        const isSelected = selectedSeats.includes(seatNum);
        return (
            <button
                key={seatNum}
                disabled={isBooked}
                onClick={() => toggleSeatSelection(seatNum)}
                style={{
                    width: 40, height: 40, borderRadius: 4, fontSize: 11, fontWeight: 700,
                    cursor: isBooked ? 'not-allowed' : 'pointer',
                    border: isBooked ? '1px solid #d1d5db' : isSelected ? '1px solid #6366f1' : '1px solid #d1d5db',
                    background: isBooked ? '#e5e7eb' : isSelected ? '#6366f1' : '#f9fafb',
                    color: isBooked ? '#9ca3af' : isSelected ? 'white' : '#374151',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden'
                }}
            >
                {seatNum}
                {!isBooked && !isSelected && (
                    <div style={{ position: 'absolute', right: 0, top: '15%', height: '70%', width: 3, background: '#10b981', borderRadius: '2px 0 0 2px' }} />
                )}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            {bookingResult && (
                <ETicket
                    booking={bookingResult}
                    onClose={() => { setBookingResult(null); navigate('/dashboard'); }}
                />
            )}

            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Book Your Ticket</h1>
                    <p className="text-gray-300">Reserve your seat in just a few steps</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center space-x-2">
                        {[{n:1,label:'Route'},{n:2,label:'Bus'},{n:3,label:'Stages'},{n:4,label:'Seats'},{n:5,label:'Confirm'}].map((s, i, arr) => (
                            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className={bookingStep >= s.n ? 'text-purple-400' : 'text-gray-500'}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${bookingStep >= s.n ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{s.n}</div>
                                    <span className="font-medium hidden lg:inline text-sm">{s.label}</span>
                                </div>
                                {i < arr.length - 1 && <ArrowRight className="text-gray-500 w-4 h-4 mx-2 flex-shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Route */}
                {bookingStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Your Route</h2>
                        {loading ? (
                            <div className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                Loading routes...
                            </div>
                        ) : routes.length === 0 ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-yellow-300">
                                ⚠️ No routes available. Ask an admin to create routes first.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {routes.map(route => (
                                    <div key={route._id} onClick={() => handleRouteSelect(route)}
                                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 cursor-pointer transition group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{route.routeName}</h3>
                                                <p className="text-purple-400 font-medium">{route.routeNumber}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                                                <Bus className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-gray-300 text-sm">
                                            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{route.stops?.length || 0} stops • {route.distance} km</div>
                                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />Est. {route.estimatedDuration} min</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Bus */}
                {bookingStep === 2 && (
                    <div>
                        <button onClick={() => setBookingStep(1)} className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2">← Back to Routes</button>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Your Bus</h2>
                        {buses.length === 0 ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-yellow-300">
                                ⚠️ No active buses for this route. Ask an admin to assign a bus to this route.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {buses.map(bus => (
                                    <div key={bus._id} onClick={() => handleBusSelect(bus)}
                                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 cursor-pointer transition">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{bus.busNumber}</h3>
                                                <p className="text-gray-300">Driver: {bus.driverId?.name || 'Not assigned'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{bus.status}</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.busType === 'AC' ? 'bg-purple-500/20 text-purple-300' : bus.busType === 'Express' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>{bus.busType || 'Ordinary'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-300 text-sm"><Users className="w-4 h-4" />{bus.capacity} seats</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Stages */}
                {bookingStep === 3 && (
                    <div className="max-w-3xl mx-auto">
                        <button onClick={() => setBookingStep(2)} className="text-purple-400 hover:text-purple-300 mb-6">← Back to Buses</button>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Boarding & Destination Stage</h2>
                        {stages.length === 0 ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-yellow-300">⚠️ No stages for this route yet. Add them in the admin Stage Editor.</div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>Boarding Stage</h3>
                                    <div className="space-y-2">
                                        {stages.map(s => (
                                            <button key={s._id} onClick={() => handleFromStageSelect(s)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition ${fromStage?._id === s._id ? 'bg-green-500/30 border border-green-400 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'}`}>
                                                <div className="font-medium">{s.stageName}</div>
                                                <div className="text-xs opacity-70 mt-0.5">{s.distanceFromOrigin} km from origin</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>Destination Stage</h3>
                                    <div className="space-y-2">
                                        {stages.map(s => (
                                            <button key={s._id} onClick={() => handleToStageSelect(s)}
                                                disabled={fromStage && s.stageOrder <= fromStage.stageOrder}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition ${toStage?._id === s._id ? 'bg-red-500/30 border border-red-400 text-white' : fromStage && s.stageOrder <= fromStage.stageOrder ? 'bg-white/5 text-gray-600 border border-transparent cursor-not-allowed' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'}`}>
                                                <div className="font-medium">{s.stageName}</div>
                                                <div className="text-xs opacity-70 mt-0.5">{s.distanceFromOrigin} km from origin</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(fromStage || toStage) && (
                            <div className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                    <div className="text-gray-300">
                                        <span className="text-green-300 font-medium">{fromStage?.stageName || '—'}</span>
                                        {' → '}
                                        <span className="text-red-300 font-medium">{toStage?.stageName || '—'}</span>
                                    </div>
                                    {fareLoading ? (
                                        <div className="flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</div>
                                    ) : fareError ? (
                                        <div className="flex items-center gap-2 text-red-400 text-sm">
                                            <AlertTriangle className="w-4 h-4" /> {fareError}
                                        </div>
                                    ) : fareInfo ? (
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-purple-300">₹{fareInfo.fare}</div>
                                            <div className="text-xs text-gray-400">{fareInfo.distance} km · {fareInfo.busType} · ₹{fareInfo.pricePerKM}/km</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {stages.length > 0 && (
                            <button onClick={proceedToSeats}
                                disabled={fareLoading || !!fareError || !fareInfo}
                                className="mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                Continue to Seat Selection <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: Seats */}
                {bookingStep === 4 && (
                    <div className="max-w-4xl mx-auto">
                        <button onClick={() => setBookingStep(3)} className="text-purple-400 hover:text-purple-300 mb-6">← Back to Stage Selection</button>
                        <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 bg-white rounded-xl p-8 text-slate-900 shadow-xl">
                                <h3 className="text-xl font-bold mb-4 flex items-center"><span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>Select Seats</h3>
                                <div className="flex justify-between mb-6 text-sm font-medium flex-wrap gap-2">
                                    {[['Available','#f9fafb','#d1d5db'],['Booked','#e5e7eb','#9ca3af'],['Selected','#6366f1','white']].map(([label,bg,color]) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <div style={{width:20,height:20,borderRadius:4,background:bg,border:`1px solid ${color === 'white' ? bg : '#d1d5db'}`}} />
                                            <span>{label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 'max-content' }}>
                                        <div style={{ display: 'flex', gap: 6 }}>{[1,8,9,16,17,24,25,32,33,40,null,47].map((n,i) => renderSeat(n))}</div>
                                        <div style={{ display: 'flex', gap: 6 }}>{[2,7,10,15,18,23,26,31,34,39,null,46].map((n,i) => renderSeat(n))}</div>
                                        <div style={{ height: 32, display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {Array(10).fill(null).map((_,i) => <div key={i} style={{width:40}} />)}
                                            <div style={{width:40}} />
                                            {renderSeat(45)}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>{[3,6,11,14,19,22,27,30,35,38,41,44].map(n => renderSeat(n))}</div>
                                        <div style={{ display: 'flex', gap: 6 }}>{[4,5,12,13,20,21,28,29,36,37,42,43].map(n => renderSeat(n))}</div>
                                    </div>
                                </div>
                                {bookedSeats.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-4">Seats already booked: {bookedSeats.join(', ')}</p>
                                )}
                            </div>
                            <div className="lg:w-72 shrink-0">
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 sticky top-24">
                                    <h3 className="text-xl font-bold text-white mb-4">Your Selection</h3>
                                    <div className="space-y-3 mb-6 text-gray-300 text-sm">
                                        <div className="flex justify-between"><span>Bus</span><span className="font-semibold text-white">{selectedBus?.busNumber}</span></div>
                                        <div className="flex justify-between"><span>Route</span><span className="font-semibold text-white text-right max-w-[140px] truncate">{selectedRoute?.routeName}</span></div>
                                        <div className="flex justify-between"><span>Date</span><span className="font-semibold text-white">{bookingData.date}</span></div>
                                        <div className="flex justify-between"><span>From</span><span className="font-semibold text-white">{fromStage?.stageName}</span></div>
                                        <div className="flex justify-between"><span>To</span><span className="font-semibold text-white">{toStage?.stageName}</span></div>
                                        <div className="border-t border-white/10 pt-3">
                                            <div className="flex justify-between mb-2"><span>Seats ({selectedSeats.length})</span><span className="font-semibold text-purple-400">{selectedSeats.join(', ') || '-'}</span></div>
                                            <div className="flex justify-between"><span>Fare/seat</span><span className="text-green-300">₹{fareInfo?.fare || 0}</span></div>
                                            <div className="flex justify-between text-xl font-bold text-white mt-4"><span>Total</span><span>₹{totalFare}</span></div>
                                        </div>
                                    </div>
                                    <button onClick={() => { if (selectedSeats.length === 0) { toast.error('Select at least one seat'); return; } setBookingStep(5); }}
                                        className={`w-full font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 ${selectedSeats.length > 0 ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
                                        <span>Continue to Pay</span><ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Confirm */}
                {bookingStep === 5 && (
                    <div>
                        <button onClick={() => setBookingStep(4)} className="text-purple-400 hover:text-purple-300 mb-6">← Back to Seat Selection</button>
                        <h2 className="text-2xl font-bold text-white mb-6">Confirm Your Booking</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Booking Summary</h3>
                                <div className="space-y-3 text-gray-300 text-sm">
                                    <div><span className="text-xs block">Route</span><p className="font-semibold text-white">{selectedRoute?.routeName}</p></div>
                                    <div><span className="text-xs block">Bus</span><p className="font-semibold text-white">{selectedBus?.busNumber}</p></div>
                                    <div><span className="text-xs block">Journey</span><p className="font-semibold text-white">{fromStage?.stageName} → {toStage?.stageName}</p></div>
                                    <div><span className="text-xs block">Date</span><p className="font-semibold text-white">{bookingData.date}</p></div>
                                    <div><span className="text-xs block">Selected Seats</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedSeats.map(seat => (
                                                <span key={seat} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30">Seat {seat}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="border-t border-white/10 pt-3">
                                        <div className="flex justify-between"><span>Fare per seat</span><span className="text-green-300 font-medium">₹{fareInfo?.fare}</span></div>
                                        <div className="flex justify-between text-xl font-bold text-white mt-2"><span>Total</span><span>₹{totalFare}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Passenger Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Full Name</label>
                                        <input type="text" value={bookingData.passengerName}
                                            onChange={(e) => setBookingData({ ...bookingData, passengerName: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                            placeholder="Enter your name" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Phone Number</label>
                                        <input type="tel" value={bookingData.passengerPhone}
                                            onChange={(e) => setBookingData({ ...bookingData, passengerPhone: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                            placeholder="Enter your phone" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Travel Date</label>
                                        <input type="date" value={bookingData.date}
                                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                                    </div>
                                    <button onClick={handleBooking}
                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition flex items-center justify-center gap-2">
                                        <CreditCard className="w-5 h-5" />
                                        <span>Pay ₹{totalFare} & Get Ticket</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default BookTicket;
