import React from 'react';
import { X, Train, MapPin, Clock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { TransitStop, Attraction } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_ROUTES } from '../data/stockholmData';
import { getStatusBadgeConfig } from '../services/reliabilityService';

interface StopDetailModalProps {
  stop: TransitStop | null;
  onClose: () => void;
  onPlanFromHere: (stopId: string) => void;
  onSelectAttraction: (attractionId: string) => void;
}

export const StopDetailModal: React.FC<StopDetailModalProps> = ({
  stop,
  onClose,
  onPlanFromHere,
  onSelectAttraction,
}) => {
  if (!stop) return null;

  const nearbyAttractions = STOCKHOLM_ATTRACTIONS.filter(a => a.nearestStopId === stop.id);
  const statusBadge = getStatusBadgeConfig(stop.status);

  // Find routes passing through this stop
  const routesAtStop = STOCKHOLM_ROUTES.filter(r => r.stops.includes(stop.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-[2px]">
      <div 
        className="relative w-full max-w-2xl bg-[#FFFFFF] border-2 border-[#111111] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#FFFFFF] border-b border-[#111111] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">
              SL Public Transport Stop · {stop.district}
            </div>
            <h2 className="text-2xl font-display font-bold text-[#111111]">
              {stop.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          <p className="text-sm text-[#111111] leading-relaxed">
            {stop.description}
          </p>

          {/* Operational & Reliability Stats Panel */}
          <div className="border border-[#111111] bg-[#F5F5F2] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#666666]">
                Punctuality & Performance
              </span>
              <span 
                className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase border"
                style={{
                  backgroundColor: statusBadge.badgeBg,
                  color: statusBadge.textColor,
                  borderColor: statusBadge.borderColor,
                }}
              >
                {statusBadge.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div>
                <div className="text-xl font-bold text-[#315C45]">{stop.onTimeRatePercent}%</div>
                <div className="text-[10px] uppercase text-[#666666]">On-Time Rate</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#111111]">{stop.avgDelayMinutes} min</div>
                <div className="text-[10px] uppercase text-[#666666]">Avg Delay</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#1E4D6B]">{stop.dailyDepartures.toLocaleString()}</div>
                <div className="text-[10px] uppercase text-[#666666]">Daily Services</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#111111]">{stop.linesServed.length}</div>
                <div className="text-[10px] uppercase text-[#666666]">Lines Connected</div>
              </div>
            </div>
          </div>

          {/* Connected Routes & Lines */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#666666] border-b border-[#D9D9D4] pb-1">
              Connected Transit Lines
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {routesAtStop.map((route) => (
                <div key={route.id} className="border border-[#D9D9D4] p-3 flex items-start gap-3 bg-[#FFFFFF]">
                  <span 
                    className="px-2 py-0.5 text-[11px] font-mono font-bold uppercase shrink-0"
                    style={{ backgroundColor: route.color, color: route.textColor }}
                  >
                    {route.lineCode}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111111] truncate">{route.name}</div>
                    <div className="text-[10px] font-mono text-[#666666]">
                      Every {route.frequencyMinutesPeak}m peak · {route.onTimeRatePercent}% on-time
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Destinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9D9D4] pb-1">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#666666]">
                Attractions Near This Stop ({nearbyAttractions.length})
              </h4>
            </div>

            {nearbyAttractions.length === 0 ? (
              <p className="text-xs text-[#666666] italic font-mono py-2">
                No major tourist landmarks within 300m, but direct connections to all city islands.
              </p>
            ) : (
              <div className="divide-y divide-[#D9D9D4] border border-[#D9D9D4]">
                {nearbyAttractions.map((attraction) => (
                  <div 
                    key={attraction.id}
                    onClick={() => {
                      onClose();
                      onSelectAttraction(attraction.id);
                    }}
                    className="p-3 hover:bg-[#F5F5F2] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-sm font-display font-bold text-[#111111] hover:text-[#1E4D6B]">
                        {attraction.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#666666]">
                        {attraction.category} · {attraction.walkingTimeToStopMinutes} min walk
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#666666]" strokeWidth={1.5} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#D9D9D4] flex justify-end gap-3">
            <button
              onClick={() => {
                onClose();
                onPlanFromHere(stop.id);
              }}
              className="px-6 py-3 bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors text-xs font-mono uppercase tracking-wider flex items-center gap-2"
            >
              <Train className="w-4 h-4" strokeWidth={1.5} />
              <span>Plan Journey Starting From Here</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
