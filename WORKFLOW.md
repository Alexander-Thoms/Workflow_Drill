# Workflow Drill — Round 1 vs Round 2

## Overview

Two implementations of an admin settings form: Round 1 from a vague 2-line prompt, Round 2 from a detailed prompt with file structure, constraints, and verification steps. Branches `round1` and `round2` contain each result; this doc compares them.

## Specific Code Diffs

### 1. Authentication
- **`round1/server.js:38-47`**: Basic Auth with plain `===` string comparison. Password `admin123` is hardcoded.
- **`round2/server.js:141-164`**: Bearer token auth using `crypto.timingSafeEqual()` to resist timing attacks. Token read from `ADMIN_TOKEN` env var.
- **AI mistake (round2)**: The prompt specified HTTP Basic Auth (`admin:admin123`), but the AI implemented Bearer token auth instead. The app uses a different auth scheme than requested.

### 2. Validation
- **`round1/server.js:50-62`**: Only checks field presence (`if (!adminName || adminName.trim().length === 0)`). No type checking, no length limits, no phone format validation.
- **`round2/server.js:207-253`**: Adds `typeof !== 'string'` type guards, per-field length limits (50/100/20/100/500 chars), phone format regex `[\d\s+()-]+`, and email regex validation. 12+ constraint checks vs round1's 6.

### 3. XSS Vulnerability
- **`round1/server.js:133-137`**: Inline HTML rendered via `innerHTML` with raw string concatenation: `tr.innerHTML = '<td>' + row.adminName + '</td>'`. Any user input with `<script>` tags executes.
- **`round2/server.js:65-73`**: `sanitizeString()` strips `<>` brackets and HTML-encodes `&` and `"` before any output. No raw interpolation into innerHTML.

### 4. Storage
- **`round1/server.js:27-34`**: Sync `fs.writeFileSync` — blocks the event loop on every write.
- **`round2/server.js:99-111`**: Async `fs.promises` with atomic write (temp file + rename). No event loop blocking, no partial-write corruption.

### 5. Error Handling
- **`round1/server.js:181-199`**: No try/catch on POST route. Any runtime exception returns a raw 500 with no JSON body.
- **`round2/server.js:207-279`**: Full try/catch with `console.error` logging and `{ success: false, errors: ['Internal server error'] }` response.

### 6. AI Mistake — Double Rate Limiting
**`round2/server.js:172`** applies rate limiting globally via `app.use(rateLimit)`, then **line 178** applies it again on the `/` route: `app.get('/', rateLimit, ...)`. Each request to `/` is counted twice, causing premature 429 errors. The redundant middleware on the route should be removed.

### 7. Architecture
- **Round 1**: Entire UI rendered as a template string inside `server.js` (inline HTML, inline CSS via Tailwind CDN). No separate frontend files.
- **Round 2**: Serves `public/index.html` statically with separate `public/css/styles.css` and `public/js/app.js`. Adds Helmet security headers, print stylesheets, responsive design.

## Correctness

Round 1 validates 5 fields for presence only. Round 2 enforces 12+ constraints including type checks, length limits, and format validation. Round 1 has no input sanitization (XSS-vulnerable), while Round 2 strips dangerous characters from all inputs.

## Edge Cases

Round 2 handles: empty fields, email format, phone format, max lengths, special characters, concurrent requests, file system errors, and auth failures. Round 1 only handles empty fields and a basic email check.

## Review Effort

Round 1: ~30 min review, 8-12 issues. Round 2: ~1 hr review (complexity is higher but fewer bugs per line), 2-3 issues (double rate limiting, Bearer-vs-Basic mismatch, unused `limit` variable at line 11).

## Rules Learned (see updated CLAUDE.md)

1. Use `crypto.timingSafeEqual` for credential comparison — timing attacks are real.
2. Never interpolate user data into `innerHTML` — always sanitize first.
3. Keep file structure consistent across branches for meaningful `git diff` output.
