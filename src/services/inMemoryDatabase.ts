import alasql from 'alasql';
import { STOCKHOLM_ATTRACTIONS, STOCKHOLM_STOPS, STOCKHOLM_ROUTES } from '../data/stockholmData';
import { Attraction } from '../types';

let isDbInitialized = false;

/**
 * Initializes the in-memory SQLite-compatible database using AlaSQL
 * and seeds it with Stockholm attractions, transit stops, and routes.
 */
export function initInMemoryDatabase(): void {
  if (isDbInitialized) return;

  try {
    // 1. Drop existing tables if present to avoid schema/column mismatch on reloads
    alasql('DROP TABLE IF EXISTS attractions;');
    alasql('DROP TABLE IF EXISTS transit_stops;');
    alasql('DROP TABLE IF EXISTS transit_routes;');

    // 2. Create attractions table
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

    // 3. Create transit_stops table
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

    // 4. Create transit_routes table
    alasql(`
      CREATE TABLE transit_routes (
        id STRING PRIMARY KEY,
        route_id STRING,
        line_code STRING,
        name STRING,
        mode STRING,
        on_time_rate_percent NUMBER,
        avg_delay_minutes NUMBER,
        status STRING
      );
    `);

    // 5. Seed attractions via typed object array mapping (immune to positional count mismatches)
    const attractionsData = STOCKHOLM_ATTRACTIONS.map((a) => ({
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
    alasql('INSERT INTO attractions SELECT * FROM ?', [attractionsData]);

    // 6. Seed transit_stops
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

    // 7. Seed transit_routes
    const routesData = STOCKHOLM_ROUTES.map((r) => ({
      id: r.id,
      route_id: r.id,
      line_code: r.lineCode,
      name: r.name,
      mode: r.mode,
      on_time_rate_percent: r.onTimeRatePercent,
      avg_delay_minutes: r.avgDelayMinutes,
      status: r.status,
    }));
    alasql('INSERT INTO transit_routes SELECT * FROM ?', [routesData]);

    isDbInitialized = true;
    console.log('[InMemoryDatabase] Successfully initialized with', attractionsData.length, 'attractions and', stopsData.length, 'stops.');
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

  const trimmed = sqlQuery.trim();
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
    lower.includes('alter ')
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
 * Returns mapped Attraction objects from SQL result rows
 */
export function mapSqlResultsToAttractions(rows: any[]): Attraction[] {
  if (!rows || rows.length === 0) return [];

  const matchedIds = new Set<string>();
  const results: Attraction[] = [];

  rows.forEach((row) => {
    let matchedAttraction: Attraction | undefined;

    // 1. Check attraction_id
    if (row.attraction_id) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find((a) => a.id === row.attraction_id);
    }
    // 2. Check id if it matches an attraction ID
    if (!matchedAttraction && row.id) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find((a) => a.id === row.id);
    }
    // 3. Check attraction_name
    if (!matchedAttraction && row.attraction_name) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find(
        (a) => a.name.toLowerCase() === String(row.attraction_name).toLowerCase()
      );
    }
    // 4. Check name if it matches an attraction name
    if (!matchedAttraction && row.name) {
      matchedAttraction = STOCKHOLM_ATTRACTIONS.find(
        (a) => a.name.toLowerCase() === String(row.name).toLowerCase()
      );
    }

    if (matchedAttraction && !matchedIds.has(matchedAttraction.id)) {
      matchedIds.add(matchedAttraction.id);
      results.push(matchedAttraction);
    }
  });

  return results;
}

/**
 * Database schema definition provided to qwen2.5-coder:3b
 */
export const STOCKHOLM_DB_SCHEMA = `
TABLE attractions (
  id VARCHAR PRIMARY KEY, -- e.g. 'poi-vasa-museum', 'poi-stadshuset', 'poi-gamla-stan-palace'
  name VARCHAR, -- e.g. 'Vasamuseet (The Vasa Museum)', 'Stockholms Stadshus (City Hall)'
  category VARCHAR, -- 'museum', 'historic', 'dining', 'fika', 'hotel', 'viewpoint', 'park'
  district VARCHAR, -- 'Gamla Stan', 'Djurgården', 'Södermalm', 'Norrmalm', 'Vasastan', 'Skeppsholmen', 'Kungsholmen'
  description VARCHAR,
  price_tier VARCHAR, -- 'free', '€', '€€', '€€€'
  price_sek VARCHAR, -- e.g. '190 SEK', 'Free admission'
  rating FLOAT, -- e.g. 4.9
  nearest_stop_id VARCHAR, -- foreign key linking to transit_stops.id
  walking_time_to_stop_minutes INT, -- e.g. 3, 5, 10
  accessibility_score INT, -- 0-100
  highlight VARCHAR,
  tags VARCHAR -- comma-separated e.g. 'Maritime, Historic Ship, Top Rated'
);

TABLE transit_stops (
  id VARCHAR PRIMARY KEY, -- e.g. 'stop-gamla-stan', 'stop-t-centralen', 'stop-skansen'
  name VARCHAR, -- e.g. 'Gamla Stan', 'T-Centralen / Stockholm City'
  district VARCHAR, -- 'Gamla Stan', 'Norrmalm', 'Södermalm'
  lines_served VARCHAR, -- e.g. 'Red 13, Green 17, Tram 7'
  modes VARCHAR, -- e.g. 'metro, tram, ferry, bus, commuter_train'
  avg_delay_minutes FLOAT,
  on_time_rate_percent FLOAT, -- e.g. 96.2
  status VARCHAR -- 'on-time', 'moderate-delay'
);

TABLE transit_routes (
  id VARCHAR PRIMARY KEY,
  line_code VARCHAR, -- e.g. 'Red 13', 'Tram 7', 'Ferry 82'
  name VARCHAR,
  mode VARCHAR, -- 'metro', 'tram', 'ferry'
  on_time_rate_percent FLOAT
);
`;
