import { Presets } from "userop";
import { CONTRACT_ADDRESSES, NERO_CHAIN_CONFIG, AA_PLATFORM_CONFIG } from "../../config/neroConfig";

export const getSimpleAccountBuilder = async (signer) => {
  console.log("🛠️ Inicializando SimpleAccount Builder com config:");
  console.log("  Factory:", CONTRACT_ADDRESSES.accountFactory);
  console.log("  EntryPoint:", CONTRACT_ADDRESSES.entryPoint);
  console.log("  Bundler:", AA_PLATFORM_CONFIG.bundlerRpc);

  return await Presets.Builder.SimpleAccount.init(signer, NERO_CHAIN_CONFIG.rpcUrl, {
    overrideBundlerRpc: AA_PLATFORM_CONFIG.bundlerRpc,
    entryPoint: CONTRACT_ADDRESSES.entryPoint,
    factory: CONTRACT_ADDRESSES.accountFactory,
  });
};
