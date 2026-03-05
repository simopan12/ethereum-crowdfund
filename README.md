# Ethereum CrowdFund

A decentralized crowdfunding DApp built on Ethereum.

## What it does

- Anyone can **create a campaign** with a funding goal (ETH) and a deadline
- Anyone can **donate ETH** to an active campaign
- If the goal is reached → the creator **withdraws** the funds
- If the goal fails → donors get a **refund**

## Stack

- Solidity 0.8.28
- Hardhat 2
- ethers.js v6
- Chai + Mocha (tests)

## Setup

```bash
npm install
```

## Run tests

```bash
npx hardhat test
```

## Compile

```bash
npx hardhat compile
```

## Deploy locally

```bash
npx hardhat node          # start local blockchain
npx hardhat run scripts/deploy.js --network localhost
```

## Deploy to Sepolia testnet

1. Copy `.env.example` to `.env` and fill in your keys
2. Run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Project structure

```
contracts/      Solidity smart contracts
scripts/        Deployment scripts
test/           Automated tests
```
