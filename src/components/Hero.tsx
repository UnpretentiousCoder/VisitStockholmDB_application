import React, { useState } from 'react';
import { Search, ArrowRight, Train, Compass, ShieldCheck, CloudSun } from 'lucide-react';

interface HeroProps {
  onSearch: (query: string) => void;
  onNavigateSection: (section: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onNavigateSection }) => {
  const [searchInput, setSearchInput] = useState('');

  const sampleQueries = [
    'Find museums near Gamla Stan that I can reach by metro',
    'Best fika in Södermalm near green line',
    'Attractions within 1 km of a stop served by reliable routes',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleSelectSample = (query: string) => {
    setSearchInput(query);
    onSearch(query);
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] w-full border-b border-[#111111] overflow-hidden flex items-center">
      {/* Full Page Stockholm Gamla Stan Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero_gamla_stan.jpg"
          alt="Stockholm Gamla Stan & Waterfront"
          className="w-full h-full object-cover object-center"
        />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-nordic-grid opacity-20 pointer-events-none" />
      </div>

      {/* Editorial Content Container */}
      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        <div className="max-w-xl lg:max-w-2xl bg-[#FFFFFF] border-2 border-[#111111] p-6 sm:p-8 lg:p-10 space-y-6 shadow-none">
          
          {/* Meta indicator */}
          <div className="inline-flex items-center gap-2 border border-[#111111] px-3 py-1 bg-[#F5F5F2]">
            <span className="w-1.5 h-1.5 bg-[#1E4D6B] rounded-full animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#111111]">
              Stockholm SL Transit & Guide · Live Database
            </span>
          </div>

          {/* Hero Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold leading-[0.95] text-[#111111] tracking-tight">
              EXPLORE<br />
              <span className="italic font-normal">STOCKHOLM.</span>
            </h1>
            <p className="text-sm sm:text-base text-[#666666] font-normal leading-relaxed">
              A calm, database-driven city guide and journey planning system.
              Discover royal islands, world-class museums, artisan fika, and seamless SL public transport connections.
            </p>
          </div>

          {/* Prominent Search Interface */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch border-2 border-[#111111] bg-[#FFFFFF] shadow-none">
              <div className="flex items-center px-4 py-3.5 flex-1 gap-3">
                <Search className="w-5 h-5 text-[#666666] shrink-0" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Ask or search: e.g. 'Museums in Djurgården by tram' or 'Södermalm fika'..."
                  className="w-full bg-transparent text-[#111111] placeholder-[#666666] text-sm sm:text-base outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#111111] text-[#FFFFFF] hover:bg-[#1E4D6B] transition-colors text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[#111111]"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Natural Language Prompt Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono uppercase text-[#666666]">Try query:</span>
              {sampleQueries.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="text-xs text-[#111111] hover:text-[#1E4D6B] hover:border-[#1E4D6B] border border-[#D9D9D4] px-2.5 py-1 bg-[#F5F5F2] hover:bg-[#E8F0F4] transition-colors text-left"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </form>

          {/* Quick Filter & Quick Link Bar */}
          <div className="pt-2 border-t border-[#D9D9D4] flex flex-wrap items-center gap-4">
            <button
              onClick={() => onNavigateSection('explore')}
              className="text-xs font-mono uppercase tracking-wider text-[#111111] hover:text-[#1E4D6B] flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Explore Attractions</span>
            </button>
            <span className="text-[#D9D9D4] font-mono">/</span>
            <button
              onClick={() => onNavigateSection('weather')}
              className="text-xs font-mono uppercase tracking-wider text-[#111111] hover:text-[#1E4D6B] flex items-center gap-1.5 transition-colors"
            >
              <CloudSun className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Weather & Climate</span>
            </button>
            <span className="text-[#D9D9D4] font-mono">/</span>
            <button
              onClick={() => onNavigateSection('reliability')}
              className="text-xs font-mono uppercase tracking-wider text-[#111111] hover:text-[#1E4D6B] flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>SL Reliability (95.1%)</span>
            </button>
          </div>

          {/* Architectural data metrics */}
          <div className="grid grid-cols-3 divide-x divide-[#D9D9D4] border-t border-[#111111] pt-3 text-center">
            <div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#111111]">14</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">Islands</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#1E4D6B]">100</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">Metro Stations</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#315C45]">95.1%</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666]">On-Time Rate</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
