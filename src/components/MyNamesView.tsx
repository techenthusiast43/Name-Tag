import React, { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  Tag,
  Edit3,
  Send,
  Trash2,
  Star,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  X,
  Sparkles,
} from "lucide-react";
import type { TagProfile } from "../types";
import { getLocalProfiles, saveLocalProfiles } from "../services/nameTagService";
import { NAMETAG_ABI } from "../contracts/NameTagABI";
import { formatAddress } from "../utils/nameTagUtils";

interface MyNamesViewProps {
  primaryName?: string | null;
  onRefresh: () => void;
  onNavigateToRegister: () => void;
  contractAddress: `0x${string}`;
}

export const MyNamesView: React.FC<MyNamesViewProps> = ({
  primaryName,
  onRefresh,
  onNavigateToRegister,
  contractAddress,
}) => {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [activeModal, setActiveModal] = useState<"edit" | "transfer" | "release" | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagProfile | null>(null);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarURI, setEditAvatarURI] = useState("");

  // Transfer form state
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);

  // Wagmi write contract
  const { writeContractAsync } = useWriteContract();

  // Find owned tags (from local registry cache matching connected address)
  const profiles = getLocalProfiles();
  const userAddrLower = (address || "").toLowerCase();
  const ownedList: TagProfile[] = Object.values(profiles).filter(
    (p) => p.owner.toLowerCase() === userAddrLower
  );

  const openEditModal = (tag: TagProfile) => {
    setSelectedTag(tag);
    setEditDisplayName(tag.displayName || "");
    setEditBio(tag.bio || "");
    setEditAvatarURI(tag.avatarURI || "");
    setActiveModal("edit");
  };

  const openTransferModal = (tag: TagProfile) => {
    setSelectedTag(tag);
    setTransferRecipient("");
    setTransferError(null);
    setActiveModal("transfer");
  };

  const openReleaseModal = (tag: TagProfile) => {
    setSelectedTag(tag);
    setActiveModal("release");
  };

  const handleSaveProfile = async () => {
    if (!selectedTag) return;
    try {
      // Attempt on-chain update
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: NAMETAG_ABI,
          functionName: "updateProfile",
          args: [selectedTag.name, editDisplayName, editBio, editAvatarURI],
        });
      } catch (e) {
        console.warn("Contract profile update note:", e);
      }

      // Update local storage
      const store = getLocalProfiles();
      if (store[selectedTag.name]) {
        store[selectedTag.name] = {
          ...store[selectedTag.name],
          displayName: editDisplayName,
          bio: editBio,
          avatarURI: editAvatarURI,
        };
        saveLocalProfiles(store);
      }
      setActiveModal(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async () => {
    if (!selectedTag) return;
    const cleanRecipient = transferRecipient.trim();

    if (!cleanRecipient.startsWith("0x") || cleanRecipient.length !== 42) {
      setTransferError("Please enter a valid 42-character hex address (0x...)");
      return;
    }

    if (cleanRecipient.toLowerCase() === (address || "").toLowerCase()) {
      setTransferError("You cannot transfer a username to yourself.");
      return;
    }

    try {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: NAMETAG_ABI,
          functionName: "transferName",
          args: [selectedTag.name, cleanRecipient as `0x${string}`],
        });
      } catch (e) {
        console.warn("Contract transfer note:", e);
      }

      // Update local storage
      const store = getLocalProfiles();
      if (store[selectedTag.name]) {
        store[selectedTag.name].owner = cleanRecipient as `0x${string}`;
        saveLocalProfiles(store);
      }
      setActiveModal(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRelease = async () => {
    if (!selectedTag) return;
    try {
      try {
        await writeContractAsync({
          address: contractAddress,
          abi: NAMETAG_ABI,
          functionName: "releaseName",
          args: [selectedTag.name],
        });
      } catch (e) {
        console.warn("Contract release note:", e);
      }

      // Update local storage
      const store = getLocalProfiles();
      delete store[selectedTag.name];
      saveLocalProfiles(store);

      setActiveModal(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPrimary = async (tagName: string) => {
    try {
      await writeContractAsync({
        address: contractAddress,
        abi: NAMETAG_ABI,
        functionName: "setPrimaryName",
        args: [tagName],
      });
    } catch (e) {
      console.warn("Contract primary note:", e);
    }
    onRefresh();
  };

  if (!isConnected) {
    return (
      <div className="glass-card" style={{ maxWidth: "580px", margin: "2rem auto", textAlign: "center", padding: "3rem 1.5rem" }}>
        <Tag size={42} color="var(--accent-cyan)" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: "0.5rem" }}>
          Connect Your Wallet
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
          Connect MetaMask or your Web3 wallet to manage your registered BOT Chain handles.
        </p>
        <button className="btn-primary" onClick={() => open()}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800 }}>
            My Names & Identities
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Manage profiles, transfer ownership, or set your primary BOT Chain handle.
          </p>
        </div>
        <button className="btn-primary" onClick={onNavigateToRegister} style={{ padding: "0.6rem 1.2rem" }}>
          <Sparkles size={16} />
          <span>Claim New Name</span>
        </button>
      </div>

      {ownedList.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "3.5rem 1.5rem" }}>
          <Tag size={42} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", marginBottom: "0.5rem" }}>
            No registered names yet
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            Your connected wallet ({formatAddress(address)}) doesn't own any NameTags yet.
          </p>
          <button className="btn-primary" onClick={onNavigateToRegister}>
            Register Your First Name
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {ownedList.map((tag) => {
            const isPrimary = primaryName === tag.name || ownedList.length === 1;
            return (
              <div key={tag.name} className="glass-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
                    <div className="avatar-frame" style={{ width: "52px", height: "52px" }}>
                      {tag.avatarURI ? (
                        <img src={tag.avatarURI} alt={tag.name} className="avatar-img" />
                      ) : (
                        <div className="avatar-fallback" style={{ fontSize: "1.3rem" }}>
                          {tag.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800 }}>
                          @{tag.name}
                        </h3>
                        {isPrimary && (
                          <span className="badge-status badge-claimed" style={{ fontSize: "0.7rem", padding: "0.2rem 0.55rem" }}>
                            <Star size={11} /> Primary
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {tag.displayName || "No display name set"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    {!isPrimary && (
                      <button
                        className="btn-outline"
                        style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                        onClick={() => handleSetPrimary(tag.name)}
                      >
                        <Star size={14} />
                        <span>Make Primary</span>
                      </button>
                    )}
                    <button
                      className="btn-outline"
                      style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                      onClick={() => openEditModal(tag)}
                    >
                      <Edit3 size={14} />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      className="btn-outline"
                      style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                      onClick={() => openTransferModal(tag)}
                    >
                      <Send size={14} />
                      <span>Transfer</span>
                    </button>
                    <button
                      className="btn-outline btn-danger"
                      style={{ padding: "0.5rem 0.9rem", fontSize: "0.82rem" }}
                      onClick={() => openReleaseModal(tag)}
                    >
                      <Trash2 size={14} />
                      <span>Release</span>
                    </button>
                  </div>
                </div>

                {tag.bio && (
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "1rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.75rem" }}>
                    "{tag.bio}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {activeModal === "edit" && selectedTag && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile (@{selectedTag.name})</h3>
              <button className="icon-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Emmanuel Adebayo"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Tell the community about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar Image URL (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://... or ipfs://..."
                value={editAvatarURI}
                onChange={(e) => setEditAvatarURI(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {activeModal === "transfer" && selectedTag && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Transfer @{selectedTag.name}</h3>
              <button className="icon-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
              Transferring ownership of <strong>@{selectedTag.name}</strong> will permanently grant control to the new wallet address.
            </p>
            <div className="form-group">
              <label className="form-label">Recipient Wallet Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="0x..."
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
              />
            </div>
            {transferError && (
              <p style={{ color: "var(--accent-pink)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                {transferError}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Cancel
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleTransfer}>
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RELEASE MODAL */}
      {activeModal === "release" && selectedTag && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--accent-pink)" }}>
                Release @{selectedTag.name}?
              </h3>
              <button className="icon-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.25)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <ShieldAlert size={22} color="var(--accent-pink)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: "0.85rem", color: "#FB7185", margin: 0 }}>
                  <strong>Warning:</strong> Releasing this username will remove your ownership. Once released, anyone else can claim <strong>@{selectedTag.name}</strong> immediately!
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setActiveModal(null)}>
                Keep Name
              </button>
              <button className="btn-primary btn-danger" style={{ flex: 1 }} onClick={handleRelease}>
                Yes, Release @{selectedTag.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
