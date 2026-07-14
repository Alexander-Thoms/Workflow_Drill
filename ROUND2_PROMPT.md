Create a complete Node.js/Express application with a responsive admin settings page featuring a form with comprehensive validation. The application should include:

1. File Structure:
   - server.js (Express server with validation logic)
   - package.json (with proper dependencies)
   - public/index.html (form UI with Tailwind CSS)
   - public/assets/ (static files)
   - data/ (JSON data storage directory)

2. Features:
   - Admin authentication using HTTP Basic Auth (credentials: admin/admin123)
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

Deliverable: A fully functional Express application with a complete admin interface.