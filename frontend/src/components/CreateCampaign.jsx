import { useState } from "react";

/**
 * CreateCampaign — form to launch a new crowdfunding campaign.
 *
 * @param {Function} onCreate   - called with (goalEth, days)
 * @param {boolean}  txPending  - disables the form while a tx is in flight
 */
export function CreateCampaign({ onCreate, txPending }) {
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const g = parseFloat(goal);
    const d = parseInt(days);

    if (!g || g <= 0) return setError("Goal must be a positive number");
    if (!d || d <= 0) return setError("Duration must be at least 1 day");

    try {
      await onCreate(goal, d);
      setGoal("");
      setDays("");
    } catch (err) {
      // User rejected the transaction in MetaMask → friendly message
      setError(err.reason || err.message || "Transaction failed");
    }
  };

  return (
    <section className="card">
      <h2 className="card__title">Start a Campaign</h2>

      <form onSubmit={handleSubmit} className="form">
        <label className="form__label">
          Goal (ETH)
          <input
            className="form__input"
            type="number"
            min="0.001"
            step="0.001"
            placeholder="e.g. 1.5"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={txPending}
          />
        </label>

        <label className="form__label">
          Duration (days)
          <input
            className="form__input"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 30"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            disabled={txPending}
          />
        </label>

        {error && <p className="form__error">{error}</p>}

        <button className="btn btn--primary" type="submit" disabled={txPending}>
          {txPending ? "Waiting for confirmation..." : "Create Campaign"}
        </button>
      </form>
    </section>
  );
}
