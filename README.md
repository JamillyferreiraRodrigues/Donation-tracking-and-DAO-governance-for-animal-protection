# Donation Tracking and DAO Governance for Animal Protection

A prototype **Web3 DApp** focused on improving **transparency and trust in donations** for animal protection organizations.

---

## Overview

This project demonstrates how blockchain technology can be used to:

* Track donations transparently
* Increase trust between donors and organizations
* Enable community participation through a **DAO governance concept**

> This is a **prototype**, not a production-ready DAO.

---

## Key Idea

the platform focuses on:

* Tracking donation flows on-chain
* Using wallets as user identity
* Simulating DAO governance 

---

#  Tools, Technologies and SDKs Used

### **Frontend**

* React 19
* Vite
* Semantic UI React
* @tanstack/react-query
* wagmi
* viem
* ethers.js

---

### **Web3 Backend**

* Solidity
* OpenZeppelin ERC721
* Hardhat (if used)

---

### **Storage**

* Pinata for storing:

  * images (from the original project structure)
  * metadata JSON (tokenURI)

---

### **Project Dependencies**

# **How to Run the Project**

```txt
dependencies:
@tanstack/react-query 5.90.11
@uidotdev/usehooks 2.4.1
ethers 5.8.0
react 19.2.0
react-dom 19.2.0
semantic-ui-css 2.5.0
semantic-ui-react 2.1.5
viem 1.21.1
wagmi 1.4.12

devDependencies:
@eslint/js 9.39.1
@types/react 19.2.7
@types/react-dom 19.2.3
@vitejs/plugin-react 5.1.1
eslint 9.39.1
eslint-plugin-react-hooks 7.0.1
eslint-plugin-react-refresh 0.4.24
globals 16.5.0
vite 7.2.4
```

---

# **Pinata Configuration (Required)**

Create a `.env` file inside the `frontend/` folder:

```
VITE_PINATA_JWT=<your_pinata_jwt_key>
```

This key is used to upload data and generate the tokenURI.

---

## **1. Deploy Smart Contracts on the CESS Network**

Before running the frontend, you must deploy the smart contracts.

### Steps:

1. Open Remix IDE
2. Go to **Deploy & Run Transactions**
3. In *Environment*, select:
   **Injected Provider (MetaMask)**
4. In MetaMask, select the **CESS network**
5. Deploy the contracts:

   * `PatasConfiaUsers.sol`
   * `PatasConfia.sol` (using the address of the previous contract)

After deployment, copy the contract addresses.

---

## **2. Update Contract Addresses in the Frontend**

In the file:

```
frontend/src/config.js
```

Replace with:

```
export const USERS_CONTRACT_ADDRESS = "<PatasConfiaUsers_address>";
export const PETS_CONTRACT_ADDRESS = "<PatasConfia_address>";
```

Without this step, the frontend will not connect to the contracts.

---

## **3. Run the Project**

### Navigate to the project folder:

```bash
cd patasconfia
cd frontend
```

### Install dependencies:

```bash
pnpm install
```

### Start the development server:

```bash
pnpm dev
```

The application will be available at:

```
http://localhost:5173
```


