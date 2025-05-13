const hre = require("hardhat");

async function main() {
  const SimpleBank = await hre.ethers.getContractFactory("SimpleBank");
  const simpleBank = await SimpleBank.deploy();

  await simpleBank.waitForDeployment();
  
  const address = await simpleBank.getAddress();
  console.log(`SimpleBank deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});