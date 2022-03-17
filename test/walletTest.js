const Dex = artifacts.require("Dex");
const Link = artifacts.require("Link");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

contract("Dex", async (accounts) => {
  let dex;
  let link;
  const linkTicker = await web3.utils.utf8ToHex("LINK");

  beforeEach(async () => {
    dex = await Dex.deployed();
    link = await Link.deployed();
  });

  it("should only be possible for owner to add tokens", async () => {
    await truffleAssert.passes(
      dex.addToken(linkTicker, link.address, { from: accounts[0] })
    );
    await truffleAssert.reverts(
      dex.addToken(web3.utils.utf8ToHex("AAVE"), link.address, {
        from: accounts[1],
      })
    );
  });
  it("it should handle deposits correctly", async () => {
    await link.approve(dex.address, 500);
    await dex.deposit(100, linkTicker);
    let balance = await dex.balances(accounts[0], linkTicker);
    assert.equal(balance.toNumber(), 100);
  });
});
