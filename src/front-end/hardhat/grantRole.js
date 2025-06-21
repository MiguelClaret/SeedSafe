const { ethers } = require("ethers");
const fs = require("fs");

const rpcUrl = "https://rpc-testnet.nerochain.io";
const chainId = 689;
const networkName = "NERO Testnet";

const path = require("path");
console.log("✅ Conteúdo de artifacts/contracts:", fs.readdirSync("artifacts/contracts"));

const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, {
  chainId,
  name: networkName,
});

const privateKey = "a67036a937b7d305e8a8d70a0803f5c585d70be8ce2ee15d71d48e05e616b6fc";
const wallet = new ethers.Wallet(privateKey, provider);

// ⚠️ Caminho correto agora!
const artifact = JSON.parse(
  fs.readFileSync("artifacts/contracts/HarvestManagerV2.sol/HarvestManagerV2.json", "utf8")
);

const contractAddress = "0x8FDE74cB3e0075ED08801389A7151163985F1E15";
const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

async function main() {
  console.log("🚀 Conectado na NERO Chain...");
  console.log("👤 Usando conta:", wallet.address);

  const role = ethers.utils.id("PRODUCER_ROLE");
  const targetAddress = wallet.address;

  const tx = await contract.grantRole(role, targetAddress);
  console.log("🎯 Transação enviada:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ PRODUCER_ROLE concedido com sucesso:", receipt.transactionHash);
}

main().catch(console.error);
