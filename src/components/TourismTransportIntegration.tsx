import React, { useState } from 'react';
import { Train, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { Attraction } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS } from '../data/stockholmData';

interface TourismTransportIntegrationProps {
  onShowOnMap?: (attractionId: string) => void;
  onSelectStop?: (stopId: string) => void;
}

export const TourismTransportIntegration: React.FC<TourismTransportIntegrationProps> = ({
  onShowOnMap,
  onSelectStop,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string>('reliable');

  const strategies = [
    {
      id: 'reliable',
      title: 'Top Punctuality (≥96% On-Time)',
      description: 'Attractions served by Stockholm’s most reliable rail, ferry, and tram corridors.',
      filter: (a: Attraction) => {
        const stop = STOCKHOLM_STOPS.find(s => s.id === a.nearestStopId);
        return stop ? stop.onTimeRatePercent >= 96 : false;
      }
    },
    {
      id: 'short-walk',
      title: 'Immediate Station Access (≤3 min walk)',
      description: 'Places where you can step off the platform and arrive in less than 3 minutes.',
      filter: (a: Attraction) => a.walkingTimeToStopMinutes <= 3,
    },
    {
      id: 'ferry-tram',
      title: 'Waterfront & Scenic Transit (Tram / Ferry)',
      description: 'Iconic museums and parks reached by historic streetcars or harbor ferries.',
      filter: (a: Attraction) => {
        const stop = STOCKHOLM_STOPS.find(s => s.id === a.nearestStopId);
        return stop ? stop.modes.includes('tram') || stop.modes.includes('ferry') : false;
      }
    },
    {
      id: 'fika-transit',
      title: 'Fika & Dining Near Metro',
      description: 'Legendary Swedish bakeries and restaurants within steps of the subway.',
      filter: (a: Attraction) => (a.category === 'fika' || a.category === 'dining') && a.walkingTimeToStopMinutes <= 6,
    }
  ];

  const currentStrategy = strategies.find(s => s.id === selectedStrategy) || strategies[0];
  const matchedAttractions = STOCKHOLM_ATTRACTIONS.filter(currentStrategy.filter);

  return (
    <div className="border-2 border-[#111111] bg-[#FFFFFF] p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#111111] pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#1E4D6B]">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Smart Integration · Accessible Stockholm</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#111111] mt-1">
            Tourism + Public Transport Synergies
          </h3>
          <p className="text-xs text-[#666666] font-mono mt-0.5">
            Optimize your vacation by picking destinations matched with Stockholm’s most punctual transit arteries.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-[#666666]">
            Matched: <strong className="text-[#111111]">{matchedAttractions.length}</strong> venues
          </span>
        </div>
      </div>

      {/* Strategy Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {strategies.map((strat) => {
          const isSelected = selectedStrategy === strat.id;
          return (
            <button
              key={strat.id}
              onClick={() => setSelectedStrategy(strat.id)}
              className={`p-3.5 text-left border transition-all ${
                isSelected
                  ? 'border-[#1E4D6B] bg-[#E8F0F4] text-[#111111]'
                  : 'border-[#D9D9D4] bg-[#FFFFFF] hover:border-[#111111]'
              }`}
            >
              <div className="font-display font-bold text-sm text-[#111111]">
                {strat.title}
              </div>
              <div className="text-[11px] text-[#666666] line-clamp-2 mt-1">
                {strat.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Matched Attractions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {matchedAttractions.map((attraction) => {
          const stop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);

          return (
            <div 
              key={attraction.id}
              className="border border-[#D9D9D4] bg-[#F5F5F2] p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-[#1E4D6B] font-bold">{attraction.category}</span>
                  <span className="text-[#315C45] bg-[#F0F7F3] border border-[#315C45] px-1.5 py-0.5">
                    Score: {attraction.accessibilityScore}/100
                  </span>
                </div>

                <h4 className="font-display font-bold text-base text-[#111111]">
                  {attraction.name}
                </h4>

                <p className="text-xs text-[#666666] line-clamp-2">
                  {attraction.description}
                </p>

                {stop && (
                  <div className="p-2.5 bg-[#FFFFFF] border border-[#D9D9D4] text-[11px] font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#111111] truncate">{stop.name}</span>
                      <span className="text-[#315C45] font-bold shrink-0">{stop.onTimeRatePercent}% on-time</span>
                    </div>
                    <div className="text-[10px] text-[#666666]">
                      {attraction.walkingTimeToStopMinutes} min walk · Lines: {stop.linesServed.join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#D9D9D4]">
                {onShowOnMap && (
                  <button
                    onClick={() => onShowOnMap(attraction.id)}
                    className="py-1.5 px-2 text-[11px] font-mono uppercase tracking-wider border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Map</span>
                  </button>
                )}
                {stop && onSelectStop && (
                  <button
                    onClick={() => onSelectStop(stop.id)}
                    className="py-1.5 px-2 text-[11px] font-mono uppercase tracking-wider bg-[#1E4D6B] text-white hover:bg-[#111111] transition-colors flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Stop</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
