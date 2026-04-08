'use client';

import { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowLeft, Bitcoin, DollarSign, Loader2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function SwapPage() {
  const { user } = useAuth();
  const userCurrency = user?.currency || 'USD';
  const [fromAsset, setFromAsset] = useState<'FIAT' | 'BTC'>('FIAT');
  const [toAsset, setToAsset] = useState<'FIAT' | 'BTC'>('BTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const currencySymbol = getUserCurrencySymbol(user?.currency || 'USD');

  // Fetch live BTC price from CoinGecko in user's currency
  const fetchBTCPrice = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000 * (retryCount + 1);
    const currencyCode = userCurrency.toLowerCase();
    
    try {
      setIsLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}&include_24hr_change=true`, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.bitcoin && data.bitcoin[currencyCode] && typeof data.bitcoin[currencyCode] === 'number') {
        const price = data.bitcoin[currencyCode];
        const change = data.bitcoin[`${currencyCode}_24h_change`] || 0;
        
        setBtcPrice(price);
        setPriceChange24h(change);
        setLastUpdated(new Date());
        
        // Update shared cache
        localStorage.setItem('btc_price_cache', JSON.stringify({ price, change, currency: userCurrency }));
        localStorage.setItem('btc_price_timestamp', Date.now().toString());
      } else {
        throw new Error('Invalid API response format');
      }
    } catch {
      if (retryCount < maxRetries) {
        setTimeout(() => {
          fetchBTCPrice(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      const cachedPrice = localStorage.getItem('btc_price_cache');
      if (cachedPrice) {
        const cached = JSON.parse(cachedPrice);
        setBtcPrice(cached.price);
        setPriceChange24h(cached.change || 0);
        setLastUpdated(new Date());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch price when user currency is available
  useEffect(() => {
    if (userCurrency) {
      fetchBTCPrice();
    }
  }, [userCurrency]);

  // Calculate conversion amounts
  useEffect(() => {
    if (fromAmount && btcPrice > 0) {
      const amount = parseFloat(fromAmount);
      if (isNaN(amount)) {
        setToAmount('');
        return;
      }

      let convertedAmount: number;
      
      if (fromAsset === 'FIAT' && toAsset === 'BTC') {
        // FIAT to BTC
        convertedAmount = amount / btcPrice;
      } else if (fromAsset === 'BTC' && toAsset === 'FIAT') {
        // BTC to FIAT
        convertedAmount = amount * btcPrice;
      } else {
        // Same asset
        convertedAmount = amount;
      }

      setToAmount(convertedAmount.toFixed(fromAsset === 'FIAT' ? 8 : 2));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromAsset, toAsset, btcPrice]);

  // Swap assets
  const handleSwapAssets = () => {
    const tempFromAsset = fromAsset;
    const tempFromAmount = fromAmount;
    
    setFromAsset(toAsset);
    setToAsset(tempFromAsset);
    setFromAmount(toAmount);
  };

  // Execute swap
  const handleSwap = async () => {
    if (!fromAmount || !toAmount) {
      toast.error('Please enter an amount to swap');
      return;
    }

    const amount = parseFloat(fromAmount);
    const fromBalance = fromAsset === 'FIAT' ? (user?.balance || 0) : (user?.bitcoinBalance || 0);
    
    if (amount > fromBalance) {
      toast.error(`Insufficient ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} balance`);
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsSwapping(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/crypto/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromAsset: fromAsset === 'FIAT' ? 'FIAT' : 'BTC',
          toAsset: toAsset === 'FIAT' ? 'FIAT' : 'BTC',
          fromAmount: amount,
          userCurrency: userCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Swap failed');
      }

      toast.success(`Successfully swapped ${fromAmount} ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} for ${parseFloat(toAmount).toFixed(fromAsset === 'FIAT' ? 8 : 2)} ${toAsset === 'FIAT' ? userCurrency : 'BTC'}`);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
      // Refresh the page to update balances
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const fromBalance = fromAsset === 'FIAT' ? (user?.balance || 0) : (user?.bitcoinBalance || 0);
  const toBalance = toAsset === 'FIAT' ? (user?.balance || 0) : (user?.bitcoinBalance || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchBTCPrice()}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:!text-white mb-2">Swap Assets</h1>
          <p className="text-gray-600 dark:text-gray-300">Exchange between {userCurrency} and Bitcoin instantly</p>
        </div>

        {/* BTC Price Card */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 shadow-lg border border-orange-200 dark:border-gray-600 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <Bitcoin className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:!text-white mb-1">Bitcoin</h3>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">BTC/{userCurrency}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {currencySymbol}{btcPrice.toLocaleString()}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                priceChange24h >= 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(priceChange24h).toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-orange-200 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              24h Change
            </p>
          </div>
        </div>

        {/* Swap Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-600">
          {/* From Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setFromAsset(fromAsset === 'FIAT' ? 'BTC' : 'FIAT')}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {fromAsset === 'FIAT' ? (
                    <>
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{userCurrency}</span>
                    </>
                  ) : (
                    <>
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-gray-900 dark:text-white">BTC</span>
                    </>
                  )}
                </button>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Balance</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {fromAsset === 'FIAT' 
                      ? `${currencySymbol}${fromBalance.toLocaleString()}`
                      : `${fromBalance.toFixed(8)} BTC`
                    }
                  </div>
                </div>
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                step={fromAsset === 'BTC' ? '0.00000001' : '0.01'}
                min="0"
              />
              <button
                onClick={() => setFromAmount(fromBalance.toString())}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Use Max
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-6">
            <button
              onClick={handleSwapAssets}
              className="p-3 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/40 rounded-full transition-colors"
            >
              <ArrowUpDown className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </button>
          </div>

          {/* To Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setToAsset(toAsset === 'FIAT' ? 'BTC' : 'FIAT')}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {toAsset === 'FIAT' ? (
                    <>
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-gray-900 dark:text-white">{userCurrency}</span>
                    </>
                  ) : (
                    <>
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-gray-900 dark:text-white">BTC</span>
                    </>
                  )}
                </button>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Balance</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {toAsset === 'FIAT' 
                      ? `${currencySymbol}${toBalance.toLocaleString()}`
                      : `${toBalance.toFixed(8)} BTC`
                    }
                  </div>
                </div>
              </div>
              <input
                type="text"
                value={toAmount}
                readOnly
                placeholder="0.00"
                className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          </div>

          {/* Swap Summary */}
          {fromAmount && toAmount && btcPrice > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Exchange Rate</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  1 BTC = {currencySymbol}{btcPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-300">Network Fee</span>
                <span className="font-medium text-green-600 dark:text-green-400">Free</span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!fromAmount || !toAmount || isSwapping || fromAsset === toAsset}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            {isSwapping ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Swapping...
              </div>
            ) : fromAsset === toAsset ? (
              'Select different assets'
            ) : (
              `Swap ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} for ${toAsset === 'FIAT' ? userCurrency : 'BTC'}`
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-xs font-bold text-yellow-900">i</span>
            </div>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Free Swaps</p>
              <p>All swaps are completely free with no network fees or hidden charges. Exchange rates are updated in real-time from CoinGecko.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
