import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, MapPin, CheckCircle2, Cpu, Loader2, Navigation, Terminal, Copy, Check } from 'lucide-react';
import { queryTextToSql, checkOllamaHealth, TextToSqlResult, OLLAMA_MODEL } from '../services/ollamaSqlService';
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
  const [result, setResult] = useState<TextToSqlResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ online: boolean; hasModel: boolean }>({
    online: false,
    hasModel: false,
  });

  const sampleQueries = [
    'Find museums near central Stockholm that I can reach by public transport',
    'Best fika in Södermalm near green line',
    'Attractions within 1 km of a stop served by reliable routes',
    'Historic places in Gamla Stan with short walk',
    'Scenic viewpoints reachable by ferry or metro',
  ];

  // Check Ollama health status on component mount
  useEffect(() => {
    checkOllamaHealth().then(status => {
      setOllamaStatus(status);
    });
  }, []);

  const handleExecuteSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    try {
      const searchResult = await queryTextToSql(q);
      setResult(searchResult);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#1E4D6B]">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Intelligent Natural Language Search · ASK STOCKHOLM</span>
          </div>

          {/* Model Status Badge */}
          <div className="inline-flex items-center gap-2 border border-[#111111] px-3 py-1 bg-[#F5F5F2] self-start sm:self-auto">
            <Cpu className="w-3.5 h-3.5 text-[#1E4D6B]" />
            <span className="text-[11px] font-mono text-[#111111]">
              Model: <span className="font-semibold text-[#1E4D6B]">{OLLAMA_MODEL}</span>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                ollamaStatus.online ? 'bg-[#315C45] animate-pulse' : 'bg-[#8A641C]'
              }`}
              title={ollamaStatus.online ? 'Local Ollama Active' : 'Fallback Engine Active'}
            />
            <span className="text-[10px] font-mono text-[#666666] uppercase">
              {ollamaStatus.online ? 'Local Ollama' : 'Fallback Active'}
            </span>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111] mt-2">
          Ask Stockholm
        </h2>
        <p className="text-xs sm:text-sm text-[#666666] font-mono mt-1 max-w-2xl">
          Enter questions in plain English or Swedish. Powered by local AI query parsing across Stockholm destinations, walking distances, and SL public transit links.
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
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3.5 bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[#111111] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <span>Search</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </>
            )}
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
                disabled={isLoading}
                onClick={() => {
                  setQueryText(sample);
                  handleExecuteSearch(sample);
                }}
                className="text-xs font-mono bg-[#F5F5F2] hover:bg-[#E8F0F4] hover:text-[#1E4D6B] border border-[#D9D9D4] px-3 py-1.5 text-left text-[#111111] transition-colors disabled:opacity-50"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

      </form>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="border border-[#111111] bg-[#F5F5F2] p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1E4D6B]" />
          <p className="text-sm font-mono text-[#111111]">
            Parsing natural language query with {OLLAMA_MODEL} & querying Stockholm database...
          </p>
          <span className="text-[11px] font-mono text-[#666666]">
            Evaluating geographical criteria, transit routes, and walking proximity.
          </span>
        </div>
      )}

      {/* Query Result Section */}
      {!isLoading && result && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Query Summary Card (Internal Database & SQL Code Strictly Hidden) */}
          <div className="border border-[#111111] bg-[#F5F5F2] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D9D4] pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-[#111111] font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#315C45]" />
                Search Insights & Transit Guidance
              </span>
              <div className="flex items-center gap-3 text-xs font-mono text-[#666666]">
                <span className="bg-[#FFFFFF] border border-[#D9D9D4] px-2 py-0.5 text-[11px]">
                  Engine: {result.modelUsed}
                </span>
                <span className="text-[#315C45] font-semibold">
                  {result.executionTimeMs} ms
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-[#111111] leading-relaxed">
                {result.summary}
              </p>
              {result.transitAdvice && (
                <div className="text-xs text-[#1E4D6B] font-mono flex items-center gap-1.5 bg-[#FFFFFF] border border-[#D9D9D4] p-3">
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  <span>{result.transitAdvice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Internal SQL Debug Logs Drawer Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#111111] bg-[#F5F5F2] px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#666666]">
              <Terminal className="w-4 h-4 text-[#1E4D6B]" />
              <span>Diagnostic Mode: Internal Generated SQL Telemetry</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDebugLogs(!showDebugLogs)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors border border-[#111111] self-start sm:self-auto"
            >
              <span>{showDebugLogs ? 'Hide Internal SQL Logs ▲' : 'Inspect Internal SQL Logs ▼'}</span>
            </button>
          </div>

          {/* Internal SQL Query Diagnostic Panel */}
          {showDebugLogs && result.debugLog && (
            <div className="border-2 border-[#1E4D6B] bg-[#111111] text-[#F5F5F2] p-6 space-y-5 font-mono text-xs animate-in fade-in duration-200">
              
              {/* Telemetry Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#333333] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E4D6B] animate-pulse" />
                  <span className="font-bold text-white tracking-widest uppercase text-xs">
                    Internal SQL Execution Trace
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A0A0A0]">
                  <span className="bg-[#222222] border border-[#333333] px-2 py-0.5">
                    Model: <strong className="text-white">{result.debugLog.modelUsed}</strong>
                  </span>
                  <span className="bg-[#222222] border border-[#333333] px-2 py-0.5">
                    Latency: <strong className="text-[#315C45]">{result.debugLog.executionTimeMs}ms</strong>
                  </span>
                  <span className="bg-[#222222] border border-[#333333] px-2 py-0.5">
                    {result.debugLog.timestamp}
                  </span>
                </div>
              </div>

              {/* Fallback Notice if triggered */}
              {result.debugLog.isFallback && (
                <div className="bg-[#2A1D0E] border border-[#8A641C] p-3.5 text-[#E8B86D] space-y-1">
                  <div className="font-bold uppercase text-[10px] tracking-widest text-[#FFC107] flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Refined Fallback Triggered</span>
                  </div>
                  <p className="text-xs text-[#E8F0F4]">
                    {result.debugLog.fallbackReason}
                  </p>
                </div>
              )}

              {/* Generated SQL Code Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    1. Executed SQL Statement (AlaSQL In-Memory DB):
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.debugLog.cleanedSql);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] uppercase bg-[#222222] hover:bg-[#333333] px-2.5 py-1 text-white border border-[#444444] transition-colors"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-[#315C45]" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#181818] border border-[#333333] text-[#79B8FF] overflow-x-auto text-xs leading-relaxed font-mono">
                  <code>{result.debugLog.cleanedSql}</code>
                </pre>
              </div>

              {/* Raw LLM Output (Before Sanitization) */}
              {result.debugLog.rawModelOutput && result.debugLog.rawModelOutput !== result.debugLog.cleanedSql && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-[#A0A0A0] block uppercase tracking-wider">
                    2. Raw Output Received From Ollama:
                  </span>
                  <pre className="p-3 bg-[#181818] border border-[#333333] text-[#A0A0A0] overflow-x-auto text-[11px] max-h-32">
                    <code>{result.debugLog.rawModelOutput}</code>
                  </pre>
                </div>
              )}

              {/* Database Rows Returned */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                  <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                    3. Raw Rows Returned From In-Memory Database ({result.debugLog.rowsCount} rows):
                  </span>
                  <span className="text-[10px] text-[#315C45] bg-[#222222] px-2 py-0.5 border border-[#333333]">
                    In-Memory SQLite Schema
                  </span>
                </div>
                <pre className="p-4 bg-[#181818] border border-[#333333] text-[#B3E1C8] overflow-x-auto text-xs max-h-56 leading-relaxed">
                  <code>{JSON.stringify(result.debugLog.rowsSample, null, 2)}</code>
                </pre>
              </div>

              {/* Developer Hint */}
              <div className="text-[11px] text-[#888888] border-t border-[#222222] pt-3">
                💡 <span className="text-white">Tip:</span> You can also open your browser DevTools (<kbd className="bg-[#222] px-1 py-0.5 text-white">F12</kbd> &rarr; Console) to see full colored collapsible telemetry logs for every search.
              </div>

            </div>
          )}

          {/* Curated Results Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#111111] pb-3">
              <h3 className="font-display font-bold text-2xl text-[#111111]">
                Query Results ({result.matchedAttractions.length})
              </h3>
              <span className="text-xs font-mono text-[#666666]">
                Stockholm Curated Venues & Transit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.matchedAttractions.map((attraction) => {
                const stop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);

                return (
                  <div
                    key={attraction.id}
                    className="border-2 border-[#111111] bg-[#FFFFFF] flex flex-col justify-between hover:border-[#1E4D6B] transition-colors"
                  >
                    <div>
                      {/* Photo Header */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#111111]">
                        <img
                          src={attraction.image}
                          alt={attraction.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getCategoryFallbackImage(attraction.category);
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-[#FFFFFF] border border-[#111111] px-2 py-0.5 text-[10px] font-mono uppercase font-semibold text-[#111111]">
                          {attraction.category}
                        </div>
                        <div className="absolute top-3 right-3 bg-[#FFFFFF] border border-[#111111] px-2 py-0.5 text-[10px] font-mono text-[#111111]">
                          ★ {attraction.rating}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 space-y-4">
                        <div>
                          <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider">
                            {attraction.district}
                          </div>
                          <h4 className="font-display font-bold text-xl text-[#111111] leading-snug mt-0.5">
                            {attraction.name}
                          </h4>
                        </div>

                        {/* Concise Paragraph Summary */}
                        <p className="text-xs text-[#333333] leading-relaxed">
                          {attraction.description}
                        </p>

                        {/* Structured Bullet Points */}
                        <div className="border-t border-[#D9D9D4] pt-3">
                          <ul className="text-xs font-mono text-[#111111] space-y-1.5 list-none">
                            <li className="flex items-start gap-2">
                              <span className="text-[#1E4D6B] font-bold">▪</span>
                              <span><strong>District:</strong> {attraction.district}</span>
                            </li>
                            {stop && (
                              <li className="flex items-start gap-2">
                                <span className="text-[#1E4D6B] font-bold">▪</span>
                                <span>
                                  <strong>Transit:</strong> {attraction.walkingTimeToStopMinutes} min walk from {stop.name} ({stop.linesServed.slice(0, 2).join(', ')})
                                </span>
                              </li>
                            )}
                            {attraction.highlight && (
                              <li className="flex items-start gap-2">
                                <span className="text-[#1E4D6B] font-bold">▪</span>
                                <span><strong>Highlight:</strong> {attraction.highlight}</span>
                              </li>
                            )}
                            <li className="flex items-start gap-2">
                              <span className="text-[#1E4D6B] font-bold">▪</span>
                              <span><strong>Price & Hours:</strong> {attraction.priceSek} · {attraction.openingHours}</span>
                            </li>
                            {stop && (
                              <li className="flex items-start gap-2">
                                <span className="text-[#1E4D6B] font-bold">▪</span>
                                <span className="text-[#315C45]">
                                  <strong>Transit Reliability:</strong> {stop.onTimeRatePercent}% on-time rate
                                </span>
                              </li>
                            )}
                          </ul>
                        </div>

                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 border-t border-[#111111] bg-[#F5F5F2]">
                      {onShowOnMap ? (
                        <button
                          onClick={() => onShowOnMap(attraction.id)}
                          className="w-full py-2.5 text-xs font-mono uppercase bg-[#111111] text-white hover:bg-[#1E4D6B] transition-colors flex items-center justify-center gap-1.5 border border-[#111111]"
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
