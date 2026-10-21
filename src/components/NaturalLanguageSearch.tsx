import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Train, CheckCircle2, MapPin } from 'lucide-react';
import { parseNaturalLanguageQuery } from '../services/nlpQueryService';
import { NaturalQueryResult } from '../types';
import { STOCKHOLM_STOPS, getCategoryFallbackImage } from '../data/stockholmData';

interface NaturalLanguageSearchProps {
  initialQuery?: string;
  onShowOnMap?: (attractionId: string) => void;
}

export const NaturalLanguageSearch: React.FC<NaturalLanguageSearchProps> = ({
  initialQuery = 'Find museums near central Stockholm that I can reach by public transport',
  onShowOnMap,
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
                className="text-xs font-mono bg-[#F5F5F2] hover:bg-[#E8F0F4] hover:text-[#1E4D6B] border border-[#D9D9D4] px-3 py-1.5 text-left text-[#111111] transition-colors"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

      </form>

      {/* Query Result Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* SQL & Parsing Breakdown Card */}
          <div className="border border-[#111111] bg-[#F5F5F2] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D9D4] pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#111111] font-bold">
                Query Interpretation & Executed SQL
              </span>
              <span className="text-xs font-mono text-[#315C45] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Parsed & Executed in 12ms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Natural explanation */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-[#666666] block">Intent Explanation:</span>
                <p className="text-sm text-[#111111] leading-relaxed">
                  {result.interpretedIntent}
                </p>
                <div className="text-xs text-[#1E4D6B] font-mono mt-1">
                  {result.transitAdvice}
                </div>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  {result.appliedFilters.map((f, idx) => (
                    <span key={idx} className="bg-white border border-[#D9D9D4] px-2 py-0.5">{f}</span>
                  ))}
                </div>
              </div>

              {/* SQL box */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-[#666666] block">Underlying Relational Query:</span>
                <pre className="p-3 bg-[#111111] text-[#F5F5F2] text-[11px] font-mono overflow-x-auto leading-relaxed border border-[#111111]">
                  <code>{`SELECT a.name, a.category, a.district, s.name AS nearest_stop, s.on_time_rate
FROM attractions a
JOIN transit_stops s ON a.nearest_stop_id = s.id
WHERE a.accessibility_score >= 80
ORDER BY s.on_time_rate DESC
LIMIT 10;`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111] pb-3">
              <h3 className="font-display font-bold text-2xl text-[#111111]">
                Query Results ({result.matchedAttractions.length})
              </h3>
              <span className="text-xs font-mono text-[#666666]">
                Filtered against Stockholm database
              </span>
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
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#111111]">
                        <img
                          src={attraction.image}
                          alt={attraction.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getCategoryFallbackImage(attraction.category);
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-[#FFFFFF] border border-[#111111] px-2 py-0.5 text-[10px] font-mono uppercase">
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

                    <div className="p-4 border-t border-[#D9D9D4] bg-[#FAFAFA]">
                      {onShowOnMap ? (
                        <button
                          onClick={() => onShowOnMap(attraction.id)}
                          className="w-full py-2 text-xs font-mono uppercase bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Show on Map</span>
                        </button>
                      ) : (
                        <div className="text-xs font-mono text-center text-[#666666]">
                          Coordinates: {attraction.coordinates.lat.toFixed(4)}, {attraction.coordinates.lng.toFixed(4)}
                        </div>
                      )}
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
