"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "splits" | "scheduled" | "groups" | "agent";

export default function AppDashboard() {
  const [tab, setTab] = useState<Tab>("splits");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-green-400">Celo</span>PayAgent
          </Link>
          <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-green-400">
            Connect Wallet
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Tabs */}
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

        {/* Content */}
        {tab === "splits" && <SplitsPanel />}
        {tab === "scheduled" && <ScheduledPanel />}
        {tab === "groups" && <GroupsPanel />}
        {tab === "agent" && <AgentPanel />}
      </div>
    </div>
  );
}

function SplitsPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Splits</h2>
        <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-gray-950">
          + New Split
        </button>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-500">
        <p className="mb-2 text-4xl">✂️</p>
        <p>No splits yet. Create your first payment split to distribute funds automatically.</p>
        <p className="mt-2 text-sm text-gray-600">
          Example: 60% to treasury, 25% to team, 15% to community fund
        </p>
      </div>
    </div>
  );
}

function ScheduledPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Scheduled Payments</h2>
        <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-gray-950">
          + Schedule Payment
        </button>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-500">
        <p className="mb-2 text-4xl">🔄</p>
        <p>No scheduled payments. Set up recurring cUSD transfers.</p>
        <p className="mt-2 text-sm text-gray-600">
          AI agents will execute them automatically when they&apos;re due.
        </p>
      </div>
    </div>
  );
}

function GroupsPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Expense Groups</h2>
        <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-gray-950">
          + New Group
        </button>
      </div>
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center text-gray-500">
        <p className="mb-2 text-4xl">👥</p>
        <p>No groups yet. Create a group to track shared expenses with friends or teammates.</p>
        <p className="mt-2 text-sm text-gray-600">
          The AI agent calculates who owes what and settles in one click.
        </p>
      </div>
    </div>
  );
}

function AgentPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🤖 AI Agent</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 font-semibold">Agent Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className="flex items-center gap-2 text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pending Payments</span>
              <span>0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Executed</span>
              <span>0</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="mb-4 font-semibold">Authorization</h3>
          <p className="mb-4 text-sm text-gray-400">
            Authorize the AI agent to execute payments on your behalf with a spending cap.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Agent address (0x...)"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Max cUSD per transaction"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm"
            />
            <button className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-gray-950">
              Authorize Agent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
