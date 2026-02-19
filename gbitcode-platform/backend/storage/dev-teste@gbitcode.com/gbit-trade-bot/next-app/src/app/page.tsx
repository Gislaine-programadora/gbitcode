'use client';

import { createThirdwebClient, getContract } from "thirdweb";
import { useConnect } from "thirdweb/react";
import { sepolia, base } from "thirdweb/chains";
import { useState } from "react";

const client = createThirdwebClient({ 
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID 
});

export default function Home() {
  const { connect, isConnecting } = useConnect();
  const [chain, setChain] = useState("sepolia");
  const [balance, setBalance] = useState("0");

  const handleClaim = async () => {
    // Simula profit do trade
    const profit = "0.01"; // ETH
    alert(`🎉 Claiming ${profit} ETH to your wallet!`);
    // Aqui vai a tx real depois
  };

  return (
    <div style={{padding: 20, textAlign: 'center'}}>
      <h1>🤖 Gbit Trade Bot</h1>
      
      <select 
        value={chain} 
        onChange={(e) => setChain(e.target.value)}
        style={{margin: 10, padding: 5}}
      >
        <option value="sepolia">Sepolia (Test)</option>
        <option value="base">Base (Real)</option>
      </select>

      <br />
      <button 
        onClick={() => connect({ client })}
        disabled={isConnecting}
        style={{padding: 10, margin: 10}}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      <br />
      <button 
        onClick={handleClaim}
        style={{padding: 10, background: 'green', color: 'white'}}
      >
        Claim Profit & Close
      </button>

      <p>Balance: {balance} ETH</p>
    </div>
  );
}
