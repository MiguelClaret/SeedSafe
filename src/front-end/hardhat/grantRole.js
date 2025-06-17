const { ethers } = require("ethers");
const fs = require("fs");

// Configurações de rede
const rpcUrl = "https://rpc-testnet.nerochain.io";
const chainId = 689;
const networkName = "NERO Testnet";

// 📌 Cria o provider corretamente (não tentará usar ENS)
const provider = new ethers.providers.StaticJsonRpcProvider(
  rpcUrl,
  {
    chainId: chainId,
    name: networkName
  }
);

// Chave privada do deployer (⚠️ coloque a sua aqui)
const privateKey = "a67036a937b7d305e8a8d70a0803f5c585d70be8ce2ee15d71d48e05e616b6fc"; 
const wallet = new ethers.Wallet(privateKey, provider);

// Carrega o ABI do contrato (ajuste o path se necessário)
const artifact = JSON.parse(fs.readFileSync("../artifacts/contracts/HarvestManagerV2.sol/HarvestManagerV2.json", "utf8"));
const contractAddress = "0x8FDE74cB3e0075ED08801389A7151163985F1E15"; // ⚠️ coloque aqui o contrato já deployado

// Instancia o contrato
const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);

// Função para executar o grantRole
async function main() {
  console.log("🚀 Conectado na NERO Chain...");

  const role = ethers.utils.id("UPDATER_ROLE");  // Aqui você coloca o role exato (precisa ser o bytes32 correto)
  const targetAddress = "a67036a937b7d305e8a8d70a0803f5c585d70be8ce2ee15d71d48e05e616b6fc"; // Quem vai receber a role

  const tx = await contract.grantRole(role, targetAddress);
  console.log("🎯 Transação enviada:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Role concedido com sucesso!", receipt.transactionHash);
}

main().catch(console.error);
