import { useWallet } from "./hooks/useWallet";
import { useCrowdFund } from "./hooks/useCrowdFund";
import { WalletBar } from "./components/WalletBar";
import { CreateCampaign } from "./components/CreateCampaign";
import { CampaignList } from "./components/CampaignList";
import "./App.css";

export default function App() {
  const { account, provider, signer, connect, error: walletError } = useWallet();

  const {
    campaigns,
    loading,
    txPending,
    loadCampaigns,
    createCampaign,
    donate,
    withdraw,
    refund,
  } = useCrowdFund(provider, signer);

  return (
    <div className="app">
      {/* Top bar with wallet connection */}
      <WalletBar account={account} onConnect={connect} error={walletError} />

      <main className="main">
        {/* Prompt to connect if not yet connected */}
        {!account && (
          <div className="connect-prompt">
            <h1>Decentralized Crowdfunding</h1>
            <p>Connect your MetaMask wallet to create campaigns and donate ETH.</p>
            <button className="btn btn--primary btn--large" onClick={connect}>
              Connect MetaMask
            </button>
          </div>
        )}

        {/* Main UI — shown once connected */}
        {account && (
          <>
            {txPending && (
              <div className="tx-banner">
                Transaction pending — please wait...
              </div>
            )}

            <div className="layout">
              {/* Left: create campaign form */}
              <aside className="layout__sidebar">
                <CreateCampaign onCreate={createCampaign} txPending={txPending} />

                <button
                  className="btn btn--ghost"
                  onClick={loadCampaigns}
                  disabled={loading || txPending}
                  style={{ marginTop: "1rem", width: "100%" }}
                >
                  Refresh Campaigns
                </button>
              </aside>

              {/* Right: campaign list */}
              <section className="layout__main">
                <h2 className="section-title">All Campaigns</h2>
                <CampaignList
                  campaigns={campaigns}
                  account={account}
                  loading={loading}
                  onDonate={donate}
                  onWithdraw={withdraw}
                  onRefund={refund}
                  txPending={txPending}
                />
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
