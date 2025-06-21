import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const PAGE_SIZE = 40;

const roleLabelMap = {
  1: "Admin",
  2: "Auditor",
  3: "Producer",
  4: "Investor",
};

const roleColorMap = {
  1: "bg-purple-600",
  2: "bg-yellow-600",
  3: "bg-green-600",
  4: "bg-blue-600",
};

const roleFilterIcons = {
  3: "fas fa-seedling", // Producer
  4: "fas fa-chart-line", // Investor
  2: "fas fa-user-check", // Auditor
  1: "fas fa-crown", // Admin
};

// Hook de debounce simples (evita dependência externa)
function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function UsersDirectory() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 400);
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchProfiles = async ({ reset = false } = {}) => {
    if (loading) return;
    setLoading(true);

    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let req = supabase
      .from("profiles")
      .select("wallet, display_name, avatar_url, location, role")
      .order("display_name", { ascending: true })
      .range(from, to);

    if (debouncedQuery) {
      req = req.ilike("display_name", `%${debouncedQuery}%`);
    }

    if (selectedRole) {
      req = req.eq("role", selectedRole);
    }

    const { data, error } = await req;

    if (error) {
      console.error("[UsersDirectory] erro ao buscar perfis", error);
    }

    if (reset) {
      setProfiles(data || []);
    } else {
      setProfiles((prev) => [...prev, ...(data || [])]);
    }

    if (!data || data.length < PAGE_SIZE) {
      setHasMore(false);
    } else {
      setHasMore(true);
    }

    setLoading(false);
  };

  // Inicial + query change + role change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchProfiles({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, selectedRole]);

  // Page change
  useEffect(() => {
    if (page === 0) return;
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        hasMore &&
        !loading
      ) {
        setPage((p) => p + 1);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, loading]);

  const FilterButton = ({ role, label, icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-200 font-medium ${
        isActive
          ? `${roleColorMap[role]} text-white border-transparent shadow-lg scale-105`
          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md"
      }`}
    >
      <i className={`${icon} text-sm`}></i>
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Community Directory
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Discover and connect with producers, investors, auditors, and other community members
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
              />
            </div>

            {/* Role Filters */}
            <div className="flex flex-wrap justify-center gap-3">
              <FilterButton
                role={3}
                label="Producers"
                icon={roleFilterIcons[3]}
                isActive={selectedRole === 3}
                onClick={() => setSelectedRole(selectedRole === 3 ? null : 3)}
              />
              <FilterButton
                role={4}
                label="Investors"
                icon={roleFilterIcons[4]}
                isActive={selectedRole === 4}
                onClick={() => setSelectedRole(selectedRole === 4 ? null : 4)}
              />
              <FilterButton
                role={2}
                label="Auditors"
                icon={roleFilterIcons[2]}
                isActive={selectedRole === 2}
                onClick={() => setSelectedRole(selectedRole === 2 ? null : 2)}
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        {profiles.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-600 text-center">
              {selectedRole 
                ? `${profiles.length} ${roleLabelMap[selectedRole].toLowerCase()}${profiles.length !== 1 ? 's' : ''} found`
                : `${profiles.length} user${profiles.length !== 1 ? 's' : ''} found`
              }
            </p>
          </div>
        )}

        {/* User Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((p) => (
            <Link
              key={p.wallet}
              to={`/profile/${p.wallet}`}
              className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-300 hover:scale-105"
            >
              <div className="text-center">
                {/* Avatar */}
                <div className="relative mb-4 mx-auto w-20 h-20">
                  <img
                    src={
                      p.avatar_url ||
                      "https://storage.googleapis.com/seedsafe-assets/default-avatar.png"
                    }
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 group-hover:border-green-300 transition-colors duration-300"
                  />
                  {p.role && (
                    <div className={`absolute -top-1 -right-1 w-8 h-8 rounded-full ${roleColorMap[p.role]} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                      <i className={roleFilterIcons[p.role]}></i>
                    </div>
                  )}
                </div>

                {/* Name and Role */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300 truncate">
                    {p.display_name || `${p.wallet.slice(0, 10)}...`}
                  </h3>
                  {p.role && (
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${roleColorMap[p.role]} text-white mt-2`}
                    >
                      <i className={roleFilterIcons[p.role]}></i>
                      {roleLabelMap[p.role]}
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center justify-center text-gray-500 text-sm">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  <span className="truncate">{p.location || "Location not set"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="text-gray-600 font-medium">Loading more users...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && profiles.length === 0 && (
          <div className="text-center py-16">
            <i className="fas fa-search text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No users found</h3>
            <p className="text-gray-500">
              {query || selectedRole 
                ? "Try adjusting your search or filters"
                : "Be the first to join the community!"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 