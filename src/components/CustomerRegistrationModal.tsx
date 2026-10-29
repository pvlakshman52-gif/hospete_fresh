import React, { useState } from 'react';
import { User, Phone, MapPin, CheckCircle, ShieldCheck, ShoppingBag, X, Loader2, ArrowRight } from 'lucide-react';
import type { Product, ProductVariant, Locality } from '../types.ts';

export interface RegisteredCustomer {
  id: string;
  fullName: string;
  phone: string;
  defaultAddress?: string;
  locality?: string;
  createdAt?: string;
}

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItem?: {
    product: Product;
    variant: ProductVariant;
    qtyToAdd: number;
  } | null;
  onRegistered: (customer: RegisteredCustomer) => void;
  localities?: Locality[];
  initialPhone?: string;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  pendingItem,
  onRegistered,
  localities = [],
  initialPhone = '',
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'lookup'>('register');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [defaultAddress, setDefaultAddress] = useState('');
  const [locality, setLocality] = useState('Patel Nagar');

  const [lookupPhone, setLookupPhone] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          defaultAddress: defaultAddress.trim() || undefined,
          locality: locality || 'Patel Nagar',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register customer.');
      }

      setSuccessMessage(data.message || 'Account verified successfully!');
      setTimeout(() => {
        onRegistered(data.customer);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while registering account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = lookupPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/customers/validate?phone=${encodeURIComponent(cleanPhone)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate phone number.');
      }

      if (data.registered && data.customer) {
        setSuccessMessage(`Welcome back, ${data.customer.fullName}!`);
        setTimeout(() => {
          onRegistered(data.customer);
        }, 500);
      } else {
        setErrorMessage('No customer account found with this phone number. Please fill out the registration form.');
        setPhone(cleanPhone);
        setActiveTab('register');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while checking account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-full sm:max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-3.5 sm:p-4 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 p-1 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-600/60 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
              Hospete Fresh • Customer Verification
            </span>
          </div>
          <h2 className="text-lg font-black tracking-tight">Customer Registration Required</h2>
          <p className="text-xs text-emerald-100 mt-1">
            To add fresh groceries to your cart and enable 15-minute delivery, please register or verify your account.
          </p>
        </div>

        {/* Pending Item Preview */}
        {pendingItem && (
          <div className="p-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center">
              {pendingItem.product.imageUrl ? (
                <img
                  src={pendingItem.product.imageUrl}
                  alt={pendingItem.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Adding to Basket
              </div>
              <div className="text-xs font-black text-slate-900 truncate">
                {pendingItem.product.name}
              </div>
              <div className="text-[11px] text-slate-600">
                {pendingItem.variant.packSize} • <strong className="text-emerald-700 font-bold">₹{pendingItem.variant.price}</strong>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
              Qty: {pendingItem.qtyToAdd}
            </span>
          </div>
        )}

        {/* Tabs for Register vs Lookup */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('lookup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'lookup'
                ? 'border-emerald-600 text-emerald-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Quick Phone Verify
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
              <span className="text-rose-600 font-bold">⚠️</span>
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          {activeTab === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Rao"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  10-Digit Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-r-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Used for order tracking, OTP, and dispatch alerts</p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Locality in Hospete <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={locality}
                    onChange={e => setLocality(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold bg-white"
                  >
                    {localities.length > 0 ? (
                      localities.map(loc => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name} ({loc.etaMinutes} mins • {loc.pincode})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Patel Nagar">Patel Nagar</option>
                        <option value="College Road">College Road</option>
                        <option value="Station Road">Station Road</option>
                        <option value="TB Dam Road">TB Dam Road</option>
                        <option value="Gandhi Nagar">Gandhi Nagar</option>
                        <option value="Ranipet">Ranipet</option>
                        <option value="Amaravathi">Amaravathi</option>
                        <option value="Chitwadgi">Chitwadgi</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Delivery Address (House / Street / Landmark)
                </label>
                <input
                  type="text"
                  value={defaultAddress}
                  onChange={e => setDefaultAddress(e.target.value)}
                  placeholder="e.g. #42, 3rd Cross, Opp. High School"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Registration to Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Continue to Cart</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                Enter your 10-digit mobile number to verify your existing Hospete Fresh customer account from our database.
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Registered Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-slate-200 bg-slate-100 text-slate-600 text-xs font-bold rounded-l-xl">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={lookupPhone}
                    onChange={e => setLookupPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9845012345"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-r-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold tracking-wider"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Database...</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    <span>Verify & Continue to Cart</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 border-t border-slate-100 p-2.5 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL Verified Customer Records • 100% Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};
