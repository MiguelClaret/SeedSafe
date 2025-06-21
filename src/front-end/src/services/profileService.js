import { supabase } from "./supabaseClient";

export const SustainabilityBadges = [
  "organic",
  "conservation",
  "rotation",
  "water",
];

// ------- helpers de transformação camelCase <-> snake_case -------
const camelToSnake = {
  displayName: "display_name",
  avatarUrl: "avatar_url",
};

const snakeToCamel = Object.entries(camelToSnake).reduce((acc, [camel, snake]) => {
  acc[snake] = camel;
  return acc;
}, {});

function mapKeys(obj, map) {
  if (!obj) return obj;
  const newObj = {};
  for (const [k, v] of Object.entries(obj)) {
    newObj[map[k] || k] = v;
  }
  return newObj;
}

/**
 * Busca perfil de um usuário pelo endereço da carteira.
 * @param {string} wallet - endereço da carteira.
 * @returns {Promise<object|null>} Retorna objeto de perfil ou null se não existir.
 */
export async function getProfile(wallet) {
  if (!wallet) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("wallet", wallet.toLowerCase())
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[profileService] getProfile error", error);
  }
  // Converte snake_case -> camelCase para consumo do front
  return data ? mapKeys(data, snakeToCamel) : null;
}

/**
 * Insere ou atualiza perfil.
 * @param {object} profile - objeto de perfil completo.
 */
export async function upsertProfile(profile) {
  if (!profile) return;
  // Converte campos para snake_case antes de enviar
  const updated = mapKeys(
    {
      ...profile,
      wallet: profile.wallet.toLowerCase(),
    },
    camelToSnake
  );

  const { data, error } = await supabase
    .from("profiles")
    .upsert(updated, { onConflict: "wallet" })
    .select()
    .single();
  if (error) {
    console.error("[profileService] upsertProfile error", error);
  }
  return data ? mapKeys(data, snakeToCamel) : null;
} 