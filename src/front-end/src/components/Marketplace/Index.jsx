"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Search, Filter, ChevronDown, ChevronUp, Leaf, Info, RefreshCw as RefreshIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import FiltersPanel from "./FiltersPanel";
import CropCard from "./CropCard";
import PurchaseModal from "./PurchaseModal";
import MarketplaceOnboarding from "./MarketplaceOnboarding";
import BlockchainSecurityInfo from "./BlockchainSecurityInfo";
import MarketplaceHowItWorksButton from "./HowItWorksButton";
import HarvestManagerABI from "../../abi/abiHarvest.json";

// Novo endereço real do contrato na chain:
const harvestManagerAddress = '0xE1F625A0787753F9A1bF82561c2F3C3666c4381c';
const NERO_RPC_URL = "https://rpc-testnet.nerochain.io";
const NERO_CHAIN_ID = 689;
const NERO_USD_RATE = 0.000134;

const formatPrice = (priceInWei) => {
  if (!priceInWei) return "0";
  return ethers.utils.formatUnits(priceInWei, 18);
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const time = typeof timestamp?.toNumber === 'function' ? timestamp.toNumber() : parseInt(timestamp);
  if (!time) return 'N/A';
  return new Date(time * 1000).toLocaleDateString();
};

const parseDocumentation = (docString) => {
  if (!docString || typeof docString !== 'string') {
    return { location: 'Unknown', area: 0, sustainablePractices: [] };
  }
  const loc = docString.match(/Localiza..o: (.*?), ..rea:/);
  const area = docString.match(/..rea: ([0-9.]+)ha/);
  const practices = docString.match(/Pr.ticas: (.*)/);
  return {
    location: loc ? loc[1] : "Unknown",
    area: area ? parseFloat(area[1]) : 0,
    sustainablePractices: practices ? practices[1].split(",").map(p => p.trim()) : []
  };
};

const calculateCarbonCredits = (practices, area) => {
  const credits = { organic: 1.2, conservation: 0.8, rotation: 0.6, water: 0.4 };
  let total = 0;
  practices.forEach(p => { if (credits[p]) total += credits[p]; });
  return (total * (parseFloat(area) || 1)).toFixed(2);
};

const Marketplace = ({ walletInfo }) => {
  const [listings, setListings] = useState([]);
  const [formattedListings, setFormattedListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState({ state: "idle", message: "" });

  const provider = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    const fetchHarvests = async () => {
      if (!provider) { setError("Connect wallet"); setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const rpc = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
        const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, rpc);
        const pendingIds = await contract.getPendingHarvestIds();
        console.log("Pending harvest IDs:", pendingIds);

        const data = await Promise.all(
          pendingIds.map(async (id) => {
            const h = await contract.harvests(id);
            return {
              id: id.toNumber(),
              crop: h.crop,
              quantity: h.quantity,
              pricePerUnit: h.pricePerUnit,
              deliveryDate: h.deliveryDate,
              producer: h.producer,
              status: h.status,
              harvestedAmount: h.harvestedAmount,
              documentation: h.documentation,
            };
          })
        );

        setListings(data);
      } catch (err) {
        console.error("Erro ao buscar harvests:", err);
        setError("Falha ao carregar dados da NERO Chain.");
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHarvests();
  }, [provider]);

  useEffect(() => {
    const formatted = listings.map((harvest) => {
      const docInfo = parseDocumentation(harvest.documentation);
      const cropName = harvest.crop || "";
      const carbonCredits = calculateCarbonCredits(docInfo.sustainablePractices, docInfo.area);
      const priceInWei = harvest.pricePerUnit;
      const displayPriceNERO = formatPrice(priceInWei);
      const displayPriceUSD = (parseFloat(displayPriceNERO) * NERO_USD_RATE).toFixed(2);

      return {
        id: harvest.id,
        cropType: cropName,
        quantity: parseInt(harvest.quantity || 0),
        pricePerUnit: priceInWei,
        displayPriceNERO,
        displayPriceUSD,
        harvestDate: formatDate(harvest.deliveryDate),
        producerAddress: harvest.producer,
        farmerName: `Producer ${harvest.producer.substring(0, 6)}...`,
        location: docInfo.location,
        area: docInfo.area,
        sustainablePractices: docInfo.sustainablePractices,
        carbonCredits: parseFloat(carbonCredits),
        farmerRating: 4.5,
        imageUrl: `/placeholder-images/${cropName.toLowerCase()}.jpg`,
      };
    });
    setFormattedListings(formatted);
  }, [listings]);

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const toggleFilters = () => setShowFilters(!showFilters);

  const filteredResults = formattedListings.filter((l) => {
    if (searchQuery && !l.cropType.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">NERO Chain Marketplace</h1>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchQuery}
        onChange={handleSearch}
        className="p-2 border border-gray-300 rounded"
      />

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4 mt-4">
          {filteredResults.map((listing) => (
            <div key={listing.id} className="border p-4 rounded shadow">
              <h3 className="font-bold">{listing.cropType}</h3>
              <p>Price: {listing.displayPriceNERO} NERO</p>
              <p>Quantity: {listing.quantity}</p>
              <p>Delivery Date: {listing.harvestDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
