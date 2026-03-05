const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CrowdFund", function () {
  let crowdFund;
  let owner, donor1, donor2;

  const ONE_ETH = ethers.parseEther("1.0");
  const ONE_WEEK = 7 * 24 * 60 * 60; // seconds

  beforeEach(async function () {
    [owner, donor1, donor2] = await ethers.getSigners();
    const CrowdFund = await ethers.getContractFactory("CrowdFund");
    crowdFund = await CrowdFund.deploy();
  });

  // ─── createCampaign ──────────────────────────────────────────────────────

  describe("createCampaign", function () {
    it("creates a campaign and increments campaignCount", async function () {
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
      expect(await crowdFund.campaignCount()).to.equal(1);
    });

    it("stores the correct creator and goal", async function () {
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
      const c = await crowdFund.campaigns(0);
      expect(c.creator).to.equal(owner.address);
      expect(c.goal).to.equal(ONE_ETH);
    });

    it("reverts if goal is zero", async function () {
      await expect(crowdFund.createCampaign(0, ONE_WEEK)).to.be.revertedWith(
        "Goal must be greater than zero"
      );
    });
  });

  // ─── donate ──────────────────────────────────────────────────────────────

  describe("donate", function () {
    beforeEach(async function () {
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
    });

    it("increases raised amount", async function () {
      await crowdFund.connect(donor1).donate(0, { value: ONE_ETH });
      const c = await crowdFund.campaigns(0);
      expect(c.raised).to.equal(ONE_ETH);
    });

    it("reverts after deadline", async function () {
      await time.increase(ONE_WEEK + 1);
      await expect(
        crowdFund.connect(donor1).donate(0, { value: ONE_ETH })
      ).to.be.revertedWith("Campaign has ended");
    });
  });

  // ─── withdraw ────────────────────────────────────────────────────────────

  describe("withdraw", function () {
    beforeEach(async function () {
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
      await crowdFund.connect(donor1).donate(0, { value: ONE_ETH });
      await time.increase(ONE_WEEK + 1);
    });

    it("lets creator withdraw if goal is reached", async function () {
      const before = await ethers.provider.getBalance(owner.address);
      await crowdFund.withdraw(0);
      const after = await ethers.provider.getBalance(owner.address);
      expect(after).to.be.gt(before);
    });

    it("reverts if called by non-creator", async function () {
      await expect(crowdFund.connect(donor1).withdraw(0)).to.be.revertedWith(
        "Only creator can withdraw"
      );
    });

    it("reverts on double-withdraw", async function () {
      await crowdFund.withdraw(0);
      await expect(crowdFund.withdraw(0)).to.be.revertedWith("Already withdrawn");
    });
  });

  // ─── refund ──────────────────────────────────────────────────────────────

  describe("refund", function () {
    beforeEach(async function () {
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
      // Donate only 0.5 ETH — goal not reached
      await crowdFund.connect(donor1).donate(0, { value: ethers.parseEther("0.5") });
      await time.increase(ONE_WEEK + 1);
    });

    it("refunds the donor", async function () {
      const before = await ethers.provider.getBalance(donor1.address);
      await crowdFund.connect(donor1).refund(0);
      const after = await ethers.provider.getBalance(donor1.address);
      expect(after).to.be.gt(before);
    });

    it("reverts if goal was reached", async function () {
      // New campaign where goal IS reached
      await crowdFund.createCampaign(ONE_ETH, ONE_WEEK);
      await crowdFund.connect(donor2).donate(1, { value: ONE_ETH });
      await time.increase(ONE_WEEK + 1);
      await expect(crowdFund.connect(donor2).refund(1)).to.be.revertedWith(
        "Goal was reached - no refunds"
      );
    });

    it("reverts on double-refund", async function () {
      await crowdFund.connect(donor1).refund(0);
      await expect(crowdFund.connect(donor1).refund(0)).to.be.revertedWith(
        "Nothing to refund"
      );
    });
  });
});
