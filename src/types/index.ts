export interface TagProfile {
  name: string;
  owner: `0x${string}`;
  registeredAt: number;
  displayName: string;
  bio: string;
  avatarURI: string;
}

export interface LookupResult {
  found: boolean;
  name: string;
  normalizedName: string;
  profile?: TagProfile;
  isAvailable?: boolean;
  error?: string;
}

export type ActiveTab = "lookup" | "register" | "my-names" | "directory" | "contract";
