// scripts/approveMarket.js
const { ethers } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider("https://rpc-testnet.nerochain.io");
const wallet = new ethers.Wallet("a67036a937b7d305e8a8d70a0803f5c585d70be8ce2ee15d71d48e05e616b6fc", provider);

const harvestManager = new ethers.Contract(
  "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437", // HarvestManager
  [
    {
      "inputs": [
        { "internalType": "address", "name": "operator", "type": "address" },
        { "internalType": "bool", "name": "approved", "type": "bool" }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  wallet
);

async function main() {
  const tx = await harvestManager.setApprovalForAll("0x385eD0FD6F6e514d96F9e2EFf5B9843592e3bfeF", true);
  await tx.wait();
  console.log("✅ Market autorizado com sucesso!");
}

main();
