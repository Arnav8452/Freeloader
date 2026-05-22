"use client";

import { Activity, ArrowUpRight, CheckCircle2, Zap, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface RoutingLog {
  id: string;
  provider: string;
  status: "success" | "failure";
  latencyMs: number;
  tokens: number;
  timestamp: string;
}

interface MetricsPayload {
  totalRequests: number;
  estimatedSavings: number;
  circuitBreakersOpen: number;
  circuitBreakersList: { provider: string; state: string }[];
  recentLogs: RoutingLog[];
  providerUsage: Record<string, number>;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("http://localhost:3000/v1/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const totalRequests = metrics?.totalRequests || 0;
  const estimatedSavings = metrics?.estimatedSavings || 0;
  const circuitBreakersOpen = metrics?.circuitBreakersOpen || 0;
  const recentLogs = metrics?.recentLogs || [];
  const providerUsage = metrics?.providerUsage || {};

  // Helper for colors
  const getColorForProvider = (provider: string) => {
    if (provider.toLowerCase().includes('gemini')) return 'bg-blue-500';
    if (provider.toLowerCase().includes('cerebras')) return 'bg-orange-500';
    if (provider.toLowerCase().includes('groq')) return 'bg-rose-500';
    return 'bg-brand-500';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative z-10">
      
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-[Outfit] text-white tracking-tight">Overview</h1>
          <p className="text-zinc-400 mt-1">Monitor your AI gateway routing and free-tier savings.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
          </span>
          <span className="text-sm font-medium text-brand-500">Live Traffic</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Requests</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">{totalRequests.toLocaleString()}</h2>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Estimated Savings</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">${estimatedSavings.toFixed(2)}</h2>
              <p className="text-sm text-purple-400 flex items-center gap-1 mt-2 font-medium">
                Compared to GPT-4o
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-zinc-400">Circuit Breakers</p>
              <h2 className="text-4xl font-bold font-[Outfit] text-white mt-2">{circuitBreakersOpen} Open</h2>
              {circuitBreakersOpen > 0 && (
                <p className="text-sm text-rose-400 flex items-center gap-1 mt-2 font-medium truncate max-w-[150px]">
                  {metrics?.circuitBreakersList.map(b => b.provider).join(', ')} Offline
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Routing Events */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white font-[Outfit] mb-4">Recent Routing Log</h3>
          
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
               <p className="text-sm text-zinc-500 italic">No recent requests...</p>
            ) : recentLogs.map((log) => {
              const date = new Date(log.timestamp);
              return (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-card-border/20 border border-card-border/50 hover:bg-card-border/40 transition-colors">
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{log.provider}</p>
                      <p className="text-xs text-zinc-500">{date.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-300">{log.latencyMs}ms</p>
                    <p className="text-xs text-zinc-500">{log.tokens} tokens</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Provider Distribution */}
        <div className="glass-panel rounded-2xl p-6 h-fit">
           <h3 className="text-lg font-semibold text-white font-[Outfit] mb-4">Provider Usage</h3>
           
           <div className="space-y-4 mt-6">
             {Object.entries(providerUsage).length === 0 ? (
                <p className="text-sm text-zinc-500 italic">Awaiting traffic...</p>
             ) : Object.entries(providerUsage).map(([provider, percentage]) => (
               <div key={provider}>
                 <div className="flex justify-between text-sm mb-1.5">
                   <span className="text-zinc-300">{provider}</span>
                   <span className="text-zinc-400 font-medium">{percentage}%</span>
                 </div>
                 <div className="h-2 w-full bg-card-border rounded-full overflow-hidden">
                   <div className={`h-full ${getColorForProvider(provider)} rounded-full transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
