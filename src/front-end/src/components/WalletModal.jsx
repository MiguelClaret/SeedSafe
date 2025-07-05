"use client";

import { useEffect, useState, useCallback } from "react";
// Fix for ethers import - import utils directly and ensure hexlify is available
import { ethers } from "ethers"; // Import ethers v5
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Presets } from "userop"; // Installed from github:nerochain/aa-userop-sdk
import { useConnect, useAccount, useDisconnect } from 'wagmi';
// Updated imports for Wagmi v2 connectors
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'; 
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseToTokenUnits, formatFromTokenUnits, isValidEthereumAddress } from '../utils/ethersHelpers';
import { getAAWalletAddress, isAAWalletDeployed } from '../utils/aaUtils';
import { useWeb3Auth } from "./Web3AuthContext";

import metamaskIcon from "../assets/metamask.svg";
import coinbaseIcon from "../assets/coinbase.svg";
import walletconnectIcon from "../assets/walletconnect.svg"; // Add WalletConnect icon
import neroIcon from "../assets/nero.svg"; // Add Nero icon for AA
import { Loader2 } from "lucide-react";
import { BsWallet2 } from "react-icons/bs";


// --- Configuration from .env --- 
const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
// Parse chainId safely
let chainId = 689; // Default value
const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
if (envChainId) {
  const parsed = parseInt(envChainId);
  if (!isNaN(parsed)) {
    chainId = parsed;
  } else {
    console.warn(`Invalid NEXT_PUBLIC_CHAIN_ID: ${envChainId}. Using default ${chainId}.`);
  }
} else {
  console.warn(`NEXT_PUBLIC_CHAIN_ID not set. Using default ${chainId}.`);
}

const sanitize = (str) => (str ? str.split(" ")[0].trim() : undefined);

const paymasterUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;
const entryPointAddress = sanitize(process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS);
const simpleAccountFactoryAddress = sanitize(process.env.NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY_ADDRESS);
const bundlerUrl = sanitize(process.env.NEXT_PUBLIC_BUNDLER_URL);
const paymasterApiKey = process.env.NEXT_PUBLIC_PAYMASTER_API_KEY;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
// -------------------------------

const WalletModal = ({ isOpen, onClose, onLogin }) => {
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(null); // Store the type of connection being attempted
  const [web3authInstance, setWeb3authInstance] = useState(null);
  const { openConnectModal } = useConnectModal(); // Hook from RainbowKit
  const { login: loginWeb3AuthContext } = useWeb3Auth();

  // Initialize Web3Auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        if (!web3AuthClientId) {
          console.error("Web3Auth Client ID not configured.");
          setError("Login service configuration missing (Client ID).");
          return;
        }
        if (!rpcUrl) {
           console.error("Nerochain RPC URL not configured.");
           setError("Login service configuration missing (RPC URL).");
           return;
        }

        // Ensure chainId is a valid number before hexlifying
        if (isNaN(chainId)) {
           console.error("Invalid Chain ID configured.");
           setError("Login service configuration invalid (Chain ID).");
           return;
        }

        // Create chainId hex string manually to avoid ethers utils dependency issues
        const chainIdHex = '0x' + chainId.toString(16);
        console.log(`Using chainId: ${chainId} (hex: ${chainIdHex})`);

        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chainIdHex, // Use our manually created hex string
          rpcTarget: rpcUrl,
          displayName: "Nerochain Testnet",
          blockExplorer: "https://testnet.neroscan.com", // Verify explorer URL
          ticker: "NERO",
          tickerName: "Nero",
        };

        // Initialize the privateKeyProvider first
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig }
        });

        const envNetworkKey = process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK;
        const resolvedNetwork =
          (envNetworkKey && WEB3AUTH_NETWORK[envNetworkKey]) ||
          WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

        // Then pass it to Web3Auth instance
        const web3auth = new Web3Auth({
          clientId: web3AuthClientId,
          web3AuthNetwork: resolvedNetwork, // configurável via .env
          chainConfig: chainConfig,
          privateKeyProvider: privateKeyProvider,
          uiConfig: { appName: "SeedSafe" },
        });

        await web3auth.initModal();
        setWeb3authInstance(web3auth);
        console.log("Web3Auth Initialized");
      } catch (err) {
        console.error("Web3Auth initialization error:", err);
        setError(`Failed to initialize login service: ${err.message}`);
      }
    };
    initWeb3Auth();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // --- EOA Wallet Connections (using RainbowKit) ---
  const connectEOA = () => {
    if (openConnectModal) {
      openConnectModal();
      // onClose(); // Optionally close this modal when RainbowKit opens
    } else {
      setError("Wallet connection manager not available.");
    }
  };

  // --- Account Abstraction Login (Producer) ---
  const createSmartAccount = async () => {
    setError(null);
    setConnecting("smart-account");
    if (!web3authInstance) {
      setError("Login service not initialized. Please wait or refresh.");
      setConnecting(null);
      return;
    }

    if (!entryPointAddress || !simpleAccountFactoryAddress) {
       setError("Account Abstraction configuration missing (EntryPoint/Factory).");
       setConnecting(null);
       return;
    }

    try {
      const web3authProvider = await web3authInstance.connect();
      if (!web3authProvider) {
        throw new Error("Web3Auth connection failed.");
      }

      console.log("Creating provider from web3authProvider...");
      let ethersProvider;
      
      if (ethers.providers && ethers.providers.Web3Provider) {
        console.log("Using ethers v5 Web3Provider");
        ethersProvider = new ethers.providers.Web3Provider(web3authProvider);
      } else if (ethers.BrowserProvider) {
        console.log("Using ethers v6 BrowserProvider");
        ethersProvider = new ethers.BrowserProvider(web3authProvider);
      } else {
        throw new Error("Unsupported ethers version - cannot create provider");
      }
      
      const eoaSigner = await ethersProvider.getSigner();
      const eoaAddress = await eoaSigner.getAddress();

      // Log detalhado para debug
      console.log("EOA Address received:", eoaAddress);
      console.log("EOA Address type:", typeof eoaAddress);
      console.log("EOA Address length:", eoaAddress.length);

      // Validação mais robusta do endereço EOA
      if (!eoaAddress) {
        throw new Error("Nenhum endereço EOA recebido do Web3Auth");
      }

      if (typeof eoaAddress !== 'string') {
        throw new Error(`Tipo inválido de endereço EOA: ${typeof eoaAddress}`);
      }

      if (!eoaAddress.startsWith('0x')) {
        throw new Error(`Endereço EOA inválido: deve começar com '0x'`);
      }

      if (eoaAddress.length !== 42) {
        throw new Error(`Endereço EOA inválido: comprimento incorreto (${eoaAddress.length})`);
      }

      if (!isValidEthereumAddress(eoaAddress)) {
        throw new Error(`Endereço EOA inválido: ${eoaAddress}`);
      }

      console.log("EOA Signer Address (from Web3Auth):", eoaAddress);

      // Obter endereço da conta AA
      const aaAddress = await getAAWalletAddress(eoaSigner);
      console.log("AA Address received:", aaAddress);

      if (!aaAddress) {
        throw new Error("Nenhum endereço AA gerado");
      }

      if (!isValidEthereumAddress(aaAddress)) {
        throw new Error(`Endereço AA inválido: ${aaAddress}`);
      }

      // Verificar se a conta AA já está implantada
      const isDeployed = await isAAWalletDeployed(aaAddress);
      console.log(`Smart Account ${aaAddress} deployment status:`, isDeployed);

      console.log("Initializing SimpleAccount...");
      const accountOptions = {
        entryPoint: entryPointAddress,
        factory: simpleAccountFactoryAddress,
        overrideBundlerRpc: bundlerUrl
      };
      
      if (paymasterApiKey && paymasterUrl) {
        try {
          console.log("Configuring paymaster...");
          if (Presets.Paymaster && typeof Presets.Paymaster.verifyingPaymaster === 'function') {
            accountOptions.paymasterMiddleware = Presets.Paymaster.verifyingPaymaster(
              paymasterUrl, { apiKey: paymasterApiKey }
            );
          } else if (Presets.Builder && Presets.Builder.Middleware && 
                     typeof Presets.Builder.Middleware.verifyingPaymaster === 'function') {
            accountOptions.paymasterMiddleware = Presets.Builder.Middleware.verifyingPaymaster(
              paymasterUrl, { apiKey: paymasterApiKey }
            );
          } else {
            console.log("Using custom paymaster configuration");
            accountOptions.paymasterUrl = paymasterUrl;
            accountOptions.paymasterApiKey = paymasterApiKey;
          }
        } catch (err) {
          console.warn("Error configuring paymaster, continuing without it:", err);
        }
      }
      
      console.log("SimpleAccount options:", accountOptions);
      const simpleAccount = await Presets.Builder.SimpleAccount.init(
        eoaSigner,
        rpcUrl,
        accountOptions
      );
      console.log('[WalletModal] SimpleAccount instance created:', simpleAccount); // Log instance
      console.log('[WalletModal] Is simpleAccount a signer?:', simpleAccount instanceof ethers.Signer); // Check if it's a Signer

      await loginWeb3AuthContext(web3authProvider, aaAddress);

      if (onLogin) {
        const loginDetails = {
          address: aaAddress,
          signer: simpleAccount, // This should be the userop SimpleAccount instance
          provider: ethersProvider,
          eoaAddress: eoaAddress,
          chainId: chainId,
          isSmartAccount: true,
          isDeployed: isDeployed
        };
        console.log('[WalletModal] Calling onLogin with details:', loginDetails); // Log details before calling
        onLogin("producer", loginDetails);
      }

      onClose();
    } catch (err) {
      console.error("Smart Account creation/login error:", err);
      if (web3authInstance && web3authInstance.status === "connected") {
        try { 
          await web3authInstance.logout(); 
        } catch (logoutErr) { 
          console.error("Web3Auth logout failed:", logoutErr); 
        }
      }
      setError(err.message || "Falha ao criar ou fazer login com Smart Account");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-md p-6 transform transition-all scale-100 animate-fadeIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">Connect Wallet</h2>
        
        <p className="text-center text-gray-600 mb-4">For Investors</p>
        <div className="space-y-3 mb-6">
          <button
            onClick={connectEOA}
            disabled={!!connecting}
            className="w-full flex items-center justify-center gap-3 p-3 border border-gray-300 rounded-xl hover:border-indigo-700 hover:bg-indigo-50 transition-all"
          >
            <img src={walletconnectIcon || "/placeholder.svg"} alt="Connect Wallet" className="h-6 w-6" />
            <span className="flex-grow text-center">Connect Existing Wallet</span>
          </button>
        </div>

        <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <p className="text-center text-gray-600 mb-4 mt-4">For Producers (Smart Account)</p>
        <div className="p-4 bg-green-50 rounded-md text-center border border-green-200">
          <h4 className="text-lg font-semibold mb-2 text-green-800">Login / Create Smart Account</h4>
          <p className="text-sm text-green-700 mb-4">Use Google, Email, etc. Gas fees sponsored by Paymaster.</p>
          <button
            onClick={createSmartAccount}
            disabled={!!connecting || !web3authInstance}
            className={`w-full py-3 px-4 rounded-md font-semibold bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
              !web3authInstance ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {connecting === "smart-account" ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <>
                <BsWallet2 className="h-5 w-5 text-green-800" />
                Login with Smart Account
              </>
            )}
          </button>
        </div>


        {error && (
          <div className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-md border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;