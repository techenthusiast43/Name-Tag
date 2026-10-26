import React, { useState } from "react";
import { Search, Copy, Check, ExternalLink, ArrowUpRight, Users } from "lucide-react";
import { getLocalProfiles } from "../services/nameTagService";
import { formatAddress } from "../utils/nameTagUtils";
import { BOT_CHAIN } from "../config/chain";

interface DirectoryViewProps {
  onSelectTag: (name: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ onSelectTag }) => {
  const [filter, setFilter] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const profiles = Object.values(getLocalProfiles());

  const filtered = profiles.filter((p) => {
    const q = filter.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.displayName && p.displayName.toLowerCase().includes(q)) ||
      p.owner.toLowerCase().includes(q)
    );
  });

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
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
          <Users size={24} />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800 }}>
          BOT Chain Directory & Address Book
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "540px", margin: "0 auto" }}>
          Browse registered Web3 identities on BOT Chain. Quickly copy wallet addresses or inspect profiles.
        </p>

        {/* Filter Bar */}
        <div style={{ maxWidth: "480px", margin: "1.5rem auto 0", position: "relative" }}>
          <Search
            size={18}
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            type="text"
            className="form-input"
            style={{ width: "100%", paddingLeft: "2.75rem", borderRadius: "var(--radius-full)" }}
            placeholder="Search by username, display name, or address..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1.25rem" }}>
        {filtered.map((item) => (
          <div key={item.name} className="glass-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "0.85rem" }}>
              <div className="avatar-frame" style={{ width: "44px", height: "44px" }}>
                {item.avatarURI ? (
                  <img src={item.avatarURI} alt={item.name} className="avatar-img" />
                ) : (
                  <div className="avatar-fallback" style={{ fontSize: "1.2rem" }}>
                    {item.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                  onClick={() => onSelectTag(item.name)}
                >
                  <span>@{item.name}</span>
                  <ArrowUpRight size={14} color="var(--accent-cyan)" />
                </h4>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.displayName || "BOT Citizen"}
                </p>
              </div>
            </div>

            {item.bio && (
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  marginBottom: "1rem",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.bio}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                background: "rgba(6, 8, 15, 0.7)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-cyan)" }}>
                {formatAddress(item.owner)}
              </span>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  className="icon-btn"
                  style={{ width: "28px", height: "28px" }}
                  title="Copy address"
                  onClick={() => handleCopy(item.owner)}
                >
                  {copiedAddress === item.owner ? (
                    <Check size={14} color="var(--accent-emerald)" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
                <a
                  href={`${BOT_CHAIN.blockExplorers.default.url}/address/${item.owner}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn"
                  style={{ width: "28px", height: "28px" }}
                  title="View on BohrScan"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
