"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { usePublicClient, useWalletClient } from "wagmi";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Leaf,
  Info,
  RefreshCw as RefreshIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import FiltersPanel from "./FiltersPanel";
import CropCard from "./CropCard";
import PurchaseModal from "./PurchaseModal";
import ChatModal from "./ChatModal"; // Adicionar import do ChatModal
import { mockListings } from "./mockData";
import MarketplaceOnboarding from "./MarketplaceOnboarding";
import BlockchainSecurityInfo from "./BlockchainSecurityInfo";
import MarketplaceHowItWorksButton from "./HowItWorksButton";

// Import ABI and contract address
import HarvestManagerABI from "../../abi/abiHarvest.json";
const harvestManagerAddress = "0xddaAd340b0f1Ef65169Ae5E41A8b10776a75482d";

// NERO Chain configuration
const NERO_RPC_URL = "https://rpc-testnet.nerochain.io";
const NERO_CHAIN_ID = 689;
const NERO_USD_RATE = 0.000134;

// Mock data function
const getMockListingsForDisplay = () => {
  const mockData = [
    {
      id: 1,
      cropType: "Coffee",
      quantity: 2500,
      harvestDate: "2025-12-15",
      location: "São Paulo, Brazil",
      farmerName: "João Silva",
      farmerRating: 4.8,
      pricePerKg: 5.25,
      sustainablePractices: ["organic", "water", "conservation"],
      carbonCredits: 12.5,
      totalValue: 13125,
      pricePerUnit: ethers.utils.parseUnits("5.25", 18),
      displayPriceNERO: "5.25",
      displayPriceUSD: "5.25",
      producer: "0x1234567890123456789012345678901234567890",
      deliveryDate: Math.floor(new Date("2025-12-15").getTime() / 1000),
      documentation: "Location: São Paulo, Brazil, Area: 10.5ha, Practices: organic,water,conservation",
      crop: "Coffee"
    },
    {
      id: 2,
      cropType: "Soybean",
      quantity: 5000,
      harvestDate: "2025-09-30",
      location: "Minas Gerais, Brazil",
      farmerName: "Maria Santos",
      farmerRating: 4.5,
      pricePerKg: 0.85,
      sustainablePractices: ["rotation", "conservation"],
      carbonCredits: 8.2,
      totalValue: 4250,
      pricePerUnit: ethers.utils.parseUnits("0.85", 18),
      displayPriceNERO: "0.85",
      displayPriceUSD: "0.85",
      producer: "0x2345678901234567890123456789012345678901",
      deliveryDate: Math.floor(new Date("2025-09-30").getTime() / 1000),
      documentation: "Location: Minas Gerais, Brazil, Area: 15.2ha, Practices: rotation,conservation",
      crop: "Soybean"
    },
    {
      id: 3,
      cropType: "Corn",
      quantity: 8000,
      harvestDate: "2025-10-20",
      location: "Goiás, Brazil",
      farmerName: "Carlos Oliveira",
      farmerRating: 4.2,
      pricePerKg: 0.65,
      sustainablePractices: ["water", "rotation"],
      carbonCredits: 6.8,
      totalValue: 5200,
      pricePerUnit: ethers.utils.parseUnits("0.65", 18),
      displayPriceNERO: "0.65",
      displayPriceUSD: "0.65",
      producer: "0x3456789012345678901234567890123456789012",
      deliveryDate: Math.floor(new Date("2025-10-20").getTime() / 1000),
      documentation: "Location: Goiás, Brazil, Area: 12.3ha, Practices: water,rotation",
      crop: "Corn"
    },
    {
      id: 4,
      cropType: "Rice",
      quantity: 3500,
      harvestDate: "2025-11-10",
      location: "Rio Grande do Sul, Brazil",
      farmerName: "Ana Pereira",
      farmerRating: 5.0,
      pricePerKg: 1.20,
      sustainablePractices: ["organic", "water", "conservation"],
      carbonCredits: 15.3,
      totalValue: 4200,
      pricePerUnit: ethers.utils.parseUnits("1.20", 18),
      displayPriceNERO: "1.20",
      displayPriceUSD: "1.20",
      producer: "0x4567890123456789012345678901234567890123",
      deliveryDate: Math.floor(new Date("2025-11-10").getTime() / 1000),
      documentation: "Location: Rio Grande do Sul, Brazil, Area: 18.7ha, Practices: organic,water,conservation",
      crop: "Rice"
    },
    {
      id: 5,
      cropType: "Wheat",
      quantity: 4500,
      harvestDate: "2025-08-15",
      location: "Paraná, Brazil",
      farmerName: "Roberto Costa",
      farmerRating: 4.3,
      pricePerKg: 0.90,
      sustainablePractices: ["conservation", "rotation"],
      carbonCredits: 9.1,
      totalValue: 4050,
      pricePerUnit: ethers.utils.parseUnits("0.90", 18),
      displayPriceNERO: "0.90",
      displayPriceUSD: "0.90",
      producer: "0x5678901234567890123456789012345678901234",
      deliveryDate: Math.floor(new Date("2025-08-15").getTime() / 1000),
      documentation: "Location: Paraná, Brazil, Area: 14.2ha, Practices: conservation,rotation",
      crop: "Wheat"
    },
    {
      id: 6,
      cropType: "Coffee",
      quantity: 1800,
      harvestDate: "2026-01-20",
      location: "Espírito Santo, Brazil",
      farmerName: "Fernanda Lima",
      farmerRating: 4.9,
      pricePerKg: 5.50,
      sustainablePractices: ["organic", "water"],
      carbonCredits: 11.7,
      totalValue: 9900,
      pricePerUnit: ethers.utils.parseUnits("5.50", 18),
      displayPriceNERO: "5.50",
      displayPriceUSD: "5.50",
      producer: "0x6789012345678901234567890123456789012345",
      deliveryDate: Math.floor(new Date("2026-01-20").getTime() / 1000),
      documentation: "Location: Espírito Santo, Brazil, Area: 8.9ha, Practices: organic,water",
      crop: "Coffee"
    }
  ];
  return mockData;
};

// Helper Functions
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
    return {
      location: 'Unknown Location',
      area: 0,
      practicesString: '',
      sustainablePractices: []
    };
  }
  const locationMatch = docString.match(/Location: ([^,]+, [^,]+)/);
  const areaMatch = docString.match(/Area: (\d+(\.\d+)?)ha/);
  const practicesMatch = docString.match(/Practices: (.*)/);
  return {
    location: locationMatch ? locationMatch[1].trim() : "Unknown Location",
    area: areaMatch ? parseFloat(areaMatch[1]) : 0,
    practicesString: practicesMatch ? practicesMatch[1].trim() : "",
    sustainablePractices: practicesMatch
      ? practicesMatch[1].split(",").map((p) => p.trim()).filter((p) => p)
      : [],
  };
};

const calculateCarbonCredits = (practices, area) => {
  const practiceCredits = {
    organic: 1.2,
    conservation: 0.8,
    rotation: 0.6,
    water: 0.4,
  };
  let totalCredits = 0;
  practices.forEach((practice) => {
    if (practiceCredits[practice]) {
      totalCredits += practiceCredits[practice];
    }
  });
  const numericArea = parseFloat(area) || 1;
  return (totalCredits * numericArea).toFixed(2);
};

const Marketplace = ({ walletInfo }) => {
  const [listings, setListings] = useState([]);
  const [formattedListings, setFormattedListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("default");
  const [selectedListing, setSelectedListing] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false); // Estado para o chat
  const [selectedChatListing, setSelectedChatListing] = useState(null); // Listing selecionado para chat
  const [useMockData, setUseMockData] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState({
    state: "idle",
    message: "",
  });
  const [filters, setFilters] = useState({
    minRating: 0,
    sustainablePractices: [],
    harvestDateBefore: null,
    cropTypes: [],
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  const provider = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Fetch data from NERO blockchain or use mock data
  useEffect(() => {
    const fetchHarvests = async () => {
      const shouldUseMock = !provider || useMockData;
      
      if (shouldUseMock) {
        console.log("🎭 Using mock data for marketplace display");
        setIsLoading(true);
        
        setTimeout(() => {
          const mockData = getMockListingsForDisplay();
          setListings(mockData);
          setError(null);
          setIsLoading(false);
          console.log("✅ Mock data loaded successfully:", mockData.length, "listings");
        }, 800);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("🌾 Connecting to NERO Chain...");
        const neroJsonRpcProvider = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
        const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, neroJsonRpcProvider);

        console.log("📡 Calling getAvailableHarvests()...");
        const rawHarvests = await contract.getAvailableHarvests();
        console.log("📦 Raw harvests from contract:", rawHarvests);
        console.log(`✅ Fetched ${rawHarvests.length} available harvests`);

        const fetchedHarvests = rawHarvests.map((h, index) => ({
          id: index,
          ...h,
        }));

        if (fetchedHarvests.length === 0) {
          console.log("📭 No blockchain data found, using mock data as fallback");
          const mockData = getMockListingsForDisplay();
          setListings(mockData);
        } else {
          setListings(fetchedHarvests);
        }
      } catch (err) {
        console.error("❌ Error fetching harvests from NERO Chain:", err);
        console.log("🎭 Falling back to mock data");
        
        const mockData = getMockListingsForDisplay();
        setListings(mockData);
        setError("Failed to load marketplace data from NERO Chain. Showing demo data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHarvests();
  }, [provider, useMockData]);

  const handleHowItWorksClick = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const toggleDataSource = () => {
    setUseMockData(!useMockData);
  };

  // Format fetched data
  useEffect(() => {
    const formatted = listings.map((harvest) => {
      const docInfo = parseDocumentation(harvest.documentation);
      const cropName = harvest.crop || harvest.cropType || "";
      const carbonCredits = calculateCarbonCredits(docInfo.sustainablePractices, docInfo.area);
      const priceInWei = harvest.pricePerUnit;
      const displayPriceNERO = formatPrice(priceInWei);
      const displayPriceUSD = (parseFloat(displayPriceNERO) * NERO_USD_RATE).toFixed(2);

      return {
        id: harvest.id,
        cropType: cropName,
        quantity: typeof harvest.quantity?.toNumber === "function" ? harvest.quantity.toNumber() : parseInt(harvest.quantity || 0),
        pricePerUnit: priceInWei,
        displayPriceNERO: displayPriceNERO,
        displayPriceUSD: displayPriceUSD,
        harvestDate: formatDate(harvest.deliveryDate),
        producerAddress: harvest.producer,
        farmerName: harvest.producer ? `Producer ${harvest.producer.substring(0, 6)}...` : harvest.farmerName || "Unknown Producer",
        location: docInfo.location,
        area: docInfo.area,
        sustainablePractices: docInfo.sustainablePractices,
        carbonCredits: parseFloat(carbonCredits),
        farmerRating: harvest.farmerRating || 4.5,
        imageUrl: `/placeholder-images/${cropName.toLowerCase()}.jpg`,
      };
    });
    setFormattedListings(formatted);
  }, [listings]);

  // Apply filters and search
  useEffect(() => {
    let results = [...formattedListings];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (l) =>
          l.cropType.toLowerCase().includes(query) ||
          l.farmerName.toLowerCase().includes(query) ||
          l.location.toLowerCase().includes(query)
      );
    }

    if (filters.minRating > 0)
      results = results.filter((l) => l.farmerRating >= filters.minRating);
    if (filters.sustainablePractices.length > 0)
      results = results.filter((l) =>
        filters.sustainablePractices.every((p) =>
          l.sustainablePractices.includes(p)
        )
      );
    if (filters.cropTypes.length > 0)
      results = results.filter((l) => filters.cropTypes.includes(l.cropType));

    if (sortOrder === "price-low")
      results.sort((a, b) => a.pricePerUnit.sub(b.pricePerUnit).toNumber());
    else if (sortOrder === "price-high")
      results.sort((a, b) => b.pricePerUnit.sub(a.pricePerUnit).toNumber());
    else if (sortOrder === "carbon")
      results.sort((a, b) => b.carbonCredits - a.carbonCredits);

    setFilteredListings(results);
  }, [searchQuery, filters, formattedListings, sortOrder]);

  const toggleFilters = () => setShowFilters(!showFilters);
  const handleSearch = (e) => setSearchQuery(e.target.value);

  const handleInvestClick = (listing) => {
    setSelectedListing(listing);
    setPurchaseStatus({ state: "idle", message: "" });
    setShowPurchaseModal(true);
  };

  const handleChatClick = (listing) => {
    setSelectedChatListing(listing);
    setShowChatModal(true);
  };

  const handleCloseChatModal = () => {
    setShowChatModal(false);
    setSelectedChatListing(null);
  };

  const handlePurchaseConfirm = async (purchaseAmount) => {
    if (!walletClient || walletInfo?.role !== "investor" || !selectedListing) {
      setPurchaseStatus({
        state: "error",
        message: "Please connect as an Investor to buy on NERO Chain.",
      });
      console.error("Investor not connected or listing not selected.");
      return;
    }

    setPurchaseStatus({
      state: "pending",
      message: "Preparing NERO Chain transaction...",
    });
    console.log(`Attempting to purchase ${purchaseAmount} units of harvest ID ${selectedListing.id} on NERO Chain`);

    try {
      const signer = walletClient;
      const network = await signer.getChainId();
      if (network !== NERO_CHAIN_ID) {
        setPurchaseStatus({
          state: "error",
          message: `Please switch to NERO Chain (Chain ID: ${NERO_CHAIN_ID})`,
        });
        return;
      }

      const contract = new ethers.Contract(harvestManagerAddress, HarvestManagerABI, signer);
      const amountToBuy = ethers.BigNumber.from(purchaseAmount);
      const totalCostInWei = selectedListing.pricePerUnit.mul(amountToBuy);

      console.log(`Calculated Total Cost on NERO Chain: ${ethers.utils.formatUnits(totalCostInWei, 18)} NERO`);

      setPurchaseStatus({
        state: "pending",
        message: "Please confirm the transaction in your wallet...",
      });

      const tx = await contract.buyToken(selectedListing.id, amountToBuy, {
        value: totalCostInWei,
      });

      setPurchaseStatus({
        state: "pending",
        message: `NERO Transaction submitted: ${tx.hash}. Waiting for confirmation...`,
      });
      console.log("NERO Transaction submitted:", tx.hash);

      const receipt = await tx.wait();
      console.log("NERO Transaction confirmed:", receipt);

      setPurchaseStatus({
        state: "success",
        message: `Purchase successful on NERO Chain! Transaction Hash: ${receipt.transactionHash}`,
      });
      setTimeout(() => setShowPurchaseModal(false), 3000);
    } catch (err) {
      console.error("NERO Chain purchase failed:", err);
      let errorMessage = "Purchase failed on NERO Chain. Check console for details.";
      if (err.reason) {
        errorMessage = `NERO Transaction failed: ${err.reason}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      if (err.code === 4001) {
        errorMessage = "Transaction rejected in wallet.";
      }
      setPurchaseStatus({ state: "error", message: errorMessage });
    }
  };

  const getAnimationDelay = (index) => `${index * 50}ms`;

  return (
    <div className="bg-white rounded-lg shadow-lg mb-5 pt-4 border border-gray-100 animate-fadeIn max-w-7xl mx-auto py-8 px-4 bg-slate-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Leaf className="mr-2 h-8 w-8 text-green-600" />
          NERO Chain Marketplace
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDataSource}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              useMockData 
                ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {useMockData ? '🎭 Mock Data' : '⛓️ Blockchain'}
          </button>
          
          {walletInfo?.role === "producer" && (
            <Link
              to="/register"
              className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
            >
              <Leaf className="mr-2 h-5 w-5" /> Register Your Crop with NERO AA
            </Link>
          )}
        </div>
      </div>

      <BlockchainSecurityInfo />
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
          <p className="text-gray-700 mb-6">
            Browse sustainable farming opportunities on NERO Chain. All transactions use the NERO token.
            {useMockData && (
              <span className="ml-2 text-purple-600 font-medium">
                (Currently showing demo data for visualization)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-grow relative search-bar">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by crop, farmer, or location"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={toggleFilters}
            className="bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center justify-center transition-all duration-300 hover:shadow-md"
          >
            <Filter className="h-5 w-5 mr-2" /> Filters{" "}
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </button>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-700 px-4 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
          >
            <option value="default">Sort: Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="carbon">Most Carbon Credits</option>
          </select>
        </div>
        <div
          className={`transition-all duration-300 overflow-hidden ${
            showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {showFilters && (
            <FiltersPanel filters={filters} setFilters={setFilters} />
          )}
        </div>
        <div className="mb-4 text-gray-600 flex items-center">
          {isLoading ? (
            <>
              <RefreshIcon className="mr-2 h-4 w-4 text-green-600 animate-spin" />{" "}
              Loading {useMockData ? 'demo' : 'NERO Chain'} listings...
            </>
          ) : (
            `Showing ${filteredListings.length} results ${useMockData ? 'from demo data' : 'from NERO Chain'}`
          )}
        </div>
      </div>

      <div className={`border px-4 py-3 rounded mb-6 flex items-start gap-3 ${
        useMockData 
          ? 'bg-purple-50 border-purple-200 text-purple-700'
          : 'bg-blue-50 border-blue-200 text-blue-700'
      }`}>
        <Info className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
          useMockData ? 'text-purple-500' : 'text-blue-500'
        }`} />
        <div>
          <p className="font-medium">
            {useMockData ? 'Demo Mode' : 'NERO Chain Platform'}
          </p>
          <p className="text-sm">
            {useMockData 
              ? 'Showing mock data for visualization and testing purposes. Switch to blockchain mode to see real listings.'
              : 'All listings are stored on NERO Chain (TestNet). Account Abstraction is available for producers.'
            }
          </p>
          {walletInfo?.isSmartAccount ? (
            <p className="text-sm mt-2">
              You are connected with a NERO Smart Account. Your transactions will be gasless.
            </p>
          ) : (
            <p className="text-sm mt-2">
              Investors need NERO tokens to purchase. Producers can use NERO AA for gasless transactions.
            </p>
          )}
        </div>
      </div>

      {!isLoading && (
        <>
          {filteredListings.length > 0 ? (
            <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-6">
              {filteredListings.map((listing, index) => (
                <div
                  key={listing.id}
                  className="opacity-0 animate-fadeIn"
                  style={{
                    animationDelay: getAnimationDelay(index),
                    animationFillMode: "forwards",
                  }}
                >
                  <CropCard
                    listing={listing}
                    onInvestClick={handleInvestClick}
                    onChatClick={handleChatClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-white rounded-lg shadow mt-6">
              <p className="text-gray-600">
                {useMockData 
                  ? "No results found in the demo data."
                  : "No validated harvests found on NERO Chain or an error occurred while fetching data."
                }
              </p>
              {error && (
                <p className="text-red-600 mt-2 text-sm">Error: {error}</p>
              )}
            </div>
          )}
        </>
      )}

      {selectedChatListing && (
        <ChatModal
          isOpen={showChatModal}
          onClose={handleCloseChatModal}
          farmerName={selectedChatListing.farmerName}
          cropType={selectedChatListing.cropType}
        />
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
      
      <MarketplaceOnboarding 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
      
      <MarketplaceHowItWorksButton onClick={handleHowItWorksClick} />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Marketplace;