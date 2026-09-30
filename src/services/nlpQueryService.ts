import { NaturalQueryResult, AttractionCategory, District, TransportMode, Attraction } from '../types';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';

export function parseNaturalLanguageQuery(rawQuery: string): NaturalQueryResult {
  const query = rawQuery.trim().toLowerCase();

  const detectedCategories: AttractionCategory[] = [];
  const detectedDistricts: District[] = [];
  const detectedModes: TransportMode[] = [];
  let requireHighReliability = false;
  let maxWalkMinutes: number | undefined = undefined;

  // Category detection
  if (query.includes('museum') || query.includes('art') || query.includes('exhibit') || query.includes('vasa') || query.includes('skansen')) {
    detectedCategories.push('museum');
  }
  if (query.includes('historic') || query.includes('palace') || query.includes('slott') || query.includes('castle') || query.includes('old town') || query.includes('medieval')) {
    detectedCategories.push('historic');
  }
  if (query.includes('food') || query.includes('restaurant') || query.includes('dinner') || query.includes('lunch') || query.includes('meatball') || query.includes('eat') || query.includes('dining')) {
    detectedCategories.push('dining');
  }
  if (query.includes('fika') || query.includes('coffee') || query.includes('cafe') || query.includes('bakery') || query.includes('cardamom') || query.includes('bun') || query.includes('cinnamon')) {
    detectedCategories.push('fika');
  }
  if (query.includes('hotel') || query.includes('stay') || query.includes('sleep') || query.includes('accommodation') || query.includes('lodging')) {
    detectedCategories.push('hotel');
  }
  if (query.includes('view') || query.includes('panorama') || query.includes('sunset') || query.includes('cliff') || query.includes('lookout')) {
    detectedCategories.push('viewpoint');
  }
  if (query.includes('park') || query.includes('garden') || query.includes('nature') || query.includes('orchard') || query.includes('green')) {
    detectedCategories.push('park');
  }

  // District detection
  if (query.includes('gamla stan') || query.includes('old town')) {
    detectedDistricts.push('Gamla Stan');
  }
  if (query.includes('djurgården') || query.includes('djurgarden')) {
    detectedDistricts.push('Djurgården');
  }
  if (query.includes('södermalm') || query.includes('sodermalm') || query.includes('sofo')) {
    detectedDistricts.push('Södermalm');
  }
  if (query.includes('norrmalm') || query.includes('central') || query.includes('city') || query.includes('t-centralen')) {
    detectedDistricts.push('Norrmalm');
  }
  if (query.includes('vasastan') || query.includes('odenplan')) {
    detectedDistricts.push('Vasastan');
  }
  if (query.includes('skeppsholmen')) {
    detectedDistricts.push('Skeppsholmen');
  }
  if (query.includes('kungsholmen') || query.includes('city hall') || query.includes('stadshuset')) {
    detectedDistricts.push('Kungsholmen');
  }

  // Transport mode detection
  if (query.includes('metro') || query.includes('subway') || query.includes('tunnelbana') || query.includes('t-bana') || query.includes('green line') || query.includes('red line') || query.includes('blue line')) {
    detectedModes.push('metro');
  }
  if (query.includes('tram') || query.includes('spårvagn') || query.includes('sparvagn') || query.includes('tram 7')) {
    detectedModes.push('tram');
  }
  if (query.includes('ferry') || query.includes('boat') || query.includes('färja') || query.includes('farja') || query.includes('water')) {
    detectedModes.push('ferry');
  }
  if (query.includes('train') || query.includes('pendeltåg') || query.includes('commuter') || query.includes('arlanda')) {
    detectedModes.push('commuter_train');
  }

  // Reliability & Proximity keywords
  if (query.includes('reliable') || query.includes('on-time') || query.includes('punctual') || query.includes('no delay')) {
    requireHighReliability = true;
  }
  if (query.includes('within 1 km') || query.includes('close') || query.includes('short walk') || query.includes('under 5 min')) {
    maxWalkMinutes = 5;
  }

  // Match attractions
  let matches: Attraction[] = STOCKHOLM_ATTRACTIONS.filter(attraction => {
    // Category filter
    if (detectedCategories.length > 0 && !detectedCategories.includes(attraction.category)) {
      return false;
    }

    // District filter
    if (detectedDistricts.length > 0 && !detectedDistricts.includes(attraction.district)) {
      return false;
    }

    // Max walk minutes
    if (maxWalkMinutes !== undefined && attraction.walkingTimeToStopMinutes > maxWalkMinutes) {
      return false;
    }

    // Transport stop modes
    if (detectedModes.length > 0) {
      const stop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);
      if (!stop || !detectedModes.some(m => stop.modes.includes(m))) {
        return false;
      }
    }

    // High reliability check
    if (requireHighReliability) {
      const stop = STOCKHOLM_STOPS.find(s => s.id === attraction.nearestStopId);
      if (!stop || stop.onTimeRatePercent < 95) {
        return false;
      }
    }

    return true;
  });

  // If strict filtering returned 0 results, fall back to keyword ranking
  if (matches.length === 0) {
    const queryTokens = query.split(/\s+/).filter(t => t.length > 2);
    matches = STOCKHOLM_ATTRACTIONS.filter(attraction => {
      const textToSearch = `${attraction.name} ${attraction.description} ${attraction.district} ${attraction.tags.join(' ')}`.toLowerCase();
      return queryTokens.some(token => textToSearch.includes(token));
    });
  }

  // If still empty, return top 3 curated attractions
  if (matches.length === 0) {
    matches = STOCKHOLM_ATTRACTIONS.slice(0, 3);
  }

  // Construct applied filters description
  const appliedFilters: string[] = [];
  if (detectedCategories.length > 0) appliedFilters.push(`Category: ${detectedCategories.join(', ')}`);
  if (detectedDistricts.length > 0) appliedFilters.push(`District: ${detectedDistricts.join(', ')}`);
  if (detectedModes.length > 0) appliedFilters.push(`Transport: ${detectedModes.join(', ')}`);
  if (requireHighReliability) appliedFilters.push('Reliability: ≥95% On-Time');
  if (maxWalkMinutes) appliedFilters.push(`Walk: ≤${maxWalkMinutes} min from transit`);

  // Construct transit advice
  let transitAdvice = 'Directly reachable via Stockholm SL network.';
  if (detectedModes.includes('tram')) {
    transitAdvice = 'Take Spårvagn Tram 7 along Strandvägen into royal Djurgården with frequent 6-min departures.';
  } else if (detectedModes.includes('ferry')) {
    transitAdvice = 'Take the scenic Djurgårdsfärjan Ferry 82 from Slussen or Nybroplan for a tranquil water crossing.';
  } else if (detectedDistricts.includes('Gamla Stan')) {
    transitAdvice = 'Gamla Stan station is served directly by the Red (13/14) and Green (17/18/19) metro lines with under 3 min headway.';
  } else if (detectedDistricts.includes('Djurgården')) {
    transitAdvice = 'Connect via Tram 7 from T-Centralen or Ferry 82 from Slussen; both stop directly outside prime attractions.';
  }

  return {
    query: rawQuery,
    interpretedIntent: `Searching for ${detectedCategories.length > 0 ? detectedCategories.join(' & ') : 'destinations'}${detectedDistricts.length > 0 ? ` in ${detectedDistricts.join(', ')}` : ''}${detectedModes.length > 0 ? ` accessible via ${detectedModes.join('/')}` : ''}.`,
    appliedFilters,
    matchedAttractions: matches,
    transitAdvice,
    confidenceScore: 0.94,
  };
}
