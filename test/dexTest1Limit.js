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

  it("should only allow a user with enough ETH balance to make a buy order", async () => {
    await truffleAssert.reverts(dex.createLimitOrder(0, linkTicker, 10, 1));
    await dex.depositEth({ value: 10 });
    await truffleAssert.passes(dex.createLimitOrder(0, linkTicker, 10, 1));
  });

  it("should only allow a user with enough token balance, to create a sell order for that token", async () => {
    await truffleAssert.reverts(dex.createLimitOrder(1, linkTicker, 10, 1));
    await link.approve(dex.address, 500);
    await dex.addToken(linkTicker, link.address, { from: accounts[0] })
    await dex.deposit(10, linkTicker);

    await truffleAssert.passes(dex.createLimitOrder(1, linkTicker, 10, 1));
  });

  it("ensures that the BUY book should be ordered from high to low", async () => {
    await link.approve(dex.address, 500);
    await dex.depositEth({value: 3000});
    await dex.createLimitOrder(0, linkTicker, 1, 500);
    await dex.createLimitOrder(0, linkTicker, 1, 20);
    await dex.createLimitOrder(0, linkTicker, 1, 30);

    let orderBook = await dex.getOrders(linkTicker, 0);
    assert(orderBook.length > 0);

    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(orderBook[i].price >= orderBook[i + 1].price);
    }
  });

  it("ensures that the SELL book is ordered from low to high", async () => {
    await link.approve(dex.address, 500);
    await dex.createLimitOrder(1, linkTicker, 1, 500);
    await dex.createLimitOrder(1, linkTicker, 1, 200);
    await dex.createLimitOrder(1, linkTicker, 1, 300);

    let orderBook = await dex.getOrders(linkTicker, 1);
    assert(orderBook.length > 0);

    for (let i = 0; i < orderBook.length - 1; i++) {
      assert(orderBook[i].price <= orderBook[i + 1].price);
    }
  });
});
