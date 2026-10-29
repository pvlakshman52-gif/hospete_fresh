import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  HelpCircle,
  Home,
  Bike,
  Navigation,
  CheckCircle2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Order } from '../types.ts';

interface CustomerOrderTrackingScreenProps {
  order: Order;
  onBack: () => void;
  onHelp?: () => void;
}

export const CustomerOrderTrackingScreen: React.FC<CustomerOrderTrackingScreenProps> = ({
  order,
  onBack,
  onHelp
}) => {
  // Live rider movement simulation state (0 = start, 100 = arrived at destination)
  const [riderProgress, setRiderProgress] = useState<number>(() => {
    if (order.status === 'Delivered') return 100;
    if (order.status === 'Out for Delivery') return 45;
    if (order.status === 'Packed') return 15;
    return 5;
  });

  const [isSimulating, setIsSimulating] = useState(order.status === 'Out for Delivery');
  const [etaMinutes, setEtaMinutes] = useState(15);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [isGpsExpanded, setIsGpsExpanded] = useState<boolean>(false);

  // Dynamic rider movement simulation
  useEffect(() => {
    if (!isSimulating || order.status === 'Delivered') return;

    const interval = setInterval(() => {
      setRiderProgress(prev => {
        if (prev >= 98) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, order.status]);

  useEffect(() => {
    // Dynamic ETA calculation based on progress
    if (riderProgress >= 100 || order.status === 'Delivered') {
      setEtaMinutes(0);
    } else if (order.status === 'Packed') {
      setEtaMinutes(20);
    } else if (order.status === 'Placed') {
      setEtaMinutes(25);
    } else {
      const remaining = Math.max(2, Math.round(15 * (1 - (riderProgress - 20) / 80)));
      setEtaMinutes(remaining);
    }
  }, [riderProgress, order.status]);

  // Delivery status step determination
  const steps = [
    { id: 'Confirmed', label: 'Confirmed' },
    { id: 'Packed', label: 'Packed' },
    { id: 'Out for Delivery', label: 'Out for Delivery' },
    { id: 'Delivered', label: 'Delivered' }
  ];

  const currentStepIdx = steps.findIndex(s => s.id === order.status);
  const activeStep = currentStepIdx >= 0 ? currentStepIdx : 2; // Default to Out for Delivery

  // Polyline coordinates for 2.5D road path
  // Start: Hospete Hub (x: 50, y: 150) -> waypoint 1 (140, 100) -> waypoint 2 (220, 160) -> Destination (290, 80)
  const pathPoints = [
    { x: 50, y: 155 },
    { x: 135, y: 105 },
    { x: 220, y: 165 },
    { x: 285, y: 85 }
  ];

  // Interpolate rider coordinates based on progress (0% to 100%)
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

  const handleCall = () => {
    window.location.href = 'tel:9845012345';
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello Ramesh, I am tracking my Hospete Fresh order #${order.orderNumber}. Can you please update on current arrival time?`
    );
    window.open(`https://wa.me/919845012345?text=${text}`, '_blank');
  };

  const copyPhoneNumber = () => {
    navigator.clipboard?.writeText('9845012345');
    setPhoneCopied(true);
    setTimeout(() => setPhoneCopied(false), 2000);
  };

  // FULL-SCREEN LIVE GPS NAVIGATION (Matching Screen 12 in Delivery Portal)
  if (isGpsExpanded) {
    return (
      <div className="h-full flex flex-col bg-slate-900 text-white relative font-sans w-full overflow-hidden select-none animate-in fade-in duration-200">
        {/* Top Bar with ETA matching Delivery Navigation Screen */}
        <div className="p-3.5 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between z-20 shrink-0">
          <button
            onClick={() => setIsGpsExpanded(false)}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Back to Order Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-sm font-black text-emerald-400">
              {riderProgress >= 100
                ? 'Arrived at your doorstep!'
                : `${(Math.max(0.2, (1 - riderProgress / 100) * 1.8)).toFixed(1)} km • ${etaMinutes} mins`}
            </div>
            <div className="text-[10px] text-slate-400">Fastest route via College Road</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSimulating(!isSimulating)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              {isSimulating ? 'Pause' : 'Live'}
            </button>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(order.address + ' ' + order.locality + ' Hospete')}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-colors"
            >
              Open Maps
            </a>
          </div>
        </div>

        {/* Interactive Simulated Vector Map Canvas (matching Screen 12 in Delivery Portal) */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 340 380" preserveAspectRatio="xMidYMid slice">
            <rect width="340" height="380" fill="#090d16" />
            <path d="M 50 0 L 50 380 M 150 0 L 150 380 M 260 0 L 260 380" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M 0 80 L 340 80 M 0 180 L 340 180 M 0 280 L 340 280" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />

            <text x="35" y="60" fill="#475569" fontSize="9" fontWeight="bold">College Rd</text>
            <text x="135" y="75" fill="#475569" fontSize="9" fontWeight="bold">Dam Rd</text>
            <text x="210" y="70" fill="#475569" fontSize="9" fontWeight="bold">Gandhi Nagar</text>
            <text x="120" y="270" fill="#475569" fontSize="9" fontWeight="bold">Patel Nagar 3rd Cross</text>

            <path
              d="M 50 250 L 135 170 L 220 230 L 285 110"
              stroke="#1e293b"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 50 250 L 135 170 L 220 230 L 285 110"
              stroke="#0f172a"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 50 250 L 135 170 L 220 230 L 285 110"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle cx="50" cy="250" r="6" fill="#10b981" />
            <circle cx="50" cy="250" r="11" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 2" />

            <g transform="translate(270, 75)">
              <circle cx="15" cy="35" r="16" fill="#10b981" fillOpacity="0.25">
                <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
              </circle>
              <path
                d="M 15 4 C 8.37 4 3 9.37 3 16 C 3 24.5 15 37 15 37 C 15 37 27 24.5 27 16 C 27 9.37 21.63 4 15 4 Z"
                fill="#10b981"
                filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.5))"
              />
              <path
                d="M 15 9 L 8.5 14.5 L 10 14.5 L 10 21 L 13 21 L 13 17 L 17 17 L 17 21 L 20 21 L 20 14.5 L 21.5 14.5 Z"
                fill="#ffffff"
              />
            </g>
          </svg>

          {/* Animated Delivery Rider Vehicle */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-20 pointer-events-none"
            style={{
              left: `${(riderPos.x / 340) * 100}%`,
              top: `${((riderPos.y + 35) / 380) * 100}%`
            }}
          >
            <div className="absolute -inset-2 rounded-full bg-emerald-500/40 animate-ping" />
            <div className="relative w-12 h-10 drop-shadow-lg">
              <svg viewBox="0 0 48 36" className="w-full h-full">
                <ellipse cx="24" cy="31" rx="18" ry="4" fill="rgba(0,0,0,0.5)" />
                <path d="M 8 20 L 38 18 L 42 26 L 6 27 Z" fill="#ea580c" />
                <circle cx="14" cy="27" r="4" fill="#0f172a" />
                <circle cx="14" cy="27" r="1.5" fill="#e2e8f0" />
                <circle cx="34" cy="26" r="4" fill="#0f172a" />
                <circle cx="34" cy="26" r="1.5" fill="#e2e8f0" />
                <path d="M 10 14 L 36 12 L 38 20 L 8 20 Z" fill="#0284c7" />
                <path d="M 14 8 L 30 7 L 34 13 L 12 14 Z" fill="#ffffff" />
                <path d="M 28 8 L 33 13 L 27 13 Z" fill="#38bdf8" />
                <circle cx="41" cy="22" r="1.5" fill="#fef08a" />
              </svg>
            </div>
          </div>

          {/* Floating Driver Info Card on top of Map (matching delivery storyboard) */}
          <div className="absolute top-3 left-3 right-3 bg-slate-900/95 border border-slate-700/80 backdrop-blur rounded-2xl p-3 shadow-xl z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                    alt="Ramesh"
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    ⚡
                  </span>
                </div>
                <div>
                  <h3 className="font-black text-white text-xs leading-tight">Ramesh</h3>
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Out for delivery • 4.8 ★</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCall}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="Call Driver"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Live Distance & Status Badge at bottom left */}
          <div className="absolute bottom-4 left-3 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-black text-white z-20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {riderProgress >= 100
                ? 'Arrived at your door'
                : `${(Math.max(0.2, (1 - riderProgress / 100) * 1.8)).toFixed(1)} km away • ${etaMinutes} mins`}
            </span>
          </div>
        </div>

        {/* Bottom Action: Back to Order Details (matching Screen 12 in Delivery screen) */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 z-20 shrink-0">
          <button
            type="button"
            onClick={() => setIsGpsExpanded(false)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>&larr; Back to Order Details & Items</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-slate-50 relative font-sans text-slate-800 w-full overflow-hidden">
      {/* 1. TOP HEADER (Matching reference screenshot: ← Order #ORD12345  Help) */}
      <header className="shrink-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <h1 className="text-base font-black text-slate-900 tracking-tight">
          Order #{order.orderNumber}
        </h1>

        <button
          onClick={() => (onHelp ? onHelp() : setShowHelpModal(true))}
          className="text-emerald-700 hover:text-emerald-800 font-extrabold text-sm px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          Help
        </button>
      </header>

      {/* SCROLLABLE BODY CONTENT - Entire order screen scrolls smoothly through all items and details */}
      <div className="flex-1 min-h-0 overflow-y-auto touch-pan-y visible-scrollbar pb-16 overscroll-contain">
        {/* 2. ORDER STATUS CARD (Matching reference screenshot light-green banner) */}
        <div className="p-4">
        <div className="bg-[#eefbf4] border border-[#d1f4e0] rounded-3xl p-5 shadow-xs relative overflow-hidden">
          {/* Subtle decorative background pattern */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />

          <div className="relative z-10 mb-4">
            <h2 className="text-lg font-black text-slate-900 leading-snug">
              {order.status === 'Delivered'
                ? 'Your order has been delivered!'
                : order.status === 'Out for Delivery'
                ? 'Your order is on the way!'
                : order.status === 'Packed'
                ? 'Your order is freshly packed!'
                : 'Order confirmed & assigned!'}
            </h2>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {order.status === 'Delivered'
                ? `Delivered to your doorstep (${order.deliveredAt || order.estimatedDeliveryTime || 'Completed'})`
                : `Arriving in ${etaMinutes} minutes`}
            </p>

            {/* Prominent Estimated Delivery Time Box for Customer */}
            <div className="mt-3 bg-white/95 border border-emerald-300 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Estimated Delivery Time (ETA)
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    {order.status === 'Delivered'
                      ? `Delivered at ${order.deliveredAt || order.estimatedDeliveryTime || '10:31 AM'}`
                      : `Expected by ${order.estimatedDeliveryTime || '10:35 AM'} (${etaMinutes} mins left)`}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                {order.status === 'Delivered' ? 'Delivered' : `⚡ ${etaMinutes}m ETA`}
              </span>
            </div>
          </div>

          {/* 4-Step Progress Bar (Confirmed -> Packed -> Out for Delivery -> Delivered) */}
          <div className="relative pt-2 pb-1">
            {/* Background line */}
            <div className="absolute top-[17px] left-3 right-3 h-[3px] bg-slate-200/80 -translate-y-1/2 z-0 rounded-full" />

            {/* Active connecting green line */}
            <div
              className="absolute top-[17px] left-3 h-[3.5px] bg-emerald-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500"
              style={{
                width: `${(activeStep / (steps.length - 1)) * 92}%`
              }}
            />

            {/* Step circles */}
            <div className="flex justify-between items-center relative z-10">
              {steps.map((st, idx) => {
                const isPassed = idx < activeStep;
                const isCurrent = idx === activeStep;

                return (
                  <div key={st.id} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-110 shadow-sm'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-500'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-bold text-center leading-tight max-w-[62px] ${
                        isCurrent
                          ? 'text-slate-900 font-extrabold'
                          : isPassed
                          ? 'text-emerald-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. START NAVIGATION ACTION (Matching Delivery Screen) */}
      <div className="px-4 mb-4">
        <button
          type="button"
          onClick={() => setIsGpsExpanded(true)}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group"
          aria-label="Start Navigation"
        >
          <Navigation className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>Start Navigation &rarr;</span>
        </button>
      </div>

      {/* 4. DELIVERY PARTNER CARD (Matching reference screenshot: photo, Ramesh, 4.8, Call, WhatsApp) */}
      <div className="px-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Delivery Driver Avatar */}
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Delivery Partner Ramesh"
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                ⚡
              </span>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-sm leading-tight">Ramesh</h3>
              <p className="text-xs text-slate-500 font-medium">Delivery Partner</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-amber-500 text-xs">★</span>
                <span className="text-xs font-black text-slate-700">4.8</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">(540+ drops)</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Call & WhatsApp */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCall}
              className="w-11 h-11 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Call Ramesh (9845012345)"
            >
              <Phone className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={handleWhatsApp}
              className="w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-2xs"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. "ITEMS IN THIS ORDER" SECTION (Matching reference screenshot exactly) */}
      <div className="px-4 space-y-3">
        <h3 className="text-sm font-black text-slate-900 tracking-tight">
          Items in this order
        </h3>

        <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-xs divide-y divide-slate-100">
          {order.items.map((it, idx) => {
            // Find appropriate fresh produce image if none provided
            const isTomato = it.productName.toLowerCase().includes('tomato');
            const isBanana = it.productName.toLowerCase().includes('banana');
            const isOnion = it.productName.toLowerCase().includes('onion');
            const isGhee = it.productName.toLowerCase().includes('ghee');
            const isSpinach = it.productName.toLowerCase().includes('spinach') || it.productName.toLowerCase().includes('palak');

            let fallbackImage = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80';
            if (isTomato) fallbackImage = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=150&q=80';
            else if (isBanana) fallbackImage = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=150&q=80';
            else if (isOnion) fallbackImage = 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=150&q=80';
            else if (isGhee) fallbackImage = 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=150&q=80';
            else if (isSpinach) fallbackImage = 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=150&q=80';

            return (
              <div key={idx} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={fallbackImage}
                      alt={it.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 leading-tight truncate">
                      {it.productName}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {it.packSize} × {it.quantity}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900">
                    ₹{it.subtotal}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. DELIVERY DESTINATION INFO */}
      <div className="px-4 mt-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-4 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-slate-900">{order.customerName}</div>
              <div className="text-slate-600 mt-0.5">{order.address}, {order.locality}</div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-slate-700">
            <span>Payment Mode: <strong>{order.paymentMethod}</strong></span>
            <span className="font-black text-emerald-700 text-sm">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>

      {/* HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Hospete Fresh Support</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Need assistance with Order <strong>#{order.orderNumber}</strong>? Our support desk in Hospete is active daily from 6:00 AM to 11:00 PM.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={handleCall}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Call Rider Ramesh (+91 9845012345)</span>
              </button>
              <button
                onClick={handleWhatsApp}
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Live Chat</span>
              </button>
              <button
                onClick={copyPhoneNumber}
                className="w-full py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {phoneCopied ? '✓ Phone Number Copied' : 'Copy Driver Number'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
