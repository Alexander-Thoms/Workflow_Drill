# Admin Settings Form

A Node.js/Express application with a responsive admin settings page. The form
posts settings (admin name, email, phone, company name/address) which are
validated server-side, persisted to JSON, and displayed in a live dashboard.
The UI includes light/dark mode, accessibility support, and printable output.

The application lives in the `round2/` directory.

## File Structure

```
round2/
  .env                     # ADMIN_TOKEN and server configuration
  server.js                # Express server, validation, auth, persistence
  public/
    index.html             # Single page UI (Tailwind CSS via CDN)
    css/
      styles.css           # App styles, print rules, accessibility helpers
    js/
      app.js               # Front-end logic (form, validation, theme, print)
  data/
    settings.json          # JSON data storage
```

## Features

- **Authentication**: Bearer token via the `ADMIN_TOKEN` environment variable (loaded from `round2/.env`).
- **Settings form** with fields: `adminName`, `adminEmail`, `phoneNumber`, `companyName`, `companyAddress`.
- **Server-side validation**: required fields, email format, max lengths (name 50, email 100, phone 20, company 100, address 500).
- **Client-side validation** with real-time feedback and `aria-invalid`/`aria-describedby` for screen readers.
- **Dashboard** that lists all submitted records and reloads on submit, with no full page refresh.
- **Persistence**: submitted settings are saved to `data/settings.json` and reloaded into memory on server start, so they survive restarts.
- **Light/Dark mode**: toggle button (moon/sun) with `localStorage` persistence and no-flash initialization.
- **Accessibility**: skip link, ARIA landmarks, `aria-live` status regions, decorative SVGs marked `aria-hidden`, placeholder hints.
- **Print**: a Print button renders only the submitted settings (print CSS forces readable output in either theme).
- **Rate limiting**: in-memory limiter with stale-entry cleanup (CWE-770) plus `express-rate-limit` on the index route.

## Validation Constraints

- Email: valid format, max 100 characters.
- Phone: valid format if provided, max 20 characters.
- `adminName`, `adminEmail`, `companyName`, `companyAddress`: required.
- Length caps: adminName 50, adminEmail 100, phoneNumber 20, companyName 100, companyAddress 500.

## Running the Application

1. Install dependencies (from the repo root):
   ```bash
   npm install
   ```

2. Configure the admin token. The server reads `round2/.env`, for example:
   ```
   ADMIN_TOKEN=change_this_to_a_strong_random_token_at_least_32_chars
   PORT=3000
   ```
   Alternatively set the environment variable directly before starting.

3. Run the server (from the `round2/` directory):
   ```bash
   cd round2
   node server.js
   ```

4. Open http://localhost:3000 in your browser.

5. API requests require the token as a Bearer credential:
   - Header: `Authorization: Bearer <ADMIN_TOKEN>`

## API Endpoints

- `GET /` — serves the admin settings page (rate limited).
- `POST /submit-settings` — accepts and validates settings JSON (auth required).
- `GET /settings-data` — returns all submitted settings (auth required).
