const Link = artifacts.require("Link");

module.exports = function (deployer) {
  deployer.deploy(Link);
};


// const Link = artifacts.require("Link");
// const Wallet = artifacts.require("Wallet");

// module.exports = async function (deployer, network, accounts) {
//   deployer.deploy(Link);

//   const wallet = await Wallet.deployed();
//   const link = await Link.deployed();

//   await link.approve(wallet.address, 500);

//   const linkTicker = web3.utils.utf8ToHex("LINK")

//   await wallet.addToken(linkTicker, link.address);

//   await wallet.deposit(100, linkTicker);

//   const myLinkBalance = await wallet.balances(
//     accounts[0],
//     linkTicker
//   );

//   console.log("myLinkBalance", myLinkBalance);
// };
