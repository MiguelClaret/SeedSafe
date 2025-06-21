import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  Calendar,
  MapPin,
  ArrowRight,
  Droplets,
  Sprout,
  Recycle,
  Wind,
  Info,
  HelpCircle,
  Lock,
  Shield,
  Loader,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import SecurityInfoCard from "./SecurityInfoCard";
import UploadCropFile from "./uploadComponent";


// Tooltip component
const Tooltip = ({ children, content, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute ${positions[position]} z-50 bg-gray-800 text-white text-xs rounded py-1 px-2 max-w-xs shadow-lg`}
        >
          {content}
          <div
            className={`absolute ${
              position === "top"
                ? "top-full left-1/2 transform -translate-x-1/2 -mt-1"
                : position === "bottom"
                ? "bottom-full left-1/2 transform -translate-x-1/2 mb-1"
                : position === "left"
                ? "left-full top-1/2 transform -translate-y-1/2 ml-1"
                : "right-full top-1/2 transform -translate-y-1/2 mr-1"
            } border-4 ${
              position === "top"
                ? "border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent"
                : position === "bottom"
                ? "border-b-gray-800 border-r-transparent border-t-transparent border-l-transparent"
                : position === "left"
                ? "border-l-gray-800 border-r-transparent border-t-transparent border-b-transparent"
                : "border-r-gray-800 border-l-transparent border-t-transparent border-b-transparent"
            }`}
          ></div>
        </div>
      )}
    </div>
  );
};

const SustainablePracticeCard = ({
  id,
  title,
  description,
  icon: Icon,
  isSelected,
  onChange,
  disabled,
}) => {
  return (
    <div
      className={`cursor-pointer rounded-lg p-4 transition-all duration-300 border ${
        isSelected
          ? "border-green-500 bg-green-50 shadow-[0_0_15px_rgba(74,222,128,0.5)]"
          : "border-gray-200 bg-white hover:bg-gray-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && onChange(id, !isSelected)}
    >
      <div className="flex items-start">
        <div
          className={`p-2 rounded-full ${
            isSelected ? "bg-green-100" : "bg-gray-100"
          } mr-3`}
        >
          <Icon
            className={`h-5 w-5 ${
              isSelected ? "text-green-600 animate-pulse" : "text-gray-500"
            }`}
          />
        </div>
        <div>
          <h4
            className={`font-medium mb-1 ${
              isSelected ? "text-green-700" : "text-gray-800"
            }`}
          >
            {title}
          </h4>
          <p
            className={`text-xs ${
              isSelected ? "text-green-600" : "text-gray-500"
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

const CropForm = ({
  formData,
  handleInputChange,
  handleCheckboxChange,
  handleStepOneSubmit,
  isProcessing = false,
  transactionHash = null,
  registrationComplete = false,
  handleNextStep,
}) => {
  const navigate = useNavigate();


  const handleFileUpload = (links) => {
    console.log("Links recebidos do filho:", links);
    formData.doc = links
  };

  // LOG PROPS PARA DEBUG
  console.log("[CropForm] Props recebidas no início do render:", {
    isProcessing,
    registrationComplete,
    transactionHash,
  });

  useEffect(() => {
    console.log(
      "[CropForm] useEffect DETECTED isProcessing prop change TO:",
      isProcessing
    );
  }, [isProcessing]);

  // Map to track which cards are selected
  const [selectedPractices, setSelectedPractices] = useState(
    formData.sustainablePractices || []
  );

  // Form validation state
  const [dateError, setDateError] = useState("");
  const [areaError, setAreaError] = useState("");

  // State for copy feedback
  const [copyStatus, setCopyStatus] = useState("");

  // Function to copy hash to clipboard
  const copyToClipboard = (hash, e) => {
    // Pare a propagação do evento para evitar que o formulário seja submetido
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    navigator.clipboard
      .writeText(hash)
      .then(() => {
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus(""), 2000);
      })
      .catch(() => {
        setCopyStatus("Failed to copy");
        setTimeout(() => setCopyStatus(""), 2000);
      });
  };

  // Handle card selection
  const handlePracticeSelection = (practiceId, isSelected) => {
    // Não permitir alteração se o formulário estiver em processamento ou completo
    if (isProcessing || registrationComplete) return;

    let updatedPractices = [...selectedPractices];

    if (isSelected) {
      updatedPractices.push(practiceId);
    } else {
      updatedPractices = updatedPractices.filter((id) => id !== practiceId);
    }

    setSelectedPractices(updatedPractices);

    // Update the form data via the parent component's handler
    const mockEvent = {
      target: {
        name: "sustainablePractices",
        value: practiceId,
        checked: isSelected,
      },
    };
    handleCheckboxChange(mockEvent);
  };

  // Validate harvest date is in the future
  const validateDate = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();

    // Clear hours, minutes, seconds for comparison
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setDateError("Harvest date must be in the future");
    } else {
      setDateError("");
    }

    // Still update the form data
    handleInputChange(e);
  };

  // Validate farm area is a positive number
  const validateArea = (e) => {
    const area = parseFloat(e.target.value);

    if (isNaN(area) || area <= 0) {
      setAreaError("Farm area must be a positive number");
    } else {
      setAreaError("");
    }

    // Still update the form data
    handleInputChange(e);
  };

  // Override submit to check validation
  const onSubmit = (e) => {
    e.preventDefault();
    console.log("[CropForm] Submit button clicked");
    // Check validation errors before submitting
    if (dateError || areaError) {
      return;
    }
    // If registration is complete and user clicks "Next Step"
    // O botão "Next Step" agora está dentro do modal de sucesso e tem seu próprio onClick.
    // Esta lógica de onSubmit deve focar apenas no registro da safra.
    if (registrationComplete) {
      console.log(
        "[CropForm] Registration is already complete. Preventing re-submission."
      );
      return; // Impede re-submissão se o registro já estiver completo
    }

    // If registration is complete and user clicks "Next Step"
    // O botão "Next Step" agora está dentro do modal de sucesso e tem seu próprio onClick.
    // Esta lógica de onSubmit deve focar apenas no registro da safra.
    if (registrationComplete) {
      console.log(
        "[CropForm] Registration is already complete. Preventing re-submission."
      );
      return; // Impede re-submissão se o registro já estiver completo
    }
    handleStepOneSubmit(e);
  };

  // Function to display a shortened version of the transaction hash
  const shortenHash = (hash) => {
    if (!hash) return "";
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // List of sustainable practices with descriptions
  const sustainablePractices = [
    {
      id: "organic",
      title: "Organic Farming",
      description:
        "No synthetic pesticides or fertilizers, increasing carbon sequestration",
      icon: Sprout,
    },
    {
      id: "conservation",
      title: "Conservation Tillage",
      description:
        "Minimal soil disturbance, preserving soil carbon and reducing emissions",
      icon: Recycle,
    },
    {
      id: "rotation",
      title: "Crop Rotation",
      description:
        "Diverse planting cycles that enhance soil health and carbon storage",
      icon: Wind,
    },
    {
      id: "water",
      title: "Water Conservation",
      description:
        "Efficient irrigation systems reducing water use and energy consumption",
      icon: Droplets,
    },
  ];

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-semibold text-green-800 mb-4">
        Crop Details
      </h2>

      {/* Security information card - expandable */}
      <SecurityInfoCard />

      <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <Lock className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <p className="text-green-700 text-sm font-medium">
              Blockchain Secured Registration Process
            </p>
            <p className="text-green-700 text-xs mt-1">
              All data is encrypted and stored on NERO Chain. Your crop
              information can only be accessed by authorized participants and
              can never be tampered with or modified.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-100">
        <p className="text-amber-700 text-sm">
          <span className="font-semibold">Token Combo:</span> For each crop
          token, you'll receive a Carbon Credit token based on your sustainable
          practices. These tokens form an NFT Combo that can be traded in our
          marketplace.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Crop Type
            </label>
            <Tooltip
              content="Selecting your crop type helps investors understand what they're supporting and determines the optimal sustainable practices."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <select
            name="cropType"
            value={formData.cropType}
            onChange={handleInputChange}
            className="w-full p-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
            disabled={isProcessing || registrationComplete}
          >
            <option value="">Select crop type</option>
            <option value="Coffee">Coffee</option>
            <option value="Soybean">Soybean</option>
            <option value="Corn">Corn</option>
            <option value="Wheat">Wheat</option>
            <option value="Rice">Rice</option>
          </select>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Estimated Quantity (kg)
            </label>
            <Tooltip
              content="This will determine how many tokens are generated. Each token represents 1kg of your harvest."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            className="w-full p-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g. 1000"
            required
            disabled={isProcessing || registrationComplete}
          />
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Verified by a smart contract on the blockchain</span>
          </p>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              <Info className="h-4 w-4 inline mr-1 text-green-600" />
              Farm Area (hectares)
            </label>
            <Tooltip
              content="Your farm area is used to calculate carbon credits. Larger areas with sustainable practices generate more carbon tokens."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <input
            type="number"
            name="area"
            value={formData.area}
            onChange={validateArea}
            className={`w-full p-2 bg-white text-gray-800 border ${
              areaError ? "border-red-500" : "border-gray-300"
            } rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500`}
            placeholder="e.g. 5.5"
            step="0.1"
            min="0.1"
            required
            disabled={isProcessing || registrationComplete}
          />
          {areaError && (
            <p className="text-red-500 text-xs mt-1">{areaError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This information is needed to calculate carbon credits
          </p>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4 inline mr-1 text-green-600" />
              Expected Harvest Date
            </label>
            <Tooltip
              content="This determines when investors will receive their share of the harvest. The smart contract will automatically distribute tokens on this date."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <input
            type="date"
            name="harvestDate"
            value={formData.harvestDate}
            onChange={validateDate}
            className={`w-full p-2 bg-white text-gray-800 border ${
              dateError ? "border-red-500" : "border-gray-300"
            } rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500`}
            required
            disabled={isProcessing || registrationComplete}
          />
          {dateError && (
            <p className="text-red-500 text-xs mt-1">{dateError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3 text-green-600" />
            <span>Blockchain enforced delivery date</span>
          </p>
        </div>

        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4 inline mr-1 text-green-600" />
              Farm Location
            </label>
            <Tooltip
              content="Your location is stored securely and used to verify regional sustainability practices. Only public data is visible to investors."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full p-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="City, State"
            required
            disabled={isProcessing || registrationComplete}
          />
        </div>
        <div>
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <Tooltip
              content="Choose how you'd like to pay for the transaction fee. Native token, ERC20 or NFT."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <select
            name="paymentType"
            value={formData.paymentType || "0"}
            onChange={handleInputChange}
            className="w-full p-2 bg-white text-gray-800 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
            disabled={isProcessing || registrationComplete}
          >
            <option value="0">Native Token</option>
            <option value="1">ERC20 Token</option>
            <option value="2">NFT</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose how to pay for the gas of this transaction.
          </p>
        </div>

        <UploadCropFile onUploadComplete={handleFileUpload} />


        <div className="sustainable-practices-container">
          <div className="flex items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              <Leaf className="h-4 w-4 inline mr-1 text-green-600" />
              Sustainable Practices (Select all that apply)
            </label>
            <Tooltip
              content="Each sustainable practice increases your carbon credit generation, providing additional income beyond your crop sales."
              position="right"
            >
              <HelpCircle className="h-4 w-4 text-gray-400 ml-1 cursor-help" />
            </Tooltip>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Each practice increases your carbon credit allocation and improves
            your NFT value.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sustainablePractices.map((practice) => (
              <SustainablePracticeCard
                key={practice.id}
                id={practice.id}
                title={practice.title}
                description={practice.description}
                icon={practice.icon}
                isSelected={selectedPractices.includes(practice.id)}
                onChange={handlePracticeSelection}
                disabled={isProcessing || registrationComplete}
              />
            ))}
          </div>
        </div>

        {/* Loading and Success States */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <Loader className="h-8 w-8 animate-spin text-green-600 mb-4" />
              <p className="text-lg font-medium text-gray-800">
                Processing your registration...
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {registrationComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-md">
              <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Great! Your crop was registered!
              </h3>
              <p className="text-gray-600 text-center mb-4">
                Your crop has been successfully registered on the blockchain.
              </p>
              {transactionHash && (
                <div className="w-full bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Transaction Hash:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 p-2 rounded flex-1 overflow-hidden text-ellipsis">
                      {shortenHash(transactionHash)}
                    </code>
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(transactionHash, e)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                    >
                      {copyStatus ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => navigate("/marketplace")}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Marketplace
              </button>
            </div>
          </div>
        )}

        {/* Submit Button - só é mostrado se o registro não estiver completo */}
        {!registrationComplete && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProcessing || dateError || areaError}
              className={`py-3 px-6 rounded-lg text-white font-medium flex items-center gap-2 ${
                isProcessing || dateError || areaError
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Register Crop
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CropForm;
