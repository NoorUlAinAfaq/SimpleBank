import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import SimpleBankArtifact from './contracts/SimpleBank.json';
import './App.css';

function App() {
  // State variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [accountExists, setAccountExists] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [totalAccounts, setTotalAccounts] = useState(0);

  // Contract address - replace with your deployed contract address
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Refresh balance
  const refreshBalance = async () => {
    try {
      if (contract && account) {
        const balance = await contract.getBalance(account);
        setBalance(ethers.formatEther(balance));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch account balance');
    }
  };

  // Connect to wallet
  const connectWallet = async () => {
    setError('');
    setLoading(true);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this application.');
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
      
      const signer = await provider.getSigner();
      setSigner(signer);
      
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        SimpleBankArtifact.abi,
        signer
      );
      setContract(contract);
      
      // Check if account exists - FIX: Handle the call properly with try/catch
      try {
        const hasAccount = await contract.accountExist(account);
        setAccountExists(hasAccount);
        
        if (hasAccount) {
          // Get account balance
          await refreshBalance();
        }
      } catch (accountErr) {
        console.error('Error checking if account exists:', accountErr);
        // If it's a decoding error, it's likely because the account doesn't exist
        setAccountExists(false);
        setBalance('0');
      }
      
      // Get total accounts - FIX: Handle potential error
      try {
        const totalAccounts = await contract.getTotalAccounts();
        setTotalAccounts(Number(totalAccounts));
      } catch (countErr) {
        console.error('Error getting total accounts:', countErr);
        setTotalAccounts(0);
      }
      
      setIsConnected(true);
      setSuccessMessage('Wallet connected successfully!');
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Error connecting to wallet');
    } finally {
      setLoading(false);
    }
  };

  // Handle account changes
  const handleAccountsChanged = async (accounts) => {
    setError('');
    setSuccessMessage('');
    
    if (accounts.length === 0) {
      // User disconnected their wallet
      resetState();
    } else {
      // Account changed, update state
      const account = accounts[0];
      setAccount(account);
      
      if (contract) {
        try {
          const hasAccount = await contract.accountExist(account);
          setAccountExists(hasAccount);
          
          if (hasAccount) {
            await refreshBalance();
          } else {
            setBalance('0');
          }
        } catch (err) {
          console.error('Error checking account after change:', err);
          setAccountExists(false);
          setBalance('0');
        }
      }
    }
  };

  // Reset state when wallet is disconnected
  const resetState = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount('');
    setBalance('0');
    setAccountExists(false);
    setDepositAmount('');
    setWithdrawAmount('');
    setIsConnected(false);
    setSuccessMessage('');
  };

  // Create a new account
  const createAccount = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      const tx = await contract.createAccount();
      await tx.wait();
      
      setAccountExists(true);
      setSuccessMessage('Account created successfully!');
      
      // Update total accounts
      const totalAccounts = await contract.getTotalAccounts();
      setTotalAccounts(Number(totalAccounts));
      
      // Refresh balance
      await refreshBalance();
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Deposit funds
  const deposit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Please enter a valid deposit amount');
      }
      
      const amount = ethers.parseEther(depositAmount);
      const tx = await contract.deposit({ value: amount });
      await tx.wait();
      
      setSuccessMessage(`Successfully deposited ${depositAmount} ETH!`);
      setDepositAmount('');
      
      // Refresh balance
      await refreshBalance();
    } catch (err) {
      console.error('Error depositing funds:', err);
      setError(err.message || 'Failed to deposit funds');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw funds
  const withdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        throw new Error('Please enter a valid withdrawal amount');
      }
      
      if (parseFloat(withdrawAmount) > parseFloat(balance)) {
        throw new Error('Insufficient balance');
      }
      
      const amount = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdraw(amount);
      await tx.wait();
      
      setSuccessMessage(`Successfully withdrew ${withdrawAmount} ETH!`);
      setWithdrawAmount('');
      
      // Refresh balance
      await refreshBalance();
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError(err.message || 'Failed to withdraw funds');
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="App">
      <header className="App-header">
        <h1>Simple Bank dApp</h1>
        {!isConnected ? (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="account-info">
            <p>Connected Account: {account.substring(0, 6)}...{account.substring(account.length - 4)}</p>
            
            {accountExists ? (
              <div className="account-details">
                <h2>Your Account</h2>
                <p>Balance: {balance} ETH</p>
                
                <div className="actions">
                  <div className="action-card">
                    <h3>Deposit</h3>
                    <form onSubmit={deposit}>
                      <input
                        type="text"
                        placeholder="Amount (ETH)"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                      <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Deposit'}
                      </button>
                    </form>
                  </div>
                  
                  <div className="action-card">
                    <h3>Withdraw</h3>
                    <form onSubmit={withdraw}>
                      <input
                        type="text"
                        placeholder="Amount (ETH)"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Withdraw'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-account">
                <p>You don't have an account yet.</p>
                <button onClick={createAccount} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            )}
            
            <div className="bank-stats">
              <p>Total Accounts: {totalAccounts}</p>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
      </header>
    </div>
  );
}

export default App;