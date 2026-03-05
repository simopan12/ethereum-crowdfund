import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "../contract";

/**
 * useCrowdFund — all interactions with the CrowdFund smart contract.
 *
 * @param {ethers.Provider} provider - read-only provider
 * @param {ethers.Signer}   signer   - signer for write operations
 */
export function useCrowdFund(provider, signer) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────

  // Read-only contract instance (no gas needed)
  const readContract = useCallback(() => {
    if (!provider) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  }, [provider]);

  // Write contract instance (requires signer + MetaMask)
  const writeContract = useCallback(() => {
    if (!signer) return null;
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  }, [signer]);

  // ── Load all campaigns ───────────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    const contract = readContract();
    if (!contract) return;

    setLoading(true);
    try {
      const count = await contract.campaignCount();
      const items = [];

      for (let i = 0; i < Number(count); i++) {
        const c = await contract.campaigns(i);
        items.push({
          id: i,
          creator: c.creator,
          goal: c.goal,           // BigInt, in wei
          deadline: Number(c.deadline) * 1000, // convert to JS timestamp (ms)
          raised: c.raised,       // BigInt, in wei
          withdrawn: c.withdrawn,
        });
      }

      setCampaigns(items);
    } catch (err) {
      console.error("loadCampaigns error:", err);
    } finally {
      setLoading(false);
    }
  }, [readContract]);

  // Reload whenever provider changes (e.g. after wallet connects)
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // ── Write actions ────────────────────────────────────────────────────────

  /**
   * Create a new campaign.
   * @param {string} goalEth   - goal in ETH as a string (e.g. "1.5")
   * @param {number} days      - campaign duration in days
   */
  const createCampaign = useCallback(
    async (goalEth, days) => {
      const contract = writeContract();
      if (!contract) throw new Error("Wallet not connected");

      setTxPending(true);
      try {
        const goalWei = ethers.parseEther(goalEth);
        const duration = days * 24 * 60 * 60;

        const tx = await contract.createCampaign(goalWei, duration);
        await tx.wait(); // wait for the transaction to be mined
        await loadCampaigns();
      } finally {
        setTxPending(false);
      }
    },
    [writeContract, loadCampaigns]
  );

  /**
   * Donate ETH to a campaign.
   * @param {number} id       - campaign ID
   * @param {string} amountEth - amount in ETH as a string
   */
  const donate = useCallback(
    async (id, amountEth) => {
      const contract = writeContract();
      if (!contract) throw new Error("Wallet not connected");

      setTxPending(true);
      try {
        const tx = await contract.donate(id, {
          value: ethers.parseEther(amountEth),
        });
        await tx.wait();
        await loadCampaigns();
      } finally {
        setTxPending(false);
      }
    },
    [writeContract, loadCampaigns]
  );

  /**
   * Withdraw funds after a successful campaign (creator only).
   * @param {number} id - campaign ID
   */
  const withdraw = useCallback(
    async (id) => {
      const contract = writeContract();
      if (!contract) throw new Error("Wallet not connected");

      setTxPending(true);
      try {
        const tx = await contract.withdraw(id);
        await tx.wait();
        await loadCampaigns();
      } finally {
        setTxPending(false);
      }
    },
    [writeContract, loadCampaigns]
  );

  /**
   * Claim a refund after a failed campaign (donors only).
   * @param {number} id - campaign ID
   */
  const refund = useCallback(
    async (id) => {
      const contract = writeContract();
      if (!contract) throw new Error("Wallet not connected");

      setTxPending(true);
      try {
        const tx = await contract.refund(id);
        await tx.wait();
        await loadCampaigns();
      } finally {
        setTxPending(false);
      }
    },
    [writeContract, loadCampaigns]
  );

  return {
    campaigns,
    loading,
    txPending,
    loadCampaigns,
    createCampaign,
    donate,
    withdraw,
    refund,
  };
}
