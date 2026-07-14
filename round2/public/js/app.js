// Read ADMIN_TOKEN from meta tag injected by server
const tokenMeta = document.querySelector('meta[name="admin-token"]');
const ADMIN_TOKEN = tokenMeta ? tokenMeta.getAttribute('content') : '';

function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
    };
}

const form = document.getElementById('settingsForm');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const loadingText = document.getElementById('loadingText');
const formMessage = document.getElementById('formMessage');
const dashboardData = document.getElementById('dashboardData');

// Theme toggle (light/dark mode)
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

function syncThemeButton() {
    const isDark = document.documentElement.classList.contains('dark');
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    themeLabel.textContent = isDark ? 'Light' : 'Dark';
    document.getElementById('moonIcon').classList.toggle('hidden', isDark);
    document.getElementById('sunIcon').classList.toggle('hidden', !isDark);
}

themeToggle.addEventListener('click', function () {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    syncThemeButton();
});

syncThemeButton();

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) {
        showMessage('Please fix the errors in the form', 'error');
        return;
    }

    setLoading(true);

    const formData = {
        adminName: document.getElementById('adminName').value,
        adminEmail: document.getElementById('adminEmail').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        companyName: document.getElementById('companyName').value,
        companyAddress: document.getElementById('companyAddress').value,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch('/submit-settings', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Settings saved successfully!', 'success');
            form.reset();
            loadSubmittedData();
        } else {
            showMessage(data.errors && data.errors.length > 0 ? data.errors.join('\n') : 'Failed to save settings. Please try again.', 'error');
        }
    } catch (error) {
        showMessage('Error saving settings. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
});

function validateForm() {
    let isValid = true;

    // Clear all error messages and reset borders
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('error-border'));

    const fields = [
        { id: 'adminName', value: document.getElementById('adminName').value, errorId: 'adminNameError', required: true, maxLength: 50 },
        { id: 'adminEmail', value: document.getElementById('adminEmail').value, errorId: 'adminEmailError', required: true, email: true, maxLength: 100 },
        { id: 'phoneNumber', value: document.getElementById('phoneNumber').value, errorId: 'phoneNumberError', phone: true, maxLength: 20 },
        { id: 'companyName', value: document.getElementById('companyName').value, errorId: 'companyNameError', required: true, maxLength: 100 },
        { id: 'companyAddress', value: document.getElementById('companyAddress').value, errorId: 'companyAddressError', required: true, maxLength: 500 }
    ];

    fields.forEach(field => {
        const inputElement = document.getElementById(field.id);
        const errorElement = document.getElementById(field.errorId);
        inputElement.classList.remove('error-border');
        errorElement.textContent = '';
        inputElement.setAttribute('aria-invalid', 'false');

        if (field.required && !field.value.trim()) {
            errorElement.textContent = 'This field is required';
            inputElement.classList.add('error-border');
            isValid = false;
        } else if (field.maxLength && field.value.length > field.maxLength) {
            errorElement.textContent = `Must be no more than ${field.maxLength} characters`;
            inputElement.classList.add('error-border');
            isValid = false;
        } else if (field.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value)) {
            errorElement.textContent = 'Please enter a valid email address';
            inputElement.classList.add('error-border');
            isValid = false;
        } else if (field.phone && !/^[\d\s+()-]+$/i.test(field.value)) {
            errorElement.textContent = 'Please enter a valid phone number';
            inputElement.classList.add('error-border');
            isValid = false;
        }
    });

    // Reflect validation state for assistive technology
    fields.forEach(field => {
        const inputElement = document.getElementById(field.id);
        const errorElement = document.getElementById(field.errorId);
        inputElement.setAttribute('aria-invalid', errorElement.textContent ? 'true' : 'false');
    });

    return isValid;
}

function showMessage(message, type) {
    const wrapper = document.createElement("div");
    wrapper.className =
        `${type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"} p-3 rounded-md border`;
    wrapper.setAttribute("role", type === "error" ? "alert" : "status");

    const p = document.createElement("p");
    p.className =
        `${type === "success"
            ? "text-green-800"
            : "text-red-800"} whitespace-pre-line`;

    p.textContent = message;   // Safe

    wrapper.appendChild(p);

    formMessage.replaceChildren(wrapper);

    if (type === "success") {
        setTimeout(() => {
            formMessage.replaceChildren();
        }, 5000);
    }
}

function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitText.textContent = isLoading ? 'Saving...' : 'Save Settings';
    loadingText.classList.toggle('hidden', !isLoading);
}

async function loadSubmittedData() {
    try {
        const response = await fetch('/settings-data', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            dashboardData.textContent = 'Failed to load submitted data.';
            dashboardData.className = 'text-red-500';
            return;
        }

        const data = await response.json();

        // Clear previous content
        dashboardData.replaceChildren();

        if (!Array.isArray(data) || data.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'text-gray-500 dark:text-gray-400';
            empty.textContent = 'No settings submitted yet.';
            dashboardData.appendChild(empty);
            return;
        }

        const createField = (label, value, fullWidth = false) => {
            const wrapper = document.createElement('div');
            if (fullWidth) {
                wrapper.className = 'md:col-span-2';
            }

            const title = document.createElement('p');
            title.className = 'text-sm font-medium text-gray-700 dark:text-gray-300';
            title.textContent = label;

            const content = document.createElement('p');
            content.className = 'text-sm text-gray-900 dark:text-white';
            content.textContent = value ?? 'N/A';

            wrapper.appendChild(title);
            wrapper.appendChild(content);

            return wrapper;
        };

        data.forEach(item => {
            const card = document.createElement('div');
            card.className =
                'border dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors';
            card.setAttribute('role', 'group');
            card.setAttribute('aria-label', `Submitted settings for ${item.companyName || 'Unknown company'}`);

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

            grid.appendChild(createField('Admin Name', item.adminName));
            grid.appendChild(createField('Admin Email', item.adminEmail));
            grid.appendChild(createField('Phone Number', item.phoneNumber || 'N/A'));
            grid.appendChild(createField('Company Name', item.companyName));
            grid.appendChild(createField('Company Address', item.companyAddress, true));

            const footer = document.createElement('div');
            footer.className = 'md:col-span-2';

            const timestamp = document.createElement('p');
            timestamp.className = 'text-xs text-gray-500';
            timestamp.textContent = `Submitted at: ${formatDate(item.timestamp)}`;

            footer.appendChild(timestamp);
            grid.appendChild(footer);

            card.appendChild(grid);
            dashboardData.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading data:', error);

        dashboardData.replaceChildren();

        const errorMsg = document.createElement('p');
        errorMsg.className = 'text-red-500';
        errorMsg.textContent = 'Error loading data.';

        dashboardData.appendChild(errorMsg);
    }
}


function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function printData() {
    const printDate = document.getElementById('printDate');
    if (printDate) {
        printDate.textContent = formatDate(new Date().toISOString());
    }
    window.print();
}

// Add real-time validation
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', function () {
        this.classList.remove('error-border');
        const errorId = this.id + 'Error';
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = '';
        }
    });

    input.addEventListener('blur', function () {
        validateSingleInput(this);
    });
});

function validateSingleInput(input) {
    const errorElement = document.getElementById(input.id + 'Error');
    if (!errorElement) return;

    const value = input.value;
    let isValid = true;
    let errorMessage = '';

    if (input.hasAttribute('required') && !value.trim()) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (input.hasAttribute('maxlength')) {
        const maxLength = parseInt(input.getAttribute('maxlength'));
        if (value.length > maxLength) {
            isValid = false;
            errorMessage = `Must be no more than ${maxLength} characters`;
        }
    } else if (input.type === 'email' && value) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    } else if (input.id === 'phoneNumber' && value) {
        if (!/^[\d\s+()-]+$/i.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }

    if (!isValid) {
        errorElement.textContent = errorMessage;
        input.classList.add('error-border');
    } else {
        errorElement.textContent = '';
        input.classList.remove('error-border');
    }

    input.setAttribute('aria-invalid', isValid ? 'false' : 'true');

    return isValid;
}

async function loadLatestSettings() {
    try {
        const response = await fetch('/settings-data', {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const latest = data[data.length - 1];
            document.getElementById('adminName').value = latest.adminName || '';
            document.getElementById('adminEmail').value = latest.adminEmail || '';
            document.getElementById('phoneNumber').value = latest.phoneNumber || '';
            document.getElementById('companyName').value = latest.companyName || '';
            document.getElementById('companyAddress').value = latest.companyAddress || '';
        }
    } catch (error) {
        console.error('Error loading latest settings:', error);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    loadLatestSettings();
    loadSubmittedData();

    // Add field-specific validation on blur
    document.getElementById('adminName').addEventListener('blur', function () {
        validateSingleInput(this);
    });

    document.getElementById('adminEmail').addEventListener('blur', function () {
        validateSingleInput(this);
    });

    document.getElementById('companyName').addEventListener('blur', function () {
        validateSingleInput(this);
    });

    document.getElementById('companyAddress').addEventListener('blur', function () {
        validateSingleInput(this);
    });
});
