/**
 * Central Campus-Based Regional & Currency Configuration
 * Misbah-ul-Quran Institute Management System
 * 
 * Regional Standards:
 * - UK Campus: GBP (£), Locale en-GB, Timezone Europe/London, Code +44
 * - KTS Pakistan Campus: PKR (Rs.), Locale en-PK, Timezone Asia/Karachi, Code +92
 */

export type CampusCurrencyCode = 'GBP' | 'PKR';

export interface CampusRegionalConfig {
  campusId: string;
  campusCode: string;
  name: string;
  country: string;
  currency: CampusCurrencyCode;
  currencySymbol: string;
  locale: string;
  timeZone: string;
  telephoneCode: string;
  standardMonthlyFee: number;
  siblingMonthlyFee: number;
  admissionFee: number;
}

export const CAMPUS_REGIONAL_CONFIGS: Record<string, CampusRegionalConfig> = {
  uk: {
    campusId: 'uk',
    campusCode: 'UK-01',
    name: 'UK Campus',
    country: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    timeZone: 'Europe/London',
    telephoneCode: '+44',
    standardMonthlyFee: 30,
    siblingMonthlyFee: 25,
    admissionFee: 15,
  },
  kts: {
    campusId: 'kts',
    campusCode: 'KTS-01',
    name: 'KTS Pakistan Campus',
    country: 'Pakistan',
    currency: 'PKR',
    currencySymbol: 'Rs. ',
    locale: 'en-PK',
    timeZone: 'Asia/Karachi',
    telephoneCode: '+92',
    standardMonthlyFee: 3500,
    siblingMonthlyFee: 2800,
    admissionFee: 1500,
  },
};

/**
 * Retrieve regional configuration for a campus ID, defaulting to UK if unspecified or 'all'
 */
export function getCampusRegionalConfig(campusId?: string | null): CampusRegionalConfig {
  if (!campusId || campusId === 'all') {
    return CAMPUS_REGIONAL_CONFIGS.uk;
  }
  const normalized = campusId.toLowerCase().trim();
  if (normalized.includes('kts') || normalized.includes('pakistan')) {
    return CAMPUS_REGIONAL_CONFIGS.kts;
  }
  return CAMPUS_REGIONAL_CONFIGS[normalized] || CAMPUS_REGIONAL_CONFIGS.uk;
}

/**
 * Determine currency code ('GBP' | 'PKR') from a campusId, record currency, or explicit value
 */
export function resolveCurrencyCode(
  currencyOrCampusId?: 'GBP' | 'PKR' | string | null,
  fallbackCampusId?: string | null
): CampusCurrencyCode {
  if (!currencyOrCampusId) {
    if (fallbackCampusId) {
      return getCampusRegionalConfig(fallbackCampusId).currency;
    }
    return 'GBP';
  }

  const normalized = String(currencyOrCampusId).toUpperCase().trim();
  if (normalized === 'PKR' || normalized === 'RS' || normalized === 'RS.') return 'PKR';
  if (normalized === 'GBP' || normalized === 'POUND' || normalized === '£') return 'GBP';

  const campusMatch = currencyOrCampusId.toLowerCase().trim();
  if (campusMatch.includes('kts') || campusMatch.includes('pakistan')) return 'PKR';
  if (campusMatch.includes('uk') || campusMatch.includes('london')) return 'GBP';

  return 'GBP';
}

/**
 * Return display currency symbol ('£' or 'Rs. ')
 */
export function getCampusCurrencySymbol(currencyOrCampusId?: 'GBP' | 'PKR' | string | null): string {
  const code = resolveCurrencyCode(currencyOrCampusId);
  return code === 'PKR' ? 'Rs. ' : '£';
}

/**
 * Central, campus-aware currency formatter.
 *
 * Examples:
 *  formatCampusCurrency(30, 'GBP') => "£30"
 *  formatCampusCurrency(4500, 'PKR') => "Rs. 4,500"
 *  formatCampusCurrency(235, 'GBP', { showCode: true }) => "£235 GBP"
 *  formatCampusCurrency(65000, 'PKR', { showCode: true }) => "Rs. 65,000 PKR"
 */
export function formatCampusCurrency(
  amount: number | null | undefined,
  currencyOrCampusId?: 'GBP' | 'PKR' | string | null,
  options?: {
    showCode?: boolean;
    locale?: string;
    decimals?: number;
    fallbackCampusId?: string;
  }
): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const currencyCode = resolveCurrencyCode(currencyOrCampusId, options?.fallbackCampusId);
  const config = currencyCode === 'PKR' ? CAMPUS_REGIONAL_CONFIGS.kts : CAMPUS_REGIONAL_CONFIGS.uk;
  const locale = options?.locale || config.locale;

  // Use appropriate decimal formatting: GBP uses 2 or 0, PKR typically whole rupees
  const hasFractions = val % 1 !== 0;
  const minimumFractionDigits = options?.decimals !== undefined
    ? options.decimals
    : hasFractions ? 2 : 0;
  const maximumFractionDigits = options?.decimals !== undefined
    ? options.decimals
    : 2;

  const numberPart = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(val);

  const symbol = config.currencySymbol;
  const codeSuffix = options?.showCode ? ` ${currencyCode}` : '';

  return `${symbol}${numberPart}${codeSuffix}`;
}

/**
 * Format a date string or Date object using the campus time zone and DD/MM/YYYY standard.
 */
export function formatCampusDate(
  dateInput: string | Date | null | undefined,
  campusId?: string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '—';

  try {
    // If it's already a YYYY-MM-DD date string, prevent timezone shifting for pure dates
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      const [year, month, day] = dateInput.trim().split('-');
      return `${day}/${month}/${year}`;
    }

    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    const config = getCampusRegionalConfig(campusId);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: config.timeZone,
      ...options,
    };

    return new Intl.DateTimeFormat(config.locale, defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
}
