import abiMarket from '../abi/abiMarket.json';
import abiHarvest from '../abi/abiHarvest.json';

export const NERO_CHAIN_CONFIG = {
    chainId: 689,
    rpcUrl: "https://rpc-testnet.nerochain.io",
    chainName: "NERO Testnet",
    explorer: "https://testnet.neroscan.io",
    currency: "NERO",
    blockExplorerUrl: "https://testnet.neroscan.io",
    nativeCurrency: {
      name: "NERO",
      symbol: "NERO",
      decimals: 18
    }
};
  

export const CONTRACT_ADDRESSES = {
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  accountFactory: "0x9406Cc6185a346906296840746125a0E44976454",
  harvestManager: {
    address: '0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437',
    abi: abiHarvest
  },
  harvestMarket: {
    address: '0x010d5a89e02e16C9bfE48d2fc99D0D4C535FE15D',
    abi: abiMarket
  },
  paymasterRpc: "https://paymaster-testnet.nerochain.io",
  bundlerRpc: "https://bundler-testnet.nerochain.io"
};

  
export const AA_PLATFORM_CONFIG = {
    bundlerRpc: "https://bundler-testnet.nerochain.io",
    paymasterRpc: "https://paymaster-testnet.nerochain.io",
    paymasterAddress: "0x5a6680dFd4a77FEea0A7be291147768EaA2414ad",
    apiKey: "47cf84d0847b40b59a241cb3ca7dbb6e",
    defaultGasLimit: 800000,
    defaultVerificationGasLimit: 500000,
    defaultPreVerificationGas: 50000
  };

console.log("🔑 API Key carregada:", import.meta.env.VITE_PAYMASTER_API_KEY);

export const validateEnvironment = () => {
    const requiredEnvVars = ['VITE_PAYMASTER_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Variáveis de ambiente ausentes:', missingVars);
        return false;
    }
    
    return true;
};

export const checkPaymasterStatus = async () => {
    try {
        const response = await fetch(`${AA_PLATFORM_CONFIG.paymasterRpc}/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': AA_PLATFORM_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`Paymaster status check failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('❌ Erro ao verificar status do Paymaster:', error);
        return null;
    }
};

if (import.meta.env.DEV) {
    console.log("🔧 Configuração do ambiente:", {
        chainId: NERO_CHAIN_CONFIG.chainId,
        paymasterAddress: AA_PLATFORM_CONFIG.paymasterAddress,
        apiKey: AA_PLATFORM_CONFIG.apiKey ? "✅ Configurada" : "❌ Não configurada"
    });
}
  

