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

  /////////// VERSION 1//////////
  //   it("ensures the seller has enough tokens to create a SELL market order", async () => {
  //     await truffleAssert.reverts(dex.createMarketOrder(1, linkTicker, 100));

  //     await link.approve(dex.address, 500);
  //     await dex.addToken(linkTicker, link.address, { from: accounts[0] });
  //     await dex.deposit(100, linkTicker);

  //     truffleAssert.passes(await dex.createMarketOrder(1, linkTicker, 100));
  //   });
  ////////// VERSION 2 ///////////
  it("should throw an error when creating a SELL market order without enough token balance", async () => {
    const balance = await dex.balances(accounts[0], linkTicker);
    assert.equal(balance.toNumber(), 0, "Initial TOKEN balance is not zero");
    truffleAssert.reverts(await dex.createMarketOrder(1, linkTicker, 10));
  });
  /////////////////////////////////

  //////////////// VERSION 1 /////////////
  //   it("ensures the buyer has enough ETH when making a BUY market order", async () => {
  //     await truffleAssert.reverts(dex.createMarketOrder(0, linkTicker, 10));
  //     await dex.depositEth({ value: 10 });
  //     await truffleAssert.passes(dex.createMarketOrder(0, linkTicker, 10));
  //   });
  //////////////// VERSION 2 /////////////
  it("should throw an error when creating a BUY order without enough ETH", async () => {
    const balance = await dex.balances(
      accounts[0],
      web3.utils.utf8ToHex("ETH")
    );
    assert.equal(balance.toNumber(), 0, "ETH balance is not zero");
    truffleAssert.reverts(await dex.createMarketOrder(0, linkTicker, 10));
  });
  ////////////////////////////////////////

  it("allows market orders to be sumbitted even if orderbook is empty", async () => {
    const orders = await dex.getOrders(linkTicker, 0);
    await dex.depositEth({ value: 100000 });
    const orderBook = await dex.getOrders(linkTicker, 0);
    assert(orderBook.length == 0, "Orderbook is not empty");
    await truffleAssert.passes(dex.createMarketOrder(0, linkTicker, 10));
  });

  it("market orders should not fill more limit orders than the market order amount", async () => {
    // get sell book
    let orderBook = await dex.getOrders(linkTicker, 1);
    // add LINk
    await dex.addToken(linkTicker, link.address, { from: accounts[0] });
    // transfer LINK to accounts from accounts[0]
    link.transfer(accounts[1], 500);
    link.transfer(accounts[2], 500);
    link.transfer(accounts[3], 500);
    // have each account approve dex
    link.approve(dex.address, 50, { from: accounts[1] });
    link.approve(dex.address, 50, { from: accounts[2] });
    link.approve(dex.address, 50, { from: accounts[3] });
    // deposit into dex from each account
    dex.deposit(50, linkTicker, { from: accounts[1] });
    dex.deposit(50, linkTicker, { from: accounts[2] });
    dex.deposit(50, linkTicker, { from: accounts[3] });
    // each account creates limit order
    dex.createLimitOrder(1, linkTicker, 5, 300, { from: accounts[1] });
    dex.createLimitOrder(1, linkTicker, 5, 400, { from: accounts[2] });
    dex.createLimitOrder(1, linkTicker, 5, 500, { from: accounts[3] });
    // create market order for 2/3 of limit orders
    dex.createMarketOrder(0, linkTicker, 15);
    // get an updated version of sell order book
    orderBook = await dex.getOrders(linkTicker, 1);
    // assert that sell order book has 1/3 left in it
    assert(
      orderBook.length == 1,
      "There should be only 1 order left in the book"
    );
    // the order left should have 0 filled
    assert(
      orderBook[0].filled == 0,
      "The order left in the book should not be filled at all"
    );
  });

  it("ensures market orders should be filled until orderbook is empty", async () => {
    // create more limit orders to populate the sell order book
    dex.createLimitOrder(1, linkTicker, 5, 300, { from: accounts[1] });
    dex.createLimitOrder(1, linkTicker, 5, 400, { from: accounts[2] });
    // check the balance of the buyer before buying
    let buyerBalanceBefore = await dex.balances(accounts[0], linkTicker);
    // create a market order for the buyer, whose amount surpasses the orders in the sell book
    await dex.createMarketOrder(0, linkTicker, 50);
    // check the balance of the buyer after
    let buyerBalanceAfter = await dex.balances(accounts[0], linkTicker);
    // balance of the buyer after should be equal to balance before  + amount purchased
    assert(buyerBalanceBefore.toNumber() + 15 == buyerBalanceAfter.toNumber());
  });

  it("ensures the ETH balance of the buyer decreases by the corresponding filled amount", async () => {
    // account 1 approves dex
    link.approve(dex.address, 200, { from: accounts[1] });
    // account 1 deposits in dex
    dex.deposit(200, linkTicker, { from: accounts[1] });
    // account 1 create a sell limit order
    dex.createLimitOrder(1, linkTicker, 1, 100, { from: accounts[1] });
    // check ETH balance before
    let buyerBalanceBefore = await dex.balances(
      accounts[0],
      web3.utils.utf8ToHex("ETH")
    );
    // account 0 creates a buy order (already deposited a bunch in the functions above)
    dex.createMarketOrder(0, linkTicker, 1);
    // check ETh balance after
    let buyerBalanceAfter = await dex.balances(
      accounts[0],
      web3.utils.utf8ToHex("ETH")
    );
    // assert ETH balance before - amount purchased = ETH balance after
    assert(buyerBalanceBefore.toNumber() - 100 == buyerBalanceAfter.toNumber());
  });

  it("ensures the TOKEN balances of the limit order sellers should decrease by the filled amount", async () => {
    //make sure orderbook is empty
    let orderBook = await dex.getOrders(linkTicker, 1);
    assert(orderBook.length == 0, "Orderbook needs to be empty at this point");

    // account[1] has some LINK there, so no need to add more
    // account[2] approves and deposits some LINK
    await link.approve(dex.address, 1000, { from: accounts[2] });
    await dex.deposit(100, linkTicker, { from: accounts[2] });

    // accounts [1] and [2] create a limit order
    await dex.createLimitOrder(1, linkTicker, 1, 300, { from: accounts[1] });
    await dex.createLimitOrder(1, linkTicker, 1, 400, { from: accounts[2] });

    // check LINK balance for accounts [1] and [2]
    let balanceBefore1 = await dex.balances(accounts[1], linkTicker);
    let balanceBefore2 = await dex.balances(accounts[2], linkTicker);

    // account[0] deposits some ETH
    await dex.depositEth({ value: 1000 });

    // account[0] creates a BUY market order to buy all of [1] and [2]
    await dex.createMarketOrder(0, linkTicker, 2);

    // check LINK balance for accounts [1] and [2] after the transaction
    let balanceAfter1 = await dex.balances(accounts[1], linkTicker);
    let balanceAfter2 = await dex.balances(accounts[2], linkTicker);

    // assert that the LINK balance before is balance after minus amount
    assert(balanceBefore1 - 1 == balanceAfter1);
    assert(balanceBefore2 - 1 == balanceAfter2);
  });

  it("should remove filled orders from the orderbook", async () => {
    // create sell order
    await link.approve(dex.address, 100, { from: accounts[1] });
    await dex.deposit(50, linkTicker, { from: accounts[1] });
    await dex.createLimitOrder(1, linkTicker, 2, 50, { from: accounts[1] });

    // create buy order
    await dex.depositEth({ value: 200 });
    await dex.createMarketOrder(0, linkTicker, 2);

    // define buy and sell orderbook arrays
    const buyBook = await dex.getOrders(linkTicker, 0);
    const sellBook = await dex.getOrders(linkTicker, 1);

    // since orders are matching they should be removed
    assert(
      buyBook.length == 0 && sellBook.length == 0,
      "both buy and sell order books should be empty at this point "
    );
  });

  it("updates partially filled limit orders correctly", async () => {
    // make sure sell orderbook is empty
    let orderBook = await dex.getOrders(linkTicker, 1);
    assert(orderBook.length == 0, "orderbook needs to be empty at the start");

    // create a sell limit order for 5 LINK
    await dex.deposit(50, linkTicker, { from: accounts[1] });
    await dex.createLimitOrder(1, linkTicker, 5, 200, {from: accounts[1]});

    // create a buy market order for 2 LINK
    await dex.depositEth({ value: 500 });
    await dex.createMarketOrder(0, linkTicker, 2);
    // retrieve sell order book
    orderBook = await dex.getOrders(linkTicker, 1);
    // make sure that the order `filled` property is 8
    assert(orderBook[0].filled == 2, "only 2 orders have to be filled");
    assert(orderBook[0].amount == 5, "the order created was for 5 LINK");
  });
});
