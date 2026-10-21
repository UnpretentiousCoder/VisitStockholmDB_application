import React from 'react';
import { ArrowUp, Train } from 'lucide-react';

interface FooterProps {
  onNavigateSection: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t-2 border-[#111111] bg-[#F5F5F2] text-[#111111] mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-[#D9D9D4]">
          
          {/* Brand & Philosophy */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#111111]" />
              <span className="font-display font-bold text-xl tracking-tight">
                STOCKHOLM HOLIDAY PLANNER
              </span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed max-w-sm font-sans">
              Clarity through restraint. A database-driven Scandinavian city guide and SL public transport planning application uniting tourism, geographic transit, and real-time reliability analytics.
            </p>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#1E4D6B]">
              Explore · Navigate · Discover
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <span className="uppercase tracking-wider font-bold text-[#111111] block">
              Navigation
            </span>
            <ul className="space-y-2 text-[#666666]">
              <li>
                <button onClick={() => onNavigateSection('explore')} className="hover:text-[#111111] transition-colors">
                  → Explore Destinations
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('transport')} className="hover:text-[#111111] transition-colors">
                  → SL Transport Hub
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('weather')} className="hover:text-[#111111] transition-colors">
                  → Weather & Microclimates
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('reliability')} className="hover:text-[#111111] transition-colors">
                  → Historical Delay Analytics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('ask')} className="hover:text-[#111111] transition-colors">
                  → Ask Stockholm (Natural Language)
                </button>
              </li>
            </ul>
          </div>

          {/* Transit Specifications */}
          <div className="md:col-span-4 space-y-3 font-mono text-xs">
            <span className="uppercase tracking-wider font-bold text-[#111111] block">
              Transport System Metadata
            </span>
            <p className="text-[#666666] text-[11px] leading-relaxed">
              SL (Storstockholms Lokaltrafik) serves over 800,000 daily travelers across 100 metro stations, regional rail, commuter boats, and light rail.
            </p>
            <div className="border border-[#D9D9D4] bg-[#FFFFFF] p-2.5 text-[10px] text-[#111111]">
              <strong>Standard SL Single Ticket:</strong> 42 SEK valid for 75 minutes across all zones, ferries, and trains.
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#666666]">
          <div>
            © {new Date().getFullYear()} Stockholm Holiday Planner & SL Transit Database. Crafted with Scandinavian minimalism.
          </div>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-[#111111] hover:text-[#1E4D6B] transition-colors uppercase tracking-wider"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </footer>
  );
};
