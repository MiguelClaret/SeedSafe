// Novo arquivo mockDb.js
export const SustainabilityBadges = [
  "Organic",
  "Agroflorestal",
  "Baixo Carbono",
  "Pequeno Produtor",
  "Fair-Trade",
];

const STORAGE_KEY = "seedsafe_profiles";

function readDb() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    console.warn("[mockDb] Falha ao ler localStorage", e);
    return {};
  }
}

function writeDb(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export async function getProfile(wallet) {
  if (!wallet) return null;
  const db = readDb();
  return db[wallet.toLowerCase()] || null;
}

export async function upsertProfile(profile) {
  if (!profile?.wallet) throw new Error("Perfil inválido");
  const db = readDb();
  db[profile.wallet.toLowerCase()] = profile;
  writeDb(db);
}

export async function listProfiles() {
  const db = readDb();
  return Object.values(db);
} 