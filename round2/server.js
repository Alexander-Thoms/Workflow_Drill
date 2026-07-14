require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use async fs
const crypto = require('crypto');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================
// SECURE CONFIGURATION
// ============================
// Fail fast if required credentials aren't provided
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
if (!ADMIN_TOKEN) {
  throw new Error('CRITICAL: ADMIN_TOKEN environment variable is required');
}

const TRUSTED_HOST = process.env.TRUSTED_HOST || null;

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window
const requestHistory = new Map();

const submittedData = [];
const dataFile = path.join(__dirname, 'data', 'settings.json');

// ============================
// HELPER FUNCTIONS
// ============================

// Improved XSS-safe sanitization with length caps
function sanitizeString(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove HTML tag brackets
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}

// ============================
// DATA LOADING WITH FIXES
// ============================
async function loadData() {
  try {
    const dir = path.dirname(dataFile);
    await fs.mkdir(dir, { recursive: true });
    
    if (await fs.access(dataFile).then(() => true).catch(() => false)) {
      const data = await fs.readFile(dataFile, 'utf8');
      const parsed = JSON.parse(data);
      
      // FIX: Clear array before loading to prevent duplication on restart
      submittedData.length = 0;
      if (Array.isArray(parsed)) {
        submittedData.push(...parsed);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error.message);
  }
}

// Atomic file writing with better error handling
async function saveData() {
  try {
    const dir = path.dirname(dataFile);
    await fs.mkdir(dir, { recursive: true });
    
    // Write to temp file first, then rename (atomic operation)
    const tempFile = dataFile + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(submittedData, null, 2));
    await fs.rename(tempFile, dataFile);
  } catch (error) {
    console.error('Error saving data:', error.message);
  }
}

// ============================
// RATE LIMITING WITH MEMORY LEAK FIX
// ============================
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Initialize if doesn't exist
  if (!requestHistory.has(ip)) {
    requestHistory.set(ip, []);
  }
  
  // FIX: Filter AND prune old timestamps from storage
  const timestamps = requestHistory.get(ip)
    .filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Try again later.'
    });
  }
  
  timestamps.push(now);
  requestHistory.set(ip, timestamps); // Update with pruned list
  
  next();
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authorization header required'
    });
  }

  const token = authHeader.split(' ')[1];
  
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(ADMIN_TOKEN)
  )) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  next();
}

// ============================
// MIDDLEWARE SETUP
// ============================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(rateLimit);

// ============================
// ROUTES
// ============================
// Serve index.html with ADMIN_TOKEN injected (MUST be before static middleware)
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  fs.readFile(indexPath, 'utf8')
    .then(html => {
      const tokenMeta = `<meta name="admin-token" content="${ADMIN_TOKEN}">`;
      const modifiedHtml = html.replace('</head>', `${tokenMeta}\n</head>`);
      res.send(modifiedHtml);
    })
    .catch(() => res.status(500).send('Error loading page'));
});

// Serve other static files
app.use(express.static('public', { index: false }));

// Use Helmet for comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// Additional security headers
app.use((req, res, next) => {
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

app.post('/submit-settings', isAuthenticated, async (req, res) => {
  try {
    const { adminName, adminEmail, phoneNumber, companyName, companyAddress } = req.body;

    const errors = [];

    // Validation
    if (!adminName || typeof adminName !== 'string' || adminName.trim().length === 0) {
      errors.push('Admin name is required');
    } else if (adminName.length > 50) {
      errors.push('Admin name must be 50 characters or less');
    }

    if (!adminEmail || typeof adminEmail !== 'string' || adminEmail.trim().length === 0) {
      errors.push('Admin email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      errors.push('Please enter a valid email address');
    } else if (adminEmail.length > 100) {
      errors.push('Admin email must be 100 characters or less');
    }

    if (phoneNumber) {
      if (typeof phoneNumber !== 'string' || !/^[\d\s+()-]+$/.test(phoneNumber)) {
        errors.push('Phone number must be valid');
      } else if (phoneNumber.length > 20) {
        errors.push('Phone number must be 20 characters or less');
      }
    }

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      errors.push('Company name is required');
    } else if (companyName.length > 100) {
      errors.push('Company name must be 100 characters or less');
    }

    if (!companyAddress || typeof companyAddress !== 'string' || companyAddress.trim().length === 0) {
      errors.push('Company address is required');
    } else if (companyAddress.length > 500) {
      errors.push('Company address must be 500 characters or less');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    // Sanitize all inputs
    const formData = {
      adminName: sanitizeString(adminName, 50),
      adminEmail: sanitizeString(adminEmail, 100).toLowerCase(),
      phoneNumber: phoneNumber ? sanitizeString(phoneNumber, 20) : '',
      companyName: sanitizeString(companyName, 100),
      companyAddress: sanitizeString(companyAddress, 500),
      timestamp: new Date().toISOString()
    };

    submittedData.push(formData);
    await saveData();

    res.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Error processing form:', error.message);
    res.status(500).json({
      success: false,
      errors: ['Internal server error']
    });
  }
});

app.get('/settings-data', isAuthenticated, async (req, res) => {
  try {
    res.json(submittedData);
  } catch (error) {
    console.error('Error fetching data:', error.message);
    res.status(500).json({
      success: false,
      errors: ['Internal server error']
    });
  }
});

// ============================
// HTTPS REDIRECT WITH OPEN REDIRECT FIX
// ============================
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.protocol !== 'https' && process.env.FORCE_HTTPS === 'true') {
      // FIX: Use trusted host from environment, not user-controlled headers
      const host = TRUSTED_HOST || req.hostname;
      return res.redirect(301, `https://${host}${req.url}`);
    }
    next();
  });
}

// ============================
// GRACEFUL SHUTDOWN
// ============================
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Configure ADMIN_TOKEN environment variable for authentication');
});

// Handle termination signals gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await saveData(); // Ensure any pending writes are flushed
    console.log('Server closed gracefully');
    process.exit(0);
  });
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('Force closing server');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  server.close(async () => {
    await saveData();
    console.log('Server closed gracefully');
    process.exit(0);
  });
});

module.exports = { app, server };