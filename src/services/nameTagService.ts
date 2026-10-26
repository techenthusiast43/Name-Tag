import type { TagProfile } from "../types";
import { publicClient } from "../config/wagmi";
import { NAMETAG_ABI, DEFAULT_NAMETAG_ADDRESS } from "../contracts/NameTagABI";
import { validateAndNormalizeName } from "../utils/nameTagUtils";

// Initial seed data from project prompt
const INITIAL_PROFILES: Record<string, TagProfile> = {
  emmanuel: {
    name: "emmanuel",
    owner: "0x12AB0123456789012345678901234567894545CD",
    registeredAt: 1714000000,
    displayName: "Emmanuel",
    bio: "Web3 Builder & BOT Chain Explorer",
    avatarURI: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  },
  tobi: {
    name: "tobi",
    owner: "0x67EF0123456789012345678901234567898989AB",
    registeredAt: 1714100000,
    displayName: "Tobi",
    bio: "DeFi enthusiast and blockchain researcher.",
    avatarURI: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  ada: {
    name: "ada",
    owner: "0x34CD0123456789012345678901234567891212EF",
    registeredAt: 1714200000,
    displayName: "Ada",
    bio: "Building on decentralized networks.",
    avatarURI: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
};

const STORAGE_KEY = "nametag_profiles_v1";

export function getLocalProfiles(): Record<string, TagProfile> {
  if (typeof window === "undefined") return INITIAL_PROFILES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROFILES));
      return INITIAL_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PROFILES;
  }
}

export function saveLocalProfiles(profiles: Record<string, TagProfile>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
  }
}

/**
 * Resolve a username either on-chain or from fallback store
 */
export async function resolveUsername(
  rawName: string,
  contractAddress: `0x${string}` = DEFAULT_NAMETAG_ADDRESS
): Promise<{
  found: boolean;
  profile?: TagProfile;
  isAvailable?: boolean;
  cleanName: string;
  source: "chain" | "local";
}> {
  const { isValid, normalized } = validateAndNormalizeName(rawName);
  if (!isValid) {
    return { found: false, cleanName: normalized, source: "local" };
  }

  // 1. Try On-Chain read if contract is configured
  try {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: NAMETAG_ABI,
      functionName: "resolveName",
      args: [normalized],
    });

    const [owner, registeredAt, displayName, bio, avatarURI] = result as [
      `0x${string}`,
      bigint,
      string,
      string,
      string
    ];

    if (owner && owner !== "0x0000000000000000000000000000000000000000") {
      return {
        found: true,
        source: "chain",
        cleanName: normalized,
        profile: {
          name: normalized,
          owner,
          registeredAt: Number(registeredAt),
          displayName: displayName || normalized,
          bio: bio || "",
          avatarURI: avatarURI || "",
        },
      };
    }
  } catch {
    // If on-chain read reverts or contract is not yet deployed, fallback to local store
  }

  // 2. Fallback to local database
  const profiles = getLocalProfiles();
  const localMatch = profiles[normalized];

  if (localMatch) {
    return {
      found: true,
      source: "local",
      cleanName: normalized,
      profile: localMatch,
    };
  }

  return {
    found: false,
    source: "local",
    cleanName: normalized,
    isAvailable: true,
  };
}

/**
 * Reverse lookup: Find username for an address
 */
export async function resolveAddressToName(
  address: `0x${string}`,
  contractAddress: `0x${string}` = DEFAULT_NAMETAG_ADDRESS
): Promise<string | null> {
  try {
    const result = await publicClient.readContract({
      address: contractAddress,
      abi: NAMETAG_ABI,
      functionName: "resolveAddress",
      args: [address],
    });
    if (result && typeof result === "string" && result.length > 0) {
      return result;
    }
  } catch {
    // Fallback to local
  }

  const profiles = getLocalProfiles();
  const lowerAddr = address.toLowerCase();
  for (const item of Object.values(profiles)) {
    if (item.owner.toLowerCase() === lowerAddr) {
      return item.name;
    }
  }

  return null;
}
