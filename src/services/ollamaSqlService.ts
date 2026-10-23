import { Attraction } from '../types';
import { mapSqlResultsToAttractions } from './inMemoryDatabase';
import { executeDatabaseQuery } from './dbClient';
import { parseNaturalLanguageQuery } from './nlpQueryService';
import { STOCKHOLM_ATTRACTIONS } from '../data/stockholmData';

export interface SqlDebugLog {
  timestamp: string;
  userQuestion: string;
  rawModelOutput: string;
  cleanedSql: string;
  executionTimeMs: number;
  modelUsed: string;
  isFallback: boolean;
  fallbackReason?: string;
  rowsCount: number;
  rowsSample: any[];
  error?: string;
}

export interface TextToSqlResult {
  success: boolean;
  matchedAttractions: Attraction[];
  summary: string;
  transitAdvice?: string;
  appliedFilters: string[];
  executionTimeMs: number;
  modelUsed: string;
  isFallback: boolean;
  debugLog: SqlDebugLog;
}

// Ollama endpoints (Vite proxy first, direct fallback second)
const OLLAMA_PROXY_URL = '/api/ollama/api/chat';
const OLLAMA_DIRECT_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_TAGS_PROXY_URL = '/api/ollama/api/tags';
const OLLAMA_TAGS_DIRECT_URL = 'http://127.0.0.1:11434/api/tags';

export const OLLAMA_MODEL = 'qwen2.5-coder:3b';

/**
 * Checks if local Ollama is active and responsive.
 */
export async function checkOllamaHealth(): Promise<{ online: boolean; hasModel: boolean }> {
  const tryEndpoint = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  };

  const data = (await tryEndpoint(OLLAMA_TAGS_PROXY_URL)) || (await tryEndpoint(OLLAMA_TAGS_DIRECT_URL));
  if (!data || !Array.isArray(data.models)) {
    return { online: false, hasModel: false };
  }

  const hasModel = data.models.some((m: any) =>
    m.name?.toLowerCase().includes('qwen2.5-coder')
  );

  return { online: true, hasModel };
}

/**
 * Sanitizes model output into clean executable SQL
 */
function cleanGeneratedSql(rawOutput: string): string {
  let cleaned = rawOutput.trim();

  // Extract from markdown code fence if present
  const sqlMatch = cleaned.match(/```(?:sql)?([\s\S]*?)```/i);
  if (sqlMatch) {
    cleaned = sqlMatch[1].trim();
  }

  // Remove any trailing comments or semicolons
  cleaned = cleaned.replace(/;+\s*$/, '');

  // If there's explanatory text before SELECT, slice from SELECT
  const selectIndex = cleaned.search(/\bSELECT\b/i);
  if (selectIndex !== -1) {
    cleaned = cleaned.slice(selectIndex);
  }

  return cleaned.trim();
}

/**
 * Prompts qwen2.5-coder:3b locally via Ollama to generate a SQL query,
 * executes it on the in-memory database, logs diagnostic telemetry, and returns formatted results.
 */
export async function queryTextToSql(userQuestion: string): Promise<TextToSqlResult> {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleTimeString();

const systemPrompt = `You are an expert PostgreSQL and PostGIS SQL engineer for a Stockholm travel and tourism database.
Your task is to convert a user's natural-language question into exactly ONE valid, read-only PostgreSQL SELECT query.

OUTPUT FORMAT:
Output ONLY the raw SQL query. Do not output markdown preambles, explanations, comments, or conversational text.

DATABASE SCHEMA:
1. destination (Permanent physical places & venues)
- destination_id: integer, primary key for a physical venue
- location_id: integer, foreign key references location.location_id
- name: text, venue name (e.g. 'Vasamuseet', 'Kungliga Slottet', 'Skansen Open-Air Museum & Zoo')
- label: text, category ('museum', 'zoo', 'historic', 'park', 'viewpoint', 'dining', 'fika', 'hotel')
- description: text, detailed description of the physical location
- created_at: timestamptz, creation timestamp

2. attraction (Temporary events & happenings)
- attraction_id: integer, primary key for a temporary event
- location_id: integer, foreign key references location.location_id
- attraction_name: text, event title (e.g. 'Stockholm Jazz Festival', 'Royal Guard Special Parade', 'Winter Light Show')
- attraction_type: text, event category ('festival', 'exhibition', 'concert', 'market', 'performance')
- attraction_url: text, event URL

3. location (Spatial points)
- location_id: integer, primary key for a geographic point
- location: geography(Point, 4326), PostGIS geographic coordinates (longitude, latitude)

4. weather (Meteorological records)
- location_id: integer, foreign key references location.location_id
- weather_date: timestamptz, timestamp of weather measurement
- temperature: numeric, temperature in Celsius
- rainfall: numeric, rainfall in millimeters
- weather_type: text, weather description (e.g. 'sunny', 'partly cloudy', 'cloudy', 'rain')

CRITICAL DOMAIN RULES:
1. DESTINATIONS VS ATTRACTIONS:
   - Use 'destination' for ALL physical, permanent places to visit:
     * Museums (e.g. Vasa Museum, Moderna Museet, ABBA Museum)
     * Zoos, wildlife & open-air heritage grounds (e.g. Skansen Zoo)
     * Historic landmarks, castles & palaces (e.g. Kungliga Slottet, Stockholms Stadshus)
     * Parks, gardens & nature walks (e.g. Rosendals Trädgård)
     * Viewpoints & scenic cliff walks (e.g. Monteliusvägen)
     * Cafes, bakeries, & fika places (e.g. Café Pascal, Vete-Katten)
     * Restaurants & eateries (e.g. Restaurang Pelikan, Meatballs for the People)
     * Hotels & accommodations (e.g. Grand Hôtel, Hobo Hotel)
   - Use 'attraction' ONLY for temporary events, scheduled activities, seasonal festivals, pop-up markets, live musical concerts, or temporary exhibitions.
   - When a user asks for museums, zoos, palaces, landmarks, parks, viewpoints, cafes, or permanent attractions -> ALWAYS query 'destination'.

2. GEOGRAPHICAL PROXIMITY & "NEARBY" RULES:
   - When a user asks for places "nearby", "close to", "near", or "within walking distance" without an explicit distance number:
     * ALWAYS automatically default the distance to 500 meters (500 in ST_DWithin).
   - If the user specifies an explicit distance (e.g. "within 1 km", "within 800m", "under 300 meters"):
     * Convert to meters (1 km = 1000, 800m = 800, 300m = 300) and use that distance in ST_DWithin.
   - Nearby a Named Landmark:
     * Join destination with location and subquery the reference landmark's coordinates using ST_DWithin(l.location, (SELECT l2.location FROM destination d2 JOIN location l2 ON d2.location_id = l2.location_id WHERE LOWER(d2.name) LIKE '%landmark%' LIMIT 1), 500).
   - Nearby Coordinates:
     * If latitude/longitude are given: ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, 500).
   - Nearby without specific anchor:
     * If user asks "what is nearby?" or "nearby places" with no reference anchor, default to Central Stockholm (T-Centralen coordinates: 59.3326 N, 18.0649 E):
       ST_DWithin(l.location, ST_SetSRID(ST_MakePoint(18.0649, 59.3326), 4326)::geography, 500).
   - Distance Ordering:
     * Whenever proximity is requested, order by closest distance first: ORDER BY ST_Distance(l.location, <reference_point>) ASC.

3. TEXT SEARCH & SAFETY:
   - Always use case-insensitive searches: LOWER(COALESCE(column, '')) LIKE '%keyword%'.
   - Search across both 'name' and 'label' or 'description' when user mentions a topic or category.
   - Use SELECT DISTINCT when joins could produce duplicate destination or attraction rows.
   - Default to LIMIT 10 unless specified otherwise.
   - ONLY SELECT queries are permitted. Never output data-modifying statements.

FEW-SHOT EXAMPLES:

User: "Find museums in Stockholm"
SQL:
SELECT d.destination_id, d.name, d.label, d.description, d.location_id
FROM destination d
WHERE LOWER(COALESCE(d.label, '')) LIKE '%museum%'
   OR LOWER(COALESCE(d.name, '')) LIKE '%museum%'
LIMIT 10;

User: "Find zoos and open-air heritage grounds"
SQL:
SELECT d.destination_id, d.name, d.label, d.description, d.location_id
FROM destination d
WHERE LOWER(COALESCE(d.label, '')) LIKE '%zoo%'
   OR LOWER(COALESCE(d.name, '')) LIKE '%zoo%'
   OR LOWER(COALESCE(d.description, '')) LIKE '%open-air%'
LIMIT 10;

User: "Find cafes nearby the Royal Palace"
SQL:
SELECT DISTINCT d.destination_id, d.name, d.label, d.description, d.location_id
FROM destination d
JOIN location l ON d.location_id = l.location_id
WHERE (LOWER(COALESCE(d.label, '')) LIKE '%fika%'
    OR LOWER(COALESCE(d.label, '')) LIKE '%cafe%'
    OR LOWER(COALESCE(d.name, '')) LIKE '%cafe%')
  AND ST_DWithin(
    l.location,
    (SELECT l_ref.location FROM destination d_ref JOIN location l_ref ON d_ref.location_id = l_ref.location_id WHERE LOWER(d_ref.name) LIKE '%royal palace%' OR LOWER(d_ref.name) LIKE '%slott%' LIMIT 1),
    500
  )
ORDER BY ST_Distance(
    l.location,
    (SELECT l_ref.location FROM destination d_ref JOIN location l_ref ON d_ref.location_id = l_ref.location_id WHERE LOWER(d_ref.name) LIKE '%royal palace%' OR LOWER(d_ref.name) LIKE '%slott%' LIMIT 1)
  ) ASC
LIMIT 10;

User: "Find places to visit nearby 59.3280, 18.0914"
SQL:
SELECT DISTINCT d.destination_id, d.name, d.label, d.description, d.location_id
FROM destination d
JOIN location l ON d.location_id = l.location_id
WHERE ST_DWithin(
    l.location,
    ST_SetSRID(ST_MakePoint(18.0914, 59.3280), 4326)::geography,
    500
  )
ORDER BY ST_Distance(
    l.location,
    ST_SetSRID(ST_MakePoint(18.0914, 59.3280), 4326)::geography
  ) ASC
LIMIT 10;

User: "Find parks within 1 km of Skansen"
SQL:
SELECT DISTINCT d.destination_id, d.name, d.label, d.description, d.location_id
FROM destination d
JOIN location l ON d.location_id = l.location_id
WHERE (LOWER(COALESCE(d.label, '')) LIKE '%park%' OR LOWER(COALESCE(d.description, '')) LIKE '%garden%')
  AND ST_DWithin(
    l.location,
    (SELECT l_ref.location FROM destination d_ref JOIN location l_ref ON d_ref.location_id = l_ref.location_id WHERE LOWER(d_ref.name) LIKE '%skansen%' LIMIT 1),
    1000
  )
ORDER BY ST_Distance(
    l.location,
    (SELECT l_ref.location FROM destination d_ref JOIN location l_ref ON d_ref.location_id = l_ref.location_id WHERE LOWER(d_ref.name) LIKE '%skansen%' LIMIT 1)
  ) ASC
LIMIT 10;

User: "Find temporary festivals and exhibitions happening in Stockholm"
SQL:
SELECT a.attraction_id, a.attraction_name, a.attraction_type, a.location_id, a.attraction_url
FROM attraction a
WHERE LOWER(COALESCE(a.attraction_type, '')) LIKE '%festival%'
   OR LOWER(COALESCE(a.attraction_type, '')) LIKE '%exhibition%'
   OR LOWER(COALESCE(a.attraction_name, '')) LIKE '%festival%'
LIMIT 10;

User: "Find destinations where the recorded weather is sunny"
SQL:
SELECT DISTINCT d.destination_id, d.name, d.label, d.location_id, w.temperature, w.weather_type
FROM destination d
JOIN weather w ON w.location_id = d.location_id
WHERE LOWER(COALESCE(w.weather_type, '')) LIKE '%sunny%'
LIMIT 10;`;
  // Helper to call Ollama
  const sendOllamaRequest = async (endpoint: string) => {
    const controller = new AbortController();
    // Allow up to 60s for cold starts or CPU-bound inference
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userQuestion },
          ],
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 160, // Limit generated tokens to speed up response
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  };

  let rawModelOutput = '';
  let cleanSql = '';

  try {
    let response: Response | null = null;
    try {
      response = await sendOllamaRequest(OLLAMA_PROXY_URL);
    } catch (proxyErr: any) {
      // If it timed out, do not waste another minute hitting direct URL
      const isAbort = proxyErr?.name === 'AbortError' || proxyErr?.message?.toLowerCase().includes('abort');
      if (isAbort) {
        throw new Error('Ollama inference timed out after 60 seconds. The model is likely still loading or running on CPU.');
      }
      // Otherwise fallback to direct URL
      response = await sendOllamaRequest(OLLAMA_DIRECT_URL);
    }

    if (!response || !response.ok) {
      throw new Error(`Ollama responded with status: ${response ? response.status : 'offline'}`);
    }

    const json = await response.json();
    rawModelOutput = json?.message?.content || '';
    cleanSql = cleanGeneratedSql(rawModelOutput);

    if (!cleanSql.toLowerCase().startsWith('select')) {
      throw new Error(`Model generated non-SELECT output: ${cleanSql.slice(0, 100)}`);
    }

    // Execute generated SQL against PostgreSQL container (or in-memory fallback)
    const dbResult = await executeDatabaseQuery(cleanSql);
    const rows = dbResult.rows;
    const matchedAttractions = mapSqlResultsToAttractions(rows);

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    const dbSourceLabel = dbResult.source === 'postgresql' ? 'PostgreSQL Container' : 'In-Memory Fallback';

    // Diagnostic console group logging
    console.group(`%c[Ollama Text-to-SQL] %c"${userQuestion}"`, 'color: #1E4D6B; font-weight: bold; font-size: 13px;', 'color: #111;');
    console.log('%cRaw Model Output:%c\n' + rawModelOutput, 'color: #666; font-weight: bold;', 'color: #222; font-family: monospace;');
    console.log('%cCleaned Executed SQL:%c\n' + cleanSql, 'color: #1E4D6B; font-weight: bold;', 'color: #0b3d60; font-family: monospace; font-weight: 600; background: #e8f0f4; padding: 4px;');
    console.log(`%cDatabase Source:%c ${dbSourceLabel}`, 'color: #1E4D6B; font-weight: bold;', 'font-weight: bold; color: #2e7d32;');
    console.log('%cDatabase Rows Returned (' + rows.length + '):', 'color: #315C45; font-weight: bold;', rows);
    console.log('%cMapped Attractions (' + matchedAttractions.length + '):', 'color: #315C45; font-weight: bold;', matchedAttractions.map(a => `${a.id}: ${a.name} (${a.district})`));
    console.log('%cExecution Latency:', 'color: #666;', `${executionTimeMs} ms`);
    console.groupEnd();

    // If query returned zero rows, fallback to smart keyword search
    if (matchedAttractions.length === 0) {
      console.warn(`[Ollama Text-to-SQL] Query returned 0 rows from database. Triggering refined fallback for "${userQuestion}".`);
      const fallbackResult = parseNaturalLanguageQuery(userQuestion);
      
      const debugLog: SqlDebugLog = {
        timestamp,
        userQuestion,
        rawModelOutput,
        cleanedSql: cleanSql,
        executionTimeMs,
        modelUsed: `${OLLAMA_MODEL} (${dbSourceLabel} & Fallback)`,
        isFallback: true,
        fallbackReason: 'The generated SQL executed successfully but returned 0 rows matching current database criteria.',
        rowsCount: 0,
        rowsSample: rows,
      };

      return {
        success: true,
        matchedAttractions: fallbackResult.matchedAttractions,
        summary: `Found ${fallbackResult.matchedAttractions.length} Stockholm destinations matching your query.`,
        transitAdvice: fallbackResult.transitAdvice,
        appliedFilters: fallbackResult.appliedFilters,
        executionTimeMs,
        modelUsed: `${OLLAMA_MODEL} (${dbSourceLabel} & Fallback)`,
        isFallback: true,
        debugLog,
      };
    }

    const debugLog: SqlDebugLog = {
      timestamp,
      userQuestion,
      rawModelOutput,
      cleanedSql: cleanSql,
      executionTimeMs,
      modelUsed: `${OLLAMA_MODEL} (${dbSourceLabel})`,
      isFallback: false,
      rowsCount: rows.length,
      rowsSample: rows.slice(0, 5),
    };

    return {
      success: true,
      matchedAttractions,
      summary: `Found ${matchedAttractions.length} destinations matching your criteria across Stockholm.`,
      transitAdvice: 'Directly reachable via the Stockholm SL transit network.',
      appliedFilters: [`Matched ${matchedAttractions.length} locations`],
      executionTimeMs,
      modelUsed: `${OLLAMA_MODEL} (${dbSourceLabel})`,
      isFallback: false,
      debugLog,
    };
  } catch (error: any) {
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    console.group(`%c[Ollama Text-to-SQL Error / Fallback] %c"${userQuestion}"`, 'color: #8A3333; font-weight: bold; font-size: 13px;', 'color: #111;');
    console.error('Error Details:', error.message);
    if (rawModelOutput) console.log('Raw Model Output Was:', rawModelOutput);
    if (cleanSql) console.log('Failed SQL Was:', cleanSql);
    console.groupEnd();

    // Graceful fallback: run rule-based query parser
    const fallback = parseNaturalLanguageQuery(userQuestion);

    const debugLog: SqlDebugLog = {
      timestamp,
      userQuestion,
      rawModelOutput: rawModelOutput || 'No output received (Connection failed or timed out)',
      cleanedSql: cleanSql || '-- Ollama offline / unreachable',
      executionTimeMs,
      modelUsed: 'Rule-Based Fallback Engine',
      isFallback: true,
      fallbackReason: `Ollama error: ${error.message}`,
      rowsCount: fallback.matchedAttractions.length,
      rowsSample: fallback.matchedAttractions.map(a => ({ id: a.id, name: a.name })),
      error: error.message,
    };

    return {
      success: true,
      matchedAttractions: fallback.matchedAttractions,
      summary: fallback.interpretedIntent || `Found ${fallback.matchedAttractions.length} Stockholm destinations.`,
      transitAdvice: fallback.transitAdvice,
      appliedFilters: fallback.appliedFilters,
      executionTimeMs,
      modelUsed: 'Rule-Based Smart Engine (Ollama Offline/Fallback)',
      isFallback: true,
      debugLog,
    };
  }
}
