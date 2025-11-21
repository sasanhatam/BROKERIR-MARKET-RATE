import { PriceAsset } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatToman, formatPercent } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Coins, Bitcoin } from 'lucide-react';

interface StatCardProps {
  asset: PriceAsset;
}

export function StatCard({ asset }: StatCardProps) {
  const getIcon = () => {
    switch (asset.type) {
      case 'fiat':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case 'gold':
        return <Coins className="h-4 w-4 text-yellow-500" />;
      case 'crypto':
        return <Bitcoin className="h-4 w-4 text-orange-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{asset.nameFa}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{formatToman(asset.priceToman)}</div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">
            {asset.symbol}
          </p>
          <div
            className={`flex items-center text-xs font-medium ${
              asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {asset.change24h >= 0 ? (
              <TrendingUp className="w-3 h-3 ml-1" />
            ) : (
              <TrendingDown className="w-3 h-3 ml-1" />
            )}
            <span dir="ltr">{formatPercent(asset.change24h)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
