const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying HarvestManager with account:", deployer.address);

  const HarvestManager = await hre.ethers.getContractFactory("HarvestManager");
  const harvestManager = await HarvestManager.deploy();
  await harvestManager.deployed();

  console.log("📦 HarvestManager deployed at:", harvestManager.address);

  // Opcional: conceder auditor direto no deploy
  const auditorAddress = "0xab8D362c3Af4Ff7bCfB018bE9d61bB0DD7DF4E6F";
  const AUDITOR_ROLE = hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes("AUDITOR_ROLE")
  );

  const tx = await harvestManager.grantRole(AUDITOR_ROLE, auditorAddress);
  await tx.wait();

  console.log(`✅ AUDITOR_ROLE granted to ${auditorAddress}`);

  // Opcional: já conceder PRODUCER_ROLE pro deployer
  const PRODUCER_ROLE = hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes("PRODUCER_ROLE")
  );

  const tx2 = await harvestManager.grantRole(PRODUCER_ROLE, deployer.address);
  await tx2.wait();

  console.log(`✅ PRODUCER_ROLE granted to deployer: ${deployer.address}`);
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});
