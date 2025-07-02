"use client";

import { useState } from "react";
import {
  Leaf, MapPin, Calendar, User, Award, Droplet, Crop,
  RefreshCw, Thermometer, ChevronUp, ChevronDown
} from "lucide-react";

const CropCard = ({ listing = {}, onInvestClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const {
    cropType = "Unknown",
    quantity = 0,
    displayPriceNERO = "0.00",
    carbonCredits = 0,
    location = "Unknown",
    harvestDate = "N/A",
    farmerName = "Anonymous",
    sustainablePractices = [],
  } = listing;

  const getCropIcon = (cropType) => {
    switch (cropType.toLowerCase()) {
      case "coffee": return <Thermometer className="h-12 w-12 text-amber-600" />;
      case "soybean": return <Crop className="h-12 w-12 text-yellow-600" />;
      case "corn": return <Crop className="h-12 w-12 text-yellow-500" />;
      case "wheat": return <Crop className="h-12 w-12 text-amber-500" />;
      case "rice": return <Droplet className="h-12 w-12 text-blue-500" />;
      default: return <Crop className="h-12 w-12 text-green-600" />;
    }
  };

  const renderPractices = (practices) => {
    const labels = {
      organic: "Organic",
      conservation: "Conservation",
      rotation: "Rotation",
      water: "Water",
    };
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {practices.map((p) => (
          <span key={p} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
            {labels[p] || p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border p-4 flex flex-col h-full transition-transform duration-300 ${
        isHovered ? "shadow-lg -translate-y-1" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold">{quantity}kg {cropType}</div>
        <div className="text-sm font-medium text-amber-700">{displayPriceNERO} NERO/kg</div>
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-1">
        <User className="h-4 w-4 mr-1" />
        {farmerName}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-1">
        <MapPin className="h-4 w-4 mr-1" />
        {location}
      </div>

      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Calendar className="h-4 w-4 mr-1" />
        Harvest: {harvestDate}
      </div>

      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-500 hover:text-amber-600 flex items-center"
        >
          {showDetails ? "Hide Details" : "View Details"}
          {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </button>
        <span className="text-xs text-green-700">{carbonCredits} TCO₂e</span>
      </div>

      {showDetails && (
        <div className="mb-3">{renderPractices(sustainablePractices)}</div>
      )}

      <button
        onClick={() => onInvestClick && onInvestClick(listing)}
        className="mt-auto bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md text-sm font-medium"
      >
        Invest Now
      </button>
    </div>
  );
};

export default CropCard;
