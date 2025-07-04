const { ethers } = require("hardhat");

async function main() {
  const HARVEST_MANAGER_ADDRESS = "0xE1F625A0787753F9A1bF82561c2F3C3666c4381c"; 

  const HarvestMarket = await ethers.getContractFactory("HarvestMarket");
  const market = await HarvestMarket.deploy(HARVEST_MANAGER_ADDRESS);

  await market.deployed();
  console.log(`✅ HarvestMarket deployed to: ${market.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
