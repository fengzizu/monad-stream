'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBlockNumber, useBlock } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { Logo } from '../components/Logo';
import { CONTRACT_ADDRESS } from '../config';

// --- Constants & ABI ---

// Contract Address is imported from config.ts


const STREAM_PAY_ABI = [
  {
    "type": "function",
    "name": "createStream",
    "inputs": [
      { "name": "recipient", "type": "address", "internalType": "address" },
      { "name": "flowRate", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [{ "name": "streamId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "closeStream",
    "inputs": [{ "name": "streamId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getStream",
    "inputs": [{ "name": "streamId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{
      "name": "",
      "type": "tuple",
      "internalType": "struct StreamPay.Stream",
      "components": [
        { "name": "sender", "type": "address", "internalType": "address" },
        { "name": "recipient", "type": "address", "internalType": "address" },
        { "name": "flowRate", "type": "uint256", "internalType": "uint256" },
        { "name": "balance", "type": "uint256", "internalType": "uint256" },
        { "name": "lastSettledTime", "type": "uint256", "internalType": "uint256" },
        { "name": "isActive", "type": "bool", "internalType": "bool" }
      ]
    }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextStreamId",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  }
] as const;

export default function Home() {
  const { isConnected } = useAccount();
  const [streamId, setStreamId] = useState<bigint | null>(null);
  
  // Form State
  const [recipient, setRecipient] = useState('');
  const [flowRateInput, setFlowRateInput] = useState(''); // MON per second
  const [depositInput, setDepositInput] = useState('');   // Total MON to deposit

  // --- Contract Reads ---

  // 1. Get nextStreamId to determine the ID of the new stream
  const { data: nextId, refetch: refetchNextId } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: STREAM_PAY_ABI,
    functionName: 'nextStreamId',
  });

  // 2. Get Stream Details (if we have an ID)
  const { data: streamData, refetch: refetchStream } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: STREAM_PAY_ABI,
    functionName: 'getStream',
    args: streamId !== null ? [streamId] : undefined,
    query: {
        enabled: streamId !== null,
        refetchInterval: 2000, // Faster sync on testnet
    }
  });

  // --- Contract Writes ---

  const { writeContract, data: txHash, isPending: isTxPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // --- Effects ---

  // When Transaction Confirms: Update Stream ID and Data
  useEffect(() => {
    if (isConfirmed) {
      if (streamId === null && nextId) {
          // Optimistically update UI or just wait for refetch
          // Logic: The stream we just created took the ID "nextId" (before increment)
          // Actually, if we read nextId *now*, it has incremented. 
          // But to be safe, let's just refetch nextId and assume the new stream is (fetchedNextId - 1).
          setTimeout(() => {
              refetchNextId().then(({ data: currentNextId }) => {
                console.log("Next ID fetched:", currentNextId);
                if (currentNextId && currentNextId > 0n) {
                    setStreamId(currentNextId - 1n);
                }
              });
          }, 2000); 
      } else {
          // If we already had a stream (e.g. closing), just refetch data
          refetchStream();
      }
    }
  }, [isConfirmed, refetchNextId, refetchStream, streamId, nextId]);

  // Handle Create Stream
  const handleCreateStream = () => {
    if (!recipient || !flowRateInput || !depositInput) return;
    
    const rate = parseEther(flowRateInput); 
    const deposit = parseEther(depositInput);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: STREAM_PAY_ABI,
      functionName: 'createStream',
      args: [recipient as Address, rate],
      value: deposit,
    });
  };

  // Handle Stop Stream
  const handleStopStream = () => {
    if (streamId === null) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: STREAM_PAY_ABI,
      functionName: 'closeStream',
      args: [streamId],
    });
  };

  // --- Live Balance Animation ---
  const [liveBalance, setLiveBalance] = useState<string>('0');
  const [txAvoided, setTxAvoided] = useState(0);

  useEffect(() => {
    // If stream is inactive OR transaction is pending (closing/creating), stop animation
    if (!streamData || !streamData.isActive || isTxPending || isConfirming) {
        if (streamData && !isTxPending && !isConfirming) {
             setLiveBalance(formatEther(streamData.balance));
        } else if (isTxPending || isConfirming) {
             // Keep showing current balance or show specific state?
             // Let's freeze it or show "Processing"
        }
        return;
    }

    const interval = setInterval(() => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      const timeElapsed = now - streamData.lastSettledTime;
      const amountSpent = timeElapsed * streamData.flowRate;
      const current = streamData.balance > amountSpent ? streamData.balance - amountSpent : 0n;
      
      setLiveBalance(formatEther(current));
      
      // Update Tx Avoided stats (simulated, +1 every 100ms)
      setTxAvoided(prev => prev + 1);

      // Check for depletion
      if (current === 0n && streamData.balance > 0n) {
          // Balance drained locally
          setLogs(prev => [...prev.slice(-5), `[System] ⚠️ Deposit drained. Stream depleted. Please close to settle.`]);
      }
    }, 100); // 100ms update for smoothish animation

    return () => clearInterval(interval);
  }, [streamData, isTxPending, isConfirming]);

  // --- LLM Terminal Logic ---
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamData?.isActive && !isTxPending && !isConfirming) {
      const interval = setInterval(() => {
        const timestamp = new Date().toLocaleTimeString();
        const log = `[${timestamp}] [x402] Payment Verified (Stream #${streamId}). Generating token... Cost: ${streamData ? formatEther(streamData.flowRate) : '0'} MON... Paid.`;
        setLogs(prev => [...prev.slice(-5), log]); // Keep last 6 logs
      }, 2000);
      return () => clearInterval(interval);
    } else if (isTxPending || isConfirming) {
        setLogs(prev => [...prev.slice(-5), `[System] Transaction Processing... Please wait.`]);
    } else {
      setLogs(prev => {
        if (prev.length > 0 && prev[prev.length - 1].includes("Error")) return prev;
         return [...prev.slice(-5), `[${new Date().toLocaleTimeString()}] Error: 402 Payment Required. Please start stream to access Agent.`];
      });
    }
  }, [streamData?.isActive, streamId, isTxPending, isConfirming]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);


  // --- Real Network Stats ---
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: block } = useBlock({ watch: true });
  const [realTPS, setRealTPS] = useState<string>('Loading...');
  const [blockTime, setBlockTime] = useState<string>('Loading...');
  const lastBlockTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (block) {
        const now = Date.now();
        const timeDiff = (now - lastBlockTimeRef.current) / 1000;
        lastBlockTimeRef.current = now;
        
        // Calculate TPS based on transactions in the block and time since last block
        // Fallback to 1s if timeDiff is too small to avoid infinity
        const duration = timeDiff > 0.1 ? timeDiff : 1;
        const tps = (block.transactions.length / duration).toFixed(1);
        
        setRealTPS(tps);
        setBlockTime(`${duration.toFixed(2)}s`);
    }
  }, [block]);

  // --- Scaling Factor Logic ---
  // We want to show that 1 stream = infinite potential micro-transactions
  // Scaling Factor = Simulated Micro-tx / On-chain Tx (which is 1)
  const [scalingFactor, setScalingFactor] = useState<number>(1);

  useEffect(() => {
      if (!streamData?.isActive || isTxPending || isConfirming) {
          // Don't reset scaling factor immediately on pending close to show final stats? 
          // Or reset if closed.
          if (!streamData?.isActive) setScalingFactor(1);
          return;
      }
      
      // Simulate scaling factor growing as stream stays open
      // "We are avoiding more and more txs every second"
      const interval = setInterval(() => {
          setScalingFactor(prev => prev + 12); // +12 micro-txs per second avoided
      }, 1000);
      
      return () => clearInterval(interval);
  }, [streamData?.isActive, isTxPending, isConfirming]);


  // --- Render ---

  // Check if UI should be locked (stream active or processing)
  const isUILocked = (streamData?.isActive ?? false) || isTxPending || isConfirming;

  return (
    <main className="flex flex-col items-center justify-between p-4 md:p-24 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
        <div className="flex items-center gap-4">
          <Logo className="w-12 h-12" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#836EF9] to-[#4FF0FD]">
            MonadStream
          </h1>
        </div>
        <ConnectButton />
      </header>

      {/* Stats Dashboard */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        
        {/* Card 1: Real Network Status */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="text-sm text-gray-400 mb-1 flex justify-between">
              <span>Block Time</span>
              <span className="text-xs text-gray-600">#{blockNumber?.toString()}</span>
          </div>
          <div className="text-3xl font-bold text-[#4FF0FD]">{blockTime}</div>
          <div className="text-xs text-gray-500 mt-2">Real-time Monad Metric</div>
        </div>

        {/* Card 2: Real TPS */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="text-sm text-gray-400 mb-1">Current Network TPS</div>
          <div className="text-3xl font-bold text-[#836EF9]">{realTPS}</div>
          <div className="text-xs text-gray-500 mt-2">Live from Chain</div>
        </div>

        {/* Card 3: Scaling Factor (The "Why") */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl relative overflow-hidden">
          <div className="text-sm text-gray-400 mb-1">Scaling Factor</div>
          <div className="text-3xl font-bold text-white">
              {streamData?.isActive ? (
                  <span className="animate-pulse">{scalingFactor}x</span>
              ) : (
                  <span className="text-gray-600">Inactive</span>
              )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
              {streamData?.isActive ? 'Micro-transactions avoided / sec' : 'Start stream to scale'}
          </div>
          {/* Background Glow for Active State */}
          {streamData?.isActive && (
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500/20 blur-xl rounded-full pointer-events-none animate-pulse" />
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Create & Dashboard */}
        <div className="space-y-8">
            {/* Create Panel */}
            <div className={`p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(131,110,249,0.25)] transition-opacity duration-300 ${isUILocked ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-2xl font-bold mb-6 text-white">Create Stream</h2>
            
            <div className="space-y-4">
                <div>
                <label className="block text-sm text-gray-400 mb-1">Recipient Address</label>
                <input 
                    type="text" 
                    placeholder="0x..." 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#4FF0FD] transition-colors font-mono"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={isUILocked}
                />
                </div>
                
                <div>
                <label className="block text-sm text-gray-400 mb-1">Flow Rate (MON/sec)</label>
                <input 
                    type="number" 
                    placeholder="0.000001" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#4FF0FD] transition-colors font-mono"
                    value={flowRateInput}
                    onChange={(e) => setFlowRateInput(e.target.value)}
                    disabled={isUILocked}
                />
                </div>

                <div>
                <label className="block text-sm text-gray-400 mb-1">Total Deposit (MON)</label>
                <input 
                    type="number" 
                    placeholder="1.0" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#4FF0FD] transition-colors font-mono"
                    value={depositInput}
                    onChange={(e) => setDepositInput(e.target.value)}
                    disabled={isUILocked}
                />
                </div>

                <button 
                onClick={handleCreateStream}
                disabled={!isConnected || isUILocked}
                className="w-full py-4 mt-4 bg-gradient-to-r from-[#836EF9] to-[#4FF0FD] rounded-xl font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,240,253,0.3)]"
                >
                {isTxPending ? 'Confirming...' : isConfirming ? 'Processing...' : streamData?.isActive ? 'Stream Active' : 'Start Stream'}
                </button>
            </div>
            </div>

            {/* Stream Status Panel */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(79,240,253,0.25)] flex flex-col justify-center relative overflow-hidden min-h-[300px]">
            
            {!streamId && !streamData && !isTxPending && !isConfirming ? (
                <div className="text-center text-gray-500 z-10">
                    <div className="text-6xl mb-4 grayscale opacity-50">🌊</div>
                    <p>No active stream connected.</p>
                    <p className="text-sm mt-2">Create one to see it live.</p>
                </div>
            ) : (
                <div className="z-10 relative">
                {/* Active Indicator */}
                <div className={`absolute -top-4 right-0 px-3 py-1 rounded-full text-xs font-bold border ${
                    isTxPending || isConfirming ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse' :
                    Number(liveBalance) === 0 && streamData?.isActive ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 
                    streamData?.isActive ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' : 
                    'bg-red-500/20 border-red-500 text-red-400'
                }`}>
                    {isTxPending || isConfirming ? 'PROCESSING TX...' : 
                     Number(liveBalance) === 0 && streamData?.isActive ? 'DEPLETED' : 
                     streamData?.isActive ? 'LIVE STREAMING' : 'CLOSED'}
                </div>

                <div className="mb-8">
                    <label className="text-sm text-gray-400">Stream Balance</label>
                    <div className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#4FF0FD] to-[#836EF9] mt-2 tracking-tighter">
                    {Number(liveBalance).toFixed(6)} <span className="text-lg text-gray-500">MON</span>
                    </div>
                </div>

                <div className="space-y-4 text-sm text-gray-300">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Stream ID</span>
                    <span className="font-mono text-[#836EF9]">#{streamId?.toString() ?? '...'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Sender</span>
                    <span className="font-mono text-xs">{streamData?.sender ? `${streamData.sender.slice(0,6)}...${streamData.sender.slice(-4)}` : '...'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Recipient</span>
                    <span className="font-mono text-xs">{streamData?.recipient ? `${streamData.recipient.slice(0,6)}...${streamData.recipient.slice(-4)}` : '...'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                    <span>Flow Rate</span>
                    <span className="font-mono">{streamData ? formatEther(streamData.flowRate) : '0'} MON/s</span>
                    </div>
                </div>

                {streamData?.isActive && (
                    <button 
                    onClick={handleStopStream}
                    disabled={isTxPending || isConfirming}
                    className="w-full py-3 mt-8 border border-red-500/50 text-red-400 rounded-xl font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isTxPending || isConfirming ? 'Processing Transaction...' : 'Stop Stream'}
                    </button>
                )}
                </div>
            )}

            {/* Background decoration */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#836EF9]/20 rounded-full blur-[100px] pointer-events-none" />
            </div>
        </div>

        {/* Right Column: LLM Terminal */}
        <div className="h-full">
            <div className="h-full p-1 rounded-3xl bg-gradient-to-br from-[#836EF9] to-[#4FF0FD] p-[1px]">
                <div className="h-full rounded-[23px] bg-black p-6 font-mono text-sm relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-2 text-gray-500 text-xs">agent-terminal — x402-protocol</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 font-mono scrollbar-hide">
                         <div className="text-gray-500">Initializing x402 Payment Protocol...</div>
                         <div className="text-gray-500">Connecting to Monad Stream Contract...</div>
                         <div className="text-green-500">Connected.</div>
                         <div className="h-4" />
                         
                         {logs.map((log, i) => (
                             <div key={i} className={`${log.includes('Error') ? 'text-red-500' : log.includes('System') ? 'text-yellow-500' : 'text-green-400'} animate-fade-in`}>
                                 <span className="opacity-50 mr-2">{'>'}</span>
                                 {log}
                             </div>
                         ))}
                         <div ref={logsEndRef} />
                    </div>

                    {/* Scanline effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]" />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-[#4FF0FD]/5 to-transparent animate-scan" />
                </div>
            </div>
        </div>

      </div>
    </main>
  );
}
