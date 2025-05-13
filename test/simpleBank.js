const hre = require("hardhat");
const { expect } = require("chai");

describe("SimpleBank", function () {
  let simpleBank;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await hre.ethers.getSigners();
    
    const SimpleBank = await hre.ethers.getContractFactory("SimpleBank");
    simpleBank = await SimpleBank.deploy();
    await simpleBank.waitForDeployment();
  });

  describe("Account Creation", function () {
    it("Should create a new account", async function () {
      await simpleBank.connect(user1).createAccount();
      expect(await simpleBank.accountExist(user1.address)).to.equal(true);
      expect(await simpleBank.getTotalAccounts()).to.equal(1);
    });

    it("Should not allow creating duplicate accounts", async function () {
      await simpleBank.connect(user1).createAccount();
      await expect(
        simpleBank.connect(user1).createAccount()
      ).to.be.revertedWith("Account already exists");
    });
  });

  describe("Deposits", function () {
    beforeEach(async function () {
      await simpleBank.connect(user1).createAccount();
    });

    it("Should allow deposits", async function () {
      const depositAmount = hre.ethers.parseEther("1.0");
      await simpleBank.connect(user1).deposit({ value: depositAmount });
      expect(await simpleBank.connect(user1).checkBalance()).to.equal(depositAmount);
    });

    it("Should not allow deposit without an account", async function () {
      const depositAmount = hre.ethers.parseEther("0.5");
      await expect(
        simpleBank.connect(user2).deposit({ value: depositAmount })
      ).to.be.revertedWith("Account does not exist");
    });

    it("Should not allow zero deposits", async function () {
      await expect(
        simpleBank.connect(user1).deposit({ value: 0 })
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      await simpleBank.connect(user1).createAccount();
      await simpleBank.connect(user1).deposit({ value: hre.ethers.parseEther("2.0") });
    });

    it("Should allow withdrawals", async function () {
      const withdrawAmount = hre.ethers.parseEther("0.5");
      const initialBalance = await hre.ethers.provider.getBalance(user1.address);
      
      const tx = await simpleBank.connect(user1).withdraw(withdrawAmount);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const finalBalance = await hre.ethers.provider.getBalance(user1.address);
      const expectedBalance = initialBalance + withdrawAmount - gasUsed;
      
      // Account for minor differences due to gas cost calculations
      expect(finalBalance).to.be.closeTo(expectedBalance, hre.ethers.parseEther("0.01"));
      expect(await simpleBank.connect(user1).checkBalance()).to.equal(hre.ethers.parseEther("1.5"));
    });

    it("Should not allow withdrawals without an account", async function () {
      await expect(
        simpleBank.connect(user2).withdraw(hre.ethers.parseEther("0.5"))
      ).to.be.revertedWith("Account does not exist");
    });

    it("Should not allow withdrawals greater than balance", async function () {
      await expect(
        simpleBank.connect(user1).withdraw(hre.ethers.parseEther("3.0"))
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should not allow zero withdrawals", async function () {
      await expect(
        simpleBank.connect(user1).withdraw(0)
      ).to.be.revertedWith("Withdrawal amount must be greater than 0");
    });
  });
});