import { PriceAsset } from '@/types';
import { formatToman, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerProps {
  assets: PriceAsset[];
}

export function Ticker({ assets }: TickerProps) {
  return (
    <div className="w-full bg-primary/5 border-b border-border h-12 flex items-center overflow-hidden relative">
      <div className="ticker-wrap">
        <div className="ticker flex items-center gap-8 px-4">
          {[...assets, ...assets].map((asset, index) => (
            <div key={`${asset.id}-${index}`} className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="font-bold text-primary">{asset.nameFa}</span>
              <span className="font-mono font-medium">{formatToman(asset.priceToman)}</span>
              <span
                className={`flex items-center text-xs ${
                  asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {asset.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                <span dir="ltr">{formatPercent(asset.change24h)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
