const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");
const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");

contract("Dex", async (accounts) => {
  let dex;
  let link;

  let linkTicker;

  beforeEach(async () => {
    dex = await Dex.deployed();
    link = await Link.deployed();
    linkTicker = await web3.utils.utf8ToHex("LINK");
  });

  // when creating a SELL market order, the seller needs to have enough tokens for the trade
  // when creating a BUY market order, the buyer needs to have enough ETH balance
  // market orders can be submitted even if the orderbook is empty
  // market orders should be filled unitl the orderbook is empty OR the order is 100% filled
  // the ETH balance of the buyer should decrease with the corresponding filled amount
  // the token balances of the limit order sellers should decrease with the filled amount
  // filled orders should be removed from the orderbook

  

})