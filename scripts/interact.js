/**
 * Manual interaction script — demonstrates the full CrowdFund lifecycle:
 *   1. Create a campaign
 *   2. Donate to it
 *   3. Fast-forward time (only works on local Hardhat network)
 *   4. Withdraw funds as creator
 *
 * Run: npx hardhat run scripts/interact.js --network localhost
 */

const hre = require("hardhat");
const { ethers, network } = hre;

// Address printed by deploy.js
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [creator, donor] = await ethers.getSigners();

  const crowdFund = await ethers.getContractAt("CrowdFund", CONTRACT_ADDRESS);

  console.log("\n--- Accounts ---");
  console.log("Creator:", creator.address);
  console.log("Donor:  ", donor.address);

  // ── 1. Create campaign ────────────────────────────────────────────────────
  const goal = ethers.parseEther("1.0");       // 1 ETH
  const duration = 7 * 24 * 60 * 60;           // 7 days in seconds

  console.log("\n[1] Creating campaign (goal: 1 ETH, duration: 7 days)...");
  const tx1 = await crowdFund.connect(creator).createCampaign(goal, duration);
  await tx1.wait();

  const campaignId = 0;
  let c = await crowdFund.campaigns(campaignId);
  console.log("    Campaign created. Goal:", ethers.formatEther(c.goal), "ETH");

  // ── 2. Donate ─────────────────────────────────────────────────────────────
  console.log("\n[2] Donor sends 1 ETH...");
  const tx2 = await crowdFund.connect(donor).donate(campaignId, {
    value: ethers.parseEther("1.0"),
  });
  await tx2.wait();

  c = await crowdFund.campaigns(campaignId);
  console.log("    Raised so far:", ethers.formatEther(c.raised), "ETH");
  console.log("    Goal reached?", await crowdFund.isSuccessful(campaignId));

  // ── 3. Fast-forward time past deadline ────────────────────────────────────
  console.log("\n[3] Fast-forwarding 8 days...");
  await network.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
  await network.provider.send("evm_mine");
  console.log("    Done.");

  // ── 4. Withdraw ───────────────────────────────────────────────────────────
  console.log("\n[4] Creator withdraws funds...");
  const balanceBefore = await ethers.provider.getBalance(creator.address);
  const tx3 = await crowdFund.connect(creator).withdraw(campaignId);
  await tx3.wait();
  const balanceAfter = await ethers.provider.getBalance(creator.address);

  console.log(
    "    Creator balance change: +",
    ethers.formatEther(balanceAfter - balanceBefore),
    "ETH (minus gas)"
  );
  console.log("\nAll steps completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
