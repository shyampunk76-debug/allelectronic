// Admin front-end script with JWT auth
const adminLoginForm = document.getElementById('adminLoginForm');
const adminArea = document.getElementById('adminArea');
const statusMessage = document.getElementById('statusMessage');
const requestsTableBody = document.querySelector('#requestsTable tbody');
const btnRefresh = document.getElementById('btnRefresh');
const btnSearch = document.getElementById('btnSearch');
const btnLogout = document.getElementById('btnLogout');
const searchId = document.getElementById('searchId');

const API_BASE = window.location.origin;
let authToken = null;
let itemsPerPage = 50;

function showStatus(msg, isError = false) {
  statusMessage.textContent = msg;
  statusMessage.style.color = isError ? '#b91c1c' : '#065f46';
}

function logout() {
  authToken = null;
  sessionStorage.removeItem('admin_token');
  adminArea.classList.add('hidden');
  document.querySelector('.login').style.display = 'block';
  clearTable();
  showStatus('Logged out successfully');
  // Clear form fields
  document.getElementById('adminUser').value = '';
  document.getElementById('adminPass').value = '';
}

function clearTable() { requestsTableBody.innerHTML = ''; }

function renderRow(r) {
  const tr = document.createElement('tr');
  tr.dataset.id = r.id;
  tr.innerHTML = `
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
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify(body)
    });
    return res.json();
  } catch (err) {
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
      sessionStorage.setItem('admin_token', authToken);
      showStatus('Signed in');
      document.querySelector('.login').style.display = 'none';
      adminArea.classList.remove('hidden');
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
    (result.data || []).forEach(r => requestsTableBody.appendChild(renderRow(r)));
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
    (result.data || []).forEach(r => requestsTableBody.appendChild(renderRow(r)));
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
        if (res && res.status === 'success') {
          indicator.innerHTML = '<span class="save-success">Saved ✓</span>';
        } else {
          const msg = res && res.message ? res.message : 'Error saving';
          indicator.innerHTML = `<span class="save-error">Error ✕</span>`;
          showStatus(msg, true);
        }
      } catch (err) {
        indicator.innerHTML = `<span class="save-error">Error ✕</span>`;
        showStatus('Save error: ' + err.message, true);
      } finally {
        btn.classList.remove('btn-saving');
        // Clear the indicator after 3 seconds on success, longer on error
        setTimeout(() => {
          if (indicator && indicator.parentElement) indicator.remove();
        }, 3000);
      }
    };
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
  if (stored) {
    authToken = stored;
    document.querySelector('.login').style.display = 'none';
    adminArea.classList.remove('hidden');
    loadRequests();
  }
});
