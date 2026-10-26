import { BOT_CHAIN } from "../config/chain";

/**
 * Normalizes username input:
 * - Trims whitespace
 * - Strips leading '@'
 * - Converts to lowercase
 * - Validates length (3 to 30)
 * - Validates allowed characters (a-z, 0-9, _)
 */
export function validateAndNormalizeName(input: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  let clean = input.trim();
  if (clean.startsWith("@")) {
    clean = clean.slice(1);
  }
  clean = clean.toLowerCase();

  if (!clean) {
    return { isValid: false, normalized: "", error: "Username cannot be empty." };
  }

  if (clean.length < 3) {
    return {
      isValid: false,
      normalized: clean,
      error: "Username must be at least 3 characters long.",
    };
  }

  if (clean.length > 30) {
    return {
      isValid: false,
      normalized: clean,
      error: "Username cannot exceed 30 characters.",
    };
  }

  const validRegex = /^[a-z0-9_]+$/;
  if (!validRegex.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: "Only letters (a-z), numbers (0-9), and underscores (_) are allowed.",
    };
  }

  return { isValid: true, normalized: clean };
}

/**
 * Formats a hex address to 0x12AB...45CD
 */
export function formatAddress(address?: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Prompt MetaMask/wallet to add/switch to BOT Chain Testnet
 */
export async function addBotChainToWallet(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    return false;
  }
  const ethereum = (window as any).ethereum;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x3c8" }], // 968 in hex
    });
    return true;
  } catch (switchError: any) {
    // 4902 error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x3c8",
              chainName: BOT_CHAIN.name,
              rpcUrls: [BOT_CHAIN.rpcUrls.default.http[0]],
              nativeCurrency: BOT_CHAIN.nativeCurrency,
              blockExplorerUrls: [BOT_CHAIN.blockExplorers.default.url],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error("Failed to add BOT Chain to wallet:", addError);
        return false;
      }
    }
    console.error("Failed to switch chain:", switchError);
    return false;
  }
}
