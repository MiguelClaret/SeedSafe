"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { X, Loader2, CheckCircle, AlertCircle, Info, DollarSign, RefreshCw } from "lucide-react";
import {
  getNeroRate,
  convertUsdToNero,
  convertNeroToUsd,
  NEROCHAIN_ICON_SVG
} from "../../services/NeroConverter";

const NerochainIcon = (props) => {
  return (
    <svg {...NEROCHAIN_ICON_SVG} {...props}>
      {NEROCHAIN_ICON_SVG.children.map((child, index) => {
        if (child.tag === 'circle') return <circle key={index} {...child.props} />;
        if (child.tag === 'path') return <path key={index} {...child.props} />;
        return null;
      })}
    </svg>
  );
};

const formatNeroPrice = (priceInWei) => {
  if (!priceInWei || priceInWei.isZero()) return "0.00";
  return ethers.utils.formatUnits(priceInWei, 18);
};

const PurchaseModal = ({ 
  isOpen, 
  onClose, 
  listing, 
  onConfirm, 
  walletInfo, 
  purchaseStatus,
  chainName = "NERO Chain"
}) => {
  const [quantity, setQuantity] = useState("");
  const [totalCostWei, setTotalCostWei] = useState(ethers.BigNumber.from(0));
  const [quantityError, setQuantityError] = useState("");
  const [showInNero, setShowInNero] = useState(true);
  const [neroRate, setNeroRate] = useState(2.45);
  const [isRateLoading, setIsRateLoading] = useState(false);

  const fetchConversionRate = async () => {
    setIsRateLoading(true);
    try {
      const rate = await getNeroRate();
      setNeroRate(rate);
    } catch (error) {
      console.error("Erro ao buscar taxa:", error);
    } finally {
      setIsRateLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchConversionRate();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuantity("");
      setTotalCostWei(ethers.BigNumber.from(0));
      setQuantityError("");
    }
  }, [isOpen, listing]);

  useEffect(() => {
    if (!listing || !listing.pricePerUnit) return;

    const qty = parseInt(quantity, 10);
    if (!isNaN(qty) && qty > 0) {
      if (qty > listing.quantity) {
        setQuantityError(`Max available: ${listing.quantity} kg`);
        setTotalCostWei(ethers.BigNumber.from(0));
      } else {
        setQuantityError("");
        const cost = listing.pricePerUnit.mul(ethers.BigNumber.from(qty));
        setTotalCostWei(cost);
      }
    } else {
      setQuantityError(qty === 0 ? "Quantity must be greater than 0" : "");
      setTotalCostWei(ethers.BigNumber.from(0));
    }
  }, [quantity, listing]);

  const handleConfirmClick = () => {
    if (quantityError || !quantity || parseInt(quantity, 10) <= 0) return;
    onConfirm(parseInt(quantity, 10));
  };

  const toggleCurrency = () => setShowInNero(!showInNero);

  if (!isOpen) return null;
  if (!listing) return null;

  const isWalletConnected = !!walletInfo;
  const canPurchase = !quantityError && quantity && parseInt(quantity, 10) > 0 && purchaseStatus.state !== 'pending';

  const totalNero = parseFloat(formatNeroPrice(totalCostWei));
  const totalUsd = convertNeroToUsd(totalNero, 1 / neroRate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-md shadow-xl text-slate-50 overflow-hidden">
        <div className="border-b border-slate-700 p-4 flex justify-between items-center bg-slate-700/50">
          <h2 className="text-lg font-semibold">Buy Crop Token on {chainName} (#{listing.id})</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" disabled={purchaseStatus.state === 'pending'}>
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-blue-900/30 border border-blue-700 p-2 rounded text-xs text-blue-300 flex items-start gap-2">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              Transactions on {chainName} require NERO tokens. 
              Click on currency values to toggle between USD and NERO display.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span>Crop:</span><span className="font-medium text-right">{listing.cropType}</span>
            <span>Producer:</span><span className="font-medium text-right">{listing.farmerName}</span>
            <span>Price/kg:</span>
            <button 
              onClick={toggleCurrency}
              className="font-medium text-right flex items-center justify-end gap-1 hover:text-amber-400 transition-colors"
              title="Click to toggle currency"
            >
              {showInNero ? (
                <>
                  <NerochainIcon className="h-3 w-3" />
                  <span>{listing.displayPriceNERO} NERO</span>
                </>
              ) : (
                <>
                  <DollarSign className="h-3 w-3" />
                  <span>${listing.displayPriceUSD} USD</span>
                </>
              )}
            </button>
            <span>Available:</span><span className="font-medium text-right">{listing.quantity} kg</span>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-1">Quantity to Buy (kg)</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={listing.quantity}
              className={`bg-slate-700 border ${quantityError ? 'border-red-500' : 'border-slate-600'} rounded p-2 w-full text-right focus:ring-2 focus:ring-amber-500 focus:border-amber-500`}
              placeholder="0"
              disabled={purchaseStatus.state === 'pending'}
            />
            {quantityError && <p className="text-red-500 text-xs mt-1 text-right">{quantityError}</p>}
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Cost:</span>
              <button 
                onClick={toggleCurrency}
                className="flex items-center gap-1 hover:text-amber-400 transition-colors"
                title="Click to toggle currency"
              >
                {showInNero ? (
                  <>
                    <NerochainIcon className="h-4 w-4" />
                    <span>{formatNeroPrice(totalCostWei)} NERO</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    <span>${totalUsd.toFixed(2)} USD</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between text-xs text-slate-400 items-center">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Rate: 1 USD = {isRateLoading ? "..." : neroRate.toFixed(2)} NERO
              </span>
              <button 
                onClick={fetchConversionRate} 
                className="text-slate-400 hover:text-amber-400 transition-colors text-xs"
                disabled={isRateLoading}
              >
                {isRateLoading ? "Updating..." : "Refresh"}
              </button>
            </div>
          </div>

          {purchaseStatus.state !== 'idle' && (
            <div className={`mt-4 p-3 rounded-md border text-sm flex items-start gap-2 ${
              purchaseStatus.state === 'pending' ? 'bg-blue-900/30 border-blue-700 text-blue-300' :
              purchaseStatus.state === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' :
              'bg-red-900/30 border-red-700 text-red-300'
            }`}>
              {purchaseStatus.state === 'pending' && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
              {purchaseStatus.state === 'success' && <CheckCircle className="h-4 w-4 flex-shrink-0" />}
              {purchaseStatus.state === 'error' && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
              <span className="break-words">{purchaseStatus.message}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-4 flex justify-end space-x-3 bg-slate-700/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors text-sm"
            disabled={purchaseStatus.state === 'pending'}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className={`px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors text-sm text-white font-medium flex items-center ${
              !canPurchase ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"
            }`}
            disabled={!canPurchase}
          >
            {purchaseStatus.state === 'pending' ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              "Confirm Purchase"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseModal;
