export const PAYAGENT_ADDRESS = "0x5032320210Acf0133F8eAb5c4351E7a275556FEb" as const;

export const CELO_SEPOLIA_CHAIN_ID = 11155420;

// cUSD on Celo Sepolia (mock — real cUSD address TBD)
export const CUSD_ADDRESS = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as const;

export const PAYAGENT_ABI = [
  {
    type: "function",
    name: "createSplit",
    inputs: [
      { name: "splitId", type: "bytes32" },
      { name: "recipients", type: "address[]" },
      { name: "shares", type: "uint256[]" },
      { name: "token", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeSplit",
    inputs: [
      { name: "splitId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "schedulePayment",
    inputs: [
      { name: "to", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interval", type: "uint256" },
      { name: "maxExecs", type: "uint256" },
    ],
    outputs: [{ name: "id", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeScheduled",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelScheduled",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "createGroup",
    inputs: [
      { name: "name", type: "string" },
      { name: "members", type: "address[]" },
      { name: "token", type: "address" },
    ],
    outputs: [{ name: "groupId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addExpense",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "description", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settleGroup",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "froms", type: "address[]" },
      { name: "tos", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "authorizeAgent",
    inputs: [
      { name: "agent", type: "address" },
      { name: "maxPerTx", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeAgent",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSplit",
    inputs: [{ name: "splitId", type: "bytes32" }],
    outputs: [
      { name: "recipients", type: "address[]" },
      { name: "shares", type: "uint256[]" },
      { name: "token", type: "address" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "scheduled",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interval", type: "uint256" },
      { name: "nextExecAt", type: "uint256" },
      { name: "execCount", type: "uint256" },
      { name: "maxExecs", type: "uint256" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getDuePayments",
    inputs: [{ name: "ids", type: "uint256[]" }],
    outputs: [{ name: "dueIds", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGroupMembers",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getExpense",
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "expenseId", type: "uint256" },
    ],
    outputs: [
      { name: "paidBy", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "description", type: "string" },
      { name: "settled", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGroupExpenseCount",
    inputs: [{ name: "groupId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowances",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextScheduledId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextGroupId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;
