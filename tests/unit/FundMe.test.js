const { assert, expect } = require("chai");
const { ignition, ethers } = require("hardhat");

describe("FundMe", async function () {
  let fundMe;
  let mock;
  let deployer;
  beforeEach(async function () {
    //deploy our fundMe contract
    //using hardhat ignition to deploy
    [deployer] = await ethers.getSigners();

    const FundMeModule = require("../../ignition/modules/FundMe");
    const deployment = await ignition.deploy(FundMeModule);
    fundMe = deployment.fundMe;
    mock = deployment.mock; // Will be undefined on non-local networks
  });

  describe("Constructor", async function () {
    it("Sets the owner to the deployer", async function () {
      const owner = await fundMe.owner();
      assert.equal(owner, deployer.address);
    });
    it("Sets the price feed to the deplyed mock on hardhat", async function () {
      const priceFeedAddress = await fundMe.s_priceFeed();
      const mockAddress = await mock.getAddress();
      assert.equal(priceFeedAddress, mockAddress);
    });
    it("mock has the expected config(decimals and initial answer)", async function () {
      const decimals = await mock.decimals();
      assert.equal(decimals, 8n);

      const [, answer] = await mock.latestRoundData();
      assert.equal(answer, 2000n * 10n ** 8n);
    });
  });

  describe("Fund", async function () {
    it("Reverts if not enough ETH sent", async function () {
      const belowMin = ethers.parseEther("0.00049");
      await expect(fundMe.fund({ value: belowMin })).to.be.rejectedWith(
        "Not enough ETH sent!"
      );
    });
    it("Records fundings in mapping", async function () {
      const value = ethers.parseEther("0.001");
      await fundMe.fund({ value });

      const funded = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(funded, value);
    });
    it("accumulates fundings for the same sender and appends to funders", async function () {
      const value = ethers.parseEther("0.001");
      await fundMe.fund({ value });
      await fundMe.fund({ value });

      const total = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(total, value * 2n);

      const f0 = await fundMe.funders(0);
      const f1 = await fundMe.funders(1);
      assert.equal(f0, deployer.address);
      assert.equal(f1, deployer.address);
    });
    it("receive() forwards to fund()", async function () {
      const value = ethers.parseEther("0.01");
      const to = await fundMe.getAddress();

      await (await deployer.sendTransaction({ to, value, data: "0x" })).wait();

      const funded = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(funded, value);

      const f0 = await fundMe.funders(0);
      assert.equal(f0, deployer.address);
    });
    it("fallback() forwards to fund()", async function () {
      const value = ethers.parseEther("0.001");
      const to = await fundMe.getAddress();

      await (
        await deployer.sendTransaction({ to, value, data: "0x1234" })
      ).wait();

      const funded = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(funded, value);

      const f0 = await fundMe.funders(0);
      assert.equal(f0, deployer.address);
    });
    it("Supports multiple distinct funders", async function () {
      const [, a1] = await ethers.getSigners();
      const value = ethers.parseEther("0.001");

      await fundMe.fund({ value });
      await fundMe.connect(a1).fund({ value });

      const f0 = await fundMe.funders(0);
      const f1 = await fundMe.funders(1);

      assert.equal(f0, deployer.address);
      assert.equal(f1, a1.address);

      const amount0 = await fundMe.addressToAmountFunded(deployer.address);
      const amount1 = await fundMe.addressToAmountFunded(a1.address);

      assert.equal(amount0, value);
      assert.equal(amount1, value);
    });
  });
  describe("Withdraw", async function () {
    it("Only owner can withdraw", async function () {
      const [, a1] = await ethers.getSigners();
      await expect(fundMe.connect(a1).withdraw()).to.be.rejectedWith(
        "Only withdrawable to owner!"
      );
    });
    it("Withdraw ETH from a single funder", async function () {
      const value = ethers.parseEther("0.001");
      await fundMe.fund({ value });

      const ownerStartBalance = await ethers.provider.getBalance(
        deployer.address
      );
      const contractStartBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      const tx = await fundMe.withdraw();
      const txReceipt = await tx.wait(1);
      const gasPrice = txReceipt.effectiveGasPrice ?? tx.gasPrice;
      const gasCost = BigInt(txReceipt.gasUsed) * BigInt(gasPrice);

      const ownerEndBalance = await ethers.provider.getBalance(
        deployer.address
      );
      const contractEndBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      assert.equal(contractEndBalance, 0n);
      assert.equal(
        ownerEndBalance,
        ownerStartBalance + contractStartBalance - gasCost
      );

      const mappingAfter = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(mappingAfter, 0);

      await expect(fundMe.funders(0)).to.be.rejected;
    });
    it("Withdraw ETH from multiple funders", async function () {
      const [, a1, a2, a3] = await ethers.getSigners();
      const value = ethers.parseEther("0.002");
      await fundMe.fund({ value });
      await fundMe.connect(a1).fund({ value });
      await fundMe.connect(a2).fund({ value });
      await fundMe.connect(a3).fund({ value });

      const ownerStartBalance = await ethers.provider.getBalance(
        deployer.address
      );
      const contractStartBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      const tx = await fundMe.withdraw();
      const txReceipt = await tx.wait(1);
      const gasPrice = txReceipt.effectiveGasPrice ?? tx.gasPrice;
      const gasCost = BigInt(txReceipt.gasUsed) * BigInt(gasPrice);

      const ownerEndBalance = await ethers.provider.getBalance(
        deployer.address
      );
      const contractEndBalance = await ethers.provider.getBalance(
        await fundMe.getAddress()
      );

      assert.equal(contractEndBalance, 0n);
      assert.equal(
        ownerEndBalance,
        ownerStartBalance + contractStartBalance - gasCost
      );

      assert.equal(await fundMe.addressToAmountFunded(deployer.address), 0n);
      assert.equal(await fundMe.addressToAmountFunded(a1.address), 0n);
      assert.equal(await fundMe.addressToAmountFunded(a2.address), 0n);
      assert.equal(await fundMe.addressToAmountFunded(a3.address), 0n);

      await expect(fundMe.funders(0)).to.be.rejected;
    });
    it("can accept new funding after a withdraw(fresh start)", async function () {
      const initial = ethers.parseEther("0.002");
      await fundMe.fund({ value: initial });
      await (await fundMe.withdraw()).wait();

      const next = ethers.parseEther("0.001");
      await fundMe.fund({ value: next });

      const f0 = await fundMe.funders(0);
      assert.equal(f0, deployer.address);

      const amount = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(amount, next);
    });
  });
});
