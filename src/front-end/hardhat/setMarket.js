// scripts/setMarket.js
const hre = require("hardhat");

const HARVEST_MANAGER_ADDRESS = "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437"; // 🔁 Substitua se tiver mudado
const HARVEST_MARKET_ADDRESS = "0x010d5a89e02e16C9bfE48d2fc99D0D4C535FE15D"; // Endereço do contrato HarvestMarket

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
