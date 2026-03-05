import { useState, useCallback } from "react";
import { ethers } from "ethers";

/**
 * useWallet — manages MetaMask connection.
 *
 * Returns:
 *   account   - connected wallet address (null if not connected)
 *   provider  - ethers BrowserProvider (reads from blockchain)
 *   signer    - ethers Signer (signs and sends transactions)
 *   connect   - function to trigger MetaMask popup
 *   error     - any connection error message
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setError(null);

    // MetaMask injects window.ethereum into the browser
    if (!window.ethereum) {
      setError("MetaMask not found. Please install it from metamask.io");
      return;
    }

    try {
      // BrowserProvider wraps window.ethereum for ethers.js v6
      const _provider = new ethers.BrowserProvider(window.ethereum);

      // eth_requestAccounts triggers the MetaMask popup
      const accounts = await _provider.send("eth_requestAccounts", []);

      const _signer = await _provider.getSigner();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(accounts[0]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { account, provider, signer, connect, error };
}
