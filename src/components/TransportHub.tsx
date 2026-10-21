import React, { useState } from 'react';
import { Train, Search, ArrowRight, ShieldCheck, AlertCircle, Compass, Anchor } from 'lucide-react';
import { TransitStop, TransitRoute, TransportMode } from '../types';
import { STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';
import { StopDetailModal } from './StopDetailModal';
import { getStatusBadgeConfig } from '../services/reliabilityService';

interface TransportHubProps {
  onShowOnMap?: (stopId: string) => void;
  onSelectAttraction?: (attractionId: string) => void;
}

export const TransportHub: React.FC<TransportHubProps> = ({
  onShowOnMap,
  onSelectAttraction,
}) => {
  const [searchStop, setSearchStop] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [inspectStop, setInspectStop] = useState<TransitStop | null>(null);

  const filteredStops = STOCKHOLM_STOPS.filter(stop => {
    if (selectedMode !== 'all' && !stop.modes.includes(selectedMode as TransportMode)) {
      return false;
    }
    if (searchStop.trim()) {
      const q = searchStop.toLowerCase();
      const matchName = stop.name.toLowerCase().includes(q);
      const matchLines = stop.linesServed.some(l => l.toLowerCase().includes(q));
      const matchDistrict = stop.district.toLowerCase().includes(q);
      if (!matchName && !matchLines && !matchDistrict) return false;
    }
    return true;
  });

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            SL Public Transport Network · Stockholm Läns Trafik
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            Transport Routes & Hubs
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-[#F0F7F3] border border-[#315C45] px-3 py-1.5 text-xs font-mono text-[#315C45]">
          <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>System Health: 95.1% On-Time Operating Standard</span>
        </div>
      </div>

      {/* Network Lines Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-[#111111]">
            Primary SL Corridors
          </h3>
          <span className="text-xs font-mono text-[#666666]">
            {STOCKHOLM_ROUTES.length} Key Lines Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STOCKHOLM_ROUTES.map((route) => {
            const statusBadge = getStatusBadgeConfig(route.status);
            return (
              <div 
                key={route.id}
                className="border border-[#D9D9D4] hover:border-[#111111] bg-[#FFFFFF] p-5 flex flex-col justify-between transition-colors space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider"
                      style={{ backgroundColor: route.color, color: route.textColor }}
                    >
                      {route.lineCode}
                    </span>
                    <span 
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border"
                      style={{
                        backgroundColor: statusBadge.badgeBg,
                        color: statusBadge.textColor,
                        borderColor: statusBadge.borderColor,
                      }}
                    >
                      {route.onTimeRatePercent}% On-Time
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-base text-[#111111]">
                    {route.name}
                  </h4>

                  <p className="text-xs text-[#666666] leading-relaxed">
                    {route.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D9D9D4] space-y-2 text-[11px] font-mono text-[#666666]">
                  <div className="flex justify-between">
                    <span>Peak Frequency:</span>
                    <span className="text-[#111111] font-semibold">Every {route.frequencyMinutesPeak} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Delay:</span>
                    <span className="text-[#111111] font-semibold">{route.avgDelayMinutes} min</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transit Stops Explorer */}
      <div className="space-y-6 pt-6 border-t border-[#D9D9D4]">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h3 className="text-2xl font-display font-bold text-[#111111]">
              Transit Stops Directory
            </h3>
            <p className="text-xs text-[#666666] font-mono pt-1">
              Inspect any SL stop to examine connected lines, punctuality ratings, and nearby tourist sights.
            </p>
          </div>

          {/* Mode Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'metro', label: 'Metro (T-Bana)' },
              { id: 'tram', label: 'Spårvagn Tram' },
              { id: 'ferry', label: 'Water Ferry' },
              { id: 'commuter_train', label: 'Pendeltåg' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`px-3 py-1.5 text-xs font-mono whitespace-nowrap uppercase border transition-colors ${
                  selectedMode === m.id
                    ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]'
                    : 'bg-[#FFFFFF] text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search stop */}
        <div className="flex items-center bg-[#FFFFFF] border-2 border-[#111111] px-4 py-2.5">
          <Search className="w-4 h-4 text-[#666666] mr-3" strokeWidth={1.5} />
          <input
            type="text"
            value={searchStop}
            onChange={(e) => setSearchStop(e.target.value)}
            placeholder="Search stops by name (e.g. 'T-Centralen', 'Gamla Stan', 'Djurgården')..."
            className="w-full bg-transparent text-sm text-[#111111] outline-none"
          />
          {searchStop && (
            <button onClick={() => setSearchStop('')} className="text-xs font-mono text-[#666666] hover:text-[#111111]">
              Clear
            </button>
          )}
        </div>

        {/* Stops Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStops.map((stop) => {
            const statusBadge = getStatusBadgeConfig(stop.status);
            return (
              <div 
                key={stop.id}
                className="border border-[#D9D9D4] hover:border-[#111111] bg-[#FFFFFF] p-5 flex flex-col justify-between transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">
                      {stop.district}
                    </span>
                    <span 
                      className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border"
                      style={{
                        backgroundColor: statusBadge.badgeBg,
                        color: statusBadge.textColor,
                        borderColor: statusBadge.borderColor,
                      }}
                    >
                      {stop.onTimeRatePercent}% On-Time
                    </span>
                  </div>

                  <h4 className="text-xl font-display font-bold text-[#111111]">
                    {stop.name}
                  </h4>

                  <p className="text-xs text-[#666666] line-clamp-2">
                    {stop.description}
                  </p>

                  {/* Connected Lines Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {stop.linesServed.map((line, idx) => (
                      <span key={idx} className="text-[10px] font-mono bg-[#F5F5F2] border border-[#D9D9D4] px-2 py-0.5 text-[#111111]">
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D9D9D4] mt-4 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-[#666666]">
                    Avg delay: <strong className="text-[#111111]">{stop.avgDelayMinutes} min</strong>
                  </div>
                  <button
                    onClick={() => setInspectStop(stop)}
                    className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>Inspect Stop</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Stop Detail Inspector Modal */}
      {inspectStop && (
        <StopDetailModal
          stop={inspectStop}
          onClose={() => setInspectStop(null)}
          onShowOnMap={onShowOnMap}
          onSelectAttraction={onSelectAttraction}
        />
      )}

    </section>
  );
};
