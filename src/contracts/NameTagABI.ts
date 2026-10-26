export const NAMETAG_ABI = [
  {
    type: "function",
    name: "normalize",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "isAvailable",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerName",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveName",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "registeredAt", type: "uint64" },
      { name: "displayName", type: "string" },
      { name: "bio", type: "string" },
      { name: "avatarURI", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwner",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolveAddress",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setPrimaryName",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateProfile",
    inputs: [
      { name: "rawName", type: "string" },
      { name: "displayName", type: "string" },
      { name: "bio", type: "string" },
      { name: "avatarURI", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferName",
    inputs: [
      { name: "rawName", type: "string" },
      { name: "newOwner", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releaseName",
    inputs: [{ name: "rawName", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getOwnedNames",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "string[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalRegistered",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "NameRegistered",
    inputs: [
      { name: "nameIndexed", type: "string", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "owner", type: "address", indexed: true },
      { name: "registeredAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProfileUpdated",
    inputs: [
      { name: "nameIndexed", type: "string", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "displayName", type: "string", indexed: false },
      { name: "bio", type: "string", indexed: false },
      { name: "avatarURI", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "NameTransferred",
    inputs: [
      { name: "nameIndexed", type: "string", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "oldOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "NameReleased",
    inputs: [
      { name: "nameIndexed", type: "string", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "previousOwner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "PrimaryNameSet",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
] as const;

// Default testnet deployment placeholder or configured address
// Can be customized via env or in-app settings
export const DEFAULT_NAMETAG_ADDRESS =
  (import.meta.env.VITE_NAMETAG_CONTRACT_ADDRESS as `0x${string}`) ||
  "0xf31bb83208b5cf7de3a59e058103c92f72d9c88a";
