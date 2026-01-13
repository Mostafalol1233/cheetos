import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supported languages and currencies
export const SUPPORTED_LANGUAGES = ['en', 'ar'];
export const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'TRY'];

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP = {
  'EG': 'EGP', // Egypt
  'US': 'USD', // United States
  'TR': 'TRY', // Turkey
  // Add more countries as needed
};

// Default fallbacks
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_LANGUAGE = 'en';

// Exchange rates cache
let exchangeRatesCache = {};
const EXCHANGE_RATE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fixed prices per currency (can be easily extended)
// Structure: gameId -> packageIndex -> currency -> price
export const FIXED_PRICES = {
  // Example structure - add your fixed prices here
  // 'game-slug': {
  //   0: { EGP: 100, USD: 5.5, TRY: 150 },
  //   1: { EGP: 200, USD: 11, TRY: 300 }
  // }
};

// Cache for loaded fixed prices
let fixedPricesCache = {};
let fixedPricesLoaded = false;

/**
 * Load fixed prices from database
 */
export async function loadFixedPrices() {
  if (fixedPricesLoaded) return;

  try {
    // Import pool dynamically to avoid circular dependencies
    const { pool } = await import('../db.js');

    const result = await pool.query('SELECT id, multi_currency_prices FROM games WHERE multi_currency_prices IS NOT NULL');

    for (const row of result.rows) {
      if (row.multi_currency_prices) {
        fixedPricesCache[row.id] = row.multi_currency_prices;
      }
    }

    fixedPricesLoaded = true;
  } catch (error) {
    console.warn('Failed to load fixed prices from database:', error.message);
  }
}

/**
 * Detect country from IP address using a free GeoIP service
 */
export async function detectCountryFromIP(ip) {
  try {
    // Skip for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'EG'; // Default to Egypt for local development
    }

    // Use ipapi.co (free tier allows 1000 requests/day)
    const response = await fetch(`http://ipapi.co/${ip}/country/`, {
      timeout: 5000
    });

    if (response.ok) {
      const countryCode = await response.text();
      return countryCode.length === 2 ? countryCode : null;
    }
  } catch (error) {
    console.warn('GeoIP detection failed:', error.message);
  }
  return null;
}

/**
 * Get currency for a country
 */
export function getCurrencyForCountry(countryCode) {
  if (!countryCode) return DEFAULT_CURRENCY;
  return COUNTRY_CURRENCY_MAP[countryCode] || DEFAULT_CURRENCY;
}

/**
 * Detect language from Accept-Language header
 */
export function detectLanguageFromHeader(acceptLanguage) {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  // Parse Accept-Language header (e.g., "ar,en-US;q=0.9,en;q=0.8")
  const languages = acceptLanguage.split(',').map(lang => {
    const [code] = lang.trim().split(';');
    return code.split('-')[0]; // Get primary language code
  });

  // Return first supported language
  for (const lang of languages) {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      return lang;
    }
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Fetch exchange rates from a free API
 */
export async function fetchExchangeRates() {
  try {
    // Using exchangerate-api.com (free tier)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      return {
        EGP: data.rates.EGP,
        TRY: data.rates.TRY,
        USD: 1
      };
    }
  } catch (error) {
    console.warn('Exchange rate fetch failed:', error.message);
  }

  // Fallback rates (update these periodically)
  return {
    EGP: 50, // Approximate
    TRY: 35, // Approximate
    USD: 1
  };
}

/**
 * Get cached exchange rates
 */
export async function getExchangeRates() {
  const now = Date.now();
  const cacheKey = 'usd_rates';

  // Check cache
  if (exchangeRatesCache[cacheKey] &&
      (now - exchangeRatesCache[cacheKey].timestamp) < EXCHANGE_RATE_CACHE_DURATION) {
    return exchangeRatesCache[cacheKey].rate;
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  exchangeRatesCache[cacheKey] = { rate: rates, timestamp: now };

  return rates;
}

/**
 * Convert price from USD to target currency
 */
export async function convertPriceFromUSD(usdPrice, targetCurrency) {
  if (targetCurrency === 'USD') return usdPrice;

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency];

  if (!rate) {
    console.warn(`No exchange rate found for ${targetCurrency}, using USD price`);
    return usdPrice;
  }

  return Math.round((usdPrice * rate) * 100) / 100; // Round to 2 decimal places
}

/**
 * Get localized price for a game package
 */
export async function getLocalizedPrice(gameId, packageIndex, targetCurrency, baseUsdPrice) {
  // Load fixed prices if not loaded yet
  await loadFixedPrices();

  // Check for fixed price first (preferred)
  const gameFixedPrices = fixedPricesCache[gameId];
  if (gameFixedPrices && gameFixedPrices[packageIndex] && gameFixedPrices[packageIndex][targetCurrency]) {
    return {
      price: gameFixedPrices[packageIndex][targetCurrency],
      isEstimated: false
    };
  }

  // Fallback to conversion from USD
  let usdPrice = baseUsdPrice;

  // If still no USD price, return 0 (shouldn't happen in production)
  if (!usdPrice) {
    console.warn(`No price found for game ${gameId}, package ${packageIndex}`);
    return { price: 0, isEstimated: true };
  }

  const convertedPrice = await convertPriceFromUSD(usdPrice, targetCurrency);
  return {
    price: convertedPrice,
    isEstimated: true
  };
}

/**
 * Get all localized prices for a game
 */
export async function getLocalizedPricesForGame(gameId, packagePrices, targetCurrency) {
  const results = [];

  for (let i = 0; i < packagePrices.length; i++) {
    const localized = await getLocalizedPrice(gameId, i, targetCurrency, packagePrices[i]);
    results.push(localized);
  }

  return results;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price, currency, language = 'en') {
  const formatter = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'EGP' ? 0 : 2,
    maximumFractionDigits: currency === 'EGP' ? 0 : 2
  });

  return formatter.format(price);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency) {
  const symbols = {
    EGP: 'جنيه', // Arabic for EGP
    USD: '$',
    TRY: '₺'
  };
  return symbols[currency] || currency;
}