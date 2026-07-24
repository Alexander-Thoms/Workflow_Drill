# Project Rules

## 1. Code Organization
- All JavaScript files must be in the root directory (server.js)
- All HTML templates must be in public/ directory
- All static assets in public/assets/
- Data storage in data/ directory

## 2. Validation Rules
- Required fields: adminName, adminEmail, phoneNumber, companyName, companyAddress
- Email validation: Must be in valid email format
- Length constraints:
  - adminName: max 50 characters
  - adminEmail: max 100 characters
  - phoneNumber: max 20 characters
  - companyName: max 100 characters
  - companyAddress: max 500 characters

## 3. Authentication
- Use HTTP Basic Auth with credentials: admin/admin123
- All sensitive endpoints require authentication
- Credentials stored in environment variables in real deployment

## 4. Error Handling
- All server errors return 500 with generic message
- Form validation returns 400 with specific error messages
- Authentication failures return 401

## 5. Input Sanitization (Learned from drill)
- Strip HTML brackets (`<>`) and encode entities (`&`, `"`) from all user-supplied strings before rendering
- Never use `innerHTML` with concatenated user data — use `sanitizeString()` or `textContent`
- Apply length caps during sanitization, not just validation

## 6. Security Comparisons (Learned from drill)
- Use `crypto.timingSafeEqual()` for comparing credentials, not `===`
- For env-required config, fail fast with `throw new Error()` at startup, not silently at runtime
- Rate limiting middleware should be applied once per route, not layered (duplicate `app.use(rateLimit)` + route-level `rateLimit` double-counts hits)

## 7. Branch Strategy for A/B Comparison (Learned from drill)
- When comparing two implementations of the same feature, create separate branches from the same base commit
- Keep identical file paths across branches so `git diff <branch1>..<branch2>` shows meaningful code diffs, not path renames
- Always install dependencies and verify the app starts before pushing a branch
