const regeneratorRuntime = require("regenerator-runtime");
const HDWalletProvider = require('@truffle/hdwallet-provider');
const path = require("path")
require('dotenv').config()

const kovanNode = process.env.KOVAN_NODE;
const privateKey = process.env.PRIVATE_KEY;

module.exports = {
  contracts_build_directory: path.join(__dirname, "./compiled"),
  networks: {
    kovan: { 
      provider: new HDWalletProvider(privateKey, kovanNode, 0),
      network_id: 42,
      gas: 10000000
    },
  },
  compilers: {
    solc: {
      version: "0.8.0",
    },
  },
};
