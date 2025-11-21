export type AssetType = 'fiat' | 'gold' | 'crypto';

export interface PriceAsset {
  id: string;
  symbol: string;
  nameFa: string;
  nameEn: string;
  type: AssetType;
  priceIRR: number;
  priceToman: number;
  change24h: number; // Percentage
  lastUpdated: string;
  source: 'nerkh.io' | 'nobitex';
}

export interface AlertPreference {
  id: string;
  assetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
}
