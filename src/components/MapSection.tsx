import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Train, Compass, MapPin, Navigation, Plus, Eye } from 'lucide-react';
import { Attraction, TransitStop } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';

interface MapSectionProps {
  onSelectAttraction: (attractionId: string) => void;
  onSelectStop: (stopId: string) => void;
  onPlanRouteHere: (id: string) => void;
  onAddToItinerary: (attraction: Attraction) => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
  onSelectAttraction,
  onSelectStop,
  onPlanRouteHere,
  onAddToItinerary,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);

  const [showAttractions, setShowAttractions] = useState(true);
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet map
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [59.3285, 18.0750], // Central Stockholm
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      // CartoDB Positron - Scandinavian monochrome editorial base
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomright', prefix: '© OpenStreetMap, © CARTO' }).addTo(map);

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

  // Update markers and polylines when filters change
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
            weight: 3.5,
            opacity: 0.8,
            dashArray: route.mode === 'ferry' ? '6 6' : undefined,
          });

          polyline.bindTooltip(`${route.lineCode} · ${route.name}`, {
            sticky: true,
            className: 'font-mono text-xs border border-[#111111] bg-[#FFFFFF] text-[#111111] p-1.5',
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
            box-shadow: 0 0 0 1px #111111;
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
          <div class="text-[10px] font-mono uppercase tracking-wider text-[#666666]">SL Transit Stop</div>
          <div class="font-display font-bold text-sm text-[#111111]">${stop.name}</div>
          <div class="text-[11px] font-mono text-[#315C45] font-semibold">${stop.onTimeRatePercent}% On-Time · Avg delay ${stop.avgDelayMinutes}m</div>
          <div class="text-[10px] font-mono text-[#111111] border-t border-[#D9D9D4] pt-1">Lines: ${stop.linesServed.join(', ')}</div>
          <div class="pt-2 flex gap-1.5">
            <button id="btn-stop-plan" class="px-2 py-1 bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider">Plan From Here</button>
            <button id="btn-stop-inspect" class="px-2 py-1 border border-[#111111] text-[10px] font-mono uppercase tracking-wider">Details</button>
          </div>
        `;

        // Bind interactive events
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          setSelectedItemName(stop.name);
          const btnPlan = popupContent.querySelector('#btn-stop-plan');
          const btnInspect = popupContent.querySelector('#btn-stop-inspect');
          btnPlan?.addEventListener('click', () => onPlanRouteHere(stop.id));
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
            width: 20px;
            height: 20px;
            background-color: #111111;
            color: #FFFFFF;
            border: 2px solid #FFFFFF;
            border-radius: 2px;
            box-shadow: 0 0 0 1px #111111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
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
          iconSize: [20, 20],
          iconAnchor: [10, 10],
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
            <button id="btn-poi-route" class="px-2 py-1 bg-[#1E4D6B] text-white text-[10px] font-mono uppercase tracking-wider">Get Route</button>
            <button id="btn-poi-add" class="px-2 py-1 bg-[#111111] text-white text-[10px] font-mono uppercase tracking-wider">+ Itinerary</button>
            <button id="btn-poi-details" class="px-2 py-1 border border-[#111111] text-[10px] font-mono uppercase tracking-wider">Details</button>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          setSelectedItemName(attraction.name);
          const btnRoute = popupContent.querySelector('#btn-poi-route');
          const btnAdd = popupContent.querySelector('#btn-poi-add');
          const btnDetails = popupContent.querySelector('#btn-poi-details');
          btnRoute?.addEventListener('click', () => onPlanRouteHere(attraction.id));
          btnAdd?.addEventListener('click', () => onAddToItinerary(attraction));
          btnDetails?.addEventListener('click', () => onSelectAttraction(attraction.id));
        });

        marker.addTo(markersGroup);
      });
    }

  }, [showAttractions, showStops, showRoutes]);

  return (
    <section className="py-12 lg:py-16 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#666666] block mb-1">
            Cartographic Explorer · SL Transit Overlays
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111111]">
            Stockholm City & Transit Map
          </h2>
        </div>

        {/* Layer Toggle Badges */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F5F5F2] border border-[#D9D9D4] p-2">
          <span className="text-[10px] font-mono uppercase text-[#666666] flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Layers:</span>
          </span>

          <button
            onClick={() => setShowAttractions(!showAttractions)}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
              showAttractions ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#666666] border-[#D9D9D4]'
            }`}
          >
            ■ Sights ({STOCKHOLM_ATTRACTIONS.length})
          </button>

          <button
            onClick={() => setShowStops(!showStops)}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
              showStops ? 'bg-[#1E4D6B] text-white border-[#1E4D6B]' : 'bg-white text-[#666666] border-[#D9D9D4]'
            }`}
          >
            ● SL Stops ({STOCKHOLM_STOPS.length})
          </button>

          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-3 py-1 text-xs font-mono uppercase tracking-wider border transition-colors ${
              showRoutes ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white text-[#666666] border-[#D9D9D4]'
            }`}
          >
            — SL Lines ({STOCKHOLM_ROUTES.length})
          </button>
        </div>
      </div>

      {/* Large Map Container */}
      <div className="relative border-2 border-[#111111] overflow-hidden bg-[#F5F5F2]">
        
        {/* Map Canvas */}
        <div 
          ref={mapContainerRef} 
          className="w-full h-[540px] sm:h-[620px] z-0" 
        />

        {/* Minimalist Floating Info Card */}
        <div className="absolute top-4 left-4 z-[400] bg-[#FFFFFF] border border-[#111111] p-3 max-w-xs shadow-none text-xs font-mono space-y-1">
          <div className="text-[10px] uppercase text-[#666666]">Selected Reference</div>
          <div className="font-bold text-sm text-[#111111]">
            {selectedItemName || 'Click any pin or stop on the map'}
          </div>
          <div className="text-[10px] text-[#666666]">
            Monochrome pins = Sights & Hotels · Blue circles = SL Stations
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
            <span>Metro / Ferry / Tram Route Lines</span>
          </div>
        </div>

      </div>

    </section>
  );
};
