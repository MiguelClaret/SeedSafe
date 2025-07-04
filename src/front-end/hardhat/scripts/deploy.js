const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying HarvestManager with account:", deployer.address);

  // 1. Deploy do HarvestManager
  const HarvestManager = await hre.ethers.getContractFactory("HarvestManager");
  const harvestManager = await HarvestManager.deploy();
  await harvestManager.deployed();

  console.log("📦 HarvestManager deployed at:", harvestManager.address);

  // 2. Configura manualmente o endereço do HarvestMarket já existente
  const harvestMarketAddress = "0x385eD0FD6F6e514d96F9e2EFf5B9843592e3bfeF"; // <- substitua se necessário

  const txSet = await harvestManager.setHarvestMarket(harvestMarketAddress);
  await txSet.wait();
  console.log(`🔗 HarvestMarket address set in HarvestManager: ${harvestMarketAddress}`);

  // 3. Conceder AUDITOR_ROLE
  const auditorAddress = "0xab8D362c3Af4Ff7bCfB018bE9d61bB0DD7DF4E6F";
  const AUDITOR_ROLE = hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes("AUDITOR_ROLE")
  );
  const txAuditor = await harvestManager.grantRole(AUDITOR_ROLE, auditorAddress);
  await txAuditor.wait();
  console.log(`✅ AUDITOR_ROLE granted to ${auditorAddress}`);

  // 4. Conceder PRODUCER_ROLE para o deployer (opcional)
  const PRODUCER_ROLE = hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes("PRODUCER_ROLE")
  );
  const txProducer = await harvestManager.grantRole(PRODUCER_ROLE, deployer.address);
  await txProducer.wait();
  console.log(`✅ PRODUCER_ROLE granted to deployer: ${deployer.address}`);
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});
