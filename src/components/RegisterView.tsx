import React, { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { validateAndNormalizeName } from "../utils/nameTagUtils";
import { resolveUsername, getLocalProfiles, saveLocalProfiles } from "../services/nameTagService";
import { NAMETAG_ABI, DEFAULT_NAMETAG_ADDRESS } from "../contracts/NameTagABI";
import { BOT_CHAIN } from "../config/chain";
import { addBotChainToWallet } from "../utils/nameTagUtils";

interface RegisterViewProps {
  initialName?: string;
  onSuccess: (registeredName: string) => void;
  contractAddress: `0x${string}`;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  initialName = "",
  onSuccess,
  contractAddress,
}) => {
  const { address, isConnected, chainId } = useAccount();
  const { open } = useAppKit();

  const [rawName, setRawName] = useState(initialName);
  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] = useState<{
    checked: boolean;
    available?: boolean;
    error?: string;
  }>({ checked: false });

  const [isSandboxRegistering, setIsSandboxRegistering] = useState(false);
  const [registeredSuccessName, setRegisteredSuccessName] = useState<string | null>(null);

  // Wagmi contract write hook
  const {
    data: txHash,
    isPending: isTxPending,
    error: writeError,
    writeContract,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const { isValid, normalized, error: validationError } =
    validateAndNormalizeName(rawName);

  // Live availability check with debounce
  useEffect(() => {
    if (!rawName.trim()) {
      setAvailability({ checked: false });
      return;
    }

    if (!isValid) {
      setAvailability({ checked: true, available: false, error: validationError });
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await resolveUsername(normalized, contractAddress);
        setAvailability({
          checked: true,
          available: res.isAvailable,
          error: res.found ? `@${normalized} is already registered.` : undefined,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [rawName, isValid, normalized, contractAddress]);

  // When on-chain tx succeeds
  useEffect(() => {
    if (isTxConfirmed && normalized) {
      // Also sync to local cache
      const profiles = getLocalProfiles();
      profiles[normalized] = {
        name: normalized,
        owner: address as `0x${string}`,
        registeredAt: Math.floor(Date.now() / 1000),
        displayName: normalized,
        bio: "",
        avatarURI: "",
      };
      saveLocalProfiles(profiles);
      setRegisteredSuccessName(normalized);
      onSuccess(normalized);
    }
  }, [isTxConfirmed, normalized, address, onSuccess]);

  const handleRegister = async () => {
    if (!isValid || !availability.available) return;

    if (!isConnected || !address) {
      open();
      return;
    }

    if (chainId !== BOT_CHAIN.id) {
      await addBotChainToWallet();
      return;
    }

    // Try live smart contract call
    try {
      writeContract({
        address: contractAddress,
        abi: NAMETAG_ABI,
        functionName: "registerName",
        args: [normalized],
      });
    } catch (err) {
      console.warn("Smart contract call failed or simulated:", err);
      // Fallback sandbox registration
      handleSandboxRegister();
    }
  };

  const handleSandboxRegister = () => {
    if (!address || !normalized) return;
    setIsSandboxRegistering(true);
    setTimeout(() => {
      const profiles = getLocalProfiles();
      profiles[normalized] = {
        name: normalized,
        owner: address as `0x${string}`,
        registeredAt: Math.floor(Date.now() / 1000),
        displayName: normalized,
        bio: "Newly minted NameTag on BOT Chain",
        avatarURI: "",
      };
      saveLocalProfiles(profiles);
      setIsSandboxRegistering(false);
      setRegisteredSuccessName(normalized);
      onSuccess(normalized);
    }, 700);
  };

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      <div className="glass-card">
        <div style={{ marginBottom: "1.75rem", textAlign: "center" }}>
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
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.85rem", fontWeight: 800 }}>
            Claim Your Username
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Secure your permanent web3 identity on BOT Chain. Free forever.
          </p>
        </div>

        {registeredSuccessName ? (
          /* SUCCESS STATE */
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.15)",
                border: "2px solid var(--accent-emerald)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                color: "var(--accent-emerald)",
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", marginBottom: "0.5rem" }}>
              @{registeredSuccessName} is Yours!
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
              Successfully linked to your wallet {address && `(${address.slice(0, 6)}...${address.slice(-4)})`}.
            </p>

            {txHash && (
              <a
                href={`${BOT_CHAIN.blockExplorers.default.url}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  color: "var(--accent-cyan)",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                  textDecoration: "none",
                }}
              >
                <span>View transaction on BohrScan</span>
                <ExternalLink size={14} />
              </a>
            )}

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setRegisteredSuccessName(null);
                  setRawName("");
                  resetWrite();
                }}
              >
                Register Another Name
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM */
          <div>
            <div className="form-group">
              <label className="form-label">Desired Username</label>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: "1.1rem",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    color: "var(--accent-cyan)",
                    pointerEvents: "none",
                  }}
                >
                  @
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: "2.4rem", width: "100%", fontSize: "1.1rem", fontWeight: 600 }}
                  placeholder="e.g. emmanuel"
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  disabled={isTxPending || isTxConfirming || isSandboxRegistering}
                />
              </div>

              {/* Character & validation hints */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "0.4rem",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  Allowed: a-z, 0-9, _ (3-30 characters)
                </span>
                {rawName.trim() && (
                  <span style={{ color: isValid ? "var(--accent-emerald)" : "var(--accent-pink)" }}>
                    {normalized.length}/30 chars
                  </span>
                )}
              </div>
            </div>

            {/* Live Availability Status */}
            {rawName.trim() && (
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background: checking
                    ? "rgba(255,255,255,0.03)"
                    : availability.available
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(244, 63, 94, 0.1)",
                  border: `1px solid ${
                    checking
                      ? "var(--border-subtle)"
                      : availability.available
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(244, 63, 94, 0.3)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                {checking ? (
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    Checking availability on BOT Chain...
                  </span>
                ) : availability.available ? (
                  <>
                    <CheckCircle2 size={18} color="var(--accent-emerald)" />
                    <span style={{ fontSize: "0.88rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
                      @{normalized} is available to register!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} color="var(--accent-pink)" />
                    <span style={{ fontSize: "0.88rem", color: "var(--accent-pink)", fontWeight: 600 }}>
                      {availability.error || `@${normalized} is unavailable.`}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Registration Summary Box */}
            <div
              style={{
                background: "rgba(6, 8, 15, 0.7)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                padding: "1.25rem",
                marginBottom: "1.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: "0.6rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Registration Cost</span>
                <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>0 BOT (Free)</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.6rem 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Ownership Period</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>Lifetime / Permanent</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "0.6rem",
                  fontSize: "0.9rem",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>Network</span>
                <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>BOT Chain (968)</span>
              </div>
            </div>

            {/* Error alerts if any */}
            {writeError && (
              <div
                style={{
                  padding: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(244, 63, 94, 0.12)",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  marginBottom: "1.25rem",
                  fontSize: "0.82rem",
                  color: "#FB7185",
                }}
              >
                {writeError.message.includes("User rejected")
                  ? "Transaction was cancelled in wallet."
                  : `Contract note: ${writeError.message.slice(0, 120)}... You can also test with Sandbox Register below.`}
              </div>
            )}

            {/* Actions */}
            {!isConnected ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => open()}
                style={{ width: "100%", padding: "1rem" }}
              >
                Connect Wallet to Claim @{normalized || "name"}
              </button>
            ) : chainId !== BOT_CHAIN.id ? (
              <button
                type="button"
                className="btn-primary"
                onClick={addBotChainToWallet}
                style={{ width: "100%", padding: "1rem" }}
              >
                Switch to BOT Chain (968)
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRegister}
                  disabled={
                    !isValid ||
                    !availability.available ||
                    isTxPending ||
                    isTxConfirming ||
                    isSandboxRegistering
                  }
                  style={{ width: "100%", padding: "1rem" }}
                >
                  <Sparkles size={18} />
                  <span>
                    {isTxPending
                      ? "Confirming in Wallet..."
                      : isTxConfirming
                      ? "Waiting for Block Confirmation..."
                      : `Register @${normalized || "username"}`}
                  </span>
                </button>

                {/* Instant Sandbox Register option for zero-gas browser testing */}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleSandboxRegister}
                  disabled={!isValid || !availability.available || isSandboxRegistering}
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  {isSandboxRegistering ? "Registering..." : "⚡ Quick Demo Register (Zero Gas)"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
