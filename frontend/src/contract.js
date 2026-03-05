// Contract address — update this after each deploy
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ABI: the "interface" that tells ethers.js what functions the contract has
export const ABI = [
  // ── Events ────────────────────────────────────────────────────────────────
  "event CampaignCreated(uint256 indexed id, address indexed creator, uint256 goal, uint256 deadline)",
  "event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount)",
  "event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount)",
  "event RefundIssued(uint256 indexed id, address indexed donor, uint256 amount)",

  // ── Read functions (free — no gas) ────────────────────────────────────────
  "function campaignCount() view returns (uint256)",
  "function campaigns(uint256 id) view returns (address creator, uint256 goal, uint256 deadline, uint256 raised, bool withdrawn)",
  "function donations(uint256 id, address donor) view returns (uint256)",
  "function isSuccessful(uint256 id) view returns (bool)",

  // ── Write functions (cost gas — require MetaMask confirmation) ────────────
  "function createCampaign(uint256 goal, uint256 duration) returns (uint256)",
  "function donate(uint256 id) payable",
  "function withdraw(uint256 id)",
  "function refund(uint256 id)",
];
