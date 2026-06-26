"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Database,
  TrendingUp,
  Rocket,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Zap,
  Activity,
  Cpu,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ArrowUpRight,
  Brain,
  FileText,
  Play,
  Pause,
  X,
  User,
  LogOut,
  Moon,
  HelpCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const trainingData = Array.from({ length: 24 }, (_, i) => ({
  step: (i + 1) * 100,
  loss: Math.max(0.1, 2.4 * Math.exp(-i * 0.18) + (Math.random() - 0.5) * 0.05),
  valLoss: Math.max(0.15, 2.6 * Math.exp(-i * 0.16) + (Math.random() - 0.5) * 0.08),
}));

const accuracyData = Array.from({ length: 12 }, (_, i) => ({
  epoch: i + 1,
  accuracy: Math.min(97, 60 + i * 3.5 + (Math.random() - 0.5) * 2),
  baseline: 65,
}));

const gpuData = Array.from({ length: 20 }, (_, i) => ({
  time: `${i}m`,
  utilization: 70 + Math.random() * 25,
  memory: 60 + Math.random() * 30,
}));

const projects = [
  {
    id: 1,
    name: "Clinical Notes Classifier",
    model: "Phi-3 Mini",
    status: "training",
    progress: 67,
    dataset: "12,453 examples",
    accuracy: 94.2,
    created: "2 hours ago",
    color: "from-violet-500/20 to-violet-600/10",
    border: "border-violet-500/30",
    dot: "bg-violet-400",
  },
  {
    id: 2,
    name: "Legal Contract Reviewer",
    model: "Gemma 2 2B",
    status: "completed",
    progress: 100,
    dataset: "8,200 examples",
    accuracy: 96.8,
    created: "1 day ago",
    color: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  {
    id: 3,
    name: "Tech Support Bot",
    model: "Llama 3.2 3B",
    status: "queued",
    progress: 0,
    dataset: "34,100 examples",
    accuracy: null,
    created: "30 min ago",
    color: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  {
    id: 4,
    name: "Financial Analyst",
    model: "Mistral 7B",
    status: "failed",
    progress: 23,
    dataset: "5,600 examples",
    accuracy: null,
    created: "3 days ago",
    color: "from-rose-500/20 to-rose-600/10",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: FolderOpen, label: "Projects", id: "projects", badge: "4" },
  { icon: Database, label: "Datasets", id: "datasets" },
  { icon: TrendingUp, label: "Training Jobs", id: "jobs" },
  { icon: BarChart3, label: "Evaluation", id: "eval" },
  { icon: Rocket, label: "Deploy", id: "deploy" },
];

const statusConfig = {
  training: { label: "Training", color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30", icon: Activity },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30", icon: CheckCircle2 },
  queued: { label: "Queued", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30", icon: Clock },
  failed: { label: "Failed", color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30", icon: AlertCircle },
};

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  color,
  gradient,
}: {
  icon: any;
  label: string;
  value: string;
  change: string;
  color: string;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass border border-white/[0.06] rounded-2xl p-6 card-hover group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 ${color.includes("emerald") ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
          <ArrowUpRight size={11} />
          {change}
        </span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass border border-white/[0.08] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-medium">{Number(p.value).toFixed(3)}</span>
          <span className="text-slate-500">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B1120] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-64 flex-shrink-0 glass border-r border-white/[0.06] flex flex-col"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold gradient-text">SLM Forge</span>
              <p className="text-[10px] text-slate-600">Pro Plan</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeNav === item.id
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={17} />
                {item.label}
              </div>
              {item.badge && (
                <span className="bg-violet-500/20 text-violet-400 text-xs px-1.5 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* GPU Usage */}
        <div className="m-4 glass border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Cpu size={12} />
              GPU Usage
            </span>
            <span className="text-xs text-violet-400 font-semibold">78%</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "78%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-600 mt-2">RTX 4090 · 1 job active</p>
        </div>

        {/* Settings */}
        <div className="p-4 border-t border-white/[0.06]">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-all">
            <Settings size={17} />
            Settings
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="glass border-b border-white/[0.06] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-bold text-white">Dashboard</h1>
              <p className="text-xs text-slate-500">Welcome back, Dr. Chen 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 glass border border-white/[0.06] rounded-xl px-3 py-2 w-56">
              <Search size={15} className="text-slate-500" />
              <input
                placeholder="Search projects..."
                className="bg-transparent text-sm text-white placeholder:text-slate-600 outline-none w-full"
              />
            </div>

            {/* New Project */}
            <button className="btn-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
              <Plus size={15} />
              New Project
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative w-9 h-9 glass border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <Bell size={17} />
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 border border-[#0B1120]" />
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-72 glass border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <button onClick={() => setNotifOpen(false)}><X size={15} className="text-slate-500" /></button>
                    </div>
                    {[
                      { icon: "✅", text: "Legal Contract Reviewer training complete", time: "2m ago" },
                      { icon: "⚡", text: "Clinical Notes Classifier at 67% progress", time: "15m ago" },
                      { icon: "📦", text: "GGUF export ready for download", time: "1h ago" },
                    ].map((n, i) => (
                      <div key={i} className="px-4 py-3 hover:bg-white/[0.03] border-b border-white/[0.04] cursor-pointer transition-colors">
                        <div className="flex gap-3">
                          <span className="text-lg mt-0.5">{n.icon}</span>
                          <div>
                            <p className="text-xs text-slate-200 leading-relaxed">{n.text}</p>
                            <p className="text-xs text-slate-600 mt-1">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer shadow-md shadow-violet-500/20"
              >
                SC
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 w-52 glass border border-white/[0.08] rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-sm font-semibold text-white">Dr. Sarah Chen</p>
                      <p className="text-xs text-slate-500">dr.chen@hospital.org</p>
                    </div>
                    {[
                      { icon: User, label: "Profile" },
                      { icon: Settings, label: "Settings" },
                      { icon: HelpCircle, label: "Help & Docs" },
                    ].map((item) => (
                      <button key={item.label} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
                        <item.icon size={15} />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-white/[0.06]">
                      <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-all">
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Brain} label="Total Models Trained" value="12" change="+3 this week" color="emerald" gradient="from-violet-500 to-violet-700" />
            <StatCard icon={Activity} label="Active Training Jobs" value="1" change="In progress" color="amber" gradient="from-cyan-500 to-cyan-700" />
            <StatCard icon={Download} label="Models Exported" value="9" change="+2 this week" color="emerald" gradient="from-emerald-500 to-emerald-700" />
            <StatCard icon={Cpu} label="GPU Hours Used" value="47.2h" change="This month" color="emerald" gradient="from-amber-500 to-amber-700" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Training Loss */}
            <div className="lg:col-span-2 glass border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Training Loss Curve</h3>
                  <p className="text-xs text-slate-500">Clinical Notes Classifier · Step 2400/3600</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Live
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trainingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="step" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 3]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="loss" stroke="#8b5cf6" strokeWidth={2} dot={false} name="train_loss" />
                  <Line type="monotone" dataKey="valLoss" stroke="#22d3ee" strokeWidth={2} dot={false} strokeDasharray="5 5" name="val_loss" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-3 h-0.5 bg-violet-500 rounded" />
                  Train Loss
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="w-3 h-0.5 bg-cyan-400 rounded border-dashed" style={{ borderTop: "2px dashed" }} />
                  Val Loss
                </div>
              </div>
            </div>

            {/* GPU Usage */}
            <div className="glass border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-white">GPU Utilization</h3>
                  <p className="text-xs text-slate-500">Last 20 minutes</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={gpuData}>
                  <defs>
                    <linearGradient id="gpuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="utilization" stroke="#8b5cf6" fill="url(#gpuGrad)" strokeWidth={2} name="GPU %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projects table */}
          <div className="glass border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">Recent Projects</h3>
              <button className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {projects.map((proj, i) => {
                const status = statusConfig[proj.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;
                return (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Project indicator */}
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${proj.dot}`} />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate">
                        {proj.name}
                      </p>
                      <p className="text-xs text-slate-500">{proj.model} · {proj.dataset}</p>
                    </div>

                    {/* Status */}
                    <span className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${status.bg} ${status.color} flex-shrink-0`}>
                      <StatusIcon size={11} />
                      {status.label}
                    </span>

                    {/* Progress bar */}
                    <div className="hidden lg:block w-28">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500">{proj.progress}%</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            proj.status === "completed" ? "from-emerald-500 to-emerald-400" :
                            proj.status === "failed" ? "from-rose-500 to-rose-400" :
                            "from-violet-500 to-cyan-500"
                          }`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Accuracy */}
                    <div className="hidden xl:block text-right w-16">
                      {proj.accuracy ? (
                        <span className="text-sm font-semibold text-emerald-400">{proj.accuracy}%</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                      <p className="text-[10px] text-slate-600">accuracy</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {proj.status === "training" ? (
                        <button className="p-1.5 glass border border-white/[0.08] rounded-lg text-slate-400 hover:text-amber-400 transition-colors">
                          <Pause size={13} />
                        </button>
                      ) : proj.status === "queued" ? (
                        <button className="p-1.5 glass border border-white/[0.08] rounded-lg text-slate-400 hover:text-violet-400 transition-colors">
                          <Play size={13} />
                        </button>
                      ) : null}
                      {proj.status === "completed" && (
                        <button className="p-1.5 glass border border-white/[0.08] rounded-lg text-slate-400 hover:text-emerald-400 transition-colors">
                          <Download size={13} />
                        </button>
                      )}
                      <button className="p-1.5 glass border border-white/[0.08] rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
            {/* Accuracy comparison */}
            <div className="glass border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Accuracy vs Baseline</h3>
              <p className="text-xs text-slate-500 mb-5">Fine-tuned vs base model performance</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={accuracyData.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="epoch" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: "Epoch", position: "insideBottom", fill: "#64748b", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Fine-tuned" />
                  <Bar dataKey="baseline" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name="Baseline" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick actions */}
            <div className="glass border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-1">Quick Actions</h3>
              <p className="text-xs text-slate-500 mb-5">Jump right in</p>
              <div className="space-y-3">
                {[
                  { icon: Plus, label: "New Fine-Tuning Project", sub: "Upload data and start training", color: "from-violet-500 to-purple-600" },
                  { icon: FileText, label: "Upload Dataset", sub: "CSV, JSONL, PDF, or plain text", color: "from-cyan-500 to-blue-600" },
                  { icon: BarChart3, label: "Run A/B Evaluation", sub: "Compare models side by side", color: "from-emerald-500 to-teal-600" },
                  { icon: Rocket, label: "Export to Ollama", sub: "Convert and register GGUF model", color: "from-amber-500 to-orange-600" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="w-full flex items-center gap-3 glass border border-white/[0.06] hover:border-white/20 rounded-xl p-3 text-left transition-all duration-200 group card-hover"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <action.icon size={17} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-xs text-slate-500 truncate">{action.sub}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
