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
  }
});

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
