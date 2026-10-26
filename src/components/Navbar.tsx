import React from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { addBotChainToWallet, formatAddress } from "../utils/nameTagUtils";
import { Wallet } from "lucide-react";
import { Logo } from "./Logo";

interface NavbarProps {
  primaryName?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ primaryName }) => {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  return (
    <header className="navbar">
      <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <Logo size={48} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="brand-title">NameTag</span>
            <span className="brand-tag">BOT Chain</span>
          </div>
          <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: 0 }}>
            Web3 Username & Identity Registry
          </p>
        </div>
      </div>

      <div className="nav-actions">
        {/* Network indicator pill */}
        <div
          className="chain-pill"
          title="Click to add/switch to BOT Chain in MetaMask"
          onClick={addBotChainToWallet}
          style={{ cursor: "pointer" }}
        >
          <div className="chain-dot" />
          <span>BOT Chain (968)</span>
        </div>

        {/* Connect Button */}
        {isConnected && address ? (
          <button className="btn-outline" onClick={() => open()} style={{ borderRadius: "var(--radius-full)" }}>
            <Wallet size={16} color="var(--accent-cyan)" />
            <span>{primaryName ? `@${primaryName}` : formatAddress(address)}</span>
          </button>
        ) : (
          <button className="btn-primary" onClick={() => open()} style={{ padding: "0.6rem 1.25rem" }}>
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
};
