// pages/Marketplace.jsx
"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Search,
  Leaf,
  RefreshCw as RefreshIcon,
  Unlock,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import PurchaseModal from "./PurchaseModal";
import CropCard from "./CropCard";
import ChatModal from "./ChatModal";
import HarvestManagerABI from "../../abi/abiHarvest.json";
import HarvestMarketABI from "../../abi/abiMarket.json";

const harvestManagerAddress = "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437";
const harvestMarketAddress = "0x010d5a89e02e16C9bfE48d2fc99D0D4C535FE15D";
const NERO_RPC_URL = "https://rpc-testnet.nerochain.io";
const NERO_CHAIN_ID = 689;
const NERO_USD_RATE = 0.000134;

const Marketplace = ({ walletInfo }) => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState({ state: "idle", message: "" });
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatListing, setChatListing] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const provider = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const formatPrice = (priceInWei) => ethers.utils.formatUnits(priceInWei || 0, 18);

  const parseDocumentation = (docString) => {
    const loc = docString.match(/Localiza..o: (.*?), ..rea:/);
    const area = docString.match(/..rea: ([0-9.]+)ha/);
    const practices = docString.match(/Pr.ticas: (.*)/);
    return {
      location: loc ? loc[1] : "Unknown",
      area: area ? parseFloat(area[1]) : 0,
      sustainablePractices: practices ? practices[1].split(",").map(p => p.trim()) : [],
    };
  };

  const fetchHarvests = async () => {
    setIsLoading(true);
    try {
      const rpc = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
      const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, rpc);
      const allHarvests = await contract.getAllHarvests();

      const validated = allHarvests
        .map((h, index) => ({ ...h, id: index }))
        .filter((h) => Number(h.status) === 1); // 1 = VALIDATED

      const mapped = validated.map((h) => {
        const doc = parseDocumentation(h.documentation);
        const credits = doc.sustainablePractices.length * doc.area;
        const priceNero = formatPrice(h.pricePerUnit);

        return {
          id: h.id,
          cropType: h.crop,
          quantity: parseInt(h.quantity),
          pricePerUnit: h.pricePerUnit,
          displayPriceNERO: priceNero,
          displayPriceUSD: (parseFloat(priceNero) * NERO_USD_RATE).toFixed(2),
          harvestDate: new Date(h.deliveryDate * 1000).toLocaleDateString(),
          producerAddress: h.producer,
          location: doc.location,
          area: doc.area,
          sustainablePractices: doc.sustainablePractices,
          carbonCredits: credits.toFixed(2),
        };
      });
      setListings(mapped);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHarvests(); }, [provider]);
  useEffect(() => {
    setFilteredListings(
      listings.filter((l) => l.cropType.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, listings]);

  const handleAuthorizeTokens = async () => {
    try {
      setAuthLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, signer);
      const approved = await contract.isApprovedForAll(await signer.getAddress(), harvestMarketAddress);
      if (!approved) {
        const tx = await contract.setApprovalForAll(harvestMarketAddress, true);
        await tx.wait();
        alert("✅ Tokens autorizados para o marketplace!");
      } else {
        alert("✅ Tokens já estavam autorizados.");
      }
    } catch (err) {
      console.error("Erro ao autorizar tokens:", err);
      alert("Erro ao autorizar tokens.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePurchaseConfirm = async (amount) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const total = selectedListing.pricePerUnit.mul(amount);
      const contract = new ethers.Contract(harvestMarketAddress, HarvestMarketABI, signer);

      setPurchaseStatus({ state: "pending", message: "Confirmando na carteira..." });
      const tx = await contract.buy(selectedListing.id, amount, { value: total });
      await tx.wait();
      setPurchaseStatus({ state: "success", message: "Compra concluída!" });
      setTimeout(() => setShowPurchaseModal(false), 3000);
    } catch (err) {
      console.error("Erro na compra:", err);
      setPurchaseStatus({ state: "error", message: err?.message || "Erro ao comprar" });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center text-slate-800">
          <Leaf className="mr-2 h-8 w-8 text-green-600" /> Marketplace
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleAuthorizeTokens}
            disabled={authLoading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            {authLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
            Autorizar Tokens
          </button>
          <Link
            to="/register"
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
          >
            Registrar Safra
          </Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar safra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md w-full shadow-sm"
          />
        </div>
      </div>

      <div className="mb-4 text-gray-600 flex items-center">
        {isLoading ? (
          <>
            <RefreshIcon className="mr-2 h-4 w-4 animate-spin text-green-600" />
            Carregando safra...
          </>
        ) : (
          `Encontradas ${filteredListings.length} safras disponíveis`
        )}
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <CropCard
              key={listing.id}
              listing={listing}
              onInvestClick={() => {
                setSelectedListing(listing);
                setShowPurchaseModal(true);
                setPurchaseStatus({ state: "idle", message: "" });
              }}
              onChatClick={() => {
                setChatListing(listing);
                setShowChatModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center mt-12">Nenhuma safra encontrada.</div>
      )}

      {selectedListing && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          listing={selectedListing}
          onConfirm={handlePurchaseConfirm}
          walletInfo={walletInfo}
          purchaseStatus={purchaseStatus}
          chainName="NERO Chain"
        />
      )}

      {showChatModal && chatListing && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          userId={walletInfo?.address}
          farmerId={chatListing.producerAddress}
          farmerName={chatListing.farmerName}
        />
      )}
    </div>
  );
};

export default Marketplace;
