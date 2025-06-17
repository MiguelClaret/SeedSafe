"use client";

import React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import "./index.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAccount, useDisconnect } from "wagmi";
import { useEthersSigner } from "./hooks/account/useGetSigner";
import { Web3AuthProvider, useWeb3Auth } from "./components/Web3AuthContext";
import { WalletInfoProvider } from "./contexts/WalletInfoContext";
import OverlayProviders from "./components/neroOverlay/OverlayProviders";
import OverlayApp from "./components/neroOverlay/OverlayApp";
import { ethers } from "ethers";

import bgPattern from "./assets/bg-pattern.svg";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import Benefits from "./components/Benefits";
import Products from "./components/Products";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";
import WalletModal from "./components/WalletModal";
import ChatbotWidget from "./components/ChatbotWidget";

import Marketplace from "./components/Marketplace/Index";
import RegistrationProcess from "./components/RegistrationProcess";
import Auditor from "./components/Auditor";

import Onboarding from "./components/onboarding";
import OnboardingButton from "./components/Onboardingbutton";

import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Presets } from "userop";
import { getAAWalletAddress, isAAWalletDeployed } from "./utils/aaUtils";

const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
let chainId = 689;
const envChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
if (envChainId) {
  const parsed = parseInt(envChainId);
  if (!isNaN(parsed)) {
    chainId = parsed;
  }
}
const entryPointAddress = process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS;
const simpleAccountFactoryAddress =
  process.env.NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY_ADDRESS;
const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL;

const addGlobalStyles = () => {
  const style = document.createElement("style");
  style.id = "seedsafe-global-styles";
  style.innerHTML = `
    .animation-float {
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .onboarding-general-button {
      position: fixed !important;
      bottom: 20px !important;
      left: 16px !important;
      z-index: 50 !important;
    }
  `;
  if (!document.getElementById("seedsafe-global-styles")) {
    document.head.appendChild(style);
  }
};

function RemoveTrailingSlash() {
  const location = useLocation();
  if (location.pathname.length > 1 && location.pathname.endsWith("/")) {
    return (
      <Navigate to={location.pathname.slice(0, -1) + location.search} replace />
    );
  }
  return null;
}

function AppContent() {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [walletInfo, setWalletInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [web3authInstanceForApp, setWeb3authInstanceForApp] = useState(null);

  const { login: loginToWeb3AuthContext } = useWeb3Auth();
  const {
    address: eoaAddress,
    isConnected: isEoaConnected,
    connector,
  } = useAccount();
  const { disconnect: disconnectWagmi } = useDisconnect();
  const eoaSigner = useEthersSigner({ chainId: connector?.chains?.[0]?.id });

  const handleStartOnboarding = () => setShowOnboarding(true);
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("seedsafe_onboarding_completed", "true");
  };

  const handleLogin = useCallback(
    (role, connectionDetails) => {
      console.log(`Login successful as ${role}:`, connectionDetails);
      setWalletInfo({
        ...connectionDetails,
        role: role,
      });
      setIsLoggedIn(true);
    },
    [setIsLoggedIn, setWalletInfo]
  );

  const handleLogout = useCallback(() => {
    console.log("Logging out...");
    if (walletInfo?.isSmartAccount) {
      if (
        web3authInstanceForApp &&
        web3authInstanceForApp.status === "connected"
      ) {
        web3authInstanceForApp.logout();
      }
    } else {
      disconnectWagmi();
    }
    setWalletInfo(null);
    setIsLoggedIn(false);
  }, [disconnectWagmi, walletInfo, web3authInstanceForApp]);

  // Inicialização do Web3Auth
  useEffect(() => {
    const initAppWeb3Auth = async () => {
      if (!web3AuthClientId || !rpcUrl) {
        console.error(
          "[AppContent] Web3Auth Client ID or RPC URL not configured."
        );
        return;
      }
      try {
        const chainIdHex = "0x" + chainId.toString(16);
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: chainIdHex,
          rpcTarget: rpcUrl,
          displayName: "Nerochain Testnet",
          blockExplorer: "https://testnet.neroscan.com",
          ticker: "NERO",
          tickerName: "Nero",
        };
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: { chainConfig },
        });
        const web3auth = new Web3Auth({
          clientId: web3AuthClientId,
          web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
          chainConfig: chainConfig,
          privateKeyProvider: privateKeyProvider,
          uiConfig: { appName: "SeedSafe" },
        });
        await web3auth.init();
        setWeb3authInstanceForApp(web3auth);
        console.log("[AppContent] App-level Web3Auth initialized.");
      } catch (err) {
        console.error("[AppContent] App-level Web3Auth init error:", err);
      }
    };
    initAppWeb3Auth();
  }, []);

  // Restauração de sessão do Web3Auth/Smart Account
  useEffect(() => {
    const restoreWeb3AuthSession = async () => {
      if (web3authInstanceForApp && !walletInfo) {
        console.log(
          `[AppContent] Attempting to restore session. Web3Auth status: ${web3authInstanceForApp.status}`
        );
        let provider = null;
        try {
          if (web3authInstanceForApp.status === "connected") {
            provider = await web3authInstanceForApp.connect();
          } else {
            console.log(
              `[AppContent] Web3Auth status is ${web3authInstanceForApp.status}. Not attempting session restore.`
            );
            return;
          }
        } catch (connectError) {
          console.error(
            "[AppContent] Error during connect in session restore:",
            connectError
          );
          return;
        }
        if (provider) {
          try {
            const ethersProvider = new ethers.providers.Web3Provider(provider);
            const accounts = await ethersProvider.listAccounts();
            if (accounts.length === 0) {
              console.error(
                "[AppContent] No accounts found. Cannot restore session."
              );
              return;
            }
            const eoaSignerRestored = ethersProvider.getSigner();
            const eoaAddressRestored = await eoaSignerRestored.getAddress();
            const aaAddressRestored = await getAAWalletAddress(
              eoaSignerRestored
            );
            if (!aaAddressRestored)
              throw new Error("Failed to get AA address.");
            const accountOptions = {
              entryPoint: entryPointAddress,
              factory: simpleAccountFactoryAddress,
              overrideBundlerRpc: bundlerUrl,
            };
            const simpleAccountRestored =
              await Presets.Builder.SimpleAccount.init(
                eoaSignerRestored,
                rpcUrl,
                accountOptions
              );
            const isDeployedRestored = await isAAWalletDeployed(
              aaAddressRestored
            );
            handleLogin("producer", {
              address: aaAddressRestored,
              signer: simpleAccountRestored,
              provider: ethersProvider,
              eoaAddress: eoaAddressRestored,
              eoaSigner: eoaSignerRestored,
              chainId: chainId,
              isSmartAccount: true,
              isDeployed: isDeployedRestored,
            });
            await loginToWeb3AuthContext(provider, aaAddressRestored);
            console.log("[AppContent] Smart Account session restored.");
          } catch (error) {
            console.error(
              "[AppContent] Error restoring Smart Account session:",
              error
            );
          }
        }
      }
    };
    if (!walletInfo && web3authInstanceForApp) {
      restoreWeb3AuthSession();
    }
  }, [web3authInstanceForApp, walletInfo, handleLogin, loginToWeb3AuthContext]);

  // Login EOA via Wagmi/RainbowKit
  useEffect(() => {
    if (
      isEoaConnected &&
      eoaAddress &&
      eoaSigner &&
      (!walletInfo || walletInfo.isSmartAccount)
    ) {
      console.log("[AppContent] Wagmi EOA connected:", eoaAddress);
      handleLogin("investor", {
        address: eoaAddress,
        signer: eoaSigner,
        eoaAddress: eoaAddress,
        eoaSigner: eoaSigner,
        chainId: connector?.chains?.[0]?.id,
        isSmartAccount: false,
      });
    }
  }, [
    isEoaConnected,
    eoaAddress,
    eoaSigner,
    walletInfo,
    connector,
    handleLogin,
  ]);

  // UI State & Styling
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    addGlobalStyles();
    return () => {
      window.removeEventListener("resize", handleResize);
      const style = document.getElementById("seedsafe-global-styles");
      if (style) document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setPageLoaded(true);
    const hasCompletedOnboarding = localStorage.getItem(
      "seedsafe_onboarding_completed"
    );
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const openWalletModal = () => {
    setIsWalletModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const backgroundStyle = !isMobile
    ? {
        backgroundImage: `url(${bgPattern})`,
        backgroundSize: "auto",
        backgroundPosition: "center",
      }
    : {};

  const userRole = walletInfo?.role;

  const RequireAuth = ({ children, requiredRole }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole && userRole !== requiredRole) {
      console.log(
        `Role mismatch: Required ${requiredRole}, User has ${userRole}`
      );
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const walletContextValueForProvider = useMemo(
    () => ({
      address: walletInfo?.address,
      signer: walletInfo?.signer,
      provider: walletInfo?.provider,
      chainId: walletInfo?.chainId,
      role: walletInfo?.role,
      isSmartAccount: walletInfo?.isSmartAccount,
      eoaAddress: walletInfo?.eoaAddress,
      eoaSigner: walletInfo?.eoaSigner,
      logout: handleLogout,
    }),
    [walletInfo, handleLogout]
  );

  return (
    <WalletInfoProvider value={walletContextValueForProvider}>
      <div 
        style={{ 
          position: "fixed", 
          top: 24, 
          left: isMobile ? "auto" : 24,
          right: isMobile ? 24 : "auto",
          zIndex: 9999 
        }}
      >
        <OverlayProviders>
          <OverlayApp mode="sidebar" isMobile={isMobile} />
        </OverlayProviders>
      </div>
      <Router>
        <div className="font-poppins text-slate-800 overflow-x-hidden w-full min-h-screen">
          <header
            className={`${
              isMobile
                ? "bg-gradient-to-r from-white/95 to-white/90 px-4 pb-8"
                : "bg-gradient-to-r from-white/95 to-white/80 bg-cover px-6 pb-12 md:pb-24"
            } relative`}
            style={backgroundStyle}
          >
            <Navbar
              openWalletModal={openWalletModal}
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              userAddress={walletInfo?.address}
              onLogout={handleLogout}
            />
            <Routes>
              <Route
                path="/"
                element={
                  <Hero
                    openWalletModal={openWalletModal}
                    walletInfo={walletInfo}
                  />
                }
              />
            </Routes>
          </header>
          <main className="w-full">
            <Routes>
              <Route
                path="/"
                element={
                  <div className="w-full">
                    <HowItWorks />
                    <Benefits />
                    <Products />
                    <Testimonials />
                    <CTASection openWalletModal={openWalletModal} />
                  </div>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <div
                    className={`${
                      isMobile
                        ? "bg-gradient-to-r from-white/95 to-white/90 px-4"
                        : "bg-gradient-to-r from-white/95 to-white/80 bg-cover px-6"
                    } w-full`}
                    style={backgroundStyle}
                  >
                    <Marketplace />
                  </div>
                }
              />
              <Route
                path="/register"
                element={
                  <RequireAuth>
                    <div className="bg-white w-full px-4 lg:px-6">
                      <RegistrationProcess
                        walletInfo={walletInfo}
                        setCurrentPage={setCurrentPage}
                        isLoggedIn={isLoggedIn}
                        setIsLoggedIn={setIsLoggedIn}
                      />
                    </div>
                  </RequireAuth>
                }
              />
              <Route
                path="/auditor"
                element={

                  <RequireAuth>
                    <div
                      className={`min-h-screen ${
                        isMobile
                          ? "bg-gradient-to-r from-white/95 to-white/90"
                          : "bg-gradient-to-r from-white/95 to-white/80"
                      }`}
                      style={backgroundStyle}
                    >
                      <Auditor />
                    </div>
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          {isWalletModalOpen && (
            <WalletModal
              isOpen={isWalletModalOpen}
              onClose={closeWalletModal}
              onLogin={handleLogin}
            />
          )}
        </div>
        {pageLoaded && (
          <>
            <Onboarding
              isOpen={showOnboarding}
              onComplete={handleOnboardingComplete}
            />
            <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end z-50 pointer-events-none">
              <div className="pointer-events-auto">
                <OnboardingButton onClick={handleStartOnboarding} />
              </div>
              <div className="pointer-events-auto">
                <ChatbotWidget />
              </div>
            </div>
          </>
        )}
      </Router>
    </WalletInfoProvider>
  );
}

function App() {
  return (
    <Web3AuthProvider>
      <AppContent />
    </Web3AuthProvider>
  );
}

export default App;
