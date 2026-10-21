import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Cloud, 
  CloudFog, 
  Snowflake, 
  Wind, 
  Droplets, 
  Compass, 
  Calendar, 
  Clock, 
  RefreshCw, 
  Umbrella, 
  Ship, 
  Sparkles,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import { StockholmWeatherSummary, DistrictWeather, WeatherCondition } from '../types';
import { getStockholmDefaultWeather, fetchLiveStockholmWeather } from '../services/weatherService';

interface WeatherSectionProps {
  onNavigateToAttraction?: (attractionId: string) => void;
  onNavigateToDistrict?: (district: string) => void;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({
  onNavigateToDistrict
}) => {
  const [weatherData, setWeatherData] = useState<StockholmWeatherSummary>(getStockholmDefaultWeather);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'cards' | 'table'>('cards');

  // Attempt to fetch fresh data on mount (uses keyless Open-Meteo, falls back smoothly to calibrated default)
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      try {
        const live = await fetchLiveStockholmWeather();
        if (isMounted && live) {
          setWeatherData(live);
        }
      } catch {
        // Fallback already pre-set
      }
    };
    loadWeather();
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const fresh = await fetchLiveStockholmWeather();
      setWeatherData(fresh);
    } catch {
      setWeatherData(getStockholmDefaultWeather());
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  const getWeatherIcon = (condition: WeatherCondition, className = "w-5 h-5") => {
    switch (condition) {
      case 'clear':
        return <Sun className={`${className} text-amber-600`} />;
      case 'partly-cloudy':
        return <CloudSun className={`${className} text-slate-700`} />;
      case 'overcast':
        return <Cloud className={`${className} text-stone-600`} />;
      case 'light-rain':
        return <CloudRain className={`${className} text-[#1E4D6B]`} />;
      case 'snow':
        return <Snowflake className={`${className} text-sky-600`} />;
      case 'fog':
        return <CloudFog className={`${className} text-stone-500`} />;
      default:
        return <CloudSun className={`${className} text-slate-700`} />;
    }
  };

  const filteredDistricts = selectedDistrict === 'all' 
    ? weatherData.districts 
    : weatherData.districts.filter(d => d.district === selectedDistrict);

  return (
    <div className="bg-white text-[#111111]">
      {/* Editorial Header Section */}
      <div className="border-b border-[#111111] bg-[#F5F5F2] pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-mono tracking-widest uppercase bg-white border border-[#111111] mb-4">
                <Compass className="w-3.5 h-3.5 text-[#1E4D6B]" />
                Stockholm Meteorological Observatory
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#111111] tracking-tight leading-none mb-3">
                Current Weather & Conditions
              </h1>
              <p className="text-base sm:text-lg text-[#666666] max-w-2xl font-light">
                Microclimate observations, localized rainfall, and maritime wind tracking across Stockholm’s 14 interconnected islands.
              </p>
            </div>

            {/* Current Date & Refresh Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-white border border-[#111111] px-4 py-2.5 flex items-center gap-3 shadow-none">
                <Calendar className="w-4 h-4 text-[#1E4D6B]" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-mono text-[#666666]">Observation Date</div>
                  <div className="text-sm font-semibold text-[#111111]">{weatherData.currentDateFormatted}</div>
                </div>
              </div>

              <div className="bg-white border border-[#111111] px-4 py-2.5 flex items-center gap-3 shadow-none">
                <Clock className="w-4 h-4 text-[#1E4D6B]" />
                <div>
                  <div className="text-xs uppercase tracking-wider font-mono text-[#666666]">Local Time</div>
                  <div className="text-sm font-mono font-semibold text-[#111111]">{weatherData.currentTimeFormatted}</div>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-[#111111] hover:bg-[#1E4D6B] text-white px-4 py-3 flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                title="Refresh observations"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Updating...' : 'Sync Live'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metrics Strip */}
      <div className="border-b border-[#111111] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-r border-[#EBEBE6] pr-4 last:border-none">
              <div className="text-xs font-mono uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-[#1E4D6B]" /> Citywide Average
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                  {weatherData.overallTempC}°C
                </span>
                <span className="text-xs text-[#666666]">
                  Feels like {weatherData.overallFeelsLikeC}°C
                </span>
              </div>
              <div className="text-xs text-[#1E4D6B] font-medium mt-1">
                {weatherData.overallWeatherType}
              </div>
            </div>

            <div className="border-r border-[#EBEBE6] pr-4 last:border-none">
              <div className="text-xs font-mono uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#1E4D6B]" /> Precipitation Rate
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                  {weatherData.overallRainfallMm}
                </span>
                <span className="text-xs font-mono text-[#666666]">mm/h</span>
              </div>
              <div className="text-xs text-[#666666] mt-1">
                {weatherData.overallRainfallMm > 0.2 ? 'Light passing showers' : 'Mostly dry across islands'}
              </div>
            </div>

            <div className="border-r border-[#EBEBE6] pr-4 last:border-none">
              <div className="text-xs font-mono uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-[#1E4D6B]" /> Archipelago Wind
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                  {weatherData.overallWindKmh}
                </span>
                <span className="text-xs font-mono text-[#666666]">km/h WNW</span>
              </div>
              <div className="text-xs text-emerald-800 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Calm harbor waters
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5 text-[#1E4D6B]" /> Maritime Ferry Advisory
              </div>
              <div className="text-sm font-semibold text-[#111111]">
                Ferry 82 & 80 on normal schedule
              </div>
              <div className="text-xs text-[#666666] mt-1">
                Skeppsholmen & Djurgården maritime lines running normally with light harbor swells.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main District Microclimate Explorer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#111111]">
              District Weather Breakdown
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Temperature, precipitation, and conditions tailored to each major Stockholm neighborhood and island.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="inline-flex border border-[#111111] p-0.5 bg-[#F5F5F2]">
              <button
                onClick={() => setActiveView('cards')}
                className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeView === 'cards' 
                    ? 'bg-[#111111] text-white font-semibold' 
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeView === 'table' 
                    ? 'bg-[#111111] text-white font-semibold' 
                    : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                Table
              </button>
            </div>

            {/* District Filter Pill Bar */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="border border-[#111111] bg-white px-3 py-1.5 text-xs font-mono uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#1E4D6B]"
            >
              <option value="all">All Stockholm Districts ({weatherData.districts.length})</option>
              {weatherData.districts.map(d => (
                <option key={d.district} value={d.district}>{d.district}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Option 1: Editorial Cards Grid */}
        {activeView === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDistricts.map((d: DistrictWeather) => (
              <div 
                key={d.district}
                className="border border-[#111111] bg-white p-5 flex flex-col justify-between hover:border-[#1E4D6B] transition-colors relative"
              >
                {/* Header of Card */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#EBEBE6] pb-3 mb-3">
                    <div>
                      <h3 className="font-serif text-xl text-[#111111] font-semibold">{d.district}</h3>
                      <div className="text-xs text-[#1E4D6B] font-mono tracking-wide">{d.weatherType}</div>
                    </div>
                    <div className="p-2 bg-[#F5F5F2] border border-[#D9D9D4]">
                      {getWeatherIcon(d.condition, "w-6 h-6")}
                    </div>
                  </div>

                  {/* Temperature & Rainfall Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4 bg-[#F5F5F2] p-3 border border-[#EBEBE6]">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#666666]">Temperature</div>
                      <div className="font-mono text-2xl font-bold text-[#111111]">{d.temperatureC}°C</div>
                      <div className="text-[10px] text-[#666666]">Feels {d.feelsLikeC}°C</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#666666]">Rainfall</div>
                      <div className="font-mono text-2xl font-bold text-[#111111]">{d.rainfallMm} <span className="text-xs font-normal">mm</span></div>
                      <div className="text-[10px] text-[#1E4D6B]">{d.rainProbabilityPercent}% prob.</div>
                    </div>
                  </div>

                  {/* Secondary stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#666666] mb-4">
                    <div className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-[#111111]" />
                      <span>{d.windSpeedKmh} km/h {d.windDirection}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#111111]" />
                      <span>{d.humidityPercent}% humidity</span>
                    </div>
                  </div>

                  {/* Microclimate advisory */}
                  <div className="text-xs text-[#444444] bg-white border-l-2 border-[#1E4D6B] pl-2.5 py-1 mb-4 leading-relaxed">
                    {d.advisory}
                  </div>
                </div>

                {/* Footer with activity suggestion */}
                <div className="pt-3 border-t border-[#EBEBE6]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#1E4D6B]" /> Recommended for today
                  </div>
                  <p className="text-xs text-[#111111] line-clamp-2 leading-snug">
                    {d.bestActivity}
                  </p>

                  {onNavigateToDistrict && (
                    <button
                      onClick={() => onNavigateToDistrict(d.district)}
                      className="mt-3 w-full border border-[#111111] hover:bg-[#111111] hover:text-white text-[#111111] text-xs font-mono uppercase py-1.5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3 h-3" /> View District on Map
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Option 2: Precision Scandinavian Data Table */}
        {activeView === 'table' && (
          <div className="border border-[#111111] overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#111111] text-white text-xs font-mono uppercase tracking-wider">
                  <th className="p-3.5">District / Island</th>
                  <th className="p-3.5">Condition</th>
                  <th className="p-3.5 font-mono">Temp (°C)</th>
                  <th className="p-3.5 font-mono">Rainfall (mm/h)</th>
                  <th className="p-3.5 font-mono">Rain Prob.</th>
                  <th className="p-3.5 font-mono">Wind</th>
                  <th className="p-3.5">Microclimate Note & Best Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBE6] font-sans">
                {filteredDistricts.map((d: DistrictWeather, idx: number) => (
                  <tr key={d.district} className={`hover:bg-[#F5F5F2] ${idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}`}>
                    <td className="p-3.5 font-serif font-semibold text-base text-[#111111]">
                      {d.district}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getWeatherIcon(d.condition, "w-4 h-4")}
                        <span className="text-xs font-medium text-[#111111]">{d.weatherType}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-base font-bold text-[#111111]">
                      {d.temperatureC}° <span className="text-xs font-normal text-[#666666]">({d.feelsLikeC}°)</span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-[#111111]">
                      {d.rainfallMm} mm
                    </td>
                    <td className="p-3.5 font-mono text-[#1E4D6B] font-semibold">
                      {d.rainProbabilityPercent}%
                    </td>
                    <td className="p-3.5 font-mono text-xs text-[#666666]">
                      {d.windSpeedKmh} km/h {d.windDirection}
                    </td>
                    <td className="p-3.5 text-xs text-[#444444] max-w-md">
                      <div className="font-medium text-[#111111] mb-0.5">{d.advisory}</div>
                      <div className="text-[#666666] italic">{d.bestActivity}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hourly Forecast Curve / Timeline */}
        <div className="mt-14 border border-[#111111] bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-[#111111] pb-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#666666]">Today's Trajectory</div>
              <h3 className="font-serif text-2xl text-[#111111]">Hourly Forecast & Precipitation Curve</h3>
            </div>
            <div className="text-xs font-mono text-[#1E4D6B] flex items-center gap-1.5">
              <Umbrella className="w-3.5 h-3.5" />
              Highest rain probability between 14:00 - 16:00 (35%)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {weatherData.hourly.map((h) => (
              <div 
                key={h.hour}
                className="border border-[#D9D9D4] bg-[#F5F5F2] p-3 text-center flex flex-col justify-between hover:border-[#111111] transition-colors"
              >
                <div className="text-xs font-mono font-bold text-[#111111] pb-1 border-b border-[#EBEBE6]">
                  {h.hourLabel}
                </div>
                <div className="my-3 flex justify-center">
                  {getWeatherIcon(h.condition, "w-6 h-6")}
                </div>
                <div>
                  <div className="font-mono text-xl font-bold text-[#111111]">{h.tempC}°</div>
                  <div className="text-[11px] font-mono text-[#1E4D6B] mt-0.5">
                    {h.rainMm} mm
                  </div>
                  <div className="text-[10px] text-[#666666] mt-1 leading-tight line-clamp-1">
                    {h.weatherType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Day Outlook and Travel Packing Guidance */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 5-Day Outlook */}
          <div className="lg:col-span-2 border border-[#111111] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#111111] pb-4 mb-4">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-[#666666]">Extended Outlook</div>
                <h3 className="font-serif text-xl text-[#111111]">Stockholm 5-Day Projection</h3>
              </div>
              <Calendar className="w-5 h-5 text-[#1E4D6B]" />
            </div>

            <div className="space-y-3">
              {weatherData.daily.map((d) => (
                <div 
                  key={d.dateLabel}
                  className="flex items-center justify-between p-3 bg-[#F5F5F2] border border-[#EBEBE6] hover:border-[#111111] transition-colors"
                >
                  <div className="w-28">
                    <div className="font-serif font-semibold text-sm text-[#111111]">{d.dayName}</div>
                    <div className="text-xs font-mono text-[#666666]">{d.dateLabel}</div>
                  </div>

                  <div className="flex items-center gap-2 w-48">
                    {getWeatherIcon(d.condition, "w-5 h-5")}
                    <span className="text-xs text-[#111111]">{d.weatherType}</span>
                  </div>

                  <div className="w-24 text-center">
                    <div className="text-xs font-mono text-[#1E4D6B] font-semibold">{d.rainProbability}% rain</div>
                  </div>

                  <div className="w-24 text-right font-mono text-sm font-bold text-[#111111]">
                    {d.tempHighC}° <span className="text-xs font-normal text-[#666666]">/ {d.tempLowC}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scandinavian Packing & Weather Guidelines */}
          <div className="border border-[#111111] bg-[#F5F5F2] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-[#111111] pb-3 mb-4">
                <Info className="w-4 h-4 text-[#1E4D6B]" />
                <h3 className="font-serif text-lg text-[#111111] font-semibold">Stockholm Weather Insights</h3>
              </div>

              <div className="space-y-4 text-xs text-[#444444] leading-relaxed">
                <div>
                  <h4 className="font-mono uppercase font-bold text-[#111111] mb-1">Cobblestone Walking</h4>
                  <p>Gamla Stan cobblestones become slippery during light rain. Sturdy, low-profile walking boots with grip soles are recommended.</p>
                </div>

                <div>
                  <h4 className="font-mono uppercase font-bold text-[#111111] mb-1">Archipelago Layering</h4>
                  <p>Temperatures can drop 2–3°C on Djurgården, Skeppsholmen, or when standing on the outer deck of SL Ferry 82. Pack a windproof outer shell.</p>
                </div>

                <div>
                  <h4 className="font-mono uppercase font-bold text-[#111111] mb-1">Rainy Hour Alternatives</h4>
                  <p>Stockholm’s underground metro stations (T-Centralen, Kungsträdgården) double as world-class rock art galleries, completely sheltered from showers.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#D9D9D4] text-[11px] font-mono text-[#666666]">
              Observations updated continuously via Swedish meteorological indices and Open-Meteo European models.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
