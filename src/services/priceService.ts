import { PriceAsset } from '@/types';

const CACHE_KEY = 'nerkh_cache_v7';
const CACHE_TIMESTAMP_KEY = 'nerkh_last_fetch_v7';
const UPDATE_INTERVAL_MS = 10 * 60 * 1000; // 10 Minutes

const NOBITEX_API = 'https://api.nobitex.ir/market/stats';
const BRS_API_BASE = 'https://brsapi.ir/Api/Market/Gold_Currency.php';

// Strict list of assets to display (Normalized to Uppercase for checking)
const ALLOWED_SYMBOLS = [
  'USD', 'EUR', 'GBP', 'AED', // Fiat
  'GOLD18', 'COIN', 'EMAMI', 'BAHAR', 'HALF', 'QUARTER', // Gold/Coins
  'BTC', 'USDT', 'ETH', 'TRX', 'TON', 'DOGE' // Crypto
];

// Map BrsApi names/slugs to our standard IDs
const ID_MAP: Record<string, string> = {
  'usd': 'usd',
  'eur': 'eur',
  'gbp': 'gbp',
  'aed': 'aed',
  'gold_18k': 'gold_18k',
  'coin_emami': 'coin_emami',
  'coin_bahar': 'coin_bahar',
  'coin_half': 'coin_half',
  'coin_quarter': 'coin_quarter'
};

export async function getPrices(forceRefresh = false): Promise<PriceAsset[]> {
  const lastFetch = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const cachedData = localStorage.getItem(CACHE_KEY);
  const now = Date.now();

  if (
    !forceRefresh &&
    lastFetch &&
    cachedData &&
    now - parseInt(lastFetch) < UPDATE_INTERVAL_MS
  ) {
    return JSON.parse(cachedData);
  }

  console.log('Fetching fresh data...');
  
  const [nobitexAssets, brsAssets] = await Promise.all([
    fetchNobitexData(),
    fetchBrsData()
  ]);

  // --- STRICT DEDUPLICATION LOGIC ---
  const uniqueAssets: PriceAsset[] = [];
  const seenIds = new Set<string>();

  const addAssetSafe = (asset: PriceAsset) => {
    // 1. Safety Check: Ensure ID exists
    if (!asset.id) return;

    // 2. Normalize ID to lowercase for consistent deduplication
    const normalizedId = asset.id.toLowerCase();

    // 3. Check if already added
    if (seenIds.has(normalizedId)) return;

    // 4. Check if allowed (Symbol check)
    const symbol = asset.symbol.toUpperCase();
    const isAllowed = ALLOWED_SYMBOLS.some(allowed => symbol.includes(allowed) || allowed === symbol);
    
    if (isAllowed) {
      // Update asset ID to normalized version to prevent key mismatch
      asset.id = normalizedId;
      uniqueAssets.push(asset);
      seenIds.add(normalizedId);
    }
  };

  // Prioritize Nobitex for Crypto (Better data)
  nobitexAssets.forEach(addAssetSafe);

  // Add BrsApi assets (Fiat/Gold)
  brsAssets.forEach(addAssetSafe);

  // Fallback for USD if missing (derive from USDT)
  if (!seenIds.has('usd')) {
      const usdt = uniqueAssets.find(a => a.id === 'usdt');
      if (usdt) {
          const usdAsset: PriceAsset = {
              ...usdt,
              id: 'usd',
              symbol: 'USD',
              nameFa: 'دلار آمریکا (تتر)',
              nameEn: 'US Dollar',
              type: 'fiat',
              source: 'nobitex'
          };
          uniqueAssets.push(usdAsset);
          seenIds.add('usd');
      }
  }

  if (uniqueAssets.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueAssets));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
  }

  return uniqueAssets;
}

async function fetchNobitexData(): Promise<PriceAsset[]> {
  try {
    const response = await fetch(NOBITEX_API);
    if (!response.ok) return [];
    const data = await response.json();
    
    const mapCrypto = (key: string, id: string, nameFa: string, nameEn: string): PriceAsset | null => {
      const item = data[key];
      if (!item) return null;
      
      const priceIRR = parseFloat(item.latest);
      return {
        id: id.toLowerCase(), // Ensure lowercase
        symbol: id.toUpperCase(),
        nameFa,
        nameEn,
        type: 'crypto',
        priceIRR,
        priceToman: priceIRR / 10,
        change24h: parseFloat(item.dayChange),
        lastUpdated: new Date().toISOString(),
        source: 'nobitex'
      };
    };

    return [
      mapCrypto('btc-rls', 'btc', 'بیت‌کوین', 'Bitcoin'),
      mapCrypto('eth-rls', 'eth', 'اتریوم', 'Ethereum'),
      mapCrypto('usdt-rls', 'usdt', 'تتر', 'Tether'),
      mapCrypto('trx-rls', 'trx', 'ترون', 'Tron'),
      mapCrypto('ton-rls', 'ton', 'تون‌کوین', 'Toncoin'),
      mapCrypto('doge-rls', 'doge', 'دوج‌کوین', 'Dogecoin'),
    ].filter((c): c is PriceAsset => c !== null);

  } catch (error) {
    return [];
  }
}

async function fetchBrsData(): Promise<PriceAsset[]> {
  const apiKey = import.meta.env.VITE_BRS_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(`${BRS_API_BASE}?key=${apiKey}`);
    if (!response.ok) return [];
    const json = await response.json();
    
    const items: PriceAsset[] = [];

    const parseItem = (item: any, category: 'fiat' | 'gold'): PriceAsset | null => {
        if (!item.price || !item.name) return null;
        
        let price = parseFloat(item.price.toString().replace(/,/g, ''));
        let priceToman = price;
        let priceIRR = price * 10;

        // FIX: "Missing Zero" Logic
        if (category === 'fiat') {
            if (price > 200000) {
                priceIRR = price;
                priceToman = price / 10;
            } else {
                priceToman = price;
                priceIRR = price * 10;
            }
        } else {
             if (price > 20000000) {
                priceIRR = price;
                priceToman = price / 10;
            } else {
                priceToman = price;
                priceIRR = price * 10;
            }
        }

        // FIX: Robust ID Generation
        const rawSlug = item.slug || item.id || item.name;
        if (!rawSlug) return null;
        
        const safeSlug = String(rawSlug).toLowerCase();
        // Try ID_MAP, otherwise use the slug itself
        const id = ID_MAP[safeSlug] || safeSlug;

        return {
            id: String(id).toLowerCase(), // Force lowercase
            symbol: (item.symbol || rawSlug || '').toUpperCase(),
            nameFa: item.name,
            nameEn: item.slug || item.name,
            type: category,
            priceIRR,
            priceToman,
            change24h: parseFloat(item.change_percent || item.percent || 0),
            lastUpdated: new Date().toISOString(),
            source: 'brsapi'
        };
    };

    if (Array.isArray(json)) {
        json.forEach((item: any) => {
            let type: 'fiat' | 'gold' = 'fiat';
            if (item.name.includes('طلا') || item.name.includes('سکه')) type = 'gold';
            const parsed = parseItem(item, type);
            if (parsed) items.push(parsed);
        });
    } else if (json.gold || json.currency) {
        if (Array.isArray(json.gold)) json.gold.forEach((i: any) => {
            const p = parseItem(i, 'gold'); 
            if(p) items.push(p);
        });
        if (Array.isArray(json.currency)) json.currency.forEach((i: any) => {
            const p = parseItem(i, 'fiat'); 
            if(p) items.push(p);
        });
    }

    return items;
  } catch (error) {
    return [];
  }
}
