"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectKitButton } from "connectkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, keccak256, toBytes } from "viem";
import { PAYAGENT_ADDRESS, PAYAGENT_ABI, CUSD_ADDRESS } from "@/config/contract";

type Tab = "splits" | "scheduled" | "groups" | "agent";

export default function AppDashboard() {
  const [tab, setTab] = useState<Tab>("splits");
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-green-400">Celo</span>PayAgent
          </Link>
          <ConnectKitButton />
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {!isConnected && (
          <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-center">
            <p className="text-yellow-400">Connect your wallet to interact with CeloPayAgent on Celo Sepolia</p>
          </div>
        )}

        {isConnected && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2 text-sm text-gray-400">
            Connected: <span className="text-green-400 font-mono">{address}</span> · Contract: <span className="font-mono text-gray-500">{PAYAGENT_ADDRESS.slice(0, 10)}...</span>
          </div>
        )}

        <div className="mb-8 flex gap-2 rounded-lg bg-gray-900 p-1">
          {(["splits", "scheduled", "groups", "agent"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                tab === t ? "bg-green-500 text-gray-950" : "text-gray-400 hover:text-white"
              }`}
            >
              {t === "agent" ? "🤖 Agent" : t}
            </button>
          ))}
        </div>

        {tab === "splits" && <SplitsPanel />}
        {tab === "scheduled" && <ScheduledPanel />}
        {tab === "groups" && <GroupsPanel />}
        {tab === "agent" && <AgentPanel />}
      </div>
    </div>
  );
}

function SplitsPanel() {
  const { isConnected } = useAccount();
  const [splitName, setSplitName] = useState("");
  const [recipients, setRecipients] = useState("");
  const [shares, setShares] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleCreateSplit = () => {
    const recipientList = recipients.split(",").map((r) => r.trim()) as `0x${string}`[];
    const shareList = shares.split(",").map((s) => BigInt(s.trim()));
    const splitId = keccak256(toBytes(splitName));
    writeContract({
      address: PAYAGENT_ADDRESS,
      abi: PAYAGENT_ABI,
      functionName: "createSplit",
      args: [splitId, recipientList, shareList, CUSD_ADDRESS],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">✂️ Payment Splits</h2>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
        <h3 className="font-semibold">Create New Split</h3>
        <input
          type="text"
          placeholder="Split name (e.g. team-split)"
          value={splitName}
          onChange={(e) => setSplitName(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Recipients (comma-separated 0x addresses)"
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Shares in basis points (e.g. 6000,4000 for 60%/40%)"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <button
          onClick={handleCreateSplit}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-gray-950 disabled:opacity-50"
        >
          {isPending ? "Confirming..." : isConfirming ? "Waiting..." : "Create Split"}
        </button>
        {isSuccess && <p className="text-green-400 text-sm">✅ Split created! TX: {hash?.slice(0, 16)}...</p>}
      </div>
    </div>
  );
}

function ScheduledPanel() {
  const { isConnected } = useAccount();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [interval, setInterval_] = useState("86400");
  const [maxExecs, setMaxExecs] = useState("0");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSchedule = () => {
    writeContract({
      address: PAYAGENT_ADDRESS,
      abi: PAYAGENT_ABI,
      functionName: "schedulePayment",
      args: [to as `0x${string}`, CUSD_ADDRESS, parseEther(amount), BigInt(interval), BigInt(maxExecs)],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🔄 Scheduled Payments</h2>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
        <h3 className="font-semibold">Schedule Recurring Payment</h3>
        <input
          type="text"
          placeholder="Recipient address (0x...)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Amount in cUSD (e.g. 10)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Interval (seconds)</label>
            <input
              type="number"
              value={interval}
              onChange={(e) => setInterval_(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Max executions (0=unlimited)</label>
            <input
              type="number"
              value={maxExecs}
              onChange={(e) => setMaxExecs(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleSchedule}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-gray-950 disabled:opacity-50"
        >
          {isPending ? "Confirming..." : isConfirming ? "Waiting..." : "Schedule Payment"}
        </button>
        {isSuccess && <p className="text-green-400 text-sm">✅ Payment scheduled! TX: {hash?.slice(0, 16)}...</p>}
      </div>
    </div>
  );
}

function GroupsPanel() {
  const { isConnected } = useAccount();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleCreateGroup = () => {
    const memberList = members.split(",").map((m) => m.trim()) as `0x${string}`[];
    writeContract({
      address: PAYAGENT_ADDRESS,
      abi: PAYAGENT_ABI,
      functionName: "createGroup",
      args: [groupName, memberList, CUSD_ADDRESS],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">👥 Expense Groups</h2>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
        <h3 className="font-semibold">Create Expense Group</h3>
        <input
          type="text"
          placeholder="Group name (e.g. roommates)"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Member addresses (comma-separated 0x...)"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
        />
        <button
          onClick={handleCreateGroup}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-gray-950 disabled:opacity-50"
        >
          {isPending ? "Confirming..." : isConfirming ? "Waiting..." : "Create Group"}
        </button>
        {isSuccess && <p className="text-green-400 text-sm">✅ Group created! TX: {hash?.slice(0, 16)}...</p>}
      </div>
    </div>
  );
}

function AgentPanel() {
  const { isConnected, address } = useAccount();
  const [agentAddr, setAgentAddr] = useState("");
  const [maxPerTx, setMaxPerTx] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: nextScheduledId } = useReadContract({
    address: PAYAGENT_ADDRESS,
    abi: PAYAGENT_ABI,
    functionName: "nextScheduledId",
  });

  const { data: nextGroupId } = useReadContract({
    address: PAYAGENT_ADDRESS,
    abi: PAYAGENT_ABI,
    functionName: "nextGroupId",
  });

  const handleAuthorize = () => {
    writeContract({
      address: PAYAGENT_ADDRESS,
      abi: PAYAGENT_ABI,
      functionName: "authorizeAgent",
      args: [agentAddr as `0x${string}`, parseEther(maxPerTx)],
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🤖 AI Agent</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 font-semibold">Contract Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Contract</span>
              <span className="font-mono text-xs text-green-400">{PAYAGENT_ADDRESS.slice(0, 14)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Scheduled Payments</span>
              <span>{nextScheduledId?.toString() ?? "0"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Expense Groups</span>
              <span>{nextGroupId?.toString() ?? "0"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-yellow-400">Celo Sepolia</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 font-semibold">Authorize Agent</h3>
          <p className="mb-4 text-sm text-gray-400">
            Authorize an AI agent to execute payments on your behalf with a spending cap.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Agent address (0x...)"
              value={agentAddr}
              onChange={(e) => setAgentAddr(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Max cUSD per transaction"
              value={maxPerTx}
              onChange={(e) => setMaxPerTx(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
            <button
              onClick={handleAuthorize}
              disabled={!isConnected || isPending || isConfirming}
              className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-gray-950 disabled:opacity-50"
            >
              {isPending ? "Confirming..." : isConfirming ? "Waiting..." : "Authorize Agent"}
            </button>
            {isSuccess && <p className="text-green-400 text-sm">✅ Agent authorized! TX: {hash?.slice(0, 16)}...</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
