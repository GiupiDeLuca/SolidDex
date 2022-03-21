const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");
const { isTypedArray } = require("util/types");
const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");

contract("Dex", async (accounts) => {
  let dex;
  let link;

  const linkTicker = await web3.utils.utf8ToHex("LINK");

  beforeEach(async () => {
    dex = await Dex.deployed();
    link = await Link.deployed();
  });

  it("should only allow a user with enough ETH balance to make a buy order", async () => {
    await truffleAssert.reverts(dex.createLimitOrder(0, linkTicker, 10, 1));
    await dex.depositEth({ value: 10 });
    // await dex.deposit(10, web3.utils.utf8ToHex("ETH"), {from: accounts[0]});
    await truffleAssert.accepts(dex.createLimitOrder(0, linkTicker, 10, 1));
  });

  it("should only allow a user with enough token balance, to create a sell order for that token", async () => {
    await truffleAssert.reverts(dex.createLimitOrder(1, linkTicker, 10, 1));
    await link.approve(dex.address, 500);
    await dex.deposit(10, linkTicker);

    await truffleAssert.passes(dex.createLimitOrder(1, linkTicker, 10, 1));
  });

  it("ensures that the BUY book should be ordered from high to low", async () => {
    await link.approve(dex.address, 1000);
    await dex.createLimitOrder(0, linkTicker, 1, 500);
    await dex.createLimitOrder(0, linkTicker, 1, 200);
    await dex.createLimitOrder(0, linkTicker, 1, 300);

    const orderBook = await dex.getOrders(linkTicker, 0);

    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(orderBook[i] >= orderBook[i + 1]);
    }
  });

  it("ensures that the SELL book is ordered from low to high", async () => {
    await link.approve(dex.address, 1000);
    await dex.createLimitOrder(1, linkTicker, 1, 500);
    await dex.createLimitOrder(1, linkTicker, 1, 200);
    await dex.createLimitOrder(1, linkTicker, 1, 300);

    const orderBook = await dex.getOrders(linkTicker, 1);

    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(orderBook[i] <= orderBook[i + 1]);
    }
  });
});
