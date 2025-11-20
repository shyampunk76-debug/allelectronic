// Configuration - Update API endpoint here
const API_CONFIG = {
    // Use local API when developing locally; in production use the current origin
    baseURL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin
};

console.log('🔧 API Configuration:', {
    hostname: window.location.hostname,
    baseURL: API_CONFIG.baseURL,
    protocol: window.location.protocol,
    port: window.location.port
});

// ========================================
// MODAL DIALOG SYSTEM
// ========================================

function showDuplicateConfirmDialog(duplicateInfo, onAllow, onCancel) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    `;

    const submittedDate = duplicateInfo.createdAt ? new Date(duplicateInfo.createdAt).toLocaleDateString() : 'recently';

    modal.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 1.5rem;">
                ⚠️ Duplicate Repair Request Detected
            </h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 15px 0;">
                We found that you've already submitted a repair request for:
            </p>
            <p style="
                background: #f0f0f0;
                padding: 12px;
                border-left: 4px solid #667eea;
                margin: 0 0 15px 0;
                border-radius: 4px;
                font-weight: 600;
                color: #1a1a2e;
            ">
                📦 ${escapeHtml(duplicateInfo.product)}
            </p>
            <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
                <strong>Request ID:</strong> ${escapeHtml(duplicateInfo.id)}<br>
                <strong>Status:</strong> ${escapeHtml(duplicateInfo.status)}<br>
                <strong>Submitted:</strong> ${submittedDate}
            </p>
            <p style="color: #666; line-height: 1.6; margin: 0;">
                Is this a new problem with the same product, or did you accidentally submit the same request twice?
            </p>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancelBtn" style="
                padding: 10px 20px;
                background: #e5e7eb;
                color: #374151;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            ">
                Cancel - Same Request
            </button>
            <button id="continueBtn" style="
                padding: 10px 20px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
            ">
                Continue - New Problem
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add button handlers
    document.getElementById('continueBtn').onclick = () => {
        overlay.remove();
        onAllow();
        document.removeEventListener('keydown', escapeHandler);
    };

    document.getElementById('cancelBtn').onclick = () => {
        overlay.remove();
        onCancel();
        document.removeEventListener('keydown', escapeHandler);
    };

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            onCancel();
            document.removeEventListener('keydown', escapeHandler);
        }
    };

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
            onCancel();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Form validation and submission
const repairForm = document.getElementById('repairForm');

// Progress bar functionality
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const requiredFields = ['name', 'email', 'phone', 'product', 'issue'];

function updateProgress() {
    let filledFields = 0;
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim() !== '') {
            filledFields++;
        }
    });
    
    const progress = Math.round((filledFields / requiredFields.length) * 100);
    progressFill.style.width = progress + '%';
    progressText.textContent = progress + '% Complete';
}

// Character counter for issue field
const issueField = document.getElementById('issue');
const issueCounter = document.getElementById('issueCounter');

if (issueField && issueCounter) {
    issueField.addEventListener('input', function() {
        const length = this.value.length;
        const maxLength = this.getAttribute('maxlength') || 500;
        issueCounter.textContent = `${length} / ${maxLength}`;
        
        // Change color when approaching limit
        if (length > maxLength * 0.9) {
            issueCounter.style.color = '#e74c3c';
        } else if (length > maxLength * 0.7) {
            issueCounter.style.color = '#f39c12';
        } else {
            issueCounter.style.color = '#999';
        }
    });
}

// Update progress on field changes
requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', updateProgress);
        field.addEventListener('blur', updateProgress);
    }
});

// Validation rules
const validators = {
    name: {
        validate: (value) => value.trim().length >= 2,
        message: 'Name must be at least 2 characters long'
    },
    email: {
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address'
    },
    phone: {
        validate: (value) => {
            // Support international format: +countrycode and up to 15 digits
            const cleaned = value.replace(/[\s\-\(\)\+]/g, '');
            return /^\d{10,}$/.test(cleaned) && cleaned.length <= 15;
        },
        message: 'Please enter a valid phone number (10-15 digits, supports +countrycode)'
    },
    product: {
        validate: (value) => value.trim().length >= 3,
        message: 'Product name must be at least 3 characters long'
    },
    issue: {
        validate: (value) => value.trim().length >= 10,
        message: 'Please describe the issue in at least 10 characters'
    }
};

// Clear error message when user starts typing
Object.keys(validators).forEach(fieldName => {
    const field = document.getElementById(fieldName);
    if (field) {
        field.addEventListener('input', function() {
            const errorElement = document.getElementById(`${fieldName}Error`);
            if (errorElement) {
                errorElement.classList.remove('show');
                field.classList.remove('error');
            }
        });
    }
});

// Form validation function
function validateForm() {
    let isValid = true;
    const formData = {};

    // Validate each required field
    for (const [fieldName, rules] of Object.entries(validators)) {
        const field = document.getElementById(fieldName);
        const value = field.value;
        const errorElement = document.getElementById(`${fieldName}Error`);

        if (!rules.validate(value)) {
            isValid = false;
            field.classList.add('error');
            if (errorElement) {
                errorElement.textContent = rules.message;
                errorElement.classList.add('show');
            }
        } else {
            field.classList.remove('error');
            if (errorElement) {
                errorElement.classList.remove('show');
            }
            formData[fieldName] = value;
        }
    }

    // Get optional service type if provided
    const serviceType = document.getElementById('serviceType');
    if (serviceType.value) {
        formData.serviceType = serviceType.value;
    }

    return { isValid, formData };
}

// Handle form submission
repairForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formMessage = document.getElementById('formMessage');
    formMessage.classList.remove('success', 'error');
    formMessage.textContent = '';

    // Validate form
    const { isValid, formData } = validateForm();

    if (!isValid) {
        formMessage.classList.add('error');
        formMessage.textContent = 'Please fix the errors above';
        return;
    }

    // Proceed with submission directly (no duplicate check)
    proceedWithSubmission(formData);
});

// Proceed with form submission
async function proceedWithSubmission(formData, forceDuplicate = false) {
    const formMessage = document.getElementById('formMessage');
    const submitButton = repairForm.querySelector('.btn-submit');
    const originalButtonText = submitButton.textContent;
    
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        // Submit form to server
        const response = await submitFormData(formData, forceDuplicate);

        // Handle duplicate detection
        if (response.isDuplicate) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            
            // Show duplicate confirmation dialog
            showDuplicateConfirmDialog(
                response.duplicate,
                () => {
                    // User chose to submit anyway (new problem)
                    proceedWithSubmission(formData, true);
                },
                () => {
                    // User canceled submission
                    formMessage.classList.add('error');
                    formMessage.textContent = '✓ Submission canceled - duplicate request not submitted.';
                    setTimeout(() => {
                        formMessage.classList.remove('error');
                        formMessage.textContent = '';
                    }, 3000);
                }
            );
            return;
        }

        // Show success message
        formMessage.classList.add('success');
        formMessage.textContent = `✓ Repair request submitted successfully! Submission ID: ${response.submissionId}. We will contact you shortly.`;

        // Reset form
        repairForm.reset();

        // Scroll to message
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Clear success message after 5 seconds
        setTimeout(() => {
            formMessage.classList.remove('success');
            formMessage.textContent = '';
        }, 5000);

    } catch (error) {
        formMessage.classList.add('error');
        formMessage.textContent = '✗ Error submitting request: ' + error.message;
        console.error('Form submission error:', error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Submit form data to server with better error handling
async function submitFormData(formData, forceDuplicate = false) {
    const endpoint = `${API_CONFIG.baseURL}/api/repair-request`;
    
    console.log('📤 Submitting to:', endpoint);
    console.log('📝 Form data:', formData);

    // Add forceDuplicate flag if provided
    const submitData = forceDuplicate ? { ...formData, forceDuplicate: true } : formData;

    // Use AbortController to add a client-side timeout so the UI doesn't hang indefinitely
    const controller = new AbortController();
    const timeoutMs = 15000; // 15 seconds
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(submitData),
            signal: controller.signal
        });
        clearTimeout(timeout);

        console.log('📬 Response status:', response.status);
        console.log('📬 Response headers:', {
            'Content-Type': response.headers.get('Content-Type'),
            'Status': response.status
        });

        // Try to parse JSON response
        let data;
        try {
            data = await response.json();
            console.log('📦 Response data:', data);
        } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            console.error('Response text:', response.statusText);
            throw new Error(`Server error (${response.status}): ${response.statusText}`);
        }

        // Handle duplicate detection (409 Conflict)
        if (response.status === 409) {
            console.log('⚠️ Duplicate detected:', data.duplicate);
            return { isDuplicate: true, duplicate: data.duplicate };
        }

        if (!response.ok) {
            if (data.errors) {
                const errorList = Object.values(data.errors).join(', ');
                throw new Error(errorList);
            }
            throw new Error(data.message || `Server returned ${response.status}`);
        }

        // Store locally as backup
        const submissions = JSON.parse(localStorage.getItem('repairSubmissions') || '[]');
        submissions.push({
            ...formData,
            timestamp: new Date().toISOString(),
            submissionId: data.submissionId
        });
        localStorage.setItem('repairSubmissions', JSON.stringify(submissions));

        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('❌ Fetch error: request timed out');
            throw new Error('Request timed out. Please try again.');
        }
        console.error('❌ Fetch error:', error);
        throw error;
    }
}

// Format phone number as user types (supports international format)
const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value;
        
        // Check if it starts with + (international format)
        const hasPlus = value.startsWith('+');
        
        // Remove all non-digit characters
        let digitsOnly = value.replace(/\D/g, '');
        
        // Limit to 15 digits (international standard)
        if (digitsOnly.length > 15) {
            digitsOnly = digitsOnly.slice(0, 15);
        }
        
        // Format based on length and type
        if (digitsOnly.length === 0) {
            value = '';
        } else if (hasPlus) {
            // International format: +countrycode-number
            if (digitsOnly.length <= 3) {
                value = '+' + digitsOnly;
            } else if (digitsOnly.length <= 6) {
                value = '+' + digitsOnly.slice(0, 3) + '-' + digitsOnly.slice(3);
            } else {
                // Format as +countrycode-XXX-XXXXX...
                value = '+' + digitsOnly.slice(0, 3) + '-' + digitsOnly.slice(3, 6) + '-' + digitsOnly.slice(6);
            }
        } else {
            // Domestic format: (XXX) XXX-XXXX...
            if (digitsOnly.length <= 3) {
                value = digitsOnly;
            } else if (digitsOnly.length <= 6) {
                value = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
            } else {
                value = `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
            }
        }

        e.target.value = value;
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('nav a, .btn[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Display stored submissions in console (for demo purposes)
function viewSubmissions() {
    const submissions = JSON.parse(localStorage.getItem('repairSubmissions') || '[]');
    console.log('All Repair Submissions:', submissions);
    console.log('Submission History (with duplicates detection):', duplicateDetector.history);
    return submissions;
}

// Add a helper function to clear submissions (for testing)
function clearSubmissions() {
    localStorage.removeItem('repairSubmissions');
    localStorage.removeItem('repairSubmissionHistory');
    duplicateDetector.history = [];
    duplicateDetector.saveHistory();
    console.log('All submissions cleared');
}

// Test API connectivity
async function testAPI() {
    const healthEndpoint = `${API_CONFIG.baseURL}/api/health`;
    console.log('Testing API connectivity to:', healthEndpoint);
    
    try {
        const response = await fetch(healthEndpoint);
        const data = await response.json();
        console.log('✅ API is working:', data);
        return true;
    } catch (error) {
        console.error('❌ API connection failed:', error);
        console.log('Make sure the server is running at:', API_CONFIG.baseURL);
        return false;
    }
}

// Initialize
console.log('All Electronic - Repair Request System Loaded');
console.log('API Base URL:', API_CONFIG.baseURL);
console.log('Tip: Use viewSubmissions() to see all repair requests');
console.log('Tip: Use clearSubmissions() to clear all stored requests');
console.log('Tip: Use testAPI() to check server connectivity');

// Auto-test API on page load
window.addEventListener('load', () => {
    setTimeout(testAPI, 1000);
});

// ========================================
// ADMIN LOGIN MODAL (from repair page)
// ========================================

const adminLoginLink = document.getElementById('adminLoginLink');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminModalClose = document.getElementById('adminModalClose');
const adminQuickLoginForm = document.getElementById('adminQuickLoginForm');
const adminQuickUser = document.getElementById('adminQuickUser');
const adminQuickPass = document.getElementById('adminQuickPass');
const adminQuickMsg = document.getElementById('adminQuickMsg');

if (adminLoginLink) {
    adminLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        adminLoginModal.classList.remove('hidden');
    });
}

if (adminModalClose) {
    adminModalClose.addEventListener('click', () => {
        adminLoginModal.classList.add('hidden');
    });
}

// Close modal on overlay click
if (adminLoginModal) {
    adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
            adminLoginModal.classList.add('hidden');
        }
    });
}

// Handle quick admin login
if (adminQuickLoginForm) {
    adminQuickLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = adminQuickUser.value.trim();
        const pass = adminQuickPass.value.trim();
        
        if (!user || !pass) {
            adminQuickMsg.style.color = '#b91c1c';
            adminQuickMsg.textContent = '❌ Enter both username and password';
            return;
        }

        adminQuickMsg.textContent = 'Signing in...';
        adminQuickMsg.style.color = '#666';

        try {
            const res = await fetch(`${API_CONFIG.baseURL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });
            const data = await res.json();
            
            if (data.status === 'success' && data.user && data.user.role) {
                // Store token AND role, then redirect to admin page
                sessionStorage.setItem('admin_token', data.token);
                sessionStorage.setItem('admin_role', data.user.role);
                console.log('Login successful - Token and role stored:', data.user.role);
                adminQuickMsg.style.color = '#065f46';
                adminQuickMsg.textContent = '✅ Signed in! Redirecting...';
                setTimeout(() => {
                    window.location.href = '/admin.html';
                }, 800);
            } else if (data.status === 'success' && (!data.user || !data.user.role)) {
                adminQuickMsg.style.color = '#b91c1c';
                adminQuickMsg.textContent = '❌ Server error: User role missing';
            } else {
                adminQuickMsg.style.color = '#b91c1c';
                adminQuickMsg.textContent = '❌ ' + (data.message || 'Sign in failed');
            }
        } catch (err) {
            adminQuickMsg.style.color = '#b91c1c';
            adminQuickMsg.textContent = '❌ Error: ' + err.message;
        }
    });
}
