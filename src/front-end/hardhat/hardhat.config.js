require("dotenv").config();
require("@nomiclabs/hardhat-ethers");

console.log("✅ RPC_URL carregado:", process.env.RPC_URL);
console.log("✅ PRIVATE_KEY carregado:", process.env.PRIVATE_KEY);

module.exports = {
  defaultNetwork: "neroTestnet",
  networks: {
    neroTestnet: {
      url: process.env.RPC_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 689
    }
  },
  solidity: "0.8.20",
};
