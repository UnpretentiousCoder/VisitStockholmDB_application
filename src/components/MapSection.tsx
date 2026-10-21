import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Train, Search, Navigation, Plus, MapPin, Loader2, Compass, ExternalLink, ArrowRight } from 'lucide-react';
import { Attraction, TransitStop } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';

interface MapSectionProps {
  onSelectAttraction: (attractionId: string) => void;
  onSelectStop: (stopId: string) => void;
  initialSelectedAttractionId?: string | null;
}

interface OsmSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

// Stockholm geographical boundaries: restrict panning strictly to Stockholm metropolitan and archipelago area
const STOCKHOLM_BOUNDS = L.latLngBounds(
  [59.1800, 17.7500], // Southwest coordinate (Botkyrka/Huddinge/Farsta)
  [59.4800, 18.3800]  // Northeast coordinate (Täby/Lidingö/Nacka)
);

export const MapSection: React.FC<MapSectionProps> = ({
  onSelectAttraction,
  onSelectStop,
  initialSelectedAttractionId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);

  // Layer toggles
  const [showAttractions, setShowAttractions] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapStyle, setMapStyle] = useState<'osm-standard' | 'osm-hot' | 'osm-positron'>('osm-standard');
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  // OpenStreetMap Nominatim API search state
  const [osmQuery, setOsmQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OsmSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Quick navigation landmarks in Stockholm
  const stockholmHotspots = [
    { name: 'Stockholm Overview', coords: [59.3293, 18.0686] as [number, number], zoom: 12 },
    { name: 'City Center', coords: [59.3308, 18.0593] as [number, number], zoom: 14 },
    { name: 'Gamla Stan', coords: [59.3258, 18.0708] as [number, number], zoom: 15 },
    { name: 'Djurgården', coords: [59.3275, 18.1000] as [number, number], zoom: 14 },
    { name: 'Södermalm', coords: [59.3149, 18.0729] as [number, number], zoom: 14 },
    { name: 'Skeppsholmen', coords: [59.3255, 18.0837] as [number, number], zoom: 15 },
  ];

  // Tile layer configs
  const tileLayers = {
    'osm-standard': {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    },
    'osm-hot': {
      url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, Humanitarian OSM',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    },
    'osm-positron': {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; CARTO',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 19,
    },
  };

  // Initialize Leaflet map with strict Stockholm boundaries
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [59.3293, 18.0686], // Central Stockholm
        zoom: 13,
        minZoom: 11, // Restrict zoom-out so users stay within Stockholm
        maxZoom: 19,
        maxBounds: STOCKHOLM_BOUNDS, // Restrict panning strictly to Stockholm
        maxBoundsViscosity: 1.0, // Hard bounce: users cannot pan outside Stockholm bounds
        zoomControl: true,
        attributionControl: false,
      });

      // Add OpenStreetMap tile layer
      const activeTileConfig = tileLayers[mapStyle];
      const tiles = L.tileLayer(activeTileConfig.url, {
        maxZoom: activeTileConfig.maxZoom,
        subdomains: activeTileConfig.subdomains,
      }).addTo(map);

      // Attribution
      L.control.attribution({
        position: 'bottomright',
        prefix: 'OpenStreetMap API + Leaflet · Stockholm Bounds',
      }).addTo(map);

      tileLayerRef.current = tiles;
      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when mapStyle changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const activeTileConfig = tileLayers[mapStyle];
    const newTileLayer = L.tileLayer(activeTileConfig.url, {
      maxZoom: activeTileConfig.maxZoom,
      subdomains: activeTileConfig.subdomains,
      attribution: activeTileConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Update Markers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const routesGroup = routesLayerRef.current;
    if (!map || !markersGroup || !routesGroup) return;

    markersGroup.clearLayers();
    routesGroup.clearLayers();

    // 1. Draw Route Lines
    if (showRoutes) {
      STOCKHOLM_ROUTES.forEach((route) => {
        const stopCoords: [number, number][] = route.stops
          .map(sid => STOCKHOLM_STOPS.find(s => s.id === sid))
          .filter((s): s is TransitStop => s !== undefined)
          .map(s => [s.coordinates.lat, s.coordinates.lng]);

        if (stopCoords.length > 1) {
          const polyline = L.polyline(stopCoords, {
            color: route.mode === 'ferry' ? '#1E4D6B' : (route.mode === 'tram' ? '#76787B' : route.color),
            weight: 4,
            opacity: 0.85,
            dashArray: route.mode === 'ferry' ? '6 6' : undefined,
          });

          polyline.bindTooltip(`${route.lineCode} · ${route.name}`, {
            sticky: true,
            className: 'font-mono text-xs border border-[#111111] bg-[#FFFFFF] text-[#111111] p-1.5 shadow-none',
          });

          polyline.addTo(routesGroup);
        }
      });
    }

    // 2. Draw Transit Stops Markers
    if (showStops) {
      STOCKHOLM_STOPS.forEach((stop) => {
        const iconHtml = `
          <div style="
            width: 14px;
            height: 14px;
            background-color: #1E4D6B;
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 0 1.5px #111111;
            cursor: pointer;
          "></div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-stop-marker',
          html: iconHtml,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([stop.coordinates.lat, stop.coordinates.lng], { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 font-sans space-y-2';
        popupContent.innerHTML = `
          <div class="text-[10px] font-mono uppercase tracking-wider text-[#1E4D6B] font-bold">SL Transit Stop · OSM Layer</div>
          <div class="font-display font-bold text-sm text-[#111111]">${stop.name}</div>
          <div class="text-[11px] font-mono text-[#315C45] font-semibold">${stop.onTimeRatePercent}% On-Time · Avg delay ${stop.avgDelayMinutes}m</div>
          <div class="text-[10px] font-mono text-[#111111] border-t border-[#D9D9D4] pt-1">Lines: ${stop.linesServed.join(', ')}</div>
          <div class="pt-2 flex gap-1.5">
            <button id="btn-stop-inspect" class="px-3 py-1 bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider">Inspect Stop</button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          setSelectedItemName(stop.name);
          const btnInspect = popupContent.querySelector('#btn-stop-inspect');
          btnInspect?.addEventListener('click', () => onSelectStop(stop.id));
        });

        marker.addTo(markersGroup);
      });
    }

    // 3. Draw Attraction Markers
    if (showAttractions) {
      STOCKHOLM_ATTRACTIONS.forEach((attraction) => {
        const iconHtml = `
          <div style="
            width: 22px;
            height: 22px;
            background-color: #111111;
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            border-radius: 2px;
            box-shadow: 0 0 0 1.5px #111111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-family: 'Playfair Display', serif;
            font-weight: bold;
            cursor: pointer;
          ">
            ${attraction.name.charAt(0)}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: iconHtml,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([attraction.coordinates.lat, attraction.coordinates.lng], { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 font-sans space-y-2';
        popupContent.innerHTML = `
          <div class="text-[10px] font-mono uppercase tracking-wider text-[#1E4D6B] font-bold">${attraction.category} · ${attraction.district}</div>
          <div class="font-display font-bold text-sm text-[#111111]">${attraction.name}</div>
          <div class="text-xs text-[#666666] line-clamp-2">${attraction.description}</div>
          <div class="text-[10px] font-mono text-[#111111] border-t border-[#D9D9D4] pt-1">
            Nearest stop: ${STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId)?.name} (${attraction.walkingTimeToStopMinutes}m walk)
          </div>
          <div class="pt-2 flex gap-1.5">
            <button id="btn-poi-details" class="px-3 py-1 bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider">View Details</button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          setSelectedItemName(attraction.name);
          const btnDetails = popupContent.querySelector('#btn-poi-details');
          btnDetails?.addEventListener('click', () => onSelectAttraction(attraction.id));
        });

        marker.addTo(markersGroup);
      });
    }

    // Auto-focus on initial attraction if provided
    if (initialSelectedAttractionId && mapInstanceRef.current) {
      const match = STOCKHOLM_ATTRACTIONS.find(a => a.id === initialSelectedAttractionId);
      if (match) {
        mapInstanceRef.current.flyTo([match.coordinates.lat, match.coordinates.lng], 15, { duration: 1 });
        setSelectedItemName(match.name);
      }
    }

  }, [showAttractions, showStops, showRoutes]);

  // OpenStreetMap Nominatim API Geocoding Search
  const handleOsmSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osmQuery.trim()) return;

    setIsSearching(true);
    setShowDropdown(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          osmQuery.trim() + ', Stockholm'
        )}&viewbox=17.75,59.48,18.38,59.18&bounded=1&limit=5&addressdetails=1`
      );
      if (response.ok) {
        const data: OsmSearchResult[] = await response.json();
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('OpenStreetMap API error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectOsmResult = (result: OsmSearchResult) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const map = mapInstanceRef.current;

    if (map && !isNaN(lat) && !isNaN(lon)) {
      map.flyTo([lat, lon], 16, { duration: 1.2 });

      // Remove existing search marker
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      // Add highlighted search marker
      const osmPinHtml = `
        <div style="
          width: 24px;
          height: 24px;
          background-color: #8A641C;
          color: #FFFFFF;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        ">
          📍
        </div>
      `;

      const osmIcon = L.divIcon({
        className: 'osm-search-pin',
        html: osmPinHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const newMarker = L.marker([lat, lon], { icon: osmIcon }).addTo(map);
      newMarker.bindPopup(`
        <div class="p-3 font-sans space-y-1.5">
          <div class="text-[10px] font-mono uppercase text-[#8A641C] font-bold">OpenStreetMap Geocoded Location</div>
          <div class="font-display font-bold text-sm text-[#111111]">${result.display_name.split(',')[0]}</div>
          <div class="text-[11px] font-mono text-[#666666] line-clamp-2">${result.display_name}</div>
          <div class="text-[10px] font-mono text-[#111111] pt-1">Coords: ${lat.toFixed(4)}, ${lon.toFixed(4)}</div>
        </div>
      `).openPopup();

      searchMarkerRef.current = newMarker;
      setSelectedItemName(result.display_name.split(',')[0]);
      setShowDropdown(false);
    }
  };

  const flyToHotspot = (coords: [number, number], zoom: number) => {
    mapInstanceRef.current?.flyTo(coords, zoom, { duration: 1 });
  };

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            Cartographic Explorer · OpenStreetMap API & Leaflet Engine
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            Stockholm OpenStreetMap & SL Transit
          </h2>
        </div>

        {/* Tile Style Selector & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Map Tile Style Switcher */}
          <div className="flex items-center border border-[#111111] bg-[#FFFFFF] p-0.5 text-xs font-mono">
            <button
              onClick={() => setMapStyle('osm-standard')}
              className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                mapStyle === 'osm-standard'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'text-[#111111] hover:bg-[#F5F5F2]'
              }`}
            >
              OSM Standard
            </button>
            <button
              onClick={() => setMapStyle('osm-hot')}
              className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                mapStyle === 'osm-hot'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'text-[#111111] hover:bg-[#F5F5F2]'
              }`}
            >
              OSM Humanitarian
            </button>
            <button
              onClick={() => setMapStyle('osm-positron')}
              className={`px-2.5 py-1 uppercase tracking-wider transition-colors ${
                mapStyle === 'osm-positron'
                  ? 'bg-[#111111] text-white font-bold'
                  : 'text-[#111111] hover:bg-[#F5F5F2]'
              }`}
            >
              OSM Light
            </button>
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 bg-[#F5F5F2] border border-[#D9D9D4] p-1">
            <button
              onClick={() => setShowAttractions(!showAttractions)}
              className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                showAttractions ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#666666] border-[#D9D9D4]'
              }`}
            >
              ■ Sights ({STOCKHOLM_ATTRACTIONS.length})
            </button>

            <button
              onClick={() => setShowStops(!showStops)}
              className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                showStops ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]' : 'bg-white text-[#666666] border-[#D9D9D4]'
              }`}
            >
              ● SL Stops ({STOCKHOLM_STOPS.length})
            </button>

            <button
              onClick={() => setShowRoutes(!showRoutes)}
              className={`px-2.5 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
                showRoutes ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#666666] border-[#D9D9D4]'
              }`}
            >
              — SL Lines ({STOCKHOLM_ROUTES.length})
            </button>
          </div>

        </div>
      </div>

      {/* OpenStreetMap API Geocoding Search & Quick Navigation Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        
        {/* OpenStreetMap API Search Bar */}
        <div className="lg:col-span-7 relative">
          <form onSubmit={handleOsmSearch} className="flex border-2 border-[#111111] bg-[#FFFFFF]">
            <div className="flex items-center px-3.5 py-2 flex-1 gap-2">
              <Search className="w-4 h-4 text-[#666666] shrink-0" strokeWidth={1.5} />
              <input
                type="text"
                value={osmQuery}
                onChange={(e) => setOsmQuery(e.target.value)}
                placeholder="Search any Stockholm address or place via OpenStreetMap API (Nominatim)..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#111111] outline-none font-mono placeholder:text-[#888888]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-[#111111] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#1E4D6B] transition-colors flex items-center gap-1.5 shrink-0"
            >
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>OSM Search</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[500] mt-1 bg-[#FFFFFF] border-2 border-[#111111] shadow-lg max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-[#D9D9D4] bg-[#F5F5F2] text-[10px] font-mono uppercase tracking-wider text-[#666666] flex justify-between items-center">
                <span>OpenStreetMap Nominatim Matches</span>
                <button onClick={() => setShowDropdown(false)} className="hover:text-[#111111]">
                  Close
                </button>
              </div>
              <div className="divide-y divide-[#D9D9D4]">
                {searchResults.map((item) => (
                  <button
                    key={item.place_id}
                    type="button"
                    onClick={() => handleSelectOsmResult(item)}
                    className="w-full text-left p-2.5 hover:bg-[#E8F0F4] transition-colors flex items-start gap-2 text-xs font-mono"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#1E4D6B] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-[#111111] truncate">{item.display_name.split(',')[0]}</div>
                      <div className="text-[10px] text-[#666666] truncate">{item.display_name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stockholm Landmark Jumps */}
        <div className="lg:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-mono uppercase text-[#666666] shrink-0">Jump to:</span>
          {stockholmHotspots.map((spot, idx) => (
            <button
              key={idx}
              onClick={() => flyToHotspot(spot.coords, spot.zoom)}
              className="px-2.5 py-1 bg-[#FFFFFF] border border-[#D9D9D4] hover:border-[#111111] hover:bg-[#F5F5F2] text-[11px] font-mono whitespace-nowrap transition-colors"
            >
              {spot.name}
            </button>
          ))}
        </div>

      </div>

      {/* Large Map Container */}
      <div className="relative border-2 border-[#111111] overflow-hidden bg-[#F5F5F2]">
        
        {/* Map Canvas */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-[600px] sm:h-[680px] lg:h-[720px] z-0" 
        />

        {/* Minimalist Floating Info Card */}
        <div className="absolute top-4 left-4 z-[400] bg-[#FFFFFF] border border-[#111111] p-3 max-w-xs shadow-none text-xs font-mono space-y-1">
          <div className="text-[10px] uppercase text-[#666666]">Active Selection · OpenStreetMap</div>
          <div className="font-bold text-sm text-[#111111]">
            {selectedItemName || 'Click any pin, line, or stop on the map'}
          </div>
          <div className="text-[10px] text-[#666666]">
            Black squares = Attractions · Blue dots = SL Stations · Amber = OSM Search
          </div>
        </div>

        {/* Minimalist Legend Footer */}
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto z-[400] bg-[#FFFFFF]/95 border border-[#111111] px-4 py-2 text-xs font-mono flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#111111] border border-white inline-block" />
            <span>Attractions & Sights</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#1E4D6B] border border-white inline-block" />
            <span>SL Transit Stops</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-[#1E4D6B] inline-block" />
            <span>SL Metro / Ferry / Tram Lines</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#666666] border-l border-[#D9D9D4] pl-3">
            <span>Powered by OpenStreetMap API</span>
          </div>
        </div>

      </div>

    </section>
  );
};
