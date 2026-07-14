Create a complete Node.js/Express application with a responsive admin settings page featuring a form with comprehensive validation. The application should include:

1. File Structure:
   - server.js (Express server with validation logic)
   - package.json (with proper dependencies)
   - public/index.html (form UI with Tailwind CSS)
   - public/assets/ (static files)
   - data/ (JSON data storage directory)

2. Features:
   - Admin authentication using Bearer token (ADMIN_TOKEN environment variable)
   - Settings form with fields for: adminName, adminEmail, phoneNumber, companyName, companyAddress
   - Server-side validation with constraints: required fields, email format, max lengths
   - Client-side validation for better UX
   - Dashboard to display all submitted form data
   - Error handling with user-friendly messages
   - JSON data persistence

3. Validation Constraints:
   - Email: valid format, max 100 characters
   - Phone: valid format if provided, max 20 characters
   - All fields: required if in config, max length constraints
   - All text fields: max 100 characters except address (max 500)

4. User Experience:
   - Real-time client validation
   - Form submission loading state
   - Success/error message display
   - Dynamic dashboard updates without page refresh

5. Testing:
   - Write unit tests for validation functions
   - Write integration tests for API endpoints
   - Verify all validation rules
   - Test form submission flow

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the ADMIN_TOKEN environment variable (required):
   ```bash
   # Windows (PowerShell)
   $env:ADMIN_TOKEN="your-secure-token-here"
   
   # Linux/macOS
   export ADMIN_TOKEN="your-secure-token-here"
   ```

3. Run the server:
   ```bash
   node server.js
   ```

4. Open http://localhost:3000 in your browser

5. Use the ADMIN_TOKEN as a Bearer token for API authentication:
   - Header: `Authorization: Bearer your-secure-token-here`

Deliverable: A fully functional Express application with a complete admin interface.