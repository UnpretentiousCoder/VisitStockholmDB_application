import React, { useState } from 'react';
import { Compass, Train, Navigation, BarChart3, Sparkles, MapPin, Calendar, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  itineraryCount: number;
  onOpenItinerary: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  itineraryCount,
  onOpenItinerary,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'transport', label: 'Transport', icon: Train },
    { id: 'routes', label: 'Plan Route', icon: Navigation },
    { id: 'reliability', label: 'Reliability', icon: BarChart3 },
    { id: 'ask', label: 'Ask Stockholm', icon: Sparkles },
    { id: 'map', label: 'Map', icon: MapPin },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#111111]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand mark */}
          <div 
            onClick={() => handleNavClick('explore')}
            className="cursor-pointer group flex flex-col justify-center"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#111111] inline-block transition-transform duration-200 group-hover:scale-125" />
              <span className="font-display font-bold tracking-tight text-xl sm:text-2xl text-[#111111]">
                STOCKHOLM
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#666666] pl-4">
              Holiday Planner · SL Transit
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3.5 py-2 text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#1E4D6B] font-semibold'
                      : 'text-[#111111] hover:text-[#1E4D6B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E4D6B]' : 'text-[#666666]'}`} strokeWidth={1.5} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#1E4D6B]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={onOpenItinerary}
              className="relative px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[#111111] border border-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] transition-all flex items-center gap-2"
              title="Open Itinerary"
            >
              <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Itinerary</span>
              {itineraryCount > 0 && (
                <span className="px-1.5 py-0.2 bg-[#1E4D6B] text-white text-[10px] font-mono font-semibold rounded-none">
                  {itineraryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNavClick('routes')}
              className="px-5 py-2.5 text-xs font-mono uppercase tracking-wider bg-[#111111] text-[#FFFFFF] hover:bg-[#1E4D6B] transition-colors"
            >
              Plan My Trip
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenItinerary}
              className="p-2 border border-[#111111] relative text-[#111111]"
            >
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              {itineraryCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#1E4D6B] text-white text-[9px] w-4 h-4 flex items-center justify-center font-mono">
                  {itineraryCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-[#111111] text-[#111111]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#D9D9D4] bg-[#FFFFFF] px-4 py-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm ${
                  isActive ? 'bg-[#F5F5F2] font-semibold text-[#1E4D6B]' : 'text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-1.5 bg-[#1E4D6B]" />}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => handleNavClick('routes')}
              className="w-full py-3 bg-[#111111] text-[#FFFFFF] text-xs font-mono uppercase tracking-wider"
            >
              Plan My Trip
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
