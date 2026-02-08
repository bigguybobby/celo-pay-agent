// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title PayAgent — AI-Powered Payment Agent for Celo
/// @notice Autonomous payment splitting, scheduling, and group expense management
/// @dev Designed for AI agents to execute payments on behalf of users on Celo L2
contract PayAgent {
    // ─── Types ───────────────────────────────────────────────────────────
    struct Split {
        address[] recipients;
        uint256[] shares; // basis points (total must = 10000)
        address token;    // ERC20 token (cUSD, cEUR, etc.)
        bool active;
    }

    struct ScheduledPayment {
        address from;
        address to;
        address token;
        uint256 amount;
        uint256 interval;    // seconds between payments
        uint256 nextExecAt;  // next execution timestamp
        uint256 execCount;   // times executed
        uint256 maxExecs;    // 0 = unlimited
        bool active;
    }

    struct Group {
        string name;
        address[] members;
        address token;
        mapping(uint256 => Expense) expenses;
        uint256 expenseCount;
        bool active;
    }

    struct Expense {
        address paidBy;
        uint256 amount;
        string description;
        bool settled;
    }

    // ─── State ───────────────────────────────────────────────────────────
    mapping(bytes32 => Split) public splits;
    mapping(uint256 => ScheduledPayment) public scheduled;
    mapping(uint256 => Group) private groups;
    mapping(address => bool) public authorizedAgents;
    mapping(address => mapping(address => uint256)) public allowances; // user => agent => max per tx

    uint256 public nextScheduledId;
    uint256 public nextGroupId;
    address public owner;

    // ─── Events ──────────────────────────────────────────────────────────
    event SplitCreated(bytes32 indexed splitId, address indexed creator, address token);
    event SplitExecuted(bytes32 indexed splitId, uint256 totalAmount);
    event PaymentScheduled(uint256 indexed id, address indexed from, address indexed to, uint256 amount);
    event PaymentExecuted(uint256 indexed id, uint256 execCount);
    event GroupCreated(uint256 indexed groupId, string name);
    event ExpenseAdded(uint256 indexed groupId, uint256 expenseId, address paidBy, uint256 amount);
    event GroupSettled(uint256 indexed groupId);
    event AgentAuthorized(address indexed agent, address indexed user, uint256 maxPerTx);
    event AgentRevoked(address indexed agent, address indexed user);

    // ─── Modifiers ───────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyAuthorizedFor(address user) {
        require(
            msg.sender == user || allowances[user][msg.sender] > 0,
            "not authorized"
        );
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ─── Agent Authorization ─────────────────────────────────────────────
    /// @notice Authorize an AI agent to execute payments on your behalf
    /// @param agent The agent's address
    /// @param maxPerTx Maximum amount per transaction the agent can spend
    function authorizeAgent(address agent, uint256 maxPerTx) external {
        allowances[msg.sender][agent] = maxPerTx;
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent, msg.sender, maxPerTx);
    }

    function revokeAgent(address agent) external {
        allowances[msg.sender][agent] = 0;
        emit AgentRevoked(agent, msg.sender);
    }

    // ─── Payment Splitting ───────────────────────────────────────────────
    /// @notice Create a reusable payment split configuration
    function createSplit(
        bytes32 splitId,
        address[] calldata recipients,
        uint256[] calldata shares,
        address token
    ) external {
        require(recipients.length == shares.length, "length mismatch");
        require(recipients.length > 0, "empty");
        uint256 total;
        for (uint256 i; i < shares.length; i++) {
            total += shares[i];
        }
        require(total == 10000, "shares must total 10000 bps");

        splits[splitId] = Split({
            recipients: recipients,
            shares: shares,
            token: token,
            active: true
        });
        emit SplitCreated(splitId, msg.sender, token);
    }

    /// @notice Execute a split — distribute `amount` of token according to split config
    function executeSplit(bytes32 splitId, uint256 amount) external {
        Split storage s = splits[splitId];
        require(s.active, "split not active");

        IERC20 token = IERC20(s.token);
        for (uint256 i; i < s.recipients.length; i++) {
            uint256 share = (amount * s.shares[i]) / 10000;
            require(
                token.transferFrom(msg.sender, s.recipients[i], share),
                "transfer failed"
            );
        }
        emit SplitExecuted(splitId, amount);
    }

    // ─── Scheduled Payments ──────────────────────────────────────────────
    /// @notice Schedule a recurring payment (agent can execute when due)
    function schedulePayment(
        address to,
        address token,
        uint256 amount,
        uint256 interval,
        uint256 maxExecs
    ) external returns (uint256 id) {
        id = nextScheduledId++;
        scheduled[id] = ScheduledPayment({
            from: msg.sender,
            to: to,
            token: token,
            amount: amount,
            interval: interval,
            nextExecAt: block.timestamp + interval,
            execCount: 0,
            maxExecs: maxExecs,
            active: true
        });
        emit PaymentScheduled(id, msg.sender, to, amount);
    }

    /// @notice Execute a scheduled payment (callable by anyone when due — designed for agents)
    function executeScheduled(uint256 id) external {
        ScheduledPayment storage p = scheduled[id];
        require(p.active, "not active");
        require(block.timestamp >= p.nextExecAt, "not due yet");
        if (p.maxExecs > 0) {
            require(p.execCount < p.maxExecs, "max executions reached");
        }

        IERC20 token = IERC20(p.token);
        require(
            token.transferFrom(p.from, p.to, p.amount),
            "transfer failed"
        );

        p.execCount++;
        p.nextExecAt = block.timestamp + p.interval;

        if (p.maxExecs > 0 && p.execCount >= p.maxExecs) {
            p.active = false;
        }

        emit PaymentExecuted(id, p.execCount);
    }

    function cancelScheduled(uint256 id) external {
        require(scheduled[id].from == msg.sender, "not owner");
        scheduled[id].active = false;
    }

    // ─── Group Expenses ──────────────────────────────────────────────────
    /// @notice Create an expense group (e.g., roommates, team, event)
    function createGroup(
        string calldata name,
        address[] calldata members,
        address token
    ) external returns (uint256 groupId) {
        groupId = nextGroupId++;
        Group storage g = groups[groupId];
        g.name = name;
        g.members = members;
        g.token = token;
        g.active = true;
        emit GroupCreated(groupId, name);
    }

    /// @notice Add an expense to a group
    function addExpense(
        uint256 groupId,
        uint256 amount,
        string calldata description
    ) external {
        Group storage g = groups[groupId];
        require(g.active, "group not active");
        require(_isMember(g, msg.sender), "not a member");

        uint256 expId = g.expenseCount++;
        g.expenses[expId] = Expense({
            paidBy: msg.sender,
            amount: amount,
            description: description,
            settled: false
        });
        emit ExpenseAdded(groupId, expId, msg.sender, amount);
    }

    /// @notice Settle all expenses in a group — AI agent calculates net balances and executes transfers
    /// @dev Agent calls this with pre-calculated settlement transfers
    function settleGroup(
        uint256 groupId,
        address[] calldata froms,
        address[] calldata tos,
        uint256[] calldata amounts
    ) external {
        Group storage g = groups[groupId];
        require(g.active, "group not active");
        require(froms.length == tos.length && tos.length == amounts.length, "length mismatch");

        IERC20 token = IERC20(g.token);
        for (uint256 i; i < froms.length; i++) {
            require(
                token.transferFrom(froms[i], tos[i], amounts[i]),
                "settlement transfer failed"
            );
        }

        // Mark all expenses as settled
        for (uint256 i; i < g.expenseCount; i++) {
            g.expenses[i].settled = true;
        }

        emit GroupSettled(groupId);
    }

    // ─── View Functions ──────────────────────────────────────────────────
    function getSplit(bytes32 splitId) external view returns (
        address[] memory recipients,
        uint256[] memory shares,
        address token,
        bool active
    ) {
        Split storage s = splits[splitId];
        return (s.recipients, s.shares, s.token, s.active);
    }

    function getGroupMembers(uint256 groupId) external view returns (address[] memory) {
        return groups[groupId].members;
    }

    function getExpense(uint256 groupId, uint256 expenseId) external view returns (
        address paidBy, uint256 amount, string memory description, bool settled
    ) {
        Expense storage e = groups[groupId].expenses[expenseId];
        return (e.paidBy, e.amount, e.description, e.settled);
    }

    function getGroupExpenseCount(uint256 groupId) external view returns (uint256) {
        return groups[groupId].expenseCount;
    }

    function getDuePayments(uint256[] calldata ids) external view returns (uint256[] memory dueIds) {
        uint256 count;
        for (uint256 i; i < ids.length; i++) {
            if (scheduled[ids[i]].active && block.timestamp >= scheduled[ids[i]].nextExecAt) {
                count++;
            }
        }
        dueIds = new uint256[](count);
        uint256 j;
        for (uint256 i; i < ids.length; i++) {
            if (scheduled[ids[i]].active && block.timestamp >= scheduled[ids[i]].nextExecAt) {
                dueIds[j++] = ids[i];
            }
        }
    }

    // ─── Internal ────────────────────────────────────────────────────────
    function _isMember(Group storage g, address addr) internal view returns (bool) {
        for (uint256 i; i < g.members.length; i++) {
            if (g.members[i] == addr) return true;
        }
        return false;
    }
}
