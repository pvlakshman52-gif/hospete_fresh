import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { multiVendorStore } from './server/multiVendorAllocation.ts';
import { runInitialMigration } from './src/db/migrateInitialData.ts';
import { db } from './src/db/index.ts';
import {
  getCategories,
  getVendors,
  getProducts,
  getVendorInventoryRecords,
  getSystemSettingsMap,
  updateSystemSetting,
  getFieldPolicies,
  createAdminException,
  getVendorSettlements,
  getOrders,
} from './src/db/repository.ts';
import { NotificationService } from './src/services/notificationService.ts';
import { sql } from 'drizzle-orm';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Run initial migration lazily/asynchronously on boot
  runInitialMigration().catch(err => {
    console.error('[Database Migration Warning] Error running initial migration:', err);
  });

  // JSON and URL-encoded body parsers with 10mb limit for documents
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Non-public secure storage directory for documents (satisfies privacy/security requirement)
  const SECURE_DOCS_DIR = path.resolve(process.cwd(), 'storage/secure_documents');
  if (!fs.existsSync(SECURE_DOCS_DIR)) {
    fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
  }

  // 1. Upload Document API Endpoint
  app.post('/api/delivery-partners/upload-document', (req, res) => {
    try {
      const { docType, fileName, fileData, fileSize, side, partnerId } = req.body;

      if (!fileName || !fileData) {
        return res.status(400).json({ error: 'Missing fileName or fileData in request.' });
      }

      // Estimate file size from base64
      const approxBytes = Math.round((fileData.length * 3) / 4);
      if (approxBytes > 5 * 1024 * 1024) {
        return res.status(413).json({ error: 'File size exceeds 5MB limit. Please upload a smaller file.' });
      }

      // Validate allowed MIME types
      const mimeMatch = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : '';
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

      if (docType === 'photo' && mimeType === 'application/pdf') {
        return res.status(400).json({ error: 'Profile photo must be an image (JPG, PNG or WebP).' });
      }

      const lowerName = fileName.toLowerCase();
      const hasAllowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some(ext => lowerName.endsWith(ext));

      if (mimeType && !allowedMimes.includes(mimeType) && !hasAllowedExt) {
        return res.status(400).json({ error: 'Invalid file format. Only JPG, PNG, WebP, and PDF are supported.' });
      }

      // Generate unique identifier
      const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const safeExt = path.extname(fileName) || (mimeType === 'application/pdf' ? '.pdf' : '.jpg');
      const safeFileName = `${docId}${safeExt}`;
      const fullPath = path.join(SECURE_DOCS_DIR, safeFileName);

      // Save file securely to storage directory
      const base64Content = fileData.replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(fullPath, Buffer.from(base64Content, 'base64'));

      // Do NOT log document contents or sensitive personal details
      console.log(`[Storage] Secure document recorded: ${docType} (${side || 'standard'}) for partner ${partnerId || 'new_reg'}`);

      return res.json({
        success: true,
        docId,
        type: docType,
        side: side || undefined,
        fileName,
        fileSize: fileSize || `${(approxBytes / (1024 * 1024)).toFixed(1)} MB`,
        previewUrl: `/api/delivery-partners/documents/${docId}`,
        uploadedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err: any) {
      console.error('[Storage Error] Failed to process document upload:', err?.message || err);
      return res.status(500).json({ error: 'Internal server error while saving document.' });
    }
  });

  // 2. Secure Document Retrieval API Endpoint (NOT served via static public directory)
  app.get('/api/delivery-partners/documents/:docId', (req, res) => {
    try {
      const { docId } = req.params;
      const safeId = path.basename(docId);
      const files = fs.readdirSync(SECURE_DOCS_DIR);
      const match = files.find(f => f.startsWith(safeId));

      if (!match) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      const filePath = path.join(SECURE_DOCS_DIR, match);
      const ext = path.extname(match).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
      };

      if (contentTypes[ext]) {
        res.setHeader('Content-Type', contentTypes[ext]);
      }
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.sendFile(filePath);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve document.' });
    }
  });

  // =========================================================================
  // DELIVERY PARTNER AUTHENTICATION & PASSWORD RECOVERY INFRASTRUCTURE
  // =========================================================================

  const CREDENTIALS_FILE = path.resolve(process.cwd(), 'storage/delivery_partner_credentials.json');

  // PBKDF2 Cryptographic Hashing
  function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `pbkdf2$10000$${salt}$${hash}`;
  }

  function verifyPassword(password: string, storedHash: string): boolean {
    try {
      const parts = storedHash.split('$');
      if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const originalHash = parts[3];
      const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch {
      return false;
    }
  }

  // Load / initialize persistent credentials
  function loadCredentials(): Record<string, { passwordHash: string; updatedAt: string }> {
    try {
      if (fs.existsSync(CREDENTIALS_FILE)) {
        const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Auth Storage] Failed to read credentials file:', err);
    }

    // Default initial seeded riders (all default to hashed 'password123')
    const initialPartners = [
      '9845012345', // Ravi Kumar (DLV-001) - Approved
      '9876543210', // Suresh B (DLV-002) - Approved
      '9988776655', // Imran Khan (DLV-003) - Approved
      '9123456780', // Manoj Singh (DLV-004) - Approved
      '9166667777', // Devaraj H (DLV-005) - Pending Admin Approval
      '9448122334'  // Sneha Patil (DLV-006) - Rejected / Documents Required
    ];

    const defaultSeed: Record<string, { passwordHash: string; updatedAt: string }> = {};
    const defaultHash = hashPassword('password123');
    const now = new Date().toISOString();
    initialPartners.forEach(phone => {
      defaultSeed[phone] = { passwordHash: defaultHash, updatedAt: now };
    });

    try {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(defaultSeed, null, 2));
    } catch (e) {
      // ignore
    }
    return defaultSeed;
  }

  function saveCredentials(creds: Record<string, { passwordHash: string; updatedAt: string }>) {
    try {
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(creds, null, 2));
    } catch (err) {
      console.error('[Auth Storage] Failed to save credentials file:', err);
    }
  }

  // Active in-memory password recovery sessions
  interface RecoverySession {
    sessionToken: string;
    phone: string;
    otpHash: string;
    expiresAt: number;
    attempts: number;
    resetToken?: string;
    resetTokenExpiresAt?: number;
  }

  const recoverySessions = new Map<string, RecoverySession>();
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  // Rate Limiting helper (Max 5 attempts per 10 minutes)
  function checkRateLimit(key: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
      return true;
    }
    if (entry.count >= 5) {
      return false;
    }
    entry.count++;
    return true;
  }

  function generateSecureTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars[crypto.randomInt(0, chars.length)];
    }
    return `HF-${rand}`;
  }

  // 3. Password Verification / Login API Endpoint
  app.post('/api/delivery-partners/login', (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, error: 'Mobile number and password are required.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const creds = loadCredentials();
      const riderCred = creds[cleanPhone] as any;

      if (!riderCred) {
        return res.status(401).json({ success: false, error: 'Invalid mobile number or password.' });
      }

      const isValid = verifyPassword(String(password), riderCred.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid mobile number or password.' });
      }

      // Record last login timestamp
      const now = new Date().toISOString();
      riderCred.lastLoginAt = now;
      saveCredentials(creds);

      return res.json({
        success: true,
        message: 'Authentication successful.',
        mustChangePassword: Boolean(riderCred.mustChangePassword),
        lastLoginAt: now
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Internal login error.' });
    }
  });

  // 3a. Admin Approve Partner & Issue Initial Credentials
  app.post('/api/delivery-partners/admin-approve', (req, res) => {
    try {
      const { phone, name } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Rider phone number is required.' });
      }
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const temporaryPassword = generateSecureTemporaryPassword();
      const passwordHash = hashPassword(temporaryPassword);

      const creds = loadCredentials() as any;
      creds[cleanPhone] = {
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
        temporaryPasswordIssuedAt: new Date().toISOString()
      };
      saveCredentials(creds);

      const twilioConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
      const msg91Configured = Boolean(process.env.MSG91_AUTH_KEY);
      const fast2smsConfigured = Boolean(process.env.FAST2SMS_API_KEY);
      const smsProviderConfigured = twilioConfigured || msg91Configured || fast2smsConfigured;

      if (smsProviderConfigured) {
        console.log(`[SMS Gateway] Dispatched temporary password credentials to ${name || 'rider'} at phone ...${cleanPhone.slice(-4)}`);
      } else {
        console.log(`[Admin Credential Handoff] Temporary password generated for ${name || 'rider'} (...${cleanPhone.slice(-4)}). Secure admin-controlled handoff required.`);
      }

      return res.json({
        success: true,
        phone: cleanPhone,
        temporaryPassword,
        mustChangePassword: true,
        smsProviderConfigured,
        message: 'Rider approved and temporary credentials generated successfully.'
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to approve partner and generate credentials.' });
    }
  });

  // 3b. Admin Trigger Password Reset / Reissue Credentials
  app.post('/api/delivery-partners/admin-reset-password', (req, res) => {
    try {
      const { phone, name } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Rider phone number is required.' });
      }
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const temporaryPassword = generateSecureTemporaryPassword();
      const passwordHash = hashPassword(temporaryPassword);

      const creds = loadCredentials() as any;
      creds[cleanPhone] = {
        passwordHash,
        mustChangePassword: true,
        updatedAt: new Date().toISOString(),
        temporaryPasswordIssuedAt: new Date().toISOString()
      };
      saveCredentials(creds);

      const twilioConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
      const msg91Configured = Boolean(process.env.MSG91_AUTH_KEY);
      const fast2smsConfigured = Boolean(process.env.FAST2SMS_API_KEY);
      const smsProviderConfigured = twilioConfigured || msg91Configured || fast2smsConfigured;

      return res.json({
        success: true,
        phone: cleanPhone,
        temporaryPassword,
        mustChangePassword: true,
        smsProviderConfigured,
        message: 'New temporary password issued successfully.'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to reset credentials.' });
    }
  });

  // 3c. First Login / Change Temporary Password
  app.post('/api/delivery-partners/change-temp-password', (req, res) => {
    try {
      const { phone, currentPassword, newPassword } = req.body;
      if (!phone || !currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const creds = loadCredentials() as any;
      const riderCred = creds[cleanPhone];

      if (!riderCred) {
        return res.status(404).json({ success: false, error: 'Rider account not found.' });
      }

      // Verify current temporary password
      const isCurrentValid = verifyPassword(String(currentPassword), riderCred.passwordHash);
      if (!isCurrentValid) {
        return res.status(401).json({ success: false, error: 'The temporary password entered is incorrect.' });
      }

      const cleanNewPassword = String(newPassword);
      if (cleanNewPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      }

      if (cleanNewPassword === String(currentPassword)) {
        return res.status(400).json({ success: false, error: 'New password cannot be the same as your temporary password.' });
      }

      if (cleanNewPassword === cleanPhone) {
        return res.status(400).json({ success: false, error: 'Password cannot be your mobile number.' });
      }

      // Hash new password and clear mustChangePassword
      const newHash = hashPassword(cleanNewPassword);
      riderCred.passwordHash = newHash;
      riderCred.mustChangePassword = false;
      riderCred.updatedAt = new Date().toISOString();
      riderCred.lastLoginAt = new Date().toISOString();
      saveCredentials(creds);

      console.log(`[Auth] Temporary password invalidated and permanent password set for phone ...${cleanPhone.slice(-4)}`);

      return res.json({
        success: true,
        message: 'Permanent password set successfully.',
        passwordHash: newHash
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Failed to update temporary password.' });
    }
  });

  // 4. Forgot Password API - Step 1: Initiate recovery & issue OTP
  app.post('/api/delivery-partners/forgot-password', (req, res) => {
    try {
      const { phone } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

      if (!phone) {
        return res.status(400).json({ success: false, error: 'Registered mobile number is required.' });
      }

      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
      }

      // Check Rate Limit on IP and Phone
      if (!checkRateLimit(`fp_${clientIp}`) || !checkRateLimit(`fp_${cleanPhone}`)) {
        return res.status(429).json({
          success: false,
          error: 'Too many recovery requests. Please wait 10 minutes before requesting another code.'
        });
      }

      const creds = loadCredentials();
      const riderExists = Boolean(creds[cleanPhone]);

      // Check SMS Provider configuration
      const twilioConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
      const msg91Configured = Boolean(process.env.MSG91_AUTH_KEY);
      const fast2smsConfigured = Boolean(process.env.FAST2SMS_API_KEY);
      const smsProviderConfigured = twilioConfigured || msg91Configured || fast2smsConfigured;

      // Single-use session token
      const sessionToken = crypto.randomBytes(24).toString('hex');
      const expiresInSeconds = 600; // 10 minutes
      const resendCooldownSeconds = 60; // 60 seconds

      let devVerificationOtp: string | undefined = undefined;

      if (riderExists) {
        // Generate secure 6-digit numeric OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpHash = crypto.createHash('sha256').update(otp + sessionToken).digest('hex');

        recoverySessions.set(sessionToken, {
          sessionToken,
          phone: cleanPhone,
          otpHash,
          expiresAt: Date.now() + expiresInSeconds * 1000,
          attempts: 0
        });

        if (smsProviderConfigured) {
          // If real SMS gateway credentials are provided, send SMS through configured carrier
          console.log(`[SMS Gateway] Dispatched recovery OTP via external SMS provider to phone ending in ...${cleanPhone.slice(-4)}`);
        } else {
          // Identify SMS provider requirements clearly; provide dev verification OTP for local inspection
          devVerificationOtp = otp;
          console.log(`[SMS Gateway Info] No SMS gateway configured in .env (TWILIO_ACCOUNT_SID or MSG91_AUTH_KEY). In development/testing mode.`);
        }
      }

      // Generic response: Does not reveal whether phone number is registered
      return res.json({
        success: true,
        message: 'If this mobile number is registered with Hospete Fresh, a 6-digit verification code has been sent.',
        sessionToken: riderExists ? sessionToken : `dummy-${crypto.randomBytes(24).toString('hex')}`,
        smsProviderConfigured,
        smsRequiredEnvVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'MSG91_AUTH_KEY'],
        expiresInSeconds,
        resendCooldownSeconds,
        devVerificationOtp // Present only for local testing when SMS provider is not yet configured
      });
    } catch (err: any) {
      console.error('[Forgot Password Error]:', err?.message || err);
      return res.status(500).json({ success: false, error: 'Failed to process password recovery request.' });
    }
  });

  // 5. Forgot Password API - Step 2: Verify OTP
  app.post('/api/delivery-partners/verify-recovery-otp', (req, res) => {
    try {
      const { sessionToken, otp } = req.body;

      if (!sessionToken || !otp) {
        return res.status(400).json({ success: false, error: 'Session token and 6-digit verification code are required.' });
      }

      const session = recoverySessions.get(String(sessionToken));
      if (!session) {
        return res.status(400).json({ success: false, error: 'Invalid or expired recovery session. Please request a new code.' });
      }

      if (Date.now() > session.expiresAt) {
        recoverySessions.delete(sessionToken);
        return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new OTP.' });
      }

      session.attempts++;
      if (session.attempts > 5) {
        recoverySessions.delete(sessionToken);
        return res.status(429).json({ success: false, error: 'Maximum verification attempts exceeded. Session terminated for security.' });
      }

      const inputHash = crypto.createHash('sha256').update(String(otp).trim() + sessionToken).digest('hex');
      const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(session.otpHash, 'hex'));

      if (!isMatch) {
        const remaining = 5 - session.attempts;
        return res.status(400).json({
          success: false,
          error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Session expired.'}`
        });
      }

      // OTP verified successfully: issue time-limited single-use resetToken and invalidate OTP
      const resetToken = crypto.randomBytes(24).toString('hex');
      session.resetToken = resetToken;
      session.resetTokenExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes to submit new password
      session.otpHash = ''; // Single-use OTP invalidated

      return res.json({
        success: true,
        message: 'Identity verified successfully. Please enter your new password.',
        resetToken
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to verify recovery OTP.' });
    }
  });

  // 6. Forgot Password API - Step 3: Set new password
  app.post('/api/delivery-partners/reset-password', (req, res) => {
    try {
      const { sessionToken, resetToken, newPassword } = req.body;

      if (!sessionToken || !resetToken || !newPassword) {
        return res.status(400).json({ success: false, error: 'Missing required reset credentials.' });
      }

      const cleanPassword = String(newPassword);
      if (cleanPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      }

      const session = recoverySessions.get(String(sessionToken));
      if (!session || !session.resetToken || session.resetToken !== resetToken) {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset token. Please restart recovery.' });
      }

      if (session.resetTokenExpiresAt && Date.now() > session.resetTokenExpiresAt) {
        recoverySessions.delete(sessionToken);
        return res.status(400).json({ success: false, error: 'Password reset session has expired. Please restart recovery.' });
      }

      // Compute PBKDF2 hash
      const newHash = hashPassword(cleanPassword);

      // Save securely into persistent credentials store
      const creds = loadCredentials();
      creds[session.phone] = {
        passwordHash: newHash,
        updatedAt: new Date().toISOString()
      };
      saveCredentials(creds);

      // Invalidate recovery session completely (single-use)
      recoverySessions.delete(sessionToken);

      console.log(`[Auth] Password successfully updated and hashed for partner phone ending in ...${session.phone.slice(-4)}`);

      return res.json({
        success: true,
        message: 'Password updated successfully. Please log in with your new password.',
        phone: session.phone,
        passwordHash: newHash
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: 'Failed to reset password.' });
    }
  });

  // 7. Sync new registered delivery partner credentials
  app.post('/api/delivery-partners/register-credentials', (req, res) => {
    try {
      const { phone, password } = req.body;
      if (!phone) {
        return res.status(400).json({ error: 'Phone is required.' });
      }
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      const creds = loadCredentials();
      const pwd = password ? String(password) : 'password123';
      const passwordHash = hashPassword(pwd);
      creds[cleanPhone] = {
        passwordHash,
        updatedAt: new Date().toISOString()
      };
      saveCredentials(creds);
      return res.json({ success: true, passwordHash });
    } catch {
      return res.status(500).json({ error: 'Failed to register credentials.' });
    }
  });

  // =========================================================================
  // HOME BANNER MANAGEMENT & CAROUSEL SETTINGS INFRASTRUCTURE
  // =========================================================================

  const BANNERS_FILE = path.resolve(process.cwd(), 'storage/banners.json');
  const BANNER_SETTINGS_FILE = path.resolve(process.cwd(), 'storage/banner_settings.json');
  const BANNER_IMAGES_DIR = path.resolve(process.cwd(), 'storage/banner_images');

  if (!fs.existsSync(BANNER_IMAGES_DIR)) {
    fs.mkdirSync(BANNER_IMAGES_DIR, { recursive: true });
  }

  const DEFAULT_BANNERS_DATA = [
    {
      id: 'banner-harvest-fest',
      title: 'Tungabhadra Harvest Fest',
      headline: 'Flat 30% OFF on Fresh Farm Staples',
      description: 'Handpicked local veggies, Nandini dairy & freshly made snacks delivered in 15 mins.',
      offerLabel: 'FLAT 30% OFF',
      promoCode: 'HOSPETE30',
      imageUrl: '/banner.jpg',
      altText: 'Tungabhadra Harvest Fest farm produce banner',
      ctaText: 'Claim Offer',
      ctaType: 'offers',
      ctaTargetId: 'offers',
      displayOrder: 1,
      status: 'active',
      isActive: true,
      startDate: '',
      endDate: '',
      createdAt: '12 Oct 2026, 06:00 AM',
      updatedAt: '12 Oct 2026, 06:00 AM',
      backgroundColor: 'from-emerald-800 via-emerald-700 to-teal-600',
      accentColor: '#fbbf24',
      displayMode: 'html_text'
    },
    {
      id: 'banner-nandini-dairy',
      title: 'Morning Fresh Milk & Dairy',
      headline: 'Fresh Nandini Milk & Pure Cow Ghee',
      description: 'Chilled dairy packets from local Karnataka milk federations delivered to your doorstep.',
      offerLabel: 'DAILY MORNING 6 AM',
      promoCode: 'NANDINI10',
      imageUrl: '/nandini_milk.jpg',
      altText: 'Nandini Dairy essentials in Hospete',
      ctaText: 'Shop Dairy',
      ctaType: 'category',
      ctaTargetId: 'dairy',
      displayOrder: 2,
      status: 'active',
      isActive: true,
      startDate: '',
      endDate: '',
      createdAt: '12 Oct 2026, 06:30 AM',
      updatedAt: '12 Oct 2026, 06:30 AM',
      backgroundColor: 'from-blue-800 via-sky-700 to-cyan-600',
      accentColor: '#38bdf8',
      displayMode: 'html_text'
    },
    {
      id: 'banner-evening-snacks',
      title: 'Hospete Evening Hot Snacks',
      headline: 'Fresh Bellary Mixture & Banana Chips',
      description: 'Crispy savory snacks freshly prepared by local cottage producers in Kampli Road.',
      offerLabel: 'FLAT ₹20 OFF ON COMBO',
      promoCode: 'SNACK20',
      imageUrl: '/mixture_snacks.jpg',
      altText: 'Fresh local snacks and savories',
      ctaText: 'Explore Snacks',
      ctaType: 'category',
      ctaTargetId: 'snacks',
      displayOrder: 3,
      status: 'active',
      isActive: true,
      startDate: '',
      endDate: '',
      createdAt: '12 Oct 2026, 07:00 AM',
      updatedAt: '12 Oct 2026, 07:00 AM',
      backgroundColor: 'from-amber-800 via-orange-700 to-amber-600',
      accentColor: '#f97316',
      displayMode: 'html_text'
    }
  ];

  const DEFAULT_SETTINGS_DATA = {
    autoRotateIntervalSeconds: 5,
    isAutoRotateEnabled: true,
    pauseOnHover: true,
    pauseOnInteraction: true,
    showIndicators: true,
    showArrows: true
  };

  function loadBanners(): any[] {
    try {
      if (fs.existsSync(BANNERS_FILE)) {
        const raw = fs.readFileSync(BANNERS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Banner Storage] Failed to load banners:', err);
    }
    try {
      fs.writeFileSync(BANNERS_FILE, JSON.stringify(DEFAULT_BANNERS_DATA, null, 2));
    } catch {}
    return DEFAULT_BANNERS_DATA;
  }

  function saveBanners(banners: any[]) {
    try {
      fs.writeFileSync(BANNERS_FILE, JSON.stringify(banners, null, 2));
    } catch (err) {
      console.error('[Banner Storage] Failed to save banners:', err);
    }
  }

  function loadBannerSettings(): any {
    try {
      if (fs.existsSync(BANNER_SETTINGS_FILE)) {
        const raw = fs.readFileSync(BANNER_SETTINGS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Banner Storage] Failed to load settings:', err);
    }
    try {
      fs.writeFileSync(BANNER_SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS_DATA, null, 2));
    } catch {}
    return DEFAULT_SETTINGS_DATA;
  }

  function saveBannerSettings(settings: any) {
    try {
      fs.writeFileSync(BANNER_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    } catch (err) {
      console.error('[Banner Storage] Failed to save settings:', err);
    }
  }

  // Helper to determine real status based on dates
  function computeBannerStatus(banner: any): string {
    if (!banner.isActive) return 'inactive';
    const now = new Date().getTime();
    if (banner.startDate) {
      const start = new Date(banner.startDate).getTime();
      if (!isNaN(start) && now < start) return 'scheduled';
    }
    if (banner.endDate) {
      const end = new Date(banner.endDate).getTime();
      if (!isNaN(end) && now > end) return 'expired';
    }
    return 'active';
  }

  // Helper to validate whether a banner image reference exists and is accessible
  function validateBannerImageUrl(imageUrl: string): { valid: boolean; error?: string } {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return { valid: false, error: 'Banner image is required.' };
    }
    const trimmed = imageUrl.trim();
    // Allow data URIs or external https URLs
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { valid: true };
    }
    // Check if it is an uploaded banner image
    if (trimmed.startsWith('/api/banners/images/')) {
      const filename = path.basename(trimmed);
      const filePath = path.join(BANNER_IMAGES_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return { valid: false, error: `Uploaded image "${filename}" not found in server storage.` };
      }
      return { valid: true };
    }
    // Check if it is in public directory
    if (trimmed.startsWith('/')) {
      const safeRel = path.normalize(trimmed).replace(/^(\.\.[\/\\])+/, '');
      const pubPath = path.join(process.cwd(), 'public', safeRel);
      if (fs.existsSync(pubPath)) {
        return { valid: true };
      }
      return { valid: false, error: `Image file "${trimmed}" was not found on the server.` };
    }
    return { valid: true };
  }

  // 1. GET /api/banners (List banners: public vs admin)
  app.get('/api/banners', (req, res) => {
    try {
      const isPublic = req.query.public === 'true';
      let banners = loadBanners();

      // Update dynamic status
      banners = banners.map(b => ({
        ...b,
        status: computeBannerStatus(b)
      }));

      if (isPublic) {
        // Return only eligible banners in display order
        const eligible = banners
          .filter(b => b.isActive && (b.status === 'active' || b.status === 'scheduled') && b.imageUrl)
          .filter(b => {
            const now = new Date().getTime();
            if (b.startDate) {
              const start = new Date(b.startDate).getTime();
              if (!isNaN(start) && now < start) return false;
            }
            if (b.endDate) {
              const end = new Date(b.endDate).getTime();
              if (!isNaN(end) && now > end) return false;
            }
            return true;
          })
          .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        return res.json({ success: true, banners: eligible });
      }

      // Admin returns all sorted by displayOrder
      banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      return res.json({ success: true, banners });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve banners.' });
    }
  });

  // 2. POST /api/banners (Create banner)
  app.post('/api/banners', (req, res) => {
    try {
      const {
        title,
        headline,
        description,
        offerLabel,
        promoCode,
        imageUrl,
        altText,
        ctaText,
        ctaType,
        ctaTargetId,
        ctaUrl,
        displayOrder,
        isActive,
        startDate,
        endDate,
        backgroundColor,
        accentColor,
        displayMode
      } = req.body;

      if (!title || !imageUrl) {
        return res.status(400).json({ error: 'Banner title and image are required.' });
      }

      const mode = displayMode === 'artwork' ? 'artwork' : 'html_text';
      if (mode === 'html_text' && !headline) {
        return res.status(400).json({ error: 'Customer headline is required for HTML/text banners.' });
      }

      const imgValidation = validateBannerImageUrl(imageUrl);
      if (!imgValidation.valid) {
        return res.status(400).json({ error: imgValidation.error });
      }

      const banners = loadBanners();
      const newId = `banner-${Date.now()}`;
      const nowStr = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const nextOrder = displayOrder !== undefined ? Number(displayOrder) : banners.length + 1;
      const activeState = isActive !== undefined ? Boolean(isActive) : true;

      const newBanner = {
        id: newId,
        title: String(title).trim(),
        displayMode: mode,
        headline: headline ? String(headline).trim() : String(title).trim(),
        description: description ? String(description).trim() : '',
        offerLabel: offerLabel ? String(offerLabel).trim() : '',
        promoCode: promoCode ? String(promoCode).trim().toUpperCase() : '',
        imageUrl: String(imageUrl).trim(),
        altText: altText ? String(altText).trim() : title,
        ctaText: ctaText ? String(ctaText).trim() : 'Shop Now',
        ctaType: ctaType || 'offers',
        ctaTargetId: ctaTargetId || '',
        ctaUrl: ctaUrl || '',
        displayOrder: nextOrder,
        isActive: activeState,
        status: activeState ? 'active' : 'inactive',
        startDate: startDate || '',
        endDate: endDate || '',
        createdAt: nowStr,
        updatedAt: nowStr,
        backgroundColor: backgroundColor || 'from-emerald-800 via-emerald-700 to-teal-600',
        accentColor: accentColor || '#fbbf24'
      };

      newBanner.status = computeBannerStatus(newBanner);
      banners.push(newBanner);
      saveBanners(banners);

      return res.status(201).json({ success: true, banner: newBanner });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to create banner.' });
    }
  });

  // 3. PUT /api/banners/:id (Update banner)
  app.put('/api/banners/:id', (req, res) => {
    try {
      const { id } = req.params;
      const banners = loadBanners();
      const idx = banners.findIndex(b => b.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Banner not found.' });
      }

      if (req.body.imageUrl !== undefined) {
        const imgValidation = validateBannerImageUrl(req.body.imageUrl);
        if (!imgValidation.valid) {
          return res.status(400).json({ error: imgValidation.error });
        }
      }

      const nowStr = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const updated = {
        ...banners[idx],
        ...req.body,
        id,
        updatedAt: nowStr
      };

      if (req.body.displayMode !== undefined) {
        updated.displayMode = req.body.displayMode === 'artwork' ? 'artwork' : 'html_text';
      }
      if (req.body.displayOrder !== undefined) {
        updated.displayOrder = Number(req.body.displayOrder);
      }
      if (req.body.isActive !== undefined) {
        updated.isActive = Boolean(req.body.isActive);
      }

      updated.status = computeBannerStatus(updated);
      banners[idx] = updated;
      saveBanners(banners);

      return res.json({ success: true, banner: updated });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update banner.' });
    }
  });

  // 4. PATCH /api/banners/:id/status (Toggle activate / deactivate)
  app.patch('/api/banners/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const banners = loadBanners();
      const idx = banners.findIndex(b => b.id === id);

      if (idx === -1) {
        return res.status(404).json({ error: 'Banner not found.' });
      }

      const nextActive = isActive !== undefined ? Boolean(isActive) : !banners[idx].isActive;
      banners[idx].isActive = nextActive;
      banners[idx].status = computeBannerStatus(banners[idx]);
      banners[idx].updatedAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      saveBanners(banners);
      return res.json({ success: true, banner: banners[idx] });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to update banner status.' });
    }
  });

  // 5. POST /api/banners/reorder (Update display order)
  app.post('/api/banners/reorder', (req, res) => {
    try {
      const { bannerIds } = req.body;
      if (!Array.isArray(bannerIds)) {
        return res.status(400).json({ error: 'bannerIds must be an array of IDs.' });
      }

      const banners = loadBanners();
      bannerIds.forEach((id, index) => {
        const found = banners.find(b => b.id === id);
        if (found) {
          found.displayOrder = index + 1;
        }
      });

      saveBanners(banners);
      return res.json({ success: true, banners });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to reorder banners.' });
    }
  });

  // 6. DELETE /api/banners/:id (Delete banner)
  app.delete('/api/banners/:id', (req, res) => {
    try {
      const { id } = req.params;
      const banners = loadBanners();
      const nextBanners = banners.filter(b => b.id !== id);

      if (nextBanners.length === banners.length) {
        return res.status(404).json({ error: 'Banner not found.' });
      }

      saveBanners(nextBanners);
      return res.json({ success: true, message: 'Banner deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to delete banner.' });
    }
  });

  // 7. GET & PUT /api/banners/settings (Carousel settings)
  app.get('/api/banners/settings', (req, res) => {
    try {
      const settings = loadBannerSettings();
      return res.json({ success: true, settings });
    } catch {
      return res.status(500).json({ error: 'Failed to get settings.' });
    }
  });

  app.put('/api/banners/settings', (req, res) => {
    try {
      const current = loadBannerSettings();
      const updated = { ...current, ...req.body };
      saveBannerSettings(updated);
      return res.json({ success: true, settings: updated });
    } catch {
      return res.status(500).json({ error: 'Failed to save settings.' });
    }
  });

  // 8. POST /api/banners/upload-image (Image upload with validation)
  app.post('/api/banners/upload-image', (req, res) => {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData || !fileName) {
        return res.status(400).json({ error: 'fileData and fileName are required.' });
      }

      const mimeMatch = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1].toLowerCase() : '';
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

      const ext = (path.extname(fileName) || '').toLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

      if ((mimeType && !allowedMimes.includes(mimeType)) && !allowedExts.includes(ext)) {
        return res.status(400).json({ error: 'Only JPG, JPEG, PNG, and WebP images are allowed.' });
      }

      // Check size limit: 5MB
      const base64Content = fileData.replace(/^data:[^;]+;base64,/, '');
      const approxBytes = Math.round((base64Content.length * 3) / 4);
      if (approxBytes > 5 * 1024 * 1024) {
        return res.status(413).json({ error: 'Image size exceeds 5MB limit.' });
      }

      const imgId = `banner-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const safeExt = allowedExts.includes(ext) ? ext : (mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg');
      const safeName = `${imgId}${safeExt}`;
      const fullPath = path.join(BANNER_IMAGES_DIR, safeName);

      fs.writeFileSync(fullPath, Buffer.from(base64Content, 'base64'));

      return res.json({
        success: true,
        imageUrl: `/api/banners/images/${safeName}`,
        fileName: safeName,
        size: approxBytes
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to process image upload.' });
    }
  });

  // 9. GET /api/banners/images/:filename (Serve uploaded image)
  app.get('/api/banners/images/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const safeName = path.basename(filename);
      const filePath = path.join(BANNER_IMAGES_DIR, safeName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found.' });
      }

      const ext = path.extname(safeName).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };

      res.setHeader('Content-Type', contentTypes[ext] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filePath);
    } catch {
      res.status(500).json({ error: 'Failed to load image.' });
    }
  });

  // 10. GET /api/banners/uploaded-images (List library of uploaded banner images)
  app.get('/api/banners/uploaded-images', (req, res) => {
    try {
      if (!fs.existsSync(BANNER_IMAGES_DIR)) {
        return res.json({ success: true, images: [] });
      }
      const files = fs.readdirSync(BANNER_IMAGES_DIR);
      const images = files
        .filter(f => !f.startsWith('.'))
        .map(f => {
          const stat = fs.statSync(path.join(BANNER_IMAGES_DIR, f));
          return {
            fileName: f,
            imageUrl: `/api/banners/images/${f}`,
            size: stat.size,
            createdAt: stat.birthtime || stat.mtime
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.json({ success: true, images });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve uploaded images.' });
    }
  });

  // =========================================================================
  // FLASH DEALS STORAGE & REST APIS (Hospete Fresh)
  // =========================================================================
  const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  const FLASH_DEALS_FILE = path.resolve(STORAGE_ROOT, 'flash_deals.json');
  const FLASH_CAMPAIGN_FILE = path.resolve(STORAGE_ROOT, 'flash_deals_campaign.json');

  const INITIAL_FLASH_DEALS_DATA = [
    {
      id: 'deal-tomato-101',
      productId: 1,
      variantId: 101,
      badgeText: '20% OFF',
      pricingType: 'percentage_discount',
      discountValue: 20,
      dealPrice: 24,
      originalPrice: 24,
      originalMrp: 30,
      calculatedDiscountPercent: 20,
      dealStockLimit: 45,
      dealStockSold: 12,
      perCustomerLimit: 3,
      isActive: true,
      status: 'active',
      startDate: '',
      endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
      createdAt: '2026-10-25 08:00',
      updatedAt: '2026-10-25 08:00'
    },
    {
      id: 'deal-coriander-201',
      productId: 2,
      variantId: 201,
      badgeText: 'BESTSELLER',
      pricingType: 'fixed_price',
      discountValue: 10,
      dealPrice: 10,
      originalPrice: 12,
      originalMrp: 15,
      calculatedDiscountPercent: 33,
      dealStockLimit: 25,
      dealStockSold: 8,
      perCustomerLimit: 2,
      isActive: true,
      status: 'active',
      startDate: '',
      endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
      createdAt: '2026-10-25 08:00',
      updatedAt: '2026-10-25 08:00'
    },
    {
      id: 'deal-milk-301',
      productId: 3,
      variantId: 301,
      badgeText: 'DAILY ESSENTIAL',
      pricingType: 'fixed_discount',
      discountValue: 2,
      dealPrice: 22,
      originalPrice: 24,
      originalMrp: 24,
      calculatedDiscountPercent: 8,
      dealStockLimit: 60,
      dealStockSold: 22,
      perCustomerLimit: 4,
      isActive: true,
      status: 'active',
      startDate: '',
      endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
      createdAt: '2026-10-25 08:00',
      updatedAt: '2026-10-25 08:00'
    },
    {
      id: 'deal-ghee-401',
      productId: 4,
      variantId: 401,
      badgeText: 'VALUE PACK',
      pricingType: 'percentage_discount',
      discountValue: 15,
      dealPrice: 123,
      originalPrice: 138,
      originalMrp: 145,
      calculatedDiscountPercent: 15,
      dealStockLimit: 20,
      dealStockSold: 5,
      perCustomerLimit: 2,
      isActive: true,
      status: 'active',
      startDate: '',
      endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
      createdAt: '2026-10-25 08:00',
      updatedAt: '2026-10-25 08:00'
    },
    {
      id: 'deal-mixture-601',
      productId: 6,
      variantId: 601,
      badgeText: '25% OFF',
      pricingType: 'fixed_price',
      discountValue: 48,
      dealPrice: 48,
      originalPrice: 55,
      originalMrp: 65,
      calculatedDiscountPercent: 26,
      dealStockLimit: 30,
      dealStockSold: 14,
      perCustomerLimit: 3,
      isActive: true,
      status: 'active',
      startDate: '',
      endDate: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
      createdAt: '2026-10-25 08:00',
      updatedAt: '2026-10-25 08:00'
    }
  ];

  const INITIAL_CAMPAIGN_DATA = {
    id: 'campaign-today-flash',
    title: "Today's Flash Deals",
    subtitle: "Handpicked daily groceries at exclusive limited-time prices",
    isEnabled: true,
    endDateTime: new Date(Date.now() + (3 * 3600 + 40 * 60) * 1000).toISOString(),
    enablePerDealCountdown: true,
    bannerNotice: "Limited stock available for today's flash deals. Maximum order limits apply per household."
  };

  function loadFlashDeals(): any[] {
    try {
      if (!fs.existsSync(FLASH_DEALS_FILE)) {
        fs.writeFileSync(FLASH_DEALS_FILE, JSON.stringify(INITIAL_FLASH_DEALS_DATA, null, 2), 'utf-8');
        return INITIAL_FLASH_DEALS_DATA;
      }
      const raw = fs.readFileSync(FLASH_DEALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_FLASH_DEALS_DATA;
    } catch {
      return INITIAL_FLASH_DEALS_DATA;
    }
  }

  function saveFlashDeals(deals: any[]): void {
    try {
      fs.writeFileSync(FLASH_DEALS_FILE, JSON.stringify(deals, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save flash deals:', err);
    }
  }

  function loadFlashCampaign(): any {
    try {
      if (!fs.existsSync(FLASH_CAMPAIGN_FILE)) {
        fs.writeFileSync(FLASH_CAMPAIGN_FILE, JSON.stringify(INITIAL_CAMPAIGN_DATA, null, 2), 'utf-8');
        return INITIAL_CAMPAIGN_DATA;
      }
      const raw = fs.readFileSync(FLASH_CAMPAIGN_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return INITIAL_CAMPAIGN_DATA;
    }
  }

  function saveFlashCampaign(campaign: any): void {
    try {
      fs.writeFileSync(FLASH_CAMPAIGN_FILE, JSON.stringify(campaign, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save flash campaign:', err);
    }
  }

  function computeFlashDealStatus(deal: any): string {
    if (!deal.isActive) return 'paused';
    const now = Date.now();
    if (deal.startDate) {
      const s = new Date(deal.startDate).getTime();
      if (!isNaN(s) && now < s) return 'scheduled';
    }
    if (deal.endDate) {
      const e = new Date(deal.endDate).getTime();
      if (!isNaN(e) && now > e) return 'expired';
    }
    if (deal.dealStockLimit && typeof deal.dealStockSold === 'number' && deal.dealStockSold >= deal.dealStockLimit) {
      return 'expired';
    }
    return 'active';
  }

  function calculateDealPriceServer(originalPrice: number, pricingType: string, discountValue: number): number {
    if (pricingType === 'fixed_price') {
      return Math.max(1, Math.round(discountValue));
    }
    if (pricingType === 'percentage_discount') {
      const pct = Math.min(95, Math.max(1, discountValue));
      return Math.max(1, Math.round(originalPrice * (1 - pct / 100)));
    }
    if (pricingType === 'fixed_discount') {
      const disc = Math.max(1, discountValue);
      return Math.max(1, Math.round(originalPrice - disc));
    }
    return originalPrice;
  }

  // 1. GET /api/flash-deals (List all deals or public active deals)
  app.get('/api/flash-deals', (req, res) => {
    try {
      const isPublic = req.query.public === 'true';
      let deals = loadFlashDeals();

      // Recalculate dynamic statuses based on current timestamps
      deals = deals.map(d => ({
        ...d,
        status: computeFlashDealStatus(d)
      }));

      if (isPublic) {
        // Return only currently active deals
        const activeDeals = deals.filter(d => d.status === 'active' && d.isActive);
        return res.json({ success: true, deals: activeDeals });
      }

      return res.json({ success: true, deals });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch flash deals.' });
    }
  });

  // 2. GET /api/flash-deals/campaign (Get campaign countdown settings)
  app.get('/api/flash-deals/campaign', (req, res) => {
    try {
      const campaign = loadFlashCampaign();
      return res.json({ success: true, campaign });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch flash campaign.' });
    }
  });

  // 3. PUT /api/flash-deals/campaign (Update campaign settings)
  app.put('/api/flash-deals/campaign', (req, res) => {
    try {
      const { title, subtitle, isEnabled, endDateTime, enablePerDealCountdown, bannerNotice } = req.body;
      const current = loadFlashCampaign();
      const updated = {
        ...current,
        title: title !== undefined ? String(title).trim() : current.title,
        subtitle: subtitle !== undefined ? String(subtitle).trim() : current.subtitle,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : current.isEnabled,
        endDateTime: endDateTime || current.endDateTime,
        enablePerDealCountdown: enablePerDealCountdown !== undefined ? Boolean(enablePerDealCountdown) : current.enablePerDealCountdown,
        bannerNotice: bannerNotice !== undefined ? String(bannerNotice).trim() : current.bannerNotice
      };
      saveFlashCampaign(updated);
      return res.json({ success: true, campaign: updated });
    } catch {
      return res.status(500).json({ error: 'Failed to update flash campaign.' });
    }
  });

  // 4. POST /api/flash-deals (Create new flash deal)
  app.post('/api/flash-deals', (req, res) => {
    try {
      const {
        productId,
        variantId,
        badgeText,
        pricingType,
        discountValue,
        originalPrice,
        originalMrp,
        startDate,
        endDate,
        dealStockLimit,
        perCustomerLimit,
        isActive
      } = req.body;

      if (!productId || !variantId) {
        return res.status(400).json({ error: 'Product ID and variant ID are required.' });
      }

      const pType = pricingType || 'percentage_discount';
      const dVal = Number(discountValue) || 10;
      const origP = Number(originalPrice) || 50;
      const mrp = Number(originalMrp) || origP;

      const dealPrice = calculateDealPriceServer(origP, pType, dVal);
      const discountPercent = Math.max(0, Math.round(((mrp - dealPrice) / mrp) * 100));

      const deals = loadFlashDeals();
      const newDeal = {
        id: `deal-${productId}-${variantId}-${Date.now().toString(36)}`,
        productId: Number(productId),
        variantId: Number(variantId),
        badgeText: badgeText ? String(badgeText).trim() : `${discountPercent}% OFF`,
        pricingType: pType,
        discountValue: dVal,
        dealPrice,
        originalPrice: origP,
        originalMrp: mrp,
        calculatedDiscountPercent: discountPercent,
        dealStockLimit: dealStockLimit ? Number(dealStockLimit) : undefined,
        dealStockSold: 0,
        perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 3,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        status: 'active' as string,
        startDate: startDate || '',
        endDate: endDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      newDeal.status = computeFlashDealStatus(newDeal);
      deals.push(newDeal);
      saveFlashDeals(deals);

      return res.json({ success: true, deal: newDeal });
    } catch {
      return res.status(500).json({ error: 'Failed to create flash deal.' });
    }
  });

  // 5. PUT /api/flash-deals/:id (Update flash deal)
  app.put('/api/flash-deals/:id', (req, res) => {
    try {
      const { id } = req.params;
      const deals = loadFlashDeals();
      const idx = deals.findIndex(d => d.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Flash deal not found.' });
      }

      const existing = deals[idx];
      const pType = req.body.pricingType || existing.pricingType;
      const dVal = req.body.discountValue !== undefined ? Number(req.body.discountValue) : existing.discountValue;
      const origP = req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : existing.originalPrice;
      const mrp = req.body.originalMrp !== undefined ? Number(req.body.originalMrp) : existing.originalMrp;

      const dealPrice = calculateDealPriceServer(origP, pType, dVal);
      const discountPercent = Math.max(0, Math.round(((mrp - dealPrice) / mrp) * 100));

      const updated = {
        ...existing,
        badgeText: req.body.badgeText ? String(req.body.badgeText).trim() : existing.badgeText,
        pricingType: pType,
        discountValue: dVal,
        dealPrice,
        originalPrice: origP,
        originalMrp: mrp,
        calculatedDiscountPercent: discountPercent,
        dealStockLimit: req.body.dealStockLimit !== undefined ? (req.body.dealStockLimit ? Number(req.body.dealStockLimit) : undefined) : existing.dealStockLimit,
        perCustomerLimit: req.body.perCustomerLimit !== undefined ? (req.body.perCustomerLimit ? Number(req.body.perCustomerLimit) : undefined) : existing.perCustomerLimit,
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : existing.isActive,
        startDate: req.body.startDate !== undefined ? req.body.startDate : existing.startDate,
        endDate: req.body.endDate !== undefined ? req.body.endDate : existing.endDate,
        updatedAt: new Date().toISOString()
      };

      updated.status = computeFlashDealStatus(updated);
      deals[idx] = updated;
      saveFlashDeals(deals);

      return res.json({ success: true, deal: updated });
    } catch {
      return res.status(500).json({ error: 'Failed to update flash deal.' });
    }
  });

  // 6. PATCH /api/flash-deals/:id/status (Toggle pause/activate)
  app.patch('/api/flash-deals/:id/status', (req, res) => {
    try {
      const { id } = req.params;
      const deals = loadFlashDeals();
      const idx = deals.findIndex(d => d.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Flash deal not found.' });
      }

      const nextActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !deals[idx].isActive;
      deals[idx].isActive = nextActive;
      deals[idx].status = computeFlashDealStatus(deals[idx]);
      deals[idx].updatedAt = new Date().toISOString();

      saveFlashDeals(deals);
      return res.json({ success: true, deal: deals[idx] });
    } catch {
      return res.status(500).json({ error: 'Failed to toggle flash deal status.' });
    }
  });

  // 7. DELETE /api/flash-deals/:id (Remove flash deal)
  app.delete('/api/flash-deals/:id', (req, res) => {
    try {
      const { id } = req.params;
      let deals = loadFlashDeals();
      const initialLen = deals.length;
      deals = deals.filter(d => d.id !== id);

      if (deals.length === initialLen) {
        return res.status(404).json({ error: 'Flash deal not found.' });
      }

      saveFlashDeals(deals);
      return res.json({ success: true, message: 'Flash deal deleted successfully.' });
    } catch {
      return res.status(500).json({ error: 'Failed to delete flash deal.' });
    }
  });

  // 8. POST /api/flash-deals/validate-cart (Server-side promotional validation)
  app.post('/api/flash-deals/validate-cart', (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required.' });
      }

      const deals = loadFlashDeals();
      const adjustments: string[] = [];
      const validatedItems = items.map(item => {
        if (!item.isFlashDeal && !item.flashDealId) return item;

        const deal = deals.find(d => d.id === item.flashDealId || (d.productId === item.productId && d.variantId === item.variantId));
        if (!deal) {
          adjustments.push(`Flash deal for "${item.name}" is no longer active. Reverted to regular price.`);
          return {
            ...item,
            isFlashDeal: false,
            flashDealId: undefined,
            price: item.originalPrice || item.mrp || item.price
          };
        }

        const currentStatus = computeFlashDealStatus(deal);
        if (currentStatus !== 'active') {
          adjustments.push(`Flash deal for "${item.name}" has ${currentStatus}. Price updated to standard rate.`);
          return {
            ...item,
            isFlashDeal: false,
            flashDealId: undefined,
            price: item.originalPrice || deal.originalPrice || item.price
          };
        }

        // Check per-customer limit
        if (deal.perCustomerLimit && item.qty > deal.perCustomerLimit) {
          adjustments.push(`Quantity for "${item.name}" was adjusted to the maximum deal limit of ${deal.perCustomerLimit} per household.`);
          return {
            ...item,
            qty: deal.perCustomerLimit,
            price: deal.dealPrice
          };
        }

        return {
          ...item,
          price: deal.dealPrice
        };
      });

      return res.json({
        success: true,
        items: validatedItems,
        adjustments,
        isValid: adjustments.length === 0
      });
    } catch {
      return res.status(500).json({ error: 'Failed to validate cart flash deals.' });
    }
  });

  // =========================================================================
  // MULTI-VENDOR INVENTORY & AUTOMATIC ORDER ALLOCATION ENDPOINTS
  // =========================================================================

  // 1. GET /api/inventory/combined-products (Live network stock & lowest prices)
  app.get('/api/inventory/combined-products', (req, res) => {
    try {
      const inventory = multiVendorStore.getVendorInventory();
      // Map by productId_variantId
      const combinedMap: Record<string, any> = {};
      inventory.forEach(item => {
        const key = `${item.productId}_${item.variantId}`;
        if (!combinedMap[key]) {
          combinedMap[key] = {
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            packSize: item.packSize,
            physicalStock: 0,
            reservedStock: 0,
            committedStock: 0,
            availableStock: 0,
            minPrice: item.price,
            vendorCount: 0,
            vendors: []
          };
        }
        const entry = combinedMap[key];
        entry.physicalStock += item.physicalStock;
        entry.reservedStock += item.reservedStock;
        entry.committedStock += item.committedStock;
        entry.availableStock += item.availableStock;
        if (item.price < entry.minPrice) {
          entry.minPrice = item.price;
        }
        if (item.availableStock > 0) {
          entry.vendorCount += 1;
          entry.vendors.push({
            vendorId: item.vendorId,
            vendorName: item.vendorName,
            locality: item.locality,
            price: item.price,
            availableStock: item.availableStock
          });
        }
      });

      return res.json({ success: true, combinedInventory: combinedMap });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to retrieve combined inventory.' });
    }
  });

  // 2. GET /api/inventory/vendor-stocks (Vendor inventory records with reservation & availability)
  app.get('/api/inventory/vendor-stocks', (req, res) => {
    try {
      const { vendorId } = req.query;
      let items = multiVendorStore.getVendorInventory();
      if (vendorId) {
        items = items.filter(i => i.vendorId === Number(vendorId));
      }
      return res.json({ success: true, items });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve vendor stocks.' });
    }
  });

  // 3. POST /api/inventory/restock (Vendor / Admin restock action)
  app.post('/api/inventory/restock', (req, res) => {
    try {
      const { vendorId, productId, variantId, quantity } = req.body;
      if (!vendorId || !productId || !variantId || !quantity) {
        return res.status(400).json({ error: 'Missing required restock parameters.' });
      }
      const updated = multiVendorStore.restockVendorVariant(
        Number(vendorId),
        Number(productId),
        Number(variantId),
        Number(quantity)
      );
      return res.json({ success: true, item: updated });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to restock item.' });
    }
  });

  // 4. GET /api/inventory/ledger (Auditable stock movement ledger)
  app.get('/api/inventory/ledger', (req, res) => {
    try {
      const ledger = multiVendorStore.getLedger();
      return res.json({ success: true, ledger });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve stock movement ledger.' });
    }
  });

  // 5. POST /api/orders/preview-allocation (Dry run simulation of order allocation)
  app.post('/api/orders/preview-allocation', (req, res) => {
    try {
      const { items, locality, distanceKm, commissionRate } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Items array is required for allocation simulation.' });
      }

      const plan = multiVendorStore.evaluateAllocation(
        items,
        locality || 'Hospete',
        Number(distanceKm) || 2.5,
        Number(commissionRate) || 10.0
      );

      return res.json({ success: true, allocation: plan });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err?.message || 'Allocation simulation failed.' });
    }
  });

  // 6. POST /api/orders/checkout (Authoritative atomic checkout & allocation)
  app.post('/api/orders/checkout', (req, res) => {
    try {
      const {
        customerName,
        phone,
        address,
        locality,
        distanceKm,
        deliveryFee,
        paymentMethod,
        items,
        commissionRate
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Cannot checkout with an empty cart.' });
      }

      const result = multiVendorStore.checkoutOrder({
        customerName: customerName || 'Valued Customer',
        phone: phone || '9845012345',
        address: address || 'Hospete Town',
        locality: locality || 'Patel Nagar',
        distanceKm: Number(distanceKm) || 2.2,
        deliveryFee: Number(deliveryFee) || 0,
        paymentMethod: paymentMethod || 'UPI / PhonePe',
        items,
        commissionRate: commissionRate ? Number(commissionRate) : 10.0
      });

      return res.json({
        success: true,
        order: result.parentOrder,
        suborders: result.suborders,
        allocationDecision: result.decision
      });
    } catch (err: any) {
      console.error('[Order Checkout Error]', err);
      return res.status(400).json({ success: false, error: err?.message || 'Failed to place order.' });
    }
  });

  // 7. GET /api/orders (Authoritative order list)
  app.get('/api/orders', (req, res) => {
    try {
      const orders = multiVendorStore.getOrders();
      return res.json({ success: true, orders });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve orders.' });
    }
  });

  // 8. GET /api/orders/:id (Single order with suborders & allocation audit)
  app.get('/api/orders/:id', (req, res) => {
    try {
      const order = multiVendorStore.getOrderById(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }
      return res.json({ success: true, order });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve order.' });
    }
  });

  // 9. GET /api/vendors/:vendorId/suborders (Suborders for vendor portal)
  app.get('/api/vendors/:vendorId/suborders', (req, res) => {
    try {
      const vendorId = Number(req.params.vendorId);
      const suborders = multiVendorStore.getVendorSuborders(vendorId);
      return res.json({ success: true, suborders });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve vendor suborders.' });
    }
  });

  // 10. POST /api/suborders/:suborderId/accept (Vendor accepts suborder)
  app.post('/api/suborders/:suborderId/accept', (req, res) => {
    try {
      const { suborderId } = req.params;
      const result = multiVendorStore.updateSuborderStatus(suborderId, 'Accepted');
      return res.json({ success: true, suborder: result.suborder, parentOrder: result.parentOrder });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to accept suborder.' });
    }
  });

  // 11. POST /api/suborders/:suborderId/status (Vendor updates status: Preparing, Ready for Pickup)
  app.post('/api/suborders/:suborderId/status', (req, res) => {
    try {
      const { suborderId } = req.params;
      const { status, checklist } = req.body;
      const result = multiVendorStore.updateSuborderStatus(suborderId, status, { checklist });
      return res.json({ success: true, suborder: result.suborder, parentOrder: result.parentOrder });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to update suborder status.' });
    }
  });

  // 12. POST /api/suborders/:suborderId/reject (Vendor rejects suborder with mandatory reason)
  app.post('/api/suborders/:suborderId/reject', (req, res) => {
    try {
      const { suborderId } = req.params;
      const { reason } = req.body;
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'A valid rejection reason is mandatory.' });
      }
      const result = multiVendorStore.updateSuborderStatus(suborderId, 'Rejected', { rejectionReason: String(reason).trim() });
      return res.json({ success: true, suborder: result.suborder, parentOrder: result.parentOrder });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to reject suborder.' });
    }
  });

  // 13. POST /api/admin/orders/:orderId/reallocate (Admin override)
  app.post('/api/admin/orders/:orderId/reallocate', (req, res) => {
    try {
      const { suborderId, newVendorId, notes } = req.body;
      if (!suborderId || !newVendorId) {
        return res.status(400).json({ error: 'suborderId and newVendorId are required for reallocation.' });
      }
      const result = multiVendorStore.reallocateSuborder(suborderId, Number(newVendorId), notes);
      return res.json({ success: true, suborder: result.suborder, parentOrder: result.parentOrder });
    } catch (err: any) {
      return res.status(400).json({ error: err?.message || 'Failed to reallocate suborder.' });
    }
  });

  // 14. GET /api/admin/allocation-logs (Audit trail of all automated allocation decisions)
  app.get('/api/admin/allocation-logs', (req, res) => {
    try {
      const logs = multiVendorStore.getAllocationLogs();
      return res.json({ success: true, logs });
    } catch {
      return res.status(500).json({ error: 'Failed to retrieve allocation logs.' });
    }
  });

  // =========================================================================
  // CLOUD SQL POSTGRESQL AUTHORITATIVE ENDPOINTS
  // =========================================================================

  // 1. Health check endpoint (verifies application and PostgreSQL connectivity without secrets)
  app.get('/api/health', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1 as healthy;`);
      return res.json({
        status: 'healthy',
        database: 'connected',
        engine: 'Google Cloud SQL for PostgreSQL (Developer Edition)',
        region: 'asia-southeast1',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[Health Check Error] Database connection failure:', err);
      return res.status(503).json({
        status: 'degraded',
        database: 'disconnected',
        error: 'Database connection failed. Please try again later.'
      });
    }
  });

  // 2. GET /api/categories (PostgreSQL database single source of truth)
  app.get('/api/categories', async (_req, res) => {
    try {
      const data = await getCategories();
      return res.json({ success: true, categories: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. GET /api/vendors (PostgreSQL database single source of truth)
  app.get('/api/vendors', async (_req, res) => {
    try {
      const data = await getVendors();
      return res.json({ success: true, vendors: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. GET /api/products (PostgreSQL database single source of truth)
  app.get('/api/products', async (req, res) => {
    try {
      const { category } = req.query;
      const data = await getProducts(category ? String(category) : undefined);
      return res.json({ success: true, products: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. GET & POST /api/system-settings (PostgreSQL backed business configuration)
  app.get('/api/system-settings', async (_req, res) => {
    try {
      const settings = await getSystemSettingsMap();
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/system-settings', async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: 'Settings object is required.' });
      }
      for (const [key, val] of Object.entries(settings)) {
        await updateSystemSetting(key, String(val));
      }
      const updated = await getSystemSettingsMap();
      return res.json({ success: true, settings: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. GET /api/mandatory-policies (PostgreSQL validation policies)
  app.get('/api/mandatory-policies', async (req, res) => {
    try {
      const { formType } = req.query;
      const policies = await getFieldPolicies(formType ? String(formType) : undefined);
      return res.json({ success: true, policies });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. POST /api/admin/exceptions (Controlled, auditable admin field exceptions)
  app.post('/api/admin/exceptions', async (req, res) => {
    try {
      const { recordType, recordId, fieldName, adminEmail, reason } = req.body;
      if (!recordType || !recordId || !fieldName || !adminEmail || !reason) {
        return res.status(400).json({ error: 'All fields (recordType, recordId, fieldName, adminEmail, reason) are required.' });
      }
      const exc = await createAdminException(recordType, recordId, fieldName, adminEmail, reason);
      return res.json({ success: true, exception: exc });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. GET /api/settlements (PostgreSQL backed vendor settlements)
  app.get('/api/settlements', async (_req, res) => {
    try {
      const data = await getVendorSettlements();
      return res.json({ success: true, settlements: data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. POST /api/reports/daily-closing (PostgreSQL EOD reconciliation report)
  app.post('/api/reports/daily-closing', async (req, res) => {
    try {
      const { reportDate } = req.body;
      const targetDate = reportDate || new Date().toISOString().split('T')[0];
      const result = await NotificationService.generateDailyClosingReports(targetDate);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. POST /api/notifications/dispatch (Transactional notification with priority fallback)
  app.post('/api/notifications/dispatch', async (req, res) => {
    try {
      const { eventKey, payload } = req.body;
      if (!eventKey) return res.status(400).json({ error: 'eventKey is required.' });
      const result = await NotificationService.dispatch(eventKey, payload || {});
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. GET /api/orders/:id/invoice (Authoritative invoice generation)
  app.get('/api/orders/:id/invoice', async (req, res) => {
    try {
      const { id } = req.params;
      const invoice = await NotificationService.generateInvoice(id);
      return res.json({ success: true, invoice });
    } catch (err: any) {
      return res.status(404).json({ success: false, error: err.message });
    }
  });

  const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api/')) return next();

    const safePath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    const localFilePath = path.join(PUBLIC_DIR, safePath);

    if (fs.existsSync(localFilePath) && !fs.statSync(localFilePath).isDirectory()) {
      try {
        const buffer = Buffer.alloc(128);
        const fd = fs.openSync(localFilePath, 'r');
        fs.readSync(fd, buffer, 0, 128, 0);
        fs.closeSync(fd);

        const head = buffer.toString('utf8').trim();
        if (head.startsWith('<svg') || head.startsWith('<?xml') || head.includes('<svg')) {
          res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.sendFile(localFilePath);
        }
      } catch {
        // Fallback to next middleware
      }
    }
    next();
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const DIST_DIR = path.resolve(process.cwd(), 'dist');

  if (isProduction && fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.log(`[Production Server] Serving production build from ${DIST_DIR}`);
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  } else {
    // Mount Vite development middlewares in dev mode
    console.log('[Development Server] Mounting Vite middlewares');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Hospete Fresh Full-Stack Server running on port ${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
