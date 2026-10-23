import { Attraction } from '../types';
import { executeSql, mapSqlResultsToAttractions, STOCKHOLM_DB_SCHEMA } from './inMemoryDatabase';
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
    const timeout = setTimeout(() => controller.abort(), 2000);
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

  const systemPrompt = `You are an expert SQL generator for a Stockholm tourism and SL public transport database.
Given the database schema below and the user request, output ONLY a valid SQLite-compatible SQL query.

${STOCKHOLM_DB_SCHEMA}

IMPORTANT RULES:
1. Output ONLY the raw SQL query. No explanations, no conversation.
2. Query the 'attractions' table (e.g. SELECT a.id, a.name, a.category, a.district FROM attractions a).
3. If public transport, metro, tram, ferry, or line punctuality is involved, JOIN transit_stops s ON a.nearest_stop_id = s.id.
4. For text searches, ALWAYS use case-insensitive matching: LOWER(column) LIKE '%value%'
5. Valid categories: 'museum', 'historic', 'dining', 'fika', 'hotel', 'viewpoint', 'park'.
6. Valid districts: 'Gamla Stan', 'Djurgården', 'Södermalm', 'Norrmalm', 'Vasastan', 'Skeppsholmen', 'Kungsholmen'.
7. Valid transport modes in transit_stops.modes: 'metro', 'tram', 'ferry', 'bus', 'commuter_train'.
8. Default to LIMIT 10.
9. ONLY SELECT statements are allowed. Never output INSERT, UPDATE, or DELETE.

FEW-SHOT EXAMPLES:
User: "Find museums in Gamla Stan reachable by metro"
SQL: SELECT a.id, a.name, a.category, a.district FROM attractions a JOIN transit_stops s ON a.nearest_stop_id = s.id WHERE LOWER(a.category) LIKE '%museum%' AND LOWER(a.district) LIKE '%gamla stan%' AND LOWER(s.modes) LIKE '%metro%' LIMIT 10;

User: "Scenic viewpoints with short walk from reliable transit"
SQL: SELECT a.id, a.name, a.category, a.district FROM attractions a JOIN transit_stops s ON a.nearest_stop_id = s.id WHERE LOWER(a.category) LIKE '%viewpoint%' AND a.walking_time_to_stop_minutes <= 10 AND s.on_time_rate_percent >= 90 ORDER BY s.on_time_rate_percent DESC LIMIT 10;

User: "Where to get fika near Södermalm"
SQL: SELECT a.id, a.name, a.category, a.district FROM attractions a WHERE LOWER(a.category) LIKE '%fika%' AND LOWER(a.district) LIKE '%södermalm%' LIMIT 10;

User: "Attractions within 1 km of a stop served by reliable routes"
SQL: SELECT a.id, a.name, a.category, a.district FROM attractions a JOIN transit_stops s ON a.nearest_stop_id = s.id WHERE a.walking_time_to_stop_minutes <= 10 AND s.on_time_rate_percent >= 92 ORDER BY s.on_time_rate_percent DESC LIMIT 10;`;

  // Helper to call Ollama
  const sendOllamaRequest = async (endpoint: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

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
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  };

  let rawModelOutput = '';
  let cleanSql = '';

  try {
    let response: Response | null = null;
    try {
      response = await sendOllamaRequest(OLLAMA_PROXY_URL);
    } catch {
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

    // Execute generated SQL against in-memory database
    const rows = executeSql(cleanSql);
    const matchedAttractions = mapSqlResultsToAttractions(rows);

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // Diagnostic console group logging
    console.group(`%c[Ollama Text-to-SQL] %c"${userQuestion}"`, 'color: #1E4D6B; font-weight: bold; font-size: 13px;', 'color: #111;');
    console.log('%cRaw Model Output:%c\n' + rawModelOutput, 'color: #666; font-weight: bold;', 'color: #222; font-family: monospace;');
    console.log('%cCleaned Executed SQL:%c\n' + cleanSql, 'color: #1E4D6B; font-weight: bold;', 'color: #0b3d60; font-family: monospace; font-weight: 600; background: #e8f0f4; padding: 4px;');
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
        modelUsed: `${OLLAMA_MODEL} (Refined with Fallback)`,
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
        modelUsed: `${OLLAMA_MODEL} (Refined with Fallback)`,
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
      modelUsed: `${OLLAMA_MODEL} (Local Ollama)`,
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
      modelUsed: `${OLLAMA_MODEL} (Local Ollama)`,
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
