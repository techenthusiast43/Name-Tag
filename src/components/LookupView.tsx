import React, { useState, useEffect } from "react";
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Sparkles,
  UserCheck,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { resolveUsername } from "../services/nameTagService";
import type { TagProfile } from "../types";
import { formatAddress, validateAndNormalizeName } from "../utils/nameTagUtils";
import { BOT_CHAIN } from "../config/chain";

interface LookupViewProps {
  onNavigateToRegister: (suggestedName?: string) => void;
  contractAddress: `0x${string}`;
}

export const LookupView: React.FC<LookupViewProps> = ({
  onNavigateToRegister,
  contractAddress,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    searched: boolean;
    name: string;
    profile?: TagProfile;
    isAvailable?: boolean;
    source?: "chain" | "local";
  }>({ searched: false, name: "" });

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Initial lookup demonstration with @emmanuel
  useEffect(() => {
    handleSearch("emmanuel");
  }, [contractAddress]);

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    const { isValid, normalized } = validateAndNormalizeName(trimmed);

    if (!isValid) {
      setResult({
        searched: true,
        name: trimmed,
        isAvailable: false,
      });
      setLoading(false);
      return;
    }

    try {
      const res = await resolveUsername(normalized, contractAddress);
      setResult({
        searched: true,
        name: normalized,
        profile: res.profile,
        isAvailable: res.isAvailable,
        source: res.source,
      });
    } catch (err) {
      console.error("Resolution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="hero-section">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Next-Gen Identity on BOT Chain</span>
        </div>
        <h1 className="hero-title">
          Human-Readable Usernames for <span className="gradient-text">BOT Chain</span>
        </h1>
        <p className="hero-subtitle">
          Say goodbye to complex 42-character hex addresses. Register your unique @handle
          and link it directly to your wallet on BOT Chain.
        </p>

        {/* Search Bar */}
        <div className="search-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchTerm);
            }}
            className="search-box-wrapper"
          >
            <span className="search-prefix">@</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search or resolve username (e.g. emmanuel, tobi, ada)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button type="submit" className="search-btn" disabled={loading}>
              <Search size={18} />
              <span>{loading ? "Resolving..." : "Lookup"}</span>
            </button>
          </form>

          {/* Quick Example Chips */}
          <div className="quick-examples">
            <span className="quick-label">Try searching:</span>
            {["emmanuel", "tobi", "ada", "satoshi"].map((name) => (
              <button
                key={name}
                type="button"
                className="example-chip"
                onClick={() => {
                  setSearchTerm(name);
                  handleSearch(name);
                }}
              >
                @{name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Resolution Results */}
      {result.searched && (
        <div className="glass-card result-card" style={{ marginBottom: "3rem" }}>
          {result.profile ? (
            /* CLAIMED HANDLE FOUND */
            <div>
              <div className="result-header">
                <div className="result-user-info">
                  <div className="avatar-frame">
                    {result.profile.avatarURI ? (
                      <img
                        src={result.profile.avatarURI}
                        alt={result.profile.displayName || result.profile.name}
                        className="avatar-img"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {result.profile.name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="result-handle">
                      @{result.profile.name}
                      <span className="badge-status badge-claimed">
                        <UserCheck size={12} /> Claimed
                      </span>
                    </h2>
                    <p className="result-display-name">
                      {result.profile.displayName || "BOT Chain Citizen"}
                    </p>
                  </div>
                </div>

                {result.source && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "rgba(255,255,255,0.03)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    Resolved via {result.source === "chain" ? "Smart Contract" : "Registry Cache"}
                  </span>
                )}
              </div>

              {/* Bio */}
              {result.profile.bio && (
                <div className="result-bio">
                  <p>{result.profile.bio}</p>
                </div>
              )}

              {/* Linked Wallet Address */}
              <div className="address-box">
                <div className="address-content">
                  <span className="address-label">Linked Wallet Address</span>
                  <span className="address-val">{result.profile.owner}</span>
                </div>
                <div className="address-actions">
                  <button
                    className="icon-btn"
                    title={copied ? "Copied!" : "Copy address"}
                    onClick={() => handleCopy(result.profile!.owner)}
                  >
                    {copied ? <Check size={18} color="var(--accent-emerald)" /> : <Copy size={18} />}
                  </button>
                  <button
                    className="icon-btn"
                    title="View QR Code"
                    onClick={() => setShowQr(true)}
                  >
                    <QrCode size={18} />
                  </button>
                  <a
                    href={`${BOT_CHAIN.blockExplorers.default.url}/address/${result.profile.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="icon-btn"
                    title="View on BohrScan Explorer"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>

              {result.profile.registeredAt > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "1rem",
                  }}
                >
                  <Clock size={13} />
                  <span>
                    Registered on{" "}
                    {new Date(result.profile.registeredAt * 1000).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          ) : result.isAvailable ? (
            /* AVAILABLE HANDLE */
            <div className="available-box">
              <div className="available-icon">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", marginBottom: "0.35rem" }}>
                  @{result.name} is available!
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  This username hasn't been claimed yet on BOT Chain. Claim it now with lifetime ownership!
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => onNavigateToRegister(result.name)}
              >
                <span>Claim @{result.name} Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            /* INVALID OR ERROR */
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <p style={{ color: "var(--accent-pink)", fontWeight: 600 }}>
                Username "@ {result.name}" is invalid.
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Usernames must be 3-30 characters long and contain only lowercase letters (a-z), numbers (0-9), or underscores (_).
              </p>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal Dialog */}
      {showQr && result.profile && (
        <div className="modal-overlay" onClick={() => setShowQr(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
            <h3 className="modal-title" style={{ marginBottom: "0.5rem" }}>
              @{result.profile.name}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Scan to send BOT or tokens to this wallet
            </p>
            <div
              style={{
                background: "#FFFFFF",
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                display: "inline-block",
                marginBottom: "1.25rem",
              }}
            >
              <QRCodeSVG
                value={result.profile.owner}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#06080F"
                level="Q"
              />
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                wordBreak: "break-all",
                color: "var(--accent-cyan)",
                marginBottom: "1.5rem",
              }}
            >
              {result.profile.owner}
            </div>
            <button className="btn-outline" onClick={() => setShowQr(false)} style={{ width: "100%" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Three Core Benefits */}
      <div className="features-grid">
        <div className="feature-item">
          <div className="feature-icon-box">
            <Sparkles size={24} />
          </div>
          <h3 className="feature-heading">1. Connect Wallet</h3>
          <p className="feature-desc">
            Link your MetaMask to BOT Chain (Chain ID: 968). Seamless web3 login with zero friction.
          </p>
        </div>

        <div className="feature-item">
          <div className="feature-icon-box">
            <Shield size={24} />
          </div>
          <h3 className="feature-heading">2. Register Username</h3>
          <p className="feature-desc">
            Claim your permanent identity like @emmanuel. 100% free registration—you only pay the network gas fee.
          </p>
        </div>

        <div className="feature-item">
          <div className="feature-icon-box">
            <Search size={24} />
          </div>
          <h3 className="feature-heading">3. Instant Resolution</h3>
          <p className="feature-desc">
            Anyone can look up your @name to discover your wallet address, view your Web3 profile, or send assets.
          </p>
        </div>
      </div>
    </div>
  );
};
