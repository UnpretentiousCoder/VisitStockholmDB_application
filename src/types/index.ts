export type AttractionCategory = 
  | 'museum'
  | 'historic'
  | 'dining'
  | 'fika'
  | 'hotel'
  | 'viewpoint'
  | 'park';

export type District = 
  | 'Gamla Stan'
  | 'Norrmalm'
  | 'Södermalm'
  | 'Djurgården'
  | 'Östermalm'
  | 'Kungsholmen'
  | 'Skeppsholmen'
  | 'Vasastan';

export type TransportMode = 
  | 'metro'
  | 'tram'
  | 'ferry'
  | 'commuter_train'
  | 'bus';

export type PunctualityStatus = 'on-time' | 'moderate-delay' | 'significant-delay';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Attraction {
  id: string;
  name: string;
  category: AttractionCategory;
  district: District;
  description: string;
  longDescription: string;
  image: string;
  rating: number;
  reviewsCount: number;
  priceTier: 'free' | '€' | '€€' | '€€€';
  priceSek: string;
  openingHours: string;
  address: string;
  coordinates: Coordinates;
  nearestStopId: string;
  walkingTimeToStopMinutes: number;
  tags: string[];
  accessibilityScore: number; // 0-100 transit accessibility index
  highlight: string;
}

export interface TransitStop {
  id: string;
  name: string;
  district: District;
  coordinates: Coordinates;
  linesServed: string[];
  modes: TransportMode[];
  avgDelayMinutes: number;
  onTimeRatePercent: number; // e.g. 94.5%
  delayedRatePercent: number;
  dailyDepartures: number;
  status: PunctualityStatus;
  description: string;
  wheelchairAccessible: boolean;
  hasElevator: boolean;
}

export interface TransitRoute {
  id: string;
  lineCode: string;
  name: string;
  mode: TransportMode;
  color: string;
  textColor: string;
  description: string;
  stops: string[]; // stop IDs in sequential order
  frequencyMinutesPeak: number;
  frequencyMinutesOffPeak: number;
  avgDelayMinutes: number;
  onTimeRatePercent: number;
  status: PunctualityStatus;
  activeDisruptionAlert?: string;
  operatingHours: string;
}

export interface HourlyDelayRecord {
  hour: number; // 0 to 23
  hourLabel: string; // "06:00", "07:00", etc.
  avgDelayMinutes: number;
  delayedServicesRate: number; // percentage
  totalServices: number;
}

export interface RoutePerformanceRecord {
  routeId: string;
  lineCode: string;
  mode: TransportMode;
  name: string;
  avgDelayMinutes: number;
  delayRatePercent: number;
  onTimeRatePercent: number;
  totalServicesMonitored: number;
  reliabilityScore: number;
  status: PunctualityStatus;
  primaryDisruptionCause?: string;
}

export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'light-rain'
  | 'rain'
  | 'drizzle'
  | 'fog'
  | 'snow';

export interface DistrictWeather {
  district: District;
  temperatureC: number;
  feelsLikeC: number;
  rainfallMm: number;
  rainProbabilityPercent: number;
  weatherType: string;
  condition: WeatherCondition;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirection: string;
  uvIndex: number;
  advisory: string;
  ferryStatus: 'smooth' | 'moderate' | 'choppy';
  bestActivity: string;
}

export interface HourlyWeatherItem {
  hourLabel: string; // e.g. "08:00"
  hour: number;
  tempC: number;
  rainMm: number;
  rainProbability: number;
  condition: WeatherCondition;
  weatherType: string;
}

export interface DailyWeatherItem {
  dayName: string; // e.g. "Today", "Mon", "Tue"
  dateLabel: string; // e.g. "18 Oct"
  tempHighC: number;
  tempLowC: number;
  rainProbability: number;
  condition: WeatherCondition;
  weatherType: string;
}

export interface StockholmWeatherSummary {
  currentDateFormatted: string; // e.g. "Sunday, 18 October 2026"
  currentTimeFormatted: string; // e.g. "14:30 CEST"
  overallTempC: number;
  overallFeelsLikeC: number;
  overallRainfallMm: number;
  overallRainProbability: number;
  overallWeatherType: string;
  overallCondition: WeatherCondition;
  overallHumidity: number;
  overallWindKmh: number;
  districts: DistrictWeather[];
  hourly: HourlyWeatherItem[];
  daily: DailyWeatherItem[];
}

export interface NaturalQueryFilter {
  category?: AttractionCategory;
  district?: District;
  maxTransitMinutes?: number;
  maxWalkingMinutes?: number;
  modePreference?: TransportMode;
  highReliabilityOnly?: boolean;
  keywords: string[];
}

export interface NaturalQueryResult {
  query: string;
  interpretedIntent: string;
  appliedFilters: string[];
  matchedAttractions: Attraction[];
  transitAdvice: string;
  confidenceScore: number;
}
