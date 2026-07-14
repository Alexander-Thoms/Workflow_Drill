const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Store data in memory
const submittedData = [];

const dataFile = path.join(__dirname, 'data', 'settings.json');

// Load saved data on startup
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf8');
      const parsed = JSON.parse(data);
      // Use loaded data if it has a length property (array), otherwise use empty array
      if (Array.isArray(parsed)) {
        submittedData.push(...parsed);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to file
function saveData() {
  try {
    // Ensure data directory exists
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(submittedData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load initial data
loadData();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin authentication middleware
function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
  const username = auth[0];
  const password = auth[1];

  if (!username || !password) {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication credentials'
    });
  }

  if (username === 'admin' && password === 'admin123') {
    next();
  } else {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
}

app.post('/submit-settings', isAuthenticated, (req, res) => {
  try {
    const { adminName, adminEmail, phoneNumber, companyName, companyAddress } = req.body;

    const errors = [];

    if (!adminName || adminName.trim().length === 0) {
      errors.push('Admin name is required');
    } else if (adminName.length > 50) {
      errors.push('Admin name must be 50 characters or less');
    }

    if (!adminEmail || adminEmail.trim().length === 0) {
      errors.push('Admin email is required');
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(adminEmail)) {
      errors.push('Please enter a valid email address');
    } else if (adminEmail.length > 100) {
      errors.push('Admin email must be 100 characters or less');
    }

    if (phoneNumber) {
      if (!/^[\d\s+()-]+$/i.test(phoneNumber)) {
        errors.push('Phone number must be valid');
      } else if (phoneNumber.length > 20) {
        errors.push('Phone number must be 20 characters or less');
      }
    }

    if (!companyName || companyName.trim().length === 0) {
      errors.push('Company name is required');
    } else if (companyName.length > 100) {
      errors.push('Company name must be 100 characters or less');
    }

    if (!companyAddress || companyAddress.trim().length === 0) {
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

    const formData = {
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      companyName: companyName.trim(),
      companyAddress: companyAddress.trim(),
      timestamp: new Date().toISOString()
    };

    submittedData.push(formData);
    saveData();

    res.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error']
    });
  }
});

app.get('/settings-data', isAuthenticated, (req, res) => {
  try {
    res.json(submittedData);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      success: false,
      errors: ['Internal server error']
    });
  }
});

app.listen(PORT, () => {
  console.log(`Admin Settings Server running on http://localhost:${PORT}`);
  console.log(`Use admin:admin123 for authentication`);
});