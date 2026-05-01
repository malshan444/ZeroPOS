// Init icons
lucide.createIcons();

// Window controls
document.getElementById('min-button').addEventListener('click', () => window.api.minimize());
document.getElementById('max-button').addEventListener('click', () => window.api.maximize());
document.getElementById('close-button').addEventListener('click', () => window.api.close());
document.getElementById('fullscreen-btn').addEventListener('click', () => window.api.toggleFullscreen());

// Global State
let appSettings = {};
let categories = [];
let items = [];
let cart = [];
let currentCategory = 'All';

// LKR Denominations
const LKR_NOTES = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];

// Format Currency
const formatCurrency = (num) => {
  const symbol = appSettings.currency_symbol !== undefined ? appSettings.currency_symbol : 'Rs. ';
  return symbol + Number(num).toFixed(2);
};

// Initialization
async function initApp() {
  await loadSettings();
  setupLogin();
  setupNavigation();
  setupModals();
  await loadCategories();
  await loadItems();
  setupRegister();
  setupCheckout();
  setupItemsMgmt();
  setupReports();
  setupSettings();
}

async function loadSettings() {
  const res = await window.api.query("SELECT * FROM settings");
  appSettings = {};
  res.forEach(row => {
    appSettings[row.key] = row.value;
  });
  
  if (appSettings.currency_symbol === undefined) {
    appSettings.currency_symbol = 'Rs. ';
  }
  
  document.getElementById('login-restaurant-name').textContent = appSettings.restaurant_name || 'ZeroPOS';
  document.getElementById('login-tagline').textContent = appSettings.tagline || 'Enter your PIN';
  document.getElementById('r-name').textContent = appSettings.restaurant_name || 'ZeroPOS';
  document.getElementById('r-tagline').textContent = appSettings.tagline || '';
  document.getElementById('r-address').textContent = appSettings.address || '';
  document.getElementById('r-phone').textContent = appSettings.phone || '';
  
  document.getElementById('set-name').value = appSettings.restaurant_name || '';
  document.getElementById('set-tagline').value = appSettings.tagline || '';
  document.getElementById('set-address').value = appSettings.address || '';
  document.getElementById('set-phone').value = appSettings.phone || '';
  document.getElementById('set-currency').value = appSettings.currency_symbol || 'Rs. ';
  
  // Re-render UI to update currency symbols
  updateCartUI();
  renderItemGrid();
  renderItemsTable();
}

async function loadCategories() {
  categories = await window.api.query("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");
  renderCategoryFilters();
  renderCategoriesTable();
  
  // Populate category select in items modal
  const select = document.getElementById('item-category-select');
  select.innerHTML = '';
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

async function loadItems() {
  items = await window.api.query("SELECT * FROM items");
  renderItemGrid();
  renderItemsTable();
}

// --- Login Logic ---
function setupLogin() {
  let currentPin = '';

  const updatePinDisplay = () => {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
      if (index < currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  };
  
  const handleKeydown = (e) => {
    if (!document.getElementById('login-screen').classList.contains('active')) return;
    
    if (e.key >= '0' && e.key <= '9') {
      if (currentPin.length < 4) {
        currentPin += e.key;
        updatePinDisplay();
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      currentPin = currentPin.slice(0, -1);
      updatePinDisplay();
    } else if (e.key === 'Enter') {
      document.getElementById('pin-enter').click();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      document.getElementById('pin-clear').click();
    }
  };
  
  window.addEventListener('keydown', handleKeydown);
  
  document.querySelectorAll('.num-btn:not(.action-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPin.length < 4) {
        currentPin += btn.textContent;
        updatePinDisplay();
      }
    });
  });
  
  document.getElementById('pin-clear').addEventListener('click', () => {
    currentPin = '';
    updatePinDisplay();
  });
  
  document.getElementById('pin-enter').addEventListener('click', () => {
    const defaultPin = appSettings.pin || '0000';
    if (currentPin === defaultPin) {
      const loginScreen = document.getElementById('login-screen');
      loginScreen.style.opacity = '0';
      setTimeout(() => loginScreen.classList.remove('active'), 500);
      window.removeEventListener('keydown', handleKeydown);
    } else {
      alert('Invalid PIN');
      currentPin = '';
      updatePinDisplay();
    }
  });
}

// --- Navigation ---
function setupNavigation() {
  const navBtns = document.querySelectorAll('#sidebar .nav-btn[data-tab]');
  const tabs = document.querySelectorAll('.tab-content');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      tabs.forEach(t => t.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = 'tab-' + btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      if (tabId === 'tab-reports') {
        generateReport();
      } else if (tabId === 'tab-items') {
        renderCategoriesTable();
        renderItemsTable();
      }
    });
  });
}

// --- Modals ---
function setupModals() {
  const overlay = document.getElementById('modal-overlay');
  
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
      overlay.classList.remove('active');
    });
  });
  
  document.getElementById('settings-btn').addEventListener('click', () => {
    overlay.classList.add('active');
    document.getElementById('settings-modal').classList.add('active');
  });
}

// --- Register (Menu & Cart) ---
function renderCategoryFilters() {
  const container = document.getElementById('category-filters');
  container.innerHTML = `<button class="pill-btn ${currentCategory === 'All' ? 'active' : ''}" data-id="All">All</button>`;
  
  categories.forEach(c => {
    container.innerHTML += `<button class="pill-btn ${currentCategory == c.id ? 'active' : ''}" data-id="${c.id}">${c.name}</button>`;
  });
  
  container.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentCategory = e.target.getAttribute('data-id');
      renderCategoryFilters();
      renderItemGrid();
    });
  });
}

function renderItemGrid() {
  const container = document.getElementById('item-grid');
  container.innerHTML = '';
  
  const customCard = document.createElement('div');
  customCard.className = 'item-card';
  customCard.style.borderStyle = 'dashed';
  customCard.style.justifyContent = 'center';
  customCard.style.alignItems = 'center';
  customCard.style.textAlign = 'center';
  customCard.innerHTML = `
    <i data-lucide="plus-circle" style="width:24px;height:24px;margin-bottom:8px;color:var(--text-muted)"></i>
    <h3 style="color:var(--text-muted); margin-bottom:0; font-size:13px;">Custom Item</h3>
  `;
  customCard.addEventListener('click', () => {
    document.getElementById('custom-item-name').value = '';
    document.getElementById('custom-item-price').value = '';
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('custom-item-modal').classList.add('active');
  });
  container.appendChild(customCard);

  const filtered = currentCategory === 'All' 
    ? items.filter(i => i.active === 1) 
    : items.filter(i => i.active === 1 && i.category_id == currentCategory);
    
  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'item-card';
    el.innerHTML = `
      <h3>${item.name}</h3>
      <div class="price">${formatCurrency(item.price)}</div>
    `;
    el.addEventListener('click', () => addToCart(item));
    container.appendChild(el);
  });
}

function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing && !item.isCustom) {
    existing.qty++;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCartUI();
}

function updateCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(c => c.id !== id);
    }
  }
  updateCartUI();
}

function setupRegister() {
  document.getElementById('apply-discount-btn').addEventListener('click', updateCartUI);
  document.getElementById('clear-discount-btn').addEventListener('click', () => {
    document.getElementById('discount-input').value = '';
    updateCartUI();
  });
  
  document.getElementById('apply-sc-btn').addEventListener('click', updateCartUI);
  document.getElementById('clear-sc-btn').addEventListener('click', () => {
    document.getElementById('sc-input').value = '';
    updateCartUI();
  });
  
  document.getElementById('checkout-btn').addEventListener('click', openCheckout);

  document.getElementById('reprint-btn').addEventListener('click', async () => {
    const sales = await window.api.query("SELECT * FROM sales ORDER BY id DESC LIMIT 1");
    if (sales.length > 0) {
      const sale = sales[0];
      const items = await window.api.query("SELECT * FROM sale_items WHERE sale_id = ?", [sale.id]);
      printReceipt(sale, items);
    } else {
      alert("No previous sales found.");
    }
  });

  // Custom Item Logic
  document.getElementById('add-custom-item-btn').addEventListener('click', () => {
    const name = document.getElementById('custom-item-name').value || 'Custom Item';
    const price = Number(document.getElementById('custom-item-price').value) || 0;
    
    addToCart({
      id: 'custom_' + Date.now(),
      name: name,
      price: price,
      isCustom: true
    });
    
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('custom-item-modal').classList.remove('active');
  });
}

function updateCartUI() {
  const container = document.getElementById('cart-items');
  container.innerHTML = '';
  
  let subtotal = 0;
  cart.forEach(c => {
    subtotal += c.price * c.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-info">
        <h4>${c.name}</h4>
        <div class="price">${formatCurrency(c.price)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateCartQty('${c.id}', -1)"><i data-lucide="minus" style="width:14px;"></i></button>
        <div class="cart-item-qty">${c.qty}</div>
        <button class="qty-btn" onclick="updateCartQty('${c.id}', 1)"><i data-lucide="plus" style="width:14px;"></i></button>
      </div>
    `;
    container.appendChild(el);
  });
  
  lucide.createIcons();
  
  document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
  
  const discountInput = document.getElementById('discount-input').value;
  const scInput = document.getElementById('sc-input').value;
  
  let discountAmt = 0;
  if (discountInput && Number(discountInput) > 0) {
    const percent = Number(discountInput);
    discountAmt = subtotal * (percent / 100);
    document.getElementById('discount-display-row').style.display = 'flex';
    document.getElementById('discount-percent-display').textContent = percent;
    document.getElementById('cart-discount').textContent = '-' + formatCurrency(discountAmt);
    document.getElementById('clear-discount-btn').style.display = 'inline-block';
  } else {
    document.getElementById('discount-display-row').style.display = 'none';
    document.getElementById('clear-discount-btn').style.display = 'none';
  }
  
  let scAmt = 0;
  let subtotalAfterDiscount = subtotal - discountAmt;
  if (scInput && Number(scInput) > 0) {
    const percent = Number(scInput);
    scAmt = subtotalAfterDiscount * (percent / 100);
    document.getElementById('sc-display-row').style.display = 'flex';
    document.getElementById('sc-percent-display').textContent = percent;
    document.getElementById('cart-sc').textContent = '+' + formatCurrency(scAmt);
    document.getElementById('clear-sc-btn').style.display = 'inline-block';
  } else {
    document.getElementById('sc-display-row').style.display = 'none';
    document.getElementById('clear-sc-btn').style.display = 'none';
  }
  
  const total = subtotal - discountAmt + scAmt;
  document.getElementById('cart-total').textContent = formatCurrency(total);
  
  const checkoutBtn = document.getElementById('checkout-btn');
  checkoutBtn.disabled = cart.length === 0;
  
  return { subtotal, discountAmt, scAmt, total };
}

// --- Checkout ---
let selectedPaymentMethod = 'Cash';

function setupCheckout() {
  document.querySelectorAll('.pm-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
      const target = e.target;
      target.classList.add('active');
      selectedPaymentMethod = target.getAttribute('data-method');
      
      const cashSection = document.getElementById('cash-section');
      if (selectedPaymentMethod === 'Cash') {
        cashSection.style.display = 'block';
      } else {
        cashSection.style.display = 'none';
      }
    });
  });
  
  const cashInput = document.getElementById('cash-received-input');
  cashInput.addEventListener('input', updateChange);
  
  document.getElementById('confirm-sale-btn').addEventListener('click', confirmSale);
}

function openCheckout() {
  const totals = updateCartUI();
  document.getElementById('checkout-total-display').textContent = formatCurrency(totals.total);
  
  // Reset checkout modal state
  selectedPaymentMethod = 'Cash';
  document.querySelectorAll('.pm-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.pm-btn[data-method="Cash"]').classList.add('active');
  document.getElementById('cash-section').style.display = 'block';
  document.getElementById('cash-received-input').value = '';
  document.getElementById('change-amount').textContent = formatCurrency(0);
  document.getElementById('checkout-note-input').value = document.getElementById('order-note').value;
  
  generateQuickCash(totals.total);
  
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('checkout-modal').classList.add('active');
}

function generateQuickCash(total) {
  const grid = document.getElementById('quick-cash-grid');
  grid.innerHTML = '';
  
  const exactBtn = document.createElement('button');
  exactBtn.className = 'qc-btn exact';
  exactBtn.textContent = 'Exact';
  exactBtn.addEventListener('click', () => {
    document.getElementById('cash-received-input').value = Math.ceil(total);
    updateChange();
  });
  grid.appendChild(exactBtn);
  
  let suggestions = [];
  LKR_NOTES.forEach(note => {
    if (note > total && note <= total * 2) {
      suggestions.push(note);
    }
  });
  if (suggestions.length === 0) {
    const largestNote = LKR_NOTES[0];
    const multiples = Math.ceil(total / largestNote) * largestNote;
    suggestions.push(multiples);
  }
  
  suggestions.push(500, 1000, 5000);
  suggestions = [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 5);
  
  suggestions.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'qc-btn';
    btn.textContent = '+' + s;
    btn.addEventListener('click', () => {
      const current = Number(document.getElementById('cash-received-input').value) || 0;
      document.getElementById('cash-received-input').value = current + s;
      updateChange();
    });
    grid.appendChild(btn);
  });
}

function updateChange() {
  const totals = updateCartUI();
  const received = Number(document.getElementById('cash-received-input').value) || 0;
  const change = received - totals.total;
  
  const display = document.getElementById('change-amount');
  if (change >= 0) {
    display.textContent = formatCurrency(change);
    display.style.color = 'var(--success)';
  } else {
    display.textContent = 'Insufficient';
    display.style.color = 'var(--danger)';
  }
}

async function confirmSale() {
  const totals = updateCartUI();
  const received = Number(document.getElementById('cash-received-input').value) || 0;
  
  if (selectedPaymentMethod === 'Cash' && received < totals.total) {
    alert('Insufficient cash received!');
    return;
  }
  
  const note = document.getElementById('checkout-note-input').value;
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateTime = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  const discountType = document.getElementById('discount-input').value ? 'percentage' : 'none';
  const discountValue = Number(document.getElementById('discount-input').value) || 0;
  
  const changeGiven = selectedPaymentMethod === 'Cash' ? (received - totals.total) : 0;
  const cashSaved = selectedPaymentMethod === 'Cash' ? received : 0;
  
  const saleId = await window.api.insert(
    `INSERT INTO sales (date_time, subtotal, discount_type, discount_value, discount_amount, total, payment_method, cash_received, change_given, note) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dateTime, totals.subtotal, discountType, discountValue, totals.discountAmt, totals.total, selectedPaymentMethod, cashSaved, changeGiven, note]
  );
  
  for (const item of cart) {
    await window.api.run(
      `INSERT INTO sale_items (sale_id, item_name, price, qty) VALUES (?, ?, ?, ?)`,
      [saleId, item.name, item.price, item.qty]
    );
  }
  
  const saleData = {
    id: saleId,
    date_time: dateTime,
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmt,
    total: totals.total,
    payment_method: selectedPaymentMethod,
    cash_received: cashSaved,
    change_given: changeGiven
  };
  
  printReceipt(saleData, cart);
  
  cart = [];
  document.getElementById('discount-input').value = '';
  document.getElementById('sc-input').value = '';
  document.getElementById('order-note').value = '';
  updateCartUI();
  
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('checkout-modal').classList.remove('active');
  
  // Refresh reports if open
  if (document.getElementById('tab-reports').classList.contains('active')) generateReport();
}

function printReceipt(sale, itemsList) {
  document.getElementById('r-id').textContent = sale.id;
  document.getElementById('r-date').textContent = sale.date_time;
  
  const tbody = document.getElementById('r-items-list');
  tbody.innerHTML = '';
  itemsList.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="left">${item.name || item.item_name}</td>
      <td class="center">${item.qty}</td>
      <td class="right">${formatCurrency(item.price * item.qty)}</td>
    `;
    tbody.appendChild(tr);
  });
  
  document.getElementById('r-subtotal').textContent = formatCurrency(sale.subtotal);
  
  if (sale.discount_amount > 0) {
    document.getElementById('r-discount-row').style.display = 'flex';
    document.getElementById('r-discount').textContent = '-' + formatCurrency(sale.discount_amount);
  } else {
    document.getElementById('r-discount-row').style.display = 'none';
  }
  
  const scAmt = sale.total - sale.subtotal + sale.discount_amount;
  if (scAmt > 0.01) {
    document.getElementById('r-sc-row').style.display = 'flex';
    document.getElementById('r-sc').textContent = '+' + formatCurrency(scAmt);
  } else {
    document.getElementById('r-sc-row').style.display = 'none';
  }
  
  document.getElementById('r-total').textContent = formatCurrency(sale.total);
  document.getElementById('r-method').textContent = sale.payment_method;
  
  if (sale.payment_method === 'Cash') {
    document.getElementById('r-cash-row').style.display = 'flex';
    document.getElementById('r-change-row').style.display = 'flex';
    document.getElementById('r-cash').textContent = formatCurrency(sale.cash_received);
    document.getElementById('r-change').textContent = formatCurrency(sale.change_given);
  } else {
    document.getElementById('r-cash-row').style.display = 'none';
    document.getElementById('r-change-row').style.display = 'none';
  }
  
  window.api.print();
}

// --- Items & Category Management ---
function setupItemsMgmt() {
  document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('cat-modal-title').textContent = 'Add Category';
    document.getElementById('cat-id-input').value = '';
    document.getElementById('cat-name-input').value = '';
    document.getElementById('cat-sort-input').value = '1';
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('add-category-modal').classList.add('active');
  });
  
  document.getElementById('save-category-btn').addEventListener('click', async () => {
    const id = document.getElementById('cat-id-input').value;
    const name = document.getElementById('cat-name-input').value;
    const sort = document.getElementById('cat-sort-input').value;
    if (name) {
      if (id) {
        await window.api.run("UPDATE categories SET name=?, sort_order=? WHERE id=?", [name, sort, id]);
      } else {
        await window.api.run("INSERT INTO categories (name, sort_order) VALUES (?, ?)", [name, sort]);
      }
      await loadCategories();
      document.getElementById('modal-overlay').classList.remove('active');
      document.getElementById('add-category-modal').classList.remove('active');
    }
  });

  document.getElementById('add-item-btn').addEventListener('click', () => {
    document.getElementById('item-modal-title').textContent = 'Add Item';
    document.getElementById('item-id-input').value = '';
    document.getElementById('item-name-input').value = '';
    document.getElementById('item-price-input').value = '';
    document.getElementById('item-active-input').checked = true;
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('item-modal').classList.add('active');
  });

  document.getElementById('save-item-btn').addEventListener('click', async () => {
    const id = document.getElementById('item-id-input').value;
    const name = document.getElementById('item-name-input').value;
    const catId = document.getElementById('item-category-select').value;
    const price = document.getElementById('item-price-input').value;
    const active = document.getElementById('item-active-input').checked ? 1 : 0;
    
    if (name && price) {
      if (id) {
        await window.api.run("UPDATE items SET name=?, category_id=?, price=?, active=? WHERE id=?", [name, catId, price, active, id]);
      } else {
        await window.api.run("INSERT INTO items (name, category_id, price, active) VALUES (?, ?, ?, ?)", [name, catId, price, active]);
      }
      await loadItems();
      document.getElementById('modal-overlay').classList.remove('active');
      document.getElementById('item-modal').classList.remove('active');
    }
  });
}

function renderCategoriesTable() {
  const tbody = document.querySelector('#categories-table tbody');
  tbody.innerHTML = '';
  
  categories.forEach(cat => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cat.name}</td>
      <td>${cat.sort_order}</td>
      <td class="action-links">
        <a class="action-link" onclick="editCategory(${cat.id})">Edit</a>
        <a class="action-link danger" onclick="deleteCategory(${cat.id})">Delete</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editCategory = (id) => {
  const cat = categories.find(c => c.id === id);
  if (cat) {
    document.getElementById('cat-modal-title').textContent = 'Edit Category';
    document.getElementById('cat-id-input').value = cat.id;
    document.getElementById('cat-name-input').value = cat.name;
    document.getElementById('cat-sort-input').value = cat.sort_order;
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('add-category-modal').classList.add('active');
  }
};

window.deleteCategory = async (id) => {
  if (confirm("Are you sure you want to delete this category? Items in it may not display correctly.")) {
    await window.api.run("DELETE FROM categories WHERE id=?", [id]);
    await loadCategories();
  }
};

function renderItemsTable() {
  const tbody = document.querySelector('#items-table tbody');
  tbody.innerHTML = '';
  
  items.forEach(item => {
    const cat = categories.find(c => c.id === item.category_id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${cat ? cat.name : 'Unknown'}</td>
      <td style="font-family: 'DM Mono', monospace;">${formatCurrency(item.price)}</td>
      <td>${item.active ? '<span style="color:var(--success)">Active</span>' : '<span style="color:var(--danger)">Inactive</span>'}</td>
      <td class="action-links">
        <a class="action-link" onclick="editItem(${item.id})">Edit</a>
        <a class="action-link danger" onclick="deleteItem(${item.id})">Delete</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editItem = (id) => {
  const item = items.find(i => i.id === id);
  if (item) {
    document.getElementById('item-modal-title').textContent = 'Edit Item';
    document.getElementById('item-id-input').value = item.id;
    document.getElementById('item-name-input').value = item.name;
    document.getElementById('item-category-select').value = item.category_id;
    document.getElementById('item-price-input').value = item.price;
    document.getElementById('item-active-input').checked = item.active === 1;
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('item-modal').classList.add('active');
  }
};

window.deleteItem = async (id) => {
  if (confirm("Are you sure you want to delete this item?")) {
    await window.api.run("DELETE FROM items WHERE id=?", [id]);
    await loadItems();
  }
};

// --- Reports ---
function setupReports() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  document.getElementById('report-date').value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  
  document.getElementById('generate-report-btn').addEventListener('click', generateReport);
  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
}

let currentReportData = [];

async function generateReport() {
  const type = document.getElementById('report-type').value;
  const dateVal = document.getElementById('report-date').value; // YYYY-MM-DD
  
  let datePrefix = '';
  if (type === 'daily') {
    datePrefix = dateVal;
  } else if (type === 'monthly' || type === 'eom') {
    datePrefix = dateVal.substring(0, 7); // YYYY-MM
  } else if (type === 'weekly') {
    datePrefix = dateVal; 
  }
  
  let queryStr = "SELECT * FROM sales WHERE date_time LIKE ?";
  currentReportData = await window.api.query(queryStr, [datePrefix + '%']);
  
  let transactions = currentReportData.length;
  let gross = 0;
  let discounts = 0;
  let sc = 0;
  let net = 0;
  
  const tbody = document.querySelector('#reports-table tbody');
  tbody.innerHTML = '';
  
  currentReportData.forEach(sale => {
    gross += sale.subtotal;
    discounts += sale.discount_amount;
    const saleSC = sale.total - sale.subtotal + sale.discount_amount;
    sc += saleSC;
    net += sale.total;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${sale.id}</td>
      <td>${sale.date_time}</td>
      <td>${sale.payment_method}</td>
      <td style="font-family: 'DM Mono', monospace;">${formatCurrency(sale.total)}</td>
      <td class="action-links">
        <a class="action-link" onclick="reprintSale(${sale.id})"><i data-lucide="printer" style="width:16px;"></i> Reprint</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  lucide.createIcons();
  
  document.getElementById('rep-transactions').textContent = transactions;
  document.getElementById('rep-gross').textContent = formatCurrency(gross);
  document.getElementById('rep-discounts').textContent = formatCurrency(discounts);
  document.getElementById('rep-sc').textContent = formatCurrency(sc);
  document.getElementById('rep-net').textContent = formatCurrency(net);
}

window.reprintSale = async (saleId) => {
  const sales = await window.api.query("SELECT * FROM sales WHERE id = ?", [saleId]);
  if (sales.length > 0) {
    const sale = sales[0];
    const items = await window.api.query("SELECT * FROM sale_items WHERE sale_id = ?", [saleId]);
    printReceipt(sale, items);
  }
};

function exportCSV() {
  if (currentReportData.length === 0) {
    alert("No data to export");
    return;
  }
  
  let transactions = currentReportData.length;
  let gross = 0;
  let discounts = 0;
  let sc = 0;
  let net = 0;
  
  currentReportData.forEach(sale => {
    gross += sale.subtotal;
    discounts += sale.discount_amount;
    sc += sale.total - sale.subtotal + sale.discount_amount;
    net += sale.total;
  });

  const BOM = "\uFEFF";
  let csv = BOM;
  
  csv += `"Transactions","Gross Revenue","(-) Discounts","(+) Service Charges","Net Revenue"\n`;
  csv += `"${transactions}","${gross.toFixed(2)}","${discounts.toFixed(2)}","${sc.toFixed(2)}","${net.toFixed(2)}"\n\n`;
  
  csv += `"Receipt No","Date & Time","Subtotal","Discount","Service Charge","Total","Payment Method","Cash Received","Change Given"\n`;
  
  currentReportData.forEach(sale => {
    const saleSC = sale.total - sale.subtotal + sale.discount_amount;
    csv += `"${sale.id}","${sale.date_time}","${sale.subtotal.toFixed(2)}","${sale.discount_amount.toFixed(2)}","${saleSC.toFixed(2)}","${sale.total.toFixed(2)}","${sale.payment_method}","${sale.cash_received.toFixed(2)}","${sale.change_given.toFixed(2)}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ZeroPOS_Report_${document.getElementById('report-date').value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Settings ---
function setupSettings() {
  document.getElementById('save-settings-btn').addEventListener('click', async () => {
    const name = document.getElementById('set-name').value;
    const tagline = document.getElementById('set-tagline').value;
    const address = document.getElementById('set-address').value;
    const phone = document.getElementById('set-phone').value;
    const currency = document.getElementById('set-currency').value || 'Rs. ';
    const pin = document.getElementById('set-pin').value;
    
    await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('restaurant_name', ?)", [name]);
    await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('tagline', ?)", [tagline]);
    await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('address', ?)", [address]);
    await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('phone', ?)", [phone]);
    await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('currency_symbol', ?)", [currency]);
    
    if (pin && pin.length === 4) {
      await window.api.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('pin', ?)", [pin]);
    }
    
    await loadSettings();
    document.getElementById('modal-overlay').classList.remove('active');
    document.getElementById('settings-modal').classList.remove('active');
  });
}

// Start
initApp();
