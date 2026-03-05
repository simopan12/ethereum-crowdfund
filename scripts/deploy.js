const hre = require("hardhat");

async function main() {
  const CrowdFund = await hre.ethers.getContractFactory("CrowdFund");
  const crowdFund = await CrowdFund.deploy();
  await crowdFund.waitForDeployment();

  const address = await crowdFund.getAddress();
  console.log(`CrowdFund deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
