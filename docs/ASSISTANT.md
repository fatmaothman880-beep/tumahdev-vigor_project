# System-record assistant

The authenticated `/api/v1/ai/assistant` endpoint reads the operational snapshot,
paginated vessel and berth registers, visits, and current backend forecasts.
Client-supplied context and conversation text are never treated as operational facts.
Conversation history is used only to resolve a vessel named in a previous question.

Supported questions cover vessel counts/names, recorded location/stage, unloading
completion, berth status, saved delays, fuel operations and payment balances.
Answers include structured navigation actions using actual record IDs. An unavailable
backend produces an error, not a demo answer. Status is recorded operational status,
not GPS tracking. Historical/demo records still present in the database are included;
the assistant does not silently invent, remove or relabel them as production data.

Explicit questions use intent rules and exact record calculations. Other phrasings
use cosine retrieval over intent descriptions. Without credentials this uses TF-IDF
vectors (lexical NLP, not learned semantic embeddings). With `GEMINI_API_KEY` set on
the server, it can use Google's `gemini-embedding-001`; `AI_EMBEDDING_MODEL` overrides
the model. Only question text and intent descriptions are sent for embedding, not
the operational database. Description vectors are cached in process memory; live
records are fetched afresh for each answer. No vector database is necessary for
this small intent catalogue. Low-confidence matches ask for clarification.

The application does not currently use a generative model to compose these answers.
Responses are rendered from retrieved facts, keeping counts, amounts and links exact.

Run `npm run test:assistant`, `npm test`, `npm run lint`, and `npm run build`.
