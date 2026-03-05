/**
 * WalletBar — shows connection status and the connect button.
 */
export function WalletBar({ account, onConnect, error }) {
  const short = (addr) => addr.slice(0, 6) + "..." + addr.slice(-4);

  return (
    <header className="wallet-bar">
      <div className="wallet-bar__title">
        <span className="wallet-bar__icon">&#9670;</span>
        CrowdFund
      </div>

      <div className="wallet-bar__right">
        {error && <span className="wallet-bar__error">{error}</span>}

        {account ? (
          <span className="wallet-bar__address">{short(account)}</span>
        ) : (
          <button className="btn btn--primary" onClick={onConnect}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
