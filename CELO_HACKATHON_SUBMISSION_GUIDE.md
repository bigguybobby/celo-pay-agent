# 🤖 CeloPayAgent — Celo Hackathon Submission Guide

## ⚠️ DEADLINE: February 15, 2026 (6 days)

## Pre-Submission Checklist
- [ ] Register on Karma HQ: https://www.karmahq.xyz
- [ ] Complete SelfClaw verification (if required)
- [ ] Deploy frontend: `vercel login` then `cd frontend && vercel --yes`
- [ ] Submit project via Tweet or Karma platform

## Project Summary (Copy-Paste Ready)

**Project Name:** CeloPayAgent

**Tagline:** AI-Powered Payment Agent for Celo — Splits, Schedules, Group Expenses

**Description:**
CeloPayAgent is an autonomous payment management system on Celo L2 that enables AI agents to execute financial operations on behalf of users. It combines smart contract infrastructure with an AI agent layer to automate payment splitting, scheduled recurring payments, group expense tracking, and agent-authorized transactions — all with sub-cent fees on Celo.

**Category:** AI Agents / Payments / DeFi

**Built With:** Solidity, Foundry, Next.js, TypeScript, Tailwind CSS, wagmi, viem, ConnectKit

## Key Stats
- ✅ 28/28 tests passing
- ✅ 100% line coverage, 100% function coverage, 89% branch coverage
- ✅ Slither clean — no critical/high findings
- ✅ Deployed: `0x5032320210Acf0133F8eAb5c4351E7a275556FEb` (Celo Sepolia)
- ✅ ERC-8004 Agent Registration: ID 0 on `0x8004A818BFB912233c491871b3d84c89A494BD9e`

## Links
- **GitHub:** https://github.com/bigguybobby/celo-pay-agent
- **Contract (Celoscan):** https://celo-sepolia.celoscan.io/address/0x5032320210Acf0133F8eAb5c4351E7a275556FEb
- **Frontend:** [deploy with vercel first]

## Demo Script (2-min walkthrough)
1. Open the dashboard → show overview page with agent stats
2. Connect wallet (MetaMask/WalletConnect via ConnectKit)
3. **Create a Split** — add 3 recipients with shares (40/30/30), select cUSD token
4. **Execute Split** — send 100 cUSD, show it distributes to recipients
5. **Schedule Payment** — set up monthly rent payment (500 cUSD, 30-day interval)
6. **Create Group** — "Team Lunch" with 3 members
7. **Add Expense** — Alice paid 90 cUSD for dinner
8. Show the Agent Authorization panel — authorize an AI agent with 1000 cUSD max per tx
9. Show the getDuePayments view — agent can query which payments are ready

## Why Celo is Perfect for This
- **Sub-cent fees** — agents can execute hundreds of micro-payments economically
- **Fast 5s finality** — payments settle instantly
- **Stablecoin-native** — cUSD, cEUR for real-world payments
- **Mobile-first** — MiniPay integration for 2B+ mobile users
- **ERC-8004** — native agent identity registry on Celo

## Tweet Template
```
🤖 Introducing CeloPayAgent — AI-Powered Payment Agent on @CeloOrg

✅ Payment splitting (configurable shares)
✅ Scheduled recurring payments
✅ Group expense tracking & settlement
✅ AI agent authorization with spending caps

28 tests | 100% coverage | Deployed on Celo Sepolia

Built for #CeloBuildAgents hackathon

GitHub: github.com/bigguybobby/celo-pay-agent
Contract: 0x5032320210Acf0133F8eAb5c4351E7a275556FEb
```
