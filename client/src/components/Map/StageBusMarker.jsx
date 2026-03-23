import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const stagePinIcon = new L.DivIcon({
    html: `<div style="
        background: linear-gradient(135deg,#8b5cf6,#3b82f6);
        color:white; font-size:10px; font-weight:700;
        padding:4px 8px; border-radius:12px;
        border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        white-space:nowrap;
        display:flex;align-items:center;gap:4px;
    ">
        <span style="font-size:12px">🚌</span>
        <span>STAGE</span>
    </div>`,
    className: '',
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
});

const StageBusMarker = ({ busNumber, stageName, lat, lng }) => {
    if (!lat || !lng) return null;
    return (
        <Marker position={[lat, lng]} icon={stagePinIcon}>
            <Popup>
                <div className="p-2">
                    <div className="font-bold text-sm">{busNumber}</div>
                    <div className="text-xs text-purple-600 font-semibold mt-0.5">
                        At stage: {stageName}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Stage-confirmed location</div>
                </div>
            </Popup>
        </Marker>
    );
};

export default StageBusMarker;
