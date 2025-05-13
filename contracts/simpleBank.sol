// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleBank {
    mapping(address => uint256) private balances;
    mapping(address => bool) private accountExists;
    address[] private accountHolders;
    
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    event AccountCreated(address indexed account);

    // Create a new account
    function createAccount() external {
        require(!accountExists[msg.sender], "Account already exists");
        
        accountExists[msg.sender] = true;
        accountHolders.push(msg.sender);
        
        emit AccountCreated(msg.sender);
    }
    
    // Deposit funds into your account
    function deposit() external payable {
        require(accountExists[msg.sender], "Account does not exist");
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        balances[msg.sender] += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }
    
    // Withdraw funds from your account
    function withdraw(uint256 amount) external {
        require(accountExists[msg.sender], "Account does not exist");
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }
    
    // Check balance of your account
    function checkBalance() external view returns (uint256) {
        require(accountExists[msg.sender], "Account does not exist");
        return balances[msg.sender];
    }
    
    // Check if account exists
    function accountExist(address account) external view returns (bool) {
        return accountExists[account];
    }
    
    // Get total number of accounts
    function getTotalAccounts() external view returns (uint256) {
        return accountHolders.length;
    }
}