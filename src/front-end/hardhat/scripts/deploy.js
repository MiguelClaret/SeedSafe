// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🔐 Deploying contracts with:", deployer.address);

  // 1. Deploy HarvestManager
  const HarvestManager = await hre.ethers.getContractFactory("HarvestManager");
  const harvestManager = await HarvestManager.deploy();
  await harvestManager.deployed();
  console.log("🌱 HarvestManager deployed at:", harvestManager.address);

  // 2. Deploy HarvestMarket com o endereço do manager
  const HarvestMarket = await hre.ethers.getContractFactory("HarvestMarket");
  const harvestMarket = await HarvestMarket.deploy(harvestManager.address);
  await harvestMarket.deployed();
  console.log("🛒 HarvestMarket deployed at:", harvestMarket.address);

  // 3. Set HarvestMarket no manager
  const tx = await harvestManager.setHarvestMarket(harvestMarket.address);
  await tx.wait();
  console.log("🔗 Market address set in HarvestManager!");
}

main().catch((error) => {
  console.error("❌ Deploy error:", error);
  process.exitCode = 1;
});
