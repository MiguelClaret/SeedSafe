const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  const HarvestManager = await hre.ethers.getContractFactory("HarvestManagerV2");
  const harvestManager = await HarvestManager.deploy();

  await harvestManager.deployed();

  console.log("HarvestManager deployed to:", harvestManager.address);

  // Grant role for auditor
  const auditorAddress = "0xab8D362c3Af4Ff7bCfB018bE9d61bB0DD7DF4E6F";
  const AUDITOR_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("AUDITOR_ROLE"));

  const tx = await harvestManager.grantRole(AUDITOR_ROLE, auditorAddress);
  await tx.wait();

  console.log(`✅ AUDITOR_ROLE granted to ${auditorAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

  //npx hardhat run scripts/deploy.js --network neroTestnet --config ./hardhat.config.js
  //npm install --save-dev hardhat