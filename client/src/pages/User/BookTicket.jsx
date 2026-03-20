import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, MapPin, Calendar, Users, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

const BookTicket = () => {
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedBus, setSelectedBus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1); // 1: Route, 2: Bus, 3: Stages, 4: Seats, 5: Confirm
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookedSeats, setBookedSeats] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: new Date().toISOString().split('T')[0],
        passengerName: '',
        passengerPhone: ''
    });

    // Stage-based fare
    const [stages, setStages] = useState([]);
    const [fromStage, setFromStage] = useState(null);
    const [toStage, setToStage] = useState(null);
    const [fareInfo, setFareInfo] = useState(null);
    const [fareLoading, setFareLoading] = useState(false);

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
            const response = await api.get(`/buses?routeId=${routeId}&status=active`);
            if (response.success) setBuses(response.data.buses);
        } catch { toast.error('Failed to fetch buses'); }
    };

    const fetchStagesForRoute = async (routeId) => {
        try {
            const response = await api.get(`/stages/${routeId}`);
            if (response.success) {
                setStages(response.data.stages);
                if (response.data.stages.length === 0) toast('No stages configured for this route yet', { icon: 'â„¹ï¸' });
            }
        } catch { toast.error('Failed to fetch stages'); }
    };

    const fetchFare = async (fromId, toId, busId) => {
        if (!fromId || !toId || !busId) return;
        setFareLoading(true);
        try {
            const res = await api.get(`/fare/calculate?fromStageId=${fromId}&toStageId=${toId}&busId=${busId}`);
            if (res.success) {
                setFareInfo(res.data);
            }
        } catch (e) {
            toast.error(e.message || 'Failed to calculate fare');
            setFareInfo(null);
        } finally { setFareLoading(false); }
    };

    const handleRouteSelect = (route) => {
        setSelectedRoute(route); setSelectedBus(null);
        setFromStage(null); setToStage(null); setFareInfo(null); setStages([]);
        fetchBusesForRoute(route._id);
        setBookingStep(2);
    };

    const handleBusSelect = (bus) => {
        setSelectedBus(bus);
        setFromStage(null); setToStage(null); setFareInfo(null);
        fetchStagesForRoute(selectedRoute._id);
        setBookedSeats([]);
        setBookingStep(3);
    };

    const handleFromStageSelect = (stage) => {
        setFromStage(stage);
        setToStage(null); setFareInfo(null);
    };

    const handleToStageSelect = (stage) => {
        if (fromStage && stage.stageOrder <= fromStage.stageOrder) {
            toast.error('Destination must come after boarding stage');
            return;
        }
        setToStage(stage);
        if (fromStage) fetchFare(fromStage._id, stage._id, selectedBus._id);
    };

    const proceedToSeats = () => {
        if (!fromStage || !toStage) { toast.error('Select both boarding and destination stages'); return; }
        if (!fareInfo) { toast.error('Fare not calculated yet'); return; }
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

        const totalAmount = fareInfo ? fareInfo.fare * selectedSeats.length : selectedSeats.length * 500;

        try {
            const response = await api.post('/bookings', {
                busId: selectedBus._id,
                routeId: selectedRoute._id,
                seats: selectedSeats.length,
                seatNumbers: selectedSeats,
                travelDate: bookingData.date,
                fromStop: fromStage?.stageName || '',
                toStop: toStage?.stageName || '',
                amount: totalAmount,
                passengerDetails: { name: bookingData.passengerName, phone: bookingData.passengerPhone }
            });
            if (response.success) { toast.success('Ticket booked successfully!'); navigate('/dashboard'); }
        } catch (error) { toast.error(error.message || 'Failed to book ticket'); }
    };

    const totalFare = fareInfo ? fareInfo.fare * selectedSeats.length : selectedSeats.length * 500;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Book Your Ticket</h1>
                    <p className="text-gray-300">Reserve your seat in just a few steps</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    <div className="flex items-center space-x-2">
                        {[{n:1,label:'Route'},{n:2,label:'Bus'},{n:3,label:'Stages'},{n:4,label:'Seats'},{n:5,label:'Confirm'}].map((s, i, arr) => (
                            <>
                                <div key={s.n} className={`flex items-center space-x-1 ${bookingStep >= s.n ? 'text-purple-400' : 'text-gray-500'}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${bookingStep >= s.n ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>{s.n}</div>
                                    <span className="font-medium hidden lg:inline text-sm">{s.label}</span>
                                </div>
                                {i < arr.length - 1 && <ArrowRight className="text-gray-500 w-4 h-4 flex-shrink-0" />}
                            </>
                        ))}
                    </div>
                </div>

                {/* Step 1: Select Route */}
                {bookingStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Your Route</h2>
                        {loading ? (
                            <div className="text-gray-300">Loading routes...</div>
                        ) : routes.length === 0 ? (
                            <div className="text-gray-300">No routes available</div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {routes.map((route) => (
                                    <div
                                        key={route._id}
                                        onClick={() => handleRouteSelect(route)}
                                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 cursor-pointer transition group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{route.routeName}</h3>
                                                <p className="text-purple-400 font-medium">{route.routeNumber}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                                                <Bus className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-gray-300">
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{route.stops?.length || 0} stops</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{route.distance} km</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>{route.estimatedDuration} minutes</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Bus */}
                {bookingStep === 2 && (
                    <div>
                        <button onClick={() => setBookingStep(1)} className="text-purple-400 hover:text-purple-300 mb-6">
                            ← Back to Routes
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Your Bus</h2>
                        {buses.length === 0 ? (
                            <div className="text-gray-300">No buses available for this route</div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {buses.map((bus) => (
                                    <div key={bus._id} onClick={() => handleBusSelect(bus)}
                                        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 cursor-pointer transition">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-1">{bus.busNumber}</h3>
                                                <p className="text-gray-300">Driver: {bus.driverId?.name || 'Not assigned'}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    bus.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                                                }`}>{bus.status}</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    bus.busType === 'AC' ? 'bg-purple-500/20 text-purple-300' :
                                                    bus.busType === 'Express' ? 'bg-blue-500/20 text-blue-300' :
                                                    'bg-green-500/20 text-green-300'
                                                }`}>{bus.busType || 'Ordinary'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-300">
                                            <Users className="w-4 h-4" />
                                            <span>{bus.capacity} seats</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Select Stages & Calculate Fare */}
                {bookingStep === 3 && (
                    <div className="max-w-3xl mx-auto">
                        <button onClick={() => setBookingStep(2)} className="text-purple-400 hover:text-purple-300 mb-6">
                            ← Back to Buses
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Select Boarding & Destination Stage</h2>

                        {stages.length === 0 ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-yellow-300">
                                âš ï¸ No stages configured for this route yet. Ask admin to add stages via the Stage Editor.
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Boarding stage */}
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
                                        Boarding Stage
                                    </h3>
                                    <div className="space-y-2">
                                        {stages.map(s => (
                                            <button key={s._id} onClick={() => handleFromStageSelect(s)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition ${
                                                    fromStage?._id === s._id
                                                        ? 'bg-green-500/30 border border-green-400 text-white'
                                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                                }`}>
                                                <div className="font-medium">{s.stageName}</div>
                                                <div className="text-xs opacity-70 mt-0.5">{s.distanceFromOrigin} km from origin</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Destination stage */}
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                                        Destination Stage
                                    </h3>
                                    <div className="space-y-2">
                                        {stages.map(s => (
                                            <button key={s._id} onClick={() => handleToStageSelect(s)}
                                                disabled={fromStage && s.stageOrder <= fromStage.stageOrder}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition ${
                                                    toStage?._id === s._id
                                                        ? 'bg-red-500/30 border border-red-400 text-white'
                                                        : fromStage && s.stageOrder <= fromStage.stageOrder
                                                            ? 'bg-white/5 text-gray-600 border border-transparent cursor-not-allowed'
                                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-transparent'
                                                }`}>
                                                <div className="font-medium">{s.stageName}</div>
                                                <div className="text-xs opacity-70 mt-0.5">{s.distanceFromOrigin} km from origin</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fare preview */}
                        {(fromStage || toStage) && (
                            <div className="mt-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                    <div className="text-gray-300">
                                        <span className="text-green-300 font-medium">{fromStage?.stageName || '"”'}</span>
                                        {' ←’ '}
                                        <span className="text-red-300 font-medium">{toStage?.stageName || '"”'}</span>
                                    </div>
                                    {fareLoading ? (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Calculating...
                                        </div>
                                    ) : fareInfo ? (
                                        <div className="text-right">
                                            <div className="text-3xl font-bold text-purple-300">₹{fareInfo.fare}</div>
                                            <div className="text-xs text-gray-400">{fareInfo.distance} km Â· {fareInfo.busType} Â· ₹{fareInfo.pricePerKM}/km</div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {stages.length > 0 && (
                            <button onClick={proceedToSeats}
                                className="mt-6 w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2">
                                Continue to Seat Selection <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Step 4: Select Seats */}
                {bookingStep === 4 && (
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => setBookingStep(3)}
                            className="text-purple-400 hover:text-purple-300 mb-6"
                        >
                            ← Back to Stage Selection
                        </button>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Seat Map */}
                            <div className="flex-1 bg-white rounded-xl p-8 text-slate-900 shadow-xl">
                                <h3 className="text-xl font-bold mb-6 flex items-center">
                                    <span className="w-1 h-6 bg-purple-600 mr-3 rounded-full"></span>
                                    Select Seats
                                </h3>

                                <div className="flex justify-between mb-8 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 border border-green-500 rounded bg-white"></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-300 rounded border border-gray-400"></div>
                                        <span>Booked</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded border border-blue-600"></div>
                                        <span>Selected</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-pink-500 rounded border border-pink-600"></div>
                                        <span>Female</span>
                                    </div>
                                </div>

                                <div className="relative border-2 border-gray-200 rounded-lg p-6 bg-white min-h-[300px]">

                                    {/* Left Side: Steering & Label */}
                                    <div className="absolute left-4 top-8 flex flex-col items-center gap-4">
                                        {/* Steering Wheel */}
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="currentColor" fillOpacity="0.2" />
                                            <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor" />
                                            <path d="M12 10L8.5 13.5M12 10L15.5 13.5M12 14V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>

                                        {/* Label */}
                                        <div className="text-xs font-bold text-gray-800 uppercase tracking-widest transform -rotate-90 origin-center whitespace-nowrap mt-8">
                                            Seater (3)
                                        </div>
                                    </div>

                                    {/* Seats Grid Container */}
                                    <div className="ml-16 overflow-x-auto pb-4">
                                        <div className="flex flex-col gap-3 min-w-max">
                                            {/* Top Section (2 Rows) */}
                                            <div className="flex flex-col gap-2">
                                                {/* Row 1 */}
                                                <div className="flex gap-2">
                                                    {[1, 8, 9, 16, 17, 24, 25, 32, 33, 40, null, 47].map((seatNum, i) => {
                                                        if (seatNum === null) return <div key={`gap-1-${i}`} className="w-10"></div>;

                                                        const isBooked = bookedSeats.includes(seatNum);
                                                        const isSelected = selectedSeats.includes(seatNum);

                                                        return (
                                                            <button
                                                                key={seatNum}
                                                                disabled={isBooked}
                                                                onClick={() => toggleSeatSelection(seatNum)}
                                                                className={`
                                                                    w-10 h-10 rounded-sm text-xs font-bold transition-all transform hover:scale-105 flex items-center justify-center border
                                                                    ${isBooked
                                                                        ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                        : isSelected
                                                                            ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                                                                    }
                                                                `}
                                                            >
                                                                {seatNum}
                                                                {/* Green bar indicator for available seats */}
                                                                {!isBooked && !isSelected && (
                                                                    <div className="absolute right-0 h-3/4 w-1 bg-green-500 rounded-l-sm opacity-0 hover:opacity-100 transition-opacity"></div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Row 2 */}
                                                <div className="flex gap-2">
                                                    {[2, 7, 10, 15, 18, 23, 26, 31, 34, 39, null, 46].map((seatNum, i) => {
                                                        if (seatNum === null) return <div key={`gap-2-${i}`} className="w-10"></div>;

                                                        const isBooked = bookedSeats.includes(seatNum);
                                                        const isSelected = selectedSeats.includes(seatNum);

                                                        return (
                                                            <button
                                                                key={seatNum}
                                                                disabled={isBooked}
                                                                onClick={() => toggleSeatSelection(seatNum)}
                                                                className={`
                                                                    w-10 h-10 rounded-sm text-xs font-bold transition-all transform hover:scale-105 flex items-center justify-center border
                                                                    ${isBooked
                                                                        ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                        : isSelected
                                                                            ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                                                                    }
                                                                `}
                                                            >
                                                                {seatNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Aisle Spacer */}
                                            <div className="h-8 flex gap-2 items-center">
                                                <div className="w-10"></div>{/* Spacer for 1 */}
                                                <div className="w-10"></div>{/* Spacer for 8 */}
                                                <div className="w-10"></div>{/* Spacer for 9 */}
                                                <div className="w-10"></div>{/* Spacer for 16 */}
                                                <div className="w-10"></div>{/* Spacer for 17 */}
                                                <div className="w-10"></div>{/* Spacer for 24 */}
                                                <div className="w-10"></div>{/* Spacer for 25 */}
                                                <div className="w-10"></div>{/* Spacer for 32 */}
                                                <div className="w-10"></div>{/* Spacer for 33 */}
                                                <div className="w-10"></div>{/* Spacer for 40 */}
                                                <div className="w-10"></div>{/* Gap */}

                                                {/* Back Seat 45 */}
                                                <button
                                                    disabled={bookedSeats.includes(45)}
                                                    onClick={() => toggleSeatSelection(45)}
                                                    className={`
                                                        w-10 h-10 rounded-sm text-xs font-bold transition-all transform hover:scale-105 flex items-center justify-center border
                                                        ${bookedSeats.includes(45)
                                                            ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                            : selectedSeats.includes(45)
                                                                ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                                                : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                                                        }
                                                    `}
                                                >
                                                    45
                                                </button>
                                            </div>

                                            {/* Bottom Section (2 Rows) */}
                                            <div className="flex flex-col gap-2">
                                                {/* Row 3 */}
                                                <div className="flex gap-2">
                                                    {[3, 6, 11, 14, 19, 22, 27, 30, 35, 38, 41, 44].map((seatNum, i) => {
                                                        const isBooked = bookedSeats.includes(seatNum);
                                                        const isSelected = selectedSeats.includes(seatNum);

                                                        return (
                                                            <button
                                                                key={seatNum}
                                                                disabled={isBooked}
                                                                onClick={() => toggleSeatSelection(seatNum)}
                                                                className={`
                                                                    w-10 h-10 rounded-sm text-xs font-bold transition-all transform hover:scale-105 flex items-center justify-center border
                                                                    ${isBooked
                                                                        ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                        : isSelected
                                                                            ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                                                                    }
                                                                `}
                                                            >
                                                                {seatNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Row 4 */}
                                                <div className="flex gap-2">
                                                    {[4, 5, 12, 13, 20, 21, 28, 29, 36, 37, 42, 43].map((seatNum, i) => {
                                                        const isBooked = bookedSeats.includes(seatNum);
                                                        const isSelected = selectedSeats.includes(seatNum);

                                                        return (
                                                            <button
                                                                key={seatNum}
                                                                disabled={isBooked}
                                                                onClick={() => toggleSeatSelection(seatNum)}
                                                                className={`
                                                                    w-10 h-10 rounded-sm text-xs font-bold transition-all transform hover:scale-105 flex items-center justify-center border
                                                                    ${isBooked
                                                                        ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                                                                        : isSelected
                                                                            ? 'bg-blue-500 text-white border-blue-600 shadow-md'
                                                                            : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600'
                                                                    }
                                                                `}
                                                            >
                                                                {seatNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selection Summary */}
                            <div className="lg:w-[600px] shrink-0">
                                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 sticky top-24">
                                    <h3 className="text-xl font-bold text-white mb-4">Your Selection</h3>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-300">
                                            <span>Bus</span>
                                            <span className="font-semibold text-white">{selectedBus?.busNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Route</span>
                                            <span className="font-semibold text-white">{selectedRoute?.routeName}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-300">
                                            <span>Date</span>
                                            <span className="font-semibold text-white">{bookingData.date}</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-4">
                                            <div className="flex justify-between text-gray-300 mb-2">
                                                <span>Selected Seats ({selectedSeats.length})</span>
                                                <span className="font-semibold text-purple-400">
                                                    {selectedSeats.join(', ') || '-'}
                                                </span>
                                            </div>
                                            {fareInfo && (
                                                <div className="text-xs text-gray-400 mb-2">
                                                    {fromStage?.stageName} ←’ {toStage?.stageName} Â· {fareInfo.distance} km Â· {fareInfo.busType} ₹{fareInfo.pricePerKM}/km
                                                </div>
                                            )}
                                            <div className="flex justify-between text-xl font-bold text-white mt-4">
                                                <span>Total Amount</span>
                                                <span>₹{totalFare}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return; }
                                            setBookingStep(5);
                                        }}
                                        className={`w-full font-bold py-3 px-6 rounded-lg transition flex items-center justify-center space-x-2 ${selectedSeats.length > 0
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <span>Continue to Pay</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Confirm Booking */}
                {bookingStep === 5 && (
                    <div>
                        <button onClick={() => setBookingStep(4)} className="text-purple-400 hover:text-purple-300 mb-6">
                            ← Back to Seat Selection
                        </button>
                        <h2 className="text-2xl font-bold text-white mb-6">Confirm Your Booking</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Booking Summary */}
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Booking Summary</h3>
                                <div className="space-y-3 text-gray-300">
                                    <div>
                                        <span className="text-sm">Route:</span>
                                        <p className="font-semibold text-white">{selectedRoute?.routeName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm">Bus:</span>
                                        <p className="font-semibold text-white">{selectedBus?.busNumber}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm">Date:</span>
                                        <p className="font-semibold text-white">{bookingData.date}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm">Selected Seats:</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedSeats.map(seat => (
                                                <span key={seat} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30">
                                                    Seat {seat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Passenger Details */}
                            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">Passenger Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={bookingData.passengerName}
                                            onChange={(e) => setBookingData({ ...bookingData, passengerName: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={bookingData.passengerPhone}
                                            onChange={(e) => setBookingData({ ...bookingData, passengerPhone: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                            placeholder="Enter your phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-300 text-sm mb-2">Travel Date</label>
                                        <input
                                            type="date"
                                            value={bookingData.date}
                                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleBooking}
                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition flex items-center justify-center space-x-2"
                                    >
                                        <CreditCard className="w-5 h-5" />
                                        <span>Pay ₹{totalFare} & Book</span>
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
