// frontend/src/config.ts

// 1. Contract Address (Toggle between Local and Testnet)
export const CONTRACT_ADDRESS_LOCAL = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Anvil Default
export const CONTRACT_ADDRESS_TESTNET = '0x2Caf359f45F41E2Fb735E3743717C3a87b957258'; // Monad Testnet

// ⚠️ CHANGE THIS to switch environments
export const IS_TESTNET = true; 

export const CONTRACT_ADDRESS = IS_TESTNET ? CONTRACT_ADDRESS_TESTNET : CONTRACT_ADDRESS_LOCAL;

