const hre = require("hardhat");

async function main() {
  // Get the contract instance at the deployed address
  const SimpleBank = await hre.ethers.getContractFactory("SimpleBank");
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const simpleBank = SimpleBank.attach(contractAddress);
  
  const [owner, user1] = await hre.ethers.getSigners();
  
  console.log("\n--- SimpleBank Interaction Demo ---");
  
  // Create account
  console.log("\nCreating account for:", user1.address);
  let tx = await simpleBank.connect(user1).createAccount();
  await tx.wait();
  console.log("Account created!");
  
  // Check if account exists
  const accountExists = await simpleBank.accountExist(user1.address);
  console.log("Account exists:", accountExists);
  
  // Deposit funds
  const depositAmount = hre.ethers.parseEther("1.0");
  console.log(`\nDepositing ${hre.ethers.formatEther(depositAmount)} ETH...`);
  tx = await simpleBank.connect(user1).deposit({ value: depositAmount });
  await tx.wait();
  
  // Check balance
  let balance = await simpleBank.connect(user1).checkBalance();
  console.log(`Current balance: ${hre.ethers.formatEther(balance)} ETH`);
  
  // Withdraw funds
  const withdrawAmount = hre.ethers.parseEther("0.5");
  console.log(`\nWithdrawing ${hre.ethers.formatEther(withdrawAmount)} ETH...`);
  tx = await simpleBank.connect(user1).withdraw(withdrawAmount);
  await tx.wait();
  
  // Check balance after withdrawal
  balance = await simpleBank.connect(user1).checkBalance();
  console.log(`Updated balance: ${hre.ethers.formatEther(balance)} ETH`);
  
  // Get total accounts
  const totalAccounts = await simpleBank.getTotalAccounts();
  console.log(`\nTotal accounts in the bank: ${totalAccounts}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});