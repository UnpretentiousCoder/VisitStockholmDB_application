import { 
  JourneyOption, 
  JourneyStep, 
  TransitStop, 
  TransitRoute, 
  Attraction,
  PunctualityStatus 
} from '../types';
import { STOCKHOLM_STOPS, STOCKHOLM_ROUTES, STOCKHOLM_ATTRACTIONS } from '../data/stockholmData';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function findStopById(id: string): TransitStop | undefined {
  return STOCKHOLM_STOPS.find(s => s.id === id);
}

export function findAttractionById(id: string): Attraction | undefined {
  return STOCKHOLM_ATTRACTIONS.find(a => a.id === id);
}

export function findDirectRoutes(originStopId: string, destStopId: string): TransitRoute[] {
  return STOCKHOLM_ROUTES.filter(route => 
    route.stops.includes(originStopId) && route.stops.includes(destStopId)
  );
}

export function calculateJourney(
  originId: string,
  destinationId: string,
  departureTimeStr: string = '10:00'
): JourneyOption[] {
  if (originId === destinationId) return [];

  // Determine origin entity (attraction or stop)
  const originAttraction = findAttractionById(originId);
  const originStop = originAttraction ? findStopById(originAttraction.nearestStopId) : findStopById(originId);

  // Determine destination entity (attraction or stop)
  const destAttraction = findAttractionById(destinationId);
  const destStop = destAttraction ? findStopById(destAttraction.nearestStopId) : findStopById(destinationId);

  if (!originStop || !destStop) return [];

  const originName = originAttraction ? originAttraction.name : originStop.name;
  const destinationName = destAttraction ? destAttraction.name : destStop.name;
  const destName = destinationName;

  const results: JourneyOption[] = [];

  // Check if same stop
  if (originStop.id === destStop.id) {
    const walkTime = (originAttraction ? originAttraction.walkingTimeToStopMinutes : 0) + 
                     (destAttraction ? destAttraction.walkingTimeToStopMinutes : 0) + 2;
    results.push({
      id: 'opt-walk-direct',
      originName,
      destinationName,
      totalDurationMinutes: walkTime,
      walkingMinutes: walkTime,
      transitMinutes: 0,
      transfersCount: 0,
      departureTime: departureTimeStr,
      arrivalTime: addMinutesToTime(departureTimeStr, walkTime),
      overallReliability: 99,
      status: 'on-time',
      steps: [
        {
          id: 'step-w1',
          type: 'walk',
          instruction: `Walk from ${originName} directly to ${destName}`,
          durationMinutes: walkTime,
          distanceMeters: Math.round(walkTime * 70),
        },
        {
          id: 'step-a1',
          type: 'arrive',
          instruction: `Arrive at ${destName}`,
          durationMinutes: 0,
        }
      ]
    });
    return results;
  }

  // 1. Check for Direct Routes
  const directRoutes = findDirectRoutes(originStop.id, destStop.id);

  if (directRoutes.length > 0) {
    directRoutes.forEach((route, index) => {
      const walkFromOrigin = originAttraction ? originAttraction.walkingTimeToStopMinutes : 2;
      const walkToDest = destAttraction ? destAttraction.walkingTimeToStopMinutes : 2;
      
      const originIndex = route.stops.indexOf(originStop.id);
      const destIndex = route.stops.indexOf(destStop.id);
      const stopsCount = Math.abs(destIndex - originIndex);
      const transitDuration = Math.max(3, stopsCount * (route.mode === 'ferry' ? 4 : 2.5));
      const totalDuration = Math.round(walkFromOrigin + transitDuration + walkToDest);

      const intermediate = route.stops
        .slice(Math.min(originIndex, destIndex) + 1, Math.max(originIndex, destIndex))
        .map(sid => findStopById(sid)?.name || sid);

      const steps: JourneyStep[] = [
        {
          id: `step-${index}-w1`,
          type: 'walk',
          instruction: `Walk ${walkFromOrigin} min to ${originStop.name}`,
          durationMinutes: walkFromOrigin,
          distanceMeters: Math.round(walkFromOrigin * 75),
        },
        {
          id: `step-${index}-b1`,
          type: 'board',
          instruction: `Board ${route.lineCode} (${route.mode.toUpperCase()}) toward destination`,
          mode: route.mode,
          lineCode: route.lineCode,
          lineName: route.name,
          fromStopName: originStop.name,
          toStopName: destStop.name,
          durationMinutes: Math.round(transitDuration),
          stopsCount,
          intermediateStops: intermediate,
          status: route.status,
          delayAlert: route.activeDisruptionAlert,
        },
        {
          id: `step-${index}-w2`,
          type: 'walk',
          instruction: `Walk ${walkToDest} min from ${destStop.name} to ${destName}`,
          durationMinutes: walkToDest,
          distanceMeters: Math.round(walkToDest * 75),
        },
        {
          id: `step-${index}-arr`,
          type: 'arrive',
          instruction: `Arrive at ${destName}`,
          durationMinutes: 0,
        }
      ];

      results.push({
        id: `journey-direct-${route.id}`,
        originName,
        destinationName,
        totalDurationMinutes: totalDuration,
        walkingMinutes: walkFromOrigin + walkToDest,
        transitMinutes: Math.round(transitDuration),
        transfersCount: 0,
        departureTime: departureTimeStr,
        arrivalTime: addMinutesToTime(departureTimeStr, totalDuration),
        overallReliability: route.onTimeRatePercent,
        status: route.status,
        steps,
      });
    });
  }

  // 2. Transfer via T-Centralen or Slussen if not already direct
  const transferHubs = ['stop-t-centralen', 'stop-slussen', 'stop-nybroplan'];
  
  for (const hubId of transferHubs) {
    if (originStop.id === hubId || destStop.id === hubId) continue;

    const leg1Routes = findDirectRoutes(originStop.id, hubId);
    const leg2Routes = findDirectRoutes(hubId, destStop.id);

    if (leg1Routes.length > 0 && leg2Routes.length > 0) {
      const r1 = leg1Routes[0];
      const r2 = leg2Routes[0];
      const hubStop = findStopById(hubId);

      const walkFromOrigin = originAttraction ? originAttraction.walkingTimeToStopMinutes : 2;
      const walkToDest = destAttraction ? destAttraction.walkingTimeToStopMinutes : 2;

      const durLeg1 = Math.max(3, Math.round(Math.abs(r1.stops.indexOf(hubId) - r1.stops.indexOf(originStop.id)) * 2.5));
      const durLeg2 = Math.max(3, Math.round(Math.abs(r2.stops.indexOf(destStop.id) - r2.stops.indexOf(hubId)) * (r2.mode === 'ferry' ? 4 : 2.5)));
      const transferBuffer = 4; // minutes to change platforms
      const totalDuration = walkFromOrigin + durLeg1 + transferBuffer + durLeg2 + walkToDest;

      const steps: JourneyStep[] = [
        {
          id: `step-hub-${hubId}-w1`,
          type: 'walk',
          instruction: `Walk ${walkFromOrigin} min to ${originStop.name}`,
          durationMinutes: walkFromOrigin,
          distanceMeters: Math.round(walkFromOrigin * 75),
        },
        {
          id: `step-hub-${hubId}-b1`,
          type: 'board',
          instruction: `Board ${r1.lineCode} (${r1.mode.toUpperCase()}) to ${hubStop?.name}`,
          mode: r1.mode,
          lineCode: r1.lineCode,
          lineName: r1.name,
          fromStopName: originStop.name,
          toStopName: hubStop?.name,
          durationMinutes: durLeg1,
          status: r1.status,
        },
        {
          id: `step-hub-${hubId}-tr`,
          type: 'transfer',
          instruction: `Transfer at ${hubStop?.name} (${transferBuffer} min platform connection)`,
          durationMinutes: transferBuffer,
        },
        {
          id: `step-hub-${hubId}-b2`,
          type: 'board',
          instruction: `Board ${r2.lineCode} (${r2.mode.toUpperCase()}) to ${destStop.name}`,
          mode: r2.mode,
          lineCode: r2.lineCode,
          lineName: r2.name,
          fromStopName: hubStop?.name,
          toStopName: destStop.name,
          durationMinutes: durLeg2,
          status: r2.status,
        },
        {
          id: `step-hub-${hubId}-w2`,
          type: 'walk',
          instruction: `Walk ${walkToDest} min from ${destStop.name} to ${destName}`,
          durationMinutes: walkToDest,
          distanceMeters: Math.round(walkToDest * 75),
        },
        {
          id: `step-hub-${hubId}-arr`,
          type: 'arrive',
          instruction: `Arrive at ${destName}`,
          durationMinutes: 0,
        }
      ];

      const combinedReliability = Math.round((r1.onTimeRatePercent + r2.onTimeRatePercent) / 2);
      const combinedStatus: PunctualityStatus = (r1.status === 'significant-delay' || r2.status === 'significant-delay')
        ? 'significant-delay'
        : (r1.status === 'moderate-delay' || r2.status === 'moderate-delay')
        ? 'moderate-delay'
        : 'on-time';

      results.push({
        id: `journey-transfer-${hubId}`,
        originName,
        destinationName,
        totalDurationMinutes: totalDuration,
        walkingMinutes: walkFromOrigin + walkToDest,
        transitMinutes: durLeg1 + transferBuffer + durLeg2,
        transfersCount: 1,
        departureTime: departureTimeStr,
        arrivalTime: addMinutesToTime(departureTimeStr, totalDuration),
        overallReliability: combinedReliability,
        status: combinedStatus,
        steps,
      });

      break; // one primary transfer option is sufficient
    }
  }

  // Fallback: If no routes matched, provide walking or taxi estimate
  if (results.length === 0) {
    const coords1 = originAttraction ? originAttraction.coordinates : originStop.coordinates;
    const coords2 = destAttraction ? destAttraction.coordinates : destStop.coordinates;
    const distKm = getDistanceKm(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
    const walkTime = Math.round(distKm * 13);

    results.push({
      id: 'journey-scenic-walk',
      originName,
      destinationName,
      totalDurationMinutes: walkTime,
      walkingMinutes: walkTime,
      transitMinutes: 0,
      transfersCount: 0,
      departureTime: departureTimeStr,
      arrivalTime: addMinutesToTime(departureTimeStr, walkTime),
      overallReliability: 98,
      status: 'on-time',
      steps: [
        {
          id: 'step-walk-only',
          type: 'walk',
          instruction: `Scenic waterfront walk from ${originName} to ${destName} (${distKm.toFixed(1)} km)`,
          durationMinutes: walkTime,
          distanceMeters: Math.round(distKm * 1000),
        },
        {
          id: 'step-arrive-only',
          type: 'arrive',
          instruction: `Arrive at ${destName}`,
          durationMinutes: 0,
        }
      ]
    });
  }

  return results.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10) || 10;
  let m = parseInt(parts[1], 10) || 0;
  m += minutesToAdd;
  h += Math.floor(m / 60);
  m %= 60;
  h %= 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
