import { CampaignCard } from "./CampaignCard";

/**
 * CampaignList — renders all campaigns or appropriate empty/loading states.
 */
export function CampaignList({ campaigns, account, loading, onDonate, onWithdraw, onRefund, txPending }) {
  if (loading) {
    return <p className="state-message">Loading campaigns from blockchain...</p>;
  }

  if (campaigns.length === 0) {
    return (
      <p className="state-message">
        No campaigns yet. Be the first to start one!
      </p>
    );
  }

  // Show newest campaigns first
  const sorted = [...campaigns].sort((a, b) => b.id - a.id);

  return (
    <div className="campaign-grid">
      {sorted.map((c) => (
        <CampaignCard
          key={c.id}
          campaign={c}
          account={account}
          onDonate={onDonate}
          onWithdraw={onWithdraw}
          onRefund={onRefund}
          txPending={txPending}
        />
      ))}
    </div>
  );
}
