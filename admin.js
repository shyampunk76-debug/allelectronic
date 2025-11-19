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

const API_BASE = window.location.origin;
let authToken = null;
let itemsPerPage = 50;
let currentUserRole = null; // Store user role from login

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
      <button class="actionBtn btnView" data-id="${r.id}">View</button>
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
    if (data.status === 'success') {
      authToken = data.token;
      currentUserRole = data.user && data.user.role ? data.user.role : 'admin';
      sessionStorage.setItem('admin_token', authToken);
      sessionStorage.setItem('admin_role', currentUserRole);
      showStatus('Signed in');
      document.querySelector('.login').style.display = 'none';
      adminArea.classList.remove('hidden');
      
      // Show/hide delete button based on role
      if (currentUserRole === 'admin') {
        btnDeleteSelected.classList.remove('hidden');
      } else {
        btnDeleteSelected.classList.add('hidden');
      }
      
      await loadRequests();
    } else {
      showStatus(data.message || 'Sign in failed', true);
    }
  } catch (err) {
    showStatus('Sign in error: ' + err.message, true);
  }
});

btnRefresh.addEventListener('click', loadRequests);
btnLogout.addEventListener('click', logout);

// Items per page dropdown handler
const itemsPerPageSelect = document.getElementById('itemsPerPage');
itemsPerPageSelect.addEventListener('change', async (e) => {
  const value = e.target.value;
  itemsPerPage = value === 'all' ? 999999 : parseInt(value);
  await loadRequests();
});
btnSearch.addEventListener('click', async () => {
  const search = searchId.value.trim();
  if (!search) return showStatus('Enter text to search', true);
  showStatus('Searching...');
  const result = await adminRequest('/api/admin/requests', { search });
  if (result.status === 'success') {
    clearTable();
    (result.data || []).forEach((r, index) => requestsTableBody.appendChild(renderRow(r, index + 1)));
    attachRowHandlers();
    showStatus(`Found ${result.data.length} result(s)`);
  } else {
    showStatus(result.message || 'Search failed', true);
  }
});

async function loadRequests() {
  showStatus('Loading...');
  const result = await adminRequest('/api/admin/requests', { page: 1, limit: itemsPerPage });
  if (result.status === 'success') {
    clearTable();
    (result.data || []).forEach((r, index) => requestsTableBody.appendChild(renderRow(r, index + 1)));
    attachRowHandlers();
    const pagInfo = result.pagination ? ` (${result.pagination.total} total)` : '';
    showStatus(`Loaded ${result.data.length} requests${pagInfo}`);
  } else {
    showStatus(result.message || 'Failed to load', true);
  }
}

function attachRowHandlers() {
  document.querySelectorAll('.btnView').forEach(btn => {
    btn.onclick = () => alert('Full record:\n' + JSON.stringify(findById(btn.dataset.id), null, 2));
  });

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
  
  // Attach checkbox change handlers
  document.querySelectorAll('.row-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateDeleteButtonVisibility);
  });
}

function findById(id) {
  const row = requestsTableBody.querySelector(`tr[data-id="${id}"]`);
  if (!row) return null;
  return {
    id: row.dataset.id,
    name: row.children[1] ? row.children[1].textContent : '',
    email: row.querySelector('.email-cell') ? row.querySelector('.email-cell').textContent : '',
    phone: row.querySelector('.phone-cell') ? row.querySelector('.phone-cell').textContent : ''
  };
}

// Load stored token on page load
window.addEventListener('load', () => {
  const stored = sessionStorage.getItem('admin_token');
  const storedRole = sessionStorage.getItem('admin_role');
  if (stored) {
    authToken = stored;
    currentUserRole = storedRole || 'admin';
    document.querySelector('.login').style.display = 'none';
    adminArea.classList.remove('hidden');
    
    // Show/hide delete button based on role
    if (currentUserRole === 'admin') {
      btnDeleteSelected.classList.remove('hidden');
    } else {
      btnDeleteSelected.classList.add('hidden');
    }
    
    loadRequests();
  }
});

// Select all checkbox handler
selectAllCheckbox.addEventListener('change', (e) => {
  const checkboxes = document.querySelectorAll('.row-checkbox');
  checkboxes.forEach(cb => cb.checked = e.target.checked);
  updateDeleteButtonVisibility();
});

// Update delete button visibility based on selection
function updateDeleteButtonVisibility() {
  const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  const deleteBtn = btnDeleteSelected;
  
  if (currentUserRole === 'admin' && selectedCheckboxes.length > 0) {
    deleteBtn.style.display = 'inline-block';
    deleteBtn.textContent = `🗑️ Delete Selected (${selectedCheckboxes.length})`;
  } else {
    deleteBtn.style.display = 'none';
  }
}

// Delete selected requests
btnDeleteSelected.addEventListener('click', async () => {
  const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
  const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.id);
  
  if (selectedIds.length === 0) {
    showStatus('No requests selected', true);
    return;
  }
  
  const confirmMsg = `Are you sure you want to delete ${selectedIds.length} request(s)?\n\nThis action cannot be undone!\n\nIDs to delete:\n${selectedIds.join(', ')}`;
  
  if (!confirm(confirmMsg)) {
    return;
  }
  
  showStatus(`Deleting ${selectedIds.length} request(s)...`);
  btnDeleteSelected.disabled = true;
  
  try {
    const res = await adminRequest('/api/admin/delete-requests', { ids: selectedIds });
    
    if (res && res.status === 'success') {
      showStatus(`Successfully deleted ${res.deletedCount} request(s)`);
      selectAllCheckbox.checked = false;
      await loadRequests();
    } else {
      const msg = res && res.message ? res.message : 'Delete failed';
      showStatus(msg, true);
    }
  } catch (err) {
    showStatus('Delete error: ' + err.message, true);
  } finally {
    btnDeleteSelected.disabled = false;
    updateDeleteButtonVisibility();
  }
});
