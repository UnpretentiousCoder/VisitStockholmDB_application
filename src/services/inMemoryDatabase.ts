import alasql from 'alasql';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';
import { Attraction } from '../types';

let isDbInitialized = false;

// Register PostGIS mock functions in AlaSQL for smooth in-memory execution of spatial queries
try {
  const fn = alasql.fn as Record<string, any>;
  fn.ST_MakePoint = (lng: any, lat: any) => ({ lng: Number(lng), lat: Number(lat) });
  fn.ST_SetSRID = (pt: any, _srid: any) => pt;
  fn.ST_DWithin = (loc1: any, loc2: any, distanceMeters: any) => {
    if (!loc1 || !loc2) return true;
    const lat1 = loc1.lat ?? loc1.latitude ?? 59.3293;
    const lng1 = loc1.lng ?? loc1.longitude ?? 18.0686;
    const lat2 = loc2.lat ?? loc2.latitude ?? 59.3293;
    const lng2 = loc2.lng ?? loc2.longitude ?? 18.0686;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const d = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d <= (Number(distanceMeters) || 500);
  };
  fn.ST_Distance = (loc1: any, loc2: any) => {
    if (!loc1 || !loc2) return 150;
    const lat1 = loc1.lat ?? 59.3293;
    const lng1 = loc1.lng ?? 18.0686;
    const lat2 = loc2.lat ?? 59.3293;
    const lng2 = loc2.lng ?? 18.0686;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };
} catch (e) {
  console.warn('PostGIS functions already registered or error:', e);
}

/**
 * Initializes the in-memory SQLite-compatible database using AlaSQL
 * and seeds it with both the official PostgreSQL tourism schema
 * (destination, attraction, location, weather) and legacy support.
 */
export function initInMemoryDatabase(): void {
  if (isDbInitialized) return;

  try {
    // 1. Drop existing tables if present to avoid schema mismatch across reloads
    alasql('DROP TABLE IF EXISTS destination;');
    alasql('DROP TABLE IF EXISTS attraction;');
    alasql('DROP TABLE IF EXISTS location;');
    alasql('DROP TABLE IF EXISTS weather;');
    alasql('DROP TABLE IF EXISTS attractions;');
    alasql('DROP TABLE IF EXISTS transit_stops;');
    alasql('DROP TABLE IF EXISTS transit_routes;');

    // 2. Create official table: location
    alasql(`
      CREATE TABLE location (
        location_id INT PRIMARY KEY,
        location OBJECT
      );
    `);

    // 3. Create official table: destination (Permanent physical places: museums, zoos, landmarks, parks, viewpoints, cafes)
    alasql(`
      CREATE TABLE destination (
        destination_id INT PRIMARY KEY,
        location_id INT,
        name STRING,
        label STRING,
        description STRING,
        created_at STRING
      );
    `);

    // 4. Create official table: attraction (Temporary events: festivals, exhibitions, concerts)
    alasql(`
      CREATE TABLE attraction (
        attraction_id INT PRIMARY KEY,
        location_id INT,
        attraction_name STRING,
        attraction_type STRING,
        attraction_url STRING
      );
    `);

    // 5. Create official table: weather
    alasql(`
      CREATE TABLE weather (
        location_id INT,
        weather_date STRING,
        temperature NUMBER,
        rainfall NUMBER,
        weather_type STRING
      );
    `);

    // 6. Create legacy table: attractions (for backward compatibility)
    alasql(`
      CREATE TABLE attractions (
        id STRING PRIMARY KEY,
        attraction_id STRING,
        name STRING,
        attraction_name STRING,
        category STRING,
        district STRING,
        description STRING,
        price_tier STRING,
        price_sek STRING,
        rating NUMBER,
        reviews_count INT,
        nearest_stop_id STRING,
        walking_time_to_stop_minutes INT,
        accessibility_score INT,
        highlight STRING,
        tags STRING
      );
    `);

    // 7. Create legacy table: transit_stops
    alasql(`
      CREATE TABLE transit_stops (
        id STRING PRIMARY KEY,
        stop_id STRING,
        name STRING,
        stop_name STRING,
        district STRING,
        lines_served STRING,
        modes STRING,
        avg_delay_minutes NUMBER,
        on_time_rate_percent NUMBER,
        daily_departures INT,
        status STRING,
        wheelchair_accessible BOOLEAN
      );
    `);

    // --- SEEDING DATA ---

    // Seed location table
    const locationData = STOCKHOLM_ATTRACTIONS.map((a, idx) => ({
      location_id: idx + 1,
      location: { lat: a.coordinates.lat, lng: a.coordinates.lng },
    }));
    alasql('INSERT INTO location SELECT * FROM ?', [locationData]);

    // Seed destination table (Permanent physical venues)
    const destinationData = STOCKHOLM_ATTRACTIONS.map((a, idx) => ({
      destination_id: idx + 1,
      location_id: idx + 1,
      name: a.name,
      label: a.category, // 'museum', 'historic', 'dining', 'fika', 'hotel', 'viewpoint', 'park'
      description: a.description,
      created_at: '2026-01-01T00:00:00Z',
    }));
    alasql('INSERT INTO destination SELECT * FROM ?', [destinationData]);

    // Seed attraction table (Temporary events, exhibitions, festivals)
    const sampleEvents = [
      { attraction_id: 101, location_id: 1, attraction_name: 'Vasa 1628 Maritime Salvage Exhibition', attraction_type: 'exhibition', attraction_url: 'https://vasamuseet.se' },
      { attraction_id: 102, location_id: 2, attraction_name: 'Royal Palace Changing of the Guard Ceremony', attraction_type: 'performance', attraction_url: 'https://kungligaslotten.se' },
      { attraction_id: 103, location_id: 3, attraction_name: 'Skansen Living Heritage Folk Festival', attraction_type: 'festival', attraction_url: 'https://skansen.se' },
      { attraction_id: 104, location_id: 4, attraction_name: 'Moderna Museet Contemporary Sculpture Tour', attraction_type: 'exhibition', attraction_url: 'https://modernamuseet.se' },
      { attraction_id: 105, location_id: 6, attraction_name: 'ABBA Sing-Along Live Disco Night', attraction_type: 'concert', attraction_url: 'https://abbathemuseum.com' },
      { attraction_id: 106, location_id: 13, attraction_name: 'Rosendal Organic Autumn Orchard Harvest', attraction_type: 'market', attraction_url: 'https://rosendals.se' },
    ];
    alasql('INSERT INTO attraction SELECT * FROM ?', [sampleEvents]);

    // Seed weather table
    const weatherData = STOCKHOLM_ATTRACTIONS.map((_a, idx) => ({
      location_id: idx + 1,
      weather_date: '2026-10-23T12:00:00Z',
      temperature: 15.2,
      rainfall: 0.0,
      weather_type: 'partly cloudy',
    }));
    alasql('INSERT INTO weather SELECT * FROM ?', [weatherData]);

    // Seed legacy attractions
    const legacyAttractionsData = STOCKHOLM_ATTRACTIONS.map((a) => ({
      id: a.id,
      attraction_id: a.id,
      name: a.name,
      attraction_name: a.name,
      category: a.category,
      district: a.district,
      description: a.description,
      price_tier: a.priceTier,
      price_sek: a.priceSek,
      rating: a.rating,
      reviews_count: a.reviewsCount,
      nearest_stop_id: a.nearestStopId,
      walking_time_to_stop_minutes: a.walkingTimeToStopMinutes,
      accessibility_score: a.accessibilityScore,
      highlight: a.highlight,
      tags: a.tags.join(', '),
    }));
    alasql('INSERT INTO attractions SELECT * FROM ?', [legacyAttractionsData]);

    // Seed legacy transit_stops
    const stopsData = STOCKHOLM_STOPS.map((s) => ({
      id: s.id,
      stop_id: s.id,
      name: s.name,
      stop_name: s.name,
      district: s.district,
      lines_served: s.linesServed.join(', '),
      modes: s.modes.join(', '),
      avg_delay_minutes: s.avgDelayMinutes,
      on_time_rate_percent: s.onTimeRatePercent,
      daily_departures: s.dailyDepartures,
      status: s.status,
      wheelchair_accessible: s.wheelchairAccessible,
    }));
    alasql('INSERT INTO transit_stops SELECT * FROM ?', [stopsData]);

    isDbInitialized = true;
    console.log('[InMemoryDatabase] Successfully initialized destination, attraction, location, weather, and transit tables.');
  } catch (error) {
    console.error('[InMemoryDatabase] Failed to initialize in-memory database:', error);
  }
}

/**
 * Executes a sanitized SELECT query on the in-memory database.
 * Non-SELECT queries are strictly rejected for safety.
 */
export function executeSql(sqlQuery: string): any[] {
  initInMemoryDatabase();

  let trimmed = sqlQuery.trim();

  // Strip PostGIS cast syntax (e.g. ::geography) which PostgreSQL accepts but standard in-memory engines don't
  trimmed = trimmed.replace(/::geography\b/gi, '');
  trimmed = trimmed.replace(/::geometry\b/gi, '');

  const lower = trimmed.toLowerCase();

  // Enforce read-only queries
  if (!lower.startsWith('select')) {
    throw new Error('Only SELECT queries are permitted on the database.');
  }

  // Prevent destructive statements
  if (
    lower.includes('drop ') ||
    lower.includes('delete ') ||
    lower.includes('update ') ||
    lower.includes('insert ') ||
    lower.includes('alter ') ||
    lower.includes('truncate ')
  ) {
    throw new Error('Destructive or modifying SQL operations are not permitted.');
  }

  try {
    const results = alasql(trimmed);
    return Array.isArray(results) ? results : [results];
  } catch (error: any) {
    console.warn('[InMemoryDatabase] SQL execution error with query:', trimmed, error);
    throw error;
  }
}

/**
 * Maps SQL result rows (from destination, attraction, or legacy tables) back to full Attraction card objects.
 */
export function mapSqlResultsToAttractions(rows: any[]): Attraction[] {
  if (!rows || rows.length === 0) return [];

  const matchedIds = new Set<string>();
  const results: Attraction[] = [];

  rows.forEach((row) => {
    let matchedAttraction: Attraction | undefined;

    // 1. Check destination_id (1..14 indexed)
    if (typeof row.destination_id === 'number' && row.destination_id >= 1 && row.destination_id <= STOCKHOLM_ATTRACTIONS.length) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS[row.destination_id - 1];
    }

    // 2. Check location_id (1..14 indexed)
    if (!matchedAttraction && typeof row.location_id === 'number' && row.location_id >= 1 && row.location_id <= STOCKHOLM_ATTRACTIONS.length) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS[row.location_id - 1];
    }

    // 3. Check attraction_id (numeric event id or string id)
    if (!matchedAttraction && typeof row.attraction_id === 'number') {
      // If event references a location_id
      const eventLocId = row.location_id || (row.attraction_id - 100);
      if (eventLocId >= 1 && eventLocId <= STOCKHOLM_ATTRACTIONS.length) {
        matchedAttraction = STOCKHOLM_ATTRACTIONS[eventLocId - 1];
      }
    } else if (!matchedAttraction && typeof row.attraction_id === 'string') {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find((a) => a.id === row.attraction_id);
    }

    // 4. Check string id
    if (!matchedAttraction && row.id && typeof row.id === 'string') {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find((a) => a.id === row.id);
    }

    // 5. Match by venue name
    const rawName = row.name || row.attraction_name || row.destination_name;
    if (!matchedAttraction && rawName) {
      const searchName = String(rawName).toLowerCase().trim();
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find(
        (a) => a.name.toLowerCase().includes(searchName) || searchName.includes(a.name.toLowerCase())
      );
    }

    if (matchedAttraction && !matchedIds.has(matchedAttraction.id)) {
      matchedIds.add(matchedAttraction.id);
      results.push(matchedAttraction);
    }
  });

  return results;
}
