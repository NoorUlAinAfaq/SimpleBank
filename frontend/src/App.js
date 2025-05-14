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
      
      // Check if account exists
      const hasAccount = await contract.accountExist(account);
      setAccountExists(hasAccount);
      
      if (hasAccount) {
        // Get account balance
        await refreshBalance();
      }
      
      // Get total accounts
      const totalAccounts = await contract.getTotalAccounts();
      setTotalAccounts(Number(totalAccounts));
      
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
        const hasAccount = await contract.accountExist(account);
        setAccountExists(hasAccount);
        
        if (hasAccount) {
          await refreshBalance();
        } else {
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

  // Create bank account
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
      
    } catch (err) {
      console.error('Error creating account:', err);
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  // Deposit funds
  const deposit = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        throw new Error('Please enter a valid deposit amount');
      }
      
      const amountInWei = ethers.parseEther(depositAmount);
      const tx = await contract.deposit({ value: amountInWei });
      await tx.wait();
      
      await refreshBalance();
      setDepositAmount('');
      setSuccessMessage(`Successfully deposited ${depositAmount} ETH!`);
      
    } catch (err) {
      console.error('Error depositing funds:', err);
      setError(err.message || 'Error depositing funds');
    } finally {
      setLoading(false);
    }
  };

  // Withdraw funds
  const withdraw = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        throw new Error('Please enter a valid withdrawal amount');
      }
      
      const amountInWei = ethers.parseEther(withdrawAmount);
      const tx = await contract.withdraw(amountInWei);
      await tx.wait();
      
      await refreshBalance();
      setWithdrawAmount('');
      setSuccessMessage(`Successfully withdrew ${withdrawAmount} ETH!`);
      
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setError(err.message || 'Error withdrawing funds');
    } finally {
      setLoading(false);
    }
  };

  // Refresh account balance
  const refreshBalance = async () => {
    try {
      if (contract && account && accountExists) {
        const balanceWei = await contract.checkBalance();
        const balanceEth = ethers.formatEther(balanceWei);
        setBalance(balanceEth);
      }
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  };

  // Auto-connect on initial load
  useEffect(() => {
    if (window.ethereum) {
      connectWallet();
    }
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // UI display
  return (
    <div className="app-container">
      <header>
        <h1>Simple Bank DApp</h1>
        {!isConnected ? (
          <button onClick={connectWallet} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div className="account-info">
            <p>Connected Account: {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ''}</p>
          </div>
        )}
      </header>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {isConnected && (
        <div className="bank-container">
          <div className="info-section">
            <h2>Bank Information</h2>
            <p>Total Accounts: {totalAccounts}</p>
            {!accountExists ? (
              <div className="create-account">
                <p>You don't have an account yet.</p>
                <button onClick={createAccount} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            ) : (
              <div className="account-details">
                <h3>Your Account</h3>
                <div className="balance-section">
                  <p>Balance: {balance} ETH</p>
                  <button onClick={refreshBalance} className="refresh-button">
                    Refresh
                  </button>
                </div>
                
                <div className="transaction-section">
                  <div className="transaction-form">
                    <h4>Deposit</h4>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="ETH Amount"
                      />
                      <button onClick={deposit} disabled={loading || !depositAmount}>
                        {loading ? 'Processing...' : 'Deposit'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="transaction-form">
                    <h4>Withdraw</h4>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="ETH Amount"
                      />
                      <button onClick={withdraw} disabled={loading || !withdrawAmount}>
                        {loading ? 'Processing...' : 'Withdraw'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isConnected && !loading && (
        <div className="welcome-message">
          <h2>Welcome to Simple Bank DApp</h2>
          <p>Connect your MetaMask wallet to get started.</p>
        </div>
      )}
    </div>
  );
}

export default App;