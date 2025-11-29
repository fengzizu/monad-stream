import { http, createConfig } from 'wagmi';
import { defineChain } from 'viem';
import { foundry } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { IS_TESTNET } from './config';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

// Select chains based on config
const chains = IS_TESTNET ? [monadTestnet] as const : [foundry, monadTestnet] as const;

export const config = getDefaultConfig({
  appName: 'MonadStream',
  projectId: 'YOUR_PROJECT_ID', // Replaced with env var in production
  chains: chains,
  transports: {
    [monadTestnet.id]: http(),
    [foundry.id]: http(),
  },
  ssr: true,
});
