"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import logoSvg from "../assets/logo_svg.svg"
import { ConnectButton } from '@rainbow-me/rainbowkit'; // Import RainbowKit ConnectButton
import { FaUserCircle } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query"
import { getProfile } from "../services/profileService"
import io from "socket.io-client"
import { supabase } from "../services/supabaseClient"
import ChatModal from "./Marketplace/ChatModal"

// Helper function to shorten address
const shortenAddress = (address) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

const Navbar = ({ openWalletModal, isLoggedIn, userRole, userAddress, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileScreen, setIsMobileScreen] = useState(window.innerWidth < 768)
  const location = useLocation()

  // 🔔 Notificações
  const [unseenMessages, setUnseenMessages] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const socketRef = useRef(null)
  const [chatPeer, setChatPeer] = useState(null)
  const CHAT_API = import.meta.env.VITE_CHAT_API_URL || "http://localhost:3001"

  // --- fetch profile for navbar display ---
  const { data: navbarProfile } = useQuery({
    queryKey: ["navbarProfile", userAddress],
    enabled: !!userAddress,
    queryFn: () => getProfile(userAddress),
    staleTime: 60 * 1000, // 1 min
  })

  const displayName = navbarProfile?.displayName || null
  const avatarUrl = navbarProfile?.avatarUrl || null

  // === Carregar mensagens não lidas ao entrar ===
  useEffect(() => {
    if (!isLoggedIn || !userAddress) return

    const loadUnseen = async () => {
      const lastSeenKey = `notifications_last_seen_${userAddress.toLowerCase()}`
      const lastSeen = localStorage.getItem(lastSeenKey)

      let query = supabase
        .from("message")
        .select("*")
        .eq("to", userAddress.toLowerCase())

      if (lastSeen) {
        query = query.gt("created_at", lastSeen)
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      if (!error && data) setUnseenMessages(data)
    }

    loadUnseen()
  }, [isLoggedIn, userAddress])

  // === WebSocket para novas mensagens ===
  useEffect(() => {
    if (!isLoggedIn || !userAddress) return

    socketRef.current = io(CHAT_API, { transports: ["websocket"] })

    socketRef.current.on("newMessage", (msg) => {
      if (msg.to === userAddress.toLowerCase()) {
        setUnseenMessages((prev) => [msg, ...prev])
      }
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [isLoggedIn, userAddress])

  const toggleNotifications = () => {
    setShowNotifications((prev) => {
      const newState = !prev
      // Se estamos fechando (prev era true), então marcamos como lido
      if (prev === true) {
        const nowIso = new Date().toISOString()
        localStorage.setItem(`notifications_last_seen_${userAddress.toLowerCase()}`, nowIso)
        setUnseenMessages([])
      }
      return newState
    })
  }

  // Abrir chat com remetente
  const openChatWith = (peer) => {
    setChatPeer(peer)
    setShowNotifications(false)
    // Considera mensagens desse peer como lidas imediatamente
    const nowIso = new Date().toISOString()
    localStorage.setItem(`notifications_last_seen_${userAddress.toLowerCase()}`, nowIso)
    setUnseenMessages([]) // simplificado
  }

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

        {/* Botão de menu móvel + sino (somente em tela pequena) */}
        {isMobileScreen && (
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className="text-xl text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Notifications"
                >
                  <i className="fas fa-bell"></i>
                  {unseenMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-72 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <div className="p-4 border-b flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-sm">New Messages</span>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700 text-xs">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    {unseenMessages.length === 0 ? (
                      <p className="p-4 text-xs text-gray-500 text-center">No new messages</p>
                    ) : (
                      unseenMessages.slice(0, 20).map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => openChatWith(msg.from)}
                          className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 text-xs text-gray-700 focus:outline-none"
                        >
                          <span className="font-semibold mr-1">{msg.from.substring(0, 8)}:</span>
                          <span className="truncate inline-block max-w-[160px] align-middle">{msg.content}</span>
                          <span className="block text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleMobileMenu}
              className="text-xl sm:text-2xl p-2 focus:outline-none transition-transform duration-300"
              aria-label="Toggle menu"
            >
              <i
                className={`fas ${isMobileMenuOpen ? "fa-times rotate-180" : "fa-bars"} transition-transform duration-300`}
              ></i>
            </button>
          </div>
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
                  {isLoggedIn && (
                    <Link
                      to="/users"
                      className="font-medium text-lg relative hover:text-green-700 transition-colors"
                    >
                      Community
                    </Link>
                  )}
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
                  {isLoggedIn && (
                    <Link
                      to="/users"
                      className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/users") ? "text-green-700" : ""}`}
                    >
                      Community
                    </Link>
                  )}
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
                  {isLoggedIn && (
                    <Link
                      to="/profile"
                      className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/profile") ? "text-green-700" : ""}`}
                    >
                      Profile
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-4 items-center">
              {isLoggedIn ? (
                <>
                  {/* 🔔 Ícone de notificações */}
                  <div className="relative">
                    <button
                      onClick={toggleNotifications}
                      className="text-xl text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <i className="fas fa-bell"></i>
                      {unseenMessages.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2.5 h-2.5"></span>
                      )}
                    </button>

                    {/* Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                        <div className="p-4 border-b flex items-center justify-between">
                          <span className="font-semibold text-gray-800">New Messages</span>
                          <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-gray-700 text-sm">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        {unseenMessages.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500 text-center">No new messages</p>
                        ) : (
                          unseenMessages.slice(0, 20).map((msg) => (
                            <button
                              key={msg.id}
                              onClick={() => openChatWith(msg.from)}
                              className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 text-sm text-gray-700 focus:outline-none"
                            >
                              <span className="font-semibold mr-1">{msg.from.substring(0, 8)}:</span>
                              <span className="truncate inline-block max-w-[200px] align-middle">{msg.content}</span>
                              <span className="block text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {/* Display user info and logout */} 
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <FaUserCircle className={`text-xl ${userRole === 'producer' ? 'text-green-600' : 'text-blue-600'}`} />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {displayName || shortenAddress(userAddress)}
                    </span>
                  </Link>
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
                {isLoggedIn && (
                  <Link
                    to="/users"
                    className="font-medium hover:text-green-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Community
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/marketplace" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Marketplace
                </Link>
                {isLoggedIn && (
                  <Link
                    to="/users"
                    className={`font-medium text-lg relative hover:text-green-700 transition-colors ${isActive("/users") ? "text-green-700" : ""}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Community
                  </Link>
                )}
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
                {isLoggedIn && (
                  <Link to="/profile" className="font-medium hover:text-green-700 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                )}
              </>
            )}

            <hr className="my-2"/>

            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 hover:text-green-700 transition-colors"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle className={`text-xl ${userRole === 'producer' ? 'text-green-600' : 'text-blue-600'}`} />
                  )}
                  <span className="text-sm font-medium">
                    {displayName || shortenAddress(userAddress)}
                  </span>
                </Link>
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

      {chatPeer && (
        <ChatModal 
          isOpen={Boolean(chatPeer)}
          onClose={() => setChatPeer(null)}
          userId={userAddress}
          farmerId={chatPeer}
        />
      )}
    </nav>
  )
}

export default Navbar

