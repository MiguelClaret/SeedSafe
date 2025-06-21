const { ethers } = require("ethers");
const fs = require("fs");
require("dotenv").config();

async function main() {
  const RPC_URL = process.env.RPC_URL;
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const CONTRACT_ADDRESS = "0xE1F625A0787753F9A1bF82561c2F3C3666c4381c"; // ajuste se necessário

  console.log("📄 Lendo ABI de: artifacts/contracts/HarvestManager/HarvestManager.json");
  const abiPath = "artifacts/contracts/HarvestManager/HarvestManager.json";
  const contractJson = JSON.parse(fs.readFileSync(abiPath));
  const abi = contractJson.abi;

  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  const currentId = await contract.currentHarvestId();
  console.log(`🌾 Total de safras registradas: ${currentId}`);

  for (let i = 0; i < Number(currentId); i++) {
    const harvest = await contract.harvests(i);
    console.log(`\n🌱 Safra #${i}`);
    console.log(`- Crop: ${harvest.crop}`);
    console.log(`- Quantity: ${harvest.quantity}`);
    console.log(`- Price per unit: ${harvest.pricePerUnit}`);
    console.log(`- Delivery date: ${new Date(Number(harvest.deliveryDate) * 1000).toLocaleString()}`);
    console.log(`- Producer: ${harvest.producer}`);
    console.log(`- Status: ${harvest.status}`);
    console.log(`- Harvested amount: ${harvest.harvestedAmount}`);
    console.log(`- Documentation: ${harvest.documentation}`);
  }
}

main().catch((err) => {
  console.error("❌ Erro ao buscar safras:", err);
});
