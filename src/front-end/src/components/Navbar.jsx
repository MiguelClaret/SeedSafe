"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import logoSvg from "../assets/logo_svg.svg"
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Import RainbowKit ConnectButton

// Helper function to shorten address
const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

const Navbar = ({ openWalletModal, isLoggedIn, userRole, userAddress, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768)
  const location = useLocation()

  // Atualiza o estado isMobileScreen quando a janela é redimensionada
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  // Função para verificar se um link está ativo
  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true
    if (path !== "/" && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img src={logoSvg || "/placeholder.svg"} alt="SeedSafe" className="h-8 sm:h-10" />
          </Link>
          <Link to="/">
            <span className="font-bold text-2xl sm:text-3xl">
              Seed<em className="text-green-700 not-italic">Safe</em>
            </span>
          </Link>
        </div>

        {/* Botão de menu móvel - apenas visível em telas pequenas */}
        {isMobileScreen && (
          <button
            onClick={toggleMobileMenu}
            className="text-xl sm:text-2xl p-2 focus:outline-none transition-transform duration-300"
            aria-label="Toggle menu"
          >
            <i
              className={`fas ${isMobileMenuOpen ? "fa-times rotate-180" : "fa-bars"} transition-transform duration-300`}
            ></i>
          </button>
        )}

        {/* Links de navegação e botões - visíveis em desktop */}
        {!isMobileScreen && (
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex gap-6 lg:gap-10">
              {location.pathname === "/" ? (
                <>
                  <a
                    href="#how-it-works"
                    className="font-medium text-lg relative hover:text-green-700 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-green-700 hover:after:w-full after:transition-all"
                  >
                    How It Works
                  </a>
                  <a
                    href="#benefits"
                    className="font-medium text-lg relative hover:text-green-700 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-green-700 hover:after:w-full after:transition-all"
                  >
                    Benefits
                  </a>
                  <a
                    href="#products"
                    className="font-medium text-lg relative hover:text-green-700 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-green-700 hover:after:w-full after:transition-all"
                  >
                    Products
                  </a>
                  <a
                    href="#testimonials"
                    className="font-medium text-lg relative hover:text-green-700 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-green-700 hover:after:w-full after:transition-all"
                  >
                    Testimonials
                  </a>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/") ? "text-green-700" : ""}`}
                  >
                    Home
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/marketplace") ? "text-green-700" : ""}`}
                  >
                    Marketplace
                  </Link>
                  {/* Show Register Crop only if logged in as Producer */}
                  {isLoggedIn && userRole === 'producer' && (
                    <Link
                      to="/register"
                      className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/register") ? "text-green-700" : ""}`}
                    >
                      Register Crop
                    </Link>
                  )}
                  {userRole === "auditor" && (
                    <Link
                      to="/auditor"
                      className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/auditor") ? "text-green-700" : ""}`}
                    >
                      Auditor Panel
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-4 items-center">
              {isLoggedIn ? (
                <>
                  {/* Display user info and logout */} 
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${userRole === 'producer' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {shortenAddress(userAddress)}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    className="py-2 px-4 rounded-md font-semibold text-sm border border-gray-300 hover:border-red-500 hover:text-red-500 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Use RainbowKit ConnectButton or custom button */}
                  {/* <ConnectButton /> */}
                  {/* Or keep the custom button to open the modal */}
                  <button
                    onClick={openWalletModal}
                    className="py-2 px-6 rounded-md font-semibold bg-green-700 text-white hover:bg-green-800 hover:-translate-y-0.5 transition-all"
                  >
                    Connect Wallet
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu móvel com animação de abertura */}
      {isMobileScreen && (
        <div
          className={`absolute top-full left-0 w-full bg-white shadow-md overflow-hidden transform transition-transform duration-300 ease-in-out origin-top z-40 ${
            isMobileMenuOpen ? "scale-y-100" : "scale-y-0"
          }`}
        >
          <div className="flex flex-col gap-3 sm:gap-4 p-4 sm:p-6">
            {location.pathname === "/" ? (
              <>
                <a href="#how-it-works" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#benefits" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Benefits
                </a>
                <a href="#products" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Products
                </a>
                <a href="#testimonials" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Testimonials
                </a>
              </>
            ) : (
              <>
                <Link to="/" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/marketplace" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Marketplace
                </Link>
                {isLoggedIn && userRole === 'producer' && (
                  <Link to="/register" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Register Crop
                  </Link>
                )}
                {userRole === "auditor" && (
                  <Link to="/auditor" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Auditor Panel
                  </Link>
                )}
              </>
            )}

            <hr className="my-2"/>

            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 py-2">
                   <div className={`w-3 h-3 rounded-full ${userRole === 'producer' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                   <span className="text-sm font-medium text-gray-700">
                      {shortenAddress(userAddress)}
                    </span>
                </div>
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full text-center py-2 px-6 rounded-md font-semibold border-2 border-gray-200 hover:border-red-500 hover:text-red-500 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { openWalletModal(); setIsMobileMenuOpen(false); }}
                  className="w-full text-center py-2 px-6 rounded-md font-semibold bg-green-700 text-white hover:bg-green-800 transition-all"
                >
                  Connect Wallet
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar

