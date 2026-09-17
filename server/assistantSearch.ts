import { GoogleGenAI } from '@google/genai';

export const intents = [
  { id: 'fleet', text: 'How many vessels ships boats do we have? List name all vessels fleet count total registered active inactive.' },
  { id: 'location', text: 'Where is the vessel now? Current location position whereabouts at the moment status doing unloading berthed sailing loading.' },
  { id: 'forecast', text: 'When will the vessel finish unloading depart leave release berth? Estimated completion time forecast remaining cargo tonnes rate progress.' },
  { id: 'berths', text: 'Which berths are available occupied? Current berth situation schedule berth planning.' },
  { id: 'delays', text: 'Why is vessel delayed waiting blocked? What needs attention issues problems delay cause reason.' },
  { id: 'fuel', text: 'Fuel bunkering oil status quantity supplier schedule.' },
  { id: 'payments', text: 'Payments invoices balance amount paid outstanding money finance owed.' },
] as const;
export type Intent = typeof intents[number]['id'];

const tokens = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? a.reduce((sum, x, i) => sum + x * b[i], 0) / norm : 0;
}

// TF-IDF vectors are a local lexical fallback, not a trained embedding model.
export function lexicalScores(query: string): number[] {
  const docs = intents.map(d => tokens(d.text));
  const vocabulary = [...new Set(docs.flat())];
  const vector = (words: string[]) => vocabulary.map(word => {
    const frequency = words.filter(w => w === word).length;
    const idf = Math.log((docs.length + 1) / (1 + docs.filter(d => d.includes(word)).length)) + 1;
    return frequency * idf;
  });
  const q = vector(tokens(query));
  return docs.map(d => cosine(q, vector(d)));
}

let cached: { model: string; vectors: number[][] } | undefined;
export async function detectIntent(query: string): Promise<{ intent: Intent | 'unknown'; method: string }> {
  const q = query.toLowerCase();
  // Exact count/location intent must not depend on approximate retrieval.
  const rules: [Intent, RegExp][] = [
    ['fleet', /(?:how many|number of|count|list|name all|which).*(?:vessels?|ships?|boats?)|\bfleet\b/],
    ['payments', /\b(payment|payments|invoice|invoices|balance|paid|owe|owed)\b/],
    ['fuel', /\b(fuel|bunkering|bunker|mgo)\b/],
    ['delays', /\b(why|delayed|delays|blocked|attention|issues)\b/],
    ['forecast', /\b(when|finish|completion|forecast|remaining|progress|rate|depart|leave)\b/],
    ['location', /\b(where|location|whereabouts|position|doing|status)\b|at the moment/],
    ['berths', /\bberths?\b/],
  ];
  const exact = rules.find(([, pattern]) => pattern.test(q));
  if (exact) return { intent: exact[0], method: 'structured-intent' };
  let scores = lexicalScores(query);
  let method = 'tf-idf';
  if (process.env.GEMINI_API_KEY) {
    try {
      const model = process.env.AI_EMBEDDING_MODEL || 'gemini-embedding-001';
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 5000 } });
      if (!cached || cached.model !== model) {
        const result = await ai.models.embedContent({ model, contents: intents.map(d => d.text), config: { taskType: 'SEMANTIC_SIMILARITY' } });
        const vectors = result.embeddings?.map(e => e.values ?? []) ?? [];
        if (vectors.length !== intents.length || vectors.some(v => !v.length)) throw new Error('Incomplete vectors');
        cached = { model, vectors };
      }
      const result = await ai.models.embedContent({ model, contents: query, config: { taskType: 'SEMANTIC_SIMILARITY' } });
      const vector = result.embeddings?.[0]?.values;
      if (!vector?.length) throw new Error('Missing query vector');
      scores = cached.vectors.map(v => cosine(vector, v));
      method = 'gemini-embedding';
    } catch {
      // No invented answer or raw provider error if the embedding service fails.
    }
  }
  const ranked = scores.map((score, i) => ({ score, i })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const minimum = method === 'gemini-embedding' ? 0.65 : 0.18;
  const confident = best.score >= minimum && best.score - ranked[1].score >= 0.04;
  return { intent: confident ? intents[best.i].id : 'unknown', method };
}
