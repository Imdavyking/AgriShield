# 🌾 AgriShield

AgriShield is a decentralized crop insurance platform that helps farmers protect their livelihoods against climate risks such as drought and excess rainfall. It uses satellite-monitored weather data and smart contracts to automate insurance coverage and payouts.

---

## 🚀 Features

- ✅ Weather-indexed insurance for farmers
- ✅ Automatic payouts triggered by satellite/weather data
- ✅ Smart contract-backed transparency
- ✅ Supports multiple plans and tokens
- ✅ Clean UI with React + Tailwind CSS

---

## 📦 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Blockchain:** Solidity smart contracts
- **Web3 Integration:** Ethers.js or Web3.js
- **Satellite/Weather Monitoring:** (Placeholder or real oracle integration)
- **Deployment:** Vercel / Netlify / IPFS (optional)

---

## 🖼️ Pages Overview

| Page        | Description |
|-------------|-------------|
| `/`         | Home page with hero, features, and CTA |
| `/register` | Register your farm and select insurance plan/token |
| `/plans`    | View available insurance plans (with demo or on-chain data) |
| `/dashboard`| (Optional) View your active policies and payout status |

---

## 📄 Smart Contract

```solidity
struct InsurancePlan {
    uint256 id;
    uint256 latitude;
    uint256 longitude;
    uint256 startDate;
    uint256 endDate;
    uint256 amountInUsd;
}

function payForPolicy(uint256 planId, address token) public payable;
````

> Contract handles payment and activates weather monitoring for automatic payout eligibility.

---

## 🧪 Running Locally

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/agrishield.git
   cd agrishield
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the dev server**

   ```bash
   npm run dev
   ```

---

## 📍 Future Features

* ✅ Oracle integration (Chainlink, satellite APIs)
* ✅ Farmer dashboard
* ✅ Email/Wallet notifications
* ✅ Polygon or Arbitrum deployment
* ✅ Mobile-first responsive UI

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📧 Contact

For questions, reach out at:
📩 **[support@agrishield.com](mailto:support@agrishield.com)**

---

## 🛡️ License

MIT License © 2025 AgriShield Team

```

---