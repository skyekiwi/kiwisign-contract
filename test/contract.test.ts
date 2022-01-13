import secp256k1 from 'secp256k1'
const publicKeyToAddress = require('ethereum-public-key-to-address')

const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3API = require("web3");
require('dotenv').config();
const KiwiSignContract = require('../compiled/KiwiSign.json');

const rinkebyNode = process.env.RINKEBY_NODE;
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
// > transaction hash:    0xe24a169f1fb20709fa685454a2e6149c51a99f6c1123f89212f01218040ed0b0
// > Blocks: 3            Seconds: 43
// > contract address:    0x2469EdB254d499CCbE535956BEdc3a27a4649427
// > block number:        9985216
// > block timestamp:     1642099349
// > account:             0xFe169E439506Cfc7edBca083A0785ee1FE52B9F4
// > balance:             14.703544557907175781
// > gas used:            3417762 (0x3426a2)
// > gas price:           2.500002 gwei
// > value sent:          0 ETH
// > total cost:          0.008544411835524 ETH

const Web3 = new Web3API(new Web3API.providers.HttpProvider(rinkebyNode))
const sk_hex = 'ebd0c7bc87b885a280a93117bb0d2a7adb74b8e0ef8a753983889065ef6ff89b'
const sk = hexToU8a(sk_hex)
const pk = Buffer.from(secp256k1.publicKeyCreate(sk, false))

//                              deployer-contract creator, contract_key sample 
const wallet_provider = new HDWalletProvider([ privateKey, sk_hex ], rinkebyNode, 0)
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
