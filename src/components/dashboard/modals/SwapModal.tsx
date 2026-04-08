'use client';

import { useState, useEffect } from 'react';
import { X, ArrowUpDown, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  balance: number;
}

export default function SwapModal({ isOpen, onClose }: SwapModalProps) {
  const { user } = useAuth();
  const userCurrency = user?.currency || 'USD';
  const [fromAsset, setFromAsset] = useState('FIAT');
  const [toAsset, setToAsset] = useState('BTC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(true);

  // Fetch live BTC price from CoinGecko in user's currency
  useEffect(() => {
    const fetchBtcPrice = async () => {
      const currencyCode = userCurrency.toLowerCase();
      try {
        setPriceLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currencyCode}`,
          {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.bitcoin?.[currencyCode]) {
            setBtcPrice(data.bitcoin[currencyCode]);
          }
        }
      } catch {
        // Price fetch failed - will show error in UI
      } finally {
        setPriceLoading(false);
      }
    };

    if (isOpen && userCurrency) {
      fetchBtcPrice();
    }
  }, [isOpen, userCurrency]);

  // Update crypto assets with live price
  useEffect(() => {
    if (btcPrice > 0) {
      setCryptoAssets([
        { symbol: 'FIAT', name: userCurrency, price: 1, balance: user?.balance || 0 },
        { symbol: 'BTC', name: 'Bitcoin', price: btcPrice, balance: user?.bitcoinBalance || 0 },
      ]);
    }
  }, [user, btcPrice, userCurrency]);

  useEffect(() => {
    if (fromAmount && fromAsset && toAsset) {
      const fromPrice = cryptoAssets.find(asset => asset.symbol === fromAsset)?.price || 1;
      const toPrice = cryptoAssets.find(asset => asset.symbol === toAsset)?.price || 1;
      
      const usdValue = parseFloat(fromAmount) * fromPrice;
      const fee = usdValue * 0.005; // 0.5% fee
      const netUsdValue = usdValue - fee;
      const calculatedToAmount = netUsdValue / toPrice;
      
      setToAmount(calculatedToAmount.toFixed(8));
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromAsset, toAsset, cryptoAssets]);

  const handleSwap = async () => {
    if (!fromAmount || !toAmount) {
      toast.error('Please enter an amount to swap');
      return;
    }

    const fromBalance = cryptoAssets.find(asset => asset.symbol === fromAsset)?.balance || 0;
    if (parseFloat(fromAmount) > fromBalance) {
      toast.error(`Insufficient ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} balance`);
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/crypto/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromAsset,
          toAsset,
          fromAmount: parseFloat(fromAmount),
          userCurrency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Swap failed');
      }

      toast.success(`Successfully swapped ${fromAmount} ${fromAsset === 'FIAT' ? userCurrency : 'BTC'} for ${parseFloat(toAmount).toFixed(8)} ${toAsset === 'FIAT' ? userCurrency : 'BTC'}`);
      onClose();
      
      // Refresh the page to update balances
      window.location.reload();
    } catch (error) {
      console.error('Swap error:', error);
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    } finally {
      setIsLoading(false);
    }
  };

  const swapAssets = () => {
    const tempFromAsset = fromAsset;
    const tempFromAmount = fromAmount;
    
    setFromAsset(toAsset);
    setToAsset(tempFromAsset);
    setFromAmount(toAmount);
    setToAmount(tempFromAmount);
  };

  if (!isOpen) return null;

  const fromAssetData = cryptoAssets.find(asset => asset.symbol === fromAsset);
  const toAssetData = cryptoAssets.find(asset => asset.symbol === toAsset);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal Content */}
        <div className="inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 relative">
          {/* Close Button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <ArrowUpDown className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Swap Assets</h3>
            <p className="mt-1 text-sm text-gray-500">Exchange one asset for another</p>
          </div>

          {/* Swap Form */}
          <div className="space-y-4">
            {/* From Asset */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="flex gap-3">
                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cryptoAssets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {fromAssetData && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {fromAssetData.balance.toFixed(8)} {fromAsset}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapAssets}
                className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
              >
                <ArrowUpDown className="h-5 w-5 text-blue-600" />
              </button>
            </div>

            {/* To Asset */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="flex gap-3">
                <select
                  value={toAsset}
                  onChange={(e) => setToAsset(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cryptoAssets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>
              {toAssetData && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {toAssetData.balance.toFixed(8)} {toAsset}
                </p>
              )}
            </div>

            {/* Fee Information */}
            {fromAmount && (
              <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">Transaction Fee: 0.5%</p>
                  <p>Fee: ${(parseFloat(fromAmount) * (cryptoAssets.find(a => a.symbol === fromAsset)?.price || 1) * 0.005).toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSwap}
              disabled={isLoading || !fromAmount || !toAmount}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                'Swap Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
