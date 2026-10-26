# NameTag dApp — BOT Chain Web3 Identity Service

NameTag is a decentralized naming service dApp for **BOT Chain** (Chain ID: `968`). It allows users to register human-readable usernames like `@emmanuel` for their crypto wallets instead of sharing long, complex hexadecimal addresses (`0x7A82...9F31`).

---

## 🚀 Key Features

1. **Username Registration**:
   - Claim unique, permanent usernames (e.g. `@emmanuel`, `@tobi`, `@ada`).
   - Free registration (users only pay network gas).
   - Lifetime ownership with no expiration or renewal hurdles.
   - Real-time normalization (`a-z`, `0-9`, `_`, 3–30 characters).

2. **Username & Address Resolution**:
   - **Forward Lookup**: Search any `@username` to view the linked wallet address, display name, bio, and avatar.
   - **Reverse Lookup**: Connect your wallet to automatically resolve and display your primary `@handle`.
   - **Address Book & QR Code**: One-click address copy, direct BohrScan explorer links, and instant QR code generation for mobile wallet scanning.

3. **Profile Management**:
   - Edit optional profile details (display name, bio, avatar URL/IPFS reference).
   - Toggle primary handle for your wallet.

4. **Transfer & Release Safeguards**:
   - Transfer name ownership to another address with verification checks.
   - Release a name back to the public pool with confirmation warnings.

5. **BOT Chain Ecosystem Directory**:
   - Explore registered handles across the network.

---

## 🌐 Network Specifications (BOT Chain Testnet)

- **Network Name**: BOT Chain Testnet
- **Chain ID**: `968` (`0x3c8`)
- **RPC URL**: [https://rpc.bohr.life](https://rpc.bohr.life/)
- **Native Currency**: `BOT` (18 decimals)
- **Total Supply**: `150,000,000 BOT`
- **Block Explorer**: [https://scan.bohr.life/](https://scan.bohr.life/)

---

## 🛠️ Tech Stack

- **Smart Contract**: Solidity `^0.8.20` (`contracts/NameTag.sol`)
- **Frontend**: React 19 + TypeScript + Vite
- **Web3 Connectivity**: `@reown/appkit` + `@reown/appkit-adapter-wagmi` + `wagmi@2.x` + `viem` + `@tanstack/react-query`
- **Styling**: Vanilla CSS Design System with dark mode glassmorphism, neon accents, and responsive typography (`Plus Jakarta Sans`, `Outfit`, `JetBrains Mono`).

---

## 💻 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 📜 Smart Contract Deployment

To deploy `NameTag.sol` onto BOT Chain Testnet using Hardhat:

1. Configure your network in `hardhat.config.js`:
```javascript
module.exports = {
  solidity: "0.8.20",
  networks: {
    botChain: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

2. Run the deployment script:
```bash
npx hardhat run scripts/deploy.js --network botChain
```

3. Paste the deployed contract address into your `.env` or in the **Contract & RPC** tab directly inside the dApp!
