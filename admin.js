// Admin front-end script with JWT auth
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

// Check if user is logged in on page load
function checkAuth() {
  authToken = sessionStorage.getItem('admin_token');
  currentUserRole = sessionStorage.getItem('admin_role');
  
  if (!authToken || !currentUserRole) {
    // Not logged in, redirect to home page
    window.location.href = '/index.html';
    return false;
  }
  
  // Logged in, show admin area
  adminArea.classList.remove('hidden');
  
  // Display user role info
  const roleInfo = document.getElementById('userRoleInfo');
  const roleDisplay = currentUserRole === 'admin' ? '👑 Administrator' : '👤 Staff User';
  const permissions = currentUserRole === 'admin' 
    ? 'Full access: View, Edit, Delete, Export'
    : 'Limited access: View, Edit, Export only';
  roleInfo.innerHTML = `<strong>${roleDisplay}</strong> • ${permissions}`;
  
  // Show/hide features based on role
  if (currentUserRole === 'admin') {
    btnDeleteSelected?.classList.remove('hidden');
  } else {
    btnDeleteSelected?.classList.add('hidden');
  }
  
  return true;
}

function showStatus(msg, isError = false) {
  statusMessage.textContent = msg;
  statusMessage.style.color = isError ? '#b91c1c' : '#065f46';
}

function logout() {
  authToken = null;
  currentUserRole = null;
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_role');
  // Redirect to repair request page (home page)
  window.location.href = '/index.html';
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
    <td style="font-size: 0.85rem;">${r.serviceType || '-'}</td>
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
    serviceType: document.getElementById('manualServiceType').value,
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
      serviceType: row.querySelector('td:nth-child(7)')?.textContent || '',
      product: row.querySelector('td:nth-child(8)')?.textContent || '',
      issue: row.querySelector('td:nth-child(9)')?.textContent || '',
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
      ['Repair Requests Export', '', '', '', '', '', '', '', ''],
      ['Generated on:', new Date().toLocaleString(), '', '', '', '', '', '', ''],
      ['Total Records:', data.length, '', '', '', '', '', '', ''],
      [],
      ['ID', 'Name', 'Email', 'Phone', 'Service Category', 'Product', 'Issue', 'Status', 'Payment']
    ];
    
    data.forEach(item => {
      worksheet_data.push([
        item.id,
        item.name,
        item.email,
        item.phone,
        item.serviceType || '-',
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
    { wch: 18 }, // Service Category
    { wch: 20 }, // Product
    { wch: 40 }, // Issue
    { wch: 12 }, // Status
    { wch: 15 }  // Payment
  ];
  
  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }
  ];
  
  // Add styling to header row (row 5, index 4)
  const headerRow = 4;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(col => {
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
    item.serviceType || '-',
    item.product,
    item.issue.substring(0, 50) + (item.issue.length > 50 ? '...' : ''), // Truncate long issues
    item.status,
    item.payment
  ]);
  
  // Add table
  doc.autoTable({
    head: [['ID', 'Name', 'Email', 'Phone', 'Service Cat.', 'Product', 'Issue', 'Status', 'Payment']],
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
      0: { cellWidth: 26 }, // ID
      1: { cellWidth: 22 }, // Name
      2: { cellWidth: 32 }, // Email
      3: { cellWidth: 22 }, // Phone
      4: { cellWidth: 20 }, // Service Category
      5: { cellWidth: 26 }, // Product
      6: { cellWidth: 50 }, // Issue
      7: { cellWidth: 20 }, // Status
      8: { cellWidth: 22 }  // Payment
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

// ========================================
// TAB NAVIGATION
// ========================================

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetTab = e.target.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    if (targetTab === 'requests') {
      document.getElementById('tabRequests').classList.add('active');
    }
  });
});

// ========================================
// USER MANAGEMENT MODAL
// ========================================

const btnManageUsers = document.getElementById('btnManageUsers');
const userManagementModal = document.getElementById('userManagementModal');
const closeUserManagementModal = document.getElementById('closeUserManagementModal');

btnManageUsers?.addEventListener('click', () => {
  hideUserForm(); // Ensure form is hidden, list is shown
  userManagementModal.classList.remove('hidden');
  loadUsers(); // Load users when modal opens
});

closeUserManagementModal?.addEventListener('click', () => {
  userManagementModal.classList.add('hidden');
});

// ========================================
// CHANGE PASSWORD
// ========================================

const btnChangePassword = document.getElementById('btnChangePassword');
const changePasswordModal = document.getElementById('changePasswordModal');
const changePasswordForm = document.getElementById('changePasswordForm');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordChange = document.getElementById('cancelPasswordChange');
const passwordMessage = document.getElementById('passwordMessage');

btnChangePassword?.addEventListener('click', () => {
  changePasswordModal.classList.remove('hidden');
  changePasswordForm.reset();
  passwordMessage.textContent = '';
});

closePasswordModal?.addEventListener('click', () => {
  changePasswordModal.classList.add('hidden');
});

cancelPasswordChange?.addEventListener('click', () => {
  changePasswordModal.classList.add('hidden');
});

changePasswordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    passwordMessage.textContent = '❌ New passwords do not match';
    passwordMessage.style.color = '#dc2626';
    return;
  }
  
  if (newPassword.length < 4) {
    passwordMessage.textContent = '❌ Password must be at least 4 characters';
    passwordMessage.style.color = '#dc2626';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      passwordMessage.textContent = '✅ ' + data.message;
      passwordMessage.style.color = '#10b981';
      changePasswordForm.reset();
      setTimeout(() => {
        changePasswordModal.classList.add('hidden');
      }, 1500);
    } else {
      passwordMessage.textContent = '❌ ' + data.error;
      passwordMessage.style.color = '#dc2626';
    }
  } catch (error) {
    console.error('Change password error:', error);
    passwordMessage.textContent = '❌ Failed to change password';
    passwordMessage.style.color = '#dc2626';
  }
});

// ========================================
// USER MANAGEMENT
// ========================================

const usersTableBody = document.querySelector('#usersTable tbody');
const btnAddUser = document.getElementById('btnAddUser');
const userForm = document.getElementById('userForm');
const userFormSection = document.getElementById('userFormSection');
const userListSection = document.getElementById('userListSection');
const btnCancelUserForm = document.getElementById('btnCancelUserForm');
const userMessage = document.getElementById('userMessage');
const userFormTitle = document.getElementById('userFormTitle');

// Show user management button only for admins
function updateUIForRole() {
  const headerTitle = document.getElementById('headerTitle');
  
  if (currentUserRole === 'admin') {
    btnManageUsers?.classList.remove('hidden');
    if (headerTitle) headerTitle.textContent = 'Admin Console';
  } else {
    btnManageUsers?.classList.add('hidden');
    if (headerTitle) headerTitle.textContent = 'User Console';
  }
}

// Show user form, hide user list
function showUserForm() {
  userFormSection?.classList.remove('hidden');
  userListSection?.classList.add('hidden');
}

// Hide user form, show user list
function hideUserForm() {
  userFormSection?.classList.add('hidden');
  userListSection?.classList.remove('hidden');
  userForm?.reset();
  userMessage.textContent = '';
}

// Load all users
async function loadUsers() {
  if (!authToken || currentUserRole !== 'admin') {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/user-management`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.users) {
      renderUsersTable(data.users);
    } else {
      console.error('Failed to load users:', data.error);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Render users table
function renderUsersTable(users) {
  usersTableBody.innerHTML = '';
  
  users.forEach(user => {
    const tr = document.createElement('tr');
    const roleBadgeClass = user.role === 'admin' ? 'admin' : 'user';
    const created = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
    const modified = user.lastModified ? new Date(user.lastModified).toLocaleDateString() : 'N/A';
    
    tr.innerHTML = `
      <td><strong>${user.username}</strong></td>
      <td><span class="role-badge ${roleBadgeClass}">${user.role.toUpperCase()}</span></td>
      <td>${created}</td>
      <td>${modified}</td>
      <td>
        <div class="user-actions">
          <button class="btn-small" onclick="editUser('${user.id}', '${user.username}', '${user.role}')">✏️ Edit</button>
          <button class="btn-small" onclick="resetUserPassword('${user.id}', '${user.username}')">🔑 Reset Password</button>
          <button class="btn-small danger" onclick="deleteUser('${user.id}', '${user.username}')">🗑️ Delete</button>
        </div>
      </td>
    `;
    
    usersTableBody.appendChild(tr);
  });
}

// Add new user
btnAddUser?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  userFormTitle.textContent = '➕ Add New User';
  document.getElementById('editUserId').value = '';
  document.getElementById('userUsername').disabled = false;
  document.getElementById('passwordField').style.display = 'block';
  document.getElementById('userPassword').required = true;
  document.getElementById('btnSaveUser').textContent = 'Create User';
  userForm.reset();
  userMessage.textContent = '';
  showUserForm();
});

// Cancel user form
btnCancelUserForm?.addEventListener('click', () => {
  hideUserForm();
});

// Edit user (change role)
window.editUser = function(userId, username, role) {
  userFormTitle.textContent = '✏️ Edit User';
  document.getElementById('editUserId').value = userId;
  document.getElementById('userUsername').value = username;
  document.getElementById('userUsername').disabled = true;
  document.getElementById('userRole').value = role;
  document.getElementById('passwordField').style.display = 'none';
  document.getElementById('userPassword').required = false;
  document.getElementById('btnSaveUser').textContent = 'Update User';
  userMessage.textContent = '';
  showUserForm();
};

// Reset user password
window.resetUserPassword = async function(userId, username) {
  // Show reset password modal
  document.getElementById('resetUserId').value = userId;
  document.getElementById('resetUsername').value = username;
  document.getElementById('resetUserDisplay').textContent = username;
  document.getElementById('resetPasswordForm').reset();
  document.getElementById('resetPasswordMessage').textContent = '';
  document.getElementById('resetPasswordModal').classList.remove('hidden');
};

// Delete user
window.deleteUser = async function(userId, username) {
  if (!confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/user-management`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      alert('✅ ' + data.message);
      loadUsers();
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Delete user error:', error);
    alert('❌ Failed to delete user');
  }
};

// Save user (create or update)
userForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userId = document.getElementById('editUserId').value;
  const username = document.getElementById('userUsername').value;
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  
  try {
    if (userId) {
      // Update existing user (role only)
      const response = await fetch(`${API_BASE}/api/admin/user-management`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ userId, newRole: role })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        userMessage.textContent = '✅ User updated successfully';
        userMessage.style.color = '#10b981';
        setTimeout(() => {
          hideUserForm();
          loadUsers();
        }, 1000);
      } else {
        userMessage.textContent = '❌ ' + data.error;
        userMessage.style.color = '#dc2626';
      }
    } else {
      // Create new user
      const response = await fetch(`${API_BASE}/api/admin/user-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ username, password, role })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        userMessage.textContent = '✅ ' + data.message;
        userMessage.style.color = '#10b981';
        setTimeout(() => {
          hideUserForm();
          loadUsers();
        }, 1000);
      } else {
        userMessage.textContent = '❌ ' + data.error;
        userMessage.style.color = '#dc2626';
      }
    }
  } catch (error) {
    console.error('Save user error:', error);
    userMessage.textContent = '❌ Failed to save user';
    userMessage.style.color = '#dc2626';
  }
});

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target === changePasswordModal) {
    changePasswordModal.classList.add('hidden');
  }
  if (e.target === userManagementModal) {
    userManagementModal.classList.add('hidden');
    hideUserForm(); // Reset form when modal closes
  }
});

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================

// Check authentication and initialize
if (checkAuth()) {
  // Update UI for role (show/hide Manage Users button)
  updateUIForRole();
  // Load repair requests
  loadRequests();
}

// Reset Password Modal Handlers
const resetPasswordModal = document.getElementById('resetPasswordModal');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const closeResetPasswordModal = document.getElementById('closeResetPasswordModal');
const cancelResetPassword = document.getElementById('cancelResetPassword');
const resetPasswordMessage = document.getElementById('resetPasswordMessage');

closeResetPasswordModal?.addEventListener('click', () => {
  resetPasswordModal.classList.add('hidden');
});

cancelResetPassword?.addEventListener('click', () => {
  resetPasswordModal.classList.add('hidden');
});

resetPasswordForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userId = document.getElementById('resetUserId').value;
  const username = document.getElementById('resetUsername').value;
  const newPassword = document.getElementById('resetNewPassword').value;
  const confirmPassword = document.getElementById('resetConfirmPassword').value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    resetPasswordMessage.textContent = '❌ Passwords do not match';
    resetPasswordMessage.style.color = '#dc2626';
    return;
  }
  
  if (newPassword.length < 4) {
    resetPasswordMessage.textContent = '❌ Password must be at least 4 characters';
    resetPasswordMessage.style.color = '#dc2626';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/admin/user-management`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ userId, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      resetPasswordMessage.textContent = `✅ Password updated successfully for ${username}`;
      resetPasswordMessage.style.color = '#10b981';
      setTimeout(() => {
        resetPasswordModal.classList.add('hidden');
        loadUsers();
      }, 1500);
    } else {
      resetPasswordMessage.textContent = '❌ ' + data.error;
      resetPasswordMessage.style.color = '#dc2626';
    }
  } catch (error) {
    console.error('Reset password error:', error);
    resetPasswordMessage.textContent = '❌ Failed to reset password';
    resetPasswordMessage.style.color = '#dc2626';
  }
});

// Close modals on background click
document.addEventListener('click', (e) => {
  if (e.target === resetPasswordModal) {
    resetPasswordModal.classList.add('hidden');
  }
});
