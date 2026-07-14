# Project Rules

## 1. Code Organization
- All JavaScript files must be in the root directory (server.js)
- All HTML templates must be in public/ directory
- All static assets in public/assets/
- Data storage in data/ directory

## 2. Validation Rules
- Required fields: adminName, adminEmail, companyName, companyAddress
- Email validation: Must be in valid email format
- Length constraints:
  - adminName: max 50 characters
  - adminEmail: max 100 characters
  - phoneNumber: max 20 characters (if provided)
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
