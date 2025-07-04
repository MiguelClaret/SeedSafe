"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Search,
  Leaf,
  RefreshCw as RefreshIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import PurchaseModal from "./PurchaseModal";
import CropCard from "./CropCard";
import HarvestManagerABI from "../../abi/abiHarvest.json";
import HarvestMarketABI from "../../abi/abiMarket.json";

const harvestManagerAddress = "0xE1F625A0787753F9A1bF82561c2F3C3666c4381c";
const harvestMarketAddress = "0x385eD0FD6F6e514d96F9e2EFf5B9843592e3bfeF";
const NERO_RPC_URL = "https://rpc-testnet.nerochain.io";
const NERO_CHAIN_ID = 689;
const NERO_USD_RATE = 0.000134;

const formatPrice = (priceInWei) => {
  if (!priceInWei) return "0";
  return ethers.utils.formatUnits(priceInWei, 18);
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  const time = typeof timestamp?.toNumber === "function" ? timestamp.toNumber() : parseInt(timestamp);
  if (!time) return "N/A";
  return new Date(time * 1000).toLocaleDateString();
};

const parseDocumentation = (docString) => {
  if (!docString || typeof docString !== "string") {
    return { location: "Unknown", area: 0, sustainablePractices: [] };
  }
  const loc = docString.match(/Localiza..o: (.*?), ..rea:/);
  const area = docString.match(/..rea: ([0-9.]+)ha/);
  const practices = docString.match(/Pr.ticas: (.*)/);
  return {
    location: loc ? loc[1] : "Unknown",
    area: area ? parseFloat(area[1]) : 0,
    sustainablePractices: practices ? practices[1].split(",").map((p) => p.trim()) : [],
  };
};

const calculateCarbonCredits = (practices, area) => {
  const credits = { organic: 1.2, conservation: 0.8, rotation: 0.6, water: 0.4 };
  let total = 0;
  practices.forEach((p) => {
    if (credits[p]) total += credits[p];
  });
  return (total * (parseFloat(area) || 1)).toFixed(2);
};

const Marketplace = ({ walletInfo }) => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState({ state: "idle", message: "" });
  const [isApproved, setIsApproved] = useState(false);

  const provider = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const fetchHarvests = async () => {
      if (!provider) return;

      setIsLoading(true);
      try {
        const rpc = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
        const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, rpc);
        const allHarvests = await contract.getAllHarvests();

        const validated = allHarvests
          .map((h, index) => ({ ...h, id: index }))
          .filter((h) => Number(h.status) === 1); // 1 = VALIDATED

        const data = await Promise.all(
          validated.map(async (h) => {
            const doc = parseDocumentation(h.documentation);
            const credits = calculateCarbonCredits(doc.sustainablePractices, doc.area);
            const priceNero = formatPrice(h.pricePerUnit);

            return {
              id: h.id,
              cropType: h.crop,
              quantity: parseInt(h.quantity),
              pricePerUnit: h.pricePerUnit,
              displayPriceNERO: priceNero,
              displayPriceUSD: (parseFloat(priceNero) * NERO_USD_RATE).toFixed(2),
              harvestDate: formatDate(h.deliveryDate),
              producerAddress: h.producer,
              farmerName: `Producer ${h.producer.slice(0, 6)}...`,
              location: doc.location,
              area: doc.area,
              sustainablePractices: doc.sustainablePractices,
              carbonCredits: parseFloat(credits),
            };
          })
        );

        setListings(data);
      } catch (err) {
        console.error("Erro ao buscar dados da blockchain:", err);
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHarvests();
  }, [provider]);

  useEffect(() => {
    const filtered = listings.filter((l) =>
      l.cropType.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredListings(filtered);
  }, [searchQuery, listings]);

  useEffect(() => {
    const checkApproval = async () => {
      if (!window.ethereum || walletInfo?.role !== "producer") return;

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const account = await signer.getAddress();

      const harvestContract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, provider);
      const approved = await harvestContract.isApprovedForAll(account, harvestMarketAddress);
      setIsApproved(approved);
    };

    checkApproval();
  }, [walletInfo]);

  const handleApproval = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const harvestContract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, signer);
    const tx = await harvestContract.setApprovalForAll(harvestMarketAddress, true);
    await tx.wait();
    setIsApproved(true);
  };

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleInvestClick = (listing) => {
    setSelectedListing(listing);
    setPurchaseStatus({ state: "idle", message: "" });
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async (purchaseAmount) => {
    if (!window.ethereum || !selectedListing) {
      setPurchaseStatus({ state: "error", message: "Wallet not connected or no listing selected." });
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      if (network.chainId !== NERO_CHAIN_ID) {
        setPurchaseStatus({ state: "error", message: `Switch to NERO Chain (Chain ID: ${NERO_CHAIN_ID})` });
        return;
      }

      const amount = ethers.BigNumber.from(purchaseAmount);
      const total = selectedListing.pricePerUnit.mul(amount);

      setPurchaseStatus({ state: "pending", message: "Awaiting wallet confirmation..." });

      const marketContract = new ethers.Contract(
        harvestMarketAddress,
        HarvestMarketABI,
        signer
      );

      const tx = await marketContract.buy(selectedListing.id, amount, { value: total });

      setPurchaseStatus({
        state: "pending",
        message: `Transaction sent: ${tx.hash}. Waiting for confirmation...`,
      });

      await tx.wait();

      setPurchaseStatus({ state: "success", message: `Purchase successful! Tx: ${tx.hash}` });

      setTimeout(() => {
        setShowPurchaseModal(false);
        setPurchaseStatus({ state: "idle", message: "" });
      }, 3000);
    } catch (err) {
      console.error("Transaction failed:", err);
      let message = "Transaction failed.";
      if (err?.code === 4001) message = "Transaction rejected in wallet.";
      else if (err?.reason) message = err.reason;
      else if (err?.message) message = err.message;
      setPurchaseStatus({ state: "error", message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center text-slate-800">
          <Leaf className="mr-2 h-8 w-8 text-green-600" />
          NERO Chain Marketplace
        </h1>
        {walletInfo?.role === "producer" && (
          <Link to="/register" className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700">
            Register Crop
          </Link>
        )}
      </div>

      {walletInfo?.role === "producer" && !isApproved && (
        <button onClick={handleApproval} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 mb-4">
          🔓 Aprovar contrato de vendas
        </button>
      )}

      {walletInfo?.role === "producer" && isApproved && (
        <div className="text-green-700 mb-4">✅ Contrato de vendas aprovado</div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search crops..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10 pr-4 py-2 border rounded-md w-full shadow-sm"
          />
        </div>
      </div>

      <div className="mb-4 text-gray-600 flex items-center">
        {isLoading ? (
          <>
            <RefreshIcon className="mr-2 h-4 w-4 animate-spin text-green-600" />
            Loading from NERO Chain...
          </>
        ) : (
          `Found ${filteredListings.length} results`
        )}
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <CropCard key={listing.id} listing={listing} onInvestClick={handleInvestClick} />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center mt-12">No crops found.</div>
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
    </div>
  );
};

export default Marketplace;