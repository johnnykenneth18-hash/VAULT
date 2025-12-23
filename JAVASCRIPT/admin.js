// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function () {
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
    settings: {},
    adminPaymentMethods: []
};

// Initialize admin dashboard
async function initAdminDashboard() {
    console.log('Initializing admin dashboard...');

    try {
        // Check if we have admin localStorage data first (bypass mode)
        const storedEmail = localStorage.getItem('userEmail');
        const storedRole = localStorage.getItem('userRole');
        const storedToken = localStorage.getItem('sb_access_token') || localStorage.getItem('sb_session_token');

        // Create Supabase client
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // BYPASS CHECK: If we have admin data in localStorage, use it
        if (storedEmail === 'arinze18@vault.com' && storedRole === 'admin' && storedToken) {
            console.log('✅ Admin authenticated via bypass');
            await loadAllData(supabase);
        } else {
            // Otherwise, check Supabase auth
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                console.log('❌ No user or auth error:', error?.message);
                window.location.href = 'login.html';
                return;
            }

            // Check if user is admin (by email)
            const isAdmin = user.email === 'arinze18@vault.com';

            if (!isAdmin) {
                console.log('❌ Not admin:', user.email);
                alert('Admin access only!');
                window.location.href = 'dashboard.html';
                return;
            }

            console.log('✅ Admin authenticated via Supabase:', user.email);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userRole', 'admin');

            await loadAllData(supabase);
        }

        // Setup all components
        activateDashboardSection();
        setupNavigation();
        setupDashboard();
        setupUsersSection();
        setupTransactionsSection();
        setupPaymentsSection(supabase);
        setupRequestsSections(supabase);
        setupSettingsSection();
        setupModals(supabase);
        updateAdminTime();
        setInterval(updateAdminTime, 1000);

        console.log('Admin dashboard ready');

    } catch (error) {
        console.error('Admin check failed:', error);
        window.location.href = 'login.html';
        return;
    }
}

// Activate dashboard section first
function activateDashboardSection() {
    const dashboardSection = document.getElementById('dashboard-section');
    if (dashboardSection) {
        document.querySelectorAll('.admin-section').forEach(s => {
            s.classList.remove('active');
        });
        dashboardSection.classList.add('active');
    }

    const pageTitle = document.getElementById('admin-page-title');
    const pageDescription = document.getElementById('admin-page-description');
    if (pageTitle) pageTitle.textContent = 'Admin Dashboard';
    if (pageDescription) pageDescription.textContent = 'Manage your banking platform';

    const firstNavItem = document.querySelector('.nav-item[data-section="dashboard"]');
    if (firstNavItem) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        firstNavItem.classList.add('active');
    }
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

        // Load admin payment methods
        const { data: adminMethods, error: adminMethodsError } = await supabase
            .from('admin_payment_methods')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!adminMethodsError) adminData.adminPaymentMethods = adminMethods || [];

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
            adminMethods: adminData.adminPaymentMethods.length,
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
        item.addEventListener('click', function () {
            const section = this.dataset.section;

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            if (sectionTitles[section]) {
                if (pageTitle) pageTitle.textContent = sectionTitles[section].title;
                if (pageDescription) pageDescription.textContent = sectionTitles[section].desc;
            }

            document.querySelectorAll('.admin-section').forEach(s => {
                s.classList.remove('active');
            });
            document.getElementById(`${section}-section`).classList.add('active');

            refreshSection(section);
        });
    });

    // Logout
    document.getElementById('adminLogout').addEventListener('click', async function () {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}

function refreshSection(section) {
    const supabase = window.supabase.createClient(
        'https://grfrcnhmnvasiotejiok.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k'
    );

    switch (section) {
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
            loadAdminPaymentMethods();
            break;
        case 'deposit-requests':
            loadDepositRequests(supabase);
            break;
        case 'withdrawal-requests':
            loadWithdrawalRequests(supabase);
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

    const totalUsersEl = document.getElementById('total-users');
    const platformBalanceEl = document.getElementById('platform-balance');
    const activeDepositsEl = document.getElementById('active-deposits');
    const pendingRequestsEl = document.getElementById('pending-requests');

    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (platformBalanceEl) platformBalanceEl.textContent = formatCurrency(totalBalance);
    if (activeDepositsEl) activeDepositsEl.textContent = activeDeposits;
    if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;
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
    const pendingDepositsEl = document.getElementById('pending-deposits');
    const pendingWithdrawalsEl = document.getElementById('pending-withdrawals');
    const pendingRequestsEl = document.getElementById('pending-requests');

    // These should now reflect the actual pending counts
    const depositCount = adminData.depositRequests.length;
    const withdrawalCount = adminData.withdrawalRequests.length;
    const totalPending = depositCount + withdrawalCount;

    if (pendingDepositsEl) pendingDepositsEl.textContent = depositCount;
    if (pendingWithdrawalsEl) pendingWithdrawalsEl.textContent = withdrawalCount;
    if (pendingRequestsEl) pendingRequestsEl.textContent = totalPending;
}

// Users Management
function setupUsersSection() {
    loadUsersTable();

    document.getElementById('user-search')?.addEventListener('input', function () {
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
    loadAdminPaymentMethods();

    // Add payment method button
    document.getElementById('add-payment-method')?.addEventListener('click', () => {
        openAdminPaymentModal();
    });

    // Payment type change
    document.getElementById('method-type')?.addEventListener('change', function () {
        showPaymentFields(this.value);
    });
}

async function loadAdminPaymentMethods() {
    try {
        const container = document.getElementById('payment-methods-grid');
        if (!container) return;

        if (adminData.adminPaymentMethods.length === 0) {
            container.innerHTML = '<div class="no-methods">No admin payment methods added yet</div>';
            return;
        }

        container.innerHTML = adminData.adminPaymentMethods.map(method => `
            <div class="method-card ${method.status}">
                <div class="method-header">
                    <h4>${method.name}</h4>
                    <span class="method-status ${method.status}">${method.status}</span>
                </div>
                <div class="method-details">
                    <p><strong>Type:</strong> ${method.type}</p>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 0.9rem; white-space: pre-wrap;">${method.details}</pre>
                    <p><strong>Order:</strong> ${method.sort_order}</p>
                    <p><strong>Created:</strong> ${formatDate(method.created_at)}</p>
                </div>
                <div class="method-actions">
                    <button class="btn-action edit" onclick="editAdminPaymentMethod(${method.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-action delete" onclick="deleteAdminPaymentMethod(${method.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading admin payment methods:', error);
        showAdminNotification('Failed to load payment methods', 'error');
    }
}

function openAdminPaymentModal(method = null) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${method ? 'Edit' : 'Add'} Admin Payment Method</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="adminPaymentForm">
                    <div class="form-group">
                        <label>Method Name</label>
                        <input type="text" id="admin-method-name" value="${method ? method.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="admin-method-type">
                            <option value="bank" ${method?.type === 'bank' ? 'selected' : ''}>Bank Account</option>
                            <option value="crypto" ${method?.type === 'crypto' ? 'selected' : ''}>Cryptocurrency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Details (will be shown to users)</label>
                        <textarea id="admin-method-details" rows="6" required>${method ? method.details : ''}</textarea>
                        <small>Enter bank details or crypto wallet info. This will be displayed exactly as entered.</small>
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" id="admin-method-order" value="${method ? method.sort_order : '0'}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="admin-method-status">
                            <option value="active" ${!method || method.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${method?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary modal-close">Cancel</button>
                        <button type="submit" class="btn-primary">Save Method</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.btn-secondary').addEventListener('click', () => modal.remove());
    modal.querySelector('#adminPaymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAdminPaymentMethod(method?.id);
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function saveAdminPaymentMethod(methodId = null) {
    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        const methodData = {
            name: document.getElementById('admin-method-name').value,
            type: document.getElementById('admin-method-type').value,
            details: document.getElementById('admin-method-details').value,
            sort_order: parseInt(document.getElementById('admin-method-order').value) || 0,
            status: document.getElementById('admin-method-status').value,
            updated_at: new Date().toISOString()
        };

        let result;
        if (methodId) {
            result = await supabase
                .from('admin_payment_methods')
                .update(methodData)
                .eq('id', methodId);
        } else {
            methodData.created_at = new Date().toISOString();
            result = await supabase
                .from('admin_payment_methods')
                .insert([methodData]);
        }

        if (result.error) throw result.error;

        showAdminNotification(`Payment method ${methodId ? 'updated' : 'added'}!`, 'success');
        await loadAllData(supabase);
        loadAdminPaymentMethods();

    } catch (error) {
        console.error('Error saving admin payment method:', error);
        showAdminNotification('Failed to save payment method', 'error');
    }
}

window.editAdminPaymentMethod = async function (id) {
    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        const { data: method, error } = await supabase
            .from('admin_payment_methods')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        openAdminPaymentModal(method);

    } catch (error) {
        console.error('Error loading payment method:', error);
        showAdminNotification('Failed to load payment method', 'error');
    }
};

window.deleteAdminPaymentMethod = async function (id) {
    if (!confirm('Are you sure you want to delete this payment method? It will be removed from user dashboards.')) return;

    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        const { error } = await supabase
            .from('admin_payment_methods')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showAdminNotification('Payment method deleted!', 'success');
        await loadAllData(supabase);
        loadAdminPaymentMethods();

    } catch (error) {
        console.error('Error deleting payment method:', error);
        showAdminNotification('Failed to delete payment method', 'error');
    }
};

// REQUESTS SECTIONS
function setupRequestsSections(supabase) {
    loadDepositRequests(supabase);
    loadWithdrawalRequests(supabase);
}

async function loadDepositRequests(supabase) {
    try {
        const container = document.getElementById('deposit-requests-list');
        if (!container) return;

        // Get only PENDING requests
        const { data: depositRequests, error } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('status', 'pending')  // Only show pending
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update adminData
        adminData.depositRequests = depositRequests || [];

        if (adminData.depositRequests.length === 0) {
            container.innerHTML = '<div class="no-requests">No pending deposit requests</div>';
            return;
        }

        container.innerHTML = adminData.depositRequests.map(request => {
            const user = adminData.users.find(u => u.user_id === request.user_id);
            return `
                <div class="request-card deposit">
                    <div class="request-header">
                        <h3>${formatCurrency(request.amount)}</h3>
                        <span class="request-status pending">Pending</span>
                    </div>
                    <div class="request-user">
                        <strong>User:</strong> ${user ? user.first_name + ' ' + user.last_name : request.user_id}
                        <br><strong>Email:</strong> ${user ? user.email : 'N/A'}
                    </div>
                    <div class="request-details">
                        <p><strong>Method:</strong> ${request.method}</p>
                        <p><strong>Reference:</strong> ${request.reference || 'N/A'}</p>
                        <p><strong>Weeks:</strong> ${request.weeks || 4}</p>
                        <p><strong>Date:</strong> ${formatDate(request.created_at)}</p>
                        ${request.method_details ? `<pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 10px;">${request.method_details}</pre>` : ''}
                    </div>
                    <div class="request-actions">
                        <button class="btn-approve" onclick="approveDepositRequest('${request.request_id}', ${request.amount}, '${request.user_id}')">
                            Approve
                        </button>
                        <button class="btn-reject" onclick="rejectDepositRequest('${request.request_id}')">
                            Reject
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading deposit requests:', error);
        showAdminNotification('Failed to load deposit requests', 'error');
    }
}

async function loadWithdrawalRequests(supabase) {
    try {
        const container = document.getElementById('withdrawal-requests-list');
        if (!container) return;

        // Get only PENDING requests
        const { data: withdrawalRequests, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('status', 'pending')  // Only show pending
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update adminData
        adminData.withdrawalRequests = withdrawalRequests || [];

        if (adminData.withdrawalRequests.length === 0) {
            container.innerHTML = '<div class="no-requests">No pending withdrawal requests</div>';
            return;
        }

        container.innerHTML = adminData.withdrawalRequests.map(request => {
            const user = adminData.users.find(u => u.user_id === request.user_id);
            return `
                <div class="request-card withdrawal">
                    <div class="request-header">
                        <h3>${formatCurrency(request.amount)}</h3>
                        <span class="request-status pending">Pending</span>
                    </div>
                    <div class="request-user">
                        <strong>User:</strong> ${user ? user.first_name + ' ' + user.last_name : request.user_id}
                        <br><strong>Email:</strong> ${user ? user.email : 'N/A'}
                    </div>
                    <div class="request-details">
                        <p><strong>Method:</strong> ${request.method}</p>
                        <p><strong>Account Details:</strong> ${request.account_details || 'N/A'}</p>
                        <p><strong>Net Amount:</strong> ${formatCurrency(request.net_amount)}</p>
                        <p><strong>Fee:</strong> ${formatCurrency(request.fee)}</p>
                        <p><strong>Date:</strong> ${formatDate(request.created_at)}</p>
                        ${request.method_details ? `<pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; margin-top: 10px;">${request.method_details}</pre>` : ''}
                    </div>
                    <div class="request-actions">
                        <button class="btn-approve" onclick="approveWithdrawalRequest('${request.request_id}', ${request.amount}, '${request.user_id}')">
                            Approve
                        </button>
                        <button class="btn-reject" onclick="rejectWithdrawalRequest('${request.request_id}')">
                            Reject
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading withdrawal requests:', error);
        showAdminNotification('Failed to load withdrawal requests', 'error');
    }
}

async function approveDepositRequest(requestId, amount, userId) {
    if (!confirm('Are you sure you want to approve this deposit request?')) return;

    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // First confirmation
        const confirm1 = confirm('First confirmation: Approve this deposit?');
        if (!confirm1) return;

        const confirm2 = confirm('Second confirmation: Are you absolutely sure? This will update the user balance.');
        if (!confirm2) return;

        // Update deposit request status
        await supabase
            .from('deposit_requests')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);

        // Get the request details
        const { data: request, error: requestError } = await supabase
            .from('deposit_requests')
            .select('*')
            .eq('request_id', requestId)
            .single();

        if (requestError) throw requestError;

        // Get current user balance first
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('balance, total_deposits')
            .eq('user_id', userId)
            .single();

        if (userError) throw userError;

        // Calculate new values
        const newBalance = (parseFloat(currentUser.balance) || 0) + parseFloat(amount);
        const newTotalDeposits = (parseFloat(currentUser.total_deposits) || 0) + parseFloat(amount);

        // Update user balance using direct values
        await supabase
            .from('users')
            .update({
                balance: newBalance,
                total_deposits: newTotalDeposits,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        // Create transaction record
        const transactionId = 'TXN_' + Date.now();
        await supabase
            .from('transactions')
            .insert([{
                transaction_id: transactionId,
                user_id: userId,
                type: 'deposit',
                amount: amount,
                method: request.method,
                status: 'completed',
                description: `Deposit approved: ${request.method}`,
                transaction_date: new Date().toISOString()
            }]);

        showAdminNotification('Deposit approved successfully!', 'success');

        // CRITICAL: Force refresh the current section
        const activeSection = document.querySelector('.admin-section.active');
        const sectionId = activeSection ? activeSection.id : '';

        if (sectionId === 'deposit-requests-section') {
            // If we're on the deposit requests page, reload it
            await loadDepositRequests(supabase);
        } else if (sectionId === 'withdrawal-requests-section') {
            // If we're on the withdrawal requests page, reload it
            await loadWithdrawalRequests(supabase);
        }

        // Always reload all data and update counts
        await loadAllData(supabase);
        updateDashboardStats();
        updatePendingCounts();

    } catch (error) {
        console.error('Error approving deposit:', error);
        showAdminNotification('Failed to approve deposit: ' + error.message, 'error');
    }
}

async function rejectDepositRequest(requestId) {
    if (!confirm('Are you sure you want to reject this deposit request?')) return;

    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        await supabase
            .from('deposit_requests')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);

        showAdminNotification('Deposit request rejected', 'success');

        // CRITICAL: Force refresh the current section
        const activeSection = document.querySelector('.admin-section.active');
        const sectionId = activeSection ? activeSection.id : '';

        if (sectionId === 'deposit-requests-section') {
            await loadDepositRequests(supabase);
        }

        // Reload data and refresh UI
        await loadAllData(supabase);
        updatePendingCounts();

    } catch (error) {
        console.error('Error rejecting deposit:', error);
        showAdminNotification('Failed to reject deposit', 'error');
    }
}

async function approveWithdrawalRequest(requestId, amount, userId) {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) return;

    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        // First confirmation
        const confirm1 = confirm('First confirmation: Approve this withdrawal?');
        if (!confirm1) return;

        const confirm2 = confirm('Second confirmation: Are you absolutely sure? This will deduct from user balance.');
        if (!confirm2) return;

        // Update withdrawal request status
        await supabase
            .from('withdrawal_requests')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);

        // Get the request details
        const { data: request, error: requestError } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('request_id', requestId)
            .single();

        if (requestError) throw requestError;

        // Get current user balance first
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('balance, total_withdrawals')
            .eq('user_id', userId)
            .single();

        if (userError) throw userError;

        // Calculate new values
        const newBalance = (parseFloat(currentUser.balance) || 0) - parseFloat(amount);
        const newTotalWithdrawals = (parseFloat(currentUser.total_withdrawals) || 0) + parseFloat(amount);

        // Update user balance using direct values
        await supabase
            .from('users')
            .update({
                balance: newBalance,
                total_withdrawals: newTotalWithdrawals,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        // Create transaction record
        const transactionId = 'TXN_' + Date.now();
        await supabase
            .from('transactions')
            .insert([{
                transaction_id: transactionId,
                user_id: userId,
                type: 'withdrawal',
                amount: amount,
                fee: request.fee,
                net_amount: request.net_amount,
                method: request.method,
                status: 'completed',
                description: `Withdrawal approved: ${request.method}`,
                transaction_date: new Date().toISOString()
            }]);

        showAdminNotification('Withdrawal approved successfully!', 'success');

        // CRITICAL: Force refresh the current section
        const activeSection = document.querySelector('.admin-section.active');
        const sectionId = activeSection ? activeSection.id : '';

        if (sectionId === 'deposit-requests-section') {
            // If we're on the deposit requests page, reload it
            await loadDepositRequests(supabase);
        } else if (sectionId === 'withdrawal-requests-section') {
            // If we're on the withdrawal requests page, reload it
            await loadWithdrawalRequests(supabase);
        }

        // Always reload all data and update counts
        await loadAllData(supabase);
        updateDashboardStats();
        updatePendingCounts();

    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showAdminNotification('Failed to approve withdrawal: ' + error.message, 'error');
    }
}

async function rejectWithdrawalRequest(requestId) {
    if (!confirm('Are you sure you want to reject this withdrawal request?')) return;

    try {
        const SUPABASE_URL = 'https://grfrcnhmnvasiotejiok.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZnJjbmhtbnZhc2lvdGVqaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzU5OTQsImV4cCI6MjA4MTQxMTk5NH0.oPvC2Ax6fUxnC_6apCdOCAiEMURotfljco6r3_L66_k';
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

        await supabase
            .from('withdrawal_requests')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);

        showAdminNotification('Withdrawal request rejected', 'success');

        // CRITICAL: Force refresh the current section
        const activeSection = document.querySelector('.admin-section.active');
        const sectionId = activeSection ? activeSection.id : '';

        if (sectionId === 'withdrawal-requests-section') {
            await loadWithdrawalRequests(supabase);
        }

        // Reload data and refresh UI
        await loadAllData(supabase);
        updatePendingCounts();

    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showAdminNotification('Failed to reject withdrawal', 'error');
    }
}
// Other sections (simplified)
function setupTransactionsSection() {
    loadTransactionsTable();
}

function setupSettingsSection() {
    loadSettings();
}

function loadTransactionsTable() {
    // Implement if needed
}

function loadSettings() {
    const interestRate = document.getElementById('interest-rate');
    if (interestRate && adminData.settings.interest_rate) {
        interestRate.value = adminData.settings.interest_rate;
    }
}

function setupModals(supabase) {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) modal.classList.remove('active');
        });
    });

    // Click outside modal
    window.addEventListener('click', function (e) {
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
    document.querySelectorAll('.admin-notification').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Functions to expose to window
window.viewUserDetails = function (userId) {
    const user = adminData.users.find(u => u.user_id === userId);
    if (user) {
        alert(`User Details:\n\nID: ${user.user_id}\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}\nBalance: ${formatCurrency(user.balance)}\nStatus: ${user.status}\nJoined: ${formatDate(user.join_date)}`);
    }
};

window.editUser = function (userId) {
    const user = adminData.users.find(u => u.user_id === userId);
    if (user) {
        alert('Edit user functionality would go here');
    }
};