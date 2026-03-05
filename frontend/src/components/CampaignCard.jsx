import { useState } from "react";
import { ethers } from "ethers";

/**
 * CampaignCard — displays a single campaign and its available actions.
 *
 * Actions shown depend on state:
 *  - Active + not creator  → Donate
 *  - Ended + goal met + creator + not withdrawn → Withdraw
 *  - Ended + goal not met + donated             → Refund
 */
export function CampaignCard({ campaign, account, onDonate, onWithdraw, onRefund, txPending }) {
  const [donationAmount, setDonationAmount] = useState("");
  const [actionError, setActionError] = useState("");

  const { id, creator, goal, deadline, raised, withdrawn } = campaign;

  const now = Date.now();
  const isActive = now < deadline;
  const isCreator = account?.toLowerCase() === creator.toLowerCase();
  const goalReached = raised >= goal;

  // Progress as a percentage (capped at 100%)
  const progress = Math.min((Number(raised) / Number(goal)) * 100, 100).toFixed(1);

  // Format wei → ETH string with 4 decimals
  const fmt = (wei) => parseFloat(ethers.formatEther(wei)).toFixed(4);

  // Time remaining
  const timeLeft = () => {
    if (!isActive) return "Ended";
    const ms = deadline - now;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    return `${days}d ${hours}h left`;
  };

  const handleDonate = async () => {
    setActionError("");
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      return setActionError("Enter a valid amount");
    }
    try {
      await onDonate(id, donationAmount);
      setDonationAmount("");
    } catch (err) {
      setActionError(err.reason || err.message || "Transaction failed");
    }
  };

  const handleWithdraw = async () => {
    setActionError("");
    try {
      await onWithdraw(id);
    } catch (err) {
      setActionError(err.reason || err.message || "Transaction failed");
    }
  };

  const handleRefund = async () => {
    setActionError("");
    try {
      await onRefund(id);
    } catch (err) {
      setActionError(err.reason || err.message || "Transaction failed");
    }
  };

  return (
    <div className={`campaign-card ${!isActive ? "campaign-card--ended" : ""}`}>
      {/* Header */}
      <div className="campaign-card__header">
        <span className="campaign-card__id">#{id}</span>
        <span className={`campaign-card__status ${isActive ? "status--active" : "status--ended"}`}>
          {isActive ? "Active" : goalReached ? "Funded" : "Failed"}
        </span>
      </div>

      {/* Creator */}
      <p className="campaign-card__creator">
        by {creator.slice(0, 6)}...{creator.slice(-4)}
        {isCreator && <span className="campaign-card__you"> (you)</span>}
      </p>

      {/* Progress */}
      <div className="campaign-card__progress-row">
        <span>{fmt(raised)} ETH raised</span>
        <span>of {fmt(goal)} ETH</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="campaign-card__meta">{progress}% &bull; {timeLeft()}</p>

      {/* Actions */}
      {account && (
        <div className="campaign-card__actions">
          {/* Donate — visible while campaign is active and connected */}
          {isActive && (
            <div className="action-row">
              <input
                className="form__input action-row__input"
                type="number"
                min="0.0001"
                step="0.0001"
                placeholder="ETH amount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                disabled={txPending}
              />
              <button
                className="btn btn--primary"
                onClick={handleDonate}
                disabled={txPending}
              >
                Donate
              </button>
            </div>
          )}

          {/* Withdraw — creator only, after deadline, goal met, not yet withdrawn */}
          {!isActive && isCreator && goalReached && !withdrawn && (
            <button
              className="btn btn--success"
              onClick={handleWithdraw}
              disabled={txPending}
            >
              Withdraw Funds
            </button>
          )}

          {/* Refund — after deadline, goal NOT met */}
          {!isActive && !goalReached && (
            <button
              className="btn btn--warning"
              onClick={handleRefund}
              disabled={txPending}
            >
              Claim Refund
            </button>
          )}

          {/* Already withdrawn */}
          {!isActive && isCreator && withdrawn && (
            <p className="campaign-card__done">Funds already withdrawn</p>
          )}
        </div>
      )}

      {actionError && <p className="form__error">{actionError}</p>}
    </div>
  );
}
