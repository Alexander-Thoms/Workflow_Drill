const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = 3000;

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const dataFile = path.join(__dirname, 'data', 'settings.json');
let submittedData = [];

// ---------- Storage ----------
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) submittedData = parsed;
    }
  } catch (err) {
    console.error('Error loading data:', err.message);
  }
}

function saveData() {
  try {
    const dir = path.dirname(dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(submittedData, null, 2));
  } catch (err) {
    console.error('Error saving data:', err.message);
  }
}

// ---------- Basic Auth ----------
function isAuthenticated(req, res, next) {
  const header = req.headers.authorization || '';
  const expected = 'Basic ' + Buffer.from(ADMIN_USER + ':' + ADMIN_PASS).toString('base64');

  if (header !== expected) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Authentication required');
  }
  next();
}

// ---------- Validation ----------
function validate(body) {
  const errors = [];
  const { adminName, adminEmail, phoneNumber, companyName, companyAddress } = body;

  if (!adminName || adminName.trim().length === 0) errors.push('Admin name is required');
  if (!adminEmail || adminEmail.trim().length === 0) errors.push('Admin email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) errors.push('Please enter a valid email');
  if (!phoneNumber || phoneNumber.trim().length === 0) errors.push('Phone number is required');
  if (!companyName || companyName.trim().length === 0) errors.push('Company name is required');
  if (!companyAddress || companyAddress.trim().length === 0) errors.push('Company address is required');

  return errors;
}

// ---------- Views ----------
function renderPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Settings</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 text-gray-800 p-6">
  <div class="max-w-2xl mx-auto space-y-8">
    <h1 class="text-2xl font-bold">Admin Settings</h1>

    <form id="settings-form" class="bg-white p-6 rounded shadow space-y-4">
      <div>
        <label class="block font-medium">Admin Name</label>
        <input name="adminName" class="border w-full p-2 rounded" required>
      </div>
      <div>
        <label class="block font-medium">Admin Email</label>
        <input name="adminEmail" type="email" class="border w-full p-2 rounded" required>
      </div>
      <div>
        <label class="block font-medium">Phone Number</label>
        <input name="phoneNumber" class="border w-full p-2 rounded" required>
      </div>
      <div>
        <label class="block font-medium">Company Name</label>
        <input name="companyName" class="border w-full p-2 rounded" required>
      </div>
      <div>
        <label class="block font-medium">Company Address</label>
        <textarea name="companyAddress" class="border w-full p-2 rounded" required></textarea>
      </div>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Save Settings</button>
      <p id="form-status" class="text-sm"></p>
    </form>

    <div>
      <h2 class="text-xl font-semibold mb-2">Submitted Settings</h2>
      <table class="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr class="border-b text-left">
            <th class="p-2">Name</th>
            <th class="p-2">Email</th>
            <th class="p-2">Phone</th>
            <th class="p-2">Company</th>
            <th class="p-2">Address</th>
          </tr>
        </thead>
        <tbody id="data-body"></tbody>
      </table>
    </div>
  </div>

  <script>
    const form = document.getElementById('settings-form');
    const status = document.getElementById('form-status');
    const body = document.getElementById('data-body');

    async function loadData() {
      const res = await fetch('/settings-data');
      const data = await res.json();
      body.innerHTML = '';
      data.forEach(function (row) {
        const tr = document.createElement('tr');
        tr.className = 'border-b';
        tr.innerHTML =
          '<td class="p-2">' + row.adminName + '</td>' +
          '<td class="p-2">' + row.adminEmail + '</td>' +
          '<td class="p-2">' + row.phoneNumber + '</td>' +
          '<td class="p-2">' + row.companyName + '</td>' +
          '<td class="p-2">' + row.companyAddress + '</td>';
        body.appendChild(tr);
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'text-sm';

      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch('/submit-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok) {
        status.className = 'text-sm text-red-600';
        status.textContent = (result.errors || ['Error']).join(', ');
        return;
      }

      status.className = 'text-sm text-green-600';
      status.textContent = 'Settings saved!';
      form.reset();
      loadData();
    });

    loadData();
  </script>
</body>
</html>`;
}

// ---------- Routes ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', isAuthenticated, (req, res) => {
  res.send(renderPage());
});

app.post('/submit-settings', isAuthenticated, (req, res) => {
  const errors = validate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors: errors });
  }

  const entry = {
    adminName: req.body.adminName.trim(),
    adminEmail: req.body.adminEmail.trim(),
    phoneNumber: req.body.phoneNumber.trim(),
    companyName: req.body.companyName.trim(),
    companyAddress: req.body.companyAddress.trim(),
    timestamp: new Date().toISOString()
  };

  submittedData.push(entry);
  saveData();
  res.json({ success: true, data: entry });
});

app.get('/settings-data', isAuthenticated, (req, res) => {
  res.json(submittedData);
});

loadData();
app.listen(PORT, () => {
  console.log('Round 1 server running on http://localhost:' + PORT);
});
