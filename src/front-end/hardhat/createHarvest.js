const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")

// 🧠 Config da rede NERO Testnet
const rpcUrl = "https://rpc-testnet.nerochain.io"
const chainId = 689
const privateKey = "a67036a937b7d305e8a8d70a0803f5c585d70be8ce2ee15d71d48e05e616b6fc"

const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl, {
  chainId,
  name: "neroTestnet",
})
const wallet = new ethers.Wallet(privateKey, provider)

// 🔎 Localiza o ABI do contrato
const contractsDir = path.join("artifacts", "contracts")
const folders = fs.readdirSync(contractsDir)
const harvestFolder = folders.find(f => f.includes("HarvestManager"))

if (!harvestFolder) {
  throw new Error("❌ Não encontrei nenhuma pasta com HarvestManager em artifacts/contracts/")
}

const fullPath = path.join(contractsDir, harvestFolder, "HarvestManager.json")
const artifact = JSON.parse(fs.readFileSync(fullPath, "utf8"))

// ⚠️ Endereço do contrato já deployado
const contractAddress = "0xa4C53F8729A73eE40edA6a56A3eCEbba3422c437"
const contract = new ethers.Contract(contractAddress, artifact.abi, wallet)

const harvests = [
  {
    crop: "Soybean",
    quantity: 1000,
    pricePerUnit: 80,
    deliveryOffsetSeconds: 86400,
    doc: "ipfs://coffee-doc",
  },
  {
    crop: "Coffee",
    quantity: 1200,
    pricePerUnit: 60,
    deliveryOffsetSeconds: 172800,
    doc: "ipfs://soybean-doc",
  },
  {
    crop: "Wheat",
    quantity: 1500,
    pricePerUnit: 45,
    deliveryOffsetSeconds: 259200,
    doc: "ipfs://corn-doc",
  },
  {
    crop: "Corn",
    quantity: 900,
    pricePerUnit: 50,
    deliveryOffsetSeconds: 345600,
    doc: "ipfs://wheat-doc",
  },
  {
    crop: "Corn",
    quantity: 1100,
    pricePerUnit: 55,
    deliveryOffsetSeconds: 432000,
    doc: "ipfs://rice-doc",
  },
]

async function main() {
  for (const [index, h] of harvests.entries()) {
    try {
      console.log(`🌱 [${index + 1}/${harvests.length}] Criando safra de ${h.crop}...`)

      const deliveryTimestamp = Math.floor(Date.now() / 1000) + h.deliveryOffsetSeconds

      const tx = await contract.createHarvest(
        h.crop,
        h.quantity,
        h.pricePerUnit,
        deliveryTimestamp,
        h.doc
      )

      console.log("⏳ Aguardando confirmação...")
      await tx.wait()

      console.log(`✅ Safra de ${h.crop} criada com sucesso!`)
    } catch (err) {
      console.error(`❌ Erro ao criar safra de ${h.crop}:`, err.message)
    }
  }
}

main().catch(err => {
  console.error("❌ Erro geral:", err)
  process.exit(1)
})
