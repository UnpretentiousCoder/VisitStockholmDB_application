import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Train, CheckCircle2, Plus, Navigation } from 'lucide-react';
import { parseNaturalLanguageQuery } from '../services/nlpQueryService';
import { NaturalQueryResult, Attraction } from '../types';
import { STOCKHOLM_STOPS } from '../data/stockholmData';

interface NaturalLanguageSearchProps {
  initialQuery?: string;
  onPlanRouteHere: (attractionId: string) => void;
  onAddToItinerary: (attraction: Attraction) => void;
}

export const NaturalLanguageSearch: React.FC<NaturalLanguageSearchProps> = ({
  initialQuery = 'Find museums near central Stockholm that I can reach by public transport',
  onPlanRouteHere,
  onAddToItinerary,
}) => {
  const [queryText, setQueryText] = useState(initialQuery);
  const [result, setResult] = useState<NaturalQueryResult | null>(null);

  const sampleQueries = [
    'Find museums near central Stockholm that I can reach by public transport',
    'Best fika in Södermalm near green line',
    'Attractions within 1 km of a stop served by reliable routes',
    'Historic places in Gamla Stan with short walk',
    'Scenic viewpoints reachable by ferry or metro',
  ];

  const handleExecuteSearch = (q: string) => {
    if (!q.trim()) return;
    const parsed = parseNaturalLanguageQuery(q);
    setResult(parsed);
  };

  useEffect(() => {
    if (initialQuery) {
      setQueryText(initialQuery);
      handleExecuteSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(queryText);
  };

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#1E4D6B]">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Natural Language Database Query · ASK STOCKHOLM</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111] mt-1">
          Ask Stockholm
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] font-mono mt-1 max-w-2xl">
          Enter everyday questions in plain English or Swedish. The query engine parses your intent into real database filters across geography, venues, and SL transit routes.
        </p>
      </div>

      {/* Editorial Search Form */}
      <form onSubmit={handleSubmit} className="border-2 border-[#111111] bg-[#FFFFFF] p-6 sm:p-8 space-y-4">
        
        <label className="text-xs font-mono uppercase tracking-widest text-[#111111] font-bold block">
          Enter Your Query:
        </label>

        <div className="flex flex-col sm:flex-row items-stretch border-2 border-[#111111] bg-[#FFFFFF]">
          <div className="flex items-center px-4 py-3.5 flex-1 gap-3">
            <Search className="w-5 h-5 text-[#666666] shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g. 'Find museums near Gamla Stan that I can reach by metro'..."
              className="w-full bg-transparent text-[#111111] text-sm sm:text-base outline-none font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3.5 bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[#111111]"
          >
            <span>Query Database</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[10px] font-mono uppercase text-[#666666] block">
            Example Queries to Test:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQueryText(sample);
                  handleExecuteSearch(sample);
                }}
                className="text-xs font-mono text-[#111111] bg-[#F5F5F2] hover:bg-[#E8F0F4] border border-[#D9D9D4] hover:border-[#1E4D6B] px-3 py-1.5 text-left transition-colors"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

      </form>

      {/* Query Parsing & Results Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Query Translation Breakdown Box */}
          <div className="border border-[#1E4D6B] bg-[#E8F0F4] p-6 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E4D6B]/20 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#1E4D6B]">
                Query Interpretation & Applied Filters
              </span>
              <span className="text-[11px] font-mono text-[#315C45] font-semibold">
                Match Confidence: {(result.confidenceScore * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-base font-serif italic text-[#111111]">
                "{result.interpretedIntent}"
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {result.appliedFilters.map((filter, idx) => (
                  <span key={idx} className="text-xs font-mono bg-[#FFFFFF] border border-[#1E4D6B] text-[#1E4D6B] px-2.5 py-1">
                    ✓ {filter}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 text-xs font-mono text-[#111111] flex items-start gap-2 bg-[#FFFFFF]/70 p-3 border border-[#1E4D6B]/20">
              <Train className="w-4 h-4 text-[#1E4D6B] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <strong className="text-[#1E4D6B]">Transit Logistics:</strong> {result.transitAdvice}
              </div>
            </div>

          </div>

          {/* Results List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111] pb-2">
              <h3 className="font-display font-bold text-2xl text-[#111111]">
                Your Results ({result.matchedAttractions.length} destinations found)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.matchedAttractions.map((attraction) => {
                const stop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);

                return (
                  <div 
                    key={attraction.id}
                    className="border border-[#111111] bg-[#FFFFFF] flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#111111] border-b border-[#111111]">
                        <img 
                          src={attraction.image} 
                          alt={attraction.name}
                          className="w-full h-full object-cover grayscale-[20%]" 
                        />
                        <div className="absolute top-2 left-2 bg-[#FFFFFF] border border-[#111111] px-2 py-0.5 text-[10px] font-mono uppercase">
                          {attraction.category}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div>
                          <div className="text-[10px] font-mono text-[#666666] uppercase">
                            {attraction.district} · {attraction.priceSek}
                          </div>
                          <h4 className="font-display font-bold text-xl text-[#111111]">
                            {attraction.name}
                          </h4>
                        </div>

                        <p className="text-xs text-[#666666] line-clamp-2">
                          {attraction.description}
                        </p>

                        {stop && (
                          <div className="p-3 bg-[#F5F5F2] border border-[#D9D9D4] text-xs font-mono space-y-1">
                            <div className="flex justify-between items-center text-[#1E4D6B] font-bold">
                              <span>M {stop.name}</span>
                              <span className="text-[#315C45]">{stop.onTimeRatePercent}% on-time</span>
                            </div>
                            <div className="text-[11px] text-[#666666]">
                              {attraction.walkingTimeToStopMinutes} min walk · Connects with {stop.linesServed.slice(0, 3).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border-t border-[#D9D9D4] grid grid-cols-2 gap-2 bg-[#FAFAFA]">
                      <button
                        onClick={() => onAddToItinerary(attraction)}
                        className="py-2 text-xs font-mono uppercase border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Itinerary</span>
                      </button>
                      <button
                        onClick={() => onPlanRouteHere(attraction.id)}
                        className="py-2 text-xs font-mono uppercase bg-[#1E4D6B] text-white hover:bg-[#111111] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Route</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </section>
  );
};
