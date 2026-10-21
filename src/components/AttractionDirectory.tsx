import React, { useState, useMemo } from 'react';
import { Search, Train, Star, ArrowRight, MapPin } from 'lucide-react';
import { Attraction, District } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, getCategoryFallbackImage } from '../data/stockholmData';
import { AttractionDetailModal } from './AttractionDetailModal';

interface AttractionDirectoryProps {
  onShowOnMap?: (attractionId: string) => void;
  onSelectStop?: (stopId: string) => void;
  externalSearchQuery?: string;
}

export const AttractionDirectory: React.FC<AttractionDirectoryProps> = ({
  onShowOnMap,
  onSelectStop,
  externalSearchQuery = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery);
  const [onlyHighReliability, setOnlyHighReliability] = useState<boolean>(false);
  const [onlyShortWalk, setOnlyShortWalk] = useState<boolean>(false);
  const [activeAttraction, setActiveAttraction] = useState<Attraction | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Destinations' },
    { id: 'museum', label: 'Museums' },
    { id: 'historic', label: 'Historic Sites' },
    { id: 'dining', label: 'Restaurants' },
    { id: 'fika', label: 'Cafés & Fika' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'viewpoint', label: 'Viewpoints' },
    { id: 'park', label: 'Parks & Nature' },
  ];

  const districts: District[] = [
    'Gamla Stan',
    'Norrmalm',
    'Södermalm',
    'Djurgården',
    'Skeppsholmen',
    'Kungsholmen',
    'Vasastan',
  ];

  // Filtering
  const filteredAttractions = useMemo(() => {
    return STOCKHOLM_ATTRACTIONS.filter((item) => {
      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // District
      if (selectedDistrict !== 'all' && item.district !== selectedDistrict) {
        return false;
      }
      // High reliability of nearest stop
      if (onlyHighReliability) {
        const stop = STOCKHOLM_STOPS.find(s => s.id === item.nearestStopId);
        if (!stop || stop.onTimeRatePercent < 95) return false;
      }
      // Short walk <= 5 min
      if (onlyShortWalk && item.walkingTimeToStopMinutes > 5) {
        return false;
      }
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchDistrict = item.district.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchTags && !matchDistrict) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, selectedDistrict, onlyHighReliability, onlyShortWalk, searchQuery]);

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Section Header */}
      <div className="border-b border-[#111111] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            Directory & Guide · Curated Collection
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            Stockholm Destinations
          </h2>
        </div>
        <div className="text-xs font-mono text-[#666666]">
          Showing <span className="text-[#111111] font-bold">{filteredAttractions.length}</span> of {STOCKHOLM_ATTRACTIONS.length} places
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Horizontal Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#D9D9D4]">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-mono whitespace-nowrap uppercase tracking-wider transition-all border ${
                  isSelected
                    ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]'
                    : 'bg-[#FFFFFF] text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* District & Attribute Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F5F5F2] border border-[#D9D9D4] p-3">
          
          {/* Search box inside directory */}
          <div className="flex items-center bg-[#FFFFFF] border border-[#111111] px-3 py-1.5 flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-[#666666] shrink-0 mr-2" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, district or tag..."
              className="w-full bg-transparent text-xs text-[#111111] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-[#666666] hover:text-[#111111]">
                Clear
              </button>
            )}
          </div>

          {/* District selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-[#666666]">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-[#FFFFFF] border border-[#111111] text-xs font-mono px-3 py-1.5 text-[#111111] outline-none"
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Proximity & Transit Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOnlyHighReliability(!onlyHighReliability)}
              className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                onlyHighReliability 
                  ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]' 
                  : 'bg-white text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
              }`}
            >
              <Train className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Reliable Routes (≥95%)</span>
            </button>

            <button
              onClick={() => setOnlyShortWalk(!onlyShortWalk)}
              className={`px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 border transition-colors ${
                onlyShortWalk 
                  ? 'bg-[#111111] text-white border-[#111111]' 
                  : 'bg-white text-[#111111] border-[#D9D9D4] hover:border-[#111111]'
              }`}
            >
              <span>Walk ≤5 min</span>
            </button>
          </div>

        </div>

      </div>

      {/* Cards Grid */}
      {filteredAttractions.length === 0 ? (
        <div className="border border-[#111111] bg-[#F5F5F2] p-12 text-center space-y-3">
          <p className="font-display text-xl text-[#111111]">No destinations matched your filters.</p>
          <p className="text-xs font-mono text-[#666666]">Try resetting filters or searching for another neighborhood.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDistrict('all');
              setSearchQuery('');
              setOnlyHighReliability(false);
              setOnlyShortWalk(false);
            }}
            className="px-4 py-2 bg-[#111111] text-white text-xs font-mono uppercase tracking-wider"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredAttractions.map((attraction) => {
            const nearestStop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);

            return (
              <article
                key={attraction.id}
                className="group border border-[#D9D9D4] hover:border-[#111111] bg-[#FFFFFF] flex flex-col justify-between transition-colors duration-200"
              >
                <div>
                  {/* Card Image with Truthful Fallback */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#111111] border-b border-[#D9D9D4]">
                    <img
                      src={attraction.image}
                      alt={attraction.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getCategoryFallbackImage(attraction.category);
                      }}
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-[1.02] transition-all duration-300"
                    />
                    
                    {/* Category pill */}
                    <div className="absolute top-3 left-3 bg-[#FFFFFF] border border-[#111111] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#111111]">
                      {attraction.category}
                    </div>

                    {/* District */}
                    <div className="absolute top-3 right-3 bg-[#FFFFFF]/90 border border-[#D9D9D4] px-2 py-0.5 text-[10px] font-mono text-[#111111]">
                      {attraction.district}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono text-[#666666]">
                        <span className="uppercase">{attraction.priceTier} · {attraction.priceSek}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#111111] text-[#111111]" />
                          <span className="font-bold text-[#111111]">{attraction.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-display font-bold text-[#111111] leading-snug group-hover:text-[#1E4D6B] transition-colors">
                        {attraction.name}
                      </h3>
                    </div>

                    <p className="text-xs text-[#666666] line-clamp-2 leading-relaxed">
                      {attraction.description}
                    </p>

                    {/* Monospace Transit Metadata Strip */}
                    {nearestStop && (
                      <div className="pt-2 border-t border-[#D9D9D4] flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-[#1E4D6B]">
                          <Train className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span className="truncate max-w-[170px]" title={nearestStop.name}>
                            {nearestStop.name}
                          </span>
                        </div>
                        <div className="text-[#666666] shrink-0">
                          {attraction.walkingTimeToStopMinutes} min walk · <span className="text-[#315C45] font-semibold">{nearestStop.onTimeRatePercent}%</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2 border-t border-[#D9D9D4] mt-2 pt-3">
                  <button
                    onClick={() => setActiveAttraction(attraction)}
                    className="py-2 px-3 text-xs font-mono uppercase tracking-wider border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  </button>

                  <button
                    onClick={() => onShowOnMap ? onShowOnMap(attraction.id) : setActiveAttraction(attraction)}
                    className="py-2 px-3 text-xs font-mono uppercase tracking-wider bg-[#F5F5F2] hover:bg-[#E8F0F4] text-[#1E4D6B] border border-[#D9D9D4] hover:border-[#1E4D6B] transition-colors flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-3 h-3" strokeWidth={1.5} />
                    <span>Show on Map</span>
                  </button>
                </div>

              </article>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeAttraction && (
        <AttractionDetailModal
          attraction={activeAttraction}
          nearestStop={STOCKHOLM_STOPS.find(s => s.id === activeAttraction.nearestStopId)}
          onClose={() => setActiveAttraction(null)}
          onSelectStop={onSelectStop}
          onShowOnMap={onShowOnMap}
        />
      )}

    </section>
  );
};
