import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AttractionDirectory } from './components/AttractionDirectory';
import { TransportHub } from './components/TransportHub';
import { RoutePlanner } from './components/RoutePlanner';
import { ReliabilityDashboard } from './components/ReliabilityDashboard';
import { TourismTransportIntegration } from './components/TourismTransportIntegration';
import { NaturalLanguageSearch } from './components/NaturalLanguageSearch';
import { ItineraryBuilder } from './components/ItineraryBuilder';
import { MapSection } from './components/MapSection';
import { Footer } from './components/Footer';
import { Attraction, ItineraryItem } from './types';
import { STOCKHOLM_ATTRACTIONS } from './data/stockholmData';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>('');
  const [routeOriginId, setRouteOriginId] = useState<string>('stop-t-centralen');
  const [routeDestId, setRouteDestId] = useState<string>('poi-vasa-museum');

  // LocalStorage-backed Itinerary state
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(() => {
    try {
      const saved = localStorage.getItem('stockholm_itinerary');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial seed itinerary
    return [
      { id: 'itin-1', attractionId: 'poi-gamla-stan-palace', dayNumber: 1, order: 1, scheduledTime: '09:30', durationMinutes: 120 },
      { id: 'itin-2', attractionId: 'poi-vasa-museum', dayNumber: 1, order: 2, scheduledTime: '12:30', durationMinutes: 120 },
      { id: 'itin-3', attractionId: 'poi-skansen', dayNumber: 1, order: 3, scheduledTime: '15:30', durationMinutes: 150 },
      { id: 'itin-4', attractionId: 'poi-meatballs-for-the-people', dayNumber: 1, order: 4, scheduledTime: '18:45', durationMinutes: 90 },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('stockholm_itinerary', JSON.stringify(itinerary));
    } catch (e) {
      console.error(e);
    }
  }, [itinerary]);

  // Handler: Hero Search bar
  const handleHeroSearch = (query: string) => {
    const qLower = query.toLowerCase();
    // If it looks like a complex natural language sentence, switch to Ask Stockholm
    if (qLower.startsWith('find') || qLower.startsWith('what') || qLower.startsWith('where') || qLower.includes('can i') || qLower.includes('reach by') || qLower.includes('within 1 km')) {
      setHeroSearchQuery(query);
      setActiveTab('ask');
    } else {
      setHeroSearchQuery(query);
      setActiveTab('explore');
    }
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Handler: Plan route to attraction
  const handlePlanRouteHere = (attractionOrStopId: string) => {
    setRouteDestId(attractionOrStopId);
    setActiveTab('routes');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Handler: Plan route from stop
  const handlePlanRouteFromStop = (stopId: string) => {
    setRouteOriginId(stopId);
    setActiveTab('routes');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Handler: Plan route between two specific items
  const handlePlanRouteBetween = (origId: string, destId: string) => {
    setRouteOriginId(origId);
    setRouteDestId(destId);
    setActiveTab('routes');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Handler: Add attraction to itinerary
  const handleAddToItinerary = (attraction: Attraction, dayNumber: number = 1) => {
    const sameDayItems = itinerary.filter(i => i.dayNumber === dayNumber);
    const newItem: ItineraryItem = {
      id: `itin-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      attractionId: attraction.id,
      dayNumber,
      order: sameDayItems.length + 1,
      scheduledTime: sameDayItems.length === 0 ? '10:00' : '14:00',
      durationMinutes: 90,
    };
    setItinerary(prev => [...prev, newItem]);
  };

  const handleQuickAddById = (attractionId: string, dayNumber: number = 1) => {
    const attraction = STOCKHOLM_ATTRACTIONS.find(a => a.id === attractionId);
    if (attraction) {
      handleAddToItinerary(attraction, dayNumber);
    }
  };

  const handleRemoveItineraryItem = (id: string) => {
    setItinerary(prev => prev.filter(i => i.id !== id));
  };

  const handleReorderItineraryItem = (id: string, direction: 'up' | 'down') => {
    setItinerary(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const dayItems = prev.filter(i => i.dayNumber === item.dayNumber).sort((a, b) => a.order - b.order);
      const currentIndex = dayItems.findIndex(i => i.id === id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= dayItems.length) return prev;

      // Swap orders
      const targetItem = dayItems[targetIndex];
      const newPrev = prev.map(i => {
        if (i.id === item.id) return { ...i, order: targetItem.order };
        if (i.id === targetItem.id) return { ...i, order: item.order };
        return i;
      });

      return newPrev;
    });
  };

  const handleClearItinerary = () => {
    if (window.confirm('Clear all destinations from your Stockholm itinerary?')) {
      setItinerary([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111] font-sans selection:bg-[#E8F0F4] selection:text-[#1E4D6B]">
      
      {/* Editorial Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        itineraryCount={itinerary.length}
        onOpenItinerary={() => {
          setActiveTab('itinerary');
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />

      {/* Hero Section (Visible across main exploratory views) */}
      {(activeTab === 'explore' || activeTab === 'map') && (
        <Hero
          onSearch={handleHeroSearch}
          onNavigateSection={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'explore' && (
          <div className="space-y-8">
            <AttractionDirectory
              onPlanRouteHere={handlePlanRouteHere}
              onAddToItinerary={(a) => handleAddToItinerary(a, 1)}
              onSelectStop={handlePlanRouteFromStop}
              externalSearchQuery={heroSearchQuery}
            />

            {/* Breakout: Tourism + Transport Synergies */}
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
              <TourismTransportIntegration
                onPlanRouteHere={handlePlanRouteHere}
                onAddToItinerary={(a) => handleAddToItinerary(a, 1)}
              />
            </div>
          </div>
        )}

        {activeTab === 'transport' && (
          <TransportHub
            onPlanFromStop={handlePlanRouteFromStop}
            onSelectAttraction={handlePlanRouteHere}
          />
        )}

        {activeTab === 'routes' && (
          <RoutePlanner
            initialOriginId={routeOriginId}
            initialDestinationId={routeDestId}
            onAddToItinerary={(a) => handleAddToItinerary(a, 1)}
          />
        )}

        {activeTab === 'reliability' && (
          <ReliabilityDashboard />
        )}

        {activeTab === 'ask' && (
          <NaturalLanguageSearch
            initialQuery={heroSearchQuery || 'Find museums near central Stockholm that I can reach by public transport'}
            onPlanRouteHere={handlePlanRouteHere}
            onAddToItinerary={(a) => handleAddToItinerary(a, 1)}
          />
        )}

        {activeTab === 'map' && (
          <MapSection
            onSelectAttraction={handlePlanRouteHere}
            onSelectStop={handlePlanRouteFromStop}
            onPlanRouteHere={handlePlanRouteHere}
            onAddToItinerary={(a) => handleAddToItinerary(a, 1)}
          />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryBuilder
            itinerary={itinerary}
            onRemoveItem={handleRemoveItineraryItem}
            onReorderItem={handleReorderItineraryItem}
            onAddItem={handleQuickAddById}
            onPlanRouteBetween={handlePlanRouteBetween}
            onClearItinerary={handleClearItinerary}
          />
        )}
      </main>

      {/* Scandinavian Minimalist Footer */}
      <Footer
        onNavigateSection={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }}
      />

    </div>
  );
}
export default App;
