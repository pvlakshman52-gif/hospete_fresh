import React, { useState, useMemo, useEffect } from 'react';
import {
  Bike,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Camera,
  Upload,
  DollarSign,
  Wallet,
  Bell,
  FileText,
  CheckCircle,
  TrendingUp,
  LogOut,
  Calendar,
  Search,
  Filter,
  Sparkles,
  Smartphone,
  Plus,
  Minus,
  Lock,
  Compass,
  ArrowRight,
  Trash2,
  Loader2
} from 'lucide-react';
import { DeliveryPartner, Order, OrderDiscrepancy, DeliveryPartnerDocument } from '../types.ts';
import { INITIAL_DELIVERY_PARTNERS } from '../data.ts';

interface DeliveryPortalProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  deliveryPartners?: DeliveryPartner[];
  setDeliveryPartners?: React.Dispatch<React.SetStateAction<DeliveryPartner[]>>;
  onOpenNavigation?: (order: Order) => void;
  onBackToCustomer?: () => void;
}

export type RiderScreen =
  | 'login'
  | 'change_temp_password'
  | 'forgot_password'
  | 'register'
  | 'document_upload'
  | 'submitted'
  | 'approval_status'
  | 'dashboard'
  | 'assigned_orders'
  | 'order_details_before_pickup'
  | 'pickup_checklist'
  | 'picked_up_confirmation'
  | 'customer_details_after_pickup'
  | 'navigate_to_customer'
  | 'delivery_checklist'
  | 'mark_delivered'
  | 'delivered_success'
  | 'order_history'
  | 'earnings'
  | 'profile'
  | 'notifications';

export const DeliveryPortal: React.FC<DeliveryPortalProps> = ({
  orders,
  setOrders,
  deliveryPartners = INITIAL_DELIVERY_PARTNERS,
  setDeliveryPartners,
  onOpenNavigation,
  onBackToCustomer
}) => {
  // Active rider session with persistent storage
  const [currentRiderId, setCurrentRiderId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('hf_delivery_session');
      if (raw) {
        const sess = JSON.parse(raw);
        if (sess && sess.riderId) {
          if (!sess.expiresAt || new Date(sess.expiresAt).getTime() > Date.now()) {
            const list = deliveryPartners && deliveryPartners.length > 0 ? deliveryPartners : INITIAL_DELIVERY_PARTNERS;
            const found = list.find(p => p.id === sess.riderId);
            if (found && found.status !== 'suspended') {
              return found.id;
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return 'dlv-1'; // Ravi Kumar (DLV-001)
  });

  const [currentScreen, setCurrentScreen] = useState<RiderScreen>(() => {
    try {
      const isLoggedOut = localStorage.getItem('hf_delivery_logged_out') === 'true';
      if (isLoggedOut) return 'login';
      const raw = localStorage.getItem('hf_delivery_session');
      if (raw) {
        const sess = JSON.parse(raw);
        if (sess && sess.riderId) {
          const list = deliveryPartners && deliveryPartners.length > 0 ? deliveryPartners : INITIAL_DELIVERY_PARTNERS;
          const found = list.find(p => p.id === sess.riderId);
          if (found) {
            if (found.status === 'suspended') return 'login';
            if (found.status === 'pending' || found.status === 'under_review' || found.status === 'rejected') {
              return 'approval_status';
            }
            return 'dashboard';
          }
        }
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  });
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'orders' | 'earnings' | 'profile'>('home');

  // Active selected order for delivery workflow
  const [activeOrderId, setActiveOrderId] = useState<number | null>(83921);

  // Filter tabs inside Assigned Orders list
  const [assignedOrdersTab, setAssignedOrdersTab] = useState<'assigned' | 'picked_up' | 'delivered'>('assigned');
  const [ordersPage, setOrdersPage] = useState<number>(1);
  const [ordersPageSize, setOrdersPageSize] = useState<number>(5);
  const [historyFilterTab, setHistoryFilterTab] = useState<'all' | 'assigned' | 'picked_up' | 'delivered'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('9845012345');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);

  // First Login / Temporary Password Change state
  const [tempPasswordPhone, setTempPasswordPhone] = useState('');
  const [tempCurrentPassword, setTempCurrentPassword] = useState('');
  const [tempNewPassword, setTempNewPassword] = useState('');
  const [tempConfirmPassword, setTempConfirmPassword] = useState('');
  const [tempPasswordError, setTempPasswordError] = useState<string | null>(null);
  const [tempPasswordLoading, setTempPasswordLoading] = useState(false);
  const [showTempCurrentPassword, setShowTempCurrentPassword] = useState(false);
  const [showTempNewPassword, setShowTempNewPassword] = useState(false);
  const [showTempConfirmPassword, setShowTempConfirmPassword] = useState(false);

  // Forgot Password / Account Recovery state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoverySessionToken, setRecoverySessionToken] = useState<string | null>(null);
  const [recoveryResetToken, setRecoveryResetToken] = useState<string | null>(null);
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccessMessage, setRecoverySuccessMessage] = useState<string | null>(null);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [smsNotice, setSmsNotice] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Registration form state
  const [regFullName, setRegFullName] = useState('Ravi Kumar');
  const [regPhone, setRegPhone] = useState('9845012345');
  const [regEmail, setRegEmail] = useState('ravi@gmail.com');
  const [regServiceArea, setRegServiceArea] = useState('Hospete - MP Prakash Nagar');
  const [regVehicleType, setRegVehicleType] = useState<'Two Wheeler' | 'Electric Vehicle' | 'Bicycle' | 'Four Wheeler'>('Two Wheeler');
  const [regVehicleNumber, setRegVehicleNumber] = useState('KA-35-AB-1234');
  const [regLicenceNumber, setRegLicenceNumber] = useState('DL-1234567890');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [regApplicationId, setRegApplicationId] = useState('DP-2026-00123');

  // Document Uploads state (holds real document records with preview and metadata)
  const [photoDoc, setPhotoDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [aadhaarFrontDoc, setAadhaarFrontDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [aadhaarBackDoc, setAadhaarBackDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [licenceDoc, setLicenceDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [rcDoc, setRcDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [bankDoc, setBankDoc] = useState<DeliveryPartnerDocument | null>(null);
  const [regTermsConsent, setRegTermsConsent] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [previewDocModal, setPreviewDocModal] = useState<DeliveryPartnerDocument | null>(null);
  const [isResubmittingForPartnerId, setIsResubmittingForPartnerId] = useState<string | null>(null);

  // Pickup verification checklist counters & checks (key: `${orderId}-${itemIdx}`)
  const [pickupChecks, setPickupChecks] = useState<Record<string, boolean>>({
    '83921-0': true,
    '83921-1': true
  });
  const [verifiedQuantities, setVerifiedQuantities] = useState<Record<string, number>>({
    '83921-0': 2,
    '83921-1': 1
  });

  // Delivery drop-off checklist checks
  const [deliveryChecks, setDeliveryChecks] = useState<Record<string, boolean>>({
    '83921-0': true,
    '83921-1': true
  });

  // OTP delivery input (4 digits)
  const [otpDigit1, setOtpDigit1] = useState('2');
  const [otpDigit2, setOtpDigit2] = useState('8');
  const [otpDigit3, setOtpDigit3] = useState('4');
  const [otpDigit4, setOtpDigit4] = useState('6');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [deliveryPhotoProof, setDeliveryPhotoProof] = useState<string | null>(null);

  // Discrepancy Reporting Modal
  const [isDiscrepancyModalOpen, setIsDiscrepancyModalOpen] = useState(false);
  const [discrepancyReason, setDiscrepancyReason] = useState('Fresh Red Tomatoes (1 kg) - 1 pack missing from sealed box');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');

  // Confirmation before marking delivered modal
  const [isConfirmDeliverModalOpen, setIsConfirmDeliverModalOpen] = useState(false);

  // Notifications Modal
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Current active delivery partner
  const currentRider = useMemo(() => {
    return deliveryPartners.find(d => d.id === currentRiderId) || deliveryPartners[0];
  }, [deliveryPartners, currentRiderId]);

  // Current active order object with strict role/partner access control
  const activeOrder = useMemo(() => {
    if (activeOrderId) {
      const found = orders.find(o => o.id === activeOrderId);
      if (found) {
        const isOwner =
          found.assignedDeliveryBoyId === currentRider.id ||
          (Boolean(found.assignedDeliveryBoy) &&
            (found.assignedDeliveryBoy!.includes(currentRider.code) ||
              found.assignedDeliveryBoy!.includes(currentRider.name)));
        if (isOwner) return found;
      }
      return null;
    }
    // If no activeOrderId selected, pick the first active order explicitly assigned to currentRider
    const firstAssigned = orders.find(
      o =>
        (o.assignedDeliveryBoyId === currentRider.id ||
          (Boolean(o.assignedDeliveryBoy) &&
            (o.assignedDeliveryBoy!.includes(currentRider.code) ||
              o.assignedDeliveryBoy!.includes(currentRider.name)))) &&
        (o.status === 'Assigned' || o.status === 'Picked Up' || o.status === 'Out for Delivery')
    );
    return firstAssigned || null;
  }, [orders, activeOrderId, currentRider]);

  // Orders assigned explicitly to this rider ONLY (Do not display unassigned "Ready for Pickup" orders)
  const riderAssignedOrders = useMemo(() => {
    return orders.filter(o => {
      const isAssigned =
        o.assignedDeliveryBoyId === currentRider.id ||
        (Boolean(o.assignedDeliveryBoy) &&
          (o.assignedDeliveryBoy!.includes(currentRider.code) ||
            o.assignedDeliveryBoy!.includes(currentRider.name)));
      return Boolean(isAssigned);
    });
  }, [orders, currentRider]);

  const assignedOnly = useMemo(() => {
    return riderAssignedOrders.filter(o => o.status === 'Assigned');
  }, [riderAssignedOrders]);

  const pickedUpOnly = useMemo(() => {
    return riderAssignedOrders.filter(
      o => o.status === 'Picked Up' || o.status === 'Out for Delivery'
    );
  }, [riderAssignedOrders]);

  const deliveredOnly = useMemo(() => {
    return orders.filter(
      o =>
        o.status === 'Delivered' &&
        (o.assignedDeliveryBoyId === currentRider.id ||
          (Boolean(o.assignedDeliveryBoy) && o.assignedDeliveryBoy!.includes(currentRider.name)))
    );
  }, [orders, currentRider]);

  // Toggle Rider Online / Offline status
  const toggleOnline = () => {
    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(d => (d.id === currentRider.id ? { ...d, isOnline: !d.isOnline } : d))
      );
    }
  };

  // Helper: Switch Rider account quickly from persona bar
  const handleSelectRiderPersona = (rider: DeliveryPartner) => {
    setCurrentRiderId(rider.id);
    try {
      localStorage.removeItem('hf_delivery_logged_out');
      localStorage.setItem(
        'hf_delivery_session',
        JSON.stringify({
          riderId: rider.id,
          token: `dlv_tok_${rider.id}_${Date.now()}`,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        })
      );
    } catch {}

    if (rider.status === 'pending' || rider.status === 'under_review') {
      setCurrentScreen('approval_status');
    } else if (rider.status === 'rejected') {
      setCurrentScreen('approval_status');
    } else {
      setCurrentScreen('dashboard');
      setActiveBottomTab('home');
    }
  };

  // Helper: Handle Delivery Partner Logout
  const handleLogoutDeliveryPartner = () => {
    try {
      localStorage.removeItem('hf_delivery_session');
      localStorage.setItem('hf_delivery_logged_out', 'true');
    } catch {}
    setCurrentScreen('login');
    setLoginError(null);
    setLoginSuccessNotice(null);
  };

  // Check completion status of required documents
  const isProfilePhotoComplete = Boolean(photoDoc);
  const isAadhaarComplete = Boolean(aadhaarFrontDoc && aadhaarBackDoc);
  const isLicenceComplete = Boolean(licenceDoc);
  const isRCComplete = Boolean(rcDoc);

  const completedRequiredDocsCount =
    (isProfilePhotoComplete ? 1 : 0) +
    (isAadhaarComplete ? 1 : 0) +
    (isLicenceComplete ? 1 : 0) +
    (isRCComplete ? 1 : 0);

  const isAllRequiredDocumentsUploaded =
    isProfilePhotoComplete && isAadhaarComplete && isLicenceComplete && isRCComplete;

  const canSubmitApplication =
    isAllRequiredDocumentsUploaded &&
    regTermsConsent &&
    regFullName.trim() !== '' &&
    regPhone.trim().length >= 10 &&
    regVehicleNumber.trim() !== '';

  // Handle real file selection from device file picker
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'photo' | 'aadhaar' | 'licence' | 'rc' | 'bank_proof',
    side?: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const errorKey = side ? `${docType}_${side}` : docType;
    setUploadErrors(prev => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });

    // 1. Validate File Size (Max 5MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadErrors(prev => ({
        ...prev,
        [errorKey]: `File size (${sizeMb} MB) exceeds 5MB limit. Please choose a smaller file.`
      }));
      return;
    }

    // 2. Validate Allowed File Types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validDocTypes = [...validImageTypes, 'application/pdf'];

    if (docType === 'photo') {
      if (!validImageTypes.includes(file.type) && !['.jpg', '.jpeg', '.png', '.webp'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        setUploadErrors(prev => ({
          ...prev,
          [errorKey]: 'Profile photo must be an image (JPG, PNG or WebP).'
        }));
        return;
      }
    } else {
      if (!validDocTypes.includes(file.type) && !['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some(ext => file.name.toLowerCase().endsWith(ext))) {
        setUploadErrors(prev => ({
          ...prev,
          [errorKey]: 'Invalid file format. Please upload JPG, PNG, WebP or PDF.'
        }));
        return;
      }
    }

    // 3. Set loading state for this specific upload
    setUploadingDocKey(errorKey);

    // 4. Read file as base64 data URL
    const reader = new FileReader();
    reader.onerror = () => {
      setUploadingDocKey(null);
      setUploadErrors(prev => ({
        ...prev,
        [errorKey]: 'Failed to read file from your device. Please try again.'
      }));
    };

    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      const formattedSize = file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const docTitle =
        docType === 'photo'
          ? 'Profile Photo'
          : docType === 'aadhaar'
          ? `Aadhaar Card (${side === 'front' ? 'Front Side' : 'Back Side'})`
          : docType === 'licence'
          ? 'Driving Licence'
          : docType === 'rc'
          ? 'Vehicle RC'
          : 'Bank Proof';

      let docId = `doc-${docType}-${side ? side + '-' : ''}${Date.now()}`;
      let previewUrl = dataUrl;

      // Try server upload endpoint (validates and stores securely on server)
      try {
        const response = await fetch('/api/delivery-partners/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            docType,
            side,
            fileName: file.name,
            fileSize: formattedSize,
            fileData: dataUrl,
            partnerId: regPhone.trim() || regApplicationId
          })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.docId) docId = resData.docId;
          if (resData.previewUrl) previewUrl = resData.previewUrl;
        }
      } catch (err) {
        console.warn('Backend upload endpoint offline, using local storage:', err);
      }

      const docRecord: DeliveryPartnerDocument = {
        id: docId,
        name: docTitle,
        type: docType,
        fileName: file.name,
        fileSize: formattedSize,
        previewUrl,
        fileData: dataUrl,
        side,
        status: 'pending',
        uploadedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      if (docType === 'photo') setPhotoDoc(docRecord);
      else if (docType === 'aadhaar') {
        if (side === 'front') setAadhaarFrontDoc(docRecord);
        else setAadhaarBackDoc(docRecord);
      } else if (docType === 'licence') setLicenceDoc(docRecord);
      else if (docType === 'rc') setRcDoc(docRecord);
      else if (docType === 'bank_proof') setBankDoc(docRecord);

      setUploadingDocKey(null);
    };

    reader.readAsDataURL(file);
  };

  // Remove a document
  const handleRemoveDoc = (docType: 'photo' | 'aadhaar' | 'licence' | 'rc' | 'bank_proof', side?: 'front' | 'back') => {
    if (docType === 'photo') setPhotoDoc(null);
    else if (docType === 'aadhaar') {
      if (side === 'front') setAadhaarFrontDoc(null);
      else setAadhaarBackDoc(null);
    } else if (docType === 'licence') setLicenceDoc(null);
    else if (docType === 'rc') setRcDoc(null);
    else if (docType === 'bank_proof') setBankDoc(null);

    const errorKey = side ? `${docType}_${side}` : docType;
    setUploadErrors(prev => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  };

  // Quick Demo: Auto-fill sample documents for testing convenience
  const handleAutoFillDemoDocuments = () => {
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setPhotoDoc({
      id: `doc-p-${Date.now()}`,
      name: 'Profile Photo',
      type: 'photo',
      fileName: 'selfie_photo.jpg',
      fileSize: '1.2 MB',
      previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      fileData: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      status: 'pending',
      uploadedAt: nowTime
    });
    setAadhaarFrontDoc({
      id: `doc-af-${Date.now()}`,
      name: 'Aadhaar Card (Front Side)',
      type: 'aadhaar',
      side: 'front',
      fileName: 'aadhaar_card_front.jpg',
      fileSize: '1.4 MB',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      fileData: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      status: 'pending',
      uploadedAt: nowTime
    });
    setAadhaarBackDoc({
      id: `doc-ab-${Date.now()}`,
      name: 'Aadhaar Card (Back Side)',
      type: 'aadhaar',
      side: 'back',
      fileName: 'aadhaar_card_back.jpg',
      fileSize: '1.3 MB',
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      fileData: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      status: 'pending',
      uploadedAt: nowTime
    });
    setLicenceDoc({
      id: `doc-l-${Date.now()}`,
      name: 'Driving Licence',
      type: 'licence',
      fileName: 'driving_licence_ka35.pdf',
      fileSize: '820 KB',
      status: 'pending',
      uploadedAt: nowTime
    });
    setRcDoc({
      id: `doc-r-${Date.now()}`,
      name: 'Vehicle RC',
      type: 'rc',
      fileName: 'vehicle_rc_ka35ab1234.pdf',
      fileSize: '950 KB',
      status: 'pending',
      uploadedAt: nowTime
    });
    setRegTermsConsent(true);
    setUploadErrors({});
  };

  // Start fresh registration
  const handleStartNewRegistration = () => {
    setIsResubmittingForPartnerId(null);
    setRegFullName('');
    setRegPhone('');
    setRegEmail('');
    setRegServiceArea('Hospete - MP Prakash Nagar');
    setRegVehicleType('Two Wheeler');
    setRegVehicleNumber('');
    setRegLicenceNumber('');
    setIsPhoneVerified(false);
    const newAppId = `DP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setRegApplicationId(newAppId);
    setPhotoDoc(null);
    setAadhaarFrontDoc(null);
    setAadhaarBackDoc(null);
    setLicenceDoc(null);
    setRcDoc(null);
    setBankDoc(null);
    setRegTermsConsent(false);
    setUploadErrors({});
    setCurrentScreen('register');
  };

  // Resubmit flow for rejected rider
  const handleStartResubmission = () => {
    setIsResubmittingForPartnerId(currentRider.id);
    setRegFullName(currentRider.name);
    setRegPhone(currentRider.phone);
    setRegEmail(currentRider.email || '');
    setRegServiceArea(currentRider.serviceArea);
    setRegVehicleType(currentRider.vehicleType);
    setRegVehicleNumber(currentRider.vehicleNumber);
    setRegLicenceNumber(currentRider.licenceNumber || '');
    setRegApplicationId(currentRider.applicationId);

    const photo = currentRider.documents.find(d => d.type === 'photo');
    const aadhaarFront = currentRider.documents.find(d => d.type === 'aadhaar' && d.side !== 'back');
    const aadhaarBack = currentRider.documents.find(d => d.type === 'aadhaar' && d.side === 'back');
    const licence = currentRider.documents.find(d => d.type === 'licence');
    const rc = currentRider.documents.find(d => d.type === 'rc');
    const bank = currentRider.documents.find(d => d.type === 'bank_proof');

    setPhotoDoc(photo || null);
    setAadhaarFrontDoc(aadhaarFront || null);
    setAadhaarBackDoc(aadhaarBack || null);
    setLicenceDoc(licence || null);
    setRcDoc(rc || null);
    setBankDoc(bank || null);

    setRegTermsConsent(true);
    setUploadErrors({});
    setCurrentScreen('document_upload');
  };

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Start Forgot Password Flow from Login Screen
  const handleStartForgotPassword = () => {
    setLoginError(null);
    setLoginSuccessNotice(null);
    setRecoveryError(null);
    setRecoverySuccessMessage(null);
    setRecoveryPhone(loginPhone || '');
    setRecoveryOtp('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoverySessionToken(null);
    setRecoveryResetToken(null);
    setDevOtpHint(null);
    setSmsNotice(null);
    setForgotStep(1);
    setCurrentScreen('forgot_password');
  };

  // Recovery Step 1: Request OTP for registered mobile number
  const handleRequestRecoveryOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccessMessage(null);

    const clean = recoveryPhone.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setRecoveryError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/delivery-partners/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });
      const data = await res.json();

      if (!res.ok) {
        setRecoveryError(data.error || 'Failed to request recovery code. Please try again.');
        setRecoveryLoading(false);
        return;
      }

      setRecoverySessionToken(data.sessionToken);
      setRecoverySuccessMessage(data.message);

      if (data.devVerificationOtp) {
        setDevOtpHint(data.devVerificationOtp);
      } else {
        setDevOtpHint(null);
      }

      if (!data.smsProviderConfigured) {
        setSmsNotice(
          'SMS Provider Notice: No telecom SMS gateway is configured in .env (TWILIO_ACCOUNT_SID / MSG91_AUTH_KEY). For testing, use the verification code shown below.'
        );
      } else {
        setSmsNotice(null);
      }

      setResendCooldown(data.resendCooldownSeconds || 60);
      setForgotStep(2);
    } catch (err) {
      setRecoveryError('Network error. Unable to reach Hospete Fresh authentication server.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Recovery Step 2: Verify OTP
  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    const cleanOtp = recoveryOtp.trim();
    if (cleanOtp.length !== 6) {
      setRecoveryError('Please enter the full 6-digit verification code.');
      return;
    }

    if (!recoverySessionToken) {
      setRecoveryError('Recovery session expired. Please restart password recovery.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/delivery-partners/verify-recovery-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: recoverySessionToken, otp: cleanOtp })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRecoveryError(data.error || 'Invalid or expired verification code.');
        setRecoveryLoading(false);
        return;
      }

      setRecoveryResetToken(data.resetToken);
      setRecoverySuccessMessage('Identity verified! Please choose a new secure password.');
      setForgotStep(3);
    } catch (err) {
      setRecoveryError('Network error. Could not verify code.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Recovery Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (recoveryNewPassword.length < 6) {
      setRecoveryError('New password must be at least 6 characters long.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setRecoveryError('New password and confirmation password do not match.');
      return;
    }

    if (!recoverySessionToken || !recoveryResetToken) {
      setRecoveryError('Reset authorization token expired. Please start over.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const res = await fetch('/api/delivery-partners/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: recoverySessionToken,
          resetToken: recoveryResetToken,
          newPassword: recoveryNewPassword
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRecoveryError(data.error || 'Failed to update password.');
        setRecoveryLoading(false);
        return;
      }

      // Update password hash in persistent delivery partner state
      const cleanPhone = recoveryPhone.replace(/\D/g, '').slice(-10);
      if (setDeliveryPartners) {
        setDeliveryPartners(prev =>
          prev.map(p =>
            p.phone.replace(/\D/g, '').slice(-10) === cleanPhone
              ? { ...p, passwordHash: data.passwordHash }
              : p
          )
        );
      }

      // Populate phone in login form and clear password
      setLoginPhone(cleanPhone);
      setLoginPassword('');
      setLoginSuccessNotice('✓ Password has been reset successfully. Please log in with your new password.');
      setLoginError(null);

      // Return to login screen
      setCurrentScreen('login');
    } catch (err) {
      setRecoveryError('Network error. Failed to save new password.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Handle Login submission with secure backend verification
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccessNotice(null);

    const cleanPhone = loginPhone.trim().replace(/\D/g, '').slice(-10);
    const foundRider = deliveryPartners.find(
      d => d.phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );

    if (!foundRider) {
      setLoginError('No delivery partner account found with this mobile number. Please register first.');
      return;
    }

    // Strict status enforcement (unapproved riders cannot log in)
    if (foundRider.status === 'pending' || foundRider.status === 'under_review') {
      setLoginError('Your registration is awaiting admin approval.');
      setCurrentRiderId(foundRider.id);
      setCurrentScreen('approval_status');
      return;
    } else if (foundRider.status === 'rejected' || foundRider.status === 'documents_required') {
      setLoginError(`Your application was rejected: "${foundRider.adminNotes || 'Please check requested documents.'}"`);
      setCurrentRiderId(foundRider.id);
      setCurrentScreen('approval_status');
      return;
    } else if (foundRider.status === 'suspended') {
      setLoginError('Your delivery partner account has been suspended by Admin. Please contact operations support.');
      return;
    }

    // Verify credentials with backend API
    let mustChange = false;
    try {
      const res = await fetch('/api/delivery-partners/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: loginPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError('Invalid mobile number or password. Please check your credentials.');
        return;
      }
      mustChange = Boolean(data.mustChangePassword);
    } catch (err) {
      // Local fallback for offline mode
      console.warn('Backend login endpoint unavailable, checking fallback:', err);
      if (foundRider.passwordHash) {
        setLoginError('Authentication service temporarily unavailable. Please retry.');
        return;
      } else if (loginPassword !== 'password123') {
        setLoginError('Invalid mobile number or password.');
        return;
      }
      mustChange = Boolean(foundRider.mustChangePassword);
    }

    try {
      localStorage.removeItem('hf_delivery_logged_out');
      localStorage.setItem(
        'hf_delivery_session',
        JSON.stringify({
          riderId: foundRider.id,
          token: `dlv_tok_${foundRider.id}_${Date.now()}`,
          loginAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        })
      );
    } catch {}

    setCurrentRiderId(foundRider.id);

    // If rider is required to change temporary password on first login
    if (mustChange || foundRider.mustChangePassword) {
      setTempPasswordPhone(cleanPhone);
      setTempCurrentPassword(loginPassword);
      setTempNewPassword('');
      setTempConfirmPassword('');
      setTempPasswordError(null);
      setCurrentScreen('change_temp_password');
      return;
    }

    setCurrentScreen('dashboard');
    setActiveBottomTab('home');
  };

  // Handle setting permanent password from temporary credentials on First Login
  const handleSavePermanentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setTempPasswordError(null);

    if (tempNewPassword.length < 6) {
      setTempPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (tempNewPassword === tempCurrentPassword) {
      setTempPasswordError('New password must be different from your temporary password.');
      return;
    }

    if (tempNewPassword === tempPasswordPhone) {
      setTempPasswordError('Password cannot be the same as your phone number.');
      return;
    }

    if (tempNewPassword !== tempConfirmPassword) {
      setTempPasswordError('New password and confirmation password do not match.');
      return;
    }

    setTempPasswordLoading(true);
    try {
      const res = await fetch('/api/delivery-partners/change-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: tempPasswordPhone,
          currentPassword: tempCurrentPassword,
          newPassword: tempNewPassword,
          confirmPassword: tempConfirmPassword
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setTempPasswordError(data.error || 'Failed to update temporary password.');
        setTempPasswordLoading(false);
        return;
      }

      // Update in delivery partner state
      if (setDeliveryPartners) {
        setDeliveryPartners(prev =>
          prev.map(p =>
            p.phone.replace(/\D/g, '').slice(-10) === tempPasswordPhone
              ? { ...p, mustChangePassword: false, passwordHash: data.passwordHash }
              : p
          )
        );
      }

      const rider = deliveryPartners.find(
        p => p.phone.replace(/\D/g, '').slice(-10) === tempPasswordPhone
      );
      if (rider) {
        setCurrentRiderId(rider.id);
      }
      setLoginSuccessNotice('✓ Permanent password created. Welcome to Hospete Fresh Delivery Fleet!');
      setCurrentScreen('dashboard');
      setActiveBottomTab('home');
    } catch (err) {
      setTempPasswordError('Network error. Failed to save new password.');
    } finally {
      setTempPasswordLoading(false);
    }
  };

  // Handle Registration Step 1
  const handleRegisterNext = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentScreen('document_upload');
  };

  // Handle Registration Step 2 (Submit Documents)
  const handleSubmitApplication = () => {
    if (!canSubmitApplication) return;

    const docsToSave: DeliveryPartnerDocument[] = [];
    if (photoDoc) docsToSave.push(photoDoc);
    if (aadhaarFrontDoc) docsToSave.push(aadhaarFrontDoc);
    if (aadhaarBackDoc) docsToSave.push(aadhaarBackDoc);
    if (licenceDoc) docsToSave.push(licenceDoc);
    if (rcDoc) docsToSave.push(rcDoc);
    if (bankDoc) docsToSave.push(bankDoc);

    if (isResubmittingForPartnerId) {
      // Rider is resubmitting corrected documents after rejection
      if (setDeliveryPartners) {
        setDeliveryPartners(prev =>
          prev.map(p =>
            p.id === isResubmittingForPartnerId
              ? {
                  ...p,
                  status: 'pending',
                  documents: docsToSave,
                  adminNotes: 'Corrected documents resubmitted by rider. Awaiting admin re-evaluation.',
                  appliedAt: 'Resubmitted: ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  notifications: [
                    {
                      id: `notif-${Date.now()}`,
                      title: 'Documents Resubmitted',
                      message: 'Your corrected documents have been submitted to admin for re-evaluation.',
                      time: 'Just now',
                      read: false,
                      type: 'approval'
                    },
                    ...(p.notifications || [])
                  ]
                }
              : p
          )
        );
      }
      setIsResubmittingForPartnerId(null);
      setCurrentScreen('submitted');
      return;
    }

    const newAppId = `DP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    setRegApplicationId(newAppId);

    const newPartner: DeliveryPartner = {
      id: `dlv-${Date.now()}`,
      applicationId: newAppId,
      code: `DLV-00${deliveryPartners.length + 1}`,
      name: regFullName.trim() || 'New Rider',
      phone: regPhone.trim(),
      email: regEmail.trim(),
      address: '#12, Hospete Main Road',
      serviceArea: regServiceArea,
      profilePhoto: photoDoc?.previewUrl || photoDoc?.fileData || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      vehicleType: regVehicleType,
      vehicleNumber: regVehicleNumber.toUpperCase(),
      licenceNumber: regLicenceNumber || 'DL-PENDING',
      aadhaarNumber: '********5566',
      bankDetails: {
        bankName: 'State Bank of India',
        accountNumber: '*********1234',
        ifsc: 'SBIN0000845'
      },
      status: 'pending',
      isOnline: false,
      activeOrdersCount: 0,
      ratings: 5.0,
      totalDeliveries: 0,
      appliedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      adminNotes: 'New application submitted via mobile app. Awaiting admin review and verification.',
      documents: docsToSave,
      earnings: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        pendingPayout: 0,
        history: []
      },
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Application Submitted',
          message: 'Your registration and uploaded documents have been received and are pending admin review.',
          time: 'Just now',
          read: false,
          type: 'approval'
        }
      ]
    };

    if (setDeliveryPartners) {
      setDeliveryPartners(prev => [newPartner, ...prev]);
    }
    setCurrentRiderId(newPartner.id);
    setCurrentScreen('submitted');
  };

  // Toggle item verification in pickup checklist
  const togglePickupItem = (orderId: number, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setPickupChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Stepper for quantity
  const updateQuantity = (orderId: number, itemIdx: number, delta: number) => {
    const key = `${orderId}-${itemIdx}`;
    setVerifiedQuantities(prev => ({
      ...prev,
      [key]: Math.max(0, (prev[key] || 1) + delta)
    }));
  };

  // Confirm Pickup action (Screen 9 -> 10)
  const handleConfirmPickup = () => {
    if (!activeOrder) return;
    setOrders(prev =>
      prev.map(o =>
        o.id === activeOrder.id
          ? {
              ...o,
              status: 'Picked Up',
              pickedUpAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              assignedDeliveryBoy: currentRider.name,
              assignedDeliveryBoyId: currentRider.id
            }
          : o
      )
    );
    setCurrentScreen('picked_up_confirmation');
  };

  // Submit Discrepancy (Screen 9)
  const handleSubmitDiscrepancy = () => {
    if (!activeOrder) return;
    const discrepancy: OrderDiscrepancy = {
      reason: discrepancyReason,
      notes: discrepancyNotes,
      reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resolved: false
    };

    setOrders(prev =>
      prev.map(o => (o.id === activeOrder.id ? { ...o, deliveryDiscrepancy: discrepancy } : o))
    );
    setIsDiscrepancyModalOpen(false);
  };

  // Resolve Discrepancy
  const handleResolveDiscrepancy = () => {
    if (!activeOrder) return;
    setOrders(prev =>
      prev.map(o => (o.id === activeOrder.id ? { ...o, deliveryDiscrepancy: null } : o))
    );
  };

  // Open delivery confirmation modal (asks for confirmation before marking delivered)
  const handleMarkDelivered = () => {
    setOtpError(null);
    const enteredOtp = `${otpDigit1}${otpDigit2}${otpDigit3}${otpDigit4}`;
    const expectedOtp = activeOrder?.deliveryOtp || '2846';

    if (enteredOtp.length < 4) {
      setOtpError('Please enter the 4-digit customer delivery OTP.');
      return;
    }

    if (enteredOtp !== expectedOtp && enteredOtp !== '2846') {
      setOtpError(`Incorrect OTP. Please ask customer or use demo OTP ${expectedOtp}.`);
      return;
    }

    if (!activeOrder) return;
    setIsConfirmDeliverModalOpen(true);
  };

  // Execute delivery confirmation after rider confirms handover
  const executeConfirmDelivered = () => {
    if (!activeOrder) return;

    const deliveryTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setOrders(prev =>
      prev.map(o =>
        o.id === activeOrder.id
          ? {
              ...o,
              status: 'Delivered',
              deliveredAt: deliveryTime,
              deliveryPhotoProof: deliveryPhotoProof || undefined
            }
          : o
      )
    );

    // Update rider earnings and decrement active orders count
    if (setDeliveryPartners) {
      setDeliveryPartners(prev =>
        prev.map(d =>
          d.id === currentRider.id
            ? {
                ...d,
                earnings: {
                  ...d.earnings,
                  today: d.earnings.today + 45,
                  thisWeek: d.earnings.thisWeek + 45
                },
                activeOrdersCount: Math.max(0, (d.activeOrdersCount || 1) - 1),
                totalDeliveries: (d.totalDeliveries || 0) + 1
              }
            : d
        )
      );
    }

    setIsConfirmDeliverModalOpen(false);
    setCurrentScreen('delivered_success');
  };

  // Bottom Navigation Switcher
  const handleBottomNavClick = (tab: 'home' | 'orders' | 'earnings' | 'profile') => {
    setActiveBottomTab(tab);
    if (tab === 'home') setCurrentScreen('dashboard');
    if (tab === 'orders') setCurrentScreen('assigned_orders');
    if (tab === 'earnings') setCurrentScreen('earnings');
    if (tab === 'profile') setCurrentScreen('profile');
  };

  // Check if all items in active order are checked
  const isAllPickupItemsChecked = useMemo(() => {
    if (!activeOrder) return false;
    return activeOrder.items.every((_, idx) => pickupChecks[`${activeOrder.id}-${idx}`]);
  }, [activeOrder, pickupChecks]);

  return (
    <div className="flex-1 w-full bg-slate-900 min-h-screen py-4 px-2 sm:px-4 flex flex-col items-center">
      {/* Top Demo Banner & Persona Switcher */}
      <div className="max-w-md w-full mb-3 bg-slate-800/95 border border-slate-700/80 rounded-2xl p-3 shadow-lg text-xs text-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 font-black text-emerald-400">
            <Bike className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Hospete Fresh Delivery Partner App</span>
          </div>
          {onBackToCustomer && (
            <button
              onClick={onBackToCustomer}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
            >
              &larr; Store View
            </button>
          )}
        </div>

        {/* Quick Persona Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-slate-400 font-bold shrink-0">Persona:</span>
          {deliveryPartners.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectRiderPersona(p)}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                currentRider.id === p.id && currentScreen !== 'login' && currentScreen !== 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{p.name.split(' ')[0]}</span>
              <span
                className={`text-[8px] px-1 py-0.2 rounded font-black uppercase ${
                  p.status === 'approved'
                    ? 'bg-emerald-950 text-emerald-300'
                    : p.status === 'pending'
                    ? 'bg-amber-950 text-amber-300'
                    : 'bg-rose-950 text-rose-300'
                }`}
              >
                {p.status === 'approved' ? 'Active' : p.status === 'pending' ? 'Pending' : 'Docs'}
              </span>
            </button>
          ))}
          <button
            onClick={handleStartNewRegistration}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer ${
              currentScreen === 'register' ? 'bg-amber-500 text-slate-900 font-black' : 'bg-slate-700 text-amber-400 hover:bg-slate-600'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>New Rider Reg</span>
          </button>
          <button
            onClick={handleLogoutDeliveryPartner}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer ${
              currentScreen === 'login' ? 'bg-emerald-600 text-white font-black' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <LogOut className="w-3 h-3" />
            <span>Login Screen</span>
          </button>
        </div>
      </div>

      {/* MOBILE DEVICE CONTAINER (Matching the 14-Screen Storyboard visual style) */}
      <div className="w-full max-w-[410px] bg-white rounded-[32px] shadow-2xl border-[6px] border-slate-800 overflow-hidden flex flex-col min-h-[740px] max-h-[820px] relative select-none">
        {/* Device Status Bar */}
        <div className="bg-slate-900 text-white px-5 pt-2 pb-1.5 flex justify-between items-center text-[11px] font-bold tracking-tight shrink-0">
          <span>9:41</span>
          <div className="w-16 h-4 bg-slate-800 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* SCREEN 1: LOGIN */}
        {currentScreen === 'login' && (
          <div className="flex-1 flex flex-col p-6 justify-between bg-white overflow-y-auto">
            <div>
              {/* Brand Logo */}
              <div className="text-center mt-6 mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl mx-auto flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
                  <Bike className="w-10 h-10 stroke-[2.5]" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospete Fresh</h1>
                <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mt-0.5">
                  Delivery Partner
                </p>
              </div>

              {loginSuccessNotice && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{loginSuccessNotice}</span>
                </div>
              )}

              {loginError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <Smartphone className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={e => setLoginPhone(e.target.value)}
                      placeholder="9845012345"
                      required
                      className="w-full text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-semibold">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleStartForgotPassword}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer mt-2"
                >
                  Login
                </button>
              </form>
            </div>

            <div className="text-center pt-6 pb-2 border-t border-slate-100 mt-6">
              <p className="text-xs text-slate-500 mb-2">New to Hospete Fresh?</p>
              <button
                type="button"
                onClick={handleStartNewRegistration}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-extrabold text-xs border border-emerald-200 transition-all cursor-pointer"
              >
                Register as Delivery Partner
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: FIRST LOGIN / CHANGE TEMPORARY PASSWORD */}
        {currentScreen === 'change_temp_password' && (
          <div className="flex-1 flex flex-col p-6 justify-between bg-white overflow-y-auto">
            <div>
              {/* Top Bar */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen('login');
                    setTempPasswordError(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-black text-slate-900">Account Setup</h2>
                <div className="w-5" />
              </div>

              {/* Header Visual */}
              <div className="text-center mb-5">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center mb-2.5 shadow-xs">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-slate-900">Set Permanent Password</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  You are logging in with an admin-issued temporary credential. Please create a private password to secure your account.
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono text-[11px] font-bold mt-2">
                  <span>📱 +91 {tempPasswordPhone}</span>
                </div>
              </div>

              {tempPasswordError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{tempPasswordError}</span>
                </div>
              )}

              <form onSubmit={handleSavePermanentPassword} className="space-y-3.5">
                {/* Temporary Password */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Temporary Password
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-2xl p-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                    <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={showTempCurrentPassword ? 'text' : 'password'}
                      value={tempCurrentPassword}
                      onChange={e => setTempCurrentPassword(e.target.value)}
                      placeholder="Enter temporary password"
                      required
                      className="w-full text-xs font-bold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempCurrentPassword(!showTempCurrentPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showTempCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-2xl p-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                    <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={showTempNewPassword ? 'text' : 'password'}
                      value={tempNewPassword}
                      onChange={e => setTempNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      className="w-full text-xs font-bold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempNewPassword(!showTempNewPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showTempNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <div className="flex items-center border border-slate-200 rounded-2xl p-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                    <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                    <input
                      type={showTempConfirmPassword ? 'text' : 'password'}
                      value={tempConfirmPassword}
                      onChange={e => setTempConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={6}
                      className="w-full text-xs font-bold text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempConfirmPassword(!showTempConfirmPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                    >
                      {showTempConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                  ✓ Minimum 6 characters required.<br />
                  ✓ Cannot reuse temporary password or phone number.
                </div>

                <button
                  type="submit"
                  disabled={tempPasswordLoading || !tempCurrentPassword || !tempNewPassword || !tempConfirmPassword}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tempPasswordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <span>Save & Continue to Dashboard</span>
                  )}
                </button>
              </form>
            </div>

            <div className="text-center pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('login')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
              >
                Cancel and return to Login
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: FORGOT PASSWORD RECOVERY FLOW */}
        {currentScreen === 'forgot_password' && (
          <div className="flex-1 flex flex-col p-6 justify-between bg-white overflow-y-auto">
            <div>
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen('login');
                    setRecoveryError(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-sm font-black text-slate-900">Reset Password</h2>
                <div className="w-5" />
              </div>

              {/* Recovery Stepper (1: Phone -> 2: OTP -> 3: New Password) */}
              <div className="flex items-center justify-center gap-3 mb-5">
                <div
                  className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shadow-xs transition-colors ${
                    forgotStep === 1
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {forgotStep > 1 ? '✓' : '1'}
                </div>
                <div
                  className={`w-10 h-0.5 transition-colors ${
                    forgotStep > 1 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shadow-xs transition-colors ${
                    forgotStep === 2
                      ? 'bg-emerald-600 text-white'
                      : forgotStep > 2
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {forgotStep > 2 ? '✓' : '2'}
                </div>
                <div
                  className={`w-10 h-0.5 transition-colors ${
                    forgotStep > 2 ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
                <div
                  className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center shadow-xs transition-colors ${
                    forgotStep === 3
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3
                </div>
              </div>

              {/* Error Alert */}
              {recoveryError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {/* Success Message Banner */}
              {recoverySuccessMessage && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{recoverySuccessMessage}</span>
                </div>
              )}

              {/* STEP 1: Enter Registered Mobile Number */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestRecoveryOtp} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-2.5">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Enter Registered Mobile</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Enter the 10-digit mobile number associated with your Hospete Fresh Delivery Partner account.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Registered Mobile Number
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                      <span className="text-xs font-bold text-slate-500 mr-2 border-r border-slate-200 pr-2">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={recoveryPhone}
                        onChange={e => setRecoveryPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9845012345"
                        required
                        className="w-full text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      A time-limited 6-digit OTP will be issued for verification.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading || recoveryPhone.replace(/\D/g, '').length < 10}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Verify Identity with OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyRecoveryOtp} className="space-y-4">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl mx-auto flex items-center justify-center mb-2.5">
                      <KeyRound className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Verify Identity</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Enter the 6-digit OTP sent to registered mobile{' '}
                      <strong className="text-slate-800 font-mono">
                        +91 ******{recoveryPhone.slice(-4)}
                      </strong>.
                    </p>
                  </div>

                  {/* SMS Gateway configuration notice */}
                  {smsNotice && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-[11px] leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>SMS Provider Notice</span>
                      </div>
                      <p>{smsNotice}</p>
                    </div>
                  )}

                  {/* Development Verification OTP Hint */}
                  {devOtpHint && (
                    <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-600 font-bold block">Testing Verification OTP:</span>
                        <span className="font-mono font-black text-base tracking-widest text-blue-950">
                          {devOtpHint}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRecoveryOtp(devOtpHint)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs"
                      >
                        Auto Fill
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryOtp}
                      onChange={e => setRecoveryOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      required
                      autoFocus
                      className="w-full p-3.5 border border-slate-200 rounded-2xl text-center text-lg font-mono font-black tracking-widest text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none bg-slate-50/50"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 text-[11px]">Didn't receive code?</span>
                    {resendCooldown > 0 ? (
                      <span className="text-slate-400 font-bold text-[11px]">
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestRecoveryOtp}
                        className="text-emerald-700 font-extrabold hover:underline cursor-pointer text-[11px] flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading || recoveryOtp.trim().length !== 6}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 3: Set New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-2.5">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">Set New Password</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      Choose a secure new password for your Delivery Partner account (minimum 6 characters).
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                      <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={recoveryNewPassword}
                        onChange={e => setRecoveryNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full text-xs font-bold text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-2xl p-3 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all bg-white">
                      <Lock className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={recoveryConfirmPassword}
                        onChange={e => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                    {recoveryConfirmPassword && recoveryNewPassword !== recoveryConfirmPassword && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      recoveryLoading ||
                      recoveryNewPassword.length < 6 ||
                      recoveryNewPassword !== recoveryConfirmPassword
                    }
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Update Password & Login</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Return to Login Link */}
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('login');
                  setRecoveryError(null);
                }}
                className="text-xs font-extrabold text-slate-600 hover:text-emerald-700 cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: REGISTRATION (Step 1 of 3) */}
        {currentScreen === 'register' && (
          <div className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentScreen('login')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Register as Delivery Partner</h2>
              <div className="w-5" />
            </div>

            {/* Stepper (1, 2, 3) */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <div className="w-10 h-0.5 bg-slate-200" />
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 font-black text-xs flex items-center justify-center">
                2
              </div>
              <div className="w-10 h-0.5 bg-slate-200" />
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 font-black text-xs flex items-center justify-center">
                3
              </div>
            </div>

            <form onSubmit={handleRegisterNext} className="space-y-3.5 flex-1">
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Ravi Kumar"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Mobile Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="9845012345"
                    required
                    className="flex-1 p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPhoneVerified(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      isPhoneVerified
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isPhoneVerified ? '✓ Verified' : 'Verify'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="ravi@gmail.com"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Select Service Area
                </label>
                <select
                  value={regServiceArea}
                  onChange={e => setRegServiceArea(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-600 outline-none bg-white cursor-pointer"
                >
                  <option value="Hospete - MP Prakash Nagar">Hospete - MP Prakash Nagar</option>
                  <option value="Patel Nagar">Patel Nagar</option>
                  <option value="College Road">College Road</option>
                  <option value="Station Road">Station Road</option>
                  <option value="Dam Road">Dam Road</option>
                  <option value="Amaravathi">Amaravathi</option>
                  <option value="Bus Stand">Bus Stand & Gandhi Circle</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Vehicle Type
                </label>
                <select
                  value={regVehicleType}
                  onChange={e => setRegVehicleType(e.target.value as any)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-600 outline-none bg-white cursor-pointer"
                >
                  <option value="Two Wheeler">Two Wheeler (Motorcycle / Scooter)</option>
                  <option value="Electric Vehicle">Electric Vehicle (EV 2W)</option>
                  <option value="Bicycle">Bicycle (Eco Delivery)</option>
                  <option value="Four Wheeler">Mini Auto / Cargo Van</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={regVehicleNumber}
                  onChange={e => setRegVehicleNumber(e.target.value)}
                  placeholder="KA-35-AB-1234"
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:border-emerald-600 outline-none font-mono"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Next &rarr;</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 3: DOCUMENT UPLOAD (Step 2 of 3) */}
        {currentScreen === 'document_upload' && (
          <div className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setCurrentScreen('register')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Upload Documents</h2>
              <button
                type="button"
                onClick={handleAutoFillDemoDocuments}
                className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors"
                title="Quickly fill sample documents for verification testing"
              >
                ⚡ Demo Fill
              </button>
            </div>

            {/* Stepper (1, 2, 3) */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                ✓
              </div>
              <div className="w-10 h-0.5 bg-emerald-400" />
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                2
              </div>
              <div className="w-10 h-0.5 bg-slate-200" />
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 font-black text-xs flex items-center justify-center">
                3
              </div>
            </div>

            {/* Info and Progress Banner */}
            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-slate-800">
                  {completedRequiredDocsCount}/4 Required Documents Ready
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isAllRequiredDocumentsUploaded
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isAllRequiredDocumentsUploaded ? 'All Ready' : 'Incomplete'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedRequiredDocsCount / 4) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Upload clear original photos or PDFs (max 5MB each). Bank proof is optional.
              </p>
            </div>

            <div className="space-y-3.5 flex-1 text-xs">
              {/* 1. Profile Photo (Required) */}
              <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                <input
                  type="file"
                  id="file-upload-photo"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'photo')}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shrink-0">
                      👤
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>Profile Photo</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Clear selfie or portrait (JPG/PNG)</div>
                    </div>
                  </div>

                  {uploadingDocKey === 'photo' ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Saving...</span>
                    </div>
                  ) : photoDoc ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Uploaded
                    </span>
                  ) : (
                    <label
                      htmlFor="file-upload-photo"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </label>
                  )}
                </div>

                {/* Uploaded Metadata & Actions */}
                {photoDoc && (
                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 max-w-[200px]">
                      {photoDoc.previewUrl && (
                        <img
                          src={photoDoc.previewUrl}
                          alt="Selfie"
                          className="w-7 h-7 rounded-md object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-slate-800 text-[11px] truncate">{photoDoc.fileName}</div>
                        <div className="text-[9px] text-slate-400 font-mono">{photoDoc.fileSize}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal(photoDoc)}
                        className="p-1 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-white text-[10px] font-bold border border-slate-200 flex items-center gap-0.5 cursor-pointer"
                        title="Preview Photo"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <label
                        htmlFor="file-upload-photo"
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white text-[10px] font-bold border border-slate-200 cursor-pointer flex items-center gap-0.5"
                        title="Replace Photo"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('photo')}
                        className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold border border-rose-200 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Error feedback */}
                {uploadErrors['photo'] && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10px] flex items-center justify-between">
                    <span>{uploadErrors['photo']}</span>
                    <label
                      htmlFor="file-upload-photo"
                      className="font-black text-rose-900 underline ml-2 cursor-pointer shrink-0"
                    >
                      Retry
                    </label>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Card (Required - Separate Front & Back) */}
              <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2.5">
                <input
                  type="file"
                  id="file-upload-aadhaar-front"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'aadhaar', 'front')}
                />
                <input
                  type="file"
                  id="file-upload-aadhaar-back"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'aadhaar', 'back')}
                />

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg shrink-0">
                    🪪
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>Aadhaar Card</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Both Front & Back copies are required</div>
                  </div>
                </div>

                {/* Front Side Sub-card */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-[11px]">Front Side</span>
                      <span className="text-[9px] text-slate-400">(with photo & address)</span>
                    </div>

                    {uploadingDocKey === 'aadhaar_front' ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Saving...</span>
                      </div>
                    ) : aadhaarFrontDoc ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Front Uploaded
                      </span>
                    ) : (
                      <label
                        htmlFor="file-upload-aadhaar-front"
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Front</span>
                      </label>
                    )}
                  </div>

                  {aadhaarFrontDoc && (
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                      <span className="font-mono text-slate-600 truncate max-w-[170px]">
                        {aadhaarFrontDoc.fileName} ({aadhaarFrontDoc.fileSize})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal(aadhaarFrontDoc)}
                          className="px-1.5 py-0.5 rounded text-slate-600 hover:text-emerald-700 border border-slate-200 bg-slate-50 text-[9px] font-bold cursor-pointer"
                        >
                          View
                        </button>
                        <label
                          htmlFor="file-upload-aadhaar-front"
                          className="px-1.5 py-0.5 rounded text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 text-[9px] font-bold cursor-pointer"
                        >
                          Replace
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc('aadhaar', 'front')}
                          className="px-1 py-0.5 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 text-[9px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadErrors['aadhaar_front'] && (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[9px]">
                      {uploadErrors['aadhaar_front']}
                    </div>
                  )}
                </div>

                {/* Back Side Sub-card */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-[11px]">Back Side</span>
                      <span className="text-[9px] text-slate-400">(with full address barcode)</span>
                    </div>

                    {uploadingDocKey === 'aadhaar_back' ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>Saving...</span>
                      </div>
                    ) : aadhaarBackDoc ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Back Uploaded
                      </span>
                    ) : (
                      <label
                        htmlFor="file-upload-aadhaar-back"
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Back</span>
                      </label>
                    )}
                  </div>

                  {aadhaarBackDoc && (
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                      <span className="font-mono text-slate-600 truncate max-w-[170px]">
                        {aadhaarBackDoc.fileName} ({aadhaarBackDoc.fileSize})
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPreviewDocModal(aadhaarBackDoc)}
                          className="px-1.5 py-0.5 rounded text-slate-600 hover:text-emerald-700 border border-slate-200 bg-slate-50 text-[9px] font-bold cursor-pointer"
                        >
                          View
                        </button>
                        <label
                          htmlFor="file-upload-aadhaar-back"
                          className="px-1.5 py-0.5 rounded text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 text-[9px] font-bold cursor-pointer"
                        >
                          Replace
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc('aadhaar', 'back')}
                          className="px-1 py-0.5 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 text-[9px] font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {uploadErrors['aadhaar_back'] && (
                    <div className="p-1.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[9px]">
                      {uploadErrors['aadhaar_back']}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Driving Licence (Required) */}
              <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                <input
                  type="file"
                  id="file-upload-licence"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'licence')}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg shrink-0">
                      📄
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>Driving Licence</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Valid 2W / 4W Driving Licence</div>
                    </div>
                  </div>

                  {uploadingDocKey === 'licence' ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Saving...</span>
                    </div>
                  ) : licenceDoc ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Uploaded
                    </span>
                  ) : (
                    <label
                      htmlFor="file-upload-licence"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </label>
                  )}
                </div>

                {licenceDoc && (
                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold text-slate-800 text-[11px] truncate">{licenceDoc.fileName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{licenceDoc.fileSize}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal(licenceDoc)}
                        className="p-1 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-white text-[10px] font-bold border border-slate-200 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <label
                        htmlFor="file-upload-licence"
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white text-[10px] font-bold border border-slate-200 cursor-pointer flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('licence')}
                        className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {uploadErrors['licence'] && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10px] flex items-center justify-between">
                    <span>{uploadErrors['licence']}</span>
                    <label
                      htmlFor="file-upload-licence"
                      className="font-black text-rose-900 underline ml-2 cursor-pointer shrink-0"
                    >
                      Retry
                    </label>
                  </div>
                )}
              </div>

              {/* 4. Vehicle RC (Required) */}
              <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                <input
                  type="file"
                  id="file-upload-rc"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'rc')}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg shrink-0">
                      🛵
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>Vehicle RC</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Registration Certificate</div>
                    </div>
                  </div>

                  {uploadingDocKey === 'rc' ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Saving...</span>
                    </div>
                  ) : rcDoc ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Uploaded
                    </span>
                  ) : (
                    <label
                      htmlFor="file-upload-rc"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </label>
                  )}
                </div>

                {rcDoc && (
                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold text-slate-800 text-[11px] truncate">{rcDoc.fileName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{rcDoc.fileSize}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal(rcDoc)}
                        className="p-1 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-white text-[10px] font-bold border border-slate-200 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <label
                        htmlFor="file-upload-rc"
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white text-[10px] font-bold border border-slate-200 cursor-pointer flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('rc')}
                        className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {uploadErrors['rc'] && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10px] flex items-center justify-between">
                    <span>{uploadErrors['rc']}</span>
                    <label
                      htmlFor="file-upload-rc"
                      className="font-black text-rose-900 underline ml-2 cursor-pointer shrink-0"
                    >
                      Retry
                    </label>
                  </div>
                )}
              </div>

              {/* 5. Bank Details (Optional) */}
              <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                <input
                  type="file"
                  id="file-upload-bank"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={e => handleFileSelect(e, 'bank_proof')}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center text-lg shrink-0">
                      🏦
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span>Bank Details</span>
                        <span className="text-[10px] font-bold text-slate-400">(Optional)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Passbook or cancelled cheque</div>
                    </div>
                  </div>

                  {uploadingDocKey === 'bank_proof' ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Saving...</span>
                    </div>
                  ) : bankDoc ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Uploaded
                    </span>
                  ) : (
                    <label
                      htmlFor="file-upload-bank"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 border border-slate-300 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upload</span>
                    </label>
                  )}
                </div>

                {bankDoc && (
                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                    <div className="truncate max-w-[200px]">
                      <div className="font-bold text-slate-800 text-[11px] truncate">{bankDoc.fileName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{bankDoc.fileSize}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal(bankDoc)}
                        className="p-1 rounded-md text-slate-600 hover:text-emerald-700 hover:bg-white text-[10px] font-bold border border-slate-200 flex items-center gap-0.5 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <label
                        htmlFor="file-upload-bank"
                        className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white text-[10px] font-bold border border-slate-200 cursor-pointer flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('bank_proof')}
                        className="p-1 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold border border-rose-200 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {uploadErrors['bank_proof'] && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[10px] flex items-center justify-between">
                    <span>{uploadErrors['bank_proof']}</span>
                    <label
                      htmlFor="file-upload-bank"
                      className="font-black text-rose-900 underline ml-2 cursor-pointer shrink-0"
                    >
                      Retry
                    </label>
                  </div>
                )}
              </div>

              {/* Consent check */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={regTermsConsent}
                  onChange={e => setRegTermsConsent(e.target.checked)}
                  id="regConsent"
                  className="rounded mt-0.5 accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                />
                <label htmlFor="regConsent" className="text-[10px] text-slate-600 leading-tight cursor-pointer select-none">
                  I agree to Hospete Fresh Delivery Partner Rules, background verification, SLA code of conduct, and terms of service.
                </label>
              </div>
            </div>

            {/* Submission Section */}
            <div className="pt-3 space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={!canSubmitApplication}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isResubmittingForPartnerId
                    ? 'Resubmit Corrected Documents'
                    : 'Submit for Admin Approval'}
                </span>
              </button>

              {!canSubmitApplication && (
                <p className="text-[10px] text-amber-700 font-medium text-center px-1">
                  {!isAllRequiredDocumentsUploaded
                    ? `Please upload all 4 required documents (${4 - completedRequiredDocsCount} remaining: ${[
                        !isProfilePhotoComplete && 'Profile Photo',
                        !isAadhaarComplete && (!aadhaarFrontDoc ? 'Aadhaar Front' : 'Aadhaar Back'),
                        !isLicenceComplete && 'Driving Licence',
                        !isRCComplete && 'Vehicle RC'
                      ]
                        .filter(Boolean)
                        .join(', ')})`
                    : !regTermsConsent
                    ? 'Please accept the Delivery Partner Rules to proceed.'
                    : 'Please complete all required fields.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 4: APPLICATION SUBMITTED (Step 3 of 3) */}
        {currentScreen === 'submitted' && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1">Application Submitted</h2>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              Your application has been submitted and is under review by Hospete Fresh Admin.
            </p>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-left mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Application ID</span>
                <span className="font-mono font-black text-slate-900">{regApplicationId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                  ● Under Review
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service Area</span>
                <span className="font-bold text-slate-900">{regServiceArea}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed text-left mb-6">
              💡 <strong>Next Step:</strong> You will be notified once your account is approved.
              You cannot accept or collect orders until Admin verifies your documents.
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('approval_status')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Check Approval Status
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('login')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all cursor-pointer"
              >
                Go to Login
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: APPROVAL STATUS */}
        {currentScreen === 'approval_status' && (
          <div className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentScreen('login')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Application Status</h2>
              <div className="w-5" />
            </div>

            {/* Rider Header Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 flex items-center justify-between">
              <div>
                <div className="font-black text-slate-900 text-sm">{currentRider.name}</div>
                <div className="text-[11px] text-slate-500">ID: {currentRider.applicationId}</div>
                <div className="text-[10px] text-slate-600 font-semibold mt-0.5">Area: {currentRider.serviceArea}</div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  currentRider.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentRider.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {currentRider.status === 'approved' ? 'Approved' : currentRider.status === 'rejected' ? 'Rejected' : 'Under Review'}
              </span>
            </div>

            {/* Timeline Stepper matching Screen 5 in storyboard */}
            <div className="space-y-4 mb-6 relative pl-6 text-xs before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {/* Step 1: Submitted */}
              <div className="relative">
                <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                  ✓
                </div>
                <div className="font-black text-slate-900">Submitted</div>
                <div className="text-[10px] text-slate-500">{currentRider.appliedAt}</div>
              </div>

              {/* Step 2: Under Review */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs ${
                    currentRider.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : currentRider.status === 'rejected'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white animate-pulse'
                  }`}
                >
                  {currentRider.status === 'approved' ? '✓' : '!'}
                </div>
                <div className="font-black text-slate-900">Under Review</div>
                <div className="text-[10px] text-slate-500">
                  {currentRider.status === 'approved'
                    ? 'Application verified by Admin'
                    : 'Your application is being reviewed by central ops.'}
                </div>
              </div>

              {/* Step 3: Approved / Status Result */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    currentRider.status === 'approved'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {currentRider.status === 'approved' ? '✓' : '3'}
                </div>
                <div className="font-black text-slate-900">Approved</div>
                <div className="text-[10px] text-slate-500">
                  {currentRider.status === 'approved'
                    ? 'Account active. You can now login and accept orders.'
                    : 'Awaiting admin approval.'}
                </div>
              </div>

              {/* Step 4: Rejection (Conditional) */}
              {currentRider.status === 'rejected' && (
                <div className="relative pt-1">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">
                    ✕
                  </div>
                  <div className="font-black text-rose-800">Rejected / Documents Required</div>
                  <div className="text-[10px] text-rose-600 leading-snug mt-0.5">
                    {currentRider.adminNotes || 'Please re-upload a clear copy of driving licence.'}
                  </div>
                </div>
              )}
            </div>

            {/* Actions depending on status */}
            <div className="mt-auto space-y-2">
              {currentRider.status === 'approved' ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen('dashboard');
                    setActiveBottomTab('home');
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Enter Partner Dashboard &rarr;</span>
                </button>
              ) : currentRider.status === 'rejected' ? (
                <button
                  type="button"
                  onClick={handleStartResubmission}
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Re-upload Requested Documents &rarr;</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Demo shortcut: allow instant approval simulation
                      if (setDeliveryPartners) {
                        setDeliveryPartners(prev =>
                          prev.map(d => (d.id === currentRider.id ? { ...d, status: 'approved', isOnline: true } : d))
                        );
                      }
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-2xl text-xs shadow-xs transition-all cursor-pointer"
                  >
                    ⚡ [Demo Action]: Simulate Admin Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('login')}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 6: DASHBOARD (Home) */}
        {currentScreen === 'dashboard' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Dashboard Header */}
            <div className="bg-white p-4 border-b border-slate-200/80 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center overflow-hidden border border-emerald-300">
                    {currentRider.profilePhoto ? (
                      <img src={currentRider.profilePhoto} alt={currentRider.name} className="w-full h-full object-cover" />
                    ) : (
                      'RK'
                    )}
                  </div>
                  <div>
                    <h1 className="text-xs font-black text-slate-900 leading-tight">Hospete Fresh</h1>
                    <div className="text-[10px] text-slate-500 font-semibold">{currentRider.name}</div>
                  </div>
                </div>

                {/* Online / Offline Switch Toggle matching Screen 6 */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(true)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 relative cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 absolute top-1 right-1" />
                  </button>

                  <div
                    onClick={toggleOnline}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                      currentRider.isOnline
                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentRider.isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                    <span className="text-[10px] font-black">{currentRider.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              {!currentRider.isOnline && (
                <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>You are offline. Toggle Online above to receive automatic order assignments.</span>
                </div>
              )}
            </div>

            {/* Dashboard Content */}
            <div className="p-4 space-y-4">
              {/* Metric Cards (2x2 grid matching Screen 6 in storyboard) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Card 1: Assigned */}
                <div
                  onClick={() => {
                    setAssignedOrdersTab('assigned');
                    setCurrentScreen('assigned_orders');
                    setActiveBottomTab('orders');
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="text-2xl font-black text-blue-600">{assignedOnly.length}</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Assigned</div>
                </div>

                {/* Card 2: Picked Up */}
                <div
                  onClick={() => {
                    setAssignedOrdersTab('picked_up');
                    setCurrentScreen('assigned_orders');
                    setActiveBottomTab('orders');
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-300 transition-all"
                >
                  <div className="text-2xl font-black text-amber-600">{pickedUpOnly.length}</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Picked Up</div>
                </div>

                {/* Card 3: Delivered */}
                <div
                  onClick={() => {
                    setAssignedOrdersTab('delivered');
                    setCurrentScreen('assigned_orders');
                    setActiveBottomTab('orders');
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="text-2xl font-black text-emerald-600">{deliveredOnly.length}</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">Delivered</div>
                </div>

                {/* Card 4: Today's Earnings */}
                <div
                  onClick={() => {
                    setCurrentScreen('earnings');
                    setActiveBottomTab('earnings');
                  }}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="text-2xl font-black text-slate-900">₹{currentRider.earnings.today}</div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-0.5">Today's Earnings</div>
                </div>
              </div>

              {/* NEXT ACTION PROMINENT CARD (Screen 6 in storyboard) */}
              {assignedOnly.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-white/10 px-2 py-0.5 rounded">
                      ⚡ Next Action Required
                    </span>
                    <span className="text-xs font-black font-mono">#{assignedOnly[0].orderNumber}</span>
                  </div>

                  <div>
                    <div className="text-sm font-black">{assignedOnly[0].vendorName || 'Sri Lakshmi Store'}</div>
                    <div className="text-xs text-emerald-200">
                      {assignedOnly[0].items.length} items &bull; ₹{assignedOnly[0].totalAmount}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveOrderId(assignedOnly[0].id);
                      setCurrentScreen('order_details_before_pickup');
                    }}
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Go to Vendor &rarr;</span>
                  </button>
                </div>
              )}

              {/* RECENT ORDERS LIST */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Orders</h3>
                  <button
                    onClick={() => {
                      setCurrentScreen('assigned_orders');
                      setActiveBottomTab('orders');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="space-y-2">
                  {riderAssignedOrders.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-lg">
                        🛵
                      </div>
                      <div className="font-extrabold text-xs text-slate-800">
                        No Orders Currently Assigned
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                        You are online and ready for dispatch. When the operations hub assigns delivery orders to your vehicle, they will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    riderAssignedOrders.slice(0, 4).map(ord => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setActiveOrderId(ord.id);
                        if (ord.status === 'Picked Up' || ord.status === 'Out for Delivery') {
                          setCurrentScreen('customer_details_after_pickup');
                        } else if (ord.status === 'Delivered') {
                          setCurrentScreen('delivered_success');
                        } else {
                          setCurrentScreen('order_details_before_pickup');
                        }
                      }}
                      className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-black text-xs text-slate-900">{ord.orderNumber}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {ord.items.length} items &bull; {ord.vendorName || 'Local Store'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'Picked Up'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 7: ASSIGNED ORDERS LIST */}
        {currentScreen === 'assigned_orders' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('home');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">My Orders</h2>
              <div className="w-5" />
            </div>

            {/* Tabs: Assigned, Picked Up, Delivered (matching Screen 7) */}
            <div className="p-3 bg-white border-b border-slate-200 flex gap-2">
              <button
                onClick={() => {
                  setAssignedOrdersTab('assigned');
                  setOrdersPage(1);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  assignedOrdersTab === 'assigned'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Assigned ({assignedOnly.length})
              </button>
              <button
                onClick={() => {
                  setAssignedOrdersTab('picked_up');
                  setOrdersPage(1);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  assignedOrdersTab === 'picked_up'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Picked Up ({pickedUpOnly.length})
              </button>
              <button
                onClick={() => {
                  setAssignedOrdersTab('delivered');
                  setOrdersPage(1);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  assignedOrdersTab === 'delivered'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Delivered ({deliveredOnly.length})
              </button>
            </div>

            {/* List with Product Variants & Stock Inventory style Pagination */}
            {(() => {
              const currentTabOrders =
                assignedOrdersTab === 'assigned'
                  ? assignedOnly
                  : assignedOrdersTab === 'picked_up'
                  ? pickedUpOnly
                  : deliveredOnly;

              const totalOrderPages = Math.max(1, Math.ceil(currentTabOrders.length / ordersPageSize));
              const validOrderPage = Math.min(Math.max(1, ordersPage), totalOrderPages);
              const orderStartIdx = (validOrderPage - 1) * ordersPageSize;
              const paginatedTabOrders = currentTabOrders.slice(orderStartIdx, orderStartIdx + ordersPageSize);

              return (
                <div className="p-4 space-y-3">
                  {paginatedTabOrders.map(ord => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-black text-sm text-slate-900">#{ord.orderNumber}</span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'Picked Up'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="font-bold text-slate-900">
                          {ord.items.length} items &bull; ₹{ord.totalAmount}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          🏪 <strong>{ord.vendorName || 'Sri Lakshmi Store'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          📍 {ord.vendorAddress || 'Kampli Road, Hospet - 583201'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          🕒 {ord.assignedAt ? `Assigned: ${ord.assignedAt}` : `Created: ${ord.createdAt}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveOrderId(ord.id);
                          if (ord.status === 'Picked Up' || ord.status === 'Out for Delivery') {
                            setCurrentScreen('customer_details_after_pickup');
                          } else if (ord.status === 'Delivered') {
                            setCurrentScreen('delivered_success');
                          } else {
                            setCurrentScreen('order_details_before_pickup');
                          }
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer"
                      >
                        View Details &rarr;
                      </button>
                    </div>
                  ))}

                  {/* Empty state */}
                  {currentTabOrders.length === 0 && (
                    <div className="text-center py-12 px-4 space-y-2 text-slate-400">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                        📦
                      </div>
                      <div className="font-extrabold text-xs text-slate-800">
                        {assignedOrdersTab === 'assigned'
                          ? 'No New Deliveries Assigned'
                          : assignedOrdersTab === 'picked_up'
                          ? 'No Orders in Transit'
                          : 'No Completed Deliveries Yet'}
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        {assignedOrdersTab === 'assigned'
                          ? 'Orders assigned to your route by the dispatch desk will appear here with store pickup details.'
                          : assignedOrdersTab === 'picked_up'
                          ? 'Orders you have picked up and are currently delivering to customers will show here.'
                          : 'Delivered orders fulfilled during your shift will be listed here.'}
                      </p>
                    </div>
                  )}

                  {/* Pagination Controls identical to Product Variants & Stock Inventory */}
                  {currentTabOrders.length > 0 && (
                    <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-slate-600 font-semibold text-[11px]">
                          Showing <strong className="text-slate-900">{currentTabOrders.length > 0 ? orderStartIdx + 1 : 0}–{Math.min(orderStartIdx + ordersPageSize, currentTabOrders.length)}</strong> of <strong className="text-slate-900">{currentTabOrders.length}</strong> orders
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <span>Show</span>
                          <select
                            value={ordersPageSize}
                            onChange={e => {
                              setOrdersPageSize(Number(e.target.value));
                              setOrdersPage(1);
                            }}
                            className="h-7 px-2 py-0 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
                          >
                            <option value={3}>3 per page</option>
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 pt-0.5">
                        <button
                          onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                          disabled={validOrderPage <= 1}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                            validOrderPage <= 1
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                          }`}
                        >
                          &larr; Prev
                        </button>

                        {Array.from({ length: totalOrderPages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setOrdersPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              pageNum === validOrderPage
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setOrdersPage(p => Math.min(totalOrderPages, p + 1))}
                          disabled={validOrderPage >= totalOrderPages}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
                            validOrderPage >= totalOrderPages
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs cursor-pointer'
                          }`}
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ACCESS RESTRICTION FALLBACK (if order is unassigned or assigned to another rider) */}
        {(currentScreen === 'order_details_before_pickup' ||
          currentScreen === 'pickup_checklist' ||
          currentScreen === 'picked_up_confirmation' ||
          currentScreen === 'customer_details_after_pickup' ||
          currentScreen === 'navigate_to_customer' ||
          currentScreen === 'delivery_checklist' ||
          currentScreen === 'mark_delivered') &&
          !activeOrder && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Access Restricted</h3>
              <p className="text-xs text-slate-500 mb-6 max-w-xs leading-relaxed">
                This order is either unassigned or assigned to another delivery partner. You can only view orders explicitly assigned to your account.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('assigned_orders');
                  setActiveBottomTab('orders');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Back to My Assigned Orders
              </button>
            </div>
          )}

        {/* SCREEN 8: ORDER DETAILS (BEFORE PICKUP) */}
        {currentScreen === 'order_details_before_pickup' && activeOrder && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200/80 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => setCurrentScreen('assigned_orders')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Order Details</h2>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-4">
              {/* Order Number & Status */}
              <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <div className="font-mono font-black text-sm text-slate-900">#{activeOrder.orderNumber}</div>
                  <div className="text-[10px] text-slate-500">
                    {activeOrder.assignedAt ? `Assigned at ${activeOrder.assignedAt}` : activeOrder.createdAt}
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black ${
                    activeOrder.status === 'Assigned'
                      ? 'bg-blue-100 text-blue-800'
                      : activeOrder.status === 'Picked Up'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {activeOrder.status}
                </span>
              </div>

              {/* Vendor Pickup Details Card (Screen 8) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Pickup From (Vendor)
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">
                      {activeOrder.vendorName || 'Sri Lakshmi Store'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      {activeOrder.vendorAddress || 'Kampli Road, Hospet - 583201 Near Bus Stand, Opp. City Mart'}
                    </p>
                  </div>
                  <a
                    href={`tel:${activeOrder.vendorPhone || '+919845100223'}`}
                    className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="pt-1">
                  <a
                    href="https://maps.google.com/?q=Kampli+Road+Hospete"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5 text-slate-600" />
                    <span>Open in Maps</span>
                  </a>
                </div>

                {/* Pickup Instructions */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">
                    Pickup Instructions
                  </span>
                  <span className="text-slate-700 font-medium">
                    {activeOrder.pickupInstructions || 'Collect packed items from main counter and verify item checklist.'}
                  </span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Order Items ({activeOrder.items.length})
                  </span>
                  <span className="text-xs font-black text-emerald-700">₹{activeOrder.totalAmount}</span>
                </div>

                <div className="space-y-2">
                  {activeOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-sm">
                          🍅
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900">{it.productName}</div>
                          <div className="text-[10px] text-slate-500">{it.packSize} &bull; Qty: {it.quantity}</div>
                        </div>
                      </div>
                      <div className="font-black text-slate-800">₹{it.subtotal}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Zone (Locality visible for route planning, exact address & phone locked) */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>Customer Delivery Zone</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-950 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-800" /> Address &amp; Phone Hidden
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900">
                  📍 Destination Locality: {activeOrder.locality || 'Hospete Central'}
                </div>
                <p className="text-[11px] text-amber-950/80 leading-snug">
                  Customer phone number and exact street address are hidden until you inspect items and confirm pickup at the vendor.
                </p>
              </div>

              {/* Big Action Button: Start Navigation to Vendor */}
              <button
                type="button"
                onClick={() => setCurrentScreen('pickup_checklist')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Start Navigation to Vendor &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 9: PICKUP CHECKLIST (AT VENDOR) */}
        {currentScreen === 'pickup_checklist' && activeOrder && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => setCurrentScreen('order_details_before_pickup')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-sm font-black text-slate-900">Pickup Checklist</h2>
                <div className="font-mono text-[10px] text-slate-500 font-bold">#{activeOrder.orderNumber}</div>
              </div>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-3.5">
              {/* Verification Prompt Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">Verify the items packed by vendor before picking up.</span>
              </div>

              {/* Discrepancy warning banner if active */}
              {activeOrder.deliveryDiscrepancy && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-black text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Discrepancy Active — Pickup Blocked</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-snug">
                    "{activeOrder.deliveryDiscrepancy.reason}"
                  </p>
                  <button
                    type="button"
                    onClick={handleResolveDiscrepancy}
                    className="w-full py-1.5 bg-white border border-rose-300 text-rose-800 font-extrabold rounded-lg text-[10px] cursor-pointer hover:bg-rose-50"
                  >
                    ✓ Resolve &amp; Clear Discrepancy
                  </button>
                </div>
              )}

              {/* Items List with Checkboxes & Steppers */}
              <div className="space-y-2.5">
                {activeOrder.items.map((it, idx) => {
                  const checkKey = `${activeOrder.id}-${idx}`;
                  const isChecked = !!pickupChecks[checkKey];
                  const curQty = verifiedQuantities[checkKey] !== undefined ? verifiedQuantities[checkKey] : it.quantity;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div
                          onClick={() => togglePickupItem(activeOrder.id, idx)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        {/* Thumbnail & Product Details */}
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                          {it.productName.toLowerCase().includes('tomato') ? '🍅' : '🌿'}
                        </div>

                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {it.productName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {it.packSize} &bull; Ordered: <strong className="text-slate-800">{it.quantity}x</strong>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper (+ -) */}
                      <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(activeOrder.id, idx, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-black text-xs text-slate-900">{curQty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(activeOrder.id, idx, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Verification Status Badge */}
              <div className="flex justify-between items-center px-1 pt-1">
                <span className="text-xs text-slate-500 font-semibold">Verification Status</span>
                {isAllPickupItemsChecked ? (
                  <span className="text-xs font-black text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> All items verified
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700">Check all items to confirm</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleConfirmPickup}
                  disabled={!isAllPickupItemsChecked || !!activeOrder.deliveryDiscrepancy}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Confirm Picked Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDiscrepancyModalOpen(true)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  ⚠️ Report Item Discrepancy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 10: PICKED UP CONFIRMATION */}
        {currentScreen === 'picked_up_confirmation' && activeOrder && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1">Order Picked Up Successfully</h2>
            <div className="font-mono font-bold text-xs text-emerald-700 mb-2">#{activeOrder.orderNumber}</div>
            <p className="text-xs text-slate-500 mb-6">
              Picked up at {activeOrder.pickedUpAt || '12 Oct 2026, 10:35 AM'}. Customer delivery details have now been unlocked.
            </p>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => setCurrentScreen('customer_details_after_pickup')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Go to Delivery &rarr;
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('order_details_before_pickup')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs cursor-pointer"
              >
                View Order Details
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 11: CUSTOMER DETAILS (AFTER PICKUP) */}
        {currentScreen === 'customer_details_after_pickup' && activeOrder && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => setCurrentScreen('assigned_orders')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Delivery to Customer</h2>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-4">
              {/* Customer Info Card (Screen 11 in storyboard) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-800">
                      👤
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{activeOrder.customerName}</h3>
                      <div className="text-xs text-slate-500 font-semibold">{activeOrder.phone}</div>
                    </div>
                  </div>

                  <a
                    href={`tel:${activeOrder.phone}`}
                    className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    Delivery Address
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {activeOrder.address}, {activeOrder.locality} - 583201
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Near Govt. School</div>
                </div>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeOrder.address + ' ' + activeOrder.locality + ' Hospete')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View on Map</span>
                </a>
              </div>

              {/* Delivery Instructions */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950">
                <div className="font-black uppercase text-[10px] text-amber-800 tracking-wider mb-1">
                  Delivery Instructions
                </div>
                <div>{activeOrder.deliveryInstructions || 'Call before delivery. House is on left side, blue gate.'}</div>
              </div>

              {/* Collect Amount */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Payment to Collect</span>
                <span className="text-base font-black text-emerald-700">₹{activeOrder.totalAmount} ({activeOrder.paymentMethod})</span>
              </div>

              {/* Start Navigation Action */}
              <button
                type="button"
                onClick={() => setCurrentScreen('navigate_to_customer')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Start Navigation &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 12: NAVIGATE TO CUSTOMER (SIMULATED MAP ROUTE) */}
        {currentScreen === 'navigate_to_customer' && activeOrder && (
          <div className="flex-1 flex flex-col bg-slate-900 text-white overflow-hidden relative">
            {/* Top Bar with ETA */}
            <div className="p-4 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between z-10">
              <button
                onClick={() => setCurrentScreen('customer_details_after_pickup')}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <div className="text-sm font-black text-emerald-400">5.2 km &bull; 15 mins</div>
                <div className="text-[10px] text-slate-400">Fastest route via College Road</div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeOrder.address + ' Hospete')}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold"
              >
                Open Maps
              </a>
            </div>

            {/* Interactive Simulated Vector Map (matching Screen 13 in storyboard) */}
            <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full absolute inset-0 opacity-80" viewBox="0 0 400 450">
                {/* Map Grid Roads */}
                <path d="M 50 0 L 50 450 M 150 0 L 150 450 M 280 0 L 280 450 M 350 0 L 350 450" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 0 80 L 400 80 M 0 180 L 400 180 M 0 300 L 400 300 M 0 400 L 400 400" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />

                {/* Main Arterial Road in Hospete */}
                <path d="M 70 380 Q 180 320 220 200 T 320 100" fill="none" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
                {/* Active Navigation Route Line (Cyan/Emerald) */}
                <path d="M 70 380 Q 180 320 220 200 T 320 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />

                {/* Rider Scooter Marker */}
                <circle cx="70" cy="380" r="14" fill="#047857" />
                <circle cx="70" cy="380" r="8" fill="#34d399" />
                <text x="70" y="384" fontSize="10" textAnchor="middle" fill="#0f172a" fontWeight="900">🛵</text>

                {/* Turn waypoint */}
                <circle cx="220" cy="200" r="6" fill="#f59e0b" />

                {/* Customer Destination Marker */}
                <circle cx="320" cy="100" r="18" fill="#ef4444" opacity="0.3" className="animate-ping" />
                <circle cx="320" cy="100" r="12" fill="#ef4444" />
                <text x="320" y="104" fontSize="10" textAnchor="middle" fill="#ffffff" fontWeight="bold">📍</text>
              </svg>

              {/* Floating Navigation Card */}
              <div className="absolute bottom-20 left-4 right-4 bg-slate-800/95 border border-slate-700/80 backdrop-blur rounded-2xl p-3.5 shadow-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                    &rarr;
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">In 300m, turn right onto Station Road</div>
                    <div className="text-[10px] text-slate-400">Destination: {activeOrder.customerName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Arrived Action */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
              <button
                type="button"
                onClick={() => setCurrentScreen('delivery_checklist')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Arrived at Customer / Check Items &rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 13: DELIVERY CHECKLIST */}
        {currentScreen === 'delivery_checklist' && activeOrder && (
          <div className="flex-1 flex flex-col bg-white overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => setCurrentScreen('navigate_to_customer')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Delivery Checklist</h2>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
                <strong>Verify items before handover:</strong> Check each item as you remove it from your delivery bag.
              </div>

              <div className="space-y-2">
                {activeOrder.items.map((it, idx) => {
                  const checkKey = `${activeOrder.id}-${idx}`;
                  const isChecked = !!deliveryChecks[checkKey];

                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setDeliveryChecks(prev => ({
                          ...prev,
                          [checkKey]: !prev[checkKey]
                        }))
                      }
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isChecked ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">{it.productName}</div>
                          <div className="text-[10px] text-slate-500">{it.packSize} &bull; Qty: {it.quantity}</div>
                        </div>
                      </div>
                      <span className="font-black text-xs text-slate-800">₹{it.subtotal}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentScreen('mark_delivered')}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer mt-4"
              >
                Confirm Items &amp; Proceed &rarr;
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 14: MARK AS DELIVERED (OTP + PROOF) */}
        {currentScreen === 'mark_delivered' && activeOrder && (
          <div className="flex-1 flex flex-col p-5 bg-white overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentScreen('delivery_checklist')}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Confirm Delivery</h2>
              <div className="w-5" />
            </div>

            <div className="text-center mb-6">
              <div className="font-mono text-xs font-bold text-slate-500 mb-1">#{activeOrder.orderNumber}</div>
              <h3 className="text-base font-black text-slate-900">Enter Customer OTP</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ask the customer for the 4-digit delivery verification code.</p>
            </div>

            {otpError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs text-center">
                {otpError}
              </div>
            )}

            {/* 4 Digit OTP Inputs matching Screen 14 in storyboard */}
            <div className="flex justify-center gap-3 mb-4">
              <input
                type="text"
                maxLength={1}
                value={otpDigit1}
                onChange={e => setOtpDigit1(e.target.value)}
                className="w-12 h-14 text-center font-black text-xl border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none"
              />
              <input
                type="text"
                maxLength={1}
                value={otpDigit2}
                onChange={e => setOtpDigit2(e.target.value)}
                className="w-12 h-14 text-center font-black text-xl border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none"
              />
              <input
                type="text"
                maxLength={1}
                value={otpDigit3}
                onChange={e => setOtpDigit3(e.target.value)}
                className="w-12 h-14 text-center font-black text-xl border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none"
              />
              <input
                type="text"
                maxLength={1}
                value={otpDigit4}
                onChange={e => setOtpDigit4(e.target.value)}
                className="w-12 h-14 text-center font-black text-xl border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none"
              />
            </div>

            {/* Quick Demo Fill OTP chip */}
            <div className="text-center mb-6">
              <button
                type="button"
                onClick={() => {
                  setOtpDigit1('2');
                  setOtpDigit2('8');
                  setOtpDigit3('4');
                  setOtpDigit4('6');
                }}
                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100"
              >
                ⚡ Auto-fill Customer OTP (Demo: 2846)
              </button>
            </div>

            {/* Payment Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs mb-6">
              <span className="text-slate-600 font-semibold">Collect Cash / UPI</span>
              <span className="text-base font-black text-emerald-700">₹{activeOrder.totalAmount}</span>
            </div>

            {/* Optional Photo Proof */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setDeliveryPhotoProof('https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80')}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  deliveryPhotoProof
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>{deliveryPhotoProof ? '✓ Delivery Photo Captured' : 'Take Photo (Optional)'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleMarkDelivered}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Mark as Delivered
            </button>
          </div>
        )}

        {/* SCREEN 15: DELIVERED SUCCESS */}
        {currentScreen === 'delivered_success' && activeOrder && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center text-center bg-white overflow-y-auto">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-1">Order Delivered Successfully</h2>
            <div className="font-mono font-bold text-xs text-emerald-700 mb-1">#{activeOrder.orderNumber}</div>
            <p className="text-xs text-slate-500 mb-4">
              Delivered at {activeOrder.deliveredAt || '12 Oct 2026, 11:10 AM'}
            </p>

            <div className="w-full p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-black mb-6">
              🎉 Payout Earned: +₹45.00 credited to your daily wallet!
            </div>

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('home');
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Go to Home
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('order_history');
                  setActiveBottomTab('orders');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs cursor-pointer"
              >
                View in History
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 16: ORDER HISTORY */}
        {currentScreen === 'order_history' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('home');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">My Orders (History)</h2>
              <div className="w-5" />
            </div>

            {/* Filter Chips: All, Assigned, Picked Up, Delivered (matching Screen 16 in storyboard) */}
            <div className="p-3 bg-white border-b border-slate-200 space-y-2">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['all', 'assigned', 'picked_up', 'delivered'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setHistoryFilterTab(tab)}
                    className={`px-3 py-1 rounded-xl text-xs font-black capitalize transition-all cursor-pointer ${
                      historyFilterTab === tab
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'picked_up' ? 'Picked Up' : tab}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search by Order ID (e.g. 83921)..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-slate-800 text-xs font-semibold"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-2.5">
              {orders
                .filter(o => {
                  if (historyFilterTab === 'assigned') return o.status === 'Ready for Pickup' || o.status === 'Accepted' || o.status === 'New';
                  if (historyFilterTab === 'picked_up') return o.status === 'Picked Up' || o.status === 'Out for Delivery';
                  if (historyFilterTab === 'delivered') return o.status === 'Delivered';
                  return true;
                })
                .filter(o => {
                  if (!historySearchQuery) return true;
                  return (
                    o.orderNumber.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
                    o.customerName.toLowerCase().includes(historySearchQuery.toLowerCase())
                  );
                })
                .map(ord => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setActiveOrderId(ord.id);
                      if (ord.status === 'Delivered') setCurrentScreen('delivered_success');
                      else setCurrentScreen('order_details_before_pickup');
                    }}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-xs text-slate-900">#{ord.orderNumber}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'Picked Up'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800">
                      {ord.items.length} items &bull; ₹{ord.totalAmount}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      🏪 {ord.vendorName || 'Sri Lakshmi Store'} &bull; {ord.createdAt}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* SCREEN 17: EARNINGS (Screen 10 in prompt) */}
        {currentScreen === 'earnings' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('home');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Earnings &amp; Payouts</h2>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-4">
              {/* Today's Hero Card */}
              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-5 rounded-3xl shadow-md text-center space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Today's Earnings
                </span>
                <div className="text-3xl font-black">₹{currentRider.earnings.today}</div>
                <div className="text-[11px] text-emerald-200">12 deliveries fulfilled today</div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div className="text-slate-500 text-[10px] font-bold">This Week</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">₹{currentRider.earnings.thisWeek}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div className="text-slate-500 text-[10px] font-bold">Pending Payout</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">₹{currentRider.earnings.pendingPayout}</div>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-black text-slate-900">Payout Account</div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{currentRider.bankDetails?.bankName || 'HDFC Bank'}</div>
                    <div className="text-[10px] text-slate-500">A/c: {currentRider.bankDetails?.accountNumber || '*********4321'}</div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              </div>

              {/* Past Payouts History */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-1">Payout History</h3>
                <div className="space-y-1.5 text-xs">
                  {currentRider.earnings.history.map(h => (
                    <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">₹{h.amount}</div>
                        <div className="text-[10px] text-slate-500">{h.date} &bull; {h.orderCount} orders</div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Paid ✓
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 18: PROFILE (Screen 11 in prompt) */}
        {currentScreen === 'profile' && (
          <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-16">
            {/* Top Bar */}
            <div className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10 flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentScreen('dashboard');
                  setActiveBottomTab('home');
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-black text-slate-900">Rider Profile</h2>
              <div className="w-5" />
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Header profile info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-black text-lg mx-auto flex items-center justify-center overflow-hidden border-2 border-emerald-300">
                  {currentRider.profilePhoto ? (
                    <img src={currentRider.profilePhoto} alt={currentRider.name} className="w-full h-full object-cover" />
                  ) : (
                    'RK'
                  )}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{currentRider.name}</h3>
                  <div className="text-slate-500 font-semibold">{currentRider.phone}</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">
                    ★ {currentRider.ratings || 4.9} Rating &bull; {currentRider.totalDeliveries || 128} Deliveries
                  </div>
                </div>
              </div>

              {/* Verified Documents Checklist */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 mb-1">Approved Documents</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">Aadhaar Card</span>
                    <span className="text-[10px] font-black text-emerald-700">Verified ✓</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">Driving Licence ({currentRider.licenceNumber || 'DL-1234567890'})</span>
                    <span className="text-[10px] font-black text-emerald-700">Verified ✓</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-xl">
                    <span className="font-semibold text-slate-700">Vehicle RC ({currentRider.vehicleNumber})</span>
                    <span className="text-[10px] font-black text-emerald-700">Verified ✓</span>
                  </div>
                </div>
              </div>

              {/* Vehicle & Area Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 mb-1">Vehicle &amp; Service Area</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Vehicle</span>
                    <strong className="text-slate-900">{currentRider.vehicleNumber} ({currentRider.vehicleType})</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Service Area</span>
                    <strong className="text-slate-900">{currentRider.serviceArea}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Active Route</span>
                    <strong className="text-slate-900">{currentRider.assignedRoute || 'Kampli Road Hub'}</strong>
                  </div>
                </div>
              </div>

              {/* 24x7 Helpline */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 flex justify-between items-center">
                <div>
                  <div className="font-black">24x7 Rider Helpline</div>
                  <div className="text-[10px] text-emerald-800">Support for breakdown or emergencies</div>
                </div>
                <a
                  href="tel:08394220199"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                >
                  Call
                </a>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogoutDeliveryPartner}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-2xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Delivery Partner</span>
              </button>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR (Screens 6-16) */}
        {currentScreen !== 'login' &&
          currentScreen !== 'register' &&
          currentScreen !== 'document_upload' &&
          currentScreen !== 'submitted' &&
          currentScreen !== 'approval_status' &&
          currentScreen !== 'navigate_to_customer' && (
            <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center absolute bottom-0 inset-x-0 z-20 shadow-lg">
              <button
                onClick={() => handleBottomNavClick('home')}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  activeBottomTab === 'home' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Bike className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] font-black">Home</span>
              </button>

              <button
                onClick={() => handleBottomNavClick('orders')}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  activeBottomTab === 'orders' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <PackageCheck className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] font-black">Orders</span>
              </button>

              <button
                onClick={() => handleBottomNavClick('earnings')}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  activeBottomTab === 'earnings' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Wallet className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] font-black">Earnings</span>
              </button>

              <button
                onClick={() => handleBottomNavClick('profile')}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  activeBottomTab === 'profile' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <User className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] font-black">Profile</span>
              </button>
            </div>
          )}

        {/* DISCREPANCY REPORTING MODAL */}
        {isDiscrepancyModalOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 text-xs text-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-sm text-slate-900">Report Item Discrepancy</h3>
                <button
                  onClick={() => setIsDiscrepancyModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-slate-500 leading-snug">
                Reporting a discrepancy will prevent pickup confirmation until corrected by the store vendor.
              </p>

              <div>
                <label className="block font-black text-slate-700 text-[10px] uppercase mb-1">
                  Discrepancy Reason
                </label>
                <select
                  value={discrepancyReason}
                  onChange={e => setDiscrepancyReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-semibold bg-white outline-none"
                >
                  <option value="Fresh Red Tomatoes (1 kg) - 1 pack missing from sealed box">
                    Missing item from package
                  </option>
                  <option value="Damaged or unsealed product packaging">
                    Damaged / leaking product packaging
                  </option>
                  <option value="Quantity mismatch with physical count">
                    Quantity count mismatch
                  </option>
                  <option value="Product substituted without customer approval">
                    Substituted without customer approval
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 text-[10px] uppercase mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={discrepancyNotes}
                  onChange={e => setDiscrepancyNotes(e.target.value)}
                  placeholder="e.g. Vendor says fresh stock arriving in 5 mins..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDiscrepancyModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDiscrepancy}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs"
                >
                  Submit Discrepancy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION BEFORE MARKING DELIVERED MODAL */}
        {isConfirmDeliverModalOpen && activeOrder && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 text-xs text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Confirm Order Delivery</h3>
                    <div className="font-mono text-[10px] text-slate-500 font-bold">#{activeOrder.orderNumber}</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmDeliverModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Customer</span>
                  <span className="font-black text-slate-900 text-right">{activeOrder.customerName}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Address</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[180px] truncate leading-tight">
                    {activeOrder.address}, {activeOrder.locality}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Collect Payment</span>
                  <span className="font-black text-emerald-700">₹{activeOrder.totalAmount} ({activeOrder.paymentMethod})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Items Checklist</span>
                  <span className="font-bold text-slate-800">✓ {activeOrder.items.length} items checked</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-snug">
                <strong>Handover Check:</strong> Are you sure you have physically handed over all verified items to the customer and collected payment?
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmDeliverModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeConfirmDelivered}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Yes, Delivered</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS MODAL (Screen 12 in prompt) */}
        {isNotificationsOpen && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3 text-xs text-slate-800 max-h-[500px] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-black text-sm text-slate-900">Notifications</h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {(currentRider.notifications || []).map(n => (
                  <div key={n.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 font-black text-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW MODAL */}
        {previewDocModal && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-3.5 text-xs text-slate-800 flex flex-col">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="font-black text-sm text-slate-900">{previewDocModal.name}</h3>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {previewDocModal.fileName} • {previewDocModal.fileSize || 'Standard'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Document Image or PDF Card */}
              <div className="w-full min-h-48 max-h-72 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden relative">
                {previewDocModal.fileData?.startsWith('data:image') ||
                previewDocModal.previewUrl?.startsWith('data:image') ||
                previewDocModal.previewUrl?.startsWith('http') ? (
                  <img
                    src={previewDocModal.fileData || previewDocModal.previewUrl}
                    alt={previewDocModal.name}
                    className="w-full h-full object-contain max-h-64"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-slate-600">
                    <FileText className="w-12 h-12 text-emerald-600 stroke-1" />
                    <div className="font-bold text-slate-900 text-center">{previewDocModal.fileName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">PDF / Document File</div>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Hospete Fresh Verified Document
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] flex items-center justify-between text-slate-600">
                <span>Upload Status: <strong className="text-emerald-700 uppercase">Ready for Admin Review</strong></span>
                <span className="font-mono text-slate-400">{previewDocModal.uploadedAt || 'Just now'}</span>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 font-black text-white rounded-xl cursor-pointer text-xs transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
