# MonadStream 🌊⚡

> **Real-time Money Streaming for the AI Era, powered by Monad.**
> **面向 AI 时代的实时流支付，由 Monad 驱动。**

[![English](https://img.shields.io/badge/Language-English-blue)](#-introduction) [![Chinese](https://img.shields.io/badge/Language-中文-red)](#-简介) ![Monad-Cyberpunk](https://img.shields.io/badge/Monad-Cyberpunk-836EF9) ![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Introduction

**MonadStream** is a high-frequency money streaming dApp designed to demonstrate the raw power of the **Monad** blockchain (10,000 TPS, 1s block time).

In the age of AI Agents, traditional "per-transaction" payment models are too slow and expensive. MonadStream enables **micro-payments per second**, allowing users to stream value to AI Agents, content creators, or service providers in real-time.

This project showcases a **Solidity-based implementation** of money streaming that simulates the user experience of the upcoming **Monad x402 Protocol**.

## 💡 Core Concepts

### 1. Streaming Payment Logic (The "How")
Instead of sending 1,000 transactions for 1,000 seconds of service, MonadStream uses a **Continuous Settlement Formula**:
- **Formula**: `Balance = Deposit - (TimeElapsed * FlowRate)`
- **Magic**: Funds are not moved on-chain every second. They are "streamed" logically.
- **Efficiency**: Only 2 transactions (Create & Close) are needed to represent infinite micro-payments.

### 2. The "Scaling Factor" (The "Why")
Our dashboard features a **Scaling Factor** metric. This represents the multiplier of efficiency we achieve over traditional blockchains.
- **1 Stream = ∞ Micro-transactions**.
- While Monad provides the high-speed infrastructure (1s block time) for instant stream creation, MonadStream provides the **application-layer scalability** to handle billions of AI-to-AI interactions without clogging the network.

### 3. x402 Protocol Simulation
The HTTP `402 Payment Required` code has been reserved since the 90s but never used. We are bringing it back.
- **Red Logs**: When no stream is active, the AI Agent returns `402 Error`.
- **Green Logs**: When a stream is detected, the Agent verifies payment in real-time and streams data (intelligence) back.

## 🚀 Core Features

-   **🌊 Fluid Money Streaming**: Stream MON tokens by the second.
-   **⚡ High-Frequency Updates**: Leverages Monad's 1s block time for near-instant settlement.
-   **🤖 AI Agent Integration Demo**: Features a simulated "AI Terminal" that responds only when a payment stream is active (x402 Simulation).
-   **💸 Massive Gas Savings**: Combines thousands of micro-payments into a single "Create" and "Close" transaction.
-   **🎨 Cyberpunk UI**: A fully responsive, glassmorphism-based interface designed for the Web3 future.

## 🏗 Architecture

### Smart Contract (Foundry)
-   **`StreamPay.sol`**: The core settlement engine.
    -   Uses a `deposit` + `flowRate` model.
    -   Calculates balances dynamically: `balance = deposit - (timeElapsed * flowRate)`.
    -   Implements **Checks-Effects-Interactions** pattern for security.

### Frontend (Next.js)
-   **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
-   **Web3 Integration**: Wagmi v2, Viem, RainbowKit.
-   **State Management**: Real-time local state simulation for smooth "counting down" visual effects (100ms interval).
-   **x402 Simulation**: The frontend mocks the HTTP `402 Payment Required` status code, blocking access to the "AI Terminal" until a stream is verified on-chain.

## 🛠 Getting Started

### Prerequisites
-   Node.js v18+
-   Foundry (for contract development)
-   Git

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/monad-stream.git
    cd monad-stream
    ```

2.  **Install Frontend Dependencies**
    ```bash
    cd frontend
    npm install
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the dApp.

### Smart Contract Deployment (Monad Testnet)

1.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```bash
    PRIVATE_KEY=your_private_key
    MONAD_RPC_URL=https://testnet-rpc.monad.xyz
    ```

2.  **Deploy**
    ```bash
    forge script script/DeployStreamPay.s.sol:DeployStreamPay --rpc-url $MONAD_RPC_URL --broadcast --legacy
    ```

3.  **Update Frontend**
    Copy the deployed contract address and update `CONTRACT_ADDRESS` in `frontend/src/config.ts`.

## 🔗 Contract Addresses

| Network | Contract | Address |
| :--- | :--- | :--- |
| **Monad Testnet** | `StreamPay` | `0x2Caf359f45F41E2Fb735E3743717C3a87b957258` |

> **Note**: This is a hackathon demo running on Monad Testnet (Chain ID: 10143).

## 🔮 Future Roadmap

### Phase 1: Hackathon Demo (Current)
- [x] Basic Stream Creation/Cancellation
- [x] Real-time Balance Visualization
- [x] Simulated AI Agent Terminal (x402 Logic)

### Phase 2: Native Protocol Integration
- [ ] **Monad x402 Protocol**: Replace the Solidity simulation with Monad's native resource pricing protocol when available. This will allow:
    -   Gas-free streaming (protocol level).
    -   HTTP-level 402 error handling enforced by the RPC node.
- [ ] **Multi-Token Support**: Enable streaming of USDC/USDT.
- [ ] **One-to-Many Streams**: "Payroll" mode for streaming to multiple recipients.

---

## 📖 简介

**MonadStream** 是一个高频流支付 dApp，旨在展示 **Monad** 区块链（10,000 TPS，1秒出块时间）的强大性能。

在 AI Agent 时代，传统的“按次交易”支付模式太慢且昂贵。MonadStream 支持**每秒微支付**，允许用户实时向 AI Agent、内容创作者或服务提供商传输价值。

本项目通过 **Solidity 合约** 实现流支付逻辑，模拟了未来 **Monad x402 协议** 的用户体验。

## 💡 核心概念

### 1. 流支付逻辑 (The "How")
MonadStream 使用**连续结算公式**来替代每秒发送的成千上万笔交易：
- **公式**: `余额 = 押金 - (流逝时间 * 流速)`
- **魔法**: 资金并未在链上每秒移动，而是在逻辑上“流动”。
- **效率**: 仅需 2 笔交易（创建 & 关闭）即可实现无限次微支付。

### 2. 扩展因子 (The "Scaling Factor")
我们的仪表盘展示了一个 **扩展因子** 指标。它代表了我们在传统区块链之上实现的效率倍增。
- **1 个流 = ∞ 次微支付**。
- Monad 提供了高速基础设施（1秒出块）来实现即时流创建，而 MonadStream 提供了**应用层扩展性**，以支持数十亿次 AI 交互而不拥堵网络。

### 3. x402 协议模拟
HTTP `402 Payment Required` 状态码自90年代以来一直被保留但从未被使用。我们将其复活。
- **红色日志**: 当没有活跃流时，AI Agent 返回 `402 Error` 并拒绝服务。
- **绿色日志**: 当检测到流时，Agent 实时验证支付并回传数据（智能）。

## 🚀 核心特性

-   **🌊 流畅的资金流**: 按秒流式传输 MON 代币。
-   **⚡ 高频更新**: 利用 Monad 的 1秒出块时间实现近乎即时的结算体验。
-   **🤖 AI Agent 集成演示**: 包含一个模拟的“AI 终端”，仅在支付流激活时响应（x402 模拟）。
-   **💸 大幅节省 Gas**: 将成千上万次微支付合并为单次“创建”和“关闭”交易。
-   **🎨 赛博朋克 UI**: 专为 Web3 未来设计的全响应式、玻璃拟态界面。

## 🏗 技术架构

### 智能合约 (Foundry)
-   **`StreamPay.sol`**: 核心结算引擎。
    -   采用 `deposit`（押金）+ `flowRate`（流速）模型。
    -   动态计算余额：`balance = deposit - (timeElapsed * flowRate)`。
    -   实施 **Checks-Effects-Interactions** 模式以确保安全性。

### 前端 (Next.js)
-   **技术栈**: Next.js 14 (App Router), TypeScript, Tailwind CSS。
-   **Web3 集成**: Wagmi v2, Viem, RainbowKit。
-   **状态管理**: 实时本地状态模拟，实现流畅的“倒计时”视觉效果（100ms 间隔）。
-   **x402 模拟**: 前端模拟 HTTP `402 Payment Required` 状态码，在链上流验证通过前阻止访问“AI 终端”。

## 🛠 快速开始

### 前置要求
-   Node.js v18+
-   Foundry (用于合约开发)
-   Git

### 安装步骤

1.  **克隆仓库**
    ```bash
    git clone https://github.com/yourusername/monad-stream.git
    cd monad-stream
    ```

2.  **安装前端依赖**
    ```bash
    cd frontend
    npm install
    ```

3.  **运行开发服务器**
    ```bash
    npm run dev
    ```
    打开 [http://localhost:3000](http://localhost:3000) 访问 dApp。

### 智能合约部署 (Monad Testnet)

1.  **配置环境**
    在根目录创建 `.env` 文件：
    ```bash
    PRIVATE_KEY=your_private_key
    MONAD_RPC_URL=https://testnet-rpc.monad.xyz
    ```

2.  **部署**
    ```bash
    forge script script/DeployStreamPay.s.sol:DeployStreamPay --rpc-url $MONAD_RPC_URL --broadcast --legacy
    ```

3.  **更新前端**
    复制部署后的合约地址，更新 `frontend/src/config.ts` 中的 `CONTRACT_ADDRESS` 常量。

## 🔗 合约地址

| 网络 | 合约 | 地址 |
| :--- | :--- | :--- |
| **Monad Testnet** | `StreamPay` | `0x2Caf359f45F41E2Fb735E3743717C3a87b957258` |

> **注意**: 这是一个运行在 Monad Testnet (Chain ID: 10143) 上的黑客松演示项目。

## 🔮 未来路线图

### 第一阶段：黑客松演示 (当前)
- [x] 基础流创建/取消
- [x] 实时余额可视化
- [x] 模拟 AI Agent 终端 (x402 逻辑)

### 第二阶段：原生协议集成
- [ ] **Monad x402 协议**: 当可用时，用 Monad 原生资源定价协议替换 Solidity 模拟。这将允许：
    -   协议级免 Gas 流支付。
    -   由 RPC 节点强制执行 HTTP 级 402 错误处理。
- [ ] **多代币支持**: 支持流式传输 USDC/USDT。
- [ ] **一对多流**: “工资单”模式，支持向多个接收者流支付。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进本项目。

## 📄 许可证

本项目基于 **MIT License** 开源。
