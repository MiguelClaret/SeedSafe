import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletInfo } from "../contexts/WalletInfoContext";
import {
  getProfile,
  upsertProfile,
  SustainabilityBadges,
} from "../services/profileService";
import AvatarInput from "./AvatarInput";
import Badge from "./Badge";
import { FaPencilAlt } from "react-icons/fa";
import { ethers } from "ethers";
import HarvestManagerABI from "../abi/abiHarvest.json";
import { useParams } from "react-router-dom";

// Constants
const NERO_RPC_URL = "https://rpc-testnet.nerochain.io";
const HARVEST_MANAGER_ADDRESS = "0xddaAd340b0f1Ef65169Ae5E41A8b10776a75482d";
const DEFAULT_AVATAR = "https://storage.googleapis.com/seedsafe-assets/default-avatar.png";

const FIELD_HINTS = {
  displayName: "How you want to be known in the SeedSafe community",
  description: "Tell us about yourself, your role in agriculture, or your investment interests",
  location: "City, State/Province, Country",
  website: "Your website, LinkedIn, or other social media profiles",
};

export default function Profile() {
  const walletInfo = useWalletInfo();
  const qc = useQueryClient();

  // carteira conectada do usuário
  const connectedWallet = walletInfo?.address;

  // carteira sendo visualizada (parametro na rota)
  const { wallet: walletParam } = useParams();
  const viewingWallet = (walletParam || connectedWallet || "").toLowerCase();

  const isOwner = !!connectedWallet && viewingWallet === connectedWallet.toLowerCase();

  const { data: profile, status: profileStatus, isFetching: profileFetching } = useQuery({
    queryKey: ["profile", viewingWallet],
    enabled: !!viewingWallet,
    queryFn: () => getProfile(viewingWallet),
  });

  const mutation = useMutation({
    mutationFn: upsertProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", viewingWallet] }),
  });

  const ensureProfile = () => {
    const roleMap = {
      admin: 1,
      auditor: 2,
      producer: 3,
      investor: 4,
    };
    const desiredRole = roleMap[walletInfo?.role] ?? null;

    if (profileStatus === 'success' && isOwner && connectedWallet && desiredRole) {
      // Novo perfil: cria com valores padrão + role correto
      if (!profile) {
        mutation.mutate({
          wallet: connectedWallet,
          displayName: "",
          description: "",
          location: "",
          website: "",
          badges: [],
          avatarUrl: DEFAULT_AVATAR,
          role: desiredRole,
        });
      }
      // Perfil existente mas sem role ou role diferente: atualiza somente se necessário
      else if (profile.role !== desiredRole) {
        mutation.mutate({
          ...profile,
          role: desiredRole,
        });
      }
    }
  };

  useEffect(() => {
    ensureProfile();
  }, [connectedWallet, profile, profileStatus, isOwner, walletInfo]);

  // Local draft profile state to batch updates
  const [draftProfile, setDraftProfile] = useState(null);

  // Sync draft with fetched profile
  useEffect(() => {
    if (profile) {
      setDraftProfile(profile);
    }
  }, [profile]);

  // Helper: has unsaved changes?
  const isDirty = React.useMemo(() => {
    if (!profile || !draftProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(draftProfile);
  }, [profile, draftProfile]);

  // Update local draft only
  const updateField = (field, value) => {
    if (!isOwner) return;
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    if (!draftProfile) return;
    if (isOwner) {
      mutation.mutate(draftProfile);
    }
  };

  // Edit state for each field
  const [editing, setEditing] = useState({
    avatar: false,
    displayName: false,
    description: false,
    location: false,
    website: false,
    badges: false,
  });

  // Query for closed purchases
  const fetchClosedPurchases = async (buyer) => {
    if (!buyer) return [];
    try {
      const provider = new ethers.providers.JsonRpcProvider(NERO_RPC_URL);
      const contract = new ethers.Contract(
        HARVEST_MANAGER_ADDRESS,
        HarvestManagerABI,
        provider
      );
      const filter = contract.filters.TransferSingle(null, null, buyer);
      const logs = await contract.queryFilter(filter);
      return logs.map((ev) => ({
        harvestId: ev.args.id.toString(),
        amount: ev.args.value.toString(),
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
      }));
    } catch (e) {
      console.error("Error fetching closed purchases", e);
      return [];
    }
  };

  const {
    data: closedPurchases,
    isLoading: loadingPurchases,
  } = useQuery({
    queryKey: ["closedPurchases", viewingWallet],
    enabled: !!viewingWallet,
    queryFn: () => fetchClosedPurchases(viewingWallet),
  });

  // --- Role badge helpers ---
  const roleLabelMap = {
    1: "Admin",
    2: "Auditor",
    3: "Producer",
    4: "Investor",
  };

  const roleLabel = roleLabelMap[draftProfile?.role];

  // Define cor do badge conforme o papel
  const roleColorClass = (() => {
    switch (draftProfile?.role) {
      case 3: // Producer
        return "bg-green-600";
      case 4: // Investor
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  })();

  if (!viewingWallet) {
    return <p className="p-4">Connect your wallet to view your profile.</p>;
  }

  const EditButton = ({ onClick, active = false }) => {
    if (!isOwner) return null;
    return (
      <button
        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 transform hover:scale-110"
        onClick={onClick}
      >
        <FaPencilAlt
          className={`${
            active ? "text-green-600" : "text-gray-500"
          } hover:text-green-600 transition-colors duration-200`}
        />
      </button>
    );
  };

  const ProfileField = ({ label, value, field, hint }) => (
    <div className="mt-6 animate-fadeIn">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
      {!editing[field] || !isOwner ? (
        <div className="flex items-center gap-2 mt-1 group">
          <span className="text-gray-900">{value || "—"}</span>
          {isOwner && <EditButton onClick={() => setEditing({ ...editing, [field]: true })} />}
        </div>
      ) : (
        field === "description" ? (
          <textarea
            className="w-full border px-3 py-2 rounded-md h-32 mt-1 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            defaultValue={value}
            placeholder={hint}
            onBlur={(e) => {
              updateField(field, e.target.value);
              setEditing({ ...editing, [field]: false });
            }}
            autoFocus
          />
        ) : (
          <input
            className="w-full border px-3 py-2 rounded-md mt-1 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            defaultValue={value}
            placeholder={hint}
            onBlur={(e) => {
              updateField(field, e.target.value);
              setEditing({ ...editing, [field]: false });
            }}
            autoFocus
          />
        )
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-semibold mb-6 text-gray-900 animate-fadeIn text-center">Your Profile</h1>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Avatar and basic info */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6 border border-gray-100">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4 animate-fadeIn">
            <div className="relative group">
              <img
                src={draftProfile?.avatarUrl || DEFAULT_AVATAR}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 transition-transform duration-200 group-hover:scale-105"
              />
              {isOwner && (
                <div className="absolute -bottom-2 -right-2">
                  <EditButton
                    onClick={() => setEditing({ ...editing, avatar: true })}
                    active={editing.avatar}
                  />
                </div>
              )}
            </div>
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900 flex items-center justify-center gap-2">
                {draftProfile?.displayName || "Your Name"}
                {roleLabel && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColorClass} text-white uppercase tracking-wide`}
                  >
                    {roleLabel}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{draftProfile?.location || "Location"}</p>
            </div>
          </div>

          {/* Avatar editor */}
          {isOwner && editing.avatar && (
            <div className="mt-4 animate-fadeIn">
      <AvatarInput
                defaultUrl={draftProfile?.avatarUrl}
                onChange={(url) => {
                  updateField("avatarUrl", url);
                  setEditing({ ...editing, avatar: false });
                }}
      />
            </div>
          )}

          {/* Basic Info Fields */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <ProfileField
              label="Display Name"
              value={draftProfile?.displayName}
              field="displayName"
              hint={FIELD_HINTS.displayName}
      />
            <ProfileField
              label="Location"
              value={draftProfile?.location}
              field="location"
              hint={FIELD_HINTS.location}
            />
            <ProfileField
              label="Website / Social Media"
              value={draftProfile?.website}
              field="website"
              hint={FIELD_HINTS.website}
            />
          </div>
        </div>

        {/* Middle column - Description and Badges */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">About & Certifications</h3>
          <ProfileField
            label="Description"
            value={draftProfile?.description}
            field="description"
            hint={FIELD_HINTS.description}
          />

          {/* Sustainability Badges */}
          <div className="animate-fadeIn pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-medium text-gray-900">Sustainability Badges</h2>
              {isOwner && (
                <EditButton
                  onClick={() => setEditing({ ...editing, badges: !editing.badges })}
                  active={editing.badges}
                />
              )}
            </div>
        <div className="flex flex-wrap gap-2">
          {SustainabilityBadges.map((b) => {
                const selected = draftProfile?.badges?.includes(b);
            return (
              <Badge
                key={b}
                label={b}
                selected={selected}
                onToggle={(sel) => {
                      if (!editing.badges || !isOwner) return;
                      const current = new Set(draftProfile?.badges || []);
                  sel ? current.add(b) : current.delete(b);
                  updateField("badges", Array.from(current));
                }}
              />
            );
          })}
        </div>
      </div>
        </div>

        {/* Right column - Closed Purchases */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          {/* Closed Purchases */}
          <div className="animate-fadeIn">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h2>
            {loadingPurchases ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : closedPurchases?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">You haven't made any purchases yet.</p>
                <p className="text-sm text-gray-500 mt-2">Visit our marketplace to start investing in sustainable agriculture.</p>
              </div>
            ) : (
              <ul className="divide-y border rounded-lg overflow-hidden">
                {closedPurchases.map((p, idx) => (
                  <li
                    key={p.txHash}
                    className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hover:bg-gray-50 transition-colors duration-200"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <span className="text-gray-900">
                      Harvest #{p.harvestId} — {p.amount} units
                    </span>
                    <a
                      href={`https://testnet.neroscan.com/tx/${p.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200 hover:underline"
                    >
                      View transaction
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {isOwner && isDirty && (
        <button
          onClick={saveChanges}
          className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 z-50"
        >
          Save Changes
        </button>
      )}

      {isOwner && mutation.isLoading && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-fadeIn">
          Saving...
        </div>
      )}
    </div>
  );
} 