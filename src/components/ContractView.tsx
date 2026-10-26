import React, { useState } from "react";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Layers,
  Save,
  Server,
  Zap,
} from "lucide-react";
import { BOT_CHAIN } from "../config/chain";
import { addBotChainToWallet } from "../utils/nameTagUtils";

interface ContractViewProps {
  contractAddress: `0x${string}`;
  onUpdateContractAddress: (addr: `0x${string}`) => void;
}

const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NameTag
 * @dev Username & Identity Registry on BOT Chain (Chain ID: 968).
 */
contract NameTag {
    struct Profile {
        address owner;
        uint64 registeredAt;
        string displayName;
        string bio;
        string avatarURI;
    }

    mapping(string => Profile) private _names;
    mapping(address => string) private _primaryName;
    mapping(address => string[]) private _ownedNames;
    mapping(string => uint256) private _ownedNameIndex;
    uint256 public totalRegistered;

    event NameRegistered(string indexed nameIndexed, string name, address indexed owner, uint64 registeredAt);
    event ProfileUpdated(string indexed nameIndexed, string name, string displayName, string bio, string avatarURI);
    event NameTransferred(string indexed nameIndexed, string name, address indexed oldOwner, address indexed newOwner);
    event NameReleased(string indexed nameIndexed, string name, address indexed previousOwner);
    event PrimaryNameSet(address indexed owner, string name);

    function registerName(string calldata rawName) external;
    function resolveName(string calldata rawName) external view returns (address, uint64, string memory, string memory, string memory);
    function resolveAddress(address wallet) external view returns (string memory);
    function setPrimaryName(string calldata rawName) external;
    function updateProfile(string calldata rawName, string calldata displayName, string calldata bio, string calldata avatarURI) external;
    function transferName(string calldata rawName, address newOwner) external;
    function releaseName(string calldata rawName) external;
}`;

export const ContractView: React.FC<ContractViewProps> = ({
  contractAddress,
  onUpdateContractAddress,
}) => {
  const [addrInput, setAddrInput] = useState<string>(contractAddress);
  const [copiedSol, setCopiedSol] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  const handleSaveAddr = () => {
    const trimmed = addrInput.trim();
    if (trimmed.startsWith("0x") && trimmed.length === 42) {
      onUpdateContractAddress(trimmed as `0x${string}`);
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    }
  };

  const copyText = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(0, 242, 254, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
            color: "var(--accent-cyan)",
          }}
        >
          <Code size={24} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800 }}>
          Smart Contract & BOT Chain Details
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Interact with NameTag.sol on BOT Chain Testnet or customize your deployed contract.
        </p>
      </div>

      {/* Network Specifications Card */}
      <div className="glass-card" style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Server size={22} color="var(--accent-cyan)" />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700 }}>
              Network Parameters
            </h3>
          </div>
          <button className="btn-primary" onClick={addBotChainToWallet} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            <Zap size={14} />
            <span>Add BOT Chain to MetaMask</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(6, 8, 15, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Chain ID
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-cyan)", marginTop: "0.25rem" }}>
              968 (0x3c8)
            </div>
          </div>

          <div style={{ background: "rgba(6, 8, 15, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Native Token
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
              BOT (18 decimals)
            </div>
          </div>

          <div style={{ background: "rgba(6, 8, 15, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Supply
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>
              150 Million
            </div>
          </div>

          <div style={{ background: "rgba(6, 8, 15, 0.6)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              RPC Endpoint
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: "0.45rem", wordBreak: "break-all" }}>
              https://rpc.bohr.life
            </div>
          </div>
        </div>
      </div>

      {/* Contract Address Configuration */}
      <div className="glass-card" style={{ marginBottom: "1.75rem" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Target NameTag Contract Address
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
          Change or update the deployed contract address. The frontend will instantly read and write to this contract.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, fontFamily: "var(--font-mono)", minWidth: "280px" }}
            value={addrInput}
            onChange={(e) => setAddrInput(e.target.value)}
            placeholder="0x..."
          />
          <button className="btn-primary" onClick={handleSaveAddr} style={{ padding: "0.75rem 1.4rem" }}>
            <Save size={16} />
            <span>{savedStatus ? "Saved!" : "Update Target"}</span>
          </button>
          <a
            href={`${BOT_CHAIN.blockExplorers.default.url}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            style={{ padding: "0.75rem 1.25rem" }}
          >
            <ExternalLink size={16} />
            <span>View on Explorer</span>
          </a>
        </div>
      </div>

      {/* Solidity Code Card */}
      <div className="glass-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700 }}>
            NameTag.sol (Solidity ^0.8.20)
          </h3>
          <button
            className="btn-outline"
            style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem" }}
            onClick={() => copyText(SOLIDITY_CODE, setCopiedSol)}
          >
            {copiedSol ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copiedSol ? "Copied!" : "Copy Code"}</span>
          </button>
        </div>

        <pre
          style={{
            background: "rgba(6, 8, 15, 0.85)",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            overflowX: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.82rem",
            color: "#A7F3D0",
            maxHeight: "340px",
          }}
        >
          <code>{SOLIDITY_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
