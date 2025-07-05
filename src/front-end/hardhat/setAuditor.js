// scripts/setAuditor.js
const hre = require("hardhat");

const CONTRACT_ADDRESS = "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437";
const AUDITOR_ADDRESS = "0xab8D362c3Af4Ff7bCfB018bE9d61bB0DD7DF4E6F";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const HarvestManager = await hre.ethers.getContractFactory("HarvestManager");
  const contract = HarvestManager.attach(CONTRACT_ADDRESS);

  const role = await contract.AUDITOR_ROLE();

  const tx = await contract.grantRole(role, AUDITOR_ADDRESS);
  await tx.wait();

  console.log("✅ Auditor autorizado:", AUDITOR_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
