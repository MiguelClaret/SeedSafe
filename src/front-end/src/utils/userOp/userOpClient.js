import { Client } from "userop";
import { AA_PLATFORM_CONFIG, CONTRACT_ADDRESSES, NERO_CHAIN_CONFIG } from "../../config/neroConfig";

export const getUserOperationClient = async () => {
  return await Client.init(NERO_CHAIN_CONFIG.rpcUrl, {
    overrideBundlerRpc: AA_PLATFORM_CONFIG.bundlerRpc,
    entryPoint: CONTRACT_ADDRESSES.entryPoint,
  });
};
