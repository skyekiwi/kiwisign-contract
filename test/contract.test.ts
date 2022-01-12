import secp256k1 from 'secp256k1'
const publicKeyToAddress = require('ethereum-public-key-to-address')

const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3API = require("web3");
require('dotenv').config();
const KiwiSignContract = require('../compiled/KiwiSign.json');

const kovanNode = process.env.KOVAN_NODE;
const privateKey = process.env.PRIVATE_KEY;

const isValidHex = str => {
  return (str.length & 1) === 0 &&
    (/^[0-9A-Fa-f]*$/g).test(str)
}

const hexToU8a = (hex: string) => {
  if (isValidHex(hex)) {
    return new Uint8Array(hex.match(/[0-9A-Fa-f]{1,2}/g).map(byte => parseInt(byte, 16)));
  } else {
    throw new Error("invalid hex string: Util.hexToU8a")
  }
}

//  --------------------
//    > transaction hash:    0x4ef45f6c198d484ce5aa277caee0bca333f46a459f90d83c92ae59aca2706156
//    > Blocks: 3            Seconds: 19
//    > contract address:    0xbaD09f756359528741e2e236Aa28Eb39cE7b04Ba
//    > block number:        29228923
//    > block timestamp:     1642014544
//    > account:             0x707C726C68896C76A976CCf442796B9134365833
//    > balance:             18.912194292649121355
//    > gas used:            3417294 (0x3424ce)
//    > gas price:           20 gwei
//    > value sent:          0 ETH
//    > total cost:          0.06834588 ETH

const Web3 = new Web3API(new Web3API.providers.HttpProvider(kovanNode))
const sk_hex = 'ebd0c7bc87b885a280a93117bb0d2a7adb74b8e0ef8a753983889065ef6ff89b'
const sk = hexToU8a(sk_hex)
const pk = Buffer.from(secp256k1.publicKeyCreate(sk, false))

//                              deployer-contract creator, contract_key sample 
const wallet_provider = new HDWalletProvider([ privateKey, sk_hex ], kovanNode, 0)
Web3.setProvider(wallet_provider)

let instance, accounts
const setup = async () => {
  accounts = await Web3.eth.getAccounts()
  const networkId = await Web3.eth.net.getId();
  const deployedNetwork = KiwiSignContract.networks[networkId];
  instance = new Web3.eth.Contract(
    KiwiSignContract.abi,
    deployedNetwork && deployedNetwork.address,
  );
}
const cid = 'QmTekCeVYYHCwmU1nZgsoyujufrWSjHYEZH1J7VG8DxWaB'
let contract_id

describe('KiwiSign Contract', function () {
  this.timeout(150000)

  beforeEach(async () => {
    if (!instance) await setup()
  })

  it('create a contract', async() => {

    const tx = instance.methods.createContract(
      cid, publicKeyToAddress(pk)
    )
    contract_id = parseInt(await tx.call())
    await tx.send({
      from: accounts[0],
      gas: 1000000
    })
  })

  it('verify signature', async () => {
    let hash = await instance.methods.createSignatureHash(
      accounts[0], contract_id
    ).call()
    
    const signature = await Web3.eth.sign("" + hash, accounts[1])

    await instance.methods.verifySignature(
      signature, contract_id, cid
    ).send({
      from: accounts[0]
    })
  })
})
