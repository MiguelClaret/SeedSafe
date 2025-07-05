// scripts/setMarket.js
const hre = require("hardhat");

const HARVEST_MANAGER_ADDRESS = "0x9e19e961809bE09EB576fbB99c8a17f121d0C028"; // 🔁 Substitua se tiver mudado
const HARVEST_MARKET_ADDRESS = "0x385eD0FD6F6e514d96F9e2EFf5B9843592e3bfeF"; // Endereço do contrato HarvestMarket

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🔐 Conectado com:", deployer.address);
  console.log("🔗 Conectando com HarvestManager:", HARVEST_MANAGER_ADDRESS);

  const HarvestManager = await hre.ethers.getContractFactory("HarvestManager");
  const harvestManager = await HarvestManager.attach(HARVEST_MANAGER_ADDRESS);

  const tx = await harvestManager.setHarvestMarket(HARVEST_MARKET_ADDRESS);
  await tx.wait();

  console.log(`✅ HarvestMarket registrado com sucesso: ${HARVEST_MARKET_ADDRESS}`);
}

main().catch((error) => {
  console.error("❌ Erro no script:", error);
  process.exitCode = 1;
});
