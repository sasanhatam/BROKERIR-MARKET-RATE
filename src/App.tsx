import { useState, useEffect } from 'react';
import { Ticker } from '@/components/dashboard/Ticker';
import { StatCard } from '@/components/dashboard/StatCard';
import { AssetTable } from '@/components/dashboard/AssetTable';
import { AlertForm } from '@/components/dashboard/AlertForm';
import { PriceAsset } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { RefreshCw, LayoutGrid, List, AlertTriangle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPrices } from '@/services/priceService';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function App() {
  const [assets, setAssets] = useState<PriceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [usingCached, setUsingCached] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  const fetchData = async (force = false) => {
    setLoading(true);
    try {
      const data = await getPrices(force);
      setAssets(data);
      setLastUpdated(new Date());
      
      // Check if we are using mock/fallback data for USD
      const usd = data.find(a => a.id === 'usd');
      const isFallback = usd?.source === 'nobitex' || data.some(a => a.type === 'gold' && a.source === 'nerkh.io' && a.priceToman === 4500000); // Check against mock value
      setFallbackMode(isFallback);

      const cachedTime = localStorage.getItem('nerkh_last_fetch_v3');
      if (cachedTime) {
        const diff = Date.now() - parseInt(cachedTime);
        setUsingCached(diff < 30 * 60 * 1000 && !force);
      }
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const highPriorityAssets = assets.filter(a => ['usd', 'gold_18k', 'btc', 'usdt', 'coin_emami'].includes(a.id));

  return (
    <div className="min-h-screen bg-background flex flex-col font-vazir">
      <Ticker assets={assets} />
      
      <main className="flex-1 container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">نرخ‌نامه بازار</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-muted-foreground text-sm">
                آخرین بروزرسانی: {lastUpdated.toLocaleTimeString('fa-IR')}
              </p>
              {usingCached && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  کش شده (۳۰ دقیقه)
                </span>
              )}
              {fallbackMode && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  حالت جایگزین (CORS)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertForm assets={assets} />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => fetchData(true)}
              disabled={loading}
              title="بروزرسانی دستی"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Fallback Warning */}
        {fallbackMode && (
           <Alert variant="default" className="bg-orange-50 border-orange-200 text-orange-900">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">محدودیت دسترسی به API</AlertTitle>
            <AlertDescription className="text-orange-700/90">
              مرورگر شما دسترسی مستقیم به Nerkh.io را مسدود کرده است (CORS). 
              <br/>
              قیمت دلار بر اساس <b>تتر (Nobitex)</b> محاسبه شده و سایر قیمت‌ها تقریبی هستند.
              برای دسترسی کامل، این پروژه باید روی سرور (Next.js API) اجرا شود.
            </AlertDescription>
          </Alert>
        )}

        {/* High Priority Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {highPriorityAssets.map(asset => (
            <StatCard key={asset.id} asset={asset} />
          ))}
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">لیست کامل ارزها</h2>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')} className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 ml-2"/> شبکه</TabsTrigger>
                <TabsTrigger value="list"><List className="h-4 w-4 ml-2"/> لیست</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {viewMode === 'list' ? (
            <AssetTable assets={assets} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map(asset => (
                <StatCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>طراحی شده با ❤️ توسط Dualite Alpha</p>
        <p className="mt-1">داده‌ها از Nerkh.io و Nobitex دریافت می‌شوند</p>
      </footer>
      
      <Toaster position="bottom-left" dir="rtl" />
    </div>
  );
}

export default App;
