import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AttractionDirectory } from './components/AttractionDirectory';
import { TransportHub } from './components/TransportHub';
import { WeatherSection } from './components/WeatherSection';
import { ReliabilityDashboard } from './components/ReliabilityDashboard';
import { TourismTransportIntegration } from './components/TourismTransportIntegration';
import { NaturalLanguageSearch } from './components/NaturalLanguageSearch';
import { MapSection } from './components/MapSection';
import { Footer } from './components/Footer';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>('');
  const [selectedAttractionForMap, setSelectedAttractionForMap] = useState<string | null>(null);

  // Handler: Hero Search bar
  const handleHeroSearch = (query: string) => {
    const qLower = query.toLowerCase().trim();
    const isNaturalLanguage = 
      qLower.split(/\s+/).length > 2 ||
      qLower.startsWith('find') || 
      qLower.startsWith('what') || 
      qLower.startsWith('where') || 
      qLower.startsWith('best') || 
      qLower.startsWith('show') || 
      qLower.includes('near') || 
      qLower.includes('can i') || 
      qLower.includes('reach by') || 
      qLower.includes('within');

    if (isNaturalLanguage) {
      setHeroSearchQuery(query);
      setActiveTab('ask');
    } else {
      setHeroSearchQuery(query);
      setActiveTab('explore');
    }
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Handler: Show an attraction or stop on the interactive map
  const handleShowOnMap = (id: string) => {
    setSelectedAttractionForMap(id);
    setActiveTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#111111] font-sans selection:bg-[#E8F0F4] selection:text-[#1E4D6B]">
      
      {/* Editorial Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Hero Section (Visible only on Explore home page) */}
      {activeTab === 'explore' && (
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
              onShowOnMap={handleShowOnMap}
              externalSearchQuery={heroSearchQuery}
            />

            {/* Breakout: Tourism + Transport Synergies */}
            <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
              <TourismTransportIntegration
                onShowOnMap={handleShowOnMap}
              />
            </div>
          </div>
        )}

        {activeTab === 'transport' && (
          <TransportHub
            onShowOnMap={handleShowOnMap}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherSection
            onNavigateToDistrict={() => {
              setActiveTab('map');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'reliability' && (
          <ReliabilityDashboard />
        )}

        {activeTab === 'ask' && (
          <NaturalLanguageSearch
            initialQuery={heroSearchQuery || 'Find museums near central Stockholm that I can reach by public transport'}
            onShowOnMap={handleShowOnMap}
          />
        )}

        {activeTab === 'map' && (
          <MapSection
            initialSelectedAttractionId={selectedAttractionForMap}
            onSelectAttraction={(attractionId) => {
              setSelectedAttractionForMap(attractionId);
            }}
            onSelectStop={() => {}}
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
