import { HourlyDelayRecord, RoutePerformanceRecord, PunctualityStatus } from '../types';
import { HOURLY_DELAY_DATA, ROUTE_PERFORMANCE_DATA, STOCKHOLM_STOPS } from '../data/stockholmData';

export interface SystemReliabilitySummary {
  overallOnTimeRate: number; // e.g. 95.1%
  avgDelayMinutes: number; // e.g. 2.1 min
  totalServicesMonitored: number; // e.g. 51,700
  activeAlertsCount: number;
  bestPerformingRoute: string;
  bestPerformingStop: string;
}

export function getSystemReliabilitySummary(): SystemReliabilitySummary {
  const totalMonitored = ROUTE_PERFORMANCE_DATA.reduce((acc, r) => acc + r.totalServicesMonitored, 0);
  const weightedSum = ROUTE_PERFORMANCE_DATA.reduce((acc, r) => acc + (r.onTimeRatePercent * r.totalServicesMonitored), 0);
  const avgDelayWeighted = ROUTE_PERFORMANCE_DATA.reduce((acc, r) => acc + (r.avgDelayMinutes * r.totalServicesMonitored), 0);

  const bestRoute = [...ROUTE_PERFORMANCE_DATA].sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
  const bestStop = [...STOCKHOLM_STOPS].sort((a, b) => b.onTimeRatePercent - a.onTimeRatePercent)[0];

  return {
    overallOnTimeRate: Number((weightedSum / totalMonitored).toFixed(1)),
    avgDelayMinutes: Number((avgDelayWeighted / totalMonitored).toFixed(1)),
    totalServicesMonitored: totalMonitored,
    activeAlertsCount: 1,
    bestPerformingRoute: bestRoute ? `${bestRoute.lineCode} (${bestRoute.reliabilityScore}%)` : 'Ferry 82',
    bestPerformingStop: bestStop ? `${bestStop.name} (${bestStop.onTimeRatePercent}%)` : 'Nybroplan',
  };
}

export function getHourlyDelayData(): HourlyDelayRecord[] {
  return HOURLY_DELAY_DATA;
}

export function getRoutePerformanceData(): RoutePerformanceRecord[] {
  return ROUTE_PERFORMANCE_DATA;
}

export function getStatusBadgeConfig(status: PunctualityStatus): {
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
} {
  switch (status) {
    case 'on-time':
      return {
        label: 'ON TIME',
        badgeBg: '#F0F7F3',
        textColor: '#315C45',
        borderColor: '#315C45',
      };
    case 'moderate-delay':
      return {
        label: 'MODERATE DELAY',
        badgeBg: '#FDF7EB',
        textColor: '#8A641C',
        borderColor: '#8A641C',
      };
    case 'significant-delay':
      return {
        label: 'DISRUPTION',
        badgeBg: '#FDF1F1',
        textColor: '#8A3333',
        borderColor: '#8A3333',
      };
    default:
      return {
        label: 'NORMAL',
        badgeBg: '#F5F5F2',
        textColor: '#111111',
        borderColor: '#D9D9D4',
      };
  }
}
