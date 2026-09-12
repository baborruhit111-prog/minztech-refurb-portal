import React from "react";
import { 
  Laptop, 
  Users, 
  Calendar, 
  CheckSquare, 
  Send, 
  Warehouse, 
  ShieldCheck, 
  ArrowUpRight, 
  MessageCircle, 
  Share2, 
  Globe2,
  PackageCheck
} from "lucide-react";
import { getCustomers, getStockOffers, getSocialPosts, getTasks } from "../services/storage";

export default function Dashboard({ setActiveTab }) {
  const customers = getCustomers();
  const stockOffers = getStockOffers();
  const posts = getSocialPosts();
  const tasks = getTasks();

  const warmCustomers = customers.filter(c => c.type === "warm");
  const coldCustomers = customers.filter(c => c.type === "cold");
  const pendingTasks = tasks.filter(t => t.status !== "Completed");
  const usaPosts = posts.filter(p => p.market === "USA" || p.market === "Both");
  const latamPosts = posts.filter(p => p.market === "LATAM" || p.market === "Both");

  const totalStockUnits = stockOffers.reduce((acc, curr) => acc + Number(curr.qtyAvailable || 0), 0);
  const usaStock = stockOffers.filter(s => s.warehouse?.toLowerCase().includes("usa") || s.warehouse?.toLowerCase().includes("texas")).reduce((acc, c) => acc + Number(c.qtyAvailable || 0), 0);
  const mexStock = stockOffers.filter(s => s.warehouse?.toLowerCase().includes("mexico") || s.warehouse?.toLowerCase().includes("guadalajara")).reduce((acc, c) => acc + Number(c.qtyAvailable || 0), 0);
  const uaeStock = stockOffers.filter(s => s.warehouse?.toLowerCase().includes("dubai") || s.warehouse?.toLowerCase().includes("uae")).reduce((acc, c) => acc + Number(c.qtyAvailable || 0), 0);
  const miamiStock = stockOffers.filter(s => s.warehouse?.toLowerCase().includes("miami") || s.warehouse?.toLowerCase().includes("florida")).reduce((acc, c) => acc + Number(c.qtyAvailable || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Refurbisher Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-surface via-brand-dark to-brand-surface border border-brand-border p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-neon/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-neon/20 border border-brand-neon/40 text-brand-neon text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Microsoft Authorized Refurbisher Partner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Laptop Operations Hub
            </h1>
            <p className="text-sm text-gray-300 leading-relaxed">
              Managing wholesale distribution for HP, Dell & Lenovo A+ certified business laptops. Real-time outreach tracking for USA and the new Mexico warehouse distribution network.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-1">
              <span className="text-brand-lime font-medium">Texas USA HQ</span>
              <span>•</span>
              <span className="text-brand-lime font-medium">Guadalajara Mexico Warehouse</span>
              <span>•</span>
              <span className="text-brand-lime font-medium">Dubai Warehouse (UAE)</span>
              <span>•</span>
              <span className="text-brand-lime font-medium">Miami Warehouse (FL)</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("customers")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-neon text-brand-black font-bold text-xs sm:text-sm rounded-xl hover:bg-brand-lime transition-all shadow-md active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Send Stock Offers</span>
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-surface hover:bg-brand-hover text-white border border-brand-border text-xs sm:text-sm rounded-xl transition-all shadow-sm"
            >
              <Share2 className="w-4 h-4 text-brand-lime" />
              <span>Plan Social Content</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Balanced responsive layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
        {/* Available Stock Ready to Ship */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm hover:border-brand-neon/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Inventory Ready to Ship</span>
            <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon">
              <Warehouse className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{totalStockUnits.toLocaleString()} <span className="text-sm font-normal text-gray-400">units</span></div>
            <p className="text-xs text-gray-400 mt-1">
              HP, Dell, Lenovo & Custom Stock Lots
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-brand-dark text-gray-300 font-mono">USA: {usaStock}</span>
              <span className="px-2 py-0.5 rounded bg-brand-dark text-gray-300 font-mono">Mexico: {mexStock}</span>
              <span className="px-2 py-0.5 rounded bg-brand-dark text-gray-300 font-mono">Dubai: {uaeStock}</span>
              <span className="px-2 py-0.5 rounded bg-brand-dark text-gray-300 font-mono">Miami: {miamiStock}</span>
            </div>
          </div>
        </div>

        {/* Customer Outreach & Pipeline */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm hover:border-brand-neon/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Customer Contacts</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{customers.length} <span className="text-sm font-normal text-gray-400">Accounts</span></div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-brand-neon font-semibold">{warmCustomers.length} Warm Prospects</span>
              <span className="text-gray-400">{coldCustomers.length} Cold Prospects</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">1-Click WhatsApp & Email Outreach Ready</p>
          </div>
        </div>

        {/* Daily Tasks & Social Status */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm hover:border-brand-neon/40 transition-colors sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Daily Tasks & Socials</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">{pendingTasks.length} <span className="text-sm font-normal text-gray-400">Pending Tasks</span></div>
            <div className="flex items-center justify-between text-xs mt-2 text-gray-300">
              <span>USA: {usaPosts.length} posts</span>
              <span className="text-brand-lime">Mexico: {latamPosts.length} posts</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Facebook • Instagram • TikTok</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Dual-Market Overview & Top Stock Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
        {/* Left Cols: Dual-Market Highlights */}
        <div className="lg:col-span-2 2xl:col-span-3 bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe2 className="w-5 h-5 text-brand-neon" />
              <h2 className="text-base font-bold text-white">Dual-Market Operations Breakdown</h2>
            </div>
            <span className="text-xs text-gray-400">USA HQ & Mexico Warehouse</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* USA Card */}
            <div className="bg-brand-dark/80 border border-brand-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🇺🇸 USA Domestic Wholesale</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">B2B Core</span>
              </div>
              <p className="text-xs text-gray-400">
                Supplying enterprise buyers, schools, and IT brokers across the United States. Fast pallet LTL shipping from Texas.
              </p>
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Active Stock Lots:</span>
                  <span className="font-semibold text-white">3 High-Volume Batches</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Social Strategy:</span>
                  <span className="text-brand-lime">B2B wholesale, durability testing</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Top Brands:</span>
                  <span className="text-white">Dell Latitude & HP EliteBook</span>
                </div>
              </div>
            </div>

            {/* LATAM / Mexico Card */}
            <div className="bg-brand-dark/80 border border-brand-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🇲🇽 LATAM & Mexico Warehouse</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-neon/20 text-brand-neon font-mono">New Warehouse</span>
              </div>
              <p className="text-xs text-gray-400">
                Direct distribution in Mexico without customs delay. Local delivery, MXN currency quotes, and Mexican Factura available.
              </p>
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-gray-300">
                  <span>Warehouse Location:</span>
                  <span className="font-semibold text-white">Guadalajara / CDMX Hub</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Social Strategy:</span>
                  <span className="text-brand-neon">Spanish TikTok & WhatsApp Direct</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Featured Lot:</span>
                  <span className="text-white">Lenovo ThinkPad T14 Gen 2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links to CRM action */}
          <div className="p-4 rounded-xl bg-brand-black/60 border border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-neon/20 text-brand-neon">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">WhatsApp & Email Outreach Engine</h4>
                <p className="text-xs text-gray-400">Send pre-formatted stock sheets in English or Spanish with one click.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("customers")}
              className="px-3.5 py-2 bg-brand-surface hover:bg-brand-neon hover:text-brand-black text-brand-neon font-semibold text-xs rounded-xl border border-brand-neon/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Open Customer Lists</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Urgent Tasks & Alerts */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-brand-neon" />
              <span>Today's Critical Tasks</span>
            </h3>
            <button 
              onClick={() => setActiveTab("tasks")} 
              className="text-xs text-brand-lime hover:text-brand-neon"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div 
                key={task.id} 
                className="p-3 rounded-xl bg-brand-dark/70 border border-brand-border text-xs space-y-1 hover:border-brand-neon/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    task.priority === "Urgent" 
                      ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                      : task.priority === "High" 
                      ? "bg-amber-500/20 text-amber-300" 
                      : "bg-blue-500/20 text-blue-300"
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-[10px] text-gray-400">{task.dueDate}</span>
                </div>
                <h4 className="font-semibold text-gray-100 line-clamp-1">{task.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Assigned: <strong className="text-gray-200">{task.assignedName}</strong></span>
                  <span className={`font-medium ${task.status === "Completed" ? "text-brand-neon" : "text-amber-400"}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setActiveTab("tasks")}
            className="w-full py-2.5 bg-brand-dark hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border rounded-xl text-xs font-semibold transition-colors text-center block"
          >
            Manage Member Tasks & Progress →
          </button>
        </div>
      </div>
    </div>
  );
}
