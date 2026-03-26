# Donation Tracking & DAO Governance

A Web3 DApp prototype focused on eradicating distrust in donations for animal protection through radical transparency and decentralized governance on the Ethereum Sepolia network.

---

## Project Overview
This project demonstrates how blockchain technology solves the "trust gap" in the non-profit sector by providing:

* **Immutable Tracking:** Every cent donated is recorded on-chain.
* **Active Governance:** Donors become DAO members, deciding the destination of funds.
* **Global Impact:** Removal of banking barriers for international donations.

> **Technical Note:** This is a prototype, not a production-ready DAO.

---

## Problem vs. Solution 

### The Critical Scenario
* **Trust Crisis:** According to the FEBRACA (Brazilian Federation of the Animal Cause) report, the lack of transparency in financial reporting is the main reason preventing larger or recurring donations.
* **Mass Abandonment:** Brazil has approximately 30 million abandoned animals, with shelters operating at 135% capacity.
* **Explosion of Abuse:** CNJ (National Council of Justice of Brazil) data shows a 1,400% increase in judicial processes for animal cruelty over the last 4 years.
* **Financial Dependency:** 62% of NGOs survive solely on individual donations but lack the tools to prove exactly where the money was spent.

### The Solution
* **Eliminating Distrust:** By replacing PDF reports with Blockchain records, donors don't need to "believe" the NGO; they can verify balances and expenses directly on the block explorer (Etherscan).
* **Universal Participation:** Anyone in the world can donate and participate in governance without bank intermediaries or international remittance fees.
* **Strategic Stakeholders:** This model meets the transparency requirements of global giants like WWF (World Wide Fund for Nature), Ampara Animal, and ESG (Environmental, Social, and Governance) investors.

---

## Global Impact & DAO Governance
The core differentiator of the project is turning the donor into a governance member:

* **Total Transparency:** The donation flow is visible to the entire world, eliminating doubts about the final destination of the capital.
* **Cryptographic Voting:** Decisions on which animals receive emergency surgeries or shelter renovations can be voted on by platform token holders.
* **Scalability:** A model that can be replicated by any animal NGO on the planet to attract international resources with automatic auditing.

---

## Technologies Used
* **Frontend:** React 19, Vite, Semantic UI React, wagmi, viem, ethers.js.
* **Web3 Backend:** Solidity, OpenZeppelin ERC721.
* **Network:** Ethereum Sepolia Testnet.
* **Storage:** Pinata (IPFS) for metadata and images.

---

## Setup and Execution

### 1. Smart Contracts (Remix IDE)
1.  In MetaMask, select the **Sepolia** network.
2.  In Remix, set the environment to **Injected Provider (MetaMask)**.
3.  Deploy in order:
    * **First:** `PatasConfiaUsers.sol`
    * **Second:** `PatasConfia.sol` (passing the first contract's address into the constructor).

### 2. Frontend Configuration
Create a `.env` file inside the `frontend/` folder:
```env
VITE_PINATA_JWT=your_pinata_jwt_token
In the file frontend/src/config.js, update with the Sepolia addresses:

JavaScript
export const USERS_CONTRACT_ADDRESS = "0x...";
export const PETS_CONTRACT_ADDRESS = "0x...";
3. Running Locally
Bash
cd frontend
pnpm install
pnpm dev
The app will be available at http://localhost:5173.
