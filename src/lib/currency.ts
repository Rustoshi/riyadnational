/**
 * Currency utility functions
 * Maps currency codes to their symbols and provides formatting utilities
 */

// Currency code to symbol mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  HKD: 'HK$',
  SGD: 'S$',
  SEK: 'kr',
  KRW: '₩',
  NOK: 'kr',
  NZD: 'NZ$',
  MXN: '$',
  ZAR: 'R',
  BRL: 'R$',
  RUB: '₽',
  TRY: '₺',
  PLN: 'zł',
  THB: '฿',
  IDR: 'Rp',
  MYR: 'RM',
  PHP: '₱',
  CZK: 'Kč',
  ILS: '₪',
  CLP: '$',
  PKR: '₨',
  EGP: 'E£',
  NGN: '₦',
  BDT: '৳',
  VND: '₫',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: '﷼',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  MAD: 'د.م.',
  KES: 'KSh',
  GHS: '₵',
  UGX: 'USh',
  TZS: 'TSh',
  XOF: 'CFA',
  XAF: 'FCFA',
};

// List of supported currencies for dropdowns
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
];

/**
 * Get currency symbol from currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @returns Currency symbol (e.g., '$', '€')
 */
export function getCurrencySymbol(currencyCode?: string | null): string {
  if (!currencyCode) return '$'; // Default to USD
  const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()];
  return symbol || currencyCode; // Return code if symbol not found
}

/**
 * Get user's currency symbol with fallback to USD
 * @param userCurrency - User's currency code from their profile
 * @returns Currency symbol
 */
export function getUserCurrencySymbol(userCurrency?: string | null): string {
  return getCurrencySymbol(userCurrency || 'USD');
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @param locale - Locale for number formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode?: string | null,
  locale: string = 'en-US'
): string {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formattedNumber}`;
}
