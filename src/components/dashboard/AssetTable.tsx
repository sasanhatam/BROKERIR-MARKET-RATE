import { PriceAsset } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatToman, formatPercent } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface AssetTableProps {
  assets: PriceAsset[];
}

export function AssetTable({ assets }: AssetTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof PriceAsset; direction: 'asc' | 'desc' } | null>(null);

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof PriceAsset) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Helper for Persian Date
  const formatPersianTime = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(dateString));
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">نام ارز</TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('priceToman')} className="h-8 px-2">
                قیمت (تومان)
                <ArrowUpDown className="mr-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">تغییر ۲۴ ساعته</TableHead>
            <TableHead className="text-right hidden md:table-cell">منبع</TableHead>
            <TableHead className="text-right hidden md:table-cell">آخرین بروزرسانی</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{asset.nameFa}</span>
                  <span className="text-xs text-muted-foreground">{asset.symbol}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono">{formatToman(asset.priceToman)}</TableCell>
              <TableCell>
                <Badge
                  variant={asset.change24h >= 0 ? 'default' : 'destructive'}
                  className={asset.change24h >= 0 ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <span dir="ltr">{formatPercent(asset.change24h)}</span>
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                {asset.source}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm" dir="ltr">
                {formatPersianTime(asset.lastUpdated)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
