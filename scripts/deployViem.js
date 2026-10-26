import fs from "fs";
import path from "path";
import { createWalletClient, createPublicClient, http, defineChain, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import solc from "solc";

// 1. Load Environment Variables from .env
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");

function getEnv(key) {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

let privateKey = getEnv("PRIVATE_KEY");
if (!privateKey) {
  console.error("Error: PRIVATE_KEY not found in .env file.");
  process.exit(1);
}
if (!privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

const account = privateKeyToAccount(privateKey);
console.log("==================================================");
console.log("Deploying NameTag.sol to BOT Chain Testnet");
console.log("Deployer Address:", account.address);

// 2. Define BOT Chain
const botChain = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.bohr.life"] },
    public: { http: ["https://rpc.bohr.life"] },
  },
  blockExplorers: {
    default: { name: "BohrScan", url: "https://scan.bohr.life" },
  },
});

const publicClient = createPublicClient({
  chain: botChain,
  transport: http("https://rpc.bohr.life"),
});

const walletClient = createWalletClient({
  account,
  chain: botChain,
  transport: http("https://rpc.bohr.life"),
});

async function main() {
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Deployer Balance:", formatEther(balance), "BOT");

  if (balance === 0n) {
    console.error("Insufficient balance to deploy. Please fund the deployer wallet.");
    process.exit(1);
  }

  // 3. Compile NameTag.sol
  console.log("Compiling contracts/NameTag.sol...");
  const contractPath = path.resolve(process.cwd(), "contracts/NameTag.sol");
  const source = fs.readFileSync(contractPath, "utf-8");

  const input = {
    language: "Solidity",
    sources: {
      "NameTag.sol": {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const fatal = output.errors.filter((e) => e.severity === "error");
    if (fatal.length > 0) {
      console.error("Compilation errors:", fatal);
      process.exit(1);
    }
  }

  const contract = output.contracts["NameTag.sol"]["NameTag"];
  const abi = contract.abi;
  const bytecode = "0x" + contract.evm.bytecode.object;

  console.log("Contract compiled successfully!");
  console.log("Submitting deployment transaction to BOT Chain...");

  // 4. Deploy Contract
  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    account,
  });

  console.log("Transaction Hash:", hash);
  console.log("Waiting for block receipt on BohrScan...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log("==================================================");
  console.log("🎉 SUCCESS! NameTag.sol is deployed!");
  console.log("Contract Address:", contractAddress);
  console.log("Block Number:", receipt.blockNumber);
  console.log("Explorer:", `https://scan.bohr.life/address/${contractAddress}`);
  console.log("==================================================");

  // 5. Update .env automatically
  let updatedEnv = envContent.replace(
    /VITE_NAMETAG_CONTRACT_ADDRESS=.*/,
    `VITE_NAMETAG_CONTRACT_ADDRESS=${contractAddress}`
  );
  fs.writeFileSync(envPath, updatedEnv, "utf-8");
  console.log("Updated VITE_NAMETAG_CONTRACT_ADDRESS in .env file.");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
