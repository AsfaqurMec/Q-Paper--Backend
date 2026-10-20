# Question Import Parser

The import pipeline is split into small modules:

- `questionImport.routes.ts` extracts text from image, PDF, and DOCX uploads.
- `questionImport.chunker.ts` cleans OCR noise and chunks long documents by page and size.
- `questionImport.prompt.ts` builds the extraction and repair prompts.
- `questionImport.schema.ts` defines the strict Zod schema and Gemini structured-output schema.
- `questionImport.parser.ts` runs the multi-pass pipeline: question detection, one-question parsing, schema validation, repair retries, verification, conservative fallback parsing, and duplicate removal.
- `../../services/gemini.ts` is the only module that calls Gemini directly.

The Gemini model and parser behavior are configured through environment variables:

- `GEMINI_MODEL`, default `gemini-2.5-flash`
- `GEMINI_RETRY_COUNT`, default `2`
- `GEMINI_TIMEOUT_MS`, default `45000`
- `GEMINI_TEMPERATURE`, default `0`
- `GEMINI_TOP_P`, default `0.1`
- `GEMINI_TOP_K`, default `1`
- `PARSER_CHUNK_SIZE`, default `4000`
- `PARSER_MAX_PAGES_PER_CHUNK`, default `2`
- `PARSER_CONCURRENCY`, default `3`
- `PARSER_VERIFICATION_ENABLED`, default `true`
- `PARSER_DEBUG`, default `false`

Retry flow:

1. Split the document into small page-aware chunks.
2. Pass 1 detects raw questions only.
3. Pass 2 parses each raw question separately into the strict schema.
4. Every Gemini response is parsed and validated with Zod.
5. Invalid responses are repaired and retried automatically.
6. A verification pass compares the original chunk against parsed JSON and returns only missing or incorrect raw questions.
7. Missing questions are parsed and merged back in.
8. Conservative fallback parsing is used when Gemini fails.
9. Final output is normalized, deduplicated, and returned as `ParsedQuestion[]`.

The parser never guesses correct answers. `correct` stays `null` unless an answer is explicitly present.
