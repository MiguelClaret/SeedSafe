"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Leaf,
  Calendar,
  MapPin,
  User,
  Archive,
  Award,
  Droplet,
  Crop,
  Thermometer,
  ChevronUp,
  ChevronDown,
  DollarSign,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import {
  getNeroRate,
  convertUsdToNero,
  formatNero,
  formatUsd,
  NEROCHAIN_ICON_SVG,
} from "../../services/NeroConverter";
import ChatModal from "./ChatModal"; // Importar o componente de chat

// Define the Nerochain Icon component (usando os dados do serviço)
const NerochainIcon = (props) => {
  return (
    <svg {...NEROCHAIN_ICON_SVG} {...props}>
      {NEROCHAIN_ICON_SVG.children.map((child, index) => {
        if (child.tag === "circle") {
          return <circle key={index} {...child.props} />;
        } else if (child.tag === "path") {
          return <path key={index} {...child.props} />;
        }
        return null;
      })}
    </svg>
  );
};

// Dados de exemplo para quando o listing não tiver valores
const EXAMPLE_PRICES = {
  Coffee: 5.25,
  Soybean: 0.85,
  Corn: 0.65,
  Rice: 1.2,
  Wheat: 0.9,
  Unknown: 1.0,
};

const CropCard = ({ listing = {}, onInvestClick }) => {
  // Determinando preço exemplo com base no tipo de cultivo
  const cropType = listing?.cropType || "Unknown";
  const examplePrice = EXAMPLE_PRICES[cropType] || EXAMPLE_PRICES["Unknown"];
  const exampleTotalValue = examplePrice * (listing?.quantity || 1000);

  // Aplicar valores padrão para evitar erros se o listing estiver incompleto
  const safeListingData = {
    id: listing?.id || 0,
    cropType: cropType,
    quantity: listing?.quantity || 1000,
    harvestDate: listing?.harvestDate || new Date().toISOString(),
    location: listing?.location || "Unknown",
    farmerName: listing?.farmerName || "Unknown Farmer",
    farmerRating: listing?.farmerRating || 4.0,
    // Usa valores do listing se disponíveis, senão usa exemplos
    pricePerKg: listing?.pricePerKg > 0 ? listing.pricePerKg : examplePrice,
    sustainablePractices: listing?.sustainablePractices || ["organic"],
    carbonCredits: listing?.carbonCredits || 5.0,
    totalValue:
      listing?.totalValue > 0 ? listing.totalValue : exampleTotalValue,
  };

  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showInNero, setShowInNero] = useState(true);
  const [neroRate, setNeroRate] = useState(2.45);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false); // Estado para o chat

  // Buscar taxa de conversão ao carregar o componente
  useEffect(() => {
    const fetchRate = async () => {
      try {
        setIsLoading(true);
        const rate = await getNeroRate();
        setNeroRate(rate);
      } catch (error) {
        console.error("Erro ao buscar taxa:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRate();

    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Alternar entre USD e NERO
  const toggleCurrency = () => {
    setShowInNero(!showInNero);
  };

  // Abrir chat
  const openChat = () => {
    setIsChatOpen(true);
  };

  // Fechar chat
  const closeChat = () => {
    setIsChatOpen(false);
  };

  // Format the date to be more readable
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Erro ao formatar data:", e);
      return "Data Indisponível";
    }
  };

  // Generate star rating display
  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 transition-all duration-300 ${
              i < rating ? "text-amber-500 fill-amber-500" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">({rating})</span>
      </div>
    );
  };

  // Generate sustainable practices badges
  const renderPractices = (practices) => {
    const practiceLabels = {
      organic: "Organic",
      conservation: "Conservation",
      rotation: "Rotation",
      water: "Water",
    };

    const practiceIcons = {
      organic: <Leaf className="h-2.5 w-2.5 mr-0.5" />,
      conservation: <Crop className="h-2.5 w-2.5 mr-0.5" />,
      rotation: <RefreshCw className="h-2.5 w-2.5 mr-0.5" />,
      water: <Droplet className="h-2.5 w-2.5 mr-0.5" />,
    };

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {practices.map((practice) => (
          <span
            key={practice}
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-800 hover:bg-green-200 transition-all duration-300"
          >
            {practiceIcons[practice] || <Leaf className="h-2.5 w-2.5 mr-0.5" />}
            {practiceLabels[practice] || practice}
          </span>
        ))}
      </div>
    );
  };

  // Custom icon based on crop type
  const getCropIcon = (cropType) => {
    switch (cropType.toLowerCase()) {
      case "coffee":
        return <Thermometer className="h-12 w-12 text-amber-600" />;
      case "soybean":
        return <Crop className="h-12 w-12 text-yellow-600" />;
      case "corn":
        return <Crop className="h-12 w-12 text-yellow-500" />;
      case "wheat":
        return <Crop className="h-12 w-12 text-amber-500" />;
      case "rice":
        return <Droplet className="h-12 w-12 text-blue-500" />;
      default:
        return <Archive className="h-12 w-12 text-green-600" />;
    }
  };

  // Get background color based on crop type
  const getBackgroundColor = (cropType) => {
    switch (cropType.toLowerCase()) {
      case "coffee":
        return "bg-amber-50";
      case "soybean":
        return "bg-yellow-50";
      case "corn":
        return "bg-yellow-100";
      case "wheat":
        return "bg-amber-100";
      case "rice":
        return "bg-blue-50";
      default:
        return "bg-green-100";
    }
  };

  // Renderiza o preço com opção de alternar entre USD e NERO
  const renderPrice = () => {
    const priceInUSD = safeListingData.pricePerKg;
    const priceInNERO = convertUsdToNero(priceInUSD, neroRate);

    return (
      <div
        className={`flex items-center cursor-pointer ${
          isLoading ? "opacity-70" : ""
        }`}
        onClick={toggleCurrency}
        title="Clique para alternar entre USD e NERO"
      >
        {showInNero ? (
          <>
            <NerochainIcon className="h-3 w-3 mr-0.5 text-amber-700" />
            <span
              className={`text-xs font-medium ${
                isHovered ? "text-amber-800" : "text-amber-700"
              } whitespace-nowrap transition-all duration-300`}
            >
              {priceInNERO.toFixed(2)} NERO/kg
            </span>
          </>
        ) : (
          <>
            <DollarSign className="h-3 w-3 mr-0.5 text-amber-700" />
            <span
              className={`text-xs font-medium ${
                isHovered ? "text-amber-800" : "text-amber-700"
              } whitespace-nowrap transition-all duration-300`}
            >
              ${priceInUSD.toFixed(2)}/kg
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-all duration-300 h-full flex flex-col ${
          isHovered ? "shadow-xl -translate-y-1" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Card Header - Crop Image */}
        <div
          className={`${getBackgroundColor(
            safeListingData.cropType
          )} h-32 relative flex items-center justify-center flex-shrink-0 transition-all duration-300`}
        >
          {getCropIcon(safeListingData.cropType)}
          <div className="absolute top-2 right-2 bg-white rounded-full px-1.5 py-0.5 text-xs font-medium text-amber-800 flex items-center shadow hover:shadow-md transition-all duration-300 cursor-pointer">
            <Award className="h-2.5 w-2.5 mr-0.5 text-amber-500" />
            NFT
          </div>
          {/* Botão de Chat */}
          <div className="absolute top-2 left-2">
            <button
              onClick={openChat}
              className="bg-white hover:bg-gray-50 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 group chat-button-hover"
              title="Contact farmer"
            >
              <MessageCircle className="h-4 w-4 text-amber-600 group-hover:text-amber-700" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-base font-semibold text-gray-800 truncate">
              {safeListingData.quantity}kg {safeListingData.cropType}
            </h3>
            {renderPrice()}
          </div>

          <div className="flex items-center mb-0.5 text-xs text-gray-600">
            <User className="h-3 w-3 text-gray-500 mr-0.5 flex-shrink-0" />
            <span className="truncate">{safeListingData.farmerName}</span>
            <span className="mx-1">•</span>
            {renderRating(safeListingData.farmerRating)}
          </div>

          <div className="flex items-center mb-0.5 text-xs text-gray-600">
            <MapPin className="h-3 w-3 text-gray-500 mr-0.5 flex-shrink-0" />
            <span className="truncate">{safeListingData.location}</span>
          </div>

          <div className="flex items-center mb-2 text-xs text-gray-600">
            <Calendar className="h-3 w-3 text-gray-500 mr-0.5 flex-shrink-0" />
            <span className="truncate">
              Harvest by {formatDate(safeListingData.harvestDate)}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-2 mb-2 mt-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-medium text-gray-600 hover:text-amber-700 transition-colors duration-300 flex items-center"
              >
                {showDetails ? (
                  <>
                    Details <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Details <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </button>
              <span className="text-xs font-medium text-green-700">
                {safeListingData.carbonCredits} TCO2e
              </span>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                showDetails ? "max-h-36 opacity-100 mt-2" : "max-h-0 opacity-0"
              }`}
            >
              {showDetails && (
                <>
                  <div className="text-xs text-gray-600 mb-1 flex justify-between">
                    <span>Total Value:</span>
                    <span>
                      {showInNero
                        ? `${convertUsdToNero(
                            safeListingData.totalValue,
                            neroRate
                          ).toFixed(2)} NERO`
                        : `$${safeListingData.totalValue.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    <span className="flex items-center text-gray-400">
                      <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                      Taxa: 1 USD = {isLoading ? "..." : neroRate.toFixed(2)} NERO
                    </span>
                  </div>
                  {renderPractices(safeListingData.sustainablePractices)}
                </>
              )}
            </div>
          </div>

          {/* Área de botões */}
          <div className="space-y-2 mt-auto">
            {/* Chat Button */}
            <button
              onClick={openChat}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-md font-medium transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden group"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="relative z-10">Contact Farmer</span>
              <div className="absolute inset-0 bg-green-700 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out"></div>
            </button>

            {/* Botão de Investir */}
            <button
              onClick={() => onInvestClick && onInvestClick(safeListingData)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-1.5 px-3 rounded-md font-medium transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden group"
            >
              <span className="relative z-10">Invest Now</span>
              <div className="absolute inset-0 bg-amber-700 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Chat */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={closeChat}
        farmerName={safeListingData.farmerName}
        cropType={safeListingData.cropType}
      />
    </>
  );
};

export default CropCard;