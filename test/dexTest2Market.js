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

  it("ensures the seller has enough tokens to create a SELL market order", async () => {
    await truffleAssert.reverts(dex.createMarketOrder(1, linkTicker, 100, 1));

    await link.approve(dex.address, 500);
    await dex.addToken(linkTicker, link.address, { from: accounts[0] });
    await dex.deposit(100, linkTicker);

    truffleAssert.passes(await dex.createMarketOrder(1, linkTicker, 100, 1));
  });

  it("ensures the buyer has enough ETH when making a BUY market order", async () => {
    await truffleAssert.reverts(dex.createMarketOrder(0, linkTicker, 10, 1));
    await dex.depositEth({ value: 10 });
    await truffleAssert.passes(dex.createMarketOrder(0, linkTicker, 10, 1));
  });

  it("allows market orders to be sumbitted even if orderbook is empty", async () => {
    const orders = await dex.getOrders(linkTicker, 0);
    await dex.depositEth({ value: 10 });
    while (orders.length >= 0) {
      await truffleAssert.passes(
        await truffleAssert.passes(dex.createMarketOrder(0, linkTicker, 10, 1))
      );
    }
  });

  it("should fill market orders until the orderbook is empty OR the order is 100% filled", async () => {});

  it("ensures the ETH balance of the buyer decreases by the corresponding filled amount", async () => {
    await dex.depositEth({ value: 100 });
    await dex.createMarketOrder(0, linkTicker, 20, 1);
    const ethBalance = await dex.balances(accounts[0], "ETH");
    assert(ethBalance == 100 - 20 * 1);
  });

  it("ensures the TOKEN balances of the limit order sellers should decrease by the filled amount", async () => {});

  it("should remove filled orders from the orderbook", async () => {});
});
