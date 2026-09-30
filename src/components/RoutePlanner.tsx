import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown, 
  Clock, 
  Train, 
  Footprints, 
  MapPin, 
  Check, 
  AlertCircle, 
  Calendar,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { JourneyOption, JourneyStep, Attraction } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS } from '../data/stockholmData';
import { calculateJourney } from '../services/routingService';

interface RoutePlannerProps {
  initialOriginId?: string;
  initialDestinationId?: string;
  onAddToItinerary?: (attraction: Attraction) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  initialOriginId = 'stop-t-centralen',
  initialDestinationId = 'poi-vasa-museum',
  onAddToItinerary,
}) => {
  const [originId, setOriginId] = useState<string>(initialOriginId);
  const [destinationId, setDestinationId] = useState<string>(initialDestinationId);
  const [departureTime, setDepartureTime] = useState<string>('10:00');
  const [journeys, setJourneys] = useState<JourneyOption[]>([]);
  const [selectedJourneyIndex, setSelectedJourneyIndex] = useState<number>(0);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialOriginId) setOriginId(initialOriginId);
  }, [initialOriginId]);

  useEffect(() => {
    if (initialDestinationId) setDestinationId(initialDestinationId);
  }, [initialDestinationId]);

  // Combined location list for select dropdowns
  const allLocations = [
    {
      group: 'Popular Sights & Venues',
      items: STOCKHOLM_ATTRACTIONS.map(a => ({ id: a.id, name: `${a.name} (${a.district})` })),
    },
    {
      group: 'Transit Hubs & Stations',
      items: STOCKHOLM_STOPS.map(s => ({ id: s.id, name: `[SL Stop] ${s.name}` })),
    }
  ];

  // Recalculate route whenever origin, destination, or time changes
  useEffect(() => {
    if (originId && destinationId && originId !== destinationId) {
      const results = calculateJourney(originId, destinationId, departureTime);
      setJourneys(results);
      setSelectedJourneyIndex(0);
    } else {
      setJourneys([]);
    }
  }, [originId, destinationId, departureTime]);

  const handleSwap = () => {
    const temp = originId;
    setOriginId(destinationId);
    setDestinationId(temp);
  };

  const handlePreset = (orig: string, dest: string) => {
    setOriginId(orig);
    setDestinationId(dest);
  };

  const selectedJourney = journeys[selectedJourneyIndex];

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Section Header */}
      <div className="border-b border-[#111111] pb-6">
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
          Journey Finder · SL Multi-Modal Routing
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
          Public Transport Route Planner
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] font-mono mt-1">
          Connects any Stockholm museum, hotel, restaurant, or transit stop with real-time transfer calculations and historical reliability scores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Route Selector */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="border-2 border-[#111111] bg-[#FFFFFF] p-6 space-y-5">
            
            {/* Origin */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
                Starting Location (From)
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full bg-[#F5F5F2] border border-[#111111] p-3 text-xs sm:text-sm text-[#111111] font-mono outline-none"
              >
                {allLocations.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={handleSwap}
                className="p-2 border border-[#111111] bg-[#FFFFFF] hover:bg-[#111111] hover:text-white transition-colors"
                title="Swap origin and destination"
              >
                <ArrowUpDown className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Destination */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
                Destination (To)
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-[#F5F5F2] border border-[#111111] p-3 text-xs sm:text-sm text-[#111111] font-mono outline-none"
              >
                {allLocations.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Departure Time */}
            <div className="space-y-1.5 pt-2 border-t border-[#D9D9D4]">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#666666] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1E4D6B]" strokeWidth={1.5} />
                <span>Departure Time</span>
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-[#F5F5F2] border border-[#111111] p-2.5 text-xs sm:text-sm font-mono text-[#111111] outline-none"
              />
            </div>

          </div>

          {/* Quick Curated Route Presets */}
          <div className="border border-[#D9D9D4] bg-[#F5F5F2] p-4 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666666] block">
              Suggested Travel Itinerary Legs:
            </span>
            <div className="space-y-2">
              {[
                { 
                  label: 'T-Centralen → Vasa Museum (Djurgården)', 
                  orig: 'stop-t-centralen', 
                  dest: 'poi-vasa-museum' 
                },
                { 
                  label: 'Gamla Stan → Skansen (Scenic Tram/Ferry)', 
                  orig: 'stop-gamla-stan', 
                  dest: 'poi-skansen' 
                },
                { 
                  label: 'Grand Hôtel → Monteliusvägen Cliff Walk', 
                  orig: 'poi-grand-hotel', 
                  dest: 'poi-monteliusvagen' 
                },
                { 
                  label: 'City Hall (Stadshuset) → Moderna Museet', 
                  orig: 'poi-stadshuset', 
                  dest: 'poi-moderna-museet' 
                },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePreset(p.orig, p.dest)}
                  className="w-full text-left p-2 bg-[#FFFFFF] border border-[#D9D9D4] hover:border-[#1E4D6B] hover:text-[#1E4D6B] text-xs font-mono transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{p.label}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Route Itinerary & Vertical Timeline */}
        <div className="lg:col-span-7 space-y-6">
          
          {journeys.length === 0 ? (
            <div className="border border-[#111111] bg-[#F5F5F2] p-12 text-center space-y-3">
              <Navigation className="w-8 h-8 mx-auto text-[#666666]" strokeWidth={1.5} />
              <h3 className="font-display font-bold text-xl text-[#111111]">
                Choose your starting point and destination
              </h3>
              <p className="text-xs font-mono text-[#666666] max-w-sm mx-auto">
                Select from Stockholm’s iconic venues or SL transit stops to calculate walking legs and platform boarding directions.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Option Selector Tabs */}
              <div className="flex gap-2 border-b border-[#111111] pb-2 overflow-x-auto">
                {journeys.map((j, idx) => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJourneyIndex(idx)}
                    className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border transition-all text-left ${
                      selectedJourneyIndex === idx
                        ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]'
                        : 'bg-[#FFFFFF] text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
                    }`}
                  >
                    <div className="font-bold">{j.totalDurationMinutes} min</div>
                    <div className="text-[10px] opacity-80">
                      {j.transfersCount === 0 ? 'Direct connection' : `${j.transfersCount} transfer`}
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Journey Card */}
              {selectedJourney && (
                <div className="border-2 border-[#111111] bg-[#FFFFFF] p-6 sm:p-8 space-y-8">
                  
                  {/* Journey Overview Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#111111] pb-6">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-[#666666]">
                        Calculated Journey
                      </div>
                      <div className="text-3xl font-display font-bold text-[#111111] mt-0.5">
                        {selectedJourney.totalDurationMinutes} minutes
                      </div>
                      <div className="text-xs font-mono text-[#666666] mt-1">
                        Depart {selectedJourney.departureTime} · Arrive {selectedJourney.arrivalTime}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                      <div className="bg-[#F5F5F2] border border-[#D9D9D4] px-3 py-1.5">
                        <span className="text-[#666666]">Walk:</span> <strong>{selectedJourney.walkingMinutes} min</strong>
                      </div>
                      <div className="bg-[#F5F5F2] border border-[#D9D9D4] px-3 py-1.5">
                        <span className="text-[#666666]">Transit:</span> <strong>{selectedJourney.transitMinutes} min</strong>
                      </div>
                      <div className="bg-[#F0F7F3] border border-[#315C45] px-3 py-1.5 text-[#315C45]">
                        <span>Reliability: <strong>{selectedJourney.overallReliability}%</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Timeline Visualization */}
                  <div className="space-y-0 relative pl-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-[#111111]">
                    
                    {selectedJourney.steps.map((step, idx) => {
                      const isLast = idx === selectedJourney.steps.length - 1;

                      return (
                        <div key={step.id} className="relative pb-8 last:pb-2 group">
                          
                          {/* Dot / Indicator on vertical line */}
                          <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-[#FFFFFF] ${
                            step.type === 'board'
                              ? 'border-[#1E4D6B] text-[#1E4D6B]'
                              : step.type === 'transfer'
                              ? 'border-[#8A641C] text-[#8A641C]'
                              : 'border-[#111111] text-[#111111]'
                          }`}>
                            {step.type === 'walk' && <Footprints className="w-3 h-3" />}
                            {step.type === 'board' && <Train className="w-3 h-3" />}
                            {step.type === 'transfer' && <Clock className="w-3 h-3" />}
                            {step.type === 'arrive' && <MapPin className="w-3 h-3 text-[#315C45]" />}
                          </div>

                          {/* Content Step */}
                          <div className="pl-3 space-y-1">
                            
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111]">
                                {step.instruction}
                              </span>
                              {step.durationMinutes > 0 && (
                                <span className="text-[11px] font-mono text-[#666666] bg-[#F5F5F2] px-2 py-0.5 border border-[#D9D9D4]">
                                  {step.durationMinutes} min
                                </span>
                              )}
                            </div>

                            {/* Additional metadata if boarding */}
                            {step.type === 'board' && step.lineCode && (
                              <div className="p-3 bg-[#E8F0F4] border border-[#1E4D6B] text-xs font-mono space-y-1.5 mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[#1E4D6B] uppercase">
                                    {step.lineCode} · {step.lineName}
                                  </span>
                                  <span className="text-[10px] text-[#315C45] font-semibold">
                                    ● Standard Frequency
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#111111]">
                                  From <strong>{step.fromStopName}</strong> → To <strong>{step.toStopName}</strong>
                                </div>
                                {step.stopsCount && step.stopsCount > 1 && (
                                  <div className="text-[10px] text-[#666666]">
                                    Passes through {step.stopsCount} stops ({step.intermediateStops?.join(', ') || 'express segment'})
                                  </div>
                                )}
                                {step.delayAlert && (
                                  <div className="text-[10px] text-[#8A641C] flex items-center gap-1 font-semibold pt-1 border-t border-[#1E4D6B]/20">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    <span>{step.delayAlert}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {step.distanceMeters && (
                              <div className="text-[10px] font-mono text-[#666666]">
                                Approximate walking distance: {step.distanceMeters} meters
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </section>
  );
};
