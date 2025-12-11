// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard loaded');
    initAdminDashboard();
});

// Global admin data
let adminData = {
    users: [],
    transactions: [],
    paymentMethods: [],
    depositRequests: [],
    withdrawalRequests: [],
    settings: {}
};

// Initialize admin dashboard
async function initAdminDashboard() {
    console.log('Initializing admin dashboard...');
    
    // Initialize Supabase
    const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.email !== 'admin@vault.com') {
        window.location.href = 'index.html';
        return;
    }
    
    // Load all data
    await loadAllData(supabase);
    
    // Setup navigation
    setupNavigation();
    
    // Setup dashboard
    setupDashboard();
    
    // Setup users section
    setupUsersSection();
    
    // Setup transactions section
    setupTransactionsSection();
    
    // Setup payments section
    setupPaymentsSection(supabase);
    
    // Setup requests sections
    setupRequestsSections();
    
    // Setup settings section
    setupSettingsSection();
    
    // Setup modals
    setupModals(supabase);
    
    // Setup time display
    updateAdminTime();
    setInterval(updateAdminTime, 1000);
    
    console.log('Admin dashboard ready');
}

// Load all data from Supabase
async function loadAllData(supabase) {
    try {
        // Load users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!usersError) adminData.users = users || [];
        
        // Load payment methods
        const { data: methods, error: methodsError } = await supabase
            .from('payment_methods')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (!methodsError) adminData.paymentMethods = methods || [];
        
        // Load deposit requests
        const { data: deposits, error: depositsError } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (!depositsError) adminData.depositRequests = deposits || [];
        
        // Load withdrawal requests
        const { data: withdrawals, error: withdrawalsError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (!withdrawalsError) adminData.withdrawalRequests = withdrawals || [];
        
        // Load transactions
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false })
            .limit(100);
        
        if (!transactionsError) adminData.transactions = transactions || [];
        
        // Load settings
        const { data: settings, error: settingsError } = await supabase
            .from('system_settings')
            .select('*');
        
        if (!settingsError && settings) {
            settings.forEach(setting => {
                adminData.settings[setting.setting_key] = setting.setting_value;
            });
        }
        
        console.log('Admin data loaded:', {
            users: adminData.users.length,
            methods: adminData.paymentMethods.length,
            deposits: adminData.depositRequests.length,
            withdrawals: adminData.withdrawalRequests.length,
            transactions: adminData.transactions.length
        });
        
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('admin-page-title');
    const pageDescription = document.getElementById('admin-page-description');
    
    const sectionTitles = {
        dashboard: { title: 'Admin Dashboard', desc: 'Manage your banking platform' },
        users: { title: 'Manage Users', desc: 'View and manage all user accounts' },
        transactions: { title: 'All Transactions', desc: 'View and manage all transactions' },
        payments: { title: 'Payment Methods', desc: 'Manage payment methods and bank accounts' },
        'deposit-requests': { title: 'Deposit Requests', desc: 'Approve or reject deposit requests' },
        'withdrawal-requests': { title: 'Withdrawal Requests', desc: 'Approve or reject withdrawal requests' },
        settings: { title: 'Settings', desc: 'Configure platform settings' }
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            
            // Update active nav
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update title
            if (sectionTitles[section]) {
                pageTitle.textContent = sectionTitles[section].title;
                pageDescription.textContent = sectionTitles[section].desc;
            }
            
            // Show selected section
            document.querySelectorAll('.admin-section').forEach(s => {
                s.classList.remove('active');
            });
            document.getElementById(`${section}-section`).classList.add('active');
            
            // Refresh section data
            refreshSection(section);
        });
    });
    
    // Logout
    document.getElementById('adminLogout').addEventListener('click', async function() {
        const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

function refreshSection(section) {
    switch(section) {
        case 'dashboard':
            updateDashboardStats();
            loadRecentActivity();
            break;
        case 'users':
            loadUsersTable();
            break;
        case 'transactions':
            loadTransactionsTable();
            break;
        case 'payments':
            loadPaymentMethods();
            loadBankAccounts();
            loadCryptoAccounts();
            break;
        case 'deposit-requests':
            loadDepositRequests();
            break;
        case 'withdrawal-requests':
            loadWithdrawalRequests();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Dashboard
function setupDashboard() {
    updateDashboardStats();
    loadRecentActivity();
    updatePendingCounts();
}

function updateDashboardStats() {
    const totalUsers = adminData.users.length;
    const totalBalance = adminData.users.reduce((sum, user) => sum + (user.balance || 0), 0);
    const activeDeposits = adminData.transactions.filter(t => t.type === 'deposit' && t.status === 'completed').length;
    const pendingRequests = adminData.depositRequests.length + adminData.withdrawalRequests.length;
    
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('platform-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('active-deposits').textContent = activeDeposits;
    document.getElementById('pending-requests').textContent = pendingRequests;
}

function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    const recent = adminData.transactions.slice(0, 10);
    
    if (recent.length === 0) {
        container.innerHTML = '<div class="no-activity">No recent activity</div>';
        return;
    }
    
    container.innerHTML = recent.map(transaction => `
        <div class="activity-item ${transaction.type}">
            <div class="activity-icon">
                <i class="fas fa-${transaction.type === 'deposit' ? 'money-bill-wave' : 'hand-holding-usd'}"></i>
            </div>
            <div class="activity-details">
                <h4>${getUserName(transaction.user_id)} - ${transaction.type}</h4>
                <p>${transaction.description || formatCurrency(transaction.amount)}</p>
                <span class="activity-time">${formatDate(transaction.transaction_date)}</span>
            </div>
        </div>
    `).join('');
}

function updatePendingCounts() {
    document.getElementById('pending-deposits').textContent = adminData.depositRequests.length;
    document.getElementById('pending-withdrawals').textContent = adminData.withdrawalRequests.length;
}

// Users Management
function setupUsersSection() {
    loadUsersTable();
    
    document.getElementById('user-search')?.addEventListener('input', function() {
        loadUsersTable(this.value.toLowerCase());
    });
}

function loadUsersTable(search = '') {
    const container = document.getElementById('users-table-body');
    if (!container) return;
    
    let filtered = adminData.users;
    
    if (search) {
        filtered = adminData.users.filter(user => 
            (user.first_name + ' ' + user.last_name).toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.user_id.toLowerCase().includes(search)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
        return;
    }
    
    container.innerHTML = filtered.map(user => `
        <tr>
            <td>${user.user_id.substring(0, 8)}...</td>
            <td>${user.first_name} ${user.last_name}</td>
            <td>${user.email}</td>
            <td>${formatCurrency(user.balance || 0)}</td>
            <td><span class="user-status ${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td>${formatDate(user.join_date)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" onclick="viewUserDetails('${user.user_id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-action edit" onclick="editUser('${user.user_id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// PAYMENT METHODS SECTION
function setupPaymentsSection(supabase) {
    loadPaymentMethods();
    loadBankAccounts();
    loadCryptoAccounts();
    
    // Add payment method button
    document.getElementById('add-payment-method')?.addEventListener('click', () => {
        openPaymentModal();
    });
    
    // Payment type change
    document.getElementById('method-type')?.addEventListener('change', function() {
        showPaymentFields(this.value);
    });
}

function loadPaymentMethods() {
    const container = document.getElementById('payment-methods-grid');
    if (!container) return;
    
    if (adminData.paymentMethods.length === 0) {
        container.innerHTML = '<div class="no-methods">No payment methods added</div>';
        return;
    }
    
    container.innerHTML = adminData.paymentMethods.map(method => `
        <div class="method-card ${method.status}">
            <div class="method-header">
                <h4>${method.name}</h4>
                <span class="method-status ${method.status}">${method.status}</span>
            </div>
            <div class="method-details">
                <p>${method.details.replace(/\n/g, '<br>')}</p>
                <p><strong>Type:</strong> ${method.type}</p>
                <p><strong>Added:</strong> ${formatDate(method.created_at)}</p>
            </div>
            <div class="method-actions">
                <button class="btn-action edit" onclick="editPaymentMethod('${method.method_id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-action delete" onclick="deletePaymentMethod('${method.method_id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function loadBankAccounts() {
    const container = document.getElementById('bank-accounts-list');
    if (!container) return;
    
    const banks = adminData.paymentMethods.filter(m => m.type === 'bank');
    
    if (banks.length === 0) {
        container.innerHTML = '<div class="no-accounts">No bank accounts added</div>';
        return;
    }
    
    container.innerHTML = banks.map(bank => `
        <div class="account-card">
            <h4>${bank.name}</h4>
            <pre>${bank.details}</pre>
            <p><strong>Status:</strong> <span class="${bank.status}">${bank.status}</span></p>
        </div>
    `).join('');
}

function loadCryptoAccounts() {
    const container = document.getElementById('crypto-accounts-list');
    if (!container) return;
    
    const cryptos = adminData.paymentMethods.filter(m => m.type === 'crypto');
    
    if (cryptos.length === 0) {
        container.innerHTML = '<div class="no-accounts">No cryptocurrency addresses added</div>';
        return;
    }
    
    container.innerHTML = cryptos.map(crypto => `
        <div class="account-card">
            <h4>${crypto.name}</h4>
            <pre>${crypto.details}</pre>
            <p><strong>Status:</strong> <span class="${crypto.status}">${crypto.status}</span></p>
        </div>
    `).join('');
}

function showPaymentFields(type) {
    // Hide all
    document.getElementById('bank-fields').style.display = 'none';
    document.getElementById('crypto-fields').style.display = 'none';
    document.getElementById('card-fields').style.display = 'none';
    
    // Show selected
    if (type === 'bank') {
        document.getElementById('bank-fields').style.display = 'block';
    } else if (type === 'crypto') {
        document.getElementById('crypto-fields').style.display = 'block';
    } else if (type === 'card') {
        document.getElementById('card-fields').style.display = 'block';
    }
}

function openPaymentModal(method = null) {
    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');
    
    // Reset form
    form.reset();
    
    if (method) {
        // Edit mode
        document.getElementById('method-name').value = method.name;
        document.getElementById('method-type').value = method.type;
        document.getElementById('method-status').value = method.status;
        
        // Show correct fields
        showPaymentFields(method.type);
        
        // Set details based on type
        if (method.type === 'bank') {
            document.getElementById('bank-details').value = method.details;
        } else if (method.type === 'crypto') {
            const lines = method.details.split('\n');
            lines.forEach(line => {
                if (line.includes('Cryptocurrency:')) {
                    document.getElementById('crypto-type').value = line.replace('Cryptocurrency:', '').trim();
                } else if (line.includes('Wallet Address:')) {
                    document.getElementById('crypto-address').value = line.replace('Wallet Address:', '').trim();
                } else if (line.includes('Network:')) {
                    document.getElementById('crypto-network').value = line.replace('Network:', '').trim();
                }
            });
        }
        
        modal.dataset.methodId = method.method_id;
        modal.dataset.mode = 'edit';
    } else {
        // Add mode
        showPaymentFields('bank');
        delete modal.dataset.methodId;
        modal.dataset.mode = 'add';
    }
    
    modal.classList.add('active');
}

async function savePaymentMethod(supabase) {
    const modal = document.getElementById('paymentModal');
    const methodId = modal.dataset.methodId;
    const isEdit = modal.dataset.mode === 'edit';
    const type = document.getElementById('method-type').value;
    
    const methodData = {
        name: document.getElementById('method-name').value.trim(),
        type: type,
        status: document.getElementById('method-status').value,
        updated_at: new Date().toISOString()
    };
    
    // Get details based on type
    if (type === 'bank') {
        methodData.details = document.getElementById('bank-details').value.trim();
    } else if (type === 'crypto') {
        const cryptoType = document.getElementById('crypto-type').value.trim();
        const cryptoAddress = document.getElementById('crypto-address').value.trim();
        const cryptoNetwork = document.getElementById('crypto-network').value.trim();
        
        methodData.details = `Cryptocurrency: ${cryptoType}\nWallet Address: ${cryptoAddress}\nNetwork: ${cryptoNetwork}`;
    } else if (type === 'card') {
        methodData.details = 'Credit/Debit Card Processing';
    }
    
    // Validation
    if (!methodData.name) {
        showAdminNotification('Please enter method name', 'error');
        return;
    }
    
    if (!methodData.details) {
        showAdminNotification('Please enter details', 'error');
        return;
    }
    
    try {
        if (isEdit && methodId) {
            // Update existing
            const { error } = await supabase
                .from('payment_methods')
                .update(methodData)
                .eq('method_id', methodId);
            
            if (error) throw error;
            showAdminNotification('Payment method updated!', 'success');
        } else {
            // Add new
            methodData.method_id = 'PM_' + Date.now();
            methodData.created_at = new Date().toISOString();
            
            const { error } = await supabase
                .from('payment_methods')
                .insert([methodData]);
            
            if (error) throw error;
            showAdminNotification('Payment method added!', 'success');
        }
        
        // Reload data
        const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
        const supabaseReload = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        await loadAllData(supabaseReload);
        
        // Close modal
        modal.classList.remove('active');
        
        // Refresh display
        loadPaymentMethods();
        loadBankAccounts();
        loadCryptoAccounts();
        
    } catch (error) {
        console.error('Save payment method error:', error);
        showAdminNotification(error.message, 'error');
    }
}

function setupModals(supabase) {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Payment form submission
    document.getElementById('paymentForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        savePaymentMethod(supabase);
    });
    
    // Click outside modal
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Utility Functions
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

function getUserName(userId) {
    const user = adminData.users.find(u => u.user_id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
}

function updateAdminTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const timeElement = document.getElementById('admin-time');
    if (timeElement) {
        timeElement.textContent = `${dateString} • ${timeString}`;
    }
}

function showAdminNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.admin-notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Functions to expose to window
window.viewUserDetails = function(userId) {
    const user = adminData.users.find(u => u.user_id === userId);
    if (user) {
        alert(`User Details:\n\nID: ${user.user_id}\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}\nBalance: ${formatCurrency(user.balance)}\nStatus: ${user.status}\nJoined: ${formatDate(user.join_date)}`);
    }
};

window.editUser = function(userId) {
    const user = adminData.users.find(u => u.user_id === userId);
    if (user) {
        // Implement edit user functionality
        alert('Edit user functionality would go here');
    }
};

window.editPaymentMethod = function(methodId) {
    const method = adminData.paymentMethods.find(m => m.method_id === methodId);
    if (method) {
        openPaymentModal(method);
    }
};

window.deletePaymentMethod = async function(methodId) {
    if (!confirm('Delete this payment method?')) return;
    
    try {
        const SUPABASE_URL = 'https://rhotbzbuvwhdwwrvjhhe.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJob3RiemJ1dndoZHd3cnZqaGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTMwNjcsImV4cCI6MjA4MDk4OTA2N30.s9gSHCPBJM2hTgqIsIUWo-L5rcKTj0TAsSQ4LnIMfg0';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        const { error } = await supabase
            .from('payment_methods')
            .delete()
            .eq('method_id', methodId);
        
        if (error) throw error;
        
        showAdminNotification('Payment method deleted', 'success');
        
        // Reload data
        await loadAllData(supabase);
        loadPaymentMethods();
        loadBankAccounts();
        loadCryptoAccounts();
        
    } catch (error) {
        console.error('Delete error:', error);
        showAdminNotification('Failed to delete', 'error');
    }
};

// Other sections (simplified - you need to implement these)
function setupTransactionsSection() {
    loadTransactionsTable();
}

function setupRequestsSections() {
    loadDepositRequests();
    loadWithdrawalRequests();
}

function setupSettingsSection() {
    loadSettings();
}

function loadTransactionsTable() {
    // Implement transactions table
}

function loadDepositRequests() {
    // Implement deposit requests
}

function loadWithdrawalRequests() {
    // Implement withdrawal requests
}

function loadSettings() {
    // Implement settings
}

// Initialize when DOM is loaded
console.log('Admin JS loaded');