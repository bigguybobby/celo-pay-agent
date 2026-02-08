# 🤖 CeloPayAgent — AI-Powered Payment Agent on Celo

> Built for the Celo "Build Agents for the Real World" Hackathon (Feb 6–15, 2026)

## What is CeloPayAgent?

CeloPayAgent is an autonomous payment management system on Celo L2 that enables AI agents to execute financial operations on behalf of users. It combines smart contract infrastructure with an AI agent layer to automate:

- **Payment Splitting** — Distribute funds to multiple recipients based on configurable shares
- **Scheduled Payments** — Recurring transfers (rent, salaries, subscriptions) executed automatically by AI agents
- **Group Expenses** — Track shared costs, calculate net balances, and settle debts in cUSD
- **Agent Authorization** — Users delegate payment execution to AI agents with spending caps

## Why Celo?

Celo is the ideal chain for payment agents:
- **Sub-cent transaction fees** — agents can execute many small payments economically
- **Fast finality** — payments settle in seconds
- **Stablecoin-native** — cUSD, cEUR, cREAL for real-world value
- **Mobile-first** — MiniPay integration for billions of users

## Architecture

```
User → authorizes → AI Agent → monitors & executes → PayAgent Contract → cUSD transfers on Celo
```

1. **Users** create splits, schedule payments, or form expense groups via the frontend
2. **AI Agent** monitors for due payments and triggers contract execution
3. **PayAgent Contract** handles all token transfers with built-in authorization checks
4. Everything runs on **Celo L2** with stablecoins

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Solidity, Foundry |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Web3 | wagmi, viem |
| Chain | Celo L2 (Alfajores testnet) |
| Stablecoins | cUSD (Celo Dollar) |

## Quick Start

### Smart Contracts

```bash
cd contracts
forge build
forge test -v
```

### Frontend

```bash
npm install
npm run dev
```

### Deploy to Celo Alfajores

```bash
source ~/.env.private
cd contracts
forge create --rpc-url https://alfajores-forno.celo-testnet.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  src/PayAgent.sol:PayAgent
```

## Contract: PayAgent.sol

### Key Functions

| Function | Description |
|----------|-------------|
| `createSplit()` | Create a reusable payment split configuration |
| `executeSplit()` | Distribute tokens according to split ratios |
| `schedulePayment()` | Set up a recurring payment |
| `executeScheduled()` | Execute a due payment (designed for agents) |
| `createGroup()` | Create an expense-sharing group |
| `addExpense()` | Log an expense in a group |
| `settleGroup()` | Settle all group debts with calculated transfers |
| `authorizeAgent()` | Grant an AI agent permission with spending cap |
| `getDuePayments()` | View function for agents to find actionable payments |

### Tests

6/6 tests passing:
- ✅ Create and execute splits
- ✅ Schedule and execute recurring payments
- ✅ Group expense tracking and settlement
- ✅ Agent authorization and revocation
- ✅ Payment cancellation
- ✅ Due payment detection

## Team

**bigguybobby** — Solidity developer, security researcher, full-stack builder
- Smart contract security auditing (Pinto, Alchemix, Threshold, SSV)
- Active bug bounty hunter
- Full-stack: Next.js + Solidity + Foundry

## License

MIT
