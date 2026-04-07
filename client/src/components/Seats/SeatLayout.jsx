/**
 * SeatLayout — reusable bus seat grid component.
 *
 * Props:
 *   capacity      {number}   Total seats in the bus (default 47)
 *   reservedSeats {number[]} Seats that are already booked/reserved
 *   selectedSeats {number[]} Seats currently selected by the user (optional, interactive mode)
 *   onSeatClick   {fn}       If provided, seats become clickable (interactive mode)
 *   compact       {boolean}  Smaller seat tiles for tight spaces (default false)
 */
const SeatLayout = ({
    capacity = 47,
    reservedSeats = [],
    selectedSeats = [],
    onSeatClick = null,
    compact = false,
}) => {
    const tileSize = compact ? 28 : 36;
    const fontSize = compact ? 9 : 11;

    const renderSeat = (seatNum) => {
        if (seatNum === null) {
            return <div key={`gap-${Math.random()}`} style={{ width: tileSize }} />;
        }

        const isReserved = reservedSeats.includes(seatNum);
        const isSelected = selectedSeats.includes(seatNum);
        const isInteractive = !!onSeatClick && !isReserved;

        let bg, border, color, cursor;
        if (isReserved) {
            bg = '#374151'; border = '#4b5563'; color = '#6b7280'; cursor = 'not-allowed';
        } else if (isSelected) {
            bg = '#7c3aed'; border = '#8b5cf6'; color = '#fff'; cursor = 'pointer';
        } else {
            bg = 'rgba(255,255,255,0.06)'; border = 'rgba(255,255,255,0.15)'; color = '#d1d5db'; cursor = isInteractive ? 'pointer' : 'default';
        }

        return (
            <button
                key={seatNum}
                disabled={isReserved || !onSeatClick}
                onClick={() => onSeatClick?.(seatNum)}
                title={isReserved ? `Seat ${seatNum} — reserved` : `Seat ${seatNum}`}
                style={{
                    width: tileSize, height: tileSize,
                    borderRadius: 4,
                    fontSize, fontWeight: 700,
                    cursor,
                    border: `1px solid ${border}`,
                    background: bg,
                    color,
                    transition: 'all 0.12s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative', overflow: 'hidden',
                    userSelect: 'none',
                }}
            >
                {seatNum}
                {/* Green right-edge stripe on free seats */}
                {!isReserved && !isSelected && (
                    <div style={{
                        position: 'absolute', right: 0, top: '15%',
                        height: '70%', width: 3,
                        background: '#10b981',
                        borderRadius: '2px 0 0 2px'
                    }} />
                )}
            </button>
        );
    };

    /**
     * Build rows for the standard 47-seat bus layout.
     * Row pattern (pairs of seats with aisle gap in the middle):
     *   cols: A B  [aisle]  C D
     * Seat numbering mirrors the BookTicket page layout.
     */
    const buildRows = () => {
        if (capacity <= 47) {
            // Fixed layout matching BookTicket exactly
            return [
                [1, 8, 9, 16, 17, 24, 25, 32, 33, 40, null, 47],
                [2, 7, 10, 15, 18, 23, 26, 31, 34, 39, null, 46],
                'spacer-45',          // aisle row with only last seat
                [3, 6, 11, 14, 19, 22, 27, 30, 35, 38, 41, 44],
                [4, 5, 12, 13, 20, 21, 28, 29, 36, 37, 42, 43],
            ];
        }
        // Generic layout for larger buses (60 seats max)
        const rows = [];
        const seatsPerCol = Math.ceil(capacity / 4);
        for (let r = 0; r < seatsPerCol; r++) {
            const row = [];
            for (let col = 0; col < 4; col++) {
                const n = col * seatsPerCol + r + 1;
                if (n <= capacity) row.push(n);
                if (col === 1) row.push(null); // aisle
            }
            rows.push(row);
        }
        return rows;
    };

    const rows = buildRows();
    const gap = compact ? 4 : 5;

    return (
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                {[
                    { label: 'Free', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)', stripe: true },
                    { label: 'Reserved', bg: '#374151', border: '#4b5563', stripe: false },
                    ...(onSeatClick ? [{ label: 'Selected', bg: '#7c3aed', border: '#8b5cf6', stripe: false }] : []),
                ].map(({ label, bg, border, stripe }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{
                            width: 14, height: 14, borderRadius: 3,
                            background: bg, border: `1px solid ${border}`,
                            position: 'relative', overflow: 'hidden', flexShrink: 0
                        }}>
                            {stripe && (
                                <div style={{
                                    position: 'absolute', right: 0, top: '15%',
                                    height: '70%', width: 2,
                                    background: '#10b981', borderRadius: '1px 0 0 1px'
                                }} />
                            )}
                        </div>
                        <span style={{ color: '#9ca3af', fontSize: 10 }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Driver indicator */}
            <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 6, textAlign: 'center' }}>
                ▲ DRIVER
            </div>

            {/* Seat grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap, minWidth: 'max-content' }}>
                {rows.map((row, ri) => {
                    if (row === 'spacer-45') {
                        return (
                            <div key="spacer" style={{ height: compact ? 20 : 26, display: 'flex', gap, alignItems: 'center' }}>
                                {Array(10).fill(null).map((_, i) => <div key={i} style={{ width: tileSize }} />)}
                                <div style={{ width: tileSize }} />
                                {renderSeat(45)}
                            </div>
                        );
                    }
                    return (
                        <div key={ri} style={{ display: 'flex', gap }}>
                            {row.map((n, ci) => n === null
                                ? <div key={`aisle-${ri}-${ci}`} style={{ width: tileSize }} />
                                : renderSeat(n)
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SeatLayout;
