// Admin front-end script with JWT auth
const adminLoginForm = document.getElementById('adminLoginForm');
const adminArea = document.getElementById('adminArea');
const statusMessage = document.getElementById('statusMessage');
const requestsTableBody = document.querySelector('#requestsTable tbody');
const btnRefresh = document.getElementById('btnRefresh');
const btnSearch = document.getElementById('btnSearch');
const btnLogout = document.getElementById('btnLogout');
const btnDeleteSelected = document.getElementById('btnDeleteSelected');
const selectAllCheckbox = document.getElementById('selectAll');
const searchId = document.getElementById('searchId');
const paginationDiv = document.getElementById('pagination');
const paginationInfo = document.getElementById('paginationInfo');
const btnPrevPage = document.getElementById('btnPrevPage');
const btnNextPage = document.getElementById('btnNextPage');

const API_BASE = window.location.origin;
let authToken = null;
let itemsPerPage = 50;
let currentUserRole = null; // Store user role from login
let currentPage = 1;
let totalPages = 1;
let totalRecords = 0;

function showStatus(msg, isError = false) {
  statusMessage.textContent = msg;
  statusMessage.style.color = isError ? '#b91c1c' : '#065f46';
}

function logout() {
  authToken = null;
  currentUserRole = null;
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_role');
  adminArea.classList.add('hidden');
  document.querySelector('.login').style.display = 'block';
  clearTable();
  showStatus('Logged out successfully');
  // Clear form fields
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}

function clearTable() { requestsTableBody.innerHTML = ''; }

function renderRow(r, index) {
  const tr = document.createElement('tr');
  tr.dataset.id = r.id;
  tr.dataset.status = r.status || 'pending';
  tr.dataset.payment = r.payment || 'payment-pending';
  tr.innerHTML = `
    <td><input type="checkbox" class="row-checkbox" data-id="${r.id}"></td>
    <td class="serial-num">${index}</td>
    <td class="small">${r.id}</td>
    <td>${r.name}</td>
    <td class="email-cell">${r.email || ''}</td>
    <td class="phone-cell">${formatPhone(r.phone)}</td>
    <td>${r.product}</td>
    <td>${r.issue}</td>
    <td>
      <select data-id="${r.id}" class="statusSelect select">
        <option value="pending" ${r.status==='pending'?'selected':''}>pending</option>
        <option value="in-progress" ${r.status==='in-progress'?'selected':''}>in-progress</option>
        <option value="completed" ${r.status==='completed'?'selected':''}>completed</option>
        <option value="cancelled" ${r.status==='cancelled'?'selected':''}>cancelled</option>
      </select>
    </td>
    <td>
      <select data-id="${r.id}" class="paymentSelect select">
        <option value="payment-pending" ${r.payment==='payment-pending'?'selected':''}>payment-pending</option>
        <option value="processing" ${r.payment==='processing'?'selected':''}>processing</option>
        <option value="paid" ${r.payment==='paid'?'selected':''}>paid</option>
      </select>
    </td>
    <td>
      <button class="actionBtn btnSave" data-id="${r.id}">Save</button>
    </td>
  `;
  return tr;
}

function formatPhone(p) { if (!p) return ''; const s = p.replace(/(\d{1,3})(\d{3})(\d{4})$/, (m,a,b,c)=>`${a}-${b}-${c}`); return s; }

async function adminRequest(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${authToken}` 
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      return { status: 'error', message: errorData.message || `Request failed with status ${res.status}` };
    }
    
    return await res.json();
  } catch (err) {
    console.error('Admin request error:', err);
    return { status: 'error', message: err.message };
  }
}

adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();
  if (!user || !pass) return showStatus('Enter credentials', true);

  showStatus('Signing in...');
  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    const data = await res.json();
    if (data.status === 'success' && data.user && data.user.role) {
      authToken = data.token;
      currentUserRole = data.user.role;
      sessionStorage.setItem('admin_token', authToken);
      sessionStorage.setItem('admin_role', currentUserRole);
      console.log('Login successful - Role:', currentUserRole);
      showStatus('Signed in');
      document.querySelector('.login').style.display = 'none';
      adminArea.classList.remove('hidden');
      
      // Display user role info
      const roleInfo = document.getElementById('userRoleInfo');
      const roleDisplay = currentUserRole === 'admin' ? '👑 Administrator' : '👤 Staff User';
      const permissions = currentUserRole === 'admin' 
        ? 'Full access: View, Edit, Delete, Export'
        : 'Limited access: View, Edit, Export only';
      roleInfo.innerHTML = `<strong>${roleDisplay}</strong> • ${permissions}`;
      
      // Show/hide delete button based on role
      if (currentUserRole === 'admin') {
        btnDeleteSelected.classList.remove('hidden');
      } else {
        btnDeleteSelected.classList.add('hidden');
      }
      
      await loadRequests();
    } else if (data.status === 'success' && (!data.user || !data.user.role)) {
      showStatus('Login error: User role missing from server response', true);
      console.error('Server response missing user role:', data);
    } else {
      showStatus(data.message || 'Sign in failed', true);
    }
  } catch (err) {
    showStatus('Sign in error: ' + err.message, true);
  }
});

btnRefresh.addEventListener('click', loadRequests);
btnLogout.addEventListener('click', logout);

// Manual entry form handlers
const btnToggleManualEntry = document.getElementById('btnToggleManualEntry');
const manualEntryForm = document.getElementById('manualEntryForm');
const adminAddRequestForm = document.getElementById('adminAddRequestForm');
const btnClearManualForm = document.getElementById('btnClearManualForm');
const manualEntryMessage = document.getElementById('manualEntryMessage');

// Toggle manual entry form visibility
btnToggleManualEntry.addEventListener('click', () => {
  const isHidden = manualEntryForm.classList.contains('hidden');
  if (isHidden) {
    manualEntryForm.classList.remove('hidden');
    btnToggleManualEntry.textContent = '➖ Hide Form';
  } else {
    manualEntryForm.classList.add('hidden');
    btnToggleManualEntry.textContent = '➕ Show Form';
  }
});

// Clear manual entry form
btnClearManualForm.addEventListener('click', () => {
  adminAddRequestForm.reset();
  manualEntryMessage.textContent = '';
  manualEntryMessage.className = '';
});

// Phone formatting for manual entry
const manualPhoneInput = document.getElementById('manualPhone');
if (manualPhoneInput) {
  manualPhoneInput.addEventListener('input', function(e) {
    let value = e.target.value;
    const hasPlus = value.startsWith('+');
    let digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length > 15) {
      digitsOnly = digitsOnly.slice(0, 15);
    }
    
    if (digitsOnly.length === 0) {
      value = '';
    } else if (hasPlus) {
      if (digitsOnly.length <= 3) {
        value = '+' + digitsOnly;
      } else if (digitsOnly.length <= 6) {
        value = '+' + digitsOnly.slice(0, 3) + '-' + digitsOnly.slice(3);
      } else {
        value = '+' + digitsOnly.slice(0, 3) + '-' + digitsOnly.slice(3, 6) + '-' + digitsOnly.slice(6);
      }
    } else {
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

// Handle manual entry form submission
adminAddRequestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('manualName').value.trim(),
    email: document.getElementById('manualEmail').value.trim(),
    phone: document.getElementById('manualPhone').value.trim(),
    product: document.getElementById('manualProduct').value.trim(),
    issue: document.getElementById('manualIssue').value.trim(),
    status: document.getElementById('manualStatus').value,
    payment: document.getElementById('manualPayment').value
  };
  
  // Basic validation
  if (!formData.name || !formData.phone || !formData.product || !formData.issue) {
    manualEntryMessage.textContent = '❌ Please fill all required fields';
    manualEntryMessage.className = 'error';
    return;
  }
  
  // Submit with duplicate check first
  await submitManualEntry(formData, false);
});

// Function to handle manual entry submission with duplicate detection
async function submitManualEntry(formData, forceDuplicate = false) {
  manualEntryMessage.textContent = '⏳ Adding request...';
  manualEntryMessage.className = '';
  
  try {
    const submitData = forceDuplicate ? { ...formData, forceDuplicate: true } : formData;
    
    const response = await fetch(`${API_BASE}/api/repair-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(submitData)
    });
    
    const result = await response.json();
    
    // Handle duplicate detection (409 status)
    if (response.status === 409 && result.duplicate) {
      manualEntryMessage.textContent = '';
      manualEntryMessage.className = '';
      
      // Show duplicate confirmation dialog
      showDuplicateConfirmDialog(
        result.duplicate,
        () => {
          // User chose to submit anyway (new problem)
          submitManualEntry(formData, true);
        },
        () => {
          // User canceled submission
          manualEntryMessage.textContent = '❌ Submission canceled - duplicate request detected';
          manualEntryMessage.className = 'error';
          setTimeout(() => {
            manualEntryMessage.textContent = '';
            manualEntryMessage.className = '';
          }, 3000);
        }
      );
      return;
    }
    
    if (response.ok && result.status === 'success') {
      manualEntryMessage.textContent = `✅ Request added successfully! ID: ${result.submissionId}`;
      manualEntryMessage.className = 'success';
      adminAddRequestForm.reset();
      
      // Refresh the table to show the new entry
      setTimeout(async () => {
        await loadRequests();
        manualEntryMessage.textContent = '';
        manualEntryMessage.className = '';
      }, 2000);
    } else {
      manualEntryMessage.textContent = `❌ Error: ${result.message || 'Failed to add request'}`;
      manualEntryMessage.className = 'error';
    }
  } catch (err) {
    manualEntryMessage.textContent = `❌ Error: ${err.message}`;
    manualEntryMessage.className = 'error';
    console.error('Manual entry error:', err);
  }
}

// Duplicate confirmation dialog (reusable)
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
    z-index: 10000;
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
  `;

  const submittedDate = duplicateInfo.createdAt ? new Date(duplicateInfo.createdAt).toLocaleDateString() : 'recently';

  modal.innerHTML = `
    <div style="margin-bottom: 20px;">
      <h2 style="color: #1a1a2e; margin: 0 0 15px 0; font-size: 1.5rem;">
        ⚠️ Duplicate Repair Request Detected
      </h2>
      <p style="color: #666; line-height: 1.6; margin: 0 0 15px 0;">
        A repair request already exists for this customer and product:
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
        <strong>Customer:</strong> ${escapeHtml(duplicateInfo.name)}<br>
        <strong>Status:</strong> ${escapeHtml(duplicateInfo.status)}<br>
        <strong>Submitted:</strong> ${submittedDate}
      </p>
      <p style="color: #666; line-height: 1.6; margin: 0;">
        Is this a new problem with the same product, or a duplicate entry?
      </p>
    </div>

    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="cancelDuplicateBtn" style="
        padding: 10px 20px;
        background: #e5e7eb;
        color: #374151;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      ">
        Cancel - Duplicate
      </button>
      <button id="continueDuplicateBtn" style="
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
  document.getElementById('continueDuplicateBtn').onclick = () => {
    overlay.remove();
    onAllow();
  };

  document.getElementById('cancelDuplicateBtn').onclick = () => {
    overlay.remove();
    onCancel();
  };

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
      onCancel();
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

// Escape HTML helper
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

// Items per page dropdown handler
const itemsPerPageSelect = document.getElementById('itemsPerPage');
itemsPerPageSelect.addEventListener('change', async (e) => {
  const value = e.target.value;
  itemsPerPage = value === 'all' ? 999999 : parseInt(value);
  currentPage = 1; // Reset to page 1 when changing items per page
  await loadRequests();
});
btnSearch.addEventListener('click', async () => {
  const search = searchId.value.trim();
  if (!search) {
    showStatus('Enter text to search', true);
    return;
  }
  showStatus('Searching...');
  currentPage = 1; // Reset to page 1 for search
  const result = await adminRequest('/api/admin/requests', { search, page: currentPage, limit: itemsPerPage });
  if (result.status === 'success') {
    clearTable();
    const startIndex = (currentPage - 1) * itemsPerPage;
    (result.data || []).forEach((r, index) => requestsTableBody.appendChild(renderRow(r, startIndex + index + 1)));
    attachRowHandlers();
    
    // Update pagination for search results
    if (result.pagination) {
      totalPages = result.pagination.pages || 1;
      totalRecords = result.pagination.total || 0;
      updatePaginationUI();
    }
    
    showStatus(`Found ${result.data.length} result(s) matching "${search}"`);
  } else {
    showStatus(result.message || 'Search failed', true);
  }
});

// Allow search on Enter key
searchId.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btnSearch.click();
  }
});

// Clear search and refresh when input is cleared
searchId.addEventListener('input', (e) => {
  if (e.target.value.trim() === '') {
    // Auto-refresh when search is cleared
    setTimeout(() => {
      if (searchId.value.trim() === '') {
        loadRequests();
      }
    }, 300);
  }
});

async function loadRequests() {
  showStatus('Loading...');
  const result = await adminRequest('/api/admin/requests', { page: currentPage, limit: itemsPerPage });
  if (result.status === 'success') {
    clearTable();
    const startIndex = (currentPage - 1) * itemsPerPage;
    (result.data || []).forEach((r, index) => requestsTableBody.appendChild(renderRow(r, startIndex + index + 1)));
    attachRowHandlers();
    
    // Update pagination info
    if (result.pagination) {
      totalRecords = result.pagination.total;
      totalPages = result.pagination.pages;
      updatePaginationUI();
    }
    
    const pagInfo = result.pagination ? ` (${result.pagination.total} total)` : '';
    showStatus(`Loaded ${result.data.length} requests${pagInfo}`);
  } else {
    showStatus(result.message || 'Failed to load', true);
  }
}

function updatePaginationUI() {
  if (totalPages <= 1 && itemsPerPage >= 999999) {
    paginationDiv.classList.add('hidden');
    return;
  }
  
  paginationDiv.classList.remove('hidden');
  paginationInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalRecords} total)`;
  
  btnPrevPage.disabled = currentPage <= 1;
  btnNextPage.disabled = currentPage >= totalPages;
}

function attachRowHandlers() {
  document.querySelectorAll('.btnSave').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const statusEl = document.querySelector(`.statusSelect[data-id="${id}"]`);
      const paymentEl = document.querySelector(`.paymentSelect[data-id="${id}"]`);
      const payload = { id, status: statusEl.value, payment: paymentEl.value };

      console.log('Saving request:', payload);

      // Per-row indicator elements
      let indicator = btn.parentElement.querySelector('.save-indicator');
      if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'save-indicator';
        btn.parentElement.appendChild(indicator);
      }

      // Show spinner and disable button while saving
      indicator.innerHTML = '<span class="save-spinner" aria-hidden="true"></span><span class="save-text">Saving...</span>';
      btn.classList.add('btn-saving');

      try {
        const res = await adminRequest('/api/admin/update-status', payload);
        console.log('Save response:', res);
        
        if (res && res.status === 'success') {
          indicator.innerHTML = '<span class="save-success">Saved ✓</span>';
          showStatus('Changes saved successfully');
        } else {
          const msg = res && res.message ? res.message : 'Error saving';
          indicator.innerHTML = `<span class="save-error">Error ✕</span>`;
          showStatus(msg, true);
          console.error('Save failed:', res);
        }
      } catch (err) {
        indicator.innerHTML = `<span class="save-error">Error ✕</span>`;
        showStatus('Save error: ' + err.message, true);
        console.error('Save exception:', err);
      } finally {
        btn.classList.remove('btn-saving');
        // Clear the indicator after 3 seconds on success, longer on error
        setTimeout(() => {
          if (indicator && indicator.parentElement) indicator.remove();
        }, 3000);
      }
    };
  });
  
  // Note: Individual row checkbox handlers are now managed via event delegation on the table body
  
  // Attach status change handlers to update row colors
  document.querySelectorAll('.statusSelect').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const row = requestsTableBody.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        row.dataset.status = e.target.value;
      }
    });
  });
  
  // Attach payment change handlers to update row colors
  document.querySelectorAll('.paymentSelect').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const row = requestsTableBody.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        row.dataset.payment = e.target.value;
      }
    });
  });
}

// Decode JWT token to verify role (basic client-side check)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (err) {
    console.error('JWT decode error:', err);
    return null;
  }
}

// Verify stored role matches JWT token role
function verifyStoredRole() {
  const stored = sessionStorage.getItem('admin_token');
  const storedRole = sessionStorage.getItem('admin_role');
  
  if (!stored || !storedRole) return false;
  
  const decoded = decodeJWT(stored);
  if (!decoded || !decoded.role) {
    console.error('Invalid token - missing role in JWT');
    return false;
  }
  
  // Check if stored role matches JWT role
  if (decoded.role !== storedRole) {
    console.error('Role mismatch! JWT role:', decoded.role, 'Stored role:', storedRole);
    return false;
  }
  
  // Check if token is expired
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    console.error('Token expired');
    return false;
  }
  
  return true;
}

// Load stored token on page load
window.addEventListener('load', () => {
  const stored = sessionStorage.getItem('admin_token');
  const storedRole = sessionStorage.getItem('admin_role');
  
  // Verify token and role integrity
  if (stored && storedRole && verifyStoredRole()) {
    authToken = stored;
    currentUserRole = storedRole;
    console.log('Session restored - Role:', currentUserRole);
    document.querySelector('.login').style.display = 'none';
    adminArea.classList.remove('hidden');
    
    // Display user role info
    const roleInfo = document.getElementById('userRoleInfo');
    const roleDisplay = currentUserRole === 'admin' ? '👑 Administrator' : '👤 Staff User';
    const permissions = currentUserRole === 'admin' 
      ? 'Full access: View, Edit, Delete, Export'
      : 'Limited access: View, Edit, Export only';
    roleInfo.innerHTML = `<strong>${roleDisplay}</strong> • ${permissions}`;
    
    // Show/hide delete button based on role
    if (currentUserRole === 'admin') {
      btnDeleteSelected.style.display = 'none'; // Hidden by default until selection
    } else {
      btnDeleteSelected.style.display = 'none'; // Always hidden for non-admin
    }
    
    loadRequests();
  } else if (stored) {
    // If token exists but verification failed, clear everything and force re-login
    console.warn('Token verification failed - forcing re-login for security');
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_role');
    authToken = null;
    currentUserRole = null;
    showStatus('Session expired or invalid - please login again', true);
  }
});

// Periodic integrity check to prevent role tampering during session
setInterval(() => {
  if (authToken && currentUserRole) {
    const storedRole = sessionStorage.getItem('admin_role');
    
    // Verify stored role hasn't been tampered with
    if (storedRole !== currentUserRole) {
      console.error('Security alert: Role tampering detected!');
      logout();
      showStatus('Security violation detected - please login again', true);
      return;
    }
    
    // Verify token still matches stored role
    if (!verifyStoredRole()) {
      console.error('Security alert: Token/role mismatch detected!');
      logout();
      showStatus('Session integrity check failed - please login again', true);
    }
  }
}, 30000); // Check every 30 seconds

// Select all checkbox handler
selectAllCheckbox.addEventListener('change', (e) => {
  const isChecked = e.target.checked;
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    
    // Batch DOM updates
    checkboxes.forEach(cb => cb.checked = isChecked);
    
    // Defer visibility update
    requestAnimationFrame(() => {
      updateDeleteButtonVisibility();
    });
  });
});

// Update delete button visibility based on selection (debounced)
let visibilityUpdateTimeout;
function updateDeleteButtonVisibility() {
  // Debounce to prevent excessive updates
  clearTimeout(visibilityUpdateTimeout);
  visibilityUpdateTimeout = setTimeout(() => {
    const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const deleteBtn = btnDeleteSelected;
    
    if (currentUserRole === 'admin' && selectedCheckboxes.length > 0) {
      deleteBtn.style.display = 'inline-block';
      deleteBtn.textContent = `🗑️ Delete Selected (${selectedCheckboxes.length})`;
    } else {
      deleteBtn.style.display = 'none';
    }
  }, 50); // 50ms debounce
}

// Delete selected requests
btnDeleteSelected.addEventListener('click', (e) => {
  // Prevent default and stop propagation immediately
  e.preventDefault();
  e.stopPropagation();
  
  // Defer heavy work to not block UI
  requestAnimationFrame(async () => {
    const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
    
    if (selectedIds.length === 0) {
      showStatus('No requests selected', true);
      return;
    }
    
    // Use shorter confirmation for better UX
    const confirmMsg = `Delete ${selectedIds.length} request(s)?\n\nThis cannot be undone!`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    // Immediate UI feedback
    btnDeleteSelected.disabled = true;
    btnDeleteSelected.textContent = '🗑️ Deleting...';
    showStatus(`Deleting ${selectedIds.length} request(s)...`);
    
    try {
      const res = await adminRequest('/api/admin/delete-requests', { ids: selectedIds });
      
      if (res && res.status === 'success') {
        showStatus(`✓ Deleted ${res.deletedCount} request(s)`);
        selectAllCheckbox.checked = false;
        
        // Defer reload to not block UI
        requestAnimationFrame(() => {
          loadRequests();
        });
      } else {
        const msg = res && res.message ? res.message : 'Delete failed';
        showStatus(msg, true);
        btnDeleteSelected.disabled = false;
        updateDeleteButtonVisibility();
      }
    } catch (err) {
      showStatus('Delete error: ' + err.message, true);
      btnDeleteSelected.disabled = false;
      updateDeleteButtonVisibility();
    }
  });
});

// Pagination button handlers
btnPrevPage.addEventListener('click', async () => {
  if (currentPage > 1) {
    currentPage--;
    await loadRequests();
  }
});

// Event delegation for row checkboxes to avoid attaching individual handlers
requestsTableBody.addEventListener('change', (e) => {
  if (e.target.classList.contains('row-checkbox')) {
    updateDeleteButtonVisibility();
  }
});

btnNextPage.addEventListener('click', async () => {
  if (currentPage < totalPages) {
    currentPage++;
    await loadRequests();
  }
});

// Export functionality
const btnExportSelected = document.getElementById('btnExportSelected');
const exportMenu = document.getElementById('exportMenu');

// Update export button visibility along with delete button
function updateActionButtonsVisibility() {
  const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  const deleteBtn = btnDeleteSelected;
  const exportBtn = btnExportSelected;
  
  if (selectedCheckboxes.length > 0) {
    exportBtn.classList.remove('hidden');
    exportBtn.textContent = `📥 Export Selected (${selectedCheckboxes.length})`;
    
    if (currentUserRole === 'admin') {
      deleteBtn.style.display = 'inline-block';
      deleteBtn.textContent = `🗑️ Delete Selected (${selectedCheckboxes.length})`;
    } else {
      deleteBtn.style.display = 'none';
    }
  } else {
    exportBtn.classList.add('hidden');
    deleteBtn.style.display = 'none';
    exportMenu.classList.add('hidden');
  }
}

// Replace old updateDeleteButtonVisibility with new function
function updateDeleteButtonVisibility() {
  updateActionButtonsVisibility();
}

// Toggle export menu
btnExportSelected.addEventListener('click', (e) => {
  e.stopPropagation();
  exportMenu.classList.toggle('hidden');
});

// Close export menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.export-controls')) {
    exportMenu.classList.add('hidden');
  }
});

// Get selected requests data
function getSelectedRequestsData() {
  const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
  
  return selectedIds.map(id => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (!row) return null;
    
    return {
      id: id,
      name: row.querySelector('td:nth-child(4)')?.textContent || '',
      email: row.querySelector('.email-cell')?.textContent || '',
      phone: row.querySelector('.phone-cell')?.textContent || '',
      product: row.querySelector('td:nth-child(7)')?.textContent || '',
      issue: row.querySelector('td:nth-child(8)')?.textContent || '',
      status: row.querySelector('.statusSelect')?.value || '',
      payment: row.querySelector('.paymentSelect')?.value || ''
    };
  }).filter(Boolean);
}

// Export to Excel
function exportToExcel(data) {
  if (data.length === 0) {
    showStatus('No data to export', true);
    return;
  }
  
  // Show immediate feedback
  showStatus('Preparing Excel export...');
  
  // Defer heavy Excel generation to not block UI
  requestAnimationFrame(() => {
    // Prepare data for Excel
    const worksheet_data = [
      ['Repair Requests Export', '', '', '', '', '', '', ''],
      ['Generated on:', new Date().toLocaleString(), '', '', '', '', '', ''],
      ['Total Records:', data.length, '', '', '', '', '', ''],
      [],
      ['ID', 'Name', 'Email', 'Phone', 'Product', 'Issue', 'Status', 'Payment']
    ];
    
    data.forEach(item => {
      worksheet_data.push([
        item.id,
        item.name,
        item.email,
        item.phone,
        item.product,
        item.issue,
        item.status,
        item.payment
      ]);
    });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheet_data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // ID
    { wch: 15 }, // Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 20 }, // Product
    { wch: 40 }, // Issue
    { wch: 12 }, // Status
    { wch: 15 }  // Payment
  ];
  
  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
  ];
  
  // Add styling to header row (row 5, index 4)
  const headerRow = 4;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
    const cellRef = col + (headerRow + 1);
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "667eea" } },
        alignment: { horizontal: "center" }
      };
    }
  });
  
  XLSX.utils.book_append_sheet(wb, ws, "Repair Requests");
  
  // Generate filename with timestamp
  const filename = `repair_requests_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
  
  showStatus(`Successfully exported ${data.length} record(s) to Excel`);
  exportMenu.classList.add('hidden');
  }); // End requestAnimationFrame
}

// Export to PDF
function exportToPDF(data) {
  if (data.length === 0) {
    showStatus('No data to export', true);
    return;
  }
  
  // Show immediate feedback
  showStatus('Preparing PDF export...');
  
  // Defer heavy PDF generation to not block UI
  requestAnimationFrame(() => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(102, 126, 234);
  doc.text('Repair Requests Export', 14, 20);
  
  // Add metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total Records: ${data.length}`, 14, 33);
  
  // Prepare table data
  const tableData = data.map(item => [
    item.id,
    item.name,
    item.email,
    item.phone,
    item.product,
    item.issue.substring(0, 50) + (item.issue.length > 50 ? '...' : ''), // Truncate long issues
    item.status,
    item.payment
  ]);
  
  // Add table
  doc.autoTable({
    head: [['ID', 'Name', 'Email', 'Phone', 'Product', 'Issue', 'Status', 'Payment']],
    body: tableData,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 28 }, // ID
      1: { cellWidth: 25 }, // Name
      2: { cellWidth: 35 }, // Email
      3: { cellWidth: 25 }, // Phone
      4: { cellWidth: 30 }, // Product
      5: { cellWidth: 60 }, // Issue
      6: { cellWidth: 22 }, // Status
      7: { cellWidth: 25 }  // Payment
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { top: 40, left: 14, right: 14 }
  });
  
  // Add page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
  }
  
  // Generate filename with timestamp
  const filename = `repair_requests_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
  doc.save(filename);
  
  showStatus(`Successfully exported ${data.length} record(s) to PDF`);
  exportMenu.classList.add('hidden');
  }); // End requestAnimationFrame
}

// Handle export format selection
document.querySelectorAll('.export-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Defer heavy work to not block UI
    requestAnimationFrame(() => {
      const format = e.target.dataset.format;
      const data = getSelectedRequestsData();
      
      if (format === 'xlsx') {
        exportToExcel(data);
      } else if (format === 'pdf') {
        exportToPDF(data);
      }
    });
  });
});
