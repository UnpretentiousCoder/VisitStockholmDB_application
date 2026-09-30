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

export interface JourneyStep {
  id: string;
  type: 'walk' | 'board' | 'transfer' | 'arrive';
  instruction: string;
  mode?: TransportMode;
  lineCode?: string;
  lineName?: string;
  fromStopName?: string;
  toStopName?: string;
  durationMinutes: number;
  distanceMeters?: number;
  stopsCount?: number;
  intermediateStops?: string[];
  status?: PunctualityStatus;
  delayAlert?: string;
}

export interface JourneyOption {
  id: string;
  originName: string;
  destinationName: string;
  totalDurationMinutes: number;
  walkingMinutes: number;
  transitMinutes: number;
  transfersCount: number;
  departureTime: string;
  arrivalTime: string;
  overallReliability: number;
  status: PunctualityStatus;
  steps: JourneyStep[];
}

export interface ItineraryItem {
  id: string;
  attractionId: string;
  dayNumber: number;
  order: number;
  scheduledTime: string;
  durationMinutes: number;
  customNotes?: string;
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
