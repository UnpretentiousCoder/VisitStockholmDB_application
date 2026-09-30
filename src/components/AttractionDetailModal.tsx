import React from 'react';
import { X, MapPin, Clock, Train, Star, Plus, Navigation, ExternalLink } from 'lucide-react';
import { Attraction, TransitStop } from '../types';

interface AttractionDetailModalProps {
  attraction: Attraction | null;
  nearestStop?: TransitStop;
  onClose: () => void;
  onPlanRouteHere: (attractionId: string) => void;
  onAddToItinerary: (attraction: Attraction) => void;
  onSelectStop: (stopId: string) => void;
}

export const AttractionDetailModal: React.FC<AttractionDetailModalProps> = ({
  attraction,
  nearestStop,
  onClose,
  onPlanRouteHere,
  onAddToItinerary,
  onSelectStop,
}) => {
  if (!attraction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-[2px]">
      <div 
        className="relative w-full max-w-3xl bg-[#FFFFFF] border-2 border-[#111111] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-[#FFFFFF] border-b border-[#111111] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#1E4D6B] font-semibold">
              {attraction.category} · {attraction.district}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#111111]">
          <img
            src={attraction.image}
            alt={attraction.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-[#FFFFFF] border border-[#111111] px-3 py-1 text-xs font-mono">
            {attraction.highlight}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#111111]">
                {attraction.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-mono bg-[#F5F5F2] border border-[#D9D9D4] px-2.5 py-1">
                <Star className="w-3.5 h-3.5 fill-[#111111] text-[#111111]" />
                <span className="font-bold">{attraction.rating.toFixed(1)}</span>
                <span className="text-[#666666]">({attraction.reviewsCount.toLocaleString()})</span>
              </div>
            </div>
            <p className="text-base text-[#111111] leading-relaxed font-sans">
              {attraction.longDescription}
            </p>
          </div>

          {/* Key Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#111111] bg-[#F5F5F2] p-4 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#1E4D6B] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Hours:</span>
                <span className="text-[#111111] font-semibold">{attraction.openingHours}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#1E4D6B] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Address:</span>
                <span className="text-[#111111] font-semibold">{attraction.address}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="text-[#1E4D6B] font-bold text-sm shrink-0">SEK</span>
              <div>
                <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Price Tier:</span>
                <span className="text-[#111111] font-semibold">{attraction.priceSek} ({attraction.priceTier})</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Train className="w-4 h-4 text-[#1E4D6B] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="text-[#666666] block uppercase tracking-wider text-[10px]">Transit Score:</span>
                <span className="text-[#315C45] font-semibold">{attraction.accessibilityScore} / 100 Excellent Access</span>
              </div>
            </div>
          </div>

          {/* Transport Connection Box */}
          {nearestStop && (
            <div className="border border-[#1E4D6B] bg-[#E8F0F4] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-[#1E4D6B]" strokeWidth={1.5} />
                    <span className="text-xs font-mono uppercase tracking-wider text-[#1E4D6B] font-bold">
                      Nearest SL Transit Stop
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onSelectStop(nearestStop.id);
                    }}
                    className="text-lg font-bold font-display text-[#111111] hover:underline flex items-center gap-1.5 mt-0.5 text-left"
                  >
                    <span>{nearestStop.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#1E4D6B]" />
                  </button>
                  <p className="text-xs text-[#111111] mt-1 font-mono">
                    {attraction.walkingTimeToStopMinutes} min walk · Lines: {nearestStop.linesServed.join(', ')}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right font-mono">
                  <div className="text-[10px] uppercase text-[#666666]">Stop Reliability</div>
                  <div className="text-sm font-bold text-[#315C45]">{nearestStop.onTimeRatePercent}% On-Time</div>
                  <div className="text-[10px] text-[#666666]">Avg delay {nearestStop.avgDelayMinutes} min</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {attraction.tags.map((tag, idx) => (
              <span key={idx} className="text-xs font-mono bg-[#F5F5F2] border border-[#D9D9D4] px-2.5 py-1 text-[#111111]">
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#D9D9D4] flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={() => {
                onAddToItinerary(attraction);
              }}
              className="px-5 py-3 border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span>Add to Itinerary</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onPlanRouteHere(attraction.id);
              }}
              className="px-6 py-3 bg-[#1E4D6B] text-white hover:bg-[#111111] transition-colors text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" strokeWidth={1.5} />
              <span>Get Public Transport Route</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
