import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  growth: number; // e.g. 2 for +2%, -1 for -1%
  icon: React.FC<{ className?: string }>;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  growth,
  icon: Icon,
}) => {
  const isPositive = growth >= 0;

  return (
    <div className="p-5 bg-[#131b2e] border border-slate-800/80 rounded-2xl hover:border-slate-700/80 transition-all duration-200 group relative overflow-hidden shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 bg-slate-800/80 border border-slate-700/60 rounded-xl text-slate-300 group-hover:text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
          <Icon className="w-5 h-5" />
        </div>

        {/* Growth Badge */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? `+${growth}%` : `${growth}%`}</span>
        </div>
      </div>

      {/* Title Label */}
      <p className="text-xs font-semibold text-slate-400 mb-1">{title}</p>

      {/* Main Metric Value */}
      <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">{value}</h3>
    </div>
  );
};
