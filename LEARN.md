# How this project works — plain English

## The problem Ethereum solves

Think of Kickstarter: you give money to a private company, which holds it and
forwards it to the campaign creator. You have to **trust** Kickstarter.

With Ethereum there is no middleman. The rules are written in **code**, run on
thousands of computers at once, and nobody can change them or steal the funds.
You don't have to trust anyone — the code is the guarantor.

---

## What is a Smart Contract

A program that lives on the blockchain. Once published:
- it cannot be modified
- it always runs automatically
- nobody controls it — the network executes it

`contracts/CrowdFund.sol` is a smart contract. When someone donates ETH, the
money doesn't go to our server — **it goes inside the contract itself**, locked
there until conditions (goal reached or deadline expired) are met.

---

## The pieces of the project

### `contracts/CrowdFund.sol` — the heart

Written in **Solidity**, the language of Ethereum contracts.
It defines 4 operations:

| Function         | What it does |
|------------------|--------------|
| `createCampaign` | Stores on-chain: creator address, goal in ETH, deadline |
| `donate`         | Receives ETH and locks it inside the contract |
| `withdraw`       | If goal reached + deadline passed → sends ETH to creator |
| `refund`         | If goal NOT reached + deadline passed → returns ETH to donor |

Key Solidity concepts used:

- `msg.sender` — the address of whoever is calling the function
- `msg.value` — how much ETH they sent with the call
- `block.timestamp` — current time as seen by the blockchain
- **Zero-before-transfer** pattern in `refund()` — defends against reentrancy
  attacks (a hacker calling refund in a loop before the balance is cleared)

---

### Hardhat — the development environment

Hardhat simulates an Ethereum blockchain on your PC. It gives you 20 accounts
with 10,000 ETH each for testing. No real money, no internet required.

`hardhat.config.js` tells Hardhat which Solidity version to use and how to
connect to real networks (Sepolia testnet, Mainnet).

---

### `test/CrowdFund.test.js` — automated tests

11 tests that verify every scenario: successful donation, correct refund,
blocked double-withdraw, etc. Every time you change the contract, re-run
the tests and know immediately if you broke something.

The interesting trick: `time.increase(ONE_WEEK)` moves the local blockchain
clock forward by 7 days — impossible in the real world, invaluable for testing.

---

### `frontend/src/hooks/useWallet.js` — MetaMask connection

MetaMask injects `window.ethereum` into the browser. This hook:
1. Grabs `window.ethereum`
2. Wraps it in an `ethers.BrowserProvider` object
3. Asks the user to authorize the connection (the MetaMask popup)
4. Returns a **provider** (reads data) and a **signer** (signs transactions)

---

### `frontend/src/hooks/useCrowdFund.js` — talking to the contract

Uses **ethers.js**, the library that translates JavaScript calls into Ethereum
transactions.

```js
// Reading data (free, no signature needed)
contract.campaigns(0)  →  returns the data for campaign #0

// Writing data (costs gas, requires MetaMask)
contract.donate(0, { value: parseEther("1.0") })  →  sends 1 ETH to campaign #0
```

When you call a "write" function, MetaMask opens a popup showing how much ETH
and gas you are spending. You approve, the transaction goes to the blockchain,
and after a few seconds it is permanent.

---

### `frontend/src/contract.js` — the bridge between frontend and contract

Contains two things:
- **`CONTRACT_ADDRESS`**: where the contract lives on the blockchain
  (every deploy generates a new address)
- **`ABI`**: the list of contract functions; ethers.js needs this to know how
  to call them

---

### `scripts/interact.js` — live demonstration (Phase 2)

A script that simulates the entire campaign lifecycle:
1. Creates a campaign
2. Donates 1 ETH
3. Fast-forwards time by 8 days (`evm_increaseTime` — local network trick only)
4. Creator withdraws the funds

Result: creator receives ~0.9999 ETH (the missing ~0.0001 is **gas** — the
computational cost to execute operations on the blockchain).

---

## The full flow when you use the DApp

```
1. Open browser → React frontend (Vite dev server)
2. Click "Connect Wallet" → MetaMask popup appears
3. Approve → frontend reads your address and loads campaigns from the contract
4. Click "Donate 0.5 ETH" → MetaMask asks for confirmation
5. Approve → transaction goes to the Hardhat local blockchain
6. Contract updates the balance — permanent, immutable
```

---

## Key vocabulary

| Term | Meaning |
|------|---------|
| **Blockchain** | A shared database replicated on thousands of computers |
| **ETH / wei** | Ether is the currency; 1 ETH = 1,000,000,000,000,000,000 wei |
| **Gas** | The fee paid to the network to execute a transaction |
| **Wallet** | Your identity on Ethereum — a public address + a private key |
| **ABI** | Application Binary Interface — the "menu" of a contract's functions |
| **Testnet** | A real blockchain used only for testing, with worthless ETH |
| **Signer** | An object that can sign and send transactions using your private key |
| **Provider** | An object that can read data from the blockchain (no signing) |
