export interface SystemConfig {
  operationalHours: string;
  geofenceRadiusKm: number;
  baseDeliveryRadiusKm: number;
  freeDeliveryThreshold: number;
  standardDeliveryFee: number;
  perKmSurchargeBeyond5Km: number;
  commissionRatePercent: number;
  dispatchReadinessMins: number;
  autoAssignRiders: boolean;
  smsAlerts: boolean;
  whatsappUpdates: boolean;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  operationalHours: '6:00 AM - 11:00 PM IST',
  geofenceRadiusKm: 15,
  baseDeliveryRadiusKm: 5,
  freeDeliveryThreshold: 199,
  standardDeliveryFee: 25,
  perKmSurchargeBeyond5Km: 10,
  commissionRatePercent: 10.0,
  dispatchReadinessMins: 10,
  autoAssignRiders: true,
  smsAlerts: true,
  whatsappUpdates: true,
};

export const SYSTEM_CONFIG_STORAGE_KEY = 'hospete_fresh_system_config';
export const SYSTEM_CONFIG_EVENT = 'hospete_fresh_system_config_updated';

export function getSystemConfig(): SystemConfig {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_CONFIG;
  try {
    const raw = localStorage.getItem(SYSTEM_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM_CONFIG;
    const parsed = JSON.parse(raw);

    const parseNum = (val: any, fallback: number): number => {
      if (typeof val === 'number' && !isNaN(val)) return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.]/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? fallback : n;
      }
      return fallback;
    };

    return {
      operationalHours: parsed.operationalHours || DEFAULT_SYSTEM_CONFIG.operationalHours,
      geofenceRadiusKm: parseNum(parsed.geofenceRadiusKm ?? parsed.geofenceRadius, DEFAULT_SYSTEM_CONFIG.geofenceRadiusKm),
      baseDeliveryRadiusKm: parseNum(parsed.baseDeliveryRadiusKm, DEFAULT_SYSTEM_CONFIG.baseDeliveryRadiusKm),
      freeDeliveryThreshold: parseNum(parsed.freeDeliveryThreshold, DEFAULT_SYSTEM_CONFIG.freeDeliveryThreshold),
      standardDeliveryFee: parseNum(parsed.standardDeliveryFee ?? parsed.deliveryFee, DEFAULT_SYSTEM_CONFIG.standardDeliveryFee),
      perKmSurchargeBeyond5Km: parseNum(parsed.perKmSurchargeBeyond5Km, DEFAULT_SYSTEM_CONFIG.perKmSurchargeBeyond5Km),
      commissionRatePercent: parseNum(parsed.commissionRatePercent ?? parsed.commissionRate, DEFAULT_SYSTEM_CONFIG.commissionRatePercent),
      dispatchReadinessMins: parseNum(parsed.dispatchReadinessMins ?? parsed.dispatchReadinessTime, DEFAULT_SYSTEM_CONFIG.dispatchReadinessMins),
      autoAssignRiders: parsed.autoAssignRiders !== false,
      smsAlerts: parsed.smsAlerts !== false,
      whatsappUpdates: parsed.whatsappUpdates !== false,
    };
  } catch (err) {
    console.error('Error loading system config:', err);
    return DEFAULT_SYSTEM_CONFIG;
  }
}

export function saveSystemConfig(newConfig: Partial<SystemConfig>): SystemConfig {
  const current = getSystemConfig();
  const merged: SystemConfig = { ...current, ...newConfig };
  try {
    localStorage.setItem(SYSTEM_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYSTEM_CONFIG_EVENT, { detail: merged }));
    }
  } catch (err) {
    console.error('Error saving system config:', err);
  }
  return merged;
}

export interface DeliveryCalculation {
  baseFee: number;
  distanceSurcharge: number;
  totalDeliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
  distanceKm: number;
  isBeyondBaseRadius: boolean;
  extraKm: number;
  isOutOfDeliveryZone: boolean;
}

export function calculateDeliveryFee(
  cartSubtotal: number,
  distanceKm: number = 3.2,
  overrideConfig?: SystemConfig
): DeliveryCalculation {
  const config = overrideConfig || getSystemConfig();
  const isOutOfZone = distanceKm > config.geofenceRadiusKm;
  const isFreeBase = cartSubtotal >= config.freeDeliveryThreshold || cartSubtotal === 0;
  const baseFee = cartSubtotal === 0 ? 0 : isFreeBase ? 0 : config.standardDeliveryFee;

  let distanceSurcharge = 0;
  let extraKm = 0;
  const isBeyondBaseRadius = distanceKm > config.baseDeliveryRadiusKm;

  if (isBeyondBaseRadius && cartSubtotal > 0) {
    extraKm = Math.max(0, Number((distanceKm - config.baseDeliveryRadiusKm).toFixed(1)));
    // Distance surcharge: additional km beyond base 5km multiplied by rate
    distanceSurcharge = Math.ceil(extraKm) * config.perKmSurchargeBeyond5Km;
  }

  const totalDeliveryFee = cartSubtotal === 0 ? 0 : baseFee + distanceSurcharge;
  const remainingForFreeDelivery = Math.max(0, config.freeDeliveryThreshold - cartSubtotal);

  return {
    baseFee,
    distanceSurcharge,
    totalDeliveryFee,
    isFreeDelivery: isFreeBase && distanceSurcharge === 0,
    freeDeliveryThreshold: config.freeDeliveryThreshold,
    remainingForFreeDelivery,
    distanceKm,
    isBeyondBaseRadius,
    extraKm,
    isOutOfDeliveryZone: isOutOfZone,
  };
}

export function calculateCommission(
  grossSales: number,
  overrideConfig?: SystemConfig
): number {
  const config = overrideConfig || getSystemConfig();
  return Math.round(grossSales * (config.commissionRatePercent / 100));
}
