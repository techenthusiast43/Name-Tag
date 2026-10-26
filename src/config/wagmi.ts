import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { botChainTestnet } from "./chain";

// Reown (WalletConnect) Project ID - defaults to demo ID if not provided in .env
export const projectId =
  (import.meta.env.VITE_REOWN_PROJECT_ID as string) ||
  "b56e18d47c72ab683b10814fe9495694";

// Configure query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configure Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [botChainTestnet],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Setup AppKit
export const metadata = {
  name: "NameTag | BOT Chain",
  description: "Register and resolve unique @usernames on BOT Chain",
  url: typeof window !== "undefined" ? window.location.origin : "https://nametag.bot",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botChainTestnet],
  defaultNetwork: botChainTestnet,
  metadata,
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#00F2FE",
    "--w3m-color-mix": "#0a0d14",
    "--w3m-color-mix-strength": 50,
    "--w3m-border-radius-master": "12px",
  },
});

// Dedicated Public Client for instant lookups without wallet connection
export const publicClient = createPublicClient({
  chain: botChainTestnet,
  transport: http("https://rpc.bohr.life"),
});
