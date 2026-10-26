import React, { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  Search,
  PlusCircle,
  User,
  Users,
  Code2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { LookupView } from "./components/LookupView";
import { RegisterView } from "./components/RegisterView";
import { MyNamesView } from "./components/MyNamesView";
import { DirectoryView } from "./components/DirectoryView";
import { ContractView } from "./components/ContractView";
import type { ActiveTab } from "./types";
import { resolveAddressToName } from "./services/nameTagService";
import { DEFAULT_NAMETAG_ADDRESS } from "./contracts/NameTagABI";
import { BOT_CHAIN } from "./config/chain";
import { addBotChainToWallet } from "./utils/nameTagUtils";

export function App() {
  const { address, isConnected, chainId } = useAccount();

  const [activeTab, setActiveTab] = useState<ActiveTab>("lookup");
  const [suggestedRegisterName, setSuggestedRegisterName] = useState("");
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<`0x${string}`>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nametag_contract_addr");
      if (saved && saved.startsWith("0x")) {
        return saved as `0x${string}`;
      }
    }
    return DEFAULT_NAMETAG_ADDRESS;
  });

  const isWrongNetwork = isConnected && chainId !== BOT_CHAIN.id;

  // Refresh reverse lookup when address changes
  const fetchPrimaryName = useCallback(async () => {
    if (address) {
      try {
        const found = await resolveAddressToName(address as `0x${string}`, contractAddress);
        setPrimaryName(found);
      } catch (err) {
        console.error("Reverse lookup error:", err);
      }
    } else {
      setPrimaryName(null);
    }
  }, [address, contractAddress]);

  useEffect(() => {
    fetchPrimaryName();
  }, [fetchPrimaryName]);

  const handleUpdateContractAddress = (newAddr: `0x${string}`) => {
    setContractAddress(newAddr);
    localStorage.setItem("nametag_contract_addr", newAddr);
    fetchPrimaryName();
  };

  const navigateToRegister = (name?: string) => {
    if (name) {
      setSuggestedRegisterName(name);
    }
    setActiveTab("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToLookup = (name: string) => {
    setActiveTab("lookup");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-container">
      <div className="bg-grid-overlay" />

      {/* Network Warning Banner if user is connected to Ethereum or other chain */}
      {isWrongNetwork && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <AlertTriangle size={18} color="var(--accent-amber)" />
            <span style={{ fontSize: "0.9rem", color: "#FDE68A" }}>
              Your wallet is connected to a different network. Switch to BOT Chain (Chain ID: 968) to interact.
            </span>
          </div>
          <button
            className="btn-primary"
            onClick={addBotChainToWallet}
            style={{
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              background: "var(--accent-amber)",
              color: "#06080F",
            }}
          >
            Switch to BOT Chain
          </button>
        </div>
      )}

      {/* Header */}
      <Navbar primaryName={primaryName} />

      {/* Navigation Tabs */}
      <nav className="tabs-nav" aria-label="Main Navigation">
        <button
          className={`tab-btn ${activeTab === "lookup" ? "active" : ""}`}
          onClick={() => setActiveTab("lookup")}
        >
          <Search size={16} />
          <span>Lookup</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
          onClick={() => {
            setSuggestedRegisterName("");
            setActiveTab("register");
          }}
        >
          <PlusCircle size={16} />
          <span>Register</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "my-names" ? "active" : ""}`}
          onClick={() => setActiveTab("my-names")}
        >
          <User size={16} />
          <span>My Names</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "directory" ? "active" : ""}`}
          onClick={() => setActiveTab("directory")}
        >
          <Users size={16} />
          <span>Directory</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "contract" ? "active" : ""}`}
          onClick={() => setActiveTab("contract")}
        >
          <Code2 size={16} />
          <span>Contract & RPC</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main style={{ minHeight: "500px" }}>
        {activeTab === "lookup" && (
          <LookupView
            onNavigateToRegister={navigateToRegister}
            contractAddress={contractAddress}
          />
        )}

        {activeTab === "register" && (
          <RegisterView
            initialName={suggestedRegisterName}
            onSuccess={() => {
              fetchPrimaryName();
            }}
            contractAddress={contractAddress}
          />
        )}

        {activeTab === "my-names" && (
          <MyNamesView
            primaryName={primaryName}
            onRefresh={fetchPrimaryName}
            onNavigateToRegister={() => navigateToRegister()}
            contractAddress={contractAddress}
          />
        )}

        {activeTab === "directory" && (
          <DirectoryView onSelectTag={navigateToLookup} />
        )}

        {activeTab === "contract" && (
          <ContractView
            contractAddress={contractAddress}
            onUpdateContractAddress={handleUpdateContractAddress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>NameTag dApp</span>
          <span style={{ margin: "0 0.5rem" }}>•</span>
          <span>Bohr Life / BOT Chain Testnet (Chain ID: 968)</span>
        </div>
        <div className="footer-links">
          <a
            href="https://rpc.bohr.life"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            RPC Status
          </a>
          <a
            href="https://scan.bohr.life"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            <span>BohrScan Explorer</span>
            <ExternalLink size={12} />
          </a>
          <button
            onClick={addBotChainToWallet}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-cyan)",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: 0,
            }}
          >
            + Add to MetaMask
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
