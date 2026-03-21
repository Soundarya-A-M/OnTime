import { useRef, useEffect, useState } from 'react';
import { X, Printer, MapPin, Calendar, User, Bus, Hash, CheckCircle } from 'lucide-react';

const RealQR = ({ value, size = 80 }) => {
    const canvasRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const generate = async () => {
            try {
                const QRCode = (await import('qrcode')).default;
                if (canvasRef.current && !cancelled) {
                    await QRCode.toCanvas(canvasRef.current, value, {
                        width: size, margin: 1,
                        color: { dark: '#1e293b', light: '#ffffff' },
                    });
                    if (!cancelled) setLoaded(true);
                }
            } catch { if (!cancelled) setError(true); }
        };
        generate();
        return () => { cancelled = true; };
    }, [value, size]);

    if (error) {
        const gridSize = 10;
        const cells = [];
        let hash = 0;
        for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) cells.push(((hash ^ (r * 31 + c * 97)) & 1) === 1);
        [[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]].forEach(([r,c]) => { cells[r * gridSize + c] = true; cells[(gridSize-1-r) * gridSize + c] = true; });
        return (
            <div style={{ display:'inline-grid', gridTemplateColumns:`repeat(${gridSize},1fr)`, gap:'1px', padding:'6px', background:'white', borderRadius:'6px' }}>
                {cells.map((filled, i) => <div key={i} style={{ width: size/gridSize - 1, height: size/gridSize - 1, background: filled ? '#1e293b' : 'white', borderRadius:'1px' }} />)}
            </div>
        );
    }

    return (
        <div style={{ padding:'6px', background:'white', borderRadius:'6px', display:'inline-block' }}>
            <canvas ref={canvasRef} style={{ display: loaded ? 'block' : 'none', borderRadius:'4px' }} />
            {!loaded && !error && <div style={{ width: size, height: size, background:'#f1f5f9', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', color:'#94a3b8' }}>QR...</div>}
        </div>
    );
};

const ETicket = ({ booking, onClose }) => {
    const ticketRef = useRef(null);

    if (!booking) return null;

    const {
        ticketId = 'TKT000000', busId, routeId,
        fromStop = 'Origin', toStop = 'Destination',
        travelDate, seatNumbers = [], amount = 0, status = 'confirmed',
        passengerDetails, createdAt,
    } = booking;

    const busNumber = busId?.busNumber || busId || 'N/A';
    const routeName = routeId?.routeName || routeId || 'N/A';
    const passengerName = passengerDetails?.name || 'Passenger';
    const formattedDate = travelDate ? new Date(travelDate).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' }) : 'N/A';
    const bookedAt = createdAt ? new Date(createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'N/A';

    // FIX #15: use native window.print() — no popup required, works in all browsers
    const handlePrint = () => {
        const el = ticketRef.current;
        if (!el) return;

        // Inject a temporary print stylesheet
        const style = document.createElement('style');
        style.id = 'ticket-print-style';
        style.innerHTML = `
            @media print {
                body > *:not(#ticket-print-root) { display: none !important; }
                #ticket-print-root { position: fixed; inset: 0; z-index: 99999; background: white; display: flex; align-items: center; justify-content: center; }
                .no-print { display: none !important; }
            }
        `;
        document.head.appendChild(style);

        // Wrap ticket in a print root
        const printRoot = document.createElement('div');
        printRoot.id = 'ticket-print-root';
        printRoot.appendChild(el.cloneNode(true));
        document.body.appendChild(printRoot);

        window.print();

        // Cleanup after print dialog closes
        setTimeout(() => {
            document.head.removeChild(style);
            document.body.removeChild(printRoot);
        }, 500);
    };

    return (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
            <div style={{ width:'100%', maxWidth:'480px' }}>
                {/* Action bar */}
                <div className="no-print" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                    <span style={{ color:'white', fontWeight:600, fontSize:'15px' }}>Your E-Ticket</span>
                    <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={handlePrint} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', background:'rgba(139,92,246,0.9)', border:'none', color:'white', cursor:'pointer', fontWeight:600, fontSize:'13px' }}>
                            <Printer size={14} /> Print / Save
                        </button>
                        <button onClick={onClose} style={{ padding:'8px', borderRadius:'8px', background:'rgba(255,255,255,0.15)', border:'none', color:'white', cursor:'pointer', display:'flex', alignItems:'center' }}>
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Ticket card */}
                <div ref={ticketRef} style={{ background:'white', borderRadius:'20px', boxShadow:'0 25px 60px rgba(0,0,0,0.4)', overflow:'hidden', fontFamily:"'Segoe UI',sans-serif" }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#1e1b4b 0%,#3730a3 50%,#6d28d9 100%)', padding:'20px 24px', position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                            <div>
                                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', marginBottom:'4px' }}>OnTime Bus Services</div>
                                <div style={{ color:'white', fontSize:'22px', fontWeight:700 }}>E-Ticket</div>
                                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px', marginTop:'2px' }}>Booked: {bookedAt}</div>
                            </div>
                            <div>
                                <div style={{ background: status === 'confirmed' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)', border:`1px solid ${status === 'confirmed' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)'}`, color: status === 'confirmed' ? '#6ee7b7' : '#fca5a5', padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', display:'flex', alignItems:'center', gap:'4px' }}>
                                    <CheckCircle size={10} /> {status}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket ID strip */}
                    <div style={{ background:'#f8fafc', borderBottom:'2px dashed #e2e8f0', padding:'10px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <Hash size={14} color="#6366f1" />
                            <span style={{ fontFamily:'monospace', fontSize:'14px', fontWeight:700, color:'#1e293b', letterSpacing:'1px' }}>{ticketId}</span>
                        </div>
                        <span style={{ fontSize:'11px', color:'#94a3b8' }}>Ticket ID</span>
                    </div>

                    {/* Journey */}
                    <div style={{ padding:'20px 24px' }}>
                        <div style={{ marginBottom:'20px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
                                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#10b981', border:'2px solid white', boxShadow:'0 0 0 2px #10b981' }} />
                                    <div style={{ width:1, height:28, background:'linear-gradient(to bottom,#10b981,#6366f1)', borderRadius:'1px' }} />
                                    <div style={{ width:10, height:10, borderRadius:'50%', background:'#6366f1', border:'2px solid white', boxShadow:'0 0 0 2px #6366f1' }} />
                                </div>
                                <div style={{ flex:1 }}>
                                    <div style={{ marginBottom:'14px' }}>
                                        <div style={{ fontSize:'11px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px' }}>From</div>
                                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a' }}>{fromStop}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize:'11px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px' }}>To</div>
                                        <div style={{ fontSize:'16px', fontWeight:700, color:'#0f172a' }}>{toStop}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
                            {[
                                { icon: <Bus size={13}/>, label:'Bus', value:busNumber },
                                { icon: <MapPin size={13}/>, label:'Route', value: routeName.length > 20 ? routeName.substring(0,20)+'…' : routeName },
                                { icon: <Calendar size={13}/>, label:'Travel Date', value:formattedDate },
                                { icon: <User size={13}/>, label:'Passenger', value:passengerName },
                            ].map(({ icon, label, value }) => (
                                <div key={label} style={{ background:'#f8fafc', borderRadius:'10px', padding:'10px 12px' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'5px', color:'#94a3b8', fontSize:'11px', marginBottom:'3px' }}>{icon} {label}</div>
                                    <div style={{ fontSize:'13px', fontWeight:600, color:'#1e293b' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Seats */}
                        <div style={{ background:'#f8fafc', borderRadius:'10px', padding:'12px', marginBottom:'16px' }}>
                            <div style={{ fontSize:'11px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'8px' }}>Seat(s)</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                                {(seatNumbers.length > 0 ? seatNumbers : ['N/A']).map(seat => (
                                    <div key={seat} style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', borderRadius:'6px', padding:'4px 10px', fontSize:'13px', fontWeight:700, boxShadow:'0 2px 4px rgba(99,102,241,0.3)' }}>{seat}</div>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'linear-gradient(135deg,#ede9fe,#ddd6fe)', borderRadius:'10px' }}>
                            <span style={{ fontSize:'13px', color:'#4c1d95', fontWeight:600 }}>Total Paid</span>
                            <span style={{ fontSize:'22px', fontWeight:800, color:'#4c1d95' }}>₹{amount}</span>
                        </div>
                    </div>

                    {/* Tear line */}
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                        <div style={{ position:'absolute', left:-14, width:28, height:28, borderRadius:'50%', background:'#f0f4f8', border:'2px solid #e2e8f0' }} />
                        <div style={{ flex:1, borderTop:'2px dashed #e2e8f0', margin:'0 16px' }} />
                        <div style={{ position:'absolute', right:-14, width:28, height:28, borderRadius:'50%', background:'#f0f4f8', border:'2px solid #e2e8f0' }} />
                    </div>

                    {/* QR section */}
                    <div style={{ padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafafa' }}>
                        <div>
                            <div style={{ fontSize:'11px', color:'#94a3b8', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'1px' }}>Scan to verify</div>
                            <div style={{ fontFamily:'monospace', fontSize:'12px', color:'#475569', letterSpacing:'1px' }}>{ticketId}</div>
                            <div style={{ fontSize:'11px', color:'#cbd5e1', marginTop:'4px' }}>Present this ticket to the conductor</div>
                        </div>
                        <RealQR value={`ONTIME:${ticketId}:${busNumber}:${fromStop}:${toStop}`} size={80} />
                    </div>

                    {/* Footer */}
                    <div style={{ background:'#1e293b', padding:'12px 24px', textAlign:'center' }}>
                        <div style={{ fontSize:'11px', color:'#475569' }}>Computer-generated ticket. Valid ID required during travel. • OnTime Bus Tracking System</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ETicket;
