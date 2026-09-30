import React, { useState } from 'react';
import { BarChart3, Clock, AlertTriangle, ShieldCheck, Filter, ArrowUpRight } from 'lucide-react';
import { 
  getSystemReliabilitySummary, 
  getHourlyDelayData, 
  getRoutePerformanceData, 
  getStatusBadgeConfig 
} from '../services/reliabilityService';
import { STOCKHOLM_STOPS } from '../data/stockholmData';

export const ReliabilityDashboard: React.FC = () => {
  const summary = getSystemReliabilitySummary();
  const hourlyData = getHourlyDelayData();
  const routeData = getRoutePerformanceData();

  const [activeRouteFilter, setActiveRouteFilter] = useState<string>('all');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // SVG Chart calculation: dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const maxDelay = 4.5; // minutes scale

  // Compute points
  const points = hourlyData.map((d, index) => {
    const x = paddingX + (index / (hourlyData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.avgDelayMinutes / maxDelay) * (chartHeight - 2 * paddingY);
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Fill area path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  const filteredRoutes = routeData.filter(r => {
    if (activeRouteFilter === 'all') return true;
    return r.mode === activeRouteFilter;
  });

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            Historical Transport Analytics · SL Quality Metrics
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            Delay & Reliability Analysis
          </h2>
        </div>
        <div className="text-xs font-mono text-[#666666]">
          Aggregate 180-Day Sensor & Timetable Records
        </div>
      </div>

      {/* 4 Large Editorial Numerical KPI Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="border border-[#111111] bg-[#FFFFFF] p-6 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
            System Average Delay
          </span>
          <div className="text-4xl font-mono font-bold text-[#111111]">
            {summary.avgDelayMinutes} <span className="text-sm font-sans font-normal text-[#666666]">min</span>
          </div>
          <div className="text-xs text-[#315C45] font-mono pt-1">
            ● Below European urban threshold (&lt;3.0m)
          </div>
        </div>

        <div className="border border-[#111111] bg-[#FFFFFF] p-6 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
            Network On-Time Rate
          </span>
          <div className="text-4xl font-mono font-bold text-[#1E4D6B]">
            {summary.overallOnTimeRate}%
          </div>
          <div className="text-xs text-[#666666] font-mono pt-1">
            Departures within 3 min of timetable
          </div>
        </div>

        <div className="border border-[#111111] bg-[#FFFFFF] p-6 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
            Monitored Services
          </span>
          <div className="text-4xl font-mono font-bold text-[#111111]">
            {summary.totalServicesMonitored.toLocaleString()}
          </div>
          <div className="text-xs text-[#666666] font-mono pt-1">
            Tracked across metro, tram, ferry
          </div>
        </div>

        <div className="border border-[#111111] bg-[#FFFFFF] p-6 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
            Top Performing Route
          </span>
          <div className="text-2xl font-mono font-bold text-[#315C45] truncate">
            {summary.bestPerformingRoute}
          </div>
          <div className="text-xs text-[#666666] font-mono pt-1">
            Ferry & Tram routes lead punctuality
          </div>
        </div>
      </div>

      {/* Analytical Visual Chart: DELAY BY HOUR */}
      <div className="border-2 border-[#111111] bg-[#FFFFFF] p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111111] pb-4">
          <div>
            <h3 className="font-display font-bold text-xl sm:text-2xl text-[#111111]">
              Average SL Delay By Hour of Day
            </h3>
            <p className="text-xs font-mono text-[#666666] pt-0.5">
              Hourly pattern highlights rush-hour bottleneck curves at 08:00 and 17:00.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-[#666666]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#1E4D6B]" />
              <span>Delay (Minutes)</span>
            </span>
          </div>
        </div>

        {/* Minimalist SVG Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[640px] relative">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Background horizontal grid lines */}
              {[1, 2, 3, 4].map(val => {
                const yPos = chartHeight - paddingY - (val / maxDelay) * (chartHeight - 2 * paddingY);
                return (
                  <g key={val}>
                    <line 
                      x1={paddingX} 
                      y1={yPos} 
                      x2={chartWidth - paddingX} 
                      y2={yPos} 
                      stroke="#EBEBE6" 
                      strokeWidth="1" 
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={paddingX - 10} 
                      y={yPos + 4} 
                      textAnchor="end" 
                      className="fill-[#666666] text-[10px] font-mono"
                    >
                      {val}m
                    </text>
                  </g>
                );
              })}

              {/* Baseline axis */}
              <line 
                x1={paddingX} 
                y1={chartHeight - paddingY} 
                x2={chartWidth - paddingX} 
                y2={chartHeight - paddingY} 
                stroke="#111111" 
                strokeWidth="1.5" 
              />

              {/* Shaded Area under line */}
              <path 
                d={areaD} 
                fill="#E8F0F4" 
                opacity="0.6" 
              />

              {/* Main Trend Line in Nordic Blue */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="#1E4D6B" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Interactive Data Dots & X Labels */}
              {points.map((p, idx) => {
                const isHovered = hoveredHour === p.data.hour;
                return (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5 : 3}
                      fill={isHovered ? '#111111' : '#1E4D6B'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      onMouseEnter={() => setHoveredHour(p.data.hour)}
                      onMouseLeave={() => setHoveredHour(null)}
                    />
                    {idx % 2 === 0 && (
                      <text
                        x={p.x}
                        y={chartHeight - 10}
                        textAnchor="middle"
                        className="fill-[#666666] text-[10px] font-mono"
                      >
                        {p.data.hourLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredHour !== null && (
              <div 
                className="absolute top-2 right-4 bg-[#FFFFFF] border border-[#111111] p-3 text-xs font-mono shadow-sm pointer-events-none"
              >
                {(() => {
                  const record = hourlyData.find(d => d.hour === hoveredHour);
                  if (!record) return null;
                  return (
                    <div>
                      <div className="font-bold text-[#111111]">{record.hourLabel} Departures</div>
                      <div className="text-[#1E4D6B]">Average Delay: {record.avgDelayMinutes} min</div>
                      <div className="text-[#666666]">Delayed Services: {record.delayedServicesRate}%</div>
                      <div className="text-[10px] text-[#666666]">Sample: {record.totalServices} trains/trams</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Editorial Route Performance Data Table */}
      <div className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-2xl text-[#111111]">
              Route Reliability Breakdown
            </h3>
            <p className="text-xs font-mono text-[#666666] pt-0.5">
              Comprehensive operational log across key tourist transit arteries.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'metro', label: 'Metro' },
              { id: 'tram', label: 'Tram' },
              { id: 'ferry', label: 'Ferry' },
              { id: 'commuter_train', label: 'Commuter' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveRouteFilter(m.id)}
                className={`px-3 py-1 text-xs font-mono uppercase border transition-colors ${
                  activeRouteFilter === m.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editorial Table */}
        <div className="overflow-x-auto border-2 border-[#111111] bg-[#FFFFFF]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#F5F5F2] border-b border-[#111111] text-[#666666] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-bold">Line Code</th>
                <th className="py-3.5 px-4 font-bold">Route Name</th>
                <th className="py-3.5 px-4 font-bold">Avg Delay</th>
                <th className="py-3.5 px-4 font-bold">Delay Rate</th>
                <th className="py-3.5 px-4 font-bold">Punctuality Score</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9D9D4]">
              {filteredRoutes.map((route) => {
                const badge = getStatusBadgeConfig(route.status);
                return (
                  <tr key={route.routeId} className="hover:bg-[#F5F5F2] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#111111]">
                      <span className="bg-[#111111] text-white px-2 py-0.5">
                        {route.lineCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-sm text-[#111111]">
                      {route.name}
                    </td>
                    <td className="py-3 px-4 text-[#111111]">
                      {route.avgDelayMinutes} min
                    </td>
                    <td className="py-3 px-4 text-[#666666]">
                      {route.delayRatePercent}%
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1E4D6B]">
                      {route.reliabilityScore}%
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2 py-0.5 text-[10px] font-bold border tracking-wider"
                        style={{
                          backgroundColor: badge.badgeBg,
                          color: badge.textColor,
                          borderColor: badge.borderColor,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </section>
  );
};
