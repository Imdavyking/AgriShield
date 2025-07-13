# ✈️ EventGuard — Autonomous Flight Delay Refunds, Powered by Chainlink

> _"Travel protection that just works — automated, trustless, and fully on-chain."_

---

## 🧩 What is EventGuard?

**EventGuard** is a decentralized application (**dApp**) that enables **instant, on-chain refunds** for **flight delays and cancellations** — no paperwork, no call centers, no waiting.

By integrating **real-time flight data** via trusted APIs and **Chainlink Web3 services**, EventGuard allows travelers to **buy protection**, **monitor flight status**, and **claim refunds automatically** — all governed by **tamper-proof smart contracts**.

---

## 🌍 The Problem We Solve

Flight disruptions cost travelers time, money, and peace of mind. Traditional compensation processes are:

- 🐌 **Slow** — Lengthy, manual claims and long waiting periods
- 🎲 **Inconsistent** — Varies between airlines, routes, and legal systems
- ❌ **Opaque** — Little transparency, confusing terms, endless support calls

---

## ✅ Our Solution

**EventGuard** delivers **frictionless, fully-automated flight protection**:

- 📡 Real-time flight monitoring via off-chain APIs + Chainlink **Functions**
- 🔗 Blockchain-based automation with **Chainlink Automation**
- 💸 Instant payouts in stablecoins — no intermediaries
- 🌐 Cross-chain support — **pay and claim across different blockchains via Chainlink CCIP**

---

## 🔧 How It Works

1. **🎫 Purchase Protection**
   Buy a **Flight Protection Pass** using stablecoins like USDC (on Ethereum, Polygon, etc.) — stored securely on-chain, linked to your wallet.

2. **📡 Real-Time Flight Monitoring**
   EventGuard’s backend fetches flight status from public APIs and relays it on-chain using **Chainlink Functions**.

3. **⚠️ Automated Disruption Detection**
   If your flight is marked **'Delayed'** or **'Cancelled'**, **Chainlink Automation** triggers claim availability.

4. **💰 On-Demand, Verified Payouts**
   With one click, the smart contract verifies flight status and triggers a payout using **Chainlink Proof of Reserve** (for fund solvency) and **VRF** (for randomized airdrops).

---

## 🌐 Cross-Chain Magic

EventGuard uses **Chainlink CCIP** (Cross-Chain Interoperability Protocol) to:

- **Pay and claim** across multiple EVM-compatible blockchains (e.g. Ethereum, Polygon, Avalanche, Arbitrum).
- **Synchronize Protection Passes** and **verify claim proofs** securely across chains.

> _Your protection follows you, no matter what chain you’re on._

---

## 🛠️ Tech Stack

| Layer               | Tools & Technologies                                           |
| ------------------- | -------------------------------------------------------------- |
| **Blockchain**      | Ethereum, Polygon, Arbitrum (EVM Chains)                       |
| **Cross-Chain**     | **Chainlink CCIP**                                             |
| **Off-Chain Data**  | Public Flight APIs via **Chainlink Functions**                 |
| **Automation**      | **Chainlink Automation**                                       |
| **RNG**             | **Chainlink VRF** (Random rewards, airdrops)                   |
| **Solvency**        | **Chainlink Proof of Reserve** (ensures payout pool integrity) |
| **Smart Contracts** | Solidity                                                       |
| **Frontend**        | React, Web3.js, WalletConnect                                  |

---

## 🌟 Key Features

- **✈️ Verified Flight-Based Refunds**
  Real-time disruption detection triggers instant payouts.

- **🎟️ Protection Pass NFTs**
  Unique, on-chain passes linked to individual flights.

- **🔐 Trustless Smart Contract Logic**
  Full transparency — no middlemen, no disputes.

- **💵 Stablecoin Payouts**
  Refunded in USDC or other supported tokens, pegged to real-world value.

- **🌉 Seamless Cross-Chain Integration**
  Powered by **Chainlink CCIP** for secure, reliable cross-chain functionality.

- **🎲 Randomized Flight ID Assignment**
  Secured via **Chainlink VRF** to prevent manipulation.

- **📡 Real-Time Status Validation**
  Fetched and pushed on-chain by **Chainlink Functions**.

- **🎁 Gamified Airdrops**
  Random bonus rewards for users, fairly and verifiably distributed.

---

## 🚀 Quickstart: Launch the App

### 1️⃣ Local Development (with Docker)

- **Ensure Docker is installed and running.**
- **Generate environment secrets:**

  ```bash
  sh create-secrets.sh
  ```

📌 _Ensure your `.env` files are configured for backend and Chainlink Functions._

- **Start backend, frontend, and MongoDB services:**

  ```bash
  docker compose up
  ```

- Access the dApp at **`localhost:5173`**!

---

## 🧪 Demo Walkthrough

1. 🔗 Connect your crypto wallet
2. 🛫 Enter your flight info and buy a Protection Pass
3. 🛰️ Flight monitored via **Chainlink Functions**
4. ⚠️ If delayed/canceled, **Chainlink Automation** activates claim
5. 👆 Click “Claim” → on-chain proof checked → **Stablecoin payout** triggered

---

## 🔭 Roadmap & Future Scope

- 🌍 Add global coverage (multi-leg and international flights)
- 🚄 Expand to trains, ferries, buses, and events
- 🤝 Partner with airlines and travel aggregators
- 📊 User dashboards for tracking flight history and refunds
- 🧠 Risk-based pricing with AI + Chainlink Feeds

---

## 📜 License

Released under the **MIT License** — open-source and built for the community.

---

## 💬 Feedback

> _"Powered by Chainlink — because travelers deserve protection that doesn't leave them stranded."_

---

## 👨‍💻 Built With Passion

- **DavyKing** — Blockchain Developer & Smart Contract Engineer 💙

---
