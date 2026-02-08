import Link from "next/link";

const features = [
  {
    icon: "✂️",
    title: "Smart Splits",
    desc: "Create reusable payment split configs. Your AI agent distributes funds to multiple recipients in one tx.",
  },
  {
    icon: "🔄",
    title: "Scheduled Payments",
    desc: "Set up recurring payments — rent, subscriptions, salaries. AI agents execute them automatically when due.",
  },
  {
    icon: "👥",
    title: "Group Expenses",
    desc: "Track shared expenses with friends or teams. The agent calculates balances and settles debts in cUSD.",
  },
  {
    icon: "🤖",
    title: "Agent Authorization",
    desc: "Delegate payment execution to AI agents with spending caps. Stay in control while automating everything.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-gray-950 to-yellow-900/20" />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400">
            <span>🤖</span> Built for Celo &quot;Build Agents for the Real World&quot; Hackathon
          </div>
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-green-400 via-yellow-300 to-green-400 bg-clip-text text-transparent">
              CeloPayAgent
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            The first AI-powered payment agent on Celo. Split payments, schedule recurring
            transfers, and manage group expenses — all autonomously with stablecoins.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/app"
              className="rounded-lg bg-green-500 px-8 py-3 font-semibold text-gray-950 transition hover:bg-green-400"
            >
              Launch App
            </Link>
            <a
              href="https://github.com/bigguybobby/celo-pay-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-700 px-8 py-3 font-semibold text-gray-300 transition hover:border-gray-500"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 transition hover:border-green-500/40"
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-xl font-semibold">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-8 text-center text-3xl font-bold">Architecture</h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8">
          <div className="grid gap-4 text-center md:grid-cols-3">
            <div className="rounded-lg border border-gray-700 p-4">
              <div className="mb-2 text-2xl">👤</div>
              <h4 className="font-semibold">User</h4>
              <p className="text-sm text-gray-400">Creates splits, schedules, groups. Authorizes agent with spending cap.</p>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
              <div className="mb-2 text-2xl">🤖</div>
              <h4 className="font-semibold text-green-400">AI Agent</h4>
              <p className="text-sm text-gray-400">Monitors due payments, calculates settlements, executes transactions autonomously.</p>
            </div>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="mb-2 text-2xl">⛓️</div>
              <h4 className="font-semibold text-yellow-400">Celo L2</h4>
              <p className="text-sm text-gray-400">Sub-cent fees, fast finality, stablecoin-native. cUSD, cEUR, cREAL.</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-gray-500">
            <span>User → authorizes → Agent → executes → Celo (cUSD transfers)</span>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-8 text-center text-3xl font-bold">Tech Stack</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {["Celo L2", "Solidity", "Foundry", "Next.js", "TypeScript", "Tailwind CSS", "wagmi/viem"].map((t) => (
            <span key={t} className="rounded-full border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        Built by{" "}
        <a href="https://github.com/bigguybobby" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">
          bigguybobby
        </a>{" "}
        for the Celo &quot;Build Agents for the Real World&quot; Hackathon 2026
      </footer>
    </main>
  );
}
