const { ethers } = require("ethers");

// Config NERO Testnet
const RPC_URL = "https://rpc-testnet.nerochain.io";

// Endereço do contrato correto
const HARVEST_MANAGER_ADDRESS = "0x8FDE74cB3e0075ED08801389A7151163985F1E15";

// ABI mínima
const HARVEST_MANAGER_ABI = [
  {
    "inputs": [],
    "name": "currentHarvestId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  // 👇 aqui o fix mágico:
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const contract = new ethers.Contract(
    HARVEST_MANAGER_ADDRESS,
    HARVEST_MANAGER_ABI,
    provider
  );

  const currentHarvestId = await contract.currentHarvestId();

  console.log(`📊 currentHarvestId on-chain: ${currentHarvestId.toString()}`);
}

main();
