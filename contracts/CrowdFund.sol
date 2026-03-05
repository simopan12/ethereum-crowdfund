// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CrowdFund
 * @notice A simple decentralized crowdfunding contract.
 *
 * Anyone can:
 *  - create a campaign with a funding goal (in ETH) and a deadline
 *  - donate ETH to an active campaign
 *  - withdraw funds if the goal was reached (creator only)
 *  - get a refund if the campaign failed (donors only)
 */
contract CrowdFund {
    // ─── Data structures ─────────────────────────────────────────────────────

    struct Campaign {
        address creator;     // who created the campaign
        uint256 goal;        // amount of ETH to raise (in wei)
        uint256 deadline;    // unix timestamp — campaign ends here
        uint256 raised;      // total ETH donated so far
        bool withdrawn;      // true once the creator has claimed the funds
    }

    // ─── State variables ─────────────────────────────────────────────────────

    // All campaigns, indexed by an auto-incrementing ID
    mapping(uint256 => Campaign) public campaigns;

    // How much each donor gave to each campaign
    // donations[campaignId][donorAddress] = amount in wei
    mapping(uint256 => mapping(address => uint256)) public donations;

    uint256 public campaignCount; // total campaigns created so far

    // ─── Events ──────────────────────────────────────────────────────────────

    event CampaignCreated(uint256 indexed id, address indexed creator, uint256 goal, uint256 deadline);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);
    event FundsWithdrawn(uint256 indexed id, address indexed creator, uint256 amount);
    event RefundIssued(uint256 indexed id, address indexed donor, uint256 amount);

    // ─── Functions ───────────────────────────────────────────────────────────

    /**
     * @notice Create a new campaign.
     * @param goal    Target amount in wei (1 ETH = 1e18 wei)
     * @param duration How many seconds from now the campaign stays open
     */
    function createCampaign(uint256 goal, uint256 duration) external returns (uint256) {
        require(goal > 0, "Goal must be greater than zero");
        require(duration > 0, "Duration must be greater than zero");

        uint256 id = campaignCount;
        campaigns[id] = Campaign({
            creator:   msg.sender,
            goal:      goal,
            deadline:  block.timestamp + duration,
            raised:    0,
            withdrawn: false
        });

        campaignCount++;
        emit CampaignCreated(id, msg.sender, goal, block.timestamp + duration);
        return id;
    }

    /**
     * @notice Donate ETH to a campaign.
     * @param id Campaign ID
     */
    function donate(uint256 id) external payable {
        Campaign storage c = campaigns[id];
        require(c.creator != address(0), "Campaign does not exist");
        require(block.timestamp < c.deadline, "Campaign has ended");
        require(msg.value > 0, "Donation must be greater than zero");

        c.raised += msg.value;
        donations[id][msg.sender] += msg.value;

        emit DonationReceived(id, msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds after a successful campaign (creator only).
     * @param id Campaign ID
     */
    function withdraw(uint256 id) external {
        Campaign storage c = campaigns[id];
        require(msg.sender == c.creator, "Only creator can withdraw");
        require(block.timestamp >= c.deadline, "Campaign is still active");
        require(c.raised >= c.goal, "Goal was not reached");
        require(!c.withdrawn, "Already withdrawn");

        c.withdrawn = true;
        uint256 amount = c.raised;

        // Transfer ETH to the creator
        (bool ok, ) = c.creator.call{value: amount}("");
        require(ok, "Transfer failed");

        emit FundsWithdrawn(id, c.creator, amount);
    }

    /**
     * @notice Claim a refund if the campaign failed (donors only).
     * @param id Campaign ID
     */
    function refund(uint256 id) external {
        Campaign storage c = campaigns[id];
        require(block.timestamp >= c.deadline, "Campaign is still active");
        require(c.raised < c.goal, "Goal was reached - no refunds");

        uint256 amount = donations[id][msg.sender];
        require(amount > 0, "Nothing to refund");

        // Zero out before transfer to prevent reentrancy attacks
        donations[id][msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Refund failed");

        emit RefundIssued(id, msg.sender, amount);
    }

    // ─── View helpers ────────────────────────────────────────────────────────

    /**
     * @notice Returns true if the campaign goal has been reached.
     */
    function isSuccessful(uint256 id) external view returns (bool) {
        Campaign storage c = campaigns[id];
        return c.raised >= c.goal;
    }
}
