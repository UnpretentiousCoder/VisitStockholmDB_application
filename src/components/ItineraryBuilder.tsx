import React, { useState } from 'react';
import { 
  Calendar, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Train, 
  Clock, 
  MapPin, 
  Plus, 
  Printer, 
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { ItineraryItem, Attraction } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS } from '../data/stockholmData';
import { calculateJourney } from '../services/routingService';

interface ItineraryBuilderProps {
  itinerary: ItineraryItem[];
  onRemoveItem: (id: string) => void;
  onReorderItem: (id: string, direction: 'up' | 'down') => void;
  onAddItem: (attractionId: string, dayNumber?: number) => void;
  onPlanRouteBetween: (origId: string, destId: string) => void;
  onClearItinerary: () => void;
}

export const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({
  itinerary,
  onRemoveItem,
  onReorderItem,
  onAddItem,
  onPlanRouteBetween,
  onClearItinerary,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [quickAddId, setQuickAddId] = useState<string>('');

  const currentDayItems = itinerary
    .filter(item => item.dayNumber === selectedDay)
    .sort((a, b) => a.order - b.order);

  const handleQuickAdd = () => {
    if (quickAddId) {
      onAddItem(quickAddId, selectedDay);
      setQuickAddId('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            Trip Planner · Multi-Stop Day Itinerary
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            My Stockholm Trip
          </h2>
          <p className="text-xs sm:text-sm text-[#666666] font-mono mt-1">
            Construct your day schedule. The engine automatically links each visit with the best public transport route.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {itinerary.length > 0 && (
            <>
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-[#111111] text-xs font-mono uppercase tracking-wider text-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Print Schedule</span>
              </button>
              <button
                onClick={onClearItinerary}
                className="px-4 py-2 border border-[#D9D9D4] text-xs font-mono uppercase tracking-wider text-[#8A3333] hover:border-[#8A3333] transition-colors"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Day Selector Bar & Add Location Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#F5F5F2] border border-[#D9D9D4] p-4">
        
        {/* Day tabs */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-all ${
                selectedDay === day
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-[#FFFFFF] text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
              }`}
            >
              Day 0{day}
            </button>
          ))}
        </div>

        {/* Quick Add Dropdown */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <select
            value={quickAddId}
            onChange={(e) => setQuickAddId(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#111111] px-3 py-2 text-xs font-mono text-[#111111] outline-none"
          >
            <option value="">+ Add a destination to Day 0{selectedDay}...</option>
            {STOCKHOLM_ATTRACTIONS.map((attraction) => (
              <option key={attraction.id} value={attraction.id}>
                {attraction.name} ({attraction.district})
              </option>
            ))}
          </select>
          <button
            onClick={handleQuickAdd}
            disabled={!quickAddId}
            className="px-4 py-2 bg-[#1E4D6B] disabled:bg-[#D9D9D4] text-white text-xs font-mono uppercase tracking-wider shrink-0 transition-colors"
          >
            Add
          </button>
        </div>

      </div>

      {/* Itinerary Timeline */}
      {currentDayItems.length === 0 ? (
        <div className="border border-[#111111] bg-[#FFFFFF] p-12 text-center space-y-4">
          <Calendar className="w-8 h-8 mx-auto text-[#666666]" strokeWidth={1.5} />
          <h3 className="font-display font-bold text-xl text-[#111111]">
            No destinations scheduled for Day 0{selectedDay}
          </h3>
          <p className="text-xs font-mono text-[#666666] max-w-sm mx-auto">
            Use the dropdown above, or browse the Explore directory to add royal palaces, museums, and fika bakeries to your journey.
          </p>
        </div>
      ) : (
        <div className="border-2 border-[#111111] bg-[#FFFFFF] p-6 sm:p-8 space-y-8">
          
          <div className="flex items-center justify-between border-b border-[#111111] pb-3">
            <h3 className="text-xl font-display font-bold text-[#111111]">
              Day 0{selectedDay} Schedule ({currentDayItems.length} stops)
            </h3>
            <span className="text-xs font-mono text-[#666666]">
              SL Public Transport Connected
            </span>
          </div>

          <div className="space-y-6">
            {currentDayItems.map((item, index) => {
              const attraction = STOCKHOLM_ATTRACTIONS.find(a => a.id === item.attractionId);
              const nextItem = currentDayItems[index + 1];
              const nextAttraction = nextItem ? STOCKHOLM_ATTRACTIONS.find(a => a.id === nextItem.attractionId) : null;

              if (!attraction) return null;

              // Calculate transport connection to next item if present
              let transitLegText = '';
              let transitDuration = 0;
              if (nextAttraction) {
                const routes = calculateJourney(attraction.id, nextAttraction.id);
                if (routes.length > 0) {
                  transitDuration = routes[0].totalDurationMinutes;
                  const firstBoarding = routes[0].steps.find(s => s.type === 'board');
                  if (firstBoarding) {
                    transitLegText = `Take ${firstBoarding.lineCode} (${transitDuration} min)`;
                  } else {
                    transitLegText = `Walk (${transitDuration} min)`;
                  }
                }
              }

              return (
                <div key={item.id} className="space-y-4">
                  
                  {/* Item Card */}
                  <div className="border border-[#111111] bg-[#F5F5F2] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex items-start gap-4">
                      {/* Scheduled Time Badge */}
                      <div className="bg-[#111111] text-white px-3 py-1.5 font-mono text-xs font-bold text-center shrink-0">
                        {item.scheduledTime}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#1E4D6B] font-semibold">
                            Stop #{index + 1} · {attraction.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-display font-bold text-[#111111]">
                          {attraction.name}
                        </h4>
                        <p className="text-xs text-[#666666] font-mono pt-0.5">
                          {attraction.district} · {attraction.openingHours}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Reorder & Delete */}
                    <div className="flex items-center gap-2 self-end md:self-center font-mono">
                      <button
                        onClick={() => onReorderItem(item.id, 'up')}
                        disabled={index === 0}
                        className="p-1.5 border border-[#111111] disabled:opacity-30 hover:bg-[#111111] hover:text-white transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReorderItem(item.id, 'down')}
                        disabled={index === currentDayItems.length - 1}
                        className="p-1.5 border border-[#111111] disabled:opacity-30 hover:bg-[#111111] hover:text-white transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 border border-[#8A3333] text-[#8A3333] hover:bg-[#8A3333] hover:text-white transition-colors ml-2"
                        title="Remove destination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Public Transport Connector between consecutive destinations */}
                  {nextAttraction && (
                    <div className="pl-6 border-l-2 border-dashed border-[#111111] ml-6 py-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#E8F0F4] border border-[#1E4D6B] text-xs font-mono">
                        <div className="flex items-center gap-2 text-[#1E4D6B]">
                          <Train className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                          <span className="font-semibold">
                            Transport to {nextAttraction.name}:
                          </span>
                          <span>{transitLegText}</span>
                        </div>
                        <button
                          onClick={() => onPlanRouteBetween(attraction.id, nextAttraction.id)}
                          className="text-[11px] uppercase tracking-wider text-[#111111] hover:text-[#1E4D6B] font-bold flex items-center gap-1 underline"
                        >
                          <span>Inspect Route Details</span>
                          <Navigation className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

    </section>
  );
};
