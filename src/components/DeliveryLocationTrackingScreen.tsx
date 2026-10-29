import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  Clock,
  Compass,
  Bike,
  ExternalLink,
  ShieldCheck,
  Check,
  Package,
  AlertTriangle
} from 'lucide-react';
import { Order } from '../types.ts';

interface DeliveryLocationTrackingScreenProps {
  order: Order;
  onBack: () => void;
  onUpdateStatus: (newStatus: Order['status']) => void;
}

export const DeliveryLocationTrackingScreen: React.FC<DeliveryLocationTrackingScreenProps> = ({
  order,
  onBack,
  onUpdateStatus
}) => {
  // Rider simulation progression along route (0 to 100)
  const [riderProgress, setRiderProgress] = useState(35);
  const [isSimulating, setIsSimulating] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(28);
  const [arrivedAtDoor, setArrivedAtDoor] = useState(false);
  const [deliveredConfirmed, setDeliveredConfirmed] = useState(order.status === 'Delivered');

  // Next turn-by-turn guidance based on progress
  const navigationSteps = [
    { at: 0, text: 'Head northeast on College Road toward Bus Stand', dist: '400 m' },
    { at: 30, text: 'Turn right at Circle onto Dam Road', dist: '650 m' },
    { at: 60, text: 'Take 2nd left onto Gandhi Nagar 3rd Cross', dist: '300 m' },
    { at: 85, text: 'Arrive at #42, Patel Nagar on your left', dist: '80 m' }
  ];

  const currentNav =
    navigationSteps.slice().reverse().find(s => riderProgress >= s.at) || navigationSteps[0];

  useEffect(() => {
    if (!isSimulating || riderProgress >= 100) return;

    const timer = setInterval(() => {
      setRiderProgress(prev => {
        if (prev >= 98) {
          setArrivedAtDoor(true);
          return 100;
        }
        return prev + 2;
      });
      // slight speed fluctuation
      setCurrentSpeed(prev => Math.max(18, Math.min(36, prev + (Math.random() > 0.5 ? 2 : -2))));
    }, 1000);

    return () => clearInterval(timer);
  }, [isSimulating, riderProgress]);

  // Waypoints for Hospete route
  const pathPoints = [
    { x: 40, y: 190 },
    { x: 120, y: 130 },
    { x: 210, y: 170 },
    { x: 290, y: 65 }
  ];

  const getRiderCoordinates = (pct: number) => {
    if (pct <= 33) {
      const t = pct / 33;
      return {
        x: pathPoints[0].x + (pathPoints[1].x - pathPoints[0].x) * t,
        y: pathPoints[0].y + (pathPoints[1].y - pathPoints[0].y) * t
      };
    } else if (pct <= 66) {
      const t = (pct - 33) / 33;
      return {
        x: pathPoints[1].x + (pathPoints[2].x - pathPoints[1].x) * t,
        y: pathPoints[1].y + (pathPoints[2].y - pathPoints[1].y) * t
      };
    } else {
      const t = (pct - 66) / 34;
      return {
        x: pathPoints[2].x + (pathPoints[3].x - pathPoints[2].x) * t,
        y: pathPoints[2].y + (pathPoints[3].y - pathPoints[2].y) * t
      };
    }
  };

  const riderPos = getRiderCoordinates(riderProgress);

  const handleCallCustomer = () => {
    window.location.href = `tel:${order.phone}`;
  };

  const handleWhatsAppCustomer = () => {
    const text = encodeURIComponent(
      `Hello ${order.customerName}, I am your Hospete Fresh delivery rider. I am outside your location at ${order.address}.`
    );
    window.open(`https://wa.me/91${order.phone}?text=${text}`, '_blank');
  };

  const openGoogleMapsDirections = () => {
    const destination = encodeURIComponent(`${order.address}, ${order.locality}, Hospete`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const handleConfirmDelivery = () => {
    setDeliveredConfirmed(true);
    onUpdateStatus('Delivered');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-start pb-20 max-w-lg mx-auto shadow-2xl relative font-sans">
      {/* 1. TOP HEADER & GPS STATUS */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Back to Dispatch"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div className="text-center">
          <div className="text-xs font-black tracking-wider text-slate-400 uppercase">
            RIDER NAVIGATION
          </div>
          <div className="text-sm font-black text-white">
            Order #{order.orderNumber}
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>GPS LIVE</span>
        </div>
      </header>

      {/* 2. TURN-BY-TURN HUD BANNER */}
      <div className="p-3 pb-1.5">
        <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Navigation className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wide">
                Next Maneuver ({currentNav.dist})
              </div>
              <h2 className="text-sm sm:text-base font-black leading-tight truncate">
                {arrivedAtDoor ? 'You Have Arrived at Destination!' : currentNav.text}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg font-black leading-none">{currentSpeed}</div>
            <div className="text-[10px] font-bold text-emerald-200">km/h</div>
          </div>
        </div>
      </div>

      {/* 2B. TARGET ESTIMATED DELIVERY TIME (SLA DEADLINE FOR RIDER) */}
      <div className="px-3 pb-2">
        <div className="bg-amber-950/80 border border-amber-500/60 rounded-2xl p-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                Target Estimated Delivery Time
              </div>
              <div className="text-sm font-black text-white">
                {deliveredConfirmed || order.status === 'Delivered' ? (
                  <span className="text-emerald-400">Delivered successfully</span>
                ) : (
                  <span>Deliver before: <strong className="text-amber-400 font-black">{order.estimatedDeliveryTime || '10:35 AM'}</strong> ({riderProgress >= 100 ? 'Arrived at door!' : `${Math.max(1, Math.round((1 - riderProgress / 100) * (order.estimatedMinutes || 15)))} mins remaining`})</span>
                )}
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
            deliveredConfirmed || order.status === 'Delivered'
              ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300'
              : 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
          }`}>
            {deliveredConfirmed || order.status === 'Delivered' ? 'Completed' : `⏱️ ${order.estimatedMinutes || 15}m SLA`}
          </span>
        </div>
      </div>

      {/* 3. INTERACTIVE LIVE GPS ROUTE MAP */}
      <div className="px-3 mb-3">
        <div className="relative w-full h-72 bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-inner">
          <svg
            className="w-full h-full"
            viewBox="0 0 340 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dark mode satellite/street map canvas */}
            <rect width="340" height="240" fill="#0f172a" />

            {/* City blocks in dark slate */}
            <path d="M10 20 L90 5 L110 50 L25 70 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M125 15 L230 10 L210 65 L115 55 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M245 15 L325 30 L310 80 L230 70 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

            <path d="M30 85 L120 70 L105 140 L15 130 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M135 75 L235 85 L215 155 L125 145 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M250 95 L330 100 L320 170 L235 160 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

            <path d="M20 150 L110 160 L95 225 L10 215 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M125 165 L220 175 L205 235 L115 230 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <path d="M235 180 L325 185 L315 235 L225 235 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />

            {/* Street labels */}
            <text x="45" y="55" fill="#64748b" fontSize="8" fontWeight="bold">College Rd</text>
            <text x="145" y="70" fill="#64748b" fontSize="8" fontWeight="bold">Dam Rd</text>
            <text x="240" y="50" fill="#64748b" fontSize="8" fontWeight="bold">Gandhi Nagar</text>
            <text x="140" y="210" fill="#64748b" fontSize="8" fontWeight="bold">Patel Nagar (Drop-off)</text>

            {/* Road network base */}
            <path
              d="M 40 190 L 120 130 L 210 170 L 290 65"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 40 190 L 120 130 L 210 170 L 290 65"
              stroke="#1e293b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Navigation Polyline in Bright Emerald */}
            <path
              d="M 40 190 L 120 130 L 210 170 L 290 65"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 2"
            />

            {/* Hub Start Marker */}
            <circle cx="40" cy="190" r="6" fill="#0284c7" />
            <text x="15" y="215" fill="#38bdf8" fontSize="8" fontWeight="bold">Hospete Hub</text>

            {/* Customer Drop-off Pin */}
            <g transform="translate(275, 30)">
              <circle cx="15" cy="35" r="16" fill="#10b981" fillOpacity="0.3">
                <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <path
                d="M 15 4 C 8.37 4 3 9.37 3 16 C 3 24.5 15 37 15 37 C 15 37 27 24.5 27 16 C 27 9.37 21.63 4 15 4 Z"
                fill="#10b981"
              />
              <path
                d="M 15 9 L 8.5 14.5 L 10 14.5 L 10 21 L 13 21 L 13 17 L 17 17 L 17 21 L 20 21 L 20 14.5 L 21.5 14.5 Z"
                fill="#ffffff"
              />
            </g>
          </svg>

          {/* Rider's live GPS Beacon with heading direction */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20 pointer-events-none"
            style={{
              left: `${(riderPos.x / 340) * 100}%`,
              top: `${(riderPos.y / 240) * 100}%`
            }}
          >
            {/* GPS pulse */}
            <div className="absolute -inset-3 rounded-full bg-emerald-400/40 animate-ping" />

            <div className="w-10 h-10 rounded-full bg-emerald-500 border-3 border-white shadow-xl flex items-center justify-center text-white">
              <Bike className="w-5 h-5" />
            </div>
          </div>

          {/* Map floating control overlay */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs border border-slate-700 px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>
              {riderProgress >= 100
                ? 'Arrived at Customer Door'
                : `${(Math.max(0.1, (1 - riderProgress / 100) * 1.8)).toFixed(1)} km remaining`}
            </span>
          </div>

          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={openGoogleMapsDirections}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 px-2.5 py-1.5 rounded-full cursor-pointer"
            >
              {isSimulating ? 'Pause' : 'Simulate'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMER CONTACT & DROP-OFF DETAILS */}
      <div className="px-3 mb-3">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                CUSTOMER & DROP-OFF
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {order.customerName}
              </h3>
            </div>

            {/* Quick Call & WhatsApp actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCallCustomer}
                className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 text-emerald-400 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title={`Call ${order.phone}`}
              >
                <Phone className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={handleWhatsAppCustomer}
                className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                title="WhatsApp Customer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 flex-1">
              <strong className="text-white block">{order.address}</strong>
              <span>{order.locality}, Hospete (PIN: 583201)</span>
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Estimated Delivery Time:</span>
                </span>
                <span className="font-extrabold text-amber-300">
                  {order.estimatedDeliveryTime || '10:35 AM'} (~{order.estimatedMinutes || 15} mins)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/40 border border-amber-600/40 p-3 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-amber-300 font-extrabold block">Payment to Collect</span>
              <span className="text-slate-400 text-[11px]">{order.paymentMethod}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-amber-400">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ITEM HANDOVER VERIFICATION CHECKLIST */}
      <div className="px-3 mb-4">
        <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>HANDOVER CHECKLIST ({order.items.length} items)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">100% Fresh Verified</span>
          </div>

          <div className="divide-y divide-slate-700/60 text-xs">
            {order.items.map((it, idx) => (
              <div key={idx} className="py-2 flex justify-between items-center text-slate-300">
                <span>
                  {it.quantity}x {it.productName} ({it.packSize})
                </span>
                <span className="font-extrabold text-white">₹{it.subtotal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RIDER ACTION BUTTONS */}
      <div className="px-3 space-y-2">
        {!arrivedAtDoor && (
          <button
            onClick={() => {
              setRiderProgress(100);
              setArrivedAtDoor(true);
            }}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer"
          >
            <MapPin className="w-5 h-5" />
            <span>I Have Arrived at Customer Location</span>
          </button>
        )}

        <button
          onClick={handleConfirmDelivery}
          className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
            deliveredConfirmed
              ? 'bg-emerald-700 text-white cursor-default'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {deliveredConfirmed ? '✓ Order Marked Delivered' : 'Complete Delivery & Confirm Payment'}
          </span>
        </button>
      </div>
    </div>
  );
};
