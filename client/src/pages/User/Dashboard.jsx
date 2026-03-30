import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Ticket, Clock, TrendingUp, Eye, ChevronLeft, ChevronRight, Filter, Search, Info, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../config/api';
import toast from 'react-hot-toast';
import ETicket from '../../components/Tickets/ETicket';

const PAGE_SIZE = 5;

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value || '');
    
    useEffect(() => { setSearch(value || ''); }, [value]);

    const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative">
            <input 
                type="text" 
                value={isOpen ? search : (value || '')}
                onChange={(e) => {
                    setSearch(e.target.value);
                    if (!isOpen) setIsOpen(true);
                    if (value && e.target.value !== value) onChange('');
                }}
                onFocus={() => { setIsOpen(true); setSearch(''); }}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
            />
            {isOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                        <li key={opt} 
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer text-slate-800 text-sm font-medium border-b border-gray-50 last:border-0">
                            {opt}
                        </li>
                    )) : (
                        <li className="px-4 py-3 text-slate-500 text-sm text-center">No locations found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const UserDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Booking history
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingTicket, setViewingTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Search functionality
  const [uniqueStages, setUniqueStages] = useState([]);
  const [searchParams, setSearchParams] = useState({
      from: '',
      to: '',
      date: new Date().toISOString().split('T')[0]
  });
  const [directBuses, setDirectBuses] = useState([]);
  const [partialBuses, setPartialBuses] = useState([]);
  const [loadingSearches, setLoadingSearches] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => { 
      fetchBookings(); 
      fetchUniqueStages();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my');
      if (response.success) setAllBookings(response.data.bookings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchUniqueStages = async () => {
      try {
          const res = await api.get('/stages/unique');
          if (res.success) setUniqueStages(res.data.stages.map(s => s.stageName));
      } catch { } // ignore
  };

  const handleSearch = async () => {
      if (!searchParams.from || !searchParams.to) {
          toast.error('Select both From and To locations');
          return;
      }
      if (searchParams.from === searchParams.to) {
          toast.error('From and To locations cannot be the same');
          return;
      }

      setLoadingSearches(true);
      setHasSearched(true);
      try {
          const res = await api.get(`/buses/search?from=${encodeURIComponent(searchParams.from)}&to=${encodeURIComponent(searchParams.to)}&date=${searchParams.date}`);
          if (res.success) {
              setDirectBuses(res.data.directBuses || []);
              setPartialBuses(res.data.partialBuses || []);
          }
      } catch {
          toast.error('Search failed');
      } finally {
          setLoadingSearches(false);
      }
  };

  const filtered = statusFilter === 'all' ? allBookings : allBookings.filter(b => b.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 px-4 pb-12">
      {viewingTicket && <ETicket booking={viewingTicket} onClose={() => setViewingTicket(null)} />}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-300">Track buses, book tickets, and search your journeys</p>
        </div>

        {/* Bus Search Widget */}
        <div className="relative z-50 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Search className="w-6 h-6 text-purple-400"/> Search Buses
            </h2>
            <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
                <div>
                    <label className="block text-gray-300 text-sm mb-2">Leaving From</label>
                    <SearchableSelect 
                        options={uniqueStages} 
                        value={searchParams.from} 
                        onChange={(val) => setSearchParams({...searchParams, from: val})} 
                        placeholder="Type to search origins..." 
                    />
                </div>
                <div>
                    <label className="block text-gray-300 text-sm mb-2">Going To</label>
                    <SearchableSelect 
                        options={uniqueStages} 
                        value={searchParams.to} 
                        onChange={(val) => setSearchParams({...searchParams, to: val})} 
                        placeholder="Type to search destinations..." 
                    />
                </div>
                <div>
                    <label className="block text-gray-300 text-sm mb-2">Date of Journey</label>
                    <input type="date" value={searchParams.date} min={new Date().toISOString().split('T')[0]}
                        onChange={e => setSearchParams({...searchParams, date: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500" />
                </div>
                <div className="mt-4 md:mt-0">
                    <button onClick={handleSearch} disabled={loadingSearches}
                        className="w-full h-[50px] bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold px-6 rounded-lg transition flex justify-center items-center gap-2">
                        {loadingSearches ? <Loader2 className="animate-spin w-5 h-5"/> : <><Search className="w-5 h-5"/> Search</>}
                    </button>
                </div>
            </div>

            {hasSearched && (
                <div className="mt-8 pt-8 border-t border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6">Search Results</h2>
                    
                    {(directBuses.length === 0 && partialBuses.length === 0) ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-yellow-300">
                            ⚠️ No buses found traversing between these locations. Try alternative stages or dates.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {directBuses.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5"/> Direct Buses</h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {directBuses.map((bObj, i) => (
                                            <div key={i} className="bg-white/5 backdrop-blur-lg border border-green-500/30 rounded-2xl p-5 hover:bg-white/10 transition">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{bObj.bus.busNumber}</h3>
                                                        <p className="text-purple-300 text-xs">{bObj.bus.routeId.routeName}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-[10px] font-bold rounded-full">DIRECT</span>
                                                </div>
                                                <div className="text-gray-300 text-xs flex gap-3 mt-2">
                                                    <span className="bg-white/10 px-2 py-1 rounded">{bObj.bus.busType || 'Ordinary'}</span>
                                                    <span className="bg-white/10 px-2 py-1 rounded">{bObj.bus.capacity} seats</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-3 border-t border-white/10 pt-3 flex flex-col gap-1">
                                                    <div><strong className="text-green-300">Departs:</strong> {bObj.fromStage.stageName}</div>
                                                    <div><strong className="text-red-300">Arrives:</strong> {bObj.toStage.stageName}</div>
                                                </div>
                                                <button onClick={() => navigate('/book-ticket')} className="mt-4 w-full py-2 bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1">
                                                    Book Ticket <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {partialBuses.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2"><Info className="w-5 h-5"/> Partial Options</h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {partialBuses.map((bObj, i) => (
                                            <div key={i} className="bg-white/5 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-5 hover:bg-white/10 transition">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{bObj.bus.busNumber}</h3>
                                                        <p className="text-purple-300 text-xs">{bObj.bus.routeId.routeName}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">PARTIAL</span>
                                                </div>
                                                
                                                <div className="p-2 mt-2 border border-amber-500/20 bg-amber-500/10 rounded-lg text-amber-200 text-xs leading-tight">
                                                    This bus runs up to <strong>{bObj.toStage.stageName}</strong> (the closest stop before {bObj.destinationName}).
                                                </div>

                                                <div className="text-gray-300 text-xs flex gap-3 mt-3">
                                                    <span className="bg-white/10 px-2 py-1 rounded">{bObj.bus.busType || 'Ordinary'}</span>
                                                    <span className="bg-white/10 px-2 py-1 rounded">{bObj.bus.capacity} seats</span>
                                                </div>
                                                <div className="text-xs text-gray-400 mt-3 border-t border-white/10 pt-3 flex flex-col gap-1">
                                                    <div><strong className="text-green-300">Departure:</strong> {bObj.fromStage.stageName}</div>
                                                    <div><strong className="text-amber-300">Drop-off:</strong> {bObj.toStage.stageName}</div>
                                                </div>
                                                <button onClick={() => navigate('/book-ticket')} className="mt-4 w-full py-2 bg-gradient-to-r from-amber-500/80 to-purple-500/80 hover:from-amber-500 hover:to-purple-500 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-1">
                                                    Book Partial <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            { to:'/track',       icon:MapPin,  title:'Track Bus',     sub:'View live bus locations in real-time',     grad:'from-purple-500 to-pink-500' },
            { to:'/book-ticket', icon:Ticket,  title:'Book Ticket',   sub:'Reserve your seat for upcoming trips',      grad:'from-blue-500 to-cyan-500' },
            { to:'/track',       icon:Clock,   title:'View Schedule', sub:'Check bus timings and live ETAs',           grad:'from-green-500 to-emerald-500' },
          ].map(c => (
            <Link key={c.to+c.title} to={c.to}
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition group">
              <div className={`w-14 h-14 bg-gradient-to-br ${c.grad} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <c.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
              <p className="text-gray-300">{c.sub}</p>
            </Link>
          ))}
        </div>

        {/* Booking History */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">Booking History</h2>
              <TrendingUp className="w-6 h-6 text-purple-400" />
              {!loading && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                  {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                {['all', 'confirmed', 'completed', 'cancelled'].map(f => (
                  <button key={f} onClick={() => {setStatusFilter(f); setPage(1);}}
                    className={`px-3 py-1 rounded text-xs font-medium capitalize transition ${statusFilter === f ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-300">Loading bookings...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {statusFilter === 'all' ? 'No bookings yet.' : `No ${statusFilter} bookings.`}
              </p>
              {statusFilter === 'all' && (
                <Link to="/book-ticket"
                  className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition">
                  Book Your First Trip
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginated.map(booking => (
                  <div key={booking._id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-white font-semibold">{booking.busId?.busNumber || 'N/A'}</p>
                          <span className="text-gray-400 text-xs font-mono">{booking.ticketId}</span>
                        </div>
                        {(booking.fromStop || booking.toStop) && (
                          <p className="text-gray-300 text-sm mb-1">
                            {booking.fromStop} → {booking.toStop}
                          </p>
                        )}
                        <div className="flex items-center flex-wrap gap-4 text-xs text-gray-400">
                          {booking.seatNumbers?.length > 0 && (
                            <span>Seats: {booking.seatNumbers.join(', ')}</span>
                          )}
                          {booking.amount > 0 && <span className="text-purple-300 font-medium">₹{booking.amount}</span>}
                          <span>{new Date(booking.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                          {booking.routeId?.routeName && (
                            <span className="text-gray-500">{booking.routeId.routeName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                          booking.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-red-500/20 text-red-300'}`}>
                          {booking.status}
                        </span>
                        <button onClick={() => setViewingTicket(booking)}
                          className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-full text-xs font-medium transition"
                          title="View e-ticket">
                          <Eye className="w-3 h-3" /> Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === n ? 'bg-purple-500 text-white' : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'}`}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
