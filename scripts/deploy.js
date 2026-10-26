/**
 * Deployment script for NameTag.sol on BOT Chain Testnet (Chain ID: 968)
 * 
 * Usage with Hardhat:
 *   npx hardhat run scripts/deploy.js --network botChain
 * 
 * hardhat.config.js snippet:
 *   networks: {
 *     botChain: {
 *       url: "https://rpc.bohr.life",
 *       chainId: 968,
 *       accounts: [process.env.PRIVATE_KEY]
 *     }
 *   }
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NameTag with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BOT");

  const NameTag = await ethers.getContractFactory("NameTag");
  const nameTag = await NameTag.deploy();
  await nameTag.waitForDeployment();

  const contractAddress = await nameTag.getAddress();
  console.log("--------------------------------------------------");
  console.log("NameTag contract deployed successfully!");
  console.log("Contract Address:", contractAddress);
  console.log("BohrScan Explorer:", `https://scan.bohr.life/address/${contractAddress}`);
  console.log("--------------------------------------------------");
  console.log("Now update VITE_NAMETAG_CONTRACT_ADDRESS in your .env with this address.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
