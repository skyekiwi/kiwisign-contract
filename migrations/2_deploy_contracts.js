var KiwiSign = artifacts.require("./KiwiSign.sol");
module.exports = async function(deployer) {
  // deployer.deploy(PT_NFT)

  await deployer.deploy(KiwiSign)
};
